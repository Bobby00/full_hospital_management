import requests
import frappe
from typing import Any, Dict, Tuple, List


class Kranium:
    def __init__(self, *args, **kwargs):
        self.URL = "http://192.168.0.84:8000"  # Migrate to config

    def allocate_names(self, d: Dict) -> Dict[str, Any]:
        """Allocate first, middle and last names from the dictionary

        of patient data.

        Args:
            d (_type_): _description_

        Returns:
            Dict[str, Any]: _description_
        """
        first_name = d.get("first_name", "")
        middle_name = d.get("middle_name", "")
        last_name = d.get("last_name", "")
        if len(first_name.split(" ")) == 3:
            first_name, middle_name, last_name = first_name.split(" ")
        if len(first_name.split(" ")) == 2:
            first_name, last_name = first_name.split(" ")
            middle_name = last_name[0]
        elif len(middle_name.split(" ")) == 3:
            first_name, middle_name, last_name = middle_name.split(" ")
        elif len(last_name.split(" ")) == 3:
            first_name, middle_name, last_name = last_name.split(" ")
        d.update(
            {
                "first_name": first_name.capitalize(),
                "middle_name": middle_name.capitalize(),
                "last_name": last_name.capitalize(),
            }
        )
        if last_name == "" and middle_name != "" and middle_name:
            d.update(
                {
                    "last_name": middle_name.capitalize(),
                    "middle_name": middle_name[0].capitalize(),
                }
            )
        return d

    def get_patient_registrations(self, start_date, end_date, page=1, limit=100):
        try:
            response = requests.get(
                self.URL,
                params={
                    "start_date": start_date,
                    "end_date": end_date,
                    "page": page,
                    "limit": limit,
                },
            )
        except Exception as e:
            print(e)
            return {}
        return response.json()

    def get_patient(self, uhid_code: str) -> Tuple[bool, Dict]:
        """_summary_

        Args:
            uhid_code (str): _description_

        Returns:
            Tuple[bool, Dict]: _description_
        """
        patient = {}
        headers = {"Content-Type": "application/json", "api-key-header": "API 70be65b9-9358-4749-ba83-d53a1a6caeb2"}
        try:
            request = requests.get(
                f"{self.URL}/patient/{uhid_code}",
                headers=headers,
            )
            found = True
            response = request.json()
            patient = response.get("patient", {})
            print(response)
            """
            patient = {
                "location": 10,
                "UHID": 9009,
                "Registration Date": "2010-12-01T10:40:07",
                "First Name": "PATRICIA WANJIRU",
                "Middle Name": null,
                "Last Name": "",
                "Date Birth": null,
                "address 1": "",
                "address 2": "",
                "Phone": null,
                "cellphone": null,
                "Gender": "",
                "title": null,
                "status": "",
                "email": null,
                "address": ""
            }
            """
            raw_patient = {
                "location": patient.get("location", ""),
                "uhid": patient.get("UHID", ""),
                "registration_date": patient.get("registration_date", ""),
                "first_name": patient.get("first_name", ""),
                "middle_name": patient.get("middle_name", ""),
                "last_name": patient.get("last_name", ""),
                "date_birth": patient.get("date_birth", ""),
                "address_1": patient.get("address_1", ""),
                "address_2": patient.get("address_2", ""),
                "phone": patient.get("phone", ""),
                "cellphone": patient.get("cellphone", ""),
                "gender": patient.get("gender", ""),
                "title": patient.get("title", ""),
                "status": patient.get("status", ""),
                "email": patient.get("email", ""),
                "address": patient.get("address", ""),
            }
            print(raw_patient)
            patient_ = self.allocate_names(raw_patient)
        except Exception as e:
            print(e)
            found = False
            patient_ = {}
        return found, patient_

    def get_kranium_data(self, start_date, end_date, page=1, limit=100):
        URL = "http://192.168.1.105:5000/api/v1/registered_patients"
        try:
            response = requests.get(
                URL,
                params={
                    "start_date": start_date,
                    "end_date": end_date,
                    "page": page,
                    "limit": limit,
                },
            )
            print(response.json())
        except Exception as e:
            print(e)
            return {}

        return response.json()


gch_middleware_kranium = Kranium()
