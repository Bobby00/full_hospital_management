# Copyright (c) 2022, Karani and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class NursingChecklist(Document):
	pass

@frappe.whitelist(allow_guest=True)
def creating_completed_nursing_tools(**args):

	completed_nursing_tool = frappe.get_doc({
		'doctype': 'Completed Nursing Tools',
		'tool_name' : args["tool_name"],
		'inpatient_record' : args["inpatient_record"],
		'parent': args["inpatient_record"],
		'parenttype': "Inpatient Record",
		'parentfield':'completed_nursing_tools',
		'nursing_tool_link': args["tool_link"]
	})

	completed_nursing_tool.save()
	return completed_nursing_tool