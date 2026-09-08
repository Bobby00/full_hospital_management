import frappe


def create_invoice_item(
    item: str,
    uom: str = "Nos",
    qty: int = 1,
    customer_group: str = "Commercial",
    batch_no=None,
    warehouse=None,
    is_service=0,
    from_procedure=0,
    is_consultation=0,
    encounter: str = None,
    from_pharmacy=0,
    billed_from: str = None
):
    """
    creates an invoice item given the item, uom and qty for invoicing

    :param item: item to be invoiced string
    :param uom: unit of measure of the item int
    :param qty: quantity of the item string
    :return: invoice item

    """

    print(batch_no, "----batch_no-----------", item)

    _item = frappe.get_doc("Item", item)
    # print(_item.requires_sample,"ITEM REQUIRES SAMPLE!!!!!!!")
    #  Handle typerror if requires sample == 0

    if hasattr(_item, 'requires_sample') and _item.requires_sample:
        return None

    """ Get current branch and use it to get default price list """
    from gch_custom.services.rest import check_branch_pricelist

    # try:
    #     item_fee = check_branch_pricelist(_item.item_code)
    # except Exception as e:
    #     frappe.log_error(e, "error on item price")
    #     frappe.throw("error")

    _fee = frappe.db.get_value(
        "Item Price",
        {"item_code": _item.item_code, "price_list": "Standard Selling"},
        ["price_list_rate"],
    )

    if _fee is None:
        frappe.throw(f"Item {_item.item_code} Has no selling price set")

    _income_account, _selling_cost_center, _expense_account = frappe.db.get_value(
        "Item Default",
        {"parent": _item.item_code},
        ["income_account", "selling_cost_center", "expense_account"],
    )

    item_code = _item.item_code
    cost_center = _selling_cost_center
    qty = int(qty)
    amount = int(_fee) * int(qty)
    item_name = _item.item_name
    description = _item.description
    uom = uom
    rate = int(_fee)
    base_rate = int(_fee)
    base_amount = int(_fee) * int(qty)
    income_account = _income_account
    conversion_factor = 1
    discount_percentage = 0
    discount_amount = 0
    batch_no = batch_no
    expense_account = _expense_account
    is_service = is_service
    # warehouse = warehouse

    if customer_group == "Gertrudes Staff":
        discount_percentage = 23
        discount_amount = amount * (discount_percentage / 100)

    # TODO: add mode of payment

    invoice_item = {
        "item_code": item_code,
        "qty": qty,
        "rate": 1,
        "amount": amount - discount_amount,
        "cost_center": cost_center,
        "item_name": item_name,
        "base_rate": base_rate - (base_rate * (discount_percentage / 100)),
        "base_amount": base_amount
        - ((base_amount * (discount_percentage / 100)) * qty),
        "conversion_factor": conversion_factor,
        "description": description,
        "uom": uom,
        "rate": rate - (rate * (discount_percentage / 100)),
        "income_account": income_account,
        "stock_qty": int(qty) * int(conversion_factor),
        "discount_percentage": discount_percentage,
        "discount_amount": discount_amount,
        "margin_type": "Percentage",
        "price_list_rate": rate,
        "batch_no": batch_no,
        "warehouse": warehouse,
        "expense_account": expense_account,
        "is_service": is_service,
        "from_procedure": from_procedure,
        "from_pharmacy": from_pharmacy,
        "date_added": frappe.utils.now(),
        "added_by": frappe.session.user
    }

    print(invoice_item)

    return invoice_item

@frappe.whitelist(allow_guest=True)
def create_theatre_overview(inpatient_record: str, theatre_booking: str):
    """
    Generate theatre overview page
    """
    try:
        booking = frappe.get_doc("Theatre Booking", theatre_booking)
        inpatient = frappe.get_doc("Inpatient Record", inpatient_record)
        surgeon = booking.surgeon_name
        diagnosis = frappe.db.get_all(
            "Codification Table",
            filters={"parent": booking},
            fields=["medical_code","code"]
        )

        theatre_overview = frappe.new_doc("Theatre Overview")
        theatre_overview.inpatient_record = inpatient_record
        theatre_overview.patient = inpatient.patient
        theatre_overview.surgeon = surgeon
        if diagnosis:
            for item in diagnosis:
                diag = frappe.new_doc("Diagnosis")
                diag.medical_code = item.medical_code
                diag.code = item.code

                theatre_overview.append("diagnosis", diag)
                inpatient.append("diagnosis", diag)
        
        theatre_overview.insert(ignore_permissions=True)
        inpatient.theatre_overview = theatre_overview.name
        inpatient.save()

        return True
    except Exception as e:
        frappe.log_error(e, "Error creating theatre overview")
        return False

@frappe.whitelist(allow_guest=True)
def bill_package(theatre_booking: str, inpatient_record: str):
    """
    Bill surgical package only
    """
    try:
        from gch_custom.services.prescription_controller import (
            PrescriptionController,
        )

        record = frappe.get_doc("Inpatient Record", inpatient_record)
        current_patient = frappe.get_doc("Patient", record.patient)
        theatre_booking = frappe.get_doc("Theatre Booking", theatre_booking)    
        packages_booked = frappe.db.get_list(
            "Theatre Booking Clinical Procedure Template", 
            filters={"parent":theatre_booking.name},
            fields=['clinical_procedure_template',"custom_price"]
        )
        warehouse = PrescriptionController.get_user_warehouse()
        sales_invoice = record.sales_invoice
        if sales_invoice:
            invoice = frappe.get_doc("Sales Invoice", sales_invoice)
            if packages_booked:
                for package in packages_booked:
                    procedure = frappe.get_doc("Clinical Procedure Template", package.clinical_procedure_template)
                    invoice_item = create_invoice_item(procedure.item_code,"Nos",1,warehouse)
                    if invoice_item:
                        invoice_item["rate"] = package.custom_price
                        invoice_item['base_rate'] = package.custom_price
                        invoice_item['base_amount'] = package.custom_price

                        invoice.append("items", invoice_item)

            invoice.save(ignore_permissions=True)

            record.stop_auto_billing
            record.save()
            
            create_theatre_overview(inpatient_record, theatre_booking.name)
            
            return record
        else:
            new_invoice = frappe.new_doc("Sales Invoice")
            new_invoice.inpatient_record = record.name
            new_invoice.patient = current_patient.name
            new_invoice.patient_name = current_patient.patient_name
            new_invoice.customer = current_patient.customer
            new_invoice.mode_of_payment = theatre_booking.mode_of_payment
            new_invoice.conversion_rate = 1
            new_invoice.price_list_currency = "KES"
            new_invoice.plc_conversion_rate = 1
            new_invoice.is_inpatient = 1
            new_invoice.base_net_total = 0
            new_invoice.base_grand_total = 0
            new_invoice.grand_total = 0
            new_invoice.debit_to = "Debtors - GCH"
            if packages_booked:
                for package in packages_booked:
                    procedure = frappe.get_doc("Clinical Procedure Template", package.clinical_procedure_template)
                    invoice_item = create_invoice_item(procedure.item,"Nos",1,warehouse)
                    if invoice_item:
                        invoice_item["rate"] = package.custom_price
                        invoice_item['base_rate'] = package.custom_price
                        invoice_item['base_amount'] = package.custom_price
                        new_invoice.append("items", invoice_item)

            new_invoice.insert(ignore_permissions=True)

            create_theatre_overview(inpatient_record, theatre_booking.name)

            return record        
    except Exception as e:
        frappe.log_error(e, "Error billing package")
        return {"message": False}

@frappe.whitelist(allow_guest=True)
def invoice_inpatient_record_items(
    inpatient_record: str, runner_type="normal", item_name_list=[]
):
    try:
        from gch_custom.services.prescription_controller import (
            PrescriptionController,
        )

        current_inpatient_record = frappe.get_doc("Inpatient Record", inpatient_record)
        current_patient = frappe.get_doc("Patient", current_inpatient_record.patient)
        current_ward = frappe.get_doc(
            "Nursing Ward", current_inpatient_record.ward_station
        )

        warehouse = PrescriptionController.get_user_warehouse()

        # Handle theatre Packages
        admission_type = current_inpatient_record.admission_type
        if admission_type:
            if admission_type == "Surgery":
                theatre_booking = current_inpatient_record.theatre_booking
                if theatre_booking:
                    theatre_booking_doc = frappe.db.get_list(
                        "Theatre Booking Clinical Procedure Template", 
                        filters={"parent":theatre_booking},
                        fields=['clinical_procedure_template',"custom_price"]
                    )
                    if theatre_booking_doc:
                        invoice_items = []
                        sales_invoice = current_inpatient_record.sales_invoice
                        payment = frappe.get_doc("Theatre Booking", theatre_booking)
                        mode_of_payment = payment.mode_of_payment
                        if sales_invoice:
                            print("got here", invoice_items)
                            invoice = frappe.get_doc("Sales Invoice", sales_invoice)
                            for item in theatre_booking_doc:
                                item_proc = frappe.get_doc("Clinical Procedure Template", item.clinical_procedure_template)
                                if item:
                                    invoice_item = create_invoice_item(item_proc.item,"Nos",1,warehouse)
                                    if invoice_item:
                                        invoice_item["rate"] = item.custom_price
                                        invoice_item['base_rate'] = item.custom_price
                                        invoice_item['base_amount'] = item.custom_price


                                        invoice.append("items", invoice_item)
                            invoice.save(ignore_permissions=True)
                            frappe.db.commit()

                            #  Create theatre overview (inpatient record, )

                            current_inpatient_record.sales_invoice = invoice.name
                            current_inpatient_record.stop_auto_billing = 1
                            current_inpatient_record.save(ignore_permissions=True)

                            create_theatre_overview(inpatient_record, theatre_booking)

                            return {
                                "code": 201,
                                "message": "Invoice updated successfully",
                                "sales_invoice": invoice.name,
                            }
                        else:
                            new_invoice = frappe.new_doc("Sales Invoice")
                            new_invoice.inpatient_record = current_inpatient_record.name
                            new_invoice.patient = current_patient.name
                            new_invoice.patient_name = current_patient.patient_name
                            new_invoice.customer = current_patient.customer
                            new_invoice.mode_of_payment = mode_of_payment
                            new_invoice.conversion_rate = 1
                            new_invoice.price_list_currency = "KES"
                            new_invoice.plc_conversion_rate = 1
                            new_invoice.is_inpatient = 1
                            new_invoice.base_net_total = 0
                            new_invoice.base_grand_total = 0
                            new_invoice.grand_total = 0
                            new_invoice.debit_to = "Debtors - GCH"

                            branch_ = frappe.get_doc("Branch","Muthaiga")
                            code = branch_.inpatient_invoice_naming_series
                            naming_series = code
                            new_invoice.naming_series = naming_series
                            for item in theatre_booking_doc:
                                item_proc = frappe.get_doc("Clinical Procedure Template", item.clinical_procedure_template)
                                if item:
                                    invoice_item = create_invoice_item(item_proc.item,"Nos",1,warehouse)
                                    if invoice_item:
                                        invoice_item["rate"] = item.custom_price
                                        invoice_item['base_rate'] = item.custom_price
                                        invoice_item['base_amount'] = item.custom_price


                                        new_invoice.append("items", invoice_item)
                            new_invoice.insert(ignore_permissions=True)

                            current_inpatient_record.sales_invoice = new_invoice.name
                            current_inpatient_record.stop_auto_billing = 1
                            current_inpatient_record.save(ignore_permissions=True)

                            create_theatre_overview(inpatient_record, theatre_booking)

                            frappe.db.commit()

                            return {
                                "code": 201,
                                "message": "Invoice created successfully",
                                "sales_invoice": new_invoice.name,
                            }
                else:
                    frappe.log_error(
                        current_inpatient_record.name,
                        "Theatre Booking not found"
                    )
                    return {
                        "code": 400,
                        "message": "Theatre Booking not found",
                    }
                    

        # Get bed type to be used in charging
        bed_type = frappe.db.get_value(
            "Nursing Ward Bed",
            {"bed_number": current_inpatient_record.bed_number, "nursing_ward": current_inpatient_record.ward_station},
            ["bed_type"]
        )

        # TODO: cater for is lodging
        if current_inpatient_record.is_lodging == 1:
            current_ward = frappe.get_doc(
                "Nursing Ward", current_inpatient_record.ward_of_preference
            )

        current_ward_charges = frappe.get_all(
            "Nursing Ward Charges",
            filters={"parent": current_ward.name},
            fields=["item", "is_recurring","bed_charge","bed_type"],
        )
        current_primary_doc = frappe.get_doc(
            "Healthcare Practitioner", current_inpatient_record.primary_practitioner
        )
        # DOCTORS CHARGES
        current_inpatient_visit_charge = current_primary_doc.inpatient_visit_charge
        current_inpatient_visit_charge_item = frappe.get_doc(
            "Item", current_primary_doc.inpatient_visit_charge_item
        )
        invoiced_items = []
        current_invoiced_items = []
        sales_invoice = ""
        frappe.log_error(
            {
                "inpatient_record": inpatient_record,
                "runner_type": runner_type,
                "e": current_inpatient_record.sales_invoice,
            },
            "INFO: IP ITEMS",
        )

        # Surgical Procedure charges
        # admission_type = current_inpatient_record.admission_type
        # if admission_type:
        #     theatre_booking = current_inpatient_record.theatre_booking
        #     if theatre_booking:
        #         booking_doc = frappe.get_doc(
        #             "Theatre Booking", theatre_booking
        #         )
        #         print(booking_doc,"BOOKING DOC")
        #         procedures = booking_doc.clinical_procedures
        #         for procedure in procedures:
        #             item_to_bill = create_invoice_item(
        #                 procedure.item_code
        #             )
        #             if procedure.custom_price:
        #                 item_to_bill["rate"] = int(procedure.custom_price)
        #                 item_to_bill["amount"] = int(procedure.custom_price)
        #             else:
        #                 item_to_bill["rate"] = int(procedure.price)
        #                 item_to_bill["amount"] = int(procedure.price)
        #             invoiced_items.append(item_to_bill)

        # End of surgical billing

        if current_inpatient_record.sales_invoice != None:
            frappe.log_error(
                {
                    "inpatient_record": inpatient_record,
                    "runner_type": runner_type,
                    "e": current_inpatient_record.sales_invoice,
                },
                "INFO: IP ITEM2S",
            )
            sales_invoice = current_inpatient_record.sales_invoice

        frappe.log_error(
            {
                "inpatient_record": inpatient_record,
                "runner_type": runner_type,
                "sales_invoice": sales_invoice,
            },
            "INFO: IP NO INVOICE",
        )

        if runner_type == "normal" and sales_invoice == "":
            frappe.log_error(
                {
                    "inpatient_record": inpatient_record,
                    "runner_type": runner_type,
                    "sales_invoice": sales_invoice,
                },
                "INFO: IP NO INVOICEsssssss",
            )

            # DOCTORS CHARGE
            doctors_charge = create_invoice_item(
                item=current_inpatient_visit_charge_item.name,
            )
            invoiced_items.append(doctors_charge)

            # NHIF CHARGES

            nhif_charge_item = create_invoice_item(item=current_ward.nhif_charge_item)

            invoiced_items.append(nhif_charge_item)

            # WARD CHARGES

            for item in current_ward_charges:
                frappe.log_error(current_ward_charges, "Current charges")
                if item['bed_charge'] ==1 and item["bed_type"] == bed_type:
                    charge_item = create_invoice_item(item=item["item"])
                    invoiced_items.append(charge_item)
                elif item['bed_charge'] == 0:
                    charge_item = create_invoice_item(item=item["item"])
                    invoiced_items.append(charge_item)
                print(item["item"])
            invoice = invoice_encounter_items(
                patient=current_patient,
                invoiced_items=invoiced_items,
                invoice=sales_invoice,
                current_invoiced_items=current_invoiced_items,
            )
            new_invoice = frappe.get_doc("Sales Invoice", invoice.name)
            new_invoice.is_inpatient = 1
            new_invoice.inpatient_record = current_inpatient_record.name
            new_invoice.save()
            current_inpatient_record.sales_invoice = invoice.name

            current_inpatient_record.save()

            return {
                "code": 201,
                "message": "Invoice created successfully",
                "sales_invoice": invoice.name,
            }
        if runner_type == "cron":
            print("sales invoice exists")

            current_invoice = frappe.get_doc("Sales Invoice", sales_invoice)

            # DOCTORS CHARGE
            doctors_charge = create_invoice_item(
                item=current_inpatient_visit_charge_item.name,
            )
            invoiced_items.append(doctors_charge)

            # NHIF CHARGES

            nhif_charge_item = create_invoice_item(item=current_ward.nhif_charge_item)

            invoiced_items.append(nhif_charge_item)

            # WARD CHARGES
            for item in current_invoice.items:
                current_invoiced_items.append(item.item_code)

            for item in current_ward_charges:
                if item["is_recurring"] == 1:
                    if item['bed_charge'] == 1 and item['bed_type'] == bed_type:
                        charge_item = create_invoice_item(item=item["item"])
                        invoiced_items.append(charge_item)
                    elif item['bed_charge'] == 0:
                        charge_item = create_invoice_item(item=item["item"])
                        invoiced_items.append(charge_item)
                    print(item["item"])

            invoice = invoice_encounter_items(
                patient=current_patient,
                invoiced_items=invoiced_items,
                invoice=sales_invoice,
                current_invoiced_items=current_invoiced_items,
            )
            frappe.log_error(
                {
                    "sales": sales_invoice,
                    "inpatient_record": current_inpatient_record.name,
                    "type": runner_type,
                },
                "INFO: CRON WORKED",
            )

            return {
                "code": 200,
                "message": "Invoice updated successfully",
                "sales_invoice": invoice.name,
            }
        if runner_type == "dispense":
            from gch_custom.services.prescription_controller import (
                PrescriptionController,
            )

            user_station = frappe.db.get_list(
                "Practitioner Station Entry",
                filters={"user": frappe.session.user},
                fields=[
                    "station",
                ],
            )
            billed_from = user_station[0].station

            warehouse = PrescriptionController.get_user_warehouse()
            if len(item_name_list) > 0:
                for item in item_name_list:
                    invoiced_items.append(
                        create_invoice_item(
                            item=item.medication,
                            qty=item.selling_quantity,
                            batch_no=item.selected_item_batch,
                            warehouse=warehouse,
                            from_pharmacy=1,
                            billed_from=billed_from
                        )
                    )

                invoice = invoice_encounter_items(
                    patient=current_patient,
                    invoiced_items=invoiced_items,
                    invoice=sales_invoice,
                    current_invoiced_items=current_invoiced_items,
                )

            # Reduce stock
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

            return {
                "code": 200,
                "message": "Invoice updated with Dispensed Medication successfully",
                "sales_invoice": invoice.name,
            }
        if runner_type == "normal" and len(item_name_list) > 0:
            for item in item_name_list:
                invoiced_items.append(create_invoice_item(item=item))
            invoice = invoice_encounter_items(
                patient=current_patient,
                invoiced_items=invoiced_items,
                invoice=sales_invoice,
                current_invoiced_items=current_invoiced_items,
            )
            return {
                "code": 200,
                "message": "Invoice updated with provided items successfully",
                "sales_invoice": invoice.name,
            }

        return {"code": 202, "message": "type normal happened"}
    except Exception as e:
        frappe.log_error(e, "error on billing")
        return {"code": 500, "message": "error"}


def invoice_encounter_items(
    patient,
    invoiced_items,
    invoice,
    current_invoiced_items,
    mode_of_payment="Cash",
):
    _current_invoiced_items = current_invoiced_items

    if invoice == "":
        # TODO: Add naming series based on branch

        invoice = frappe.new_doc("Sales Invoice")
        invoice.patient = patient.name
        invoice.patient_name = patient.patient_name
        invoice.customer = patient.customer
        invoice.conversion_rate = 1
        invoice.price_list_currency = "KES"
        invoice.plc_conversion_rate = 1
        invoice.mode_of_payment = mode_of_payment
        invoice.is_inpatient = 1


        # add naming series based on branch
        branch_ = frappe.get_doc("Branch","Muthaiga")
        code = branch_.inpatient_invoice_naming_series
        naming_series = code

        invoice.naming_series = naming_series

        for item in invoiced_items:
            invoice.append("items", item)

        invoice.base_net_total = 0
        invoice.base_grand_total = 0
        invoice.grand_total = 0
        invoice.debit_to = "Debtors - GCH"
        try:
            invoice.insert(ignore_permissions=True)
            # invoice.submit()
            return invoice
        except Exception as e:
            frappe.log_error(e, "Save new invoice  /rest.py line 1814")
            return {"name": e}

    invoice = frappe.get_doc("Sales Invoice", invoice)
    if invoice.docstatus == 1:
        frappe.msgprint("Invoice has been closed, please contact finance.")

    for item in invoiced_items:
        invoice.append("items", item)

    invoice.save()
    # invoice.submit()
    return invoice


@frappe.whitelist(allow_guest=True)
def get_all_open_inpatient_records():
    inpatient_records = frappe.get_all(
        "Inpatient Record",
        filters={"status": "Admitted", "stop_auto_billing": 0},
        fields=["name"],
    )

    return inpatient_records


@frappe.whitelist(allow_guest=True)
def bill_all_open_inpatient_records():
    current_open_inpatient_records = get_all_open_inpatient_records()

    for inpatient_record in current_open_inpatient_records:
        invoice_inpatient_record_items(
            inpatient_record=inpatient_record, runner_type="cron"
        )


@frappe.whitelist(allow_guest=True)
def get_patient_insurances(patient: str):
    try:

        insurances = frappe.get_all(
            "Parent Medical Cover Detail",
            filters=[["parent", "=", patient]],
            fields=[
                "insurance__scheme",
                "is_default",
                "principal_member",
                "membership_no",
            ],
        )

        return insurances
    except Exception as e:

        return []

@frappe.whitelist(allow_guest=True)
def add_tests_to_invoice(inpatient_record: str):
    """
    Get all tests prescribed for the patient and bill them
    """
    try:
        from gch_custom.utils.labware.main import send_to_labware_ip # type: ignore
        from .medical_orders import MedicalOrderController

        record = frappe.get_doc("Inpatient Record",inpatient_record)
        current_invoice = ""
        items_to_add = []
        sales_invoice = record.sales_invoice
        if sales_invoice:
            current_invoice  = sales_invoice
        else:
            frappe.throw("No Sales Invoice for this encounter")
        
        labs = frappe.db.get_list(
            "Lab Prescription",
            filters={"parent": record.name},
            fields=["name", "assigned_test","lab_test_code"]
        )
        
        radiology = frappe.db.get_list(
            "Radiology Prescriptions",
            filters={"parent": record.name},
            fields=["name", "sent_to_pacs"]
        )
        patient = record.patient

        # Hold created lab test list
        created_tests = ""

        if labs:
            for lab in labs:
            # create lab templates
                lab_test = frappe.get_doc("Lab Prescription",{"name":lab.name})
                if lab_test.assigned_test != 1:
                    created_lab_test = MedicalOrderController.create_lab_test(
                        patient,
                        lab_test.lab_test_code,
                        inpatient_record,
                        lab_prescription = lab_test.name,
                    )
                    created_tests += lab.lab_test_code + ","
                    frappe.db.set_value(
                        "Lab Prescription",
                        lab.name,
                        {
                            "assigned_lab_test": created_lab_test.name,
                            "assigned_test": 1,
                            "lab_test_created": 1,
                        },
                        update_modified=False,
                    )
            # reload the encounter to get the saved lab tests. IMPORTANT.
            record.reload()
            send_to_labware_ip(record.name)
        if radiology:
            frappe.log_error(radiology, "radiology")
            for rad in radiology:
                if rad.sent_to_pacs == 0:
                    radio_test = frappe.get_doc("Radiology Prescriptions",rad.name)
                    radio_code = radio_test.lab_test_code
                    radio_test_item = create_invoice_item(
                        radio_code,"Nos",1,"","","",1,1
                    )
                    items_to_add.append(radio_test_item)
                    # radio_test.sent_to_pacs = 1
                    # radio_test.save()
            # reload the encounter to get the saved lab tests. IMPORTANT.
            record.reload()
            send_to_pacs_ip(record.name)
        invoice = frappe.get_doc("Sales Invoice", current_invoice)
        if invoice.docstatus == 1:
                frappe.msgprint("Invoice has been closed, please contact finance.")
        for item in items_to_add:
            invoice.append("items", item)
        
        invoice.save()
        return invoice

    except Exception as e:
        frappe.log_error(e, 'Error Billing tests/ medical_orders.py')


@frappe.whitelist(allow_guest=True)
def add_ward_charges_to_invoice(**args):
    try:
        invoiced_items = []
        sales_invoice = frappe.get_doc("Sales Invoice", args["sales_invoice"])
        # Fetch bed type from bed number and room number
        bed_type = frappe.db.get_value("Nursing Ward Bed", {"ward_room": args["room_no"], "bed_number": args["bed_number"]}, ['bed_type'])

        current_ward_charges = frappe.get_all(
            "Nursing Ward Charges",
            filters={"parent": args["ward"]},
            fields=["item", "is_recurring","bed_charge","bed_type"],
        )
    
        for item in current_ward_charges:
            frappe.log_error(current_ward_charges, "Current charges")
            if item['bed_charge'] ==1 and item["bed_type"] == bed_type:
                charge_item = create_invoice_item(item=item["item"])
                invoiced_items.append(charge_item)
                sales_invoice.append("items", charge_item)
            elif item['bed_charge'] == 0:
                charge_item = create_invoice_item(item=item["item"])
                invoiced_items.append(charge_item)
                print(item["item"])
                sales_invoice.append("items", charge_item)

                # new_invoice = frappe.get_doc("Sales Invoice", invoice.name)
                # new_invoice.inpatient_record = current_inpatient_record.name
                # new_invoice.save()
       
        
        sales_invoice.save(ignore_permissions=True)
        return True
    except Exception as e:
        frappe.log_error(e, "error charging ward")
        return e


@frappe.whitelist(allow_guest=True)
def send_to_pacs_ip(inpatient_record: str):
    """
    Util to send an encounter details to PACS
    """
    from gch_pacs.utils.ris_pacs import create_patient, create_request

    inpatient_record = frappe.get_doc("Inpatient Record", inpatient_record)

    patient_ = frappe.get_doc("Patient", inpatient_record.patient)
    # prescribing_doctor=frappe.get_doc("Healthcare Practitioner", encounter.practitioner)
    radiology_test_list = inpatient_record.radiology_details
    if radiology_test_list:

        uhid: str = patient_.uhid_code
        first_name: str = patient_.first_name
        last_name: str = patient_.last_name
        middle_name: str = patient_.middle_name
        gender: str = patient_.sex
        dob: str = patient_.dob
        mobile_number: str = "0712345678"
        clinical_notes: str = "Test Clinical Notes"

        dob_str = str(dob)
        birthdate = dob_str.replace("-", "")
        vip = patient_.is_vip_patient

        if patient_.sent_to_pacs == 0:
            adt = create_patient(
                uhid,
                first_name,
                middle_name,
                last_name,
                mobile_number,
                gender,
                birthdate,
                vip
            )

            if adt:
                frappe.log_error(adt,"Pacs error")
                if adt['status'] == "OK" or adt['status'] == "ERROR":

                    frappe.db.set_value(
                        "Patient",
                        patient_.name,{
                            "sent_to_pacs": 1
                        },
                        update_modified=False,
                    )
                    frappe.db.commit()

                    for test in radiology_test_list:
                        if test.sent_to_pacs == 0:
                            test_price = test.price
                            price = str(test_price)
                            created_request = create_request(
                                uhid,
                                test.name,
                                test.name,
                                test.department,
                                inpatient_record.primary_practitioner,
                                test.test_name,
                                test.comment,
                                inpatient_record.branch,
                                price,
                            )

                            if 'status' in created_request:
                                if created_request['status'] == 'OK':
                                    coding_list = created_request.get('body', {}).get('code', {}).get('coding', [])
                                    accession_number = coding_list[0][0].get('accessionNumber')  
                                    message = created_request.get('message')
                                    if coding_list and coding_list[0]:
                                        accession_number = coding_list[0][0].get('accessionNumber')                        
                                        if accession_number:
                                            test = frappe.get_doc("Radiology Prescriptions", test.name)
                                            test.accessionnumber = accession_number
                                            test.sent_to_pacs = 1
                                            test.save()
                                    return True
                                elif created_request['status'] == 'ERROR':
                                    errors = created_request['errors']
                                    error_id = errors.get('id')
                                    requisition_status = errors.get('requisitionStatus')
                                    actors_issue = errors.get('actors')

                                    frappe.log_error(errors,"Request to pacs declined")
                                    frappe.throw(actors_issue + '. Kindly consult IT for assistance')
                                    return False
                                else:
                                    frappe.log_error(created_request,"Error while creating pacs request")
                                    frappe.throw('Error while creating pacs request. Please try again')
                                    return False

                            # coding_list = created_request.get('body', {}).get('code', {}).get('coding', [])
                            # accession_number = coding_list[0][0].get('accessionNumber')  
                            # message = created_request.get('message')
                            # frappe.log_error({'message':message,'coding_list': coding_list,'accessionNumber': accession_number},'Pacs response')
                            # if message:
                            #     coding_list = created_request.get('body', {}).get('code', {}).get('coding', [])
                            #     if coding_list and coding_list[0]:
                            #         accession_number = coding_list[0][0].get('accessionNumber')  
                            #         frappe.log_error(accession_number, 'accession Number')                         
                            #         if accession_number:
                            #             test = frappe.get_doc("Radiology Prescriptions", test.name)
                            #             test.accessionnumber = accession_number
                            #             test.sent_to_pacs = 1
                            #             test.save()
                            # elif message is False:
                            #     frappe.log_error(
                            #         created_request,
                            #         "Request to pacs declined",
                            #     )
                            else:
                                frappe.log_error(
                                    created_request,
                                    "Error sending request to PACS",
                                )
                                return {"message": False}
                else:
                    frappe.msgprint(
                        "error",
                        "Error creating patient on PACS",
                    )
                    frappe.log_error(adt,f"Error creating patient  on pacs")
                    return {"message": False}
            else:
                frappe.msgprint(
                    "error",
                    "Error creating patient on PACS",
                )
                return {"message": False}
        else:
            for test in radiology_test_list:
                if test.sent_to_pacs == 0:
                    test_price = test.price
                    price = str(test_price)
                    created_request = create_request(
                        uhid,
                        test.name,
                        test.name,
                        test.department,
                        inpatient_record.primary_practitioner,
                        test.test_name,
                        test.comment,
                        inpatient_record.branch,
                        price,
                    )
                    frappe.log_error(created_request,"created_request here inpatient pacs")

                    if 'status' in created_request:
                        if created_request['status'] == 'OK':
                            coding_list = created_request.get('body', {}).get('code', {}).get('coding', [])
                            accession_number = coding_list[0][0].get('accessionNumber')  
                            message = created_request.get('message')
                            if coding_list and coding_list[0]:
                                accession_number = coding_list[0][0].get('accessionNumber')                        
                                if accession_number:
                                    test = frappe.get_doc("Radiology Prescriptions", test.name)
                                    test.accessionnumber = accession_number
                                    test.sent_to_pacs = 1
                                    test.save()
                            return True
                        elif created_request['status'] == 'ERROR':
                            errors = created_request
                            error_id = errors.get('id')
                            requisition_status = errors.get('requisitionStatus')
                            actors_issue = errors.get('actors')

                            frappe.log_error(errors,"Request to pacs declined")
                            frappe.throw(actors_issue + 'Kindly consult IT for assistance')
                            return False
                        else:
                            frappe.log_error(created_request,"Error while creating pacs request")
                            frappe.throw('Error while creating pacs request. Please try again')
                            return False
                    # coding_list = created_request.get('body', {}).get('code', {}).get('coding', [])
                    # accession_number = coding_list[0][0].get('accessionNumber')  
                    # message = created_request.get('message')
                    # frappe.log_error({'message':message,'coding_list': coding_list,'accessionNumber': accession_number},'Inpatient Pacs response')
                    # message = created_request.get('message')
                    # if message:                        
                    #     if accession_number:
                    #         test = frappe.get_doc("Radiology Prescriptions", test.name)
                    #         test.accessionnumber = accession_number
                    #         test.sent_to_pacs = 1
                    #         test.save()
                    # elif message is False:
                    #     frappe.log_error(
                    #         created_request,
                    #         "Request to pacs ip declined",
                    #     )
                    else:
                        frappe.log_error(
                            created_request,
                            "Error sending request to PACS",
                        )
                        return {"message": False}


class InpatientBillingController:
    @frappe.whitelist(allow_guest=True)
    def get_billable_items():
        """
        Get a list of items that can be billed in the system
        @TODO: Dyamically filter based on logged in user
        """
        try:
            items = frappe.db.get_list(
                "Item",
                fields=[
                    "item_code",
                    "item_name"
                ]
            )
            return items
        except Exception as e:
            frappe.log_error(e, "Error getting items")


    @frappe.whitelist(allow_guest=True)
    def add_to_bill(item_list: object,sales_invoice: str):
        """
        Add Billable item invoice
        """
        try:
            import json
            from gch_custom.services.prescription_controller import PrescriptionController
            
            
            sales_invoice = frappe.get_doc(
                "Sales Invoice",
                sales_invoice
            )
            if sales_invoice.docstatus == 1:
                frappe.msgprint("Invoice has been closed, please contact finance.")
            else:
                user_warehouse = ''
                user_warehouse = PrescriptionController.get_user_warehouse()
                if not user_warehouse:
                    user_warehouse ="MAIN PHARMACY - GCH"
                item_batch = ''
                session_user = frappe.session.user

                station = frappe.db.get_list(
                    "Practitioner Station Entry",
                    filters={"user": session_user},
                    fields=[
                        "station",
                        "branch"
                    ],
                )
                item_list = json.loads(item_list)
                if not isinstance(item_list, list):
                    frappe.throw(item_list,"Items should be a list of dictionaries.")

                for item in item_list:
                    item_code = item.get('itemCode')
                    qty = item.get('quantity')
                    date = item.get('date')
                    comment = item.get('comment')

                    batches = PrescriptionController.get_batches_linked_to_item(item_code)
                    if batches is not None:
                        item_batch = batches.batch_no
                    
                    invoice_item = create_invoice_item(item_code,"Nos",qty,"","",user_warehouse)
                    invoice_item['comment'] = comment
                    invoice_item['item_batch'] = item_batch
                    invoice_item['item_category'] = item.get('itemGroup')
                    invoice_item['added_by'] = frappe.session.user
                    invoice_item['date_added'] = date
                    invoice_item['billed_from'] = station[0].station


                    sales_invoice.append("items",invoice_item)
                sales_invoice.save(ignore_permissions=True)
                return invoice_item
        except Exception as e: 
            frappe.log_error(
                e,"Error adding Item to invoice/ inpatient billing.py"
            )
            return False
        
    @frappe.whitelist(allow_guest=True)
    def items_in_bill(sales_invoice: str):
        """
        Use Sales invoice number to get items currently in bill
        """
        try:
            user_ = frappe.session.user
            user_service_unit = frappe.db.get_list(
                "Practitioner Station Entry",
                filters={"user": user_},
                fields=[
                    "station"
                ],
            )
            service_unit = user_service_unit[0].station

            items = frappe.db.get_list(
                "Sales Invoice Item",
                filters={"parent": sales_invoice},
                fields=[
                    "item_name",
                    "qty",
                    "date_added",
                    "base_rate",
                    "billed_by"
                ],
                order_by="creation asc"
            )
            return items
        except Exception as e:
            frappe.log_error(e, "Error geting invoice items/ inpatient billing.py")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def get_sales_invoice(inpatient_record: str):
        """
        Get Sales Invoice
        """
        try:
            sales_invoice = frappe.db.get_list(
                "Sales Invoice",
                filters={"inpatient_record": inpatient_record},
                fields=[
                    "name"
                ]
            )
            return sales_invoice
        except Exception as e:
            frappe.log_error(e, "Error getting invoice/ inpatient billing.py")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def fetch_item_groups():
        """"
        Get all itemgroups except drug, labs and radiology
        """
        try:
            item_groups = frappe.db.get_list(
                "Item Group",
                filters={
                    "parent_item_group": ["not in", ["Drug", "Radiology", "Laboratory"]],
                    "name": ["not in", ["Drug", "Radiology", "Laboratory"]],
                },
                fields=[
                    "name","parent_item_group"
                ]
            )
            return item_groups
        except Exception as e:
            frappe.log_error(e, "Error getting item groups/ inpatient billing.py")
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def fetch_item_by_groups(item_group: str):
        """
        Get all items in a group
        """
        try:
            items = frappe.db.get_list(
                "Item",
                filters={"item_group": item_group},
                fields=[
                    "name",
                    "item_name",
                    "description",
                    "item_group"
                ]
            )
            return items
        except Exception as e:
            frappe.log_error(e, "Error getting items by group/ inpatient billing.py")
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def get_item_details(item_code: str):
        """
        Get item details
        """
        try:
            _fee = frappe.db.get_value(
                "Item Price",
                {"item_code": item_code, "price_list": "Standard Selling"},
                ["price_list_rate"],as_dict=True
            )

            item = frappe.db.get_value(
                "Item",
                {"item_code": item_code},
                ["item_group"],as_dict=True
            )

            details = {
                "price": _fee.price_list_rate,
                "item_group": item.item_group
            }

            return details
        except Exception as e:
            frappe.log_error(e, "Error getting details")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def get_patient_in_invoice(sales_invoice: str):
        """
        Get patient from invoice
        """
        try:
            invoice = frappe.get_doc("Sales Invoice", sales_invoice)
            if invoice.is_inpatient:
                ref=invoice.inpatient_record
            else:
                ref = invoice.encounter
            patient_str = invoice.patient
            patient = frappe.get_doc("Patient", patient_str)
            return patient
        except Exception as e:
            frappe.log_error(e, "Error getting patient details from invoice")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def fetch_doctors():
        """
        Fetch all doctors
        """
        try:
            doctors = frappe.db.get_list(
                "Healthcare Practitioner",
                filters={"role_profile": "Doctor"},
                fields=[
                    "name",
                    "practitioner_name"
                ]
            )
            return doctors
        except Exception as e:
            frappe.log_error(e, "Error getting doctors")
            return {"message": False}
        
    @frappe.whitelist(allow_guest=True)
    def search_items(search_term):
        try:
            sanitized_term = " ".join(search_term.split())
            
            # Query to fetch items excluding those with parent item groups 'Drug', 'Laboratory', or 'Radiology'
            items = frappe.db.sql("""
                SELECT 
                    i.name, i.item_name,i.item_group
                FROM 
                    `tabItem` i
                JOIN 
                    `tabItem Group` ig ON i.item_group = ig.name
                WHERE 
                    i.item_name LIKE %(sanitized_term)s
                    AND ig.parent_item_group NOT IN ('Drug', 'Laboratory', 'Radiology')
                    AND i.item_group NOT IN ('Drug', 'Laboratory', 'Radiology')
                LIMIT 20
            """, {'sanitized_term': f'%{sanitized_term}%'}, as_dict=True)
            
            return items
        except Exception as e:
            frappe.log_error(e, "Error searching items")
            return {"message": False}
        

    @frappe.whitelist(allow_guest=True)
    def create_prescription(
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
                "doctype": "Inpatient Doctor Prescription Table",
                "name": "new-inpatient-doctor-prescription-table-1",
                "owner": owner,
                "parent": parent,
                "parentfield": "inpatient_prescription_table",
                "parenttype": "Inpatient Record",
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