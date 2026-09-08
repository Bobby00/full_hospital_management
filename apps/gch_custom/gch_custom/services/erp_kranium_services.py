from .kranium_services import KraniumServices
import frappe


# TODO: Move this to a config url
#BASE_URL = "http://192.168.1.105:5000"

BASE_URL = "http://192.168.0.84:7070"
API_TOKEN = "70be65b9-9358-4749-ba83-d53a1a6caeb2"


class KraniumServicesController:
    @frappe.whitelist(allow_guest=True)
    def get_patient_history(patient: str):
        try:
            uhid = frappe.db.get_value("Patient", patient, "kranium_uhid")
            print(uhid)
            frappe.log_error(
                {"uhid": uhid, "baseUrl": BASE_URL}, "KRANIUM SERVICE FETCH PHYSICAL EXAMINATION PAYLOAD  /erp_kranium_services.py")
            kranium_services = KraniumServices()
            response = kranium_services.get_prev_physical_examination(uhid)
            structured_response = {}
            for encounter in response:
                encounter_id = encounter["Encounter"]
                if encounter_id not in structured_response:
                    structured_response[encounter_id] = []
                structured_response[encounter_id].append(encounter)
            new_data = []
            for structured_response_key in structured_response:
                note_exists = frappe.db.exists("Kranium Physical Exams Notes", {
                                               "kranium_encounter": structured_response_key})
                if note_exists:
                    print("Note exists")
                else:
                    print("Note does not exist")

                    description = ""
                    kranium_uhid = None
                    seen_by = None
                    encounter_date = None
                    for s_encounter in structured_response[structured_response_key]:
                        if encounter_date is None:
                            encounter_date = s_encounter["Visit Date"]
                        if kranium_uhid is None:
                            kranium_uhid = s_encounter["UHID"]
                        if seen_by is None:
                            seen_by = s_encounter["Doctor"]
                        if s_encounter["History/PhysicalExamination"] is not None:

                            description = description + ", " + \
                                s_encounter["History/PhysicalExamination"]
                    if description.startswith(", "):
                        description = description[2:]
                    if description == "":
                        description = "No Physical Examination Found"
                    if seen_by == "" or seen_by == " " or seen_by == None:
                        seen_by = "No Doctor Found"
                    if encounter_date == "" or encounter_date == " " or encounter_date == None:
                        encounter_date = "No Date Found"
                    medication = kranium_services.get_prev_medical_history(
                        structured_response_key)
                    print("=====================================")
                    print({"encounter": structured_response_key, "uhid": kranium_uhid, "seen_by": seen_by,
                          "description": description, "encounter_date": encounter_date, "medication": medication})
                    print("=====================================")
                    new_data.append({"encounter": structured_response_key, "uhid": kranium_uhid, "seen_by": seen_by,
                                     "description": description, "encounter_date": encounter_date, "medication": medication})

            frappe.log_error(
                {"response": response}, "KRANIUM SERVICE FETCH PHYSICAL EXAMINATION RESPONSE  /erp_kranium_services.py")
            return new_data
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "KRANIUM SERVICE FETCH PHYSICAL EXAMINATION ERROR  /erp_kranium_services.py")
            return []

    @frappe.whitelist(allow_guest=True)
    def get_medical_history(encounter_id: str):
        try:
            kranium_services = KraniumServices()
            response = kranium_services.get_prev_medical_history(encounter_id)
            return response
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "KRANIUM SERVICE FETCH MEDICAL HISTORY ERROR  /erp_kranium_services.py")
            return []
        

    @frappe.whitelist(allow_guest=True)
    def fetch_possible_matches(first_name: str, middle_name: str, last_name:str, dob:str, gender:str):
        try:
            kranium_services = KraniumServices()
            response = kranium_services.get_possible_patient_matches(first_name, middle_name, last_name, dob, gender)
            return response

        except Exception as e:
            print(e)
            frappe.log_error(e, "KRANIUM SERVICE FETCH POSSIBLE MATCHES  /erp_kranium_services.py")
            return []
        
    @frappe.whitelist(allow_guest=True)
    def search_patient_on_kranium(first_name: str, last_name:str, dob:str):
        try:
            kranium_services = KraniumServices()
            response = kranium_services.search_patient_from_kranium(first_name, last_name, dob)
            return response

        except Exception as e:
            print(e)
            frappe.log_error(e, "KRANIUM SERVICE FETCH POSSIBLE MATCHES  /erp_kranium_services.py")
            return []