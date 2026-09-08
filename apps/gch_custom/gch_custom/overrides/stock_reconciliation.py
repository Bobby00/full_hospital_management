from erpnext.stock.doctype.stock_reconciliation.stock_reconciliation import StockReconciliation

import frappe
from frappe import _, msgprint
from frappe.utils import cint, cstr, flt, getdate, date_diff

import erpnext
from erpnext.accounts.utils import get_company_default
from erpnext.controllers.stock_controller import StockController
from erpnext.stock.doctype.batch.batch import get_batch_qty
from erpnext.stock.doctype.serial_no.serial_no import get_serial_nos
from erpnext.stock.utils import get_stock_balance

from frappe.desk.reportview import get_filters_cond, get_match_cond


class OpeningEntryAccountError(frappe.ValidationError): pass
class EmptyStockReconciliationItemsError(frappe.ValidationError): pass

class GCHStockReconciliation(StockReconciliation):
	def __init__(self, *args, **kwargs):
		super(StockReconciliation, self).__init__(*args, **kwargs)
		self.head_row = ["Item Code", "Warehouse", "Quantity", "Valuation Rate"]

	def validate(self):
		if not self.expense_account:
			self.expense_account = frappe.get_cached_value('Company',  self.company,  "stock_adjustment_account")
		if not self.cost_center:
			self.cost_center = frappe.get_cached_value('Company',  self.company,  "cost_center")
		self.validate_posting_time()
		self.remove_items_with_no_change()
		self.validate_data()
		self.validate_expense_account()
		self.validate_customer_provided_item()
		self.set_zero_value_for_customer_provided_items()
		self.clean_serial_nos()
		self.set_total_qty_and_amount()
		self.validate_putaway_capacity()

		if self._action=="submit":
			self.make_batches('warehouse')

		
	

	def on_submit(self):
		self.update_stock_ledger()
		self.make_gl_entries()
		self.repost_future_sle_and_gle()

		from erpnext.stock.doctype.serial_no.serial_no import update_serial_nos_after_submit
		update_serial_nos_after_submit(self, "items")
		
		# Custom script that removes stock count from previous active batches
		for i in self.items:
			if i.batch_no:
				"""Returns the oldest batch and qty for the given item_code and warehouse"""
				batches = get_batch_qty(item_code=i.item_code, warehouse=i.warehouse)

				batches_dates = [[batch, frappe.db.get_value('Batch', i.batch_no, 'creation')] for batch in batches]

				doc = frappe.db.get_list("Batch", filters= {"item": i.item_code}, fields=['name', 'disabled', 'expiry_date'])
				print("\n\n\n", doc, "Custom get list", "\n\n\n")

				# Checking for disabled and expired batches
				bad_batch_buffer = []
				for d in doc:
					if (date_diff(d.expiry_date, getdate()) < 0):
						bad_batch_buffer.append(d.name)
					elif d.disabled == 1:
						bad_batch_buffer.append(d.name)
				
				for bad_batch in bad_batch_buffer:
					for b in batches_dates:
						if bad_batch == b[0].batch_no:
							batches_dates.remove(b)

				count = 0

				# removing latest active batch from list previous active batches


				print("\n\n\n", batches_dates, "Not popped\n\n\n")

				for batch in batches_dates:
					# Skipping latest active batch from list previous active batches
					if (batch[0].batch_no) == i.batch_no:
						pass
					else:
						print(batch[0], "Batch here \n\n\n")
						count = count + 1
						print(count)
						company = frappe.db.get_value('Stock Ledger Entry', dict(
							item_code=i.item_code,
							batch_no=i.batch_no,
							warehouse=i.warehouse
						), ['company'])

						print(i.item_code)
						print(batch[0].qty)
						print(i.warehouse)
						print(batch[0].batch_no)
						print(batches_dates[-1][0].batch_no, "\n\n\n")

						if(batch[0].qty > 0):
							stock_entry = frappe.get_doc(dict(
								doctype='Stock Entry',
								purpose='Material Issue',
								owner='System Generated',
								company=company,
								items=[
									dict(
										item_code=i.item_code,
										qty=batch[0].qty,
										s_warehouse=i.warehouse,
										batch_no=batch[0].batch_no
									),
								]
							))
							stock_entry.set_stock_entry_type()
							stock_entry.insert()
							stock_entry.submit()

							print(stock_entry)


						# Subtracting quantity removed from prev batches
						# doc = frappe.get_doc("Batch", batch[0].batch_no)
						# doc.batch_qty = int(doc.batch_qty - batch[0].qty)
						# doc.save()
				
				# # Disabling and zeroing out previous batches
				if (len(batches_dates) > 0):
					pop_latest_batch = [batches_dates.pop()]

				print(batches_dates, "Popped")
				# for batch in batches_dates:
				# 	print("oya\n\n", batch[0].batch_no, "\n\n oya")
				# 	doc = frappe.get_doc("Batch", batch[0].batch_no)
				# 	# doc.disabled_stock_material_issue = stock_entry.name
				# 	doc.save()

			# Ensuring bin card qty and batch number qty match
			print(i.item_code, i.warehouse, i.qty)
			bin_doc = frappe.get_doc("Bin", {"item_code": i.item_code, "warehouse": i.warehouse})

			if int(bin_doc.actual_qty) != int(i.qty):
				bin_doc.actual_qty = int(i.qty)
				bin_doc.projected_qty =  int(i.qty) + int(bin_doc.reserved_qty) + int(bin_doc.ordered_qty) + int(bin_doc.indented_qty) + int(bin_doc.planned_qty) + int(bin_doc.projected_qty) + int(bin_doc.reserved_qty_for_production) + int(bin_doc.reserved_qty_for_sub_contract)
				bin_doc.stock_value = int(i.qty) * bin_doc.valuation_rate + 100000
				bin_doc.save(ignore_permissions=True)
			
			print(bin_doc, "BIn here.......")


	def on_cancel(self):
		self.ignore_linked_doctypes = ('GL Entry', 'Stock Ledger Entry', 'Repost Item Valuation')
		self.make_sle_on_cancel()
		self.make_gl_entries_on_cancel()
		self.repost_future_sle_and_gle()

	def remove_items_with_no_change(self):
		"""Remove items if qty or rate is not changed"""
		self.difference_amount = 0.0
		def _changed(item):
			item_dict = get_stock_balance_for(item.item_code, item.warehouse,
				self.posting_date, self.posting_time, batch_no=item.batch_no)

			if ((item.qty is None or item.qty==item_dict.get("qty")) and
				(item.valuation_rate is None or item.valuation_rate==item_dict.get("rate")) and
				(not item.serial_no or (item.serial_no == item_dict.get("serial_nos")) )):
				return False
			else:
				# set default as current rates
				if item.qty is None:
					item.qty = item_dict.get("qty")

				if item.valuation_rate is None:
					item.valuation_rate = item_dict.get("rate")

				if item_dict.get("serial_nos"):
					item.current_serial_no = item_dict.get("serial_nos")
					if self.purpose == "Stock Reconciliation" and not item.serial_no:
						item.serial_no = item.current_serial_no

				item.current_qty = item_dict.get("qty")
				item.current_valuation_rate = item_dict.get("rate")
				self.difference_amount += (flt(item.qty, item.precision("qty")) * \
					flt(item.valuation_rate or item_dict.get("rate"), item.precision("valuation_rate")) \
					- flt(item_dict.get("qty"), item.precision("qty")) * flt(item_dict.get("rate"), item.precision("valuation_rate")))
				return True

		items = list(filter(lambda d: _changed(d), self.items))

		if not items:
			frappe.throw(_("None of the items have any change in quantity or value."),
				EmptyStockReconciliationItemsError)

		elif len(items) != len(self.items):
			self.items = items
			for i, item in enumerate(self.items):
				item.idx = i + 1
			frappe.msgprint(_("Removed items with no change in quantity or value."))

	def validate_data(self):
		def _get_msg(row_num, msg):
			return _("Row # {0}:").format(row_num+1) + " " + msg

		self.validation_messages = []
		item_warehouse_combinations = []

		default_currency = frappe.db.get_default("currency")

		for row_num, row in enumerate(self.items):
			# find duplicates
			key = [row.item_code, row.warehouse]
			for field in ['serial_no', 'batch_no']:
				if row.get(field):
					key.append(row.get(field))

			if key in item_warehouse_combinations:
				self.validation_messages.append(_get_msg(row_num, _("Duplicate entry")))
			else:
				item_warehouse_combinations.append(key)

			self.validate_item(row.item_code, row)

			# validate warehouse
			if not frappe.db.get_value("Warehouse", row.warehouse):
				self.validation_messages.append(_get_msg(row_num, _("Warehouse not found in the system")))

			# if both not specified
			if row.qty in ["", None] and row.valuation_rate in ["", None]:
				self.validation_messages.append(_get_msg(row_num,
					_("Please specify either Quantity or Valuation Rate or both")))

			# do not allow negative quantity
			# if flt(row.qty) < 0:
			# 	self.validation_messages.append(_get_msg(row_num,
			# 		_("Negative Quantity is not allowed")))

			# do not allow negative valuation
			if flt(row.valuation_rate) < 0:
				self.validation_messages.append(_get_msg(row_num,
					_("Negative Valuation Rate is not allowed")))

			if row.qty and row.valuation_rate in ["", None]:
				row.valuation_rate = get_stock_balance(row.item_code, row.warehouse,
							self.posting_date, self.posting_time, with_valuation_rate=True)[1]
				if not row.valuation_rate:
					# try if there is a buying price list in default currency
					buying_rate = frappe.db.get_value("Item Price", {"item_code": row.item_code,
						"buying": 1, "currency": default_currency}, "price_list_rate")
					if buying_rate:
						row.valuation_rate = buying_rate

					else:
						# get valuation rate from Item
						row.valuation_rate = frappe.get_value('Item', row.item_code, 'valuation_rate')

		# throw all validation messages
		if self.validation_messages:
			for msg in self.validation_messages:
				msgprint(msg)

			raise frappe.ValidationError(self.validation_messages)

	def validate_item(self, item_code, row):
		from erpnext.stock.doctype.item.item import (
			validate_cancelled_item,
			validate_end_of_life,
			validate_is_stock_item,
		)

		# using try except to catch all validation msgs and display together

		try:
			item = frappe.get_doc("Item", item_code)

			# end of life and stock item
			validate_end_of_life(item_code, item.end_of_life, item.disabled)
			validate_is_stock_item(item_code, item.is_stock_item)

			# item should not be serialized
			if item.has_serial_no and not row.serial_no and not item.serial_no_series:
				raise frappe.ValidationError(_("Serial no(s) required for serialized item {0}").format(item_code))

			# item managed batch-wise not allowed
			if item.has_batch_no and not row.batch_no and not item.create_new_batch:
				raise frappe.ValidationError(_("Batch no is required for batched item {0}").format(item_code))

			# docstatus should be < 2
			validate_cancelled_item(item_code, item.docstatus)

		except Exception as e:
			self.validation_messages.append(_("Row #") + " " + ("%d: " % (row.idx)) + cstr(e))

	def update_stock_ledger(self):
		"""	find difference between current and expected entries
			and create stock ledger entries based on the difference"""
		from erpnext.stock.stock_ledger import get_previous_sle

		sl_entries = []
		has_serial_no = False
		has_batch_no = False
		for row in self.items:
			item = frappe.get_doc("Item", row.item_code)
			if item.has_batch_no:
				has_batch_no = True

			if item.has_serial_no or item.has_batch_no:
				has_serial_no = True
				self.get_sle_for_serialized_items(row, sl_entries)
			else:
				if row.serial_no or row.batch_no:
					frappe.throw(_("Row #{0}: Item {1} is not a Serialized/Batched Item. It cannot have a Serial No/Batch No against it.") \
						.format(row.idx, frappe.bold(row.item_code)))

				previous_sle = get_previous_sle({
					"item_code": row.item_code,
					"warehouse": row.warehouse,
					"posting_date": self.posting_date,
					"posting_time": self.posting_time
				})

				if previous_sle:
					if row.qty in ("", None):
						row.qty = previous_sle.get("qty_after_transaction", 0)

					if row.valuation_rate in ("", None):
						row.valuation_rate = previous_sle.get("valuation_rate", 0)

				if row.qty and not row.valuation_rate and not row.allow_zero_valuation_rate:
					frappe.throw(_("Valuation Rate required for Item {0} at row {1}").format(row.item_code, row.idx))

				if ((previous_sle and row.qty == previous_sle.get("qty_after_transaction")
					and (row.valuation_rate == previous_sle.get("valuation_rate") or row.qty == 0))
					or (not previous_sle and not row.qty)):
						continue

				sl_entries.append(self.get_sle_for_items(row))

		if sl_entries:
			if has_serial_no:
				sl_entries = self.merge_similar_item_serial_nos(sl_entries)

			allow_negative_stock = False
			if has_batch_no:
				allow_negative_stock = True

			self.make_sl_entries(sl_entries, allow_negative_stock=allow_negative_stock)

		if has_serial_no and sl_entries:
			self.update_valuation_rate_for_serial_no()

	def get_sle_for_serialized_items(self, row, sl_entries):
		from erpnext.stock.stock_ledger import get_previous_sle

		serial_nos = get_serial_nos(row.serial_no)


		# To issue existing serial nos
		if row.current_qty and (row.current_serial_no or row.batch_no):
			args = self.get_sle_for_items(row)
			args.update({
				'actual_qty': -1 * row.current_qty,
				'serial_no': row.current_serial_no,
				'batch_no': row.batch_no,
				'valuation_rate': row.current_valuation_rate
			})

			if row.current_serial_no:
				args.update({
					'qty_after_transaction': 0,
				})

			sl_entries.append(args)

		qty_after_transaction = 0
		for serial_no in serial_nos:
			args = self.get_sle_for_items(row, [serial_no])

			previous_sle = get_previous_sle({
				"item_code": row.item_code,
				"posting_date": self.posting_date,
				"posting_time": self.posting_time,
				"serial_no": serial_no
			})

			if previous_sle and row.warehouse != previous_sle.get("warehouse"):
				# If serial no exists in different warehouse

				warehouse = previous_sle.get("warehouse", '') or row.warehouse

				if not qty_after_transaction:
					qty_after_transaction = get_stock_balance(row.item_code,
						warehouse, self.posting_date, self.posting_time)

				qty_after_transaction -= 1

				new_args = args.copy()
				new_args.update({
					'actual_qty': -1,
					'qty_after_transaction': qty_after_transaction,
					'warehouse': warehouse,
					'valuation_rate': previous_sle.get("valuation_rate")
				})

				sl_entries.append(new_args)

		if row.qty:
			args = self.get_sle_for_items(row)

			args.update({
				'actual_qty': row.qty,
				'incoming_rate': row.valuation_rate,
				'valuation_rate': row.valuation_rate
			})

			sl_entries.append(args)
		
		# Changed fetching of serial codes to blank -- robert (Temporarily passing blank since serials are not intergrated yet)
		# if serial_nos == get_serial_nos(row.current_serial_no):

		if serial_nos == get_serial_nos(row.current_serial_no):
			# update valuation rate
			self.update_valuation_rate_for_serial_nos(row, serial_nos)

	def update_valuation_rate_for_serial_no(self):
		for d in self.items:
			if not d.serial_no: continue

			serial_nos = get_serial_nos(d.serial_no)
			self.update_valuation_rate_for_serial_nos(d, serial_nos)

	def update_valuation_rate_for_serial_nos(self, row, serial_nos):
		valuation_rate = row.valuation_rate if self.docstatus == 1 else row.current_valuation_rate
		if valuation_rate is None:
			return

		for d in serial_nos:
			frappe.db.set_value("Serial No", d, 'purchase_rate', valuation_rate)

	def get_sle_for_items(self, row, serial_nos=None):
		"""Insert Stock Ledger Entries"""

		if not serial_nos and row.serial_no:
			serial_nos = get_serial_nos(row.serial_no)

		data = frappe._dict({
			"doctype": "Stock Ledger Entry",
			"item_code": row.item_code,
			"warehouse": row.warehouse,
			"posting_date": self.posting_date,
			"posting_time": self.posting_time,
			"voucher_type": self.doctype,
			"voucher_no": self.name,
			"voucher_detail_no": row.name,
			"company": self.company,
			"stock_uom": frappe.db.get_value("Item", row.item_code, "stock_uom"),
			"is_cancelled": 1 if self.docstatus == 2 else 0,
			"serial_no": '\n'.join(serial_nos) if serial_nos else '',
			"batch_no": row.batch_no,
			"valuation_rate": flt(row.valuation_rate, row.precision("valuation_rate"))
		})

		if not row.batch_no:
			data.qty_after_transaction = flt(row.qty, row.precision("qty"))

		if self.docstatus == 2 and not row.batch_no:
			if row.current_qty:
				data.actual_qty = -1 * row.current_qty
				data.qty_after_transaction = flt(row.current_qty)
				data.previous_qty_after_transaction = flt(row.qty)
				data.valuation_rate = flt(row.current_valuation_rate)
				data.stock_value = data.qty_after_transaction * data.valuation_rate
				data.stock_value_difference = -1 * flt(row.amount_difference)
			else:
				data.actual_qty = row.qty
				data.qty_after_transaction = 0.0
				data.valuation_rate = flt(row.valuation_rate)
				data.stock_value_difference = -1 * flt(row.amount_difference)

		return data

	def make_sle_on_cancel(self):
		sl_entries = []

		has_serial_no = False
		for row in self.items:
			if row.serial_no or row.batch_no or row.current_serial_no:
				has_serial_no = True
				serial_nos = ''
				if row.current_serial_no:
					serial_nos = get_serial_nos(row.current_serial_no)

				sl_entries.append(self.get_sle_for_items(row, serial_nos))
			else:
				sl_entries.append(self.get_sle_for_items(row))

		if sl_entries:
			if has_serial_no:
				sl_entries = self.merge_similar_item_serial_nos(sl_entries)

			sl_entries.reverse()
			allow_negative_stock = cint(frappe.db.get_single_value("Stock Settings", "allow_negative_stock"))
			self.make_sl_entries(sl_entries, allow_negative_stock=allow_negative_stock)


	def merge_similar_item_serial_nos(self, sl_entries):
		# If user has put the same item in multiple row with different serial no
		new_sl_entries = []
		merge_similar_entries = {}

		for d in sl_entries:
			if not d.serial_no or flt(d.get("actual_qty")) < 0:
				new_sl_entries.append(d)
				continue

			key = (d.item_code, d.warehouse)
			if key not in merge_similar_entries:
				d.total_amount = (d.actual_qty * d.valuation_rate)
				merge_similar_entries[key] = d
			elif d.serial_no:
				data = merge_similar_entries[key]
				data.actual_qty += d.actual_qty
				data.qty_after_transaction += d.qty_after_transaction

				data.total_amount += (d.actual_qty * d.valuation_rate)
				data.valuation_rate = (data.total_amount) / data.actual_qty
				data.serial_no += '\n' + d.serial_no

				data.incoming_rate = (data.total_amount) / data.actual_qty

		for key, value in merge_similar_entries.items():
			new_sl_entries.append(value)

		return new_sl_entries

	def get_gl_entries(self, warehouse_account=None):
		if not self.cost_center:
			msgprint(_("Please enter Cost Center"), raise_exception=1)

		return super(StockReconciliation, self).get_gl_entries(warehouse_account,
			self.expense_account, self.cost_center)

	def validate_expense_account(self):
		if not cint(erpnext.is_perpetual_inventory_enabled(self.company)):
			return

		if not self.expense_account:
			frappe.throw(_("Please enter Expense Account"))
		elif self.purpose == "Opening Stock" or not frappe.db.sql("""select name from `tabStock Ledger Entry` limit 1"""):
			if frappe.db.get_value("Account", self.expense_account, "report_type") == "Profit and Loss":
				frappe.throw(_("Difference Account must be a Asset/Liability type account, since this Stock Reconciliation is an Opening Entry"), OpeningEntryAccountError)

	def set_zero_value_for_customer_provided_items(self):
		changed_any_values = False

		for d in self.get('items'):
			is_customer_item = frappe.db.get_value('Item', d.item_code, 'is_customer_provided_item')
			if is_customer_item and d.valuation_rate:
				d.valuation_rate = 0.0
				changed_any_values = True

		if changed_any_values:
			msgprint(_("Valuation rate for customer provided items has been set to zero."),
				title=_("Note"), indicator="blue")


	def set_total_qty_and_amount(self):
		for d in self.get("items"):
			d.amount = flt(d.qty, d.precision("qty")) * flt(d.valuation_rate, d.precision("valuation_rate"))
			d.current_amount = (flt(d.current_qty,
				d.precision("current_qty")) * flt(d.current_valuation_rate, d.precision("current_valuation_rate")))

			d.quantity_difference = flt(d.qty) - flt(d.current_qty)
			d.amount_difference = flt(d.amount) - flt(d.current_amount)

	def get_items_for(self, warehouse):
		self.items = []
		for item in get_items(warehouse, self.posting_date, self.posting_time, self.company):
			self.append("items", item)

	def submit(self):
		if len(self.items) > 100:
			msgprint(_("The task has been enqueued as a background job. In case there is any issue on processing in background, the system will add a comment about the error on this Stock Reconciliation and revert to the Draft stage"))
			self.queue_action('submit', timeout=2000)
		else:
			self._submit()

	def cancel(self):
		if len(self.items) > 100:
			msgprint(_("The task has been enqueued as a background job. In case there is any issue on processing in background, the system will add a comment about the error on this Stock Reconciliation and revert to the Submitted stage"))
			self.queue_action('cancel', timeout=2000)
		else:
			self._cancel()

@frappe.whitelist()
def get_items(warehouse, item_group, posting_date, posting_time, company, item_code=None, ignore_empty_stock=False):
	ignore_empty_stock = cint(ignore_empty_stock)
	items = [frappe._dict({
		'item_code': item_code,
		'warehouse': warehouse
	})]

	if not item_code:
		items = get_items_for_stock_reco(item_group, warehouse, company)

	res = []
	itemwise_batch_data = get_itemwise_batch(warehouse, posting_date, company, item_code)


	for d in items:
		if d.item_code in itemwise_batch_data:
			valuation_rate = get_stock_balance(d.item_code, d.warehouse,
				posting_date, posting_time, with_valuation_rate=True)[1]

			for row in itemwise_batch_data.get(d.item_code):
				if ignore_empty_stock and not row.qty:
					continue

				args = get_item_data(row, row.qty, valuation_rate)
				res.append(args)
		else:
			stock_bal = get_stock_balance(d.item_code, d.warehouse, posting_date, posting_time,
				with_valuation_rate=True , with_serial_no=cint(d.has_serial_no))
			qty, valuation_rate, serial_no = stock_bal[0], stock_bal[1], stock_bal[2] if cint(d.has_serial_no) else ''

			if ignore_empty_stock and not stock_bal[0]:
					continue

			args = get_item_data(d, qty, valuation_rate, serial_no)

			res.append(args)

	if (len(res) < 1):
		return "False"
	else:

		# Fetching only the latest batch for display on recon table
		item_and_latest_batch_list = []
		bad_batch_buffer = []
		unique_item_list = {}
		for item in res:
			unique_item_list.setdefault(item['item_code'], []).append(item)

		for i in unique_item_list:
			doc = frappe.db.get_list("Batch", 
				filters= {
					'item' : i,
					'disabled' : 0,
					
				},
				fields = ["item", "name", "batch_qty", "expiry_date", "creation"],
				order_by='creation desc',
				)

			# Filtering expired batches
			for batch_id in doc:
				if (date_diff(batch_id.expiry_date, getdate()) < 0):
					bad_batch_buffer.append(batch_id.name)

			
			for bad_batch in bad_batch_buffer:
				for batch_id in doc:
					if bad_batch == batch_id.name:
						# Remove bad batches from doc
						doc.remove(doc[doc.index(batch_id)])

			if(len(doc) > 0):
				item_and_latest_batch_list.append(doc[0])

			
			# print("\n\n\n\n", bad_batch_buffer, "BAD BATCH JAS\n\n\n\n",)
		print("\n\n\n\n", item_and_latest_batch_list, "HEHAJSND JAS\n\n\n\n",)
		
		
		# Removing duplicated items because of multiple batches
		no_duplicate_result = list(
			{
				dictionary['item_code']: dictionary
				for dictionary in res
			}.values()
		)

		# Comparing list of latest item batch to list of no duplicate items and changing the batch to latest
		for j in item_and_latest_batch_list:
			for i in no_duplicate_result:
				if j.item == i["item_code"]:
					i["batch_no"] = j.name
		
		for i in no_duplicate_result:
			if i["batch_no"] in bad_batch_buffer:
				i["batch_no"] = None

		# Checking for bad batches in the no duplicates list and making it empty 



		print("\n\n\n", no_duplicate_result, "\n\n\n Results")

		print("\n\n\n",bad_batch_buffer, "\n\n\n Bad batch buffer")

		print(item_and_latest_batch_list, "\n\n\n Item latest batch \n\n\n")
		# print(unique_item_list)

		return no_duplicate_result
	

def get_items_for_stock_reco(item_group, warehouse, company):
	lft, rgt = frappe.db.get_value("Warehouse", warehouse, ["lft", "rgt"])
	drug_group = str(item_group)

	if drug_group == "All Item Groups":
		items = frappe.db.sql(f"""
			select
				i.name as item_code, i.item_name, bin.warehouse as warehouse, i.has_serial_no, i.has_batch_no
			from
				tabBin bin, tabItem i
			where
				i.name = bin.item_code
				and IFNULL(i.disabled, 0) = 0
				and i.is_stock_item = 1
				and i.has_variants = 0
				and exists(
					select name from `tabWarehouse` where lft >= {lft} and rgt <= {rgt} and name = bin.warehouse
				)
		""", as_dict=1)

		items += frappe.db.sql("""
			select
				i.name as item_code, i.item_name, id.default_warehouse as warehouse, i.has_serial_no, i.has_batch_no
			from
				tabItem i, `tabItem Default` id
			where
				i.name = id.parent
				and exists(
					select name from `tabWarehouse` where lft >= %s and rgt <= %s and name=id.default_warehouse
				)
				and i.is_stock_item = 1
				and i.has_variants = 0
				and IFNULL(i.disabled, 0) = 0
				and id.company = %s
			group by i.name
		""", (lft, rgt, company), as_dict=1)
	else:
		items = frappe.db.sql(f"""
			select
				i.name as item_code, i.item_name, bin.warehouse as warehouse, i.has_serial_no, i.has_batch_no
			from
				tabBin bin, tabItem i
			where
				i.name = bin.item_code
				and i.item_group in ("{drug_group}")
				and IFNULL(i.disabled, 0) = 0
				and i.is_stock_item = 1
				and i.has_variants = 0
				and exists(
					select name from `tabWarehouse` where lft >= {lft} and rgt <= {rgt} and name = bin.warehouse
				)
		""", as_dict=1)

		items += frappe.db.sql("""
			select
				i.name as item_code, i.item_name, id.default_warehouse as warehouse, i.has_serial_no, i.has_batch_no
			from
				tabItem i, `tabItem Default` id
			where
				i.name = id.parent
				and exists(
					select name from `tabWarehouse` where lft >= %s and rgt <= %s and name=id.default_warehouse
				)
				and i.is_stock_item = 1
				and i.item_group in ("{drug_group}")
				and i.has_variants = 0
				and IFNULL(i.disabled, 0) = 0
				and id.company = %s
			group by i.name
	 	""", (lft, rgt, company), as_dict=1)


	# remove duplicates
	# check if item-warehouse key extracted from each entry exists in set iw_keys
	# and update iw_keys
	iw_keys = set()
	items = [item for item in items if [(item.item_code, item.warehouse) not in iw_keys, iw_keys.add((item.item_code, item.warehouse))][0]]

	# for item in items:
	# 	# Fetch group for each item code
	# 	item_group_2 = frappe.db.get_value("Item", item["item_code"], "item_group")
	# 	item["item_group"] = item_group_2
	# 	print(item, "\n\n Item here \n\n")
	return items


def get_item_data(row, qty, valuation_rate, serial_no=None):
	return {
		'item_group': row.item_group,
		'item_code': row.item_code,
		'warehouse': row.warehouse,
		'qty': qty,
		'item_name': row.item_name,
		'valuation_rate': valuation_rate,
		'current_qty': qty,
		'current_valuation_rate': valuation_rate,
		'current_serial_no': serial_no,
		'serial_no': serial_no,
		'batch_no': row.get('batch_no')
	}

@frappe.whitelist(allow_guest=True)
def get_item_groups(item_code):
	item_group = frappe.db.get_value("Item", item_code, "item_group")
	return item_group

	
def get_itemwise_batch(warehouse, posting_date, company, item_code=None):
	from erpnext.stock.report.batch_wise_balance_history.batch_wise_balance_history import execute
	itemwise_batch_data = {}

	filters = frappe._dict({
		'warehouse': warehouse,
		'from_date': posting_date,
		'to_date': posting_date,
		'company': company,
	})

	if item_code:
		filters.item_code = item_code

	columns, data = execute(filters)

	# print(data, "\n\n\n\ data \n\n\n")

	for row in data:
		itemwise_batch_data.setdefault(row[0], []).append(frappe._dict({
			'item_code': row[0],
			'warehouse': warehouse,
			'qty': row[8],
			'item_name': row[1],
			'batch_no': row[4]
		}))
	# print(itemwise_batch_data, "\n\n\n\ Item  wise batch data")

	return itemwise_batch_data

@frappe.whitelist()
def get_stock_balance_for(item_code, warehouse,
	posting_date, posting_time, batch_no=None, with_valuation_rate= True):
	frappe.has_permission("Stock Reconciliation", "write", throw = True)

	item_dict = frappe.db.get_value("Item", item_code,
		["has_serial_no", "has_batch_no"], as_dict=1)

	if not item_dict:
		# In cases of data upload to Items table
		msg = _("Item {} does not exist.").format(item_code)
		frappe.throw(msg, title=_("Missing"))

	serial_nos = ""
	with_serial_no = True if item_dict.get("has_serial_no") else False
	data = get_stock_balance(item_code, warehouse, posting_date, posting_time,
		with_valuation_rate=with_valuation_rate, with_serial_no=with_serial_no)

	if with_serial_no:
		qty, rate, serial_nos = data
	else:
		qty, rate = data

	if item_dict.get("has_batch_no"):
		qty = get_batch_qty(batch_no, warehouse, posting_date=posting_date, posting_time=posting_time) or 0

	return {
		'qty': qty,
		'rate': rate,
		'serial_nos': serial_nos
	}

@frappe.whitelist()
def get_difference_account(purpose, company):
	if purpose == 'Stock Reconciliation':
		account = get_company_default(company, "stock_adjustment_account")
	else:
		account = frappe.db.get_value('Account', {'is_group': 0,
			'company': company, 'account_type': 'Temporary'}, 'name')

	return account


# Custom fetch to filter out expired batches
@frappe.whitelist(allow_guest=True)
def filter_out_expired_batches(doctype, txt, searchfield, start, page_len, filters):
	doctype = "Batch"
	conditions = []

	today_date = getdate()
 
	doc = frappe.db.sql(
		"""
		select name, batch_qty, expiry_date from `tabBatch`
		where disabled=0
			and ({key} like %(txt)s
				or name like %(txt)s)
			{fcond} {mcond}
		limit %(page_len)s offset %(start)s""".format(
			**{
				"fields": "name, batch_qty, expiry_date",
				"key": searchfield,
				"fcond": get_filters_cond(doctype, filters, conditions),
				"mcond": get_match_cond(doctype),
			}
		),
		{
			"txt": "%%%s%%" % txt,
			"_txt": txt.replace("%", ""),
			"start": start,
			"page_len": page_len,
		},
	)

	doc_list = list(doc)

	for item in doc:
		if len(item) == 3:
			if (date_diff(item[2], getdate()) < 0):
				doc_list.remove(item)

	doc_tuple = tuple(doc_list)

	return doc_tuple