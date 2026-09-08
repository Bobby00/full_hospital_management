const handle_slade = (frm) => {
  const sladeConfirmDiag = new frappe.ui.Dialog({
    title: "Slade Member Details",
    fields: [
      {
        label: "Authorization Token",
        fieldname: "auth_token",
        fieldtype: "Data",
      },

      {
        label: "Patient",
        fieldname: "patient",
        fieldtype: "Data",
        default: frm.doc.patient,
        read_only: 1,
      },
    ],
    primary_action_label: "Get Member Benefits",
    primary_action(values) {
      console.log(values);
      sladeConfirmDiag.hide();

      frappe.msgprint({
        title: "Getting Member Benefits...",
        indicator: "green",
        message: "Please wait, while we confirm Slade member benefits",
      });

      if (!cur_frm.doc.sales_invoice) {
        return frappe.msgprint({
          title: "Error!",
          indicator: "red",
          message: "Encounter has no invoice",
        });
      }
      frappe.call({
        method: "gch_custom.services.slade_authorize",
        args: {
          auth_token: values.auth_token,
          patient_encounter: cur_frm.doc.name,
          sales_invoice: cur_frm.doc.sales_invoice,
          service_type: "Outpatient",
          visit_type: "OUTPATIENT",
        },
        callback: function (r) {
          if (r.exc) {
            return frappe.msgprint({
              title: "Error!",
              indicator: "red",
              message: r.exc,
            });
          }
          const { message } = r;
          console.log(message);
          frappe.msgprint({
            title: "Success",
            indicator: "green",
            message,
          });
          // frappe.set_route("/app/slade-auth/" + message);
        },
      });
    },
  });

//   frm.add_custom_button(
//     "Initiate Slade",
//     function () {
//       sladeConfirmDiag.show();
//     },
//     "Insurance"
//   );
};
