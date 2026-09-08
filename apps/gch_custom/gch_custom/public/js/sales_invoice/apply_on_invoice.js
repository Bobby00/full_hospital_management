// Get all items covered by an insurance company
// given the insurance company and the apply for e.g. inpatient / outpatient / all

const get_insurance_preauth_items_table = async (
  insurance_company,
  apply_for,
  date
) => {
  let preauth_items;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_insurance_preauth_items_table",
      args: { insurance_company, apply_for, date },
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
  apply_for,
  date
) => {
  let excluded_items;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_insurance_excluded_items_table",
      args: { insurance_company, apply_for, date },
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
  apply_for,
  date
) => {
  let copay_items;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_insurance_copay_items_table",
      args: { insurance_company, apply_for, date },
    })
    .done((r) => {
      copay_items = r.message;
    });
  return copay_items;
};

// Get all Billing Rules an insurance company
// given the insurance company and the apply for e.g. inpatient / outpatient / all

const get_insurance_billing_rules_items_table = (
  insurance_company,
  insurance_category,
  apply_for,
  date
) => {
  let billing_rules_items;
  frappe
    .call({
      method:
        "gch_custom.services.rest.get_insurance_billing_rules_items_table",
      args: { insurance_company, insurance_category, apply_for, date },
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

async function apply_on_invoice(frm) {
  let date = frm.doc.creation.split(" ")[0];
  console.log("we up");

  // All Invoiced Items  []
  let invoiced_items = frm.doc.items;

  console.log("invoiced_items");
  console.log(invoiced_items);

  // Current Primary Insurance
  let insurance_category = cur_frm.doc.default_insurance;

  let insurance_company;

  // Current Invoice Type e.g. Inpatient / Outpatient
  let invoice_type = "Outpatient";

   if(cur_frm.doc.encounter != "" && cur_frm.doc.is_inpatient == 0) {
    invoice_type = "Outpatient"

    insurance_company = cur_frm.doc.insurance_outpatient_company_name

   } else if(cur_frm.doc.is_inpatient == 1 && cur_frm.doc.inpatient_record != "") {
    invoice_type = "Inpatient"

    insurance_company = cur_frm.doc.insurance_inpatient_company_name

   }

   console.log(insurance_company, "Here!!!!!!!!!!")

  if (!invoiced_items || !insurance_category || !invoice_type) {
    frappe.msgprint("Please select Insurance Category and Invoice Type");

    return;
  }

  // Get All Billing Rules
  let billing_rules_items;
  let apply_for = invoice_type
  frappe
    .call({
      method:
        "gch_custom.services.rest.get_insurance_billing_rules_items_table",
      args: { insurance_company, insurance_category, apply_for, date },
    })
    .done((r) => {
      billing_rules_items = r.message;
    });

    // console.log(billing_rules_items, "Billling rule table")



//   get_insurance_billing_rules_items_table(
//     insurance_company,
//     insurance_category,
//     invoice_type,
//     date
//   );

  // Get All PreAuths
  const preauth_items = await get_insurance_preauth_items_table(
    insurance_category,
    invoice_type,
    date
  );
  console.log("required preauth_items");
  console.log(preauth_items);
  console.log("required preauth_items");

  // Get All Copay
  const copay_items = await get_insurance_copay_items_table(
    insurance_category,
    invoice_type,
    date
  );

  // Get All Exclusions
  const excluded_items = await get_insurance_excluded_items_table(
    insurance_category,
    invoice_type,
    date
  );

  console.log("required excluded_items");
  console.log(excluded_items);
  console.log("required excluded_items");

  console.log(billing_rules_items, "BILLING RULES")

  // Billing Rules Items
  let billing_items_list = [];
  let billing_items_transaction = [];
  let billing_items_group = [];
  if (billing_rules_items.length > 0) {
    for (let index = 0; index < billing_rules_items.length; index++) {
      const billing_rules_item = billing_rules_items[index];
      await get_insurance_billing_rule_template(
        billing_rules_item.insurance_billing_rule_templates
      ).then(async (result) => {
        let billing_rule_template = result.message;

        console.log("billing rule template", billing_rule_template)

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
        } else if (billing_rule_template.apply_on == "Group") {
          billing_items_group.push(billing_rule_template);
        } else if (billing_rule_template.apply_on == "Transaction") {
          console.log("Triggering transaction ...............")
          billing_items_transaction.push(billing_rule_template);
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
    qty = 1,
    rate = 0,
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
      qty,
      rate,
    };

    insurance_items.push(item_insured);
  };

  // calculate bal
  const cal_bal = (item_price, insured_amount) => {
    if (insured_amount > item_price) return 0;
    return item_price - insured_amount;
  };

  invoiced_items.forEach((invoiced_item) => {
    const {
      item_code: current_item_name,
      item_group: current_item_group,
      amount: current_item_amount,
      qty: current_item_qty,
      rate: current_item_rate,
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
        qty: current_item_qty,
        rate: current_item_rate,
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
          qty: current_item_qty,
          rate: current_item_rate,
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
          rate: current_item_rate,
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
          qty: current_item_qty,
          rate: current_item_rate,
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
          qty: current_item_qty,
          rate: current_item_rate,
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
          (current_item_amount * billing_rule_item_exists.percentage_discount) /
          100;

        add_item_to_insured_item({
          insurance_category,
          item: current_item_name,
          item_group: current_item_group,
          price: current_item_amount,
          copay_amount: 0,
          insured_amount,
          bal: cal_bal(current_item_amount, insured_amount),
          qty: current_item_qty,
          rate: current_item_rate,
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
          qty: current_item_qty,
          rate: current_item_rate,
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
          qty: current_item_qty,
          rate: current_item_rate,
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
          qty: current_item_qty,
          rate: current_item_rate,
        });
      }
      return;
    }

    // If Item is not any rule

    add_item_to_insured_item({
      insurance_category,
      item: current_item_name,
      item_group: current_item_group,
      copay_amount: 0,
      price: current_item_amount,
      insured_amount: current_item_amount,
      bal: 0,
      qty: current_item_qty,
      rate: current_item_rate,
    });

    // HERE =====>

    // billing_rules_items.forEach(async (billing_rule_item) => {
    //   // Fetch template for Billing Rule
    //   await get_insurance_billing_rule_item_exists(
    //     billing_rule_item.insurance_billing_rule_templates
    //   ).then((r) => {
    //     console.log("object");
    //     console.log(r.message);
    //     console.log("object");
    //     let billing_rule_template = r.message;

    //     if (billing_rule_template.apply_on == "Items") {
    //       // Get All Items
    //       const billing_rule_template_items = get_billing_rule_template_items(
    //         billing_rule_template.name
    //       );

    //       const billing_rule_template_item_exists =
    //         billing_rule_template_items.find(
    //           (item) => item.item_code == current_item_name
    //         );

    //       console.log(
    //         "********************* here **************************************"
    //       );
    //       console.log(billing_rule_template_item_exists);
    //       console.log(
    //         "***********************************************************"
    //       );

    //       if (billing_rule_template_item_exists) {
    //         // Check rate type i.e Discount Percentage / Flat Rate / Discount Amount / Max Amount
    //         if (billing_rule_template.rate_type == "Discount Percentage") {
    //           let insured_amount =
    //             (current_item_amount *
    //               billing_rule_template.percentage_discount) /
    //             100;

    //           insurance_items.push({
    //             insurance_category,
    //             item: current_item_name,
    //             item_group: current_item_group,
    //             price: current_item_amount,
    //             copay_amount: 0,
    //             insured_amount,
    //             bal: cal_bal(current_item_amount, insured_amount),
    //           });
    //         }
    //         if (billing_rule_template.rate_type == "Flat Rate") {
    //           let insured_amount =
    //             current_item_amount < billing_rule_template.fixed_amount
    //               ? current_item_amount
    //               : billing_rule_template.fixed_amount;

    //           insurance_items.push({
    //             insurance_category,
    //             item: current_item_name,
    //             item_group: current_item_group,
    //             price: current_item_amount,
    //             copay_amount: 0,
    //             insured_amount,
    //             bal: cal_bal(current_item_amount, insured_amount),
    //           });
    //         }
    //         if (billing_rule_template.rate_type == "Discount Amount") {
    //           let insured_amount =
    //             current_item_amount - billing_rule_template.discount_amount;

    //           insurance_items.push({
    //             insurance_category,
    //             item: current_item_name,
    //             item_group: current_item_group,
    //             price: current_item_amount,
    //             copay_amount: 0,
    //             insured_amount,
    //             bal: cal_bal(current_item_amount, insured_amount),
    //           });
    //         }
    //         if (billing_rule_template.rate_type == "Max Amount") {
    //           let insured_amount =
    //             current_item_amount > billing_rule_template.maximum_amount
    //               ? billing_rule_template.maximum_amount
    //               : current_item_amount;

    //           insurance_items.push({
    //             insurance_category,
    //             item: current_item_name,
    //             item_group: current_item_group,
    //             price: current_item_amount,
    //             copay_amount: 0,
    //             insured_amount,
    //             bal: cal_bal(current_item_amount, insured_amount),
    //           });
    //         }
    //       }
    //     } else if (billing_rule_template.apply_on == "Group") {
    //       // Get All Groups in Rule

    //       // Check rate type i.e Discount Percentage / Flat Rate / Discount Amount / Max Amount
    //       if (billing_rule_template.rate_type == "Discount Percentage") {
    //       }
    //       if (billing_rule_template.rate_type == "Flat Rate") {
    //       }
    //       if (billing_rule_template.rate_type == "Discount Amount") {
    //       }
    //       if (billing_rule_template.rate_type == "Max Amount") {
    //       }
    //     }
    //   });
    //   console.log(" HERE ", billing_rule_template);
    //   // Check apply on i.e. Items / Group / Transaction
    // });

    // HERE =====>
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
      entry.qty = item.qty;
      entry.rate = item.rate;

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

    // Check billing rules on transaction
    console.log(billing_items_transaction, "billing item transaction............");

    if (billing_items_transaction.length > 0) {
      for (let index = 0; index < billing_items_transaction.length; index++) {
        const transaction_rule = billing_items_transaction[index];
        if (transaction_rule.rate_type == "Flat Rate") {
          const fixed_amount = transaction_rule.fixed_amount;

          console.log(fixed_amount, total_insured_amount, "Fixed amount and total insured amount")

          if (total_insured_amount > fixed_amount) {
            cur_frm.set_value("apply_discount_on", "Grand Total");
            cur_frm.set_value(
              "discount_amount",
              total_insured_amount - fixed_amount
            );
          }
        }
        if (transaction_rule.rate_type == "Discount Percentage") {
          const percentage_discount = transaction_rule.percentage_discount;
          const discounted_amount =
            (total_insured_amount * percentage_discount) / 100;

            cur_frm.set_value("apply_discount_on", "Grand Total");
            cur_frm.set_value("additional_discount_percentage", percentage_discount)
            cur_frm.set_value("discount_amount", discounted_amount);
        }
        if (transaction_rule.rate_type == "Discount Amount") {
          const discount_amount = transaction_rule.discount_amount;
          cur_frm.set_value("apply_discount_on", "Grand Total");
          cur_frm.set_value("discount_amount", discount_amount);
        }
        if (transaction_rule.rate_type == "Max Amount") {
          const maximum_amount = transaction_rule.maximum_amount;

          if (total_insured_amount > maximum_amount) {
            console.log("You have maxed out your insurance cover limit");
            frappe.show_alert(
                {
                  message: __("You have maxed out your insurance cover limit"),
                  indicator: "red",
                },
                15
              );
          }
        }
      }
    }


    // Check billing rules on group
    console.log(billing_items_group, "billing item group transaction............");

    // if (billing_items_group.length > 0) {
    //   for (let index = 0; index < billing_items_group.length; index++) {
    //     const transaction_rule = billing_items_group[index];
    //     if (transaction_rule.rate_type == "Flat Rate") {
    //       const fixed_amount = transaction_rule.fixed_amount;

    //       console.log(fixed_amount, total_insured_amount, "Fixed amount and total insured amount")

    //       if (total_insured_amount > fixed_amount) {
    //         cur_frm.set_value("apply_discount_on", "Grand Total");
    //         cur_frm.set_value(
    //           "discount_amount",
    //           total_insured_amount - fixed_amount
    //         );
    //       }
    //     }
    //     if (transaction_rule.rate_type == "Discount Percentage") {
    //     //   console.log("This is discount billing rule")
    //       const percentage_discount = transaction_rule.percentage_discount;
    //       const discounted_amount =
    //         (total_insured_amount * percentage_discount) / 100;

    //         cur_frm.set_value("apply_discount_on", "Grand Total");
    //         cur_frm.set_value("additional_discount_percentage", percentage_discount)
    //         cur_frm.set_value("discount_amount", discounted_amount);
    //     }
    //     if (transaction_rule.rate_type == "Discount Amount") {
    //       const discount_amount = transaction_rule.discount_amount;
    //       cur_frm.set_value("apply_discount_on", "Grand Total");
    //       cur_frm.set_value("discount_amount", discount_amount);
    //     }
    //     if (transaction_rule.rate_type == "Max Amount") {
    //       const maximum_amount = transaction_rule.maximum_amount;

    //       if (total_insured_amount > maximum_amount) {
    //         console.log("You have maxed out your insurance cover limit");
    //         frappe.show_alert(
    //             {
    //               message: __("You have maxed out your insurance cover limit"),
    //               indicator: "red",
    //             },
    //             15
    //           );
    //       }
    //     }
    //   }
    // }


  }

  // console.log("Invoice type");
  // console.log(invoice_type);

  // console.log("category");
  // console.log(insurance_category);

  // console.log("total invoiced items");
  // console.log(invoiced_items);

  // console.log("copay");
  // console.log(copay_items);

  console.log("preauth");
  console.log(preauth_items);

  console.log("exclusion");
  console.log(excluded_items);

  console.log("Billing Rules");
  console.log(billing_rules_items);

  // console.log("insurance_items");
  // console.table(insurance_items);

  // console.log(
  //   "{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{ cliked }}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}"
  // );
}
