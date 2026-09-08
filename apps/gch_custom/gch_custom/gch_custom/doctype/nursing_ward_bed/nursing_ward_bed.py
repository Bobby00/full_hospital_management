# Copyright (c) 2021, Karani and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class NursingWardBed(Document):
    def before_save(self):
        """Check if number of beds exceeds the ward capacity"""
        ward_room_name = self.ward_room

        ward_room = frappe.get_doc("Nursing Ward Room", ward_room_name)

        ward_name = ward_room.nursing_ward

        ward = frappe.get_doc("Nursing Ward", ward_name)
        
        self.nursing_ward = ward_name
        
        # ward_beds = frappe.db.count("Nursing Ward Bed", {"ward_room": ward_room_name})
        # max_capacity = ward.total_beds

        # if ward_beds > int(max_capacity):
        #     frappe.throw(
        #         f"The ward capacity has been exceeded. Ward {ward_name} only allows a maximum of {max_capacity} beds."
        #     )
