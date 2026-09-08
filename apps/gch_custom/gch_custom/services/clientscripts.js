// ================================================ Sales Invoice ==========================================================
// Get all items covered by an insurance company
// given the insurance company and the apply for e.g. inpatient / outpatient / all

const get_insurance_preauth_items_table = async (
  insurance_company,
  apply_for
) => {
  let preauth_items;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_insurance_preauth_items_table",
      args: { insurance_company, apply_for },
    })
    .done((r) => {
      preauth_items = r.message;
    });
  return preauth_items;
};

// Get all items excluded by an insurance company
// given the insurance company and the apply for e.g. inpatient / outpatient / all

const get_insurance_excluded_items_table = async (
  insurance_company,
  apply_for
) => {
  let excluded_items;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_insurance_excluded_items_table",
      args: { insurance_company, apply_for },
    })
    .done((r) => {
      excluded_items = r.message;
    });
  return excluded_items;
};

// Get all copay an insurance company
// given the insurance company and the apply for e.g. inpatient / outpatient / all

const get_insurance_copay_items_table = async (
  insurance_company,
  apply_for
) => {
  let copay_items;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_insurance_copay_items_table",
      args: { insurance_company, apply_for },
    })
    .done((r) => {
      copay_items = r.message;
    });
  return copay_items;
};

// Get all Billing Rules an insurance company
// given the insurance company and the apply for e.g. inpatient / outpatient / all

const get_insurance_billing_rules_items_table = async (
  insurance_company,
  apply_for
) => {
  let billing_rules_items;
  await frappe
    .call({
      method:
        "gch_custom.services.rest.get_insurance_billing_rules_items_table",
      args: { insurance_company, apply_for },
    })
    .done((r) => {
      billing_rules_items = r.message;
    });
  return billing_rules_items;
};

// Get Billing Rule Template for a Billing Rule
// given the Billing Rule Template Name e.g NHIF 6

const get_insurance_billing_rule_template = async (billing_rule_name) => {
  return await frappe.call({
    method: "gch_custom.services.rest.get_insurance_billing_rule_template",
    args: { billing_rule_name },
  });
};

// Get all Billing Rules Templates Items
// given the Billing Rules Template Name

const get_billing_rule_template_items = async (billing_rule_name) => {
  let billing_rules_items;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_billing_rule_template_items",
      args: { billing_rule_name },
    })
    .done((r) => {
      billing_rules_items = r.message;
    });
  return billing_rules_items;
};

frappe.ui.form.on("Sales Invoice", {
  apply_on_invoice: async function (frm) {
    // console.log(
    //   "{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{ cliked }}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}"
    // );

    // All Invoiced Items  []
    let invoiced_items = frm.doc.items;

    // Current Primary Insurance
    let insurance_category = frm.doc.default_insurance;

    // Current Invoice Type e.g. Inpatient / Outpatient
    let invoice_type = "Outpatient";

    if (!invoiced_items || !insurance_category || !invoice_type) return;

    // Get All Billing Rules
    const billing_rules_items = await get_insurance_billing_rules_items_table(
      insurance_category,
      invoice_type
    );

    // Get All PreAuths
    const preauth_items = await get_insurance_preauth_items_table(
      insurance_category,
      invoice_type
    );

    // Get All Copay
    const copay_items = await get_insurance_copay_items_table(
      insurance_category,
      invoice_type
    );

    // Get All Exclusions
    const excluded_items = await get_insurance_excluded_items_table(
      insurance_category,
      invoice_type
    );

    // Billing Rules Items
    let billing_items_list = [];
    if (billing_rules_items.length > 0) {
      for (let index = 0; index < billing_rules_items.length; index++) {
        const billing_rules_item = billing_rules_items[index];
        await get_insurance_billing_rule_template(
          billing_rules_item.insurance_billing_rule_templates
        ).then(async (result) => {
          let billing_rule_template = result.message;

          if (billing_rule_template.apply_on == "Items") {
            const billing_rule_template_items =
              await get_billing_rule_template_items(billing_rule_template.name);

            let billing_rule_item_with_rules = billing_rule_template_items.map(
              (billing_rule_template_item) => {
                return {
                  ...billing_rule_template_item,
                  ...billing_rule_template,
                };
              }
            );

            billing_items_list = [
              ...billing_items_list,
              ...billing_rule_item_with_rules,
            ];
          }
        });
      }
    }

    // Insurance Items
    // Item / Insured by / Price / Insured amount /copay / Bal

    let insurance_items = [];

    // Helpers to Add Insurance Items
    const add_item_to_insured_item = ({
      insurance_category,
      item,
      item_group,
      price = 0,
      copay_amount = 0,
      insured_amount = 0,
      bal = 0,
      preauth_amount = 0,
    }) => {
      let item_insured = {
        insurance_category,
        item,
        item_group,
        price,
        copay_amount,
        insured_amount,
        bal,
        preauth_amount,
      };

      insurance_items.push(item_insured);
    };

    // calculate bal
    const cal_bal = (item_price, insured_amount) => {
      return item_price - insured_amount;
    };

    invoiced_items.forEach((invoiced_item) => {
      const {
        item_code: current_item_name,
        item_group: current_item_group,
        amount: current_item_amount,
      } = invoiced_item;
      //   console.table({
      //     current_item_name,
      //     current_item_group,
      //     current_item_amount,
      //   });
      // if item is excluded from category
      const excluded_item = excluded_items.find(
        (item) => item.item == current_item_name
      );

      if (excluded_item) {
        add_item_to_insured_item({
          insurance_category,
          item: current_item_name,
          item_group: current_item_group,
          price: current_item_amount,
          bal: cal_bal(current_item_amount, 0),
        });
        return;
      }
      // if item is preauthed from category
      const preauth_item = preauth_items.find(
        (item) => item.item == current_item_name
      );

      if (preauth_item) {
        if (preauth_item.amount >= current_item_amount) {
          add_item_to_insured_item({
            insurance_category,
            item: current_item_name,
            item_group: current_item_group,
            price: current_item_amount,
            copay_amount: 0,
            insured_amount: current_item_amount,
            bal: cal_bal(current_item_amount, current_item_amount),
          });
        } else if (preauth_item.amount < current_item_amount) {
          add_item_to_insured_item({
            insurance_category,
            item: current_item_name,
            item_group: current_item_group,
            price: current_item_amount,
            copay_amount: 0,
            insured_amount: preauth_item.amount,
            bal: cal_bal(current_item_amount, preauth_item.amount),
          });
        }
        return;
      }

      // Check copay
      const copay_item = copay_items.find(
        (item) => item.percentage_of == current_item_name
      );

      if (copay_item) {
        if (copay_item.copay_type == "Flat Rate") {
          add_item_to_insured_item({
            insurance_category,
            item: current_item_name,
            item_group: current_item_group,
            price: current_item_amount,
            copay_amount: copay_item.amount,
            insured_amount: current_item_amount - copay_item.amount,
            bal: cal_bal(
              current_item_amount,
              current_item_amount - copay_item.amount
            ),
          });

          //   insurance_items.push();
        } else if (copay_item.copay_type == "Percentage") {
          add_item_to_insured_item({
            insurance_category,
            item: current_item_name,
            item_group: current_item_group,
            price: current_item_amount,
            copay_amount: copay_item.amount,
            insured_amount: current_item_amount - copay_item.amount,
            bal: cal_bal(
              current_item_amount,
              current_item_amount - copay_item.amount
            ),
          });
        }
        return;
      }

      //   Check Billing Rules

      const billing_rule_item_exists = billing_items_list.find(
        (item) => item.item_code == current_item_name
      );

      if (billing_rule_item_exists) {
        if (billing_rule_item_exists.rate_type == "Discount Percentage") {
          let insured_amount =
            (current_item_amount *
              billing_rule_item_exists.percentage_discount) /
            100;

          add_item_to_insured_item({
            insurance_category,
            item: current_item_name,
            item_group: current_item_group,
            price: current_item_amount,
            copay_amount: 0,
            insured_amount,
            bal: cal_bal(current_item_amount, insured_amount),
          });
        } else if (billing_rule_item_exists.rate_type == "Flat Rate") {
          let insured_amount =
            current_item_amount < billing_rule_item_exists.fixed_amount
              ? current_item_amount
              : billing_rule_item_exists.fixed_amount;

          add_item_to_insured_item({
            insurance_category,
            item: current_item_name,
            item_group: current_item_group,
            price: current_item_amount,
            copay_amount: 0,
            insured_amount,
            bal: cal_bal(current_item_amount, insured_amount),
          });
        } else if (billing_rule_item_exists.rate_type == "Discount Amount") {
          let insured_amount =
            current_item_amount - billing_rule_item_exists.discount_amount;

          add_item_to_insured_item({
            insurance_category,
            item: current_item_name,
            item_group: current_item_group,
            price: current_item_amount,
            copay_amount: 0,
            insured_amount,
            bal: cal_bal(current_item_amount, insured_amount),
          });
        } else if (billing_rule_item_exists.rate_type == "Max Amount") {
          let insured_amount =
            current_item_amount > billing_rule_item_exists.maximum_amount
              ? billing_rule_item_exists.maximum_amount
              : current_item_amount;

          add_item_to_insured_item({
            insurance_category,
            item: current_item_name,
            item_group: current_item_group,
            price: current_item_amount,
            copay_amount: 0,
            insured_amount,
            bal: cal_bal(current_item_amount, insured_amount),
          });
        }
        return;
      }

      // If Item is not any rule

      add_item_to_insured_item({
        insurance_category,
        item: current_item_name,
        item_group: current_item_group,
        price: current_item_amount,
        bal: cal_bal(current_item_amount, 0),
      });

      //   billing_rules_items.forEach(async(billing_rule_item) => {
      //     // Fetch template for Billing Rule
      //     await get_insurance_billing_rule_item_exists(
      //       billing_rule_item.insurance_billing_rule_templates
      //     ).then(r=>{
      //         console.log("object")
      //         console.log(r.message)
      //         console.log("object")
      //         let billing_rule_template = r.message

      // if (billing_rule_template.apply_on == "Items") {
      //     // Get All Items
      //     const billing_rule_template_items = get_billing_rule_template_items(
      //       billing_rule_template.name
      //     );

      //     const billing_rule_template_item_exists =
      //       billing_rule_template_items.find(
      //         (item) => item.item_code == current_item_name
      //       );

      //     console.log(
      //       "********************* here **************************************"
      //     );
      //     console.log(billing_rule_template_item_exists);
      //     console.log(
      //       "***********************************************************"
      //     );

      //     if (billing_rule_template_item_exists) {
      //       // Check rate type i.e Discount Percentage / Flat Rate / Discount Amount / Max Amount
      //       if (billing_rule_template.rate_type == "Discount Percentage") {
      //         let insured_amount =
      //           (current_item_amount *
      //             billing_rule_template.percentage_discount) /
      //           100;

      //         insurance_items.push({
      //           insurance_category,
      //           item: current_item_name,
      //           item_group: current_item_group,
      //           price: current_item_amount,
      //           copay_amount: 0,
      //           insured_amount,
      //           bal: cal_bal(current_item_amount, insured_amount),
      //         });
      //       }
      //       if (billing_rule_template.rate_type == "Flat Rate") {
      //         let insured_amount =
      //           current_item_amount < billing_rule_template.fixed_amount
      //             ? current_item_amount
      //             : billing_rule_template.fixed_amount;

      //         insurance_items.push({
      //           insurance_category,
      //           item: current_item_name,
      //           item_group: current_item_group,
      //           price: current_item_amount,
      //           copay_amount: 0,
      //           insured_amount,
      //           bal: cal_bal(current_item_amount, insured_amount),
      //         });
      //       }
      //       if (billing_rule_template.rate_type == "Discount Amount") {
      //         let insured_amount =
      //           current_item_amount - billing_rule_template.discount_amount;

      //         insurance_items.push({
      //           insurance_category,
      //           item: current_item_name,
      //           item_group: current_item_group,
      //           price: current_item_amount,
      //           copay_amount: 0,
      //           insured_amount,
      //           bal: cal_bal(current_item_amount, insured_amount),
      //         });
      //       }
      //       if (billing_rule_template.rate_type == "Max Amount") {
      //         let insured_amount =
      //           current_item_amount > billing_rule_template.maximum_amount
      //             ? billing_rule_template.maximum_amount
      //             : current_item_amount;

      //         insurance_items.push({
      //           insurance_category,
      //           item: current_item_name,
      //           item_group: current_item_group,
      //           price: current_item_amount,
      //           copay_amount: 0,
      //           insured_amount,
      //           bal: cal_bal(current_item_amount, insured_amount),
      //         });
      //       }
      //     }
      //   }
      //  else if (billing_rule_template.apply_on == "Group") {
      //     // Get All Groups in Rule

      //     // Check rate type i.e Discount Percentage / Flat Rate / Discount Amount / Max Amount
      //     if (billing_rule_template.rate_type == "Discount Percentage") {
      //     }
      //     if (billing_rule_template.rate_type == "Flat Rate") {
      //     }
      //     if (billing_rule_template.rate_type == "Discount Amount") {
      //     }
      //     if (billing_rule_template.rate_type == "Max Amount") {
      //     }
      //   }

      //     });
      //     console.log(" HERE ", billing_rule_template);
      //     // Check apply on i.e. Items / Group / Transaction

      //   });
    });

    // // Billing Rules
    // if(billing_rules_items.length >0){
    //   // Get billing templates
    //   billing_rules_items.forEach(async(billing_rule_item)=>{
    //     // Fetch template for Billing Rule
    //     const billing_rule_template = await get_insurance_billing_rule_template(billing_rule_item.insurance_billing_rule_templates)

    //     // Check rate type i.e Discount Percentage / Flat Rate / Discount Amount / Max Amount
    //     if(billing_rule_template.apply_on == "Transaction"){
    //       // Check apply on i.e. Transaction

    //     }

    //   })

    // }

    if (insurance_items.length > 0) {
      // set insurance items
      // Reset Table
      frm.doc.invoice_insurance_item_table = [];
      let total_insured_amount = 0;
      let total_copay_amount = 0;
      let total_preauth_amount = 0;
      let total_balance_amount = 0;

      insurance_items.forEach((item) => {
        let entry = frm.add_child("invoice_insurance_item_table");

        entry.item = item.item;
        entry.insurance_category = item.insurance_category;
        entry.price = item.price;
        entry.copay_amount = item.copay_amount;
        entry.insured_amount = item.insured_amount;
        entry.bal = item.bal;

        total_insured_amount += item.insured_amount;
        total_copay_amount += item.copay_amount;
        total_preauth_amount += item.preauth_amount;
        total_balance_amount += item.bal;
      });

      cur_frm.set_value("total_insured_amount", total_insured_amount);
      cur_frm.set_value("total_copay_amount", total_copay_amount);
      cur_frm.set_value("total_preauth_amount", total_preauth_amount);
      cur_frm.set_value("total_balance_amount", total_balance_amount);

      refresh_field("invoice_insurance_item_table");
    }

    // console.log("Invoice type");
    // console.log(invoice_type);

    // console.log("category");
    // console.log(insurance_category);

    // console.log("total invoiced items");
    // console.log(invoiced_items);

    // console.log("copay");
    // console.log(copay_items);

    // console.log("preauth");
    // console.log(preauth_items);

    // console.log("exclusion");
    // console.log(excluded_items);

    // console.log("Billing Rules");
    // console.log(billing_rules_items);

    // console.log("insurance_items");
    // console.table(insurance_items);

    // console.log(
    //   "{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{ cliked }}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}"
    // );
  },
  refresh: function (frm) {
    let phone_number = cur_frm.doc.mpesa_phone_number;
    let amount = cur_frm.doc.outstanding_amount;

    const MobileMoneyDialog = new frappe.ui.Dialog({
      title: "Mobile Money Details",
      fields: [
        {
          label: "Phone Number",
          fieldname: "phone_number",
          fieldtype: "Data",
          default: phone_number,
        },
        {
          label: "Amount",
          fieldname: "amount",
          fieldtype: "Int",
          default: amount,
        },
        {
          label: "Provider",
          fieldname: "provider",
          fieldtype: "Select",
          options: "Safaricom\nAirtel",
          default: "Safaricom",
        },
      ],
      primary_action_label: "Send Payment Request",
      primary_action(values) {
        console.log(values);

        frappe.call({
          method: "gch_custom.services.request_mpesa",
          args: {
            invoice: cur_frm.doc.name,
            phone_number: values.phone_number,
            amount: values.amount,
            provider: values.provider,
          },
          callback: function (r) {
            if (!r.exc) {
              MobileMoneyDialog.hide();
              frappe.msgprint({
                title: "Success",
                indicator: "green",
                message: `Mobile Payment Request Sent to ${values.phone_number} for ${values.amount}, Please Wait...`,
              });
              console.log(r);

              const check_payment_int = setInterval(function () {
                console.log("checking payment...");
                frappe.call({
                  method: "gch_custom.services.check_mpesa",
                  args: {
                    CheckoutRequestID: r.message,
                  },
                  callback: function (r) {
                    if (!r.exc) {
                      message: `Payment Done`;
                      console.log(r);

                      const { message } = r;

                      if (message.ResponseCode && message.ResponseCode == 0) {
                        frappe.msgprint({
                          title: "Success",
                          indicator: "green",
                          message: message.ResultDesc,
                        });
                        stop_check_payment_int();
                      }
                    }
                  },
                });
              }, 1000 * 10);
              const stop_check_payment_int = () => {
                clearInterval(check_payment_int);
              };
            }
          },
        });
      },
    });

    const PinpadDialog = new frappe.ui.Dialog({
      title: "Pinpad Details",
      fields: [
        {
          label: "Phone Number",
          fieldname: "phone_number",
          fieldtype: "Data",
          default: phone_number,
        },
        {
          label: "Amount",
          fieldname: "amount",
          fieldtype: "Int",
          default: amount,
        },
        //   {
        //     label: "Provider",
        //     fieldname: "provider",
        //     fieldtype: "Select",
        //     options: "Safaricom\nAirtel",
        //     default: "Safaricom",
        //   },
      ],
      primary_action_label: "Send Payment Request",
      primary_action(values) {
        console.log(values);
        PinpadDialog.hide();
        frappe.msgprint({
          title: "Success",
          indicator: "green",
          message: "Credit Card Payment Initiated, Please Swipe Card on Device",
        });
        frappe.call({
          method: "gch_custom.services.request_pdq",
          args: {
            phone_number: values.phone_number,
            amount: values.amount,
            invoiced_customer: cur_frm.doc.patient,
            invoiced_customer_name: cur_frm.doc.patient_name,
          },
          callback: function (r) {
            const { message } = r;
            frappe.msgprint({
              title: "Success",
              indicator: "green",
              message: message,
            });
          },
        });
      },
    });

    const GET_PAYMENT_GRP = "Get Payments";

    frm.add_custom_button(
      "Get Mobile Payment",
      function () {
        MobileMoneyDialog.show();
      },

      GET_PAYMENT_GRP
    );
    frm.add_custom_button(
      "Get PDQ Payment",
      function () {
        PinpadDialog.show();
      },

      GET_PAYMENT_GRP
    );
  },
});

frappe.ui.form.on("Invoice Insurance Item", {
  invoice_insurance_item_table_add(frm, cdt, cdn) {
    let itemsArray = [];

    if (cur_frm.doc.items.length > 0) {
      cur_frm.doc.items.map((item) => itemsArray.push(item.item_code));
    }

    console.log(cur_frm.doc.items);
    console.log(itemsArray);
    frm.fields_dict["invoice_insurance_item_table"].grid.get_field(
      "item"
    ).get_query = function (doc, cdt, cdn) {
      var child = locals[cdt][cdn];
      //console.log(child);
      if (itemsArray.length > 0) {
        return {
          filters: [["item_code", "in", itemsArray]],
        };
      }
    };
  },
});

// ================================================ Sales Invoice ==========================================================

// ================================================ Sales Invoice Payment Request ==========================================================

const display_error = (msg) => {
  frappe.msgprint({
    title: __("Process Error"),
    indicator: "red",
    message: __(`${msg}`),
  });
};

const get_encounter_diagnosis_table = async (encounter) => {
  let diagnosis_table;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_encounter_diagnosis",
      args: { encounter },
    })
    .done((r) => {
      diagnosis_table = r.message;
    });
  return diagnosis_table;
};

const get_invoice_item_table = async (sales_invoice) => {
  // Get Items from the selected invoice and add them to the sales request form

  let items_table;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_items_from_invoice",
      args: { sales_invoice },
    })
    .done((r) => {
      items_table = r.message;
    });

  return items_table;
};

const get_patient_from_invoice = async (sales_invoice) => {
  // Gets the currenc invoice owner and sets the patient field
  let patient;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_patient_from_invoice",
      args: { sales_invoice },
    })
    .done((r) => {
      patient = r.message;
    });

  return patient;
};

const get_encounter_from_patient = async (patient) => {
  let encounter;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_patient_current_encounter",
      args: { patient },
    })
    .done((r) => {
      encounter = r.message;
    });

  return encounter;
};

frappe.ui.form.on("Sales Invoice Payment Request", {
  encounter: async function (frm, cdt, cdn) {
    var encounter = frm.doc.encounter;

    if (encounter) {
      // Get diagnosis table from encounter
      const diagnosis_table = await get_encounter_diagnosis_table(encounter);
      frm.doc.diagnosis_table = [];
      diagnosis_table.map((diagnosis) => {
        let entry = frm.add_child("diagnosis_table");
        entry.medical_code = diagnosis.medical_code;
        entry.code = diagnosis.code;
        entry.description = diagnosis.description;
      });
      refresh_field("diagnosis_table");
    }
  },
  sales_invoice: async function (frm, cdt, cdn) {
    var sales_invoice = frm.doc.sales_invoice;

    if (sales_invoice) {
      // Gets the currenc invoice owner and sets the patient field
      const patient = await get_patient_from_invoice(sales_invoice);
      cur_frm.set_value("patient", patient);
      refresh_field("patient");

      // Get Encounter Current Encounter
      const encounter = await get_encounter_from_patient(patient);
      cur_frm.set_value("encounter", encounter);

      refresh_field("encounter");

      // Get diagnosis table from encounter
      const diagnosis_table = await get_encounter_diagnosis_table(encounter);
      frm.doc.diagnosis_table = [];
      diagnosis_table.map((diagnosis) => {
        let entry = frm.add_child("diagnosis_table");
        entry.medical_code = diagnosis.medical_code;
        entry.code = diagnosis.code;
        entry.description = diagnosis.description;
      });
      refresh_field("diagnosis_table");

      // Get Items from the selected invoice and add them to the sales request form
      const items = await get_invoice_item_table(sales_invoice);
      frm.doc.items = [];
      items.map((item) => {
        let entry = frm.add_child("items");
        entry.item = item.item_code;
        entry.price = item.amount;
        entry.requested_amount = item.amount;
        entry.outstanding_amount = 0;
      });

      refresh_field("items");
    }
  },
});

frappe.ui.form.on("Payment Request Item Details", {
  item: function (frm) {
    // your code here
    console.log("hello");
  },
});

frappe.ui.form.on("Sales Invoice", {
  apply_on_invoice: async function (frm) {
    console.log(
      "{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{ cliked }}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}"
    );

    // All Invoiced Items  []
    let invoiced_items = frm.doc.items;

    // Current Primary Insurance
    let insurance_category = frm.doc.default_insurance;

    // Current Invoice Type e.g. Inpatient / Outpatient
    let invoice_type = "Outpatient";

    if (!invoiced_items || !insurance_category || !invoice_type) return;

    // Get All Billing Rules
    const billing_rules_items = await get_insurance_billing_rules_items_table(
      insurance_category,
      invoice_type
    );

    // Get All PreAuths
    const preauth_items = await get_insurance_preauth_items_table(
      insurance_category,
      invoice_type
    );

    // Get All Copay
    const copay_items = await get_insurance_copay_items_table(
      insurance_category,
      invoice_type
    );

    // Get All Exclusions
    const excluded_items = await get_insurance_excluded_items_table(
      insurance_category,
      invoice_type
    );

    // Insurance Items
    // Item / Insured by / Price / Insured amount /copay / Bal

    let insurance_items = [];

    // calculate bal
    const cal_bal = (item_price, insured_amount) => {
      return item_price - insured_amount;
    };

    invoiced_items.forEach((invoiced_item) => {
      const {
        item_code: current_item_name,
        item_group: current_item_group,
        amount: current_item_amount,
      } = invoiced_item;
      console.table({
        current_item_name,
        current_item_group,
        current_item_amount,
      });
      // if item is excluded from category
      const excluded_item = excluded_items.find(
        (item) => item.item == current_item_name
      );

      if (excluded_item) {
        insurance_items.push({
          insurance_category,
          item: current_item_name,
          item_group: current_item_group,
          price: current_item_amount,
          copay_amount: 0,
          insured_amount: 0,
          bal: cal_bal(current_item_amount, 0),
        });
      }
      // if item is preauthed from category
      const preauth_item = preauth_items.find(
        (item) => item.item == current_item_name
      );

      if (preauth_item) {
        if (preauth_item.amount >= current_item_amount) {
          insurance_items.push({
            insurance_category,
            item: current_item_name,
            item_group: current_item_group,
            price: current_item_amount,
            copay_amount: 0,
            insured_amount: current_item_amount,
            bal: cal_bal(current_item_amount, current_item_amount),
          });
        } else if (preauth_item.amount < current_item_amount) {
          insurance_items.push({
            insurance_category,
            item: current_item_name,
            item_group: current_item_group,
            price: current_item_amount,
            copay_amount: 0,
            insured_amount: preauth_item.amount,
            bal: cal_bal(current_item_amount, preauth_item.amount),
          });
        }
      }

      // Check copay
      const copay_item = copay_items.find(
        (item) => item.percentage_of == current_item_name
      );

      if (copay_item) {
        if (copay_item.copay_type == "Flat Rate") {
          insurance_items.push({
            insurance_category,
            item: current_item_name,
            item_group: current_item_group,
            price: current_item_amount,
            copay_amount: copay_item.amount,
            insured_amount: current_item_amount - copay_item.amount,
            bal: cal_bal(
              current_item_amount,
              current_item_amount - copay_item.amount
            ),
          });
        } else if (copay_item.copay_type == "Percentage") {
          insurance_items.push({
            insurance_category,
            item: current_item_name,
            item_group: current_item_group,
            price: current_item_amount,
            copay_amount: copay_item.amount,
            insured_amount: current_item_amount - copay_item.amount,
            bal: cal_bal(
              current_item_amount,
              current_item_amount - copay_item.amount
            ),
          });
        }
      }

      // Check Billing Rules
      billing_rules_items.forEach(async (billing_rule_item) => {
        // Fetch template for Billing Rule
        const billing_rule_template = await get_insurance_billing_rule_template(
          billing_rule_item.insurance_billing_rule_templates
        );
        console.log(
          "***********************************************************",
          invoiced_item.item_code,
          "***********************************************************"
        );
        // Check apply on i.e. Items / Group / Transaction
        if (billing_rule_template.apply_on == "Items") {
          // Get All Items
          const billing_rule_template_items =
            await get_billing_rule_template_items(billing_rule_template.name);

          const billing_rule_template_item_exists =
            billing_rule_template_items.find(
              (item) => item.item_code == current_item_name
            );

          console.log(
            "***********************************************************"
          );
          console.log(billing_rule_template_item_exists);
          console.log(
            "***********************************************************"
          );

          if (billing_rule_template_item_exists) {
            // Check rate type i.e Discount Percentage / Flat Rate / Discount Amount / Max Amount
            if (billing_rule_template.rate_type == "Discount Percentage") {
              let insured_amount =
                (current_item_amount *
                  billing_rule_template.percentage_discount) /
                100;

              insurance_items.push({
                insurance_category,
                item: current_item_name,
                item_group: current_item_group,
                price: current_item_amount,
                copay_amount: 0,
                insured_amount,
                bal: cal_bal(current_item_amount, insured_amount),
              });
            }
            if (billing_rule_template.rate_type == "Flat Rate") {
              let insured_amount =
                current_item_amount < billing_rule_template.fixed_amount
                  ? current_item_amount
                  : billing_rule_template.fixed_amount;

              insurance_items.push({
                insurance_category,
                item: current_item_name,
                item_group: current_item_group,
                price: current_item_amount,
                copay_amount: 0,
                insured_amount,
                bal: cal_bal(current_item_amount, insured_amount),
              });
            }
            if (billing_rule_template.rate_type == "Discount Amount") {
              let insured_amount =
                current_item_amount - billing_rule_template.discount_amount;

              insurance_items.push({
                insurance_category,
                item: current_item_name,
                item_group: current_item_group,
                price: current_item_amount,
                copay_amount: 0,
                insured_amount,
                bal: cal_bal(current_item_amount, insured_amount),
              });
            }
            if (billing_rule_template.rate_type == "Max Amount") {
              let insured_amount =
                current_item_amount > billing_rule_template.maximum_amount
                  ? billing_rule_template.maximum_amount
                  : current_item_amount;

              insurance_items.push({
                insurance_category,
                item: current_item_name,
                item_group: current_item_group,
                price: current_item_amount,
                copay_amount: 0,
                insured_amount,
                bal: cal_bal(current_item_amount, insured_amount),
              });
            }
          }
        }
        if (billing_rule_template.apply_on == "Group") {
          // Get All Groups in Rule

          // Check rate type i.e Discount Percentage / Flat Rate / Discount Amount / Max Amount
          if (billing_rule_template.rate_type == "Discount Percentage") {
          }
          if (billing_rule_template.rate_type == "Flat Rate") {
          }
          if (billing_rule_template.rate_type == "Discount Amount") {
          }
          if (billing_rule_template.rate_type == "Max Amount") {
          }
        }
      });
    });

    // // Billing Rules
    // if(billing_rules_items.length >0){
    //   // Get billing templates
    //   billing_rules_items.forEach(async(billing_rule_item)=>{
    //     // Fetch template for Billing Rule
    //     const billing_rule_template = await get_insurance_billing_rule_template(billing_rule_item.insurance_billing_rule_templates)

    //     // Check rate type i.e Discount Percentage / Flat Rate / Discount Amount / Max Amount
    //     if(billing_rule_template.apply_on == "Transaction"){
    //       // Check apply on i.e. Transaction

    //     }

    //   })

    // }

    if (insurance_items.length > 0) {
      // set insurance items
      // Reset Table
      frm.doc.invoice_insurance_item_table = [];

      insurance_items.forEach((item) => {
        let entry = frm.add_child("invoice_insurance_item_table");

        entry.item = item.item;
        entry.insurance_category = item.insurance_category;
        entry.price = item.price;
        entry.copay_amount = item.copay_amount;
        entry.insured_amount = item.insured_amount;
        entry.bal = item.bal;
      });
      refresh_field("invoice_insurance_item_table");
    }

    console.log("Invoice type");
    console.log(invoice_type);

    console.log("category");
    console.log(insurance_category);

    console.log("total invoiced items");
    console.log(invoiced_items);

    console.log("copay");
    console.log(copay_items);

    console.log("preauth");
    console.log(preauth_items);

    console.log("exclusion");
    console.log(excluded_items);

    console.log("Billing Rules");
    console.log(billing_rules_items);

    console.log("insurance_items");
    console.table(insurance_items);

    console.log(
      "{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{ cliked }}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}"
    );
  },
  refresh: function (frm) {
    let phone_number = cur_frm.doc.mpesa_phone_number;
    let amount = cur_frm.doc.outstanding_amount;

    const MobileMoneyDialog = new frappe.ui.Dialog({
      title: "Mobile Money Details",
      fields: [
        {
          label: "Phone Number",
          fieldname: "phone_number",
          fieldtype: "Data",
          default: phone_number,
        },
        {
          label: "Amount",
          fieldname: "amount",
          fieldtype: "Int",
          default: amount,
        },
        {
          label: "Provider",
          fieldname: "provider",
          fieldtype: "Select",
          options: "Safaricom\nAirtel",
          default: "Safaricom",
        },
      ],
      primary_action_label: "Send Payment Request",
      primary_action(values) {
        console.log(values);

        frappe.call({
          method: "gch_custom.services.request_mpesa",
          args: {
            invoice: cur_frm.doc.name,
            phone_number: values.phone_number,
            amount: values.amount,
            provider: values.provider,
          },
          callback: function (r) {
            if (!r.exc) {
              MobileMoneyDialog.hide();
              frappe.msgprint({
                title: "Success",
                indicator: "green",
                message: `Mobile Payment Request Sent to ${values.phone_number} for ${values.amount}, Please Wait...`,
              });
              console.log(r);

              const check_payment_int = setInterval(function () {
                console.log("checking payment...");
                frappe.call({
                  method: "gch_custom.services.check_mpesa",
                  args: {
                    CheckoutRequestID: r.message,
                  },
                  callback: function (r) {
                    if (!r.exc) {
                      message: `Payment Done`;
                      console.log(r);

                      const { message } = r;

                      if (message.ResponseCode && message.ResponseCode == 0) {
                        frappe.msgprint({
                          title: "Success",
                          indicator: "green",
                          message: message.ResultDesc,
                        });
                        stop_check_payment_int();
                      }
                    }
                  },
                });
              }, 1000 * 10);
              const stop_check_payment_int = () => {
                clearInterval(check_payment_int);
              };
            }
          },
        });
      },
    });

    const PinpadDialog = new frappe.ui.Dialog({
      title: "Pinpad Details",
      fields: [
        {
          label: "Phone Number",
          fieldname: "phone_number",
          fieldtype: "Data",
          default: phone_number,
        },
        {
          label: "Amount",
          fieldname: "amount",
          fieldtype: "Int",
          default: amount,
        },
        //   {
        //     label: "Provider",
        //     fieldname: "provider",
        //     fieldtype: "Select",
        //     options: "Safaricom\nAirtel",
        //     default: "Safaricom",
        //   },
      ],
      primary_action_label: "Send Payment Request",
      primary_action(values) {
        console.log(values);
        PinpadDialog.hide();
        frappe.msgprint({
          title: "Success",
          indicator: "green",
          message: "Credit Card Payment Initiated, Please Swipe Card on Device",
        });
        frappe.call({
          method: "gch_custom.services.request_pdq",
          args: {
            phone_number: values.phone_number,
            amount: values.amount,
            invoiced_customer: cur_frm.doc.patient,
            invoiced_customer_name: cur_frm.doc.patient_name,
          },
          callback: function (r) {
            const { message } = r;
            frappe.msgprint({
              title: "Success",
              indicator: "green",
              message: message,
            });
          },
        });
      },
    });

    const GET_PAYMENT_GRP = "Get Payments";

    frm.add_custom_button(
      "Get Mobile Payment",
      function () {
        MobileMoneyDialog.show();
      },

      GET_PAYMENT_GRP
    );
    frm.add_custom_button(
      "Get PDQ Payment",
      function () {
        PinpadDialog.show();
      },

      GET_PAYMENT_GRP
    );
  },
});

frappe.ui.form.on("Invoice Insurance Item", {
  invoice_insurance_item_table_add(frm, cdt, cdn) {
    let itemsArray = [];

    if (cur_frm.doc.items.length > 0) {
      cur_frm.doc.items.map((item) => itemsArray.push(item.item_code));
    }

    console.log(cur_frm.doc.items);
    console.log(itemsArray);
    frm.fields_dict["invoice_insurance_item_table"].grid.get_field(
      "item"
    ).get_query = function (doc, cdt, cdn) {
      var child = locals[cdt][cdn];
      //console.log(child);
      if (itemsArray.length > 0) {
        return {
          filters: [["item_code", "in", itemsArray]],
        };
      }
    };
  },
});
