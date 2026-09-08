import json
import re

import frappe
from erpnext.healthcare.doctype.patient_appointment.patient_appointment import (
	PatientAppointment, invoice_appointment)
from frappe import _
from gch_messaging.utils.core import messaging
import datetime


def cleanNumber(x):
	num = str(x)
	cleanNum = num
	b = re.search("^254", num)
	if b:
		z = re.split("^254", num)
		cleanNum = z[1]

	a = re.search("^0", num)
	if a:
		x = re.split("^0", num)
		cleanNum = x[1]
	return cleanNum


class GCHPatientAppointment(PatientAppointment):
	def validate(self):
		self.validate_overlaps()
		self.validate_service_unit()
		self.set_appointment_datetime()
		self.validate_customer_created()
		self.set_status()
		self.set_title()

	def after_insert(self):
		self.update_prescription_details()
		self.set_payment_details()
		invoice_appointment(self)
		self.update_fee_validity()
		send_confirmation_msg(self)
		...

	# Overriding title method to include patients not saved on the system
	def set_title(self):
		self.title = _('{0} with {1}').format(self.patient_name or self.patient or self.patient_names,
			self.practitioner_name or self.practitioner)


def send_confirmation_msg(doc):
	if frappe.db.get_single_value(
		"Healthcare Settings", "send_appointment_confirmation"
	):
		message = frappe.db.get_single_value(
			"Healthcare Settings", "appointment_confirmation_msg"
		)
		try:
			send_message(doc, message)
		except Exception:
			frappe.log_error(
				frappe.get_traceback(), _("Appointment Confirmation Message Not Sent")
			)
			frappe.msgprint(
				_("Appointment Confirmation Message Not Sent"), indicator="orange"
			)


def send_message(doc, message):
	patient_mobile = frappe.db.get_value("Patient", doc.patient, "mobile")
	branch_phones = frappe.db.get_value("Branch", doc.branch, "phone_numbers")
	context = {"doc": doc, "alert": doc, "comments": None, "phones": branch_phones}
	if doc.get("_comments"):
		context["comments"] = json.loads(doc.get("_comments"))
	# jinja to string convertion happens here
	message = frappe.render_template(message, context)

	if patient_mobile:

		number = patient_mobile
	else:
		number = doc.appointment_phone if doc.appointment_phone else None
	try:
		if number:
			sent, resp = messaging.send_sms(
				recipient="254" + cleanNumber(number), message=message
			)
			...
			print(sent, resp)
		# send_sms(number, message)
	except Exception as e:
		print(e)
		frappe.msgprint(_("SMS not sent, please check SMS Settings"), alert=True)


def send_patient_appointment_reminder():
	print("Sending Appointment Reminders")
	if frappe.db.get_single_value("Healthcare Settings", "send_appointment_reminder"):
		remind_b4_timedelta = frappe.db.get_single_value("Healthcare Settings", "remind_before")
		remind_before_str = str(remind_b4_timedelta)
		time_components  = remind_before_str.split(".")
		time_components = time_components[0]
		remind_before = datetime.datetime.strptime(
			time_components,
			"%H:%M:%S",
		).time()
		reminder_dt = datetime.datetime.now() + datetime.timedelta(
			hours=remind_before.hour,
			minutes=remind_before.minute,
			seconds=remind_before.second,
		)

		appointment_list = frappe.db.get_all(
			"Patient Appointment",
			{
				"appointment_datetime": [
					"between",
					(datetime.datetime.now(), reminder_dt),
				],
				"reminded": 0,
				"status": ["!=", "Cancelled"],
			},
		)
		print(appointment_list)
		for appointment in appointment_list:
			doc = frappe.get_doc("Patient Appointment", appointment.name)
			message = frappe.db.get_single_value(
				"Healthcare Settings", "appointment_reminder_msg"
			)
			send_message(doc, message)
			frappe.db.set_value("Patient Appointment", doc.name, "reminded", 1)
			


def cancel_appointment(appointment_id):
	appointment = frappe.get_doc('Patient Appointment', appointment_id)
	if appointment.invoiced:
		sales_invoice = check_sales_invoice_exists(appointment)
		if sales_invoice and cancel_sales_invoice(sales_invoice):
			msg = _('Appointment {0} and Sales Invoice {1} cancelled').format(appointment.name, sales_invoice.name)
		else:
			msg = _('Appointment Cancelled. Please review and cancel the invoice {0}').format(sales_invoice.name)
	else:
		# fee_validity = manage_fee_validity(appointment)
		msg = _('Appointment Cancelled.')
		# if fee_validity:
		# 	msg += _('Fee Validity {0} updated.').format(fee_validity.name)

	frappe.msgprint(msg)
	

def cancel_sales_invoice(sales_invoice):
	if frappe.db.get_single_value('Healthcare Settings', 'automate_appointment_invoicing'):
		if len(sales_invoice.items) == 1:
			sales_invoice.cancel()
			return True
	return False
	

def check_sales_invoice_exists(appointment):
	sales_invoice = frappe.db.get_value('Sales Invoice Item', {
		'reference_dt': 'Patient Appointment',
		'reference_dn': appointment.name
	}, 'parent')

	if sales_invoice:
		sales_invoice = frappe.get_doc('Sales Invoice', sales_invoice)
		return sales_invoice
	return False



@frappe.whitelist()
def update_status_gch(appointment_id, status):
	frappe.db.set_value('Patient Appointment', appointment_id, 'status', status)
	appointment_booked = True
	if status == 'Cancelled':
		appointment_booked = False
		cancel_appointment(appointment_id)
