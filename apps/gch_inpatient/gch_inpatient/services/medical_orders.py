import sys
import frappe
from gch_inpatient.services.inpatient_billing import create_invoice_item

class MedicalOrderController:
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

        try:
            from datetime import datetime
            from gch_custom.services import StockLevelController # type: ignore
            # Get current encounter
            current_encounter = frappe.get_doc(
                "Inpatient Record", encounter
            )

            current_invoice = frappe.db.get_value(
                "Sales Invoice",
                {"inpatient_record": current_encounter.name},
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
                    if returned_qty != 0:
                        if initial_qty == returned_qty:
                            encounter_item = frappe.get_doc( "Inpatient Doctor Prescription Table",{"parent": encounter,"medication": item_code})
                            # encounter_item.db_set("dispensed", 0)                
                            # encounter_item.db_set("dont_issue", 1)                
                            # frappe.db.delete("Sales Invoice Item",{"name":voucher_detail_no})
                        elif initial_qty > returned_qty:
                            new_qty = initial_qty - returned_qty
                            encounter_item = frappe.get_doc( "Inpatient Doctor Prescription Table",{"parent": encounter,"medication": item_code})
                            encounter_item.db_set("selling_quantity", new_qty)

                            sales_invoice_item = frappe.get_doc("Sales Invoice Item",{"name":voucher_detail_no})
                            total_amount = sales_invoice_item.rate * new_qty
                            sales_invoice_item.db_set("qty", new_qty)
                            sales_invoice_item.db_set("amount", total_amount)
                            sales_invoice_item.db_set("base_amount", total_amount)
                            encounter_item.db_set("total", total_amount)
                    else:
                        encounter_item = frappe.get_doc( "Inpatient Doctor Prescription Table",{"parent": encounter,"medication": item_code})
                        # encounter_item.db_set("dispensed", 0)              
                        # frappe.db.delete("Sales Invoice Item",{"name":voucher_detail_no})                
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
                        encounter_item = frappe.get_doc( "Inpatient Doctor Prescription Table",{"parent": encounter,"medication": item_code})
                        encounter_item.db_set("dispensed", 0)
                        encounter_item.db_set("dont_issue", 1)
                        frappe.db.delete("Sales Invoice Item",{"name":voucher_detail_no})
                    elif initial_qty > returned_qty:
                        new_qty = initial_qty - returned_qty
                        encounter_item = frappe.get_doc( "Inpatient Doctor Prescription Table",{"parent": encounter,"medication": item_code})
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
        except Exception as e:
            frappe.log_error(e, 'Error returning inpatient medication')
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def generate_medical_order(prescripions: object):
        """Get Prescription Object and use it generate medicall Orders"""
        return prescripions
    
    @frappe.whitelist(allow_guest=True)
    def test_medication_order():
        all_order_Entries = frappe.get_all('Inpatient Medication Order Entry',["name","is_completed"])
        return all_order_Entries
    
    @frappe.whitelist(allow_guest=True)
    def get_inpatient_prescription(inpatient_record):
        """Use inpatient record to get all details"""
        try:
            data_1 = frappe.db.sql("""
                        SELECT *
                        FROM `tabInpatient Record` as ip
                        JOIN `tabInpatient Doctor Prescription Table` as ipdt
                        ON ip.name = ipdt.parent
                        WHERE ip.name = %s
                        ORDER BY ip.creation DESC               
                """, (inpatient_record), as_dict=True)
            data = frappe.get_doc("Inpatient Record", inpatient_record)
            return data_1
        except Exception as e:
            frappe.log_error(e, 'Error getting inpatient record')
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def get_patient_information(inpatient_record: str):
        """Use inpatient record to get patient vitals and other information"""
        try:
            inpatient_record_doc = frappe.get_doc("Inpatient Record", inpatient_record)
            return inpatient_record_doc
        except Exception as e:
            frappe.log_error(e, 'Error getting inpatient record')
            return {"message": False}

        
    @frappe.whitelist(allow_guest=True)
    def get_medical_order_list(inpatient_record):
        """Use inpatient record to get all medical orders"""
        try:
            today = frappe.utils.nowdate()
            inpatient_data = frappe.get_doc("Inpatient Record", inpatient_record)
            patient_name = inpatient_data.patient_name
            data = frappe.db.get_list("Inpatient Doctor Prescription Table", filters={"parent":inpatient_record,"stopped": 0},
                        fields=["name","route","generic_drug_name","prescription_frequency","pharmacy_frequency","pharmacy_duration",
                                "duration","medication","unit_of_measure","pharmacy_dose",
                                "remarks","pharmacy_remark","owner","creation",
                                "dose_uom", "dose","item_description",
                                "selling_quantity","indication","patient_owned_medication","high_alert",
                                "received","received_qty","parent","dispensed","prescribed_by",
                                "dispensed_by", "dispensed_at", "receive_comment","prescribed_at","complete_date"
                        ],
                        order_by="prescribed_at DESC",
                    )
            for d in data:
                prescription_tracker = frappe.db.get_list(
                    "Inpatient Prescription Tracker",
                    filters={"drug_prescription":d.name, "date": ["<=",today]},
                    fields=['name','date'],
                    order_by="date asc",
                    ignore_permissions=True
                )
                # Add this filter to the above function to filter only todays slots.  "date": ["<=",today]

                for track in prescription_tracker:
                    frequency = frappe.db.get_list(
                        "Inpatient Prescription Administration Tracker",
                        filters={"parent":track.name},
                        fields=["time","administered","comment","time_administered","administered_by","name","absolute_time_difference",
                                "requires_second_approval","second_approval","reopened", "reopen_reason","reopened_at","reopened_by",
                                "administering_user"],
                        order_by="time asc"
                    )
                    track["entries"] = frequency
                d['prescription_tracker'] = prescription_tracker
                d['patient_name'] = patient_name
                
            return data

            
        except Exception as e:
            frappe.log_error(e, 'Error getting medical orders')
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def get_stopped_meds_list(inpatient_record):
        """Use inpatient record to get all medical orders"""
        try:
            today = frappe.utils.nowdate()
            # today_str = today.strftime('%Y-%m-%d')
            inpatient_data = frappe.get_doc("Inpatient Record", inpatient_record)
            patient_name = inpatient_data.patient_name
            data = frappe.db.get_list("Inpatient Doctor Prescription Table", 
                        filters={"parent":inpatient_record,"stopped": 1}, 
                        fields=["name","route","generic_drug_name","prescription_frequency",
                                "duration","medication","unit_of_measure",
                                "remarks","pharmacy_remark","owner","creation",
                                "dose_uom", "dose","item_description",
                                "selling_quantity","indication","patient_owned_medication","high_alert",
                                "stopped_by","stopped_at","stop_comment","received","received_qty",
                        ],
                        order_by="creation ASC",
                    )
            if data:
                for d in data:
                    prescription_tracker = frappe.db.get_list(
                        "Inpatient Prescription Tracker",
                        filters={"drug_prescription":d.name,"date": ["<=",today]},
                        fields=['name','date'],
                        order_by="date asc",
                        ignore_permissions=True
                    )
                    for track in prescription_tracker:
                        frequency = frappe.db.get_list(
                            "Inpatient Prescription Administration Tracker",
                            filters={"parent":track.name},
                            fields=["time","administered","comment","time_administered","administered_by","name"],
                            order_by="time asc"
                        )
                        track["entries"] = frequency
                    d['prescription_tracker'] = prescription_tracker
                    d['patient_name'] = patient_name
                
            return data
            
        except Exception as e:
            frappe.log_error(e, 'Error getting stopped medication orders')
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def get_discharge_medication_list(inpatient_record: str):
        """
        Get discharge medication from inpatient record.
        """
        try:
            today = frappe.utils.nowdate()
            inpatient_data = frappe.get_doc("Inpatient Record", inpatient_record)
            patient_name = inpatient_data.patient_name
            data = frappe.db.get_list("Inpatient Doctor Prescription Table", filters={"parent":inpatient_record,"stopped": 0,"indication": "Discharge"}, 
                        fields=["name","route","generic_drug_name","prescription_frequency",
                                "duration","medication","unit_of_measure",
                                "remarks","pharmacy_remark","owner","creation",
                                "dose_uom", "dose","item_description",
                                "selling_quantity","indication","patient_owned_medication","high_alert",
                                "stopped_by","stopped_at","stop_comment","received","received_qty",
                        ],
                        order_by="creation ASC",
                    )
            for d in data:
                prescription_tracker = frappe.db.get_list(
                    "Inpatient Prescription Tracker",
                    filters={"drug_prescription":d.name,"date": ["<=",today]},
                    fields=['name','date'],
                    order_by="date asc",
                    ignore_permissions=True
                )
                for track in prescription_tracker:
                    frequency = frappe.db.get_list(
                        "Inpatient Prescription Administration Tracker",
                        filters={"parent":track.name},
                        fields=["time","administered","comment","time_administered","administered_by","name"],
                        order_by="time asc"
                    )
                    track["entries"] = frequency
                d['prescription_tracker'] = prescription_tracker
                d['patient_name'] = patient_name
                
            return data
            
        except Exception as e:
            frappe.log_error(e, 'Error getting medical orders')
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def create_prescrption_schedule(number_of_days, frequency, drug_name):
        """
        Function to create prescription schedule for given number of days, frequency and drug name
        """
        today = frappe.utils.today()

        two_days_from_today = frappe.utils.add_days(today, 2)

        return two_days_from_today
    
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
        total: int,
    ):
        """Partialy update prescription table using id"""
        try:
            is_high_alert = frappe.db.get_value(
                "Item",
                {"item_code": medication},
                ["high_alert_medication"]
            )

            doc = frappe.get_doc("Inpatient Doctor Prescription Table", {"name": id})
            doc.db_set("medication", medication)
            doc.db_set("item_name", item_name)
            doc.db_set("additional_item_info", additional_item_info)
            doc.db_set("item_route", item_route)
            doc.db_set("sub_preparation_type", sub_preparation_type)
            doc.db_set("item_preparation_type", item_preparation_type)
            doc.db_set("unit_of_measure", unit_of_measure)
            doc.db_set("available_quantity", available_quantity)
            doc.db_set("dispensed_by", dispensed_by)
            doc.db_set("dispensed_at", dispensed_at)
            doc.db_set("selected_item_batch", selected_item_batch)
            doc.db_set("total", total)
            doc.db_set("high_alert", is_high_alert)

            return doc
        except Exception as e:
            frappe.log_error(e, "REST ERROR  /medical_order.py")
            print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
            return e
        
    @frappe.whitelist(allow_guest=True)
    def receive_meds_and_create_schedule(prescription: str, inpatient: str,qty: int,comment: str = None):
        """
        Use Prescription name to mark med as dispensed
        """
        try:
            import datetime
            presc = frappe.get_doc(
                "Inpatient Doctor Prescription Table",
                {"name":prescription}
            )
            if presc.received == 0:
                presc.received = 1
                presc.received_qty = qty
                presc.received_by = frappe.session.user
                presc.received_at = datetime.datetime.now()
                presc.comment = comment
                presc.complete_date = frappe.utils.add_days(frappe.utils.nowdate(), int(presc.duration))
                presc.save()
                MedicalOrderController.create_prescription_schedule(inpatient,prescription)
            return presc
        except Exception as e:
            frappe.log_error(e, "Error receiving medication")
            return {"message":False}


        
    @frappe.whitelist(allow_guest=True)
    def create_prescription_schedule(inpatient_record:str,presc:str = None):
        """
        Create a new prescription tracker using duration as the count of how many entries to create
        """
        try:

            prescriptions = frappe.get_all(
                "Inpatient Doctor Prescription Table",
                filters={"name":presc},
                fields=["pharmacy_duration","name","dispensed","prescription_frequency", "high_alert"]
            )

            for prescription in prescriptions:
                duration = int(prescription.pharmacy_duration)
                date_counter = 0
                current_date = frappe.utils.nowdate()
                high_alert = prescription.high_alert
                for i in range(duration):
                    prescription_tracker = frappe.new_doc("Inpatient Prescription Tracker")
                    prescription_tracker.drug_prescription = prescription.name
                    prescription_tracker.date = frappe.utils.add_days(current_date, date_counter)
                    prescription_tracker.inpatient_record = inpatient_record

                    # Create prescription tracker administer tracker starting from 5:00 am and going dependng on prescription frequency
                    start_time = frappe.utils.now_datetime().replace(hour=5, minute=0, second=0, microsecond=0)
                    formatted_time = frappe.utils.format_datetime(start_time,'HH:mm:ss')
                    frequency = prescription.prescription_frequency
                    hour_difference = 0
                    daily_frequency = 0
                    if frequency == "Every 24 hrs":
                        hour_difference = 24
                        daily_frequency = 1
                    elif frequency == "Every 12 hrs":
                        hour_difference = 12
                        daily_frequency = 2
                    elif frequency == "Every 8 hrs":
                        hour_difference = 8
                        daily_frequency = 3
                    elif frequency == "Every 6 hrs":
                        hour_difference = 6
                        daily_frequency = 4
                    elif frequency == "Every 5 hrs":
                        hour_difference = 5
                        daily_frequency = 5
                    elif frequency == "Every 4 hrs":
                        hour_difference = 4
                        daily_frequency = 6
                    elif frequency == "Every 3 hrs":
                        hour_difference = 3
                        daily_frequency = 7
                    elif frequency == "Every 2 hrs":
                        hour_difference = 2
                        daily_frequency = 8
                    elif frequency == "Every 1 hr":
                        hour_difference = 1
                        daily_frequency = 24
                    elif frequency == "Stat":
                        hour_difference = 0
                        daily_frequency = 1
                    else:
                        hour_difference = 24
                        daily_frequency = 1
                    for i in range(daily_frequency):
                        if frequency != "Stat":
                            tracker = frappe.new_doc("Inpatient Prescription Administration Tracker")
                            tracker.time = formatted_time
                            tracker.requires_second_approval = high_alert
                            prescription_tracker.append('administration_schedule', tracker)
                            formatted_time = frappe.utils.add_to_date(formatted_time, hours=hour_difference)
                        else:
                            now = frappe.utils.now_datetime()
                            formatted_time = frappe.utils.format_datetime(now,'HH:mm:ss')
                            tracker = frappe.new_doc("Inpatient Prescription Administration Tracker")
                            tracker.time = formatted_time
                            tracker.requires_second_approval = high_alert
                            prescription_tracker.append('administration_schedule', tracker)
                            formatted_time = frappe.utils.add_to_date(formatted_time, hours=hour_difference)
                    prescription_tracker.save(ignore_permissions=True)
                    date_counter += 1
                doc = frappe.get_doc("Inpatient Doctor Prescription Table", prescription.name)
                doc.dispensed = 1
                doc.save(ignore_permissions=True)
                frappe.db.commit()

            return prescriptions


        except Exception as e:
            frappe.log_error(e, "Error creating schedule /medical_order.py")
            return e


    @frappe.whitelist(allow_guest=True)
    def update_billed_quantity_total_price(
        id: str,
        billed_quantity: str,
        total_cost: str
    ):
        try:
            doc = frappe.get_doc("Inpatient Doctor Prescription Table", {"name": id})
            doc.billed_quantity = billed_quantity
            doc.selling_quantity = billed_quantity
            doc.total = total_cost
            doc.save()
            # # Create a new prescription tracker using duration as the count of how many entries to create
            # duration = int(doc.pharmacy_duration)
            # date_counter = 0
            # current_date = frappe.utils.nowdate()
            # for i in range(duration):
            #     prescription_tracker = frappe.new_doc("Inpatient Prescription Tracker")
            #     prescription_tracker.drug_prescription = doc.name
            #     prescription_tracker.date = frappe.utils.add_days(current_date, date_counter)
            #     prescription_tracker.inpatient_record = doc.parent

            #     # Create prescription tracker administer tracker starting from 5:00 am and going dependng on prescription frequency
            #     start_time = frappe.utils.now_datetime().replace(hour=5, minute=0, second=0, microsecond=0)
            #     formatted_time = frappe.utils.format_datetime(start_time,'HH:mm:ss')
            #     frequency = doc.prescription_frequency
            #     hour_difference = 0
            #     daily_frequency = 0
            #     if frequency == "Every 24 hrs":
            #         hour_difference = 24
            #         daily_frequency = 1
            #     elif frequency == "Every 12 hrs":
            #         hour_difference = 12
            #         daily_frequency = 2
            #     elif frequency == "Every 8 hrs":
            #         hour_difference = 8
            #         daily_frequency = 3
            #     elif frequency == "Every 6 hrs":
            #         hour_difference = 6
            #         daily_frequency = 4
            #     elif frequency == "Every 5 hrs":
            #         hour_difference = 5
            #         daily_frequency = 5
            #     elif frequency == "Every 4 hrs":
            #         hour_difference = 4
            #         daily_frequency = 6
            #     elif frequency == "Every 3 hrs":
            #         hour_difference = 3
            #         daily_frequency = 7
            #     elif frequency == "Every 2 hrs":
            #         hour_difference = 2
            #         daily_frequency = 8
            #     elif frequency == "Every 1 hr":
            #         hour_difference = 1
            #         daily_frequency = 24
            #     else:
            #         hour_difference = 24
            #         daily_frequency = 1
            #     for i in range(daily_frequency):
            #         tracker = frappe.new_doc("Inpatient Prescription Administration Tracker")
            #         tracker.time = formatted_time
            #         prescription_tracker.append('administration_schedule', tracker)
            #         formatted_time = frappe.utils.add_to_date(formatted_time, hours=hour_difference)
            #     prescription_tracker.save()
            #     date_counter += 1

            return doc
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "Save Item total cost  /medical_order.py")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def update_prescription_table(id: str, value: str, column: str):
        """
        Used to
        """
        try:
            doc = frappe.get_doc("Inpatient Doctor Prescription Table", id)

            if column == "pharmacy_dose":
                doc.pharmacy_dose = value

            elif column == "pharmacy_frequency":
                doc.pharmacy_frequency = value
            elif column == "pharmacy_duration":
                doc.pharmacy_duration = value
            elif column == "medication":
                doc.medication = value
            elif column == "billed_quantity":
                doc.billed_quantity = value
                doc.selling_quantity = value
            elif column == "discount":
                doc.discount = value
            elif column == "pharmacy_remark":
                doc.pharmacy_remark = value
            elif column == "do_not_issue":
                doc.dont_issue = value
            elif column == "selected_item_batch":
                doc.selected_item_batch = value
            else:
                return "Invalid Column"

            doc.save()
            return doc

        except Exception as e:
            frappe.log_error(e, "REST ERROR  /rest.py")
            print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
            return e



    @frappe.whitelist(allow_guest=True)
    def get_scroll_table_data(inpatient_record: str):
        """
        Used to
        """
        from gch_custom.services.prescription_controller import PrescriptionController

        try:
            current_encounter = frappe.get_doc("Inpatient Record", inpatient_record)
            prescription_table = current_encounter.inpatient_prescription_table

            data = []
            stock_table = frappe.qb.DocType("Bin")
            item_table = frappe.qb.DocType("Item")
            warehouse = PrescriptionController.get_user_warehouse()
            # warehouse = "Work In Progress - GCH"

            for prescription in prescription_table:
                if prescription.dispensed == 0:

                    drug_option = (
                        frappe.qb.from_(item_table)
                        .where(item_table.generic_drug == prescription.generic_drug)
                        .where(item_table.disabled == 0)
                        .inner_join(stock_table)
                        .on(stock_table.item_code == item_table.name)
                        .select(
                            item_table.name,
                            item_table.item_name,
                            stock_table.actual_qty,
                            item_table.display_name,
                            item_table.has_batch_no,
                            item_table.high_alert_medication,
                        )
                        .where(stock_table.warehouse == warehouse)
                        .orderby(item_table.display_name)
                        .run(as_dict=True)
                    )
                    generic_drug = prescription.generic_drug
                    is_priority = frappe.db.get_list(
                        "Generic Drug Name",
                        filters={"name": generic_drug},
                        fields=["name", "is_high_alert"],
                    )
                    data.append(
                        {
                            "item": prescription,
                            "item_options": drug_option,
                            "high_alert": is_priority,
                        }
                    )

            return {"prescription_table": data}
        except Exception as e:
            frappe.log_error(e, "REST ERROR  /rest.py")
            print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
            return e

    @frappe.whitelist(allow_guest=True)
    def get_filtered_scroll_table_data(inpatient_record: str,presc_number:str):
        """
        Used to
        """
        from gch_custom.services.prescription_controller import PrescriptionController

        try:
            current_encounter = frappe.get_doc("Inpatient Record", inpatient_record)
            prescription_table = current_encounter.inpatient_prescription_table

            data = []
            stock_table = frappe.qb.DocType("Bin")
            item_table = frappe.qb.DocType("Item")
            warehouse = PrescriptionController.get_user_warehouse()

            for prescription in prescription_table:
                if prescription.prescription_number == presc_number and prescription.dispensed == 0:

                    drug_option = (
                        frappe.qb.from_(item_table)
                        .where(item_table.generic_drug == prescription.generic_drug)
                        .where(item_table.disabled == 0)
                        .inner_join(stock_table)
                        .on(stock_table.item_code == item_table.name)
                        .select(
                            item_table.name,
                            item_table.item_name,
                            stock_table.actual_qty,
                            item_table.display_name,
                            item_table.has_batch_no,
                            item_table.high_alert_medication,
                        )
                        .where(stock_table.warehouse == warehouse)
                        .orderby(item_table.display_name)
                        .run(as_dict=True)
                    )
                    generic_drug = prescription.generic_drug
                    is_priority = frappe.db.get_list(
                        "Generic Drug Name",
                        filters={"name": generic_drug},
                        fields=["name", "is_high_alert"],
                    )
                    data.append(
                        {
                            "item": prescription,
                            "item_options": drug_option,
                            "high_alert": is_priority,
                        }
                    )

            return {"prescription_table": data}
        except Exception as e:
            frappe.log_error(e, "REST ERROR  /rest.py")
            print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
            return e
        

    @frappe.whitelist(allow_guest=True)
    def second_approval_high_alert_medication(prescription_tracker: str, comment: str= None):
        """
        Make second approvalfor high alert medications
        """
        try:
            prescription_tracker_doc = frappe.get_doc("Inpatient Prescription Administration Tracker", prescription_tracker)

            first_approval = prescription_tracker_doc.administered_by
            if first_approval:
                cur_user = frappe.session.user
                if cur_user == first_approval:
                    frappe.throw("This must be approved by a different person")
            else:
                frappe.throw("First approval must be done before second approval")
                return {"message": False}
            prescription_tracker_doc.second_approval = frappe.session.user
            prescription_tracker_doc.second_approval_comment = comment
            prescription_tracker_doc.save()
            return prescription_tracker_doc
        except Exception as e:
            frappe.log_error(e, "REST ERROR  /rest.py")
            print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
            return e
        
    @frappe.whitelist(allow_guest=True)
    def administer_with_comment(prescription_tracker: str, comment: str):
        """
        Administer medication with a comment
        """
        try:
            import datetime

            time_administered = frappe.utils.format_datetime(datetime.datetime.now())
            time_administered = frappe.utils.get_datetime(time_administered)
            time_administered = time_administered.strftime('%H:%M:%S')
            time_administered = frappe.utils.to_timedelta(time_administered)

            prescription_tracker_doc = frappe.get_doc("Inpatient Prescription Administration Tracker", prescription_tracker)

            sch_time = prescription_tracker_doc.time
            time_scheduled = frappe.utils.get_datetime(sch_time)
            time_difference = time_scheduled - time_administered
            diff_in_hours = time_difference.total_seconds() / 3600
            absolute_time_difference = abs(diff_in_hours)

            prescription_tracker_doc.administered_by = frappe.session.user
            prescription_tracker_doc.comment = comment
            prescription_tracker_doc.administered = 1
            prescription_tracker_doc.time_administered = datetime.datetime.now()
            prescription_tracker_doc.time_difference_in_hours = diff_in_hours
            prescription_tracker_doc.absolute_time_difference = absolute_time_difference

            prescription_tracker_doc.save()
            return prescription_tracker_doc
        except Exception as e:
            frappe.log_error(e, 'Error getting medical orders/ medical_orders.py')
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def administer_without_comment(prescription_tracker: str):
        """
        Administer medication with a comment
        """
        try:
            import datetime

            time_administered = frappe.utils.format_datetime(datetime.datetime.now())
            time_administered = frappe.utils.get_datetime(time_administered)
            time_administered = time_administered.strftime('%H:%M:%S')
            time_administered = frappe.utils.to_timedelta(time_administered)

            prescription_tracker_doc = frappe.get_doc("Inpatient Prescription Administration Tracker", prescription_tracker)
            sch_time = prescription_tracker_doc.time

            # time_administered = frappe.utils.get_datetime(time_administered)
            time_scheduled = frappe.utils.get_datetime(sch_time)

            # Get time diff between scheduled time and administered time in hours
            time_difference = time_scheduled - time_administered
            diff_in_hours = time_difference.total_seconds() / 3600
            absolute_time_difference = abs(diff_in_hours)

            # frappe.log_error(time_diff, 'Time difference/ medical_orders.py')

            # return diff_in_hours
           
            prescription_tracker_doc.administered_by = frappe.session.user
            prescription_tracker_doc.administered = 1
            prescription_tracker_doc.time_administered = datetime.datetime.now()
            prescription_tracker_doc.time_difference_in_hours = diff_in_hours
            prescription_tracker_doc.absolute_time_difference = absolute_time_difference

            prescription_tracker_doc.save()
            return {"message": prescription_tracker_doc}
        except Exception as e:
            frappe.log_error(e, 'Error getting medical orders/ medical_orders.py')
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def check_multidisciplinary_status(inpatient_record: str):
        """
        Use inpatienpt record to check if multidisciplinary exists for this encounter
        """
        try:
            multi_disciplinary = frappe.db.get_list(
                "Multidisciplinary",
                filters={"inpatient_record": inpatient_record},
                fields=["name"],
            )
            return multi_disciplinary
        except Exception as e:
            frappe.log_error(e, 'Error getting medical orders/ medical_orders.py')
            return None
        


    @frappe.whitelist(allow_guest=True)
    def mark_prescription_as_patient_owned(presc_name:str):
        """
        Use prescription name to mark that medication as patient own
        """
        try:
            doc = frappe.get_doc("Inpatient Doctor Prescription Table",presc_name)
            doc.patient_owned_medication = 1
            doc.save(ignore_permissions=True)
            return doc

        except Exception as e:
            frappe.log_error(e,"Error marking medication as patient own.")
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def stop_medication(prescription: str, comment: str):
        """
        Use prescription name to mark presc as stopped(With comment)
        """
        try:
            import datetime
            prescription_doc = frappe.get_doc(
                "Inpatient Doctor Prescription Table", prescription
            )
            prescription_doc.stopped = 1
            prescription_doc.stopped_by = frappe.session.user
            prescription_doc.stop_comment = comment
            prescription_doc.stopped_at = datetime.datetime.now()
            prescription_doc.save(ignore_permissions=True)
            return prescription_doc
        except Exception as e:
            frappe.log_error(e, "Error stopping medication.")
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def dispense_with_presc_number(inpatient_record: str, presc_number: str):
        """
        Use prescription number to dispense medication
        Check if presc is high alert and update requires approval
        """
        try:
            from . import invoice_inpatient_record_items
            import datetime


            inpatient_record_doc = frappe.get_doc("Inpatient Record", inpatient_record)
            prescription_list = inpatient_record_doc.inpatient_prescription_table
            items_to_bill = []
            for prescription in prescription_list:           
                if prescription.prescription_number == presc_number:
                    if frappe.utils.cint(prescription.selling_quantity) > 0 and prescription.dispensed == 0 and prescription.high_alert == 0:
                        prescription_doc = frappe.get_doc(
                            "Inpatient Doctor Prescription Table", prescription.name
                        )
                        # Check if encounter has sales invoice, add item to invoice and reduce stock
                        prescription_doc.dispensed = 1
                        prescription_doc.save(ignore_permissions=True)
                        items_to_bill.append(prescription_doc)
                    elif frappe.utils.cint(prescription.selling_quantity) > 0 and prescription.dispensed == 0 and prescription.high_alert == 1 and prescription.requires_approval == 0:
                        prescription_doc = frappe.get_doc(
                            "Inpatient Doctor Prescription Table", prescription.name
                        )
                        prescription_doc.requires_approval = 1
                        prescription_doc.dispensed_at = datetime.datetime.now()
                        prescription_doc.dispensed_by = frappe.session.user
                        prescription_doc.save(ignore_permissions=True)
                    elif frappe.utils.cint(prescription.selling_quantity) > 0 and prescription.dispensed == 0 and prescription.high_alert == 1 and prescription.requires_approval == 1:
                        prescription_doc = frappe.get_doc(
                            "Inpatient Doctor Prescription Table", prescription.name
                        )
                        first_user = prescription_doc.dispensed_by
                        current_user = frappe.session.user
                        if first_user != current_user:
                            prescription_doc.approved_by = current_user
                            prescription_doc.approved_at = datetime.datetime.now()
                            prescription_doc.dispensed = 1
                            prescription_doc.save(ignore_permissions=True)
                            items_to_bill.append(prescription_doc)
                        else:
                            frappe.throw(
                                "You cannot approve your own prescription"
                            )
            invoice_inpatient_record_items(inpatient_record=inpatient_record,runner_type="dispense",item_name_list=items_to_bill)
            inpatient_record_doc.reload()

            return prescription_list
        except Exception as e:
            frappe.log_error(e, "Error dispensing medication")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def dispense_medications(inpatient_record: str):
        """
        Get prescription list from inpatient_record and mark medication as dispensed
        """
        try:
            from . import invoice_inpatient_record_items


            inpatient_record_doc = frappe.get_doc("Inpatient Record", inpatient_record)
            prescription_list = inpatient_record_doc.inpatient_prescription_table
            items_to_bill = []
            for prescription in prescription_list:
                if frappe.utils.cint(prescription.selling_quantity) > 0 and prescription.dispensed == 0:
                    prescription_doc = frappe.get_doc(
                        "Inpatient Doctor Prescription Table", prescription.name
                    )
                    prescription_doc.dispensed = 1
                    prescription_doc.save(ignore_permissions=True)
                    items_to_bill.append(prescription_doc)
            invoice_inpatient_record_items(inpatient_record=inpatient_record,runner_type="dispense",item_name_list=items_to_bill)
            inpatient_record_doc.reload()
            sales_invoice = inpatient_record_doc.sales_invoice

            if sales_invoice:
                from gch_custom.services.stock_level_controller import StockLevelController

                invoice = frappe.get_doc("Sales Invoice", sales_invoice)
                items_to_reduce_from_stock = frappe.get_all(
                    "Sales Invoice Item",
                    filters={"parent": sales_invoice,"from_pharmacy": 1, "dispensed": 0},
                    fields=["item_code", "qty","batch_no","name","warehouse"]
                )
                now = frappe.utils.now()
                today = frappe.utils.nowdate()

                if len(items_to_reduce_from_stock) > 0:
                    for item in items_to_reduce_from_stock:
                        stock_reduced = StockLevelController.deduct_stock(
                            item["item_code"],
                            item["warehouse"],
                            item["batch_no"],
                            item["qty"],
                            invoice.name,
                            item["name"],
                            invoice.company,
                            today,
                            now,
                            "",
                            True,
                        )
                        if stock_reduced:
                            item_doc = frappe.get_doc(
                                "Sales Invoice Item", item["name"]
                            )
                            item_doc.dispensed = 1
                            item_doc.save(ignore_permissions=True)
                        else:
                            frappe.throw(
                                "Error reducing stock for item"
                            )
            else:
                frappe.throw("Sales invoice not found")
            return prescription_list
        except Exception as e:
            frappe.log_error(e, "Error dispense medication.")
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def get_get_user_list():
        """
        Get all users in the system
        """
        try:
            users = frappe.get_all("User", fields=["full_name", "name"])
            return users
        except Exception as e:
            frappe.log_error(e, 'Error getting medical orders/ medical_orders.py')
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def get_inpatient_record_procedures(inpatient_record: str):
        """
        Using the inpatient record, get all the procedures not created
        """
        try:
            procedure_list = frappe.db.get_list(
                "Procedure Prescription",
                filters={"parent": inpatient_record},
                fields=["procedure_name", "procedure_created"],
            )
        except Exception as e:
            frappe.log_error(e, "Error getting inpatient record procedures")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def create_procedure_tests(patient: str, inpatient_record: str):
        """
        Used to create procedure tests given the inpatient record and patient
        """
        try:
            current_patient = frappe.get_doc("Patient", patient)
            precribed_procedures = frappe.db.get_list(
                "Procedure Prescription",
                filters={"parent": inpatient_record},
                fields=["name","procedure_name", "procedure_created"],
            )
            if precribed_procedures:
                for procedure in precribed_procedures:
                    if procedure.procedure_created == 0:  
                        doc = frappe.new_doc('Clinical Procedure')
                        doc.completed_nursing_checklist = []
                        doc.consume_stock = 0
                        doc.consumption_invoiced = 0
                        doc.type = "Inpatient"
                        doc.inpatient_record = inpatient_record
                        doc.invoice_separately_as_consumables = 1
                        doc.invoiced = 0
                        doc.patient = current_patient.name
                        doc.patient_age = current_patient.gch_patient_age
                        doc.patient_name = current_patient.name
                        doc.procedure_template = procedure.procedure_name

                        doc.insert(ignore_permissions=True)
                        

                        # Add procedure consumables
                        consumables = frappe.db.get_list(
                            "Clinical Procedure Item",
                            filters={"parent": procedure.procedure_name},
                            fields=["name", "item_name", "item_code", "qty", "uom", "stock_uom","invoice_separately_as_consumables"],
                        )
                        if consumables:
                            for PROCEDURE_CONSUMABLE in consumables:
                                consumable = frappe.new_doc("Clinical Procedure Item")
                                consumable.item_code = PROCEDURE_CONSUMABLE.item_code
                                consumable.item_name = PROCEDURE_CONSUMABLE.item_name
                                consumable.qty = PROCEDURE_CONSUMABLE.qty
                                consumable.uom = PROCEDURE_CONSUMABLE.uom
                                consumable.stock_uom = PROCEDURE_CONSUMABLE.stock_uom
                                consumable.invoice_separately_as_consumables = 1
                                doc.append("items", consumable)
                        doc.save()

                        # Update procedure as created
                        procedure_doc = frappe.get_doc("Procedure Prescription", procedure.name)
                        procedure_doc.procedure_created = 1
                        procedure_doc.save()
                    # return {"message": True}
                                    
            return {"message": True}
        except Exception as e:
            frappe.log_error(e, "REST ERROR  /rest.py")
            print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
            return "Error on line {}".format(sys.exc_info()[-1].tb_lineno)

    @frappe.whitelist(allow_guest=True)
    def get_medication_list():
        """
        Get a list of all Items
        """
        try:
            meds = frappe.get_all(
                "Item",
                ["item_code","item_name"],
                ignore_permissions=True
            )
            return meds
        except Exception as e:
            frappe.log_error(e, 'Error getting medical orders/ medical_orders.py')
            return {"message": False}
                

    
    @frappe.whitelist(allow_guest=True)
    def add_verbal_order(
        inpatient_record: str,
        medication: str,
        dose: str,
        dose_uom: str,
        freq: str,
        duration: str,
        referring_physician: str,
        remark: str = "",
    ):
        """
        Get inpatient record and add inpatient doctor prescription record to it
        """
        try:
            inpatient_record_doc = frappe.get_doc("Inpatient Record", inpatient_record)
            # Use medication to get item generic additional label information route and preparation type
            item_details = frappe.get_doc("Item", medication)
            # generic = item_details.generic
            
            doc = frappe.get_doc(
                {
                    "doctype": "Inpatient Doctor Prescription Table",
                    "parent": inpatient_record_doc.name,
                    "parenttype": "Inpatient Record",
                    "inpatient_record": inpatient_record,
                    "medication": medication,
                    "dose": dose,
                    "dose_uom": dose_uom,
                    "freq": freq,
                    "duration": duration,
                    "referring_physician": referring_physician,
                    "remark": remark,
                }
            )
            doc.insert(ignore_permissions=True)
            return doc
        except Exception as e:
            frappe.log_error(e, 'Error getting medical orders/ medical_orders.py')
            return {"message": False}
    
    @frappe.whitelist(allow_guest=True)
    def pharmacy_queue():
        """
        Get patients queued on inpatient pharmacy
        """
        try:
            # Get all inpatient prescriptions where dispensed is false and group by prescription number
            data_1 = frappe.db.sql("""
                        SELECT *
                        FROM `tabInpatient Record` as ip
                        JOIN `tabInpatient Doctor Prescription Table` as ipdt
                        ON ip.name = ipdt.parent
                        WHERE ipdt.sent_to_pharmacy = 1
                        AND ipdt.dispensed = 0
                        AND ipdt.high_alert = 0
                        GROUP BY ipdt.prescription_number
                        ORDER BY ip.creation DESC               
                """, as_dict=True)
            return data_1
        except Exception as e:
            frappe.log_error(e, "Error getting inpatient pharmacy queue/ medical_orders.py")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def discharge_medication():
        """
        Get patients queued on inpatient pharmacy
        """
        try:
            # Get all inpatient prescriptions where dispensed is false and group by prescription number
            data_1 = frappe.db.sql("""
                        SELECT *
                        FROM `tabInpatient Record` as ip
                        JOIN `tabInpatient Doctor Prescription Table` as ipdt
                        ON ip.name = ipdt.parent
                        WHERE ipdt.sent_to_pharmacy = 1
                        AND ipdt.dispensed = 0
                        AND ipdt.indication = "Discharge"
                        GROUP BY ipdt.prescription_number
                        ORDER BY ip.creation DESC               
                """, as_dict=True)
            return data_1
        except Exception as e:
            frappe.log_error(e, "Error getting inpatient pharmacy queue/ medical_orders.py")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def new_and_repeat_medication():
        """
        Get patients queued on inpatient pharmacy
        """

                        # OR ipdt.indication = "Repeat"
        try:
            # Get all inpatient prescriptions where dispensed is false and group by prescription number
            data_1 = frappe.db.sql("""
                        SELECT *
                        FROM `tabInpatient Record` as ip
                        JOIN `tabInpatient Doctor Prescription Table` as ipdt
                        ON ip.name = ipdt.parent
                        WHERE ipdt.sent_to_pharmacy = 1
                        AND ipdt.dispensed = 0  
                        AND ipdt.indication IN ('New', 'Repeat')
                        AND ipdt.requires_approval = 0
                        GROUP BY ipdt.prescription_number
                        ORDER BY ip.creation DESC               
                """, as_dict=True)
            return data_1
        except Exception as e:
            frappe.log_error(e, "Error getting inpatient pharmacy queue/ medical_orders.py")
            return {"message": False}
    
    @frappe.whitelist(allow_guest=True)    
    def high_alerts():
        """
        Get patients queued on inpatient pharmacy
        """
        try:
            # Get all inpatient prescriptions where dispensed is false and group by prescription number
            data_1 = frappe.db.sql("""
                        SELECT *
                        FROM `tabInpatient Record` as ip
                        JOIN `tabInpatient Doctor Prescription Table` as ipdt
                        ON ip.name = ipdt.parent
                        WHERE ipdt.dispensed = 0
                        AND ipdt.high_alert = 1
                        GROUP BY ipdt.prescription_number
                        ORDER BY ip.creation DESC               
                """, as_dict=True)
            return data_1
        except Exception as e:
            frappe.log_error(e, "Error getting inpatient pharmacy queue/ medical_orders.py")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def update_prescription_details(prescription_number,prescribed_by,prescription_id):
        """
        Using prescrition Id, Update prescription number and prescribing doctor
        """
        try:
            import datetime 

            healthcare_practitioner = frappe.get_doc("Healthcare Practitioner",{"user_id": prescribed_by})

            prescription = frappe.get_doc("Inpatient Doctor Prescription Table",prescription_id)
            prescription.prescription_number = prescription_number
            prescription.prescribing_doctor = healthcare_practitioner.name
            prescription.prescribed_at = datetime.datetime.now()
            prescription.sent_to_pharmacy = 1
            prescription.save(ignore_permissions=True)

            return {"message": True}
            # return healthcare_practitioner
        except Exception as e:
            frappe.log_error(e, 'Error updating prescription details/ medical_orders.py')
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def get_bincard_data(inpatient_record: str):
        """
        From the inpatient record, get all dispensed prescriptions and return them as a list
        """
        try:
            inpatient_record = frappe.get_doc("Inpatient Record",inpatient_record)
            prescriptions = inpatient_record.get("inpatient_prescription_table")
            bincard_data = []
            for prescription in prescriptions:
                if prescription.dispensed == 1:
                    bincard_data.append(prescription)
            
            return bincard_data
            # return {"message": True}
        except Exception as e:
            frappe.log_error(e, 'Error getting medical orders/ medical_orders.py')
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def initiate_returns(values: object):
        """
        Get value and create inpatient pharmacy return
        """
        try:
            import json
            import datetime


            vals = frappe.parse_json(values)
            frappe.log_error(vals[0].get("name"))
            presc = frappe.get_doc("Inpatient Doctor Prescription Table",vals[0].get("name"))
            inpatient_record = frappe.get_doc("Inpatient Record", presc.parent)
            ward = inpatient_record.ward_station
            patient = inpatient_record.patient
            sales_invoice = inpatient_record.sales_invoice
            current_return_doc = frappe.db.get_value(
            "Inpatient Pharmacy Return",
                {"inpatient_record": presc.parent, "docstatus": 0},
            )
            if not current_return_doc:
                return_doc = frappe.new_doc("Inpatient Pharmacy Return")
                return_doc.patient = patient
                return_doc.ward = ward
                return_doc.sales_invoice = sales_invoice
                return_doc.inpatient_record = presc.parent

                for item in vals:
                    prescription = frappe.get_doc("Inpatient Doctor Prescription Table",item.get('name'))
                    doc = frappe.new_doc("Inpatient Pharmacy Return Item")
                    doc.item = presc.medication
                    doc.return_quantity = item.get("qty")
                    doc.return_reason = item.get("comment")
                    doc.issued_quantity = presc.billed_quantity
                    doc.return_by = frappe.session.user
                    doc.returned_at = datetime.datetime.now()

                    prescription.return_status = "Return Initiated"
                    prescription.save(ignore_permissions=True)
                    return_doc.append("items",doc)
                return_doc.save(ignore_permissions=True)
                return "New Return Initiated"
            else:
                return_doc = frappe.get_doc("Inpatient Pharmacy Return",current_return_doc)
                
                
                for item in vals:
                    prescription = frappe.get_doc("Inpatient Doctor Prescription Table",item.get("name"))
                    doc = frappe.new_doc("Inpatient Pharmacy Return Item")
                    doc.item = presc.medication
                    doc.return_quantity = item.get("qty")
                    doc.return_reason = item.get('comment')
                    doc.issued_quantity = presc.billed_quantity
                    doc.returned_by = frappe.session.user
                    doc.returned_at = datetime.datetime.now()

                    prescription.return_status = "Return Initiated"
                    prescription.save(ignore_permissions=True)
                    return_doc.append("items",doc)

                return_doc.save(ignore_permissions=True)

                return "Return Initiated"
        except Exception as e:
            frappe.log_error(e,"Error initating prescription returns/ medical_orders.py")
            return {"message": False}        
    
    @frappe.whitelist(allow_guest=True)
    def return_item(prescription: str, return_qty: int,comment: str):
        """
        Return prescriptions to pharmacy
        """
        # try:
        import datetime
        prescription = frappe.get_doc("Inpatient Doctor Prescription Table",prescription)
        inpatient_record = frappe.get_doc("Inpatient Record",prescription.parent)
        patient = inpatient_record.patient
        ward = inpatient_record.ward_station
        sales_invoice = inpatient_record.sales_invoice
        current_return_doc = frappe.db.get_value(
            "Inpatient Pharmacy Return",
            {"inpatient_record": prescription.parent, "docstatus": 0},
        )
        if not current_return_doc:
            return_doc = frappe.new_doc("Inpatient Pharmacy Return")
            return_doc.patient = patient
            return_doc.ward = ward
            return_doc.sales_invoice = sales_invoice
            return_doc.inpatient_record = prescription.parent


            doc = frappe.new_doc("Inpatient Pharmacy Return Item")
            doc.item = prescription.medication
            doc.return_quantity = return_qty
            doc.return_reason = comment
            doc.issued_quantity = prescription.billed_quantity
            doc.return_by = frappe.session.user
            doc.returned_at = datetime.datetime.now()

            return_doc.append("items", doc)
            return_doc.save(ignore_permissions=True)

            prescription.return_status = "Return Initiated"
            prescription.save(ignore_permissions=True)

            # current_return_doc[0].append("items", doc)
            # current_return_doc.save(ignore_permissions=True)
            return "unAvailable"
        else:
            current_return_doc = frappe.get_doc("Inpatient Pharmacy Return",current_return_doc)
            doc = frappe.new_doc("Inpatient Pharmacy Return Item")
            doc.item = prescription.medication
            doc.return_quantity = return_qty
            doc.return_reason = comment
            doc.issued_quantity = prescription.billed_quantity
            doc.return_by = frappe.session.user
            doc.returned_at = datetime.datetime.now()

            current_return_doc.append("items", doc)
            current_return_doc.save(ignore_permissions=True)

            prescription.return_status = "Return Initiated"
            prescription.save(ignore_permissions=True)
            
            return "Available"

            prescription.returned_qty = return_qty
            prescription.returned_at = datetime.datetime.now()
            prescription.returned_by = frappe.session.user
            
        #     return True
        # except Exception as e:
        #     frappe.log_error(e, "Error returning item to pharmacy")
        #     return e


    @frappe.whitelist(allow_guest=True)
    def initiate_discharge(
        discharge_ordered_datetime:str,
        discharging_officer: str,
        encounter: str,
        # discharge_instructions: str,
        # follow_up_date: str,
        discharge_note: str,
    ):
        """
        Initiate patient discharge
        """
        try:
            practitioner = frappe.get_doc("Healthcare Practitioner",{"user_id":discharging_officer})
            inpatient_record = frappe.get_doc("Inpatient Record",encounter)
            inpatient_record.discharge_ordered_datetime = discharge_ordered_datetime
            inpatient_record.discharge_practitioner = practitioner.name
            # inpatient_record.discharge_encounter = encounter
            # inpatient_record.discharge_instructions = discharge_instructions
            # inpatient_record.followup_date = follow_up_date
            inpatient_record.discharge_note = discharge_note
            inpatient_record.status = "Discharge Scheduled"

            prescriptions = inpatient_record.inpatient_prescription_table
            for presc in prescriptions:
                presc.discharge_status = "Discharge Initiated"
                presc.save()



            inpatient_record.save(ignore_permissions=True)
            return {"mesage": True}
        except Exception as e:
            frappe.log_error(e, "Error initiating discharge")
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def inpatient_returns():
        """
        Get all inpatient returns that have not been submitted.
        """
        try:
            inpatient_returns = frappe.get_list(
                "Inpatient Pharmacy Return",
                filters={"docstatus": 0},
                fields=["name", "patient", "ward", "sales_invoice", "inpatient_record", "owner"],
                ignore_permissions=True,
            )
            return inpatient_returns
        except Exception as e:
            frappe.log_error(e, "Error getting inpatient returns")
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def return_ip_items(inpatient_pharmacy_return: str):
        """
        Return Items in inpatient return back to warehouse of the receiving officer
        """
        try:
            record = inpatient_pharmacy_return
            warehouse = MedicalOrderController.get_user_current_warehouse()
            return_record = frappe.get_doc("Inpatient Pharmacy Return",{"name":record})
            return_items = return_record.items
            encounter = return_record.inpatient_record
            invoice = return_record.sales_invoice
            if return_items:
                for items in return_items:
                    MedicalOrderController.return_stock(
                        encounter,
                        items.item,
                        items.return_quantity
                    )
            return warehouse

        except Exception as e:
            frappe.log_error(e, "Error getting user")
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def create_lab_test(patient: str, item_code:str, inpatient_record: str, lab_prescription: str = None):
        """
        Create lab test template for ordered test
        """
        try:
            from gch_custom.utils.labware.main import send_to_labware # type: ignore
            current_lab_prescription = None
            current_patient = frappe.get_doc("Patient",patient)
            current_encounter = frappe.get_doc("Inpatient Record",inpatient_record)
            if lab_prescription:
                current_lab_prescription = frappe.get_doc(
                    "Lab Prescription", lab_prescription
                )
            current_lab_template = frappe.get_doc("Lab Test Template", {"item":item_code})
            doc = frappe.get_doc(
                {
                    "department": current_lab_template.department,
                    "descriptive_toggle": 0,
                    "docstatus": 0,
                    "doctype": "Lab Test",
                    "is_inpatient": 1,
                    "inpatient_record": inpatient_record,
                    "lab_test_group": current_lab_template.lab_test_group,
                    "lab_test_name": current_lab_template.lab_test_name,
                    "legend_print_position": "",
                    "medical_code": current_lab_template.medical_code,
                    "name": "new-lab-test-1",
                    "naming_series": "HLC-LAB-.YYYY.-",
                    "normal_toggle": 0,
                    "owner": "Administrator",
                    "practitioner": current_encounter.primary_practitioner,
                    "patient": current_patient.name,
                    "patient_age": current_patient.gch_patient_age,
                    "patient_name": current_patient.name,
                    "patient_sex": current_patient.sex,
                    "printed": 0,
                    "report_preference": "",
                    "sensitivity_toggle": 0,
                    "sms_sent": 0,
                    "status": "Draft",
                    "template": current_lab_template.item,
                    "prescription": current_lab_prescription.name,
                    "lab_test_comment": current_lab_prescription.lab_test_comment,
                    "branch": current_encounter.branch if current_encounter.branch else None,
                }
            )
            doc.insert()
            # Update Lab Prescription with Created Lab Test
            current_encounter.reload()
            # send_to_labware(current_encounter)
            # current_lab_prescription.db_set("assigned_lab_test", doc.name)
            # current_lab_prescription.db_set("assigned_test", 1)

            return doc
        except Exception as e:
            frappe.log_error(e, "Error creating inpatient lab test/ medical_orders.py")
            return {"message": False}
        
    
    @frappe.whitelist(allow_guest=True)
    def add_lab_test_to_invoice(lab_test: str,inpatient_record: str):
        """
        Add lab test to invoice
        """
        try:            

            warehouse = MedicalOrderController.get_user_current_warehouse()
            record = frappe.get_doc("Inpatient Record",inpatient_record)
            submitted_test = frappe.get_doc("Lab Test",lab_test)
            current_invoice = ""
            sales_invoice = record.sales_invoice

            user_station = frappe.db.get_list(
                "Practitioner Station Entry",
                filters={"user": frappe.session.user},
                fields=[
                    "station",
                ],
            )
            billed_from = user_station[0].station
            
            if sales_invoice:
                current_invoice  = sales_invoice
            else:
                frappe.throw("No Sales Invoice for this encounter")

            lab_presc = frappe.get_doc("Lab Prescription",{"name":submitted_test.prescription})
            lab_test_item = create_invoice_item(
                submitted_test.template,"Nos",1,"","",warehouse,1,1,"","","",billed_from=billed_from
            )
            lab_presc.invoiced = 1
            lab_presc.save()

            submitted_test.invoiced = 1
            submitted_test.save()

            invoice = frappe.get_doc("Sales Invoice",current_invoice)
            invoice.append("items",lab_test_item)

            invoice.save()

            return invoice
        except Exception as e:
            frappe.log_error(e, "Error adding lab test to invoice/ medical_orders.py")
            return {"message": False}

    @frappe.whitelist(allow_guest=True)
    def reopen_slot(entry:str, reason:str):
        """
        Reopen drug administration slot
        """
        try:
            administration_slot = frappe.get_doc("Inpatient Prescription Administration Tracker",entry)
            administration_slot.reopen_reason = reason
            administration_slot.reopened = 1
            administration_slot.reopened_at = frappe.utils.now()
            administration_slot.reopen_user = frappe.session.user
            administration_slot.save()
            return administration_slot
        except Exception as e:
            frappe.log_error(e, "Error reopening drug administration slot/ medical_orders.py")
            return {"message": False}


    @frappe.whitelist(allow_guest=True)
    def test(inpatient_record: str):
        try: 
            record = frappe.get_doc("Inpatient Record",inpatient_record)
            record.status = "Admitted"
            record.save()
        except Exception as e:
            frappe.log_error(e, 'Error getting medical orders/ medical_orders.py')
            return {"message": False}