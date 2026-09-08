from typing import Any, Tuple

import frappe
import phonenumbers
import requests
from decouple import config
from gch_messaging.utils.constants import MessagingConstants
import time
from frappe.utils.background_jobs import enqueue


class GCHMessaging:
    def __init__(self) -> None:
        self._SMS_URL = config("ADVANTA_SMS_URL")
        self.ADVANTA_SMS_USER = config("ADVANTA_SMS_USER")
        self.ADVANTA_SMS_PASSWORD = config("ADVANTA_SMS_PASSWORD")
        self.ADVANTA_HEADERS = MessagingConstants.BROWSER_HEADERS

    def _build_advanta_sms_payload(self, phone_number: str, message: str) -> str:
        """
        Builds the AdvantaSMS URL structure
        """
        return self._SMS_URL.format(
            username=self.ADVANTA_SMS_USER,
            password=self.ADVANTA_SMS_PASSWORD,
            phone_number=phone_number,
            message=message,
        ).replace(" ", "+")

    def validate_phone(self, phone_number: str) -> Tuple[bool, str]:
        """
        Validate a phone number given a string representation of the same
        """
        if not phone_number.startswith("254") or phone_number.startswith("0"):
            phone_number = "254" + phone_number[0:]
        try:
            phone = f"+{str(int(phone_number)).replace(' ', '')}"
            x = phonenumbers.parse(phone, None)
        except Exception as e:
            return False, phone_number
        if not phonenumbers.is_valid_number(x):
            return False, phone_number
        return True, phone_number

    def _send_via_advanta(self, phone_number: str, message: str) -> Tuple[bool, Any]:
        """
        Advanta SMS Handler
        """
        # Hey Shalom i have overwriten this function to send sms via advanta class in the services folder

        # URL = self._build_advanta_sms_payload(
        #     phone_number=phone_number, message=message
        # )
        try:

            from gch_messaging.services.Advanta.main import AdvantaService
            advanta_service = AdvantaService()
            result = advanta_service.send_sms(
                message=message, recipient=phone_number)
            if result:
                print("SMS sent successfully")
                return True, "SMS Sent Successfully"
            return False, "Failed to send SMS"

            # r = requests.get(URL, headers=self.ADVANTA_HEADERS)
        except Exception as e:
            print(e)
            return False, "Failed to send SMS"
        print(r.text)
        return True, r.text

    def send_bulk_sms(self, message, recipients: list, via: str=MessagingConstants.ADVANTA):
        if len(recipients ) < 1:
            return 
        print("RECIPIENTS", recipients)
        responses = [self.send_sms(message=message, recipient=recipient, via=via) for recipient in recipients]
        print("RESPONSES",responses)
        return True, "Sent Bulk SMS"
        ...
    def send_sms(
        self, message: str, recipient: str, via: str = MessagingConstants.ADVANTA
    ) -> Any:
        """
        Utility to send SMS
        """
        print("TO VALIDATE", recipient)
        valid, phone_number = self.validate_phone(phone_number=recipient)
        print(valid, phone_number)
        if not valid:
            return valid, f"{phone_number} is invalid. Please use a valid phone number, beginning with a country code, e.g 254712345678"
        if via == MessagingConstants.ADVANTA:
            sent, response = self._send_via_advanta(
                phone_number=phone_number, message=message
            )
        return sent, response

    def send_email(self, message, to,):
        """
        Utility to facilitate sending of emails"""
        try:
            email_args = {
                "recipients": [to],
                "message": message,
                "subject": f"Confirmation of Theatre Booking",
            }
            enqueue(
                method=frappe.sendmail,
                queue="short",
                is_async=True,
                timeout=300,
                **email_args,
            )
        except Exception as e:
            return False, "Error sending email. Please try again later."
        return True, "Email sent successfully"

messaging = GCHMessaging()
