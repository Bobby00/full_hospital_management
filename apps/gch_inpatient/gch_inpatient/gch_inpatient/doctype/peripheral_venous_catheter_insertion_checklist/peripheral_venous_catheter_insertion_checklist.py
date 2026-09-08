# Copyright (c) 2023, Redward and contributors
# For license information, please see license.txt

import frappe
import sys

from frappe.model.document import Document

from gch_custom.services.workflow_controller import WorkflowController

class PERIPHERALVENOUSCATHETERINSERTIONCHECKLIST(Document):
	pass


def invoice_encounter_items(
    patient,
    invoiced_items,
    encounter,
    invoice,
    current_invoiced_items,
    mode_of_payment="Cash",
    type="Outpatient",
):
    try:
        from gch_custom.overrides.patient_encounter import GCHPatientEncounter

        if not type:
            current_encounter: GCHPatientEncounter = frappe.get_doc(
                    "Patient Encounter", encounter
                )
        elif type:
            current_encounter = frappe.get_doc(
                    "Inpatient Record", encounter
                )

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
            invoice.encounter = encounter
            invoice.mode_of_payment = mode_of_payment
            # invoice.ref_practitioner = current_encounter.practitioner_name
            invoice.branch = current_encounter.branch

            # add naming series based on branch

            current_branch = frappe.get_doc("Branch", current_encounter.branch)

            naming_series = "22.YY.MM.######"

            if current_branch.invoice_naming_series:
                naming_series = current_branch.invoice_naming_series

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
                frappe.log_error(e, "Save new invoice  /rest.py line 2610")
                return {"name": e}

        invoice = frappe.get_doc("Sales Invoice", invoice)

        for item in invoiced_items:
            if item["item_code"] not in _current_invoiced_items:
                print(
                    "******************************break****************************************"
                )
                print(item["item_code"])
                invoice.append("items", item)
                print(
                    "******************************break****************************************"
                )
            if item["item_code"] in _current_invoiced_items:
                _current_invoiced_items.remove(item["item_code"])

        invoice.save()
        # invoice.submit()
        return invoice
    except Exception as e:
        frappe.log_error(e, "Save invoice  /rest.py")
        return {"name": e}
    


@frappe.whitelist(allow_guest=True)
def invoice_procedure_consumables(encounter: str="", procedure: str=""):
    """Get all consumables used in a procedure"""
    try:
    
        invoice = ""
        patient=""

        CURRENT_INVOICED_ITEMS = []
        ALL_CONSUMABLES = []

        procedure_done =  frappe.get_doc("PERIPHERAL VENOUS CATHETER INSERTION CHECKLIST", procedure)
        

        if procedure_done.is_inpatient:
            encounter = procedure_done.inpatient_record
            current_encounter = frappe.get_doc("Inpatient Record", encounter)
            invoice = current_encounter.sales_invoice
            patient = current_encounter.patient

            user_station = frappe.db.get_list(
                "Practitioner Station Entry",
                filters={"user": frappe.session.user},
                fields=[
                    "station",
                ],
            )
            billed_from = user_station[0].station

            procedure_test_item = WorkflowController.create_invoice_item(
                "PERIPHERAL VENOUS CATHETER INSERTION",
                "Nos",
                1,
                "",
                "",
                "",
                1,
                0,
                0,
                "",
                billed_from
            )
            ALL_CONSUMABLES.append(procedure_test_item)

            print("\n\n\n\n\n", ALL_CONSUMABLES)
            print("\n\n\n\n\n", encounter, current_encounter, invoice, patient, "IIIIIIIIIIIIIIIISSSSSSSSSSSS", "\n\n\n\n\n")


        elif not procedure_done.is_inpatient:
            encounter = procedure_done.patient_encounter
            current_encounter = frappe.get_doc("Patient Encounter", encounter)
            patient = current_encounter.patient
            invoice= current_encounter.sales_invoice
            
        if encounter=="":
            frappe.log_error("INFO: Calling invoice consumbles without encounter or inpatient record", "billing consumables /central_line_insertion_checklist.py")
            return  
        
        all_consumed_items = frappe.db.get_list(
                "Clinical Procedure Item",
                {"parent": procedure, "invoice_separately_as_consumables": 1},
                ["name", "item_code", "qty", "uom", "batch_no"],
            )
        
        print("\n\n\n\n\n", "ALL CONSUMED ITEMS", all_consumed_items, "\n\n\n\n\n")
        
        if patient == "":
            frappe.log_error("INFO: Calling invoice consumbles without patient", "billing consumables /rest.py")
            return
        
        patient_ = frappe.get_doc("Patient", patient)
        customer_group = patient_.customer_group

        user_station = frappe.db.get_list(
                "Practitioner Station Entry",
                filters={"user": frappe.session.user},
                fields=[
                    "station",
                ],
            )
        billed_from = user_station[0].station
            
        if all_consumed_items:
            for consumable in all_consumed_items:
                item = WorkflowController.create_invoice_item(
                    consumable["item_code"],
                    consumable["uom"],
                    consumable["qty"],
                    customer_group,
                    consumable["batch_no"],
                    "",
                    0,
                    0,
                    0,
                    "",
                    billed_from
                )
                ALL_CONSUMABLES.append(item)
        # Create the invoice

        created_invoice = invoice_encounter_items(
            patient_, ALL_CONSUMABLES, encounter, invoice, CURRENT_INVOICED_ITEMS,"", procedure_done.is_inpatient
        )

        return "Invoice Updated Successfully : " + created_invoice.name   
    except Exception as e:
        frappe.log_error(e, "REST ERROR invoicing procedure  /rest.py")
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return []