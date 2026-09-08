const route_to_bincard = () => {
  window.location.href = "/app/query-report/Bin%20Card"
}

const route_to_stock_status = () => {
  window.location.href = "app/query-report/Current%20Stock%20Status"
}

frappe.ui.form.on('Item',  {
    // INJECTING THE DRUG GROUP AND SUBGROUP SCRIPT FILTER
    item_group: (frm) => {
      console.log("load.... this is a change")
      frappe.require(
        "/assets/gch_custom/js/item/drug_item_group_filter.js",
        () => {
          // console.log("Logging this is a change")
          handle_drug_group_filter(frm);
        }
      )
    },
    short_name: function(frm) {
        let short_name = frm.doc.short_name;
        
        short_name = short_name.toUpperCase();
        
        let item_string = "GCH-" + short_name;
        
        if(item_string){
            frappe
              .call({
                method: "gch_custom.services.rest.generate_item_code",
                args: { item_string: item_string },
              })
          .done((r) => {
            cur_frm.set_value("item_code", r.message);
          })
          .fail((f) => {
            console.log(f);
          });
        }
    },
    onload: (frm)=> {
      frm.add_custom_button(
        "Bincard",()=> route_to_bincard(frm)
      )
      frm.add_custom_button(
        "Current Stock Status",()=> route_to_stock_status(frm)
      )
    },
    refresh: (frm)=> {
      frm.add_custom_button(
        "Bincard",()=> route_to_bincard(frm)
      )
      frm.add_custom_button(
        "Current Stock Status",()=> route_to_stock_status(frm)
      )
    }
});



frappe.ui.form.on("Item", "item_name", function (frm, cdt, cdn) {
    let item_name = frm.doc.item_name;
    cur_frm.set_value("display_name", item_name);
}),



// frappe.ui.form.on("Item", "generic_drug", function (frm, cdt, cdn) {
    
//     let selected_generic = frm.doc.generic_drug;
//     console.log("Running Here")

//     if(selected_generic){
//         frappe
//       .call({
//         method: "gch_custom.services.rest.get_generic_item_data",
//         args: { selected_generic_drug: frm.doc.generic_drug },
//       })
//       .done((r) => {
//           console.log(r);
//         cur_frm.set_value("classification", r.message.get_generic_item_data[0].classification);
//         cur_frm.set_value("sub_classification", r.message.get_generic_item_data[0].sub_classification);
        
//         frm.set_df_property("product_type", "options", r.message.get_drug_preparation);
//         frm.set_df_property("product_route", "options", r.message.get_drug_route);
        
//       })
//       .fail((f) => {
//         console.log(f);
//       });
//     }
// })


frappe.ui.form.on('Item', {
  // frm passed as the first parameter
  setup(frm) {
      // write setup code
      console.log('SETUPING')
      console.log(frm.doc.generic_drug)
      let selected_generic = frm.doc.generic_drug;
      console.log("Running Here")
  
      if(selected_generic){
          frappe
        .call({
          method: "gch_custom.services.rest.get_generic_item_data",
          args: { selected_generic_drug: frm.doc.generic_drug },
        })
        .done((r) => {
            console.log(r);
          cur_frm.set_value("classification", r.message.get_generic_item_data[0].classification);
          cur_frm.set_value("sub_classification", r.message.get_generic_item_data[0].sub_classification);
          
          frm.set_df_property("product_type", "options", r.message.get_drug_preparation);
          frm.set_df_property("product_route", "options", r.message.get_drug_route);
          
        })
        .fail((f) => {
          console.log(f);
        });
      }
  },
  refresh(frm) {
    console.log("REFRESH")
    console.log(frm.doc.generic_drug)
    let selected_generic = frm.doc.generic_drug;
    console.log("Running Here")

    if(selected_generic){
        frappe
      .call({
        method: "gch_custom.services.rest.get_generic_item_data",
        args: { selected_generic_drug: frm.doc.generic_drug },
      })
      .done((r) => {
          console.log(r);
        cur_frm.set_value("classification", r.message.get_generic_item_data[0].classification);
        cur_frm.set_value("sub_classification", r.message.get_generic_item_data[0].sub_classification);
        
        frm.set_df_property("product_type", "options", r.message.get_drug_preparation);
        frm.set_df_property("product_route", "options", r.message.get_drug_route);
        
      })
      .fail((f) => {
        console.log(f);
      });
    }

    // Show suppliers as names instead of codes
    frm.set_query("default_supplier", "item_defaults", function (doc,cdt,cdn){
      var item = locals[cdt][cdn];
      // console.log(item)
      return {
          query: "gch_custom.services.rest.only_show_supplier_name",
          // filters: {
          //     'item': item.item_code,
          // }
      };
    });

  },
  generic_drug(frm){
    let selected_generic = frm.doc.generic_drug;
    console.log("Running Here")

    if(selected_generic){
        frappe
      .call({
        method: "gch_custom.services.rest.get_generic_item_data",
        args: { selected_generic_drug: frm.doc.generic_drug },
      })
      .done((r) => {
          console.log(r);
        cur_frm.set_value("classification", r.message.get_generic_item_data[0].classification);
        cur_frm.set_value("sub_classification", r.message.get_generic_item_data[0].sub_classification);
        
        frm.set_df_property("product_type", "options", r.message.get_drug_preparation);
        frm.set_df_property("product_route", "options", r.message.get_drug_route);
        
      })
      .fail((f) => {
        console.log(f);
      });
    }
  }


  
})