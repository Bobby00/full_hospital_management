from erpnext.healthcare.doctype.patient.patient import Patient
import uuid
import frappe
from gch_messaging.utils.core import messaging
from frappe.model.naming import set_name_by_naming_series

import calendar
import time

# gmt stores current gmtime


class GCHPatient(Patient):
	# def before_rename(self, old, new, merge=False):
	#     if merge:
	#         frappe.throw("Cannot merge patients")
	#     else:
	#         frappe.throw("Cannot rename patients")
	#     super().before_rename(old, new, merge)

	# def after_rename(self, old, new, merge=False):
	#     if merge:
	#         frappe.throw("Cannot merge patients")
	#     else:
	#         frappe.throw("Cannot rename patients")
	#     super().after_rename(old, new, merge)

	def autoname(self):
		patient_name_by = frappe.db.get_single_value('Healthcare Settings', 'patient_name_by')
		if patient_name_by == 'Patient Name':
			
			# Check if middle name exists and construct the name accordingly
			if self.middle_name:
				self.name = self.first_name + " " + self.middle_name + " " + self.last_name + " - " + self.uhid
			else:
				self.name = self.first_name + " " + self.last_name + " - " + self.uhid
		else:
			set_name_by_naming_series(self)

	def validate(self):
		phone_number = self.phone
		country_code = self.country_code
		company = frappe.defaults.get_global_default("company")
		index_g = company.find("Gert")
		index_w = company.find("Wema")
		if country_code and not phone_number:
			frappe.throw("Phone number is required")
		if phone_number:
			if not country_code:
				frappe.throw("Please select country code")
			phone_number_ = f"{country_code}{phone_number}"
			valid, phone = messaging.validate_phone(phone_number=phone_number_)
			if not valid:
				frappe.throw(
					f"{self.phone} is not a valid phone number. Use format 712******"
				)
		if not self.uhid_code:
			# TODO: Account for Wema Naming series.
			if index_g != -1:
				self.uhid_code = f"E{str(uuid.uuid4().int)[:8]}"
			if index_w != -1:
				self.uhid_code = f"W{str(uuid.uuid4().int)[:8]}"

			self.uhid = self.uhid_code
		return super().validate()

	def before_insert(self):
		company = frappe.defaults.get_global_default("company")
		index_g = company.find("Gert")
		index_w = company.find("Wema")
		if index_g != -1:
			patient_barcode = f"E{str(uuid.uuid4().int)[:8]}"
		if index_w != -1:
			patient_barcode = f"W{str(uuid.uuid4().int)[:8]}"
		
		self.uhid_code = patient_barcode
		self.uhid = patient_barcode
		self.added_by = frappe.session.user
		print(self.uhid_code)
		self.set_missing_customer_details()
		super().before_insert()

	def before_save(self):
		from gch_custom.tasks import gch_tasks

		print("Running before save")
		gch_tasks.enqueue_create_wellbaby(doc=self, event="before_save")

	def set_full_name(self):
		"""Set Patient Full Name (patient_name)

		If middle_name is present, concatenate the three names
		"""
		if self.last_name and self.middle_name:
			self.patient_name = " ".join(
				filter(None, [self.first_name, self.middle_name, self.last_name])
			)
		elif self.last_name and not self.middle_name:
			self.patient_name = " ".join(
				filter(
					None,
					[
						self.first_name,
						"",
						self.last_name,
					],
				)
			)
		else:
			self.patient_name = self.first_name

	def on_update(self, doc):
		if frappe.db.get_single_value('Healthcare Settings', 'link_customer_to_patient'):
			if self.customer:
				customer = frappe.get_doc('Customer', self.customer)
				if self.customer_group:
					customer.customer_group = self.customer_group
				if self.territory:
					customer.territory = self.territory

				customer.customer_name = self.patient_name
				customer.default_price_list = self.default_price_list
				customer.default_currency = self.default_currency
				customer.language = self.language
				customer.ignore_mandatory = True
				customer.save(ignore_permissions=True)
			else:
				customer = frappe.get_doc({
					'doctype': 'Customer',
					'customer_name': doc.patient_name + " - " + doc.uhid_code,
					'customer_group': doc.customer_group or frappe.db.get_single_value('Selling Settings', 'customer_group'),
					'territory' : doc.territory or frappe.db.get_single_value('Selling Settings', 'territory'),
					'customer_type': 'Individual',
					'default_currency': doc.default_currency,
					'default_price_list': doc.default_price_list,
					'language': doc.language
				}).insert(ignore_permissions=True, ignore_mandatory=True)

				frappe.db.set_value('Patient', doc.name, 'customer', customer.name)
				frappe.msgprint(_('Customer {0} is created.').format(customer.name), alert=True)

	def send_a01_to_labware(self):
		frappe.publish_realtime(
				event="eval_js",
				message='frappe.show_alert("{0}")'.format("New Patient. Sending ADT to Labware"),
				user=frappe.session.user,
			)
		
		from gch_middleware.utils.hl7.labware.service import gch_labware_service

		current_time = (
			str(frappe.utils.now())
			.split(".")[0]
			.replace("-", "")
			.replace(":", "")
			.replace(" ", "")
		)
		gmt = time.gmtime()
		ts = calendar.timegm(gmt)
		message_id = f"{self.name}{ts}".replace(" ", "").upper().strip()
		uhid = self.uhid_code
		first_name = self.first_name
		# middle_name = (
		#     self.middle_name
		#     if self.middle_name != "" and self.middle_name != None
		#     else self.last_name[0]
		# )
		middle_name = self.middle_name
		last_name = self.last_name
		dob = str(self.dob).replace("-", "")
		gender = self.sex[0]
		address = self.town
		country_code = "001234567"
		multiple_birth_indicator = "N"
		country_name = "Kenya"
		patient_class = "O"
		admission_type = "C"
		hospital_service = "M"
		encounter_number = message_id
		admission_time = current_time
		reason_for_admission = "0101"
		expected_discharge_time = current_time
		email_address = f"{self.first_name}{self.last_name}@gmail.com"
		sending_facility = "20"
		print(f"MIDDLE NAME {middle_name}")
		try:
			response = gch_labware_service.register_patient(
				message_id=message_id,
				uhid=uhid,
				first_name=first_name,
				last_name=last_name,
				middle_name=middle_name,
				dob=dob,
				gender=gender,
				address=address,
				country_code=country_code,
				phone_number="",
				multiple_birth_indicator=multiple_birth_indicator,
				country_name=country_name,
				patient_class=patient_class,
				admission_time=admission_time,
				encounter_number=encounter_number,
				hospital_service=hospital_service,
				admission_type=admission_type,
				reason_for_admission=reason_for_admission,
				expected_discharge_time=expected_discharge_time,
				email_address=email_address,
				sending_facility=sending_facility,
			)
			print(response)
			if response is not None: 
				frappe.publish_realtime(
					event="eval_js",
					message='frappe.show_alert("{0}")'.format("Sent ADT to Labware"),
					user=frappe.session.user,
				)
			else:
				frappe.publish_realtime(
					event="eval_js",
					message='frappe.show_alert("{0}")'.format("Failed to send ADT to Labware"),
					user=frappe.session.user,
				)
		except Exception as e:
			print(e)
			frappe.log_error(e, f"Error setting up")

	def after_insert(self):
		frappe.publish_realtime(
				event="eval_js",
				message='frappe.show_alert("{0}")'.format("New Patient. Sending ADT to Labware"),
				user=frappe.session.user,
			)
		
		from gch_middleware.utils.hl7.labware.service import gch_labware_service
		# from gch_pacs.utils.ris_pacs import create_patient

		current_time = (
			str(frappe.utils.now())
			.split(".")[0]
			.replace("-", "")
			.replace(":", "")
			.replace(" ", "")
		)
		gmt = time.gmtime()
		ts = calendar.timegm(gmt)
		message_id = f"{self.name}{ts}".replace(" ", "").upper().strip()
		uhid = self.uhid_code
		first_name = self.first_name
		middle_name = (
			self.middle_name
			if self.middle_name != "" and self.middle_name != None
			else self.last_name[0]
		)
		last_name = self.last_name
		dob = str(self.dob).replace("-", "")
		gender = self.sex[0]
		address = self.town
		country_code = "001234567"
		multiple_birth_indicator = "N"
		country_name = "Kenya"
		patient_class = "O"
		admission_type = "C"
		hospital_service = "M"
		encounter_number = message_id
		admission_time = current_time
		reason_for_admission = "0101"
		expected_discharge_time = current_time
		email_address = f"{self.first_name}{self.last_name}@gmail.com"
		sending_facility = "20"
		print(f"MIDDLE NAME {middle_name}")

		# pacs_response = create_patient(
		#     uhid=uhid,
		#     first_name=first_name,
		#     middle_name=middle_name,
		#     last_name=last_name,
		#     mobile_number="",
		#     gender=gender,
		#     birthdate=dob,
		# )
		# frappe.log_error(pacs_response, f"PACS Response")

		try:
			response = gch_labware_service.register_patient(
				message_id=message_id,
				uhid=uhid,
				first_name=first_name,
				last_name=last_name,
				middle_name=middle_name,
				dob=dob,
				gender=gender,
				address=address,
				country_code=country_code,
				phone_number="",
				multiple_birth_indicator=multiple_birth_indicator,
				country_name=country_name,
				patient_class=patient_class,
				admission_time=admission_time,
				encounter_number=encounter_number,
				hospital_service=hospital_service,
				admission_type=admission_type,
				reason_for_admission=reason_for_admission,
				expected_discharge_time=expected_discharge_time,
				email_address=email_address,
				sending_facility=sending_facility,
			)
			print(response)
			if response is not None: 
				frappe.publish_realtime(
					event="eval_js",
					message='frappe.show_alert("{0}")'.format("Sent ADT to Labware"),
					user=frappe.session.user,
				)
			else:
				frappe.publish_realtime(
					event="eval_js",
					message='frappe.show_alert("{0}")'.format("Failed to send ADT to Labware"),
					user=frappe.session.user,
				)
		except Exception as e:
			print(e)
			frappe.log_error(e, f"Error setting up")
		from gch_custom.tasks import gch_tasks

		print("Running before save")
		gch_tasks.enqueue_create_wellbaby(doc=self, event="before_save")
		super().after_insert()

	def on_update(self):
		print("Calling on update")
		frappe.publish_realtime(
				event="eval_js",
				message='frappe.show_alert("{0}")'.format("Patient Updated. Sending ADT to Labware"),
				user=frappe.session.user,
			)
		from gch_middleware.utils.hl7.labware.service import gch_labware_service

		current_time = (
			str(frappe.utils.now())
			.split(".")[0]
			.replace("-", "")
			.replace(":", "")
			.replace(" ", "")
		)
		gmt = time.gmtime()
		ts = calendar.timegm(gmt)
		message_id = f"{self.name}{ts}".replace(" ", "").upper().strip()
		uhid = self.uhid_code
		first_name = self.first_name
		last_name = self.last_name

		middle_name = (
			self.middle_name
			if self.middle_name != "" and self.middle_name != None
			else self.last_name[0]
		)
		
		dob = str(self.dob).replace("-", "")
		gender = self.sex[0]
		address = self.town
		country_code = "001234567"
		multiple_birth_indicator = "N"
		country_name = "Kenya"
		patient_class = "O"
		admission_type = "C"
		hospital_service = "M"
		encounter_number = message_id
		admission_time = current_time
		reason_for_admission = "0101"
		expected_discharge_time = current_time
		email_address = f"{self.first_name}{self.last_name}@gmail.com"
		sending_facility = "20"
		print(f"MIDDLE NAME {middle_name}, LAST NAME {last_name}")
		try:
			response = gch_labware_service.update_patient(
				message_id=message_id,
				uhid=uhid,
				first_name=first_name,
				last_name=last_name,
				middle_name=middle_name,
				dob=dob,
				gender=gender,
				address=address,
				country_code=country_code,
				phone_number="",
				multiple_birth_indicator=multiple_birth_indicator,
				country_name=country_name,
				patient_class=patient_class,
				admission_time=admission_time,
				encounter_number=encounter_number,
				hospital_service=hospital_service,
				admission_type=admission_type,
				reason_for_admission=reason_for_admission,
				expected_discharge_time=expected_discharge_time,
				email_address=email_address,
				sending_facility=sending_facility,
			)
			print(f"RESPONSE FROM LABWARE: {response}")
			if response is not None: 
				frappe.publish_realtime(
					event="eval_js",
					message='frappe.show_alert("{0}")'.format("Sent to Labware"),
					user=frappe.session.user,
				)
			else:
				frappe.publish_realtime(
					event="eval_js",
					message='frappe.show_alert("{0}")'.format("Failed to send to Labware"),
					user=frappe.session.user,
				)
		except Exception as e:
			print(e)
			frappe.log_error(e, f"Error setting up")
		super().on_update()

	def on_change(self):
		print("Calling on change")
		frappe.publish_realtime(
				event="eval_js",
				message='frappe.show_alert("{0}")'.format("Patient Updated. Sending ADT to Labware"),
				user=frappe.session.user,
			)
		from gch_middleware.utils.hl7.labware.service import gch_labware_service

		current_time = (
			str(frappe.utils.now())
			.split(".")[0]
			.replace("-", "")
			.replace(":", "")
			.replace(" ", "")
		)
		gmt = time.gmtime()
		ts = calendar.timegm(gmt)
		message_id = f"{self.name}{ts}".replace(" ", "").upper().strip()
		uhid = self.uhid_code
		first_name = self.first_name
		last_name = self.last_name

		middle_name = (
			self.middle_name
			if self.middle_name != "" and self.middle_name != None
			else self.last_name[0]
		)
		
		dob = str(self.dob).replace("-", "")
		gender = self.sex[0]
		address = self.town
		country_code = "001234567"
		multiple_birth_indicator = "N"
		country_name = "Kenya"
		patient_class = "O"
		admission_type = "C"
		hospital_service = "M"
		encounter_number = message_id
		admission_time = current_time
		reason_for_admission = "0101"
		expected_discharge_time = current_time
		email_address = f"{self.first_name}{self.last_name}@gmail.com"
		sending_facility = "20"
		print(f"MIDDLE NAME {middle_name}, LAST NAME {last_name}")
		try:
			response = gch_labware_service.update_patient(
				message_id=message_id,
				uhid=uhid,
				first_name=first_name,
				last_name=last_name,
				middle_name=middle_name,
				dob=dob,
				gender=gender,
				address=address,
				country_code=country_code,
				phone_number="",
				multiple_birth_indicator=multiple_birth_indicator,
				country_name=country_name,
				patient_class=patient_class,
				admission_time=admission_time,
				encounter_number=encounter_number,
				hospital_service=hospital_service,
				admission_type=admission_type,
				reason_for_admission=reason_for_admission,
				expected_discharge_time=expected_discharge_time,
				email_address=email_address,
				sending_facility=sending_facility,
			)
			print(f"RESPONSE FROM LABWARE: {response}")

			if response is not None: 
				frappe.publish_realtime(
					event="eval_js",
					message='frappe.show_alert("{0}")'.format("Sent to Labware"),
					user=frappe.session.user,
				)
			else:
				frappe.publish_realtime(
					event="eval_js",
					message='frappe.show_alert("{0}")'.format("Failed to send to Labware"),
					user=frappe.session.user,
				)
		except Exception as e:
			print(e)
			frappe.log_error(e, f"Error setting up")
	  

	
