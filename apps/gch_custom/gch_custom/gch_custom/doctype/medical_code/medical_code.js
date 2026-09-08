// Copyright (c) 2022, Karani and contributors
// For license information, please see license.txt

frappe.ui.form.on('Medical Code', {


	refresh: function(frm) {
        console.log("Refreshing.............")
	},
    onload: function(frm) {
        console.log("Loading................")
    },
    validate: function(frm) {
        // Checking whether the code being saved already belongs to a specific medical code standard
        console.log("Validating...............")

        let medical_code_standard = frm.doc.medical_code_standard
        let code = frm.doc.code
        let parent_code = frm.doc.parent_medical_code

        console.log(medical_code_standard, code, parent_code)

        frappe.call({
            method: "gch_custom.services.rest.check_if_code_exists_within_code_standard",
            args: { medical_code_standard, code },
          }).done((r) => {
            var response = r.message
            console.log(response)
            
          });

    }


});
