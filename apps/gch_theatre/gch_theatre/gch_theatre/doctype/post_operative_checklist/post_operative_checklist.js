// Copyright (c) 2024, eGerties Developers and contributors
// For license information, please see license.txt


const create_patient_assessment = async (frm) => {

	// Get patient details from inpatient record
	const inpatient_record = frm.doc.inpatient_record;
	let inpatient = {};
	console.log(inpatient_record);
	await frappe.call({
		method: 'gch_theatre.services.get_inpatient_doc',
		args: {
			inpatient_record: frm.doc.inpatient_record
		},
		callback: function (response) {
			if(response.message){
				inpatient = response.message;
			}
		},
	});


	frappe.route_options = {
		patient: inpatient.patient,
		inpatient_record: inpatient_record,
		theatre_overview: frm.doc.theatre_overview,
		is_inpatient: 1,
		assessment_template: frm.doc.patient_assessment,
		assessment_branch: inpatient.branch,
		weight: inpatient.weight_in_kilograms,
		height: inpatient.height_in_centimeters,
		temperature: inpatient.vital_signs_table[-1]?.temperature,
		bmi: inpatient.bmi,
		bsa: inpatient.bsa
	};
	frappe.new_doc("Patient Assessment");
};


const fetch_all_assessments = async (frm) => {
	let all_assessments = [];

	let inpatient_record = frm.doc.inpatient_record;
	let theatre_overview = frm.doc.theatre_overview;

	if(!theatre_overview || !inpatient_record){
		frappe.throw(__("Please select theatre overview and inpatient record"));
	}
	
	await frappe.call({
		method: 'gch_theatre.services.get_all_assessments',
		args: {
			theatre_overview: frm.doc.theatre_overview,
			inpatient_record: frm.doc.inpatient_record
		},
		callback: function (response) {
			if(response.message){
				let assessments = response.message;
				if(assessments.length > 0){

					for(let i = 0; i < assessments.length; i++){
						all_assessments.push(
							`
							<tr style="background-color: lightgreen">
								<td style = "white-space: nowrap;">
									<a style="color: blue" href="/app/patient-assessment/${assessments.name}">${assessments.name}</a>
								</td>
								<td style = "white-space: nowrap;">
									<p>${assessments.assessment_template? assessments.assessment_template: "Pending"}</p>
								</td>
								<td style = "white-space: nowrap;">
									<p>${assessments.assessment_time ? assessments.assessment_time: "Pending"}</p>
								</td>
								<td style = "white-space: nowrap;">
									<p>${assessments.owner? assessments.owner: "Pending"}</p>
								</td>
								<td style = "white-space: nowrap;">
									${assessments.action ? assessments.action: "Pending"}
								</td>
							<tr>
							`
						)
					}

					$(".completed_assessments").html(all_assessments);
				}
				
			}
		},
	});
}

frappe.ui.form.on('Post Operative Checklist', {
	refresh: function(frm) {
		// Fetch all assessments done on theatre overview.
		if(!frm.doc.__islocal){
			fetch_all_assessments(frm);
		}
	},

	// start assessment button
	start_assessment: function(frm) {
		create_patient_assessment(frm);
	}
});
