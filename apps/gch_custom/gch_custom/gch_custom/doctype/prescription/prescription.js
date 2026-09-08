// Copyright (c) 2021, Karani and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Prescription", {
// 	onload: (frm) => {
// 		for (let field of frm.fields) {
// 			if (field.has_input || !["Section Break", "Column Break"].indexOf(field.df.fieldtype)) {
// 				frm.set_df_property(field.df.fieldname, "read_only", true);
// 			} else {
// 				frm.set_df_property(field.df.fieldname, "hidden", true);
// 			}
// 		}
// 	}
// })

// var tbl = doc.child_table || [];
// var i = tbl.length;
// while (i--)
// {
//     if(tbl[i].field_name == '')
//     {
//         cur_frm.get_field("child_table").grid.grid_rows[i].remove();
//     }
// }
// cur_frm.refresh();

// frappe.ui.form.on('Table Doctype Name', {
// 	link_fieldname: function(frm,cdt, cdn){
// 		var row = locals[cdt][cdn]
// 		frappe.call({
// 			method: "ims.ims.doctype.fe_settings.fe_settings.get_employee_details",
// 			args: {"instructor_id": row.idx},
// 			async: false,
// 			callback: function(r) {
// 				//do your operations here
// 			}
// 		})
// 	}
// })

// refillable: (frm, cdt, cdn) => {
// 	console.log(frm.__dashboard.frm.selected_doc)
// 	var section = frm.__dashboard.frm.selected_doc

// 	console.log(cur_dialog)
// 	var row = locals[cdt][cdn]
// 	console.log(row.refillable)
// 	var df = frappe.meta.get_docfield("Doctor Prescription Table","refill_section", frm.doc.name);

// 	if (row.refillable == 1){
// 		console.log("Refillable drug")
// 		df.hidden = 0

// 		// row.set_df_property("refill_section", "hidden", 1);
// 		// frm.refresh_fields()

// 	}
// 	else{
// 		console.log("else running")
// 		df.hidden = 1
// 	}
// },

function render_refill_dialog(data) {
	let d = new frappe.ui.Dialog({
		title: `Refill Details for Prescription ${data.parent}`,
		fields: [
			{
				label: 'Medication',
				fieldname: 'medication',
				fieldtype: 'Read Only',
				default: `${data.medication}`,
			},
			{
				label: 'Refill Type',
				fieldname: 'refill_type',
				fieldtype: 'Select',
				options: ['Periodic Refill', 'Alternate Refill'],
			},
			{
				label: '',
				fieldname: 'break',
				fieldtype: 'Column Break'
			},
			{
				label: 'Brand',
				fieldname: 'brand',
				fieldtype: 'Read Only',
				default: `${data.medication}`,
				readonly: true
			},
			{
				label: 'Period Type',
				fieldname: 'period_type',
				fieldtype: 'Select',
				options: ['Weekly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly'],
			},
			// {
			// 	label: 'Refill On',
			// 	fieldname: 'refill_on',
			// 	fieldtype: 'Table',
			// 	options: 'Prescription Refill Entry'
			// }
		],
		primary_action_label: 'Save Refill',
		primary_action(values) {
			console.log(values);
			frappe.show_alert({
				message: __('Refill submitted successfully'),
				indicator: 'green'
			}, 5);
			d.hide();
		}
	});

	d.show();
}


frappe.ui.form.on('Dynamic Link', { // The child table is defined in a DoctType called "Dynamic Link"
    links_add(frm, cdt, cdn) { // "links" is the name of the table field in ToDo, "_add" is the event
        // frm: current ToDo form
        // cdt: child DocType 'Dynamic Link'
        // cdn: child docname (something like 'a6dfk76')
        // cdt and cdn are useful for identifying which row triggered this event

        frappe.msgprint('A row has been added to the links table 🎉 ');
    }
});


frappe.ui.form.on('Doctor Prescription Table', {
	form_render: function(frm, cdt, cdn) {
		console.log("form_render")
		console.log(frm.selected_doc)

		
	},
	refresh: function (frm, cdt, cdn) {
		console.log("Refreshed here")
		frm.add_custom_button(__('Get User Email Address'), function () {
			frappe.msgprint(frm.doc.email);
		}, __("Utilities"));
	},
	on_load: function (frm, cdt, cdn) {
		console.log(frm.selected_doc)
		


	},
	dont_issue: (frm, cdt, cdn) => {
		var row = locals[cdt][cdn]
		console.log(row.dont_issue)
		if (frm.selected_doc.dont_issue == 1) {
			console.log("dont issue")
			row.set_df_property("dont_issue_reason", "hidden", 0)
			frm.refresh_fields()
		}
		else {
			console.log("issue")
			row.set_df_property("dont_issue_reason", "hidden", 1)
			frm.refresh_fields()

		}
	},

	// refillable: (frm, cdt, cdn) => {
	// 	var row = locals[cdt][cdn]
	// 	// console.log(frm.fields_dict)
	// 	console.log(cdn)
	// 	console.log(cdt)
	// 	frm.toggle_display(['refill_section'], row.refillable == 1);
	// 	// console.log(cur_dialog)
	// 	var df = frappe.meta.get_docfield("Doctor Prescription Table", "refill_section", frm.selected_doc.name);
	// 	console.log(df)
	// 	if (row.refillable == 1) {
	// 		console.log("Refillable drug")
	// 		df.hidden = 0
	// 		// df.toggle_display()

	// 		// row.set_df_property("refill_section", "hidden", 1);
	// 		// frm.refresh_fields()

	// 	}
	// 	else {
	// 		console.log("else running")
	// 		df.hidden = 1
	// 	}
	// 	refresh_field("refill_section");
	// },
	// before_load:function(frm) {
	// 	var df=frappe.meta.get_docfield("Doctor Prescription Table", "",frm.doc.name);
	// 	df.hidden=1;
	// 	frm.refresh_fields();
	// 	}
	// refill: function(frm, cdt, cdn) {
	// 	console.log(cdt)
	// 	console.log(cdn)
	// 	var row = locals[cdt][cdn]
	// 	console.log(row)
	// 	if(row.refill == "Yes"){
	// 		render_refill_dialog(row)
	// 	}

	// }

})

frappe.ui.form.on('Prescription', {
	onload: (frm) => {
		frm.fields_dict["prescriptions"].grid.get_field(
			"medication"
		).get_query = function (doc, cdt, cdn) {
			var child = locals[cdt][cdn];
			//console.log(child);

			return {
				filters: [["item_group", "in", ["Drug"]]],
			};
		};

		if (frm.doc.over_the_counter == 1) {
			frm.set_df_property("dont_issue", "hidden", true)
		}
		if (frappe.user.has_role("GCH-Doctor")) {
			frm.set_df_property("diagnosis_section", "hidden", false);
			frm.set_df_property("gertrudes_standard_treatment_guidelines_med_doses_section", "hidden", false)
		}
		if (frappe.user.has_role("GCH-Pharmacy")) {
			frm.set_df_property("prescription_section", "hidden", false)
			frm.set_df_property("prescription_information", "hidden", false)
			frm.set_df_property("prescription_info_section", "hidden", false)

		}
		if (frm.is_new()) {
			frm.set_df_property("prescription_info_section", "hidden", true)
			if (frappe.user.has_role("GCH-Pharmacy")) {
				frm.set_df_property("over_the_counter", "hidden", false)
			}
		}
	},
	over_the_counter: (frm) => {
		if (frm.doc.over_the_counter == 1) {
			frm.set_value("patient_encounter", undefined)
			frm.refresh_field("patient_encounter")
			frm.refresh_field("patient")
			frm.clear_table("diagnosis")
			frm.refresh_field("diagnosis")
			frm.set_df_property("diagnosis_section", "hidden", false);
		}
	},

	prescriptions: (frm, cdt, cd) => {
		console.log(cdt)
		console.log(cd)
		var row = locals[cdt][cd];
		console.log(row)
	},
	refresh: (frm) => {
		if (frm.doc.over_the_counter == 1) {
			frm.set_df_property("dont_issue", "hidden", true)
		}
	},
	before_save: (frm) => {
		let selected = frm.get_selected()
	},

	
	patient_encounter: (frm) => {
		if (frm.doc.patient_encounter) {
			frappe.call({
				'type': 'POST',
				'url': `${window.location.origin}/api/method/gch_custom.services.query_encounter_diagnoses`,
				'args': {
					"encounter_number": frm.doc.patient_encounter
				},
				'callback': function (res) {
					// frm.set_value()
					let {
						encounter_diagnoses,
						template_guidelines,
						drug_allergies,
						food_allergies,
						patient_info,
						allergy_info
					} = res.message
					frm.clear_table("diagnosis")
					frm.clear_table("standard_treatment_guidelines")
					encounter_diagnoses.forEach((encounter) => {
						let enc = frm.add_child("diagnosis", encounter)
					})
					frm.refresh_field('diagnosis')
					template_guidelines.forEach((guideline) => {
						let gui = frm.add_child("standard_treatment_guidelines", guideline)
					})
					frm.refresh_field("standard_treatment_guidelines")
					// food_allergies.forEach((allergy) => {
					// 	let f_allergy = frm.add_child("food_allergy", allergy)
					// })
					// frm.set_value("patient_drug_allergies", drug_allergies).then(() =>{
					// 	console.log(frm.doc.drug_allergy)
					// })

					// frm.
					// frm.refresh_field("patient_drug_allergies")
					// frm.set_value("drug_allergy", drug_allergies)
					frm.set_value("patient_gender", patient_info.sex)
					frm.set_value("patient_date_of_birth", patient_info.dob)
					frm.set_value("has_food_allergy", !(allergy_info.has_no_food_allergy))
					// frm.reload_doc()
				}
			})
		}
	},

});
