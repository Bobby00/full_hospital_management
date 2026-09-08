# Copyright (c) 2021, Karani and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from gch_messaging.utils.core import messaging
from frappe import _


class Parent(Document):
    """
    Validate Parent Phone on save
    """

    def before_save(self):
        """Runs before saving"""
        self.full_name = f'{self.first_name} {self.last_name or ""}'
        self.display_name = f"{self.full_name} - {self.phone_number}"


    def validate(self):
        """Validate"""
        phone_number = self.phone_number
        country_code = self.country_code
        if country_code and not phone_number:
            frappe.throw("Phone number is required")
        if phone_number:
            if not country_code:
                frappe.throw("Please select country code")
            phone_number_ = f"{country_code}{phone_number}"
            valid, phone = messaging.validate_phone(phone_number=phone_number_)
            if not valid:
                frappe.throw(
                    f"{self.phone_number} is not a valid phone number. Use format 712******"
                )
            self.full_phone_number = phone_number_
