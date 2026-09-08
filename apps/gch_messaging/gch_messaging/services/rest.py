from typing import Dict, Tuple
import frappe
from frappe import _
from gch_messaging.tasks import messaging_tasks as tasks
from gch_messaging.utils.core import messaging


class MessagingAPI:
    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def send_sms(recipient: str, message: str) -> Dict:
        """
        Send SMS to phone number `recipient`.

        Triggers a background task to handle the
        """
        # response = enqueue('gch_messaging.utils.send_sms', message=message, recipient=recipient)
        valid, phone_number = messaging.validate_phone(recipient)
        if not valid:
            return {"sent":False, "message": _(f"Invalid phone number {recipient}") }
        
        response = tasks.enqueue_send_sms(message=message, recipient=recipient)
        return {"sent": True, "task_id": response.id, "data": response.kwargs.get('kwargs')}

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def send_email(to: str, message: str) -> Tuple[bool, Dict]:
        """
        Send Email to email address `to`
        """
        sent, response = messaging.send_email(message=message, to=to)

        return sent, response


messaging_api = MessagingAPI()
