# Copyright (c) 2021, Karani and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class InsuranceCompany(Document):
    def before_insert(self):

        customer = create_customer(self.company_name)
        self.customer = customer.name


def create_customer(customer_name: str):

    doc = frappe.get_doc({
        "customer_name": customer_name,
        "customer_group": "Commercial",
        "customer_type": "Company",
        "disabled": 0,
        "dn_required": 0,
        "docstatus": 0,
        "doctype": "Customer",
        "export_type": "With Payment of Tax",
        "gst_category": "Unregistered",
        "is_frozen": 0,
        "is_internal_customer": 0,
        "language": "en",
        "name": "new-customer-1",
        "naming_series": "CUST-.YYYY.-",
        "owner": "Administrator",
        "represents_company": "",
        "so_required": 0,
        "territory": "Kenya"
    })
    doc.insert(ignore_permissions=True)
    return doc
