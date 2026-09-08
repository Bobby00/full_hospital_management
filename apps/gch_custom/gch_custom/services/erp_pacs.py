import frappe
from .pacs import Pacs


@frappe.whitelist(allow_guest=True)
def create_patient_appointment():
    pacs = Pacs()
    try:
        result = pacs.create_appointment()
        return result
    except Exception as e:
        print(e)
        frappe.log_error(
            e, "PACS CREATE PATIENT APPOINTMENT ERROR  /erp_pacs.py")
        return False


@frappe.whitelist(allow_guest=True)
def modify_patient_appointment():
    pacs = Pacs()
    try:
        result = pacs.modify_appointment()
        return result
    except Exception as e:
        print(e)
        frappe.log_error(
            e, "PACS MODIFY PATIENT APPOINTMENT ERROR  /erp_pacs.py")
        return False


@frappe.whitelist(allow_guest=True)
def add_patient_to_pacs():
    pacs = Pacs()
    try:
        result = pacs.create_patient()
        return result
    except Exception as e:
        print(e)
        frappe.log_error(e, "PACS CREATE PATIENT ERROR  /erp_pacs.py")
        return False


@frappe.whitelist(allow_guest=True)
def modify_patient_in_pacs():
    pacs = Pacs()
    try:
        result = pacs.modify_appointment()
        return result
    except Exception as e:
        print(e)
        frappe.log_error(e, "PACS MODIFY PATIENT ERROR  /erp_pacs.py")
        return False


@frappe.whitelist(allow_guest=True)
def create_patient_service_request():
    pacs = Pacs()
    try:
        result = pacs.create_service_request()
        return result
    except Exception as e:
        print(e)
        frappe.log_error(e, "PACS CREATE SERVICE ERROR  /erp_pacs.py")
        return False


@frappe.whitelist(allow_guest=True)
def cancel_patient_service_request():
    pacs = Pacs()
    try:
        result = pacs.cancel_service_request()
        return result
    except Exception as e:
        print(e)
        frappe.log_error(e, "PACS CANCEL SERVICE ERROR  /erp_pacs.py")
        return False


@frappe.whitelist(allow_guest=True)
def get_patient_results():
    pacs = Pacs()
    try:
        result = pacs.get_result()
        return result
    except Exception as e:
        print(e)
        frappe.log_error(e, "PACS GET RESULTS ERROR  /erp_pacs.py")
        return False
