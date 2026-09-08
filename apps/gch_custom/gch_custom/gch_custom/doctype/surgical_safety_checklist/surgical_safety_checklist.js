// Copyright (c) 2023, eGerties Devs and contributors
// For license information, please see license.txt

frappe.ui.form.on('SURGICAL SAFETY CHECKLIST', {
	// refresh: function(frm) {

	// }
    before_submit: (frm) => {
        console.log("Submitting")
        // Setting Procedure End Time on submission of the Document
        frm.set_value("procedure_end_time", frappe.datetime.now_time())
    }
});
