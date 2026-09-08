import frappe
from frappe import _
from frappe.model.document import Document
from erpnext.healthcare.doctype.healthcare_settings.healthcare_settings import get_account
from frappe.utils import flt, get_link_to_form


class GCHInpatientMedicationEntry(Document):
    def on_submit(self):
        self.validate_medication_orders()
        print("SUBMITTTINNG.......................")
        success_msg = ""
        if self.update_stock:
            stock_entry = self.process_stock()
            success_msg += _('Stock Entry {0} created and ').format(
                frappe.bold(get_link_to_form('Stock Entry', stock_entry)))

        self.update_medication_orders()
        success_msg += _('Inpatient Medication Orders updated successfully')
        frappe.msgprint(success_msg, title=_('Success'), indicator='green')

    def validate_medication_orders(self):
        for entry in self.medication_orders:
            docstatus, is_completed = frappe.db.get_value('Inpatient Medication Order Entry', entry.against_imoe,
                ['docstatus', 'is_completed'])

            if docstatus == 2:
                frappe.throw(_('Row {0}: Cannot create Inpatient Medication Entry against cancelled Inpatient Medication Order {1}').format(
                    entry.idx, get_link_to_form(entry.against_imo)))

            if is_completed:
                frappe.throw(_('Row {0}: This Medication Order is already marked as completed').format(
                    entry.idx))
                
    def process_stock(self):
        allow_negative_stock = frappe.db.get_single_value('Stock Settings', 'allow_negative_stock')
        if not allow_negative_stock:
            self.check_stock_qty()

        return self.make_stock_entry()

    def make_stock_entry(self):
            stock_entry = frappe.new_doc('Stock Entry')
            stock_entry.purpose = 'Material Issue'
            stock_entry.set_stock_entry_type()
            stock_entry.from_warehouse = self.warehouse
            stock_entry.company = self.company
            stock_entry.inpatient_medication_entry = self.name
            cost_center = frappe.get_cached_value('Company',  self.company,  'cost_center')
            expense_account = get_account(None, 'expense_account', 'Healthcare Settings', self.company)

            for entry in self.medication_orders:
                se_child = stock_entry.append('items')
                se_child.item_code = entry.drug_code
                se_child.item_name = entry.drug_name
                se_child.uom = frappe.db.get_value('Item', entry.drug_code, 'stock_uom')
                se_child.stock_uom = se_child.uom
                se_child.qty = flt(entry.dosage)
                # in stock uom
                se_child.conversion_factor = 1
                se_child.cost_center = cost_center
                se_child.expense_account = expense_account
                # references
                se_child.patient = entry.patient
                se_child.inpatient_medication_entry_child = entry.name

            stock_entry.submit()
            return stock_entry.name
    
    def update_medication_orders(self, on_cancel=False):
        orders, order_entry_map = self.get_order_entry_map()
        # mark completion status
        is_completed = 1
        if on_cancel:
            is_completed = 0

        frappe.db.sql("""
            UPDATE `tabInpatient Medication Order Entry`
            SET is_completed = %(is_completed)s
            WHERE name IN %(orders)s
        """, {'orders': orders, 'is_completed': is_completed})

    def get_order_entry_map(self):
        # for marking order completion status
        orders = []
        # orders mapped
        order_entry_map = dict()

        for entry in self.medication_orders:
            orders.append(entry.against_imoe)
            parent = entry.against_imo
            if not order_entry_map.get(parent):
                order_entry_map[parent] = 0

            order_entry_map[parent] += 1

        return orders, order_entry_map
