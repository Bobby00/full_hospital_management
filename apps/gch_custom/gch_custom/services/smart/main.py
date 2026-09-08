import json
import requests
import frappe

import os
from pathlib import Path

# from .decorators import login_required

from functools import wraps


def login_required(func):
    @wraps(func)
    def func_wrapper(self, *args, **kwargs):
        if not self.token:
            self.login()
        return func(self, *args, **kwargs)

    return func_wrapper


class Smart:
    def __init__(self, base_url: str, client_id: str, username: str, client_secret: str, password: str) -> None:
        self.base_url = base_url
        self.login_url = f"{self.base_url}/oauth/token"
        self.client_id = client_id
        self.client_secret = client_secret
        self.username = username
        self.password = password
        self.BASE_DIR = Path(__file__).resolve().parent
        self.fetch_visits_url = "{url}/api/visit?patientNumber={patient_number}&sessionStatus={session_status}"
        self.merge_visits_url = "{url}/api/patient-number/{patient_number}/visit-number/{visit_number}"
        self.close_visits_url = "{url}/api/visit/{visit_number}/close-session"
        self.upload_claim_url = (
            "{url}/api/claims?patientNumber={patient_number}&sessionId={session_id}"
        )
        self.fetch_member_details_url = (
            "{url}/api/member?patientNumber={patient_number}&sessionId={session_id}"
        )
        self.token = None
        self.session_id = None
        self.login()
        ...

    def login(self):
        """Login to obtain token"""
        try:
            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
            }
            payload = {
                "grant_type": "password",
                "username": self.username,
                "password": self.password,
            }
            # cert = os.path.join(self.BASE_DIR, "cert.pem")
            r = requests.post(
                self.login_url,
                auth=(self.client_id, self.client_secret),
                headers=headers,
                data=payload,
                verify=False,
            )

            """
            {
                "access_token": "fb6cd981-3ffa-41f5-9220-09d7cbe46440",
                "token_type": "bearer",
                "refresh_token": "9890393c-df1b-4745-9e48-9babadddc18b",
                "expires_in": 18139,
                "scope": "read  write"
            }
            """
            self.token = r.json().get("access_token")
            self.headers = {
                "Authorization": f"Bearer {self.token}",
            }

        except Exception as e:
            print(e)
            frappe.log_error(e, "SMART AUTH ERROR  /smart/smart.py")
            return e

    @login_required
    def fetch_visits(self, patient_number: str, session_status: str = "PENDING"):
        """Fetch Visits"""
        try:
            url = self.fetch_visits_url.format(
                url=self.base_url,
                patient_number=patient_number,
                session_status=session_status,
            )
            frappe.log_error(url, "SMART FETCH VISIT REQUEST /smart/smart.py")
            r = requests.get(url, headers=self.headers, verify=False)

            return r.json()

        except Exception as e:
            print(e)
            frappe.log_error(e, "SMART FETCH VISIT ERROR  /smart/smart.py")
            return e

    @login_required
    def merge_visit_session(self, patient_number: str, visit_number: str):
        # /patient-number/66/visit-number/9
        try:
            url = self.merge_visits_url.format(
                url=self.base_url,
                patient_number=patient_number,
                visit_number=visit_number,
            )
            frappe.log_error(url, "SMART MERGE REQUEST /smart/smart.py")
            r = requests.put(url, headers=self.headers, verify=False)

            return r.json()

        except Exception as e:
            print(e)
            frappe.log_error(e, "SMART FETCH VISIT ERROR  /smart/smart.py")
            return e

    @login_required
    def fetch_member_details(self, patient_number: str, session_id: str):
        try:
            url = self.fetch_member_details_url.format(
                url=self.base_url, patient_number=patient_number, session_id=session_id
            )
            frappe.log_error(url, "SMART FETCH MEMBER REQUEST /smart/smart.py")
            r = requests.get(url, headers=self.headers, verify=False)
            return r.json()
        except Exception as e:
            print(e)
            frappe.log_error(e, "SMART FETCH VISIT ERROR  /smart/smart.py")
            return e

    @login_required
    def upload_claim(self, session_id, patient_number, data):
        try:
            url = self.upload_claim_url.format(
                url=self.base_url, patient_number=patient_number, session_id=session_id
            )
            print(url)
            frappe.log_error(
                data, "SMART UPLOAD CLAIM REQUEST /smart/smart.py")
            # json_data = json.dumps(data)
            r = requests.post(url, json=data,
                              headers=self.headers, verify=False)
            print(r)
            return r.json()

        except Exception as e:
            print(e)
            frappe.log_error(e, "SMART UPLOAD INVOICE ERROR  /smart/smart.py")
            return e

    @login_required
    def close_visit(self, session_id):
        try:
            url = self.close_visits_url.format(
                url=self.base_url, visit_number=session_id
            )
            print(url)
            frappe.log_error(url, "SMART CLOSE VISIT REQUEST /smart/smart.py")
            r = requests.put(url, headers=self.headers, verify=False)
            print(r)
            return r.json()
        except Exception as e:
            print(e)
            frappe.log_error(e, "SMART CLOSE VISIT ERROR  /smart/smart.py")
            return e
