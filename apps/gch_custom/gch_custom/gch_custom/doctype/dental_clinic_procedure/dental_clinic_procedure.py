# Copyright (c) 2022, Karani and contributors
# For license information, please see license.txt

import frappe

from frappe.model.document import Document

from frappe.desk.reportview import get_filters_cond, get_match_cond

class DentalClinicProcedure(Document):
	pass


@frappe.whitelist(allow_guest=True)
def fetch_procedure_price(**args):
	try:
		procedure_price = frappe.db.get_value("Item Price", {"item_code": args["item_code"], "price_list":"Standard Selling"}, ['price_list_rate'])

		return procedure_price
	
	except Exception as e:
		return e
	

@frappe.whitelist(allow_guest=True)
def show_procedure_and_price(doctype, txt, searchfield, start, page_len, filters):
	doctype = "Item"
	conditions = []
	

	procedure_doc = frappe.db.sql(
		"""
		select name, item_name
		from `tabItem`
		where ({key} like %(txt)s
			or item_name like %(txt)s)
		{fcond} {mcond}
		limit %(page_len)s offset %(start)s""".format(
			**{
				"fields": "name, item_name",
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

	procedure_and_price_list = []

	# Fetch price for each item
	for i in procedure_doc:
		price = frappe.get_value('Item Price', {"item_code": i[0], "price_list": "Standard Selling"}, ["price_list_rate"])

		procedure_and_price_list.append(i + ("______<b style='font-size: 13.3px;'>" + str(price),) )

		# print("================================", procedure_and_price_list, "=================================")


	print(tuple(procedure_and_price_list), "==================================")

	# price = (500,)

	# for i in procedure_doc:
	# 	print("======================",i + price, "==============================")

	# print("===========================",procedure_doc, "===========================")

	return tuple(procedure_and_price_list)
		
