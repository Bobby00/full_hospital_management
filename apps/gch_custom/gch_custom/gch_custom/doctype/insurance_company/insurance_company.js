// Copyright (c) 2021, Karani and contributors
// For license information, please see license.txt

frappe.ui.form.on("Insurance Company", {
  refresh: function (frm) {
    // add button to suspend insurance company
    frm.add_custom_button(
      __(frm.doc.is_active ? "Suspend" : "Unsuspend"),
      function () {
        frappe.call({
          method:
            "gch_insurance.tasks.insurance_utils.enqueue_suspend_insurance_payer",
          args: {
            insurance_company: frm.doc.name,
            suspend: frm.doc.is_active == 1,
          },
          callback: function (r) {
            if (r.message) {
              frappe.msgprint(
                __(
                  `Insurance company ${
                    frm.doc.is_active ? "suspended" : "unsuspended"
                  } successfully.`
                )
              );
            } else {
              frappe.msgprint(__("Insurance not company suspended"));
            }
            refresh_field("is_active");
            frm.reload_doc();
          },
        });
      }
    );
  },
});
