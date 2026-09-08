# Copyright (c) 2024, Redward and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class PatientNutritionOverview(Document):
	pass


@frappe.whitelist(allow_guest=True)
def fetch_linked_meal_plans(**args):
	try:
		doc = frappe.get_list("Patient Meal Plan", filters={"patient_nutrition_overview": args["patient_nutrition_overview"] }, fields=['name','meal_plan_name', 'date', 'route', 'proteins', 'dietician', 'is_active', 'comment'], order_by='creation desc')

		print("\n\n\n\n\n\n", doc, "HEREEEEEEEEEEEEEE", "\n\n\n\n\n\n")
		return doc
	
	except Exception as e:
		return e
	
@frappe.whitelist(allow_guest=True)
def fetch_patient_meal_orders(**args):
	try:
		doc = frappe.get_list("Patient Meal Order", filters={"inpatient_record": args["inpatient_record"]}, fields=['name', 'ward', 'room', 'bed', 'patient', 'date', 'time', 'select_menu', 'menu_option', 'ordered_by', "received_by", 'workflow_state'], order_by="creation desc")

		print("\n\n\n\n\n\n", doc, "MEAL ORDERS...........", "\n\n\n\n\n\n")
		return doc
	except Exception as e:
		return e
		