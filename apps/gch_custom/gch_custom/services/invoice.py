import frappe
 

@frappe.whitelist(allow_guest=True)
def reopen_invoice(sales_invoice_id: str,  status: str = "Draft",docstatus: int = 0,):
    """Reopen an invoice."""
    try:
        print("INFO: Reopening invoice: {}".format(sales_invoice_id))
        print("INFO: Reopening invoice docstatus: {}".format(docstatus))
        print("INFO: Reopening invoice status: {}".format(status))
        
        frappe.db.set_value("Sales Invoice", sales_invoice_id, "status", status)
        frappe.db.set_value("Sales Invoice", sales_invoice_id, "docstatus", docstatus)
        
        
        # doc = frappe.get_doc("Sales Invoice", sales_invoice_id)
        
        # doc.status = status
        # doc.docstatus = docstatus
        # doc.insert(
        #     ignore_permissions=True, # ignore write permissions during insert
        #     ignore_links=True, # ignore Link validation in the document
        #     ignore_if_duplicate=True, # dont insert if DuplicateEntryError is thrown
        #     ignore_mandatory=True # insert even if mandatory fields are not set
        # )
        return "Invoice reopened successfully."
    except Exception as e:
        frappe.log_error(e, "reopen_invoice")
        print("ERROR: {}".format(e))
        return "Failed to reopen invoice."
    
   