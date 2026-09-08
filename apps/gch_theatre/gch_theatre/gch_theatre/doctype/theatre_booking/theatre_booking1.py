# Copyright (c) 2023, eGerties Developers and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now
from gch_common.utils.emailing import get_emails_from_group
from gch_common.utils.hosts import get_host_url


class TheatreBooking(Document):
    def validate(self):
        # Surgery Time should be in the future
        if self.patient and not self.patient_name:
            patient = frappe.get_doc("Patient", self.patient)
            self.patient_name = patient.name
        if self.surgery_start_time:
            if self.surgery_start_time < now() or self.surgery_end_time < now():
                frappe.throw("Surgery Start and End Time should be in the future.")

        if not self.patient_phone:
            frappe.throw("Patient Phone is required.")

        patient_confirmation_changed = self.has_value_changed("is_patient_confirmed")
        finance_confirmation_changed = self.has_value_changed(
            "is_finance_team_confirmed"
        )
        starting_time_changed = self.has_value_changed("surgery_start_time")
        ending_time_changed = self.has_value_changed("surgery_end_time")
        if not self.surgery_start_time:
            frappe.throw("Surgery Start Time must be set")
        if patient_confirmation_changed and self.is_patient_confirmed and not self.is_finance_team_confirmed:
            recipient = self.patient_name if self.patient_name else "Patient"
            msg = f"Dear {recipient}, thank you for confirming your theatre booking for {self.surgery_start_time}. We are awaiting confirmation from our finance team. Please find the relevant info on https://www.gerties.org/services/day-surgery/"
            self.send_sms(message=msg)

        if (
            patient_confirmation_changed
            and self.is_patient_confirmed
            and finance_confirmation_changed
            and self.is_finance_team_confirmed
        ):
            print(self.patient_dob)
            if not self.patient_dob:
                frappe.throw("Patient DOB needs to be input")
            self.send_email(
                subject="Patient Confirmation",
                recipients="eGerties Theatre Mail Group",
                is_group=True,
            )
            self.send_sms()
            instruction_message = self.patient_education
            if instruction_message:
                self.send_sms(message=instruction_message)

            # self.send_sms()
        if self.is_patient_confirmed and (starting_time_changed or ending_time_changed):
            if not self.patient_dob or self.patient_dob == "":
                frappe.throw("Patient DOB needs to be input")
            self.send_email(
                subject="Patient Confirmation",
                recipients="eGerties Theatre Mail Group",
                is_group=True,
            )
            self.send_sms()
            instruction_message = self.patient_education
            if instruction_message:
                self.send_sms(message=instruction_message)

        if self.surgeon_name:
            self.title = f"{self.patient_name} with {self.surgeon_name}"

    def send_email(self, subject="", recipients=None, is_group=False):
        # Compose and send the email
        email_subject = "Patient Confirmation"
        recipient_emails = []
        if recipients and is_group:
            recipient_emails = get_emails_from_group(group_name=recipients)
        else:
            recipient_emails = recipients
        host = frappe.utils.get_url()
        # email_content Should be multiline

        email_content = f"""
			Hello, \n\n\n

            The patient {self.patient_name} has confirmed their booking for {self.surgery_start_time}.\n\n\n
            
            You can check all confirmed bookings for tomorrow on https://{host}/app/theatre-bookings

            Regards, \n\n\n


            The eGerties Team			
		"""

        email_args = {
            "recipients": recipient_emails,  # Replace with actual recipient's email address
            "subject": subject or email_subject,
            "message": email_content,
            # "attachments": [frappe.attach_print(self.doctype, self.name, file_name=self.name)],
        }

        frappe.enqueue(
            method=frappe.sendmail,
            queue="short",
            is_async=True,
            timeout=300,
            **email_args,
        )

    def send_sms(self, message=None):
        from gch_messaging.utils.core import messaging

        recipient = self.patient_name if self.patient_name else "Patient"
        msg = (
            message
            if message
            else f"Dear {recipient}, thank you for confirming your theatre booking for {self.surgery_start_time}. Please find the relevant info on https://www.gerties.org/services/day-surgery/"
        )
        sent, resp = messaging.send_sms(recipient=self.patient_phone, message=msg)
        print(sent, resp)
