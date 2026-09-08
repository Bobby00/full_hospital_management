import json
from typing import Dict, List, Optional, Union
import requests
from decouple import config
from gch_custom.services.slade.types import SladeTokenResponseType
import frappe
import os


class Slade:
    def __init__(
        self, client_id, client_secret, username, password, authorization_url, base_url
    ) -> None:
        self.client_id = client_id
        self.client_secret = client_secret
        self.username = username
        self.password = password
        self.BASE_URL = base_url
        self.OAUTH_BASE_URL = authorization_url
        self.login()

    def login(self):
        token = self._get_oauth_token()
        access_token = token.get("access_token")
        token_type = token.get("token_type")

        frappe.log_error(
            {
                "url": self.OAUTH_BASE_URL,
                "payload": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "password",
                    "username": self.username,
                    "password": self.password,
                },
                "response": token,
            },
            "SLADE OAUTHORIZATION RESPONSE  /slade/slade.py",
        )
        self.headers = {}
        if access_token:
            self.access_token = access_token
            self.token_type = token_type
            self.headers = {
                "Authorization": f"{self.token_type} {self.access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }

    def _get_oauth_token(self) -> Union[SladeTokenResponseType, Dict]:
        """Retrieves token from Slade's OAUTH2 URL

        Returns:
            SladeTokenResponseType: If all goes well
            Dict: If any error occurs
        """

        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "password",
            "username": self.username,
            "password": self.password,
        }

        frappe.log_error(payload, "SLADE OAUTHORIZATION PAYLOAD  /slade/slade.py")
        try:

            r = requests.post(
                self.OAUTH_BASE_URL,
                data=payload,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                },
            )

            response: SladeTokenResponseType = r.json()

        except Exception as e:
            frappe.log_error(e, "SLADE OAUTHORIZATION ERROR  /slade/slade.py")
            frappe.log_error(
                payload, "SLADE OAUTHORIZATION PAYLOAD ERROR  /slade/slade.py"
            )
            return {"error": e}
        return response

    def verify_authorization(self, data):

        try:
            # json_data = json.dumps(data)

            r = requests.post(
                f"{self.BASE_URL}authorizations/validate_authorization_token/",
                json=data,
                headers=self.headers,
            )

            response = r.json()
            frappe.log_error(
                {
                    "url": f"{self.BASE_URL}authorizations/validate_authorization_token/",
                    "headers": self.headers,
                    "payload": data,
                    "response": response,
                },
                "SLADE AUTHORIZATION REQUEST /slade/slade.py",
            )
            return response
        except Exception as e:
            frappe.log_error(e, "SLADE AUTHORIZATION ERROR  /slade/slade.py")
            frappe.log_error(data, "SLADE AUTHORIZATION ERROR  /slade/slade.py")

            return {"error": e}

    def submit_claim(self, data):
        """Submits claim"""

        try:

            # json_data = json.dumps(data)

            r = requests.post(
                f"{self.BASE_URL}claims/", json=data, headers=self.headers
            )
            frappe.log_error(
                r.status_code, "SLADE SUBMIT CLAIM REQUEST /slade/slade.py"
            )
            r.raise_for_status()
            if r.status_code == 201:
                frappe.log_error(
                    {
                        "url": f"{self.BASE_URL}claims/",
                        "headers": self.headers,
                        "payload": data,
                        "response_code": r.status_code,
                        "response": r.json(),
                    },
                    "201 SLADE SUBMIT CLAIM REQUEST /slade/slade.py",
                )
                response = r.json()
                return response

            response = r.json()
            frappe.log_error(
                {
                    "url": f"{self.BASE_URL}claims/",
                    "headers": self.headers,
                    "payload": data,
                    "response_code": r.status_code,
                    "response": response,
                },
                "SLADE SUBMIT CLAIM REQUEST /slade/slade.py",
            )
            return response
        except Exception as e:
            frappe.log_error(e, "SLADE I NOW KNOW HERE CLAIM ERROR  /slade/slade.py")

            return {"error": e}

    def submit_invoice(self, data):

        try:
            # json_data = json.dumps(data)

            r = requests.post(
                f"{self.BASE_URL}invoices/", json=data, headers=self.headers
            )

            response = r.json()
            frappe.log_error(
                {
                    "url": f"{self.BASE_URL}invoices/",
                    "headers": self.headers,
                    "payload": data,
                    "response": response,
                },
                "SLADE SUBMIT INVOICE REQUEST /slade/slade.py",
            )

            return response
        except Exception as e:

            frappe.log_error(e, "SLADE SUBMIT INVOICE ERROR  /slade/slade.py")
            frappe.log_error(data, "SLADE SUBMIT INVOICE ERROR  /slade/slade.py")

            return {"error": True}

    def reserve_balance(self, data):
        try:
            frappe.log_error(
                {
                    "url": f"{self.BASE_URL}balances/reservations/reserve_from_authorization/",
                    "headers": self.headers,
                    "payload": data,
                },
                "SLADE RESERVE BALANCE REQUEST /slade/slade.py",
            )

            # url = "https://provider-edi-api.multitenant.slade360.co.ke/v1/balances/reservations/reserve_from_authorization/"
            r = requests.post(
                f"{self.BASE_URL}balances/reservations/reserve_from_authorization/",
                json=data,
                headers=self.headers,
            )

            response = r.json()

            return response
        except Exception as e:

            frappe.log_error(e, "SLADE RESERVE BALANCE ERROR  /slade/slade.py")
            frappe.log_error(data, "SLADE RESERVE BALANCE ERROR  /slade/slade.py")

            return {"error": True}

    def upload_claim_attachment(self, data, file_path):
        try:

            files = {"attachment": open(file_path, "rb")}
            headers = {
                "Authorization": self.headers["Authorization"],
                "Accept": "application/json",
            }

            frappe.log_error(
                {
                    "url": f"{self.BASE_URL}claim_attachments/upload_attachment/",
                    "headers": headers,
                    "payload": data,
                    "file_path": file_path,
                },
                "SLADE UPLOAD CLAIM REQUEST /slade/slade.py",
            )
            r = requests.post(
                f"{self.BASE_URL}claim_attachments/upload_attachment/",
                files=files,
                data=data,
                headers=headers,
            )
            response = r.json()

            return response

        except Exception as e:

            frappe.log_error(e, "SLADE UPLOAD CLAIM ERROR  /slade/slade.py")
            frappe.log_error(data, "SLADE UPLOAD CLAIM ERROR  /slade/slade.py")

            return {"error": True}

    def upload_invoice_attachment(self, data, file_path):
        try:
            # json_data = json.dumps(data)

            files = {"attachment": open(file_path, "rb")}
            headers = {
                "Authorization": self.headers["Authorization"],
                "Accept": "application/json",
            }
            frappe.log_error(data, "SLADE UPLOAD INVOICE REQUEST /slade/slade.py")
            r = requests.post(
                f"{self.BASE_URL}invoice_attachments/upload_attachment/",
                files=files,
                data=data,
                headers=headers,
            )
            response = r.json()

            return response

        except Exception as e:

            frappe.log_error(e, "SLADE UPLOAD INVOICE ERROR  /slade/slade.py")
            frappe.log_error(data, "SLADE UPLOAD INVOICE ERROR  /slade/slade.py")

            return {"error": True}
