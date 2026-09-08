const promptModeOfPayment = async (cur_frm) => {
  frappe.prompt(
    [
      {
        label: "Select Mode of Payment",
        fieldname: "mode_of_payment",
        fieldtype: "Select",
        options: "\nCash\nInsurance",
      },
    ],
    (values) => {
      cur_frm.set_value("mode_of_payment", values.mode_of_payment);
      cur_frm.refresh_field("mode_of_payment");
      frappe.show_alert(
        {
          message: __("Mode of Payment set successfully"),
          indicator: "green",
        },
        5
      );
    }
  );
};

const checkModeOfPayment = (cur_frm) => {
  const { mode_of_payment } = cur_frm.doc;
  if (mode_of_payment == undefined || mode_of_payment == "") {
    promptModeOfPayment(cur_frm);
    return;
  }
};
