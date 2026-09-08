# Copyright (c) 2021, Karani and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class CorporateCompany(Document):
    def after_insert(self):
        if (self.self_insured == 1):
           insurance = frappe.get_doc({"doctype":"Insurance Company", "company_name": self.company_name, "email":self.email,"mailing_address":self.mailing_address,"kranium_id":self.kranium_id,"telephone":self.telephone,"mobile_no":self.mobile_no,"physical_address":self.physical_address})
           insurance.insert()
           frappe.msgprint(msg='Insurance Company created: '+ self.company_name,title='Success')
           
    def on_update(self):
#  Check if the company been update is self insuring
#  if yes fetch the associated insurance company details
#  update all the details updated on the company to the insurance company
#  check if the update field is the is_self insured 
#  if yes get the insurance company and diasable it
#  if the company and field update is self insuring create insurance company 

        if (self.self_insured == 1):
            if(frappe.db.exists('Insurance Company', self.company_name)):
                insurance = frappe.set_value('Insurance Company', self.company_name,{"company_name": self.company_name, "email":self.email,"mailing_address":self.mailing_address,"kranium_id":self.kranium_id,"telephone":self.telephone,"mobile_no":self.mobile_no,"physical_address":self.physical_address, "is_active":1})
                frappe.msgprint(msg='Insurance Company Updated: '+ self.company_name,title='Success')
            else:
                insurance = frappe.get_doc({"doctype":"Insurance Company", "company_name": self.company_name, "email":self.email,"mailing_address":self.mailing_address,"kranium_id":self.kranium_id,"telephone":self.telephone,"mobile_no":self.mobile_no,"physical_address":self.physical_address,"is_active":1})
                insurance.insert()
                frappe.msgprint(msg='Insurance Company created: '+ self.company_name,title='Success')
        else:
            if(frappe.db.exists('Insurance Company', self.company_name)):
                insurance = frappe.set_value('Insurance Company', self.company_name,{"company_name": self.company_name, "email":self.email,"mailing_address":self.mailing_address,"kranium_id":self.kranium_id,"telephone":self.telephone,"mobile_no":self.mobile_no,"physical_address":self.physical_address, "is_active":0})
                frappe.msgprint(msg='Insurance Company Diactivated: '+ self.company_name,title='Error')