import frappe
from gch_messaging.utils.core import messaging


def send_sms_job(doc, event=None, **kwargs):
    print("Kwa JOB:", kwargs)

    sent, resp = messaging.send_bulk_sms(
        recipients=doc.format_contact_phone(), message=kwargs.get("message")
    )
    print(sent, resp)
