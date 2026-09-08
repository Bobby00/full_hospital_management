const handle_after_workflow_action = (frm) => {
  // to be done by thagichu
  // Get current invoice
  // get the invoice number and add to the encounter
  let queue_group = frm.doc.queue_group;

  const encounter = frm.doc.name;
  frappe
    .call({
      method: "gch_custom.services.get_encounter_sales_invoice",
      args: {
        encounter,
      },
    })
    .done((r) => {
      let message = r.message;

      frm.set_value("sales_invoice", message);
      frm.refresh_field("sales_invoice");
    });
  // Call endpoint to notify user of changes on Queue
  frappe.call({
    method: "gch_queue.services.notify_queue",
    args: {
      queue_group: queue_group
    },
    callback: function (r) {
      // code snippet
      // console.log(r)
    }
  })
};
