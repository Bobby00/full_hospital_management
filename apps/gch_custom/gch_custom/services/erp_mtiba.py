import frappe
from frappe import msgprint, _
from .mtiba import Mtiba
from gch_custom.services import mtiba


class ErpMTibaController:
    @frappe.whitelist(allow_guest=True)
    def get_treatment_info(treatment_code: str, encounter: str):
        """
        used to get the treatment info from the ERP system mtiba has treament info
        params:
            treatment_code: str gotten from the ERP system mtiba
        """
        try:
            mtiba = initiate_mtiba()
            result = mtiba.get_treatment_info(treatment_code)
            frappe.log_error(
                result, "MTIBA GET INFO RESULT /erp_mtiba.py")
            print(result)

            member_exists = frappe.db.exists(
                'Mtiba Treatment Information', treatment_code)
            
            encounter_key = "encounter"

            if "INP" in encounter:
                encounter_key = "inpatient_encounter"

            if member_exists:
                doc = frappe.get_doc(
                    'Mtiba Treatment Information', treatment_code)
                doc.fullname = result["accountHolder"]["fullName"]
                # doc.encounter = encounter
                doc.mobilenumber = result["accountHolder"]["mobileNumber"]
                doc.account_program = result["accountHolder"]["account"]["program"]
                doc.account_description = result["accountHolder"]["account"]["description"]
                doc.account_limit_currency = result["accountHolder"]["account"]["limit"]["currency"]
                doc.account_limit_amount = result["accountHolder"]["account"]["limit"]["amount"]
                doc.status = result["accountHolder"]["account"]["status"]

                setattr(doc, encounter_key, encounter)

                doc.save()
                return f"Treatment info updated {doc.name} "

            doc = frappe.new_doc("Mtiba Treatment Information")
            # doc.encounter = encounter
            doc.treatment_code = result["treatment"]["code"]
            doc.fullname = result["accountHolder"]["fullName"]
            doc.mobilenumber = result["accountHolder"]["mobileNumber"]
            doc.account_program = result["accountHolder"]["account"]["program"]
            doc.account_description = result["accountHolder"]["account"]["description"]
            doc.account_limit_currency = result["accountHolder"]["account"]["limit"]["currency"]
            doc.account_limit_amount = result["accountHolder"]["account"]["limit"]["amount"]
            doc.status = result["accountHolder"]["account"]["status"]

            setattr(doc, encounter_key, encounter)

            doc.insert()
            return f"Treatment info created {doc.name} "
        except Exception as e:
            frappe.log_error(e, "MTIBA GET INFORMATION ERROR  /erp_mtiba.py")
            return "Mtiba Get Information Failed"
# =====================================================================================================================================================

    @frappe.whitelist(allow_guest=True)
    def process_opened_treatment_notification(**args):
        """
        Treatment opened API is a notification request that is sent to partner’s system to
        notify of an opened treatment triggered by the patient via USSD, M-TIBA app or
        the M-TIBA provider portal. This also means that an endpoint must be
        provisioned that will allow M-TIBA to push treatment initialization and patient
        account information.
        TODO
        format args
        """
        try:
            result = args
            treatment_code = result["treatment"]["code"]
            member_exists = frappe.db.exists(
                'Mtiba Treatment Information', treatment_code)

            if member_exists:
                doc = frappe.get_doc(
                    'Mtiba Treatment Information', treatment_code)
                doc.fullname = result["accountHolder"]["fullName"]
                doc.mobilenumber = result["accountHolder"]["mobileNumber"]
                doc.account_program = result["accountHolder"]["account"]["program"]
                doc.account_description = result["accountHolder"]["account"]["description"]
                doc.account_limit_currency = result["accountHolder"]["account"]["limit"]["currency"]
                doc.account_limit_amount = result["accountHolder"]["account"]["limit"]["amount"]
                doc.status = result["accountHolder"]["account"]["status"]
                doc.save()
                return f"Treatment info updated {doc.name} "

            doc = frappe.new_doc("Mtiba Treatment Information")
            doc.treatment_code = result["treatment"]["code"]
            doc.fullname = result["accountHolder"]["fullName"]
            doc.mobilenumber = result["accountHolder"]["mobileNumber"]
            doc.account_program = result["accountHolder"]["account"]["program"]
            doc.account_description = result["accountHolder"]["account"]["description"]
            doc.account_limit_currency = result["accountHolder"]["account"]["limit"]["currency"]
            doc.account_limit_amount = result["accountHolder"]["account"]["limit"]["amount"]
            doc.status = result["accountHolder"]["account"]["status"]
            doc.insert()
            return f"Treatment info created {doc.name} "
        except Exception as e:
            frappe.log_error(
                e, "MTIBA PROCESS OPENED NOTIFICATIONS ERROR  /erp_mtiba.py")
            return "Mtiba process opened notification Failed"
# =====================================================================================================================================================

    @frappe.whitelist(allow_guest=True)
    def reserve_item_bill(patient_encoutner: str, sales_invoice: str, item_code: str, quantity: int):
        """

TODO: single bill

        This API is designed to reserve member balance against an invoice item’s bill
        and recalculate available member balance taking into account the reserved
        amounts. Partner system will call this API to reserve balance based on
        invoice item amounts.
            {
                "treatmentCode": "ABC01234",
                "externalInvoiceNumber":
                "EXT-001",
                "dateCreated": "2020-12-12",
                "invoiceItem": {
                    "code": "C001",
                    "description": "Consultation",
                    "price": {
                        "currency": "KES",
                        "amount": 1000
                    },
                    "quantity": 1,
                    "category": "Lab",
                    "status": "SUBMITTED",
                    "externalCode": "C001",
                    "itemCode": "trx-20201212-001",
                    "reservationAmount": {
                        "currency": "KES",
                        "amount": 900
                    },
                    "dateCreated": "2020-12-12"
                }
            }

        """
        try:
            current_item = frappe.get_doc("Item", item_code)
            current_invoice = frappe.get_doc(
                "Sales Invoice", sales_invoice)
            
            if "INP" in patient_encoutner:
                current_encounter = frappe.get_doc(
                    "Inpatient Record", patient_encoutner)
                
                treatement_code = frappe.get_value("Mtiba Treatment Information", {
                                               "inpatient_record": current_encounter.name}, ["treatment_code"])
            else:
                current_encounter = frappe.get_doc(
                    "Patient Encounter", patient_encoutner)
                treatement_code = frappe.get_value("Mtiba Treatment Information", {
                                               "encounter": current_encounter.name}, ["treatment_code"])
            
            
            date = str(current_invoice.modified).split(" ")[0]
            payload = {
                "treatmentCode": treatement_code,
                "externalInvoiceNumber": current_invoice.name,
                "dateCreated": date,
                "invoiceItem": {
                    "code": current_item.item_code,
                    "description": current_item.item_name,
                    "price": {
                        "currency": "KES",
                        "amount": current_item.standard_rate
                    },
                    "quantity": quantity,
                    "category": current_item.item_group,
                    "status": "SUBMITTED",
                    "externalCode": current_item.item_code,
                    "itemCode": current_item.item_code,
                    "reservationAmount": {
                        "currency": "KES",
                        "amount": current_item.standard_rate
                    },
                    "dateCreated": date
                }
            }
            # return payload
            mtiba = initiate_mtiba()
            result = mtiba.reserve_item_bill(payload)
            frappe.log_error(
                result, "MTIBA BULK RESULT  /erp_mtiba.py")
            return result

        except Exception as e:
            frappe.log_error(
                e, "MTIBA PROCESS OPENED NOTIFICATIONS ERROR  /erp_mtiba.py")
            return "Mtiba process opened notification Failed"
# =====================================================================================================================================================

    @frappe.whitelist(allow_guest=True)
    @frappe.whitelist(allow_guest=True)
    def reserve_bulk_items_bill(patient_encounter: str, sales_invoice: str):
        """
        This API is designed to reserve member balance against bulk invoice items bill and
        recalculate available member balance taking into account the reserved amounts.
        Partner system will call this API to reserve balance based on invoice items total
        amount
                {
                    "treatmentCode": "AGMOTE2902",
                    "externalInvoiceNumber": "ORE40039/19",
                    "dateCreated":"2022-07-14 08:09:23",
                    "invoiceItems": [
                    {
                    "code": "AGK40883",
                    "description": "LIPID PROFILE-FASTING",
                    "price": {
                    "currency": "KES",
                    "amount": 2750
                    },
                    "quantity": 1,
                    "status": "SUBMITTED",
                    "externalCode": "AGK40883",
                    "reservationAmount": {
                    "currency": "KES",
                    "amount": 2750
                    }
                    },
                    {
                    "code": "AGK40804",
                    "description": "LIVER FUNCTION TEST",
                    "price": {
                    "currency": "KES",
                    "amount": 4580
                    },
                    "quantity": 1,
                    "status": "SUBMITTED",
                    "externalCode": "AGK40804",
                    "reservationAmount": {
                    "currency": "KES",
                    "amount": 4580
                    },
                    "dateCreated": "2022-05-24"
                    }
                    ],
                    "dateCreated": "2022-05-24"
                }

        """
        try:

            current_invoice = frappe.get_doc(
                "Sales Invoice", sales_invoice)
            
            if "INP" in patient_encounter:
                current_encounter = frappe.get_doc(
                    "Inpatient Record", patient_encounter)
                treatement_code = frappe.get_value("Mtiba Treatment Information", {
                                               "inpatient_record": current_encounter.name}, ["treatment_code"])
            else:
                current_encounter = frappe.get_doc(
                    "Patient Encounter", patient_encounter)
                treatement_code = frappe.get_value("Mtiba Treatment Information", {
                                               "encounter": current_encounter.name}, ["treatment_code"])
            
            

            invoicedItems = get_bulk_invoice_items(current_invoice.name)

            doc_details = {
                "treatmentCode": str(treatement_code),
                "externalInvoiceNumber": current_invoice.name,
                "invoiceItems": invoicedItems,
                "dateCreated": str(current_invoice.modified).split(" ")[0]
            }

            doc = create_mtiba_reserve_items_doc(treatement_code, doc_details)

            items_not_reserved = frappe.db.get_list(
                "Mtiba Bulk Reserve Items Details",
                filters={"parent": doc.name, "previously_submitted": 0},
                fields=["name", "code", "description", "quantity", "category", "status", "external_code",
                        "price_currency", "price_amount", "reservation_amount", "reservation_currency", "previously_submitted"]
            )

            payload_invoice_items = []

            for item in items_not_reserved:
                payload_invoice_items.append({
                    'code': item["code"],
                    'description': item["description"],
                    'price': {'currency': item["price_currency"], 'amount': item["price_amount"]},
                    'quantity': item["quantity"],
                    'category': item["category"],
                    'status': item["status"],
                    'externalCode': item["external_code"],
                    'reservationAmount': {'currency': item["reservation_currency"], 'amount': item["reservation_amount"]},
                }
                )

            payload = {
                "treatmentCode": doc.treatmentcode,
                "externalInvoiceNumber": doc.name,
                "invoiceItems": payload_invoice_items,
                "dateCreated": doc.datecreated
            }

            mtiba = initiate_mtiba()

            result = mtiba.reserve_bulk_items(payload)

            if result["apiResponse"]["status"] == 200:
                for item in items_not_reserved:
                    frappe.db.set_value(
                        'Mtiba Bulk Reserve Items Details', item["name"], 'previously_submitted', 1)

            frappe.log_error(
                result, "MTIBA BULK RESULT 2  /erp_mtiba.py")

            return result

        except Exception as e:
            print(e)
            frappe.log_error(
                e, "MTIBA BULK UPDATE ERROR  /erp_mtiba.py")
            return "Mtiba bulk upload failed"
    # ========================================

    @ frappe.whitelist(allow_guest=True)
    def submit_payment(sales_invoice: str, patient_encoutner: str):
        """
        This API is designed to independently submit payment details against an encounter
        and can be used with item bill reservation API so that invoice bills can be reconciled
        appropriately.
        """
        try:
            current_invoice = frappe.get_doc("Sales Invoice", sales_invoice)

            if "INP" in patient_encoutner:
                current_encounter = frappe.get_doc(
                    "Inpatient Record", patient_encoutner)
                treatement_code = frappe.get_value("Mtiba Treatment Information", {
                                               "inpatient_record": current_encounter.name}, ["treatment_code"])
            else:
                current_encounter = frappe.get_doc(
                    "Patient Encounter", patient_encoutner)
                treatement_code = frappe.get_value("Mtiba Treatment Information", {
                                               "encounter": current_encounter.name}, ["treatment_code"])
            
            
            invoiced_items = get_invoice_items(current_invoice.name)
            encounter_diagnosis = get_invoice_diagnosis(current_encounter.name)
            advance_payments = get_advance_payment_list(current_invoice.name)

            mtiba_advance_payment = []
            for advance_payment in advance_payments:
                mtiba_advance_payment.append(
                    {
                        "type": advance_payment["type"],
                        "total": {
                            "currency": advance_payment["currency"],
                            "amount": advance_payment["amount"]
                        }
                    }
                )

            #             {
            #  "payments":[
            #  {
            #  "type":"Benefit",
            #  "total":{
            #  "currency":"KES",
            #  "amount":10000
            #  },
            #  {
            #  "type":"Cash",
            # "total":{
            # "currency":"KES",
            # "amount":0
            # }
            # }
            #  ],
            #  "treatmentCode":"ABC01234"
            # }

            payload = {
                "treatmentCode": treatement_code,
                "payments": mtiba_advance_payment,

            }
            mtiba = initiate_mtiba()

            result = mtiba.submitPaymentDetails(payload)

            return result

            mtiba_request = frappe.new_doc("Mtiba Request")
            mtiba_request.patient_encounter = patient_encoutner
            mtiba_request.sales_invoice = sales_invoice
            mtiba_request.treatment_code = treatment_code
            mtiba_request.external_treatment_code = patient_encoutner
            mtiba_request.notes = ""

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
                    "item_code": item["itemCode"]
                }
                mtiba_request.append('items', formatedItem)

            # diagnosis
            for item in data["diagnosis"]:
                mtiba_request.append('diagnosis', item)

            mtiba_request.save()

            return mtiba_request

        except Exception as e:
            frappe.log_error(
                e, "MTIBA SUBMIT INVOICE ERROR  /erp_mtiba.py")
            return e

    # @frappe.whitelist(allow_guest=True)
    # def reserve_item_bill(treatment_code: str, encounter: str):
    #     """
    #     This API is designed to reserve member balance against an invoice item’s bill
    #     and recalculate available member balance taking into account the reserved
    #     amounts. Partner system will call this API to reserve balance based on
    #     invoice item amounts.
    #     """
    #     try:

    #     except Exception as e:
    #         frappe.log_error(
    #             e, "MTIBA PROCESS OPENED NOTIFICATIONS ERROR  /erp_mtiba.py")
    #         return "Mtiba process opened notification Failed"

# =====================================================================================================================================================


class InvalidParametersErrors(Exception):
    pass

# =====================================================================================================================================================


class ResourceNotFoundErrors(Exception):
    pass

# =====================================================================================================================================================


@ frappe.whitelist(allow_guest=True)
def create_mtiba_request(sales_invoice: str, patient_encoutner: str, data):
    encounter_key = "patient_encounter"

    if "INP" in patient_encoutner:
        encounter_key = "inpatient_record"

    mtiba_request = frappe.new_doc("Mtiba Request")
    # mtiba_request.patient_encounter = patient_encoutner
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
            "item_code": item["itemCode"]
        }
        mtiba_request.append('items', formatedItem)

    # diagnosis
    for item in data["diagnosis"]:
        mtiba_request.append('diagnosis', item)

    setattr(mtiba_request, encounter_key, patient_encoutner)

    mtiba_request.save()

    return mtiba_request

# Helpers


def get_bulk_invoice_items(invoice_name: str):
    invoiced_items = []
    invoice_item_list = frappe.db.get_list(
        "Sales Invoice Item",
        filters={"parent": invoice_name},
        fields=["item_code", "amount", "qty",
                "rate", "item_group", "description"],
    )

    for item in invoice_item_list:
        print("# =====================================================================================================================================================")
        print("qty", item.qty, "amount", item.rate,
              "total", float(item.rate) * float(item.qty))
        print("# =====================================================================================================================================================")
        invoiced_items.append({

            "code": item.item_code,
            "description": item.description,
            "price": {
                "currency": "KES",
                "amount": item.rate
            },
            "quantity": item.qty,
            "category": item.item_group,
            "status": "SUBMITTED",
            "externalCode":  item.item_code,
            "reservationAmount": {
                "currency": "KES",
                "amount": float(item.rate) * float(item.qty)
            }
        })
    return invoiced_items
# =====================================================================================================================================================


def get_invoice_items(invoice_name: str):
    invoiced_items = []
    invoice_item_list = frappe.db.get_list(
        "Sales Invoice Item",
        filters={"parent": invoice_name},
        fields=["item_code", "item_name", "amount", "qty",
                "rate", "item_group", "description"],
    )

    for item in invoice_item_list:
        item_group = frappe.db.get_value(
            "Item",
            {"item_code": item.item_code},
            ["item_group"], as_dict=True
        )
        if item_group:
            item_group = item_group.item_group
        else:
            item_group = "Uncategorized"

        invoiced_items.append({
            "scheme": "SCM123",
            "code": item.item_code,
            "description": item.item_name,
            "price": {
                "currency": "KES",
                "amount": item.rate
            },
            "quantity": item.qty,
            "category": item.item_group,
            "status": "SUBMITTED",
            "externalCode":  item.item_code,
            "itemCode": item.item_code
        })
    return invoiced_items

# =====================================================================================================================================================


def get_invoice_diagnosis(encounter_name: str):
    invoice_diagnosis = []
    diagnosis_list = frappe.db.get_list(
        "Codification Table",
        filters={"parent": encounter_name},
        fields=["medical_code", "code", "description"],
    )
    for item in diagnosis_list:
        invoice_diagnosis.append({
            "scheme": item.medical_code,
            "code": item.code,
            "description": item.description
        })
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
    """Initiate Mtiba """
    mtiba_configs = get_mtiba_configs()
    mtiba = Mtiba(mtiba_configs[0], mtiba_configs[1], mtiba_configs[2])
    return mtiba

# =====================================================================================================================================================


def get_mtiba_configs():
    """Get Mtiba Settings """

    mtiba_setting = frappe.get_doc("Mtiba Setting", "Production")
    username = mtiba_setting.username
    password = mtiba_setting.get_password("password")
    base_url = mtiba_setting.base_url
    frappe.log_error(
        {"mtiba_settings": [username, password, base_url]}, "MTIBA SETTINGS  /erp_mtiba.py")
    return [username, password, base_url]

# =====================================================================================================================================================


@ frappe.whitelist(allow_guest=True)
def create_mtiba_reserve_items_doc(treatmentCode, payload):
    try:
        externalInvoiceNumber = payload["externalInvoiceNumber"]
        invoiceItems = payload["invoiceItems"]

        dateCreated = payload["dateCreated"]

        mtiba_reserve_items_doc_exists = frappe.db.exists(
            'Mtiba Bulk Reserve', externalInvoiceNumber)

        if mtiba_reserve_items_doc_exists:
            """
            check is the was a previous submission to compare the previously submitted items match the current
            """
            cur_mtiba_reserve_items_doc = frappe.get_doc(
                'Mtiba Bulk Reserve', externalInvoiceNumber)

            return cur_mtiba_reserve_items_doc

        doc = frappe.get_doc({
            "doctype": "Mtiba Bulk Reserve",
            "invoice": externalInvoiceNumber,
            "treatmentcode": treatmentCode,
            "externalinvoicenumber": externalInvoiceNumber,
            "datecreated": dateCreated})

        for item in invoiceItems:
            doc.append('invoiceitems', {
                "code": item['code'], "description": item["description"], "category": item["category"], "quantity": item['quantity'], "status": item["status"], "external_code": item["externalCode"], "price_currency": item['price']['currency'], "price_amount": item['price']['amount'], "reservation_amount": item['reservationAmount']['amount'], "reservation_currency": item['reservationAmount']['currency']})
        doc.insert()

        return doc

    except Exception as e:
        frappe.log_error(
            e, "MTIBA RESERVE DOCUMENT CREATION ERROR  /erp_mtiba.py")
        return False


@ frappe.whitelist(allow_guest=True)
def submit_mtiba_invoice(sales_invoice: str, treatment_code: str, patient_encounter: str):
    """
    SUBMIT INVOICE API

    used to submit invoice to mtiba given the invoice name
    """
    try:
        if (sales_invoice == "" or treatment_code == "" or patient_encounter == ""):
            raise InvalidParametersErrors("Invalid Parameters")

        cur_sales_invoice = frappe.get_doc("Sales Invoice", sales_invoice)

        if (cur_sales_invoice == None):
            raise ResourceNotFoundErrors(f"Invoice Not Found: {sales_invoice}")

        if "INP" in patient_encounter:
            cur_encounter = frappe.get_doc("Inpatient Record", patient_encounter)
        else:
            cur_encounter = frappe.get_doc("Patient Encounter", patient_encounter)

        if (cur_encounter == None):
            raise ResourceNotFoundErrors(
                f"Encounter Not Found: {patient_encounter}")

        treatmentCode = treatment_code
        externalTreatmentCode = cur_sales_invoice.name
        invoice = {
            "invoiceNumber": cur_sales_invoice.name,
            "createdBy": cur_sales_invoice.owner,
            "createdOn": cur_sales_invoice.posting_date,
        }

        items = get_invoice_items(sales_invoice)
        diagnosis = get_invoice_diagnosis(patient_encounter)
        payments = get_invoice_payments()
        notes = ""

        data = {
            "treatmentCode": treatmentCode,
            "externalTreatmentCode": externalTreatmentCode,
            "invoice": invoice,
            "items": items,
            "diagnosis": diagnosis,
            "payments": payments,
            "notes": notes
        }

        # CREATE MTIBA REQUEST
        mtiba_request_doc = create_mtiba_request(
            sales_invoice, patient_encounter, data)

        # TOBE DONE
        username, password, base_url = get_mtiba_configs()

        mtiba = Mtiba(username, password, base_url)

        result = mtiba.submitSingleInvoice(treatment_code, data)

        return {"success": True, "code": 201, "message": "Invoice Submitted to Mtiba", "data": result}

    except InvalidParametersErrors as e:
        frappe.log_error(e, "Mtiba API Invalid Parameter Errors")
        return {"success": False, "code": 400, "message": e, "data": None}

    except ResourceNotFoundErrors as e:
        frappe.log_error(e, "Mtiba API Not Found Errors")
        return {"success": False, "code": 404, "message": e, "data": None}

    except Exception as e:
        frappe.log_error(e, "Mtiba API Error")
        return {"success": False, "code": 500, "message": e, "data": None}

# =====================================================================================================================================================


def get_advance_payment_list(sales_invoice: str):
    """
    Get all Advance Payment List given the sales invoice

    """
    try:
        formated_advance_payment_list = []
        advance_payments = frappe.db.get_list(
            "Sales Invoice Advance", filters={"parent": sales_invoice, "parentfield": "advances"}, fields=["name", "remarks", "allocated_amount", "reference_name", "reference_type"]
        )
        for advance_payment in advance_payments:
            payment_entry = frappe.get_doc(
                advance_payment["reference_type"], advance_payment["reference_name"])
            trans_type = "Cash"
            if payment_entry.mode_of_payment == "Insurance":
                trans_type = "Benefit"

            formated_advance_payment_list.append({

                "remarks": advance_payment["remarks"],
                "amount": advance_payment["allocated_amount"],
                "name": payment_entry.name,
                "reference_no": payment_entry.reference_no,
                "mode_of_payment": payment_entry.mode_of_payment,
                "currency": payment_entry.paid_from_account_currency,
                "type": trans_type
            })

        return formated_advance_payment_list
    except Exception as e:
        frappe.log_error(e, "GET ADVANCES /erp_mtiba.py")
        return e
        return []
