# Copyright (c) 2021, Karani and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document

class GCHCountry(Document):
	def before_save(self):
		self.display_name = f"{self.country_name} - {self.phone_code}"
