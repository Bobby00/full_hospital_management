const handle_lct = (frm) => {
  const lctConfirmDiag = new frappe.ui.Dialog({
    title: "LCT Get Member Details",
    fields: [
      {
        label: "Membership Number",
        fieldname: "membership_number",
        fieldtype: "Data",
      },

      {
        label: "Patient",
        fieldname: "patient",
        fieldtype: "Data",
        default: frm.doc.patient,
        read_only: 1,
      },
      {
        label: "Encounter",
        fieldname: "encounter",
        fieldtype: "Data",
        default: frm.doc.name,
        read_only: 1,
      },
    ],
    primary_action_label: "Get Member Benefits",
    primary_action(values) {
      console.log(values);
      lctConfirmDiag.hide();
      frappe.msgprint({
        title: "Getting Member Benefits...",
        indicator: "green",
        message: "Please wait, while we confirm LCT member benefits",
      });
      frappe.call({
        method: "gch_custom.services.lct_member_details",
        args: {
          membership_number: values.membership_number,
          patient: cur_frm.doc.patient,
          encounter: cur_frm.doc.name,
        },
        callback: function (r) {
          const { message } = r;
          console.log(message);
          frappe.msgprint({
            title: "Success",
            indicator: "green",
            message,
          });
        },
      });
    },
  });

//   frm.add_custom_button(
//     "Initiate LCT",
//     function () {
//       lctConfirmDiag.show();
//     },
//     "Insurance"
//   );
};
