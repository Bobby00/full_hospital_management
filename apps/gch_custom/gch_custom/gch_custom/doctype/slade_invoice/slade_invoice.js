// Copyright (c) 2022, Karani and contributors
// For license information, please see license.txt

frappe.ui.form.on("Slade Invoice", {
  before_submit: async function (frm) {
    // TODO:  create payment entry
   // if (!cur_frm.doc.attachment || !cur_frm.doc.slade_attachment_id) {
     // frappe.throw("Kindly submit invoice to slade first");
   //   return;
   // }
  },

  submit_attachment: async function (frm) {
   // if (!cur_frm.doc.attachment) {
     // frappe.msgprint({
     //   title: "Info",
     //   indicator: "blue",
//message: `Add Invoice Attachment First`,
//});
    //  return;
  //  }
    frappe.call({
      method: "gch_custom.services.slade_upload_invoice_attachment",
      args: {
        slade_invoice: frm.doc.name,
      },

      callback: function (r) {
        const { message } = r;
        if (!message) {
          frappe.msgprint({
            title: "Error",
            indicator: "red",
            message: `Invoice NOT submited to slade, Try again later.`,
          });
          return;
        }
        frappe.msgprint({
          title: "Success",
          indicator: "green",
          message: `Invoice Submitted successfuly to slade`,
        });
      },
    });
  },
});
