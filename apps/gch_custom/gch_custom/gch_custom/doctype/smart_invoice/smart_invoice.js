frappe.ui.form.on("Smart Invoice", {
  create_payment: function (frm) {
    frappe.msgprint("Please wait Processing Smart payment...");
    frappe.call({
      method: "gch_custom.services.smart_close_visit",
      args: {
        smart_invoice: frm.doc.name,
      },

      callback: function (r) {
        const { message } = r;
        if (!message) {
          // cancel out on submit
          frappe.msgprint({
            title: "Error",
            indicator: "red",
            message: `Payment NOT created`,
          });
          frappe.validated = false;
          return;
        }
        frappe.msgprint({
          title: "Success",
          indicator: "green",
          message: message,
        });
      },
    });
  },
});
