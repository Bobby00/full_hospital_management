const field_list = [
  "section_addresses",
  "naming_series",
  "currency_and_price_list",
  "sec_warehouse",
  "pricing_rule_details",
  "raw_material_details",
  "taxes_charges_section",
  "taxes_section",
  "sec_tax_breakup",
  "totals",
  "section_break_42",
  "section_break_46",
  "terms_section_break",
  "more_info",
  "subscription_detail",
  "printing_settings",
  "transporter_info",
  "set_posting_time",
  "apply_putaway_rule",
  "posting_time",
  "is_return",
];

let globalfrm;

const handleBatchNumberEntry = async (field_element) => {


  let cur_id = field_element.dataset.name;
  // Check if expiry field has value.
  var expiry = document.getElementById(`batch_expiry_${cur_id}`).value;
  var batch = document.getElementById(`batch_no_${cur_id}`).value;
  var idx = field_element.dataset.idx -1;
  // var batch_id_field = frm.fields_dict['items']



  // If there is a value on expiry,get batch value and save field save the batch number and its expiry.
  // if(expiry && batch){

  //   let supplier = cur_frm.doc.supplier_name
  //   let item = field_element.dataset.code
  //   // console.log(idx, "global");
  //   // return
    
  //   // await frappe.call({
  //   //   method: "gch_purchases.services.save_batch",
  //   //   args: {
  //   //     batch_no: batch,
  //   //     expiry_date: expiry,
  //   //     supplier: supplier,
  //   //     item: item,
  //   //     doc_name: cur_id
  //   //   },
  //   //   callback: (res) => {
  //   //     console.log(res.message);
  //   //     if(res.message){
  //   //       if(res.message.batch_id){
  //   //         console.log(globalfrm);
  //   //         globalfrm.doc.items[idx].batch_id = res.message.batch_id;
  //   //         globalfrm.refresh_field('items');
  //   //       }
  //   //       const inputs = document.querySelectorAll('input');
  //   //       inputs.forEach(function(input) {
  //   //         if(input.getAttribute('data-name')!== cur_id){
  //   //         input.disabled = false; // Disable all input fields
  //   //         }
  //   //       });
  //   //     }
  //   //   }
  //   // })
    
    
  // }else {
  //   console.log("Disable inputs");
  //   const inputs = document.querySelectorAll('input');
  //   console.log(inputs);
  //   inputs.forEach(function(input) {
  //     if(input.getAttribute('data-name')!== cur_id){
  //       input.disabled = true; // Disable all input fields
  //     }
  //   });
  // }
  // If expiry field has no value, disable all input fields except expiry.
};

const handleBatchExpiryEntry = async (field_element,) => {
  let cur_id = field_element.dataset.name;

  // Check if batch field has a value.
  var expiry = document.getElementById(`batch_expiry_${cur_id}`).value;
  var batch = document.getElementById(`batch_no_${cur_id}`).value;
  var idx = field_element.dataset.idx -1;

  // if(batch && expiry){
  //   let supplier = cur_frm.doc.supplier_name
  //   let item = field_element.dataset.code
    
  //   // await frappe.call({
  //   //   method: "gch_purchases.services.save_batch",
  //   //   args: {
  //   //     batch_no: batch,
  //   //     expiry_date: expiry,
  //   //     supplier: supplier,
  //   //     item: item,
  //   //     doc_name: cur_id
  //   //   },
  //   //   callback: (res) => {
  //   //     console.log(res.message);
  //   //     if(res.message){
  //   //       if(res.message.batch_id){
  //   //         globalfrm.doc.items[idx].batch_id = res.message.batch_id;
  //   //         globalfrm.refresh_field('items');
  //   //       }
  //   //       const inputs = document.querySelectorAll('input');
  //   //       inputs.forEach(function(input) {
  //   //         if(input.getAttribute('data-name')!== cur_id || input.getAttribute('readonly')){
  //   //           input.disabled = false; // Disable all input fields
  //   //         }
  //   //       });
  //   //     }
  //   //   }
  //   // })

  // }else {
  // // If batch has no value, disable all input fields except batch field
  //   console.log("Disable inputs");
  //     const inputs = document.querySelectorAll('input');
  //     console.log(inputs);
  //     inputs.forEach(function(input) {
  //       if(input.getAttribute('data-name')!== cur_id){
  //         input.disabled = true; // Disable all input fields
  //       }
  //   });

  // }
};

const get_ordered_quantity = async (item_object) => {
  await frappe.call({
    method: "gch_purchases.services.get_purchase_order_quantity",
    args: {
      "purchase_order_item": item_object.purchase_order_item
    },
    callback: (res) => {
      if(res.message){
        console.log(res.message.qty);
        // qty = res.message.qty
        return res.message.qty
      }
    }
  });
}

const update_batch_details = (batch_no) => {
  var dialog = new frappe.ui.Dialog({
    title: 'Enter Values',
    fields: [
        {
            fieldtype: 'Data',
            label: 'Batch No.',
            fieldname: 'batch_no',
            reqd: 1,
            default: batch_no,
            read_only: 1
        },
        {
            fieldtype: 'Date',
            label: 'Batch Expiry Date',
            fieldname: 'expiry_date',
            reqd: 1,
            default: frappe.datetime.get_today() // Set default to today's date
        }
    ],
    primary_action_label: 'Submit',
    primary_action(values) {
        // On submit, validate the date and perform actions with the values
        var selected_date = values.expiry_date;
        var today = frappe.datetime.get_today();
        var batch_no = values.batch_no

        if (selected_date >= today) {
            // Update batch details
            frappe.call({
              method: "gch_purchases.services.update_batch_details",
              args: {
                "batch_no":batch_no,
                "expiry_date": selected_date
              },
              callback: (res) => {
                if(res.message){
                  // Refresh Doc
                  window.location.reload();
                }
              }
            })
            dialog.hide();
        } else {
            frappe.msgprint(__('Selected date should be today or later'));
        }
    }
});

dialog.show();
}

const build_batch_field = (item_object,frm) => {

  console.log(item_object,"batch Item object");

  if (item_object.batch_no) {
    return `
        <div class="input-group">
        <input readonly class="form-control" value="${item_object.batch_no}">
        <button class="btn btn-secondary" onclick="update_batch_details('${item_object.batch_no}')">Edit</div>
        </div>
      `;
  } else {
    return `
        <div class="input-group">
            <input class="form-control" 
              onchange="handleBatchNumberEntry(this)" 
              data-name="${item_object.name}"
              data-column="batch_no" 
              data-code=${item_object.item_code}
              data-idx=${item_object.idx}
              id="batch_no_${item_object.name}" type="text" placeholder="Batch No"
            >
            <input class="form-control" 
              onchange="handleBatchExpiryEntry(this)" 
              data-code=${item_object.item_code}
              data-column="batch_expiry" data-name="${item_object.name}" 
              data-idx=${item_object.idx}
              id="batch_expiry_${item_object.name}" type="date"
            >           
        </div>
        `;
  }
};

const mark_item_not_received = (item_row) => {
  console.log(item_row);
  // check if doc is saved and prompt user on action to take
  if(cur_frm.doc.__islocal===1) {
    frappe.throw("Save document before receiving items.")
  } else {
    frappe.confirm(
      "Would like to remove this item from the current receipt?",
      () => {
        console.log("Yes");
        frappe.call({
          method: "gch_purchases.services.remove_item_from_receipt",
          args: {
            "child_entry": item_row
          },
          callback: (res) => {
            console.log(res.message);
            cur_frm.refresh_fields("items")
            cur_frm.reload_doc()
          }
        })
      },
      () => {
        console.log("No");
        cur_frm.refresh_fields("items")
        cur_frm.reload_doc()
      }
    )
  }
}

const build_items = (frm) => {
  let ROWS = [];

  for (let index = 0; index < frm.doc.items.length; index++) {
    const single_row = frm.doc.items[index];
    const stringfied_row = JSON.stringify(single_row);
    console.log(single_row, "single_row", stringfied_row);

    ROWS.push(`
        <tr id="__${single_row.name}">
          
            <td>
            <input type="checkbox" checked onchange="mark_item_not_received('${single_row.name}')">
            </td>

            <td scope="col">
                ${index + 1}
            </td>
            <td scope="col">
                <input  class="form-control"
                 readonly
                 data-item="${single_row.item_name}"
                 data-id=${single_row.name}
                 data-column="item_name"
                 value="${single_row.item_name ? single_row.item_name : ""}"
            </td>
            <td scope="col">
                <p id="ordered_${single_row.name}">
                  ${get_ordered_quantity(single_row)}
                </p>
            </td>
            <td scope="col">
                
                <input type="number" class="form-control"
                  data-column="received_qty"
                  data-id=${single_row.name}
                  onchange="save_purchase_receipt_items(this,${index})"
                  value="${single_row.qty ? single_row.qty : 0}"
            </td>
            <td scope="col">
                <input type="number" readonly class="form-control" value="${
                  single_row.rate ? single_row.rate : 0
                }"
            
            </td>
            <td scope="col">
                <input type="number" readonly class="form-control" value="${
                  single_row.amount ? single_row.amount : 0
                }"
                
            </td>
            <td scope="col">
                ${build_batch_field(single_row,frm)}
            </td>
            <td>
              <button class="btn btn-sm " 
                onclick="handleDuplicate('${encodeURIComponent(stringfied_row)}')"
                >Duplicate
              </button> 
            </td>
        </tr>
    `);

    // <button class="btn btn-primary" style="font-size: 8px" 
    // onclick="handleDuplicate('${encodeURIComponent(stringfied_row)}')"
    // >Duplicate</button> 
  }
  return ROWS;
};

const save_purchase_receipt_items = (field_element,idx)=>{
  let id = globalfrm.doc.items[idx].name;
  let value = field_element.value

  // if(doc_column == 'received_qty'){
    // // console.log(value,column,id);
    // var current_frm = frappe.get_doc('Purchase Receipt', globalfrm.docname)
    // console.log(current_frm.items[idx]);
    // return null
    // current_frm.items[idx].qty = value
    // current_frm.items[idx].stock_qty = value
    // current_frm.save()
    // cur_frm.doc.items[idx].received_qty = value + rejected
    // cur_frm.doc.items[idx].received_stock_qty = value + rejected
  // }
  
  // column_field.grid.grid_rows[idx].doc.doc_column = value

  frappe.call({
    method: "gch_purchases.services.save_purchase_receipt_item",
    args: {
      column: "received_qty",
      id: id,
      value: value
    },
    callback: (res)=> {
      console.log(res);

    }
  })
}

const save_receipt_item = (field_element) => {
  //  Get all values in row: DOne[]
  //  Send to backend for saving.
  let row_name = field_element.id
  let purchase_order = field_element.dataset.order
  let purchase_order_item = field_element.dataset.orderitem;
  let item = document.getElementById(`item_name_${row_name}`).value;
  let item_code = document.getElementById(`item_name_${row_name}`).dataset.item
  let rate = document.getElementById(`item_name_${row_name}`).dataset.rate
  let received_qty = document.getElementById(`received_qty_${row_name}`).value;
  let batch_number = document.getElementById(`batch_${row_name}`).value;
  let batch_expiry = document.getElementById(`expiry_${row_name}`).value;
  let supplier = cur_frm.doc.supplier
  let doc_name = cur_frm.doc.name

  frappe.call({
    method:"gch_purchases.services.create_new_purchase_receipt_item",
    args: {
      "item_name": item,
      "item_code": item_code,
      "received_qty": Number(received_qty),
      "batch_number": batch_number,
      "batch_expiry": batch_expiry,
      "supplier": supplier,
      "doc_name": doc_name,
      "rate": rate,
      "purchase_order": purchase_order,
      "purchase_order_item": purchase_order_item
    },
    callback: (res)=>{
      // console.log(res)supplier email
      frappe.ui.form.trigger('refresh', frm.doc.doctype, frm.doc.name);
  
      // let button = document.getElementById(`row_name`);
      // console.log(button);
    }
  })
}

const handleDuplicate = (e) => {
  let row_data = JSON.parse(decodeURIComponent(e));
  let tableRef = document.getElementById("dynamic_purchase_receipt_table")
  let newrow = tableRef.insertRow()
  let idx = newrow.rowIndex;
  let row_name = row_data.name
  console.log("row data", row_data, row_data.name);

  let new_cell = newrow.insertCell(0);
  let new_cell1 = newrow.insertCell(1);
  let new_cell2 = newrow.insertCell(2);
  let new_cell3 = newrow.insertCell(3);
  let new_cell4 = newrow.insertCell(4);
  let new_cell5 = newrow.insertCell(5);
  let new_cell6 = newrow.insertCell(6);
  let new_cell7 = newrow.insertCell(7);
  let new_cell8 = newrow.insertCell(8);

  new_cell.innerHTML = `<input type="checkbox" checked>`
  new_cell1.innerHTML = `<p>${idx}</p>`
  new_cell2.innerHTML = `<input readonly class="form-control" style="min-width:250px"
                            data-item="${row_data.item_code}"
                            data-rate="${row_data.rate}"
                            id="item_name_${row_name}"
                            value="${row_data.item_name}"
                        />`
  new_cell4.innerHTML = `<input class="form-control" type="number" id="received_qty_${row_name}"/>`
  new_cell5.innerHTML = `<input readonly class="form-control" id="rate_${row_name}" value="${row_data.rate}" />`
  new_cell6.innerHTML = `<input readonly class="form-control" id="net_rate_${row_name}" value="${row_data.net_rate}" />`
  new_cell7.innerHTML = `<div class="input-group"  style="width: 250px">
    <input type="text" id="batch_${row_name}" placeholder="Batch No" class="form-control" />
    <input type="date" id="expiry_${row_name}" class="form-control" />
  </div>
  `

  frappe.call({
    method: "gch_purchases.services.get_purchase_order_quantity",
    args: {
      "purchase_order_item": row_data.purchase_order_item
    },
    callback: (res) => {
      if(res.message){
        console.log(res.message.qty);
        let qty = res.message.qty
        new_cell3.innerHTML = `<p>${qty}</p>`

      }
    }
  });

  new_cell8.innerHTML = `<button class="btn btn-primary" 
                            data-order="${row_data.purchase_order}" 
                            data-orderitem="${row_data.purchase_order_item}" 
                            id="${row_data.name}" 
                            onclick="save_receipt_item(this)" 
                            style="font-size: 8px" >
                              Save
                          </button>`
}

const build_receipt_table = (frm) => {

  let TABLE_ROWS = build_items(frm);

  const HTML_TEMPLATE = `
    <div style="overflow-x: scroll" id="pharmacy_scrollable_table" class="mb-4">
    <table class="table table-bordered table-hover">
    <thead>
      <tr>
      <th scope="col"></th>
      <th scope="col"></th>
      <th scope="col">Item Name</th>
      <th scope="col">Ordered Quantity</th>
      <th scope="col">Accepted Quantity</th>
      <th scope="col">Rate.(Ksh)</th>
      <th scope="col">Amount.(Ksh)</th>
      <th scope="col" style="min-width: 6.875rem">Batch Details.</th>
      </tr>
    </thead>
    <tbody id="dynamic_purchase_receipt_table">
    ${TABLE_ROWS}
    </tbody>
    </table>
    </div>
	`;
  $(frm.fields_dict["scrollable_items_table"].wrapper).append(HTML_TEMPLATE);
  // frm.set_df_property("items", "hidden", true);
  // frm.refresh_fields("item");
  frm.set_df_property("scan_barcode", "hidden", true);
  frm.refresh_fields("scan_barcodef");
};

window.handleBatchNumberEntry = handleBatchNumberEntry;
window.handleBatchExpiryEntry = handleBatchExpiryEntry;
window.save_purchase_receipt_items = save_purchase_receipt_items;
window.handleDuplicate = handleDuplicate;
window.save_receipt_item = save_receipt_item;
window.get_ordered_quantity = get_ordered_quantity;
window.update_batch_details = update_batch_details;
window.mark_item_not_received = mark_item_not_received;

frappe.ui.form.on("Purchase Receipt", {

  onload: (frm) => {
    globalfrm =frm;

    frappe.require("/assets/gch_custom/js/gch_utilities/index.js", () => {
      field_list.forEach((field) => {
        toggle_permission(frm, field, true);
      });
    });

    frm.set_query("supplier_purchase_order", function () {
      return {
        filters: { supplier: frm.doc.supplier, workflow_state: "Approved" },
      };
    });

    $(frm.fields_dict["scrollable_items_table"].wrapper).empty();

    // get ordered quantity
    frm.doc.items.forEach( async (item) => {
      await frappe.call({
        method: "gch_purchases.services.get_purchase_order_quantity",
        args: {
          "purchase_order_item": item.purchase_order_item
        },
        callback: (res) => {
          if(res.message){
            console.log(res.message.qty);
            item.ordered_qty = res.message.qty;
          }
        }
      });
    });
    frm.fields_dict['items'].grid.refresh();

    // build_receipt_table(frm);

    // frm.get_field("items").grid.df.cannot_delete_rows = true;
    
    // const childTableField = frm.fields_dict['items'];
    // childTableField.$wrapper.find('.grid-add-row').addClass('hidden');
 
    
    frm.add_custom_button(
      "Back to Queue",
      () => {                
          history.back();
      }
    );
  },

  refresh: (frm) => {
    globalfrm =frm;
    frappe.require("/assets/gch_custom/js/gch_utilities/index.js", () => {
      field_list.forEach((field) => {
        toggle_permission(frm, field, true);
      });
    });


    // frm.fields_dict['items'].grid.wrapper.find('.grid-add-row').addClass('hidden');
    // frm.get_field("items").grid.df.cannot_delete_rows = true;
    // console.log(frm.fields_dict['items'].grid.wrapper.find('.grid-add-row'));
    // $('*[data-fieldname="items"]').find('.grid-remove-rows').hide();
    // $('*[data-fieldname="items"]').find('.grid-add-multiple-rows').hide();
    // $('*[data-fieldname="items"]').find('.grid-add-row').hide();

    frm.add_custom_button(
      "Back to Queue",
      () => {                
          history.back();
      }
    );

  },

  after_save: (frm) => {
    frm.doc.items.forEach((item) => {
      let batch = item.batch_code
      let exp = item.batch_expiry
      if(batch && exp){
        frappe.call({
        method: "gch_purchases.services.save_batch_on_purchase_receipt_items",
        async: false,
        args: {
          "batch_code": item.batch_code,
          "batch_expiry": item.batch_expiry,
          "item_code": item.item_code,
          "name": item.name,
        },
        callback: (res) => {
          if(res.message){
            console.log(res.message, "Before submit"); 
            //set
            
            // empty_dict.push(res.message);
          }
        }
        })
      }else{
        frappe.throw(__("Please fill the batch details"));
      }
      console.log(item,"Item object");
      
    });

    cur_frm.reload_doc();

    //If all Fails)
    // window.location.reload(true);
  },

  on_submit: (frm) => {
    // window.location.reload(true);
  },

  

  validate: async (frm) => {
    // Only items from one purchase order should be on the purchase receipt
    var purchase_order = frm.doc.items[0].purchase_order;

    var po = await frappe.call({
      method: "gch_purchases.services.validate_purchase_receipt",
      args: {
        form_object: frm.doc,
      },
      callback: (res) => {
        console.log(res);
      },
    });
    console.log(po);
    var orderedQuantities = {};
    console.log(purchase_order, "Purchase order");

    frm.doc.items.forEach((item) => {
      if (item.purchase_order !== purchase_order) {
        var purchaseOrderItem = frappe.get_doc("Purchase Receipt");
        var index = frm.doc.items.indexOf(item);
        if (index !== -1) {
          frm.doc.items.splice(index, 1);
        }
      }
    });

    frm.doc.items.forEach((item) => {
      if(item.qty %1 !== 0 || item.qty < 0){
        frappe.msgprint(__('Quantity must be a Positive Whole number.'));
        frappe.validated = false;
        return;
      }
    });

    frm.refresh_field("items");
  },
});

frappe.ui.form.on("Purchase Receipt Item", {
  batch_expiry: (frm, cdt, cdn) => {
    // Check  if date is less tham 1 year from today
    let child = locals[cdt][cdn];
    let exp = child.batch_expiry;
    let today = frappe.datetime.get_today();
    let date = frappe.datetime.add_days(today, 365);
    if(exp < today){
      frappe.msgprint(__("Batch Expiry date cannot be less than today's date"));
      child.batch_expiry = today;
      frappe.validated = false;
      return;
    }else if(exp < date){
      frappe.prompt([
        {
            label: 'Reason for Receiving Items with less than 1 year shelf life',
            fieldname: 'comment',
            fieldtype: 'Text',
            reqd: 1
        }
    ],
    function(values) {
        console.log(values);
        child.grn_comment = values.comment;
    },
    'GRN Comment'
    );
    }
  },
  received_qty: (frm, cdt, cdn) => {
  let child = locals[cdt][cdn];
    let accepted_qty = child.received_qty;
    let ordered_qty = child.ordered_qty;
    console.log(ordered_qty, "Ordered Qty");
    if(accepted_qty > ordered_qty){
      child.received_qty = ordered_qty;
      frappe.msgprint(__("Accepted Qty cannot be greater than Ordered Qty"));
      frappe.validated = false;
      return;
    }
  },
});