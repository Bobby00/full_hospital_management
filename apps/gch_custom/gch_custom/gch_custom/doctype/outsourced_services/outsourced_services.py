# Copyright (c) 2024, eGerties Devs and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
# import frappe

class OutsourcedServices(Document):
    pass

	# def on_submit(self):

		# from gch_custom.services.workflow_controller import WorkflowController
		# encounter = self.encounter

		# encounterGCH = frappe.get_doc("Patient Encounter", encounter)
		# sales_invoice = encounterGCH.sales_invoice
		# invoice = frappe.get_doc("Sales Invoice", sales_invoice)
		# if sales_invoice:
		# 	items = self.items
		# 	for item in items:
		# 		item_to_bill = WorkflowController.create_invoice_item(
		# 			item.item_code,
		# 			"Nos",
		# 			item.quantity,
		# 			"",
		# 			"",
		# 			1,
		# 		)
		# 		invoice.append("items", item_to_bill)
		# 	invoice.save()
		# else:
		# 	frappe.throw("No invoice found for this encounter")
