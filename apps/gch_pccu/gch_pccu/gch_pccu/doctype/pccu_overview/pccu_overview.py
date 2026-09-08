# Copyright (c) 2024, Redward and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class PCCUOverview(Document):
	pass

@frappe.whitelist(allow_guest=True)
def get_input_ouput_chart_list(**args):
	try:
		io_list_doc_holder = []

		io_list = frappe.get_list("Nursing Input Output Chart", filters={'inpatient_record': args["inpatient_record"]}, fields=['name'])

		for io in io_list:

			io_doc = frappe.get_doc("Nursing Input Output Chart", io.name)

			io_list_doc_holder.append(io_doc)

		return io_list_doc_holder
	except Exception as e:
		return e
		
