import requests
import frappe

# BASE_URL = "http://192.168.0.84"
# API_TOKEN = "70be65b9-9358-4749-ba83-d53a1a6caeb2"


class KraniumServices:
    def __init__(self) -> None:
        self.BASE_URL = "http://192.168.0.84:7070"
        # self.BASE_URL = "http://192.168.1.105:5000"
        self.API_TOKEN = "70be65b9-9358-4749-ba83-d53a1a6caeb2"

    def get_prev_physical_examination(self, uhid: str):
        try:
            headers = {
                "Content-Type": "application/json",
                "api-key-header": f"API {self.API_TOKEN}"
            }

            r = requests.get(
                f"{self.BASE_URL}/patient-history/{uhid}", headers=headers)
            response = r.json()

            if response.get("success") == True:
                return response["patient_history"]

            return response
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "KRANIUM SERVICE FETCH PHYSICAL EXAMINATION ERROR  /kranium_services.py")
            return []

    def get_prev_medical_history(self, encounter_id: str):
        try:
            headers = {
                "Content-Type": "application/json",
                "api-key-header": f"API {self.API_TOKEN}"
            }

            r = requests.get(
                f"{self.BASE_URL}/prescription-history/{encounter_id}", headers=headers)
            response = r.json()

            if response.get("success") == True:
                return response["prescription_history"]

            return response
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "KRANIUM SERVICE FETCH MEDICAL HISTORY ERROR  /kranium_services.py")
            return []
        
    def get_possible_patient_matches(self, first_name: str, middle_name: str, last_name:str, dob:str, gender:str):
        try:
            headers = {
                "Content-Type": "application/json",
                "api-key-header": f"API {self.API_TOKEN}",
                "first_name": first_name,
                "middle_name": middle_name,
                "last_name": last_name,
                "dob": dob,
                "gender": gender
            }
            patient_list = requests.get(
                f"{self.BASE_URL}/get-possible-matches?first_name="+first_name+"&middle_name="+middle_name+"&last_name="+last_name+"&dob="+dob+"&gender="+gender, headers=headers)
            patient_list = patient_list.json()
            
            if patient_list.get("Success") == True:
                return patient_list
            return patient_list
        except Exception as e:
            print(e)
            frappe.log_error(e, "KRANIUM SERVICE FETCH PATIENT LIST /kranium_services.py")
            return []

    def search_patient_from_kranium(self, first_name: str, last_name:str, dob:str):
        try:
            headers = {
                "Content-Type": "application/json",
                "api-key-header": f"API {self.API_TOKEN}",
                "first_name": first_name,
                "last_name": last_name,
                "dob": dob,
            }
            patient_list = requests.get(
                f"{self.BASE_URL}/search-patient?first_name="+first_name+"&last_name="+last_name+"&dob="+dob, headers=headers)
            patient_list = patient_list.json()
            
            if patient_list.get("Success") == True:
                return patient_list
            return patient_list
        except Exception as e:
            print(e)
            frappe.log_error(e, "KRANIUM SERVICE FETCH PATIENT LIST /kranium_services.py")
            return []

