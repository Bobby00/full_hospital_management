const get_mpesa = (frm, available_amount, confirmation_code, phone_number) => {
  let get_mpesa_diag = new frappe.ui.Dialog({
    title: "Payment Allocation",
    fields: [
      {
        label: "Money Received",
        fieldname: "available_amount",
        fieldtype: "Currency",
        read_only: 1,
        default: available_amount,
      },
      {
        label: "Allocate Amount",
        fieldname: "alloc_amount",
        fieldtype: "Currency",
        default: available_amount,
      },
    ],
    primary_action_label: "Allocate Mpesa",
    primary_action(values) {
      console.log({
        amount: values.alloc_amount.toString(),
        invoice_number: frm.doc.name,
        phone_number: phone_number,
        confirmation_code: confirmation_code,
      });

      get_mpesa_diag.hide();
      frappe.msgprint("Please wait, Transaction in progress...");
      frappe.call({
        method: "gch_custom.services.allocate_amount_to_invoice",
        args: {
          // invoice_number: str, amount: float, phone_number: str, confirmation_code: str)
          amount_to_allocate: values.alloc_amount.toString(),
          invoice_number: frm.doc.name,
          phone_number: phone_number,
          confirmation_code: confirmation_code,
        },
        callback: function (r) {
          const { message } = r;

          if (message.code == 200) {
            frappe.msgprint({
              title: "Success",
              indicator: "green",
              message: message.message,
            });
            // frm.reload_doc();
          } else {
            frappe.msgprint({
              title: "Error",
              indicator: "red",
              message: message.message,
            });
          }
        },
      });
    },
  });
  get_mpesa_diag.show();
};
