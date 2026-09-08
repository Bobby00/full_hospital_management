# Copyright (c) 2021, Karani and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class NursingWardRoom(Document):
	"""A NursingWardRoom is associated with a Nursing Ward.
	"""
	def validate(self):
		"""
		Validate should ensure:
		1. All beds within the nursing ward room should be within the nursing ward limit
		"""
		...
		# nursing_ward = frappe.get_doc("Nursing Ward", self.nursing_ward)
		# if self.number_of_beds > nursing_ward.total_beds:
		# 	frappe.throw(f"Number of beds exceeds total number of beds in the ward. Nursing Ward {self.nursing_ward} has been configured with {nursing_ward.total_beds} beds.")

