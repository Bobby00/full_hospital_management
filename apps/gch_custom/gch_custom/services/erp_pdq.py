import frappe
from frappe import msgprint, _
from .absa_pdq import ABSA_PDQ

class InvalidParametersErrors(Exception):
    pass

class ResourceNotFoundErrors(Exception):
    pass




@frappe.whitelist(allow_guest=True)
def request_pdq_payment(sales_invoice:str,patient_encoutner:str,data):
    pass