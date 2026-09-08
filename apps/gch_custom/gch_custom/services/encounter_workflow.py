from typing import Dict
from unittest import case
from .mpesa import Mpesa
from .absa_pdq import ABSA_PDQ
from erpnext.accounts.utils import (
    get_outstanding_invoices,
    get_account_currency,
    get_balance_on,
)
from .workflow_handler import WFStates, wf_handler
import uuid
import frappe
import random
from gch_messaging.utils.constants import MessagingConstants
from gch_messaging.utils.core import messaging
import random
from frappe import msgprint, _
import datetime
from frappe.utils import now, get_datetime
from . import tools
from erpnext import get_default_company



def invoice_encounter_items(patient,invoiced_items, encounter,invoice,current_invoiced_items):
    _current_invoiced_items=current_invoiced_items

    company = frappe.defaults.get_global_default("company")

    index_g = company.find('Gert')
    if index_g != -1:
        suffix = " - GCH"
    index_w = company.find('Wema')
    if index_w != -1:
        suffix = " - W"

    if invoice == "":
        invoice = frappe.new_doc("Sales Invoice")
        invoice.patient = patient.name
        invoice.patient_name= patient.patient_name
        invoice.conversion_rate=1 
        invoice.price_list_currency="KES"
        invoice.plc_conversion_rate=1
        invoice.encounter=encounter

        for item in invoiced_items:
                          
            invoice.append('items', item)


        invoice.base_net_total=0 
        invoice.base_grand_total=0
        invoice.grand_total=0
        invoice.debit_to="Debtors"+suffix

        invoice.save()
        # invoice.submit()
        return invoice

    invoice = frappe.get_doc("Sales Invoice",invoice)
    
    
    
    for item in invoiced_items:
        
        
        if item['item_code'] not in _current_invoiced_items:
             
            invoice.append('items', item)
             
        if item['item_code'] in _current_invoiced_items:
            _current_invoiced_items.remove(item['item_code'])
                   
        

    invoice.save()
    # invoice.submit()
    return invoice

def create_invoice_item(item):
    _item = frappe.get_doc("Item",item)

    _fee = frappe.db.get_value(
            "Item Price", {"item_code": _item.item_code}, ["price_list_rate"]
        )
    _income_account,_selling_cost_center = frappe.db.get_value(
            "Item Default", {"parent": _item.item_code}, ["income_account","selling_cost_center"]
        )

    print(_selling_cost_center)
    item_code=_item.item_code
    cost_center=_selling_cost_center
    qty=1
    amount=_fee
    item_name=_item.item_name
    description=_item.description
    uom="Nos"
    rate=_fee
    base_rate=_fee
    base_amount=_fee
    income_account=_income_account
    conversion_factor=1
    invoice_item={'item_code': item_code, 'qty': qty, 'rate': 1, 'amount': amount,'cost_center':cost_center, 'item_name':item_name,'base_rate':base_rate,'base_amount':base_amount,'conversion_factor':conversion_factor, 'description':description, 'uom':uom,'rate':rate, 'income_account':income_account}
            
    return invoice_item

def get_encounter_lab_tests(encounter):
    """
    Used to get the current labtest on an encounter 
    """
   

    lab_test_list = frappe.db.get_list(
        "Lab Prescription",
        filters={"parent": encounter},
        pluck='lab_test_code'
    )
    return lab_test_list

def get_encounter_procedures(encounter):
    """
    Used to get the current clinical Procedures on an encounter 
    """
   
    item_list=[]
    procedure_list = frappe.db.get_list(
        "Procedure Prescription",
        filters={"parent": encounter},
        pluck='procedure_name'
    )
    for procedure in procedure_list:
        p_item= frappe.db.get_value(
            "Item", {"item_name": procedure}, ["item_code"]
        )
        item_list.append(p_item)
 

    return item_list

def is_encounter_invoiced(encounter):
    return frappe.db.count('Sales Invoice',{'encounter': encounter})


@frappe.whitelist(allow_guest=True)
def patient_encounter_workflow_controller(
    workflow_state, selected_workflow_action, encounter
):
    """
    Used to check changes in workflow states

    1. check next step
    2. send mpesa request sms - Branch Paybill, Account Number, Amount
    3. create mpesa c2b request - C2B request doctype
    4. save workflow history - Encounter workflow history doctype
    5. create paid payment entry
    6. auto move encounter to next next stage
    7. get mpesa settings from branch




    TODO
    add custom field
    Sales Invoice-encounter


    """

    owner = frappe.session.user

    # print(workflow_state,selected_workflow_action,encounter,owner)
    

    isCashPayer = True



    
    next_state = wf_handler.get_next_workflow_state(
        workflow_state, selected_workflow_action
    )

    # get current encounter
    current_encounter = frappe.get_doc("Patient Encounter", encounter)

    # extract encounter fields
    mode_of_payment = current_encounter.mode_of_payment
    phone_number = current_encounter.phone_number
    branch = current_encounter.branch
    patient = current_encounter.patient
    patient_ = frappe.get_doc("Patient", patient)
    ref_id = patient_.uhid_code

    isCashPayer = mode_of_payment == "Cash"

    # All Items in Encounter Items
    ALL_ITEMS_ENCOUNTER=[]

    #  Check if encounter has invoice
    is_invoiced= is_encounter_invoiced(encounter)

    current_invoice=""
    # hold the current invoiced items in the existing invoice
    CURRENT_INVOICED_ITEMS=[]

    print(is_invoiced)
    # Sales Invoice Item
    if is_invoiced >= 1:
        # get all invoice items
        sales_invoice = frappe.db.get_value(
            "Sales Invoice", {"encounter": encounter}, ["name"]
        )
        current_invoice=sales_invoice
        invoiced_items = frappe.db.get_list(
        "Sales Invoice Item",
        filters={"parent": sales_invoice},
        pluck='item_code'
        )
        for i_items in invoiced_items:
                CURRENT_INVOICED_ITEMS.append(i_items)
                _i_items=create_invoice_item(i_items)
                ALL_ITEMS_ENCOUNTER.append(_i_items)
        
    print(ALL_ITEMS_ENCOUNTER)
    # outpatient_consultation_item
    from .workflow_controller import WorkflowController
    clinic = frappe.get_doc("Healthcare Service Unit", current_encounter.clinic)
    consultation_fee_item = WorkflowController.get_consulation_item(clinic,mode_of_payment)

     
    
    
    fee = frappe.db.get_value(
            "Item Price", {"item_code": consultation_fee_item}, ["price_list_rate"]
        )


    if next_state == WFStates.PENDING_RECEPTION:
        # check if its first time
        isFirstTime=True

        if isFirstTime:
            item = create_invoice_item(consultation_fee_item)

            ALL_ITEMS_ENCOUNTER.append(item)

            # LABTESTS=get_encounter_lab_tests(encounter)
            # for LABTEST in LABTESTS:
            #     labtest=create_invoice_item(LABTEST)
            #     ALL_ITEMS_ENCOUNTER.append(labtest)
            
            
            # PROCEDURETESTS=get_encounter_procedures(encounter)
            # for PROCEDURETEST in  PROCEDURETESTS:
            #     procedure_test=create_invoice_item(PROCEDURETEST)
            #     ALL_ITEMS_ENCOUNTER.append(procedure_test)

            created_invoice=invoice_encounter_items(patient_,ALL_ITEMS_ENCOUNTER,encounter,current_invoice,CURRENT_INVOICED_ITEMS)
    
            print(created_invoice)

    if next_state == WFStates.PENDING_LAB:

        msg = f"Dear Customer, please pay KES <TOBE DONE> for <TOBE DONE> via MPESA to Paybill <TOBE DONE> Account Number: {current_invoice} before going to the LAB"

        if isCashPayer:
            sent, resp = messaging.send_sms(recipient=phone_number, message=msg)
            print(sent, resp)
        # get all labs items

        LABTESTS=get_encounter_lab_tests(encounter)
        for LABTEST in LABTESTS:
                labtest=create_invoice_item(LABTEST)
                ALL_ITEMS_ENCOUNTER.append(labtest)
        created_invoice=invoice_encounter_items(patient_,ALL_ITEMS_ENCOUNTER,encounter,current_invoice,CURRENT_INVOICED_ITEMS)
        print(created_invoice)
     

    if next_state == WFStates.PENDING_PROCEDURE:
        msg = f"Dear Customer, please pay KES <TOBE DONE> for <TOBE DONE> via MPESA to Paybill <TOBE DONE> Account Number: {current_invoice} before going to the Procedure Room"

        if isCashPayer:
            sent, resp = messaging.send_sms(recipient=phone_number, message=msg)
            print(sent, resp)


        # get all pharmacy items
        PROCEDURETESTS=get_encounter_procedures(encounter)
        for PROCEDURETEST in  PROCEDURETESTS:
                procedure_test=create_invoice_item(PROCEDURETEST)
                ALL_ITEMS_ENCOUNTER.append(procedure_test)

        created_invoice=invoice_encounter_items(patient_,ALL_ITEMS_ENCOUNTER,encounter,current_invoice,CURRENT_INVOICED_ITEMS)
        print(created_invoice)

    if isCashPayer:

        """Get Mpesa Paybill"""
        name = frappe.db.get_value("Mpesa Settings", {"branch": branch}, ["name"])
        mpesa_settings = frappe.get_doc("Mpesa Settings", name)
        consumer_key = mpesa_settings.consumer_key
        consumer_secret = mpesa_settings.get_password("consumer_secret")
        business_shortcode = mpesa_settings.business_shortcode
        online_passkey = mpesa_settings.get_password("online_passkey")
        callback_url = mpesa_settings.callback_url
        mp_callback_url = (
            f"""{callback_url}/api/method/gch_custom.services.mp_callback"""
        )

       

        # create invoice
        



        msg = f"Dear Customer, please pay KES {fee} for {consultation_fee_item} via MPESA to Paybill {business_shortcode} Account Number {current_invoice}."



        # sent, resp = messaging.send_sms(recipient=phone_number, message=msg)

        # print(sent, resp)

        """
        create c2b requests - save to c2b requests doctype

        while init:
            OriginatorConverstionID
            ConversationID
            ResponseDescription

        from callback:
            TransactionType
            TransID
            TransTime
            TransAmount
            BusinessShortCode
            BillRefNumber
            OrgAccountBalance
            ThirdPartyTransID
            MSISDN
            FirstName
            MiddleName
            LastName
        

        """

    ## create invoice
 
    previous_history = frappe.db.exists({
        "doctype": "Patient Encounter Workflow History",
        "patient_encounter":encounter
    })

   
    if previous_history:
        last_value = frappe.get_last_doc('Patient Encounter Workflow History',{"patient_encounter": encounter})
        print(last_value.time_out)
    # except:
    #     previous_history = None
    
    time_in = last_value.time_out if previous_history and last_value else current_encounter.creation
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
