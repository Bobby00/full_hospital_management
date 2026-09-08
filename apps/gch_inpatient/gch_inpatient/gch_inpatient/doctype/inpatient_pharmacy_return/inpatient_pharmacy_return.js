// Copyright (c) 2024, Redward and contributors
// For license information, please see license.txt

frappe.ui.form.on('Inpatient Pharmacy Return', {
	// refresh: function(frm) {

	// }

	on_submit: function(frm){
		// Return Items to pharmacy on submit
		frappe.call({
			method: "gch_inpatient.services.return_ip_items",
			args: {
				inpatient_pharmacy_return: frm.doc.name,
			},
			callback: (res)=>{
				console.log("done!");
			}
		})
	}
});
