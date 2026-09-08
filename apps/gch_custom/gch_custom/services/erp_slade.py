import re
import frappe
import datetime
import os

from erpnext.accounts.utils import (
    get_balance_on,
)

from .slade import Slade
from .erp_mtiba import get_invoice_diagnosis
from .tools import get_insurance_line_items


company = frappe.defaults.get_global_default("company")

index_g = company.find('Gert')
if index_g != -1:
    suffix = " - GCH"
index_w = company.find('Wema')
if index_w != -1:
    suffix = " - W"

class DuplicateEntryError(Exception):
    pass


class InvalidParametersErrors(Exception):
    pass


class ResourceNotFoundErrors(Exception):
    pass


# authUrl = "https://is-api.multitenant.slade360.co.ke/v1/authorizations/validate_authorization_token/"

def get_party_and_account_balance(company, date, paid_from=None, paid_to=None, ptype=None, pty=None, cost_center=None):
    return frappe._dict(
        {
            "party_balance": get_balance_on(
                party_type=ptype, party=pty, cost_center=cost_center
            ),
            "paid_from_account_balance": get_balance_on(
                paid_from, date, cost_center=cost_center
            ),
            "paid_to_account_balance": get_balance_on(
                paid_to, date=date, cost_center=cost_center
            ),
        }
    )


def create_payment_entry(amount, ref, invoiced_customer):
    try:
        """
        make sure you add mode of payment called insurance and add the default company and account
        """
        account = "Insurance"
        date = datetime.datetime.today().strftime("%Y-%m-%d")

        company, default_account, mode_of_payment = frappe.db.get_value(
            "Mode of Payment Account",
            {"parent": account},
            ["company", "default_account", "parent"],

        )

        bal = get_party_and_account_balance(
            company,
            date,
            "Debtors"+suffix,
            default_account,
            "Customer",
            invoiced_customer,
            "Main"+suffix,
        )

        doc = frappe.get_doc({
            "apply_tax_withholding_amount": 0,
            "base_paid_amount": amount,
            "base_received_amount": amount,
            "base_total_allocated_amount": 0,
            "company": company,
            "custom_remarks": 0,
            "difference_amount": 0,
            "docstatus": 0,
            "doctype": "Payment Entry",
            "mode_of_payment": "Insurance",
            "name": "new-payment-entry-1",
            "naming_series": "ACC-PAY-.YYYY.-",
            "paid_amount": amount,
            "paid_from": "Debtors"+suffix,
            "paid_from_account_balance": bal["paid_from_account_balance"],
            "paid_from_account_currency": "KES",
            "paid_from_account_type": "Receivable",
            "paid_to": default_account,
            "paid_to_account_balance": bal["paid_to_account_balance"],
            "paid_to_account_currency": "KES",
            "paid_to_account_type": "Receivable",
            "party": invoiced_customer,
            "party_balance": bal["party_balance"],
            "party_name": invoiced_customer,
            "title": invoiced_customer,
            "party_type": "Customer",
            "payment_order_status": "Initiated",
            "payment_type": "Receive",
            "posting_date": date,
            "received_amount": amount,
            "reference_date": date,
            "reference_no": ref,
            "references": [],
            "source_exchange_rate": 1,
            "status": "Draft",
            "target_exchange_rate": 1,
            "total_allocated_amount": 0,
            "unallocated_amount": amount
        })
        doc.insert(ignore_permissions=True)
        return doc
    except Exception as e:

        frappe.log_error(
            e, "CREATE PAYMENT ENTRY ERROR  /erp_smart.py")
        return e


class ErpSladeController:

    @frappe.whitelist(allow_guest=True)
    def get_patient_auth(patient_encounter: str = "", auth_token: str = "", service_type: str = "", visit_type: str = "", sales_invoice: str = ""):
        """
        used to create a slade authorization for the patient to receive care

        An authorization is a permission granted to allow care to be provided to a patient. Authorizations
        will be done on the Slade360 system and the resulting authorization-token will be entered into
        the provider’s system. This authorization-token will be then provided as the member number
        when POSTing claims (see next subsection). The authorization-token will be used to link the
        authorization to the claim.
        The authorization-token that is copied will need to be verified against our system so as to
        ensure there is no tampering with the token.
        The authorization verification endpoint will be found at
        https://is-api.multitenant.slade360.co.ke/v1/authorizations/validate_authorization_token/
        """
        try:

            # get patient details
            if "INP" in patient_encounter:
                current_encounter = frappe.get_doc(
                    "Inpatient Record", patient_encounter)
            else:
                current_encounter = frappe.get_doc(
                    "Patient Encounter", patient_encounter)


            current_sales_invoice = frappe.get_doc(
                "Sales Invoice", sales_invoice)

            current_principal_member = frappe.get_doc(
                "Parent", current_sales_invoice.principal_member)
            # Create Autharization payload

            member_number = current_sales_invoice.membership_no

            first_name = current_principal_member.first_name
            last_name = current_principal_member.last_name

            payload = {
                "first_name": first_name,
                "last_name": last_name,
                "auth_token": auth_token,
                "member_number": member_number
            }

            settings = get_slade_settings()

            slade = initiate_slade(settings)

            result = slade.verify_authorization(payload)

            print("result", result)

            if result.get("status") == "Failure":
                frappe.log_error(result, "Slade GET AUTH MEMBER /erp_slade.py")
                return result.get("message")

            member_exists = frappe.db.exists('Slade Auth', member_number)

            if member_exists:
                saved_auth = update_slade_auth(member_number, result)

                return "Slade Authorization Updated"

            doc = frappe.get_doc(
                {
                    "doctype": "Slade Auth",
                    "patient": current_encounter.patient,
                    "first_name": first_name,
                    "last_name": last_name,
                    "auth_token": auth_token,
                    "member_number": member_number,
                    "service_type": service_type,
                    "authorization_guid": result["authorization_guid"],
                    "copay_type": result["copay_type"],
                    "auth_status": result["auth_status"],
                    "benefit_balance": result["benefit_balance"],
                    "message": result["message"],


                }
            )
            doc.insert()

            return "Slade Authorization Created" + doc.name
        except DuplicateEntryError:
            e_doc = frappe.get_doc('Slade Auth', member_number)
            e_doc.auth_token = auth_token
            e_doc.save()
            return "Slade Authorization Updated: " + e_doc.name

        except Exception as e:
            frappe.log_error(e, "SLADE GET PATIENT AUTH ERROR  /erp_slade.py")
            return "Slade Authorization Failed"

    @ frappe.whitelist(allow_guest=True)
    def create_claim(patient_encounter: str, sales_invoice: str, member_number: str, service_type: str, payer_code: str  ):
        """
        used to create a slade insurance claim

        A Claim corresponds to a single complete hospital visit e.g a complete inpatient visit from
        admission to discharge or a complete outpatient visit that spans consultation and other points of
        service. There is a good rule of thumb - if it would have had one paper claim form, it is one visit.
        The claims API will be found at
        https://is-api.multitenant.slade360.co.ke/v1/claims/
        params:

        """
        try:

            current_sales_invoice = frappe.get_doc(
                "Sales Invoice", sales_invoice)
            if "INP" in patient_encounter:
                current_encounter = frappe.get_doc(
                    "Inpatient Record", patient_encounter)
                
                claim_exists = frappe.db.get_list('Slade Claim', filters={"inpatient_record": current_encounter.name,
                                                                      "sales_invoice": current_sales_invoice.name,
                                                                      "patient": current_patient.name, }, fields=["name"])
            else:
                current_encounter = frappe.get_doc(
                    "Patient Encounter", patient_encounter)

                claim_exists = frappe.db.get_list('Slade Claim', filters={"patient_encounter": current_encounter.name,
                                                                      "sales_invoice": current_sales_invoice.name,
                                                                      "patient": current_patient.name, }, fields=["name"])
                    
            current_patient = frappe.get_doc(
                "Patient", current_sales_invoice.patient)
            # claim_exists = frappe.db.get_list('Slade Claim', filters={"patient_encounter": current_encounter.name,
            #                                                           "sales_invoice": current_sales_invoice.name,
            #                                                           "patient": current_patient.name, }, fields=["name"])

            # current_slade_auth = frappe.get_doc("Slade Auth", member_number)
            current_payer_details = frappe.get_doc(
                "Slade Payer Codes", payer_code)

            if current_sales_invoice.default_insurance == None:
                raise Exception("No Default insurance company on invoice")

            if not claim_exists:
                payer_code = current_payer_details.payer_code
                payer_name = current_payer_details.payer_name
                patient_name = current_patient.patient_name
                patient_number = current_patient.uhid_code
                location_code = current_encounter.branch
                location_name = current_encounter.branch
                scheme_code = current_sales_invoice.default_insurance
                scheme_name = current_sales_invoice.default_insurance
                visit_number = patient_encounter
                visit_start = current_encounter.creation.isoformat()
                visit_end = datetime.datetime.now().isoformat()
                icd10_codes = []

                diagnosis_list = get_invoice_diagnosis(patient_encounter)

                add_diagnosis_list = ["222210000019", "222210000068", "222210000190", "222210000390", "MSAINV062200107", "222211000083", "222211000326", "222211000433", "222211000437", "222211000430", "222211000559", "222211000432", "222211000263",
                                      "222211000083", "222211000263", "222211000326", "222211000430", "222211000432", "222211000433", "222211000437", "222210000613-1", "222211000550", "222211000109", "222211000146", "222208000062", "222210000936", "222210000273", "222211000559"]

                if len(diagnosis_list) <= 0 and current_sales_invoice.name in add_diagnosis_list:
                    diagnosis_list.append(
                        {"code": "Z23", "description": "Need for immunization against single bacterial diseases"})

                if len(diagnosis_list) <= 0 and current_sales_invoice.name == "ACC-SINV-2022-00369":
                    diagnosis_list.append(
                        {"code": "T78.4", "description": "Allergy, unspecified"})

                if len(diagnosis_list) <= 0 and current_sales_invoice.name == "ACC-SINV-2022-00551":
                    diagnosis_list.append(
                        {"code": "Z00.2", "description": "Examination for period of rapid growth in childhood"})

                if len(diagnosis_list) <= 0 and current_sales_invoice.name == "ACC-SINV-2022-01388":
                    diagnosis_list.append(
                        {"code": "Z48.0", "description": "Attention to surgical dressings and sutures"})

                if len(diagnosis_list) <= 0:
                    raise Exception(
                        f"Kindly add diagnosis to the Encounter: {current_encounter.name}")

                for diagnosis in diagnosis_list:
                    icd10_codes.append(
                        {"code": diagnosis['code'], "name": diagnosis['description']})

                payload = {
                    "payer_code": payer_code,
                    "payer_name": payer_name,
                    "patient_name": patient_name,
                    "patient_number": patient_number,
                    "member_number": member_number,
                    "service_type": service_type.upper(),
                    "location_code": location_code,
                    "location_name": location_name,
                    "scheme_code": scheme_code,
                    "scheme_name": scheme_name,
                    "visit_number": visit_number,
                    "visit_start": visit_start,
                    "visit_end": visit_end,
                    "currency": "KES",
                    "icd10_codes": icd10_codes}

                settings = get_slade_settings()

                slade = initiate_slade(settings)

                response = slade.submit_claim(payload)

                frappe.log_error(
                    response, "SLADE CREATE CLAIM RESPONSE...  /erp_slade.py")
                
                encounter_key = "patient_encounter"

                if "INP" in current_encounter.name:
                    is_inpatient = 1
                    encounter_key = "inpatient_record"

                doc = frappe.get_doc(
                    {
                        "doctype": "Slade Claim",
                        #"patient_encounter": current_encounter.name,
                        "sales_invoice": current_sales_invoice.name,
                        "patient": current_patient.name,
                        "payer_code": payer_code,
                        "payer_name": payer_name,
                        "patient_name": patient_name,
                        "patient_number": patient_number,
                        "member_number": member_number,
                        "service_type": service_type,
                        "location_code": location_code,
                        "location_name": location_name,
                        "scheme_code": scheme_code,
                        "scheme_name": scheme_name,
                        "visit_number": visit_number,
                        "visit_start": current_encounter.creation,
                        "visit_end": datetime.datetime.now(),
                        "currency": "KES",
                        "authorization_code": response.get("id"),
                        "slade_claim_id": response.get("id"),
                        "claim_workflow_state": "PENDING",
                        "attributes": "",

                    }
                )
                for item in icd10_codes:
                    doc.append('icd10_code', {
                        "diagnosis_name": item['name'], "diagnosis_code": item["code"]})
                    
                setattr(doc, encounter_key, current_encounter.name)

                doc.insert()

                return doc.name

            return claim_exists[0].name

        except Exception as e:
            frappe.log_error(e, "SLADE CREATE CLAIM ERROR  /erp_slade.py")
            print(e)
            return {"message": e}

    @ frappe.whitelist(allow_guest=True)
    def submit_slade_invoice(claim: str, patient_encounter: str, sales_invoice: str, cash_copay_amount: str="0"):
        """
        used to create a slade insurance invoice form

        An Invoice is a complete (finalized) bill or “voucher”. Some service providers have one bill for
        the whole visit, while others have multiple bills (one for each department or point of service).
        One claim can have multiple invoices.
        """
        try:
            current_sales_invoice = frappe.get_doc(
                "Sales Invoice", sales_invoice)
            if "INP" in patient_encounter:
                current_encounter = frappe.get_doc(
                    "Inpatient Record", patient_encounter)
            else:
                current_encounter = frappe.get_doc(
                    "Patient Encounter", patient_encounter)
                
            current_patient = frappe.get_doc(
                "Patient", current_sales_invoice.patient)

            current_claim = frappe.get_doc(
                "Slade Claim", claim)

            invoice_number = current_sales_invoice.name
            invoice_date = current_encounter.creation.isoformat()
            current_insurance_category = frappe.get_doc(
                "Insurance Category", current_sales_invoice.default_insurance)
            inpatient_insurance_company = current_insurance_category.inpatient_insurance_company
            outpatient_insurance_company = current_insurance_category.outpatient_insurance_company

            items = get_insurance_line_items(current_sales_invoice.name)

            if len(items) <= 0:
                raise Exception(
                    f"Kindly add Items added in the Sales Invoice: {invoice_number}")

            line_items = []
            copay_amount = int(cash_copay_amount)
            total_amount = 0
            for item in items:
                line_items.append({
                    "item_code": item["item"],
                    "item_name": item["item_name"],
                    "charge_date": invoice_date,
                    "unit_price": item["price"],
                    "quantity": item["qty"],
                    "line_copay": item["copay_amount"],
                    "discount": item["copay_amount"],
                    "line_number": item["idx"],
                    "is_cancellation": False
                })
                copay_amount += int(item["copay_amount"])
                total_amount += int(item["price"]) * int(item["qty"])
    
            
            payload = {
                "claim": current_claim.authorization_code,
                "invoice_date": invoice_date,
                "invoice_number": invoice_number,
                "copays": [
                    # {"copay_type": "NHIF", "copay_amount": "5000.00",
                    #     "charge_date": invoice_date},
                    {"copay_type": "SELF_PAY", "copay_amount": copay_amount,
                        "charge_date": invoice_date}
                ],
                "lines": line_items
            }

            settings = get_slade_settings()

            slade = initiate_slade(settings)

            response = slade.submit_invoice(payload)

            frappe.log_error(
                response, "SLADE SUBMIT INVOICE RESPONSE  /erp_slade.py")

            id = response.get("id")

            payment_entry = create_payment_entry(
                total_amount - copay_amount, f"Slade: {id} ({outpatient_insurance_company})", current_patient.customer)

            encounter_key = "patient_encounter"

            if "INP" in current_encounter.name:
                encounter_key = "inpatient_encounter"

            doc = frappe.get_doc(
                {
                    "doctype": "Slade Invoice",
                    # "patient_encounter": current_encounter.name,
                    "sales_invoice": current_sales_invoice.name,
                    "patient": current_patient.name,
                    "slade_invoice_id": response.get("id"),
                    "slade_claim": response.get("claim"),
                    "claim": invoice_number,
                    "invoice_date": invoice_date,
                    "invoice_number": invoice_number,

                }
            )
            for item in payload["copays"]:
                doc.append('copays', item)

            for line_item in payload["lines"]:
                doc.append('lines', line_item)

            setattr(doc, encounter_key, current_encounter.name)

            doc.insert()

            return doc.name
        except Exception as e:
            frappe.log_error(e, "SLADE SUBMIT INVOICE ERROR  /erp_slade.py")
            return {"message": False}

    @ frappe.whitelist(allow_guest=True)
    def upload_invoice_attachment(slade_invoice: str):
        try:

            current_slade_invoice = frappe.get_doc(
                "Slade Invoice", slade_invoice)

            file = current_slade_invoice.attachment

            file_name = str(file).split("/")[3]

            file_path = os.path.abspath(
                frappe.get_site_path("private", "files", file_name))

            settings = get_slade_settings()

            slade = initiate_slade(settings)

            payload = {
                "invoice": current_slade_invoice.slade_invoice_id,
                "description": f"Slade Invoice: {current_slade_invoice.slade_invoice_id}",
            }

            response = slade.upload_invoice_attachment(
                payload, file_path)

    #         {
    #     "id": "e90c4eaa-5b75-498a-96f1-e16901ed2c17",
    #     "title": "Slade360 API Specification Template.pdf",
    #     "description": "test",
    #     "data": "https://is-api.multitenant.slade360.co.ke/media/is/2022/05/17/5e9a2a40-9e8a-4436-868c-5ccf1d199958_Slade360_API_Specification_Template.pdf",
    #     "edi_attachment_id": null,
    #     "edi_attachment_guid": null,
    #     "invoice": "990ebcba-3ae9-4f96-bae2-8287fc90d3f2",
    #     "attachment": "5e9a2a40-9e8a-4436-868c-5ccf1d199958"
    # }
            print(response)

            current_slade_invoice.slade_attachment_id = response.get("id")
            current_slade_invoice.slade_attachment_data = response["data"]
            current_slade_invoice.slade_attachment = response["attachment"]

            current_slade_invoice.save()

            return response
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "SLADE UPLOAD INVOICE ATTACHMENT ERROR  /erp_slade.py")
            return {"message": False}

    @ frappe.whitelist(allow_guest=True)
    def upload_claim_attachment(slade_claim: str):
        try:

            current_slade_claim = frappe.get_doc(
                "Slade Claim", slade_claim)

            files = current_slade_claim.attachments

            # print(files)

            for file in files:
                current_attachment = frappe.get_doc(
                    "Slade Claim Attachments", file.name)

                file_name = str(current_attachment.attachment).split("/")[3]

                file_path = os.path.abspath(
                    frappe.get_site_path("private", "files", file_name))

                settings = get_slade_settings()

                slade = initiate_slade(settings)

                payload = {
                    "claim": current_slade_claim.slade_claim_id,
                    "description": f"Slade Claim: {current_slade_claim.slade_claim_id}",
                    "attachment_type": current_attachment.attachment_type
                }
                print(payload)
                response = slade.upload_claim_attachment(
                    payload, file_path)

                if response.get("id"):
                    current_attachment.submission_id = response.get("id")
                    current_attachment.is_submitted = 1
                    current_attachment.save()

            return files

            # file = current_slade_invoice.attachment

            # file_name = str(file).split("/")[3]

            # file_path = os.path.abspath(
            #     frappe.get_site_path("private", "files", file_name))

            # settings = get_slade_settings()

            # slade = initiate_slade(settings)

            # response = slade.upload_invoice_attachment(
            #     {"claim": "0afe444a-b987-4e2d-bf98-a6138d0e2093", "description": "test"}, file_path)

            # return response
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "SLADE UPLOAD INVOICE ATTACHMENT ERROR  /erp_slade.py")
            return e


def get_slade_settings():
    """
    returns slade settings
    """
    try:
        slade_settings = frappe.get_doc(
            "Slade Settings", 'Slade Production')
        client_id = slade_settings.client_id
        client_secret = slade_settings.get_password("client_secret")
        username = slade_settings.username
        password = slade_settings.get_password("password")
        authorization_url = slade_settings.authorization_url
        base_url = slade_settings.base_url

        print({
            "client_id": client_id, "client_secret": client_secret, "username": username,
            "password": password, "authorization_url": authorization_url, "base_url": base_url
        })

        return {
            "client_id": client_id, "client_secret": client_secret, "username": username,
            "password": password, "authorization_url": authorization_url, "base_url": base_url
        }
    except Exception as e:
        frappe.log_error(e, "SLADE GET SETTINGS ERROR  /erp_slade.py")
        return {"message": False}


def initiate_slade(settings) -> Slade:
    """
    Initiates slade client instance and returns it
    """
    try:
        slade = Slade(settings["client_id"], settings["client_secret"], settings["username"],
                      settings["password"], settings["authorization_url"], settings["base_url"])

        print(settings["password"])
        return slade

    except Exception as e:
        print(e)
        frappe.log_error(e, "SLADE INITIATE ERROR  /erp_slade.py")
        return {"message": False}


def update_slade_auth(member_number, result) -> bool:
    """
    Update the slade authorization token
    """
    try:
        doc = frappe.get_doc("Slade Auth", member_number)
        doc.authorization_guid = result["authorization_guid"]
        doc.copay_type = result["copay_type"]
        doc.auth_status = result["auth_status"]
        doc.message = result["message"]
        doc.benefit_balance = result["benefit_balance"]
        doc.save()
        return True
    except Exception as e:
        frappe.log_error(e, "SLADE UPDATE SLADE AUTH ERROR  /erp_slade.py")
        return False
    