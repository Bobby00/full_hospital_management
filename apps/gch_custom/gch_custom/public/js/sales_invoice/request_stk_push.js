const request_stk_push = (frm) => {
    const list_items = cur_frm.doc.items.map((item) => {
        return {
          label: `${item.item_name} x ${item.qty}  @ ${item.rate} = ${
            item.amount
          } (${item.is_paid ? "Paid" : "Not Paid"})`,
          name: item.name,
          fieldname: `item-${item.name}` + (item.is_paid ? "-paid" : ""),
          fieldtype: "Check",
          default: 1,// item.is_paid
          read_only: item.is_paid,
          change: function() {
            update_total_amount();
          },
        };
        // return {
        //   id: item.name,
        //   name: item.item_name,
        //   qty: item.qty,
        //   rate: item.rate,
        //   amount: item.amount,
        // };
    });


    // Function to update the total amount
    function update_total_amount() {
        let total = 0;

        // Calculate total based on selected checkboxes in the dialog
        list_items.forEach((field) => {
            if (field.fieldtype === "Check" && payment_dialog.get_value(field.fieldname)) {
                const item = cur_frm.doc.items.find((i) => `item-${i.name}` === field.fieldname.split("-paid")[0]);
                if (item) total += item.amount;
            }
        });

        // Update the 'amount' field in the dialog with the calculated total
        payment_dialog.set_value("amount", total);
    }

//   const list_items = cur_frm.doc.items.map((item) => {
//     return {
//       label: `${item.qty} - ${item.item_name}`,
//       value: item.name,
//       fieldtype: "Check",
//       default: 1,
//       read_only: 1,
//     };
//     // return {
//     //   id: item.name,
//     //   name: item.item_name,
//     //   qty: item.qty,
//     //   rate: item.rate,
//     //   amount: item.amount,
//     // };
//   });

  function send_stk_request(phone_number, amount, sales_invoice, branch) {
    // Make the Frappe call to send STK request
    frappe.call({
        method: "gch_custom.services.send_stk_request",
        args: {
            phone_number: phone_number,
            amount: amount,
            sales_invoice: sales_invoice,
            branch: branch
        },
        callback: function (r) {
            if (r.message) {
                if (r.message.ResponseCode != 0) {
                    frappe.msgprint("Something went wrong. Please try again later");
                } else {
                    frappe.msgprint(
                        `Request sent to ${phone_number} successfully for KES ${amount} <br><br> Please wait as we validate the payment from the client...`
                    );

                    // Freeze UI to show validation is in progress
                    frappe.dom.freeze("Please wait as we validate the payment from the client");

                    // Check if the STK push payment entry exists in C2B list after a delay of 10 seconds
                    setTimeout(() => {
                        console.log("Delayed for 10 seconds.");

                        // Call send_confirmation function to check the payment
                        send_confirmation(sales_invoice, phone_number, amount);

                    }, 10000);  // 10000 ms = 10 seconds
                }
            }
        },
    });
}

  // Function to mark selected items as paid in the Doctype
  function mark_selected_items_as_paid() {
        // Iterate over items in the main Doctype
        cur_frm.doc.items.forEach((item) => {
            const fieldname = `item-${item.name}` + (item.is_paid ? "-paid" : "");
            
            // Check if the item is selected in the dialog and is currently unpaid
            if (!item.is_paid && payment_dialog.get_value(fieldname)) {
                // Set the item as paid in the main Doctype
                item.is_paid = true;
            }
        });

        // Save the form to persist changes in the main Doctype
        // cur_frm.save_or_update();

        // Optionally, close the dialog
        // payment_dialog.hide();

        // Notify the user
        frappe.msgprint("Selected items have been marked as paid.");
    }

  function send_confirmation(sales_invoice, phone_number, amount) {
    // Check if the payment confirmation exists
    frappe.call({
        method: "gch_custom.services.rest.fetch_mpesa_stk_push_payment",
        args: {
            "sales_invoice": sales_invoice,
            "phone_number": phone_number,
            "amount": amount
        },
        callback: (res) => {
            // Show confirmation message and soft refresh the page
            console.log(res);

            if (res.message[0] === true) {
                frappe.show_alert({
                    message: __('Payment confirmed successfully.....'),
                    indicator: 'green'
                }, 5);

                let confirmation_dialog = new frappe.ui.Dialog({
                    title: 'Payment Successful',
                    fields: [
                        {
                            label: 'Payment Confirmation',
                            fieldname: 'payment_confirmation',
                            fieldtype: 'HTML',
                            options: `<ul><li>First Name: <b>${res.message[1][0].first_name}</b></li>
                                      <li>Transaction Code: <b>${res.message[1][0].trans_id}</b></li>
                                      <li>Transaction Amount: <b>${res.message[1][0].trans_amount}<b/></li></ul>`
                        },
                    ],
                    size: 'small', // small, large, extra-large 
                    primary_action_label: 'Complete Payment',
                    primary_action(values) {
                        console.log(values);
                        cur_frm.refresh()
                        confirmation_dialog.hide();
                    }
                });

                confirmation_dialog.show();
                

                // Auto fetching advances after successful payment
                cur_frm.call({
                    method: "set_advances",
                    doc: cur_frm.doc,
                    callback: function(r, rt) {
                        refresh_field("advances");
                    }
                })

                mark_selected_items_as_paid()

                cur_frm.save()

                frappe.dom.unfreeze();

                // Create Payment Entry and Update invoice with the latest payment entry
                // Add your logic for creating a payment entry here
            } else if (res.message[0] === false) {
                // Show button to confirm payment manually
                frappe.show_alert({
                    message: __('Payment not confirmed yet.....'),
                    indicator: 'red'
                }, 5);

                frappe.dom.unfreeze()

                frappe.dom.freeze("Confirm or Cancel Transaction");

                let d = new frappe.ui.Dialog({
                    title: 'Confirm Payment From Client?',
                    fields: [
                        {
                            label: 'Payment Confirmation',
                            fieldname: 'payment_confirmation',
                            fieldtype: 'HTML',
                            options: ``
                        }
                    ],
                    static : true,
                    primary_action_label: 'Confirm Payment', // Label for primary action button
                    primary_action(values) {
                        console.log('Primary Action:', values);
                        frappe.show_alert({
                            message: __('Confirming payment.'),
                            indicator: 'green'
                        }, 5);

                        send_confirmation(cur_frm.doc.name, phone_number, amount);

                        d.hide();  // Hide dialog after primary action

                        frappe.dom.unfreeze()

                    },
                    secondary_action_label: 'Cancel Payment', // Label for secondary action button
                    secondary_action() {
                        console.log('Secondary Action: Cancel Payment');
                        frappe.show_alert({
                            message: __('Payment canceled.'),
                            indicator: 'red'
                        }, 5);
                        d.hide();  // Hide dialog after secondary action
                        cur_frm.refresh_field()

                        frappe.dom.unfreeze()

                    }
                });
                
                d.show();

                // Add the third button manually after the dialog is rendered
                let third_button = $(`<button style='float:left; position: absolute;' class="btn btn-warning">Resend M-Pesa Push</button>`).click(function() {
                    console.log('Third Action: Resend STK Push');

                    // Disable the button for 5 seconds
                    third_button.prop('disabled', true);
                    

                    // Re-enable the button after 5 seconds
                    setTimeout(function() {
                        third_button.prop('disabled', false);
                    }, 7000); // 7000 ms = 5 seconds

                    // SEND STK PUSH REQUEST
                    send_stk_request(phone_number, amount, cur_frm.doc.name, cur_frm.doc.branch)

                    frappe.show_alert({
                        message: __('Mpesa Push Resent to Client. Please wait a few seconds before trying again'),
                        indicator: 'orange'
                    }, 7);
                });

                // Append the third button to the dialog's footer
                d.$wrapper.find('.modal-footer').append(third_button);

                // frappe.confirm('Reconfirm Payment From Client', 
                //     () => {
                //         // action to perform if Yes is selected
                //         console.log('Reconfirming payment...');
                //         // Add your logic for reconfirming the payment here
                //         send_confirmation(cur_frm.doc.name, phone_number, amount);
                //     }, 
                //     () => {
                //         // action to perform if No is selected
                //         frappe.show_alert({
                //             message: __('Transaction Cancelled'),
                //             indicator: 'red'
                //         }, 5);
                //     }
                // );
            }

            // Optionally show button to resend STK push to client
        }
    });
    }

    function calculate_initial_unpaid_amount() {
        return cur_frm.doc.items
            .filter(item => !item.is_paid)
            .reduce((total, item) => total + item.amount, 0);
    }

  let payment_dialog = new frappe.ui.Dialog({
    title: "Request STK Push",
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
        default: cur_frm.doc.outstanding_amount, // calculate_initial_unpaid_amount(),
      },
    ],
    primary_action_label: "Request Mpesa",
    primary_action(values) {
      payment_dialog.hide();
      frappe.msgprint("Please wait, Transaction in progress...");

      // SEND STK PUSH REQUEST
      send_stk_request(values.phone_number, values.amount, cur_frm.doc.name, cur_frm.doc.branch)
    },
  });
  frm.add_custom_button(
    "Request Mpesa Push",
    function () {
      payment_dialog.show();
    },
    "Get Payments"
  );
};
