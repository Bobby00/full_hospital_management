from erpnext.buying.doctype.purchase_order.purchase_order import PurchaseOrder

import frappe


class GCHPurchaseOrder(PurchaseOrder):
    def get_user_current_warehouse(self):
        """
        Get logged in user's location and warehouse
        """
        try:
            session_user = frappe.session.user

            user_details = frappe.db.get_list(
                "Practitioner Station Entry",
                filters={"user": session_user},
                fields=[
                    "station",
                    "branch"
                ]
            )
            if user_details:
                branch = user_details[0].branch
                service_unit = user_details[0].station

                warehouse = ""

                if service_unit == "Wellbaby - GCH" or service_unit == "Triage - GCH" or service_unit == "Wellbaby Growth Monitoring - GCH":
                    warehouse = frappe.db.get_list(
                        "Warehouse",
                        filters={"branch": branch, "service_unit": "Wellbaby - GCH"},
                        fields = ["name", "branch", "service_unit"]
                    )

                else:
                    warehouse = frappe.db.get_list(
                        "Warehouse",
                        filters={"branch": branch,"service_unit": service_unit},
                        fields = ["name", "branch","service_unit"]
                    )

                if warehouse:
                    warehouse_name = warehouse[0].name
                    return warehouse_name
                elif warehouse is None and branch == "Mombasa":
                    return "Pharmacy MSA - GCH"
                else:
                    warehouse_name = str(branch) + " " + "Pharmacy - GCH"
                    return "Pharmacy MSA - GCH"
            else: 
                frappe.throw("Please select station")
            
        except Exception as e:
            frappe.log_error(
                e, "Error getting user warehouse/ purchases/material_transfer.py"
            )
            return e
        
    def before_save(self):
        supplier = self.supplier
        branch = self.branch
        warehouse = self.warehouse
        if warehouse is None:
            warehouse = self.get_user_current_warehouse()
        if supplier:
            self.title = f"{supplier} to {branch} - {warehouse}"
        else:
            self.title = f"LPO for {branch} - {warehouse}"