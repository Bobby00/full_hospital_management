import frappe
from frappe.utils.data import add_days, formatdate

from datetime import datetime

class StockLevelController:
    @frappe.whitelist(allow_guest=True)
    def get_sales_invoice_item(
        invoice: str,
        item_code: str
    ):
        """Get sales invoice item from invoice"""
        sales_invoice_item = frappe.db.get_value(
            "Sales Invoice Item", {
                "parent": invoice,
                "item": item_code
            }, ["name"]
        )

        return sales_invoice_item

    @frappe.whitelist(allow_guest=True)
    def create_stock_ledger_entry(
        actual_qty: int,
        qty_after_transaction: int,
        batch_no: str,
        company: str,
        fiscal_year: str,
        is_cancelled: int,
        item_code: str,
        stock_uom: str,
        voucher_detail_no: str,
        voucher_no: str,
        warehouse: str,
        posting_date: str,
        posting_time: str,
        is_return: int = 0,
    ):

        try:

            doc = frappe.get_doc({
                "doctype": "Stock Ledger Entry",
                "actual_qty": actual_qty,
                "batch_no": batch_no,
                "company": company,
                "fiscal_year": fiscal_year,
                "idx":0,
                "is_cancelled": is_cancelled,
                "item_code": item_code,
                "qty_after_transaction": qty_after_transaction,
                "stock_uom": stock_uom,
                "voucher_detail_no": voucher_detail_no,
                "voucher_no": voucher_no,
                "voucher_type": "Sales Invoice",
                "warehouse": warehouse,
                "posting_date": posting_date,
                "posting_time": posting_time,
                "is_return": is_return
            })
            doc.insert(ignore_permissions=True)

            return doc
        except Exception as e:
            # frappe.throw(e)
            frappe.log_error(
                e, "CREATE STOCK LEDGER ENTRY ERROR/ stock_level_controller.py"
            )
            return None
        
    @frappe.whitelist(allow_guest=True)
    def create_material_request_item(
        item_code:str,
        sold_qty: int,
        schedule_date: str,
        parent: str
    ):
        item_details = frappe.get_doc("Item",{"item_code": item_code})

        uom = item_details.uoms[0].uom
        conversion_factor = item_details.uoms[0].conversion_factor
        description = item_details.description


        doc = frappe.new_doc("Material Request Item")
        doc.qty = sold_qty
        doc.parent = parent
        doc.item_code = item_code
        doc.schedule_date = schedule_date
        doc.parenttype = "Material Request"
        doc.conversion_factor = conversion_factor
        doc.uom = uom
        doc.description = description


        doc.save()
        print(doc,"_________________________________________________________________")
        frappe.db.commit()
        # frappe.throw(f"""Item {item_code} is running low on stock a requistion order has been raised""")
        return doc
        
    @frappe.whitelist(allow_guest=True)
    def create_material_request(
        branch: str,
        item_code: str,
        material_request_type: str,
        target_warehouse: str,
        company: str,
        sold_qty: int,
        source_warehouse: str = None,
    ):
        """
        Check 
        If item already exists, update reorder quantity and notify user
        If item does not exist, Create item in the material request.
        If material request does not exist, Create a new material request with the item and notify user
        """
        try:
            # Check if material request exists for that branch

            current_request = frappe.get_doc(
                "Material Request",
                {
                    "material_request_type": "Purchase",
                    "status": "Draft",
                    "branch": branch
                },
                ["name"]
            )


            # if material request is available check if item is already in the request
            if current_request:
                frappe.throw(current_request)
                # return
                items = current_request.items
                item_found = False
                for item in items:
                    if item.item_code == item_code:

                        current_reorder_qty = item.qty
                        # Add sold items to reorder quantity
                        request_item = frappe.get_doc("Material Request Item",{"item_code": item_code,"parent":current_request.name})
                        request_item.db_set("qty", current_reorder_qty + sold_qty)
                        request_item.db_set("stock_qty", current_reorder_qty + sold_qty)

                        # Mark Found as True
                        item_found = True

                        return request_item
                        
                if item_found == False:
                    # Create new material item entry for that item
                    today = frappe.utils.data.today()
                    scheduled_delivery_date = add_days(today, 7)
                    formatted_date = formatdate(scheduled_delivery_date,"yyyy-MM-dd")

                    req_item = StockLevelController.create_material_request_item(
                        item_code,
                        "10",
                        formatted_date,
                        current_request.name
                    )
                    
                    return req_item
            # else:

                
        except Exception as e:
        # try:
            item_details = frappe.get_doc("Item",{"item_code": item_code})
            uom = item_details.uoms[0].uom
            conversion_factor = item_details.uoms[0].conversion_factor
            description = item_details.description

            material_request = frappe.new_doc("Material Request")
            material_request_items = frappe.new_doc("Material Request Item")

            material_request.idx = 1
            material_request.material_request_type = material_request_type
            material_request.company = company
            material_request.set_warehouse = target_warehouse
            material_request.branch = branch

            material_request_items.idx = 1
            material_request_items.item_code = item_code
            material_request_items.qty = sold_qty
            material_request_items.schedule_date = '2023-05-30'  
            material_request_items.parenttype = "Material Request"
            material_request_items.conversion_factor = conversion_factor
            material_request_items.uom = uom
            material_request_items.description = description


            material_request.append("items", material_request_items)
            material_request.save()
            
            frappe.db.commit()
            frappe.throw(f"""Item {item_code} is running low on stock a Requisition order for this item has been raised.""")
            print(material_request,"------------------------------------------------------------------------------")
            return material_request     
        # except Exception as e:
        #     frappe.throw("Error on creating requisirion request")
        #     frappe.log_error(e,"Error on creating requisirion request")     
        # frappe.log_error(e,"Error on Creating material request /stock_controller.py")
        # return None

    @frappe.whitelist(allow_guest=True)
    def check_item_reorder_levels(
        item_code: str,
        warehouse: str
    ):
        """
        Use Item_ code and Warehouse to get item reorder levels
        """
        reoder_levels = frappe.db.get_value(
            "Item Reorder",
            {"parent": item_code, "warehouse":warehouse},
            ["warehouse_reorder_level", "material_request_type", "warehouse_reorder_qty"],
             as_dict=True
        )
        if reoder_levels:
            return reoder_levels
        else:
            return None

    @frappe.whitelist(allow_guest=True)
    def deduct_vaccine(
        item_code: str,
        warehouse: str,
        batch_no: str,
        sold_qty: int,
        invoice: str,
        voucher_detail_no: str,
        company: str,
        posting_date: str,
        posting_time: str,
        encounter: str
    ):
        """
        Use item code and warehouse to query bin doctype[done]
        Use item code to query Batch doctype [done]
        Compare both quantities with sold quantities
        If order can be fulfilled continue else throw error of insufficient stock.
        After deducting stock set dispensed as true to prevent a second dispensement
        """
        try:
      
            batch_details = frappe.db.get_value(
                "Batch",{"item": item_code, "name": batch_no},
                ["item","batch_qty","expiry_date", "name"],
                as_dict=True
            )

            if batch_details:


                bin_details = frappe.db.get_value(
                    "Bin",
                    {"item_code": item_code,"warehouse": warehouse},
                    ["item_code", "actual_qty","warehouse","name"],
                    as_dict=True                
                )

                if bin_details is None:
                    frappe.throw(f"""Item {item_code} is not available in warehouse {warehouse}""")
                    return None


                bin_name = bin_details.name
                bin_quantity = bin_details.actual_qty

                # if sold_qty > bin_details.actual_qty:
                #     frappe.throw(f"Insufficient stock in warehouse {warehouse} remaining {bin_details.actual_qty} wanted {sold_qty}")
                #     return None
                
                # elif sold_qty > batch_details.batch_qty:
                #     frappe.throw(f"Insufficient stock in batch {batch_no} remaining {batch_details.batch_qty} wanted {sold_qty}")
                #     return None
                
                # elif sold_qty <= batch_details.batch_qty and sold_qty <= bin_details.actual_qty:
                if sold_qty:
                    # Create stock ledger entry

                    actual_qty = - int(sold_qty)
                    qty_after_transaction = bin_quantity + actual_qty

                    # return None
                    fiscal_year = datetime.now().year
                    is_cancelled = 0
                    voucher_detail_no = voucher_detail_no
                    voucher_no = invoice
                    warehouse = warehouse

                    now = frappe.utils.now()
                    today = frappe.utils.nowdate()  

                    stock_ledger = StockLevelController.create_stock_ledger_entry(
                        actual_qty,
                        qty_after_transaction,
                        batch_no,
                        company,
                        fiscal_year,
                        is_cancelled,
                        item_code,
                        "Nos",
                        voucher_detail_no,
                        voucher_no,
                        warehouse,
                        today,
                        now
                    )

                    if stock_ledger:

                        # print("Quantities sold", sold_qty,"Quantities in total", bin_quantity)

                        # Reduce stock from Bin
                        reduce_bin_quantity = frappe.get_doc("Bin", bin_name)
                        reduce_bin_quantity.db_set("actual_qty", bin_quantity-sold_qty)
                        reduce_bin_quantity.db_set("projected_qty", bin_quantity-sold_qty)
                        
                        
                        # Reduce stock from batch
                        reduce_batch_stock = frappe.get_doc("Batch",{"item": item_code,"name": batch_no})
                        reduce_batch_stock.db_set("batch_qty",batch_details.batch_qty - sold_qty)

                        # Check Reorder Levels and create material request when needed
                        reoder_levels = StockLevelController.check_item_reorder_levels(item_code,warehouse)
                        if reoder_levels:
                            cur_branch = frappe.db.get_value(
                                "Sales Invoice",
                                {"name": invoice},
                                ["branch"]
                            )
                            if cur_branch:
                                # Check reorder level and compare to current stock
                                if qty_after_transaction <= reoder_levels.warehouse_reorder_level:
                                    StockLevelController.create_material_request(
                                        cur_branch,
                                        item_code,
                                        "Purchase",
                                        warehouse,
                                        company,
                                        sold_qty
                                    )
                            else:
                                frappe.throw("Current invoice has no branch. Some stock management functions may not work properly")


                        
                        # Set items on encounter and sales invoice to dispensed
                        # Use Encounter and item code to get prescritpion entry
                        # use Voucher detail number to get sales invoice item and set dispensed to true
                        frappe.db.set_value(
                            "Sales Invoice Item",
                            {"name": voucher_detail_no},
                            {
                                "dispensed": 1
                            }
                        )

                        frappe.db.set_value(
                            "Wellbaby Vaccine Details",
                            {"parent": encounter, "drug": item_code},
                            {
                                "vaccine_dispensed": 1
                            }
                        )
                        
                       
                    else:
                        frappe.throw("Stock Could not be Updated, try again")
                        return None

                
                    # frappe.db.commit()
                    # bin = frappe.get_doc("Bin", bin_name)

                    # return bin
                else:
                    frappe.throw("Error occured on stock deduction")
                    return None
            else:

                # print("Item Has NO batch")

                bin_details = frappe.db.get_value(
                    "Bin",
                    {"item_code": item_code,"warehouse": warehouse},
                    ["item_code", "actual_qty","warehouse","name"],
                    as_dict=True                
                )

                if bin_details is None:
                    frappe.throw(f"""Item {item_code} is not available in warehouse {warehouse}""")
                    return None


                bin_name = bin_details.name
                bin_quantity = bin_details.actual_qty

                # if sold_qty > bin_details.actual_qty:
                #     frappe.throw(f"Insufficient stock in warehouse {warehouse}")
                #     return None

                # Create Stock ledger entry
                actual_qty = - int(sold_qty)
                qty_after_transaction = bin_quantity + actual_qty

                fiscal_year = datetime.now().year
                is_cancelled = 0
                voucher_detail_no = voucher_detail_no
                voucher_no = invoice
                warehouse = warehouse

                now = frappe.utils.now()
                today = frappe.utils.nowdate()  

                stock_ledger = StockLevelController.create_stock_ledger_entry(
                    actual_qty,
                    qty_after_transaction,
                    None,
                    company,
                    fiscal_year,
                    is_cancelled,
                    item_code,
                    "Nos",
                    voucher_detail_no,
                    voucher_no,
                    warehouse,
                    today,
                    now
                )

                if stock_ledger:

                    # print("Quantities sold", sold_qty,"Quantities in total", bin_quantity)

                    # Check Reorder Levels and create material request when needed
                    reoder_levels = StockLevelController.check_item_reorder_levels(item_code,warehouse)
                    if reoder_levels:
                        cur_branch = frappe.db.get_value(
                            "Sales Invoice",
                            {"name": invoice},
                            ["branch"]
                        )
                        if cur_branch:
                            # Check reorder level and compare to current stock
                            if qty_after_transaction <= reoder_levels.warehouse_reorder_level:
                                StockLevelController.create_material_request(
                                    cur_branch,
                                    item_code,
                                    reoder_levels.material_request_type,
                                    warehouse,
                                    company,
                                    sold_qty
                                )
                        else:
                            frappe.throw("Current invoice has no branch. Some stock management functions may not work properly")


                    
                    frappe.db.set_value(
                        "Bin",
                        bin_name,
                        {
                            "actual_qty": bin_quantity-sold_qty,
                            "projected_qty": bin_quantity-sold_qty
                        },update_modified=True
                    )
                    frappe.db.set_value(
                        "Wellbaby Vaccine Details",
                        {"parent": encounter, "drug": item_code},
                        {
                            "vaccine_dispensed": 1
                        },updated_modified=True
                    )
                    frappe.db.set_value(
                        "Sales Invoice Item",
                        {"name": voucher_detail_no},
                        {
                            "dispensed": 1
                        },update_modified=True
                    )

                    frappe.db.commit()
                else:
                    frappe.throw("Stock Could not be Updated, try again")
                    return None

            return bin_details        
        except Exception as e:
            print(e)
            return e

   
    @frappe.whitelist(allow_guest=True)
    def deduct_stock_from_invoice(
        item_code: str,
        warehouse: str,
        batch_no: str,
        sold_qty: int,
        invoice: str,
        voucher_detail_no: str,
        company: str,
        posting_date: str,
        posting_time: str
    ):
        """
        Use item code and warehouse to query bin doctype[done]
        Use item code to query Batch doctype [done]
        Compare both quantities with sold quantities
        If order can be fulfilled continue else throw error of insufficient stock.
        After deducting stock set dispensed as true to prevent a second dispensement.
        TODO:
        Check stock level after deducting and compare to reorder level.
        If stock level <= reoder level create material request
        """
        try:
            batch_details = frappe.db.get_value(
                "Batch",
                {"item": item_code, "name": batch_no},
                ["item","batch_qty","expiry_date", "name"],
                as_dict=True
            )
            if batch_details:
                bin_details = frappe.db.get_value(
                    "Bin",
                    {"item_code": item_code,"warehouse": warehouse},
                    ["item_code", "actual_qty","warehouse","name"],
                    as_dict=True                
                )

                if bin_details is None:
                    frappe.throw(f"""Item {item_code} is not available in warehouse {warehouse}""")
                    return None

                bin_quantity = bin_details.actual_qty
                bin_name = bin_details.name

                actual_qty = - int(sold_qty)
                qty_after_transaction = bin_quantity + actual_qty

                # return None
                fiscal_year = datetime.now().year
                is_cancelled = 0
                voucher_detail_no = voucher_detail_no
                voucher_no = invoice
                warehouse = warehouse

                now = frappe.utils.now()
                today = frappe.utils.nowdate()  

                stock_ledger = StockLevelController.create_stock_ledger_entry(
                    actual_qty,
                    qty_after_transaction,
                    batch_no,
                    company,
                    fiscal_year,
                    is_cancelled,
                    item_code,
                    "Nos",
                    voucher_detail_no,
                    voucher_no,
                    warehouse,
                    today,
                    now
                )

                if stock_ledger:
                    # Reduce stock from Bin
                    reduce_bin_quantity = frappe.get_doc("Bin", bin_name)
                    reduce_bin_quantity.db_set("actual_qty", bin_quantity-sold_qty)
                    reduce_bin_quantity.db_set("projected_qty", bin_quantity-sold_qty)

                    # Reduce stock from batch
                    reduce_batch_stock = frappe.get_doc("Batch",{"item": item_code,"name": batch_no})
                    reduce_batch_stock.db_set("batch_qty",batch_details.batch_qty - sold_qty)

                    frappe.db.set_value(
                        "Sales Invoice Item",
                        {"name": voucher_detail_no},
                        {
                            "dispensed": 1
                        }
                    )
                else:
                        frappe.throw("Stock Could not be Updated, try again")
                        return None
            else:
                # Items without batch
                bin_details = frappe.db.get_value(
                    "Bin",
                    {"item_code": item_code,"warehouse": warehouse},
                    ["item_code", "actual_qty","warehouse","name"],
                    as_dict=True                
                )

                if bin_details is None:
                    frappe.throw(f"""Item {item_code} is not available in warehouse {warehouse}""")
                    return None
                bin_name = bin_details.name
                bin_quantity = bin_details.actual_qty

                actual_qty = - int(sold_qty)
                qty_after_transaction = bin_quantity + actual_qty

                fiscal_year = datetime.now().year
                is_cancelled = 0
                voucher_detail_no = voucher_detail_no
                voucher_no = invoice
                warehouse = warehouse

                now = frappe.utils.now()
                today = frappe.utils.nowdate()  

                stock_ledger = StockLevelController.create_stock_ledger_entry(
                    actual_qty,
                    qty_after_transaction,
                    None,
                    company,
                    fiscal_year,
                    is_cancelled,
                    item_code,
                    "Nos",
                    voucher_detail_no,
                    voucher_no,
                    warehouse,
                    today,
                    now
                )
                if stock_ledger:
                    frappe.db.set_value(
                        "Bin",
                        bin_name,
                        {
                            "actual_qty": bin_quantity-sold_qty,
                            "projected_qty": bin_quantity-sold_qty
                        },update_modified=True
                    )
                    frappe.db.set_value(
                        "Sales Invoice Item",
                        {"name": voucher_detail_no},
                        {
                            "dispensed": 1
                        },update_modified=True
                    )
                    frappe.db.commit()
        except Exception as e:
            frappe.log_error(
                e, "Error deduction stock from invoice/stock_level_controller.py"
            )
            return {"message": False}
    
    
    
    @frappe.whitelist(allow_guest=True)
    def deduct_stock(
        item_code: str,
        warehouse: str,
        batch_no: str,
        sold_qty: int,
        invoice: str,
        voucher_detail_no: str,
        company: str,
        posting_date: str,
        posting_time: str,
        encounter: str,
        is_inpatient: bool = False
    ):
        """
        Use item code and warehouse to query bin doctype[done]
        Use item code to query Batch doctype [done]
        Compare both quantities with sold quantities
        If order can be fulfilled continue else throw error of insufficient stock.
        After deducting stock set dispensed as true to prevent a second dispensement.
        TODO:
        Check stock level after deducting and compare to reorder level.
        If stock level <= reoder level create material request
        """
        try:
            batch_details = frappe.db.get_value(
                "Batch",{"item": item_code, "name": batch_no},
                ["item","batch_qty","expiry_date", "name"],
                as_dict=True
            )

# Stock reduction for items with batch
            if batch_details:

                bin_details = frappe.db.get_value(
                    "Bin",
                    {"item_code": item_code,"warehouse": warehouse},
                    ["item_code", "actual_qty","warehouse","name"],
                    as_dict=True                
                )

                if bin_details is None:
                    frappe.throw(f"""Item {item_code} is not available in warehouse {warehouse}""")
                    return None


                bin_name = bin_details.name
                bin_quantity = bin_details.actual_qty

                # if sold_qty > bin_details.actual_qty:
                #     frappe.throw(f"Insufficient stock in warehouse {warehouse} remaining {bin_details.actual_qty} wanted {sold_qty}")
                #     return None
                
                # elif sold_qty > batch_details.batch_qty:
                #     frappe.throw(f"Insufficient stock in batch {batch_no} remaining {batch_details.batch_qty} wanted {sold_qty}")
                #     return None
                
                # elif sold_qty <= batch_details.batch_qty and sold_qty <= bin_details.actual_qty:
                
                if sold_qty:
                    # Create stock ledger entry

                    actual_qty = - int(sold_qty)
                    qty_after_transaction = bin_quantity + actual_qty

                    # return None
                    fiscal_year = datetime.now().year
                    is_cancelled = 0
                    voucher_detail_no = voucher_detail_no
                    voucher_no = invoice
                    warehouse = warehouse
                    now = frappe.utils.now()
                    today = frappe.utils.nowdate() 

                    stock_ledger = StockLevelController.create_stock_ledger_entry(
                        actual_qty,
                        qty_after_transaction,
                        batch_no,
                        company,
                        fiscal_year,
                        is_cancelled,
                        item_code,
                        "Nos",
                        voucher_detail_no,
                        voucher_no,
                        warehouse,
                        today,
                        now
                    )

                    if stock_ledger:

                        # print("Quantities sold", sold_qty,"Quantities in total", bin_quantity)

                        # Reduce stock from Bin
                        reduce_bin_quantity = frappe.get_doc("Bin", bin_name)
                        reduce_bin_quantity.db_set("actual_qty", bin_quantity-sold_qty)
                        reduce_bin_quantity.db_set("projected_qty", bin_quantity-sold_qty)
                        
                        
                        # Reduce stock from batch
                        reduce_batch_stock = frappe.get_doc("Batch",{"item": item_code,"name": batch_no})
                        reduce_batch_stock.db_set("batch_qty",batch_details.batch_qty - sold_qty)

                        # Check Reorder Levels and create material request when needed
                        # reoder_levels = StockLevelController.check_item_reorder_levels(item_code,warehouse)
                        # if reoder_levels:
                        #     cur_branch = frappe.db.get_value(
                        #         "Sales Invoice",
                        #         {"name": invoice},
                        #         ["branch"]
                        #     )
                        #     if cur_branch:
                        #         # Check reorder level and compare to current stock
                        #         if qty_after_transaction <= reoder_levels.warehouse_reorder_level:
                        #             StockLevelController.create_material_request(
                        #                 cur_branch,
                        #                 item_code,
                        #                 reoder_levels.material_request_type,
                        #                 warehouse,
                        #                 company,
                        #                 sold_qty
                        #             )
                        #     else:
                        #         frappe.throw("Current invoice has no branch. Some stock management functions may not work properly")


                        # Set items on encounter and sales invoice to dispensed
                        # Use Encounter and item code to get prescritpion entry
                        # use Voucher detail number to get sales invoice item and set dispensed to true
                        frappe.db.set_value(
                            "Sales Invoice Item",
                            {"name": voucher_detail_no},
                            {
                                "dispensed": 1
                            }
                        )

                        if is_inpatient == False:
                            frappe.db.set_value(
                                "Doctor Prescription Table",
                                {"parent": encounter, "medication": item_code},
                                {
                                    "dispensed": 1
                                }
                            )
                        
                       
                    else:
                        frappe.throw("Stock Could not be Updated, try again")
                        return None

                
                    # frappe.db.commit()
                    # bin = frappe.get_doc("Bin", bin_name)

                    # return bin
                else:
                    frappe.throw("Error occured on stock deduction")
                    return None
            else:

 # items with no batch
                bin_details = frappe.db.get_value(
                    "Bin",
                    {"item_code": item_code,"warehouse": warehouse},
                    ["item_code", "actual_qty","warehouse","name"],
                    as_dict=True                
                )

                if bin_details is None:
                    frappe.throw(f"""Item {item_code} is not available in warehouse {warehouse}""")
                    return None


                bin_name = bin_details.name
                bin_quantity = bin_details.actual_qty

                # if sold_qty > bin_details.actual_qty:
                #     frappe.throw(f"Insufficient stock in warehouse {warehouse}")
                #     return None

                # Create Stock ledger entry
                actual_qty = - int(sold_qty)
                qty_after_transaction = bin_quantity + actual_qty

                fiscal_year = datetime.now().year
                is_cancelled = 0
                voucher_detail_no = voucher_detail_no
                voucher_no = invoice
                warehouse = warehouse

                now = frappe.utils.now()
                today = frappe.utils.nowdate()  

                stock_ledger = StockLevelController.create_stock_ledger_entry(
                    actual_qty,
                    qty_after_transaction,
                    None,
                    company,
                    fiscal_year,
                    is_cancelled,
                    item_code,
                    "Nos",
                    voucher_detail_no,
                    voucher_no,
                    warehouse,
                    today,
                    now,
                )

                if stock_ledger:

                    # print("Quantities sold", sold_qty,"Quantities in total", bin_quantity)

                    frappe.db.set_value(
                        "Bin",
                        bin_name,
                        {
                            "actual_qty": bin_quantity-sold_qty,
                            "projected_qty": bin_quantity-sold_qty
                        },update_modified=True
                    )
                    if is_inpatient == False:
                        frappe.db.set_value(
                            "Doctor Prescription Table",
                            {"parent": encounter, "medication": item_code},
                            {
                                "dispensed": 1
                            },update_modified=True
                        )
                    frappe.db.set_value(
                        "Sales Invoice Item",
                        {"name": voucher_detail_no},
                        {
                            "dispensed": 1
                        },update_modified=True
                    )
                    # Check Reorder Levels and create material request when needed
                    # reoder_levels = StockLevelController.check_item_reorder_levels(item_code,warehouse)
                    # if reoder_levels:
                    #     cur_branch = frappe.db.get_value(
                    #         "Sales Invoice",
                    #         {"name": invoice},
                    #         ["branch"]
                    #     )
                    #     if cur_branch:
                    #         # Check reorder level and compare to current stock
                    #         if qty_after_transaction <= reoder_levels.warehouse_reorder_level:
                    #             StockLevelController.create_material_request(
                    #                 cur_branch,
                    #                 item_code,
                    #                 reoder_levels.material_request_type,
                    #                 warehouse,
                    #                 company,
                    #                 sold_qty
                    #             )
                    #     else:
                    #         frappe.throw("Current invoice has no branch. Some stock management functions may not work properly")



                    frappe.db.commit()
                else:
                    frappe.throw("Stock Could not be Updated, try again")
                    return None

            return bin_details        
        except Exception as e:
            print(e)
            return e

   
    @frappe.whitelist(allow_guest=True)
    def get_invoice_items(
        encounter: str
    ):

        invoice = frappe.db.get_value(
            "Sales Invoice", {"encounter": encounter}, 
            ["name", "company", "posting_date","posting_time"],
            as_dict=True
        )

        invoice_number = invoice["name"]
        invoiced_items = frappe.db.get_list(
            "Sales Invoice Item", {"parent": invoice_number},
            ["item_code","warehouse","batch_no", "qty", "name","is_service"]
        )

        return invoiced_items

    @frappe.whitelist(allow_guest=True)
    def get_batch_levels(item_code, batch_no):
        """Get stock levels in batch"""

        batch_details = frappe.db.get_value(
                "Batch",{"item": item_code, "name": batch_no},
                ["item","batch_qty","expiry_date", "name"],
                as_dict=True
            )
        return batch_details


    @frappe.whitelist(allow_guest=True)
    def return_stock(
        encounter:str,
        item_code: str,
        returned_qty: int = 0,

    ):
        """
        @params:
        item_code: str,
        warehouse: str,
        batch_no: str,
        sold_qty: int,
        invoice: str,
        voucher_detail_no: str,
        company: str,
        posting_date: str,
        posting_time: str,
        encounter: str

        Remove the item from invoice
        Mark dispensed as false (prescription table)
        Create stock ledger
        Update Bin (warehouse)
        If there is batch: Update batch
        """

        # Get current encounter
        from gch_custom.overrides.patient_encounter import GCHPatientEncounter

        current_encounter: GCHPatientEncounter = frappe.get_doc(
            "Patient Encounter", encounter
        )

        current_invoice = frappe.db.get_value(
            "Sales Invoice",
            {"encounter": current_encounter.name},
            ["name","posting_date","posting_time","company"],
            as_dict=True
        )
        sales_invoice_item = frappe.db.get_value(
            "Sales Invoice Item",
            {
                "parent": current_invoice.name,
                "item_code": item_code
            },
            ["name", "qty","warehouse", "batch_no","item_code"],
            as_dict=True
        )
        print(sales_invoice_item)
        bin_details = frappe.db.get_value(
            "Bin",
            {"item_code": item_code,"warehouse": sales_invoice_item.warehouse},
            ["item_code", "actual_qty","warehouse","name"],
            as_dict=True
        )


        if sales_invoice_item.batch:

            batch_details = frappe.db.get_value(
                "Batch",{"item": item_code, "name": sales_invoice_item.batch},
                ["batch_qty", "name"],
                as_dict=True
            )
            batch_qty = batch_details.batch_qty

            actual_qty = int(returned_qty)
            qty_after_transaction = bin_details.actual_qty + actual_qty

            fiscal_year = datetime.now().year
            is_return = 1
            voucher_detail_no = sales_invoice_item.name
            voucher_no = current_invoice.name
            warehouse = sales_invoice_item.warehouse

            now = frappe.utils.now()
            today = frappe.utils.nowdate() 

            stock_ledger = StockLevelController.create_stock_ledger_entry(
                actual_qty,
                qty_after_transaction,
                sales_invoice_item.batch_no,
                current_invoice.company,
                fiscal_year,
                0,
                item_code,
                "Nos",
                voucher_detail_no,
                voucher_no,
                warehouse,
                today,
                now,
                is_return
            )

            if stock_ledger:
                return_bin_quantity = frappe.get_doc("Bin", bin_details.name)
                return_bin_quantity.db_set("actual_qty", bin_details.actual_qty+actual_qty)
                return_bin_quantity.db_set("projected_qty", bin_details.actual_qty+actual_qty)

                return_batch_quantity = frappe.get_doc("Batch",{"item": item_code, "name": sales_invoice_item.batch_no})
                return_batch_quantity.db_set("batch_qty", batch_qty + actual_qty)

                # Set item on encounter and remove item from invoice
                initial_qty = int(sales_invoice_item.qty)
                returned_qty = int(returned_qty)
                if returned_qty == 0:
                    if initial_qty == returned_qty:
                        encounter_item = frappe.get_doc( "Doctor Prescription Table",{"parent": encounter,"medication": item_code})
                        encounter_item.db_set("dispensed", 0)                
                        encounter_item.db_set("dont_issue", 1)                
                        frappe.db.delete("Sales Invoice Item",{"name":voucher_detail_no})
                    elif initial_qty > returned_qty:
                        new_qty = initial_qty - returned_qty
                        encounter_item = frappe.get_doc( "Doctor Prescription Table",{"parent": encounter,"medication": item_code})
                        encounter_item.db_set("selling_quantity", new_qty)

                        sales_invoice_item = frappe.get_doc("Sales Invoice Item",{"name":voucher_detail_no})
                        total_amount = sales_invoice_item.rate * new_qty
                        sales_invoice_item.db_set("qty", new_qty)
                        sales_invoice_item.db_set("amount", total_amount)
                        sales_invoice_item.db_set("base_amount", total_amount)
                        encounter_item.db_set("total", total_amount)
                else:
                    encounter_item = frappe.get_doc( "Doctor Prescription Table",{"parent": encounter,"medication": item_code})
                    encounter_item.db_set("dispensed", 0)              
                    frappe.db.delete("Sales Invoice Item",{"name":voucher_detail_no})                
                frappe.db.commit()

            else:
                frappe.throw("Stock Could not be Updated, try again")
                return None

        else:
            actual_qty = int(returned_qty)
            qty_after_transaction = bin_details.actual_qty + actual_qty

            fiscal_year = datetime.now().year
            is_return = 1
            voucher_detail_no = sales_invoice_item.name
            voucher_no = current_invoice.name
            warehouse = sales_invoice_item.warehouse

            now = frappe.utils.now()
            today = frappe.utils.nowdate()  

            stock_ledger = StockLevelController.create_stock_ledger_entry(
                actual_qty,
                qty_after_transaction,
                sales_invoice_item.batch_no,
                current_invoice.company,
                fiscal_year,
                0,
                item_code,
                "Nos",
                voucher_detail_no,
                voucher_no,
                warehouse,
                today,
                now,
                is_return
            )

            if stock_ledger:
                initial_qty = int(sales_invoice_item.qty)
                returned_qty = int(returned_qty)
                if initial_qty == returned_qty:
                    encounter_item = frappe.get_doc( "Doctor Prescription Table",{"parent": encounter,"medication": item_code})
                    encounter_item.db_set("dispensed", 0)
                    encounter_item.db_set("dont_issue", 1)
                    frappe.db.delete("Sales Invoice Item",{"name":voucher_detail_no})
                elif initial_qty > returned_qty:
                    new_qty = initial_qty - returned_qty
                    encounter_item = frappe.get_doc( "Doctor Prescription Table",{"parent": encounter,"medication": item_code})
                    encounter_item.db_set("selling_quantity", new_qty)
                    
                    sales_invoice_item = frappe.get_doc("Sales Invoice Item",{"name":voucher_detail_no})
                    total_amount = sales_invoice_item.rate * new_qty
                    sales_invoice_item.db_set("qty", new_qty)
                    sales_invoice_item.db_set("amount", total_amount)
                    sales_invoice_item.db_set("base_amount", total_amount)

                return_bin_quantity = frappe.get_doc("Bin", bin_details.name)
                return_bin_quantity.db_set("actual_qty", bin_details.actual_qty+actual_qty)
                return_bin_quantity.db_set("projected_qty", bin_details.actual_qty+actual_qty)

                


                # frappe.db.delete("Sales Invoice Item",{"name":voucher_detail_no})
                frappe.db.commit()

        
        return {"message": True}


    @frappe.whitelist(allow_guest=True)
    def deduct_vaccination_stock(encounter: str):
        """
        Use Encounter number to get all vaccinations in said encounter.
        Use Item_code to trigger a reduction in the item
        Set Vaccine_issued as true and dispensed as true in sales invoice item
        """
        from gch_custom.overrides.patient_encounter import GCHPatientEncounter
        from gch_custom.services.rest import get_encounter_vaccinations
        current_encounter: GCHPatientEncounter = frappe.get_doc(
            "Patient Encounter", encounter
        )
        current_invoice = frappe.db.get_value(
            "sales Invoice",
            {"encounter": current_encounter.name},
            ["name","posting_date","posting_time","company"],
            as_dict=True
        )
        
        vaccinations = get_encounter_vaccinations(current_encounter.name)


    @frappe.whitelist(allow_guest=True)
    def pricelist(item_code: str):
        try:

            user = frappe.session.user
            user_branch = frappe.db.get_value(
                "Practitioner Station Entry",
                {
                    "user": user
                },
                ["branch"]
            )

            branch_selling_price_list = frappe.db.get_value(
                "Branch", {"branch": user_branch}, ["default_selling_price_list"]
            )
            pricelist = ""
            if branch_selling_price_list:
                pricelist = branch_selling_price_list
            else:
                pricelist = "Standard Selling"
            fee = frappe.db.get_value(
                "Item Price",
                {"item_code": item_code, "price_list": pricelist},
                ["price_list_rate"],
            )
            if fee:
                return fee
            else:
                frappe.throw(f"Item with item_code {item_code} has no default price list")
        except Exception as e:
            frappe.log_error(e, "REST ERROR /rest.py")
            return e
        

    @frappe.whitelist(allow_guest=True)
    def get_outsourced_services(type: str, encounter: str):
        """
        Use encounter to get outsourced services 
        """
        try:
            if type == "outpatient":
                services = frappe.db.get_list(
                    "Outsourced Services",
                    filters={"encounter": encounter},
                    fields=["name","status"]
                )
                # return services
            elif type == "inpatient":
                services = frappe.db.get_list(
                    "Outsourced Services",
                    filters={"inpatient_record": encounter},
                    fields=["name", "status"]
                )
                # return services
            # Fetch child items for each service
            for service in services:
                # Fetch the child table "Outsourced Service Item" linked to each service
                service_items = frappe.get_all(
                    "Outsourced Service Item",  # Child table name
                    filters={"parent": service.name},  # Link child items to the parent service
                    fields=["item_name", "quantity", "rate"]  # Specify the fields to fetch from the child table
                )

                # Append child items to each service record
                service["items"] = service_items

            return services if services else {}
        except Exception as e:
            frappe.log_error(
                e,
                "error getting outsourced services"
            )
            return False
    
        
    @frappe.whitelist(allow_guest=True)
    def test_rad_presc(encounter:str):
        tests = frappe.db.get_list(
            "Lab Prescription",
            filters={}
        )
        