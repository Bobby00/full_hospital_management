// Copyright (c) 2021, Karani and contributors
// For license information, please see license.txt

frappe.ui.form.on('Pharmacy Prescription', {
	refresh: function (frm) {
		// 
	},
	over_the_counter(frm){
		if(frm.doc.over_the_counter == 1){
			frm.set_value("patient_encounter", undefined)
			frm.refresh_field("patient_encounter")
			frm.refresh_field("patient")
			frm.clear_table("diagnosis")
			frm.refresh_field("diagnosis")

		}
	},
	patient_encounter(frm) {
		if (frm.doc.patient_encounter) {
			frappe.call({
				'type': 'POST',
				'url': `${window.location.origin}/api/method/gch_custom.services.query_encounter_diagnoses`,
				'args': {
					"encounter_number": frm.doc.patient_encounter
				},
				'callback': function (res) {
					let { encounter_diagnoses, template_guidelines, drug_allergies, food_allergies } = res.message
					frm.clear_table("diagnosis")
					frm.clear_table("standard_treatment_guidelines")
					encounter_diagnoses.forEach((encounter) => {
						let enc = frm.add_child("diagnosis", encounter)
					})
					frm.refresh_field('diagnosis')
				}
			})
		}
	}
});
