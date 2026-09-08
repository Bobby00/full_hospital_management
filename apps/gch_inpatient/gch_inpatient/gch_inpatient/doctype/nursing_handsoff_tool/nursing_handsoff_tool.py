# Copyright (c) 2023, Redward and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class NursingHandsoffTool(Document):
	pass

@frappe.whitelist(allow_guest=True)
def fetch_latest_vitals(**args):
	try:
		doc = frappe.get_doc("Inpatient Record", args["inpatient_record"])
		return doc
	except Exception as e:
		return e