from erpnext.stock.doctype.purchase_receipt.purchase_receipt import PurchaseReceipt

import frappe

class GCHPurchaseReceipt(PurchaseReceipt):
    def before_submit(self):
        purchase_recept = frappe.get_doc("Purchase Reception", self.name)
        purchase_recept.reload()