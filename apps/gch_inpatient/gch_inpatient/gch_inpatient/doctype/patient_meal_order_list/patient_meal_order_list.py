# Copyright (c) 2023, Redward and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class PatientMealOrderList(Document):
	pass


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
def fetch_catering_items_count(**args):
	try:
		catering_items_count = frappe.db.count("Catering Menu Item")
		
		return catering_items_count
	except Exception as e:
		return e