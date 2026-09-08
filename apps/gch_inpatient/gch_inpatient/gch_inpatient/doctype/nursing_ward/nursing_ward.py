# Copyright (c) 2023, Redward and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class NursingWard(Document):
	pass

@frappe.whitelist(allow_guest=True)
def fetch_nursing_wards(**args):
	doc = frappe.get_list("Nursing Ward")
	return doc
