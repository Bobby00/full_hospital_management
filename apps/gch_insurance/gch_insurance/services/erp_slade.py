import re
import frappe
import datetime
import os
from erpnext.accounts.utils import (
    get_balance_on,
)

# from gch_custom.services.erp_smart import create_payment_entry

from .slade import Slade
from .erp_mtiba import get_invoice_diagnosis
from .tools import get_insurance_line_items


class DuplicateEntryError(Exception):
    pass


class InvalidParametersErrors(Exception):
    pass


class ResourceNotFoundErrors(Exception):
    pass


# authUrl = "https://is-api.multitenant.slade360.co.ke/v1/authorizations/validate_authorization_token/"


class ErpSladeController:

    @frappe.whitelist(allow_guest=True)
    def get_patient_auth(
        auth_token: str,
        member_number: str,
        current_encounter_doc,
        current_sales_invoice_doc,
        current_patient_doc,
        payer,
        service_type: str = "OUTPATIENT",
    ):
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

            # current_principal_member = frappe.get_doc(
            #     "Parent", current_sales_invoice.principal_member)
            # # Create Autharization payload
            _auth_token = auth_token

            if _auth_token == "":
                _auth_token = member_number

            first_name = current_patient_doc.first_name
            last_name = current_patient_doc.last_name

            payload = {
                "first_name": first_name,
                "last_name": last_name,
                "auth_token": _auth_token,
                "member_number": member_number,
            }

            settings = get_slade_settings()

            slade = initiate_slade(settings)

            result = slade.verify_authorization(payload)

            if result.get("status") == "Failure":
                frappe.log_error(result, "Slade GET AUTH MEMBER /erp_slade.py")
                return {"code": 400, "message": result.get("message")}

            member_exists = frappe.db.exists("Slade Auth", member_number)

            if member_exists:
                saved_auth = update_slade_auth(member_number, result)

                return {"code": 200, "message": "Slade Authorization Updated"}

            doc = frappe.get_doc(
                {
                    "doctype": "Slade Auth",
                    "patient": current_encounter_doc.patient,
                    "first_name": first_name,
                    "last_name": last_name,
                    "auth_token": auth_token,
                    "member_number": member_number,
                    "service_type": "Outpatient",
                    "authorization_guid": result["authorization_guid"],
                    "copay_type": result["copay_type"],
                    "auth_status": result["auth_status"],
                    "benefit_balance": result["benefit_balance"],
                    "message": result["message"],
                }
            )
            doc.insert(ignore_permissions=True)

            return {"code": 200, "message": "Slade Authorization Created" + doc.name}
        except DuplicateEntryError:
            e_doc = frappe.get_doc("Slade Auth", member_number)
            e_doc.auth_token = auth_token
            e_doc.save()
            return {
                "code": 200,
                "message": "Slade Authorization Updated: " + e_doc.name,
            }

        except Exception as e:
            frappe.log_error(e, "SLADE GET PATIENT AUTH ERROR  /erp_slade.py")
            return {"code": 500, "message": "Slade Authorization Failed"}

    @frappe.whitelist(allow_guest=True)
    def create_claim(
        current_encounter_doc,
        current_sales_invoice_doc,
        member_number: str,
        service_type: str,
        payer_code: str,
    ):
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

            current_patient_doc = frappe.get_doc(
                "Patient", current_sales_invoice_doc.patient
            )

            # claim_exists = False
            if "INP" in current_encounter_doc.name:
                claim_exists = frappe.db.get_list(
                    "Slade Claim",
                    filters={
                        "inpatient_record": current_encounter_doc.name,
                        "sales_invoice": current_sales_invoice_doc.name,
                        "patient": current_patient_doc.name,
                    },
                    fields=["name"],
                )
            else:
                claim_exists = frappe.db.get_list(
                    "Slade Claim",
                    filters={
                        "patient_encounter": current_encounter_doc.name,
                        "sales_invoice": current_sales_invoice_doc.name,
                        "patient": current_patient_doc.name,
                    },
                    fields=["name"],
                )

            # return {"code": 500, "message": claim_exists}
            # current_slade_auth = frappe.get_doc("Slade Auth", member_number)

            current_payer_details = frappe.get_doc("Slade Payer Codes", payer_code)

            if current_sales_invoice_doc.default_insurance == None:
                raise Exception("No Default insurance company on invoice")

            if not claim_exists:

                payer_code = current_payer_details.payer_code
                payer_name = current_payer_details.payer_name
                patient_name = current_patient_doc.patient_name
                patient_number = current_patient_doc.uhid_code
                location_code = current_encounter_doc.branch
                location_name = current_encounter_doc.branch
                scheme_code = current_sales_invoice_doc.default_insurance
                scheme_name = current_sales_invoice_doc.default_insurance
                visit_number = current_encounter_doc.name
                visit_start = current_encounter_doc.creation.isoformat()
                visit_end = datetime.datetime.now().isoformat()
                icd10_codes = []

                diagnosis_list = get_invoice_diagnosis(current_encounter_doc.name)

                if len(diagnosis_list) <= 0:
                    raise Exception(
                        f"Kindly add diagnosis to the Encounter: {current_encounter_doc.name}"
                    )

                for diagnosis in diagnosis_list:
                    icd10_codes.append(
                        {"code": diagnosis["code"], "name": diagnosis["description"]}
                    )

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
                    "icd10_codes": icd10_codes,
                }

                settings = get_slade_settings()

                slade = initiate_slade(settings)

                response = slade.submit_claim(payload)
                
                encounter_key = "patient_encounter"

                if "INP" in current_encounter_doc.name:
                    encounter_key = "inpatient_record"

                doc = frappe.get_doc(
                    {
                        "doctype": "Slade Claim",
                        # "patient_encounter": current_encounter_doc.name,
                        "sales_invoice": current_sales_invoice_doc.name,
                        "patient": current_patient_doc.name,
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
                        "visit_start": current_encounter_doc.creation,
                        "visit_end": datetime.datetime.now(),
                        "currency": "KES",
                        "authorization_code": response.get("id"),
                        "slade_claim_id": response.get("id"),
                        "claim_workflow_state": "PENDING",
                        "attributes": "",
                    }
                )
                # for item in icd10_codes:
                #     doc.append(
                #         "icd10_code",
                #         {
                #             "diagnosis_name": item["name"],
                #             "diagnosis_code": item["code"],
                #         },
                #     )

                setattr(doc, encounter_key, current_encounter_doc.name)

                doc.insert()

                return {"code": 200, "message": "Document created: " + doc.name}

            frappe.log_error(
                f"INFO: Claim already exists: {claim_exists[0].name}",
                "SLADE CREATE CLAIM  /erp_slade.py",
            )

            return {"code": 200, "message": "Document updated: " + claim_exists[0].name}

        except Exception as e:
            frappe.log_error(e, "SLADE CREATE CLAIM ERROR  /erp_slade.py")
            return {"code": 500, "message": e}

    @frappe.whitelist(allow_guest=True)
    def submit_slade_invoice(
        claim: str,
        current_encounter_doc,
        current_sales_invoice_doc,
        cash_copay_amount: str = "0",
    ):
        """
        used to create a slade insurance invoice form

        An Invoice is a complete (finalized) bill or “voucher”. Some service providers have one bill for
        the whole visit, while others have multiple bills (one for each department or point of service).
        One claim can have multiple invoices.
        """
        try:
            frappe.log_error(
                f"Claim: {claim} Encounter: {current_encounter_doc} Invoice: {current_sales_invoice_doc} Copay: {cash_copay_amount}",
                "SLADE SUBMIT INVOICE  /erp_slade.py",
            )

            current_patient = frappe.get_doc(
                "Patient", current_sales_invoice_doc.patient
            )

            current_claim = frappe.get_doc("Slade Claim", claim)

            if not current_claim:
                raise Exception(f"Claim not found: {claim}")

            invoice_number = current_sales_invoice_doc.name
            invoice_date = current_sales_invoice_doc.creation.isoformat()
            current_insurance_category = frappe.get_doc(
                "Insurance Category", current_sales_invoice_doc.default_insurance
            )
            inpatient_insurance_company = (
                current_insurance_category.inpatient_insurance_company
            )
            outpatient_insurance_company = (
                current_insurance_category.outpatient_insurance_company
            )

            items = get_insurance_line_items(current_sales_invoice_doc.name)

            if len(items) <= 0:
                raise Exception(
                    f"Kindly add Items added in the Sales Invoice: {invoice_number}"
                )

            line_items = []
            copay_amount = int(cash_copay_amount)
            total_amount = 0
            for item in items:
                line_items.append(
                    {
                        "item_code": item["item"],
                        "item_name": item["item_name"],
                        "charge_date": invoice_date,
                        "unit_price": item["rate"],
                        "quantity": item["qty"],
                        "line_copay": item["copay_amount"],
                        "discount": item["copay_amount"],
                        "line_number": item["idx"],
                        "is_cancellation": False,
                    }
                )
                copay_amount += int(item["copay_amount"])
                total_amount += int(item["price"])

            payload = {
                "claim": current_claim.authorization_code,
                "invoice_date": invoice_date,
                "invoice_number": invoice_number,
                "copays": [
                    # {"copay_type": "NHIF", "copay_amount": "5000.00",
                    #     "charge_date": invoice_date},
                    {
                        "copay_type": "SELF_PAY",
                        "copay_amount": copay_amount,
                        "charge_date": invoice_date,
                    }
                ],
                "lines": line_items,
            }

            settings = get_slade_settings()

            slade = initiate_slade(settings)

            response = slade.submit_invoice(payload)

            frappe.log_error(response, "SLADE SUBMIT INVOICE RESPONSE  /erp_slade.py")

            id = response.get("id")

            payment_entry = create_payment_entry(
                total_amount,
                f"Slade: {id} ({outpatient_insurance_company})",
                current_patient.customer,
            )
            frappe.log_error(
                payment_entry, "SLADE SUBMIT INVOICE PAYMENT ENTRY  /erp_slade.py"
            )

            encounter_key = "patient_encounter"

            if "INP" in current_encounter_doc.name:
                encounter_key = "inpatient_record"

            doc = frappe.get_doc(
                {
                    "doctype": "Slade Invoice",
                    # "patient_encounter": current_encounter_doc.name,
                    "sales_invoice": current_sales_invoice_doc.name,
                    "patient": current_patient.name,
                    "slade_invoice_id": response.get("id"),
                    "slade_claim": response.get("claim"),
                    "claim": invoice_number,
                    "invoice_date": invoice_date,
                    "invoice_number": invoice_number,
                }
            )

            setattr(doc, encounter_key, current_encounter_doc.name)

            for item in payload["copays"]:
                doc.append("copays", item)

            for line_item in payload["lines"]:
                doc.append("lines", line_item)

            doc.insert()

            return {"code": 200, "message": "Document created: " + doc.name}
        except Exception as e:
            frappe.log_error(e, "SLADE SUBMIT INVOICE ERROR  /erp_slade.py")
            return {"code": 500, "message": e}

    @frappe.whitelist(allow_guest=True)
    def reserve_amount(member_number, current_sales_invoice):
        try:
            # current_claim = frappe.get_doc("Slade Claim", current_sales_invoice.name)
            frappe.log_error(
                f"MemberNumber: {member_number} SalesInvoice: {current_sales_invoice}",
                "SLADE RESERVE AMOUNT  /erp_slade.py",
            )

            current_claim_doc = frappe.get_doc(
                "Slade Claim", current_sales_invoice.name
            )

            if not current_claim_doc:
                raise Exception(f"Slade Claim not found: {current_sales_invoice.name}")

            authorization = current_claim_doc.authorization_code
            invoice_number = current_sales_invoice.name
            amount = current_sales_invoice.outstanding_amount

            payload = {
                "authorization": authorization,
                "invoice_number": invoice_number,
                "amount": amount,
            }

            settings = get_slade_settings()

            slade = initiate_slade(settings)

            response = slade.reserve_balance(payload)

            return {"code": 200, "message": response}

        except Exception as e:
            frappe.log_error(e, "SLADE RESERVE AMOUNT ERROR  /erp_slade.py")
            return {"code": 500, "message": e}

    @frappe.whitelist(allow_guest=True)
    def upload_invoice_attachment(slade_invoice: str):
        try:

            current_slade_invoice = frappe.get_doc("Slade Invoice", slade_invoice)

            file = current_slade_invoice.attachment

            file_name = str(file).split("/")[3]

            file_path = os.path.abspath(
                frappe.get_site_path("private", "files", file_name)
            )

            settings = get_slade_settings()

            slade = initiate_slade(settings)

            payload = {
                "invoice": current_slade_invoice.slade_invoice_id,
                "description": f"Slade Invoice: {current_slade_invoice.slade_invoice_id}",
            }

            response = slade.upload_invoice_attachment(payload, file_path)

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

            current_slade_invoice.slade_attachment_id = response["id"]
            current_slade_invoice.slade_attachment_data = response["data"]
            current_slade_invoice.slade_attachment = response["attachment"]

            current_slade_invoice.save()

            return {"code": 200, "message": response}
        except Exception as e:
            print(e)
            frappe.log_error(e, "SLADE UPLOAD INVOICE ATTACHMENT ERROR  /erp_slade.py")
            return {"code": 500, "message": e}

    @frappe.whitelist(allow_guest=True)
    def upload_claim_attachment(slade_claim: str):
        try:

            current_slade_claim = frappe.get_doc("Slade Claim", slade_claim)

            files = current_slade_claim.attachments

            # print(files)

            for file in files:
                current_attachment = frappe.get_doc(
                    "Slade Claim Attachments", file.name
                )

                file_name = str(current_attachment.attachment).split("/")[3]

                file_path = os.path.abspath(
                    frappe.get_site_path("private", "files", file_name)
                )

                settings = get_slade_settings()

                slade = initiate_slade(settings)

                payload = {
                    "claim": current_slade_claim.slade_claim_id,
                    "description": f"Slade Claim: {current_slade_claim.slade_claim_id}",
                    "attachment_type": current_attachment.attachment_type,
                }
                print(payload)
                response = slade.upload_claim_attachment(payload, file_path)

                if response["id"]:
                    current_attachment.submission_id = response["id"]
                    current_attachment.is_submitted = 1
                    current_attachment.save()

            return {"code": 200, "message": "Attachments uploaded"}

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
            frappe.log_error(e, "SLADE UPLOAD INVOICE ATTACHMENT ERROR  /erp_slade.py")
            return {"code": 500, "message": e}


def get_slade_settings():
    """
    returns slade settings
    """
    try:
        slade_settings = frappe.get_doc("Slade Settings", "Slade Production")
        client_id = slade_settings.client_id
        client_secret = slade_settings.get_password("client_secret")
        username = slade_settings.username
        password = slade_settings.get_password("password")
        authorization_url = slade_settings.authorization_url
        base_url = slade_settings.base_url

        print(
            {
                "client_id": client_id,
                "client_secret": client_secret,
                "username": username,
                "password": password,
                "authorization_url": authorization_url,
                "base_url": base_url,
            }
        )

        return {
            "client_id": client_id,
            "client_secret": client_secret,
            "username": username,
            "password": password,
            "authorization_url": authorization_url,
            "base_url": base_url,
        }
    except Exception as e:
        frappe.log_error(e, "SLADE GET SETTINGS ERROR  /erp_slade.py")
        return {"message": False}


def initiate_slade(settings) -> Slade:
    """
    Initiates slade client instance and returns it
    """
    try:
        slade = Slade(
            settings["client_id"],
            settings["client_secret"],
            settings["username"],
            settings["password"],
            settings["authorization_url"],
            settings["base_url"],
        )

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


def get_party_and_account_balance(
    company, date, paid_from=None, paid_to=None, ptype=None, pty=None, cost_center=None
):
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
            "Debtors - GCH",
            default_account,
            "Customer",
            invoiced_customer,
            "Main - GCH",
        )

        doc = frappe.get_doc(
            {
                "apply_tax_withholding_amount": 0,
                "base_paid_amount": amount,
                "base_received_amount": amount,
                "base_total_allocated_amount": 0,
                "company": company,
                "custom_remarks": 0,
                "difference_amount": 0,
                "docstatus": 1,
                "doctype": "Payment Entry",
                "mode_of_payment": "Insurance",
                "name": "new-payment-entry-1",
                "naming_series": "ACC-PAY-.YYYY.-",
                "paid_amount": amount,
                "paid_from": "Debtors - GCH",
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
                "unallocated_amount": amount,
            }
        )
        doc.insert(ignore_permissions=True)
        return doc
    except Exception as e:

        frappe.log_error(e, "CREATE PAYMENT ENTRY ERROR  /erp_smart.py")
        return e
