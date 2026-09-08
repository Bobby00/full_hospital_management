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
        return 0;
    }
};

const handlePatientOwned = (field_element) => {
  console.log("Action taken", field_element)

  frappe.call({
    method: "gch_inpatient.services.mark_prescription_as_patient_owned",
    args: {
      presc_name: field_element.id
    },
    callback: (res)=> {
      console.log(res);
    }
  })
  cur_frm.reload_doc();
}

const handlePrescriptionChange = async (
    field_element,
    idx = -1,
    medication = false,
    selling = false
  ) => {
    let dispensed = field_element.dataset.dispensed;

    if (medication) {
      console.log(field_element.dataset.dispensed);
      batch = "";

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
                let item_code = field_element.value.split("~")[0];
                let batch = document.getElementById(`item_batch_${idx}`).value;
                let idx_bill = field_element?.id || idx;

                let billed_quantity_element = document.querySelector(
                  `[data-column-idx="billed_quantity:${idx_bill}"]`
                );
                let billed_qty = parseFloat(billed_quantity_element.value) || 0;
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
                  batch: batch,
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
                        },
                      });

                      if (return_prescription) {
                        frappe.call({
                          method: "gch_custom.services.mark_dispensed_as_false",
                          args: {
                            encounter: encounter,
                            item_code: med,
                          },
                          callback(r) {
                            if (r.message) {
                              frappe.show_alert(
                                {
                                  message: __(
                                    "Prescription has been returned successfuly"
                                  ),
                                  indicator: "green",
                                },
                                10
                              );
                            }
                          },
                        });
                      } else {
                        frappe.throw(
                          "Something went wrong. Please try again!!"
                        );
                      }

                      cur_frm.refresh_fields("prescription_table");
                      cur_frm.reload_doc();
                    }
                  },
                });
              }
            ),
          () => {
            // console.log("GOT HERE NO!!!!!!!!!!!!!!!!!!!!!")
            cur_frm.refresh_fields("prescription_table");
            cur_frm.reload_doc();
            // handle_prescription_total(cur_frm.doc.prescription_table);
          }
        );
        return null;
      }

      console.log("You Should not be seeing this part");

      let has_batch_no = field_element.value.split("~")[2];
      // console.log(has_batch_no, "has_batch_no");
      let current_id;
      current_id = field_element.id;
      let med = field_element.value.split("~")[0];
      let item_name = field_element.value.split("~")[1];
      let item_batches = [];
      let available_qty = 0;
      let dispensed_at = frappe.datetime.now_datetime();
      let dispensed_by = frappe.session.user_fullname;

      


      if (has_batch_no == 1) {
        //   // @Todo: Fetch batch with earliest expiry date and set has quantity and set it as selected batch
        console.log("Batch Here!!!!");
        await frappe.call({
          method: "gch_custom.services.get_batches",
          args: {
            item_code: med,
          },
          callback: function (r) {
            if (r.message) {
              item_batches = r.message;
              batch = r.message.batch_no;
              console.log(batch);
            } else {
              batch = "";
            }
          },
        });
      }
      // document.getElementById(`item_batch_${idx}`).value = batch;

      console.log(batch, "item_batches");

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

      // get routes and other labels on item select
      let extra_item_info = await frappe.db.get_doc("Item", med);
      let high_alert = field_element.dataset.alert;

      // console.log(extra_item_info, "extra_item_info");

      // document.getElementById(`route_${idx}`).innerHTML =
      //   extra_item_info.product_route;

      frappe.call({
        method: "gch_inpatient.services.update_prescription",
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
          total: total
        },
        callback: function (r) {
          // console.log(r, "RESPONSE!!");
          return "route updated";
        },
      });
      cur_frm.refresh_fields("prescription_table");
      cur_frm.reload_doc();

      // get stock levels on item selection and price
    } else if (selling) {
      // console.log("SELLLIIING!!!",dispensed,field_element);
      if (dispensed == 1) {
        frappe.confirm(
          "This Item has already been dispensed. Do you want to return before editing?",
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
                let item_code = field_element.dataset.currentvalue;
                let batch = document.getElementById(`item_batch_${idx}`).value;
                let idx_bill = field_element?.id || idx;

                let billed_quantity_element = document.querySelector(
                  `[data-column-idx="billed_quantity:${idx_bill}"]`
                );
                let billed_qty = parseFloat(billed_quantity_element.value) || 0;
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
                  batch: batch,
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
                        },
                      });

                      if (return_prescription) {
                        frappe.call({
                          method: "gch_custom.services.mark_dispensed_as_false",
                          args: {
                            encounter: encounter,
                            item_code: med,
                          },
                          callback(r) {
                            if (r.message) {
                              frappe.show_alert(
                                {
                                  message: __(
                                    "Prescription has been returned successfuly"
                                  ),
                                  indicator: "green",
                                },
                                10
                              );
                            }
                          },
                        });
                      } else {
                        frappe.throw(
                          "Something went wrong. Please try again!!"
                        );
                      }

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

      let idx_bill = field_element?.id || idx;
      let billed_quantity_element = document.querySelector(
        `[data-column-idx="billed_quantity:${idx_bill}"]`
      );

      let medication_element = document.querySelector(
        `[data-column-idx="medication:${idx_bill}"]`
      );

      let billed_qty = parseFloat(billed_quantity_element.value) || 0;

      let total_cost_element = document.querySelector(
        `[data-column-idx="total:${idx_bill}"]`
      );
      let item_code = medication_element.value;
      let item_code_generic = medication_element.value.split("~")[0];
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

            console.log("Total price: ", total_price, idx);
            total_cost_element.innerHTML = total_price;
          } else {
            console.log("no price", r);
            total_cost_element.innerHTML = 0;
          }
        },
      });

      console.table({ billed_qty, price, total_price });

      frappe.call({
        method: "gch_inpatient.services.set_total_cost",
        args: {
          id: idx_bill,
          billed_quantity: billed_qty,
          total_cost: total_price,
        },
        callback: function (r) {
          if (r.message) {
            // console.log(r.message)
          } else {
            console.log("something went wrong!!", r);
          }
        },
      });
      // cur_frm.refresh_fields("prescription_table");
      cur_frm.reload_doc();
      // handle_prescription_total(cur_frm.doc.prescription_table);
    } else {
      frappe.call({
        method: "gch_inpatient.services.update_prescription_table",
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


const build_item_name_select_options = (
    item_options,
    idx,
    select_value = 0
  ) => {
    const SELECT_OPTIONS = [];
    for (let index = 0; index < item_options.length; index++) {
      const item_option = item_options[index];
      let is_selected = item_option.name == select_value ? "selected" : undefined;
      if (item_option.actual_qty <= 15) {
        SELECT_OPTIONS.push(`
        <option style="background-color: #66FF99;color=white" value="${item_option.name}~${item_option.display_name}~${item_option.has_batch_no}" ${is_selected}>
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

const calculate_total_cost = (provided_idx, field_element) => {
  let idx = field_element?.id || provided_idx;

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
    console.log(SELECT_OPTIONS, "SELECT_OPTIONS");
    batch_options.innerHTML = SELECT_OPTIONS;
};

// function to get stock levels on item selection and price
const get_stock_levels = async (item_name, idx) => {
    console.log(idx, "stock levels idx");
  
    batch = "";
  
    let item_code = item_name.value.split("~")[0];
    console.log(item_name, "Item CODE!!!@@!!");
  
    let selected_item_name = item_name.value.split("~")[1];
  
    frappe.call({
      method: "gch_custom.services.rest.check_branch_pricelist",
      args: { item_code },
      callback: function (r) {
        if (r.message) {
          price = r.message;
          console.log(price, "PRICE");
        } else {
          console.log("no price");
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
  
      console.log(batch, "item batch");
      document.getElementById(`item_batch_${idx}`).value = batch;
    }
  
    // return null
  
    // build_batch_select_options(item_batch.message, idx);
  
    document.getElementById(`route_${idx}`).innerHTML =
      item_info.message[0].product_route;
  
    console.log(item_info, "item_info");
  
    frappe.call({
      method: "gch_custom.services.get_stock_levels",
      args: {
        item_code: item_code,
      },
      callback: function (r) {
        if (!r.exc) {
          // code snippet
          console.log(r.message, "stock details");
          stock_details = r.message;
          if (stock_details.length > 0) {
            if (stock_details[0].actual_qty <= 5) {
              document.getElementById(
                `available_quantity_${idx}`
              ).innerHTML = `<span class="badge rounded-pill bg-success" style="color: white;font-size: 1rem;">
                ${stock_details[0].actual_qty}
              </span>`;
              stock_details[0].actual_qty;
            } else if (stock_details[0].actual_qty > 6) {
              document.getElementById(
                `available_quantity_${idx}`
              ).innerHTML = `<span class="badge rounded-pill bg-dark" style="color: white;font-size: 1rem;">${stock_details[0].actual_qty}</span>`;
              // stock_details[0].actual_qty;
            }
  
            available_qty = stock_details[0].actual_qty;
            // document.getElementById(`available_quantity_${idx}`).innerHTML =
            //   stock_details[0].actual_qty;
          } else {
            console.log("dets",r)
            document.getElementById(
              `available_quantity_${idx}`
            ).innerHTML = `<p style="font-style: italic" class="badge bg-info">Stock levels not updated</p>`;
          }
        }
      },
    });
};

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
            if (item_option.actual_qty <= 15) {
              SELECT_OPTIONS.push(`
                <option style="background-color: #66FF99;color:white"
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


const dispense_medications = async () => {
  var presc_number = sessionStorage.getItem("prescription_number");


  if(presc_number.length == 0 || presc_number == "Unavailable"){
    frappe.call({
      method: "gch_inpatient.services.dispense_medications",
      args: {
        inpatient_record: cur_frm.doc.name
      },
      callback: (res) => {
        if(res.message){
          console.log(res.message)
          frappe.show_alert({message: "Prescription Dispensed", indicator: 'green'});
        }
          cur_frm.reload_doc();
      }
    })
  }else {
    frappe.call({
      method: "gch_inpatient.services.dispense_with_presc_number",
      args: {
        inpatient_record: cur_frm.doc.name,
        presc_number: presc_number
      },
      callback: (res) => {
        if(res.message){
          console.log(res.message)
          frappe.show_alert({message: "Prescription Dispensed", indicator: 'green'});
        }
          cur_frm.reload_doc();
      }
    })
  }
  
}


const build_table_rows = (table_row_items) => {
    let ROWS = [];
  
    for (let index = 0; index < table_row_items.length; index++) {
      const single_row = table_row_items[index];
      const stringified_row = JSON.stringify(single_row.item);
      const { route, dose, dose_uom, prescription_frequency, duration } =
        single_row.item;
      idx = single_row.item.idx;
      check_the_box = "";
      check_patient_owned = "";
      let bgc = "none"

  
      if (single_row.item.dont_issue == 0) {
        check_the_box = "checked";
      } else {
        check_the_box = "!checked";
      }

      if (single_row.item.patient_owned_medication == 1) {
        check_patient_owned = "checked";
        bgc = 'orange';
      } else if(single_row.item.high_alert == 1) {
        bgc = 'yellow';
      }
      else {
        check_patient_owned = "!checked";
      }

  
      console.log("Here, ", single_row);
  
      ROWS.push(`<tr style="background-color: ${bgc}" id="${single_row.item.name}" >
        <td scope="col">
          <div class="form-check">
            <input
              type="checkbox"
              class="form-check-input"
              data-column="do_not_issue"
              data-dispensed="${single_row.item.dispensed}"
              data-medication="${single_row.item.medication}"
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
        <td scope="Col-2">
        <div  style="display: none"id="duplicate_btn_${idx}">
          <button class="btn btn-sm btn-warning" style="font-size: 8px;" onclick="handle_duplicate_add_row('${encodeURIComponent(
            stringified_row
          )}')">duplicate</button>      
        </div>
        </td>
        <td scope="col-2">
          <select class="form-control" 
            data-dispensed=${single_row.item.dispensed}
            data-currentvalue=${single_row.item.medication}
            data-alert=${single_row.item.high_alert}
            data-column-idx="medication:${
              single_row.item.name
            }" data-column="medication" id="${
        single_row.item.name
      }" onchange="window.handlePrescriptionChange(this,${idx},true)"
        >
        <option value="${single_row.item.medication}">
          ${single_row.item.item_name ? single_row.item.item_name : " "}
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
      }" onchange="window.handlePrescriptionChange(this,idx)"
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
        <td scope="col">
        <input id="${single_row.item.name}" type="checkbox" ${check_patient_owned} onchange="handlePatientOwned(this)" style="margin-top: 10px" class="form-control" />
        </td>
     
      </tr>`);
    }
    return ROWS;
};

const highlight_alert = (row) => {
  let name = row.item.name

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


const build_dispensement_table = (frm, prescription_table) => {
    // handle_prescription_total(prescription_table)
    let total_prescription_cost = 0;
    let TABLE_ROWS = build_table_rows(prescription_table);


    const HTML_TEMPLATE = `<div>
   
    <label><strong>Parent Details</strong></label>
    <div class="row">
      <div class="col-md-4">
            
        <span><strong>Parent Name:</strong> ${"N/A"}</span>
        <br>
        <span><strong>Phone Number:</strong> ${
          "N/A"
        }</span>
      </div>
      
      <div class="col-md-4">
        <span><strong>Second Parent's Name:</strong> ${
          "N/A"
        }</span>
        <br>
        <span><strong>Second Parent's Phone Number:</strong> ${
          "N/A"
        }</span>
      </div>
    </div>

    <hr>

    <label><strong>Physician</strong></label>
    <span></span>
  
    <hr>
    <button class="btn btn-sm btn-primary" style="font-size: 8px;" onclick="handle_general_add_row()">Add New</button>
    <div class="btn btn-secondary" id="discharge_toggle" onclick="discharge_med_dispense()">Discharge medication</div>
    <div class="btn btn-secondary" id="pharmacy_queue" onclick="back_to_queue()">Back to Inpatient Queue</div>

    <hr>
      
      <div style="overflow-x: scroll" id="pharmacy_scrollable_table" class="mb-4" >
        <table class="table table-bordered table-hover">
      <thead>
        <tr>
          <th scope="col"></th>
          <th scope="col" style="min-width: 12.875rem">Generic Name</th>
          <th scope="col" style="min-width: 6.875rem">Route</th>
          <th scope="col">Dos.</th>
          <th scope="col">Freq.</th>
          <th scope="col">Dur.(Days)</th>
          <th scope="col"></th>
          <th scope="col-2" style="min-width: 18.5rem">Item Name</th>
          <th scope="col" style="min-width: 4.875rem">Dos.</th>
          <th scope="col" style="min-width: 4.875rem">Freq.</th>
          <th scope="col" style="min-width: 4.875rem">Dur.(Days)</th>
          <th scope="col" style="min-width: 6.875rem">Billed Qty</th>
       
          <th scope="col" style="min-width: 6.875rem">Total</th>
          <th scope="col">Doctor's Notes</th>
          <th scope="col">Pharmacy Remarks</th>
          <th scope="col">Patient Own</th>
  
        </tr>
      </thead>
      <tbody id="dynamic_prescription_table">
       ${TABLE_ROWS}
      </tbody>
      </table>

      <div class="btn btn-primary" onclick="dispense_medications()">Dispense</div>
  
  
     
   
       
    </div>
  
  
    </div>
  
  
   
      `;
  
    $(frm.fields_dict["pharmacy_scrollable_table"].wrapper).html(HTML_TEMPLATE);
};

const back_to_queue = () => {
  window.location.href = "/app/inpatient-pharmacy-q";
}

const discharge_med_dispense = () => {
  let ROWS = [];
  let table_row_items = cur_frm.doc.inpatient_prescription_table;
  
  for (let index = 0; index < table_row_items.length; index++) {
    const single_row = table_row_items[index];

    if(single_row.indication == "Discharge"){
    const stringified_row = JSON.stringify(single_row);
    const { route, dose, dose_uom, prescription_frequency, duration } =
      single_row;
    idx = single_row.idx;
    check_the_box = "";
    check_patient_owned = "";
    let bgc = "none"


    if (single_row.dont_issue == 0) {
      check_the_box = "checked";
    } else {
      check_the_box = "!checked";
    }

    if (single_row.patient_owned_medication == 1) {
      check_patient_owned = "checked";
      bgc = 'orange'
    } else {
      check_patient_owned = "!checked";
    }


    // console.log("Here, ", single_row);

    ROWS.push(`<tr style="background-color: #90EE90" id="${single_row.name}" >
      <td scope="col">
        <div class="form-check">
          <input
            type="checkbox"
            class="form-check-input"
            data-column="do_not_issue"
            data-dispensed="${single_row.dispensed}"
            data-medication="${single_row.medication}"
            id="${single_row.name}"
            onchange="handleDoNotIssue(this,${idx})"
            ${check_the_box}
          />
        </div>
      </td>
      <td>
      ${high_alert_active(single_row)}
      </td>
      
      <td scope="col">${route ? route : ""}</td>
      <td scope="col">${dose ? dose : ""} ${dose_uom ? dose_uom : ""}</td>
      <td>
      ${handlePrescriptionFrequency(prescription_frequency)}
      </td>
      <td scope="col">${duration ? duration : ""}</td>
      <td scope="Col-2">
      <div  style="display: none"id="duplicate_btn_${idx}">
        <button class="btn btn-sm btn-warning" style="font-size: 8px;" onclick="handle_duplicate_add_row('${encodeURIComponent(
          stringified_row
        )}')">duplicate</button>      
      </div>
      </td>
      <td scope="col-2">
        <select class="form-control" 
          data-dispensed=${single_row.dispensed}
          data-currentvalue=${single_row.medication}
          data-alert=${single_row.high_alert}
          data-column-idx="medication:${
            single_row.name
          }" data-column="medication" id="${
      single_row.name
    }" onchange="window.handlePrescriptionChange(this,${idx},true)"
      >
      <option value="${single_row.medication}">
        ${single_row.item_name ? single_row.item_name : " "}
        <option>   
        
        </select>
      </td>
      
     
      <td scope="col">
        <input type="text" autocomplete="off" value="${
          single_row.pharmacy_dose ? single_row.pharmacy_dose : " "
        }" class="form-control" data-column="pharmacy_dose" id="${
      single_row.name
    }" onchange="window.handlePrescriptionChange(this,idx)"
        >
       
      </td>
      <td scope="col">
        <input type="number" autocomplete="off" value="${
          single_row.pharmacy_frequency
            ? single_row.pharmacy_frequency
            : " "
        }" class="form-control" data-column="pharmacy_frequency" autocomplete="off" id="${
      single_row.name
    }" onchange="window.handlePrescriptionChange(this,idx)" >
       
      </td>
      <td scope="col">
        <input type="text" autocomplete="off" value="${
          single_row.pharmacy_duration
            ? single_row.pharmacy_duration
            : " "
        }" class="form-control"  data-column="pharmacy_duration" id="${
      single_row.name
    }" onchange="window.handlePrescriptionChange(this,idx)" >
      </td>
      
      <td scope="col" style="min-width: 6.875rem">
          
        <input type="number" data-currentvalue=${
          single_row.medication
        } data-column-idx="billed_quantity:${
      single_row.name
    }"  data-column="billed_quantity" autocomplete="off" value="${
      single_row.selling_quantity ? single_row.selling_quantity : " "
    }" class="form-control" id="${single_row.name}"
      data-dispensed=${single_row.dispensed}
         onchange="window.handlePrescriptionChange(this,idx,false,true)"
      />
      </td>
           
      <td scope="col">
      <p data-column-idx="total:${single_row.name}" id="${
      single_row.name
    }" style="font-size: 16px">${
      single_row.total ? single_row.total : "0"
    }</p></td>
      <td scope="col">${
        single_row.remarks ? single_row.remarks : "No notes"
      }</td>
      <td scope="col">
      <input type="text" autocomplete="off" data-column="pharmacy_remark" value="${
        single_row.pharmacy_remark ? single_row.pharmacy_remark : " "
      }" class="form-control" id="${single_row.name}"
      onchange="window.handlePrescriptionChange(this,idx)">
      </td>
      <td scope="col">
      <input id="${single_row.name}" type="checkbox" ${check_patient_owned} onchange="handlePatientOwned(this)" style="margin-top: 10px" class="form-control" />
      </td>
   
    </tr>`);
    }
    
  }

  document.getElementById("dynamic_prescription_table").innerHTML = ROWS;
  let button  = document.getElementById("discharge_toggle")
  button.textContent = "View Active Medication"
  button.removeEventListener("click",discharge_med_dispense)
  button.addEventListener("click",active_medication)

}

const high_alert_active = (row)=>{

  let name = row.name
  if(
    row.high_alert == 1 ||
    row.high_alert == "1"
  ){
    return `
      <span class="badge badge-pill badge-warning" style="font-size: 0.9rem;font-weight: 400;color: red" >${row.generic_drug_name}</span>
      `;
    } else {
      return `
    <span class="badge badge-pill" style="font-size: 0.9rem;font-weight: 400;">${row.generic_drug_name}</span>
    `;
  }

}

const active_medication = ()=>{
  let ROWS = [];
  let table_row_items = cur_frm.doc.inpatient_prescription_table

  for (let index = 0; index < table_row_items.length; index++) {
    const single_row = table_row_items[index];

    if(single_row.indication != "Discharge" && single_row.dispensed == 0){
    const stringified_row = JSON.stringify(single_row);
    const { route, dose, dose_uom, prescription_frequency, duration } =
      single_row;
    idx = single_row.idx;
    check_the_box = "";
    check_patient_owned = "";
    let bgc = "none"


    if (single_row.dont_issue == 0) {
      check_the_box = "checked";
    } else {
      check_the_box = "!checked";
    }

    if (single_row.patient_owned_medication == 1) {
      check_patient_owned = "checked";
      bgc = 'orange'
    } else {
      check_patient_owned = "!checked";
    }

    let testObj = {}
    testObj.item = single_row

    console.log("Here, ", single_row);

    ROWS.push(`<tr id="${single_row.name}" >
      <td scope="col">
        <div class="form-check">
          <input
            type="checkbox"
            class="form-check-input"
            data-column="do_not_issue"
            data-dispensed="${single_row.dispensed}"
            data-medication="${single_row.medication}"
            id="${single_row.name}"
            onchange="handleDoNotIssue(this,${idx})"
            ${check_the_box}
          />
        </div>
      </td>
      <td>
        ${high_alert_active(single_row)}
      </td>
      
      <td scope="col">${route ? route : ""}</td>
      <td scope="col">${dose ? dose : ""} ${dose_uom ? dose_uom : ""}</td>
      <td>
      ${handlePrescriptionFrequency(prescription_frequency)}
      </td>
      <td scope="col">${duration ? duration : ""}</td>
      <td scope="Col-2">
      <div  style="display: none"id="duplicate_btn_${idx}">
        <button class="btn btn-sm btn-warning" style="font-size: 8px;" onclick="handle_duplicate_add_row('${encodeURIComponent(
          stringified_row
        )}')">duplicate</button>      
      </div>
      </td>
      <td scope="col-2">
        <select class="form-control" 
          data-dispensed=${single_row.dispensed}
          data-currentvalue=${single_row.medication}
          data-alert=${single_row.high_alert}
          data-column-idx="medication:${
            single_row.name
          }" data-column="medication" id="${
      single_row.name
    }" onchange="window.handlePrescriptionChange(this,${idx},true)"
      >
      <option value="${single_row.medication}">
        ${single_row.item_name ? single_row.item_name : " "}
        <option>   
        
        </select>
      </td>
      
     
      <td scope="col">
        <input type="text" autocomplete="off" value="${
          single_row.pharmacy_dose ? single_row.pharmacy_dose : " "
        }" class="form-control" data-column="pharmacy_dose" id="${
      single_row.name
    }" onchange="window.handlePrescriptionChange(this,idx)"
        >
       
      </td>
      <td scope="col">
        <input type="number" autocomplete="off" value="${
          single_row.pharmacy_frequency
            ? single_row.pharmacy_frequency
            : " "
        }" class="form-control" data-column="pharmacy_frequency" autocomplete="off" id="${
      single_row.name
    }" onchange="window.handlePrescriptionChange(this,idx)" >
       
      </td>
      <td scope="col">
        <input type="text" autocomplete="off" value="${
          single_row.pharmacy_duration
            ? single_row.pharmacy_duration
            : " "
        }" class="form-control"  data-column="pharmacy_duration" id="${
      single_row.name
    }" onchange="window.handlePrescriptionChange(this,idx)" >
      </td>
      
      <td scope="col" style="min-width: 6.875rem">
          
        <input type="number" data-currentvalue=${
          single_row.medication
        } data-column-idx="billed_quantity:${
      single_row.name
    }"  data-column="billed_quantity" autocomplete="off" value="${
      single_row.selling_quantity ? single_row.selling_quantity : " "
    }" class="form-control" id="${single_row.name}"
      data-dispensed=${single_row.dispensed}
         onchange="window.handlePrescriptionChange(this,idx,false,true)"
      />
      </td>
           
      <td scope="col">
      <p data-column-idx="total:${single_row.name}" id="${
      single_row.name
    }" style="font-size: 16px">${
      single_row.total ? single_row.total : "0"
    }</p></td>
      <td scope="col">${
        single_row.remarks ? single_row.remarks : "No notes"
      }</td>
      <td scope="col">
      <input type="text" autocomplete="off" data-column="pharmacy_remark" value="${
        single_row.pharmacy_remark ? single_row.pharmacy_remark : " "
      }" class="form-control" id="${single_row.name}"
      onchange="window.handlePrescriptionChange(this,idx)">
      </td>
      <td scope="col">
      <input id="${single_row.name}" type="checkbox" ${check_patient_owned} onchange="handlePatientOwned(this)" style="margin-top: 10px" class="form-control" />
      </td>
   
    </tr>`);
    }
    
  }

  document.getElementById("dynamic_prescription_table").innerHTML = ROWS;

  let button  = document.getElementById("discharge_toggle")
  button.textContent = "View Discharge Medication"
  button.removeEventListener("click",active_medication)
  button.addEventListener("click",discharge_med_dispense)

}

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

  // if(cur_frm.doc.workflow_state == "Pending Invoice Closing"){
  //   frappe.throw("Prescriptions cannot be edited when workflow state is Pending Invoice Closing");
  //   return;
  // }

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
    parentfield: "inpatient_prescription_table",
    parenttype: "Inpatient Record",
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
    method: "gch_inpatient.services.create_prescription",
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
  let new_cell16 = newRow.insertCell(15);

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

  new_cell5.innerHTML = `<td scope="col">`

  new_cell6.innerHTML = `<td scope="col">
                          <select class="form-control-xs"
                              data-column="Generic Drug Route"
                              disabled="true"
                            >
                            <option style="font-size:9">Disabled</option>
                          <select/>
                        </td>`;

  new_cell7.innerHTML = `<td scope="col">
                        <select class="form-control-xs"
                            data-column="Generic Drug Route"
                            disabled="true"
                        >
                          <option style="font-size:9">Disabled</option>
                        <select/></td>`;
  new_cell16.innerHTML = `<td><button id="${idx}" class="btn btn-info btn-xs" style="font-size: 8px" onclick="save_new_prescriptions(${idx},false,true)">Save</button></td>`;

  frappe.call({
    method: "gch_custom.services.rest.get_all_drug_items",
    callback: function (r) {
      new_cell8.innerHTML = `<td scope="col">
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

  new_cell9.innerHTML = `<td scope="col">
                          <input type="text"
                            style="min-width: 4.875rem"
                            value=""
                            class="form-control"
                            data-column="pharmacy_dose"
                            id="pharmacy_dose_${idx}"
                            autocomplete="off"
                          >
                        </td>`;
  new_cell10.innerHTML = `<td scope="col">
                      <input
                        type="number"
                        value=""
                        class="form-control"
                        data_column="pharmacy_frequency"
                        id="pharmacy_frequency_${idx}"
                        autocomplete="off"/
                        />
                    </td>`;
  new_cell11.innerHTML = `<td scope="col">
                            <input type="text"
                                value=""
                                class="form-control"
                                data_column="pharmacy_duration"
                                id="pharmacy_duration_${idx}"
                                autocomplete="off"
                            />
                          </td>`;

  // new_cell14.innerHTML = `<td scope="col"><span id="available_quantity_${idx}"></span></td>`;
  new_cell12.innerHTML = `<td scope="col">
                            <input type="number"
                              class="form-control"
                              data-column-idx="billed_quantity:${idx}"
                              data-column="billed_quantity"
                              onchange="calculate_total_cost(${idx},this)"
                              id="${idx}"
                            />
                          </td>`;

  new_cell13.innerHTML = `<td scope="col">
                            <p data-column-idx="total:${idx}" id="${idx}" style="font-size: 16px"></p>
                          </td>`;
  new_cell14.innerHTML = `<td scope="col">
                            <input type="text"
                              class="form-control"
                              placeholder="No Notes"
                              readonly
                              data-column="remark"
                              id="" />
                          </td>`;
  new_cell15.innerHTML = `<td scope="col">
                            <input type="text"
                              class="form-control"
                              placeholder="Pharmacy Notes"
                              data-column="pharmacy_remarks"
                              id="pharmacy_remark_${idx}"
                              autocomplete="off"
                            />
                          </td>`;
};

const handle_pharmacy = (frm) => {
  var presc_number = sessionStorage.getItem("prescription_number");
    console.log(presc_number,"Received");
    if(presc_number){
      if (presc_number == "Unavailable" ) {
        // console.log("Got Here at presc prescription number Unavailable");  
        frappe.call({
            method: "gch_inpatient.services.get_scroll_table_data",
            args: {
              inpatient_record: cur_frm.doc.name,
            },
            callback(r) {
              if (r.message) {
                var prescription_table = r.message.prescription_table;
        
                if (prescription_table) {
                  presc_len = prescription_table.length;
                  latests_idx = presc_len;
                }
                console.log("Prescription",prescription_table)
                build_dispensement_table(frm, prescription_table);
              }
            },
          });    
        }else {
          console.log("if ya kwanza Got here prescription number has value");
          frappe.call({
            method: "gch_inpatient.services.get_filtered_scroll_table_data",
            args: {
              inpatient_record: cur_frm.doc.name,
              presc_number:presc_number,
            },
            callback(r) {
              if (r.message) {
                var prescription_table = r.message.prescription_table;
        
                if (prescription_table) {
                  presc_len = prescription_table.length;
                  latests_idx = presc_len;
                }
                console.log("Prescription",prescription_table)
                build_dispensement_table(frm, prescription_table);
              }
            },
          });
        }
    }else {
      // console.log("Got here prescription number has no value");
      frappe.call({
        method: "gch_inpatient.services.get_scroll_table_data",
        args: {
          inpatient_record: cur_frm.doc.name,
        },
        callback(r) {
          if (r.message) {
            var prescription_table = r.message.prescription_table;
    
            if (prescription_table) {
              presc_len = prescription_table.length;
              latests_idx = presc_len;
            }
            console.log("Prescription",prescription_table)
            build_dispensement_table(frm, prescription_table);
          }
        },
      });    
    }
    
};

window.handlePrescriptionChange = handlePrescriptionChange;
window.calculate_total_cost = calculate_total_cost;
window.handle_general_add_row = handle_general_add_row;

