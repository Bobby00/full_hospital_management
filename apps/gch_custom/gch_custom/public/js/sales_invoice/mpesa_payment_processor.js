// Used to request mpesa stk push via the egerties payment gateway

const mpesa_payment_processor = (frm) => {
  const list_items = cur_frm.doc.items.map((item) => {
    return {
      label: `${item.item_name} x ${item.qty}  @ ${item.rate} = ${
        item.amount
      } (${item.is_paid ? "Paid" : "Not Paid"})`,
      name: item.name,
      fieldname: `item-${item.name}` + (item.is_paid ? "-paid" : ""),
      fieldtype: "Check",
      default: item.is_paid,
      read_only: item.is_paid,
    };
    // return {
    //   id: item.name,
    //   name: item.item_name,
    //   qty: item.qty,
    //   rate: item.rate,
    //   amount: item.amount,
    // };
  });

  let payment_dialog = new frappe.ui.Dialog({
    title: "Process Mpesa Payment",
    fields: [
      {
        label: "Phone Number",
        fieldname: "phone_number",
        fieldtype: "Int",
        default: "254",
      },
      {
        label: "Invoiced Items",
        fieldname: "items",
        fieldtype: "Section Break",
      },
      ...list_items,

      {
        label: "Amount",
        fieldname: "amount",
        fieldtype: "Int",
        default: cur_frm.doc.grand_total,
      },
    ],
    primary_action_label: "Request Mpesa",
    primary_action(values) {
      console.log(values);
      items_to_pay = [];
      for (const key in values) {
        if (values.hasOwnProperty(key)) {
          const element = values[key];
          if (key.includes("item-") && element) {
            _item = key.split("-");
            if (_item.length == 2) {
              items_to_pay.push(_item[1]);
            }
          }
        }
      }
      console.log(items_to_pay);
      payment_dialog.hide();
      frappe.msgprint("Please wait, Transaction in progress...");
      frappe.call({
        method: "gch_custom.services.mpesa_payment_processor",
        args: {
          phone_number: values.phone_number,
          amount: values.amount,
          sales_invoice: cur_frm.doc.name,
          items_to_pay: items_to_pay,
          branch: cur_frm.doc.branch,
        },
        callback: function (r) {
          if (r.message) {
            // if (r.message.ResponseCode != 0) {
            //   frappe.msgprint("Something went wrong. Please try again later");
            // }

            frappe.msgprint(
              `Request sent ${values.phone_number} successfully for KES ${values.amount}`
            );
          }
        },
      });
    },
  });
  frm.add_custom_button(
    "Mpesa Payment Processor",
    function () {
      payment_dialog.show();
    },
    "Get Payments"
  );
};
