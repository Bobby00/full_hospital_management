import requests
from requests.auth import HTTPBasicAuth
import json
import frappe


class Lct:
    def __init__(self, base_url):
        self.HEADERS = {"Content-Type": "application/json", "Accept": "*/*"}
        self.BASE_URL = base_url
        pass

    def get_member_details(self, membership_number):
        """ 
        On the member verification the user story in summary is:
        1. Hospital user enters patient membership number on our device and patient verifies against the
        membership number using their fingerprint if they are indeed the patient.
        2. After patient is verified, cashier selects the benefit to send along with member details to the
        LCT_STAGE. These details will be fetched from our LCT Backend.
        3. The Hospital user then enters the membership number on the HMIS system, which pulls details
        from the LCT_STAGE_DB into the HMIS.

        """

        body = {
            "membership_number": membership_number,
        }

        try:
            response = requests.post(
                f"{self.BASE_URL}/lct/compas/lct/member/request_member_verification", headers=self.HEADERS, json=body)
            json_response = response.json()
            print("*********")
            print(json_response)
            return json_response
        except Exception as e:
            frappe.log_error(e, "LCT GET MEMBER ERROR  /lct.py")
            return

    def create_claim(self, data):
        try:

            response = requests.post(
                f"{self.BASE_URL}/lct/compas/lct/claims/fetchClaim", headers=self.HEADERS, json=data)
            json_response = response.json()

            return json_response
        except Exception as e:
            frappe.log_error(e, "LCT CREATE CLAIM ERROR  /lct.py")
            return
