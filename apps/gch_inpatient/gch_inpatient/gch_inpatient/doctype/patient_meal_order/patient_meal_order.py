# Copyright (c) 2024, Redward and contributors
# For license information, please see license.txt

import frappe
import sys

from frappe.model.document import Document


from gch_custom.services.workflow_controller import WorkflowController

class PatientMealOrder(Document):
	pass

def invoice_encounter_items(
	patient,
	invoiced_items,
	encounter,
	invoice,
	current_invoiced_items,
	mode_of_payment="Cash",
	type="Outpatient",
):
	try:
		from gch_custom.overrides.patient_encounter import GCHPatientEncounter

		if not type:
			current_encounter: GCHPatientEncounter = frappe.get_doc(
					"Patient Encounter", encounter
				)
		elif type:
			current_encounter = frappe.get_doc(
					"Inpatient Record", encounter
				)

		_current_invoiced_items = current_invoiced_items

		if invoice == "":
			# TODO: Add naming series based on branch

			invoice = frappe.new_doc("Sales Invoice")
			invoice.patient = patient.name
			invoice.patient_name = patient.patient_name
			invoice.customer = patient.customer
			invoice.conversion_rate = 1
			invoice.price_list_currency = "KES"
			invoice.plc_conversion_rate = 1
			invoice.encounter = encounter
			invoice.mode_of_payment = mode_of_payment
			# invoice.ref_practitioner = current_encounter.practitioner_name
			invoice.branch = current_encounter.branch

			# add naming series based on branch

			current_branch = frappe.get_doc("Branch", current_encounter.branch)

			naming_series = "22.YY.MM.######"

			if current_branch.invoice_naming_series:
				naming_series = current_branch.invoice_naming_series

			invoice.naming_series = naming_series

			for item in invoiced_items:
				invoice.append("items", item)

			invoice.base_net_total = 0
			invoice.base_grand_total = 0
			invoice.grand_total = 0
			invoice.debit_to = "Debtors - GCH"
			try:
				invoice.insert(ignore_permissions=True)
				# invoice.submit()
				return invoice
			except Exception as e:
				frappe.log_error(e, "Save new invoice  /rest.py line 2610")
				return {"name": e}

		invoice = frappe.get_doc("Sales Invoice", invoice)

		for item in invoiced_items:
			if item["item_code"] not in _current_invoiced_items:
				print(
					"******************************break****************************************"
				)
				print(item["item_code"])
				invoice.append("items", item)
				print(
					"******************************break****************************************"
				)
			if item["item_code"] in _current_invoiced_items:
				_current_invoiced_items.remove(item["item_code"])

		invoice.save()
		# invoice.submit()
		return invoice
	except Exception as e:
		frappe.log_error(e, "Save invoice  /rest.py")
		return {"name": e}


@frappe.whitelist(allow_guest=True)
def fetch_menu_option_items(**args):
	try:
		menu = args["menu"]
		menu_option = args["menu_option"]
		doc = frappe.get_doc("Catering Menu Option", menu_option)
		return doc
	
	except Exception as e:
		return e
	

@frappe.whitelist(allow_guest=True)
def fetch_catering_overview_data(**args):
	try:
		
		catering_order_data = []

		meal_order_list = frappe.get_list("Patient Meal Order", fields=["name"])

		for order in meal_order_list:
			order_doc = frappe.get_doc("Patient Meal Order", order.name)
			catering_order_data.append(order_doc)
	
		
		return catering_order_data

	except Exception as e:
		return e
	
@frappe.whitelist(allow_guest=True)
def fetch_catering_items_count(**args):
	try:
		catering_items_count = frappe.db.count("Catering Menu Item")
		
		return catering_items_count
	except Exception as e:
		return e
	
@frappe.whitelist(allow_guest=True)
def filter_breakfast_drink_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Breakfast Drinks")
	)

@frappe.whitelist(allow_guest=True)
def filter_breakfast_starch_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Breakfast Starch")
	)

@frappe.whitelist(allow_guest=True)
def filter_breakfast_protein_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Breakfast Proteins")
	)

@frappe.whitelist(allow_guest=True)
def filter_breakfast_side_piece_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Breakfast Side Piece")
	)

@frappe.whitelist(allow_guest=True)
def filter_10am_drink_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "CATERING 10 AM DRINKS")
	)


@frappe.whitelist(allow_guest=True)
def filter_10am_accompaniment_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Catering 10AM Accompaniments")
	)

@frappe.whitelist(allow_guest=True)
def filter_lunch_main_dish_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Catering Lunch Main Dish")
	)


@frappe.whitelist(allow_guest=True)
def filter_lunch_accompaniment_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Lunch Accompaniments")
	)


@frappe.whitelist(allow_guest=True)
def filter_lunch_accompaniment_2_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Lunch Accompaniments 2")
	)


@frappe.whitelist(allow_guest=True)
def filter_lunch_dessert_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Lunch Dessert Options")
	)

@frappe.whitelist(allow_guest=True)
def filter_4pm_drink_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Catering 4PM Tea Options")
	)

@frappe.whitelist(allow_guest=True)
def filter_4pm_snack_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Catering 4PM Snack Options")
	)


@frappe.whitelist(allow_guest=True)
def filter_dinner_main_dish_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Dinner Main DIsh")
	)

@frappe.whitelist(allow_guest=True)
def filter_dinner_accompaniment_1_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Dinner Accompaniment 1")
	)


@frappe.whitelist(allow_guest=True)
def filter_dinner_accompaniment_2_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Dinner Accompaniment 2")
	)


@frappe.whitelist(allow_guest=True)
def filter_dinner_dessert_according_to_selected_menu(doctype, txt, searchfield, start, page_len, filters):
	selected_menu = filters.get("select_menu")
	
	print(selected_menu, "\n\n\n\n", "Selected mENU")

	return frappe.db.sql(
		"""
		select parent, parenttype, linked_menus from `tabCatering Items Linked Menus` where linked_menus like %s and parenttype like %s 
		""", (selected_menu, "Dinner Dessert")
	)



@frappe.whitelist(allow_guest=True)
def invoice_all_billable_order_items(encounter: str="", all_billable_meals: str=""):
	"""Get all consumables used in a procedure"""
	try:
	
		invoice = ""
		patient=""

		CURRENT_INVOICED_ITEMS = []
		ALL_CONSUMABLES = []
		
		print(all_billable_meals, encounter)

		encounter = encounter
		current_encounter = frappe.get_doc("Inpatient Record", encounter)
		invoice = current_encounter.sales_invoice
		patient = current_encounter.patient



		# Get User station
		user_station = frappe.db.get_list(
			"Practitioner Station Entry",
			filters={"user": frappe.session.user},
			fields=[
				"station",
			],
		)
		billed_from = user_station[0].station
		
		all_billable_meals = all_billable_meals.split(",")

		for item in all_billable_meals:
			if item != '':
				billable_item = WorkflowController.create_invoice_item(
					item,
					"Nos",
					1,
					"",
					"",
					"",
					1,
					0,
					0,
					"",
					billed_from
				)
				ALL_CONSUMABLES.append(billable_item)

		print("\n\n\n\n\n", ALL_CONSUMABLES)
		print("\n\n\n\n\n", encounter, current_encounter, invoice, patient, "IIIIIIIIIIIIIIIISSSSSSSSSSSS", "\n\n\n\n\n")


			
		if encounter=="":
			frappe.log_error("INFO: Calling invoice consumbles without encounter or inpatient record", "billing consumables /patient_meal_order.py")
			return  
		
		
		if patient == "":
			frappe.log_error("INFO: Calling invoice consumbles without patient", "billing consumables /patient_meal_order.py")
			return
		
		patient_ = frappe.get_doc("Patient", patient)
		customer_group = patient_.customer_group
			
		# Create the invoice

		created_invoice = invoice_encounter_items(
			patient_, ALL_CONSUMABLES, encounter, invoice, CURRENT_INVOICED_ITEMS,"", 1
		)
		return "Invoice Updated Successfully : " + created_invoice.name

	except Exception as e:
		frappe.log_error(e, "REST ERROR invoicing procedure  /rest.py")
		print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
		return []
	

@frappe.whitelist(allow_guest=True)
def fetch_latest_active_meal_plan(**args):
	try:
		latest_active_meal_plan = frappe.get_list("Patient Meal Plan", filters={"inpatient_record":args["inpatient_record"], "is_active": 1})

		meal_plan_doc = frappe.get_doc("Patient Meal Plan", latest_active_meal_plan[0])

		return meal_plan_doc
	except Exception as e:
		return e

