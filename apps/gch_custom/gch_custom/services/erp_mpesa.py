from bdb import Breakpoint
from posixpath import split
import sys
from unittest import result
import frappe
from urllib.parse import urlparse
import requests
from erpnext.accounts.utils import (
    get_balance_on,
)
from .mpesa import Mpesa
from erpnext import get_default_company
from erpnext.accounts.utils import (
    get_outstanding_invoices,
    get_account_currency,
    get_balance_on,

)

from datetime import date

import datetime


company = frappe.defaults.get_global_default("company")

index_g = company.find('Gert')
if index_g != -1:
    suffix = " - GCH"
index_w = company.find('Wema')
if index_w != -1:
    suffix = " - W"


class InvalidParametersErrors(Exception):
    pass


class ResourceNotFoundErrors(Exception):
    pass


class ERPMpesaController:
    def __init__(self, settings: dict):
        self.settings = settings

    def request_stk_push(self, phone_number: int, amount: int):
        pass

@frappe.whitelist(allow_guest=True)
def allocate_amount_to_invoice(invoice_number: str, amount_to_allocate: str, phone_number: str, confirmation_code: str):
    """
    used to allocate amount to an invoice
    """
    owner = frappe.session.user

    try:
        company = frappe.defaults.get_global_default("company")

        index_g = company.find('Gert')
        if index_g != -1:
            suffix = " - GCH"
        index_w = company.find('Wema')
        if index_w != -1:
            suffix = " - W"

        processed_as_stk = frappe.db.exists(  'Mpesa C2B Request',  confirmation_code)
        
        amount= float(amount_to_allocate)
        
        if not processed_as_stk:
        
            return {
                "code": 400,
                "message": f'<b><span style="color:red;">Payment Not Processed</span></b> The payment from phone: <b>{phone_number}</b> was not processed'
            }
        current_sales_invoice = frappe.get_doc(
            "Sales Invoice", invoice_number)
        
        if not current_sales_invoice:
            return {
                "code": 404,
                "message": f'<b><span style="color:red;">Invoice Not Found</span></b> The invoice number: <b>{invoice_number}</b> was not found'
            }
            
            
        current_c2b_request = frappe.get_doc(
        "Mpesa C2B Request", confirmation_code)
        
        if current_c2b_request.processed == 1:
            return {
                "code": 400,
                "message": f'<b><span style="color:red;">Payment Already Processed</span></b> The payment from phone: <b>{phone_number}</b> was alreay processed'
            }
        _use_amount = 0
        
        if current_c2b_request.used_amount is not None:
            _use_amount = float(current_c2b_request.used_amount)
        
    
        
        if float(current_c2b_request.trans_amount) - (_use_amount + float(amount_to_allocate)) < 0:
            return {
                "code": 400,
                "message": f'<b><span style="color:red;">Amount Exceeded</span></b> The amount: <b>{amount_to_allocate}</b> exceeds the amount paid'
            }
        
        
    
        branch = current_sales_invoice.get("branch")
        
        if not branch:
            return {
                "code": 404,
                "message": f'<b><span style="color:red;">Branch Not Found</span></b> The branch for invoice number: <b>{invoice_number}</b> was not found'
            }
            
        
        
        name = frappe.db.get_value(
                "Mpesa Settings", {"branch": branch}, ["name"])
        
        if not name:
            return {
                    "code": 404,
                    "message": f'<b><span style="color:red;">Mpesa Settings Not Found</span></b> The mpesa settings for branch: <b>{branch}</b> was not found'
                }
            
        mpesa_account_parent = f"Mpesa-{name}"
        
        mpesa_code = confirmation_code
        
        
        
        
        """ Get Account for mpesa"""
        company, default_account, mode_of_payment = frappe.db.get_value(
                "Mode of Payment Account",
                {"parent": mpesa_account_parent},
                ["company", "default_account", "parent"],
            )

        def get_party_and_account_balance(company, date, paid_from=None, paid_to=None, ptype=None, pty=None, cost_center=None):
                return frappe._dict(
                    {
                        "party_balance": get_balance_on(
                            party_type=ptype, party=pty, cost_center=cost_center
                        ),
                        "paid_from_account_balance": get_balance_on(
                            paid_from, date, cost_center=cost_center
                        ),
                        "paid_to_account_balance": get_balance_on(
                            paid_to, date=date, cost_center=cost_center
                        ),
                    }
                )
        
        date = datetime.datetime.today().strftime("%Y-%m-%d")
        invoiced_customer = current_sales_invoice.customer
        invoiced_customer_name = current_sales_invoice.patient_name
        
        bal = get_party_and_account_balance(
                company,
                date,
                "Debtors"+suffix,
                default_account,
                "Customer",
                invoiced_customer,
                "Main"+suffix,
            )



        
        doc = frappe.get_doc(
                {
                    "doctype": "Payment Entry",
                    "apply_tax_withholding_amount": 0,
                    "base_paid_amount": amount,
                    "base_received_amount": amount,
                    "base_total_allocated_amount": 0,
                    "company": company,
                    "custom_remarks": 0,
                    "difference_amount": None,
                    "docstatus": 1,
                    "doctype": "Payment Entry",
                    "mode_of_payment": mode_of_payment,
                    "name": "new-payment-entry-1",
                    "naming_series": "ACC-PAY-.YYYY.-",
                    "owner": owner,
                    "paid_amount": amount,
                    "paid_from": "Debtors"+suffix,
                    "paid_from_account_balance": bal["paid_from_account_balance"],
                    "paid_from_account_currency": "KES",
                    "paid_to": default_account,
                    "paid_to_account_balance": bal["paid_to_account_balance"],
                    "paid_to_account_currency": "KES",
                    "party": invoiced_customer,
                    "party_balance": bal["party_balance"],
                    "party_name": invoiced_customer_name,
                    "party_type": "Customer",
                    "payment_order_status": "Initiated",
                    "payment_type": "Receive",
                    "posting_date": date,
                    "received_amount": amount,
                    "reference_date": date,
                    "reference_no": f"{mpesa_code}-{invoice_number}",
                    "references": [],
                    "source_exchange_rate": 1,
                    "status": "Draft",
                    "target_exchange_rate": 1,
                    "total_allocated_amount": 0,
                    "unallocated_amount": amount,
                }
            )

        doc.insert(ignore_permissions=True)
        
        _alloc_amount = float(_use_amount) + float(amount)
        _trans_amount = float(current_c2b_request.trans_amount)
        
        
        if  (_trans_amount - _alloc_amount) == 0:
            current_c2b_request.processed = 1
            current_c2b_request.used_amount = _alloc_amount
            current_c2b_request.submit()
            return {
                "code": 200,
                "message": f'<b><span style="color:green;">Payment Recieved</span></b> Payment from phone: <b>{phone_number}</b> confirmed'
            }
            
        current_c2b_request.used_amount = _use_amount + float(amount)
        current_c2b_request.save(ignore_permissions=True)
                
        return {
        "code": 200,
        "message": f'<b><span style="color:green;">Payment Recieved</span></b> Payment from phone: <b>{phone_number}</b> confirmed'
        }
         
         
       
        
         
    except Exception as e:
        print(e)
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        frappe.log_error(e, "MPESA CHECK MPESA PAYMENT ERROR  /erp_mpesa.py")
        return{
            "code": 500,
            "message":"An error occured while processing the request"
        }
            
                        

@frappe.whitelist(allow_guest=True)
def check_mpesa_payment(invoice_number: str, phone_number: str, confirmation_code: str):
    """
    used to check if a phone number has paid to till/paybill number
    """
    owner = frappe.session.user

    try:
        # transaction_exists = True
        processed_as_stk = frappe.db.exists({
            'doctype': 'Mpesa STK Request',
            'mpesa_code': confirmation_code
        })
        if processed_as_stk:
            
            # return f'<b><span style="color:red;">Payment Already Processed</span></b> The payment from phone: <b>{phone_number}</b> was alreay processed'
            return {
                "code": 400,
                "message": f'<b><span style="color:red;">Payment Already Processed</span></b> The payment from phone: <b>{phone_number}</b> was alreay processed'
            }
            
        transaction_exists = frappe.db.exists(
            'Mpesa C2B Request',
                {
                    'trans_id': confirmation_code,
                    'docstatus': 0
                }            
            )

        current_sales_invoice = frappe.get_doc(
            "Sales Invoice", invoice_number)

        """  Get Encounter """
     
        # current_encounter = frappe.get_doc(
        #     "Patient Encounter", encounter)

        branch = current_sales_invoice.branch

        if transaction_exists:
            date = datetime.datetime.today().strftime("%Y-%m-%d")

            invoiced_customer = current_sales_invoice.customer
            invoiced_customer_name = current_sales_invoice.patient_name
            #    confirm the code has gone through
            """ get mpesa payment details"""
            current_mpesa_payment = frappe.get_doc(
                "Mpesa C2B Request", confirmation_code)
            
            if current_mpesa_payment.processed == 1:
                return {
                    "code": 400,
                    "message": f'<b><span style="color:red;">Payment Already Processed</span></b> The payment from phone: <b>{phone_number}</b> was alreay processed'
                }

            provided_number = str(phone_number)
            database_number = str(
                current_mpesa_payment.msisdn)

            starts_with_number = database_number[:4]
            ends_with_number = database_number[len(database_number) - 3:]

            if provided_number.startswith(starts_with_number) and provided_number.endswith(ends_with_number):
                _used_amount = 0
                if current_mpesa_payment.used_amount is not None:
                    _used_amount = float(current_mpesa_payment.used_amount)
                    
                amount = float(current_mpesa_payment.trans_amount) - _used_amount
                
                return {
                    "code":200,
                    "mpesa_code":confirmation_code,
                    "mpesa_amount":amount
                    
                }

                name = frappe.db.get_value(
                    "Mpesa Settings", {"branch": branch}, ["name"])

                mpesa_account_parent = f"Mpesa-{name}"
                mpesa_code = confirmation_code

                """ Get Account for mpesa"""
                company, default_account, mode_of_payment = frappe.db.get_value(
                    "Mode of Payment Account",
                    {"parent": mpesa_account_parent},
                    ["company", "default_account", "parent"],
                )

                def get_party_and_account_balance(company, date, paid_from=None, paid_to=None, ptype=None, pty=None, cost_center=None):
                    return frappe._dict(
                        {
                            "party_balance": get_balance_on(
                                party_type=ptype, party=pty, cost_center=cost_center
                            ),
                            "paid_from_account_balance": get_balance_on(
                                paid_from, date, cost_center=cost_center
                            ),
                            "paid_to_account_balance": get_balance_on(
                                paid_to, date=date, cost_center=cost_center
                            ),
                        }
                    )

                bal = get_party_and_account_balance(
                    company,
                    date,
                    "Debtors - GCH",
                    default_account,
                    "Customer",
                    invoiced_customer,
                    "Main - GCH",
                )

                doc = frappe.get_doc(
                    {
                        "doctype": "Payment Entry",
                        "apply_tax_withholding_amount": 0,
                        "base_paid_amount": amount,
                        "base_received_amount": amount,
                        "base_total_allocated_amount": 0,
                        "company": company,
                        "custom_remarks": 0,
                        "difference_amount": None,
                        "docstatus": 1,
                        "doctype": "Payment Entry",
                        "mode_of_payment": mode_of_payment,
                        "name": "new-payment-entry-1",
                        "naming_series": "ACC-PAY-.YYYY.-",
                        "owner": owner,
                        "paid_amount": amount,
                        "paid_from": "Debtors - GCH",
                        "paid_from_account_balance": bal["paid_from_account_balance"],
                        "paid_from_account_currency": "KES",
                        "paid_to": default_account,
                        "paid_to_account_balance": bal["paid_to_account_balance"],
                        "paid_to_account_currency": "KES",
                        "party": invoiced_customer,
                        "party_balance": bal["party_balance"],
                        "party_name": invoiced_customer_name,
                        "party_type": "Customer",
                        "payment_order_status": "Initiated",
                        "payment_type": "Receive",
                        "posting_date": date,
                        "received_amount": amount,
                        "reference_date": date,
                        "reference_no": mpesa_code,
                        "references": [],
                        "source_exchange_rate": 1,
                        "status": "Draft",
                        "target_exchange_rate": 1,
                        "total_allocated_amount": 0,
                        "unallocated_amount": amount,
                    }
                )

                doc.insert(ignore_permissions=True)
                current_mpesa_payment.submit()

                return f'<b><span style="color:green;">Payment Recieved</span></b> Payment from phone: <b>{phone_number}</b> confirmed'
            # breakpoint()
            return f'<b><span style="color:red;">Payment Failed</span></b> The transaction does not much the phone: <b>{phone_number}</b>'
        if not transaction_exists:
            return {
                "code": 404,
                "message": f'<b><span style="color:red;">Payment Failed</span></b> NO payment from phone: <b>{phone_number}</b>'
            }
        # return f'<b><span style="color:red;">Payment Failed</span></b> NO payment from phonessss: <b>{phone_number}</b>'
        return {
            "code": 500,
            "message": f'<b><span style="color:red;">Payment Failed</span></b> NO payment from phone: <b>{phone_number}</b>'
        }
    except Exception as e:
        print(e)
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        frappe.log_error(e, "MPESA CHECK MPESA PAYMENT ERROR  /erp_mpesa.py")
        return{
            "code": 500,
            "message":"An error occured while processing the request"
        } 
    


@frappe.whitelist(allow_guest=True)
def send_stk_push_request(phone_number: int, amount: int, sales_invoice: str, branch: str = "Muthaiga"):
    try:
        frappe.log_error({
            "phone_number": phone_number,
            "amount": amount,
            "sales_invoice": sales_invoice,
            "branch": branch
            }, "MPESA STK PUSH REQUEST  /erp_mpesa.py")
       
        
        mpesa_settings = get_mpesa_settings(branch)
        current_sales_invoice = frappe.get_doc("Sales Invoice", sales_invoice)
        # current_encounter = frappe.get_doc(
        #     "Patient Encounter", current_sales_invoice.encounter)

        mpesa = initiate_mpesa(mpesa_settings)

        mpesa._getAuthToken()

        response = mpesa.stkPush(
            phone=phone_number,
            amount=amount,
            AccountReference=current_sales_invoice.name,
            TransactionDesc=f"Medical Payment for {current_sales_invoice.name}",
        )

        print(response)

        # test = {
        #     'MerchantRequestID': '37402-146178676-2',
        #     'CheckoutRequestID': 'ws_CO_31032023200853717721476778',
        #     'ResponseCode': '0',
        #     'ResponseDescription': 'Success. Request accepted for processing',
        #     'CustomerMessage': 'Success. Request accepted for processing'}
        if response.get("errorCode"):
            frappe.log_error(
                response, "MPESA STK PUSH REQUEST ERROR  /erp_mpesa.py")

        if response.get("ResponseCode") != "0":
            frappe.log_error(
                response, "MPESA STK PUSH REQUEST ERROR  /erp_mpesa.py")

        if response.get("ResponseCode") == "0":
            frappe.log_error(
                response, "MPESA STK PUSH REQUEST SUCCESS  /erp_mpesa.py")
            
            print("CODE GOT HERE...........",  response, "\n\n\n\n")
            
            # Create Payment Entry for successful Mpesa Payment
            # payment_entry_doc = frappe.get_doc({
            #     "doctype": "Payment Entry",
            #     "apply_tax_withholding_amount": 0,
            #     "base_paid_amount": int(amount),
            #     "base_received_amount_after_tax": 0,
            #     "base_received_amount": amount,
            #     "base_total_allocated_amount": 0,
            #     "base_total_taxes_and_charges": 0,
            #     "company": company,
            #     "deductions": [],
            #     "custom_remarks": 0,
            #     "difference_amount": 0,
            #     "docstatus": 0,
            #     "doctype": "Payment Entry",
            #     "mode_of_payment": "Cash",
            #     "name": "new-payment-entry-1",
            #     "naming_series": "ACC-PAY-.YYYY.-",
            #     "owner": frappe.user,
            #     "paid_amount": int(amount),
            #     "paid_from": "Debtors - GCH",
            #     "paid_from_account_balance": 0,
            #     "paid_from_account_currency": "KES",
            #     "paid_to": "Mpesa-Pangani Production Live - GCH",
            #     "paid_to_account_balance": 0,
            #     "paid_to_account_currency": "KES",
            #     "party": current_sales_invoice.patient,
            #     "party_balance": 0,
            #     "party_name": current_sales_invoice.patient,
            #     "party_type": "Customer",
            #     "payment_order_status": "Initiated",
            #     "payment_type": "Receive",
            #     "posting_date": date.today(),
            #     "received_amount": int(amount),
            #     "received_amount_after_tax": 0,
            #     "reference_date": date.today(),
            #     "reference_no": phone_number,
            #     "references": [],
            #     "source_exchange_rate": 1,
            #     "status": "Draft",
            #     "target_exchange_rate": 1,
            #     "total_allocated_amount": 0,
            #     "total_taxes_and_charges": 0,
            #     "unallocated_amount": 0,
            # })
            
            # print(payment_entry_doc, "PAYMENT ENTRY DOC")

            # payment_entry_doc.insert(ignore_permissions=True)

            # # # Create Payment Entry Child Doc
            # payment_entry_child_doc = frappe.get_doc({
            #     "doctype": "Payment Entry Reference",
            #     "allocated_amount": int(amount),
            #     "due_date": date.today(),
            #     "exchange_gain_loss": 0,
            #     "exchange_rate": 1,
            #     "outstanding_amount": current_sales_invoice.grand_total - int(amount),
            #     "parent": payment_entry_doc.name,
            #     "parentfield": "references",
            #     "parenttype": "Payment Entry",
            #     "reference_doctype": "Sales Invoice",
            #     "reference_name": current_sales_invoice.name,
            #     "total_amount": current_sales_invoice.grand_total
            # })
            
            
            # payment_entry_child_doc.save(ignore_permissions=True)


            CheckoutRequestID = response["CheckoutRequestID"]
            MerchantRequestID = response["MerchantRequestID"]
            ResponseCode = response["ResponseCode"]
            ResponseDescription = response["ResponseDescription"]
            CustomerMessage = response["CustomerMessage"]

            new_doc = frappe.get_doc({
                'doctype': "Mpesa STK Request",
                'amount': amount,
                'branch': current_sales_invoice.branch,
                'checkoutrequestid': CheckoutRequestID,
                'default_account': "Mpesa-Mombasa Production - GCH",
                'invoiceno': current_sales_invoice.name,
                'merchantrequestid': MerchantRequestID,
                'mpesanumber': phone_number,
                'name': CheckoutRequestID,
                'patient': current_sales_invoice.patient,
                'responsecode': ResponseCode,
                'responsedescription': ResponseDescription
            })

            new_doc.insert(ignore_permissions=True)
            new_doc.save()
            return response

        return response

    except Exception as e:
        print(e)
        frappe.log_error(e, "MPESA STK PUSH REQUEST ERROR  /erp_mpesa.py")
        return False


@frappe.whitelist(allow_guest=True)
def confirm_stk_request(**args):
    try:

        print(args)
        frappe.log_error(args, "MPESA STK PUSH CONFIRMATION  /erp_mpesa.py")
        if not args["Body"]["stkCallback"]["ResultCode"] == 0:
            return True
        # Body = args["Body"]
        Body = args["Body"]
        CheckoutRequestID = Body["stkCallback"]["CheckoutRequestID"]
        ResultCode = Body["stkCallback"]["ResultCode"]
        PhoneNumber = Body["stkCallback"]["CallbackMetadata"]["Item"][3]["Value"]
        MpesaReceiptNumber = Body["stkCallback"]["CallbackMetadata"]["Item"][1]["Value"]
        Amount = Body["stkCallback"]["CallbackMetadata"]["Item"][0]["Value"]

        stk_push_request_exists = frappe.db.exists(
            "Mpesa STK Request", CheckoutRequestID)

        if not stk_push_request_exists:
            frappe.log_error(
                args, "MPESA STK PUSH CONFIRMATION PUSH REQUEST DOES NOT EXIST ERROR  /erp_mpesa.py")
            return False

        stk_push_request = frappe.get_doc(
            "Mpesa STK Request", CheckoutRequestID)

        if int(stk_push_request.responsecode) != 0:
            frappe.log_error(
                args, "MPESA STK PUSH CONFIRMATION RESPONSE NOT OKAY ERROR  /erp_mpesa.py")
            return False

        # if stk_push_request.amount) != int(Amount):
        #     frappe.log_error(
        #         args, "MPESA STK PUSH CONFIRMATION AMOUNT TAMPERED ERROR  /erp_mpesa.py")
        #     return False

        # if stk_push_request.mpesanumber != PhoneNumber:
        #     frappe.log_error(
        #         args, "MPESA STK PUSH CONFIRMATION PHONE NUMBER TAMPERED ERROR /erp_mpesa.py")
        #     return False

        if stk_push_request.processed == 1:
            frappe.log_error(
                args, "MPESA STK PUSH CONFIRMATION ALREADY PROCESSED ERROR  /erp_mpesa.py")
            return False

        current_sales_invoice = frappe.get_doc(
            "Sales Invoice", stk_push_request.invoiceno)

        # current_encounter = frappe.get_doc(
        #     "Patient Encounter", current_sales_invoice.encounter)

        invoiced_customer = current_sales_invoice.customer

        mpesa_account_parent = f"Mpesa-{current_sales_invoice.branch} Production"

        company, default_account, mode_of_payment = frappe.db.get_value(
            "Mode of Payment Account",
            {"parent": mpesa_account_parent},
            ["company", "default_account", "parent"],
        )

        frappe.log_error({company, default_account, mode_of_payment}, "MPESA STK FOLLOWING THROUGH COMPANY AND DEFAULT")

        def get_party_and_account_balance(company, date, paid_from=None, paid_to=None, ptype=None, pty=None, cost_center=None):
            return frappe._dict(
                {
                    "party_balance": get_balance_on(
                        party_type=ptype, party=pty, cost_center=cost_center
                    ),
                    "paid_from_account_balance": get_balance_on(
                        paid_from, date, cost_center=cost_center
                    ),
                    "paid_to_account_balance": get_balance_on(
                        paid_to, date=date, cost_center=cost_center
                    ),
                }
            )
        date = datetime.datetime.today().strftime("%Y-%m-%d")
        print(date)
        # bal = get_party_and_account_balance(
        #     company,
        #     date,
        #     "Debtors"+suffix,
        #     default_account,
        #     "Customer",
        #     invoiced_customer,
        #     "Main"+suffix,
        # )
        amount = int(Amount)

        # frappe.log_error(bal, amount, "MPESA STK FOLLOWING THROUGH BALANCE AND AMOUNT ....")

        doc = frappe.get_doc(
            {
                "doctype": "Payment Entry",
                "apply_tax_withholding_amount": 0,
                "base_paid_amount": amount,
                "base_received_amount": amount,
                "base_total_allocated_amount": 0,
                "company": company,
                "custom_remarks": 0,
                "difference_amount": None,
                "docstatus": 1,
                "doctype": "Payment Entry",
                "mode_of_payment": mode_of_payment,
                "name": "new-payment-entry-1",
                "naming_series": "ACC-PAY-.YYYY.-",
                # "owner": owner,
                "paid_amount": amount,
                "paid_from": "Debtors"+suffix,
                "paid_from_account_balance": 0,
                "paid_from_account_currency": "KES",
                "paid_to": default_account,
                "paid_to_account_balance": 0,
                "paid_to_account_currency": "KES",
                "party": invoiced_customer,
                "party_balance": 0,
                "party_name": current_sales_invoice.customer,
                "party_type": "Customer",
                "payment_order_status": "Initiated",
                "payment_type": "Receive",
                "posting_date": date,
                "received_amount": amount,
                "reference_date": date,
                "reference_no": MpesaReceiptNumber,
                "references": [],
                "source_exchange_rate": 1,
                "status": "Draft",
                "target_exchange_rate": 1,
                "total_allocated_amount": amount,
                "unallocated_amount": 0,
            }
        )

        # # Create Payment Entry Child Doc
        # payment_entry_child_doc = frappe.get_doc({
        #     "doctype": "Payment Entry Reference",
        #     "allocated_amount": int(amount),
        #     "due_date": date,
        #     "exchange_gain_loss": 0,
        #     "exchange_rate": 1,
        #     "outstanding_amount": current_sales_invoice.outstanding_amount - int(amount),
        #     # "parent": doc.name,
        #     # "parentfield": "references",
        #     # "parenttype": "Payment Entry",
        #     "reference_doctype": "Sales Invoice",
        #     "reference_name": current_sales_invoice.name,
        #     "total_amount": current_sales_invoice.grand_total
        # })

        # doc.append("references", payment_entry_child_doc)

        doc.insert(ignore_permissions=True)


        frappe.log_error(doc, "MPESA STK PAYMENT ENTRY DOC /erp_mpesa.py")

        # current_mpesa_payment.submit()

        stk_push_request.cb_resultcode = ResultCode
        stk_push_request.cb_resultdesc = "The service request is processed successfully."
        stk_push_request.mpesa_code = MpesaReceiptNumber
        stk_push_request.processed = 1

        stk_push_request.save(ignore_permisssions=True)

        return stk_push_request
    except Exception as e:
        print(e)
        frappe.log_error(
            e, "MPESA STK PUSH CONFIRMATION GENERAL ERROR  /erp_mpesa.py")
        return False


@frappe.whitelist(allow_guest=True)
def mpesa_payment_confirmed():
    pass


@frappe.whitelist(allow_guest=True)
def validation_url_handler(**args):
    """
        This is the URL that receives the validation request from API upon payment submission. The validation URL is only called if the external validation on the registered shortcode is enabled. (By default External Validation is dissabled)
    """
    try:
        frappe.log_error(args, "MPESA ValidationURL  /erp_mpesa.py")
        return True
    except Exception as e:
        print(e)
        frappe.log_error(e, "MPESA ValidationURL ERROR  /erp_mpesa.py")
        return False


@frappe.whitelist(allow_guest=True)
def confirmation_url_handler(**args):
    """
    This is the URL that receives the confirmation request from API upon payment completion.  
    """
    try:
        frappe.log_error(args, "MPESA ConfirmationURL  /erp_mpesa.py")

        doc = frappe.get_doc({
            'doctype': 'Mpesa C2B Request',
            "first_name": args["FirstName"],
            "middle_name": "",
            "last_name": "",
            "msisdn": args["MSISDN"],
            "business_shortcode": args["BusinessShortCode"],
            "transaction_type": "Paybilll",
            "trans_id": args["TransID"],
            "trans_time": args["TransTime"],
            "bill_ref_number": args["BillRefNumber"],
            "invoice_number": "",
            "third_party_trans_id": "",
            "trans_amount": args["TransAmount"],

        })
        doc.insert(ignore_permissions=True)

        return True
    except Exception as e:
        print(e)
        frappe.log_error(e, "MPESA ConfirmationURL ERROR  /erp_mpesa.py")
        return False


@frappe.whitelist(allow_guest=True)
def mpesa_confirmed(**args):
    print(args)
    try:
        response = args["Result"]
        ResultCode = response["ResultCode"]
        if ResultCode == 0:
            data = response["ResultParameters"]["ResultParameter"]
            ref = response["ReferenceData"]["ReferenceItem"]["Value"]
            payer = data[0]["Value"]
            split_name = payer.split("-")
            msisdn = split_name[0]
            fullname = split_name[1].split()
            paid_to = data[1]["Value"]
            business_shortcode = paid_to.split()[0]
            timestamp = data[3]["Value"]

            amount = data[10]["Value"]
            mpesa_code = data[12]["Value"]

            code_exists = frappe.db.exists(
                "Mpesa C2B Request", mpesa_code, cache=True)

            if code_exists:
                return True
            doc = frappe.get_doc({
                'doctype': 'Mpesa C2B Request',
                "first_name": fullname[0],
                "middle_name": fullname[1],
                "last_name": "",
                "msisdn": msisdn,
                "business_shortcode": business_shortcode,
                "transaction_type": "Paybilll",
                "trans_id": mpesa_code,
                "trans_time": timestamp,
                "bill_ref_number": ref,
                "invoice_number": "",
                "third_party_trans_id": "",
                "trans_amount": amount,

            })
            doc.insert(ignore_permissions=True)

        return True
    except Exception as e:
        print(e)
        frappe.log_error(e, "MPESA COMFIRM ERROR  /erp_mpesa.py")
        return False


@frappe.whitelist(allow_guest=True)
def mpesa_validated(**args):
    print(args)
    return True


@frappe.whitelist(allow_guest=True)
def register_urls(branch: str, ConfirmationURL: str, ValidationURL: str, ResponseType: str, ShortCode: str):
    try:
        mpesa_settings = get_mpesa_settings(branch)

        mpesa = initiate_mpesa(mpesa_settings)

        mpesa._getAuthToken()

        result = mpesa.c2bRegister(
            ConfirmationURL, ValidationURL, ResponseType, ShortCode)

        print(result)
        return result
    except Exception as e:
        print(e)
        frappe.log_error(e, "MPESA REGISTER URLs ERROR  /erp_mpesa.py")
        return False


@frappe.whitelist(allow_guest=True)
def checkTransactionStatus(branch: str):
    mpesa_settings = get_mpesa_settings(branch)

    mpesa = initiate_mpesa(mpesa_settings)

    result = mpesa._getAuthToken()

    return result


@frappe.whitelist(allow_guest=True)
def mpesa_payment_processor(phone_number: int,  sales_invoice: str, branch: str = "Muthaiga", items_to_pay: list = []):
    try:
        current_sales_invoice = frappe.get_doc("Sales Invoice", sales_invoice)

        if not items_to_pay:
            return False

        list_of_items = []
        amount = 0
        # amount = 0
        for item in current_sales_invoice.items:
            print(item.name)
            print(items_to_pay)
            print(item.name in items_to_pay)
            if item.name in items_to_pay:
                amount += float(item.amount)
                list_of_items.append({
                    "name": item.name,
                    "item_name": item.item_name,
                    "quantity": item.qty,
                    "unit_cost": item.rate,
                    "total_cost": item.amount,
                    "is_paid": item.is_paid,
                })

        # TODO: get the mpesa settings for the branch

        mpesa_setting = get_mpesa_settings(branch)
        client_id = mpesa_setting["client_id"]

        # client_id = "da3c4fef-25bf-4618-9849-447c9ba38cf8"
        api_key = ""
        api_secret = ""

        # Define the URL endpoint

        url = "http://checkout.gerties.org/api/payment_requests/?api_key=Fjyq2jq9FxxW2kGD7Ycdb535yVBC7tMKJPBNAeeNpPqGJLBWs9LjGXBJt5uJQzZV&api_secret=YS5vtXK3H2g9VjCLyPFPb3AdXCR9brJeyAyAqVk96HSdhcdAY77LMmgdKA4dueYe"
        # url = "http://localhost/api/payment_requests/?api_key=Fjyq2jq9FxxW2kGD7Ycdb535yVBC7tMKJPBNAeeNpPqGJLBWs9LjGXBJt5uJQzZV&api_secret=YS5vtXK3H2g9VjCLyPFPb3AdXCR9brJeyAyAqVk96HSdhcdAY77LMmgdKA4dueYe"
        request_parsed_url = urlparse(frappe.utils.get_url())

        base_url = f"{request_parsed_url.scheme}://{request_parsed_url.netloc}"

        # Define the payload data
        payload = {
            "client_id": client_id,
            "reference": current_sales_invoice.name,
            "description": f"Payment for Invoice: {current_sales_invoice.name}",
            "phone_number": phone_number,
            "payment_phone_number": phone_number,
            "customer": current_sales_invoice.customer,
            "amount": amount,
            "payload": {"items": list_of_items},
            "callback_url": f"{base_url}/api/method/gch_custom.services.processor_callback?id={client_id}"
        }
        frappe.log_error(payload, "MPESA STK PUSH REQUEST  /erp_mpesa.py")
        # Send the POST request
        response = requests.post(url, json=payload)

        result = response.json()

        return result

        # Check the response status code
        if response.status_code == 200:
            print("Request successful!")

        else:
            print("Request failed with status code:", response.status_code)
        return True
    except Exception as e:
        print(e)
        frappe.log_error(e, "MPESA STK PUSH REQUEST ERROR  /erp_mpesa.py")
        return e


@frappe.whitelist(allow_guest=True)
def mpesa_payment_processor_callback(**args):
    print(args)
    try:

        frappe.log_error(
            args, "MPESA STK PAYMENT PROCESSOR CALLBACK  /erp_mpesa.py")
        amount = args.get("amount")
        reference = args.get("reference")
        customer = args.get("customer")
        sales_invoice = args.get("sales_invoice")

        current_sales_invoice = frappe.get_doc("Sales Invoice", sales_invoice)

        branch = current_sales_invoice.branch

        create_payment_entry(amount=amount, ref=reference,
                             invoiced_customer=customer, branch=branch)

        payload = args.get("payload")

        if payload:
            items = payload.get("items")

            for item in items:
                frappe.db.set_value("Sales Invoice Item",
                                    item["name"], "is_paid", 1)

        return True

    except Exception as e:
        print(e)
        frappe.log_error(e, "MPESA STK PAYMENT PROCESSOR ERROR  /erp_mpesa.py")
        return e

# MPESA UTILITIES


def get_party_and_account_balance(company, date, paid_from=None, paid_to=None, ptype=None, pty=None, cost_center=None):
    return frappe._dict(
        {
            "party_balance": get_balance_on(
                party_type=ptype, party=pty, cost_center=cost_center
            ),
            "paid_from_account_balance": get_balance_on(
                paid_from, date, cost_center=cost_center
            ),
            "paid_to_account_balance": get_balance_on(
                paid_to, date=date, cost_center=cost_center
            ),
        }
    )


def create_payment_entry(amount, ref, invoiced_customer, branch):
    try:
        """
        make sure you add mode of payment called insurance and add the default company and account
        """
        mpesa_name = frappe.db.get_value(
            "Mpesa Settings", {"branch": branch}, ["name"])

        mpesa_account_parent = f"Mpesa-{mpesa_name}"

        date = datetime.datetime.today().strftime("%Y-%m-%d")

        company, default_account, mode_of_payment = frappe.db.get_value(
            "Mode of Payment Account",
            {"parent": mpesa_account_parent},
            ["company", "default_account", "parent"],

        )

        bal = get_party_and_account_balance(
            company,
            date,
            "Debtors"+suffix,
            default_account,
            "Customer",
            invoiced_customer,
            "Main"+suffix,
        )
        frappe.log_error({
            "apply_tax_withholding_amount": 0,
            "base_paid_amount": amount,
            "base_received_amount": amount,
            "base_total_allocated_amount": 0,
            "company": company,
            "custom_remarks": 0,
            "difference_amount": 0,
            "docstatus": 1,
            "doctype": "Payment Entry",
            "mode_of_payment": "Insurance",
            "name": "new-payment-entry-1",
            "naming_series": "ACC-PAY-.YYYY.-",
            "paid_amount": amount,
            "paid_from": "Debtors"+suffix,
            "paid_from_account_balance": bal["paid_from_account_balance"],
            "paid_from_account_currency": "KES",
            "paid_from_account_type": "Receivable",
            "paid_to": default_account,
            "paid_to_account_balance": bal["paid_to_account_balance"],
            "paid_to_account_currency": "KES",
            "paid_to_account_type": "Receivable",
            "party": invoiced_customer,
            "party_balance": bal["party_balance"],
            "party_name": invoiced_customer,
            "title": invoiced_customer,
            "party_type": "Customer",
            "payment_order_status": "Initiated",
            "payment_type": "Receive",
            "posting_date": date,
            "received_amount": amount,
            "reference_date": date,
            "reference_no": ref,
            "references": [],
            "source_exchange_rate": 1,
            "status": "Draft",
            "target_exchange_rate": 1,
            "total_allocated_amount": 0,
            "unallocated_amount": amount
        }, "payload")

        doc = frappe.get_doc({
            "apply_tax_withholding_amount": 0,
            "base_paid_amount": amount,
            "base_received_amount": amount,
            "base_total_allocated_amount": 0,
            "company": company,
            "custom_remarks": 0,
            "difference_amount": 0,
            "docstatus": 1,
            "doctype": "Payment Entry",
            "mode_of_payment": "Insurance",
            "name": "new-payment-entry-1",
            "naming_series": "ACC-PAY-.YYYY.-",
            "paid_amount": amount,
            "paid_from": "Debtors"+suffix,
            "paid_from_account_balance": bal["paid_from_account_balance"],
            "paid_from_account_currency": "KES",
            "paid_from_account_type": "Receivable",
            "paid_to": default_account,
            "paid_to_account_balance": bal["paid_to_account_balance"],
            "paid_to_account_currency": "KES",
            "paid_to_account_type": "Receivable",
            "party": invoiced_customer,
            "party_balance": bal["party_balance"],
            "party_name": invoiced_customer,
            "title": invoiced_customer,
            "party_type": "Customer",
            "payment_order_status": "Initiated",
            "payment_type": "Receive",
            "posting_date": date,
            "received_amount": amount,
            "reference_date": date,
            "reference_no": ref,
            "references": [],
            "source_exchange_rate": 1,
            "status": "Draft",
            "target_exchange_rate": 1,
            "total_allocated_amount": 0,
            "unallocated_amount": amount
        })
        doc.insert(ignore_permissions=True)
        return doc
    except Exception as e:

        frappe.log_error(
            e, "CREATE PAYMENT ENTRY ERROR  /erp_smart.py")
        return e


def initiate_mpesa(settings) -> Mpesa:
    """
    used to initiate mpesa instance
    :param settings:{
        "consumer_key": str,
        "consumer_secret": str,
        "business_shortcode": int,
        "online_passkey": str,
        "callback_url": str,
        "is_live": bool
    }
    :return: Mpesa instance

    """
    callback_url = settings["callback_url"] + \
        "/api/method/gch_custom.services.confirm_stk_request"
    consumer_key = settings["consumer_key"]
    consumer_secret = settings["consumer_secret"]
    business_shortcode = settings["business_shortcode"]
    online_passkey = settings["online_passkey"]
    callback_url = callback_url
    till_number = settings["till_number"]
    is_live = settings["is_live"]

    mpesa = Mpesa(consumer_key, consumer_secret, callback_url,
                  business_shortcode, till_number, online_passkey, is_live)

    mpesa._getAuthToken()

    return mpesa


def get_mpesa_settings(branch: str):
    """
    used to get mpesa settings for a particular branch
    :param branch: str
    :return: dict {
        "consumer_key": str,
        "consumer_secret": str,
        "business_shortcode": str,
        "online_passkey": str,
        "callback_url": str,
        "is_live": bool
    }
    """
    name = frappe.db.get_value(
        "Mpesa Settings", {"branch": branch}, ["name"])
    mpesa_settings = frappe.get_doc(
        "Mpesa Settings", name)
    consumer_key = mpesa_settings.consumer_key
    security_credential = mpesa_settings.security_credential
    consumer_secret = mpesa_settings.get_password("consumer_secret")
    business_shortcode = mpesa_settings.business_shortcode
    online_passkey = mpesa_settings.get_password("online_passkey")
    callback_url = mpesa_settings.callback_url
    sandbox = mpesa_settings.sandbox
    initiator = mpesa_settings.initiator_name
    till_number = mpesa_settings.till_number
    is_live = sandbox == 0
    client_id = mpesa_settings.payment_processor_client_id

    settings = {
        "name": name,
        "consumer_key": consumer_key,
        "consumer_secret": consumer_secret,
        "business_shortcode": business_shortcode,
        "online_passkey": online_passkey,
        "callback_url": callback_url,
        "till_number": till_number,
        "initiator": initiator,
        "security_credential": security_credential,
        "is_live": is_live,
        "client_id": client_id
    }

    return settings
