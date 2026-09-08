// Copyright (c) 2024, eGerties Developers and contributors
// For license information, please see license.txt

frappe.ui.form.on('Theatre Nursing Checklist', {
	refresh: function(frm) {


		// Tsheet
		frm.add_custom_button(__("Treatment Sheet"), function () {
			const url = `/app/treatment-sheet/${frm.doc.inpatient_record}`;
			window.location.href = url;
		});
		
		// Handsoff Tool
		frm.add_custom_button(
			__("NURSING HANDSOFF TOOL"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
			};
			frappe.new_doc("Nursing Handsoff Tool");
			},
			__("NURSING TOOLS")
		);

		// OPD FALLS RISK ASSESSMENT
		frm.add_custom_button(
			__("OPD FALLS RISK ASSESSMENT TOOL"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				assessment_template: "OutPatient Falls Risk Assessment",

				assessment_branch: cur_frm.doc.branch,
				weight: last_anthro_array.weight_in_kilograms,
				height: last_anthro_array.height_in_centimeters,
				temperature: last_vitals_array.patient_encounter_temperature,
				bmi: last_anthro_array.bmi,
				bsa: last_anthro_array.bsa
				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("Patient Assessment");
			},
			__("NURSING TOOLS")
		);
		
		// input output chart
		frm.add_custom_button(
			__("PATIENT NUTRITION OVERVIEW"),
			function () {
			// Check if a nutrition overview

				frappe.db.get_value('Patient Nutrition Overview', {"inpatient_record":cur_frm.doc.name}, ["name"]).then( (res) => {
					console.log(res, "  Nutrition Overview Name.............")

					if(res.message.name ) {
						
						window.location.href = "/app/patient-nutrition-overview/"+ res.message.name

					} else {

						frappe.route_options = {
							patient: frm.doc.patient,
							inpatient_record: frm.doc.name,
							anthropometry_details: frm.doc.anthropometry_details
				
						
						};
						frappe.new_doc("Patient Nutrition Overview");

					}

				})
				


			},
			__("Examinations")
		);

		// input output chart
		frm.add_custom_button(
			__("INPUT OUTPUT CHART"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,

				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("Nursing Input Output Chart");
			},
			__("Examinations")
		);
		// input head to toe
		frm.add_custom_button(
			__("HEAD TO TOE ASSESSMENT"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,

				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("Head to Toe Examination");
			},
			__("Examinations")
		);

		// INPATIENT FALLS RISK ASSESSMENT
		frm.add_custom_button(
			__("INPATIENT FALLS RISK ASSESSMENT TOOL"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				assessment_template: "InPatient Falls Risk Assessment",
				assessment_branch: cur_frm.doc.branch,
				weight: last_anthro_array.weight_in_kilograms,
				height: last_anthro_array.height_in_centimeters,
				temperature: last_vitals_array.patient_encounter_temperature,
				bmi: last_anthro_array.bmi,
				bsa: last_anthro_array.bsa
			};
			frappe.new_doc("Patient Assessment");
			},
			__("NURSING TOOLS")
		);

		// FLACC Pain Management tool
		frm.add_custom_button(
			__("PAIN ASSESSMENT TOOL - FLACC"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				assessment_template: "Pain Assessment - FLACC",
				assessment_branch: cur_frm.doc.branch,
				weight: last_anthro_array.weight_in_kilograms,
				height: last_anthro_array.height_in_centimeters,
				temperature: last_vitals_array.patient_encounter_temperature,
				bmi: last_anthro_array.bmi,
				bsa: last_anthro_array.bsa
				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("Patient Assessment");
			},
			__("NURSING TOOLS")
		);

		// NEONATAL PAIN ASSESSMENT
		frm.add_custom_button(
			__("PAIN ASSESSMENT TOOL - NEONATAL"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				assessment_template: "Pain Assessment - Neonatal",
				assessment_branch: cur_frm.doc.branch,
				weight: last_anthro_array.weight_in_kilograms,
				height: last_anthro_array.height_in_centimeters,
				temperature: last_vitals_array.patient_encounter_temperature,
				bmi: last_anthro_array.bmi,
				bsa: last_anthro_array.bsa
				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("Patient Assessment");
			},
			__("NURSING TOOLS")
		);

		// WONG BAKER PAIN ASSESSMENT
		frm.add_custom_button(
			__("PAIN ASSESSMENT TOOL - WONG BAKER FACES"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				assessment_template: "Pain Assessment - Wong Baker Face",
				assessment_branch: cur_frm.doc.branch,
				weight: last_anthro_array.weight_in_kilograms,
				height: last_anthro_array.height_in_centimeters,
				temperature: last_vitals_array.patient_encounter_temperature,
				bmi: last_anthro_array.bmi,
				bsa: last_anthro_array.bsa
				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("Patient Assessment");
			},
			__("NURSING TOOLS")
		);

		// Numeric scale pain assessment
		frm.add_custom_button(
			__("PAIN ASSESSMENT TOOL - NUMERIC SCALE"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				assessment_template: "Pain Assessment - Numeric Scale",
				assessment_branch: cur_frm.doc.branch,
				weight: last_anthro_array.weight_in_kilograms,
				height: last_anthro_array.height_in_centimeters,
				temperature: last_vitals_array.patient_encounter_temperature,
				bmi: last_anthro_array.bmi,
				bsa: last_anthro_array.bsa
				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("Patient Assessment");
			},
			__("NURSING TOOLS")
		);

		// PEADEATRIC EARLY WARNING
		frm.add_custom_button(
			__("PAEDIATRIC EARLY WARNING SIGNS CHART"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				assessment_template: "Paedriatic Early Warning",
				assessment_branch: cur_frm.doc.branch,
				weight: last_anthro_array.weight_in_kilograms,
				height: last_anthro_array.height_in_centimeters,
				temperature: last_vitals_array.patient_encounter_temperature,
				bmi: last_anthro_array.bmi,
				bsa: last_anthro_array.bsa
				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("Patient Assessment");
			},
			__("NURSING TOOLS")
		);

		// Cauti prevention checklist
		frm.add_custom_button(
			__("CAUTI PREVENTION CHECKLIST"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				checklist_template:
				"GCH-NCT-10898 : Urinary catheter care bundle (CAUTI)",
				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("Nursing Checklist");
			},
			__("NURSING TOOLS")
		);

		// Central line insertion checklist
		frm.add_custom_button(
			__("CENTRAL LINE INSERTION CHECKLIST"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				wardroombed:
				frm.doc.ward_station +
				"/" +
				frm.doc.room_no +
				"/" +
				frm.doc.bed_number,
				consulting_doctor: frm.doc.primary_practitioner,

				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("CENTRAL LINE INSERTION CHECKLIST");
			},
			__("NURSING TOOLS")
		);

		// Central Line maintanance bundle checklist
		frm.add_custom_button(
			__("CENTRAL LINE MAINTENANCE BUNDLE CHECKLIST"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				wardroombed:
				frm.doc.ward_station +
				"/" +
				frm.doc.room_no +
				"/" +
				frm.doc.bed_number,
				consulting_doctor: frm.doc.primary_practitioner,
				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("Central Line Maintenance Bundle Checklist");
			},
			__("NURSING TOOLS")
		);

		// SSI prevenetion Checklist
		frm.add_custom_button(
			__("SSI PREVENTION CHECKLIST"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				wardroombed:
				frm.doc.ward_station +
				"/" +
				frm.doc.room_no +
				"/" +
				frm.doc.bed_number,
				consulting_doctor: frm.doc.primary_practitioner,
				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("SSI PREVENTION CHECKLIST");
			},
			__("NURSING TOOLS")
		);

		// Ventilator bundle
		frm.add_custom_button(
			__("VENTILLATOR BUNDLE CHECKLIST"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				wardroombed:
				frm.doc.ward_station +
				"/" +
				frm.doc.room_no +
				"/" +
				frm.doc.bed_number,
				consulting_doctor: frm.doc.primary_practitioner,
			};
			frappe.new_doc("VENTILATOR BUNDLE CHECKLIST");
			},
			__("NURSING TOOLS")
		);

		// Pre-procedure and timeout checklist for thratre surgical procedures
		frm.add_custom_button(
			__(
			"PRE-PROCEDURE AND TIMEOUT CHECKLIST FOR OUT OF THEATRE SURGICAL PROCEDURES"
			),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				wardroombed:
				frm.doc.ward_station +
				"/" +
				frm.doc.room_no +
				"/" +
				frm.doc.bed_number,
				consulting_doctor: frm.doc.primary_practitioner,
			};
			frappe.new_doc("Pre Procedure Checklist");
			},
			__("NURSING TOOLS")
		);

		// PERIPHERAL VENOUS CATHETER INSERTION CHECKLIST
		frm.add_custom_button(
			__("PERIPHERAL VENOUS CATHETER INSERTION CHECKLIST"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				wardroombed:
				frm.doc.ward_station +
				"/" +
				frm.doc.room_no +
				"/" +
				frm.doc.bed_number,
				consulting_doctor: frm.doc.primary_practitioner,
			};
			frappe.new_doc("PERIPHERAL VENOUS CATHETER INSERTION CHECKLIST");
			},
			__("NURSING TOOLS")
		);

		// PERIPHERAL VENOUS CATHETER CARE BUNDLE CHECKLIST
		frm.add_custom_button(
			__("PERIPHERAL VENOUS CATHETER CARE BUNDLE CHECKLIST"),
			function () {
			// CONFIRM ON EXISTANCE OF TEMPLATE BUNDLE DATA
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				wardroombed:
				frm.doc.ward_station +
				"/" +
				frm.doc.room_no +
				"/" +
				frm.doc.bed_number,
				consulting_doctor: frm.doc.primary_practitioner,
			};
			frappe.new_doc("PERIPHERAL VENOUS CATHETER CARE BUNDLE");
			},
			__("NURSING TOOLS")
		);

		// NUTRITION SCREENING
		frm.add_custom_button(
			__("NUTRITION SCREENING"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				is_inpatient: 1,
				wardroombed:
				frm.doc.ward_station +
				"/" +
				frm.doc.room_no +
				"/" +
				frm.doc.bed_number,
				consulting_doctor: frm.doc.primary_practitioner,

				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("NUTRITION SCREENING TOOL");
			},
			__("NURSING TOOLS")
		);

		// Neurological observation chart
		frm.add_custom_button(
			__("NEUROLOGICAL OBSERVATION CHART"),
			function () {
			frappe.route_options = {
				patient: frm.doc.patient,
				inpatient_record: frm.doc.name,
				wardroombed:
				frm.doc.ward_station +
				"/" +
				frm.doc.room_no +
				"/" +
				frm.doc.bed_number,
				consulting_doctor: frm.doc.primary_practitioner,

				// assessment_branch: frm.doc.branch,
			};
			frappe.new_doc("NEUROLOGICAL OBSERVATION CHART");
			},
			__("NURSING TOOLS")
		);

	}
});
