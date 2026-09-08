from erpnext.healthcare.doctype.lab_test.lab_test import LabTest
import frappe


class GCHLabTest(LabTest):
    def after_insert(self):
        print("Insertion of Labtest")
    
        # message_id = self.name
        # patient = self.patient
        # location = "Mombasa" # Check Patient Location
        # practitioner = self.practitioner
        # practitioner_number = "100015"
        # test_name = None
        # if not self.practitioner:
        #     frappe.throw("Practitioner is required")
        # if self.patient:
        #     patient = frappe.get_doc("Patient", {"name": self.patient}, as_dict=1)
        # if self.practitioner:
        #     practitioner = frappe.get_doc("Healthcare Practitioner", {"name": self.practitioner}, as_dict=1)
        # if patient:
        #     first_name = patient.first_name
        #     middle_name = patient.middle_name
        #     last_name = patient.last_name
        #     uhid =  patient.uhid_code
        #     dob=patient.dob
        #     gender = patient.sex
        #     phone_number = patient.phone
        #     email_address = patient.email
            
        # if practitioner:
        #     practitioner_name = self.practitioner
        #     practitioner_number = practitioner.healthcare_practitioner_number
        # # if self.lab_test_name:
        # #     test_name = self.lab_test_name
        # template = frappe.get_doc("Lab Test Template", {"name": self.template})
        # if template:
        #     item_code = template.lab_test_code
        #     test_name = template.lab_test_name
        
        # from gch_middleware.utils.hl7.labware.service import gch_labware_service
        # sent = gch_labware_service.request_lab(
        #     message_id=message_id,
        #     first_name=first_name,
        #     middle_name=middle_name,
        #     last_name=last_name,
        #     uhid=uhid,
        #     dob=dob,
        #     gender=gender,
        #     location=location,
        #     phone_number=phone_number,
        #     email_address=email_address,
        #     encounter_number=self.patient_encounter,
        #     practitioner_number=practitioner_number,
        #     practitioner_name=practitioner_name,
        #     test_name=test_name,
        #     item_code=item_code,
        # )

        # print(sent)



        


        