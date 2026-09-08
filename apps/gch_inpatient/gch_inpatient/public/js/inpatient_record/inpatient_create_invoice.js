const build_itemname_select_options = (items,select_value=0) => {
  let select_options = [];
  for(let index = 0; index < items.length; index++){
    item_option = items[index];
    let is_selected = item_option.name == select_value ? "selected" : undefined;
    select_options.push(
      `<option value="${item_option.item_code}" ${is_selected}>
        ${item_option.item_name}
      </option>`
    )
  }
  return select_options;
}


const add_items_to_bill = async(sales_invoice) => {
  let date_today = frappe.datetime.now_datetime();

  let d = new frappe.ui.Dialog({
    title: 'Add items to bill',
    fields: [
      {
        fieldtype: 'Table',
        fieldname: 'items_table',
        label: 'Items',
        fields: [
          {
            label: 'Item',
            fieldname: 'item',
            fieldtype: 'Link',
            options: 'Item',
            reqd: 1,
            in_list_view: 1
          },
          {
            label: 'Quantity',
            fieldname: 'qty',
            fieldtype: 'Int',
            reqd: 1,
            default: 1,
            in_list_view: 1
          },
          {
            label: 'Date',
            fieldname: 'date',
            fieldtype: 'Date',
            reqd: 1,
            in_list_view: 1
          },
          {
            label: 'Comment',
            fieldname: 'comment',
            fieldtype: 'Data',
            reqd: 1,
            in_list_view: 1
          }
        ],
        data: [],
        cannot_add_rows: false
      }      
    ],
    size: "extra-large",
    primary_action_label: 'Add Item',
    static: true,
    primary_action(){
      const itemsData = d.get_values().items_table;
      if (!itemsData || itemsData.length === 0) {
        frappe.throw("No items to add");
      }


      console.log(itemsData);  
      
      frappe.call({
        method: "gch_inpatient.services.add_to_bill",
        args: {
          item_list: itemsData,
          sales_invoice: sales_invoice
        },
        callback: (res) => {
          if(res.message){
            d.hide();
            frappe.show_alert({
              message: __("Items have been added to the bill. Click on Items in bill to see the list of items in the bill"),
              indicator: 'green'
            }, 6);
          }
        }
      });
      
    },
    secondary_action_label: 'Close',
    secondary_action() {
        d.hide();  // Close the dialog
    }
  })

  d.show()
}


const items_in_bill = async (sales_invoice) => {
  let items = [];
  let ROWS = [];
  let d = new frappe.ui.Dialog({
    title: 'Items in bill',
    fields: [
      {
        label: "Items", 
        fieldname: "html",
        fieldtype: "HTML"
      }
    ],
    primary_action_label: "Close",
    primary_action (){
      d.hide()
    }
  })

  await frappe.call({
    method: "gch_inpatient.services.items_in_bill",
    args: {
      sales_invoice: sales_invoice
    },
    callback: (res) => {
      if(res.message){
        items = res.message
      }
    }
  })

  items.forEach((item) => {
    ROWS.push(
      `
        <tr>
          <td scope="col">${item.item_name}</td>
          <td scope="col">${item.qty}</td>
          <td scope="col">${item.base_rate}</td>
          <td scope="col">${item.date_added}</td>
          <td scope="col-2">${item.billed_by}</td>
        </tr>
      `
    )
  })

  let htmlC = `
  <table id="confirm" class="table table-bordered table-hover" style="font-size: 12px;">
        <thead>
          <tr>
            <th scope="col" >Item</th>
            <th scope="col" >Quantity</th>
            <th scope="col">Rate</th>
            <th scope="col-2">Date</th>
            <th scope="col-2">Billed By</th>
          </tr>
        </thead>
        <tbody id="dynamic_prescription_table">
        `
        + ROWS +
        `
        </tbody>
  </table>
  `

  d.set_value('html',htmlC)
  d.show()
}



const handle_inpatient_create_invoice = async (cur_frm, multidisciplinary = false) => {

  

  if(multidisciplinary){

    let sales_invoice = ""
    inpatient_record = cur_frm.doc.inpatient_record;
    await frappe.call({
      method: "gch_inpatient.services.get_sales_invoice",
      args: {
        inpatient_record: inpatient_record
      },
      callback: (res) => {
        if(res.message){
          sales_invoice = res.message[0].name;
          console.log(sales_invoice,"sales_invoice");
        }
      }
    })

    if(sales_invoice){

      cur_frm.add_custom_button(__("Add Items to Bill"), 
      ()=>{
        const  url = `/app/billing/${sales_invoice}`;
        window.location.href = url
      },
        __("Billing")
      )

      cur_frm.add_custom_button(__("Items in Bill"), 
      ()=>items_in_bill(sales_invoice),
        __("Billing")
      )
    }
    
  }
  else{
    let sales_invoice = cur_frm.doc.sales_invoice
    if(sales_invoice){
      cur_frm.add_custom_button(__("Add Items to Bill"), 
      ()=>{
        const  url = `/app/billing/${sales_invoice}`;
        window.location.href = url
      },
        __("Billing")
      )
      
      cur_frm.add_custom_button(__("Items in Bill"), 
      ()=>items_in_bill(sales_invoice),
        __("Billing")
      )
    }else {
       cur_frm.add_custom_button(__("Create Invoice"), function (frm) {
        console.log("Create Invoice");
        frappe.show_alert(
          {
            message: __(
              `Please wait while we create the invoice for ${cur_frm.doc.name}`
            ),
            indicator: "green",
          },
          5
        );
        frappe.call({
          method:
            "gch_inpatient.services.inpatient_billing.invoice_inpatient_record_items",
          args: {
            inpatient_record: cur_frm.doc.name,
          },
          callback: (res) => {
            if (res.message.code == 200) {
              console.log(res.message.sales_invoice);
            }
            if (res.message.code == 201) {
              cur_frm.doc.sales_invoice = res.message.sales_invoice;
              // refresh field
              cur_frm.reload_doc();
            }
            frappe.show_alert(
              {
                message: __(res.message.message),
                indicator: "green",
              },
              5
            );
  
            console.log(res);
          },
        });
      });
    }
  }
  
  

 
};
