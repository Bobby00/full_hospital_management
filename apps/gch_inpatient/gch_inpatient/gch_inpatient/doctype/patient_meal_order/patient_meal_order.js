// Copyright (c) 2024, Redward and contributors
// For license information, please see license.txt

frappe.ui.form.on('Patient Meal Order', {
    setup: function(frm) {
        // Loading Highlighted Menu
        frappe.require(
            "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
            () => {
            handleHighlightedMenu(cur_frm);
            }
        );
    },
	refresh: function(frm) {
        $('.prev-doc, .next-doc').hide();

        // Update status field with current workflow state
        cur_frm.set_value("status", cur_frm.doc.workflow_state)
        cur_frm.refresh_field("status")

        // Loading Highlighted Menu
        frappe.require(
            "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
            () => {
            handleHighlightedMenu(cur_frm);
            }
        );

        // frm.set_query("menu_option", function(doc) {
            
        //     return {
        //         // query: "gch_custom.services.rest.only_show_generic_name",
        //         filters: {
        //             'menu': cur_frm.doc.select_menu,
        //         }
        //     };
        // });

        // frm.set_query("select_parent_menu_option", function(doc) {
            
        //     return {
        //         // query: "gch_custom.services.rest.only_show_generic_name",
        //         filters: {
        //             'menu': cur_frm.doc.select_parent_menu,
        //         }
        //     };
        // });


        cur_frm.set_query("breakfast_drink_option", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_breakfast_drink_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });

        cur_frm.set_query("parent_breakfast_drink_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_breakfast_drink_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });




        cur_frm.set_query("breakfast_starch_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_breakfast_starch_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_breakfast_starch_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_breakfast_starch_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });



        cur_frm.set_query("breakfast_protein_options", function() {
            return {    
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_breakfast_protein_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_breakfast_protein_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_breakfast_protein_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });



        cur_frm.set_query("breakfast_side_piece_option", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_breakfast_side_piece_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_breakfast_side_piece_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_breakfast_side_piece_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });



        cur_frm.set_query("10_am_drink", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_10am_drink_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_10_am_drink", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_10am_drink_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });


        cur_frm.set_query("10_am_accompaniment", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_10am_accompaniment_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_10_am_accompaniment", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_10am_accompaniment_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });



        cur_frm.set_query("lunch_main_dish_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_lunch_main_dish_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_lunch_main_dish_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_lunch_main_dish_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });



        cur_frm.set_query("lunch_accompaniment_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_lunch_accompaniment_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_lunch_accompaniment_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_lunch_accompaniment_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });



        cur_frm.set_query("lunch_accompaniment_2_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_lunch_accompaniment_2_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_lunch_accompaniment_2_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_lunch_accompaniment_2_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });




        cur_frm.set_query("lunch_dessert_1", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_lunch_dessert_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_lunch_dessert_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_lunch_dessert_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });



        cur_frm.set_query("4pm_drink", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_4pm_drink_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_4pm_drink", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_4pm_drink_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });



        cur_frm.set_query("4pm_snack", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_4pm_snack_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_4pm_snack", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_4pm_snack_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });



        cur_frm.set_query("dinner_main_dish_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_dinner_main_dish_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_dinner_main_dish_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_dinner_main_dish_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });



        cur_frm.set_query("dinner_accompaniment_1_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_dinner_accompaniment_1_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_dinner_accompaniment_1_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_dinner_accompaniment_1_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });



        cur_frm.set_query("dinner_accompaniment_2_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_dinner_accompaniment_2_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_dinner_accompaniment_2_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_dinner_accompaniment_2_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });




        cur_frm.set_query("dinner_dessert_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_dinner_dessert_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_menu
                }
            }
        });
        cur_frm.set_query("parent_dinner_dessert_options", function() {
            return {
                query: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.filter_dinner_dessert_according_to_selected_menu",
                filters: {
                    "select_menu": cur_frm.doc.select_parent_menu
                }
            }
        });

        // cur_frm.set_value("meal_plan", "")
        // cur_frm.set_value("meal_plan_menu_details", "")

        // Fetch current active meal plan and send with meal order
        if (cur_frm.doc.inpatient_record && cur_frm.doc.meal_plan_menu_details.length < 1) {
            frappe.call({
                method: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.fetch_latest_active_meal_plan",
                args: {
                    "inpatient_record": cur_frm.doc.inpatient_record
                },
                callback: (res) => {
                    console.log(res)
                    
                    if (res.message) {
                        cur_frm.set_value("meal_plan", res.message.name)

                        if (res.message.meal_plan_menu_details.length > 0) {

                            for(let item in res.message.meal_plan_menu_details) {
                                let row = res.message.meal_plan_menu_details[item]
                                
                                let row_data = frm.get_field("meal_plan_menu_details").grid.add_new_row();

                                row_data.meal_type = row.meal_type
                                row_data.nutrients = row.nutrients
                                row_data.time = row.time
                                row_data.total_grams = row.total_grams
                                row_data.meal_options_list = row.meal_options_list
                                row_data.creation = row.creation
                                row_data.comment = row.comment
                                row_data.owner = row.owner
                            }

                            // cur_frm.refresh_field("meal_plan_menu_details")

                        }

                    }

                }
            })
        }
         


	},
    before_workflow_action: () => {
    
        console.log(cur_frm.doc.workflow_state)

    },
    after_workflow_action: () => {

        if(cur_frm.doc.workflow_state == 'Ordered') {

            let list_of_billable_meals = ""

            if(cur_frm.doc.parent_breakfast_drink_options || cur_frm.doc.parent_breakfast_starch_options || cur_frm.doc.parent_breakfast_protein_options || cur_frm.doc.parent_breakfast_side_piece_options) {
                list_of_billable_meals += "GCH-CC-0001,"
            }
            
            if (cur_frm.doc.parent_10_am_drink || cur_frm.doc.parent_10_am_accompaniment) {
                list_of_billable_meals += "GCH-CC-0002,"
            }
            
            if(cur_frm.doc.parent_lunch_main_dish_options || cur_frm.doc.parent_lunch_accompaniment_options || cur_frm.doc.parent_lunch_accompaniment_2_options || cur_frm.doc.parent_lunch_dessert_options) {
                list_of_billable_meals += "GCH-CC-0004,"
            }
            
            if(cur_frm.doc.parent_4pm_drink || cur_frm.doc.parent_4pm_snack) {
                list_of_billable_meals += "GCH-CC-0003,"
            }
            
            if(cur_frm.doc.parent_dinner_main_dish_options || cur_frm.doc.parent_dinner_accompaniment_1_options || cur_frm.doc.parent_dinner_accompaniment_1_options || cur_frm.doc.parent_dinner_dessert_options) {
                list_of_billable_meals += "GCH-CC-0005,"
            }


            // Fetching any extra item ordered

            if (cur_frm.doc.catering_meal_order_details.length > 0) {
                for (let item in cur_frm.doc.catering_meal_order_details) {
                    list_of_billable_meals += cur_frm.doc.catering_meal_order_details[item].item_code
                }
            }
        
            console.log(cur_frm.doc.workflow_state)
            // Check if next workflow state is Ordered to add invoice item
            // Handle BREAKFAST ITEM
            console.log(list_of_billable_meals, "BILLABLE")

        
            frappe.call({
                method: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.invoice_all_billable_order_items",
                args: {
                    encounter: cur_frm.doc.inpatient_record,
                    all_billable_meals: list_of_billable_meals
                },
                callback: (res) => {
                    console.log(res)
                }
            })

        }



    },

    menu_option: () => {

        // Fetching Menu Option Items
        // if (cur_frm.doc.menu_option) {

        //     frappe.call({
        //         method: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.fetch_menu_option_items",
        //         args: {
        //             "menu_option": cur_frm.doc.menu_option,
        //             "menu": cur_frm.doc.select_menu
        //         },
        //         callback: (res) => {
        //             console.log(res)
                    
        //             if (res.message.catering_menu_option_items.length > 0) {

        //                 let menu_option_items = res.message.catering_menu_option_items

        //                 // Clear child table before populating
        //                 cur_frm.doc.catering_meal_order_details = []

        //                 menu_option_items.forEach(item => {
        //                     console.log(item)
                            
        //                     if (item.is_active == 1) {

        //                         // Populate Meal Order Details Table with preset Item details
        //                         let table_row = cur_frm.add_child("catering_meal_order_details") 
        //                         table_row.menu = cur_frm.doc.select_menu
        //                         table_row.menu_option = cur_frm.doc.menu_option
        //                         table_row.menu_item = item.catering_menu_item
        //                         table_row.qty = 1
        //                     }
                            
                            
        //                 });
                        
        //                 cur_frm.refresh_field("catering_meal_order_details")

        //                 frappe.show_alert({
        //                     message:__('Items pulled successfully'),
        //                     indicator:'green'
        //                 }, 5);

        //             }
        //             else {
        //                 // No Items in the selected menu option
        //                 frappe.msgprint({
        //                     title: __('Notification'),
        //                     indicator: 'red',
        //                     message: __('No Items found in the selected menu option')
        //                 });
        //             }

        //         }
        //     })

        // }

    },

    select_parent_menu_option: () => {

        // Fetching Menu Option Items
        // if (cur_frm.doc.select_parent_menu_option) {

        //     frappe.call({
        //         method: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.fetch_menu_option_items",
        //         args: {
        //             "menu_option": cur_frm.doc.select_parent_menu_option,
        //             "menu": cur_frm.doc.select_menu
        //         },
        //         callback: (res) => {
        //             console.log(res)
                    
        //             if (res.message.catering_menu_option_items.length > 0) {

        //                 let menu_option_items = res.message.catering_menu_option_items

        //                 // Clear child table before populating
        //                 cur_frm.doc.parent_catering_meal_order_details = []

        //                 menu_option_items.forEach(item => {
        //                     console.log(item)
                            
        //                     if (item.is_active == 1) {

        //                         // Populate Meal Order Details Table with preset Item details
        //                         let table_row = cur_frm.add_child("parent_catering_meal_order_details") 
        //                         table_row.menu = cur_frm.doc.select_parent_menu
        //                         table_row.menu_option = cur_frm.doc.select_parent_menu_option
        //                         table_row.menu_item = item.catering_menu_item
        //                         table_row.qty = 1
        //                     }
                            
                            
        //                 });
                        
        //                 cur_frm.refresh_field("parent_catering_meal_order_details")
                        
        //                 frappe.show_alert({
        //                     message:__('Items pulled successfully'),
        //                     indicator:'green'
        //                 }, 5);

        //             }
        //             else {
        //                 // No Items in the selected menu option
        //                 frappe.msgprint({
        //                     title: __('Notification'),
        //                     indicator: 'red',
        //                     message: __('No Items found in the selected menu option')
        //                 });
        //             }

        //         }
        //     })

        // }

    }
});

frappe.ui.form.on('Catering Meal Order Details', {
    menu_item: (frm, cdt, cdn) => {
        var item = locals[cdt][cdn]
        // console.log(item)
        // Fetch Item price
        frappe.db.get_doc("Catering Menu Item", item.menu_item).then((res) => {
            console.log(res)

            frappe.db.get_value("Item Price", {"item_code": res.item, "price_list": "Standard Selling"}, ["price_list_rate"]).then( (res) => {
                console.log(res, "Item Price............")
                item.price = res.message.price_list_rate
            } )

        })

        cur_frm.refresh_field("catering_meal_order_details")

    }

})
