// Copyright (c) 2024, eGerties Devs and contributors
// For license information, please see license.txt

frappe.ui.form.on('Outsourced Services', {
	refresh: function(frm) {
        let status = frm.doc.status;
        let current_user = frappe.session.user
        if(status == 'Pending'){
            frm.add_custom_button(
                "Send for Approval",
                function () {
                    console.log("do stuff here!!");
                    frm.set_value('status', 'Pending Approval');
                    frm.save();
                },
                'Actions'
            )
        }else if(status == 'Pending Approval'){
            $('.primary-action').hide();
            $("button[data-label='Submit']").hide();
            frm.add_custom_button(
                "Approve",
                async function() {
                    if(current_user == frm.doc.owner){
                        frappe.throw('You are not authorized to approve this document!!')
                    } else {
                        frm.set_value('status', 'Approved');
                        frm.set_value('approval', current_user);
                        frm.set_value('approved_at', frappe.datetime.now_datetime())
                        frm.save('Submit');
                    }
                    
                },
                'Actions'
            )
        }
	},
    before_submit: function(frm) {
        if(frm.doc.status == "Pending"){
            frappe.throw("Cannot submit without approval")
        }
    }
});
