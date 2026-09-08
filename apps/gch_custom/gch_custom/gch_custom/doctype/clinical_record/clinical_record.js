// Copyright (c) 2022, Karani and contributors
// For license information, please see license.txt

let FREQUENCY_OPTIONS = [
    "Every 24 hrs",
    "Every 12 hrs",
    "Every 8 hrs",
    "Every 6 hrs",
    "Every 5 hrs",
    "Every 4 hrs",
    "Every 3 hrs",
    "Every 2 hrs",
    "Every 1 hr",
    "As Needed",
    "Stat",
    "Weekly",
    "Monthly",
    "Quarterly",
];

let range = (start, end) => {
    return Array(end - start + 1)
      .fill()
      .map((_, idx) => start + idx);
};


frappe.ui.form.on('Clinical Record', {
    onload: function(frm) {
        frappe.require(
            "/assets/gch_custom/js/patient_encounter/highlighted_menu.js",
            () => {
              handleHighlightedMenu(cur_frm);
            }
        );
	},

	refresh: function(frm) {
        frappe.require(
            "/assets/gch_custom/js/patient_encounter/highlighted_menu.js",
            () => {
              handleHighlightedMenu(cur_frm);
            }
        );
	},

    validate: function(frm) {
        console.log("Submitting.......")


    },
    before_submit: function(frm) {
        let patient_encounter = cur_frm.doc.patient_encounter

        // Adding Physical Exam, Hisotry, Diagnosis, Plan of action and Service referrals to encounter

        frappe.call({
            method: "gch_custom.services.rest.add_clinical_records_to_enconter",
            args: {
                patient_encounter: patient_encounter,
                physical_examination: cur_frm.doc.patient_physical_examination,
                patient_history : cur_frm.doc.patient_history,                
                plan_of_action: cur_frm.doc.patient_plan_of_action_notes,
                nursing_chief_complaint: cur_frm.doc.nursing_chief_complaint,
                nursing_notes: cur_frm.doc.nurse_notes || " ",
                encounter: cur_frm.doc.patient_encounter,
                service_referrals : cur_frm.doc.service_referral
            },callback(r) {
                if(r.message) {
                    console.log(r.message)
                    
                    frappe.msgprint({
                        title: __('Notification'),
                        indicator: 'green',
                        message: __('Details have been updated to the encounter successfully!')
                    });

                } else {
                    frappe.throw(__("Somethings not right!!!", r.message))

                }
            }
        })
    }

    
});
