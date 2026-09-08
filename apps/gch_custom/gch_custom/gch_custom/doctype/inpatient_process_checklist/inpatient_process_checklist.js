// Copyright (c) 2024, eGerties Devs and contributors
// For license information, please see license.txt

const update_status = (frm) => {
  console.log("update_status");
  console.log(frm.doc.pc_parent_confirm);

  let HMTL_MARKUP = `
  <div>
    <div class="">
        <h4>Proposed Care (<span>COMPLETE</span>)</h4>
       
    </div>
    <div class="">
        <h4>Admission (<span>Incomplete</span>)</h4>
    </div>
    <div class="">
        <h4>Ward Orientation (<span>Incomplete</span>)</h4>
        </div>
</div>
  `;
  console.log("HTML_MARKUP", HMTL_MARKUP);
  cur_frm.set_value("overview_html", HMTL_MARKUP);
  cur_frm.refresh_field("overview_html");
};

const getCurrentDate = () => {
  return frappe.datetime.now_datetime();
};

const confirm = (
  frm,
  confirmer_field,
  confirm_date_field,
  fields_to_hide,
  fields_to_show
) => {
  let current_user = frappe.session.user;
  cur_frm.set_value(confirmer_field, current_user);
  cur_frm.refresh_field(confirmer_field);
  cur_frm.set_value(confirm_date_field, getCurrentDate());
  cur_frm.refresh_field(confirm_date_field);
  for (let field of fields_to_hide) {
    frm.set_df_property(field, "hidden", true);
  }
  for (let field of fields_to_show) {
    frm.set_df_property(field, "hidden", false);
  }

  //   frm.set_df_property("pc_confirm", "hidden", true);
  //   frm.set_df_property("pc_unconfirm", "hidden", false);
  //   frm.set_df_property("pc_parent_confirm_request", "hidden", false);
};

const unconfirm = (
  frm,
  confirmer_field,
  confirm_date_field,
  fields_to_hide,
  fields_to_show
) => {
  cur_frm.set_value(confirmer_field, "");
  cur_frm.refresh_field(confirmer_field);
  cur_frm.set_value(confirm_date_field, "");
  cur_frm.refresh_field(confirm_date_field);

  for (let field of fields_to_hide) {
    frm.set_df_property(field, "hidden", true);
  }
  for (let field of fields_to_show) {
    frm.set_df_property(field, "hidden", false);
  }

  //   frm.set_df_property("pc_unconfirm", "hidden", true);
  //   frm.set_df_property("pc_confirm", "hidden", false);
  //   frm.set_df_property("pc_parent_confirm_request", "hidden", true);
};

const request_parent_confirm = (
  frm,
  parent_signature_field,
  parent_name_field,
  parent_confirm_date_field
) => {
  console.log("request_parent_confirm");
  let parent_request_diag = new frappe.ui.Dialog({
    title: "Parent Confirmation",
    fields: [
      {
        label: "Parant Name",
        fieldname: "parent_name",
        fieldtype: "Data",
      },
      {
        label: "Parent Signature",
        fieldname: "parent_signature",
        fieldtype: "Signature",
      },
    ],
    primary_action_label: "Confirm",
    primary_action(values) {
      console.log("primary_action");
      cur_frm.set_value(parent_signature_field, values.parent_signature);
      cur_frm.refresh_field(parent_signature_field);
      cur_frm.set_value(parent_name_field, values.parent_name);
      cur_frm.refresh_field(parent_name_field);
      cur_frm.set_value(parent_confirm_date_field, getCurrentDate());
      cur_frm.refresh_field(parent_confirm_date_field);
      parent_request_diag.hide();
    },
  });
  parent_request_diag.show();
};

frappe.ui.form.on("Inpatient Process Checklist", {
  refresh: function (frm) {
    const fields = ["pc_", "ad_", "wo_", "sd_"];

    for (let index = 0; index < fields.length; index++) {
      const field = fields[index];
      frm.set_df_property(`${field}unconfirm`, "hidden", true);
      frm.set_df_property(`${field}confirm`, "hidden", false);
      frm.set_df_property(`${field}parent_confirm_request`, "hidden", true);

      if (frm.doc[`${field}confirmer`]) {
        frm.set_df_property(`${field}confirm`, "hidden", true);
        frm.set_df_property(`${field}unconfirm`, "hidden", false);
        frm.set_df_property(`${field}parent_confirm_request`, "hidden", false);
      }
      if (frm.doc[`${field}parent_confirm`]) {
        frm.set_df_property(`${field}parent_confirm_request`, "hidden", true);
      }
    }

    // frm.set_df_property("pc_unconfirm", "hidden", true);
    // frm.set_df_property("pc_confirm", "hidden", false);
    // frm.set_df_property("pc_parent_confirm_request", "hidden", true);

    // frm.set_df_property("ad_unconfirm", "hidden", true);
    // frm.set_df_property("ad_confirm", "hidden", false);
    // frm.set_df_property("ad_parent_confirm_request", "hidden", true);

    // if (frm.doc.pc_confirmer) {
    //   frm.set_df_property("pc_confirm", "hidden", true);
    //   frm.set_df_property("pc_unconfirm", "hidden", false);
    //   frm.set_df_property("pc_parent_confirm_request", "hidden", false);
    // }
    // if (frm.doc.pc_parent_confirm) {
    //   frm.set_df_property("pc_parent_confirm_request", "hidden", true);
    // }

    // if (frm.doc.ad_confirmer) {
    //   frm.set_df_property("ad_confirm", "hidden", true);
    //   frm.set_df_property("ad_unconfirm", "hidden", false);
    //   frm.set_df_property("ad_parent_confirm_request", "hidden", false);
    // }
    // if (frm.doc.ad_parent_confirm) {
    //   frm.set_df_property("ad_parent_confirm_request", "hidden", true);
    // }

    update_status(frm);
  },
  onload: function (frm) {
    console.log("onload");
    update_status(frm);
  },
  pc_confirm: function (frm) {
    confirm(
      frm,
      "pc_confirmer",
      "pc_confirm_date",
      ["pc_confirm"],
      [
        "pc_unconfirm",
        "pc_parent_confirm_request",
        "pc_confirmer",
        "pc_confirm_date",
      ]
    );
  },
  pc_unconfirm: function (frm) {
    unconfirm(
      frm,
      "pc_confirmer",
      "pc_confirm_date",
      ["pc_unconfirm", "pc_parent_confirm_request"],
      ["pc_confirm"]
    );
  },
  pc_parent_confirm_request: function (frm) {
    console.log("pc_parent_confirm_request");
    request_parent_confirm(
      frm,
      "pc_parent_confirm",
      "pc_parent_confirm_name",
      "pc_parent_confirm_date"
    );
  }, //end
  ad_confirm: function (frm) {
    confirm(
      frm,
      "ad_confirmer",
      "ad_confirm_date",
      ["ad_confirm"],
      [
        "ad_unconfirm",
        "ad_parent_confirm_request",
        "ad_confirmer",
        "ad_confirm_date",
      ]
    );
  },
  ad_unconfirm: function (frm) {
    unconfirm(
      frm,
      "ad_confirmer",
      "ad_confirm_date",
      ["ad_unconfirm", "ad_parent_confirm_request"],
      ["ad_confirm"]
    );
  },
  ad_parent_confirm_request: function (frm) {
    console.log("ad_parent_confirm_request");
    request_parent_confirm(
      frm,
      "ad_parent_confirm",
      "ad_parent_confirm_name",
      "ad_parent_confirm_date"
    );
  }, // end
  wo_confirm: function (frm) {
    confirm(
      frm,
      "wo_confirmer",
      "wo_confirm_date",
      ["wo_confirm"],
      [
        "wo_unconfirm",
        "wo_parent_confirm_request",
        "wo_confirmer",
        "wo_confirm_date",
      ]
    );
  },
  wo_unconfirm: function (frm) {
    unconfirm(
      frm,
      "wo_confirmer",
      "wo_confirm_date",
      ["wo_unconfirm", "wo_parent_confirm_request"],
      ["wo_confirm"]
    );
  },
  wo_parent_confirm_request: function (frm) {
    console.log("wo_parent_confirm_request");
    request_parent_confirm(
      frm,
      "wo_parent_confirm",
      "wo_parent_confirm_name",
      "wo_parent_confirm_date"
    );
  }, // end
  sd_confirm: function (frm) {
    confirm(
      frm,
      "sd_confirmer",
      "sd_confirm_date",
      ["sd_confirm"],
      [
        "sd_unconfirm",
        "sd_parent_confirm_request",
        "sd_confirmer",
        "sd_confirm_date",
      ]
    );
  },
  sd_unconfirm: function (frm) {
    unconfirm(
      frm,
      "sd_confirmer",
      "sd_confirm_date",
      ["sd_unconfirm", "sd_parent_confirm_request"],
      ["sd_confirm"]
    );
  },
  sd_parent_confirm_request: function (frm) {
    console.log("sd_parent_confirm_request");
    request_parent_confirm(
      frm,
      "sd_parent_confirm",
      "sd_parent_confirm_name",
      "sd_parent_confirm_date"
    );
  }, // end
});
