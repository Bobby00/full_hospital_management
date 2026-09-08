
from typing import Any
import requests
from requests.models import Response, parse_url
import frappe

# from decouple import config
from decimal import Decimal


class ABSA_PDQ:
    def __init__(
        self,
        defualt_port: int,
        teller_id: int,
        Ip_Address: str
    ) -> None:
        self.DEFAULT_PORT = defualt_port
        self.TELLER_ID = teller_id
        self.IP_ADDRESS = Ip_Address

    def _check_status(self):
        """ Checks the status of the PDQ device """

        try:
            headers = {"Content-Type": "application/json", "Accept": "*/*"}
            response = requests.get(
                f"http://{self.IP_ADDRESS}:{self.DEFAULT_PORT}/api/echo", headers=headers)

            json_response = response.json()
            ResultCodeKey = 'rspCode'
            if ResultCodeKey in json_response:
                if(json_response[ResultCodeKey] == "800"):
                    return True
                else:
                    return False
            else:
                return False
        except Exception as e:
            frappe.log_error(e, "PINPAD CHECK STATUS ERROR  /absa_pdq.py")
            return False

# Sale

    def sale(self, amount: int, tran_key: str):
        """ Sends payment request to PDQ"""

        """ Check device status """
        isOnline = self._check_status()

        if(isOnline):

            headers = {"Content-Type": "application/json", "Accept": "*/*"}
            body = {
                "amount": amount,
                "tellerId": str(self.TELLER_ID),
                "tranKey": tran_key
            }

            try:
                response = requests.post(
                    f"http://{self.IP_ADDRESS}:{self.DEFAULT_PORT}/api/sale", headers=headers, json=body)
                json_response = response.json()
                return json_response
            except Exception as e:
                frappe.log_error(e, "PINPAD SALE ERROR  /absa_pdq.py")
                return
        else:
            print("Device Offline")
            return

# Refund
# TODO

    def refund(self, Ip_Address: str, amount: int, tran_key: str):
        """ Sends Refund request to PDQ"""

        """ Check device status """
        isOnline = self._check_status(Ip_Address)

        if(isOnline):

            headers = {"Content-Type": "application/json", "Accept": "*/*"}
            body = {
                "amount": amount,
                "tellerId": str(self.TELLER_ID),
                "tranKey": tran_key
            }

            try:
                response = requests.post(
                    f"http://{self.IP_ADDRESS}:{self.DEFAULT_PORT}/api/refund", headers=headers, json=body)
                json_response = response.json()
                return json_response
            except Exception as e:
                frappe.log_error(e, "PINPAD REFUND ERROR  /absa_pdq.py")
                return


# AUTH
# TODO

    def auth(self, Ip_Address: str, amount: int, tran_key: str):
        """ Sends payment request to PDQ"""

        """ Check device status """
        isOnline = self._check_status(Ip_Address)

        if(isOnline):

            headers = {"Content-Type": "application/json", "Accept": "*/*"}
            body = {
                "amount": amount,
                "tellerId": str(self.TELLER_ID),
                "tranKey": tran_key
            }
            print(body)
            try:
                response = requests.post(
                    f"http://{self.IP_ADDRESS}:{self.DEFAULT_PORT}/api/auth", headers=headers, json=body)
                json_response = response.json()
                return json_response
            except Exception as e:
                frappe.log_error(e, "PINPAD AUTH ERROR  /absa_pdq.py")
                return

    def complete(self, Ip_Address: str, amount: int, tran_key: str):
        """ Sends payment request to PDQ"""

        """ Check device status """
        isOnline = self._check_status(Ip_Address)

        if(isOnline):

            headers = {"Content-Type": "application/json", "Accept": "*/*"}
            body = {
                "amount": amount,
                "tellerId": str(self.TELLER_ID),
                "tranKey": tran_key
            }

            try:
                response = requests.post(
                    f"http://{self.IP_ADDRESS}:{self.DEFAULT_PORT}/api/complete", headers=headers, json=body)
                json_response = response.json()
                return json_response
            except Exception as e:
                frappe.log_error(e, "PINPAD COMPLETE ERROR  /absa_pdq.py")
                return

    def reversal(self, Ip_Address: str, amount: int, tran_key: str):
        """ Sends payment request to PDQ"""

        """ Check device status """
        isOnline = self._check_status(Ip_Address)

        if(isOnline):

            headers = {"Content-Type": "application/json", "Accept": "*/*"}
            body = {
                "amount": amount,
                "tellerId": str(self.TELLER_ID),
                "tranKey": tran_key
            }

            try:
                response = requests.post(
                    f"http://{self.IP_ADDRESS}:{self.DEFAULT_PORT}/api/reverse", headers=headers, json=body)
                json_response = response.json()
                return json_response
            except Exception as e:
                frappe.log_error(e, "PINPAD REVERSAL ERROR  /absa_pdq.py")
                return

    def cutover(self, Ip_Address: str, amount: int, tran_key: str):
        """ Sends payment request to PDQ"""

        """ Check device status """
        isOnline = self._check_status(Ip_Address)

        if(isOnline):

            headers = {"Content-Type": "application/json", "Accept": "*/*"}
            body = {
                "amount": amount,
                "tellerId": str(self.TELLER_ID),
                "tranKey": tran_key
            }

            try:
                response = requests.post(
                    f"http://{self.IP_ADDRESS}:{self.DEFAULT_PORT}/api/cutover", headers=headers, json=body)
                json_response = response.json()
                return json_response
            except Exception as e:
                frappe.log_error(e, "PINPAD CUTOVER ERROR  /absa_pdq.py")
                return

    def balance(self, tran_key: str):
        """ Get Balance"""

        """ Check device status """
        isOnline = self._check_status()

        if(isOnline):

            headers = {"Content-Type": "application/json", "Accept": "*/*"}
            tranKey = tran_key
            body = {
                "tranKey": tranKey
            }

            try:
                response = requests.post(
                    f"http://{self.IP_ADDRESS}:{self.DEFAULT_PORT}/api/balance", headers=headers, json=body)
                json_response = response.json()
                print(json_response)
                return json_response
            except Exception as e:
                frappe.log_error(e, "PINPAD BALANCE ERROR  /absa_pdq.py")
                return


# Card Read/Update

    def cardreadupdate(self, Ip_Address: str, amount: int, tran_key: str):
        """ Sends payment request to PDQ"""

        """ Check device status """
        isOnline = self._check_status(Ip_Address)

        if(isOnline):

            headers = {"Content-Type": "application/json", "Accept": "*/*"}
            body = {
                "amount": amount,
                "tellerId": str(self.TELLER_ID),
                "tranKey": tran_key
            }
            print(body)
            try:
                response = requests.post(
                    f"http://{self.IP_ADDRESS}:{self.DEFAULT_PORT}/api/cardreadupdate", headers=headers, json=body)
                json_response = response.json()
                return json_response
            except Exception as e:
                frappe.log_error(
                    e, "PINPAD CARD READ UPDATE ERROR  /absa_pdq.py")
                return


# Batches Query

    def batch_query(self):
        """ Check Batches """

        """ Check device status """
        isOnline = self._check_status()

        if(isOnline):

            headers = {"Content-Type": "application/json", "Accept": "*/*"}
            try:
                response = requests.get(
                    f"http://{self.IP_ADDRESS}:{self.DEFAULT_PORT}/api/batches", headers=headers)
                json_response = response.json()
                print(json_response)
                return json_response
            except Exception as e:
                frappe.log_error(e, "PINPAD BATCH QUERY ERROR  /absa_pdq.py")
                return


# Batch Transaction Details Query

    def batch_transaction_details(self, batch_no: int):
        """ Query single Batch"""

        """ Check device status """
        isOnline = self._check_status()

        if(isOnline):

            headers = {"Content-Type": "application/json", "Accept": "*/*"}
            batchNr = str(batch_no)
            try:
                response = requests.get(
                    f"http://{self.IP_ADDRESS}:{self.DEFAULT_PORT}/api/batches/{batchNr}", headers=headers)
                json_response = response.json()
                print(json_response)
                return json_response
            except Exception as e:
                frappe.log_error(e, "PINPAD BATCH TRANS ERROR  /absa_pdq.py")
                return

# Transaction Query

    def transaction_query(self, tran_key: str):
        """ Checks the status of a transaction """

        """ Check device status """
        isOnline = self._check_status()

        if(isOnline):

            headers = {"Content-Type": "application/json", "Accept": "*/*"}
            try:
                response = requests.get(
                    f"http://{self.IP_ADDRESS}:{self.DEFAULT_PORT}/api/transactions/{tran_key}", headers=headers)
                json_response = response.json()
                print(json_response)
                return json_response
            except Exception as e:
                frappe.log_error(e, "PINPAD TRANS QUERY ERROR  /absa_pdq.py")
                return


# Status

    def status(self):
        """ Checks the status of the Device """

        """ Check device status """
        isOnline = self._check_status()

        if(isOnline):

            headers = {"Content-Type": "application/json", "Accept": "*/*"}
            try:
                response = requests.get(
                    f"http://{self.IP_ADDRESS}:{self.DEFAULT_PORT}/api/status", headers=headers)
                json_response = response.json()
                print(json_response)
                return json_response
            except Exception as e:
                frappe.log_error(e, "PINPAD STATUS ERROR  /absa_pdq.py")
                return

            # ResultCodeKey = 'rspCode'
            # if ResultCodeKey in json_response:
            #     if(json_response[ResultCodeKey]== "000"):
            #         print("PAYMENT DONE")
            #     else:
            #         print("PAYMENT NOOOOOOOOTTTTT DONE")
            # else:
            #     print("SOMETHING WENT WRONG")


# absa=ABSA_PDQ(9991,54321,"192.168.12.238")
# absa=ABSA_PDQ(9991,54321,"0.0.0.0")
# x = absa._check_status()
# print(x)

# absa._check_status("0.0.0.0")
# tran_key=str(uuid.uuid4().hex)
# absa.sale(100,tran_key)
# absa.transaction_query("4e7eeefaff614f05adada282af099292")
# absa.status()
# absa.batch_query()
# absa.batch_transaction_details(3)
# absa.balance(tran_key)
