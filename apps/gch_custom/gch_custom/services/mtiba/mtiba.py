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
        headers = {"Authorization": "Bearer %s" % _access_token,
                   "Content-Type": 'application/json'}
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
                self._get_system_status_url, headers=self._addHeaders())
            dictionary_response = json.loads(response.text)
            frappe.log_error(
                response, "MTIBA  SYSTEM UP STATUS /mtiba/mtiba.py")
            return dictionary_response["status"] == "UP"
        except Exception as e:
            print(e)
            frappe.log_error(e, "MTIBA HEALTH CHECK ERROR  /mtiba/mtiba.py")
            return e

    def get_treatment_info(self, treatmentcode: str):
        """
        GET TREATMENT INFORMATION API

        GET https://{baseIntegrationUrl}/treatments/{treatmentcode}
        Authorization: Bearer {accessToken}
        Content-Type: application/json
        """
        # if self.getSystemStatus():
        self._get_treatment_infortion_url = f"{self._baseIntegrationUrl}/treatments/{treatmentcode}"
        headers = self._addHeaders()
        response = requests.get(
            self._get_treatment_infortion_url, headers=headers)
        frappe.log_error(response, "MTIBA  RESPONSE /mtiba/mtiba.py")
        dictionary_response = json.loads(response.text)
        frappe.log_error({
            "url": self._get_treatment_infortion_url,
            "headers": headers,
            "payload": treatmentcode,
            "response": dictionary_response
        },
            "MTIBA  TREATMENT INFO API /mtiba/mtiba.py")
        return dictionary_response

    def reserve_item_bill(self, data):
        """
        TREATMENT OPENED NOTIFICATION API

        RESERVE ITEM BILL API

        Request
        POST https://{baseIntegrationUrl}/invoices/v1/reserveItemBill
        Content-Type: application/json
        Authorization: Bearer {accessToken}
        {
        "treatmentCode": "ABC01234",
        "externalInvoiceNumber": "EXT-001",
        "dateCreated": "2020-12-12",
        "invoiceItem": {
        "code": "C001",
        "description": "Consultation",
        "price": {
        "currency": "KES",
        "amount": 1000
        },
        "quantity": 1,
        "category": "Lab",
        "status": "SUBMITTED",
        "externalCode": "C001",
        "itemCode": "trx-20201212-001",
        "reservationAmount": {
        "currency": "KES",
        "amount": 900
        },
        "dateCreated": "2020-12-12"
        }
        }
        """
        try:
            # if self.getSystemStatus():
            self._reserve_item_bill_url = "{}/invoices/v1/reserveItemBill".format(
                self._baseIntegrationUrl)
            response = requests.post(
                self._reserve_item_bill_url, headers=self._addHeaders(), data=data)
            dictionary_response = json.loads(response.text)
            frappe.log_error(dictionary_response,
                             "MTIBA ONLINE STATUS  /mtiba/mtiba.py")
            return dictionary_response
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "MTIBA RESERVE ITEM BILL ERROR  /mtiba/mtiba.py")
            return e

    def reserve_bulk_items(self, data):
        """
        RESERVE BULK ITEMS API
        """
        try:

            # if self.getSystemStatus():

            self._reserve_bulk_items_url = "{}/invoices/v1/bulkReserveItemBill".format(
                self._baseIntegrationUrl)

            json_data = json.dumps(data)

            response = requests.post(
                self._reserve_bulk_items_url, headers=self._addHeaders(), data=json_data)

            dictionary_response = json.loads(response.text)

            frappe.log_error(dictionary_response,
                             "MTIBA  RESERVE BULK ITEMS /mtiba/mtiba.py")

            print(dictionary_response, "dictionary_response")

            return dictionary_response
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "MTIBA RESERVE BULK ITEMS ERROR  /mtiba/mtiba.py")
            return e

    def create_token(self):
        """
        CREATE TOKEN API
        """
        return self._getAuthToken()

    def submitSingleInvoice(self, treatmentCode, data):
        """
        SUBMIT INVOICE API
        """
        try:
            print(data, treatmentCode)

            json_data = json.dumps(data)

            # if self.getSystemStatus():
            self._submit_invoice_url = f"{self._baseIntegrationUrl}/invoices/{treatmentCode}?action=Submit"
            response = requests.post(
                self._submit_invoice_url, headers=self._addHeaders(), data=json_data)
            print(response.text)
            dictionary_response = json.loads(response.text)
            frappe.log_error(dictionary_response,
                             "MTIBA  SUBMIT INVOICE API /mtiba/mtiba.py")
            print(dictionary_response)
            return dictionary_response

        except Exception as e:
            print(e)
            frappe.log_error(e, "MTIBA SUBMIT INVOICE ERROR  /mtiba/mtiba.py")
            return e

    def submitPaymentDetails(self, data):
        """
        POST https://{baseIntegrationUrl}/invoices/v1/submitPaymentDetails
        Content-Type: application/json
        Authorization: Bearer {accessToken}
       {
            "payments":[
            {
            "type":"Benefit",
            "total":{
            "currency":"KES",
            "amount":10000
            },
            {
            "type":"Cash",
            "total":{
            "currency":"KES",
            "amount":0
            }
            }
            ],
            "treatmentCode":"ABC01234"
            }
        """
        # if self.getSystemStatus():
        json_data = json.dumps(data)
        self._submit_multiple_invoices_url = f"{self._baseIntegrationUrl}/invoices/v1/submitPaymentDetails"
        response = requests.post(
            self._submit_multiple_invoices_url, headers=self._addHeaders(), data=json_data)
        dictionary_response = json.loads(response.text)
        frappe.log_error(dictionary_response,
                         "MTIBA  PAYMENT API /mtiba/mtiba.py")

        return dictionary_response

    def submitMedicalDetails(self, data):
        """
        POST https://{baseIntegrationUrl}/invoices/v1/submitMedicalDetails
        Content-Type: application/json
        Authorization: Bearer {accessToken}
        {
        "treatmentCode": "ABC01234",
        "diagnosis": [
        {
        "scheme": "SCM001",
        "code": "Z02.9",
        "description": "Encounter for administrative
        examinations, unspecified"
        },
        {
        "scheme": "SCM001",
        "code": "Z02",
        "description": "Encounter for administrative
        examination"
        }
        ],
        "notes": "Medical notes",
        "closeEncounter": false
        }
        """
        # if self.getSystemStatus():
        json_data = json.dumps(data)
        self._submit_multiple_invoices_url = f"{self._baseIntegrationUrl}/invoices/v1/submitMedicalDetails"
        response = requests.post(
            self._submit_multiple_invoices_url, headers=self._addHeaders(), data=json_data)
        dictionary_response = json.loads(response.text)
        frappe.log_error(dictionary_response,
                         "MTIBA  MEDICAL PAYMENT API /mtiba/mtiba.py")
        return dictionary_response
