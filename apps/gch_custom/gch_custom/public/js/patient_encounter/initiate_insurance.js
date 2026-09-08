const handle_initiate_insurance = (frm) => {
  // Create a dialog box for initiating insurance visit

  const initiateInsuranceConfirmDiag = new frappe.ui.Dialog({
    title: "Member Insurance Details",
    fields: [
      {
        label: "Insurance Integrator",
        fieldname: "integrator",
        fieldtype: "Select",
        reqd: 1,
        options: "\nSMART\nSLADE\nLCT\nMTIBA",
        // depends_on: "eval:doc.has_nhif_payment==1",
        // mandatory_depends_on: "eval:doc.has_nhif_payment==1",
      },
      {
        label: "Authorization Token",
        fieldname: "auth_token",
        fieldtype: "Data",
        mandatory_depends_on: "eval:doc.integrator!='SMART'",
        depends_on: "eval:doc.integrator!='SMART'",
      },
      {
        label: "Payer",
        fieldname: "payer",
        fieldtype: "Link",
        options: "Slade Payer Codes",
        depends_on: "eval:doc.integrator=='SLADE'",
        mandatory_depends_on: "eval:doc.integrator=='SLADE'",
      },
      {
        label: "Patient",
        fieldname: "patient",
        fieldtype: "Data",
        default: frm.doc.patient,
        read_only: 1,
      },
      {
        label: "Patient Encounter",
        fieldname: "patient",
        fieldtype: "Data",
        default: frm.doc.name,
        read_only: 1,
      },
      {
        label: "Sales Invoice",
        fieldname: "patient",
        fieldtype: "Data",
        default: frm.doc.sales_invoice,
        read_only: 1,
      },
    ],
    primary_action_label: "Start Visit Now",
    primary_action(values) {
      console.log(values);
      initiateInsuranceConfirmDiag.hide();

      frappe.msgprint({
        title: "Starting Member Visit",
        indicator: "green",
        message: "Please wait...",
      });
      frappe.call({
        method: "gch_insurance.services.initiate_insurance",
        args: {
          insurance_type: values.integrator,
          membership_number: values.auth_token,
          patient_encounter: frm.doc.name,
          sales_invoice: frm.doc.sales_invoice,
          service_type: "Outpatient",
        },
        callback: function (r) {
          const { message, code } = r.message;

          if (code !== 200) {
            frappe.msgprint({
              title: "Error",
              indicator: "red",
              message,
            });
            return;
          }

          // save the token for the next processing

          frm.set_value("auth_token", values.auth_token);
          frm.set_value("integrator", values.integrator);
          frm.save();

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

  // Add a custom button to the patient encounter form

  frm.add_custom_button("Start Insurance Visit", function () {
    initiateInsuranceConfirmDiag.show();
  }, "Insurance");
};
