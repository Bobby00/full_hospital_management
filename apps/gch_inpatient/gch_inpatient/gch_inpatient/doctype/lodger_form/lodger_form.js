// Copyright (c) 2024, Redward and contributors
// For license information, please see license.txt

frappe.ui.form.on('Lodger Form', {
	refresh: function(frm) {
        $('.prev-doc, .next-doc').hide();
	},
    after_save: (frm) => {
        // Ensuring that the lodger form number is added to the respective admission form
        console.log("After save")

        if (!cur_frm.doc.__islocal) {
            console.log("here.....")


            frappe.call({
                method: "gch_inpatient.gch_inpatient.doctype.lodger_form.lodger_form.update_admission_and_inpatient_record",
                args: {
                    "admission_form": cur_frm.doc.admission_form,
                    "lodger_form": cur_frm.doc.name,
                    "inpatient_record": cur_frm.doc.inpatient_record,
                    "ward_of_preference": cur_frm.doc.ward_of_preference
                },
                callback: function (res) {
                    console.log(res.message)
                    // SHOW MESSAGE OF SUCCESSFUL ADDITION OF LODGER FORM ON ADMISSION RECORS
                    frappe.show_alert(
                        {
                          message: __("Admission Form and Inpatient Recorded updated with Lodger Form Details"),
                          indicator: "green",
                        },
                        1
                    );

                }
            })
        }

    }
});
