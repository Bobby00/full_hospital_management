from erpnext.accounts.doctype.sales_invoice.sales_invoice import SalesInvoice
import frappe

from erpnext.setup.doctype.company.company import update_company_current_month_sales
from frappe.utils import (
    cint
)

from erpnext.healthcare.utils import manage_invoice_submit_cancel


class GCHSalesInvoice(SalesInvoice):
    def autoname(self):
        try:
            if (self.branch):
                from frappe.model.naming import make_autoname
                current_branch = frappe.get_doc("Branch", self.branch)

                if(self.is_inpatient == 1):
                    code = current_branch.inpatient_invoice_naming_series
                else:
                    code = current_branch.invoice_naming_series
                print("code", code)

                if not code:
                    frappe.log_error(
                        f"No Code added on the branch:{self.branch}", "Naming Series Error  /sales_invoice_overide.py")
                    code = "22.YY.MM.######"
                    self.naming_series = code
                    self.name = make_autoname(code)

                self.naming_series = code
                self.name = make_autoname(code)

        except Exception as e:
            frappe.log_error(
                e, "Naming Series Error  /sales_invoice_overide.py")
    def before_submit(self):
        print("BEFORE SUBMIT.......................")
        if self.mode_of_payment == "Cash":
            if self.grand_total != self.total_advance:
                frappe.throw("Please ensure the bill is paid in full")
            elif self.total_advance > self.grand_total:
                frappe.throw("Total Amount Paid Exceeds the Bill Amount. Please Confirm Payments")


    def validate(self):
        print("==================================================Not Javascript====================================================")
        try:
            print("Before save .............")
            if self.default_insurance is not None:
                doc = frappe.get_doc("Insurance Category", self.default_insurance)
                
                if doc.suspend:
                    frappe.throw("Please update insurance details! Insurance Category {0} is suspended").format(doc.name)

        except Exception as e:
            return e

    def on_submit(self):
        self.validate_pos_paid_amount()

        if not self.auto_repeat:
            frappe.get_doc('Authorization Control').validate_approving_authority(self.doctype,
                                                                                 self.company, self.base_grand_total, self)

        self.check_prev_docstatus()

        if self.is_return and not self.update_billed_amount_in_sales_order:
            # NOTE status updating bypassed for is_return
            self.status_updater = []

        self.update_status_updater_args()
        self.update_prevdoc_status()
        self.update_billing_status_in_dn()
        self.clear_unallocated_mode_of_payments()

        # Updating stock ledger should always be called after updating prevdoc status,
        # because updating reserved qty in bin depends upon updated delivered qty in SO
        # if self.update_stock == 1:
        # 	self.update_stock_ledger()

        # this sequence because outstanding may get -ve
        self.make_gl_entries()

        if self.update_stock == 1:
            self.repost_future_sle_and_gle()

        if not self.is_return:
            self.update_billing_status_for_zero_amount_refdoc("Delivery Note")
            self.update_billing_status_for_zero_amount_refdoc("Sales Order")
            self.check_credit_limit()

        self.update_serial_no()

        if not cint(self.is_pos) == 1 and not self.is_return:
            self.update_against_document_in_jv()

        self.update_time_sheet(self.name)

        if frappe.db.get_single_value('Selling Settings', 'sales_update_frequency') == "Each Transaction":
            update_company_current_month_sales(self.company)
            self.update_project()
        update_linked_doc(self.doctype, self.name,
                          self.inter_company_invoice_reference)

        print("GOT here!!!!!!!!!!!!!!!!!!!!!!!______________")

        # create the loyalty point ledger entry if the customer is enrolled in any loyalty program
        if not self.is_return and not self.is_consolidated and self.loyalty_program:
            self.make_loyalty_point_entry()
        elif self.is_return and self.return_against and not self.is_consolidated and self.loyalty_program:
            against_si_doc = frappe.get_doc(
                "Sales Invoice", self.return_against)
            against_si_doc.delete_loyalty_point_entry()
            against_si_doc.make_loyalty_point_entry()
        if self.redeem_loyalty_points and not self.is_consolidated and self.loyalty_points:
            self.apply_loyalty_points()

        # Healthcare Service Invoice.
        domain_settings = frappe.get_doc('Domain Settings')
        active_domains = [d.domain for d in domain_settings.active_domains]

        if "Healthcare" in active_domains:
            manage_invoice_submit_cancel(self, "on_submit")

        self.process_common_party_accounting()

        # try:
        #     current_encounter_exits = frappe.db.exists(
        #         'Patient Encounter', self.encounter)

        #     if current_encounter_exits:
        #         current_encounter = frappe.get_doc(
        #             "Patient Encounter", self.encounter)
        #         current_encounter.docstatus = 1
        #         current_encounter.insert(ignore_permissions=True)
        # except Exception as e:
        #     frappe.log_error(
        #         e, "closing invoice and encounter  /override/sales_invoice.py")
        #     pass


def update_linked_doc(doctype, name, inter_company_reference):

    if doctype in ["Sales Invoice", "Purchase Invoice"]:
        ref_field = "inter_company_invoice_reference"
    else:
        ref_field = "inter_company_order_reference"

    if inter_company_reference:
        frappe.db.set_value(doctype, inter_company_reference,
                            ref_field, name)
