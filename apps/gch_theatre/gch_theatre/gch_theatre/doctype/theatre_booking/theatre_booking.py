import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now, add_to_date
from gch_common.utils.emailing import get_emails_from_group
from gch_common.utils.hosts import get_host_url


class TheatreBooking(Document):
    def validate(self):
        self.validate_surgery_time()
        self.validate_contact_phone()
        self.check_patient_name()
        self.send_confirmation_message()
        self.check_finance_confirmation_timelimit()
        self.check_submit_confirmation()

    def check_submit_confirmation(self):
        if self.docstatus == 1:
            if not self.is_finance_team_confirmed:
                frappe.throw(_("Cannot submit booking until finance team confirms."))

    def validate_surgery_time(self):
        """Ensure surgery times are in the future.

        Cannot make a booking in the past.
        """
        if self.surgery_start_time and (
            self.surgery_start_time < now() or self.surgery_end_time < now()
        ):
            frappe.throw(_("Surgery Start and End Time should be in the future."))

    # def validate_contact_phone(self):
    #     """Validates Contact Phone."""
    #     contact_phone_numbers = self.contact_phone
    #     if not contact_phone_numbers:
    #         frappe.throw(_("Contact Phone is required."))
    #     phone_numbers_list = [
    #         num.strip() for num in re.split(r"[\n,]+", contact_phone_numbers)
    #     ]
    #     print(phone_numbers_list)
    #     if not phone_numbers_list or len(phone_numbers_list) < 1:
    #         frappe.throw(_("Contact Phone is required."))

    # def format_contact_phone(self) -> list:
    #     self.validate_contact_phone()
    #     phone_numbers =  [
    #         num.strip() for num in re.split(r"[\n,]+", self.contact_phone)
    #     ]
    #     return phone_numbers

    def validate_contact_phone(self):
        """Validates Contact Phone."""
        contact_phone_numbers = self.contact_phone
        if not contact_phone_numbers:
            frappe.throw(_("Contact Phone is required."))

        phone_numbers_list = [
            num.strip() for num in re.split(r"[\n,\t;|]+", contact_phone_numbers)
        ]

        if not phone_numbers_list or len(phone_numbers_list) < 1:
            frappe.throw(_("Contact Phone is required."))

    def format_contact_phone(self) -> list:
        self.validate_contact_phone()
        phone_numbers = [
            num.strip() for num in re.split(r"[\n,\t;|]+", self.contact_phone)
        ]
        return phone_numbers

    def check_patient_name(self):
        """Ensure patient_name is populated."""
        if self.patient and not self.patient_name:
            patient = frappe.get_doc("Patient", self.patient)
            self.patient_name = patient.name

    def send_confirmation_message(self):
        """Util to send confirmation messages on Booking status changes/updates."""
        if not self.is_new():
            old_doc = self.get_doc_before_save()
            old_surgery_start_time = old_doc.surgery_start_time
            old_surgery_end_time = old_doc.surgery_end_time
            start_time_changed = str(old_surgery_start_time) != str(
                self.surgery_start_time
            )
            end_time_changed = str(old_surgery_end_time) != str(self.surgery_end_time)
            print("Preparing to send confirmation SMS")

            if self.has_value_changed("is_patient_confirmed"):
                if self.is_patient_confirmed:
                    if not self.patient_dob:
                        frappe.throw("Patient DOB needs to be input.")
                    if not self.is_finance_team_confirmed:
                        print("Sending patient confirmed, not finance confirmed")
                        self.send_sms_to_patient(
                            f"Dear {self.patient_name or 'Patient'}, thank you for confirming your theatre booking for {self.surgery_start_time}. We are awaiting confirmation from our finance team. Please find the relevant info on https://www.gerties.org/services/day-surgery/"
                        )
                    elif self.is_finance_team_confirmed:
                        print("sending finance confirmed")
                        self.send_sms_to_patient(
                            f"Dear {self.patient_name or 'Patient'}, you have re-confirmed your theatre booking for {self.surgery_start_time}. Please contact us for further assistance."
                        )
                        self.send_patient_confirmation()
                elif not self.is_patient_confirmed and self.is_finance_team_confirmed:
                    """Patient has most likely cancelled their booking."""
                    self.send_sms_to_patient(
                        f"Dear {self.patient_name or 'Patient'}, you have cancelled your theatre booking for {self.surgery_start_time}. Please contact us for further assistance."
                    )
                    self.cancel_doc()

            if self.has_value_changed("is_finance_team_confirmed"):
                print("Fiance team changed.")
                if (
                    self.finance_team_status == "Approved"
                    and self.is_finance_team_confirmed
                ):
                    print("Finance Approved, sending...")
                    self.send_sms_to_patient(
                        f"Dear {self.patient_name or 'Patient'}, your theatre booking for {self.surgery_start_time} has been confirmed. Please find the relevant info on https://www.gerties.org/services/day-surgery/"
                    )
                else:
                    self.send_sms_to_patient(
                        f"Dear {self.patient_name or 'Patient'}, your theatre booking for {self.surgery_start_time} has been updated. Finance Team Status: Rejected. Comments: {self.finance_comments or 'Finance Team Rejected'}"
                    )
            if not self.has_value_changed(
                "is_finance_team_confirmed"
            ) and self.has_value_changed("finance_team_status"):
                if self.finance_team_status == "Rejected":
                    self.send_sms_to_patient(
                        f"Dear {self.patient_name or 'Patient'}, your theatre booking scheduled for {self.surgery_start_time} has been put on hold by our finance team. Comments: {self.finance_comments or None}. Feel free to contact us on."
                    )
                if self.finance_team_status == "Approved":
                    self.send_sms_to_patient(
                        f"Dear {self.patient_name or 'Patient'}, your theatre booking for {self.surgery_start_time} has been confirmed. Please find the relevant info on https://www.gerties.org/services/day-surgery/"
                    )
                    self.send_patient_confirmation()
            if start_time_changed or end_time_changed:
                self.send_sms_to_patient(
                    f"Dear {self.patient_name or 'Patient'}, your theatre booking has been rescheduled. Starts: {self.surgery_start_time} and ends at {self.surgery_end_time}. Please find the relevant info on https://www.gerties.org/services/day-surgery/"
                )
            if self.has_value_changed("is_surgeon_confirmed"):
                if not self.is_surgeon_confirmed:
                    self.send_sms_to_patient(
                        f"Dear {self.patient_name or 'Patient'}, your theatre booking slotted for {self.surgery_start_time} has been cancelled due to unavailability of the surgeon. Feel free to contact us on."
                    )
            if self.has_value_changed("patient_education"):
                self.send_sms_to_patient(
                    f"Regarding your theatre booking for {self.surgery_start_time}, here is some important info: {self.patient_education}"
                )

    def send_patient_confirmation(self):
        self.send_confirmation_email()
        if self.patient_education and self.patient_education != "":
            self.send_sms_to_patient(
                f"Regarding your theatre booking for {self.surgery_start_time}, here is some important info: {self.patient_education}"
            )

    def send_confirmation_email(self):
        subject = _("Patient Confirmation")
        message = f"""
            Hello, \n\n

            The patient {self.patient_name} has confirmed their booking for {self.surgery_start_time}.\n\n

            You can check all confirmed bookings for tomorrow on https://www.gerties.org/app/theatre-bookings\n\n


            Regards,\n\n


            The eGerties Team
        """
        self.send_email(
            subject=subject,
            message=message,
            recipients="eGerties Theatre Mail Group",
            is_group=True,
        )

    def send_email(self, subject="", message="", recipients=None, is_group=False):
        email_subject = "Patient Confirmation"
        recipient_emails = []
        if recipients and is_group:
            recipient_emails = get_emails_from_group(group_name=recipients)
        else:
            recipient_emails = recipients
        host = get_host_url()

        email_content = f"""
            Hello, \n\n\n

            The patient {self.patient_name} has confirmed their booking for {self.surgery_start_time}.\n\n\n
            
            You can check all confirmed bookings for tomorrow on https://{host}/app/theatre-bookings

            Regards, \n\n\n


            The eGerties Team			
        """

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

    def send_sms_to_patient(self, message):
        # from gch_messaging.utils.core import messaging
        from gch_theatre.tasks.main import gch_theatre_tasks

        # recipient = self.patient_name or "Patient"
        # msg = message
        # print("CONTACTS", self.format_contact_phone())
        # sent, resp = messaging.send_bulk_sms(recipients=self.format_contact_phone(), message=msg)
        # print(sent, resp)
        recipient = self.patient_name or "Patient"
        msg = message
        phone_numbers = self.format_contact_phone()
        print("CONTACTS", phone_numbers)

        # Enqueue the send_sms_job function as a background job
        gch_theatre_tasks.enqueue_send_booking_sms(doc=self, event=None, message=msg)
        # "gch_theatre.tasks.gch_theatre_tasks.", doc=self, queue='short', timeout=600, job_name='send_sms', phone_numbers=phone_numbers, message=msg)

    def send_sms_job(self, phone_numbers, message):

        from gch_messaging.utils.core import messaging
        sent, resp = messaging.send_bulk_sms(recipients=self.format_contact_phone(), message=message)
        print(sent, resp)

    def check_finance_confirmation_timelimit(self):
        if (
            self.has_value_changed("is_patient_confirmed")
            and self.is_patient_confirmed
            and not self.is_finance_team_confirmed
        ):
            print("Adding to job queue")
            two_hours_later = add_to_date(now(), minutes=2)
            self.enqueue_email_to_finance(two_hours_later)

    def enqueue_email_to_finance(self, time):
        from frappe import enqueue

        ...

        # enqueue(
        #     method=self.send_email_to_finance_team,
        #     queue="short",
        #     timeout=300,
        #     event="send_email_to_finance",
        #     when=time,
        # )

    def send_email_to_finance_team(self):
        subject = "Patient Confirmation Awaited"
        message = f"""
            Hello Finance Team,\n\n


            A patient booking for {self.surgery_start_time} is awaiting confirmation from your team.\n\n


            Please review and confirm the booking at your earliest convenience.\n\n


            Regards,\n\n


            The eGerties Team
        """
        self.send_email(
            subject=subject,
            message=message,
            recipients="eGerties Theatre Mail Group",
            is_group=True,
        )

    def cancel_doc(self):
        self.docstatus = 2
        self.db_update()
        self.reload()
