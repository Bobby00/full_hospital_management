from distutils.debug import DEBUG
import re
import frappe
from gch_custom.services.encounter_workflow import create_invoice_item
from gch_custom.services.stock_level_controller import StockLevelController

from frappe import _
from .absa_pdq import ABSA_PDQ
from gch_messaging.utils.core import messaging
from frappe.utils import now, get_datetime
from . import tools
from .prescription_controller import PrescriptionController
from .workflow_handler import WFStates, WorkflowHandler, wf_handler


warehouse = PrescriptionController.get_user_warehouse()


class WorkflowController:
    @frappe.whitelist(allow_guest=True)
    def get_encounter_sales_invoice(encounter: str) -> str:
        """
        Get the sales invoice for the given encounter

        :param encounter: encounter to get the sales invoice for
        :return: sales invoice
        """
        try:
            has_invoice = frappe.db.exists("Sales Invoice", {"encounter": encounter})
            # has_invoice = frappe.db.count(
            #     "Sales Invoice", {"encounter": encounter})
            if has_invoice:
                invoice = frappe.db.get_value(
                    "Sales Invoice", {"encounter": encounter}, ["name"]
                )

                return invoice
            else:
                return ""
        except Exception as e:
            print(e)
            return ""

    def send_payment_request_sms(
        phone_number: str,
        amount: float,
        reference: str,
        current_invoice: str,
        branch: int,
        next_state: str,
    ) -> bool:
        """
        Send SMS to the patient to request payment

        :param phone_number: patient phone number
        :param amount: amount to be paid

        """
        try:
            # Get Mpesa Paybill
            name = frappe.db.get_value("Mpesa Settings", {"branch": branch}, ["name"])
            mpesa_settings = frappe.get_doc("Mpesa Settings", name)
            business_shortcode = mpesa_settings.business_shortcode

            msg = f"Dear Customer, please pay KES {amount} for {reference} via MPESA to Paybill {business_shortcode} Account Number: {current_invoice} before going to {next_state}"
            sent, resp = messaging.send_sms(recipient=phone_number, message=msg)
            print(sent, resp)

            return True
        except Exception as e:
            print(e)
            return False

    def get_consulation_item(clinic: str, mode_of_payment: str = "") -> str:
        """
        Get consultation item from the clinc


        :param clinic: clinic to get the consultation item from
        :return: consultation item

        """
        try:
            clinic = frappe.get_doc("Healthcare Service Unit", clinic)

            if mode_of_payment:
                different_price = clinic.varying_prices
                if different_price:
                    if mode_of_payment == "Cash":
                        consultation_fee_item = clinic.cash_consultation_item
                        return consultation_fee_item
                    elif mode_of_payment == "Insurance":
                        consultation_fee_item = clinic.insurance_consultation_item
                        return consultation_fee_item
                    else:
                        consultation_fee_item = clinic.outpatient_consultation_item
                        return consultation_fee_item
                else:
                    consultation_fee_item = clinic.outpatient_consultation_item
                    return consultation_fee_item
            else:
                consultation_fee_item = clinic.outpatient_consultation_item
                return consultation_fee_item

        except Exception as e:
            print(e)
            frappe.log_error(e, "Error getting consultation item/ workflow_controller.py")
            return ""

    # @frappe.whitelist(allow_guest=True)

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

        if _item.requires_sample:
            if _item.requires_sample == True:
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

        if is_consultation:
            # get current encounter
            from gch_custom.overrides.patient_encounter import GCHPatientEncounter

            current_encounter: GCHPatientEncounter = frappe.get_doc(
                "Patient Encounter", encounter
            )

            # get patient prev encounter from current enc details
            prev_enc = frappe.db.sql(
                """select
                name,
                modified
                from `tabPatient Encounter` where patient=%s
                order by modified desc limit 2""",
                (current_encounter.patient),
                as_dict=True,
            )

            # Account for new encounters
            if len(prev_enc) >= 2:
                prev_enc_doc: GCHPatientEncounter = frappe.get_doc(
                    "Patient Encounter", prev_enc[1].name
                )

                # comparing clinics to either add or remove consulation discount for return patients
                if (
                    current_encounter.clinic == prev_enc_doc.clinic
                    or current_encounter.clinic == "HRP Review - GCH"
                    or current_encounter.clinic == "Outpatient Review - GCH"
                    and current_encounter.reason_for_visit != "New presentation"
                ):
                    hours_since_last_encounter = current_encounter.revisit_reason_dur
                    if (
                        hours_since_last_encounter <= 24
                        and hours_since_last_encounter > -1
                    ):
                        _fee = _fee * 0
                    elif (
                        hours_since_last_encounter > 24
                        and hours_since_last_encounter <= 72
                    ):
                        _fee = _fee * 0.5

        _income_account, _selling_cost_center, _expense_account = frappe.db.get_value(
            "Item Default",
            {"parent": _item.item_code},
            ["income_account", "selling_cost_center", "expense_account"],
        )

        item_code = _item.item_code
        cost_center = _selling_cost_center
        qty = qty
        amount = _fee * qty
        item_name = _item.item_name
        description = _item.description
        uom = uom
        rate = _fee
        base_rate = _fee
        base_amount = _fee * qty
        income_account = _income_account
        conversion_factor = 1
        discount_percentage = 0
        discount_amount = 0
        batch_no = batch_no
        expense_account = _expense_account
        is_service = is_service

        if _item.is_stock_item:
            warehouse = PrescriptionController.get_user_warehouse()

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
            "expense_account": expense_account,
            "is_service": is_service,
            "from_procedure": from_procedure,
            "date_added": frappe.utils.now(),
            "added_by": frappe.session.user,
            "billed_from": billed_from
        }
        if warehouse:
            invoice_item["warehouse"] = warehouse

        # print(invoice_item)

        return invoice_item
    
    def create_revaccination_invoice_item(
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

        if _item.requires_sample:
            if _item.requires_sample == True:
                return None

        """ Get current branch and use it to get default price list """
        # from gch_custom.services.rest import check_branch_pricelist

        # try:
        #     item_fee = check_branch_pricelist(_item.item_code)
        # except Exception as e:
        #     frappe.log_error(e, "error on item price")
        #     frappe.throw("error")

        # _fee = frappe.db.get_value(
        #     "Item Price",
        #     {"item_code": _item.item_code, "price_list": "Standard Selling"},
        #     ["price_list_rate"],
        # )

        # if _fee is None:
        #     frappe.throw(f"Item {_item.item_code} Has no selling price set")

        if is_consultation:
            # get current encounter
            from gch_custom.overrides.patient_encounter import GCHPatientEncounter

            current_encounter: GCHPatientEncounter = frappe.get_doc(
                "Patient Encounter", encounter
            )

            # get patient prev encounter from current enc details
            prev_enc = frappe.db.sql(
                """select
                name,
                modified
                from `tabPatient Encounter` where patient=%s
                order by modified desc limit 2""",
                (current_encounter.patient),
                as_dict=True,
            )

            # Account for new encounters
            if len(prev_enc) >= 2:
                prev_enc_doc: GCHPatientEncounter = frappe.get_doc(
                    "Patient Encounter", prev_enc[1].name
                )

                # comparing clinics to either add or remove consulation discount for return patients
                if (
                    current_encounter.clinic == prev_enc_doc.clinic
                    or current_encounter.clinic == "HRP Review - GCH"
                    or current_encounter.clinic == "Outpatient Review - GCH"
                    and current_encounter.reason_for_visit != "New presentation"
                ):
                    hours_since_last_encounter = current_encounter.revisit_reason_dur
                    if (
                        hours_since_last_encounter <= 24
                        and hours_since_last_encounter > -1
                    ):
                        _fee = _fee * 0
                    elif (
                        hours_since_last_encounter > 24
                        and hours_since_last_encounter <= 72
                    ):
                        _fee = _fee * 0.5

        _income_account, _selling_cost_center, _expense_account = frappe.db.get_value(
            "Item Default",
            {"parent": _item.item_code},
            ["income_account", "selling_cost_center", "expense_account"],
        )

        item_code = _item.item_code
        cost_center = _selling_cost_center
        qty = qty
        amount = 0 * qty
        item_name = _item.item_name
        description = _item.description
        uom = uom
        rate = 0
        base_rate = 0
        base_amount = 0 * qty
        income_account = _income_account
        conversion_factor = 1
        discount_percentage = 0
        discount_amount = 0
        batch_no = batch_no
        expense_account = _expense_account
        is_service = is_service
        # warehouse = warehouse

        warehouse = PrescriptionController.get_user_warehouse()

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
            "dispensed": 1,
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
        }

        print(invoice_item)

        return invoice_item

    @frappe.whitelist(allow_guest=True)
    def patient_encounter_workflow_controller(
        workflow_state: str, selected_workflow_action: str, encounter: str
    ):
        """
        Used to check changes in workflow states and update encounter accordingly

        :param workflow_state: current workflow state of the encounter
        :param selected_workflow_action: selected workflow action
        :param encounter: encounter to be updated

        """
        from gch_custom.utils.labware.main import send_to_labware
        from gch_custom.services.rest import (
            create_lab_test,
            create_procedure_test,
            get_encounter_lab_tests,
            get_encounter_prescription,
            get_encounter_procedures,
            get_encounter_radiology_tests,
            get_encounter_vaccinations,
            invoice_encounter_items,
            is_encounter_invoiced,
            get_procedure_consumables,
        )

        owner = frappe.session.user

        # print(workflow_state,selected_workflow_action,encounter,owner)

        isCashPayer = True

        # get current encounter
        from gch_custom.overrides.patient_encounter import GCHPatientEncounter

        current_encounter: GCHPatientEncounter = frappe.get_doc(
            "Patient Encounter", encounter
        )

        mode_of_payment: str = current_encounter.mode_of_payment

        print("mode of payment", mode_of_payment)

        next_state = wf_handler.get_next_workflow_state(
            workflow_state, selected_workflow_action, mode_of_payment
        )

        current_encounter.db_set("is_with_doctor", 0)

        # send_to_labware(current_encounter)
        lab_prescriptions = frappe.db.get_list(
            "Lab Prescription",
            filters={"parent": encounter, "parentfield": "lab_test_prescription"},
            fields=[
                "name",
                "lab_test_code",
                "lab_test_name",
                "assigned_test",
                "assigned_lab_test",
            ],
        )

        print("RUNNING WORKFLOW NOW")

        # extract encounter fields
        mode_of_payment = current_encounter.mode_of_payment
        phone_number = current_encounter.phone_number
        branch = current_encounter.branch
        patient = current_encounter.patient
        patient_ = frappe.get_doc("Patient", patient)
        ref_id = patient_.uhid_code
        isCashPayer = False

        if mode_of_payment == "Cash":
            isCashPayer = True

        # LABTESTS = get_encounter_lab_tests(encounter)
        # print(f"LBS: {LABTESTS}")

        # All Items in Encounter Items
        ALL_ITEMS_ENCOUNTER = []

        """
        check if the encounter has an invoice
    
        """

        current_invoice = ""
        # hold the current invoiced items in the existing invoice
        CURRENT_INVOICED_ITEMS = []

        """
        if encounter has an invoice assoicated with it

        """

        # get the invoice associated with the encounter
        sales_invoice = WorkflowController.get_encounter_sales_invoice(encounter)

        # make the retrived sale invoice the current invoice
        current_invoice = sales_invoice

        # get all the items in the currenct invoice
        invoiced_items = frappe.db.get_list(
            "Sales Invoice Item", filters={"parent": sales_invoice}, pluck="item_code"
        )

        warehouse = PrescriptionController.get_user_warehouse()

        # store all the items in the current invoice in the CURRENT_INVOICED_ITEMS list
        for item in invoiced_items:
            CURRENT_INVOICED_ITEMS.append(item)

        if next_state == WFStates.PENDING_RECEPTION:
            # check if its first time the patient is at reception
            isFirstTime = True
            created_invoice = get_all_billed_services_and_items(
                encounter, patient_, workflow_state, next_state, owner
            )
            
            if current_encounter.mode_of_payment == "Insurance":
                create_templates_for_all_prescribed_tests(encounter, patient)

            
            if created_invoice:
                update_workflow_state_history(encounter, workflow_state, next_state, owner)
                return "Invoice Created Successfully : " + created_invoice.name
            else: 
                frappe.throw('Error creating invoice')
                return {"message": False}

            
        # create a switch case for the next state
        if next_state == WFStates.PENDING_INVOICE_CLOSING:
            created_invoice = get_all_billed_services_and_items(
                encounter, patient_, workflow_state, next_state, owner
            )

            return "Invoice Updated Successfully : " + created_invoice.name

        if next_state == WFStates.PENDING_LAB_PAYMENT:
            # get all labs items

            lab_amount = 0

            LABTESTS = get_encounter_lab_tests(encounter)

            print(LABTESTS)

            for LABTEST in LABTESTS:
                lab_code = LABTEST.lab_test_code
                labtest = WorkflowController.create_invoice_item(
                    lab_code, "Nos", 1, "", "", "", 1, 1
                )
                
                if labtest:
                    lab_amount += labtest["amount"]
                    ALL_ITEMS_ENCOUNTER.append(labtest)

            created_invoice = invoice_encounter_items(
                patient_,
                ALL_ITEMS_ENCOUNTER,
                encounter,
                current_invoice,
                CURRENT_INVOICED_ITEMS,
                mode_of_payment,
            )

            if isCashPayer:
                # if the patient is paying by cash send the invoice payment details to the patient via sms
                sent_payment_request = WorkflowController.send_payment_request_sms(
                    phone_number=phone_number,
                    reference=ref_id,
                    amount=lab_amount,
                    current_invoice=created_invoice,
                    branch=branch,
                    next_state=next_state,
                )

                # todo change the state based on the message sent
                if sent_payment_request:
                    pass
                else:
                    pass
            # Send to Labware
            print(created_invoice)
            update_workflow_state_history(encounter, workflow_state, next_state, owner)
            return "Invoice Updated Successfully : " + created_invoice.name

        if next_state == WFStates.PENDING_PROCEDURE_PAYMENT:
            procedure_amount = 0

            # get all pharmacy items
            PROCEDURETESTS = get_encounter_procedures(encounter)
            created_procedures = ""
            for PROCEDURETEST in PROCEDURETESTS:
                print(PROCEDURETEST, "PROCEDURES PREEEEEEEEESRSRR!!!!!!!!!!")
                if PROCEDURETEST.procedure_created != 1:
                    procedure_test = WorkflowController.create_invoice_item(
                        PROCEDURETEST.procedure_name
                    )
                    created_clinical_procedures = create_procedure_test(
                        patient, PROCEDURETEST.procedure_name, encounter
                    )

                    if created_clinical_procedures:
                        frappe.db.set_value(
                            "Procedure Prescription",
                            {"parent": encounter},
                            {"procedure_created": 1},
                            update_modified=False,
                        )

                    created_procedures += PROCEDURETEST.procedure_name + ","

                    PROCEDURE_CONSUMABLES = get_procedure_consumables(
                        PROCEDURETEST.procedure_name
                    )

                    if PROCEDURE_CONSUMABLES:
                        for PROCEDURE_CONSUMABLE in PROCEDURE_CONSUMABLES:
                            batch_details = PrescriptionController.check_if_item_has_batch_and_return_earliest_batch_in(
                                PROCEDURE_CONSUMABLE["item_code"]
                            )
                            batch_no = ""
                            if batch_details:
                                batch_no = batch_details.batch_id
                            procedure_consumable_item = (
                                WorkflowController.create_invoice_item(
                                    PROCEDURE_CONSUMABLE["item_code"],
                                    PROCEDURE_CONSUMABLE["uom"],
                                    PROCEDURE_CONSUMABLE["qty"],
                                    patient_.customer_group,
                                    batch_no,
                                    warehouse,
                                    "",
                                    1,
                                )
                            )
                            print(
                                "procedure_consumable_item ----------------",
                                procedure_consumable_item,
                            )
                            ALL_ITEMS_ENCOUNTER.append(procedure_consumable_item)

                    procedure_amount += procedure_test["amount"]
                    ALL_ITEMS_ENCOUNTER.append(procedure_test)

            created_invoice = invoice_encounter_items(
                patient_,
                ALL_ITEMS_ENCOUNTER,
                encounter,
                current_invoice,
                CURRENT_INVOICED_ITEMS,
                mode_of_payment,
            )

            if isCashPayer:
                # if the patient is paying by cash send the invoice payment details to the patient via sms
                sent_payment_request = WorkflowController.send_payment_request_sms(
                    phone_number=phone_number,
                    reference=ref_id,
                    amount=procedure_amount,
                    current_invoice=created_invoice,
                    branch=branch,
                    next_state=next_state,
                )

                # todo change the state based on the message sent
                if sent_payment_request:
                    pass
                else:
                    pass
            print(created_invoice)
            update_workflow_state_history(encounter, workflow_state, next_state, owner)
            return "Invoice Updated Successfully : " + created_invoice.name

        if next_state == WFStates.PENDING_RADIOLOGY_PAYMENT:
            radiology_amount = 0

            # get all radiology items
            RADIOLOGYTESTS = get_encounter_radiology_tests(encounter)
            for RADIOLOGYTEST in RADIOLOGYTESTS:
                radiologytest = WorkflowController.create_invoice_item(
                    RADIOLOGYTEST.lab_test_code, "Nos", 1, "", "", "", 1, 1
                )
                radiology_amount += radiologytest["amount"]
                ALL_ITEMS_ENCOUNTER.append(radiologytest)
            created_invoice = invoice_encounter_items(
                patient_,
                ALL_ITEMS_ENCOUNTER,
                encounter,
                current_invoice,
                CURRENT_INVOICED_ITEMS,
                mode_of_payment,
            )
            if isCashPayer:
                # if the patient is paying by cash send the invoice payment details to the patient via sms
                sent_payment_request = WorkflowController.send_payment_request_sms(
                    phone_number=phone_number,
                    reference=ref_id,
                    amount=radiology_amount,
                    current_invoice=created_invoice,
                    branch=branch,
                    next_state=next_state,
                )

                # todo change the state based on the message sent
                if sent_payment_request:
                    pass
                else:
                    pass
            print(created_invoice)
            update_workflow_state_history(encounter, workflow_state, next_state, owner)
            return "Invoice Updated Successfully : " + created_invoice.name

        if next_state == WFStates.PENDING_PRESCRIPTION_PAYMENT:
            prescription_amount = 0
            customer_group = patient_.customer_group
            # get all pharmacy items
            PRESCRIPTIONS = get_encounter_prescription(encounter)
            for PRESCRIPTION in PRESCRIPTIONS:
                if (
                    PRESCRIPTION["dont_issue"] == 0
                    and PRESCRIPTION["dispensed"] == "0"
                    and PRESCRIPTION["generic_drug_name"].find("Extemporaneous") == -1
                ):
                    prescription = WorkflowController.create_invoice_item(
                        PRESCRIPTION["medication"],
                        PRESCRIPTION["unit_of_measure"],
                        int(PRESCRIPTION["selling_quantity"]),
                        customer_group,
                        PRESCRIPTION["selected_item_batch"],
                        warehouse,
                    )
                    # ALL_ITEMS_ENCOUNTER.append(prescription)
                    prescription_amount += prescription["amount"]
                if (
                    PRESCRIPTION["dont_issue"] == 0
                    and PRESCRIPTION["dispensed"] == "0"
                    and PRESCRIPTION["generic_drug_name"].find("Extemporaneous") != -1
                ):
                    prescription = WorkflowController.create_invoice_item(
                        PRESCRIPTION["medication"],
                        PRESCRIPTION["unit_of_measure"],
                        int(PRESCRIPTION["selling_quantity"]),
                        customer_group,
                        "",
                        "",
                        1,
                    )
                    prescription_amount += prescription["amount"]

            created_invoice = get_all_billed_services_and_items(
                encounter, patient_, workflow_state, next_state, owner
            )
            if isCashPayer:
                # if the patient is paying by cash send the invoice payment details to the patient via sms
                sent_payment_request = WorkflowController.send_payment_request_sms(
                    phone_number=phone_number,
                    reference=ref_id,
                    amount=prescription_amount,
                    current_invoice=created_invoice,
                    branch=branch,
                    next_state=next_state,
                )

                # todo change the state based on the message sent
                if sent_payment_request:
                    pass
                else:
                    pass
            print(created_invoice)
            update_workflow_state_history(encounter, workflow_state, next_state, owner)
            return "Invoice Updated Successfully : " + created_invoice.name

        if next_state == WFStates.PENDING_VACCINATION_PAYMENT:
            print("PENDING VACCINATION PAYMENT")
            vaccination_amount = 0

            # get all vaccination items
            VACCINATIONS = get_encounter_vaccinations(encounter)
            for VACCINATION in VACCINATIONS:
                print(VACCINATION["drug"], VACCINATION["uom"], VACCINATION["quantity"])
                vaccination = WorkflowController.create_invoice_item(
                    VACCINATION["drug"],
                    VACCINATION["uom"],
                    int(VACCINATION["quantity"]),
                )
                vaccination_amount += vaccination["amount"]

                ALL_ITEMS_ENCOUNTER.append(vaccination)
            created_invoice = invoice_encounter_items(
                patient_,
                ALL_ITEMS_ENCOUNTER,
                encounter,
                current_invoice,
                CURRENT_INVOICED_ITEMS,
                mode_of_payment,
            )
            if isCashPayer:
                # if the patient is paying by cash send the invoice payment details to the patient via sms
                sent_payment_request = WorkflowController.send_payment_request_sms(
                    phone_number=phone_number,
                    reference=ref_id,
                    amount=vaccination_amount,
                    current_invoice=created_invoice,
                    branch=branch,
                    next_state=next_state,
                )

                # todo change the state based on the message sent
                if sent_payment_request:
                    pass
                else:
                    pass
            print(created_invoice)
            print(ALL_ITEMS_ENCOUNTER, CURRENT_INVOICED_ITEMS)
            update_workflow_state_history(encounter, workflow_state, next_state, owner)
            return "Invoice Updated Successfully : " + created_invoice.name

        # Dispense medication and reduce stock
        if next_state == WFStates.DISPENSED:
            return PrescriptionController.reduce_stock_dispensed(encounter)

        if next_state == WFStates.PENDING_LAB:
            # create lab tests
            created_tests = ""

            # Update invoice for insurance patients
            if mode_of_payment == "Insurance":
                created_invoice = bill_labs_and_update_invoice(encounter)
            for lab_prescription in lab_prescriptions:
                lab_presc = frappe.get_doc("Lab Prescription", lab_prescription.name)
                if lab_presc.assigned_test != 1:
                    created_lab_test = create_lab_test(
                        patient,
                        lab_presc.lab_test_code,
                        encounter,
                        lab_prescription=lab_presc.name,
                    )
                    created_tests += lab_prescription.lab_test_code + ","
                    frappe.db.set_value(
                        "Lab Prescription",
                        lab_prescription.name,
                        {
                            "assigned_lab_test": created_lab_test.name,
                            "assigned_test": 1,
                            "lab_test_created": 1,
                        },
                        update_modified=False,
                    )

            # reload the encounter to get the saved lab tests. IMPORTANT.
            current_encounter.reload()
            send_to_labware(current_encounter)
            update_workflow_state_history(encounter, workflow_state, next_state, owner)

            if created_tests != "":
                return (
                    f"Workflow Updated Successfully. Created Lab Tests: {created_tests}"
                )
            return "Workflow Updated Successfully."

        # Dispense Vaccinations and reduce stock
        if next_state == WFStates.VACCINATED:
            # frappe.throw("Got here error")

            # Get all Vaccinations from encouunter
            VACCINATIONS = get_encounter_vaccinations(encounter)

            invoice = frappe.db.get_value(
                "Sales Invoice",
                {"encounter": encounter},
                ["name", "company", "posting_date", "posting_time"],
                as_dict=True,
            )
            invoice_number = invoice["name"]
            print("INVOICE NNUMBER!!!!!!!!!!!!!", invoice_number)
            for VACCINATION in VACCINATIONS:
                if VACCINATION["vaccine_dispensed"] != 1:
                    item_code = VACCINATION["drug"]
                    batch = ""
                    earliest_batch = PrescriptionController.check_if_item_has_batch_and_return_earliest_batch_in(
                        item_code
                    )
                    if earliest_batch:
                        batch = earliest_batch.batch_id
                    invoice_item = frappe.db.get_value(
                        "Sales Invoice Item",
                        {"parent": invoice_number, "item_code": item_code},
                        [
                            "item_code",
                            "warehouse",
                            "batch_no",
                            "qty",
                            "name",
                            "is_service",
                            "dispensed",
                        ],
                        as_dict=True,
                    )
                    print("GOT HEREREEEE!!!")

                    StockLevelController.deduct_vaccine(
                        invoice_item["item_code"],
                        invoice_item["warehouse"],
                        batch,
                        invoice_item["qty"],
                        invoice["name"],
                        invoice_item["name"],
                        invoice["company"],
                        invoice["posting_date"],
                        invoice["posting_time"],
                        encounter,
                    )

                    return "Vaccines reduced from stock"

        # Bill the entire encounter
        if next_state == WFStates.PENDING_INVOICE_CLOSING:
            return get_all_billed_services_and_items(
                encounter, patient_, workflow_state, next_state, owner
            )

        if next_state == WFStates.PENDING_RADIOLOGY:
            from gch_custom.utils.pacs import send_to_pacs
            # create radiology tests
            send_to_pacs(encounter)
            # RADIOLOGYTESTS = frappe.db.get_list(        
            #     "Radiology Prescriptions",
            #     filters={"parent": encounter, "parentfield": "radiology_details","sent_to_pacs": 0},
            #     fields=[
            #         "name",
            #         "lab_test_code",
            #         "lab_test_name",
            #     ],
            # )
            # created_tests = ""

            # if RADIOLOGYTESTS:
            #     for RADIOLOGYTEST in RADIOLOGYTESTS:
            #         try:
            #             created_radiology_tests = create_lab_test(
            #                 patient, RADIOLOGYTEST.lab_test_code, encounter,RADIOLOGYTEST.name
            #             )
            #             if created_radiology_tests:
            #                 frappe.db.set_value(
            #                     "Lab Prescription",
            #                     RADIOLOGYTEST.name,
            #                     {
            #                         "assigned_lab_test": created_radiology_tests.name,
            #                         "assigned_test": 1,
            #                         "lab_test_created": 1,
            #                     },
            #                     update_modified=False,
            #                 )
            #         except Exception as error:
            #             frappe.log_error(error, "Radiology test creation")
            #         created_radiology_tests = create_lab_test(
            #             patient, RADIOLOGYTEST.lab_test_code, encounter
            #         )
            #         print("RADIOLOGY________:", RADIOLOGYTEST.lab_test_code)

            #         created_tests += RADIOLOGYTEST.lab_test_code + ","

            # Update invoice for insurance patients
            if mode_of_payment == "Insurance":
                created_invoice = get_all_billed_services_and_items(
                    encounter, patient_, workflow_state, next_state, owner
                )

            update_workflow_state_history(encounter, workflow_state, next_state, owner)
            return "Radiology Tests Created Successfully : "

        if next_state == WFStates.PENDING_PROCEDURE and mode_of_payment == "Insurance":
            # create lab tests
            PROCEDURETESTS = get_encounter_procedures(encounter)
            created_tests = ""
            procedure_consumables_list = []
            CURRENT_INVOICED_ITEMS = []

            created_invoice = bill_procedure_and_update_invoice(encounter)

            for PROCEDURETEST in PROCEDURETESTS:
                if PROCEDURETEST.procedure_created != 1:
                    created_lab_test = create_procedure_test(
                        patient, PROCEDURETEST.procedure_name, encounter
                    )
                    if create_lab_test:
                        frappe.db.set_value(
                            "Procedure Prescription",
                            {"parent": encounter},
                            {"procedure_created": 1},
                            update_modified=False,
                        )
                    #         # print("Proceed to procedure____________________________________")
                    PROCEDURE_CONSUMABLES = get_procedure_consumables(
                        PROCEDURETEST.procedure_name
                    )

                    if PROCEDURE_CONSUMABLES:
                        for PROCEDURE_CONSUMABLE in PROCEDURE_CONSUMABLES:
                            procedure_consumable_item = (
                                WorkflowController.create_invoice_item(
                                    PROCEDURE_CONSUMABLE["item_code"],
                                    PROCEDURE_CONSUMABLE["uom"],
                                    PROCEDURE_CONSUMABLE["qty"],
                                    "",
                                    "",
                                    "",
                                    "",
                                    1,
                                )
                            )
                            print(
                                procedure_consumable_item,
                                "PROCCCCCCCCCCCCEEEEEEEE ITEM-----------------------------",
                            )
                            procedure_consumables_list.append(procedure_consumable_item)

                created_tests += PROCEDURETEST.procedure_name

            update_workflow_state_history(encounter, workflow_state, next_state, owner)
            return "Clinical Procedures Created Successfully : " + created_tests

        return "Workflow Updated Successfully"

        # if isCashPayer:

        #     """Get Mpesa Paybill"""
        #     name = frappe.db.get_value(
        #         "Mpesa Settings", {"branch": branch}, ["name"])
        #     mpesa_settings = frappe.get_doc("Mpesa Settings", name)
        #     consumer_key = mpesa_settings.consumer_key
        #     consumer_secret = mpesa_settings.get_password("consumer_secret")
        #     business_shortcode = mpesa_settings.business_shortcode
        #     online_passkey = mpesa_settings.get_password("online_passkey")
        #     callback_url = mpesa_settings.callback_url
        #     mp_callback_url = (
        #         f"""{callback_url}/api/method/gch_custom.services.mp_callback"""
        #     )

        # create invoice


def update_workflow_state_history(
    encounter: str, next_state: str, workflow_state: str, owner: str
):
    """
    Update the workflow state History of the patient
    """
    print("Updating workflow state")
    current_encounter = frappe.get_doc("Patient Encounter", encounter)
    previous_history = frappe.db.exists(
        {
            "doctype": "Patient Encounter Workflow History",
            "patient_encounter": encounter,
        }
    )

    if previous_history:
        last_value = frappe.get_last_doc(
            "Patient Encounter Workflow History", {"patient_encounter": encounter}
        )
        print(last_value.time_out)
        # except:
        #     previous_history = None

    time_in = (
        last_value.time_out
        if previous_history and last_value
        else current_encounter.creation
    )
    time_out = get_datetime()
    duration = time_out - time_in
    duration_str = tools.format_duration(duration)

    # Encounterworkflow history doctype
    # Encounter id | from | to | by | branch | time in | time out | duration

    doc = frappe.get_doc(
        {
            "doctype": "Patient Encounter Workflow History",
            "patient_encounter": encounter,
            "from_state": workflow_state,
            "to_state": next_state,
            "time_in": time_in,
            "time_out": time_out,
            "duration": duration_str,
            "handled_by": owner,
        }
    )
    doc.insert()

    print("Updated workflow state")


@frappe.whitelist(allow_guest=True)
def get_all_billed_services_and_items(
    encounter: str, patient_: str, workflow_state: str, next_state: str, owner: str
):
    """
    Get all billed services and items from the encounter and create invoice

    :param encounter: encounter to be billed
    :param patient: patient associated with encounter
    :param workflow_state: Current workflow state
    :param next_state: Next workflow state
    :param owner: user perfoming the action
    """

    from gch_custom.services.rest import (
        get_encounter_lab_tests,
        get_encounter_prescription,
        get_encounter_procedures,
        get_encounter_radiology_tests,
        get_encounter_vaccinations,
        invoice_encounter_items,
        get_procedure_consumables,
    )

    # Get current encounter

    from gch_custom.overrides.patient_encounter import GCHPatientEncounter

    current_encounter: GCHPatientEncounter = frappe.get_doc(
        "Patient Encounter", encounter
    )

    # print(type(patient_), "================================== Patient \n\n")

    if type(patient_) == str:
        patient_ = frappe.get_doc("Patient", patient_)

    # Reload the encounter to get all billed quantities
    current_encounter.reload()

    ALL_ENCOUNTER_ITEMS = []

    # CHECK IF ENCOUNTER HAS AN INVOICE
    current_invoice = ""
    sales_invoice = WorkflowController.get_encounter_sales_invoice(encounter)

    if sales_invoice:
        current_sales_invoice = frappe.get_doc("Sales Invoice", sales_invoice)

        if current_sales_invoice.docstatus == 1:
            frappe.throw(
                "This encounter has already been invoiced and the invoice submitted. Please create a new encounter"
            )

    warehouse = PrescriptionController.get_user_warehouse()

    # Get clinic consultations item from the clinic

    consultation_fee_item = WorkflowController.get_consulation_item(
        current_encounter.clinic, current_encounter.mode_of_payment
    )
    # get the consultation fee if consultation item exists
    if consultation_fee_item:
        fee = frappe.db.get_value(
            "Item Price",
            {"item_code": consultation_fee_item},
            ["price_list_rate"],
        )
        # Create the consultation fee invoice item
        item = WorkflowController.create_invoice_item(
            consultation_fee_item, "Nos", 1, "", "", "", 1, 0, 1, encounter
        )
        # Store the consultation fee item in ALL_ITEMS_ENCOUNTER list
        ALL_ENCOUNTER_ITEMS.append(item)

    # Get Vaccination items for wellbaby clinic

    # vaccination_amount = 0
    VACCINATIONS = get_encounter_vaccinations(encounter)
    #  if vaccinations present get all vaccination items
    if VACCINATIONS:
        for VACCINATION in VACCINATIONS:
            batch_details = PrescriptionController.get_batches_linked_to_item(
                VACCINATION["drug"]
            )
            batch_no = ""
            # print(
            #     "batch_no---------------------------->",
            #     batch_details,
            #     "Here",
            #     VACCINATION["drug"],
            # )
            if batch_details:
                batch_no = batch_details.batch_no

            # Adding check for batch quantity to stop transaction if stock isn't available
            # if batch_details.qty < 1:
            #     frappe.throw(_("No Stock Available for item " + VACCINATION["drug"]))
            #     return

            # Added check for revaccinations so that they are charged at zero
            # if VACCINATION["vaccine_dispensed"] != 1 and VACCINATION["revaccination"] == 0:
            if VACCINATION["vaccine_dispensed"] != 1 and VACCINATION["revaccination"] == 0:
                vaccination = WorkflowController.create_invoice_item(
                    VACCINATION["drug"],
                    VACCINATION["uom"],
                    int(VACCINATION["quantity"]),
                    "",
                    batch_no,
                    warehouse,
                )
                # vaccination_amount += vaccination["amount"]
                # Store the vaccination item in ALL_ITEMS_ENCOUNTER list
                ALL_ENCOUNTER_ITEMS.append(vaccination)

                # Update vaccines_dispensed on encounter
                if encounter:
                    frappe.db.sql(f"""UPDATE `tabWellbaby Vaccine Details` SET vaccine_dispensed = 1 WHERE parent = '{encounter}' """)
                    frappe.db.commit()
                
            elif VACCINATION["vaccine_dispensed"] != 1 and VACCINATION["revaccination"] == 1:
                vaccination = WorkflowController.create_revaccination_invoice_item(
                    VACCINATION["drug"],
                    VACCINATION["uom"],
                    int(VACCINATION["quantity"]),
                    "",
                    batch_no,
                    warehouse,
                )
                ALL_ENCOUNTER_ITEMS.append(vaccination)

                # Update vaccines_dispensed on encounter
                if encounter:
                    frappe.db.sql(f"""UPDATE `tabWellbaby Vaccine Details` SET vaccine_dispensed = 1 WHERE parent = '{encounter}' """)
                    frappe.db.commit()
                

    # GET Procedure items

    # procedure_amount = 0
    PROCEDURETESTS = get_encounter_procedures(encounter)
    customer_group = (patient_.customer_group,)

    # If procedure tests exists create procedure invoice items
    if PROCEDURETESTS:
        for PROCEDURETEST in PROCEDURETESTS:
            # clinical_template = frappe.get_value(
            #     "Clinical Procedure Template",
            #     {"name": PROCEDURETEST.procedure},
            #     ["item_code"],as_dict=True
            # )
            # if clinical_template:
            #     procedure_test = WorkflowController.create_invoice_item(
            #         clinical_template.item_code, "Nos", 1, "", "", "", 1
            #     )
            #     ALL_ENCOUNTER_ITEMS.append(procedure_test)

            # else:
            #     procedure_test = WorkflowController.create_invoice_item(
            #         clinical_template.item_code, "Nos", 1, "", "", "", 1
            #     )
            #     ALL_ENCOUNTER_ITEMS.append(procedure_test)

            procedure_test = WorkflowController.create_invoice_item(
                PROCEDURETEST.procedure_name, "Nos", 1, "", "", "", 1
            )
            ALL_ENCOUNTER_ITEMS.append(procedure_test)
            if PROCEDURETEST.procedure_created != 1:
                # procedure_amount += procedure_test["amount"]
                # Store the Procedure items in ALL_ITEMS_ENCOUNTER list

                PROCEDURE_CONSUMABLES = get_procedure_consumables(
                    PROCEDURETEST.procedure_name
                )

                if PROCEDURE_CONSUMABLES:
                    for PROCEDURE_CONSUMABLE in PROCEDURE_CONSUMABLES:  
                        batch_details = PrescriptionController.check_if_item_has_batch_and_return_earliest_batch_in(
                            PROCEDURE_CONSUMABLE["item_code"]
                        )
                        batch_no = ""
                        if batch_details:
                            batch_no = batch_details.batch_id
                        item_already_in_invoice = frappe.db.get_list(
                            "Sales Invoice Item",
                            {
                                "parent": sales_invoice,
                                "item_code": PROCEDURE_CONSUMABLE["item_code"],
                            },
                        )
                        # print(item_already_in_invoice,"HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE")
                        if not item_already_in_invoice:
                            procedure_consumable_item = (
                                WorkflowController.create_invoice_item(
                                    PROCEDURE_CONSUMABLE["item_code"],
                                    PROCEDURE_CONSUMABLE["uom"],
                                    PROCEDURE_CONSUMABLE["qty"],
                                    customer_group,
                                    batch_no,
                                    warehouse,
                                    "",
                                    1,
                                )
                            )
                            ALL_ENCOUNTER_ITEMS.append(procedure_consumable_item)
            else:
                PROCEDURE_CONSUMABLES = get_procedure_consumables(
                    PROCEDURETEST.procedure_name
                )

                if PROCEDURE_CONSUMABLES:
                    for PROCEDURE_CONSUMABLE in PROCEDURE_CONSUMABLES:
                        batch_details = PrescriptionController.check_if_item_has_batch_and_return_earliest_batch_in(
                            PROCEDURE_CONSUMABLE["item_code"]
                        )
                        batch_no = ""
                        if batch_details:
                            batch_no = batch_details.batch_id
                        item_already_in_invoice = frappe.db.get_list(
                            "Sales Invoice Item",
                            {
                                "parent": sales_invoice,
                                "item_code": PROCEDURE_CONSUMABLE["item_code"],
                            },
                        )
                        if not item_already_in_invoice:
                            procedure_consumable_item = (
                                WorkflowController.create_invoice_item(
                                    PROCEDURE_CONSUMABLE["item_code"],
                                    PROCEDURE_CONSUMABLE["uom"],
                                    PROCEDURE_CONSUMABLE["qty"],
                                    customer_group,
                                    batch_no,
                                    warehouse,
                                    "",
                                    1,
                                )
                            )
                            ALL_ENCOUNTER_ITEMS.append(procedure_consumable_item)

    RADIOLOGYTESTS = get_encounter_radiology_tests(encounter)
    # If radiology tests exists create radiology invoice items
    if RADIOLOGYTESTS:
        for RADIOLOGYTEST in RADIOLOGYTESTS:
            is_already_on_invoice = frappe.db.get_value(
                "Sales Invoice Item",
                {"parent": sales_invoice, "item_code": RADIOLOGYTEST.lab_test_code},
            )
            if not is_already_on_invoice:
                radiologytest = WorkflowController.create_invoice_item(
                    RADIOLOGYTEST.lab_test_code
                )
                # radiology_amount += radiologytest["amount"]
                # Store the Radiology items in ALL_ITEMS_ENCOUNTER list
                ALL_ENCOUNTER_ITEMS.append(radiologytest)

    # GET Lab items

    # lab_amount = 0
    LABTESTS = get_encounter_lab_tests(encounter)
    # If Labtests exist create Lab invoice items
    if LABTESTS:
        frappe.log_error(LABTESTS,"Payload")
        for LABTEST in LABTESTS:
            lab_code = LABTEST.lab_test_code
            is_already_on_invoice = frappe.db.get_value(
                "Sales Invoice Item", {"parent": sales_invoice, "item_code": lab_code}, as_dict=True
            )
            if is_already_on_invoice:
                pass
            else:              
                labtest = WorkflowController.create_invoice_item(
                    lab_code
                )
            # lab_amount += labtest["amount"]
            # Store the Lab invoice items in ALL_ITEMS_ENCOUNTER list
                if labtest:
                    ALL_ENCOUNTER_ITEMS.append(labtest)

    # GET Prescription items

    # prescription_amount = 0
    customer_group = patient_.customer_group
    # customer_group = "Gertrudes Staff"
    PRESCRIPTIONS = get_encounter_prescription(encounter)
    # If Prescriptions exist create prescription invoice items
    if PRESCRIPTIONS:
        for PRESCRIPTION in PRESCRIPTIONS:
            if PRESCRIPTION["selling_quantity"] is not None:
                if (
                    PRESCRIPTION["dont_issue"] == 0
                    and PRESCRIPTION["dispensed"] == 0
                    and PRESCRIPTION["generic_drug_name"].find("Extemporaneous") == -1
                ):
                    prescription = WorkflowController.create_invoice_item(
                        PRESCRIPTION["medication"],
                        PRESCRIPTION["unit_of_measure"],
                        int(PRESCRIPTION["selling_quantity"]),
                        customer_group,
                        PRESCRIPTION["selected_item_batch"],
                        warehouse,
                    )
                    # prescription_amount += prescription["amount"]
                    # Store the Lab invoice items in ALL_ITEMS_ENCOUNTER list
                    ALL_ENCOUNTER_ITEMS.append(prescription)
                elif (
                    PRESCRIPTION["dont_issue"] == 0
                    and PRESCRIPTION["dispensed"] == 0
                    and PRESCRIPTION["generic_drug_name"].find("Extemporaneous") != -1
                ):
                    prescription = WorkflowController.create_invoice_item(
                        PRESCRIPTION["medication"],
                        PRESCRIPTION["unit_of_measure"],
                        int(PRESCRIPTION["selling_quantity"]),
                        customer_group,
                        PRESCRIPTION["selected_item_batch"],
                        warehouse,
                        1,
                    )
                    # prescription_amount += prescription["amount"]
                    # Store the Lab invoice items in ALL_ITEMS_ENCOUNTER list
                    ALL_ENCOUNTER_ITEMS.append(prescription)

    # If sales invoice already exists Check for children in sales invoice item and delete all
    if sales_invoice:
        sales_invoice_items = frappe.db.get_list(
            "Sales Invoice Item", {"parent": sales_invoice, "dispensed": 0}
        )
        if sales_invoice_items:
            frappe.db.delete(
                "Sales Invoice Item",
                {"parent": sales_invoice, "dispensed": 0, "from_procedure": 0},
            )
            # frappe.reorder("Sales Invoice Item", sales_invoice)
            frappe.db.commit()
        # Set sales_invoice to current invoice
        current_invoice = sales_invoice

    # Create Invoice with updated items
    CURRENT_INVOICED_ITEMS = []
    created_invoice = invoice_encounter_items(
        patient_,
        ALL_ENCOUNTER_ITEMS,
        encounter,
        current_invoice,
        CURRENT_INVOICED_ITEMS,
        current_encounter.mode_of_payment,
    )
    PrescriptionController.reduce_stock_dispensed(encounter)
    update_workflow_state_history(encounter, workflow_state, next_state, owner)
    return created_invoice


@frappe.whitelist(allow_guest=True)
def bill_consultation(encounter: str, patient_: object):
    """
    Bill Encounter consultation
    """

    from gch_custom.services.rest import invoice_encounter_items
    from gch_custom.overrides.patient_encounter import GCHPatientEncounter

    ALL_ENCOUNTER_ITEMS = []

    # CHECK IF ENCOUNTER HAS AN INVOICE
    current_invoice = ""
    sales_invoice = WorkflowController.get_encounter_sales_invoice(encounter)
    if sales_invoice:
        current_invoice = sales_invoice

    current_encounter: GCHPatientEncounter = frappe.get_doc(
        "Patient Encounter", encounter
    )

    consultation_fee_item = WorkflowController.get_consulation_item(
        current_encounter.clinic, current_encounter.mode_of_payment
    )

    # get the consultation fee if consultation item exists
    if consultation_fee_item:
        fee = frappe.db.get_value(
            "Item Price",
            {"item_code": consultation_fee_item},
            ["price_list_rate"],
        )
        # Create the consultation fee invoice item
        item = WorkflowController.create_invoice_item(
            consultation_fee_item, "Nos", 1, "", "", "", 1, 0, 1, encounter
        )
        # Store the consultation fee item in ALL_ITEMS_ENCOUNTER list
        ALL_ENCOUNTER_ITEMS.append(item)

    CURRENT_INVOICED_ITEMS = []

    created_invoice = invoice_encounter_items(
        patient_,
        ALL_ENCOUNTER_ITEMS,
        encounter,
        current_invoice,
        CURRENT_INVOICED_ITEMS,
        current_encounter.mode_of_payment,
    )

    return created_invoice


@frappe.whitelist(allow_guest=True)
def bill_procedure_and_update_invoice(encounter: str):
    """
    Use Current encounter to bill procedures both procedure consumables and the procedure service as well
    """

    from gch_custom.services.rest import (
        invoice_encounter_items,
        get_encounter_procedures,
        get_procedure_consumables,
    )
    from gch_custom.overrides.patient_encounter import GCHPatientEncounter

    current_encounter: GCHPatientEncounter = frappe.get_doc(
        "Patient Encounter", encounter
    )
    patient = current_encounter.patient
    patient_ = frappe.get_doc("Patient", patient)

    ALL_ENCOUNTER_ITEMS = []

    warehouse = PrescriptionController.get_user_warehouse()
    PROCEDURETESTS = get_encounter_procedures(encounter)
    customer_group = (patient_.customer_group,)

    # CHECK IF ENCOUNTER HAS AN INVOICE
    current_invoice = ""
    sales_invoice = WorkflowController.get_encounter_sales_invoice(encounter)
    if sales_invoice:
        current_invoice = sales_invoice

    if PROCEDURETESTS:
        for PROCEDURE in PROCEDURETESTS:
            if PROCEDURE.procedure_created != 1:
                PROCEDURE_CONSUMABLES = get_procedure_consumables(
                    PROCEDURE.procedure_name
                )
                print(
                    "Got Hereeeeeeeeeee------------------------------------------------------------------------------------------------------------",
                    PROCEDURE_CONSUMABLES,
                )
                re
                # Use procedure name to get procedure template and ultimately the item code

                # clinical_template = frappe.get_value(
                #     "Clinical Procedure Template",
                #     {"name": PROCEDURE.procedure},
                #     ["item_code"],as_dict=True
                # )
                # if clinical_template:
                #     procedure_test = WorkflowController.create_invoice_item(
                #         PROCEDURE.procedure_name, "Nos", 1, "", "", "", 1
                #     )
                #     ALL_ENCOUNTER_ITEMS.append(procedure_test)

                # else:
                procedure_test = WorkflowController.create_invoice_item(
                    PROCEDURE.procedure_name, "Nos", 1, "", "", "", 1
                )
                ALL_ENCOUNTER_ITEMS.append(procedure_test)

                # procedure_test = WorkflowController.create_invoice_item(
                #     PROCEDURE.procedure_name, "Nos", 1, "", "", "", 1
                # )
                # ALL_ENCOUNTER_ITEMS.append(procedure_test)

                if PROCEDURE_CONSUMABLES:
                    for CONSUMABLE in PROCEDURE_CONSUMABLES:
                        batch_details = PrescriptionController.check_if_item_has_batch_and_return_earliest_batch_in(
                            CONSUMABLE["item_code"]
                        )
                        batch_no = ""

                        if batch_details:
                            batch_no = batch_details.batch_id
                        item_already_in_invoice = frappe.db.get_list(
                            "Sales Invoice Item",
                            {
                                "parent": sales_invoice,
                                "item_code": CONSUMABLE["item_code"],
                            },
                        )

                        if not item_already_in_invoice:
                            procedure_consumable_item = (
                                WorkflowController.create_invoice_item(
                                    CONSUMABLE["item_code"],
                                    CONSUMABLE["uom"],
                                    CONSUMABLE["qty"],
                                    customer_group,
                                    batch_no,
                                    warehouse,
                                    "",
                                    1,
                                )
                            )
                            ALL_ENCOUNTER_ITEMS.append(procedure_consumable_item)
    CURRENT_INVOICED_ITEMS = []

    created_invoice = invoice_encounter_items(
        patient_,
        ALL_ENCOUNTER_ITEMS,
        encounter,
        current_invoice,
        CURRENT_INVOICED_ITEMS,
        current_encounter.mode_of_payment,
    )

    return created_invoice


@frappe.whitelist(allow_guest=True)
def bill_labs_and_update_invoice(encounter: str):
    """
    Use encounter number to get and bill all labs in the encounter
    """
    from gch_custom.services.rest import (
        get_encounter_lab_tests,
        invoice_encounter_items,
    )
    from gch_custom.overrides.patient_encounter import GCHPatientEncounter

    current_encounter: GCHPatientEncounter = frappe.get_doc(
        "Patient Encounter", encounter
    )

    # CHECK IF ENCOUNTER HAS AN INVOICE
    current_invoice = ""
    sales_invoice = WorkflowController.get_encounter_sales_invoice(encounter)
    if sales_invoice:
        current_invoice = sales_invoice

    patient = current_encounter.patient
    patient_ = frappe.get_doc("Patient", patient)

    ALL_ENCOUNTER_ITEMS = []

    LABTESTS = get_encounter_lab_tests(encounter)

    for LABTEST in LABTESTS:
        labtest=create_invoice_item(LABTEST.lab_test_code)
        # if LABTEST.assigned_test != 1:
        #     lab_code = LABTEST.lab_test_code
        #     labtest = WorkflowController.create_invoice_item(
        #         lab_code, "Nos", 1, "", "", "", 1, 1
        #     )
        frappe.log_error("Title","Got Here!!!!!")
        ALL_ENCOUNTER_ITEMS.append(labtest)

    CURRENT_INVOICED_ITEMS = []

    created_invoice = invoice_encounter_items(
        patient_,
        ALL_ENCOUNTER_ITEMS,
        encounter,
        current_invoice,
        CURRENT_INVOICED_ITEMS,
        current_encounter.mode_of_payment,
    )

    return created_invoice


@frappe.whitelist(allow_guest=True)
def bill_radiology_and_update_invoice(encounter: str):
    """
    Use encounter to bill radiology and update invoice
    """
    from gch_custom.services.rest import (
        get_encounter_radiology_tests,
        invoice_encounter_items,
    )
    from gch_custom.overrides.patient_encounter import GCHPatientEncounter

    current_encounter: GCHPatientEncounter = frappe.get_doc(
        "Patient Encounter", encounter
    )

    # CHECK IF ENCOUNTER HAS AN INVOICE
    current_invoice = ""
    sales_invoice = WorkflowController.get_encounter_sales_invoice(encounter)
    if sales_invoice:
        current_invoice = sales_invoice

    patient = current_encounter.patient
    patient_ = frappe.get_doc("Patient", patient)

    ALL_ITEMS_ENCOUNTER = []
    CURRENT_INVOICED_ITEMS = []

    RADIOLOGYTESTS = get_encounter_radiology_tests(encounter)
    for RADIOLOGYTEST in RADIOLOGYTESTS:
        radiologytest = WorkflowController.create_invoice_item(
            RADIOLOGYTEST.lab_test_code, "Nos", 1, "", "", "", 1, 1
        )
        ALL_ITEMS_ENCOUNTER.append(radiologytest)
    created_invoice = invoice_encounter_items(
        patient_,
        ALL_ITEMS_ENCOUNTER,
        encounter,
        current_invoice,
        CURRENT_INVOICED_ITEMS,
        current_encounter.mode_of_payment,
    )

    return created_invoice


@frappe.whitelist(allow_guest=True)
def bill_prescriptions_and_update_invoice(encounter: str):
    """
    Use the encounter number to bill all prescriptions and update invoice
    """
    from gch_custom.services.rest import (
        get_encounter_prescription,
        invoice_encounter_items,
    )
    from gch_custom.overrides.patient_encounter import GCHPatientEncounter

    current_encounter: GCHPatientEncounter = frappe.get_doc(
        "Patient Encounter", encounter
    )

    # CHECK IF ENCOUNTER HAS AN INVOICE
    current_invoice = ""
    sales_invoice = WorkflowController.get_encounter_sales_invoice(encounter)
    if sales_invoice:
        current_invoice = sales_invoice

    patient = current_encounter.patient
    patient_ = frappe.get_doc("Patient", patient)

    customer_group = patient_.customer_group

    ALL_ITEMS_ENCOUNTER = []
    CURRENT_INVOICED_ITEMS = []

    PRESCRIPTIONS = get_encounter_prescription(encounter)

    for PRESCRIPTION in PRESCRIPTIONS:
        if PRESCRIPTION["selling_quantity"] is not None:
            if (
                PRESCRIPTION["dont_issue"] == 0
                and PRESCRIPTION["dispensed"] == 0
                and PRESCRIPTION["generic_drug_name"].find("Extemporaneous") == -1
            ):
                prescription = WorkflowController.create_invoice_item(
                    PRESCRIPTION["medication"],
                    PRESCRIPTION["unit_of_measure"],
                    int(PRESCRIPTION["selling_quantity"]),
                    customer_group,
                    PRESCRIPTION["selected_item_batch"],
                    warehouse
                )
                ALL_ITEMS_ENCOUNTER.append(prescription)
            elif (
                PRESCRIPTION["dont_issue"] == 0
                and PRESCRIPTION["dispensed"] == 0
                and PRESCRIPTION["generic_drug_name"].find("Extemporaneous") != -1
            ):
                prescription = WorkflowController.create_invoice_item(
                    PRESCRIPTION["medication"],
                    PRESCRIPTION["unit_of_measure"],
                    int(PRESCRIPTION["selling_quantity"]),
                    customer_group,
                    PRESCRIPTION["selected_item_batch"],
                    warehouse,
                    1,
                )
                ALL_ITEMS_ENCOUNTER.append(prescription)

    created_invoice = invoice_encounter_items(
        patient_,
        ALL_ITEMS_ENCOUNTER,
        encounter,
        current_invoice,
        CURRENT_INVOICED_ITEMS,
        current_encounter.mode_of_payment,
    )

    return created_invoice


@frappe.whitelist(allow_guest=True)
def create_templates_for_all_prescribed_tests(encounter: str, patient: str):
    """
    Use encounter number to get all prescriped services(Lab, Procedure and radiology) and generate templates for the tests
    """
    from gch_custom.utils.labware.main import send_to_labware
    from gch_custom.utils.pacs import send_to_pacs
    from gch_custom.services.rest import (
        get_encounter_radiology_tests,
        create_lab_test,
        create_pacs_test,
        get_encounter_procedures,
        create_procedure_test,
        get_procedure_consumables,
    )

    from gch_custom.overrides.patient_encounter import GCHPatientEncounter

    current_encounter: GCHPatientEncounter = frappe.get_doc(
        "Patient Encounter", encounter
    )

    # create radiology templates
    # radiology_tests = frappe.db.get_list(        
    #     "Radiology Prescriptions",
    #     filters={"parent": encounter, "parentfield": "radiology_details"},
    #     fields=[
    #         "name",
    #         "lab_test_code",
    #         "lab_test_name",
    #     ],
    # )
    created_tests = ""
    # if radiology_tests:
    #     for rad_test in radiology_tests:
    #         if rad_test.assigned_test !=1:
    #             try:
    #                 created_radiology_tests = create_lab_test(
    #                     patient, rad_test.lab_test_code, encounter,rad_test.name
    #                 )
    #                 if created_radiology_tests:
    #                     frappe.db.set_value(
    #                         "Radiology Prescriptions",
    #                         rad_test.name,
    #                         {
    #                             "assigned_lab_test": created_radiology_tests.name,
    #                             "assigned_test": 1,
    #                             "lab_test_created": 1,
    #                         },
    #                         update_modified=False,
    #                     )
    #             except Exception as error:
    #                 frappe.log_error(error, "Radiology test creation")

    if current_encounter.mode_of_payment != "cash":
        current_encounter.reload()
        send_to_pacs(current_encounter.name)
    # Create lab tests templates
    lab_prescriptions = frappe.db.get_list(
        "Lab Prescription",
        filters={"parent": encounter, "parentfield": "lab_test_prescription"},
        fields=[
            "name",
            "lab_test_code",
            "lab_test_name",
            "assigned_test",
            "assigned_lab_test",
        ],
    )
    if lab_prescriptions:
        for lab_prescription in lab_prescriptions:
            lab_presc = frappe.get_doc("Lab Prescription", lab_prescription.name)
            if lab_presc.assigned_test != 1:
                try:
                    created_lab_test = create_lab_test(
                        patient,
                        lab_presc.lab_test_code,
                        encounter,
                        lab_prescription=lab_presc.name,
                    )
                    if created_lab_test:
                        frappe.db.set_value(
                            "Lab Prescription",
                            lab_prescription.name,
                            {
                                "assigned_lab_test": created_lab_test.name,
                                "assigned_test": 1,
                                "lab_test_created": 1,
                            },
                            update_modified=False,
                        )
                except Exception as error:
                    frappe.log_error(error, "Lab Test Creation Error")

        if current_encounter.mode_of_payment != "cash":
            current_encounter.reload()
            send_to_labware(current_encounter)

    # create Procedure templates
    procedure_consumables_list = []
    PROCEDURETESTS = get_encounter_procedures(encounter)
    if PROCEDURETESTS:
        for PROCEDURETEST in PROCEDURETESTS:
            if PROCEDURETEST.procedure_created != 1:
                created_lab_test = create_procedure_test(
                    patient, PROCEDURETEST.procedure_name, encounter
                )
                if create_lab_test:
                    frappe.db.set_value(
                        "Procedure Prescription",
                        {"parent": encounter},
                        {"procedure_created": 1},
                        update_modified=False,
                    )
                PROCEDURE_CONSUMABLES = get_procedure_consumables(
                    PROCEDURETEST.procedure_name
                )

                if PROCEDURE_CONSUMABLES:
                    for PROCEDURE_CONSUMABLE in PROCEDURE_CONSUMABLES:
                        # add procedure consumables to the clinical procedure
                        consumable = frappe.new_doc("Clinical Procedure Item")
                        consumable.item_code = PROCEDURE_CONSUMABLE.item_code
                        consumable.item_name = PROCEDURE_CONSUMABLE.item_name
                        consumable.qty = PROCEDURE_CONSUMABLE.qty
                        consumable.uom = PROCEDURE_CONSUMABLE.uom
                        consumable.stock_uom = PROCEDURE_CONSUMABLE.stock_uom
                        consumable.invoice_separately_as_consumables = 0
                        created_lab_test.append("items", consumable)

                    created_lab_test.save(ignore_permissions=True)
                    # return created_lab_test

            created_tests += PROCEDURETEST.procedure_name

    return "Test Templates created successfuly : " + created_tests


