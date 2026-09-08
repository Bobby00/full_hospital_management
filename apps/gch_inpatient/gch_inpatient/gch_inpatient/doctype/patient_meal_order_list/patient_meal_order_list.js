// Copyright (c) 2023, Redward and contributors
// For license information, please see license.txt

frappe.ui.form.on('Patient Meal Order List', {
	refresh: function(frm) {

        frm.set_query("menu_option", function(doc) {
            
            return {
                // query: "gch_custom.services.rest.only_show_generic_name",
                filters: {
                    'menu': cur_frm.doc.select_menu,
                }
            };
        });

        frm.set_query("select_parent_menu_option", function(doc) {
            
            return {
                // query: "gch_custom.services.rest.only_show_generic_name",
                filters: {
                    'menu': cur_frm.doc.select_parent_menu,
                }
            };
        });

        


	},
    menu_option: () => {

        // Fetching Menu Option Items
        if (cur_frm.doc.menu_option) {

            frappe.call({
                method: "gch_inpatient.gch_inpatient.doctype.catering_meal_order.catering_meal_order.fetch_menu_option_items",
                args: {
                    "menu_option": cur_frm.doc.menu_option,
                    "menu": cur_frm.doc.select_menu
                },
                callback: (res) => {
                    console.log(res)
                    
                    if (res.message.catering_menu_option_items.length > 0) {

                        let menu_option_items = res.message.catering_menu_option_items

                        // Clear child table before populating
                        cur_frm.doc.catering_meal_order_details = []

                        menu_option_items.forEach(item => {
                            console.log(item)
                            
                            if (item.is_active == 1) {

                                // Populate Meal Order Details Table with preset Item details
                                let table_row = cur_frm.add_child("catering_meal_order_details") 
                                table_row.menu = cur_frm.doc.select_menu
                                table_row.menu_option = cur_frm.doc.menu_option
                                table_row.menu_item = item.catering_menu_item
                                table_row.qty = 1
                            }
                            
                            
                        });
                        
                        cur_frm.refresh_field("catering_meal_order_details")

                        frappe.show_alert({
                            message:__('Items pulled successfully'),
                            indicator:'green'
                        }, 5);

                    }
                    else {
                        // No Items in the selected menu option
                        frappe.msgprint({
                            title: __('Notification'),
                            indicator: 'red',
                            message: __('No Items found in the selected menu option')
                        });
                    }

                }
            })

        }

    },

    select_parent_menu_option: () => {

        // Fetching Menu Option Items
        if (cur_frm.doc.select_parent_menu_option) {

            frappe.call({
                method: "gch_inpatient.gch_inpatient.doctype.catering_meal_order.catering_meal_order.fetch_menu_option_items",
                args: {
                    "menu_option": cur_frm.doc.select_parent_menu_option,
                    "menu": cur_frm.doc.select_menu
                },
                callback: (res) => {
                    console.log(res)
                    
                    if (res.message.catering_menu_option_items.length > 0) {

                        let menu_option_items = res.message.catering_menu_option_items

                        // Clear child table before populating
                        cur_frm.doc.parent_catering_meal_order_details = []

                        menu_option_items.forEach(item => {
                            console.log(item)
                            
                            if (item.is_active == 1) {

                                // Populate Meal Order Details Table with preset Item details
                                let table_row = cur_frm.add_child("parent_catering_meal_order_details") 
                                table_row.menu = cur_frm.doc.select_parent_menu
                                table_row.menu_option = cur_frm.doc.select_parent_menu_option
                                table_row.menu_item = item.catering_menu_item
                                table_row.qty = 1
                            }
                            
                            
                        });
                        
                        cur_frm.refresh_field("parent_catering_meal_order_details")
                        
                        frappe.show_alert({
                            message:__('Items pulled successfully'),
                            indicator:'green'
                        }, 5);

                    }
                    else {
                        // No Items in the selected menu option
                        frappe.msgprint({
                            title: __('Notification'),
                            indicator: 'red',
                            message: __('No Items found in the selected menu option')
                        });
                    }

                }
            })

        }

    }

});
