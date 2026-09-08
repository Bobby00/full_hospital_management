const handle_mtiba = (frm) => {
  const MtibaConfirmDiag = new frappe.ui.Dialog({
    title: "Mtiba Get Member Details",
    fields: [
      {
        label: "Treatement Code",
        fieldname: "treatment_code",
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
      MtibaConfirmDiag.hide();
      frappe.msgprint({
        title: "Getting Member Benefits...",
        indicator: "green",
        message: "Please wait, while we confirm Mtiba member benefits",
      });
      frappe.call({
        method: "gch_custom.services.mtiba_get_treatment_info",
        args: {
          treatment_code: values.treatment_code,
          encounter: frm.doc.name,
        },
        callback: function (r) {
          const { message } = r;
          console.log(message);
          frappe.msgprint({
            title: "Success",
            indicator: "green",
            message,
          });
          // frappe.set_route("/app/lct-member/" + message); //TODO: reroute user to mtiba
        },
      });
    },
  });

//   frm.add_custom_button(
//     "Initiate Mtiba",
//     function () {
//       MtibaConfirmDiag.show();
//     },
//     "Insurance"
//   );
};
