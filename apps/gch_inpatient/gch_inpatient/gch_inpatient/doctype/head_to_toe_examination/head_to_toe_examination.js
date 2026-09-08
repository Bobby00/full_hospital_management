// Copyright (c) 2023, Redward and contributors
// For license information, please see license.txt

frappe.ui.form.on("Head to Toe Examination", {
  refresh: function (frm) {

    frappe.require(
        "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
        () => {
          handleHighlightedMenu(cur_frm);
        }
    );

    // if (cur_frm.doc.inpatient_record && cur_frm.doc.inpatient_record != "") {
    //   frappe.require(
    //     "/assets/gch_inpatient/js/inpatient_record_utils.js",
    //     () => {
    //       block_nurse_from_editing(frm);
    //     }
    //   );
    // }

    // Adding custom button to redirect to patient history
    frm.add_custom_button(__("Patient History"), () => {
        // Check for existing patient history
        frappe.db.get_value("Patient History", {"inpatient_record": cur_frm.doc.inpatient_record}, ['name']).then((res) => {

            if(res.message.name) {
                    
                window.location.href = "/app/patient-history/"+ res.message.name

            } else {

                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                  };
                  frappe.new_doc("Patient History");

            }

        })
    })

  },
  inpatient_record: function (frm) {
    if (cur_frm.doc.inpatient_record && cur_frm.doc.inpatient_record != "") {
      frappe.require(
        "/assets/gch_inpatient/js/inpatient_record_utils.js",
        () => {
          block_nurse_from_editing(frm);
        }
      );
    }
  },
  on_submit: (frm) => {
    frappe.call({
        method: "gch_custom.gch_custom.doctype.nursing_checklist.nursing_checklist.creating_completed_nursing_tools",
        args: {
            "inpatient_record": cur_frm.doc.inpatient_record,
            "tool_name": cur_frm.doc.doctype,
            "tool_id": cur_frm.doc.name,
            "tool_link": `<a href='/app/head-to-toe-examination/${cur_frm.doc.name}'><p style='color: blue;'>View</p></a>`
        },
        callback: (res) => {
            console.log(res, "============= SUBMITTEDDD ==========")
        }
    })
  }
});
