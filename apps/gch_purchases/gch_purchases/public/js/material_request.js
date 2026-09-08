const back_to_queue = (frm) => {    
    history.back();
}


frappe.ui.form.on("Material Request", {

    setup: async (frm) => {
        frm.set_df_property("material_request_type", "options", [
            { "value": "Material Transfer", "label": __("Goods Transfer") },
            { "value": "Purchase", "label": __("Purchase") },
            { "value": "Manufacture", "label": __("Manufacture") },
            { "value": "Customer Provided", "label": __("Customer Provided") }

        ])
        frm.refresh_field("material_request_type");

        let warehouse = ""
        let user_branch = ""
        
        if(frm.doc.docstatus == 0 && frm.doc.material_request_type == "Purchase" && !frm.doc.branch){
            // let branch_warehouse ="Goods In Transit - GCH"
            await frappe.call({
                method: "gch_purchases.services.get_branch_and_warehouse",
                callback: (res) => {
                    console.log(res.message)
                    warehouse = res.message.warehouse
                    user_branch = res.message.branch
                }
            });

            console.log("Document not saved!!!");

            var required_date =  frappe.datetime.get_today()
        
            frm.set_value("set_warehouse", warehouse);
            frm.refresh_field("set_warehouse");
            frm.set_value("warehouse", warehouse);
            frm.refresh_field("warehouse");
            frm.set_value("branch", user_branch);
            frm.refresh_field("branch");
            frm.set_value("schedule_date", required_date);
            frm.refresh_field("schedule_date");
        
            
        }        

        $('[data-label="Get%20Items%20From"]').find('[data-label="Sales%20Order"]').hide()

        frm.add_custom_button(
            "Back to Queue",
            () => {                
                history.back();
            }
        );

        

        // This code creates aditional options on the "get items from" button
        // frm.add_custom_button(__("Test of stuff"), () => {
        //     console.log("Get Items has been clicked")
        //     frappe.call({
        //         method: "gch_purchases.overrides.test",
        //         callback(res) {
        //             if(res.message) {
        //                 console.log("Hapa")
        //             }
        //         }
        //     })
        // }, __("Get Items From"))
        

    },


    onload: (frm) => {


        frm.set_df_property("material_request_type", "options", [
            { "value": "Material Transfer", "label": __("Goods Transfer") },
            { "value": "Purchase", "label": __("Purchase") },
            { "value": "Manufacture", "label": __("Manufacture") },
            { "value": "Customer Provided", "label": __("Customer Provided") }

        ])
        frm.refresh_field("material_request_type");

        frm.set_df_property("more_info", "hidden", true)
        frm.set_df_property("printing_details", "hidden", true)
        frm.set_df_property("terms_section_break", "hidden", true)
        frm.set_df_property("schedule_date", "hidden", true)
        frm.set_df_property("warehouse_section", "hidden", true)
        frm.set_df_property("submitted_at", "hidden", true)
        frm.set_df_property("material_request_type", "hidden", true)
        

        if(frm.doc.docstatus == 0 && !frm.doc.branch){
            let warehouse = ""
            let user_branch = ""
            frappe.call({ 
                method: "gch_purchases.services.get_branch_and_warehouse",
                callback: (res) => {
                    console.log(res.message, "Massage")
                    warehouse = res.message.warehouse
                    user_branch = res.message.branch
                }
            });
    
            var required_date =  frappe.datetime.get_today()
        
            frm.set_value("set_warehouse", warehouse);
            frm.refresh_field("set_warehouse");
            frm.set_value("warehouse", warehouse);
            frm.refresh_field("warehouse");
            frm.set_value("branch", user_branch);
            frm.refresh_field("branch");
            frm.set_value("schedule_date", required_date);
            frm.refresh_field("schedule_date");
        }

        $('.btn-open-row').hide();
        $('[data-label="Get%20Items%20From"]').find('[data-label="Sales%20Order"]').hide()

        if(frm.doc.material_request_type == "Material Transfer"){
            $('[data-label="Create"]').find('[data-label="Pick%20List"]').hide()
            $('[data-label="Stop"]').hide()

            frm.set_df_property("branch", "hidden", true)
            frm.set_df_property("warehouse", "hidden", true)
           
            // Stop console.log("Material Page!!!!!!!!! Ownrer",frm.doc.owner,"Current User",frappe.session.logged_in_user)

        }


        frm.fields_dict['items'].grid.get_field('edit').hidden = true;

        frm.add_custom_button(
            "Back to Queue",
            () => {                
                history.back();
            }
        );


    },
    // refresh code
    refresh: (frm) => {
        $('.btn-open-row').hide();
    },

    before_submit: (frm)=> {
        frm.set_value("submitted_by", frappe.session.user)
        frm.refresh_field("submitted_by")
        frm.set_value("submitted_at", frappe.datetime.now_datetime())
        frm.refresh_field("submitted_at")

        

        // Looop through all items and validate if item has been declared as excess in excess declarations.
        // var items = frm.doc.items
        // console.log(items);
        // return false
        // frappe.throw("Item A is available in warehouse b")
        // let excess_items = ""
        // let warehouse = ""

        // items.forEach(function(item) {
        //     let erraa = false
        //     frappe.call({
        //         method: "gch_purchases.services.validate_item_on_excess_stock",
        //         async: false,
        //         args: {
        //             item_code: item.item_code,
        //             quantity: item.qty
        //         },
        //         callback: (res) => {
        //             if(res.message){
        //                 // frappe.throw(__("Item is declared as excess"));
        //                 erraa = true;
        //                 excess_items=item.item_name
        //                 warehouse = res.message.warehouse
        //             }
        //         }
        //     })

        //     if(erraa){
        //         frappe.throw(__(`These items ${excess_items} are declared as excess  in ${warehouse}`));
        //         return false;
        //     }
        // });
       
       



    },

    on_submit(frm){

        if(frm.doc.material_request_type){
            frappe.call({
                method: "gch_purchases.services.create_purchase_order",
                args: {
                    "material_request": frm.doc.name,
                    "item_type": frm.doc.item_type_
                },
                callback: (res) => {
                    if(res.message){
                        console.log(res.message);
                    }
                }
            });
        }
        
    },

    validate: function(frm) {
        // Iterate through each row in the child table
        frm.doc.items.forEach(function(row) {
            // Perform validation checks on each row's fields
            if (row.qty % 1 !== 0 || row.qty <= 0) {
                frappe.msgprint(__('Quantity must be a Positive Whole number.'));
                frappe.validated = false;
                return;
            }
        });
    },

    material_request_type: (frm) =>{
        if(frm.doc.material_request_type == "Material Transfer"){
            frm.set_df_property("set_from_warehouse", "reqd", 1);
            frm.refresh_field("set_from_warehouse");
            frm.set_df_property("warehouse_section", "hidden", false);
            frm.refresh_field("warehouse_section");
        } else {
            frm.set_df_property("set_from_warehouse", "reqd", 0);
            frm.refresh_field("set_from_warehouse");
            frm.set_df_property("warehouse_section", "hidden", true);
            frm.refresh_field("warehouse_section");
        }
    },
});

frappe.ui.form.on('Material Request Item',  {
    item_code: async(frm, cdt, cdn) => {
        var child = locals[cdt][cdn];
        var item_code = child.item_code;


        var selected_supplier = "";
        var pack_size = 0;
        var rate = 0;
        var selling_unit_price = 0;
        let warehouse =  frm.doc.warehouse
        let current_stock = 0;

        await frappe.call({
            method: 'gch_purchases.services.get_item_defaults',
            args: {
                item_code: item_code,
                warehouse: warehouse
            },
            callback: (res) => {
                // console.log(res.message.item_defaults[0],"Response for defaults");
                pack_size = res.message.pack_size   
                defaults = res.message[0].item_defaults[0]
                current_stock = res.message[3]?.actual_qty
                console.log("Response for defaults",frm.doc.warehouse);
                if(defaults.default_supplier){
                    selected_supplier = defaults.default_supplier
                    pack_size = res.message[0].pack_size
                    rate = res.message[2]?.price_list_rate
                    selling_unit_price = res.message[1]?.price_list_rate
                } else {
                    console.log("NO supplier", res.message);
                    selected_supplier = "Main Stores"
                    pack_size = res.message[0].pack_size
                    rate = res.message[2]?.price_list_rate
                    selling_unit_price = res.message[1]?.price_list_rate

                    // frappe.throw("This Item Has no default supplier, Contact main stores for assistance.")
                }
                frappe.model.set_value(cdt, cdn, 'selected_supplier', selected_supplier);
                frappe.model.set_value(cdt, cdn, 'pack_size', pack_size);
                frappe.model.set_value(cdt, cdn, 'rate', rate);
                frappe.model.set_value(cdt, cdn, 'selling_unit_price', selling_unit_price);
                frappe.model.set_value(cdt, cdn, 'current_stock', current_stock);
            }
        })
        // Update the selected_supplier field in the child table
    }
})