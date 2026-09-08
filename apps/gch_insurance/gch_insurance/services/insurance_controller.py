import json
import frappe
from .erp_slade import ErpSladeController
from .erp_smart import ErpSmartController
from .erp_mtiba import ErpMTibaController
from .erp_lct import ErpLctController
from gch_sentry.utils import log


class InsuranceController:
    def __init__(self):
        print("InsuranceController: __init__")
        # print(get_request())

        return

    @frappe.whitelist(allow_guest=True)
    def checkRequest():
        data = get_request()
        print(data)
        return data

    @frappe.whitelist(allow_guest=True)
    def initiate_insurance(
        insurance_type: str = "",
        membership_number: str = "",
        patient_encounter: str = "",
        auth_token: str = "",
        payer: str = "",
    ):
        try:
            is_inpatient = 0
            # check if encounter is outpatient or inpatient
            if "INP" in patient_encounter:
                is_inpatient = 1

            # get patient details
            if is_inpatient == 0:
                current_encounter_doc = frappe.get_doc(
                    "Patient Encounter", patient_encounter
                )
            elif is_inpatient == 1:
                current_encounter_doc = frappe.get_doc(
                    "Inpatient Record", patient_encounter
                )
                
            current_patient_doc = frappe.get_doc(
                "Patient", current_encounter_doc.patient
            )

            if insurance_type.upper() == "SLADE":
                current_sales_invoice_doc = frappe.get_doc(
                    "Sales Invoice", current_encounter_doc.sales_invoice
                )
                return initiate_slade(
                    auth_token,
                    membership_number,
                    current_encounter_doc,
                    current_sales_invoice_doc,
                    current_patient_doc,
                    payer,
                )

            elif insurance_type.upper() == "SMART":
                return initiate_smart(current_patient_doc, current_encounter_doc)

            elif insurance_type.upper() == "MTIBA":
                return initiate_mtiba(membership_number, current_encounter_doc)

            elif insurance_type.upper() == "LCT":
                return initiate_lct(
                    membership_number, current_patient_doc, current_encounter_doc
                )

            return {
                "code": 200,
                "message": "Insurance initiated Successfully",
            }

        except Exception as e:
            log(
                {
                    "message": "Initiate Insurance Error",
                    "level": "error",
                    "extra": {
                        "insurance_type": insurance_type,
                        "membership_number": membership_number,
                        "patient_encounter": patient_encounter,
                        "auth_token": auth_token,
                        "payer": payer,
                        "error": str(e),
                    },
                }
            )
            frappe.log_error(
                e, "InsuranceController: initiate_insurance /insurance_controller.py"
            )
            return {
                "code": 500,
                "message": "Error initiating insurance",
                "data": str(e),
            }

    @frappe.whitelist(allow_guest=True)
    def process_insurance(
        insurance_type: str = "",
        membership_number: str = "",
        patient_encounter: str = "",
        sales_invoice: str = "",
        service_type: str = "Outpatient",
        payer_code: str = "457",
        id: int = 0,
        pool_nr: int = "",
        pool_desc: str = "",
        amount: int = 0,
        location_id: int = 0,
        location_name: str = "",
        sp_id: int = 0,
        has_nhif_payment: int = 0,
        nhif_number: str = "",
        nhif_amount: str = "0",
        nhif_member_type: str = "",
        cash_copay_amount: str = "0",
    ):
        try:
            # get patient details
            current_encounter = frappe.get_doc("Patient Encounter", patient_encounter)

            # get invoice details
            current_invoice = frappe.get_doc("Sales Invoice", sales_invoice)

            if insurance_type.upper() == "SLADE":
                return process_slade(
                    current_encounter,
                    current_invoice,
                    membership_number,
                    service_type,
                    payer_code,
                    cash_copay_amount,
                )

            elif insurance_type.upper() == "SMART":
                current_patient = frappe.get_doc("Patient", current_encounter.patient)
                return process_smart(
                    current_patient,
                    current_encounter,
                    current_invoice,
                    id,
                    pool_nr,
                    pool_desc,
                    amount,
                    location_id,
                    location_name,
                    sp_id,
                    has_nhif_payment,
                    nhif_number,
                    nhif_amount,
                    nhif_member_type,
                )

            elif insurance_type.upper() == "MTIBA":
                return process_mtiba(
                    current_encounter=current_encounter,
                    current_invoice_doc=current_invoice,
                    visit_code=membership_number,
                )

            elif insurance_type.upper() == "LCT":
                return process_lct(
                    current_encounter, current_invoice, membership_number
                )

            return {
                "code": 200,
                "message": "Insurance processed Successfully",
            }
        except Exception as e:
            log(
                {
                    "message": "Process Insurance Error",
                    "level": "error",
                    "extra": {
                        "insurance_type": insurance_type,
                        "membership_number": membership_number,
                        "patient_encounter": patient_encounter,
                        "sales_invoice": sales_invoice,
                        "error": str(e),
                    },
                }
            )

            frappe.log_error(
                e, "InsuranceController: process_insurance /insurance_controller.py"
            )
            return {
                "code": 500,
                "message": "Error processing insurance",
                "data": str(e),
            }


# INITIATORS
# ====================================================================================================

# MTIBA INITIATOR


@frappe.whitelist(allow_guest=True)
def initiate_mtiba(treatment_code: str, current_encounter_doc):
    # fetch_visit
    fetch_visit_response = ErpMTibaController.fetch_visit(treatment_code)

    if fetch_visit_response.get("code") != 200:
        frappe.log_error(
            fetch_visit_response,
            "ERROR: InsuranceController: initiate_mtiba /insurance_controller.py",
        )
        raise Exception(fetch_visit_response.get("message"))

    return fetch_visit_response


# SLADE INITIATOR


@frappe.whitelist(allow_guest=True)
def initiate_slade(
    auth_token,
    membership_number,
    current_encounter_doc,
    current_sales_invoice_doc,
    current_patient_doc,
    payer,
):
    # step 1: get member authorization
    member_authorization_response = ErpSladeController.get_patient_auth(
        auth_token,
        membership_number,
        current_encounter_doc,
        current_sales_invoice_doc,
        current_patient_doc,
        payer,
    )
    return member_authorization_response


# SMART INITIATOR


@frappe.whitelist(allow_guest=True)
def initiate_smart(current_patient_doc, current_encounter_doc):
    try:
        fetch_visit_response = ErpSmartController.fetch_visits(current_patient_doc)

        if  fetch_visit_response.get("code") != 200:
            frappe.log_error(
                fetch_visit_response,
                "ERROR: InsuranceController: initiate_smart /insurance_controller.py",
            )
            raise Exception(fetch_visit_response.get("message"))

        merge_patient_response = ErpSmartController.merge_visit_to_session(
            current_patient_doc, current_encounter_doc
        )

        if merge_patient_response.get("code") != 200:
            frappe.log_error(
                merge_patient_response,
                "ERROR: InsuranceController: initiate_smart /insurance_controller.py",
            )
            raise Exception(merge_patient_response.get("message"))

        fetch_member_details_response = ErpSmartController.fetch_member_details(
            current_patient_doc, current_encounter_doc
        )

        if fetch_member_details_response.get("code") != 200:
            frappe.log_error(
                fetch_member_details_response,
                "ERROR: InsuranceController: initiate_smart /insurance_controller.py",
            )
            raise Exception(fetch_member_details_response.get("message"))

        return fetch_member_details_response
    except Exception as e:
        frappe.log_error(
            e, "ERROR: InsuranceController: initiate_smart /insurance_controller.py"
        )
        return {
            "code": 500,
            "message": "Error processing insurance(smart)",
            "data": str(e),
        }

# LCT INITIATOR


@frappe.whitelist(allow_guest=True)
def initiate_lct(membership_number, current_patient_doc, current_encounter_doc):
    # step 1: get member details
    lct_member_details_response = ErpLctController.get_member_details(
        membership_number, current_patient_doc, current_encounter_doc
    )
    return lct_member_details_response


# PROCESSORS
# ====================================================================================================


# MTIBA PROCESSOR
@frappe.whitelist(allow_guest=True)
def process_mtiba(current_encounter, current_invoice_doc, visit_code):
    bill_visit_response = ErpMTibaController.bill_visit(
        current_encounter=current_encounter,
        current_invoice=current_invoice_doc,
        visit_code=visit_code,
    )

    if bill_visit_response.get("code") != 200:
        frappe.log_error(
            bill_visit_response,
            "ERROR: InsuranceController: process_mtiba /insurance_controller.py",
        )
        raise Exception(bill_visit_response.get("message"))

    add_payments_to_visit_response = ErpMTibaController.add_payments_to_visit(
        current_encounter=current_encounter,
        current_invoice=current_invoice_doc,
        visit_code=visit_code,
    )

    if add_payments_to_visit_response.get("code") != 200:
        frappe.log_error(
            add_payments_to_visit_response,
            "ERROR: InsuranceController: process_mtiba /insurance_controller.py",
        )
        raise Exception(add_payments_to_visit_response.get("message"))

    add_medical_details_to_visit_response = (
        ErpMTibaController.add_medical_details_to_visit(
            current_encounter=current_encounter,
            current_invoice=current_invoice_doc,
            visit_code=visit_code,
        )
    )

    if add_medical_details_to_visit_response.get("code") != 200:
        frappe.log_error(
            add_medical_details_to_visit_response,
            "ERROR: InsuranceController: process_mtiba /insurance_controller.py",
        )
        raise Exception(add_medical_details_to_visit_response.get("message"))

    close_visit_response = ErpMTibaController.close_visit(
        visit_code=visit_code,
        current_encounter=current_encounter,
        current_invoice=current_invoice_doc,
    )

    if close_visit_response.get("code") != 200:
        frappe.log_error(
            close_visit_response,
            "ERROR: InsuranceController: process_mtiba /insurance_controller.py",
        )
        raise Exception(close_visit_response.get("message"))

    return close_visit_response


# SLADE PROCESSOR


@frappe.whitelist(allow_guest=True)
def process_slade(
    current_encounter_doc,
    current_invoice_doc,
    member_number: str,
    service_type: str,
    payer_code: str,
    cash_copay_amount: str,
):
    # TODO:  fix this
    create_claim_response = ErpSladeController.create_claim(
        current_encounter_doc,
        current_invoice_doc,
        member_number,
        service_type,
        payer_code,
    )

    if create_claim_response.get("code") != 200:
        frappe.log_error(
            create_claim_response,
            "ERROR: InsuranceController: process_slade /insurance_controller.py",
        )
        raise Exception(create_claim_response.get("message"))

    create_slade_invoice_response = ErpSladeController.submit_slade_invoice(
        current_invoice_doc.name,
        current_encounter_doc,
        current_invoice_doc,
        cash_copay_amount,
    )

    if create_slade_invoice_response.get("code") != 200:
        frappe.log_error(
            create_slade_invoice_response,
            "ERROR: InsuranceController: process_slade /insurance_controller.py",
        )
        raise Exception(create_slade_invoice_response.get("message"))

    balance_reservations_response = ErpSladeController.reserve_amount(
        member_number, current_invoice_doc
    )

    if balance_reservations_response.get("code") != 200:
        frappe.log_error(
            balance_reservations_response,
            "ERROR: InsuranceController: process_slade /insurance_controller.py",
        )
        raise Exception(balance_reservations_response.get("message"))

    return balance_reservations_response


# SMART PROCESSOR


@frappe.whitelist(allow_guest=True)
def process_smart(
    current_patient_doc,
    current_encounter_doc,
    current_invoice_doc,
    id: int = 0,
    pool_nr: int = "",
    pool_desc: str = "",
    amount: int = 0,
    location_id: int = 0,
    location_name: str = "",
    sp_id: int = 0,
    has_nhif_payment: int = 0,
    nhif_number: str = "",
    nhif_amount: str = "0",
    nhif_member_type: str = "",
):
    upload_claim_response = ErpSmartController.upload_claim(
        current_patient_doc,
        current_encounter_doc,
        current_invoice_doc,
        id,
        pool_nr,
        pool_desc,
        amount,
        location_id,
        location_name,
        sp_id,
        has_nhif_payment,
        nhif_number,
        nhif_amount,
        nhif_member_type,
    )

    if upload_claim_response.get("code") != 200:
        frappe.log_error(
            upload_claim_response,
            "ERROR: InsuranceController: process_smart /insurance_controller.py",
        )
        raise Exception(upload_claim_response.get("message"))

    close_visit_response = ErpSmartController.close_visit(current_invoice_doc)

    if close_visit_response.get("code") != 200:
        frappe.log_error(
            close_visit_response,
            "ERROR: InsuranceController: process_smart /insurance_controller.py",
        )
        raise Exception(close_visit_response.get("message"))

    return close_visit_response


# LCT PROCESSOR


@frappe.whitelist(allow_guest=True)
def process_lct(current_encounter_doc, current_invoice_doc, membership_number):
    create_claim_response = ErpLctController.create_claim(
        current_invoice_doc, current_encounter_doc
    )

    if create_claim_response.get("code") != 200:
        frappe.log_error(
            create_claim_response,
            "ERROR: InsuranceController: process_lct /insurance_controller.py",
        )
        raise Exception(create_claim_response.get("message"))

    process_claim_response = ErpLctController.process_claim(
        current_invoice_doc, current_encounter_doc
    )

    if process_claim_response.get("code") != 200:
        frappe.log_error(
            process_claim_response,
            "ERROR: InsuranceController: process_lct /insurance_controller.py",
        )
        raise Exception(process_claim_response.get("message"))

    return process_claim_response


@frappe.whitelist(allow_guest=True)
def get_request():
    print(frappe.session.user, frappe.request.headers, json.loads(frappe.request.data))
    return {
        "user": frappe.session.user,
        "headers": frappe.request.headers,
        "data": json.loads(frappe.request.data),
    }
