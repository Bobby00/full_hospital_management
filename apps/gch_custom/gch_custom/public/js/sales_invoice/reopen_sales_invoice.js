const reopenSalesInvoice = async (salesInvoiceId, status, docstatus) => {
  const { message: responseMessage } = await frappe.call({
    method: "gch_custom.services.reopen_invoice",
    args: {
      sales_invoice_id: salesInvoiceId,
      status: status,
      docstatus: docstatus,
    },
  });

  if (responseMessage) {
    frappe.msgprint(responseMessage);
    return;
  }

  frappe.msgprint("Sales Invoice Reopened");
  refresh_field("status");
};
