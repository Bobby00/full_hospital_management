import requests
import http.client
from requests.auth import HTTPBasicAuth
import json
import frappe


class Mtiba:
    def __init__(self, username: str, password: str, baseIntegrationUrl: str):
        self._username = username
        self._password = password
        self._baseIntegrationUrl = baseIntegrationUrl
        self._auth_url = f"{baseIntegrationUrl}/auth/accessToken"
        # self._getAuthToken()

    def _getAuthToken(self) -> str:
        request = {
            "username": self._username,
            "password": self._password,
        }

        response = requests.post(self._auth_url, json=request)
        dictionary_response = json.loads(response.text)
        frappe.log_error(dictionary_response, "MTIBA TOKEN  /mtiba/mtiba.py")
        self.token = dictionary_response.get("accessToken")
        print(self.token)
        return dictionary_response["accessToken"]

    def _addHeaders(self):
        _access_token = self._getAuthToken()
        headers = {
            "Authorization": "Bearer %s" % _access_token,
            "Content-Type": "application/json",
        }
        #         headers = {"Authorization": _access_token,
        #                    "Content-Type": 'application/json'}
        return headers

    def getSystemStatus(self) -> bool:
        """
        HEALTH CHECK API
        This API is designed to probe and report on M-TIBA platform availability and
        aliveness.


        GET https://{baseIntegrationUrl}/health
        Authorization: Bearer {accessToken}
        Content-Type: application/json
        """
        try:
            self._get_system_status_url = f"{self._baseIntegrationUrl}/health"
            response = requests.get(
                self._get_system_status_url, headers=self._addHeaders()
            )
            dictionary_response = json.loads(response.text)
            frappe.log_error(response, "MTIBA  SYSTEM UP STATUS /mtiba/mtiba.py")
            return dictionary_response["status"] == "UP"
        except Exception as e:
            print(e)
            frappe.log_error(e, "MTIBA HEALTH CHECK ERROR  /mtiba/mtiba.py")
            return e

    # New V2 API
    def fetch_visit(self, visit_code: str):
        # https://api.ke-acc.carepay.dev/api/integration/visit/PITF15503
        visit_url = f"{self._baseIntegrationUrl}/visit/{visit_code}"
        headers = self._addHeaders()
        response = requests.get(visit_url, headers=headers)

        dictionary_response = json.loads(response.text)
        frappe.log_error(
            {
                "url": visit_url,
                "headers": headers,
                "payload": visit_code,
                "response": dictionary_response,
            },
            "MTIBA  FETCH VISIT /mtiba/mtiba.py",
        )
        response_code = response.status_code
        print(response.status_code)
        if response_code == 200:
            return dictionary_response

        raise Exception("ERROR: Could not fetch visit from MTIBA")

    def bill_visit(self, visit_code: str, data):
        # https://api.ke-acc.carepay.dev/api/integration/visit/{visitCode}/bill
        bill_visit_url = f"{self._baseIntegrationUrl}/visit/{visit_code}/bill"
        headers = self._addHeaders()
        json_data = json.dumps(data)
        response = requests.post(bill_visit_url, headers=headers, data=json_data)
        dictionary_response = json.loads(response.text)
        frappe.log_error(
            {
                "url": bill_visit_url,
                "headers": headers,
                "payload": data,
                "response": dictionary_response,
            },
            "MTIBA  BILL VISIT /mtiba/mtiba.py",
        )
        print(response.status_code)
        if response.status_code == 200:
            return dictionary_response

        raise Exception("ERROR: Integration returned an error from MTIBA")

    def add_payments_to_visit(self, visit_code: str, data):
        # https://api.ke-acc.carepay.dev/api/integration/visit/{visitCode}/payments
        payments_url = f"{self._baseIntegrationUrl}/visit/{visit_code}/payments"
        headers = self._addHeaders()
        json_data = json.dumps(data)
        response = requests.post(payments_url, headers=headers, data=json_data)

        frappe.log_error(
            {
                "url": payments_url,
                "headers": headers,
                "payload": data,
                "response": "",
            },
            "MTIBA  ADD PAYMENTS TO VISIT /mtiba/mtiba.py",
        )
        print(response.status_code)
        if response.status_code == 200:
            return {"message": "INFO: Success"}

        raise Exception("ERROR: Integration returned an error from MTIBA")

    def add_medical_details_to_visit(self, visit_code: str, data):
        # https://api.ke-acc.carepay.dev/api/integration/visit/{visitCode}/medicalDetails
        medical_details_url = (
            f"{self._baseIntegrationUrl}/visit/{visit_code}/medicalDetails"
        )
        headers = self._addHeaders()
        json_data = json.dumps(data)
        response = requests.post(medical_details_url, headers=headers, data=json_data)

        frappe.log_error(
            {
                "url": medical_details_url,
                "headers": headers,
                "payload": data,
                "response": "",
            },
            "MTIBA  ADD MEDICAL DETAILS TO VISIT /mtiba/mtiba.py",
        )
        print(response.status_code)
        if response.status_code == 200:
            return {"message": "INFO: Success"}

        raise Exception("ERROR: Integration returned an error from MTIBA")

    def close_visit(self, visit_code: str):
        # https://api.ke-acc.carepay.dev/api/integration/visit/{visitCode}/close
        close_visit_url = f"{self._baseIntegrationUrl}/visit/{visit_code}/close"
        headers = self._addHeaders()
        response = requests.post(close_visit_url, headers=headers)

        frappe.log_error(
            {
                "url": close_visit_url,
                "headers": headers,
                "payload": visit_code,
                "response": "",
            },
            "MTIBA  CLOSE VISIT /mtiba/mtiba.py",
        )
        print(response.status_code)
        if response.status_code == 200:
            return {"message": "INFO: Success"}

        if response.status_code == 204:
            return {"message": "INFO: Visit already closed"}

        raise Exception("ERROR: Integration returned an error from MTIBA")

    # OLD V1 API
