// Copyright (c) 2023, Karani and contributors
// For license information, please see license.txt

frappe.ui.form.on('Clinical Procedure', {
	refresh: function(frm) {
        if (!cur_frm.doc.practitoner) {
            let current_user = frappe.user.name

            // Fetch Practioner
            frappe.call({
                method: 'gch_custom.services.rest.fetch_practitioner_name_procedures',
                args: {
                    "practitioner_email": current_user
                },
                callback: (r) => {
                    console.log(r.message)

                    if (r.message.length > 0) {
                        console.log(r.message[0].name)
                        
                        cur_frm.set_value("practitioner", r.message[0].name)
                        cur_frm.refresh_field("practitioner")

                    }
                }
            })

        }

	}
});
