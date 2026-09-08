import frappe

from gch_common.utils.emailing import get_emails_from_group
from gch_common.utils.hosts import get_host_url


def send_confirmed_bookings_email():
    """
    Send Confirmed Theatre Bookings Email at 5PM

    """
    host = frappe.utils.get_url()
    email_content = f"""
            Hello, \n\n\n

            The confirmed Theatre Booking list for tomorrow is now out.
            
            You can check all confirmed bookings for tomorrow on https://{host}/app/theatre-bookings

            Regards, \n\n\n


            The eGerties Team			
        """
    recipient_emails = get_emails_from_group(group_name="eGerties Theatre Mail Group")
    subject = "Confirmed Theatre Bookings"
    email_args = {
        "recipients": recipient_emails,
        "subject": subject,
        "message": email_content,
        # "attachments": [frappe.attach_print(doctype, name, file_name=name)],
    }
    frappe.enqueue(
        method=frappe.sendmail,
        queue="short",
        is_async=True,
        timeout=300,
        **email_args,
    )

def send_email(subject="", message="", recipients=None, is_group=False):
    email_subject = "Patient Confirmation"
    recipient_emails = []
    if recipients and is_group:
        recipient_emails = get_emails_from_group(group_name=recipients)
    else:
        recipient_emails = recipients
    host = get_host_url()

    email_args = {
        "recipients": recipient_emails,
        "subject": subject or email_subject,
        "message": message,
        # "attachments": [frappe.attach_print(self.doctype, self.name, file_name=self.name)],
    }

    frappe.enqueue(
        method=frappe.sendmail,
        queue="short",
        is_async=True,
        timeout=300,
        **email_args,
    )
