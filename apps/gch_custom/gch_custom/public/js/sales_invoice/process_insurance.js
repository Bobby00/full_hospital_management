const get_smart_benefits_options = async (encounter) => {
  let patient_benfits_list;
  await frappe
    .call({
      method: "gch_custom.services.get_smart_benefits_options",
      args: { encounter },
    })
    .done((r) => {
      patient_benfits_list = r.message;
    });
  return patient_benfits_list;
};

const get_intergrator_options = async (patient_encounter) => {
  let integrator = "";
  let auth_token = "";
  if (!patient_encounter) return { integrator, auth_token };
  await frappe
    .call({
      method: "gch_custom.services.get_intergrator_details",
      args: { patient_encounter },
    })
    .done((r) => {
      integrator_options = r.message;

      if (integrator_options) {
        if (
          integrator_options.integrator != null &&
          integrator_options.integrator != undefined &&
          integrator_options.integrator != ""
        ) {
          integrator = integrator_options.integrator;
        }
        if (
          integrator_options.auth_token != null &&
          integrator_options.auth_token != undefined &&
          integrator_options.auth_token != ""
        ) {
          auth_token = integrator_options.auth_token;
        }
      }
    });
  return {
    integrator,
    auth_token,
  };
};

const handle_process_insurance = async (frm) => {
  let smart_benefits_options = [];
  console.log("handleSmart");
  console.log("INFO: loading");

  smart_benefits_options = await get_smart_benefits_options(frm.doc.encounter);

  const integrator_options = await get_intergrator_options(frm.doc.encounter);

  // Create a dialog box for processing insurance

  const processInsuranceConfirmDiag = new frappe.ui.Dialog({
    title: "Member Insurance Details",
    fields: [
      {
        label: "Insurance Integrator",
        fieldname: "integrator",
        fieldtype: "Select",
        reqd: 1,
        options: "\nSMART\nSLADE\nLCT\nMTIBA",
        default: integrator_options.integrator,
        // depends_on: "eval:doc.has_nhif_payment==1",
        // mandatory_depends_on: "eval:doc.has_nhif_payment==1",
      },
      {
        label: "Authorization Token",
        fieldname: "auth_token",
        fieldtype: "Data",
        mandatory_depends_on: "eval:doc.integrator!='SMART'",
        depends_on: "eval:doc.integrator!='SMART'",
        default: integrator_options.auth_token,
      },
      {
        label: "Select Benefit",
        fieldname: "benefit",
        fieldtype: "Select",

        options: smart_benefits_options
          ?.map((item) => item.pool_desc)
          .join("\n"),
        depends_on: "eval:doc.integrator=='SMART'",
        mandatory_depends_on: "eval:doc.integrator=='SMART'",
      },
      {
        label: "Has NHIF Payment",
        fieldname: "has_nhif_payment",
        fieldtype: "Check",
        depends_on: "eval:doc.integrator=='SMART'",
        mandatory_depends_on: "eval:doc.integrator=='SMART'",
      },

      {
        label: "NHIF Number",
        fieldname: "nhif_number",
        fieldtype: "Data",
        depends_on: "eval:doc.has_nhif_payment==1",
        mandatory_depends_on: "eval:doc.has_nhif_payment==1",
      },
      {
        label: "NHIF Member Type",
        fieldname: "nhif_member_type",
        fieldtype: "Select",
        options: "\nSelf\nSpouse\nChild",
        depends_on: "eval:doc.has_nhif_payment==1",
        mandatory_depends_on: "eval:doc.has_nhif_payment==1",
      },
      {
        label: "NHIF Amount",
        fieldname: "nhif_amount",
        fieldtype: "Currency",
        depends_on: "eval:doc.has_nhif_payment==1",
        mandatory_depends_on: "eval:doc.has_nhif_payment==1",
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
        label: "Copay Amount",
        fieldname: "cash_copay_amount",
        fieldtype: "Data",
        depends_on: "eval:doc.integrator=='SLADE'",
        default: "0",
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
        default: frm.doc.encounter,
        read_only: 1,
      },
      {
        label: "Sales Invoice",
        fieldname: "patient",
        fieldtype: "Data",
        default: frm.doc.name,
        read_only: 1,
      },
    ],
    primary_action_label: "Process Visit Now",
    primary_action(values) {
      console.log(values);
      processInsuranceConfirmDiag.hide();

      frappe.msgprint({
        title: "Processing Visit",
        indicator: "green",
        message: "Please wait...",
      });
      frappe.call({
        method: "gch_insurance.services.process_insurance",
        args: {
          payer_code: values.payer,
          insurance_type: values.integrator,
          membership_number: values.auth_token,
          patient_encounter: frm.doc.encounter,
          sales_invoice: frm.doc.name,
          service_type: "Outpatient",
          has_nhif_payment: values.has_nhif_payment,
          nhif_number: values.nhif_number,
          nhif_amount: values.nhif_amount,
          nhif_member_type: values.nhif_member_type,
          cash_copay_amount: values.cash_copay_amount,
          ...smart_benefits_options.find(
            (item) => item.pool_desc == values.benefit
          ),
        },
        callback: function (r) {
          frappe.msgprint({
            title: "Success",
            indicator: "green",
            message: "Insurance Visit Processed Successfully",
          });
        },
      });
    },
  });

  // Add a custom button to the invoice form

  frm.add_custom_button("Process Insurance Visit", function () {
    processInsuranceConfirmDiag.show();
  });
};
