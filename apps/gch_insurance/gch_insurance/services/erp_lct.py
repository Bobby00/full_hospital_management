from ast import Try
import frappe
from frappe import msgprint, _
from .erp_smart import create_payment_entry

from .lct import Lct
from .erp_mtiba import get_invoice_diagnosis, get_invoice_items
import datetime


"""
CODE: V2.0.0
DATE: 2021-07-20



this mode is used for testing

modes can be Production | Development

"""
MODE = "Development"


class ErpLctController:
    @frappe.whitelist(allow_guest=True)
    def lct_membership_callback(data):
        try:

            member_exists = frappe.db.exists(
                'Lct Member', data['memberDetails']['membership_number'])
            if member_exists:
                doc = frappe.get_doc(
                    'Lct Member', data['memberDetails']['membership_number'])
                doc.scheme_name = data['memberDetails']['scheme_name']
                doc.scheme_code = data['memberDetails']['scheme_code']
                doc.outpatient_status = data['memberDetails']['outpatient_status']
                doc.auth_code = data['memberDetails']['auth_code']
                doc.authorization_date = data['memberDetails']['authorization_date']
                doc.authorization_expiry_date = data['memberDetails']['authorization_expiry_date']
                doc.benefit_type = data['memberDetails']['benefit_type']
                doc.benefit_balance = data['memberDetails']['benefit_balance']
                doc.benefits_picked = data['memberDetails']['benefits_picked']

                doc.save()
                return True
            doc = frappe.get_doc(
                {
                    "doctype": "Lct Member",
                    "first_name": data['memberDetails']['first_name'],
                    "last_name": data['memberDetails']['last_name'],
                    "other_names": data['memberDetails']['other_names'],
                    "membership_number": data['memberDetails']['membership_number'],
                    "scheme_name": data['memberDetails']['scheme_name'],
                    "scheme_code": data['memberDetails']['scheme_code'],
                    "outpatient_status": data['memberDetails']['outpatient_status'],
                    "payer_name": data['memberDetails']['payer_name'],
                    "payer_code": data['memberDetails']['payer_code'],
                    "full_name": data['memberDetails']['full_name'],
                    "auth_code": data['memberDetails']['auth_code'],
                    "authorization_date": data['memberDetails']['authorization_date'],
                    "authorization_expiry_date": data['memberDetails']['authorization_expiry_date'],
                    "benefit_type": data['memberDetails']['benefit_type'],
                    "benefit_balance": data['memberDetails']['benefit_balance'],
                    "benefits_picked": data['memberDetails']['benefits_picked'],

                }
            )
            doc.insert()
            return True
        except Exception as e:

            frappe.log_error(e, "LCT CALL BACK  /erp_lct.py")
            return False

    @frappe.whitelist(allow_guest=True)
    def get_member_details(membership_number: str, current_patient, current_encounter):
        """


        """
        try:
            lct_settings = frappe.get_doc("Lct Settings", {"type": MODE})
            lct = Lct(lct_settings.base_url)
            data = lct.get_member_details(membership_number)

            encounter_key = "encounter"

            if "INP" in current_encounter.name:
                encounter_key = "inpatient_record"

            member_exists = frappe.db.exists('Lct Member', membership_number)
            if member_exists:
                doc = frappe.get_doc('Lct Member', membership_number)
                doc.scheme_name = data['memberDetails']['scheme_name']
                doc.scheme_code = data['memberDetails']['scheme_code']
                doc.outpatient_status = data['memberDetails']['outpatient_status']
                doc.auth_code = data['memberDetails']['auth_code']
                doc.authorization_date = data['memberDetails']['authorization_date']
                doc.authorization_expiry_date = data['memberDetails']['authorization_expiry_date']
                doc.benefit_type = data['memberDetails']['benefit_type']
                doc.benefit_balance = data['memberDetails']['benefit_balance']
                doc.benefits_picked = data['memberDetails']['benefits_picked']
                doc.patient = current_patient.name
                # doc.encounter = current_encounter.name

                setattr(doc, encounter_key, current_encounter.name)

                doc.save()
                return doc.name

            if data:

                encounter_key = "encounter"

                if "INP" in current_encounter.name:
                    encounter_key = "inpatient_record"

                doc = frappe.get_doc(
                    {
                        "doctype": "Lct Member",
                        "first_name": data['memberDetails']['first_name'],
                        "last_name": data['memberDetails']['last_name'],
                        "other_names": data['memberDetails']['other_names'],
                        "membership_number": data['memberDetails']['membership_number'],
                        "scheme_name": data['memberDetails']['scheme_name'],
                        "scheme_code": data['memberDetails']['scheme_code'],
                        "outpatient_status": data['memberDetails']['outpatient_status'],
                        "payer_name": data['memberDetails']['payer_name'],
                        # "payer_code": data['memberDetails']['payer_code'],
                        "full_name": data['memberDetails']['full_name'],
                        "auth_code": data['memberDetails']['auth_code'],
                        "authorization_date": data['memberDetails']['authorization_date'],
                        "authorization_expiry_date": data['memberDetails']['authorization_expiry_date'],
                        "benefit_type": data['memberDetails']['benefit_type'],
                        "benefit_balance": data['memberDetails']['benefit_balance'],
                        "benefits_picked": data['memberDetails']['benefits_picked'],
                        "patient": current_patient.name,
                        # "encounter": current_encounter.name
                    }
                )

                setattr(doc, encounter_key, current_encounter.name)

                doc.insert()
                return data["message"]
            frappe.log_error(
                data, "LCT GET MEMBER DETAILS  ERROR  /erp_lct.py")
            return "LCT GET MEMBER DETAILS ERROR"
        except Exception as e:
            frappe.log_error(e, "LCT GET MEMBER DETAILS  ERROR  /erp_lct.py")
            return "LCT GET MEMBER DETAILS Failed"

    @frappe.whitelist(allow_guest=True)
    def create_claim(current_invoice, current_encounter):
        try:

            current_patient = frappe.get_doc(
                "Patient",  current_invoice.patient)
            membership_number = frappe.db.get_value(
                "Lct Member", {"encounter": current_encounter.name}, ["name"])
            current_membership_details = frappe.get_doc(
                "Lct Member", membership_number)

            if "INP" in current_encounter.name:
                current_practitioner = frappe.get_doc(
                    "Healthcare Practitioner", current_encounter.primary_practitioner)
            else:
                current_practitioner = frappe.get_doc(
                    "Healthcare Practitioner", current_encounter.practitioner)

            doctor_list = []
            doctor_list.append({
                "code": current_practitioner.name,
                "name": current_practitioner.practitioner_name,
            })

            diagnosis_list = get_invoice_diagnosis(current_encounter.name)
            item_list = get_invoice_items(current_invoice.name)

            diagnosis_payload = []
            for diagnosis in diagnosis_list:
                diagnosis_payload.append({
                    "code": diagnosis["code"],
                    "name": diagnosis["description"],
                    "coding_standard": diagnosis["scheme"],
                    "is_primary": "true"
                })

            lines = []
            for item in item_list:
                lines.append({"billing_code": current_encounter.branch,
                              "charge_date": str(current_encounter.creation),
                              "name": item["description"],
                              "invoiceline_number": current_invoice.name,
                              "quantity": item["quantity"],

                              "unit_price": item["price"]["amount"],
                              "unit_of_measure": "PC",
                              "billing_point_name": current_encounter.branch,
                              "billed_by": "user1",
                              "doctor": current_practitioner.name,
                              "amount": int(item["price"]["amount"]) * int(item["quantity"]),
                              "gross_amount": int(item["price"]["amount"]) * int(item["quantity"]),
                              "category": item["category"],
                              "payment_reference": [],
                              "pre_authorization_code": ""})

            doc = frappe.get_doc(
                {
                    "doctype": "Lct Claim",
                    "patient": current_patient.name,
                    "lct_member": current_membership_details.name,
                    "first_name": current_membership_details.first_name,
                    "last_name": current_membership_details.last_name,
                    "other_names": current_membership_details.other_names,
                    "patient_number": current_patient.uhid_code,

                    "member_number": current_membership_details.name,
                    "payer_code": current_membership_details.payer_code,
                    "payer_name": current_membership_details.payer_name,
                    "scheme_code": current_membership_details.scheme_code,
                    "scheme_name": current_membership_details.scheme_name,
                    "visit_number": current_encounter.name,
                    "visit_end": current_encounter.creation,
                    "visit_start":  current_encounter.creation,
                    "visit_type": "OUTPATIENT",
                    "visit_status": "FINAL",
                    "branch_code": current_encounter.branch,
                    "branch_name": current_encounter.branch,
                    "phone_number": current_encounter.phone_number,
                    "authorization_code": "2819292J",
                    "authorization_type": "SLADEID",
                    "amount": current_invoice.outstanding_amount,
                    "batch_number": "0",
                    "claim_code": current_invoice.name,
                    "coding_standard": "ICD10",
                    "coding_standard_version": "2016",
                    "currency": current_invoice.currency,
                    "dispatch_date": "2021-09-03",
                    "gross_amount": current_invoice.total,
                    "is_primary": "true",
                }
            )
            doc.append(
                'invoices', {"sales_invoice": current_invoice.name})

            for c_diagnosis in diagnosis_payload:
                doc.append('diagnosis', {
                    "code": c_diagnosis["code"],
                    "description": c_diagnosis["name"],
                    "is_primary": "true"
                })

            for c_doctor in doctor_list:
                doc.append('doctors', c_doctor)

            doc.insert()

            payload = {
                "first_name": current_membership_details.first_name,
                "last_name": current_membership_details.last_name,
                "other_names": current_membership_details.other_names,
                "patient_number": current_patient.uhid_code,

                "member_number": current_membership_details.name,
                "payer_code": current_membership_details.payer_code,
                "payer_name": current_membership_details.payer_name,
                "scheme_code": current_membership_details.scheme_code,
                "scheme_name": current_membership_details.scheme_name,
                "visit_number": current_encounter.name,
                "visit_end": "2021-09-03T11:29:51Z",
                "visit_start": str(current_encounter.creation),
                "visit_type": "OUTPATIENT",
                "visit_status": "FINAL",
                "branch_code": current_encounter.branch,
                "branch_name": current_encounter.branch,
                "phone_number": current_encounter.phone_number,
                "authorization_code": "2819292J",
                "authorization_type": "SLADEID",
                "amount": current_invoice.total_insured_amount,
                "batch_number": "0",
                "claim_code": current_invoice.name,
                "coding_standard": "ICD10",
                "coding_standard_version": "2016",
                "currency": current_invoice.currency,
                "dispatch_date": "2021-09-03",
                "gross_amount": current_invoice.total,
                "is_primary": "true",
                "test_diag": diagnosis_list,
                "diagnosis": diagnosis_payload,
                "doctors": doctor_list,
                "invoices": [
                    {
                        "invoice_number": current_invoice.name,
                        "bill_from":  str(current_encounter.creation),
                        "bill_to":  str(current_encounter.creation),
                        "amount": current_invoice.total_insured_amount,
                        "gross_amount": current_invoice.total,
                        "service_type": "OUTPATIENT",
                        "invoice_lines": lines
                    }
                ]
            }
            lct_settings = frappe.get_doc("Lct Settings", {"type": MODE})

            lct = Lct(lct_settings.base_url)

            response = lct.create_claim(payload)
            print(response)

            return {"code": 200, "message": "Claim created successfully", "data": response}

        except Exception as e:
            print(e)
            frappe.log_error(e, "LCT CREATE CLAIM ERROR  /erp_lct.py")
            return {"code": 500, "message": "Error creating claim", "data": e}

    @frappe.whitelist(allow_guest=True)
    def process_claim(current_invoice, current_encounter):

        # // v2.0.0
        try:
            print("processing claim")
            current_claim = frappe.get_doc(
                "Lct Claim", {"claim_code": current_invoice.name})

            # current_sales_invoice = frappe.get_doc(
            #     "Sales Invoice", current_claim.claim_code)
            # current_encounter = frappe.get_doc(
            #     "Patient Encounter", current_sales_invoice.encounter)
            current_patient = frappe.get_doc(
                "Patient", current_invoice.patient)
            current_membership_details = frappe.get_doc(
                "Lct Member", current_claim.member_number)

            if "INP" in current_encounter.name:
                current_practitioner = frappe.get_doc(
                    "Healthcare Practitioner", current_encounter.primary_practitioner)
            else:
                current_practitioner = frappe.get_doc(
                    "Healthcare Practitioner", current_encounter.practitioner)

            print("Getting Doctors")
            doctor_list = []
            doctor_list.append({
                "code": current_practitioner.name,
                "name": current_practitioner.practitioner_name,
            })
            print("processing Diagnosis")
            diagnosis_list = get_invoice_diagnosis(current_encounter.name)
            item_list = get_invoice_items(current_invoice.name)

            diagnosis_payload = []
            for diagnosis in diagnosis_list:
                diagnosis_payload.append({
                    "code": diagnosis["code"],
                    "name": diagnosis["description"],
                    "coding_standard": diagnosis["scheme"],
                    "is_primary": "true"
                })
            print("Gettinh Line Items")
            lines = []
            total_amount = 0
            for item in item_list:
                lines.append({"billing_code": current_encounter.branch,
                              "charge_date": str(current_encounter.creation),
                              "name": item["description"],
                              "invoiceline_number": current_invoice.name,
                              "quantity": item["quantity"],

                              "unit_price": item["price"]["amount"],
                              "unit_of_measure": "PC",
                              "billing_point_name": current_encounter.branch,
                              "billed_by": "user1",
                              "doctor": current_practitioner.name,
                              "amount": int(item["price"]["amount"]) * int(item["quantity"]),
                              "gross_amount": int(item["price"]["amount"]) * int(item["quantity"]),
                              "category": item["category"],
                              "payment_reference": [],
                              "pre_authorization_code": ""})
                total_amount += int(item["price"]["amount"])
            print("Creating Payload")

            total_claim_amount = current_claim.amount

            exceeded_amount = total_claim_amount - \
                float(current_membership_details.benefit_balance)

            print(exceeded_amount)

            if exceeded_amount > 0:
                frappe.throw(f"You have exceeded your limit, Please Pay: KES {exceeded_amount}")
                response = {
                    "code": 201,
                    "message": f"You have exceeded your limit, Please Pay: KES {exceeded_amount}",
                    "claimref": current_claim
                }
                return response

            payload = {
                "first_name": current_membership_details.first_name,
                "last_name": current_membership_details.last_name,
                "other_names": current_membership_details.other_names,
                "patient_number": current_patient.uhid_code,

                "member_number": current_membership_details.name,

                "auth_code": current_membership_details.auth_code,
                "payer_code": current_membership_details.payer_code,
                "payer_name": current_membership_details.payer_name,
                "scheme_code": current_membership_details.scheme_code,
                "scheme_name": current_membership_details.scheme_name,
                "visit_number": current_encounter.name,

                "visit_end": str(datetime.datetime.now()),
                "visit_start": str(current_encounter.creation),
                "visit_type": "OUTPATIENT",  # TODO: get from encounter
                "visit_status": "FINAL",  # TODO: get from encounter
                "branch_code": current_encounter.branch,
                "branch_name": current_encounter.branch,
                "phone_number": current_encounter.phone_number,
                "authorization_code": current_claim.authorization_code,
                "authorization_type": current_claim.authorization_type,
                "amount": total_claim_amount,
                "batch_number": "0",
                "claim_code": current_invoice.name,
                "coding_standard": "ICD10",
                "coding_standard_version": "2016",
                "currency": current_invoice.currency,

                "dispatch_date": str(current_encounter.creation.replace(microsecond=0)).split(" ")[0],
                "gross_amount": total_claim_amount,
                "is_primary": "true",
                "test_diag": diagnosis_list,
                "diagnosis": diagnosis_payload,
                "doctors": doctor_list,
                "invoices": [
                    {
                        "invoice_number": current_invoice.name,
                        "bill_from":  str(current_encounter.creation),
                        "bill_to":  str(current_encounter.creation),
                        "amount": total_claim_amount,
                        "gross_amount": total_claim_amount,
                        "service_type": "OUTPATIENT",  # TODO: get from encounter
                        "invoice_lines": lines
                    }
                ]
            }
            frappe.log_error(payload, "LCT Claim payload ERROR  /erp_lct.py")
            lct_settings = frappe.get_doc("Lct Settings", {"type": MODE})
            lct = Lct(lct_settings.base_url)

            print(payload)
            result = lct.create_claim(
                data=payload)

            print(result)

            if result["success"]:
                print("creating payment entry")
                payment_entry = create_payment_entry(
                    total_claim_amount, f"{result['claimref']}", current_invoice.customer)
                current_claim.claimref = result["claimref"]
                current_claim.is_processed = True
                current_claim.save()
                print(payment_entry)
                return {"code": 200, "message": result["message"], "claimref": current_claim}

            return {
                "code": 200,
                "message": result["message"],
                "claimref": current_claim
            }

        except Exception as e:
            print(e)
            frappe.log_error(e, "LCT PROCESS CLAIM ERROR  /erp_lct.py")
            return {"code": 500, "message": "Error Processing Claim"}
