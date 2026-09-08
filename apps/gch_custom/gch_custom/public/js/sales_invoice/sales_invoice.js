const field_list =[
  "currency_and_price_list",
  "sec_warehouse",
  "section_break_30",
  "medical_diagnosis",
  "terms_section_break",
  "customer",
  "nav_id",
  "outpatient_company_kra_pin",
  "outpatient_nav_id",
  "insurance_category_name",
  "insurance_category_employer",
  "insurance_outpatient_limit",
  "insurance_outpatient_card_balance"
]

const readonly_fields = [
  "customer"
]

// Get all patient insurance
// given the patient id


const GET_PAYMENT_GRP = "Get Payments";

const GET_CONFIRMATION_GRP = "Process Payments";

const update_insurance_totals = function (frm) {
  let invoice_insurance_item_table = cur_frm.doc.invoice_insurance_item_table;
  console.log({ invoice_insurance_item_table });

  if (invoice_insurance_item_table.length > 0) {
    let total_insured_amount = 0;
    let total_copay_amount = 0;
    let total_preauth_amount = 0;
    let total_balance_amount = 0;

    for (let index = 0; index < invoice_insurance_item_table.length; index++) {
      const item = invoice_insurance_item_table[index];

      total_insured_amount += item.insured_amount;
      total_copay_amount += item.copay_amount;
      total_preauth_amount += item.preauth_amount;
      total_balance_amount += item.bal;
    }
    cur_frm.set_value("total_insured_amount", total_insured_amount);
    cur_frm.set_value("total_copay_amount", total_copay_amount);
    cur_frm.set_value("total_preauth_amount", total_preauth_amount);
    cur_frm.set_value("total_balance_amount", total_balance_amount);

    refresh_field("total_insured_amount");
    refresh_field("total_copay_amount");
    refresh_field("total_preauth_amount");
    refresh_field("total_balance_amount");
  }
};

const get_patient_insurance = async (patient) => {
  let patient_insurance_list = [];
  if (!patient || patient == "") return patient_insurance_list;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_patient_insurance",
      args: { patient },
    })
    .done((r) => {
      patient_insurance_list = r.message;
    });
  return patient_insurance_list;
};

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

const handleSmart = async (frm) => {
  let smart_benefits_options = [];
  console.log("handleSmart");

  smart_benefits_options = await get_smart_benefits_options(frm.doc.encounter);

  console.log(
    smart_benefits_options
      .map((item) => {
        if (item.amount >= cur_frm.doc.total_insured_amount) {
          return item.pool_desc;
        }
      })
      .join("\n")
  );

  const SmartConfirmDiag = new frappe.ui.Dialog({
    title: "Smart Claim Details",
    fields: [
      {
        label: "Select Benefit",
        fieldname: "benefit",
        fieldtype: "Select",
        reqd: 1,
        options: smart_benefits_options
          ?.map((item) => item.pool_desc)
          .join("\n"),
      },
      {
        label: "Has NHIF Payment",
        fieldname: "has_nhif_payment",
        fieldtype: "Check",
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
        label: "Patient",
        fieldname: "patient",
        fieldtype: "Data",
        default: cur_frm.doc.patient,
        read_only: 1,
      },

      {
        label: "Patient Encounter",
        fieldname: "patient_encounter",
        fieldtype: "Data",
        default: cur_frm.doc.encounter,
        read_only: 1,
      },
      {
        label: "Invoice Number",
        fieldname: "sales_invoice",
        fieldtype: "Data",
        default: frm.doc.name,
        read_only: 1,
      },
    ],
    primary_action_label: "Create Smart Claim",
    primary_action(values) {
      console.log(values);
      SmartConfirmDiag.hide();
      frappe.msgprint({
        title: "Creating Smart Claim...",
        indicator: "green",
        message: "Please wait, while we create Smart claim",
      });
      frappe.call({
        method: "gch_custom.services.smart_invoice_create",
        args: {
          patient: values.patient,
          encounter: values.patient_encounter,
          invoice: values.sales_invoice,
          has_nhif_payment: values.has_nhif_payment,
          nhif_number: values.nhif_number,
          nhif_amount: values.nhif_amount,
          nhif_member_type: values.nhif_member_type,
          ...smart_benefits_options.find(
            (item) => item.pool_desc == values.benefit
          ),
        },

        callback: function (r) {
          const { message } = r;
          if (!message) {
            frappe.msgprint({
              title: "Error",
              indicator: "red",
              message: `Claim NOT created`,
            });
            return;
          } else {
            frappe.msgprint({
                title: "Success",
                indicator: "green",
                message: `${message}`
            });

            let smart_invoice = r.message[1]

            let d = new frappe.ui.Dialog({
                title: 'Create Smart Payment',
                fields: [
                    {
                        label: 'Message',
                        fieldname: 'message',
                        fieldtype: 'HTML',
                        options: '<b>Please ensure you have retrieved encounter information in the Smart App before creating a payment entry.</b>'
                    }
                ],
                static: true,
                primary_action_label: 'Create Payment',
                primary_action(values) {
                    frappe.call({
                        method: 'gch_custom.services.smart_close_visit',
                        args: {
                            'smart_invoice': smart_invoice
                        },
                        callback: function(response) {
                            if (!response.exc) {
                                frappe.msgprint(__('Payment Entry Created Successfully'));
                            } else {
                                frappe.msgprint(__(response.message));
                            }
                        }
                    });
                },
                secondary_action_label: 'Cancel',
                secondary_action() {
                    d.hide();
                }
            })
            
            d.show();

        }

          // Show dialogue that shows a reminder to click "Retrieve" on the Smart app
          // It also can be used to generate payment entry and refreshing advance payments child table


          // frappe.set_route("/app/slade-claim/" + message);
        },
      });
    },
  });

  // frm.add_custom_button(
  //   "Process Smart",
  //   function () {
      SmartConfirmDiag.show();
  //   },
  //   GET_CONFIRMATION_GRP
  // );
};

const handle_default_insurance = (frm, patient_insurance_list) => {
  if (patient_insurance_list.length > 0) {
    let insurances = [];
    for (let index = 0; index < patient_insurance_list.length; index++) {
      const insurance = patient_insurance_list[index];
      insurances.push(insurance.insurance__scheme);
      if (insurance.is_default) {
        // "principal_member", "membership_no"
        frm.set_value("principal_member", insurance.principal_member);
        frm.refresh_field("principal_member");
        frm.set_value("membership_no", insurance.membership_no);
        frm.refresh_field("membership_no");
        frm.set_value("default_insurance", insurance.insurance__scheme);
        frm.refresh_field("default_insurance");
      }
    }
    frm.set_query("default_insurance", function () {
      return {
        filters: [["name", "in", [...insurances, "general"]]],
      };
    });
  } else {
    frm.set_query("default_insurance", function () {
      return {
        filters: [["name", "in", ["general"]]],
      };
    });
  }
};

const ALLOWED_TO_REOPEN = [
  "Administrator",
  "jmutheu@gerties.org",
  "gitaun@gerties.org",
  "jnyaga@gerties.org",
  "cmbovi@gerties.org",
  "cweru@gerties.org",
  "egithuka@gerties.org",
  "jmule@gerties.org",
  "eatori@gerties.org",
  "mwaudo@gerties.org",
  "lmwangi@gerties.org"
];

if (cur_frm.doc.is_inpatient == 0) {
    $.extend(frappe.meta, {
        get_print_formats: function(doctype) {
    
            
            var print_format_list = ["Standard"];
            var default_print_format = locals.DocType[doctype].default_print_format;
            let enable_raw_printing = frappe.model.get_doc(":Print Settings", "Print Settings").enable_raw_printing;
            var print_formats = frappe.get_list("Print Format", {doc_type: doctype})
                .sort(function(a, b) { return (a > b) ? 1 : -1; });
            $.each(print_formats, function(i, d) {
                if (
                    !in_list(print_format_list, d.name)
                    && d.print_format_type !== 'JS'
                    && (cint(enable_raw_printing) || !d.raw_printing)
                ) {
                    print_format_list.push(d.name);
                }
            });
    
            if(default_print_format && default_print_format != "Standard") {
                var index = print_format_list.indexOf(default_print_format);
                print_format_list.splice(index, 1).sort();
                print_format_list.unshift(default_print_format);
            }
    
            console.log(locals.DocType[doctype].__dashboard.frm.doc.print_format_selector)
    
            if(locals.DocType[doctype].__dashboard.frm.doc.print_format_selector){ //newly added if condition
                var print_format = [locals.DocType[doctype].__dashboard.frm.doc.print_format_selector]
                return print_format
            }
            else{
                return print_format_list;
            }
            
            
    
        },
    });
}


frappe.ui.form.on("Sales Invoice", {
  onload: async (frm) => {

    // Prevent Cancellation of encounter on cancellation of an invoice
    frm.ignore_doctypes_on_cancel_all = [
      "Patient Encounter",
      "Stock Entry Detail GCH",
      "Patient Assessment"
    ];

    


    // reopenSalesInvoice(frm.doc.name);

    //  get current user
    if (cur_frm.doc.docstatus == 1) {

        const current_user = frappe.session.user;
        if (ALLOWED_TO_REOPEN.includes(current_user)) {
        let reopen_invoice_diag = new frappe.ui.Dialog({
            title: "Reopen Sales Invoice",
            fields: [
            {
                label: "Sales Invioice",
                fieldname: "salesInvoice",
                options: "Sales Invoice",
                fieldtype: "Link",
                default: frm.doc.name,
            },
            {
                label: "Status",
                fieldname: "status",
                fieldtype: "Data",
                default: "Draft",
            },

            {
                label: "Docstatus",
                fieldname: "docstatus",
                fieldtype: "Int",
                default: 0,
            },
            ],
            primary_action_label: "Reopen Invoice",
            primary_action(values) {
            reopen_invoice_diag.hide();
            frappe.require(
                "/assets/gch_custom/js/sales_invoice/reopen_sales_invoice.js",
                () => {
                reopenSalesInvoice(
                    values.salesInvoice,
                    values.status,
                    values.docstatus
                );
                frappe.show_alert(
                    {
                    message: __("Reopening Sales Invoice"),
                    indicator: "green",
                    },
                    5
                );
                }
            );
            },
        });

        frm.add_custom_button(
            "Reopen Invoice",
            function () {
            reopen_invoice_diag.show();
            },
            "Reopen Invoice"
        );
        }

    }
    


    if (
      cur_frm.doc.default_insurance &&
      cur_frm.doc.default_insurance != "" &&
      cur_frm.doc.docstatus == 0
    ) {
      frappe.require(
        "/assets/gch_custom/js/sales_invoice/apply_on_invoice.js",
        () => {
          apply_on_invoice(cur_frm);
          frappe.show_alert(
            {
              message: __("Insurance Calculations Completed"),
              indicator: "green",
            },
            5
          );
        }
      );
    }

    // frappe.require(
    //   "/assets/gch_custom/js/sales_invoice/mpesa_payment_processor.js",
    //   () => {
    //     mpesa_payment_processor(cur_frm);
    //   }
    // );

    // Filtering Default insurance field to only show unsuspended insurance categories
    if (!cur_frm.doc.branch) {
      frappe.call({
        method: "gch_custom.services.rest.update_branch_on_walkin_invoice",
        callback: (res) => {
          if (res.message) {
            console.log(res.message);
            cur_frm.set_value("branch", res.message);
            cur_frm.refresh_field("branch");
          }
        },
      });
    }
    console.log("Got here!!!INVOICE");

    // Filtering Default insurance field to only show unsuspended insurance categories
    frm.set_query("default_insurance", function () {
      return {
        filters: [["suspend", "in", ["0"]]],
      };
    });

    // Highlighting suspended insurance categories
    if (cur_frm.doc.default_insurance != undefined) {
      frappe.call({
        method: "gch_custom.services.rest.check_if_insurance_suspended",
        args: {
          insurance_category: cur_frm.doc.default_insurance || " ",
        },
        callback: (res) => {
          if (res.message.suspend) {
            $('input[data-fieldname="default_insurance"]').css("color", "red");
            $('input[data-fieldname="default_insurance"]').css(
              "background-color",
              "#ff000014"
            );
            $('[data-fieldname="default_insurance"]').find(
              "label"
            )[0].innerHTML = "Default Insurance (Suspended, please verify!!!)";
            $('[data-fieldname="default_insurance"]').find(
              "label"
            )[0].style.color = "red";
          } else {
            $('input[data-fieldname="default_insurance"]').css(
              "color",
              "black"
            );
            $('input[data-fieldname="default_insurance"]').css(
              "background-color",
              "#F4F5F6"
            );
            $('[data-fieldname="default_insurance"]').find(
              "label"
            )[0].innerHTML = "Default Insurance";
            $('[data-fieldname="default_insurance"]').find(
              "label"
            )[0].style.color = "black";
          }
        },
      });
    }

    // Hiding buttons on sales invoice
    if (document.querySelector('[data-label="Fetch%20Timesheet"]')) {
        document.querySelector('[data-label="Fetch%20Timesheet"]').style.display = "none";
    }

    if (document.querySelector('[data-label="Get%20Items%20From"]')) {
        document.querySelector('[data-label="Get%20Items%20From"]').style.display = "none";
    }


  },

  on_submit: (frm) => {
    // Close encounter on submission of sales invoice
    if(cur_frm.doc.encounter) {
        frappe.call({
            method: "gch_custom.services.rest.autoclose_encounter",
            args: {
                "patient_encounter": cur_frm.doc.encounter
            },
            callback: (res) => {
                console.log(res)
                frappe.show_alert(
                    {
                      message: __(`Patient Encounter ${cur_frm.doc.encounter} closed successfully.`),
                      indicator: "green",
                    },
                    5
                  );
            }
        })
    }

  },

  mode_of_payment: function (frm) {
    console.log(cur_frm.doc.mode_of_payment, "<=============");
    if (cur_frm.doc.mode_of_payment == "disabled") {
      frappe.require(
        "/assets/gch_custom/js/sales_invoice/check_mode_of_payment.js",
        () => {
          checkModeOfPayment(cur_frm);
        }
      );
    }

    // Update mode of payment on encounter if changed on invoice
    if(cur_frm.doc.encounter && !cur_frm.doc.__islocal && cur_frm.doc.mode_of_payment) {
        frappe.call({
            method: "gch_custom.services.rest.update_mop_on_encounter",
            args: {
                "patient_encounter": cur_frm.doc.encounter,
                "mode_of_payment": cur_frm.doc.mode_of_payment
            },
            callback: (res) => {
                if (res.message == true) {
                    frappe.show_alert(
                        {
                          message: __("Mode of Payment Updated on Encounter"),
                          indicator: "green",
                        },
                        5
                    );
                }
            }
        })
    }
    
    // handle insurance case
    if (cur_frm.doc.mode_of_payment == "Insurance") {
      // check if there is a default insurance
      //   if (
      //     cur_frm.doc.default_insurance == undefined ||
      //     cur_frm.doc.default_insurance == ""
      //   ) {
      //     frappe.msgprint({
      //       title: __("Notification"),
      //       indicator: "green",
      //       message: __(
      //         `Please Select Default Insurance Category for: ${cur_frm.doc.patient_name}`
      //       ),
      //     });
      //   }
      //   frm.set_df_property("nav_id", "reqd", 1);
      //   frm.refresh_field("nav_id");
      //   frm.set_df_property("outpatient_nav_id", "reqd", 1);
      //   frm.refresh_field("outpatient_nav_id");
    }
  },
  default_insurance: async function (frm) {
    if (
      cur_frm.doc.default_insurance &&
      cur_frm.doc.default_insurance != "" &&
      cur_frm.doc.docstatus == 0
    ) {
      frappe.require(
        "/assets/gch_custom/js/sales_invoice/apply_on_invoice.js",
        () => {
          apply_on_invoice(cur_frm);
          frappe.show_alert(
            {
              message: __("Insurance Calculations Completed"),
              indicator: "green",
            },
            5
          );
        }
      );
    }

    // Filtering Default insurance field to only show unsuspended insurance categories
    frm.set_query("default_insurance", function () {
      return {
        filters: [["suspend", "in", ["0"]]],
      };
    });

    // Updating default insurance on encounter if updated on sales invoice
    if(cur_frm.doc.encounter) {
        frappe.call({
            method:
              "gch_custom.services.rest.update_enc_insurance_from_sales_invoice",
            args: {
              changed_default_insurance: cur_frm.doc.default_insurance,
              encounter: cur_frm.doc.encounter,
            },
            callback: function (res) {
              if (res.message == true) {
                frappe.show_alert(
                  {
                    message: __(
                      "Patient Encounter insurance details updated successfully."
                    ),
                    indicator: "green",
                  },
                  5
                );
              } else {
                frappe.show_alert(
                  {
                    message: __(res.message),
                    indicator: "red",
                  },
                  10
                );
              }
            },
        });
    }

    // Fetching outpatient company kra pin if not available on invoice
    if(cur_frm.doc.default_insurance) {

            frappe.call({
                method: "gch_custom.services.rest.fetch_outpatient_company_kra_pin",
                args: {
                    "outpatient_company": cur_frm.doc.insurance_outpatient_company_name,
                    "default_category": cur_frm.doc.default_insurance
                },
                callback: (res) => {
                    if (res.message.insurance_category_kra_pin != null) {
                        console.log(res.message, "\n\n KRA PIN MESSAGE")

                        cur_frm.set_value("outpatient_company_kra_pin", res.message.insurance_category_kra_pin)
                        cur_frm.refresh_field("outpatient_company_kra_pin")
                        // cur_frm.save()
                    }
                    else if(res.message.kra_pin != null) {
                        cur_frm.set_value("outpatient_company_kra_pin", res.message.kra_pin)
                    } 
                    else {
                        frappe.show_alert(
                            {
                              message: __("Insurance Outpatient KRA Pin Not Found"),
                              indicator: "red",
                            },
                            5
                        );
                    }
                }
            })

        }

    // Fetching Insurance Managed Care Cover Price on Invoice if not available
    // if(cur_frm.doc.default_insurance) {

    //     frappe.call({

    //         method: "gch_custom.services.rest.check_if_is_managed_care_invoice_and_get_billing_rule_price",
    //         args: {
    //             "insurance_category": cur_frm.doc.default_insurance,
    //             "insurance_company": cur_frm.doc.insurance_company
    //         },
    //         callback: (res) => {

    //         }

    //     })

    // }
    
  },
  consume_stock: async function (frm) {
    frappe.require(
      "/assets/gch_custom/js/sales_invoice/stock_controller.js",
      () => {
        consume_stock_from_invoice(frm);
      }
    );
  },

  apply_on_invoice: async function (frm) {
    frappe.require(
      "/assets/gch_custom/js/sales_invoice/apply_on_invoice.js",
      () => {
        apply_on_invoice(frm);
      }
    );
  },
  total_insured_amount: async function (frm) {
    // handleSmart(frm);
  },

  refresh: async function (frm) {


    $('.prev-doc, .next-doc').hide();


    // Check modify datetime and time now if the difference is more than 1 minute run all the code below else dont run anything
    let modify_datetime = frm.doc.modified
    let input_date = new Date(modify_datetime.replace(' ', 'T'))
    let time_now = new Date()
    let time_difference = time_now - input_date
    let time_difference_in_minutes = time_difference / 1000 / 60

    // if (time_difference_in_minutes > 1) {
      console.log(time_difference,"time difference");
      
      // Hide sections
    frappe.require("/assets/gch_custom/js/gch_utilities/index.js", () => {
      field_list.forEach((field) =>{
          toggle_permission(frm, field, true)
      })
      // readonly_fields.forEach((field) => {
      //     frm.set_df_property(field, 'read_only', 1);
      // })
    })

    // Check if the custom section already exists to prevent duplication
    if (!cur_frm.fields_dict.custom_header) {
        // Function to format numbers as currency
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES',
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
            }).format(amount || 0);
        };

        // Remove any existing custom header to prevent duplication
        $('#custom-header').remove();

        // // Dynamically calculate the height of the top navigation bar
        // const navBarHeight = $('header.navbar').outerHeight() || 5; // Default to 60px if nav bar height is unavailable

        // Create a custom div to display Bill Amount and Total Advance
        const customHtml = `
            <div class="row" id="custom-header" style="
                position: sticky;
                top: 12%;
                z-index: 1;
                padding: 15px;
                background: #6fdcdc;
                border-bottom: 2px solid #ddd;
                margin-bottom: 10px;
                box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
            ">
            <div class="col-6">
                <p><b>Grand Total:</b> <span style="font-size: 18px; font-weight: 600;" id="bill-amount">${formatCurrency(cur_frm.doc.grand_total)}</span></p>
                <p><b>Total Advance:</b> <span style="font-size: 18px; font-weight: 600;" id="total-advance">${formatCurrency(cur_frm.doc.total_advance)}</span></p>
            </div>
            <div class="col-6">
                <p><b>Outstanding Amount:</b> <span style="font-size: 18px; font-weight: 600;" id="outstanding-amount">${formatCurrency(cur_frm.doc.outstanding_amount)}</span></p>
            </div>
            </div>
        `;

        // Add the custom HTML to the Sales Invoice form above the fields
        $(cur_frm.$wrapper.find('.form-layout')).prepend(customHtml);
    }


    if(frm.doc.is_inpatient == 0) {
      frm.add_custom_button(
        "Back to Queue",
        function () {
          let url = '/app/queue-list';
          window.location.href = url;
        },
      );
    }

    // Fetch mode of payment from linked encounter if unavailable
    if (!cur_frm.doc.mode_of_payment && cur_frm.doc.encounter && !cur_frm.doc.__islocal) {
        // let payment_mode = frappe.db.get_value("Patient Encounter", cur_frm.doc.encounter, "mode_of_payment").then()
        
        // console.log(frappe.db.get_value("Patient Encounter", cur_frm.doc.encounter, "mode_of_payment"))

        // console.log(payment_mode, 'MOP................................')
        frappe.call({
            method: "gch_custom.services.rest.fetch_mode_of_payment_from_encounter",
            args: {
                "encounter" : cur_frm.doc.encounter
            },
            callback: (res) => {
                let mop = res.message;

                cur_frm.set_value("mode_of_payment", mop)
                // cur_frm.save()
            }
        })

    }

    // BUTTON TO AUTO GENERATE PAYMENT ENTRY
    frm.add_custom_button(
        "Create Payment Entry",
        function () {
            // Show dialog to enter amount for payment entry
            // Create a dialog with an amount field
            const dialog = new frappe.ui.Dialog({
                title: 'Enter Payment Entry Details',
                fields: [
                    {
                        label: 'Mode of Payment',
                        fieldname: 'mode_of_payment',
                        fieldtype: 'Link',
                        options: 'Mode of Payment',
                        reqd: 1,
                        description: 'Select the payment method'
                    },
                    {
                        label: 'Transaction ID',
                        fieldname: 'transaction_id',
                        fieldtype: 'Data',
                        reqd: 1,
                        description: "Mpesa Code/Insurance/Transaction Code"
                    },
                    {
                        label: 'Amount',
                        fieldname: 'amount',
                        fieldtype: 'Currency',
                        default: cur_frm.doc.outstanding_amount,
                        reqd: 1
                    }
                ],
                primary_action_label: 'Create Payment Entry',
                primary_action(values) {
                    if (values.amount) {
                        // Temporary fix for customer
                        let customer = cur_frm.doc.patient.split("-")[0]

                        // Make call to create payment entry
                        frappe.call({
                            method: 'gch_custom.services.rest.generate_payment_entry', // Add your method here
                            args: {
                                "amount": values.amount,
                                "customer": customer,
                                "mode_of_payment": values.mode_of_payment,
                                "branch": cur_frm.doc.branch,
                                "transaction_id": values.transaction_id
                            },
                            callback: (res) => {
                                console.log(res);
                                if (res.message == true) {
                                    frappe.msgprint("Payment Entry Created Successfully");

                                    // Auto fetching advances after successful payment
                                    cur_frm.call({
                                        method: "set_advances",
                                        doc: cur_frm.doc,
                                        callback: function(r, rt) {
                                            refresh_field("advances");
                                        }
                                    })

                                    cur_frm.save()
                                }
                            }
                        });

                        dialog.hide(); // Close the dialog
                    } else {
                        frappe.msgprint(__('Please enter an amount.'));
                    }
                }
            });

            dialog.show();

            // Add event listener to update Transaction ID dynamically
            dialog.fields_dict.mode_of_payment.df.onchange = function () {
                const modeOfPayment = dialog.get_value('mode_of_payment');
                if (modeOfPayment == 'Insurance') {
                    dialog.set_value('transaction_id', cur_frm.doc.default_insurance);
                } else {
                    dialog.set_value('transaction_id', '');
                }
            };

        },
        "Process Payments"
    );

    

    
    // CUSTOM CASH PRINT BUTTON
    if (cur_frm.doc.mode_of_payment == "Cash" && !cur_frm.doc.is_inpatient) {
        cur_frm.add_custom_button(__("PRINT CASH RECEIPT"), () => {
            
            console.log("Here.....")
            
            cur_frm.set_value("print_format_selector", "OUTPATIENT CASH RECEIPT")
            cur_frm.print_doc();
            
        });

    } else if (cur_frm.doc.mode_of_payment == "Insurance") {
        
        // Running a query to check if is standard insurance, managed care plan OR COPAY
        
        // Creating variable that will hold the insurance company name if it's inpatient or outpatient
        let insurance_company_holder;

        if (cur_frm.doc.encounter) {
            
            insurance_company_holder = cur_frm.doc.insurance_outpatient_company_name
            
        } else if (cur_frm.doc.is_inpatient && cur_frm.doc.inpatient_record != "") {
            
            insurance_company_holder = cur_frm.doc.insurance_inpatient_company_name

        }

        
        if (cur_frm.doc.default_insurance) {
            // checking if the insurance company is managed care
            frappe.call({
                method: "gch_custom.services.rest.check_if_is_managed_care_invoice_and_get_billing_rule_price",
                args: {
                    "insurance_company": insurance_company_holder,
                    "insurance_category": cur_frm.doc.default_insurance
                },
                callback: (res) => {
                    console.log(res.message, "RESPINSE")
                    
                    
                    if (res.message[0] == true) {
                        // returns an array that holds the true value and the  insurance category doc

                        // Marking the invoice as managed care to show managed care splits section
                        if (!cur_frm.doc.is_managed_care_invoice) {
                            cur_frm.set_value("is_managed_care_invoice", 1)
                            cur_frm.refresh_field("is_managed_care_invoice")

                            // Add row to managed care splits table
                            let managed_care_splits = cur_frm.add_child("managed_care_splits_table")
                            managed_care_splits.consultation_fees = res.message[2].consultation_fees
                            managed_care_splits.pharmacy = res.message[2].pharmacy
                            managed_care_splits.procedures = res.message[2].procedures
                            managed_care_splits.x_ray = res.message[2].x_ray
                            managed_care_splits.lab = res.message[2].lab
                            
                            
                            cur_frm.refresh_field("managed_care_splits_table")
                        }
                        
                        

                        let billing_rules = res.message[1].insurance_billing_rules;

                        if (billing_rules.length < 1) {
                            frappe.show_alert(
                                {
                                  message: __("Billing rules have not been set up for managed care insurance category. Please update to print correct invoice!"),
                                  indicator: "red",
                                },
                                12
                            );
                        } else {
                            for(let i in billing_rules) {
                                if(billing_rules[i].applies_for == "Outpatient") {
                                    // Fetch Value From  Outpatient Billing Rules If It Exist
                                    frappe.call({
                                        method:"gch_custom.services.rest.fetch_price_from_billing_rule",
                                        args: {
                                            "billing_rule_name": billing_rules[i].insurance_billing_rule_templates
                                        },
                                        callback: (res) => {

                                            // Check if managed care price field has value and compare with fetched price
                                            if (!res.message.fixed_amount) {
                                                frappe.show_alert(
                                                    {
                                                      message: __("Please set up billing rule template unit price!"),
                                                      indicator: "red",
                                                    },
                                                    10
                                                );
                                            } else if (res.message.fixed_amount) {
                                                if(!cur_frm.doc.insurance_company_managed_care_price) {
                                                    

                                                    cur_frm.set_value("insurance_company_managed_care_price", res.message.fixed_amount)
                                                    cur_frm.refresh_field("insurance_company_managed_care_price")
                                                    // cur_frm.save()
                                                
                                                } else if (cur_frm.doc.insurance_company_managed_care_price) {
                                                    // Checking if fetched value matches the existing value
                                                    if (cur_frm.doc.insurance_company_managed_care_price != res.message.fixed_amount) {

                                                        cur_frm.set_value("insurance_company_managed_care_price", res.message.fixed_amount)
                                                        cur_frm.refresh_field("insurance_company_managed_care_price")
                                                        // cur_frm.save()

                                                    }

                                                }
                                            }

                                        }
                                    })
                                }
                                else if (billing_rules[i].applies_for == "Inpatient") {
                                     // Fetch Value From  Inpatient Billing Rules If It Exist
                                     frappe.call({
                                        method:"gch_custom.services.rest.fetch_price_from_billing_rule",
                                        args: {
                                            "billing_rule_name": billing_rules[i].insurance_billing_rule_templates
                                        },
                                        callback: (res) => {
                                            // Check if managed care price field has value and compare with fetched price
                                            if (!res.message.fixed_amount) {
                                                frappe.show_alert(
                                                    {
                                                      message: __("Please set up billing rule template unit price!"),
                                                      indicator: "red",
                                                    },
                                                    10
                                                );
                                            } else if (res.message.fixed_amount) {
                                                if(!cur_frm.doc.insurance_company_managed_care_price) {
                                                    

                                                    cur_frm.set_value("insurance_company_managed_care_price", res.message.fixed_amount)
                                                    cur_frm.refresh_field("insurance_company_managed_care_price")
                                                    // ur_frm.save()
                                                
                                                } else if (cur_frm.doc.insurance_company_managed_care_price) {
                                                    // Checking if fetched value matches the existing value
                                                    if (cur_frm.doc.insurance_company_managed_care_price != res.message.fixed_amount) {

                                                        cur_frm.set_value("insurance_company_managed_care_price", res.message.fixed_amount)
                                                        cur_frm.refresh_field("insurance_company_managed_care_price")
                                                        // cur_frm.save()

                                                    }

                                                }
                                            }
                                        }
                                    })
                                }
                                else if (billing_rules[i].applies_for == "Both Inpatient and Outpatient") {
                                    // Fetch Value From  Both Inpatient and Outpatient Billing Rules If It Exist
                                    frappe.call({
                                        method:"gch_custom.services.rest.fetch_price_from_billing_rule",
                                        args: {
                                            "billing_rule_name": billing_rules[i].insurance_billing_rule_templates
                                        },
                                        callback: (res) => {
                                            // Check if managed care price field has value and compare with fetched price
                                            if (!res.message.fixed_amount) {
                                                frappe.show_alert(
                                                    {
                                                      message: __("Please set up billing rule template unit price!"),
                                                      indicator: "red",
                                                    },
                                                    10
                                                );
                                            } else if (res.message.fixed_amount) {
                                                if(!cur_frm.doc.insurance_company_managed_care_price) {
                                                    

                                                    cur_frm.set_value("insurance_company_managed_care_price", res.message.fixed_amount)
                                                    cur_frm.refresh_field("insurance_company_managed_care_price")
                                                    cur_frm.save()
                                                
                                                } else if (cur_frm.doc.insurance_company_managed_care_price) {
                                                    // Checking if fetched value matches the existing value
                                                    if (cur_frm.doc.insurance_company_managed_care_price != res.message.fixed_amount) {

                                                        cur_frm.set_value("insurance_company_managed_care_price", res.message.fixed_amount)
                                                        cur_frm.refresh_field("insurance_company_managed_care_price")
                                                        cur_frm.save()

                                                    }

                                                }
                                            }
                                        }
                                    })
                                }
                            }
                        }
                        
                        
                        if (!cur_frm.doc.is_inpatient) {

                            cur_frm.add_custom_button(__("PRINT MANAGED CARE RECEIPT"), () => {


                                cur_frm.set_value("print_format_selector", "Managed Care Print")
                                cur_frm.print_doc()
    
                            })

                        }

                        


                    }
                    
                    // handle copay invoice print
                    else if(res.message == false) {
                        // CHECK IF THERE IS COPAY IN PAYMENT REFERENCES DOC
                        frappe.call({
                            method: "gch_custom.services.rest.check_if_invoice_has_copay",
                            args: {
                                "sales_invoice_no": cur_frm.doc.name
                            },
                            callback: (res) => {
                                console.log(res)
                                if (res.message == true) {
                                    // IS MANAGED CARE INSURANCE COMPANY
                                    cur_frm.add_custom_button(__("PRINT INVOICE COPAY RECEIPT"), () => {
                        
                                        console.log("Here.....")
                                        
                                        cur_frm.set_value("print_format_selector", "INSURANCE INVOICE COPAY")
                                        cur_frm.print_doc();
                                        
                                    });

                                } else if (res.message == false) {

                                    if(!cur_frm.doc.is_inpatient) {
                                        // NOT A MANAGED CARE INSURANCE COMPANY
                                        cur_frm.add_custom_button(__("PRINT INVOICE RECEIPT"), () => {
                            
                                            console.log("Here.....")
                                            
                                            cur_frm.set_value("print_format_selector", "OUTPATIENT SALES INVOICE")
                                            cur_frm.print_doc();
                                            
                                        });
                                    }
                                    

                                }

                            }
                        })


                    }
                    
                }

            })
        }

        
        
    } 

    if (
      cur_frm.doc.default_insurance &&
      cur_frm.doc.default_insurance != "" &&
      cur_frm.doc.docstatus == 0
    ) {
        // console.log(insurance_company, insurance_category, "Before apply on invoice...")

      frappe.require(
        "/assets/gch_custom/js/sales_invoice/apply_on_invoice.js",
        () => {
          apply_on_invoice(cur_frm);
          frappe.show_alert(
            {
              message: __("Insurance Calculations Completed"),
              indicator: "green",
            },
            5
          );
        }
      );
    }

    if (cur_frm.doc.docstatus == 0) {
      frappe.require(
        "/assets/gch_custom/js/sales_invoice/check_copay.js",
        () => {
          if (
            cur_frm.doc.default_insurance &&
            cur_frm.doc.default_insurance != ""
          ) {
            check_copay(cur_frm.doc.default_insurance);
          }
        }
      );
    }
    // Hiding print button until the document is submitted
    if (cur_frm.doc.docstatus == 0 && !cur_frm.doc.is_inpatient) {
      console.log("Here....");
      $('[data-original-title="Print"]').hide();
      $(".menu-btn-group").find('[data-label="Print"]').parent().hide();
    }

    frm.refresh_field("default_insurance");
    // Check if there is a mode of payment
    frappe.require(
      "/assets/gch_custom/js/sales_invoice/process_insurance.js",
      () => {
        handle_process_insurance(frm);
      }
    );
    // frappe.require(
    //   "/assets/gch_custom/js/sales_invoice/mpesa_payment_processor.js",
    //   () => {
    //     mpesa_payment_processor(cur_frm);
    //   }
    // );

    if (
      cur_frm.doc.mode_of_payment == "disabled" ||
      cur_frm.doc.mode_of_payment == "disabled 2"
    ) {
      frappe.require(
        "/assets/gch_custom/js/sales_invoice/check_mode_of_payment.js",
        () => {
          checkModeOfPayment(cur_frm);
        }
      );
    }

    // handle insurance case
    if (cur_frm.doc.mode_of_payment == "Insurance") {
      // check if there is a default insurance
      if (
        cur_frm.doc.default_insurance == undefined ||
        cur_frm.doc.default_insurance == ""
      ) {
        console.log(" Enter Default insurance");
      }
    }

    let phone_number = cur_frm.doc.mpesa_phone_number;
    let amount = cur_frm.doc.outstanding_amount;

    if (frm.doc.update_stock != 1) {
      cur_frm.set_value("update_stock", 1);
      cur_frm.refresh_field("update_stock");
    }
    if (frm.doc.disable_rounded_total != 0) {
      cur_frm.set_value("disable_rounded_total", 1);
      cur_frm.refresh_field("disable_rounded_total");
    }
    //  if (frm.doc.patient && cur_frm.doc.mode_of_payment == "Insurance") {
    //  get medical
    // Parent Medical Cover Detail

    const patient_insurance_list = await get_patient_insurance(frm.doc.patient);

    //  handleSmart(frm);

    if (
      patient_insurance_list.length > 0 &&
      frm.doc.docstatus == 0 &&
      frm.doc.mode_of_payment == "Insurance"
    ) {
      console.log({ patient_insurance_list });
      let insurances = [];
      for (let index = 0; index < patient_insurance_list.length; index++) {
        const insurance = patient_insurance_list[index];
        insurances.push(insurance.insurance__scheme);
        if (insurance.is_default) {
          // "principal_member", "membership_no"
          if (!cur_frm.doc.principal_member) {
            frm.set_value("principal_member", insurance.principal_member);
            frm.refresh_field("principal_member");
          }

          if (!cur_frm.doc.membership_no) {
            // Auto fetching membership_no
            frm.set_value("membership_no", insurance.membership_no);
            frm.refresh_field("membership_no");
          }

          if (!cur_frm.doc.default_insurance) {
            frm.set_value("default_insurance", insurance.insurance__scheme);
            frm.refresh_field("default_insurance");
          }
        }
      }
      frm.set_query("default_insurance", function () {
        return {
          filters: [["name", "in", [...insurances, "general"]]],
        };
      });
    } else {
      frm.set_query("default_insurance", function () {
        return {
          filters: [["name", "in", ["general"]]],
        };
      });
    }
    // }

    // handleSmart(frm);

    // ===================================================
    // TO BE REMOVED 
    // ===================================================

    const mtibaConfirmDiag = new frappe.ui.Dialog({
      title: "Mtiba Confirmation Details",
      fields: [
        {
          label: "Encounter Number",
          fieldname: "patient_encoutner",
          fieldtype: "Data",
          default: frm.doc.encounter,
          read_only: 1,
        },
        {
          label: "Invoice Number",
          fieldname: "invoice_number",
          fieldtype: "Data",
          default: frm.doc.name,
          read_only: 1,
        },
      ],
      primary_action_label: "Process Mtiba Claim",
      primary_action(values) {
        console.log(values);
        mtibaConfirmDiag.hide();
        frappe.msgprint({
          title: "Confirming Mtiba...",
          indicator: "green",
          message: "Please wait, while we confirm Mtiba Payment",
        });
        frappe.call({
          method: "gch_custom.services.mtiba_reserve_bulk_items_bill",
          args: {
            sales_invoice: values.invoice_number,
            // treatment_code: values.treatment_code,
            patient_encounter: values.patient_encoutner,
          },
          callback: function (r) {
            const { message } = r;
            console.log(message);

            if (message?.apiResponse?.status == "2000") {
              frappe.msgprint({
                title: "Success",
                indicator: "green",
                message: "Claim Submitted successfully",
              });
            }
            frappe.msgprint({
              title: "Failed",
              indicator: "red",
              message: "Claim Not Submitted, Please Try Again",
            });
          },
        });
      },
    });

    const lctConfirmDiag = new frappe.ui.Dialog({
      title: "LCT Confirmation Details",
      fields: [
        // {
        //   label: "Membership Number",
        //   fieldname: "membership_number",
        //   fieldtype: "Data",
        // },

        {
          label: "Patient",
          fieldname: "patient",
          fieldtype: "Data",
          default: frm.doc.patient,
          read_only: 1,
        },
        {
          label: "Invoice Number",
          fieldname: "invoice_number",
          fieldtype: "Data",
          default: frm.doc.name,
          read_only: 1,
        },
      ],
      primary_action_label: "Process LCT Claim",
      primary_action(values) {
        console.log(values);
        lctConfirmDiag.hide();
        frappe.msgprint({
          title: "Confirming LCT...",
          indicator: "green",
          message: "Please wait, while we confirm LCT Payment",
        });
        frappe.call({
          method: "gch_custom.services.lct_claim_create",
          args: {
            // membership_number: values.membership_number,
            patient: cur_frm.doc.patient,
            sales_invoice: cur_frm.doc.name,
          },
          callback: function (r) {
            const { message } = r;
            if (!message) {
              frappe.msgprint({
                title: "Error",
                indicator: "red",
                message: `Claim NOT created`,
              });
              return;
            }
            frappe.msgprint({
              title: "Success",
              indicator: "green",
              message: `Claim:${message}  Created`,
            });
            frappe.set_route("/app/lct-claim/" + message);
          },
        });
      },
    });

    const SladeConfirmDiag = new frappe.ui.Dialog({
      title: "Slade 360 Claim Details",
      fields: [
        {
          label: "Membership Number",
          fieldname: "member_number",
          fieldtype: "Data",
          default: cur_frm.doc.membership_no,
        },
        {
          label: "Select Payer",
          fieldname: "payer_code",
          fieldtype: "Link",
          options: "Slade Payer Codes",
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
          default: cur_frm.doc.encounter,
          read_only: 1,
        },
        {
          label: "Invoice Number",
          fieldname: "sales_invoice",
          fieldtype: "Data",
          default: frm.doc.name,
          read_only: 1,
        },
      ],
      primary_action_label: "Create Slade Claim",
      primary_action(values) {
        console.log(values);
        SladeConfirmDiag.hide();
        frappe.msgprint({
          title: "Creating Slade Claim...",
          indicator: "green",
          message: "Please wait, while we create slade claim",
        });
        frappe.call({
          method: "gch_custom.services.slade_claim_create",
          args: {
            member_number: values.member_number.trim(),
            patient_encounter: values.patient_encounter,
            sales_invoice: values.sales_invoice,
            service_type: values.service_type,
            payer_code: values.payer_code,
          },

          callback: function (r) {
            const { message } = r;
            if (!message) {
              frappe.msgprint({
                title: "Error",
                indicator: "red",
                message: `Claim NOT created`,
              });
              return;
            }
            frappe.msgprint({
              title: "Success",
              indicator: "green",
              message: `Claim:${message}  Created`,
            });
            frappe.set_route("/app/slade-claim/" + message);
          },
        });
      },
    });

    // ===================================================
    // TO BE REMOVED
    // ===================================================

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

    const mpesaConfirmDiag = new frappe.ui.Dialog({
      title: "Mpesa Confirmation Details",
      fields: [
        {
          label: "Pending Transactions",
          fieldname: "pending_transactions",
          fieldtype: "HTML",
        },
        {
          label: "Phone Number",
          fieldname: "phone_number",
          fieldtype: "Data",
          default: phone_number || 254,
        },
        {
          label: "Confirmation Code",
          fieldname: "confirmation_code",
          fieldtype: "Data",
        },
        {
          label: "Invoice Number",
          fieldname: "invoice_number",
          fieldtype: "Data",
          default: frm.doc.name,
          read_only: 1,
        },
      ],
      primary_action_label: "Confirm Payment",
      primary_action(values) {
        console.log(values);
        mpesaConfirmDiag.hide();
        // frappe.msgprint({
        //   title: "Confirming Mpesa Payment...",
        //   indicator: "green",
        //   message: "Please wait, while we confirm Mpesa Payment",
        // });
        frappe.call({
          method: "gch_custom.services.confirm_mpesa_payment",
          args: {
            phone_number: values.phone_number,
            invoice_number: values.invoice_number,
            confirmation_code: values.confirmation_code.toUpperCase(),
          },
          callback: function (r) {
            const { message } = r;

            if (message.code == 200) {
              frappe.require(
                "/assets/gch_custom/js/sales_invoice/get_mpesa.js",
                () => {
                  get_mpesa(
                    cur_frm,
                    message.mpesa_amount,
                    values.confirmation_code.toUpperCase(),
                    values.phone_number
                  );
                }
              );
            } else {
              frappe.msgprint({
                title: "Error",
                indicator: "red",
                message: message.message,
              });
            }
          },
        });
      },
    });

    // ===================================================
    // TO BE REMOVED
    // ===================================================

    // frm.add_custom_button(
    //   "Process LCT",
    //   function () {
    //     lctConfirmDiag.show();
    //   },

    //   GET_CONFIRMATION_GRP
    // );
    // frm.add_custom_button(
    //   "Process Mtiba",
    //   function () {
    //     mtibaConfirmDiag.show();
    //   },

    //   GET_CONFIRMATION_GRP
    // );

    frm.add_custom_button(
      "Process Smart",
      function () {
        
        let key = "dialog_once_" + frm.docname;  // Unique key per record

        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, "true"); // Store flag in browser
            // Fetching Member benefits.. should be ran only once
            frappe.msgprint({
                title: "Getting Member Benefits...",
                indicator: "green",
                message: "Please wait, while we confirm Smart member benefits",
            });
        
            //  Fetch smart visit for member
            frappe.call({
                method: "gch_custom.services.smart_fetch_visits",
                async: false,
                args: {
                patient: cur_frm.doc.patient,
                },
                callback: function (r) {
                if (r.exc) {
                    return frappe.msgprint({
                    title: "Error!",
                    indicator: "red",
                    message: r.exc,
                    });
                }
                const { message } = r;
        
                frappe.msgprint({
                    title: "Success",
                    indicator: "green",
                    message,
                });
                },
            });
        
            //   Merge member details for visit
            frappe.call({
                method: "gch_custom.services.smart_merge_visits",
                args: {
                patient: cur_frm.doc.patient,
                encounter: cur_frm.doc.encounter,
                },
                callback: function (r) {
                if (r.exc) {
                    return frappe.msgprint({
                    title: "Error!",
                    indicator: "red",
                    message: r.exc,
                    });
                }
                const { message } = r;
        
                frappe.msgprint({
                    title: "Success",
                    indicator: "green",
                    message,
                });
                },
            });
            //   Fetch Member Details
            frappe.call({
                method: "gch_custom.services.smart_fetch_member_details",
                args: {
                patient: cur_frm.doc.patient,
                encounter: cur_frm.doc.encounter,
                },
                callback: function (r) {
                if (r.exc) {
                    return frappe.msgprint({
                    title: "Error!",
                    indicator: "red",
                    message: r.exc,
                    });
                }
                const { message } = r;
        
                frappe.msgprint({
                    title: "Success",
                    indicator: "green",
                    message,
                });
                },
            });
        }
        

        handleSmart(cur_frm);
        // SmartConfirmDiag.show();
      },
      GET_CONFIRMATION_GRP
    );

    frm.add_custom_button(
      "Process Slade360",
      function () {
        SladeConfirmDiag.show();
      },

      GET_CONFIRMATION_GRP
    );

    // ===================================================
    // TO BE REMOVED
    // ===================================================

    frm.add_custom_button(
      "Mpesa Paybill Confirmation",
      function () {
        mpesaConfirmDiag.show();
        setTimeout(() => {
          const pending_transactions_elem = document.querySelector(
            '[data-fieldname="pending_transactions"]'
          );
          // const mpesa_checker = setInterval(() => {
          //   frappe.call({
          //     method: "gch_custom.services.check_mpesa_payments",
          //     args: {
          //       phone_number: phone_number,
          //     },
          //     callback: function (r) {
          //       const { message } = r;
          //       pending_transactions_elem.innerHTML = message;
          //     },
          //   });
          // }, 3000);
        }, 2000);
      },

      GET_PAYMENT_GRP
    );
    // STK Button
    frappe.require(
        "/assets/gch_custom/js/sales_invoice/request_stk_push.js",
        () => {
          request_stk_push(cur_frm);
        }
    );
    // frm.add_custom_button(
    //   "Get Mobile Payment",
    //   function () {
    //     MobileMoneyDialog.show();
    //   },

    //   GET_PAYMENT_GRP
    // );

    frm.add_custom_button(
      "Get PDQ Payment",
      function () {
        PinpadDialog.show();
      },

      GET_PAYMENT_GRP
    );

    // remove frappe buttons
    frm.remove_custom_button("Healthcare Services");

    // Filtering Default insurance field to only show unsuspended insurance categories
    cur_frm.set_query("default_insurance", function () {
      return {
        filters: [["suspend", "in", ["0"]]],
      };
    });

    // Highlighting suspended insurance categories
    if (cur_frm.doc.default_insurance != undefined) {
      frappe.call({
        method: "gch_custom.services.rest.check_if_insurance_suspended",
        args: {
          insurance_category: cur_frm.doc.default_insurance || " ",
        },
        callback: (res) => {
          if (res.message.suspend) {
            $('input[data-fieldname="default_insurance"]').css("color", "red");
            $('input[data-fieldname="default_insurance"]').css(
              "background-color",
              "#ff000014"
            );
            $('[data-fieldname="default_insurance"]').find(
              "label"
            )[0].innerHTML = "Default Insurance (Suspended, please verify!!!)";
            $('[data-fieldname="default_insurance"]').find(
              "label"
            )[0].style.color = "red";
          } else {
            $('input[data-fieldname="default_insurance"]').css(
              "color",
              "black"
            );
            $('input[data-fieldname="default_insurance"]').css(
              "background-color",
              "#F4F5F6"
            );
            $('[data-fieldname="default_insurance"]').find(
              "label"
            )[0].innerHTML = "Default Insurance";
            $('[data-fieldname="default_insurance"]').find(
              "label"
            )[0].style.color = "black";
          }
        },
      });
    }
      
    // }

    // Hiding buttons on sales invoice
    if (document.querySelector('[data-label="Fetch%20Timesheet"]')) {
        document.querySelector('[data-label="Fetch%20Timesheet"]').style.display = "none";
    }

    if (document.querySelector('[data-label="Get%20Items%20From"]')) {
        document.querySelector('[data-label="Get%20Items%20From"]').style.display = "none";
    }

    // Hiding download and upload on sales invoice
    $("a.grid-upload")[0].style.display = "none"
    $("a.grid-download")[0].style.display = "none"

    
  },
  after_save: async function (frm) {
    // check if outstanding_amount is 0
    let current_bal = frm.doc.outstanding_amount;

    if (current_bal == 0) {
      console.log({ current_bal });
      // All Invoiced Items  []
      let invoiced_items = frm.doc.items;

      if (invoiced_items.length > 0) {
        for (let index = 0; index < invoiced_items.length; index++) {
          const current_item = invoiced_items[index];
          console.log(current_item.item_group);
          if (current_item.item_group == "Laboratory") {
            console.log(frm.doc.patient);

            let patient = frm.doc.patient;
            let item_code = current_item.item_code;

            console.log({ patient, item_code });
            await frappe
              .call({
                method: "gch_custom.services.rest.create_lab_test",
                args: { patient, item_code },
              })
              .done((r) => {
                frappe.msgprint({
                  title: __("Labtest Created"),
                  indicator: "green",
                  message: `<ul>${r.message}</ul>`,
                });
                console.log(r.message);
              });
          }
        }
      }
    } else {
      console.log("Hey");
    }

    // updating global totals (grand_total, advances, balance) after save
    // Function to format numbers as currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
        }).format(amount || 0);
    };


    $('#bill-amount').text(formatCurrency(frm.doc.grand_total));
    $('#total-advance').text(formatCurrency(frm.doc.total_advance));


  },
  before_submit: (frm) => {
    // Checking when invoice is submitted to store the correction submission values
    console.log("Submitting test................");

    frappe.model.set_value(
      "Sales Invoice",
      cur_frm.doc.name,
      "submitted_date_and_time",
      frappe.datetime.now_datetime()
    );
    frappe.model.set_value(
      "Sales Invoice",
      cur_frm.doc.name,
      "submitted_by",
      frappe.session.user
    );

    // Updating posting date and time to submission date and time
    cur_frm.doc.posting_date = frappe.datetime.now_date();
    cur_frm.doc.posting_time = frappe.datetime.now_time();

    cur_frm.refresh_field("posting_date");
    cur_frm.refresh_field("posting_time");

    // frappe.call({
    //     method: "gch_custom.services.rest.update_invoice_submission_details",
    //     args: {
    //         invoice : cur_frm.doc.name,
    //         submission_date_time : frappe.datetime.now_datetime(),
    //         submitted_by : frappe.session.user
    //     },
    //     callback: (res) => {
    //         console.log(res)
    //     }

    // })
  },

  membership_no: (frm) => {
    // Updating membership number on patient encounter if changed on invoice
    if (cur_frm.doc.membership_no && cur_frm.doc.encounter) {
      frappe.call({
        method:
          "gch_custom.services.rest.update_encounter_membership_no_from_invoice",
        args: {
          changed_membership_no: cur_frm.doc.membership_no,
          encounter_number: cur_frm.doc.encounter,
        },
        callback: (res) => {
          console.log(res);
        },
      });
    }
  },
  principal_member: (frm) => {
    // Updating Principal Member Name on Patient encounter if changed on invoice
    if (cur_frm.doc.principal_member && cur_frm.doc.encounter) {
      frappe.call({
        method:
          "gch_custom.services.rest.update_encounter_principal_member_from_invoice",
        args: {
          changed_principal_member: cur_frm.doc.principal_member,
          encounter_number: cur_frm.doc.encounter,
        },
        callback: (res) => {
          console.log(res);
        },
      });
    }
  },
});

frappe.ui.form.on("Sales Invoice Item", {
  qty: function (frm, cdt, cdn) {
    console.log("Quantity changed");
    let child = locals[cdt][cdn];
    let qty = child.qty;

    let is_paid = child.is_paid;
    console.log({
      qty,
      is_paid,
    });
    if (is_paid == 1) {
      frappe.msgprint({
        title: __("Error"),
        indicator: "red",
        message: `You cannot change the quantity of a paid item`,
      });
      frappe.model.set_value(cdt, cdn, "qty", qty);

      cur_frm.reload_doc();
    }
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
  preauth_amount(frm, cdt, cdn) {
    let child = locals[cdt][cdn];
    let preauth_amount = child.preauth_amount;
    let insured_amount = child.insured_amount;
    let bal = child.bal;
    if (preauth_amount > bal) {
      frappe.msgprint({
        title: __("Error"),
        indicator: "red",
        message: `You cannot pre-authorise more than the balance amount`,
      });
      frappe.model.set_value(cdt, cdn, "preauth_amount", 0);
      refresh_field("invoice_insurance_item_table");
      frappe.validated = false;
      return;
    }
    let bal_amount = bal - preauth_amount;
    frappe.model.set_value(cdt, cdn, "bal", bal_amount);
    refresh_field("invoice_insurance_item_table");
    update_insurance_totals(frm);
  },
});
