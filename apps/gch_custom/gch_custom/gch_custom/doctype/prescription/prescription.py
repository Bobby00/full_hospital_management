# Copyright (c) 2021, Karani and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Prescription(Document):
    def before_save(self):
        self.prescribing_doctor = frappe.db.get_value("User", self.owner, ["full_name"])
        self.prescription_number = self.name

        
