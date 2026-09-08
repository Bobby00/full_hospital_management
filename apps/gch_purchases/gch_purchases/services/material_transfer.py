import frappe
import datetime



class MaterialTransferController:
    @frappe.whitelist(allow_guest=True)
    def get_user_current_warehouse():
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
        
    @frappe.whitelist(allow_guest=True)
    def set_global_warehouse():
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
                frappe.flags.global_warehouse = warehouse_name

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
                    frappe.flags.global_warehouse = warehouse_name
                elif warehouse is None and branch == "Mombasa":
                    frappe.flags.global_warehouse = "Pharmacy MSA - GCH"
                else:
                    warehouse_name = str(branch) + " " + "Pharmacy - GCH"
                    frappe.flags.global_warehouse = "Pharmacy MSA - GCH"
            else: 
                frappe.throw("Please select station")
            
        except Exception as e:
            frappe.log_error(
                e, "Error getting user warehouse/ purchases/material_transfer.py"
            )
            return e


    @frappe.whitelist(allow_guest=True)
    def create_request_item(item: object):
        """
        formats request items before ther are added to a request parent
        """
        return
    
    @frappe.whitelist(allow_guest=True)
    def render_orders_by_date(start_date = None, end_date = None, page: str = None,received: bool = False):
        """"
        Render orders based on selected range.
        """
        try:
            # if start_date and end_date:
            if page:
                orders = frappe.get_all(
                    "Purchase Order",
                    filters={"creation": (">=", start_date), "transaction_date": ("<=", end_date)},
                    fields=["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","level_2_approval","grand_total","creation"],
                    order_by="name desc"
                )
                return orders
            elif received:
                orders = frappe.get_all(
                    "Purchase Order",
                    filters={"creation": ["between",start_date,end_date], "sent_to_supplier": 1,"workflow_state": "Approved","status": "To Receive and Bill"},
                    fields=["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","level_2_approval","grand_total","creation"],
                    order_by="name desc"
                )
                return orders
            else:
                orders = frappe.get_all(
                    "Purchase Order",
                    filters={"creation": (">=", start_date), "transaction_date": ("<=", end_date), "sent_to_supplier": 0,"workflow_state": "Approved"},
                    fields=["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","level_2_approval","grand_total","creation"],
                    order_by="name desc"
                )
                return orders
        except Exception as e:
            frappe.log_error(
                e, "Erorr get orders by date"
            )

    @frappe.whitelist(allow_guest=True)
    def render_orders_by_po_number(po_number):
        """
        Use Po Number to fetch items from purchase order
        """
        try:
            po_items = frappe.get_all(
                    "Purchase Order",
                    filters={"name": po_number, "sent_to_supplier": 1,"workflow_state": "Approved","status": "To Receive and Bill"},
                    fields=["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","level_2_approval","grand_total","creation"],
                    order_by="name desc"
                )
            return po_items
        except Exception as e:
            frappe.log_error(
                e, "Erorr get orders by po number"
            )

    @frappe.whitelist(allow_guest=True)
    def render_orders_by_branch(branch: str,all: bool = False):
        """"
        Render orders based on selected range.
        """
        try:
            if all:
                orders = frappe.get_all(
                    "Purchase Order",
                    filters={"branch": branch},
                    fields=["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","level_2_approval","grand_total","creation"],
                    order_by="name desc"
                )
                return orders
            else:
                orders = frappe.get_all(
                    "Purchase Order",
                    filters={"branch": branch,"sent_to_supplier": 0,"workflow_state": "Approved"},
                    fields=["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","level_2_approval","grand_total","creation"],
                    order_by="name desc"
                )
                return orders
            # else:
            #     # orders = frappe.db.get_list(
            #     #     "Purchase Order",
            #     #     {"workflow_state": "Approved", "sent_to_supplier": 0},
            #     #     ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","level_2_approval","grand_total"]
            #     # )
            #     orders = [start_date, end_date]
            #     return orders
            # return start_date, end_date
        except Exception as e:
            frappe.log_error(
                e, "Erorr get orders by branch"
            )

    @frappe.whitelist(allow_guest=True)
    def render_orders_by_supplier(supplier: str,all: bool = False,receive: bool = False):
        """"
        Render orders based on selected range.
        """
        try:           
            if all:
                orders = frappe.get_all(
                    "Purchase Order",
                    filters={"supplier": supplier},
                    fields=["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","level_2_approval","grand_total","creation","first_approval","final_approval"],
                    order_by = "name desc"
                )
                return orders
            elif receive:
                user_ = frappe.session.user
                user_branch = frappe.db.get_value(
                    "Practitioner Station Entry",
                        {"user": user_},
                        [
                            "branch"
                        ]
                )
                orders = frappe.db.get_list(
                    "Purchase Order",
                    filters={"workflow_state": "Approved", "sent_to_supplier": 1,"supplier": supplier,'status': "To Receive and Bill","branch": user_branch},
                    fields=["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","level_2_approval","grand_total","creation","first_approval","final_approval"],
                    order_by = "name desc"
                )
                return orders
            else:
                orders = frappe.db.get_list(
                    "Purchase Order",
                    filters={"workflow_state": "Approved", "sent_to_supplier": 0,"supplier": supplier},
                    fields=["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","level_2_approval","grand_total","creation","first_approval","final_approval"],
                    order_by = "name desc"
                )
                return orders
        except Exception as e:
            frappe.log_error(
                e, "Erorr get orders by supplier"
            )


    @frappe.whitelist(allow_guest=True)
    def generate_material_request_warehouse(warehouse:str,items: object):
        """
        Use items in the warehouse to create material request for user
        If user has a draft pending as user to merge
        """

        # check if if there is a pending request already if mode of generation is automatic for that branch
        today = frappe.utils.today()

         
        user_branch = items[0].branch
        # return items
        # warehouse = frappe.db.get_list(
        #     "Warehouse",
        #     {"branch":branch,"service_unit": "Pharmacy - GCH"},
        #     ["name"], ignore_permissions=True
        # )
        user_warehouse = warehouse
        already_exists = frappe.db.get_value(
            "Material Request",
            {"generation_type": "Automated", "status": "Draft", "warehouse": warehouse, "branch": user_branch},
            ["name","generation_type", "status", "docstatus", "branch"],
            as_dict=True
        )
        # print(user_warehouse,"alre---------------------------------------ady_exists",already_exists)
        # return already_exists

        if already_exists:
            return already_exists
        else:
            # Create Material request
            Material_request = frappe.new_doc("Material Request")
            Material_request.material_request_type = "Purchase"
            Material_request.company = MaterialTransferController.default_company()
            Material_request.set_warehouse = user_warehouse
            Material_request.branch = user_branch
            Material_request.warehouse = user_warehouse
            Material_request.generation_type = "Automated"
            Material_request.title = f"Purchase request from {user_branch} ({user_warehouse})"

            purchase_items = items
            idx = 0
            for item in purchase_items:
                material_request_item = frappe.new_doc("Material Request Item")
                material_request_item.idx= idx
                material_request_item.item_code = item.item_code

                supplier = ""
                
                if item.default_supplier is None:
                    # frappe.throw(f"Item {item.description} has no set default supplier ")
                    supplier = "Main Stores"
                    # frappe.log_error(f"Error creating material request.Item {item.description} has no default supplier. ")
                    # return None
                else:
                    supplier = item.default_supplier
                
                material_request_item.qty = item.total_qty_sold
                material_request_item.schedule_date = today  
                material_request_item.parenttype = "Purchase"
                material_request_item.conversion_factor = item.conversion_factor
                material_request_item.uom = item.uom
                material_request_item.description = item.description
                material_request_item.selected_supplier = supplier
                material_request_item.current_stock = item.current_stock


                # material_request_items.append(material_request_items)
                idx +1
                Material_request.append("items", material_request_item)
            Material_request.save(ignore_permissions=True)
            frappe.db.commit()


            return Material_request

    @frappe.whitelist(allow_guest=True)
    def generate_material_request(branch:str,items: object, item_type:str ='Drugs'):
        """
        Use items in the warehouse to create material request for user
        If user has a draft pending as user to merge
        """

        # check if if there is a pending request already if mode of generation is automatic for that branch
        today = frappe.utils.today()

         
        user_branch = branch
        warehouse = frappe.db.get_list(
            "Warehouse",
            {"branch":branch,"service_unit": "Pharmacy - GCH"},
            ["name"], ignore_permissions=True
        )
        user_warehouse = warehouse[0].name
        already_exists = frappe.db.get_value(
            "Material Request",
            {"generation_type": "Automated", "status": "Draft", "branch": user_branch},
            ["name","generation_type", "status", "docstatus", "branch"],
            as_dict=True
        )


        if already_exists:
            return already_exists
        else:
            # Create Material request
            Material_request = frappe.new_doc("Material Request")
            Material_request.material_request_type = "Purchase"
            Material_request.company = MaterialTransferController.default_company()
            Material_request.set_warehouse = user_warehouse
            Material_request.branch = user_branch
            Material_request.generation_type = "Automated"
            Material_request.item_type = item_type

            purchase_items = items
            idx = 0
            for item in purchase_items:
                #TODO: Implement a function to do this and just call it instead(Levy)
                current_stock = 0

                if item.current_stock:    
                    current_stock = int(item.current_stock)
                suggested_qty = int((int(item.total_qty_sold)/140) * 21) - current_stock

                if suggested_qty > 0:
                    material_request_item = frappe.new_doc("Material Request Item")
                    material_request_item.idx= idx
                    material_request_item.item_code = item.item_code
                    material_request_item.rate = item.rate
                    material_request_item.selling_unit_price = item.selling_price
                    
                    if item.default_supplier is None:
                        supplier = "Main Stores"
                        # frappe.throw(f"Item {item.description} has no set default supplier ")
                        # frappe.log_error(f"Error creating material request.Item {item.description} has no default supplier. ")
                        # return None
                    else:
                        supplier = item.default_supplier 

                    material_request_item.qty = suggested_qty
                    material_request_item.schedule_date = today  
                    material_request_item.parenttype = "Purchase"
                    material_request_item.conversion_factor = item.conversion_factor
                    material_request_item.uom = item.uom
                    material_request_item.description = item.description
                    material_request_item.selected_supplier = supplier
                    material_request_item.current_stock = current_stock
                    idx +1
                    Material_request.append("items", material_request_item)
            Material_request.save(ignore_permissions=True)
            frappe.db.commit()


            return Material_request
        

    @frappe.whitelist(allow_guest=True)
    def get_material_request_fields(material_request: str):
        """Use Material request to get details"""
        try:
            material_request = frappe.get_doc("Material Request",
                                material_request              
                                )
            return material_request
        except Exception as e:
            frappe.throw(e,"Error")
    
    
    @frappe.whitelist(allow_guest=True)
    def update_material_request_status(material_request: str):
        try:
            doc = frappe.get_doc("Material Request",
                                material_request              
                                )
            doc.db_set('status', "Received")
            doc.db_set('workflow_state', "Received")
            return doc
        except Exception as e:
            frappe.throw(e,"Error")
        return
    
    @frappe.whitelist(allow_guest=True)
    def get_request_from_picklist(pick_list: str):
        """
        Get Material Request from pick list
        Update material request status
        """
        try:
            picklist_item = frappe.get_doc(
                "Pick List",
                {"name":pick_list}
            )
            if picklist_item.material_request:
                material_request_doc = frappe.get_doc(
                    "Material Request",
                    {"name": picklist_item.material_request}
                )
                material_request_doc.set("status", "Transferred")
                material_request_doc.set("workflow_state", "Transferred")
                
                return material_request_doc.name           
            
            return {"message": False}
        except Exception as e:
            frappe.throw(e)
            return e

    @frappe.whitelist(allow_guest=True)
    def check_if_item_needs_reorder(item_code: str, warehouse: str):
        """
        Use Item_code and warehouse tocheck item reorder levels
        """
        reoder_levels = frappe.db.get_value(
            "Item Reorder",
            {"parent": item_code, "warehouse":warehouse},
            ["warehouse_reorder_level", "material_request_type", "warehouse"]
        )
        if reoder_levels:
            return reoder_levels
        else:
            return None
        
    @frappe.whitelist(allow_guest=True)
    def get_items_sold_over_the_last_two_weeks(
            branch: str,
            from_date: str = None,
            to_date: str = None
        ):
        """
        Use Branch to get items sold in the Branch in the last 2 weeks
        """
        selected_branch = branch
        start_day = "27-01-2023"
        end_day = "29-03-2023"

        query = """
            SELECT 
                i.name AS item_code, 
                SUM(si.qty) AS total_qty_sold, 
                w.reorder_level, 
                i.stock_uom, 
                i.conversion_factor, 
                sle.actual_qty AS current_stock
            FROM 
                `tabSales Invoice` si
            INNER JOIN 
                `tabSales Invoice Item` sii ON sii.parent = si.name
            INNER JOIN 
                `tabWarehouse` w ON si.warehouse = w.name
            INNER JOIN 
                `tabItem` i ON sii.item_code = i.name
            LEFT JOIN 
                `tabStock Ledger Entry` sle ON sle.item_code = i.name AND sle.warehouse = si.warehouse
            WHERE 
                si.docstatus = 1 
                AND si.warehouse = '{warehouse_name}' 
                AND si.posting_date BETWEEN '{start_date}' AND '{end_date}'
                AND i.is_stock_item = 1
                AND i.disabled = 0
            GROUP BY 
                sii.item_code, 
                si.warehouse;

        """
        sales_invoice_per_branch = frappe.get_all(
            "Sales Invoice",
            filters = {
                "posting_date": (">=", start_day),
                "posting_date": ("<=", end_day),
                "branch": selected_branch
            },
            fields=["name"]
        )

        sales_invoice1 = frappe.db.sql(query, as_dict=True)

        return sales_invoice1
        

    @frappe.whitelist(allow_guest=True)
    def get_approved_po():
        try:
            orders = frappe.db.get_list(
                "Purchase Order",
                {"workflow_state": "Approved", "sent_to_supplier": 0},
                ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","level_2_approval","grand_total","first_approval","final_approval"]
            )
            return orders
        except Exception as e:
            frappe.log_error(e,"Error getting po to be sent to supplier")
            return {"message": False}
    
    @frappe.whitelist(allow_guest=True)
    def get_my_pos():
        try:
            user = frappe.session.user
            orders = frappe.db.get_list(
            "Purchase Order",
                {"owner": user},
                ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","level_2_approval","grand_total","final_approval"]  
            )
            return orders
        except Exception as e:
            frappe.log_error(e,"Error getting po to be sent to supplier material_transfer")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def get_links_to_purchase_receipt():
        """Get all links assosicated with a purchase receipt"""
        # links = frappe.get_all('Purchase Receipt', filters={'purchase_order': ['is','set']}, fields=["name","link"])
        links = frappe.get_doc("Purchase Receipt","MAT-PRE-2023-00002")
        order = links.get('purchase_order')
        return links

    @frappe.whitelist(allow_guest=True)
    def get_po_pending_approval():
        """
        Get all Pending purchase order
        """
        # user = frappe.session.user
        user_roles = frappe.get_roles()
        if "GCH-Clinical Supplier Incharge" in user_roles:
            orders = frappe.db.get_list(
                "Purchase Order",
                {"workflow_state": ["in",["Pending PSI Approval", "Pending PSI Review"]]},
                ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state", "branch", "level_1_approval","first_approval"]
            )
            return orders
        elif "GCH-Chief Pharmacist" in user_roles:
            orders = frappe.db.get_list(
                "Purchase Order",
                {"workflow_state": "Pending Chief Pharmacy Approval", "item_type": "Drugs"},
                ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch", "level_1_approval","final_approval", "level_2_approval","first_approval"]
            )
            return orders
        elif "GCH-Clinical Supplier Officer" in user_roles:
            orders = frappe.db.get_list(
                "Purchase Order",
                {"workflow_state": "Approved"},
                ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch", "level_1_approval", "level_2_approval","final_approval"]
            )
            return orders
        elif "GCH-Surgical Manager" in user_roles:
            orders = frappe.db.get_list(
                "Purchase Order",
                {"workflow_state": "Pending Surgical Manager Approval","item_type": "Non Drugs"},
                ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch", "level_1_approval", "level_2_approval","final_approval"]
            )
            return orders
        elif "GCH-Dental Manager" in user_roles:
            orders = frappe.db.get_list(
                "Purchase Order",
                {"workflow_state": "Pending Dental Manager Approval","item_type": "Dental"},
                ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch", "level_1_approval", "level_2_approval","final_approval"]
            )
            return orders
        return []
    
    @frappe.whitelist(allow_guest=True)
    def all_requests():
        """
        Get all purchase ordeer requests
        """
        try:
            pos = frappe.db.get_list(
                "Purchase Order",
                ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","first_approval","level_2_approval","final_approval","grand_total","sent_to_supplier"],
                order_by="name desc"
            )
            return pos
        except Exception as e:
            frappe.log_error(message=str(e), title="Error while getting Purchase Orders")
            return {"message": False}



    @frappe.whitelist(allow_guest=True)
    def get_po_pending_review():
        orders = frappe.db.get_list(
                "Purchase Order",
                {"workflow_state": "Pending Review"},
                ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch"]
            )
        return orders
    
    @frappe.whitelist(allow_guest=True)
    def get_requisition_pending(purpose:str):
        session_user = frappe.session.user
        user_branch = frappe.db.get_value(
            "Practitioner Station Entry",
                {"user": session_user},
                [
                    "branch"
                ]
        )
        reqs = frappe.db.sql("""
                SELECT
                    mr.name,
                    user.full_name as owner,
                    mr.transaction_date,
                    mr.set_warehouse,
                    mr.status
                FROM
                    `tabMaterial Request` as mr
                JOIN
                    `tabUser` as user ON mr.owner = user.name
                WHERE
                    mr.material_request_type = %s
                    AND mr.branch = %s
                    AND mr.status = "Pending"
                    AND mr.docstatus = 0
                ORDER BY
                    mr.transaction_date DESC                  
        """, (purpose, user_branch), as_dict=True)
        # reqs = frappe.db.get_list(
        #     "Material Request",
        #     {"material_request_type": purpose,"branch":user_branch, "Status": "Pending"},
        #     ["name","owner","transaction_date", "set_warehouse", "status","set_from_warehouse"]
        # )
        return reqs
    
    @frappe.whitelist(allow_guest=True)
    def get_requisition_pending_my_action(purpose:str):
        session_user = frappe.session.user
        user_branch = frappe.db.get_value(
            "Practitioner Station Entry",
                {"user": session_user},
                [
                    "branch",
                    "station"
                ],
                as_dict=True
        )
        branch = user_branch.branch
        user_warehouse = MaterialTransferController.get_user_current_warehouse()
        reqs = frappe.db.get_list(
            "Material Request",
            {"material_request_type": purpose,"branch":branch, "set_from_warehouse": user_warehouse, "status": "Submitted"},
            ["name","owner","transaction_date", "set_warehouse", "status","set_from_warehouse"]
        )
        return reqs
    
    @frappe.whitelist(allow_guest=True)
    def get_user_requisition_requests(purpose: str):
        session_user = frappe.session.user
        # reqs = frappe.db.get_list(
        #     "Material Request",
        #     {"material_request_type": purpose, "owner": session_user},
        #     ["name","owner","transaction_date", "set_warehouse", "status","set_from_warehouse"]
        # )
        reqs = frappe.db.sql("""
            SELECT
                mr.name as name,
                user.full_name as owner,
                mr.transaction_date as transaction_date,
                mr.set_warehouse as set_warehouse,
                mr.status as status
            FROM 
                `tabMaterial Request`as mr
            JOIN
                `tabUser` user on mr.owner = user.name
            WHERE
                mr.material_request_type = %s 
                AND mr.owner = %s
            ORDER BY
                mr.transaction_date DESC
        """,(purpose,session_user),as_dict=True)
        return  reqs

    

    @frappe.whitelist(allow_guest=True)
    def generate_po_based_branch_and_supplier(branch: str, items: object):
        """
        Generate Purchase Orders based on branch and items
        """
        po_branch = branch
        supplier_items = items
        for item in supplier_items:
            #Check if there is a po in draft where supplier and branch is same
            already_exists = frappe.db.get_list(
                "Purchase Order",
                {"supplier_name": item.selected_supplier,"status": "Draft"},
                ignore_permissions=True
            )

            print(already_exists,item.selected_supplier,"AAAAAAAAAAAAAAAAALLLLLLLLLLLLLREEEEEADY")
        return already_exists

    @frappe.whitelist(allow_guest=True)
    def get_all_items_in_users_warehouse():
        """
        Use logged in user to get current ware house
        Get all items in the users warehouse(stock qty)
        Compare with number of items sold and suggest reorder quantity.
        """
        warehouse = "3b3b6d17eb"

        # warehouse = MaterialTransferController.get_user_current_warehouse()
        start_date = frappe.utils.add_days(frappe.utils.nowdate(), -60)
        end_date = frappe.utils.nowdate()

        items  = frappe.db.sql("""
            SELECT 
                i.name AS item_code, 
                i.item_name AS item_name,
                b.warehouse AS warehouse,
                b.actual_qty as current_stock,
                defaults.default_supplier,
                uoms.uom,
                uoms.conversion_factor,
                i.description,
                COALESCE(SUM(CASE WHEN sle.posting_date BETWEEN %s AND %s THEN sle.actual_qty ELSE 1 END), 1) AS sold_qty
            FROM 
                `tabItem` AS i
            JOIN 
                `tabBin` AS b ON i.name = b.item_code
            LEFT JOIN 
                `tabStock Ledger Entry` AS sle ON b.warehouse = sle.warehouse AND b.item_code = sle.item_code
            LEFT JOIN
                `tabItem Default` AS defaults ON i.name = defaults.parent
            LEFT JOIN
                `tabUOM Conversion Detail` AS uoms ON i.name = uoms.parent
            WHERE
                b.warehouse = %s
            GROUP BY
                item_code
            
        """,(start_date, end_date,warehouse), as_dict=True)

        # item_list = frappe.db.get_list(
        #     "Bin",
        #     {
        #         "warehouse": warehouse
        #     },
        #     ["item_code", "actual_qty", "warehouse"]
        # )


        return items
    
    @frappe.whitelist(allow_guest=True)
    def get_items_to_buy_in_warehouse(warehouse: str):
        """
        Use warehouse name to get all items sold from that warehouse and the number of items to be bought.
        """
        warehouse_name = warehouse
        start_date = frappe.utils.add_days(frappe.utils.nowdate(), -60)
        end_date = frappe.utils.nowdate()

        items = frappe.db.sql("""
            SELECT
                si.item_code AS item_code,
                (
                    SELECT ig.parent_item_group from `tabItem Group`AS ig  WHERE i.item_group = ig.item_group_name
                ) AS item_group_parent,
                ig.parent_item_group AS parent_group,
                i.item_name AS item_name,
                i.description AS description,
                si.warehouse AS warehouse,
                s.branch,
                si.parent,
                defaults.default_supplier,
                uoms.uom,
                uoms.conversion_factor,
                SUM(si.qty) AS total_qty_sold,
                (
                   SELECT SUM(sle.actual_qty) FROM `tabStock Ledger Entry` AS sle
                   WHERE sle.item_code = si.item_code
                   AND sle.warehouse = si.warehouse
                ) AS current_stock
            FROM
                `tabSales Invoice Item` AS si
            JOIN 
                `tabSales Invoice` AS s ON si.parent = s.name
            JOIN 
                `tabItem` AS i ON si.item_code = i.name
            LEFT JOIN
                `tabUOM Conversion Detail` AS uoms ON i.name = uoms.parent
            LEFT JOIN
                `tabItem Default` AS defaults ON i.name = defaults.parent
            LEFT JOIN
                `tabItem Group` AS ig on i.item_group = ig.item_group_name
            WHERE
                s.posting_date BETWEEN %s AND %s
                AND si.is_service = 0 
                AND si.warehouse = %s
                AND ig.parent_item_group = "Drug"
            GROUP BY
                si.item_code
            ORDER BY
                total_qty_sold DESC;
        """, (start_date,end_date,warehouse_name),as_dict=True)

        return items


    
    @frappe.whitelist(allow_guest=True)
    def get_all_items_sold_in_branch(branch_name,type:str = "Drugs"):
        """
        Use logged in user to get current ware house
        Get all items in the users warehouse(stock qty)
        Compare with number of items sold and suggest reorder quantity.
        """
        branch = branch_name
        warehouse = MaterialTransferController.get_user_current_warehouse()
        start_date = frappe.utils.add_days(frappe.utils.nowdate(), -140)
        end_date = frappe.utils.nowdate()

        account = '5002 - COGS Drugs Sales - GCH'

        if type == "Drugs":
            account = '5002 - COGS Drugs Sales - GCH'
        elif type == "nondrug":
            account = '5003 - COGS Surgical Sales - GCH'
        elif type == 'Dental':
            account = '5002 - COGS Dental Sales - GCH'

        # print(start_date,end_date,branch,warehouse)
        # return branch

        items  = frappe.db.sql("""
            SELECT
                si.item_code AS item_code,
                i.item_name AS item_name,
                i.description AS description,
                i.pack_size,
                s.branch,
                si.parent,
                si.warehouse AS warehouse,
                defaults.default_supplier,
                uoms.uom,
                uoms.conversion_factor,
                SUM(si.qty) AS total_qty_sold,
                (
                    SELECT bin.actual_qty FROM `tabBin` AS bin
                    WHERE bin.item_code = si.item_code
                    AND bin.warehouse = si.warehouse
                ) AS current_stock,
                COALESCE(
                    (
                        SELECT ip.price_list_rate FROM `tabItem Price` AS ip
                        WHERE ip.item_code = si.item_code
                        AND ip.buying = 1
                        LIMIT 1
                    ), 0
                ) AS rate,
                COALESCE(
                    (
                        SELECT ip.price_list_rate FROM `tabItem Price` AS ip
                        WHERE ip.item_code = si.item_code
                        AND ip.selling = 1
                        LIMIT 1
                    ), 0
                ) AS selling_price
            FROM
                `tabSales Invoice Item` AS si
            JOIN 
                `tabSales Invoice` AS s ON si.parent = s.name
            JOIN 
                `tabItem` AS i ON si.item_code = i.name
            LEFT JOIN 
                `tabItem Default` AS id ON i.name = id.parent
            LEFT JOIN
                `tabUOM Conversion Detail` AS uoms ON i.name = uoms.parent
            LEFT JOIN
                `tabItem Default` AS defaults ON i.name = defaults.parent
            WHERE
                s.posting_date BETWEEN %s AND %s
                AND si.is_service = 0 
                AND s.branch = %s
                AND i.disabled = 0
                AND id.expense_account= %s
                AND si.warehouse = %s
            GROUP BY
                si.item_code
            ORDER BY
                total_qty_sold DESC;
            
        """,(start_date, end_date,branch,account,warehouse), as_dict=True)
        return items
    
    @frappe.whitelist(allow_guest=True)
    def create_purchase_order(material_request: str, item_type: str = "Drugs"):
        """
        Get Material request items and generate purchase orders for the items based on supplier
        """
        try:

            from itertools import groupby

            mr_object = frappe.get_doc("Material Request", material_request)
            # return mr_object

            sorted_items = sorted(mr_object.items, key=lambda item: item.selected_supplier)

            items_by_supplier = groupby(sorted_items, key=lambda item: item.selected_supplier)
            # return items_by_supplier
        
            for suppplier, items in items_by_supplier:

                suppplier = suppplier or "Main Stores"

                purchase_order_exists = frappe.db.get_value(
                    "Purchase Order",
                    {"supplier": suppplier, "docstatus": 0, "workflow_state": "Pending PSI Approval","branch": mr_object.branch,"warehouse": mr_object.warehouse, "item_type": item_type},
                    "name",as_dict=True
                )
                # return purchase_order_exists
                if purchase_order_exists:
                    purchase_order = frappe.get_doc("Purchase Order", purchase_order_exists)
                    po_items = purchase_order.items
                    for item in items:
                        # if any(po_['item_code'] == item.item_code for po_ in po_items):
                        #     frappe.throw("Item has already been ordered.")
                        # else:   
                        exists = False
                        for po_item in po_items:
                            if po_item.item_code == item.item_code:
                                exists = True
                                break
                        if exists:
                            frappe.msgprint(f"Item {item.item_name} has already been ordered.")
                        else:
                            purchase_order.append("items", {
                                "item_code": item.item_code,
                                "qty": item.qty,
                                # "schedule_date": datetime.date.today() + datetime.timedelta(days=6),
                                "rate": item.rate,
                                "selling_unit_price": item.selling_unit_price,
                                "warehouse": item.warehouse,
                                "material_request": material_request,
                                "material_request_item": item.name
                            })
                            # purchase_order.insert(ignore_permissions=True)
                            purchase_order.save(ignore_permissions=True)
                
                else:

                    purchase_order = frappe.new_doc('Purchase Order')
                    purchase_order.supplier = suppplier
                    purchase_order.schedule_date = datetime.date.today() + datetime.timedelta(days=6)
                    purchase_order.branch = mr_object.branch
                    purchase_order.warehouse = mr_object.warehouse
                    purchase_order.title = suppplier + " " + mr_object.branch
                    purchase_order.transaction_date = datetime.date.today()
                    purchase_order.item_type = item_type

                    print("Creating purchase order for supplier: ", mr_object.warehouse)

                    for item in items:
                        purchase_order.append("items", {
                            "item_code": item.item_code,
                            "qty": item.qty,
                            # "schedule_date": datetime.date.today() + datetime.timedelta(days=6),
                            "rate": item.rate,
                            "selling_unit_price": item.selling_unit_price,
                            "warehouse": item.warehouse,
                            "material_request": material_request,
                            "material_request_item": item.name
                        })
                    purchase_order.insert(ignore_permissions=True)
                    purchase_order.save()
                        # return purchase_order

            # mr_object.set_status("Ordered")
            # mr_object.save()

            return "Purchase Orders generated successfully."
        except Exception as e:
            frappe.log_error(message=str(e), title="Error while generating Purchase Orders")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def generate_request_for_user_branch():
        user = frappe.session.user
        user_branch = frappe.db.get_value(
            "Practitioner Station Entry",
                {"user": user},
                [
                    "branch"
                ]
        )
        items = MaterialTransferController.get_all_items_sold_in_branch(user_branch)
        if items:
            material_request = MaterialTransferController.generate_material_request(user_branch,items)
        else:
            frappe.throw(f"No Item has been moved in the past 2 weeks")
        return material_request
    
    @frappe.whitelist(allow_guest=True)
    def generate_request_for_user_branch_nondrugs():
        user = frappe.session.user
        user_branch = frappe.db.get_value(
            "Practitioner Station Entry",
                {"user": user},
                [
                    "branch"
                ]
        )
        items = MaterialTransferController.get_all_items_sold_in_branch(user_branch,'nondrug')
        if items:
            material_request = MaterialTransferController.generate_material_request(user_branch,items,"Non Drugs")
        else:
            frappe.throw(f"No Item has been moved in the past 2 weeks")
        return material_request


    @frappe.whitelist(allow_guest=True)
    def generate_request_for_user_branch_dental():
        user = frappe.session.user
        user_branch = frappe.db.get_value(
            "Practitioner Station Entry",
                {"user": user},
                [
                    "branch"
                ]
        )
        items = MaterialTransferController.get_all_items_sold_in_branch(user_branch,'Dental')
        if items:
            material_request = MaterialTransferController.generate_material_request(user_branch,items,"Dental")
        else:
            frappe.throw(f"No Item has been moved in the past 2 weeks")
        return material_request
 
   
    """"
    @TODO: 
    Create material request for all branchs [Done]
    To achieve this we need to get all items sold from that branch over the last 2 weeks [Done]
    Get all items sold in that branch from sales invoice.[Done]
    Create a material request with these items with default warehouse being Branch main waarehouse [Done]
    Create POs Based on these
     """
    
    @frappe.whitelist(allow_guest=True)
    def task():
        branch_list = frappe.db.get_list(
            "Branch",
            {"online": 1},
            ["name"],
            ignore_permissions=True
        )

        # Get warehouse in each branch and get items sold per warehouse
        warehouse_item_list = {}
        warehouses = frappe.db.sql("""
            SELECT w.name, w.branch
            FROM `tabWarehouse` AS w
            INNER JOIN `tabBranch` AS b ON w.branch = b.name
            WHERE b.online = 1
        """, as_dict=True)

        for warehouse in warehouses:
            items = MaterialTransferController.get_items_to_buy_in_warehouse(warehouse.name)
            warehouse_item_list[warehouse.name]=items
        # return warehouse_item_list
        
        for item in warehouse_item_list:
            print("Here",item)
            print("There",warehouse_item_list[item])
            if warehouse_item_list[item]:
                MaterialTransferController.generate_material_request_warehouse(item,warehouse_item_list[item])

        return warehouse_item_list
        item_list = {}
        for branch in branch_list:
            items = MaterialTransferController.get_all_items_sold_in_branch(branch.name)
            item_list[branch.name]=items

        
        for item in item_list:
            print("Here",item)
            print("There",item_list[item])
            # MaterialTransferController.generate_material_request(item,item_list[item])
            
        # frappe.log_error(item_list)
        return item_list

    
    
    @frappe.whitelist(allow_guest=True)
    def tasks():
        # Get All Submitted Mat requests and mark po-generated
        items = frappe.db.sql("""
            SELECT 
                m.name as material_request,
                m.warehouse as warehouse,
                IFNULL(m.branch, "No-Branch") AS branch,
                IFNULL(mri.selected_supplier,"MAIN STORES") AS selected_supplier,
                mri.item_code AS item_code,
                mri.po_generated,
                mri.name as material_request_item,
                i.item_name AS item_name,
                SUM(mri.qty) AS total_qty
            FROM 
                `tabMaterial Request` AS m
                JOIN `tabMaterial Request Item` AS mri ON m.name = mri.parent
                JOIN `tabItem` AS i ON mri.item_code = i.name
            WHERE 
                m.material_request_type = "Purchase"
                AND m.branch IS NOT NULL
                AND m.warehouse IS NOT NULL
                AND mri.po_generated = 0
                AND m.docstatus = 1
            GROUP BY 
                m.branch, mri.selected_supplier, mri.item_code, m.warehouse
            ORDER BY 
                m.branch, mri.selected_supplier, total_qty DESC;
        """, as_dict=True)
        purchase_orders = {}

        # return items

        for item in items:
            supplier = item.selected_supplier
            branch = item.branch
            item_code = item.item_code
            qty = item.total_qty
            
            key = supplier+ "~"+ branch
            
            if key not in purchase_orders:
                purchase_order = frappe.new_doc("Purchase Order")
                purchase_order.supplier = supplier
                purchase_order.branch = branch
                purchase_order.warehouse = item.warehouse
                purchase_order.schedule_date = datetime.date.today() + datetime.timedelta(days=1)
                purchase_orders[key] = purchase_order
            
            purchase_order = purchase_orders[key]
            purchase_order.append("items",{
                "item_code": item_code,
                "qty":abs(qty),
                "warehouse": item.warehouse
                # "material_request": item.material_request
            })
            # print("Purchase roder to be saved", purchase_order)
            purchase_order.save(ignore_permissions=True)
            # return purchase_order

            # Mark Item po generated as true
            material_request_item = frappe.get_doc(
                "Material Request Item",
                item.material_request_item
            )
            # return material_request_item
            material_request_item.po_generated = 1
            material_request_item.save()
            frappe.db.commit()

        return {"success": True}
        

        # # save all the purchase orders
        # for key in purchase_orders:
        #     purchase_orders[key].save(ignore_permissions=True)
        #     frappe.db.commit()

        # return purchase_orders
    
    @frappe.whitelist(allow_guest=True)
    def generate_po_branch(branch: str):
        # Get All Submitted Mat requests and mark po-generated
        items = frappe.db.sql("""
            SELECT 
                m.name as material_request,
                m.warehouse as warehouse,
                IFNULL(m.branch, "No-Branch") AS branch,
                IFNULL(mri.selected_supplier,"Default Supplys") AS selected_supplier,
                mri.item_code AS item_code,
                mri.po_generated,
                mri.name as material_request_item,
                i.item_name AS item_name,
                SUM(mri.qty) AS total_qty
            FROM 
                `tabMaterial Request` AS m
                JOIN `tabMaterial Request Item` AS mri ON m.name = mri.parent
                JOIN `tabItem` AS i ON mri.item_code = i.name
            WHERE 
                m.material_request_type = "Purchase"
                AND m.branch = %s
            GROUP BY 
                m.branch, mri.selected_supplier, mri.item_code
            ORDER BY 
                m.branch, mri.selected_supplier, total_qty DESC;
        """,{branch}, as_dict=True)
        purchase_orders = {}

        for item in items:
            supplier = item.selected_supplier
            branch = item.branch
            item_code = item.item_code
            qty = item.total_qty
            
            key = supplier+ "~"+ branch
            
            if key not in purchase_orders:
                purchase_order = frappe.new_doc("Purchase Order")
                purchase_order.supplier = supplier
                purchase_order.branch = branch
                purchase_order.schedule_date = datetime.date.today() + datetime.timedelta(days=1)
                purchase_order.title = supplier + " " + branch
                purchase_order.supplier_name = supplier + " " + branch
                purchase_orders[key] = purchase_order
                
            purchase_order = purchase_orders[key]
            purchase_order.append("items",{
                "item_code": item_code,
                "qty":abs(qty),
                # "material_request": item.material_request
            })
            # purchase_order.save(ignore_permissions=True)

        # save all the purchase orders
        for key in purchase_orders:
            purchase_orders[key].save(ignore_permissions=True)
            frappe.db.commit()

        return purchase_orders
    

    @frappe.whitelist(allow_guest=True)
    def update_purchase_order(field_name: str, doc_name: str):
        try:
            doc_to_update = frappe.get_doc("Purchase Order",doc_name)
            if field_name == "generated_by":
                doc_to_update.generated_by = frappe.session.user
                doc_to_update.generated_at = datetime.datetime.now()
                doc_to_update.save()
                return doc_to_update
            elif field_name == "level_1_approval":
                doc_to_update.level_1_approval = frappe.session.user
                doc_to_update.level_1_approval_at = datetime.datetime.now()
                doc_to_update.save()
                return doc_to_update
            elif field_name == "level_2_approval":
                doc_to_update.level_2_approval = frappe.session.user
                doc_to_update.level_2_approval_at = datetime.datetime.now()
                doc_to_update.save()
                return doc_to_update
        except Exception as e:
            frappe.throw(f"Error capturing Process action {e}")

    @frappe.whitelist(allow_guest=True)
    def get_all_pos():
        pos = frappe.db.get_list(
            "Purchase Order",
            ignore_permissions=True
        )
        return pos
    

    @frappe.whitelist(allow_guest=True)
    def get_warehouse_from_online_branch(item: str):
        has_batch = frappe.db.get_value(
                "Item",
                {"item_code":item},
                ["has_batch_no"]
            )
        if has_batch==1:
            return 1000
        return has_batch
    
    @frappe.whitelist(allow_guest=True)
    def get_branch_and_warehouse():
        """
        Use Item Code to get item details
        """
        user = frappe.session.user
        user_branch = frappe.db.get_value(
            "Practitioner Station Entry",
                {"user": user},
                [
                    "branch"
                ]
        )
        user_warehouse = MaterialTransferController.get_user_current_warehouse()
        user_details = {
            "branch": user_branch,
            "warehouse": user_warehouse,
            "user": user
        }

        return user_details
    
    @frappe.whitelist(allow_guest=True)
    def validate_item_on_excess_stock(item_code: str, quantity: int):
        """
        Use Item Code to validate that item is not declared as excess in any other warehouse.
        """
        excess_items = frappe.db.get_list(
            "Extra Stock Items",
            {"item_code":item_code, "quantity": (">=",quantity)},
            ["item_code", "quantity","parent"]
        )
        # return excess_items
        if excess_items:
            # frappe.throw("Error on ")
            excess_station = frappe.get_doc(
                "Extra Stock Declaration",
                {"name":excess_items[0].parent}
            )
            return excess_station
        else:
            return False

    @frappe.whitelist(allow_guest=True)
    def get_item_defaults(item_code,warehouse):
        """
        Use item code to get item defaults
        """
        try:
            item_defaults = frappe.get_doc(
                "Item",
                {'item_code': item_code}
            )
            current_stock = frappe.db.get_value(
                "Bin",
                {"item_code": item_code, "warehouse": warehouse},
                ["actual_qty"],as_dict=True
            )
            selling = 0
            buying = 0
            buying_rates = frappe.db.get_values(
                "Item Price",
                {"item_code": item_code,"buying": 1},
                ["price_list_rate"],as_dict=True
            )
            selling_rates = frappe.db.get_values(
                "Item Price",
                {"item_code": item_code,"selling": 1},
                ["price_list_rate"],as_dict=True
            )
            if buying_rates:
                buying = buying_rates[0]

            if selling_rates:
                selling = selling_rates[0]
            
            item_defaults.buying_rate = buying 
            item_defaults.selling_rate = selling


            return item_defaults,selling,buying,current_stock
        except Exception as e:
            frappe.log_error(e, "Material request get item defualts 951")
            return {"message": False} 
        
    @frappe.whitelist(allow_guest=True)
    def default_company():
        company = frappe.db.get_default("company")
        return company
    
    @frappe.whitelist(allow_guest=True)
    def get_to_be_received_per_branch():
        """Use User details to get the branch and get purchase orders sent for that barnch"""
        try:
            user_ = frappe.session.user
            user_branch = frappe.db.get_list(
                "Practitioner Station Entry",
                filters={"user": user_},
                fields=["branch"]
            )
            print(user_,"user branch")
            orders= frappe.db.sql("""
                SELECT
                    pr.name,
                    pr.transaction_date,
                    pr.supplier_name,
                    pr.set_warehouse,
                    user.full_name as owner,
                    pr.workflow_state,
                    pr.branch,
                    pr.level_1_approval,
                    pr.first_approval,
                    pr.level_2_approval,
                    pr.final_approval,
                    pr.grand_total,
                    pr.sent_to_supplier
                FROM
                    `tabPurchase Order` as pr
                JOIN
                    `tabUser` as user on pr.owner=user.name
                WHERE
                    pr.branch = %s
                    AND pr.sent_to_supplier = 1
                    AND pr.workflow_state = "Approved"
                    AND pr.status = "To Receive and Bill"
               ORDER BY
                    transaction_date DESC
            """,(user_branch[0].branch), as_dict=True)
            # orders = frappe.db.get_list(
            #     "Purchase Order",
            #     {"branch": user_branch[0].branch,"sent_to_supplier": 1, "workflow_state": "Approved","status": "To Receive and Bill"},
            #     ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state","branch","level_1_approval","first_approval","level_2_approval","final_approval","grand_total","sent_to_supplier"]
            # )

            
            return orders
        except Exception as e:
            frappe.log_error(
                e, "Error gettting purchase orders to be received"
            )
            frappe.throw('Error getting orders')
    
    @frappe.whitelist(allow_guest=True)
    def supllier_dets(supplier: str):
        contct_name = frappe.db.get_value(
            "Dynamic Link",
            {"link_doctype":"Supplier", "link_name":supplier},
            ['parent']
        )
        dets = frappe.get_doc(
            "Contact",contct_name
        )
        return dets
    
    @frappe.whitelist(allow_guest=True)
    def notify_queue_purchase_order():
        """Used Passed parameters to update queue"""
        # if purchase_order is not None:
        try:
            frappe.publish_realtime(
                "purchase_order_queue_update",
            )
        except Exception as e:
            frappe.log_error(e, "Error publishing realtime update on purchase order workflow")
            return {"message": False}


    @frappe.whitelist(allow_guest=True)
    def reject_purchase_order_with_comment(comment:str, purchase_order:str):
        """
        Capture reject comment in the purchase order and update workflow stae to rejected.
        """
        try:
            user = frappe.session.user
            purchase_order = frappe.get_doc("Purchase Order", purchase_order)
            purchase_order.reject_reason = comment
            purchase_order.workflow_state = "Rejected"
            purchase_order.rejected_by = user
            purchase_order.save(ignore_permissions=True)
            return purchase_order
        except Exception as e:
            frappe.log_error(e, "Error rejecting purchase order")
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def send_reject_mail(recipient: str, rejected_by: str, reject_reason: str):
        """
        Use recepient mail to send reject mail
        """
        try:
            message = f"Greetings, /n /n Some of the items you requested have been declined by {rejected_by} for the following reason {reject_reason}. Kindly reachout to {rejected_by} for any inquiries, Thank you."
            return message
        except Exception as e:
            frappe.log_error(e,"Error sending reject message./ material_transfer.py")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def return_for_review(comment:str, purchase_order:str):
        """
        Capture reject comment in the purchase order and update workflow stae to rejected.
        """
        try:
            user = frappe.session.user
            purchase_order = frappe.get_doc("Purchase Order", purchase_order)
            purchase_order.review_reason = comment
            if purchase_order.workflow_state == 'Pending PSI Approval' or purchase_order.workflow_state == 'Pending PSI Review':
                purchase_order.workflow_state = 'Pending Review'
            elif purchase_order.workflow_state == 'Pending Chief Pharmacy Approval':
                purchase_order.workflow_state = 'Pending PSI Review'
            purchase_order.review_requested_by = user
            purchase_order.save(ignore_permissions=True)
            return purchase_order
        except Exception as e:
            frappe.log_error(e, "Error returning purchase order for review")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def send_email_to_Requesting_pharmtect(email: str):
        """
        Send email informing the user that request has been declined
        """
        try:
            return
        except Exception as e:
            frappe.log_error(e,"Error sending message material_transfer.py")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def approve_purchase_order(purchase_order:str):
        """
        Approve the purchase order and update the workflow state
        """
        
        try:
            user = frappe.session.user
            user_name = frappe.db.get_value("User", user, ["full_name"])
            full_name = user_name[0]
            purchase_order = frappe.get_doc("Purchase Order", purchase_order)
            if purchase_order.workflow_state == 'Pending PSI Approval':
                purchase_order.level_1_approval = user
                purchase_order.level_1_approval_at = frappe.utils.now_datetime()

                if purchase_order.item_type == 'Drugs':
                    purchase_order.workflow_state = 'Pending Chief Pharmacy Approval'
                elif purchase_order.item_type == "Non Drugs":
                    purchase_order.workflow_state = 'Pending Surgical Manager Approval'
                elif purchase_order.item_type == 'Dental':
                    purchase_order.workflow_state = 'Pending Dental Manager Approval'

                purchase_order.save(ignore_permissions=True)

                new_list = frappe.db.get_list(
                    "Purchase Order",
                    {"workflow_state": "Pending PSI Approval"},
                    ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state", "branch", "level_1_approval","first_approval"]
                )
                # frappe.publish_realtime('purchase_order_queue_update',{"data": new_list}, user=frappe.session.user)

            elif purchase_order.workflow_state == 'Pending Review':
                purchase_order.workflow_state = 'Pending PSI Approval'
                purchase_order.save(ignore_permissions=True)
                new_list = frappe.db.get_list(
                    "Purchase Order",
                    {"workflow_state": "Pending Review"},
                    ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state", "branch", "level_1_approval","first_approval"]
                )
                # frappe.publish_realtime('purchase_order_queue_update',{"data": new_list}, user=frappe.session.user)


            elif purchase_order.workflow_state == 'Pending PSI Review':
                purchase_order.level_1_approval = user
                purchase_order.level_1_approval_at = frappe.utils.now_datetime()
                purchase_order.workflow_state = 'Pending Chief Pharmacy Approval' 
                purchase_order.save(ignore_permissions=True)
                new_list = frappe.db.get_list(
                    "Purchase Order",
                    {"workflow_state": "Pending PSI Review"},
                    ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state", "branch", "level_1_approval","first_approval"]
                )
                # frappe.publish_realtime('purchase_order_queue_update',{"data": new_list}, user=frappe.session.user)


            elif purchase_order.workflow_state == 'Pending Chief Pharmacy Approval':
                purchase_order.level_2_approval = user
                purchase_order.level_2_approval_at = frappe.utils.now_datetime()
                purchase_order.final_approval = user_name
                purchase_order.workflow_state = 'Approved'
                purchase_order.docstatus = 1
                purchase_order.save(ignore_permissions=True)

                new_list = frappe.db.get_list(
                    "Purchase Order",
                    {"workflow_state": "Pending Chief Pharmacy Approval","item_type": "Drugs"},
                    ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state", "branch", "level_1_approval","first_approval"]
                )
                # frappe.publish_realtime('purchase_order_queue_update',{"message": new_list}, user=frappe.session.user)
            
            elif purchase_order.workflow_state == 'Pending Surgical Manager Approval':
                purchase_order.level_2_approval = user
                purchase_order.level_2_approval_at = frappe.utils.now_datetime()
                purchase_order.final_approval = user_name
                purchase_order.workflow_state = 'Approved'
                purchase_order.docstatus = 1
                purchase_order.save(ignore_permissions=True)

                new_list = frappe.db.get_list(
                    "Purchase Order",
                    {"workflow_state": "Pending Surgical Manager Approval", 'item_type': "Non Drugs"},
                    ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state", "branch", "level_1_approval","first_approval"]
                )

            elif purchase_order.workflow_state == 'Pending Dental Manager Approval':
                purchase_order.level_2_approval = user
                purchase_order.level_2_approval_at = frappe.utils.now_datetime()
                purchase_order.final_approval = user_name
                purchase_order.workflow_state = 'Approved'
                purchase_order.docstatus = 1
                purchase_order.save(ignore_permissions=True)

                new_list = frappe.db.get_list(
                    "Purchase Order",
                    {"workflow_state": "Pending Dental Manager Approval", 'item_type': "Dental"},
                    ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state", "branch", "level_1_approval","first_approval"]
                )

            return purchase_order            
        except Exception as e:
            frappe.log_error(e, "Error returning purchase order for review")
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def approve_purchase_order_with_comment(purchase_order:str, comment:str):
        """
        Approve the purchase order and update the workflow state
        """

        try:
            user = frappe.session.user
            user_name = frappe.db.get_value("User", user, ["full_name"])
            full_name = user_name[0]
            purchase_order = frappe.get_doc("Purchase Order", purchase_order)
            
            if purchase_order.workflow_state == 'Pending PSI Review':
                purchase_order.reviewed_by = user
                purchase_order.review_action_taken = comment
                purchase_order.reviewed_at = frappe.utils.now_datetime()
                purchase_order.workflow_state = 'Pending Chief Pharmacy Approval'
                purchase_order.save(ignore_permissions=True)
            new_list = frappe.db.get_list(
                "Purchase Order",
                {"workflow_state": ["in",["Pending PSI Approval","Pending PSI Review"]]},
                ["name","transaction_date","supplier_name","set_warehouse","owner","workflow_state", "branch", "level_1_approval"]
            )
            # frappe.publish_realtime('purchase_order_queue_update',{"data": new_list}, user=frappe.session.user)
            return "Success"
        except Exception as e:
            frappe.log_error(e, "Error approving purchase order / material_request.py")
            return {"message": False}


    @frappe.whitelist(allow_guest=True)
    def get_ordered_qty_from_purchase_order(item_code: str, purchase_order: str):
        """
        Use item code and purchase order to get the ordered quantity.
        """
        try:
            ordered_qty = frappe.db.get_value(
                "Purchase Order Item",
                {"parent": purchase_order, "item_code": item_code},
                "qty"
            )
            return ordered_qty
        except Exception as e:
            frappe.log_error(e, "Error returning ordered quantity")
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def cancel_transfer_request(stock_entry: str):
        """
        Use stockentry name to get doc and update docstatus to 2
        """
        try:
            stock_entry_doc = frappe.get_doc("Stock Entry", stock_entry)
            stock_entry_doc.docstatus = 2
            stock_entry_doc.insert(ignore_permissions=True)

            return stock_entry_doc
        except Exception as e:
            frappe.log_error('Error canceling request', e)
            return {"message": False}
