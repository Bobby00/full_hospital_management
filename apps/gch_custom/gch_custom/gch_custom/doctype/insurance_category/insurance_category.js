// Create a today date in dd-mm-yyyy

const today = () => {
  return `${new Date().getDate()}-${
    new Date().getMonth() > 9
      ? new Date().getMonth()
      : "0" + new Date().getMonth()
  }-${new Date().getFullYear()}`;
};

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
      args: { insurance_company, apply_for, date: today() },
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
      args: { insurance_company, apply_for, date: today() },
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
      args: { insurance_company, apply_for, date: today() },
    })
    .done((r) => {
      copay_items = r.message;
    });
  return copay_items;
};

frappe.ui.form.on("Insurance Category", {
  refresh: function (frm) {
    frm.set_query("inpatient_insurance", function () {
      return {
        filters: [["is_active", "in", ["1"]]],
      };
    });
    frm.set_query("outpatient_insurance", function () {
      return {
        filters: [["is_active", "in", ["1"]]],
      };
    });

    let rename_diag = new frappe.ui.Dialog({
      title: "Rename Insurance Category",
      fields: [
        {
          label: "Old Name",
          fieldname: "old_name",
          fieldtype: "Data",
          default: frm.doc.name,
          read_only: 1,
        },
        {
          label: "New Name",
          fieldname: "new_name",
          fieldtype: "Data",
        },
      ],
      primary_action_label: "Rename",
      primary_action(values) {
        rename_diag.hide();
        frappe.msgprint("Please wait, Renaming in progress...");
        frappe.call({
          method: "gch_insurance.tasks.insurance_utils.change_category_name",
          args: {
            old_category_name: frm.doc.name,
            new_name: values.new_name,
          },
          callback: function (r) {
            if (r.message) {
              frappe.msgprint(r.message.message);
            }
          },
        });
      },
    });
    // button to rename insurance category
    if (cur_frm.doc.suspend == 0) {
      frm.add_custom_button("Rename Category", function () {
        rename_diag.show();
      });
    }
  },
  inpatient_insurance: async function (frm) {
    let insurance_company = frm.doc.inpatient_insurance;
    console.log({ insurance_company });

    if (insurance_company == "") return;
    // if (insurance_company) {
    // Set Pre Auth Items

    const inpatient_preauth_items = await get_insurance_preauth_items_table(
      insurance_company,
      "Inpatient"
    );
    console.log({ inpatient_preauth_items });

    frm.doc.pre_authorizations = frm.doc.pre_authorizations.filter(
      (item) => item.applies_for != "Inpatient"
    );
    inpatient_preauth_items.map((item) => {
      let entry = frm.add_child("pre_authorizations");
      entry.item = item.item;
      entry.applies_for = item.applies_for;
      entry.valid_from = item.valid_from;
      entry.valid_upto = item.valid_upto;
      entry.amount = item.amount;
    });
    refresh_field("pre_authorizations");

    // Set Copay Details

    const copay_items = await get_insurance_copay_items_table(
      insurance_company,
      "Inpatient"
    );

    console.log({ copay_items });
    frm.doc.copayment = frm.doc.copayment.filter(
      (item) => item.covering != "Inpatient"
    );

    // "healthcare_service_unit","copay_type","covering","percentage_of","amount","percentage"
    copay_items.map((item) => {
      let entry = frm.add_child("copayment");
      entry.healthcare_service_unit = item.healthcare_service_unit;
      entry.copay_type = item.copay_type;
      entry.covering = item.covering;
      entry.percentage_of = item.percentage_of;
      entry.percentage = item.percentage;
      entry.amount = item.amount;
    });
    refresh_field("copayment");

    // Set Exclusion Details

    const excluded_items = await get_insurance_excluded_items_table(
      insurance_company,
      "Inpatient"
    );

    console.log({ excluded_items });
    frm.doc.exclusion = frm.doc.exclusion.filter(
      (item) => item.applies_for != "Inpatient"
    );

    // "item","applies_for","valid_from","valid_upto","amount"
    excluded_items.map((item) => {
      let entry = frm.add_child("exclusion");
      entry.item = item.item;
      entry.applies_for = item.applies_for;
      entry.valid_from = item.valid_from;
      entry.valid_upto = item.valid_upto;
      entry.amount = item.amount;
    });
    refresh_field("exclusion");
  },
  outpatient_insurance: async function (frm) {
    let insurance_company = frm.doc.outpatient_insurance;
    console.log({ insurance_company });
    if (insurance_company == "") return;
    const inpatient_preauth_items = await get_insurance_preauth_items_table(
      insurance_company,
      "Outpatient"
    );

    frm.doc.pre_authorizations = frm.doc.pre_authorizations.filter(
      (item) => item.applies_for != "Outpatient"
    );
    inpatient_preauth_items.map((item) => {
      let entry = frm.add_child("pre_authorizations");
      entry.item = item.item;
      entry.applies_for = item.applies_for;
      entry.valid_from = item.valid_from;
      entry.valid_upto = item.valid_upto;
      entry.amount = item.amount;
    });
    refresh_field("pre_authorizations");

    // Set Copay Details

    const copay_items = await get_insurance_copay_items_table(
      insurance_company,
      "Outpatient"
    );
    console.log({ copay_items });
    frm.doc.copayment = frm.doc.copayment.filter(
      (item) => item.covering != "Outpatient"
    );

    // "healthcare_service_unit","copay_type","covering","percentage_of","amount","percentage"
    copay_items.map((item) => {
      let entry = frm.add_child("copayment");
      entry.healthcare_service_unit = item.healthcare_service_unit;
      entry.copay_type = item.copay_type;
      entry.covering = item.covering;
      entry.percentage_of = item.percentage_of;
      entry.percentage = item.percentage;
      entry.amount = item.amount;
    });
    refresh_field("copayment");

    // Set Exclusion Details

    const excluded_items = await get_insurance_excluded_items_table(
      insurance_company,
      "Outpatient"
    );
    console.log({ excluded_items });
    frm.doc.exclusion = frm.doc.exclusion.filter(
      (item) => item.applies_for != "Outpatient"
    );

    // "item","applies_for","valid_from","valid_upto","amount"
    excluded_items.map((item) => {
      let entry = frm.add_child("exclusion");
      entry.item = item.item;
      entry.applies_for = item.applies_for;
      entry.valid_from = item.valid_from;
      entry.valid_upto = item.valid_upto;
      entry.amount = item.amount;
    });
    refresh_field("exclusion");
  },

  before_save: function (frm) {
    if (frm.doc.name1 && frm.doc.company_code) {
      frm.doc.display_name = frm.doc.name1 + "-" + frm.doc.company_code;
    }
  },
});
