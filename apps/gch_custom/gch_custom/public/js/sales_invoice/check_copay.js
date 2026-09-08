const check_copay = async (insurance_catergory) => {
  frappe
    .call({
      method: "gch_insurance.tasks.insurance_utils.check_copayment_exists",
      args: {
        insurance_catergory,
      },
    })
    .done((r) => {
      const res = r.message;

      if (res.code == 200) {
        frappe.msgprint({
          title: __("Alert"),
          indicator: "red",
          message: __(res.message),
        });
      }
    });
};
