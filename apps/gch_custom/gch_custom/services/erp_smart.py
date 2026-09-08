from calendar import month
import re

from urllib import response
import datetime
import frappe
from erpnext.accounts.utils import (
    get_balance_on,
)
from .smart import Smart
from .erp_mtiba import get_advance_payment_list, get_invoice_diagnosis
from .tools import get_insurance_line_items


"""
NHIF SITE NUMBER is the hopital's site number for NHIF ask the hospital to get it from the credit control
"""
NHIF_SITE_NR = "8000002"


company = frappe.defaults.get_global_default("company")

index_g = company.find('Gert')
if index_g != -1:
    suffix = " - GCH"
index_w = company.find('Wema')
if index_w != -1:
    suffix = " - W"

class ErpSmartController:

    @frappe.whitelist(allow_guest=True)
    def fetch_visits(patient: str):
        """

        """

        try:
            current_patient = frappe.get_doc("Patient", patient)

            patient_number = current_patient.uhid_code

            smart: Smart = initiate_smart()

            response = smart.fetch_visits(patient_number)

            code = response["code"]

            if code == "200":
                if not response["content"]:
                    frappe.log_error(
                        response, "SMART RESPONSE /erp_smart.py")
                    return "Smart Member has no details registered"

                result = response["content"][0]

                member_exists = frappe.db.exists(
                    'Smart Auth', result["member_number"])

                if member_exists:
                    updated_smart_auth = update_smart_auth_doc(result, patient)
                    return f"Member visit has been fetched succesfuly {result['session_id']}"

                doc = frappe.get_doc(
                    {
                        "doctype": "Smart Auth",
                        "patient": patient,
                        "session_id": result["session_id"],
                        "member_number": result["member_number"],
                        "status": result["status"],
                        "patient_name": result["patient_name"],
                        "comments": result["comments"],
                        "member_info_data": result["member_info_data"],
                        "payer_code": result["payer_code"],
                        "payer_name": result["payer_name"],
                        "schemecode": result["schemecode"],
                        "scheme_name": result["scheme_name"],
                        "patient_number": result["patient_number"],
                        "member_name": result["member_name"],
                        "global_id": result["global_id"],
                        "visit_number": result["visit_number"]
                    }
                )
                doc.insert()

                return f"Member visit has been fetched succesfuly: {result['session_id']}"

            frappe.log_error(
                response, "SMART FETCH VISIT ERROR  /erp_smart.py")
            return response

        except Exception as e:

            frappe.log_error(e, "SMART FETCH VISIT ERROR  /erp_smart.py")
            return "Member visit has been fetched succesfuly"

    @frappe.whitelist(allow_guest=True)
    def merge_visit_to_session(patient: str, encounter: str):
        try:
            if "INP" in encounter:
                current_encounter = frappe.get_doc("Inpatient Record", encounter)
            else:
                current_encounter = frappe.get_doc("Patient Encounter", encounter)

            current_patient = frappe.get_doc("Patient", patient)
            patient_number = current_patient.uhid_code

            visit_number = current_encounter.name

            smart: Smart = initiate_smart()

            response = smart.merge_visit_session(patient_number, visit_number)

            if response.get("status"):
                return "Error merging visit to session: Manually Add visit to Smart Auth"

            code = response["code"]

            if code == "200":

                result = response["content"]

                doc = frappe.get_doc('Smart Auth', result["member_number"])
                doc.status = result["status"]
                doc.session_id = result["session_id"]
                doc.visit_number = result["visit_number"]
                doc.save()

                return "Member visit merged successfuly"
            if code == "400.2002" or code == "400.2005":
                member_exists = frappe.db.exists(
                    'Smart Auth', response["object"]["member_number"])
                result = response["object"]
                if member_exists:
                    session_id = result["session_id"]
                    doc = frappe.get_doc('Smart Auth', result["member_number"])
                    doc.status = result["status"]
                    doc.session_id = result["session_id"]
                    doc.visit_number = result["visit_number"]
                    doc.save()
                    return f"Member already exists: session ({session_id})"

                doc = frappe.get_doc(
                    {
                        "doctype": "Smart Auth",
                        "patient": patient,
                        "session_id": result["session_id"],
                        "member_number": result["member_number"],
                        "status": result["status"],
                        "patient_name": result["patient_name"],
                        "comments": result["comments"],
                        "member_info_data": result["member_info_data"],
                        "payer_code": result["payer_code"],
                        "payer_name": result["payer_name"],
                        "schemecode": result["schemecode"],
                        "scheme_name": result["scheme_name"],
                        "patient_number": result["patient_number"],
                        "member_name": result["member_name"],
                        "global_id": result["global_id"],
                        "visit_number": result["visit_number"]
                    }
                )
                doc.insert()

                return "Member created successfuly"

            frappe.log_error(
                response, "SMART FETCH VISIT ERROR  /erp_smart.py")
            return "Member visit merging error"

        except Exception as e:

            frappe.log_error(e, "SMART FETCH VISIT ERROR  /erp_smart.py")
            return e

    @frappe.whitelist(allow_guest=True)
    def fetch_member_details(patient: str, encounter: str):
        try:
            if "INP" in encounter:
                current_encounter = frappe.get_doc("Inpatient Record", encounter)
            else:
                current_encounter = frappe.get_doc("Patient Encounter", encounter)
            
            current_patient = frappe.get_doc("Patient", patient)
            patient_number = current_patient.uhid_code

            visit_number = current_encounter.name

            session_id, name = frappe.db.get_value(
                "Smart Auth", {"visit_number": visit_number}, ["session_id", "name"])

            smart: Smart = initiate_smart()

            response = smart.fetch_member_details(patient_number, session_id)

            code = response["code"]

            if code == "200":

                result = response["content"][0]

                doc = frappe.get_doc('Smart Auth', name)

                doc.medicalaid_code = result["medicalaid_code"]
                doc.medicalaid_name = result["medicalaid_name"]
                doc.policy_id = result["policy_id"]
                doc.medicalaid_scheme_code = result["medicalaid_scheme_code"]
                doc.medicalaid_scheme_name = result["medicalaid_scheme_name"]
                doc.medicalaid_number = result["medicalaid_number"]
                doc.medicalaid_plan = result["medicalaid_plan"]
                doc.policy_country = result["policy_country"]
                doc.policy_currency = result["policy_currency"]
                doc.vip_message = result["vip_message"]
                doc.has_copay = result["has_copay"]
                doc.co_pay_amount = result["co_pay_amount"]
                doc.session_type = result["session_type"]
                doc.admit_id = result["admit_id"]
                doc.smart_benefit_details = []

                for benefit in result["benefits"]:
                    benefit_name = benefit["pool_desc"]
                    if len(benefit_name) >= 38:
                        benefit_name = benefit_name[:50]
                    
                    encounter_key = "encounter"
                    
                    if "INP" in current_encounter.name:
                        encounter_key = "inpatient_record"

                    doc.append("smart_benefit_details", {
                        "id": benefit["id"],
                        "pool_nr": benefit["pool_nr"],
                        "pool_desc": benefit_name,
                        "amount": benefit["amount"],
                        "claimable": benefit["claimable"],
                        "location_id": benefit["location_id"],
                        "location_name": benefit["location_name"],
                        "sp_id": benefit["exchange_location"]["sp_id"],
                        "parent_pool_nr": benefit["parent_pool_nr"],
                        # "encounter": current_encounter.name


                    })

                    setattr(doc, encounter_key, current_encounter.name)

                doc.save()

                return "Member details fetched successfuly"

            return "Error while fetching member details"

        except Exception as e:

            frappe.log_error(
                e, "SMART FETCH MEMBER DETAILS ERROR  /erp_smart.py")
            return e

    @frappe.whitelist(allow_guest=True)
    def upload_claim(patient: str,
                     encounter: str,
                     invoice: str, id: int,
                     pool_nr: int,
                     pool_desc: str,
                     amount: int,
                     location_id: int,
                     location_name: str,
                     sp_id: int,
                     has_nhif_payment: int = 0,
                     nhif_number: str = "",
                     nhif_amount: str = "0",
                     nhif_member_type: str = "",
                     ):

        try:
            current_invoice = frappe.get_doc("Sales Invoice", invoice)

            if float(amount) < (float(current_invoice.total_insured_amount)-float(current_invoice.total_advance)):
                return f"Not enough Money in:{pool_desc}, Bal: KES {amount} to clear invoice bill"

            current_patient = frappe.get_doc("Patient", patient)

            if "INP" in encounter:
                current_encounter = frappe.get_doc("Inpatient Record", encounter)
                
                member_number = frappe.db.get_value(
                "Smart Auth", {"inpatient_visit_number": current_encounter.name}, ["name"])
                current_smart_auth = frappe.get_doc("Smart Auth", member_number)

            else:
                current_encounter = frappe.get_doc("Patient Encounter", encounter)

                member_number = frappe.db.get_value(
                "Smart Auth", {"visit_number": current_encounter.name}, ["name"])
                current_smart_auth = frappe.get_doc("Smart Auth", member_number)

            
            # current_insurance_category = frappe.get_doc("Insurance Category", current_invoice.default_insurance)
            # inpatient_insurance_company = current_insurance_category.inpatient_insurance_company
            # outpatient_insurance_company = current_insurance_category.outpatient_insurance_company
            invoiced_customer = current_invoice.customer

            
            # member_number = frappe.db.get_value(
            #     "Smart Auth", {"visit_number": current_encounter.name}, ["name"])
            # current_smart_auth = frappe.get_doc("Smart Auth", member_number)

            diagnosis = get_invoice_diagnosis(current_encounter.name)

            if len(diagnosis) <= 0:

                frappe.log_error(
                    f"No diagnosis in the encounter: {current_encounter.name} ", "SMART UPLOAD CLAIM  ERROR  /erp_smart.py")
                return f"Kindly add diagnosis to the Encounter: {current_encounter.name}"

            payload_diagnosis = []
            for diag in diagnosis:
                payload_diagnosis.append({
                    "code": diag["code"],
                    "coding_standard": diag["scheme"].split(' ')[0],
                    "is_added_with_claim": True,
                    "name": diag["description"],
                    "is_primary": False
                })

            items = get_insurance_line_items(current_invoice.name)

            if len(items) <= 0:
                frappe.log_error(
                    f"No items in the invoice: {current_invoice.name} ", "SMART UPLOAD CLAIM  ERROR  /erp_smart.py")
                return f"Kindly add items to the invoice: {current_invoice.name}"

            line_items = []
            total_amount = 0
            copay_amount = 0
            for item in items:

                line_items.append({

                    "additional_info": item.get("item_name"),
                    "amount": item.get("price"),
                    "charge_date": str(datetime.datetime.now().replace(microsecond=0)).split(" ")[0],
                    "charge_time": str(datetime.datetime.now().replace(microsecond=0)).split(" ")[1],
                    "item_code": item.get("item"),
                    "item_name": item.get("item_name"),
                    "pre_authorization_code": item.get("preauth_feedback"),
                    "quantity": item.get("qty"),
                    "service_group": item.get("item_group"),
                    "unit_price": item.get("rate"),

                })
                total_amount += int(item.get("price"))
                copay_amount += int(item.get("copay_amount"))

                # todo: payment modifers

                """
                Type 0 = Cash claim (claims more than pool amount)
                Type 1 = Copay Fixed amount charged to patient
                Type 2 = Copay % of claim amount charged to patient
                Type 3 = Tier Cash
                Type 5 = NHIF
                Type 6 = Discount

                {
                "type": "ROUNDED-OFF",
                "amount": 0.74,
                "reference_number": "string"
                },
                {
                "type": "NHIF",
                "amount": 2000,
                "reference_number": "string"
                }

                """

            payload_modifiers = []

            advanced_payments = get_advance_payment_list(current_invoice.name)

            # TO DO: Accounting for NHIF is set for inpatient
            # if "INP" in current_encounter:
            #     # Check if NHIF number is set 

            if len(advanced_payments) > 0:
                total_cash_payment = 0
                for payment in advanced_payments:
                    total_cash_payment += int(payment["amount"])

                payload_modifiers.append({
                    "type": 1,
                    "amount": total_cash_payment,
                    "reference_number": invoice
                })

            if copay_amount > 0:
                payload_modifiers.append({
                    "type": 2,
                    "amount": copay_amount,
                    "reference_number": invoice
                })

            if has_nhif_payment == 1:
                payload_modifiers.append(
                    {
                        "type": 5,
                        "amount": nhif_amount,
                        "reference_number": invoice,
                        "nhif_contributor_nr": None,
                        "nhif_employer_code": None,
                        "nhif_member_nr": nhif_number,
                        "nhif_patient_relation": nhif_member_type,
                        "nhif_site_nr": NHIF_SITE_NR,
                    }
                )

            # Filter for difference in doctor's field for inpatient and outpatient
            if "INP" in encounter:
                doctor = current_encounter.primary_practitioner
            else:
                doctor = current_encounter.practitioner_name

            payload = {
                "claim_code": invoice,
                "payer_code": current_smart_auth.payer_code,
                "payer_name": current_smart_auth.payer_name,
                "medicalaid_code": current_smart_auth.medicalaid_code,
                "amount": current_invoice.outstanding_amount,
                "gross_amount": current_invoice.grand_total,
                "batch_number": "batch4",
                "dispatch_date": str(datetime.datetime.now().replace(microsecond=0)),
                "patient_number": current_patient.uhid_code,
                "patient_name": current_smart_auth.member_name,
                "location_code": location_name,
                "location_name": location_name,
                "scheme_code": current_smart_auth.schemecode,
                "scheme_name": current_smart_auth.scheme_name,
                "member_number": current_smart_auth.name,
                "visit_number": current_encounter.name,
                "session_id": int(current_smart_auth.session_id),
                "visit_start": str(current_encounter.creation.replace(microsecond=0)),
                "visit_end": str(datetime.datetime.now().replace(microsecond=0)),
                "currency": "KES",
                "doctor_name": doctor,
                "sp_id": int(sp_id),
                "diagnosis": payload_diagnosis,
                "pre_authorization": None,
                "admission": {
                    "additional_info": "string",
                    "admission_date": str(current_invoice.creation.replace(microsecond=0)),
                    "admission_number": "string",
                    "discharge_date": str(current_invoice.creation.replace(microsecond=0)),
                    "discharge_summary": "string"
                },
                "invoices": [{
                    "amount": current_invoice.outstanding_amount,
                    "gross_amount": current_invoice.grand_total,
                    "invoice_date": str(current_invoice.creation.replace(microsecond=0)),
                    "invoice_number": current_invoice.name,
                    "invoice_ref_number": current_invoice.name,
                    "lines": line_items,
                    "payment_modifiers": payload_modifiers,
                    "pool_number": pool_nr,
                    "service_type": current_smart_auth.session_type
                }]
            }

            smart: Smart = initiate_smart()

            response = smart.upload_claim(
                current_smart_auth.session_id, current_patient.uhid_code, payload)

            if response.get("status"):
                frappe.log_error(
                    response, "SMART UPLOAD CLAIM RESPONSE /erp_smart.py")
                return response.get("message")

            status = response["code"]

            if status == "200" or status == "201":
                content = response["content"]
                id = content["id"]

                if "INP" in current_encounter.name:
                    new_smart_invoice = frappe.get_doc(
                        {
                            "doctype": "Smart Invoice",
                            "patient": current_patient.name,
                            "session_id": current_smart_auth.session_id,
                            "sales_invoice": current_invoice.name,
                            "inpatient_record": current_encounter.name,
                            "smart_auth": current_smart_auth.name,
                            "id": id,
                            "total_amount": (float(current_invoice.total_insured_amount)-float(current_invoice.total_advance))

                        }
                    )
                    new_smart_invoice.save(ignore_permissions=True)
                else:

                    new_smart_invoice = frappe.get_doc(
                        {
                            "doctype": "Smart Invoice",
                            "patient": current_patient.name,
                            "session_id": current_smart_auth.session_id,
                            "sales_invoice": current_invoice.name,
                            "patient_encounter": current_encounter.name,
                            "smart_auth": current_smart_auth.name,
                            "id": id,
                            "total_amount": (float(current_invoice.total_insured_amount)-float(current_invoice.total_advance))

                        }
                    )
                    new_smart_invoice.save(ignore_permissions=True)
                # doc = create_payment_entry(
                #     (float(current_invoice.total_insured_amount)-float(current_invoice.total_advance)), f"Smart: {id} ({current_smart_auth.schemecode})", invoiced_customer)

            # TODO: update the smart claim

            return response["message"], new_smart_invoice.name

        except Exception as e:

            frappe.log_error(
                e, "SMART UPLOAD CLAIM ERROR  /erp_smart.py")
            return e

    @frappe.whitelist(allow_guest=True)
    def get_smart_benefits_options(encounter: str = ""):
        try:
            benefits_options = frappe.db.get_list(
                "Smart Benefit Details",
                filters={"encounter": encounter},
                fields=[
                    "id",
                    "pool_nr",
                    "pool_desc",
                    "amount",
                    "location_id",
                    "location_name",
                    "sp_id",

                ],
            )

            return benefits_options

        except Exception as e:

            frappe.log_error(
                e, "SMART CLOSE CLAIM ERROR  /erp_smart.py")
            return []

    @frappe.whitelist(allow_guest=True)
    def close_visit(smart_invoice: str):
        try:
            current_smart_invoice = frappe.get_doc(
                "Smart Invoice", smart_invoice)

            smart: Smart = initiate_smart()

            response = smart.close_visit(current_smart_invoice.session_id)

            current_smart_auth = frappe.get_doc(
                "Smart Auth", current_smart_invoice.smart_auth)

            frappe.log_error(
                response, "SMART CLOSE RESPONSE /erp_smart.py")

            if response.get("code") == "200":
                doc = create_payment_entry(
                    current_smart_invoice.total_amount, f"Smart: {current_smart_invoice.id} ({current_smart_auth.scheme_name})", current_smart_invoice.patient)
                return "Payment Entry Created"

            return "Payment Entry Not Created"

        except Exception as e:

            frappe.log_error(
                e, "SMART CLOSE CLAIM ERROR  /erp_smart.py")
            return e


# 30927666

def initiate_smart() -> Smart:
    smart_settings = frappe.get_doc(
        "Smart Settings", "icare")
    username = smart_settings.username
    password = smart_settings.get_password("password")
    client_id = smart_settings.client_id
    client_secret = smart_settings.get_password("client_secret")
    base_url = smart_settings.base_url

    smart = Smart(base_url, client_id, username, client_secret, password)

    return smart


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
            "docstatus": 1,
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


def update_smart_auth_doc(result, patient):
    try:
        doc = frappe.get_doc("Smart Auth", result["member_number"])
        doc.patient = patient,
        doc.session_id = result["session_id"],
        doc.status = result["status"],
        doc.patient_name = result["patient_name"],
        doc.comments = result["comments"],
        doc.member_info_data = result["member_info_data"],
        doc.payer_code = result["payer_code"],
        doc.payer_name = result["payer_name"],
        doc.schemecode = result["schemecode"],
        doc.scheme_name = result["scheme_name"],
        doc.patient_number = result["patient_number"],
        doc.member_name = result["member_name"],
        doc.global_id = result["global_id"],
        doc.visit_number = result["visit_number"]
        doc.save()
        return doc
    except Exception as e:

        frappe.log_error(
            e, "SMART UPDATE AUTH ERROR  /erp_smart.py")
        return e
