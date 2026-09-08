import frappe

class PurchaseReceiptController:
    @frappe.whitelist(allow_guest=True)
    def validate_purchase_receipt(form_object: object):

        return form_object
    
    @frappe.whitelist(allow_guest=True)
    def get_purchase_receipt_items(purchase_order: str):
        po = frappe.get_doc("Purchase Order", purchase_order)
        items = po.get("items")
        return items
    
    @frappe.whitelist(allow_guest=True)
    def get_purchase_order_quantity(purchase_order_item: str):
        """Use Purchase order number to get total items ordered"""
        poi = frappe.db.get_value(
                "Purchase Order Item", 
                {"name": purchase_order_item},
                ["qty"], as_dict=True                               
                )
        return poi
    
    @frappe.whitelist(allow_guest=True)
    def get_user_branch_and_warehouse():
        """
        Get user branch and warehouse
        """
        try:
            from .material_transfer import MaterialTransferController
            
            user = frappe.session.user
            user_details = frappe.db.get_list(
                "Practitioner Station Entry",
                filters={"user": user},
                fields=[
                    "station",
                    "branch"
                ]
            )

            if len(user_details) > 0:
                branch = user_details[0].branch

                warehouse = MaterialTransferController.get_user_current_warehouse()
                return {
                    "branch": branch,
                    "warehouse": warehouse
                }
                
            else:
                return {
                    "branch": None,
                    "warehouse": None
                }
        except Exception as e:
            frappe.log_error(e,"Errro getting user branch and warehouse")

    
    @frappe.whitelist(allow_guest=True)
    def create_batch_number(
        batch_no:str, 
        expiry_date: str,
        supplier: str,
        item: str,
        doc_name: str = ""
        ):
        try:
            has_batch = frappe.db.get_value(
                "Item",
                {"item_code":item},
                ["has_batch_no"]
            )
            if has_batch == 1:
                already_exists = frappe.db.get_list(
                    "Batch", {"batch_id": batch_no}
                )
                if len(already_exists) > 0:
                    if doc_name:
                        purchase_receipt_item = frappe.get_doc(
                            "Purchase Receipt Item", doc_name
                        )
                        purchase_receipt_item.batch_no = batch_no
                        purchase_receipt_item.save(ignore_permissions=True)

                        return purchase_receipt_item
                    return already_exists
                    
                
                doc = frappe.new_doc("Batch")
                doc.batch_id = batch_no
                doc.expiry_date = expiry_date
                doc.item = item
                doc.supplier = supplier

                doc.save()
                frappe.db.commit()

                if doc_name:
                    purchase_receipt_item = frappe.get_doc(
                        "Purchase Receipt Item", doc_name
                    )
                    purchase_receipt_item. batch_no =  batch_no
                    purchase_receipt_item.save(ignore_permissions=True)

                    return doc

                # purchase_receipt_item = frappe.get_doc('Purchase Receipt Item',doc_name)
                # purchase_receipt_item.batch_no = doc.batch_id
                # purchase_receipt_item.save()
                return doc
            else:
                return "item has no batch"
        except Exception as e:
            frappe.log_error(
                e, "Error saving batch on purchase receipt"
            )
            frappe.throw("Errorsaving batch details try again")


    @frappe.whitelist(allow_guest=True)
    def update_receipt_status(purchase_receipt: str):
        """
        Update purchase receipt status to completed
        """
        try:
            doc_to_update = frappe.get_doc("Purchase Receipt",purchase_receipt)
            doc_to_update.status = "Completed"
            doc_to_update.save(ignore_permissions=True)
            frappe.db.commit()
            return doc_to_update
        except Exception as e:
            frappe.throw(f"Error updating purchase receipt status {e}")

    @frappe.whitelist(allow_guest=True)
    def save_purchase_receipt_item(column: str,id: str,value: str):
        purchase_receipt_item = frappe.get_doc('Purchase Receipt Item',id)
        if column == "received_qty":
            rejected_number = purchase_receipt_item.rejected_qty
            purchase_receipt_item.qty = int(value)
            purchase_receipt_item.stock_qty = int(value)
            purchase_receipt_item.received_qty = int(value) + int(rejected_number)
            purchase_receipt_item.received_stock_qty = int(value) + int(rejected_number)
        elif column == "rejected_qty":
            received_qty = purchase_receipt_item.qty
            purchase_receipt_item.rejected_qty = int(value)
            purchase_receipt_item.received_qty = int(value) + int(received_qty)
            purchase_receipt_item.received_stock_qty = int(value) + int(received_qty)
        else:
            return "invalid column"
        purchase_receipt_item.save()
        return purchase_receipt_item
    
    @frappe.whitelist(allow_guest=True)
    def create_new_purchase_receipt_item(
        item_name: str,
        item_code: str,
        received_qty: int,
        batch_number: str,
        batch_expiry: str,
        supplier: str,
        doc_name: str,
        rate: str,
        purchase_order: str,
        purchase_order_item: str
    ):
        """
        Create new purchase receipt entry together with  batch details

        """
        try: 
            item_details = frappe.get_doc("Item",{"item_code": item_code})
            purchase_receipt_item = frappe.new_doc("Purchase Receipt Item")
            purchase_receipt_item.item_code = item_code
            purchase_receipt_item.item_name = item_name
            purchase_receipt_item.description = item_details.description # stock_uom
            purchase_receipt_item.stock_uom = item_details.stock_uom
            purchase_receipt_item.uom = item_details.stock_uom
            purchase_receipt_item.conversion_factor = item_details.uoms[0].conversion_factor
            purchase_receipt_item.purchase_order = purchase_order
            purchase_receipt_item.purchase_order_item = purchase_order_item
            
            
            accepted_number = received_qty

            purchase_receipt_item.qty = accepted_number
            purchase_receipt_item.stock_qty = accepted_number
            purchase_receipt_item.received_qty = accepted_number 
            purchase_receipt_item.received_stock_qty = accepted_number 
            # purchase_receipt_item.rejected_qty = rejected_number
            purchase_receipt_item.parent = doc_name
            purchase_receipt_item.parenttype = "Purchase Receipt"
            purchase_receipt_item.rate = rate 
            purchase_receipt_item.base_rate = rate 

            # Batch Details section
            if item_details.has_batch_no == 1:
            # Check if batcch exists
                batch_exists = frappe.db.get_value(
                    "Batch",
                    batch_number
                )
                if batch_exists:
                    purchase_receipt_item.batch_no =  batch_number
                else:
                    new_batch=frappe.new_doc("Batch")
                    new_batch.batch_id = batch_number
                    new_batch.expiry_date = batch_expiry
                    new_batch.item = item_code
                    new_batch.supplier = supplier
                    new_batch.save()
                    purchase_receipt_item.batch=new_batch
            purchase_receipt_item.save()

        # Update purchase receipt to include new purchase receipt Item
            purchase_receipt = frappe.get_doc('Purchase Receipt',doc_name)
            purchase_receipt.append("items",purchase_receipt_item)
            purchase_receipt.save()


            return purchase_receipt_item
            
        except Exception as e:
            frappe.log_error(e, "Error creating purchase receipt item")
            frappe.throw("Error Creating receipt item")

    @frappe.whitelist(allow_guest=True)
    def mark_po_as_sent_to_supplier(purchase_order_number: str):
        """Use PO number to mark po as sent to supplier"""
        try:
            purchase_order = frappe.get_doc(
                "Purchase Order",purchase_order_number
            )
            purchase_order.sent_to_supplier = 1
            purchase_order.save()

            new_list = frappe.db.get_list(
                "Purchase Order",
                {"workflow_state": "Approved", "sent_to_supplier": 0},
                ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","level_2_approval","grand_total","first_approval","final_approval","final_approval"],
                order_by="name desc",
            )
            frappe.publish_realtime('to_sent_to_supplier', {"data":new_list}, user=frappe.session.user)
            # return "Success"
        except Exception as e:
            frappe.log_error(e, "Error marking PO as sent, Purchase_receipt")
            return {"message":False}
        
    @frappe.whitelist(allow_guest=True)
    def update_batch_details(batch_no: str, expiry_date: str):
        """
        Use batch number to update batch details
        """
        try:
            batch = frappe.get_doc(
                "Batch",{"batch_id":batch_no}
            )
            batch.batch_id = batch_no
            batch.expiry_date = expiry_date
            batch.save(ignore_permissions=True)
            
            return batch
        except Exception as e:
            frappe.log_error('Error updating batch details purchase_receipt.py',e)
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def remove_item_from_receipt(child_entry: str):
        """
        Use parent document name and child entry name to remove item
        from purchase receipt
        """
        try:
            receipt_item = frappe.get_doc("Purchase Receipt Item", child_entry)
            receipt_item.delete()
            # receipt.get("items").remove(item)
            # if len(receipt.items) > 0:
            #     frappe.throw("Receipt must have Items, Delete Receipt instead")
            # receipt.save()
            frappe.db.commit()
            # # check if purchase receipt has items still
            
            return "success"
        except Exception as e:
            frappe.log_error(e, "Error removing item from receipt")
            frappe.throw("Error removing item from receipt")

    @frappe.whitelist(allow_guest=True)
    def get_company_details(company: str):
        """Use Company name to get company details"""
        try:
            company = frappe.get_doc("Company", company)
            return company
        except Exception as e:
            frappe.log_error(e, "Error getting company details")
            frappe.throw("Error getting company details")

    @frappe.whitelist(allow_guest=True)
    def get_available_in_other_warehouses(other_warehouses: str):
        """
        Check stock declared by other warehouses and return details
        """
        try:
           from .material_transfer import MaterialTransferController
           user_warehouse = MaterialTransferController.get_user_current_warehouse()

           if other_warehouses == "test":
               excess_stock_available = frappe.db.get_list(
                   "Stock Available For Redistribution Item",
                   filters={ "warehouse": ["!=", user_warehouse], "docstatus": 1},
                   fields=["branch","name","item_name","item_code","remaining_quantity", "status", "warehouse","parent","parenttype"]
               )
               return excess_stock_available
           else:
               excess_stock_available = frappe.db.get_list(
                   "Stock Available For Redistribution Item",
                   filters={ "warehouse": user_warehouse},
                   fields=["branch","name","item_name","warehouse","remaining_quantity", "status", "item_code","parent","parenttype"]
               )
               return excess_stock_available
        except Exception as e:
            frappe.log_error(e, "Error getting available stock from other warehouses")
               

    @frappe.whitelist(allow_guest=True)
    def create_material_transfer_request(items: object):
        import json
        from . import MaterialTransferController
        
        try:
            items_dict = json.loads(items)
            print(items_dict)

            grouped_items = {}

            branch = ""
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

            for item in items_dict:
                warehouse = item["warehouse"]
                if warehouse not in grouped_items:
                    grouped_items[warehouse] = []
                    grouped_items[warehouse].append(item)
                else:
                    grouped_items[warehouse].append(item)
            # print(grouped_items)
            user_warehouse = MaterialTransferController.get_user_current_warehouse()
            for warehouse, warehouse_items in grouped_items.items():
                # print("Warehouse: ", warehouse,"warehouse items: ", warehouse_items)
                mtr = frappe.new_doc("Stock Entry")
                mtr.stock_entry_type = "Material Transfer"
                mtr.company = MaterialTransferController.default_company()
                mtr.to_warehouse = user_warehouse
                mtr.from_warehouse = warehouse
                 
                # mtr.warehouse = warehouse
                # mtr.material_request_type = "Material Transfer"
                # mtr.transaction_date = frappe.utils.today()
                # mtr.set_from_warehouse = warehouse
                # mtr.set_warehouse = user_warehouse
                # mtr.branch = warehouse_items[0]['branch']
                # mtr.title = "Goods Transafer Request from " + branch

                
               
                for item in warehouse_items:
                    item_batch = PurchaseReceiptController.auto_select_batch_required_to_fulfill_transfer(item['item_code'], item['warehouse'], item['remaining_quantity'])
                    if item_batch:
                        print("Item Batch: ", item_batch)
                        for batch in item_batch:
                            mtri = frappe.new_doc("Stock Entry Detail")
                            mtri.t_warehouse = user_warehouse
                            mtri.stock_uom = "Nos"
                            mtri.uom = "Nos"
                            mtri.s_warehouse = item['warehouse']
                            mtri.item_code = item['item_code']
                            mtri.item_name = item['item_name']
                            mtri.qty = batch[2]
                            mtri.batch_no = batch[0]

                            mtr.append("items",mtri)
                    else:
                        mtri = frappe.new_doc("Stock Entry Detail")
                        mtri.t_warehouse = user_warehouse
                        mtri.stock_uom = "Nos"
                        mtri.uom = "Nos"
                        mtri.s_warehouse = item['warehouse']
                        mtri.item_code = item['item_code']
                        mtri.item_name = item['item_name']
                        mtri.qty = item['remaining_quantity']
                        mtri.batch_no = ""
                        mtri.request_type = "Stock Available For Redistribution"
                        mtri.request_number = item['parent']
                        mtri.request_item_number = item['name']
                        mtr.append("items",mtri)
                mtr.save()

            return "Success"
        except Exception as e:
            frappe.log_error(e, "Error creating material transfer request")
            frappe.throw("Error creating material transfer request")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def auto_select_batch_required_to_fulfill_transfer(
        item_code: str,
        warehouse: str,
        required_qty: int
    ):
        """
        Check if item has batch [Done]
        If yes, check if item is available in your warehouse (and how much) [Done]
        Check if batch with earliest expiry can full fill the request. If not, deduct avaliable stock from that batch and move to the next one. Do this untill requested if achieved. [Done]
        """
        from erpnext.stock.doctype.batch.batch import get_batches_by_oldest

        required_qty = int(required_qty)

        available_qty = frappe.db.get_value("Bin",{ "item_code":item_code,"warehouse":warehouse},["actual_qty"], as_dict=True)
        print("Available Qty: ", available_qty)
        if not available_qty:
            frappe.throw("This warehouse {} does not have any stock of item {}".format(warehouse, item_code))
            return "This warehouse {} does not have any stock of item {}".format(warehouse, item_code)
        if required_qty > available_qty.actual_qty:
            frappe.throw("This warehouse {} has insufficient quantity {} available for item {} to fulfill the request of {}".format(warehouse, available_qty.actual_qty, item_code, required_qty))
            return "This warehouse {} has insufficient quantity {} available for item {} to fulfill the request of {}".format(warehouse, available_qty.actual_qty, item_code, required_qty)
        
        has_batch = frappe.db.get_value("Item", item_code, "has_batch_no")
        if has_batch:
            exps = get_batches_by_oldest(item_code=item_code, warehouse=warehouse)
            values = []
            satisfied_by = 0
            remaining_qty = required_qty
            for batch in exps:
                value = batch[0].qty
                if remaining_qty<=value:
                    remaining_qty-value
                    satisfied_by += 1
                    itmdets = [batch[0].batch_no,batch[1],remaining_qty]
                    itmdict = {"batch_no":batch[0].batch_no,"expiry_date":batch[1],"qty":remaining_qty}
                    values.append(itmdets)
                    return values
                else:
                    remaining_qty = remaining_qty-value
                    itmdets = [batch[0].batch_no,batch[1],value]
                    itmdict = {"batch_no":batch[0].batch_no,"expiry_date":batch[1],"qty":value}
                    values.append(itmdets)
                    satisfied_by +=1
            return values
        else: 
            # stock_details = frappe.new_doc("Stock Entry Detail")
            # stock_details.t_warehouse = user_warehouse
            # stock_details.stock_uom = "Nos"
            # stock_details.uom = "Nos"
            # stock_details.s_warehouse = warehouse
            # stock_details.item_code = item_code
            # stock_details.item_name = item_name
            # stock_details.qty = requested_qty
            # return stock_details
            return None
        
    @frappe.whitelist(allow_guest=True)
    def get_my_goods_transfer_requests(my_actions: bool = False):
        """
        Get Stock entries where the users warehouse is the target warehouse and purpose is Material Transfer
        Submitted should be false
        """
        try:
            from .material_transfer import MaterialTransferController
            frappe.log_error(my_actions, "GCH_Purchases: my_actions")    
            user_warehouse = MaterialTransferController.get_user_current_warehouse()
            frappe.log_error(user_warehouse, "GCH_Purchases: User Warehouse")
            if my_actions:
                stock_entries = frappe.db.get_list(
                    "Stock Entry",
                    {"stock_entry_type":"Material Transfer","from_warehouse": user_warehouse, "docstatus": 0,"status": "Pending Approval"},
                    ["name","from_warehouse","owner","status","to_warehouse"]
                )
            else:
                stock_entries = frappe.db.get_list(
                    "Stock Entry",
                    {"stock_entry_type":"Material Transfer","to_warehouse": user_warehouse, "docstatus": 0},
                    ["name","from_warehouse","owner","status","to_warehouse"]
                )
            frappe.log_error(stock_entries, "GCH_Purchases: Stock Entries")
            return stock_entries
        except Exception as e:
            frappe.log_error(e, "Error getting stock entries purchase_receipt.py")
            frappe.throw("Error getting stock entries")
            return None

        

    @frappe.whitelist(allow_guest=True)
    def save_batch_on_purchase_receipt_items(batch_code: None,batch_expiry: None,item_code,name):
        """
        Chech if batch_code and _expiry are already in the system. If not, create a new batch.
        Return the batch_no of the batch
        """
        try:

            has_batch = frappe.db.get_value("Item", item_code, "has_batch_no")

            if has_batch:

                batch = frappe.db.get_list(
                    "Batch",
                    {"batch_id":batch_code,"expiry_date":batch_expiry,"item":item_code},
                    ["batch_id"]
                )
                # print("__________________-------------",batch)

                if not batch:
                    batch = frappe.new_doc("Batch")
                    batch.item = item_code
                    batch.batch_id = batch_code
                    batch.expiry_date = batch_expiry
                    batch.save()

                    purchase_receipt_item = frappe.get_doc("Purchase Receipt Item",name)
                    purchase_receipt_item.batch_no = batch.name
                    purchase_receipt_item.save()

                    # purchase_receipt_item.reload()

                    # print("__________________-------------",purchase_receipt_item.batch_no)
                    return batch.batch_id
                else:
                    purchase_receipt_item = frappe.get_doc("Purchase Receipt Item",name)
                    purchase_receipt_item.batch_no = batch[0].batch_id
                    purchase_receipt_item.save()

                    purchase_receipt_item.reload()

                    # print("__________________-------------",purchase_receipt_item.batch_no)

                    return batch[0].batch_id
            else:
                return "0"
        except Exception as e:
            frappe.log_error(e, "Error saving batch on purchase receipt items")
            frappe.throw("Error saving batch on purchase receipt items")
            return None
        
    
    @frappe.whitelist(allow_guest=True)
    def approve_stock_transfer(name):
        """
        Approve the stock transfer
        """
        try:
            stock_entry = frappe.get_doc("Stock Entry",name)
            stock_entry.status = "In-transit"
            stock_entry.approved_by = frappe.session.user
            stock_entry.approved_at = frappe.utils.now()
            stock_entry.save()
            return "success"
        except Exception as e:
            frappe.log_error(e, "Error approving stock transfer")
            frappe.throw("Error approving stock transfer")
            return None
        
    @frappe.whitelist(allow_guest=True)
    def decline_stock_transfer(name,reason):
        """
        Decline the stock transfer
        """
        try:
            stock_entry = frappe.get_doc("Stock Entry",name)
            stock_entry.status = "Declined"
            stock_entry.declined_by = frappe.session.user
            stock_entry.declined_at = frappe.utils.now()
            stock_entry.decline_reason = reason
            stock_entry.save()
            return "success"
        except Exception as e:
            frappe.log_error(e, "Error declining stock transfer")
            frappe.throw("Error declining stock transfer")
            return None
        

    @frappe.whitelist(allow_guest=True)
    def receive_stock(name):
        """
        Receive the stock transfer
        """
        try:
            stock_entry = frappe.get_doc("Stock Entry",name)
            stock_entry.status = "Received"
            stock_entry.received_by = frappe.session.user
            stock_entry.received_at = frappe.utils.now()
            stock_entry.docstatus = 1
            stock_entry.save()
            return "success"
        except Exception as e:
            frappe.log_error(e, "Error receiving stock transfer")
            frappe.throw("Error receiving stock transfer")
            return None