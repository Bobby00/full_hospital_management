import frappe
import sys
from .stock_level_controller import StockLevelController


class PrescriptionController:
    @frappe.whitelist(allow_guest=True)
    def create_new_prescription(
        parent: str,
        generic_drug: str,
        generic_drug_name: str,
        generic_drug_route: str,
        brand: str,
        item_name: str,
        preparation_type: str,
        route: str,
        dose: str,
        dose_uom: str,
        prescription_frequency: str,
        frequency_type: str,
        pharmacy_remark: str,
        duration: str,
        medication: str,
        unit_of_measure: str,
        selling_quantity: str,
        remarks: str,
        additional_label_info: str,
        item_description: str,
        available_quantity: str,
        billed_quantity: str,
        pharmacy_dose: str,
        pharmacy_frequency: str,
        pharmacy_duration: str,
        discount: str,
        unit_price: str,
        total: str,
        dont_issue_reason: str,
        refill_type: str,
        refill_count: str,
        period_type: str,
        refill_notes: str,
        sub_preparation_type: str,
        additional_item_info: str,
        dispensed_at: str,
        dispensed_by: str,
        owner: str,
        refillable: int = 0,
        dont_issue: int = 0,
        selected_item_batch: str = None,
        idx: int = 0,
    ):
        """
        Create a new prescription to dispense prescription 
        """

        try:

            doc = frappe.get_doc({
                "doctype": "Doctor Prescription Table",
                "name": "new-doctor-prescription-table-1",
                "owner": owner,
                "parent": parent,
                "parentfield": "prescription_table",
                "parenttype": "Patient Encounter",
                "period_type": period_type,
                "refill_type": refill_type,
                "generic_drug": generic_drug,
                "generic_drug_name": generic_drug_name,
                "generic_drug_route": generic_drug_route,
                "brand": brand,
                "item_name": item_name,
                "preparation_type": preparation_type,
                "route": route,
                "dose": dose,
                "dose_uom": dose_uom,
                "prescription_frequency": prescription_frequency,
                "frequency_type": frequency_type,
                "duration": duration,
                "medication": medication,
                "unit_of_measure": unit_of_measure,
                "selling_quantity": selling_quantity,
                "remarks": remarks,
                "additional_label_info": additional_label_info,
                "item_description": item_description,
                "available_quantity": available_quantity,
                "billed_quantity": billed_quantity,
                "pharmacy_dose": pharmacy_dose,
                "pharmacy_frequency": pharmacy_frequency,
                "pharmacy_duration": pharmacy_duration,
                "discount": discount,
                "unit_price": unit_price,
                "total": total,
                "dont_issue": dont_issue,
                "dont_issue_reason": dont_issue_reason,
                "refillable": refillable,
                "refill_type":  refill_type,
                "refill_count": refill_count,
                "period_type":  period_type,
                "refill_notes": refill_notes,
                "pharmacy_remark": pharmacy_remark,
                "additional_item_info": additional_item_info,
                "sub_preparation_type": sub_preparation_type,
                "selected_item_batch": selected_item_batch,
                "idx": idx,
                "dispensed_by": dispensed_by,
                "dispensed_at": dispensed_at
            })

            doc.insert(ignore_permissions=True)

            print(doc)
            return doc
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "CREATE PRESCRIPTION ROW ERROR  /prescription_controller.py")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def partial_update_prescription_table(
        id: str,
        item_name: str,
        medication: str,
        additional_item_info: str,
        item_route: str,
        sub_preparation_type: str,
        item_preparation_type: str,
        unit_of_measure: str,
        available_quantity: str,
        dispensed_at: str,
        dispensed_by: str,
        selected_item_batch: str,
        total: int
    ):
        """Partialy update prescription table using id"""
        try:
            doc = frappe.get_doc("Doctor Prescription Table", {"name": id})
            doc.db_set("medication", medication,update_modified=False)
            doc.db_set("item_name", item_name,update_modified=False)
            doc.db_set("additional_item_info", additional_item_info,update_modified=False)
            doc.db_set("item_route", item_route,update_modified=False)
            doc.db_set("sub_preparation_type", sub_preparation_type,update_modified=False)
            doc.db_set("item_preparation_type", item_preparation_type,update_modified=False)
            doc.db_set("unit_of_measure", unit_of_measure,update_modified=False)
            doc.db_set("available_quantity", available_quantity,update_modified=False)
            doc.db_set("dispensed_by", dispensed_by,update_modified=False)
            doc.db_set("dispensed_at", dispensed_at,update_modified=False)
            doc.db_set("selected_item_batch", selected_item_batch,update_modified=False)
            doc.db_set("total", total,update_modified=False)
            return doc
        except Exception as e:
            frappe.log_error(e, "REST ERROR  /prescription_controller.py")
            print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
            return e

    @frappe.whitelist(allow_guest=True)
    def get_item_price(item_code: str):
        """
        Get the price of an item
        """
        try:
            doc = frappe.db.get_value(
                "Item Price", {"item_code": item_code,"price_list": "Standard Selling"}, "price_list_rate")
            if doc is None:
                frappe.throw(f'Item {item_code} Has no selling price set')
            return doc
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "GET ITEM PRICE ERROR  /prescription_controller.py")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def update_billed_quantity_total_price(
        id: str,
        billed_quantity: str,
        total_cost: str
    ):
        try:
            doc = frappe.get_doc("Doctor Prescription Table", {"name": id})
            doc.billed_quantity = billed_quantity
            doc.selling_quantity = billed_quantity
            doc.total = total_cost
            doc.save()
            return doc
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "Save Item total cost  /prescription_controller.py")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def get_item_routes(item_code: str):
        """
        Get the price of an item
        """
        try:
            doc = frappe.db.get_list(
                "Item",
                filters={"item_code": item_code},
                fields=["product_route", "product_type",
                        "additional_label_info", "sub_preparation_type", "stock_uom"]
            )
            return doc
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "GET ITEM ROUTE ERROR  /prescription_controller.py")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def get_item_based_on_generic(generic_drug: str):
        """
        Get item based on selected generic drug
        """
        try:
            stock_table = frappe.qb.DocType("Bin")
            item_table = frappe.qb.DocType("Item")
            warehouse = PrescriptionController.get_user_warehouse()

            

            if generic_drug.find("Extemporaneous") !=-1:
                drug_option = frappe.db.get_list(
                    "Item",
                    filters={"generic_drug": generic_drug, "disabled": 0},
                    fields=[
                        "name",
                        "item_name",
                        "display_name",
                        "has_batch_no",
                    ],
                    order_by='name desc'
                )
                return drug_option
            else:
                drug_option =  (
                    frappe.qb.from_(item_table).
                    where(item_table.generic_drug==generic_drug).
                    where(item_table.disabled==0).
                    inner_join(stock_table).
                    on(stock_table.item_code == item_table.name).
                    select(
                        item_table.name,
                        item_table.item_name,
                        stock_table.actual_qty,
                        item_table.display_name,
                        item_table.has_batch_no,
                    ).
                    where(stock_table.warehouse==warehouse).
                    orderby(item_table.display_name).
                    run(as_dict=True)
                )
                return drug_option

        except Exception as e:
            frappe.log_error(
                e, "GET ITEM BASED ON GENERIC  ERROR /prescription_controller.py")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def get_batches_linked_to_item(item_code: str):
        """
        Get batches linked to an item in a users warehouse
        """
        try:
            current_date = frappe.utils.nowdate()

            # Check for services
            is_service = frappe.db.get_value(
                "Item",
                {"name": item_code},
                ["item_group","has_batch_no","description"],
                as_dict=True
            )

            if is_service.item_group == "Service":
                return None
            if is_service.has_batch_no == 0:
                return None
            
            user_warehouse = PrescriptionController.get_user_warehouse()
            batches = frappe.db.sql('''select sle.batch_no, sum(sle.actual_qty) as qty, batch.expiry_date as expiry
                from `tabStock Ledger Entry` as sle
                INNER JOIN `tabBatch` as batch on sle.batch_no = batch.name
                where is_cancelled = 0 and item_code = %s and warehouse=%s and disabled = 0
                and batch.expiry_date >= CURDATE()
                group by batch_no order by batch.creation DESC''', (item_code, user_warehouse), as_dict=1)

            if batches:
                return batches[0]
            else:
                frappe.throw(f"Create Stock entry for {is_service.description} into your current warehouse ({user_warehouse}) or check if item batch has an expiry date.")
        except Exception as e:
            frappe.log_error(
                e, "GET BATCHES LINKED TO ITEM  ERROR/prescription_controller.py")
            return {"message": False}


    @frappe.whitelist(allow_guest=True)
    def get_batch_with_earliest_date_and_not_expired(
        item_code: str,
        warehouse: str
    ):
        """
        Get batch with the earliest expiry but not expired
        """

        current_date = frappe.utils.nowdate()
        try:
           # Get the current date
            current_date = frappe.utils.nowdate()

            # Define the SQL query
            query = """
                SELECT
                    tabBatch.batch_id,
                    tabBatch.batch_qty,
                    tabBatch.expiry_date,
                    `tabStock Ledger Entry`.posting_date,
                    tabBatch.item,
                    tabBatch.stock_uom
                FROM
                    `tabBatch`
                    LEFT JOIN `tabStock Ledger Entry` ON `tabBatch`.name = `tabStock Ledger Entry`.batch_no
                WHERE
                    `tabBatch`.item = %s
                    AND `tabStock Ledger Entry`.warehouse = %s
                    AND `tabBatch`.expiry_date > %s
                GROUP BY
                    `tabBatch`.batch_id
                ORDER BY
                    `tabStock Ledger Entry`.posting_date DESC
                LIMIT 0, 1
            """

            # Execute the query and get the results
            results = frappe.db.sql(query, (item_code, warehouse, current_date), as_dict=True)

        except Exception as e:
            frappe.log_error(
                e, "GET BATCHES LINKED TO ITEM  ERROR/prescription_controller.py")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def get_user_warehouse():
        """
        Get user Station details
        """
        try:
            session_user = frappe.session.user

            company = frappe.defaults.get_global_default("company")

            index_g = company.find('Gert')
            if index_g != -1:
                suffix = " - GCH"
            index_w = company.find('Wema')
            if index_w != -1:
                suffix = " - W"
        
            user_details = frappe.db.get_list(
                "Practitioner Station Entry",
                filters={"user": session_user},
                fields=[
                    "station",
                    "branch"
                ],
            )
            if user_details:
                branch = user_details[0].branch
                service_unit = user_details[0].station

                warehouse = ""

                if service_unit == "Wellbaby"+suffix or service_unit == "Triage"+suffix or service_unit == "Wellbaby Growth Monitoring"+suffix or service_unit == "Procedure"+suffix or service_unit == "Reception"+suffix:
                    warehouse = frappe.db.get_list(
                        "Warehouse",
                        filters={"branch": branch, "service_unit": "Wellbaby"+suffix},
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
                else:
                    warehouse_name = "Services"+suffix
                    return ''
            else: 
                frappe.throw("Please select station")
        except Exception as e:
            frappe.log_error(
                e, "GET USER STATION DETAILS ERROR /prescription_controller.py"
            )
            return e


    @frappe.whitelist(allow_guest=True)
    def check_if_item_has_batch_and_return_earliest_batch_in(item_code:str):
        """
        Use item code to check if item has batch
        If item has no batch return message
        """
        item_has_batch = frappe.db.get_value(
            "Item",
            {"item_code": item_code},
            ["has_batch_no"]
        )
        # date_today = frappe.utils.nowdate()
        warehouse = PrescriptionController.get_user_warehouse()

        if item_has_batch == 1:
            current_date = frappe.utils.nowdate()

            # Define the SQL query
            query = """
                SELECT
                    tabBatch.batch_id,
                    tabBatch.batch_qty,
                    tabBatch.expiry_date,
                    `tabStock Ledger Entry`.posting_date,
                    tabBatch.item,
                    tabBatch.stock_uom
                FROM
                    `tabBatch`
                    LEFT JOIN `tabStock Ledger Entry` ON `tabBatch`.name = `tabStock Ledger Entry`.batch_no
                WHERE
                    `tabBatch`.item = %s
                    AND `tabStock Ledger Entry`.warehouse = %s
                    AND `tabBatch`.expiry_date > %s
                    AND `tabBatch`.batch_qty > 0
                GROUP BY
                    `tabBatch`.batch_id
                ORDER BY
                    `tabStock Ledger Entry`.posting_date DESC
                LIMIT 0, 1
            """

            # Execute the query and get the results
            selected_batch = frappe.db.sql(query, (item_code, warehouse, current_date), as_dict=True)

            
            if selected_batch:
                return selected_batch[0]
            else:
                frappe.throw("Selected Item has no valid batch")
                return {"message": False}
        else:
            return None

    
    @frappe.whitelist(allow_guest=True)
    def validate_items_with_batch(item_code: str, batch_no:str):
        """
        Use item_code to check if item has batch
        Check if batch is provided
        """
        has_batch = frappe.db.get_value(
            "Item",
            {"item_code": item_code},
            ["has_batch_no", "item_name"],
            as_dict=True
        )

        if not batch_no and has_batch.has_batch_no == 1:
            frappe.throw(f"Error {has_batch.item_name} requires batch to complete this transaction")
            return False
        else:
            return True
        

    @frappe.whitelist(allow_guest=True)
    def get_stock_levels(item_code: str):
        """Get stock levels in a selected warehouse"""
        try:
            warehouse = PrescriptionController.get_user_warehouse()
            stock_level_details = frappe.db.get_list(
                "Bin",
                filters={"item_code": item_code, "warehouse": warehouse},
                fields=["warehouse", "item_code",
                        "actual_qty", "projected_qty"]
            )
            return stock_level_details
        except Exception as e:
            frappe.log_error(
                e, "GET STOCK LEVELS ERROR/prescription_controller.py")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def reduce_stock_from_invoice(invoice: str):
        """Get items on invoice and reduce stock"""
        try:
            invoice_number = invoice
            invoice_doc = frappe.db.get_value(
                "Sales Invoice", {"name": invoice_number}, 
                ["name", "company", "posting_date","posting_time"],
                as_dict=True
            )
            invoiced_items = invoiced_items = frappe.db.get_list(
                "Sales Invoice Item", {"parent": invoice_number},
                ["item_code","warehouse","batch_no", "qty", "name","is_service", "dispensed"]
            )

            if invoiced_items:
                for item in invoiced_items:
                    if item["is_service"] == 0 and item["dispensed"] == 0:
                        is_valid = PrescriptionController.validate_items_with_batch(item["item_code"],item["batch_no"])
                        if not is_valid:
                            return "Error requires batch to complete this transaction"
                        else:
                            now = frappe.utils.now()
                            today = frappe.utils.nowdate()  
                            stock_reduced = StockLevelController.deduct_stock_from_invoice(
                            item["item_code"],
                            item["warehouse"],
                            item["batch_no"],
                            item["qty"],
                            invoice_doc["name"],
                            item["name"],
                            invoice_doc["company"],
                            today,
                            now,
                        )

                        # print("Details of Stock", stock_reduced)

                        if stock_reduced:
                            frappe.db.set_value(
                                "Sales Invoice Item", 
                                {"parent": invoice_number, "item_code": item["item_code"]},
                                {
                                    "dispensed": 1
                                }, update_modified=True
                            )
                return "Stock deducted successfuly"
            else:
                frappe.throw(
                    "Items have not been invoiced. Please ensure items are invoiced")

        except Exception as e:
            frappe.log_error(
                e, "Error deducting stock from invoice/ prescription_controller.py(537)"
            )
            return {"message": False}
    
    @frappe.whitelist(allow_guest=True)
    def reduce_stock_dispensed(encounter: str):
        """Get all items dispensed and deduct from stock"""
        try:
            # Get All dispensed items from encounter in the invoice
            invoice = frappe.db.get_value(
                "Sales Invoice", {"encounter": encounter}, 
                ["name", "company", "posting_date","posting_time"],
                as_dict=True
            )

            invoice_number = invoice["name"]
            invoiced_items = frappe.db.get_list(
                "Sales Invoice Item", {"parent": invoice_number},
                ["item_code","warehouse","batch_no", "qty", "name","is_service", "dispensed"]
            )

            if invoiced_items:
                now = frappe.utils.now()
                today = frappe.utils.nowdate()
                for item in invoiced_items:
                    if item["is_service"] == 0 and item["dispensed"] == 0:
                        is_valid = PrescriptionController.validate_items_with_batch(item["item_code"],item["batch_no"])
                        if not is_valid:
                            return "Error requires batch to complete this transaction"
                        else:
                            stock_reduced = StockLevelController.deduct_stock(
                            item["item_code"],
                            item["warehouse"],
                            item["batch_no"],
                            item["qty"],
                            invoice["name"],
                            item["name"],
                            invoice["company"],
                            today,
                            now,
                            encounter
                        )

                        # print("Details of Stock", stock_reduced)

                        if stock_reduced:
                            frappe.db.set_value(
                                "Doctor Prescription Table",
                                {"parent": encounter, "medication": item["item_code"]},
                                {
                                    "dispensed": 1
                                }, update_modified=True
                            )
                            frappe.db.set_value(
                                "Sales Invoice Item", 
                                {"parent": invoice_number, "item_code": item["item_code"]},
                                {
                                    "dispensed": 1
                                }, update_modified=True
                            )
                return "Stock deducted successfuly"
            else:
                frappe.throw(
                    "Items have not been invoiced. Please ensure items are invoiced")

                
        except Exception as e:
            frappe.log_error(
                e, "DEDUCT DISPENSE STOCK ERROR /prescription_controller.py"
            )

    @frappe.whitelist(allow_guest=True)
    def mark_prescription_dispense_as_false(encounter: str, item_code: str,billed_qty: int=0,dont_issue: bool = False):
        try:
            from gch_custom.services.rest import check_branch_pricelist

            unit_price = check_branch_pricelist(item_code)
            total = 0
            if unit_price:
                total = unit_price * billed_qty
            
            if dont_issue:
                frappe.db.set_value(
                    "Doctor Prescription Table",
                    {"parent": encounter, "medication":item_code},
                    {
                        "do_not_issue": 1,

                    }
                )
                return {"message": True}
            
            if billed_qty > 0:
                frappe.db.set_value(
                    "Doctor Prescription Table",
                    {"parent": encounter, "medication":item_code},
                    {
                        "dispensed": 0,
                        "billed_quantity": billed_qty,
                        "selling_quantity": billed_qty,
                        "total": total
                    }
                )
                return {"message": True}
        except Exception as e:
            frappe.log_error(
                e, "Error marking prescription dispense as false /prescription_controller.py"
            )
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def prescription_return_details(
        return_reason: str,
        return_quantity: int,
        encounter: str,
        item_code: str,
        batch: str,
        returned_by: str,
        billed_qty: int
    ):
        """
        Use encounter to get current invoice
        """
        
        warehouse = PrescriptionController.get_user_warehouse()
        sales_invoice = frappe.db.get_value(
            "Sales Invoice", {"encounter": encounter}
        )
        doc = frappe.get_doc({
            "doctype":"Prescription Returns",
            "warehouse": warehouse,
            "sales_invoice": sales_invoice,
            "patient_encounter": encounter,
            "item": item_code,
            "batch": batch,
            "return_reason": return_reason,
            "returned_quantity": return_quantity,
            "returned_by": returned_by,
            "previously_dispensed_qty": billed_qty,
        })
        doc.insert(ignore_permissions=True)
        print(doc)
        return doc
    
    @frappe.whitelist(allow_guest=True)
    def get_routes_from_generic_name(generic: str = None):
        """Get all routes for a particular generic"""
        try:
            routes = []

            if generic:
                generic_items = frappe.db.get_list(
                    "Generic Drug Route", {"parent": generic,"parentfield":"route"},
                    ["drug_route"]
                )
                if generic_items:
                    routes = generic_items
            else:
                all_routess = frappe.db.get_list(
                    "Drug Route",
                )
                routes = all_routess

            return routes
        except Exception as e:
            frappe.log_error(e, "Error getting routes by generic")
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def change_vaccines_to_dispensed_after_save_on_encounter(encounter: str = None):
        try:
            if encounter:
                frappe.db.sql(f"""UPDATE `tabWellbaby Vaccine Details` SET vaccine_dispensed = 1 WHERE parent = '{encounter}' """)
                frappe.db.commit()
        except Exception as e:
            return e
        
    @frappe.whitelist(allow_guest=True)
    def get_item_generic(item_code: str):
        """
        Use Item code to get generic name
        """
        try:
            generic = frappe.db.get_value(
                "Item", {"item_code": item_code},
                ["generic_drug"]
            )
            return generic
        except Exception as e:
            frappe.log_error(e, "Error getting generic")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def set_drug_allergy_on_patient_record(patient: str, drug_allergies: object = []):
        """
        Set drug allergy on patient record
        """
        try:
            import json
            all = json.loads(drug_allergies)
            patient = frappe.get_doc("Patient", patient)
            registered_allergies = patient.drug_allergies
            alls = []
            if registered_allergies:
                for al in registered_allergies:
                    alls.append(al.drug_allergy)
                
                for allergy in all:
                    if allergy.get("drug_allergy") not in alls:
                        allrgy = frappe.get_doc(
                            "Drug Allergy", {"name": allergy.get("drug_allergy")}
                        )
                        new_doc = frappe.new_doc("Patient Drug Allergy")
                        new_doc.drug_allergy = allrgy.name
                        new_doc.parent = patient.name
                        new_doc.parentfield = "drug_allergies"
                        new_doc.parenttype = "Patient"
                        new_doc.owner = frappe.session.user
                        new_doc.save(ignore_permissions=True)
                    else:
                        return {"message": "Exists"}
            else:
                for allergy in all:
                    allrgy = frappe.get_doc(
                        "Drug Allergy", {"name": allergy.get("drug_allergy")}
                    )
                    new_doc = frappe.new_doc("Patient Drug Allergy")
                    new_doc.drug_allergy = allrgy.name
                    new_doc.parent = patient.name
                    new_doc.parentfield = "drug_allergies"
                    new_doc.parenttype = "Patient"
                    new_doc.owner = frappe.session.user
                    new_doc.save(ignore_permissions=True)
                return {"message": True}
        except Exception as e:
            frappe.log_error(e, "Error setting drug allergy/ prescription_controller.py")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def set_food_allergy_on_patient_record(patient: str, food_allergies: object = []):
        """
        Set drug allergy on patient record
        """
        try:
            import json
            all = json.loads(food_allergies)
            patient = frappe.get_doc("Patient", patient)
            registered_allergies = patient.food_allergies
            alls = []
            if registered_allergies:
                for al in registered_allergies:
                    alls.append(al.food_allergy)
                
                for allergy in all:
                    if allergy.get("food_allergy") not in alls:
                        allrgy = frappe.get_doc(
                            "Food Allergy", {"name": allergy.get("food_allergy")}
                        )
                        new_doc = frappe.new_doc("Patient Drug Allergy")
                        new_doc.food_allergy = allrgy.name
                        new_doc.parent = patient.name
                        new_doc.parentfield = "food_allergies"
                        new_doc.parenttype = "Patient"
                        new_doc.owner = frappe.session.user
                        new_doc.save(ignore_permissions=True)
                    else:
                        return {"message": "Exists"}
            else:
                for allergy in all:
                    allrgy = frappe.get_doc(
                        "Food Allergy", {"name": allergy.get("food_allergy")}
                    )
                    new_doc = frappe.new_doc("Patient Food Allergy")
                    new_doc.food_allergy = allrgy.name
                    new_doc.parent = patient.name
                    new_doc.parentfield = "food_allergies"
                    new_doc.parenttype = "Patient"
                    new_doc.owner = frappe.session.user
                    new_doc.save(ignore_permissions=True)
                return {"message": True}
        except Exception as e:
            frappe.log_error(e, "Error setting drug allergy/ prescription_controller.py")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def set_other_allergy_on_patient_record(patient: str, other_allergies: object = []):
        """
        Set drug allergy on patient record
        """
        try:
            import json
            all = json.loads(other_allergies)
            patient = frappe.get_doc("Patient", patient)
            registered_allergies = patient.other_allergies
            alls = []
            if registered_allergies:
                for al in registered_allergies:
                    alls.append(al.other_allergy)
                
                for allergy in all:
                    if allergy.get("other_allergy") not in alls:
                        allrgy = frappe.get_doc(
                            "Other Allergy", {"name": allergy.get("other_allergy")}
                        )
                        new_doc = frappe.new_doc("Patient Drug Allergy")
                        new_doc.other_allergy = allrgy.name
                        new_doc.parent = patient.name
                        new_doc.parentfield = "other_allergies"
                        new_doc.parenttype = "Patient"
                        new_doc.owner = frappe.session.user
                        new_doc.save(ignore_permissions=True)
                    else:
                        return {"message": "Exists"}
            else:
                for allergy in all:
                    allrgy = frappe.get_doc(
                        "Other Allergy", {"name": allergy.get("other_allergy")}
                    )
                    new_doc = frappe.new_doc("Patient Other Allergy")
                    new_doc.other_allergy = allrgy.name
                    new_doc.parent = patient.name
                    new_doc.parentfield = "other_allergies"
                    new_doc.parenttype = "Patient"
                    new_doc.owner = frappe.session.user
                    new_doc.save(ignore_permissions=True)
                return {"message": True}
        except Exception as e:
            frappe.log_error(e, "Error setting drug allergy/ prescription_controller.py")
            return {"message": False}