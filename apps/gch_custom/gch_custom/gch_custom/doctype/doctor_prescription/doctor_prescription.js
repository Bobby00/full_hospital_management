// Copyright (c) 2021, Karani and contributors
// For license information, please see license.txt
frappe.ui.form.on('Doctor Prescription', {
	refresh(frm) {
		// your code here

	},
	before_save(frm) {
		let selected = frm.get_selected()

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
					// frm.clear_table("standard_treatment_guidelines")

					encounter_diagnoses.forEach((encounter) => {
						let enc = frm.add_child("diagnosis", encounter)
					})
					frm.refresh_field('diagnosis')
					template_guidelines.forEach((guideline) => {
						// let gui = frm.add_child("standard_treatment_guidelines", guideline)
					})
					// frm.refresh_field("standard_treatment_guidelines")
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



})

