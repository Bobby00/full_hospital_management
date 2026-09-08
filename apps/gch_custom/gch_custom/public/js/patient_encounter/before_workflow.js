const handle_before_workflow_action = (frm) => {
  const workflow_state = frm.doc.workflow_state;
  const selected_workflow_action = frm.selected_workflow_action;
  const encounter = frm.doc.name;
  console.log(workflow_state, selected_workflow_action, encounter);

  // Checking if workflow action is "close encounter" to update closing date-time and closed by
  if(selected_workflow_action == "Close Encounter") {
    console.log("Closing encounter.....")
    frappe.call({
        method: "gch_custom.services.rest.update_closing_date_time_user",
        args: {
            encounter,
            closed_by: frappe.session.user,
            closing_date_and_time : frappe.datetime.now_datetime()
        },
        callback : (res) => {
            console.log(res)
        }
    })

  }

  frappe
    .call({
      method: "gch_custom.services.patient_encounter_workflow_controller",
      args: {
        workflow_state,
        selected_workflow_action,
        encounter,
      },
    })
    .done((r) => {
      let message = r.message;

      frappe.msgprint({
        title: __("Success"),
        indicator: "green",
        message,
      });
    });
};
