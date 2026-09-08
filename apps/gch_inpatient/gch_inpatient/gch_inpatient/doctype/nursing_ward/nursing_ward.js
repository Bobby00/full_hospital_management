// Copyright (c) 2023, Redward and contributors
// For license information, please see license.txt

frappe.ui.form.on('Nursing Ward', {
	// refresh: function(frm) {

	// }
});

frappe.ui.form.on("Nursing Ward Charges",{
	item: async (frm, cdt, cdn) => {
		let child = locals[cdt][cdn];
		let item = child.item;

		// Set value of amount based on price list
		let item_price_data = await frappe.db.get_doc("Item Price", null,{
			item_code: item,
			price_list: "Standard Selling"
		});
		frappe.model.set_value(cdt, cdn, 'amount', item_price_data.price_list_rate ? item_price_data.price_list_rate : 1);
		
	}
})
