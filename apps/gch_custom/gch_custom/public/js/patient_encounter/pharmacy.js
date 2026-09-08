//Creating variables  globally
let first_parent_name;
let first_parent_number;

let second_parent_name;
let second_parent_number;

let available_stock = 0;
let price = 0;
let discount = 0;
let id_list = {};
let latests_idx = 0;
let total_prescription_cost = 0;

const build_select_options = (select_value = 0) => {
  const SELECT_OPTIONS = [];
  for (let index = 1; index <= 1000; index++) {
    let is_selected = index == select_value ? "selected" : undefined;
    SELECT_OPTIONS.push(
      `<option value="${index}"  ${is_selected}>${index}</option>`
    );
  }
  return SELECT_OPTIONS;
};

// TODO: Get drugs(filtered by item group) and set as default.
var item_select_options = [];

const handle_prescription_total = (items) => {
  console.log(cur_frm.doc.prescription_table);
  for (let i = 0; i < items.length; i++) {
    if (items[i].dont_issue == 0) {
      total_prescription_cost += parseInt(items[i].total);
    }
  }

  let total_price_element = document.getElementById("prescription_total");
  console.log(total_price_element, "total_price_element");
  total_price_element.innerHTML = `<span class="badge badge-pill badge-warning ml-1" style="font-size: 14px;">Total Ksh.${total_prescription_cost? total_prescription_cost: 0}</span>`;
};

// Build Item select options based on generic selected
const prepare_item_details = async (item, idx) => {
  selected_generic = item.value.split("~")[0];
  frappe.call({
    method: "gch_custom.services.get_item_based_on_generic",
    args: {
      generic_drug: selected_generic,
    },
    callback(r) {
      if (r.message) {
        item_select_options = r.message;

        let item_options = document.getElementById(`medication_${idx}`);
        SELECT_OPTIONS = ["<option></option>"];

        for (let index = 0; index < item_select_options.length; index++) {
          const item_option = item_select_options[index];
          if (item_option.actual_qty <= 1) {
            SELECT_OPTIONS.push(`
              <option style="color: green;"
                value="${item_option.name}~${item_option.display_name}~${item_option.has_batch_no}">
                ${item_option.display_name} (${item_option.actual_qty})
              </option>
            `);
          } else {
            SELECT_OPTIONS.push(
              `<option value="${item_option.name}~${item_option.display_name}~${item_option.has_batch_no}">
              ${item_option.display_name} (${item_option.actual_qty})
            </option>`
            );
          }
        }
        item_options.innerHTML = SELECT_OPTIONS;
      }
    },
  });
};

// Used to reformat the prescription frequency
const handlePrescriptionFrequency = (prescription_frequency) => {
  if (!prescription_frequency) 0;
  switch (prescription_frequency) {
    case "Every 1 hr":
      return "24 Times a day";
    case "Every 3 hrs":
      return "8 Times a day";
    case "Every 4 hrs":
      return "6 Times a day";
    case "Every 5 hrs":
      return "Every 5 hrs";
    case "Every 6 hrs":
      return "4 Times a day";
    case "Every 8 hrs":
      return "3 Times a day";
    case "Every 12 hrs":
      return "2 Times a day";
    case "Every 24 hrs":
      return "Once a day";
    case "As Needed":
      return "As Needed";
    case "Stat":
      return "Stat";
    case "Weekly":
      return "Weekly";
    case "Monthly":
      return "Monthly";
    case "Quarterly":
      return "Quarterly";
    default:
      return "Not selected";
  }
};

const build_item_name_select_options = (
  item_options,
  idx,
  select_value = 0
) => {
  const SELECT_OPTIONS = [];
  for (let index = 0; index < item_options.length; index++) {
    const item_option = item_options[index];
    let is_selected = item_option.name == select_value ? "selected" : undefined;
    if (item_option.actual_qty < 1) {
      SELECT_OPTIONS.push(`
      <option style="color: green;" value="${item_option.name}~${item_option.display_name}~${item_option.has_batch_no}" ${is_selected}>
      ${item_option.display_name}<span>(${item_option.actual_qty})</span> 
      </option>
      `);
    } else {
      SELECT_OPTIONS.push(
        `<option value="${item_option.name}~${item_option.display_name}~${item_option.has_batch_no}" ${is_selected}>${item_option.display_name} 
          <span>(${item_option.actual_qty})</span> 
        </option>`
      );
    }
  }

  return SELECT_OPTIONS;
};

//Build batch_no select options based on item_name
const build_batch_select_options = (batches, idx, select_value = 0) => {
  batch_options = document.getElementById(`item_batch_${idx}`);
  SELECT_OPTIONS = [];
  for (let index = 0; index < batches.length; index++) {
    const batch = batches[index];
    let is_selected = batch.batch_id == select_value ? "selected" : undefined;

    SELECT_OPTIONS.push(
      `<option value="${batch.batch_id}" ${is_selected}>${batch.batch_id}: ${batch.batch_qty}</option>`
    );
  }
  // console.log(SELECT_OPTIONS, "SELECT_OPTIONS");
  batch_options.innerHTML = SELECT_OPTIONS;
};

handle_save_selected_item_batch = (idx) => {
  let selected_batch = document.getElementById(`item_batch_${idx}`).value;
  let curr_id = id_list[idx];

  if (!selected_batch) {
    frappe.throw("Please select batch for this item");
  }

  frappe.call({
    method: "gch_custom.services.rest.update_prescription_table",
    args: {
      id: curr_id,
      value: selected_batch,
      column: "selected_item_batch",
    },
    callback: function (r) {
      if (r.message) {
        console.log(r.message, "r.message");
        frappe.msgprint({
          title: __("Success"),
          indicator: "green",
          message: "Item Updated successfully",
        });
        cur_frm.refresh_field("prescription_table");
        // document.getElementById(`duplicate_btn_${idx}`).style.display = "none";
        cur_frm.reload_doc();
      } else {
        console.log(r);
      }
    },
  });
};

const highlight_alert = (row) => {
  console.log(row, "highlight_alert");
  if (
    row.high_alert[0].is_high_alert == 1 ||
    row.high_alert[0].is_high_alert == "1"
  ) {
    return `<td  id="generic_name_test11" scope="col">
    <span class="badge badge-pill badge-warning" style="font-size: 0.9rem;font-weight: 400;color: red" >${row.item.generic_drug_name}</span>
    </td>`;
  } else {
    return `<td>
  <span class="badge badge-pill" style="font-size: 0.9rem;font-weight: 400;">${row.item.generic_drug_name}</span>
  </td>`;
  }
};

const highlight_stock_levels = (available_qty) => {
  if (available_qty) {
    if (available_qty <= 10) {
      return `<span class="badge rounded-pill bg-success" style="color: white;font-size: 0.9rem;">${available_qty}</span>`;
    } else {
      return `<span class="badge rounded-pill" style="font-size: 0.9rem;">${available_qty}</span>`;
    }
  } else {
    return `<p>Select item</p>`;
  }
};

const build_table_rows = (table_row_items) => {
  let ROWS = [];

  for (let index = 0; index < table_row_items.length; index++) {
    const single_row = table_row_items[index];
    const stringified_row = JSON.stringify(single_row.item);
    const { route, dose, dose_uom, prescription_frequency, duration } =
      single_row.item;
    idx = single_row.item.idx;
    check_the_box = "";

    if (single_row.item.dont_issue == 0) {
      check_the_box = "checked";
    } else {
      check_the_box = "!checked";
    }

    // console.log("Here, ", single_row);

    ROWS.push(`<tr id="${single_row.item.name}" style="font-weight: bolder; font-size: 12px;">
      <td scope="col">
        <div class="form-check">
          <input style="font-size:12px;font-weight: bolder;"
            type="checkbox"
            class="form-check-input"
            data-column="do_not_issue"
            data-dispensed="${single_row.item.dispensed}"
            data-medication="${single_row.item.medication}"
            data-currentbatch="${single_row.item.selected_item_batch}"
            data-idx="${single_row.item.idx}"
            data-solqty="${single_row.item.selling_quantity}"
            id="${single_row.item.name}"
            onchange="handleDoNotIssue(this,${idx})"
            ${check_the_box}
          />
        </div>
      </td>
      ${highlight_alert(single_row)}
      
      <td scope="col">${route ? route : ""}</td>
      <td scope="col">${dose ? dose : ""} ${dose_uom ? dose_uom : ""}</td>
      <td>
      ${handlePrescriptionFrequency(prescription_frequency)}
      </td>
      <td scope="col">${duration ? duration : ""}</td>
      
      <td scope="col-2">
        <select class="form-control" 
          data-dispensed=${single_row.item.dispensed}
          data-currentvalue=${single_row.item.medication}
          data-currentbatch=${single_row.item.selected_item_batch}
          data-column-idx="medication:${
            single_row.item.name
          }" data-column="medication" id="${
      single_row.item.name
    }" onchange="window.handlePrescriptionChange(this,${idx},true)"
      >
      <option value="${single_row.item.medication}">
        ${single_row.item.item_name ? single_row.item.item_name : ""}
        <option>   
        ${build_item_name_select_options(
          single_row.item_options,
          single_row.item.medication
        )}
        </select>
      </td>
      
      <td scope="col">
        <input type="text" autocomplete="off" value="${
          single_row.item.pharmacy_dose ? single_row.item.pharmacy_dose : " "
        }" class="form-control" data-column="pharmacy_dose" id="${
      single_row.item.name
    }" onchange="window.handlePrescriptionChange(this,idx)" style="min-width:100px"
        >
       
      </td>
      <td scope="col">
        <input type="number" autocomplete="off" value="${
          single_row.item.pharmacy_frequency
            ? single_row.item.pharmacy_frequency
            : " "
        }" class="form-control" data-column="pharmacy_frequency" autocomplete="off" id="${
      single_row.item.name
    }" onchange="window.handlePrescriptionChange(this,idx)" >
       
      </td>
      <td scope="col">
        <input type="text" autocomplete="off" value="${
          single_row.item.pharmacy_duration
            ? single_row.item.pharmacy_duration
            : " "
        }" class="form-control"  data-column="pharmacy_duration" id="${
      single_row.item.name
    }" onchange="window.handlePrescriptionChange(this,idx)" >
      </td>
      <td scope="col">
          
        <input type="number" data-currentvalue=${
          single_row.item.medication
        } data-column-idx="billed_quantity:${
      single_row.item.name
    }"  data-column="billed_quantity" autocomplete="off" value="${
      single_row.item.selling_quantity ? single_row.item.selling_quantity : " "
    }" class="form-control" id="${single_row.item.name}"
      data-dispensed=${single_row.item.dispensed}
      data-solqty=${single_row.item.selling_quantity}
      data-batch="${single_row.item.selected_item_batch}"
      data-idx="${single_row.item.idx}"
      data-medication="${single_row.item.medication}"
         onchange="window.handlePrescriptionChange(this,idx,false,true)"
      />
      </td>
           
      <td scope="col">
      <p data-column-idx="total:${single_row.item.name}" id="${
      single_row.item.name
    }" style="font-size: 16px">${
      single_row.item.total ? single_row.item.total : "0"
    }</p></td>
      <td scope="col">${
        single_row.item.remarks ? single_row.item.remarks : "No notes"
      }</td>
      <td scope="col">
      <input type="text" autocomplete="off" data-column="pharmacy_remark" value="${
        single_row.item.pharmacy_remark ? single_row.item.pharmacy_remark : " "
      }" class="form-control" id="${single_row.item.name}"
      onchange="window.handlePrescriptionChange(this,idx)">
      </td>
   
    </tr>`);
  }
  return ROWS;
};

// function to get stock levels using item_name
const get_available_quantity = (item_code, idx) => {
  frappe.call({
    method: "erpnext.stock.dashboard.item_dashboard.get_data",
    args: {
      item_code: item_code,
      warehouse: "Pharmacy MSA - GCH",
    },
    callback: function (r) {
      if (!r.exc) {
        // console.log(r.message, "stock detail--------s");
        stock_details = r.message;
        if (stock_details.length > 0) {
          document.getElementById(`available_quantity_${idx}`).innerHTML =
            stock_details[0].actual_qty;
          return stock_details;
        } else {
          document.getElementById(`available_quantity_${idx}`).innerHTML = 0;
          return 0;
        }
      }
    },
  });
};

// function to get stock levels on item selection and price
let batch = "";
const get_stock_levels = async (item_name, idx) => {
  // console.log(idx, "stock levels idx");

  // batch = "";
  price = 0

  let item_code = item_name.value.split("~")[0];
  console.log(item_name, "Item CODE!!!@@!!");

  let selected_item_name = item_name.value.split("~")[1];

  frappe.call({
    method: "gch_custom.services.rest.check_branch_pricelist",
    args: { item_code },
    callback: function (r) {
      if (r.message) {
        price = r.message;
        // console.log(price, "PRICE");
      } else {
        // console.log("no price");
        price = 0;
      }
    },
  });

  item_info = await frappe.call({
    method: "gch_custom.services.get_routes",
    args: { item_code },
  });

  if (!selected_item_name.includes("EXTEMPORANEOUS")) {
    await frappe.call({
      method: "gch_custom.services.get_batches",
      args: { item_code },
      callback: function (r) {
        if (r.message) {
          item_batch = r.message;
          batch = item_batch.batch_no;
          console.log(batch);
        }
      },
    });

    // console.log(batch, "item batch");
    // document.getElementById(`item_batch_${idx}`).value = batch;
  }

  // return null

  // build_batch_select_options(item_batch.message, idx);

  // document.getElementById(`route_${idx}`).innerHTML =
  //   item_info.message[0].product_route;

  // console.log(item_info, "item_info");

  // frappe.call({
  //   method: "gch_custom.services.get_stock_levels",
  //   args: {
  //     item_code: item_code,
  //   },
  //   callback: function (r) {
  //     if (!r.exc) {
  //       // code snippet
  //       // console.log(r.message, "stock details");
  //       stock_details = r.message;
  //       if (stock_details.length > 0) {
  //         if (stock_details[0].actual_qty <= 5) {
  //           document.getElementById(
  //             `available_quantity_${idx}`
  //           ).innerHTML = `<span class="badge rounded-pill bg-success" style="color: white;font-size: 1rem;">
  //             ${stock_details[0].actual_qty}
  //           </span>`;
  //           stock_details[0].actual_qty;
  //         } else if (stock_details[0].actual_qty > 6) {
  //           // document.getElementById(
  //           //   `available_quantity_${idx}`
  //           // ).innerHTML = `<span class="badge rounded-pill bg-dark" style="color: white;font-size: 1rem;">${stock_details[0].actual_qty}</span>`;
  //           // stock_details[0].actual_qty;
  //           console.log("stock leve");
  //         }

  //         available_qty = stock_details[0].actual_qty;
  //         // document.getElementById(`available_quantity_${idx}`).innerHTML =
  //         //   stock_details[0].actual_qty;
  //       } else {
  //         console.log("dets",r)
  //         // document.getElementById(
  //         //   `available_quantity_${idx}`
  //         // ).innerHTML = `<p style="font-style: italic" class="badge bg-info">Stock levels not updated</p>`;
  //       }
  //     }
  //   },
  // });
};

const build_dispensement_table = (frm, prescription_table) => {
  // handle_prescription_total(prescription_table)
  let total_prescription_cost = 0;

  for (let i = 0; i < prescription_table.length; i++) {
    if (prescription_table[i].item.dont_issue == 0) {
      total_prescription_cost += parseInt(prescription_table[i].item.total);
      // console.log(items[i].item);
    }
  }
  console.log("Total herer", total_prescription_cost);

  console.log(prescription_table, "prescription_table");

  const handlePrescriptionChange = async (
    field_element,
    idx = -1,
    medication = false,
    selling = false
  ) => {
    let dispensed = field_element.dataset.dispensed;

    
    if(cur_frm.doc.workflow_state == "Pending Invoice Closing"){
      frappe.throw("Prescriptions cannot be edited when workflow state is Pending Invoice Closing");
      return;
    }

    if(cur_frm.doc.docstatus == 1){
      frappe.throw("Prescriptions cannot be edited if encounter is closed");
      return;
    }

    if (medication) {
      console.log(field_element.dataset.dispensed);

      if (dispensed == 1) {
      let batch = field_element.dataset.currentbatch? field_element.dataset.currentbatch:"";
      let obj_location = field_element.dataset.idx -1;
      let batch_1 = cur_frm.doc.prescription_table[obj_location].selected_item_batch

        frappe.confirm(
          "This Item has already been dispensed. Do you want to return?",
          () =>
            frappe.prompt(
              [
                {
                  label: "Return Reason",
                  fieldname: "return_reason",
                  fieldtype: "Data",
                },
              ],
              (values) => {
                console.log(values.return_reason);
                return_reason = values.return_reason;
                let item_code = field_element.value.split("~")[0];
                // let idx_bill = field_element?.id || idx;
                // let billed_quantity_element = document.querySelector(
                //   `[data-column-idx="billed_quantity:${idx_bill}"]`
                // );
                // let billed_qty = parseFloat(billed_quantity_element.value) || 0;
                let billed_qty = field_element.dataset.solqty;
                var returned_by = frappe.session.user_fullname;

                if (!return_reason) {
                  frappe.throw("Error!! Return reason is required.");
                }
                data = {
                  return_reason: return_reason,
                  item_code: item_code,
                  encounter: cur_frm.doc.name,
                  return_quantity: billed_qty,
                  returned_by: returned_by,
                  batch: batch_1,
                };
                console.table(data);

                frappe.call({
                  method: "gch_custom.services.prescription_return_details",
                  args: { ...data },
                  callback: async function (r) {
                    if (r.message) {
                      console.log(r.message);
                      let med = field_element.dataset.currentvalue;
                      let encounter = cur_frm.doc.encounter_number;
                      console.log(
                        "YES!!!!!!",
                        med,
                        cur_frm.doc.encounter_number
                      );

                      return_prescription = await frappe.call({
                        method: "gch_custom.services.return_stock",
                        args: {
                          encounter: encounter,
                          item_code: med,
                        },
                        callback: (res) => {
                          if(res.message){
                            frappe.show_alert(
                              {
                                message: __(
                                  "Prescription has been returned successfuly"
                                ),
                                indicator: "green",
                              },
                              10
                            );
                            cur_frm.refresh_fields("prescription_table");
                            cur_frm.reload_doc();
                          }else {
                            frappe.show_alert(
                              {
                                message: __(
                                  "Something went wrong. Please try again"
                                ),
                                indicator: "red",
                              },
                              10
                            );
                            cur_frm.refresh_fields("prescription_table");
                            cur_frm.reload_doc();
                          }
                        }
                      });

                      // if (return_prescription) {
                      //   frappe.call({
                      //     method: "gch_custom.services.mark_dispensed_as_false",
                      //     args: {
                      //       encounter: encounter,
                      //       item_code: med,
                      //     },
                      //     callback(r) {
                      //       if (r.message) {
                      //         frappe.show_alert(
                      //           {
                      //             message: __(
                      //               "Prescription has been returned successfuly"
                      //             ),
                      //             indicator: "green",
                      //           },
                      //           10
                      //         );
                      //         cur_frm.refresh_fields("prescription_table");
                      //         cur_frm.reload_doc();
                      //       }
                      //     },
                      //   });
                      // } else {
                      //   frappe.throw(
                      //     "Something went wrong. Please try again!!"
                      //   );
                      
                      // calculate_total_cost(idx, field_element);
                      cur_frm.refresh_fields("prescription_table");
                      cur_frm.reload_doc();
                    }
                  },
                });
              }
            ),
          () => {
            cur_frm.refresh_fields("prescription_table");
            cur_frm.reload_doc();
            handle_prescription_total(cur_frm.doc.prescription_table);
          }
        );
        return null;
      }

      let has_batch_no = field_element.value.split("~")[2];
      console.log(has_batch_no, 'has batch_no');
      let current_id;
      current_id = field_element.id;
      let med = field_element.value.split("~")[0];
      let item_name = field_element.value.split("~")[1];
      let available_qty = 0;
      let dispensed_at = frappe.datetime.now_datetime();
      let dispensed_by = frappe.session.user_fullname;
      let batch = "";


      if (has_batch_no == 1) {
        await frappe.call({
          method: "gch_custom.services.get_batches",
          args: {
            item_code: med,
          },
          callback: function (r) {
            if (r.message) {
              item_batches = r.message;
              batch = r.message.batch_no;
            }
          },
        });
      }

      // Update price and total on item change
      let idx_bill = field_element?.id || idx;
      let billed_quantity_element = document.querySelector(
        `[data-column-idx="billed_quantity:${idx_bill}"]`
      );
      let billed_qty = parseFloat(billed_quantity_element.value) || 0;
      unit_price = 0;
      await frappe.call({
        method: "gch_custom.services.rest.check_branch_pricelist",
        args: { item_code: med },
        callback: function (r) {
          if (r.message) {
            unit_price = r.message;
          }
        },
      });
      total = unit_price * billed_qty;
      document.querySelector(`[data-column-idx="total:${current_id}"]`).innerHTML = total;

      // get routes and other labels on item select
      let extra_item_info = await frappe.db.get_doc("Item", med);

      frappe.call({
        method: "gch_custom.services.update_prescription",
        args: {
          id: current_id,
          item_name: item_name,
          medication: med,
          additional_item_info: extra_item_info.additional_label_info,
          item_route: extra_item_info.product_route,
          sub_preparation_type: extra_item_info.sub_preparation_type,
          item_preparation_type: extra_item_info.product_type,
          unit_of_measure: extra_item_info.stock_uom,
          available_quantity: available_qty,
          dispensed_at: dispensed_at,
          dispensed_by: dispensed_by,
          selected_item_batch: batch,
          total: total,
        },
        callback: function (r) {
          // console.log(r, "RESPONSE!!");
          return "route updated";
        },
      });
      cur_frm.refresh_fields("prescription_table");
      cur_frm.reload_doc();
      // handle_prescription_total(cur_frm.doc.prescription_table);


      // get stock levels on item selection and price
    } else if (selling) {
      // console.log("SELLLIIING!!!",dispensed,field_element);
      let obj_location = field_element.dataset.idx -1;

      cur_frm.refresh_fields("prescription_table");
      cur_frm.reload_doc();

      if (dispensed == 1) {

        
        let batch_1 = cur_frm.doc.prescription_table[obj_location].selected_item_batch

        let currently_dispensed_qty = cur_frm.doc.prescription_table[obj_location].billed_quantity;

        frappe.confirm(
          "This Item has already been dispensed. Do you want to return?",
          () =>
            frappe.prompt(
              [
                {
                  label: "Return Reason",
                  fieldname: "return_reason",
                  fieldtype: "Data",
                  reqd: 1
                },
                {
                  label: "Return Quantity",
                  fieldname: "return_quantity",
                  fieldtype: "Int",
                  reqd: 1
                }
              ],
              (values) => {
                return_reason = values.return_reason;
                let item_code = field_element.dataset.currentvalue;
                // let batch = document.getElementById(`item_batch_${idx}`).value;
                let idx_bill = field_element?.id || idx;

                
                let billed_qty = field_element.dataset.solqty;
                let batch = field_element.dataset.batch;
                var returned_by = frappe.session.user_fullname;
                let returned_qty = values.return_quantity;

                if (values.return_quantity > currently_dispensed_qty || values.return_quantity <= 0) {
                  cur_frm.refresh_fields("prescription_table");
                  cur_frm.reload_doc();
                  frappe.throw("Error!! Cannot return more than was dispensed or Less than 0.");
                }
                data = {
                  return_reason: return_reason,
                  item_code: item_code,
                  encounter: cur_frm.doc.name,
                  return_quantity: returned_qty,
                  returned_by: returned_by,
                  batch: batch_1,
                  billed_qty: billed_qty,

                };
                console.table(data);
                // return

                frappe.call({
                  method: "gch_custom.services.prescription_return_details",
                  args: { ...data },
                  callback: async function (r) {
                    if (r.message) {
                      console.log(r.message);
                      let med = field_element.dataset.currentvalue;
                      let encounter = cur_frm.doc.encounter_number;
                      console.log(
                        "YES!!!!!!",
                        med,
                        cur_frm.doc.encounter_number
                      );

                      return_prescription = await frappe.call({
                        method: "gch_custom.services.return_stock",
                        args: {
                          encounter: encounter,
                          item_code: med,
                          returned_qty: returned_qty,
                        },
                        callback: (res) => {
                          if(res.message){
                            frappe.show_alert(
                              {
                                message: __(
                                  "Prescription has been returned successfuly"
                                ),
                                indicator: "green",
                              },
                              10
                            );
                            cur_frm.refresh_fields("prescription_table");
                            cur_frm.reload_doc();
                          }else {
                            frappe.show_alert(
                              {
                                message: __(
                                  "Something went wrong. Please try again"
                                ),
                                indicator: "red",
                              },
                              10
                            );
                            cur_frm.refresh_fields("prescription_table");
                            cur_frm.reload_doc();
                          }
                        }
                      });

                      // if (return_prescription) {
                      //   frappe.call({
                      //     method: "gch_custom.services.mark_dispensed_as_false",
                      //     args: {
                      //       encounter: encounter,
                      //       item_code: med,
                      //       returned_qty: returned_qty,
                      //     },
                      //     callback(r) {
                      //       if (r.message) {
                      //         frappe.show_alert(
                      //           {
                      //             message: __(
                      //               "Prescription has been returned successfuly"
                      //             ),
                      //             indicator: "green",
                      //           },
                      //           10
                      //         );
                      //         cur_frm.refresh_fields("prescription_table");
                      //         cur_frm.reload_doc();
                      //       }
                      //     },
                      //   });
                      // } else {
                      //   frappe.throw(
                      //     "Something went wrong. Please try again!!"
                      //   );
                      // }

                      cur_frm.refresh_fields("prescription_table");
                      cur_frm.reload_doc();
                    }
                  },
                });
              }
            ),
          () => {
            // console.log("NO!!!!!!!!!!!!!!!!!!!!!");
            cur_frm.refresh_fields("prescription_table");
            cur_frm.reload_doc();
          }
        );
        return null;
      }

      let idx_bill = field_element?.id || idx;
      let billed_quantity_element = document.querySelector(
        `[data-column-idx="billed_quantity:${idx_bill}"]`
      );

      let medication_element = field_element.dataset.medication;
      
      console.log(
        "Feild Element", field_element,
      );
      let billed_qty = parseFloat(billed_quantity_element.value) || 0;

      let total_cost_element = document.querySelector(
        `[data-column-idx="total:${idx_bill}"]`
      );

      let item_code_generic = cur_frm.doc.prescription_table[obj_location].medication;

      let total_price = 0;

      await frappe.call({
        method: "gch_custom.services.rest.check_branch_pricelist",
        args: { item_code: item_code_generic },
        callback: function (r) {
          if (r.message) {
            price = r.message;
            console.log(price, "PRICE");
            total_price = billed_qty * price;
            console.table({ billed_qty, price, total_price });

            total_cost_element.innerHTML = total_price;
          } else {
            console.log("no price", r);
            total_cost_element.innerHTML = 0;
          }
        },
      });

      console.table({ billed_qty, price, total_price });

      await frappe.call({
        method: "gch_custom.services.set_total_cost",
        args: {
          id: idx_bill,
          billed_quantity: billed_qty,
          total_cost: total_price,
        },
        callback: function (r) {
          if (r.message) {
            console.log(r.message,"set total cost");
          } else {
            console.log("something went wrong!!", r);
          }
        },
      });
      cur_frm.refresh_fields("prescription_table");
      cur_frm.reload_doc();
    } else {
      frappe.call({
        method: "gch_custom.services.rest.update_prescription_table",
        args: {
          id: field_element.id,
          value: field_element.value,
          column: field_element.dataset.column,
        },
        callback(r) {
          // console.log(r);
          if (r.message) {
            if (idx != -1) {
              calculate_total_cost(idx, field_element);
              // console.log(r.message, "message");
            }
          }
        },
      });
    }
  };

  // function to handle do not issue checkbox
  const handleDoNotIssue = async (field_element, idx) => {
    issue = field_element.checked ? 0 : 1;
    console.log(issue, "issue");

    dispensed = field_element.dataset.dispensed;
    med = field_element.dataset.medication;
    let obj_location = idx -1;
    let batch_1 = cur_frm.doc.prescription_table[obj_location].selected_item_batch

    if (dispensed == 1) {
      frappe.confirm(
        "This Item has already been dispensed. Do you want to return?",
        () =>
          frappe.prompt(
            [
              {
                label: "Return Reason",
                fieldname: "return_reason",
                fieldtype: "Data",
              },
            ],
            (values) => {
              console.log(values.return_reason);
              return_reason = values.return_reason;
              let batch = field_element.dataset.currentbatch; // Get batch an alternative way for batch.
              
              let billed_qty = field_element.dataset.solqty;
              var returned_by = frappe.session.user_fullname;

              if (!return_reason) {
                frappe.throw("Error!! Return reason is required.");
              }
              data = {
                return_reason: return_reason,
                item_code: med,
                encounter: cur_frm.doc.name,
                return_quantity: billed_qty,
                returned_by: returned_by,
                batch: batch_1,
                billed_qty: billed_qty,
              };
              console.table(data);
              // return



              frappe.call({
                method: "gch_custom.services.prescription_return_details",
                args: { ...data },
                callback: async function (r) {
                  if (r.message) {
                    console.log(r.message);
                    let encounter = cur_frm.doc.encounter_number;
                    console.log("YES!!!!!!", med, cur_frm.doc.encounter_number);

                    return_prescription = await frappe.call({
                      method: "gch_custom.services.return_stock",
                      args: {
                        encounter: encounter,
                        item_code: med,
                        returned_qty: billed_qty,
                      },
                      callback: (res) => {
                        if(res.message){
                          frappe.show_alert(
                            {
                              message: __(
                                "Prescription has been returned successfuly"
                              ),
                              indicator: "green",
                            },
                            10
                          );
                          cur_frm.refresh_fields("prescription_table");
                          cur_frm.reload_doc();
                        }else {
                          frappe.show_alert(
                            {
                              message: __(
                                "Something went wrong. Please try again"
                              ),
                              indicator: "red",
                            },
                            10
                          );
                          cur_frm.refresh_fields("prescription_table");
                          cur_frm.reload_doc();
                        }
                      }
                    });

                    // if (return_prescription) {
                    //   await frappe.call({
                    //     method: "gch_custom.services.mark_dispensed_as_false",
                    //     args: {
                    //       encounter: encounter,
                    //       item_code: med,
                    //       dont_issue: 1,

                    //     },
                    //     callback(r) {
                    //       if (r.message) {
                    //         frappe.show_alert(
                    //           {
                    //             message: __(
                    //               "Prescription has been returned successfuly"
                    //             ),
                    //             indicator: "green",
                    //           },
                    //           10
                    //         );
                    //         cur_frm.refresh_fields("prescription_table");
                    //         cur_frm.reload_doc();
                    //       }
                    //     },
                    //   });
                    //   await frappe.call({
                    //     method: "gch_custom.services.rest.update_prescription_table",
                    //     args: {
                    //       id: field_element.id,
                    //       value: issue,
                    //       column: field_element.dataset.column,
                    //     },
                    //     callback(r) {
                    //       // console.log(r);
                    //     },
                    //   });
                    // } else {
                    //   frappe.throw("Something went wrong. Please try again!!");
                    // }

                    cur_frm.refresh_fields("prescription_table");
                    cur_frm.reload_doc();
                  }
                },
              });
            }
          ),
        () => {
          console.log("NO!!!!!!!!!!!!!!!!!!!!!");
          cur_frm.refresh_fields("prescription_table");
          cur_frm.reload_doc();
        }
      );
      return null;
    }

    if (issue == 1) {
      // console.log("don't issues this drug");
      console.table({
        id: field_element.id,
        value: 1,
        column: field_element.dataset.column,
      });

      frappe.call({
        method: "gch_custom.services.rest.update_prescription_table",
        args: {
          id: field_element.id,
          value: 1,
          column: field_element.dataset.column,
        },
        callback(r) {
          // console.log(r);
        },
      });
    } else {
      // console.log("Really??");
      frappe.call({
        method: "gch_custom.services.rest.update_prescription_table",
        args: {
          id: field_element.id,
          value: 0,
          column: field_element.dataset.column,
        },
        callback(r) {
          // console.log(r);
        },
      });
    }
    cur_frm.refresh_fields("prescription_table");
    cur_frm.reload_doc();
    handle_prescription_total(cur_frm.doc.prescription_table);
  };

  const handlePrescriptionAdd = (e) => {
    let row_data = JSON.parse(decodeURIComponent(e));
  };

  const get_drug_name = () => {
    frappe.call({
      method: "gch_custom.services.rest.get_drugs",
      callback(r) {
        drugs = r;
        // console.log(drugs, "drugs");
      },
    });
  };

  const build_generic_drug_name_select_options = (drug_options) => {
    const SELECT_OPTIONS = [];

    for (let index = 0; index < drug_options.length; index++) {
      const item_option = drug_options[index];
      SELECT_OPTIONS.push(
        `<option 
          value="${item_option.name}~${item_option.generic_name}~${item_option.valuation_rate}~${item_option.stock_uom}~${item_option.sub_preparation_type}~${item_option.additional_label_info}"
          style="text-transform: capitalize;"
          >
          ${item_option.generic_name}
        </option>`
      );
    }

    // console.log(SELECT_OPTIONS.join(""));

    return SELECT_OPTIONS.join("");
  };

  const build_generic_drug_item_select_options = (drug_item) => {
    const SELECT_OPTIONS = [];

    for (let index = 0; index < drug_item.length; index++) {
      const item_option = drug_item[index];
      if (item_option.actual_qty <= 1) {
        SELECT_OPTIONS.push(`
          <option style="color: green;"
          value="${item_option.name}~${item_option.item_name}~${item_option.valuation_rate}~${item_option.has_batch_no}" >
          ${item_option.item_name} (${item_option.actual_qty})
          </option>
        `);
      } else {
        SELECT_OPTIONS.push(
          `<option 
          value="${item_option.name}~${item_option.item_name}~${item_option.valuation_rate}~${item_option.has_batch_no}" >
          ${item_option.item_name} (${item_option.actual_qty})
        </option>`
        );
      }
    }

    return SELECT_OPTIONS.join("");
  };

  // Additional pharmacy fields

  const get_preparation_types = (e, idx) => {
    // console.log(e, "e.value");
  };

  const get_drug_routes = (e, cell) => {
    // console.log(e.value, cell);
  };

  //end of pharmacy fields

  // Check user warehouse
  const check_warehouse = async () => {
    warehouse = await frappe.call({
      method: "gch_custom.services.get_station_details",
      callback: (res) => {
        console.log("YOU ARE IN WAREHOUSE", res.message);
      },
    });
  };

  const handle_general_add_row = () => {
    let tableRef = document.getElementById("dynamic_prescription_table");
    let newRow = tableRef.insertRow(-1);
    let idx = newRow.rowIndex;

    console.log(idx, "idx");

    let new_cell = newRow.insertCell(0);
    let new_cell2 = newRow.insertCell(1);
    let new_cell3 = newRow.insertCell(2);
    let new_cell4 = newRow.insertCell(3);
    let new_cell5 = newRow.insertCell(4);
    let new_cell6 = newRow.insertCell(5);
    let new_cell7 = newRow.insertCell(6);
    let new_cell8 = newRow.insertCell(7);
    let new_cell9 = newRow.insertCell(8);
    let new_cell10 = newRow.insertCell(9);
    let new_cell11 = newRow.insertCell(10);
    let new_cell12 = newRow.insertCell(11);
    let new_cell13 = newRow.insertCell(12);
    let new_cell14 = newRow.insertCell(13);
    let new_cell15 = newRow.insertCell(14);
    // let new_cell19 = newRow.insertCell(18);

    new_cell.innerHTML = `<td scope="col">
                            <div class="form-check">
                              <input
                                type="checkbox"
                                class="form-check-input"
                                id="exampleCheck1"
                                checked
                              />
                            </div>
                          </td>`;

    frappe.call({
      method: "gch_custom.services.rest.get_drugs",
      callback: function (r) {
        let drugs = r.message;

        new_cell2.innerHTML = `<td scope="col">
                        <select class="form-control"
                          data-column="Generic Drug Name"
                          id="generic_drug_name_${idx}"
                          onchange="prepare_item_details(this, ${idx})">
                        > <option></option>
                          ${build_generic_drug_name_select_options(drugs)}
                        <select/>
                      </td>`;
      },
    });

    frappe.call({
      method: "gch_custom.services.rest.get_routes",
      callback: function (r) {
        let routes = r.message;
        new_cell3.innerHTML = `<td scope="col">
                        <select class="form-control-xs"
                          data-column="Generic Drug UOM"
                          id="generic_drug_route_${idx}"
                          disabled="true"
                        >
                        <option style="font-size:9">Disabled</option>
                      <select/>
                    </td>`;
      },
    });

    frappe.call({
      method: "gch_custom.services.rest.get_drug_uom",
      callback: function (r) {
        let routes = r.message;

        new_cell4.innerHTML = `<td scope="col">
                        <select class="form-control-xs"
                          data-column="Generic Drug Route"
                          id="generic_drug_uom_${idx}"
                          disabled="true"
                        >
                        <option style="font-size:9">Disabled</option>
                      <select/>
                    </td>`;
      },
    });

    new_cell5.innerHTML = `<td scope="col">
                            <select class="form-control-xs"
                                data-column="Generic Drug Route"
                                disabled="true"
                              >
                              <option style="font-size:9">Disabled</option>
                            <select/>
                          </td>`;

    new_cell6.innerHTML = `<td scope="col">
                          <select class="form-control-xs"
                              data-column="Generic Drug Route"
                              disabled="true"
                          >
                            <option style="font-size:9">Disabled</option>
                          <select/></td>`;
    new_cell15.innerHTML = `<td><button id="${idx}" class="btn btn-info btn-xs" style="font-size: 8px" onclick="save_new_prescriptions(${idx},false,true)">Save</button></td>`;

    frappe.call({
      method: "gch_custom.services.rest.get_all_drug_items",
      callback: function (r) {
        new_cell7.innerHTML = `<td scope="col">
                              <select class="form-control"
                                data-column="medication"
                                data-column-idx="medication:${idx}"
                                id="medication_${idx}"
                                onchange=get_stock_levels(this,${idx})
                              >
                              <select/>
                            </td>`;
      },
    });

    new_cell8.innerHTML = `<td scope="col">
                            <input type="text"
                              style="min-width: 4.875rem"
                              value=""
                              class="form-control"
                              data-column="pharmacy_dose"
                              id="pharmacy_dose_${idx}"
                              autocomplete="off"
                            >
                          </td>`;
    new_cell9.innerHTML = `<td scope="col">
                        <input
                          type="number"
                          value=""
                          class="form-control"
                          data_column="pharmacy_frequency"
                          id="pharmacy_frequency_${idx}"
                          autocomplete="off"/
                          />
                      </td>`;
    new_cell10.innerHTML = `<td scope="col">
                              <input type="text"
                                  value=""
                                  class="form-control"
                                  data_column="pharmacy_duration"
                                  id="pharmacy_duration_${idx}"
                                  autocomplete="off"
                              />
                            </td>`;

    // new_cell14.innerHTML = `<td scope="col"><span id="available_quantity_${idx}"></span></td>`;
    new_cell11.innerHTML = `<td scope="col">
                              <input type="number"
                                class="form-control"
                                data-column-idx="billed_quantity:${idx}"
                                data-column="billed_quantity"
                                onchange="calculate_total_cost(${idx},this)"
                                id="${idx}"
                              />
                            </td>`;

    new_cell12.innerHTML = `<td scope="col">
                              <p data-column-idx="total:${idx}" id="${idx}" style="font-size: 16px"></p>
                            </td>`;
    new_cell13.innerHTML = `<td scope="col">
                              <input type="text"
                                class="form-control"
                                placeholder="No Notes"
                                readonly
                                data-column="remark"
                                id="" />
                            </td>`;
    new_cell14.innerHTML = `<td scope="col">
                              <input type="text"
                                class="form-control"
                                placeholder="Pharmacy Notes"
                                data-column="pharmacy_remarks"
                                id="pharmacy_remark_${idx}"
                                autocomplete="off"
                              />
                            </td>`;
  };

  const handle_duplicate_add_row = (e) => {
    let row_data = JSON.parse(decodeURIComponent(e));
    let tableRef = document.getElementById("dynamic_prescription_table");

    let newRow = tableRef.insertRow(-1);
    let idx = newRow.rowIndex;

    const stringified_row = JSON.stringify(newRow);
    // console.log("ROW Data", row_data);

    let new_cell = newRow.insertCell(0);

    let new_cell2 = newRow.insertCell(1);
    let new_cell3 = newRow.insertCell(2);
    let new_cell4 = newRow.insertCell(3);
    let new_cell5 = newRow.insertCell(4);
    let new_cell6 = newRow.insertCell(5);
    let new_cell7 = newRow.insertCell(6);
    let new_cell8 = newRow.insertCell(7);
    let new_cell9 = newRow.insertCell(8);
    let new_cell10 = newRow.insertCell(9);
    let new_cell11 = newRow.insertCell(10);
    let new_cell12 = newRow.insertCell(11);
    let new_cell13 = newRow.insertCell(12);
    let new_cell14 = newRow.insertCell(13);
    let new_cell15 = newRow.insertCell(14);
    let new_cell16 = newRow.insertCell(15);
    let new_cell17 = newRow.insertCell(16);
    let new_cell18 = newRow.insertCell(17);
    // let new_cell19 = newRow.insertCell(18);

    new_cell.innerHTML = `<td scope="col">
                            <div class="form-check">
                              <input
                                type="checkbox"
                                class="form-check-input"
                                id="do_not_issue_${idx}"
                                checked
                              />
                            </div>
                          </td>`;

    new_cell2.innerHTML = `<td scope="col">
                            <input readonly id="generic_drug_name_${idx}" class="form-control" style="min-width:100px" 
                            value="${
                              row_data.generic_drug_name
                                ? row_data.generic_drug_name
                                : ""
                            }" />
                            <input type="hidden" id="generic_drug_${idx}" value="${
      row_data.generic_drug ? row_data.generic_drug : ""
    }" />                    
                          </td>`;
    new_cell3.innerHTML = `<td scope="col" id="generic_drug_route_${idx}">
                            <input id="generic_drug_route_${idx}" 
                              value="${row_data.route ? row_data.route : ""}"
                              readonly class="form-control" style="min-width: 100px"
                            />
                            <input type="hidden"
                            style="max-width: 1px"
                            id="generic_drug_preparation_type_${idx}" 
                            value="${
                              row_data.preparation_type
                                ? row_data.preparation_type
                                : ""
                            }" />
                          </td>`;
    new_cell4.innerHTML = `<td scope="col">
                              <input id="generic_drug_uom_${idx}"
                                readonly class="form-control" style="min-width: 60px"
                                value="${row_data.dose ? row_data.dose : ""} ${
      row_data.dose_uom ? row_data.dose_uom : ""
    }" />
                            </td>`;
    new_cell5.innerHTML = `<td scope="col" >
                              <span >
                              ${handlePrescriptionFrequency(
                                row_data.prescription_frequency
                              )}</span>
                              <input type="hidden" id="frequency_${idx}" value="${
      row_data.prescription_frequency ? row_data.prescription_frequency : ""
    }" />
                            </td>`;
    new_cell6.innerHTML = `<td scope="col">
                              <input id="duration_${idx}" value="${
      row_data.duration ? row_data.duration : ""
    }"
                                readonly class="form-control" style="width: 50px"
                              />
                            </td>`;
    new_cell15.innerHTML = `<td><button id="${idx}" class="btn btn-info btn-xs" style="font-size:8px;" onclick="save_new_prescriptions(${idx},true)">Save</button></td>`;

    frappe.call({
      method: "gch_custom.services.rest.get_drug_item_name",
      args: { generic_drug: row_data.generic_drug },
      callback: function (r) {
        let items = r.message;
        console.log("Medication Items", items);
        new_cell7.innerHTML = `<td scope="col">
                              <select class="form-control"
                                data-column="medication"
                                data-column-idx="medication:${idx}"
                                id="medication_${idx}"
                                onchange="get_stock_levels(this,${idx})"
                                value="${row_data.item_name}">
                              > <option></option>
                                ${build_generic_drug_item_select_options(items)}
                              <select/>
                            </td>`;
      },
    });

    
    new_cell8.innerHTML = `<td scope="col">
                            <input type="text"
                              value=""
                              class="form-control"
                              data-column="pharmacy_dose"
                              id="pharmacy_dose_${idx}"
                              autocomplete="off"
                            >
                            </td>`;
    new_cell9.innerHTML = `<td scope="col">
                            <input
                              type="number"
                              value=""
                              class="form-control"
                              data_column="prescription"
                              id="pharmacy_frequency_${idx}"
                              autocomplete="off"
                              />
                           </td>`;
    new_cell10.innerHTML = `<td scope="col">
                            <input type="text"
                              value=""
                              class="form-control"
                              data_column="pharmacy_duration"
                              id="pharmacy_duration_${idx}"
                              autocomplete="off"
                              />
                            </td>`;

    

    // new_cell14.innerHTML = `<td scope="col"><span id="available_quantity_${idx}"></span></td>`;
    new_cell11.innerHTML = `<td scope="col">
                              <input type="number"
                                class="form-control"
                                value="${
                                  row_data.billed_quantity
                                    ? row_data.billed_quantity
                                    : "0"
                                }"
                                data-column="billed_quantity"
                                data-column-idx="billed_quantity:${idx}"
                                onchange="calculate_total_cost(${idx},this)"
                                id="billed_qty_${idx}"
                              />
                            </td>`;

    new_cell12.innerHTML = `<td scope="col">
                              <p data-column-idx="total:${idx}" id="${idx}" style="font-size: 16px"></p>
                            </td>`;
    new_cell13.innerHTML = `<td scope="col">
                              <input type="text"
                                class="form-control"
                                value="${
                                  row_data.remarks
                                    ? row_data.remarks
                                    : "No notes "
                                }"
                                readonly
                                data-column="remark"
                                id="" />
                            </td>`;
    new_cell14.innerHTML = `<td scope="col">
                              <input type="text"
                                class="form-control"
                                value="${
                                  row_data.pharmacy_remark
                                    ? row_data.pharmacy_remark
                                    : ""
                                }"
                                data-column="pharmacy_remarks"
                                id="pharmacy_remark_${idx}"
                                autocomplete="off"
                              />
                            </td>`;
  };

  const handle_add_row = (e) => {
    // cur_frm.add_child("prescription_table");
    // cur_frm.refresh_fields("prescription_table");
  };

  const calculate_total_cost = (provided_idx, field_element) => {
    let idx = field_element?.id || provided_idx;

    console.log("idx", field_element?.id);

    let billed_quantity_element = document.querySelector(
      `[data-column-idx="billed_quantity:${idx}"]`
    );
    // console.log("billed_quantity_element", billed_quantity_element);
    let medication_element = document.querySelector(
      `[data-column-idx="medication:${idx}"]`
    );
    // console.log(medication_element, " Mediction!!!!");
    // console.log("medication", medication_element);
    let billed_qty = parseFloat(billed_quantity_element.value) || 0;

    let total_cost_element = document.querySelector(
      `[data-column-idx="total:${idx}"]`
    );
    // console.log("Total Cost Element", medication_element.value.split("~")[1]);


    let item_code = medication_element.value;
    let item_code_generic = medication_element.value.split("~")[0];

    // console.log(medication_element.value, "Item code")

    frappe.call({
      method: "gch_custom.services.rest.check_branch_pricelist",
      args: { item_code: item_code_generic },
      callback: function (r) {
        if (r.message) {
          price = r.message;
          console.log(price, "PRICE");
          let total_cost = billed_qty * price;
          // console.table({ billed_qty, price, total_cost });

          // console.log("Total cost: ", total_cost, idx);
          total_cost_element.innerHTML = total_cost;
          return billed_qty, total_cost;
        } else {
          console.log("no price", r);
          total_cost_element.innerHTML = 0;
          return billed_qty, 0;
        }
      },
    });
  };

  const test_button = async () => {
    frappe.call({
      method: "gch_custom.services.get_station_details",
      callback: function (r) {
        console.log(r);
      },
    });
  };

  const save_new_prescriptions = async (
    idx,
    duplicate = false,
    add_new = false
  ) => {
    var generic_drug_route = "";
    var generic_drug_uom = "";
    var frequency = "";
    var duration = "";
    var dose = "";
    var generic_drug = "";
    var generic_drug_name = "";
    var preparation_type = "";
    var dispensed_by = frappe.session.user_fullname;
    var dispensed_at = frappe.datetime.now_datetime();

    if(cur_frm.doc.workflow_state == "Pending Invoice Closing"){
      frappe.throw("Prescriptions cannot be edited when workflow state is Pending Invoice Closing");
      return;
    }

    if(cur_frm.doc.docstatus == 1){
      frappe.throw("Prescriptions cannot be edited if encounter is closed");
      return;
    }

    if (duplicate) {
      dose = document
        .getElementById(`generic_drug_uom_${idx}`)
        .value.split(" ")[0];
      generic_drug_route = document.getElementById(
        `generic_drug_route_${idx}`
      ).value;
      generic_drug_uom = document
        .getElementById(`generic_drug_uom_${idx}`)
        .value.split(" ")[1];
      frequency = document.getElementById(`frequency_${idx}`).value;
      duration = document.getElementById(`duration_${idx}`).value;
      generic_drug = document.getElementById(`generic_drug_${idx}`).value;
      generic_drug_name = document.getElementById(
        `generic_drug_name_${idx}`
      ).value;
      preparation_type = document.getElementById(
        `generic_drug_preparation_type_${idx}`
      ).value;
    } else {
      generic_drug_name = document
        .getElementById(`generic_drug_name_${idx}`)
        .value.split("~")[1];
      generic_drug = document
        .getElementById(`generic_drug_name_${idx}`)
        .value.split("~")[0];
    }

    let pharmacy_dose = document.getElementById(`pharmacy_dose_${idx}`).value;
    let pharmacy_duration = document
      .getElementById(`pharmacy_duration_${idx}`)
      .value.split(" ")[0];
    let billed_qty = document.getElementById(`${idx}`).value;
    let pharmacy_frequency = document.getElementById(
      `pharmacy_frequency_${idx}`
    ).value;
    let pharmacy_remark = document.getElementById(
      `pharmacy_remark_${idx}`
    ).value;
    let unformarted_medication = document
      .getElementById(`medication_${idx}`)
      .value.split("~");
    let medication = unformarted_medication[0];
    let item_name = unformarted_medication[1];
    let has_batch_no = 0;

    if (add_new) {
      has_batch_no = unformarted_medication[2];
    } else {
      has_batch_no = unformarted_medication[3];
    }

    let selected_batch = batch;

    if (has_batch_no == 1 && !selected_batch) {
      frappe.msgprint("Please select batch number");
      return;
    }

    if (!pharmacy_dose || !pharmacy_frequency || !pharmacy_duration) {
      frappe.msgprint("Error, Dose Frequency and Duration are required fields");
      return;
    }
    // if (billed_qty == 0) {
    //   frappe.msgprint("Error, Enter selling quantity");
    //   return;
    // }

    item_info = await frappe.db.get_doc("Item", medication);
    // console.log(item_info, "info");

    let stock_uom = item_info.stock_uom;
    let sub_preparation_type = item_info.sub_preparation_type;
    let additional_label_info = item_info.additional_label_info;

    let owner = frm.selected_doc.owner;
    let parent = frm.doc.name;
    latests_idx++;
    let update_idx = latests_idx;

    let total_price = 0;
    // console.log("Generic_drgu", medication);

    await frappe.call({
      method: "gch_custom.services.get_prices",
      args: { item_code: medication },
      callback: function (r) {
        if (r.message) {
          price = r.message;
          console.log(price, "PRICE");
          total_price = billed_qty * price;
        } else {
          console.log("no price", r);
          total_price = 0;
        }
      },
    });

    let available_qty = 0;
    await frappe.call({
      method: "gch_custom.services.get_stock_levels",
      args: {
        item_code: medication,
        warehouse: "Pharmacy MSA - GCH",
      },
      callback: function (r) {
        if (!r.exc) {
          stock_details = r.message;
          console.log(r);
          if (stock_details.length > 0) {
            available_qty = stock_details[0].actual_qty;
            console.log("avail", stock_details[0].actual_qty);
          } else {
            available_qty = 0;
          }
        }
      },
    });
    // return null

    let data = {
      parent: parent,
      parentfield: "prescription_table",
      parenttype: "Patient Encounter",
      generic_drug: generic_drug,
      generic_drug_name: generic_drug_name,
      generic_drug_route: generic_drug_route,
      owner: owner,
      // DOCTORS
      brand: item_name,
      item_name: item_name,
      preparation_type: preparation_type,
      route: generic_drug_route,
      dose: dose,
      dose_uom: generic_drug_uom,
      prescription_frequency: frequency,
      frequency_type: "",
      duration: duration,
      medication: medication,
      unit_of_measure: stock_uom ? stock_uom : generic_drug_uom,
      selling_quantity: billed_qty,
      remarks: "",
      // PHARMARCY
      additional_label_info: "",
      item_description: "",
      available_quantity: available_qty,
      billed_quantity: billed_qty,
      pharmacy_dose: pharmacy_dose,
      pharmacy_frequency: pharmacy_frequency,
      pharmacy_duration: pharmacy_duration,
      discount: "0",
      unit_price: "",
      total: total_price,
      dont_issue: 0,
      dont_issue_reason: "",
      refillable: 0,
      refill_type: "",
      refill_count: "",
      period_type: "",
      refill_notes: "",
      selected_item_batch: selected_batch,
      pharmacy_remark: pharmacy_remark,
      sub_preparation_type: sub_preparation_type ? sub_preparation_type : "",
      additional_item_info: additional_label_info ? additional_label_info : "",
      idx: update_idx,
      dispensed_by: dispensed_by,
      dispensed_at: dispensed_at,
    };
    
    frappe.call({
      method: "gch_custom.services.create_prescription",
      args: { ...data },
      callback: function (r) {
        // console.log(r);
        if (r.message) {
          frappe.msgprint({
            title: __("Success"),
            indicator: "green",
            message: "Prescription Added Successfully",
          });
          // console.log(cur_frm);
          cur_frm.refresh_field("prescription_table");
          document.getElementById(`${idx}`).remove();
          cur_frm.reload_doc();
        }
      },
    });
  };

  // Fetch Parent Details from Patient DocType
  var patient = cur_frm.doc.patient;
  var patient_uhid = cur_frm.doc.patient_uhid;

  if (!cur_frm.doc.__islocal) {
    frappe.call({
      method: "gch_custom.services.rest.fetch_parents",
      args: { patient, patient_uhid },
      callback: function (r) {
        // console.log(r.message.parents);
        if (r.message) {
          if (r.message.parents.length == 2) {
            first_parent_name =
              r.message.parents[0].first_name +
              " " +
              r.message.parents[0].last_name;
            first_parent_number = r.message.parents[0].phone_number;

            second_parent_name =
              r.message.parents[1].first_name +
              " " +
              r.message.parents[1].last_name;
            second_parent_number = r.message.parents[1].phone_number;
          } else if (r.message.parents.length == 1) {
            first_parent_name =
              r.message.parents[0].first_name +
              " " +
              r.message.parents[0].last_name;
            first_parent_number = r.message.parents[0].phone_number;
          }
          // console.log(first_parent_name, first_parent_number, second_parent_name, second_parent_number)
          console.log("loaded successfully.....", r.message.parents.length);
        }
      },
      async: false,
    });
  }

  // console.log("Oyaaaa", first_parent_name, first_parent_number, second_parent_name, second_parent_number)

  window.handlePrescriptionChange = handlePrescriptionChange;
  window.handleAddRow = handle_add_row;
  window.build_batch_select_options = build_batch_select_options;
  window.handleRemoveRow = handlePrescriptionChange;
  window.handle_general_add_row = handle_general_add_row;
  window.check_warehouse = check_warehouse;
  window.handle_duplicate_add_row = handle_duplicate_add_row;
  window.handlePrescriptionAdd = handlePrescriptionAdd;
  window.get_drug_name = get_drug_name;
  window.save_new_prescriptions = save_new_prescriptions;
  window.get_stock_levels = get_stock_levels;
  window.calculate_total_cost = calculate_total_cost;
  window.get_drug_routes = get_drug_routes;
  window.get_preparation_types = get_preparation_types;
  window.handleDoNotIssue = handleDoNotIssue;
  window.prepare_item_details = prepare_item_details;
  window.test_button = test_button;

  let TABLE_ROWS = build_table_rows(prescription_table);

  const HTML_TEMPLATE = `<div>
 
 
 
    <div>
    <div class="form-row mb-4">
        <div class="col-md-4 ">
       <strong> Name :</strong>  <span>${cur_frm.doc.patient_name}</span> <br>
       <strong> UHID :</strong>    <span>${cur_frm.doc.patient_uhid}</span><br>
       <strong> DOB :</strong>    <span>${cur_frm.doc.patient_dob}</span><br>
       <strong> Age :</strong>    <span>${cur_frm.doc.patient_age}</span> <br>
    </div>


        <div class="col-md-4">
           <strong>Weight: </strong><span>${
             cur_frm.doc.weight_in_kilograms
           }</span> KG <br>
           <strong>Height: </strong><span>${
             cur_frm.doc.height_in_centimeters
           }</span> CM<br>
           <strong>BSA :</strong><span>${cur_frm.doc.bsa}</span><br>
           <strong>Clinic :</strong><span>${cur_frm.doc.clinic}</span><br>
        </div>

       
        <div class="col-md-4">
           <strong>Mode of Payment : </strong><span>${
             cur_frm.doc.mode_of_payment
           }</span> <br>
           <strong>Insurance Scheme : </strong><span>${
             cur_frm.doc.default_insurance
               ? cur_frm.doc.default_insurance.split("-")[0]
               : ""
           }</span><br>
           <strong> Insurance Company : <span>${
             cur_frm.doc.insurance_category_employer
               ? cur_frm.doc.insurance_category_employer
               : ""
           }</span></strong><br>
         
        </div>
    </div>
    <div class="form-row mb-3">
        <div class="col-md-4 ">
            <label for="patientDrugAllergy"><strong>Drug Allergies (${
              cur_frm.doc.drug_allergy.length
            })</strong></label>

            ${cur_frm.doc.drug_allergy.map(
              (allergy) =>
                `<span class="badge badge-pill badge-warning ml-2" id="patientFoodAllergy" >${allergy.drug_allergy}</span>`
            )}
     
        </div>
        <div class="col-md-4 ">
            <label for="patientFoodAllergy"><strong>Food Allergies (${
              cur_frm.doc.food_allergy.length
            })</strong></label>

            ${cur_frm.doc.food_allergy.map(
              (allergy) =>
                `<span class="badge badge-pill badge-warning ml-2" id="patientFoodAllergy" >${allergy.food_allergy}</span>`
            )}
           
        </div>
        <div class="col-md-4 ">
            <label for="patientFoodAllergy"><strong>Other Allergies (${
              cur_frm.doc.other_allergy.length
            })</strong></label>

            ${cur_frm.doc.other_allergy.map(
              (allergy) =>
                `<span class="badge badge-pill badge-warning ml-2" id="patientFoodAllergy" >${allergy.other_allergy}</span>`
            )}
                 
           
        </div>
    </div>
    <hr>
    <label><strong>Parent Details</strong></label>
    <div class="row">
      <div class="col-md-4">
        
        <span><strong>Parent Name:</strong> ${first_parent_name || "N/A"}</span>
        <br>
        <span><strong>Phone Number:</strong> ${
          first_parent_number || "N/A"
        }</span>
      </div>
      
      <div class="col-md-4">
        <span><strong>Second Parent's Name:</strong> ${
          second_parent_name || "N/A"
        }</span>
        <br>
        <span><strong>Second Parent's Phone Number:</strong> ${
          second_parent_number || "N/A"
        }</span>
      </div>

    </div>

    <hr>

    <label><strong>Physician</strong></label>
    <span>${cur_frm.doc.practitioner_name}</span>
    <hr>

    <label><strong>Encounter Diagnosis</strong></label>
 
     ${cur_frm.doc.diagnosis_table.map(
       (diagnosis) =>
         `<span class="badge badge-pill badge-warning ml-2" >${diagnosis.description}</span>`
     )}
               
       
    <hr>

    

    <button class="btn btn-sm btn-primary" style="font-size: 8px;" onclick="handle_general_add_row()">Add New</button>
    <button class="btn btn-sm btn-primary" style="font-size: 8px;" onclick="test_button()">Check warehouse</button>
    <hr>
    <br>
    </div>
    <strong id="prescription_total">Total (KSH): <span class="badge badge-pill badge-warning ml-1" style="font-size: 14px;">${total_prescription_cost ? total_prescription_cost:0}</span></strong>


    
    <div style="overflow-x: scroll" id="pharmacy_scrollable_table" class="mb-2" >
      <table class="table table-bordered table-hover" style="font-size: 12px;">
    <thead>
      <tr>
        <th scope="col"></th>
        <th scope="col" style="min-width: 12.875rem">Generic Name</th>
        <th scope="col" style="min-width: 6.875rem">Route</th>
        <th scope="col">Dos.</th>
        <th scope="col">Freq.</th>
        <th scope="col">Dur.(Days)</th>
        <th scope="col-2" style="min-width: 15.5rem">Item Name</th>
        <th scope="col" style="min-width: 4.875rem">Dos.</th>
        <th scope="col" style="min-width: 4.875rem">Freq.</th>
        <th scope="col" style="min-width: 4.875rem">Dur.(Days)</th>
        <th scope="col" style="min-width: 4.875rem">Billed Qty</th>
     
        <th scope="col" style="min-width: 6.875rem">Total</th>
        <th scope="col">Doctor's Notes</th>
        <th scope="col">Pharmacy Remarks</th>

      </tr>
    </thead>
    <tbody id="dynamic_prescription_table">
     ${TABLE_ROWS}
    </tbody>
    </table>


   
 
     
  </div>


  </div>


 
    `;

  $(frm.fields_dict["pharmacy_scrollable_table"].wrapper).html(HTML_TEMPLATE);
};

const handle_pharmacy = (frm) => {
  frappe.call({
    method: "gch_custom.services.rest.get_scroll_table_data",
    args: {
      encounter_name: cur_frm.doc.name,
    },
    callback(r) {
      if (r.message) {
        var prescription_table = r.message.prescription_table;

        if (prescription_table) {
          presc_len = prescription_table.length;
          latests_idx = presc_len;
        }
        // console.log("Prescription",prescription_table)
        build_dispensement_table(frm, prescription_table);
      }
    },
  });
};

// Select query(Item)  which will join on (Bin) on item_code filter by warehouse
