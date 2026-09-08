import frappe
from frappe import msgprint, _
from .mtiba import Mtiba
from gch_custom.services.erp_smart import create_payment_entry


class ErpMTibaController:
    # NEW Mtiba API
    # fetch_visit
    # bill_visit
    # add_payments_to_visit
    # add_medical_details_to_visit
    # close_visit

    @frappe.whitelist(allow_guest=True)
    def fetch_visit(visit_code: str):
        try:
            mtiba = initiate_mtiba()
            visit = mtiba.fetch_visit(visit_code=visit_code)
            # TODO: do something with the visit information
            return {
                "code": 200,
                "message": "INFO: Visit Fetched Successfully",
            }
        except Exception as e:
            return {"code": 500, "message": e}

    @frappe.whitelist(allow_guest=True)
    def bill_visit(visit_code: str, current_invoice, current_encounter):
        try:
            #             [
            #   {
            #     "externalInvoiceNumber": "INV001",
            #     "items": [
            #       {
            #         "productCode": "PROD001",
            #         "description": "PROO-DESC",
            #         "quantity": 2,
            #         "price": 123.45,
            #         "reservationAmount": 123.45
            #       }
            #     ]
            #   }
            # ]

            invoice_items = current_invoice.items

            payload_items = []

            for item in invoice_items:
                payload_items.append(
                    {
                        "productCode": item.item_code,
                        "description": item.description,
                        "quantity": item.qty,
                        "price": item.rate,
                        "reservationAmount": item.rate * item.qty,
                    }
                )

            payload = [
                {
                    "externalInvoiceNumber": current_invoice.name,
                    "items": payload_items,
                }
            ]
            mtiba = initiate_mtiba()
            bill_response = mtiba.bill_visit(visit_code=visit_code, data=payload)

            # TODO: do something with the bill_response information

            return {
                "code": 200,
                "message": "INFO: Visit Billed Successfully",
            }

        except Exception as e:
            return {"code": 500, "message": e}

    @frappe.whitelist(allow_guest=True)
    def add_payments_to_visit(visit_code: str, current_invoice, current_encounter):
        #         [
        #   {
        #     "type": "CASH",
        #     "amount": 46.00
        #   },
        #    {
        #     "type": "BENEFIT",
        #     "amount": 200.90
        #   }
        # ]
        #         {
        #     "docstatus": 0,
        #     "doctype": "Mtiba Payment",
        #     "name": "new-mtiba-payment-2",
        #     "__islocal": 1,
        #     "__unsaved": 1,
        #     "owner": "Administrator",
        #     "visit_code": "asdasd",
        #     "current_invoice": "172302000001",
        #     "current_encounter": "HLC-ENC-2022-00011",
        #     "cash": 10,
        #     "benefit": 10
        # }
        try:
            grand_total = current_invoice.grand_total
            cash = 0
            current_invoice_advance_payments = current_invoice.advances
            for advance in current_invoice_advance_payments:
                if advance["reference_type"] == "Payment Entry":
                    cash += advance["allocated_amount"]

            payload = [
                {"type": "CASH", "amount": cash},
                {
                    "type": "BENEFIT",
                    "amount": grand_total - cash,
                },
            ]
            # Mtiba Payment
            mtiba_payment_exists = frappe.db.exists("Mtiba Payment", visit_code)

            if mtiba_payment_exists:
                raise Exception("ERROR: Mtiba Payment Already Exists")

            mtiba = initiate_mtiba()
            payment_response = mtiba.add_payments_to_visit(
                visit_code=visit_code, data=payload
            )

            encounter_key = "current_encounter"

            if "INP" in current_encounter.name:
                encounter_key = "current_inpatient_record"

            doc = frappe.get_doc(
                {
                    "doctype": "Mtiba Payment",
                    "visit_code": visit_code,
                    "current_invoice": current_invoice.name,
                    #"current_encounter": current_encounter.name,
                    "cash": cash,
                    "benefit": grand_total - cash,
                }
            )
            setattr(doc, encounter_key, current_encounter.name)
            doc.insert()

            return {
                "code": 200,
                "message": "INFO: Visit Payments Added Successfully",
            }

        except Exception as e:
            return {"code": 500, "message": e}

    @frappe.whitelist(allow_guest=True)
    def add_medical_details_to_visit(
        visit_code: str, current_encounter, current_invoice
    ):
        #         {
        #   "doctorsNotes": "string",
        #   "diagnosis": [
        #     {
        #       "code": "string"
        #     }
        #   ]
        # }
        try:
            current_encounter_diagnosis = current_encounter.diagnosis_table

            if not current_encounter_diagnosis:
                raise Exception("ERROR: No Diagnosis Found")

            payload_diagnosis = []
            for diagnosis in current_encounter_diagnosis:
                payload_diagnosis.append({"code": diagnosis.code})
            payload = {
                "doctorsNotes": "Doctors Notes Pending",
                "diagnosis": payload_diagnosis,
            }
            mtiba = initiate_mtiba()
            medical_details_response = mtiba.add_medical_details_to_visit(
                visit_code=visit_code, data=payload
            )
            return {
                "code": 200,
                "message": "INFO: Visit Medical Details Added Successfully",
            }
        except Exception as e:
            return {"code": 500, "message": e}

    @frappe.whitelist(allow_guest=True)
    def close_visit(visit_code: str, current_invoice, current_encounter):
        try:
            mtiba = initiate_mtiba()
            close_visit_response = mtiba.close_visit(visit_code=visit_code)
            # def create_payment_entry(amount, ref, invoiced_customer):

            mtiba_payment_exists = frappe.db.exists("Mtiba Payment", visit_code)

            if not mtiba_payment_exists:
                raise Exception("ERROR: Mtiba Payment Does Not Exists")

            mtiba_payment = frappe.get_doc("Mtiba Payment", visit_code)

            payment_entry = create_payment_entry(
                mtiba_payment.benefit,
                f"Mtiba Payment for visit: {visit_code}",
                current_invoice.patient,
            )
            frappe.log_error(
                {"payment_entry": payment_entry}, "MTIBA PAYMENT ENTRY /erp_mtiba.py"
            )

            return {
                "code": 200,
                "message": "INFO: Visit Closed Successfully",
            }
        except Exception as e:
            return {"code": 500, "message": e}


class InvalidParametersErrors(Exception):
    pass


# =====================================================================================================================================================


class ResourceNotFoundErrors(Exception):
    pass


# =====================================================================================================================================================


@frappe.whitelist(allow_guest=True)
def create_mtiba_request(sales_invoice: str, patient_encoutner: str, data):
    mtiba_request = frappe.new_doc("Mtiba Request")
    mtiba_request.patient_encounter = patient_encoutner
    mtiba_request.sales_invoice = sales_invoice
    mtiba_request.treatment_code = data["treatmentCode"]
    mtiba_request.external_treatment_code = data["externalTreatmentCode"]
    mtiba_request.notes = data["notes"]

    # items
    for item in data["items"]:
        formatedItem = {
            "scheme": item["scheme"],
            "code": item["code"],
            "external_code": item["externalCode"],
            "description": item["description"],
            "currency": item["price"]["currency"],
            "quantity": item["quantity"],
            "amount": item["price"]["amount"],
            "status": item["status"],
            "item_code": item["itemCode"],
        }
        mtiba_request.append("items", formatedItem)

    # diagnosis
    for item in data["diagnosis"]:
        mtiba_request.append("diagnosis", item)

    mtiba_request.save()

    return mtiba_request


# Helpers


def get_bulk_invoice_items(invoice_name: str):
    invoiced_items = []
    invoice_item_list = frappe.db.get_list(
        "Sales Invoice Item",
        filters={"parent": invoice_name},
        fields=["item_code", "amount", "qty", "rate", "item_group", "description"],
    )

    for item in invoice_item_list:
        print(
            "# ====================================================================================================================================================="
        )
        print(
            "qty",
            item.qty,
            "amount",
            item.rate,
            "total",
            float(item.rate) * float(item.qty),
        )
        print(
            "# ====================================================================================================================================================="
        )
        invoiced_items.append(
            {
                "code": item.item_code,
                "description": item.description,
                "price": {"currency": "KES", "amount": item.rate},
                "quantity": item.qty,
                "category": item.item_group,
                "status": "SUBMITTED",
                "externalCode": item.item_code,
                "reservationAmount": {
                    "currency": "KES",
                    "amount": float(item.rate) * float(item.qty),
                },
            }
        )
    return invoiced_items


# =====================================================================================================================================================


def get_invoice_items(invoice_name: str):
    try:
        invoiced_items = []
        invoice_item_list = frappe.db.get_list(
            "Sales Invoice Item",
            filters={"parent": invoice_name},
            fields=["item_code", "amount", "qty", "rate", "item_group", "description"],
        )

        for item in invoice_item_list:
            item_dets = frappe.get_doc("Item", item.item_code)
            invoiced_items.append(
                {
                    "scheme": "SCM123",
                    "code": item.item_code,
                    "description": item_dets.display_name,
                    "price": {"currency": "KES", "amount": item.rate},
                    "quantity": item.qty,
                    "category": item_dets.item_group if item_dets.item_group else "Uncategorised",
                    "status": "SUBMITTED",
                    "externalCode": item.item_code,
                    "itemCode": item.item_code,
                }
            )
        return invoiced_items
    except Exception as e:
        frappe.log_error(e, "Error Getting Invoice Items")
        return {"code": 500, "message": str(e)}


# =====================================================================================================================================================


def get_invoice_diagnosis(encounter_name: str):
    invoice_diagnosis = []
    diagnosis_list = frappe.db.get_list(
        "Codification Table",
        filters={"parent": encounter_name},
        fields=["medical_code", "code", "description"],
    )
    for item in diagnosis_list:
        invoice_diagnosis.append(
            {
                "scheme": item.medical_code,
                "code": item.code,
                "description": item.description,
            }
        )
    return invoice_diagnosis


# =====================================================================================================================================================


def get_invoice_payments():
    invoice_payments = []
    # {
    # "type": "Benefit",
    # "total": {
    # "currency": "KES",
    # "amount": 1700
    # }
    # },
    # {
    # "type": "Cash",
    # "total": {
    # "currency": "KES",
    # "amount": 1000
    # }
    # }
    return invoice_payments


# =====================================================================================================================================================


def initiate_mtiba() -> Mtiba:
    """Initiate Mtiba"""
    mtiba_configs = get_mtiba_configs()
    mtiba = Mtiba(mtiba_configs[0], mtiba_configs[1], mtiba_configs[2])
    return mtiba


# =====================================================================================================================================================


def get_mtiba_configs():
    """Get Mtiba Settings"""

    mtiba_setting = frappe.get_doc("Mtiba Setting", "Development")
    username = mtiba_setting.username
    password = mtiba_setting.get_password("password")
    base_url = mtiba_setting.base_url
    frappe.log_error(
        {"mtiba_settings": [username, password, base_url]},
        "MTIBA SETTINGS  /erp_mtiba.py",
    )
    return [username, password, base_url]


# =====================================================================================================================================================


@frappe.whitelist(allow_guest=True)
def create_mtiba_reserve_items_doc(treatmentCode, payload):
    try:
        externalInvoiceNumber = payload["externalInvoiceNumber"]
        invoiceItems = payload["invoiceItems"]

        dateCreated = payload["dateCreated"]

        mtiba_reserve_items_doc_exists = frappe.db.exists(
            "Mtiba Bulk Reserve", externalInvoiceNumber
        )

        if mtiba_reserve_items_doc_exists:
            """
            check is the was a previous submission to compare the previously submitted items match the current
            """
            cur_mtiba_reserve_items_doc = frappe.get_doc(
                "Mtiba Bulk Reserve", externalInvoiceNumber
            )

            return cur_mtiba_reserve_items_doc

        doc = frappe.get_doc(
            {
                "doctype": "Mtiba Bulk Reserve",
                "invoice": externalInvoiceNumber,
                "treatmentcode": treatmentCode,
                "externalinvoicenumber": externalInvoiceNumber,
                "datecreated": dateCreated,
            }
        )

        for item in invoiceItems:
            doc.append(
                "invoiceitems",
                {
                    "code": item["code"],
                    "description": item["description"],
                    "category": item["category"],
                    "quantity": item["quantity"],
                    "status": item["status"],
                    "external_code": item["externalCode"],
                    "price_currency": item["price"]["currency"],
                    "price_amount": item["price"]["amount"],
                    "reservation_amount": item["reservationAmount"]["amount"],
                    "reservation_currency": item["reservationAmount"]["currency"],
                },
            )
        doc.insert()

        return doc

    except Exception as e:
        frappe.log_error(e, "MTIBA RESERVE DOCUMENT CREATION ERROR  /erp_mtiba.py")
        return False


def get_advance_payment_list(sales_invoice: str):
    """
    Get all Advance Payment List given the sales invoice

    """
    try:
        formated_advance_payment_list = []
        advance_payments = frappe.db.get_list(
            "Sales Invoice Advance",
            filters={"parent": sales_invoice, "parentfield": "advances"},
            fields=[
                "name",
                "remarks",
                "allocated_amount",
                "reference_name",
                "reference_type",
            ],
        )
        for advance_payment in advance_payments:
            payment_entry = frappe.get_doc(
                advance_payment["reference_type"], advance_payment["reference_name"]
            )
            trans_type = "Cash"
            if payment_entry.mode_of_payment == "Insurance":
                trans_type = "Benefit"

            formated_advance_payment_list.append(
                {
                    "remarks": advance_payment["remarks"],
                    "amount": advance_payment["allocated_amount"],
                    "name": payment_entry.name,
                    "reference_no": payment_entry.reference_no,
                    "mode_of_payment": payment_entry.mode_of_payment,
                    "currency": payment_entry.paid_from_account_currency,
                    "type": trans_type,
                }
            )

        return formated_advance_payment_list
    except Exception as e:
        frappe.log_error(e, "GET ADVANCES /erp_mtiba.py")
        return e
        return []
