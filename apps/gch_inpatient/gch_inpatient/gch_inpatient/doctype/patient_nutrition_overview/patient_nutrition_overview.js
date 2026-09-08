// Copyright (c) 2024, Redward and contributors
// For license information, please see license.txt

frappe.ui.form.on('Patient Nutrition Overview', {
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

        // Loading Highlighted Menu
        frappe.require(
            "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
            () => {
            handleHighlightedMenu(cur_frm);
            }
        );

        // update current meal plan
        // let lst = cur_frm.doc.nutrition_meal_plan_overview

        // let item = lst[lst.length -1]

        // cur_frm.set_value("current_meal_plan", item.)

        cur_frm.get_field('nutrition_meal_plan_overview').grid.cannot_add_rows = true;
        cur_frm.refresh_field("nutrition_meal_plan_overview")

        cur_frm.get_field('meal_order_summary_table').grid.cannot_add_rows = true;
        cur_frm.refresh_field("meal_order_summary_table")

        console.log("Refreshing............")

        if(cur_frm.doc.__islocal && cur_frm.doc.inpatient_record) {
             // Auto Pulling anthropometry information when a new record is created
            frappe.db.get_doc("Inpatient Record", cur_frm.doc.inpatient_record).then( (res) => {

                console.log(res.anthropometry_details, " Niceee")

                res.anthropometry_details.forEach(row => {
                    console.log(row)

                    let anthro_row = cur_frm.add_child("anthropometry_details")
                    anthro_row.bmi = row.bmi
                    anthro_row.bsa = row.bsa
                    anthro_row.head_circumference_in_centimeters = row.head_circumference_in_centimeters
                    anthro_row.height_for_age_percentile = row.height_for_age_percentile
                    anthro_row.height_in_centimeters = row.height_in_centimeters
                    anthro_row.muac = row.muac
                    anthro_row.weight_for_age_percentile = row.weight_for_age_percentile
                    anthro_row.weight_in_kilograms = row.weight_in_kilograms
                    anthro_row.bmi_for_age_percentile = row.bmi_for_age_percentile
                });

                cur_frm.refresh_field("anthropometry_details")

            })
        }
        


        // Fetching meal plans attached to this patient nutrition overview
        frappe.call({
            method:"gch_inpatient.gch_inpatient.doctype.patient_nutrition_overview.patient_nutrition_overview.fetch_linked_meal_plans",
            args: {
                "patient_nutrition_overview": cur_frm.doc.name
            },
            callback: (res) => {
                console.log(res, "Dictionary list of all linked meal plans")

                res.message.forEach( (row) => {
                    console.log(row, "here......")

                    let meal_plan_overview_row = cur_frm.add_child("nutrition_meal_plan_overview")
                    meal_plan_overview_row.meal_plan = row.name
                    meal_plan_overview_row.meal_plan_name = row.meal_plan_name
                    meal_plan_overview_row.date = row.date
                    meal_plan_overview_row.route = row.route
                    meal_plan_overview_row.proteins = row.proteins
                    meal_plan_overview_row.dietician = row.dietician
                    meal_plan_overview_row.is_active = row.is_active
                    meal_plan_overview_row.comment = row.comment
                })

                cur_frm.refresh_field("nutrition_meal_plan_overview")

            }
        })


        // Fetching Patient Meal Orders For current inpatient record
        frappe.call({
            method: "gch_inpatient.gch_inpatient.doctype.patient_nutrition_overview.patient_nutrition_overview.fetch_patient_meal_orders",
            args: {
                "inpatient_record": cur_frm.doc.inpatient_record
            },
            callback: (res) => {

                console.log(res, "Meal orders.....")

                res.message.forEach( (row) => {
                    let meal_order_row = cur_frm.add_child("meal_order_summary_table")
                    meal_order_row.ward = row.ward
                    meal_order_row.room = row.room
                    meal_order_row.bed = row.bed
                    meal_order_row.patient = row.patient
                    meal_order_row.date = row.date
                    meal_order_row.time = row.time
                    meal_order_row.select_menu = row.select_menu
                    meal_order_row.menu_option = row.menu_option
                    meal_order_row.test_order_status = row.workflow_state
                    meal_order_row.order_name = row.name
                    meal_order_row.ordered_by = row.ordered_by
                })

                cur_frm.refresh_field("meal_order_summary_table")

            }
        })


	},
    create_nutrition_meal_plan: (frm) => {

        frappe.route_options = {
            patient: frm.doc.patient,
            patient_nutrition_overview: cur_frm.doc.name,
            
        };
        frappe.new_doc("Patient Meal Plan");

    },

    create_meal_order: (frm) => {
        
        frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: cur_frm.doc.inpatient_record,
            
        };
        frappe.new_doc("Patient Meal Order");

    },

    before_save: (frm) => {

        // Clearing the Meal plan table to avoid duplication while refetching records on each refresh
        cur_frm.doc.nutrition_meal_plan_overview = ""
        cur_frm.refresh_field("nutrition_meal_plan_overview")

        // Clearing the Meal Order table to avoid duplication while refetching records on each refresh
        cur_frm.doc.meal_order_summary_table = ""
        cur_frm.refresh_field("meal_order_summary_table")

    }
});


frappe.ui.form.on("Patient Nutrition Diet Details", {
    diet_form: (frm, cdt, cdn) => {
        let row = locals[cdt][cdn];

        console.log(row)

        if(row.diet_form && row.diet_types) {

            // clearing the diet prescription field before entring data
            row.diet_prescription = ""

            row.diet_prescription = row.diet_form + " - " + row.diet_types

            console.log(frm.doc)
        }

        frm.refresh_field("diet_details_table")

    },
    diet_types: (frm, cdt, cdn) => {
        let row = locals[cdt][cdn];

        console.log(row)

        if(row.diet_form && row.diet_types) {

            // clearing the diet prescription field before entring data
            row.diet_prescription = ""

            row.diet_prescription = row.diet_form + " - " + row.diet_types

            console.log(frm.doc)

        }

        frm.refresh_field("diet_details_table")

    },
    nill_by_mouth: (frm, cdt, dcn) => {
        let row = locals[cdt][dcn];

        if(row.nill_by_mouth) {
            row.diet_prescription = "NILL BY MOUTH"

        } else {
            row.diet_prescription = ""
        }

        frm.refresh_field("diet_details_table")
    }

})
