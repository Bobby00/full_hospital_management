let qty_validated = true;
var my_page;

const generate_material_request = function (type="drugs") {
  // frappe.call({
  //   method: "gch_purchases.services.generate_material_request",
  //   callback: (res) => {
  //     if(res.message){
  //       console.log(res);
  //       request_name = res.message.name
  //       window.location.href=`/app/material-request/${request_name}`
  //     }
  //   }
  // })
  if(type == 'drugs'){
    frappe.call({
      method: "gch_purchases.services.generate_material_request",
      callback: (res) => {
        if (res.message) {
          console.log(res);
          request_name = res.message.name;
          window.location.href = `/app/material-request/${request_name}`;
        }
      },
    });
  } else if(type == "dental") {
    frappe.call({
      method: "gch_purchases.services.generate_material_request_dental",
      callback: (res) => {
        if (res.message) {
          console.log(res);
          request_name = res.message.name;
          window.location.href = `/app/material-request/${request_name}`;
        }
      },
    });
  } else if(type == "non-drugs") {
    frappe.call({
      method: "gch_purchases.services.generate_material_request_surgicals",
      callback: (res) => {
        if (res.message) {
          console.log(res);
          request_name = res.message.name;
          window.location.href = `/app/material-request/${request_name}`;
        }
      },
    });
  } else {
    frappe.call({
      method: "gch_purchases.services.generate_request_for_user_branch",
      callback: (res) => {
        if (res.message) {
          console.log(res);
          request_name = res.message.name;
          window.location.href = `/app/material-request/${request_name}`;
        }
      },
    });
  }
  
};

const get_default_range = () => {
  return ['2022-11-14', '2022-11-16']
}

const open_print_page = (name) => {
  let url = `/app/print/Purchase%20Order/${name}`
  window.open(url, 'Print Order', 'width=1600,height=1200');
}



const renderOrdersByDate = async(start_date = null, end_date = null,all = false,receive = false) => {
  
  if(all){
    let orders_list = await frappe.call({
      method: "gch_purchases.services.render_orders",
      args : {
        "start_date": start_date,
        "end_date": end_date,
        "page": "all"
      }
    })
    let orders = orders_list.message
    return orders
  }
  else if(receive){
    let orders_list = await frappe.call({
      method: "gch_purchases.services.render_orders",
      args : {
        "start_date": start_date,
        "end_date": end_date,
        "receive": true
      }
    })
    let orders = orders_list.message
    return orders
  }else{
    let orders_list = await frappe.call({
      method: "gch_purchases.services.render_orders",
      args : {
        "start_date": start_date,
        "end_date": end_date
      }
    })
    let orders = orders_list.message
    return orders
  }
  
}

const renderOrdersByBranch = async(branch=null,all = false) => {
  if(all){
    let orders_list = await frappe.call({
      method: "gch_purchases.services.render_orders_branch",
      args : {
        "branch": branch,
        "all": true
      }
    })
    let orders = orders_list.message
    return orders
  }
  
  let orders_list = await frappe.call({
    method: "gch_purchases.services.render_orders_branch",
    args : {
      "branch": branch
    }
  })
  let orders = orders_list.message
  return orders
}

const renderByPONumber = async (po_number)=>{
 let orders_list = await frappe.call({
    method: "gch_purchases.services.render_orders_by_po_number",
    args : {
      "po_number": po_number
    }
 })
 let orders = orders_list.message
 return orders
}

const renderOrdersBySupplier = async(supplier=null,all = false,receive = false) =>  {
  // console.log(supplier);
  if(all){
    let orders_list = await frappe.call({
      method: "gch_purchases.services.render_orders_by_supplier",
      args : {
        "supplier": supplier,
        "all": true
      }
    })
    let orders = orders_list.message
    return orders
  }
  else if(receive){
    let orders_list = await frappe.call({
      method: "gch_purchases.services.render_orders_by_supplier",
      args : {
        "supplier": supplier,
        "receive": true
      }
    })
    let orders = orders_list.message
    return orders
  }  
  else{
    let orders_list = await frappe.call({
      method: "gch_purchases.services.render_orders_by_supplier",
      args : {
        "supplier": supplier
      }
    })
    let orders = orders_list.message
    return orders
  }
}

let selected = [];

const handleQtyChange = async (field_element,max_qty)=>{
  // Use id to retrieve objected from selected and update quantity
  let id = field_element.getAttribute("data-name");
  let value = field_element.value;
  if(max_qty < value || value < 0){
    frappe.show_alert({
      indicator: 'orange',
      message: 'Quantity cannot exceed the maximum quantity',
      title: 'Warning'
    })
    qty_validated = false;
    return;
  }else {
    qty_validated = true
  }
  
  selected.find(item => item.name === id).remaining_quantity = field_element.value;
  
}

const handleRequestItems = async (reqs,max) => {
  let selected_items = document.querySelectorAll('input[name=checkbox]:checked');
  // let selected = [];


  for(i=0; i<selected_items.length; i++){
    let req_id = selected_items[i].id;
    selected.push(reqs.find(({name})=>name===req_id));
  }


  let d = new frappe.ui.Dialog({
      title: 'Confirm the items you want to request below.',
      fields: [
        {
          label: 'item Name',
          fieldname: "html",
          fieldtype: 'HTML'
        }
      ],
      primary_action_label: 'Submit',
      primary_action(){
        
        if(!qty_validated){
          frappe.show_alert({
            indicator: 'orange',
            message: 'Cannot Create request, Confirm quantities before submit',
            title: 'Warning'
          })
          return;
        }
        console.log(selected);
        frappe.call({
          method: "gch_purchases.services.create_material_transfer_request",
          args: {
            "items": selected
          },
          callback: (res) => {
            if(res.message){              
              frappe.show_alert(
                {
                  message: __("Items requested successfully. Click on 'My Pending Requests' to track your requests"),
                  indicator: "green",
                },
                5
            );
            }
          }
        })
        d.hide()
        selected = [];
      }
  })
  let ROWS = "";

  for(i=0;i<selected.length;i++){

    ROWS+=`
    <tr id="${selected[i].name}" style="font-weight: bolder; font-size: 12px;>
    <td scope="col"></td>
    <td scope="col">${selected[i].item_name}</td>
    <td scope="col">
      <input class="form-control"  
        data-branch="${selected[i].branch}"
        data-warehouse="${selected[i].warehouse}"
        data-name="${selected[i].name}"
        onchange="handleQtyChange(this,${selected[i].remaining_quantity})"
        style="min-width: 6.875 rem;"type="number" min="0" 
        max="${selected[i].remaining_quantity}" value="${selected[i].remaining_quantity}" style="width: 50px">
    </td>
    <td scope="col" >${selected[i].branch} ${selected[i].warehouse}</td>
    </tr>
    `
  }
  
  let htmlC = `
    <table id="confirm" class="table table-bordered table-hover" style="font-size: 12px;">
      <thead>
        <tr>
          <th scope="col" style="min-width: 12.875rem">Item</th>
          <th scope="col" style="min-width: 6.875rem">Quantity</th>
          <th scope="col">From</th>
        </tr>
      </thead>
      <tbody id="dynamic_prescription_table">`
      +
      ROWS 
      +
      `</tbody>
    </table>
  `;
  d.set_value("html",htmlC)

  d.show();

}



const get_orders_to_be_received = async (test) => {

  frappe.session.previous_action='get_orders_to_be_received';

  orders = [];
  await frappe.call({
    method: "gch_purchases.services.get_to_be_received_per_branch",
    callback: (res) => {
      if(res.message){
        orders = res.message;
      }
    }
  })

  details = "";

  for (i = 0; i < orders.length; i++) {
    details += `
    <div class="level list-row" >
      <div class="list-row-col ellipsis list-subject level">
        <input class="level-item list-check-all hidden-xs" type="checkbox"
          title="Select">
        <span >${orders[i].transaction_date}</span>
      </div>
      <div class="list-row-col ellipsis list-subject hidden-xs  ">
          <span >
          <a href="/app/purchase-order/${orders[i].name}">${orders[i].name}</a></span>
      </div>
      <div class="list-row-col ellipsis list-subject hidden-xs">
          <span >        
          ${orders[i].supplier_name}
          </span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].branch ? orders[i].branch: "No Branch"}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].first_approval? "Done": "Pending"}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].final_approval? "Done": "Pending"}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].grand_total? orders[i].grand_total : 0}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
      </div>
    </div>
    `;
  }

  let status = "Orders to be received";
  test.status = status;
  test.orders = orders;
  test.page.main
    .html(frappe.render_template(frappe.templates.purchase_order_list, test))
    .html();

  this.date_range_field = frappe.ui.form.make_control({
    parent: $('.date-filter'),
    render_input: 1,
    df:{
        fieldtype: 'DateRange',
        fieldname: 'date_range',
        placeholder: __('Filter by Date'),
        default: get_default_range(),

        change:async () => {
          // console.log('test');
          let selected_date_range = this.date_range_field.get_value();
          if (selected_date_range && selected_date_range.length === 2) {
            let from_date = selected_date_range[0];
            let to_date = selected_date_range[1];
            // console.log(from_date, to_date);
            this.order = await renderOrdersByDate(from_date, to_date,false,true)
            refresh_purchase_orders(test,order,"To be received",true)
          }
        }
    },
  })
  
  this.date_range_field.toggle_label(false);
  this.date_range_field.refresh()

  let supplier_filter_field = frappe.ui.form.make_control({
      parent: $('.supplier-filter'),
      render_input: 1,
      df: {
          fieldtype: "Link",
          fieldname: "supplier_filter",
          placeholder: __('Filter By Supplier'),
          options: "Supplier",
          change: async () => {
              let selected_supplier = supplier_filter_field.get_value();
              if(selected_supplier){
                this.order = await renderOrdersBySupplier(selected_supplier,false,true)
                refresh_purchase_orders(test,order,status,true)
              }
          }
      }
  });
  supplier_filter_field.toggle_label(false);
  supplier_filter_field.refresh();

  let branch_filter_field = frappe.ui.form.make_control({
      parent: $('.branch-filter'),
      render_input: 1,
      df: {
          fieldtype: "Link",
          fieldname: "po_filter",
          placeholder: __('Filter By PO Number'),
          options: "Purchase Order",
          change: async () => {
            let selected_branch = branch_filter_field.get_value();
            console.log(selected_branch);
            if(selected_branch){
              this.order = await renderByPONumber(selected_branch)
              refresh_purchase_orders(test,order,status,true)
            }
          }
      }
  });
  branch_filter_field.toggle_label(false);
  branch_filter_field.refresh();


  $(".purchase-order-list").append(details);
}

const request_items = async function(field_element) {
  let checked = field_element.checked;
  if(checked){
    document.getElementById("request_items").style.display = "block";
  }else {
    let checkedBoxes = document.querySelectorAll('input[name=checkbox]:checked');
    if(checkedBoxes.length == 0) {
      document.getElementById("request_items").style.display = "none";
    }
  }
}

const generate_purchase_orders = async function () {
  frappe.call({
    method: "gch_purchases.services.tasks",
    callback: (res) => {
      if(res.message){
        console.log(res.message);
        frappe.msgprint(msg='Purchase Orders Generated Successfuly. Check on Purchase orders page.', title='Success')
      }
    }
  })
};

// frappe.realtime.on('purchase_order_queue_update', () =>{

//   orders = [];
//   frappe.call({
//     method: "gch_purchases.services.get_po_pending_review",
//     callback: (res) => {
//       // console.log(res);
//       orders = res.message;
//       let status = "Orders Pending Review";
//       orders_pending_review(this);
//     },
//   });
// })

const orders_pending_review = async function (test){

  frappe.session.previous_action='orders_pending_review';


  orders = [];
  let status = "";

  await frappe.call({
    method: "gch_purchases.services.get_po_pending_review",
    callback: (res) => {
      // console.log(res);
      orders = res.message;
      status = "Orders Pending Review";
    },
  });  

  let details = "";

  for (i = 0; i < orders.length; i++) {
    console.log(i);
    details += `
    <div class="level list-row" >
      <div class="list-row-col ellipsis list-subject level">
        <input class="level-item list-check-all hidden-xs" type="checkbox"
          title="Select">
        <span >${orders[i].transaction_date}</span>
      </div>
      <div class="list-row-col ellipsis list-subject hidden-xs  ">
          <span >
          <a href="/app/purchase-order/${orders[i].name}">${orders[i].name}</a></span>
      </div>
      <div class="list-row-col ellipsis list-subject hidden-xs">
          <span >        
          ${orders[i].supplier_name}
          </span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].branch ? orders[i].branch: "No Branch"}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].level_1_approval? orders[i].level_1_approval: "Pending"}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].level_2_approval? orders[i].level_2_approval: "Pending"}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].grand_total? orders[i].grand_total : 0}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
      </div>
    </div>
      `;
  }

  test.status = status;
  test.orders = orders;
  test.page.main
    .html(frappe.render_template(frappe.templates.purchase_order_list, test))
    .html();
  this.date_range_field = frappe.ui.form.make_control({
    parent: $('.date-filter'),
    render_input: 1,
    df:{
        fieldtype: 'DateRange',
        fieldname: 'date_range',
        placeholder: __('Filter by Date'),
        default: get_default_range(),

        change:async () => {
          // console.log('test');
          let selected_date_range = this.date_range_field.get_value();
          if (selecte_date_range && selecte_date_range.length === 2) {
            let from_date = selecte_date_range[0];
            let to_date = selecte_date_range[1];
            // console.log(from_date, to_date);
            this.order = await renderOrdersByDate(from_date, to_date)
            refresh_purchase_orders(test,order)
          }
        }
    },
  })
  
  this.date_range_field.toggle_label(false);
  this.date_range_field.refresh()

  let supplier_filter_field = frappe.ui.form.make_control({
      parent: $('.supplier-filter'),
      render_input: 1,
      df: {
          fieldtype: "Link",
          fieldname: "supplier_filter",
          placeholder: __('Filter By Supplier'),
          options: "Supplier",
          change: async () => {
              let selected_supplier = supplier_filter_field.get_value();
              if(selected_supplier){
                this.order = await renderOrdersBySupplier(selected_supplier)
                refresh_purchase_orders(test,order)
              }
          }
      }
  });
  supplier_filter_field.toggle_label(false);
  supplier_filter_field.refresh();

  let branch_filter_field = frappe.ui.form.make_control({
      parent: $('.branch-filter'),
      render_input: 1,
      df: {
          fieldtype: "Link",
          fieldname: "branch_filter",
          placeholder: __('Filter By Branch'),
          options: "Branch",
          change: async () => {
            let selected_branch = branch_filter_field.get_value();
            console.log(selected_branch);
            if(selected_branch){
              this.order = await renderOrdersByBranch(selected_branch)
              refresh_purchase_orders(test,order)
            }
          }
      }
  });
  branch_filter_field.toggle_label(false);
  branch_filter_field.refresh();


  $(".purchase-order-list").append(details);

}

const all_purchase_orders_requests = async function (test,approved=false,review=false){

  frappe.session.previous_action='all_purchase_orders_requests';


  orders = [];
  let status = "";
  // console.log(test,"TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTEEEEEEEEEEEEEEEEEEESTTTTTTTTTTTTTT");

  
    await frappe.call({
     method: "gch_purchases.services.all_requests",
     callback: (res) => {
      //  console.log(res);
       orders = res.message;
       status = "All Requests";
     },
    });
 
 

  let details = "";

  for (i = 0; i < orders.length; i++) {
    // console.log(i);
    details += `
    <div class="level list-row" >
      <div class="list-row-col ellipsis list-subject level">
        <input class="level-item list-check-all hidden-xs" type="checkbox"
          title="Select">
        <span >${orders[i].transaction_date}</span>
      </div>
      <div class="list-row-col ellipsis list-subject hidden-xs  ">
          <span >
          <a href="/app/purchase-order/${orders[i].name}">${orders[i].name}</a></span>
      </div>
      <div class="list-row-col ellipsis list-subject hidden-xs">
          <span >        
          ${orders[i].supplier_name}
          </span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].branch ? orders[i].branch: "No Branch"}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].first_approval? "Done": "Pending"}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].final_approval? "Done": "Pending"}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].grand_total? orders[i].grand_total : 0}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].workflow_state? orders[i].workflow_state : "Unusual"}</span>
        </div>
      <div class="list-row-col ellipsis hidden-xs  ">
      <span ><button onclick="open_print_page('${orders[i].name}')" class="btn btn-secondary"> print</button></span>
      </div>
      
    </div>
      `;
  }

  // <div class="list-row-col ellipsis hidden-xs  ">
  //         <span ><button onclick="open_print_page('${orders[i].name}')" class="btn btn-secondary"> print</button></span>
  //     </div>
  // <div class="list-row-col ellipsis hidden-xs  ">
  //       <div style="font-size: 10px" class="btn btn-primary" onclick="mark_as_sent(this)" data-order="${orders[i].name}">email sent.</div>
  //     </div>

  test.status = status;
  test.orders = orders;
  test.page.main
    .html(frappe.render_template(frappe.templates.purchase_order_list, test))
    .html();
  
  this.date_range_field = frappe.ui.form.make_control({
    parent: $('.date-filter'),
    render_input: 1,
    df:{
        fieldtype: 'DateRange',
        fieldname: 'date_range',
        placeholder: __('Filter by Date'),
        default: get_default_range(),

        change:async () => {
          let selecte_date_range = this.date_range_field.get_value()
          if (selecte_date_range && selecte_date_range.length === 2) {
            let from_date = selecte_date_range[0];
            let to_date = selecte_date_range[1];
            console.log(from_date, to_date);
            this.order = await renderOrdersByDate(from_date, to_date,true)
            refresh_purchase_orders(test,order)
          }
        }
    },
  })
  
  this.date_range_field.toggle_label(false);
  this.date_range_field.refresh()


  let supplier_filter_field = frappe.ui.form.make_control({
      parent: $('.supplier-filter'),
      render_input: 1,
      df: {
          fieldtype: "Link",
          fieldname: "supplier_filter",
          placeholder: __('Filter By Supplier'),
          options: "Supplier",
          change: async () => {
              let selected_supplier = supplier_filter_field.get_value();
              if(selected_supplier){
                this.order = await renderOrdersBySupplier(selected_supplier,true)
                refresh_purchase_orders(test,order)
              }
          }
      }
  });
  supplier_filter_field.toggle_label(false);
  supplier_filter_field.refresh();

  let branch_filter_field = frappe.ui.form.make_control({
      parent: $('.branch-filter'),
      render_input: 1,
      df: {
          fieldtype: "Link",
          fieldname: "branch_filter",
          placeholder: __('Filter By Branch'),
          options: "Branch",
          change: async () => {
            let selected_branch = branch_filter_field.get_value();
            console.log(selected_branch);
            if(selected_branch){
              this.order = await renderOrdersByBranch(selected_branch,true)
              refresh_purchase_orders(test,order,"all")
            }
          }
      }
  });
  branch_filter_field.toggle_label(false);
  branch_filter_field.refresh();


  $(".purchase-order-list").append(details);

}

const all_purchase_orders = async function (test,approved=false,review=false){

  frappe.session.previous_action='all_purchase_orders';

  orders = [];
  let status = "";

  if(approved){
     await frappe.call({
      method: "gch_purchases.services.get_approved_po",
      callback: (res) => {
        // console.log(res);
        orders = res.message;
        status = "Approved To be sent to supplier";
      },
    });
  } else {
    await frappe.call({
     method: "gch_purchases.services.get_my_pos",
     callback: (res) => {
      //  console.log(res);
       orders = res.message;
       status = "My Orders";
     },
   });
 }
 

  frappe.realtime.on('to_sent_to_supplier', (data) => {
    console.log(data)
    all_purchase_orders(test,true);
  })

  let details = "";

  for (i = 0; i < orders.length; i++) {
    // console.log(i);
    details += `
    <div class="level list-row" >
      <div class="list-row-col ellipsis list-subject level">
        <input class="level-item list-check-all hidden-xs" type="checkbox"
          title="Select">
        <span >${orders[i].transaction_date}</span>
      </div>
      <div class="list-row-col ellipsis list-subject hidden-xs  ">
          <span >
          <a href="/app/purchase-order/${orders[i].name}">${orders[i].name}</a></span>
      </div>
      <div class="list-row-col ellipsis list-subject hidden-xs">
          <span >        
          ${orders[i].supplier_name}
          </span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].branch ? orders[i].branch: "No Branch"}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].first_approval? "Done": "Pending"}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].final_approval? "Done": "Pending"}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].grand_total? orders[i].grand_total : 0}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
      <span ><button onclick="open_print_page('${orders[i].name}')" class="btn btn-secondary"> print</button></span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
        <div style="font-size: 10px" class="btn btn-primary" onclick="mark_as_sent(this)" data-order="${orders[i].name}">email sent.</div>
      </div>
    </div>
      `;
  }

  // <div class="list-row-col ellipsis hidden-xs  ">
  //         <span ><button onclick="open_print_page('${orders[i].name}')" class="btn btn-secondary"> print</button></span>
  //     </div>
  // <div class="list-row-col ellipsis hidden-xs  ">
  //       <div style="font-size: 10px" class="btn btn-primary" onclick="mark_as_sent(this)" data-order="${orders[i].name}">email sent.</div>
  //     </div>

  test.status = status;
  test.orders = orders;
  test.page.main
    .html(frappe.render_template(frappe.templates.purchase_order_list, test))
    .html();
  
  this.date_range_field = frappe.ui.form.make_control({
    parent: $('.date-filter'),
    render_input: 1,
    df:{
        fieldtype: 'DateRange',
        fieldname: 'date_range',
        placeholder: __('Filter by Date'),
        default: get_default_range(),

        change:async () => {
          let selecte_date_range = this.date_range_field.get_value()
          if (selecte_date_range && selecte_date_range.length === 2) {
            let from_date = selecte_date_range[0];
            let to_date = selecte_date_range[1];
            console.log(from_date, to_date);
            this.order = await renderOrdersByDate(from_date, to_date)
            refresh_purchase_orders(test,order)
          }
        }
    },
  })
  
  this.date_range_field.toggle_label(false);
  this.date_range_field.refresh()


  let supplier_filter_field = frappe.ui.form.make_control({
      parent: $('.supplier-filter'),
      render_input: 1,
      df: {
          fieldtype: "Link",
          fieldname: "supplier_filter",
          placeholder: __('Filter By Supplier'),
          options: "Supplier",
          change: async () => {
              let selected_supplier = supplier_filter_field.get_value();
              if(selected_supplier){
                this.order = await renderOrdersBySupplier(selected_supplier)
                refresh_purchase_orders(test,order)
              }
          }
      }
  });
  supplier_filter_field.toggle_label(false);
  supplier_filter_field.refresh();

  let branch_filter_field = frappe.ui.form.make_control({
      parent: $('.branch-filter'),
      render_input: 1,
      df: {
          fieldtype: "Link",
          fieldname: "branch_filter",
          placeholder: __('Filter By Branch'),
          options: "Branch",
          change: async () => {
            let selected_branch = branch_filter_field.get_value();
            console.log(selected_branch);
            if(selected_branch){
              this.order = await renderOrdersByBranch(selected_branch)
              refresh_purchase_orders(test,order)
            }
          }
      }
  });
  branch_filter_field.toggle_label(false);
  branch_filter_field.refresh();


  $(".purchase-order-list").append(details);

}

const mark_as_sent = async function (field_element){
  var order = field_element.dataset.order
  await frappe.call({
    method: "gch_purchases.services.mark_po_as_sent_to_supplier",
    args: {
      "purchase_order_number": order
    }, callback: (res) => {
      if(res.message){
        console.log(res.message);
        all_purchase_orders(my_page,true);
      }
    }
  })
  // console.log(order);
}

const refresh_purchase_orders = async function(test,order_list, status = "",receive=false){

  frappe.session.previous_action = 'refresh_purchase_orders';


  orders = order_list;
  let cur_status = status? status:"Orders filtered list";
  let details = ''
  let last_row = ''

  let user_ = frappe.user;
 

  if(order_list){

    for (i = 0; i < orders.length; i++) {

      if(cur_status != "all" && user_.has_role("GCH-Clinical Supplier Officer")){
        last_row = `
        <div class="list-row-col ellipsis hidden-xs  ">
              <div style="font-size: 10px" class="btn btn-primary" onclick="mark_as_sent(this)" data-order="${orders[i].name}">email sent.</div>
        </div>
        `
      }else {
        last_row = `
        <div class="list-row-col ellipsis hidden-xs  ">
              <span></span>>
        </div>
        `
      }

      console.log(i);
      details += `
        <div class="level list-row" >
        <div class="list-row-col ellipsis list-subject level">
          <input class="level-item list-check-all hidden-xs" type="checkbox"
            title="Select">
          <span  >${orders[i].transaction_date}</span>
        </div>
        <div class="list-row-col ellipsis list-subject  hidden-xs  ">
            <span >
            <a href="/app/purchase-order/${orders[i].name}" class="level-item">${orders[i].name}</a></span>
        </div>
        <div class="list-row-col ellipsis list-subject hidden-xs">
            <span >        
            ${orders[i].supplier_name}
            </span>
        </div>
        <div class="list-row-col ellipsis hidden-xs  ">
          <span >${orders[i].branch ? orders[i].branch: "No Branch"}</span>
        </div>
        <div class="list-row-col ellipsis hidden-xs  ">
            <span >${orders[i].first_approval? "Done": "Pending"}</span>
        </div>
        <div class="list-row-col ellipsis hidden-xs  ">
            <span >${orders[i].final_approval? "Done": "Pending"}</span>
        </div>
        <div class="list-row-col ellipsis hidden-xs  ">
            <span >${orders[i].grand_total? orders[i].grand_total : 0}</span>
        </div>
        <div class="list-row-col ellipsis hidden-xs  ">
        <span ><button onclick="open_print_page('${orders[i].name}')" class="btn btn-secondary"> print</button></span>
        </div>
        ${last_row}
      </div>
        `;
    }

    test.status = cur_status;
    test.orders = orders;
    test.page.main
      .html(frappe.render_template(frappe.templates.purchase_order_list, test))
      .html();
      }

    if(receive){
      // frappe.throw("To be received")
      this.date_range_field = frappe.ui.form.make_control({
        parent: $('.date-filter'),
        render_input: 1,
        df:{
            fieldtype: 'DateRange',
            fieldname: 'date_range',
            placeholder: __('Filter by Date'),
            default: get_default_range(),
    
            change:async () => {
              // console.log('test');
              let selected_date_range = this.date_range_field.get_value();
              if (selected_date_range && selected_date_range.length === 2) {
                let from_date = selected_date_range[0];
                let to_date = selected_date_range[1];
                // console.log(from_date, to_date);
                this.order = await renderOrdersByDate(from_date, to_date)
                refresh_purchase_orders(test,order,"To be received",true)
              }
            }
        },
      })
      
      this.date_range_field.toggle_label(false);
      this.date_range_field.refresh()
    
      let supplier_filter_field = frappe.ui.form.make_control({
          parent: $('.supplier-filter'),
          render_input: 1,
          df: {
              fieldtype: "Link",
              fieldname: "supplier_filter",
              placeholder: __('Filter By Supplier'),
              options: "Supplier",
              change: async () => {
                  let selected_supplier = supplier_filter_field.get_value();
                  if(selected_supplier){
                    this.order = await renderOrdersBySupplier(selected_supplier,false,true)
                    refresh_purchase_orders(test,order,status,true)
                  }
              }
          }
      });
      supplier_filter_field.toggle_label(false);
      supplier_filter_field.refresh();
    
      let branch_filter_field = frappe.ui.form.make_control({
        parent: $('.branch-filter'),
        render_input: 1,
        df: {
            fieldtype: "Link",
            fieldname: "po_filter",
            placeholder: __('Filter By PO Number'),
            options: "Purchase Order",
            change: async () => {
              let selected_branch = branch_filter_field.get_value();
              console.log(selected_branch);
              if(selected_branch){
                this.order = await renderByPONumber(selected_branch)
                refresh_purchase_orders(test,order,status,true)
              }
            }
        }
      });
      branch_filter_field.toggle_label(false);
      branch_filter_field.refresh();
    }else {
      this.date_range_field = frappe.ui.form.make_control({
        parent: $('.date-filter'),
        render_input: 1,
        df:{
            fieldtype: 'DateRange',
            fieldname: 'date_range',
            placeholder: __('Filter by Date'),
            default: get_default_range(),
    
            change:async () => {
              let selecte_date_range = this.date_range_field.get_value()
              if (selecte_date_range && selecte_date_range.length === 2) {
                let from_date = selecte_date_range[0];
                let to_date = selecte_date_range[1];
                console.log(from_date, to_date);
                if(cur_status === "all"){
                  this.order = await renderOrdersByDate(from_date, to_date,true)
                  refresh_purchase_orders(test,order)
                }else {
                  this.order = await renderOrdersByDate(from_date, to_date)
                  refresh_purchase_orders(test,order,cur_status)
                }
                
              }
            }
        },
      })
  
      
      let supplier_filter_field = frappe.ui.form.make_control({
          parent: $('.supplier-filter'),
          render_input: 1,
          df: {
              fieldtype: "Link",
              fieldname: "supplier_filter",
              placeholder: __('Filter By Supplier'),
              options: "Supplier",
              change: async () => {
                  let selected_supplier = supplier_filter_field.get_value();
                  if(selected_supplier){
                    if(cur_status === "all"){
                      this.order = await renderOrdersBySupplier(selected_supplier,true)
                      refresh_purchase_orders(test,order)
                    }else {
                      this.order = await renderOrdersBySupplier(selected_supplier)
                      refresh_purchase_orders(test,order,cur_status)
                    }
                  }
                  
              }
          }
      });
      // supplier_filter_field.toggle_label(false);
      // supplier_filter_field.refresh();
  
      let branch_filter_field = frappe.ui.form.make_control({
          parent: $('.branch-filter'),
          render_input: 1,
          df: {
              fieldtype: "Link",
              fieldname: "branch_filter",
              placeholder: __('Filter By Branch'),
              options: "Branch",
              change: async () => {
                  let selected_branch = branch_filter_field.get_value();
                  console.log(selected_branch);
                  if(selected_branch){
                    if (cur_status === "all") {
                    this.order = await renderOrdersByBranch(selected_branch,true)
                    refresh_purchase_orders(test,order)
                    }else{
                      this.order = await renderOrdersByBranch(selected_branch)
                      refresh_purchase_orders(test,order,cur_status)
                    }
                  }
              }
          }
      });
    }
    
    $(".purchase-order-list").append(details);

}

const purchase_orders = async function (test) {

  frappe.session.previous_action='purchase_orders';

  orders = [];
  let status = "";

  await frappe.call({
    method: "gch_purchases.services.get_po_pending_approval",
    callback: (res) => {
      console.log(res,"this one");
      orders = res.message;
      status = orders.length? orders[0].workflow_state : "";
    },
  });

  // frappe.realtime.on('purchase_order_queue_update', (data) =>{
  //   purchase_orders(test);
  // })

  let details = "";

  for (i = 0; i < orders.length; i++) {
    console.log(i);
    details += `
    <div class="level list-row" >
    <div class="list-row-col ellipsis list-subject level">
      <input class="level-item list-check-all hidden-xs" type="checkbox"
        title="Select">
      <span >${orders[i].transaction_date}</span>
    </div>
    <div class="list-row-col ellipsis list-subject hidden-xs  ">
        <span >
        <a href="/app/purchase-order/${orders[i].name}">${orders[i].name}</a></span>
    </div>
    <div class="list-row-col ellipsis list-subject hidden-xs">
        <span >        
        ${orders[i].supplier_name}
        </span>
    </div>
    <div class="list-row-col ellipsis hidden-xs  ">
        <span >${orders[i].branch ? orders[i].branch: "No Branch"}</span>
    </div>
    <div class="list-row-col ellipsis hidden-xs  ">
        <span >${orders[i].first_approval? "Done": "Pending"}</span>
    </div>
    <div class="list-row-col ellipsis hidden-xs  ">
        <span >${orders[i].level_2_approval? "Done": "Pending"}</span>
    </div>
    <div class="list-row-col ellipsis hidden-xs  ">
        <span >${orders[i].grand_total? orders[i].grand_total : 0}</span>
    </div>
    <div class="list-row-col ellipsis hidden-xs  ">
    </div>
    <div class="list-row-col ellipsis hidden-xs  ">
    </div>
</div>
</div>
    `;
  }

  test.status = status;
  test.orders = orders;
  test.page.main
    .html(frappe.render_template(frappe.templates.purchase_order_list, test))
    .html();
  $(".purchase-order-list").append(details);

  // test.purchase_orders = await renderPurchase_orders()
};

const requisition_orders = async function (test, my_requests = false) {

  frappe.session.previous_action='requisition_orders';

  reqs = [];
  let status = "All Clear Here!";

  if (my_requests) {
    await frappe.call({
      method: "gch_purchases.services.get_user_requisition_requests",
      args: {
        purpose: "Purchase",
      },
      callback: (res) => {
        console.log(res);
        reqs = res.message;
        status = "All my Requests";
      },
    });
  } else {
    await frappe.call({
      method: "gch_purchases.services.get_requisition_pending",
      args: {
        purpose: "Purchase",
      },
      callback: (res) => {
        console.log(res);
        reqs = res.message;
        status = "Pending branch requests";
      },
    });
  }

  details = "";

  for (i = 0; i < reqs.length; i++) {
    if(reqs[i].status == "Pending"){
      details += `
      <div class="level list-row" >
        <div class="list-row-col ellipsis list-subject level">
            <input class="level-item list-check-all hidden-xs" type="checkbox"
              title="Select">
            <span  class="level-item">${
              reqs[i].transaction_date
            }</span>
        </div>
        <div class="list-row-col ellipsis hidden-xs  ">
              <span >
              <a href="/app/material-request/${reqs[i].name}">${
            reqs[i].name
          }</a></span>
        </div>
        <div class="list-row-col ellipsis hidden-xs">
              <span >        
              ${reqs[i].set_warehouse}
              </span>
        </div>
        
        <div class="list-row-col ellipsis hidden-xs  ">
            <span >${reqs[i].owner}</span>
        </div>
        <div class="list-row-col ellipsis hidden-xs  ">
            <span >${reqs[i].status}</span>
        </div>
          <div class="list-row-col ellipsis hidden-xs  ">
              <span ><a href="/app/print/Material%20Request/${
                reqs[i].name
              }" class="btn btn-secondary"> print</a></span>
          </div>
        
      </div>
      `;
    }
    // 
    else if(reqs[i].status == "Partially Ordered"){
      details += `
      <div class="level list-row" style="background-color: #66FF99;">
        <div class="list-row-col ellipsis list-subject level">
            <input class="level-item list-check-all hidden-xs" type="checkbox"
              title="Select">
            <span  class="level-item">${
              reqs[i].transaction_date
            }</span>
        </div>
        <div class="list-row-col ellipsis hidden-xs  ">
              <span >
              <a href="/app/material-request/${reqs[i].name}">${
            reqs[i].name
          }</a></span>
        </div>
        <div class="list-row-col ellipsis hidden-xs">
              <span >        
              ${reqs[i].set_warehouse}
              </span>
        </div>
        
        <div class="list-row-col ellipsis hidden-xs  ">
            <span >${reqs[i].owner}</span>
        </div>
        <div class="list-row-col ellipsis hidden-xs  ">
            <span >${reqs[i].status}</span>
        </div>
          <div class="list-row-col ellipsis hidden-xs  ">
              <span ><a href="/app/print/Material%20Request/${
                reqs[i].name
              }" class="btn btn-secondary"> print</a></span>
          </div>
        
      </div>
      `;
    }
    else {
      details += `
      <div class="level list-row" style="background-color: #52CC7A;">
        <div class="list-row-col ellipsis list-subject level">
            <input class="level-item list-check-all hidden-xs" type="checkbox"
              title="Select">
            <span  class="level-item">${
              reqs[i].transaction_date
            }</span>
        </div>
        <div class="list-row-col ellipsis hidden-xs  ">
              <span >
              <a href="/app/material-request/${reqs[i].name}">${
            reqs[i].name
          }</a></span>
        </div>
        <div class="list-row-col ellipsis hidden-xs">
              <span >        
              ${reqs[i].set_warehouse}
              </span>
        </div>
        
        <div class="list-row-col ellipsis hidden-xs  ">
            <span >${reqs[i].owner}</span>
        </div>
        <div class="list-row-col ellipsis hidden-xs  ">
            <span >${reqs[i].status}</span>
        </div>
          <div class="list-row-col ellipsis hidden-xs  ">
              <span ><a href="/app/print/Material%20Request/${
                reqs[i].name
              }" class="btn btn-secondary"> print</a></span>
          </div>
        
      </div>
      `;
    }
    
  }

  test.status = status;
  test.reqs = reqs;
  test.page.main
    .html(frappe.render_template(frappe.templates.requisition_list, test))
    .html();
  $(".req-list").append(details);
};

const my_goods_transfer_requests = async function (test, my_action = false) {

  frappe.session.previous_action='my_goods_transfer_requests';

  reqs = [];
  let status =  "Pending Transfer Action";
  if(my_action){
    await frappe.call({
      method: "gch_purchases.services.get_my_goods_transfer_requests",
      args: {
        my_actions: true
      },
      callback: (res) => {
        console.log(res)
        reqs = res.message;
        status = "Pending My action";
      }
    });
  }
  else {
    await frappe.call({
      method: "gch_purchases.services.get_my_goods_transfer_requests",
      args: {},
      callback: (res) => {
        console.log(res)
        reqs = res.message;
        status = "My Pending Goods Transfer Requests";
      }
    });
  }

  details = "";

  for (i = 0; i < reqs.length; i++) {
    details += `
    <div class="level list-row" >
      <div class="list-row-col ellipsis list-subject level">
        <input id="${reqs[i].name}" class="level-item list-check-all hidden-xs"   type="checkbox"
        name="checkbox"
        title="Select">
        <span style="font-size: 12px;" ><a href="/app/stock-entry/${reqs[i].name}">${reqs[i].name}</a></span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
          <span style="font-size: 12px;">${reqs[i].from_warehouse}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
        <span style="font-size: 12px;">${reqs[i].status}</span>
      </div>
      <div class="list-row-col ellipsis hidden-xs  ">
        <span style="font-size: 12px;">${reqs[i].owner}</span>
      </div>
  </div>
    `
  }

  test.status = status;
  test.reqs = reqs;
  test.page.main
    .html(frappe.render_template(frappe.templates.goods_transfer , test))
    .html();
  $(".goods-transfer").append(details);
}

const available_in_other_warehouses = async function(test,other_warehouses) {
  reqs = [];
  let status = "";
  if(other_warehouses){
    await frappe.call({
      method: "gch_purchases.services.get_available_in_other_warehouses",
      args: {
        other_warehouses:"test"
      },
      callback: (res) => {
        console.log(res);
        reqs = res.message;
        status = "Available in other warehouses";
      }
    });
  } else {
    await frappe.call({
      method: "gch_purchases.services.get_available_in_other_warehouses",
      args: {
        other_warehouses:"testmine"
      },
      callback: (res) => {
        console.log(res);
        reqs = res.message;
        status = "Available in my warehouse";
      }
    });
  }

  details = "";
  
  console.log(status);

  if(status == "Available in my warehouse"){
    for (i = 0; i < reqs.length; i++) {
      details += `
        <div class="level list-row" >
          <div class="list-row-col ellipsis list-subject level">
            <input id="${reqs[i].name}" class="level-item list-check-all hidden-xs"   type="checkbox"
            name="checkbox"
            title="Select">
            <span style="font-size: 12px;" >${reqs[i].item_name}</span>
          </div>
          <div class="list-row-col ellipsis hidden-xs  ">
              <span style="font-size: 12px;">${reqs[i].remaining_quantity}</span>
          </div>
          <div class="list-row-col ellipsis hidden-xs  ">
            <span style="font-size: 12px;">${reqs[i].branch}</span>
          </div>
          <div class="list-row-col ellipsis hidden-xs  ">
            <span style="font-size: 12px;">${reqs[i].warehouse}</span>
          </div>
          <div class="list-row-col ellipsis hidden-xs  ">
            <span style="font-size: 12px;">${reqs[i].status}</span>
          </div>
        </div>
      `;
    }
  } else {
    for (i = 0; i < reqs.length; i++) {
      details += `
        <div class="level list-row" >
          <div class="list-row-col ellipsis list-subject level">
            <input id="${reqs[i].name}" class="level-item list-check-all hidden-xs" onchange="request_items(this)" type="checkbox"
            name="checkbox"
            title="Select">
            <span style="font-size: 12px;" >${reqs[i].item_name}</span>
          </div>
          <div class="list-row-col ellipsis hidden-xs  ">
              <span style="font-size: 12px;">${reqs[i].remaining_quantity}</span>
          </div>
          <div class="list-row-col ellipsis hidden-xs  ">
            <span style="font-size: 12px;">${reqs[i].branch}</span>
          </div>
          <div class="list-row-col ellipsis hidden-xs  ">
            <span style="font-size: 12px;">${reqs[i].warehouse}</span>
          </div>
          <div class="list-row-col ellipsis hidden-xs  ">
            <span style="font-size: 12px;">${reqs[i].status}</span>
          </div>
        </div>
      `;
    }
  }

  

  test.status = status;
  test.reqs = reqs;
  test.page.main
    .html(frappe.render_template(frappe.templates.goods_transfer_list, test))
    .html();
  $(".goods-transfer").append(details);
}

const goods_transfer_orders = async function (test,pending_my_action = false) {
  reqs = [];
  if(pending_my_action){
    await frappe.call({
      method: "gch_purchases.services.get_requisition_pending_my_action",
      args: {
        purpose: "Material Transfer",
      },
      callback: (res) => {
        console.log(res);
        reqs = res.message;
      },
    });
  } else {
    await frappe.call({
      method: "gch_purchases.services.get_requisition_pending",
      args: {
        purpose: "Material Transfer",
      },
      callback: (res) => {
        console.log(res);
        reqs = res.message;
      },
    });
  }
  

  details = "";

  for (i = 0; i < reqs.length; i++) {
    details += `
    <div class="level list-row" >
    <div class="list-row-col ellipsis list-subject level">
      <input class="level-item list-check-all hidden-xs" type="checkbox"
        title="Select">
      <span  class="level-item">${
        reqs[i].transaction_date
      }</span>
    </div>
    <div class="list-row-col ellipsis hidden-xs  ">
        <span >
        <a href="/app/purchase-order/${reqs[i].name}">${reqs[i].name}</a></span>
    </div>
    <div class="list-row-col ellipsis hidden-xs">
        <span >        
        ${reqs[i].set_warehouse}
        </span>
    </div>
    <div class="list-row-col ellipsis hidden-xs  ">
        <span >${reqs[i].owner}</span>
    </div>
    <div class="list-row-col ellipsis hidden-xs  ">
        <span >${reqs[i].status}</span>
    </div>
    <div class="list-row-col ellipsis hidden-xs  ">
        <span ><a href="/app/print/Material%20Request/${
          reqs[i].name
        }" class="btn btn-secondary"> print</a></span>
    </div>
</div>
</div>
    `;
  }

  let status = "Goods Transfer Status";
  test.status = status;
  test.reqs = reqs;
  test.page.main
    .html(frappe.render_template(frappe.templates.goods_transfer_list, test))
    .html();
  $(".goods-transfer").append(details);
};
const goods_received_note = function () {
  window.location.href = "/app/purchase-receipt";
};
const bin_card = function () {
  window.location.href="/app/query-report/Stock%20Movements"
};
const create_new_material_request = function (field_element) {
  console.log(field_element, "Clicked Going to create new Material request");
  window.location.href = "/app/material-request/new-material-request-1";
};

const create_new_purchase_order = function (field_element) {
  console.log(field_element, "Clicked Going to create new Material request");
  window.location.href = "/app/purchase-order/new-purchase-order-1";
};

const declare_Stock_for_redistribution = function (field_element){
  window.location.href = "/app/stock-available-for-redistribution/new-stock-available-for-redistribution-1"
}

const test_button = function () {
  console.log("Button working");
};

frappe.pages["inventory-management"].on_page_load = function (wrapper) {
  new RequisitionList(wrapper);

  my_page = wrapper.page;

  let user_ = frappe.user;

  if (user_.has_role("GCH-Pharmacy")) {
    this.page.add_inner_button(
      "Create New Requisition Requests",
      () => create_new_material_request(this),
      "Requisition Requests"
    );
    this.page.add_inner_button(
      "Generate Requisition Request Drugs",
      () => generate_material_request(),
      "Requisition Requests"
    );
    this.page.add_inner_button(
      "Generate Requisition Request Dental",
      () => generate_material_request('dental'),
      "Requisition Requests"
    );
    this.page.add_inner_button(
      "Generate Requisition Request Non-Drugs",
      () => generate_material_request('non-drugs'),
      "Requisition Requests"
    );
    this.page.add_inner_button(
      "Pending Requisition Requests",
      () => requisition_orders(this, false),
      "Requisition Requests"
    );
    this.page.add_inner_button(
      "My Requisition Requests",
      () => requisition_orders(this, true),
      "Requisition Requests"
    );

    this.page.add_inner_button(
      "Orders to Be received",
      () => get_orders_to_be_received(this),
      "Purchase Orders"
    );
  }
  if (
    user_.has_role("GCH-Clinical Supplier Incharge") ||
    user_.has_role("GCH-Chief Pharmacist") ||
    user_.has_role("GCH-Surgical Manager") ||
    user_.has_role("GCH-Dental Manager")
  ) {
    this.page.add_inner_button(
      "Pending my Approval",
      () => purchase_orders(this),
      "Purchase Orders"
    );
    this.page.add_inner_button(
      "All Requests",
      () => all_purchase_orders_requests(this),
      "Purchase Orders"
    );
  }
  // if(user_.has_role("GCH-Clinical Supplier Incharge")){
  //   this.page.add_inner_button(
  //     "Generate Purchase Orders",
  //     () => generate_purchase_orders(),
  //     "Purchase Orders"
  //   );
  // }
  if (user_.has_role("GCH-Clinical Supplier Officer")) {
    this.page.add_inner_button(
      "Purchase Orders Pending Review",
      () => orders_pending_review(this),
      "Purchase Orders"
    );
    this.page.add_inner_button(
      "To Be sent to Supplier",
      () => all_purchase_orders(this,true),
      "Purchase Orders"
    );
    this.page.add_inner_button(
      "Create New Purchase Order",
      () => create_new_purchase_order(this),
      "Purchase Orders"
    );

    this.page.add_inner_button(
      "All Requests",
      () => all_purchase_orders_requests(this),
      "Purchase Orders"
    );
  }
  this.page.add_inner_button(
    "Stock available for redistribution",
    () => declare_Stock_for_redistribution(this),
    "Goods Transfer"
  );
  this.page.add_inner_button(
    "My Pending Requests",
    () => my_goods_transfer_requests(this),
    "Goods Transfer"
  );
  this.page.add_inner_button(
    "Pending My Action",
    () => my_goods_transfer_requests(this,true),
    "Goods Transfer"
  );

  this.page.add_inner_button(
    "Available in Other Warehouses",
    () => available_in_other_warehouses(this,true),
    "Goods Transfer"
  );
  this.page.add_inner_button(
    "Available in My Warehouse",
    () => available_in_other_warehouses(this,false),
    "Goods Transfer"
  );
  // this.page.add_inner_button("Goods Received Notes", () =>
  //   goods_received_note()
  // );
  this.page.add_inner_button("Bin Card", () => bin_card());

  // frappe.realtime.on('purchase_order_queue_update', (data) =>{
  //   refresh_purchase_orders(test,data,"status");
  // });
};

frappe.pages["inventory-management"].on_page_show = function (wrapper) {
  // console.log("doing something!!!");
  let previous_action = ''
  previous_action = frappe.session.previous_action
  if(previous_action == 'purchase_orders'){
    purchase_orders(this);
  }else if(previous_action == 'my_goods_transfer_requests'){
    my_goods_transfer_requests(this);
  }else if(previous_action == 'requisition_orders'){
    requisition_orders(this);
  }else if(previous_action == 'refresh_purchase_orders'){
    refresh_purchase_orders(this);
  }else if(previous_action == 'all_purchase_orders') {
    all_purchase_orders(this);
  }else if(previous_action== 'all_purchase_orders_requests'){
    all_purchase_orders_requests(this);
  }else if(previous_action == 'orders_pending_review'){
    orders_pending_review(this);
  }
}

RequisitionList = Class.extend({
  init: function (wrapper) {
    template_name = "inventory_management";
    this.page = frappe.ui.make_app_page({
      parent: wrapper,
      title: "Inventory Management",
      single_column: true,
    });
    generate = generate_material_request;
    

    this.make();
  },
  make: async function () {
    let user_ = frappe.user;
    this.user = user_;
    let initiated = true;
    this.initiated = initiated;
    this.pending_req_requests = 9;
    this.all_my_requests = 6;
    this.pending_my_action = 17;
    this.available_in_other_warehouses = 11;
    this.available_in_my_warehouse = 5;
    this.to_be_received = 3;
    this.pending_my_approval = 5;
    this.pending_review = 2;
    this.to_be_sent_to_supplier = 1;

    
    this.page.main
      .html(
        frappe.render_template(
          frappe.templates.inventory_management_landing,
          this
        )
      )
      .html();
  },
});

// window.purchase_orders = purchase_orders;
// window.test_button = test_button;
