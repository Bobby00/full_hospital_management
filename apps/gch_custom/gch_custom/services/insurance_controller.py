import frappe
from .erp_slade import ErpSladeController
from .erp_smart import ErpSmartController
from .erp_mtiba import ErpMtibaController
from .erp_lct import ErpLctController


class InsuranceController:
    def __init__(self):
        pass

    def initiate_insurance(self, insurance_type: str, membership_number: str, patient_encounter: str):
        try:
            # get patient details
            current_encounter = frappe.get_doc(
                "Patient Encounter", patient_encounter)
                

            if insurance_type == "SLADE":
                slade_controller = ErpSladeController()
                patient_auth_response = slade_controller.get_patient_auth_v2(
                    auth_token=membership_number)
                return patient_auth_response["message"]

            elif insurance_type == "SMART":
                smart_controlller= ErpSmartController()
                fetch_patient_response = smart_controlller.fetch_patient()
                merge_patient_response = smart_controlller.merge_patient()
                fetch_member_details_response = smart_controlller.fetch_member_details()

            elif insurance_type == "MTIBA":
                mtiba_controller = ErpMtibaController()
                patient_auth_response = mtiba_controller.get_patient_auth()

            elif insurance_type == "LCT":
                lct_controller = ErpLctController()

        except Exception as e:
            frappe.log_error(
                e, "InsuranceController: initiate_insurance /insurance_controller.py")
            return

    def process_insurance(self, insurance_type: str, membership_number: str, patient_encounter: str, invoice: str):
        try:
            # get patient details
            current_encounter = frappe.get_doc(
                "Patient Encounter", patient_encounter)
            
            # get invoice details
            current_invoice = frappe.get_doc("Sales Invoice", invoice)
           
            if insurance_type == "SLADE":
                pass
            elif insurance_type == "SMART":
                pass
            elif insurance_type == "MTIBA":
                pass
            elif insurance_type == "LCT":
                pass
            return
        except Exception as e:
            frappe.log_error(
                e, "InsuranceController: process_insurance /insurance_controller.py")
            return
