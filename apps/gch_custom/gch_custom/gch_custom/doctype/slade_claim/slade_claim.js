// Copyright (c) 2022, Karani and contributors
// For license information, please see license.txt

frappe.ui.form.on("Slade Claim", {
  submit_attachments: function (frm) {
    // frappe.msgprint("Submitting attachments, Please Wait...");
    // if (cur_frm.doc.attachments?.length <= 0) {
    //   frappe.msgprint("Please attach files to submit");
    //   return;
    // }
    // if (cur_frm.doc.attachments?.length != frm.doc.attachments?.length) {
    //   frappe.msgprint("Please save changes before submitting");
    //   return;
    // }
    // frappe.call({
    //   method: "gch_custom.services.slade_upload_claim_attachment",
    //   args: {
    //     slade_claim: cur_frm.doc.name,
    //   },
    //   callback: function (r) {
    //     if (!r.exc) {
    //       frappe.msgprint("Files uploaded successfully");
    //       frm.reload_doc();
    //       return;
    //     }
    //     frappe.msgprint("Files not uploaded successfully");
    //   },
    // });
  },
  refresh: function (frm) {
    const SladeConfirmDiag = new frappe.ui.Dialog({
      title: "Slade 360 Claim Invoice",
      fields: [
        {
          label: "Membership Number",
          fieldname: "member_number",
          fieldtype: "Data",
          default: cur_frm.doc.member_number,
        },
        {
          label: "Service Type",
          fieldname: "service_type",
          fieldtype: "Select",
          options: "Outpatient\nInpatient",
          default: "Outpatient",
        },
        {
          label: "Patient Encounter",
          fieldname: "patient_encounter",
          fieldtype: "Data",
          default: cur_frm.doc.patient_encounter,
          read_only: 1,
        },
        {
          label: "Invoice Number",
          fieldname: "sales_invoice",
          fieldtype: "Data",
          default: frm.doc.sales_invoice,
          read_only: 1,
        },
        {
          label: "Cash Copay Amount",
          fieldname: "cash_copay_amount",
          fieldtype: "Currency",
          default: 0,
        },
      ],
      primary_action_label: "Create Slade Claim Invoice",
      primary_action(values) {
        console.log(values);
        SladeConfirmDiag.hide();
        // if (
        //   cur_frm.doc.attachments.length == undefined ||
        //   cur_frm.doc.attachments.length <= 0 ||
        //   frm.doc.attachments.length == undefined ||
        //   frm.doc.attachments.length <= 0
        // ) {
        //   frappe.msgprint(
        //     "Please attach documents before creating the invoice"
        //   );
        //   return;
        // }
        // const { attachments } = cur_frm.doc;

        // console.log(attachments);
        // const has_claim_form = attachments
        //   .map((attachment) => attachment.attachment_type)
        //   .includes("CLAIM_FORM");
        // console.log(has_claim_form);
        // if (!has_claim_form) {
        //   frappe.msgprint(
        //     "Please print and attach the CLAIM FORM form before creating the invoice"
        //   );
        //   return;
        // }
        // check if all the documents are attached have been submitted
        // const has_all_documents_been_submitted = attachments
        //   .map((attachment) => attachment.is_submitted)
        //   .every((is_submitted) => is_submitted == true);

        // if (!has_all_documents_been_submitted) {
        //   frappe.msgprint(
        //     "Please submit all the documents before creating the invoice"
        //   );
        //   return;
        // }

        frappe.msgprint({
          title: "Creating Slade Claim Invoice...",
          indicator: "green",
          message: "Please wait, while we create slade claim",
        });
        frappe.call({
          method: "gch_custom.services.slade_invoice_create",
          args: {
            member_number: cur_frm.doc.member_number,
            patient_encounter: values.patient_encounter,
            sales_invoice: values.sales_invoice,
            service_type: values.service_type,
            claim: frm.doc.name,
            cash_copay_amount: values.cash_copay_amount,
          },

          callback: function (r) {
            const { message } = r;
            if (!message) {
              frappe.msgprint({
                title: "Error",
                indicator: "red",
                message: `Invoice NOT created`,
              });
              return;
            }
            frappe.msgprint({
              title: "Success",
              indicator: "green",
              message: `Invoice:${message}  Created`,
            });
            // frappe.set_route("/app/slade-invoice/" + message);
          },
        });
      },
    });

    frm.add_custom_button("Create Slade Claim Invoice", function () {
      SladeConfirmDiag.show();
    });
  },
});

// frappe.ui.form.on("Slade Claim Attachments", {
//   attachments_add(frm, cdt, cdn) {
//     const attachments_list = frm.doc.attachments;

//     console.log(attachments_list);

//     if (attachments_list.length > 0) {
//       console.log("here");
//       const claim_attachment_exists = attachments_list.find(function (
//         attachment
//       ) {
//         return attachment.attachment_type == "CLAIM_FORM";
//       });
//       if (claim_attachment_exists) {
//         const child = locals[cdt][cdn];

//         const attachment_options = [
//           "PREAUTH_FORM",
//           "PRESCRIPTION",
//           "LAB_ORDER",
//           "IMAGING_ORDER",
//           "OTHER",
//         ];

//         frappe.meta.get_docfield(
//           "Slade Claim Attachments",
//           "attachment_type",
//           cur_frm.doc.name
//         ).options = [""].concat(attachment_options);
//         frappe.model.set_value(cdt, cdn, "attachment_type", "PREAUTH_FORM");
//         cur_frm.refresh_field("attachment_type");
//       }
//     }
//   },
// });
