// Copyright (c) 2022, Karani and contributors
// For license information, please see license.txt

frappe.ui.form.on("Lct Claim", {
  before_submit: async function (frm) {
    if (cur_frm.doc.claimref == "" || frm.doc.claimref == "") {
      frappe.validated = false;
      frappe.throw("Kindly Process Claim Before Submitting");
    }
  },
  refresh: async function (frm) {
    if (cur_frm.doc.claimref != "") {
      frm.add_custom_button("Process Claim", function () {
        frappe.call({
          method: "gch_custom.services.lct_claim_process",
          args: {
            claim: cur_frm.doc.name,
          },
          callback: function (r) {
            const { message } = r;
            console.log(message);
            cur_frm.set_value("claimref", message.claimref);
            cur_frm.refresh_field("claimref");
            cur_frm.set_value("is_processed", true);
            cur_frm.refresh_field("is_processed");
            frappe.msgprint({
              title: "Success",
              indicator: "green",
              message: message.message,
            });
          },
        });
      });
    }
  },
});
