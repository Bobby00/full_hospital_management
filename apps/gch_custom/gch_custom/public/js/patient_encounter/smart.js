const handle_smart = (frm) => {
  const sladeConfirmDiag = new frappe.ui.Dialog({
    title: "Smart Member Details",
    fields: [
      {
        label: "Patient",
        fieldname: "patient",
        fieldtype: "Data",
        default: frm.doc.patient,
        read_only: 1,
      },
    ],
    primary_action_label: "Get Member Benefits",
    async primary_action(values) {
      console.log(values);
      sladeConfirmDiag.hide();

    },
  });

  frm.add_custom_button(
    "Initiate Smart",
    function () {
      sladeConfirmDiag.show();
    },
    "Insurance"
  );
};
