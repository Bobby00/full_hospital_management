# Copyright (c) 2023, eGerties Devs and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class NursingWardOccupancy(Document):
	def validate(self):
		bed = frappe.get_doc("Nursing Ward Bed", self.bed)
		print(bed.is_occupied)
		frappe.db.set_value(
			"Nursing Ward Bed",
			self.bed,
			{
				"is_occupied":True
			}
		)
		
		...
	pass
