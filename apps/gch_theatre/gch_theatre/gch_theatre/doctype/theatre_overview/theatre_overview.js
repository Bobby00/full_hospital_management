// Copyright (c) 2024, eGerties Developers and contributors
// For license information, please see license.txt


let anaesthesia_name = "";
let surgeon_doc = "";
let nursing_doc = "";
let pre_anaesthesia = "";
let pre_induction = "";
let anaesthesia_record = "";
let preop = "";
let intraop_doc = ""; 
let postop_doc = "";


const get_preop_checklist = async(theatre_overview) => {
	let item_array = [];
	await frappe.call({
		method: "gch_theatre.gch_theatre.doctype.theatre_overview.theatre_overview.fetch_preop_checklist",
		args: {
			"theatre_overview": theatre_overview
		},
		callback: (res) => {
			if(res.message){
				let assess = res.message;

				preop = assess.name
			}else {
				console.log(res.message);
			}
		}
	})
}

const get_post_op_checklist = async(theatre_overview) => {
	let item_array = [];

	await frappe.call(({
		method: "gch_theatre.gch_theatre.doctype.theatre_overview.theatre_overview.fetch_post_op_checklist",
		args: {
			"theatre_overview": theatre_overview
		},
		callback: (res)=> {
			if(res.message){
				let assess = res.message;
				postop_doc = assess.name;

				item_array.push(
					`
					<tr style="background-color: lightgreen">
						<td style = "white-space: nowrap;">
							<a style="color: blue" href="/app/post-operative-checklist/${assess.name}">${assess.name}</a>
						</td>
						<td style = "white-space: nowrap;">
							<p>${assess.spo2_monitoring? assess.spo2_monitoring: "Pending"}</p>
						</td>
						<td style = "white-space: nowrap;">
							<p>${assess.analgesia? assess.analgesia: "Pending"}</p>
						</td>
						<td style = "white-space: nowrap;">
							<p>${assess.spec_instructions? assess.spec_instructions:"Pending"}</p>
						</td>
						<td style = "white-space: nowrap;">
							${assess.nurse_led_discharge ? assess.nurse_led_discharge: "Pending"}
						</td>
						<td style = "white-space: nowrap;">
							${assess.time_arrived ? assess.time_arrived: "Pending"}
						</td>
						<td style = "white-space: nowrap;">
							${assess.receiving_nurse ? assess.receiving_nurse: "Pending"}
						</td>
					<tr>
					`
				)
				$(".postop_checklist").html(item_array);
			}
		}
	}))
}



const get_intraop_management = async(theatre_overview) => {
	let item_array = [];
	await frappe.call({
		method: "gch_theatre.gch_theatre.doctype.theatre_overview.theatre_overview.fetch_intraop_management",
		args: {
			"theatre_overview": theatre_overview
		},
		callback: (res) => {
			if(res.message){
				let assess = res.message;

				intraop_doc = assess.name
			}else {
				console.log(res.message);
			}
		}
	})
}


const get_pre_anaesthesia_assessment = async(theatre_overview) => {
	let item_array = [];
	await frappe.call({
		method: "gch_theatre.gch_theatre.doctype.theatre_overview.theatre_overview.fetch_pre_anaesthesia_assessment",
		args: {
			"theatre_overview": theatre_overview
		},
		callback: (res) => {
			if(res.message){
				let assess = res.message;

				pre_anaesthesia = assess.name
			}else {
				console.log(res.message);
			}
		}
	})
}

const get_pre_induction_assessment = async(theatre_overview) => {
	let item_array = [];
	await frappe.call({
		method: "gch_theatre.gch_theatre.doctype.theatre_overview.theatre_overview.fetch_pre_induction_assessment",
		args: {
			"theatre_overview": theatre_overview
		},
		callback: (res) => {
			if(res.message){
				let assess = res.message;

				pre_induction = assess.name
			}else {
				console.log(res.message);
			}
		}
	})
}


const get_surgical_notes = async(theatre_overview) => {
	let item_array = [];
	await frappe.call({
		method: "gch_theatre.gch_theatre.doctype.theatre_overview.theatre_overview.fetch_surgical_notes",
		args: {
			"theatre_overview": theatre_overview
		},
		callback: (res)=> {
			if(res.message){
				let notes = res.message;
				document.querySelector('[data-fieldname="surgeons_notes_table"]').style.display = "none";
				
				surgeon_doc = notes.name;
				
				item_array.push(
					`
					<tr style="background-color: lightgreen">
						<td style = "white-space: nowrap;">
							<a style="color: blue" href="/app/surgical-notes/${notes.name}">${notes.name}</a>
						</td>
						<td style = "white-space: nowrap;">
							<p>${notes.surgeon? notes.surgeon: "Pending"}</p>
						</td>
						<td style = "white-space: nowrap;">
							<p>Diagnosis</p>
						</td>
						<td style = "white-space: nowrap;">
							<p>Procedures Done</p>
						</td>
						<td style = "white-space: nowrap;">
							${notes.perioperative_complications ? notes.perioperative_complications: "Pending"}
						</td>
						<td style = "white-space: nowrap;">
							${notes.post_op_instructions ? notes.post_op_instructions: "Pending"}
						</td>
					<tr>
					`
				)
				$(".surgical-notes").html(item_array);
			}else{
				console.log(res.message);
			}
		}
	})
}

const get_theatre_nursing_checklist = async (theatre_overview) => {
	let item_array = [];
	await frappe.call({
		method: "gch_theatre.gch_theatre.doctype.theatre_overview.theatre_overview.fetch_nursing_checklist",
		args: {
			"theatre_overview": theatre_overview
		},
		callback: (res)=> {
			console.log(res.message);
			if(res.message){
				let checklist = res.message;
				document.querySelector('[data-fieldname="create_theatre_nursing_checklist"]').style.display = "none";
				
				nursing_doc = checklist.name;
				
				item_array.push(
					`<tr style="background-color: skyblue">
						<td style="white-space: nowrap;">
							<a style="color: blue" href="/app/theatre-nursing-checklist/${checklist.name}" >${checklist.name}</a>
						</td>
						<td style = "white-space: nowrap;">
							${checklist.both_doctors_informed ? checklist.both_doctors_informed:"Pending"}
						</td>
						<td style = "white-space: nowrap;">
							${checklist.theatre_staff_informed ? checklist.theatre_staff_informed: "Pending"}
						</td>
						<td style = "white-space: nowrap;">
							${checklist.consent_obtained ? checklist.consent_obtained : "Pending"}
						</td>
						<td style = "white-space: nowrap;">
							${checklist.time_of_last_feed ? checklist.time_of_last_feed: "Pending"}
						</td>
						<td style = "white-space: nowrap;">
							${checklist.blood_available ? checklist.blood_available: "Pending"}
						</td>
						<td style = "white-space: nowrap;">
							${checklist.prepared_by ? checklist.prepared_by: "Pending"}
						</td>
					</tr>
					
					`
				)
				$(".nursing-record").html(item_array);
			}else{
				console.log(res.message);
			}
		}
	})
}

const get_anaesthetist_document = async (theatre_overview) => {
	let item_array = [];
	await frappe.call({
		method: "gch_theatre.gch_theatre.doctype.theatre_overview.theatre_overview.fetch_anaesthetist_checklist",
		args: {
			"theatre_overview": theatre_overview
		},
		callback: (res)=> {
			if(res.message){
				let anaes = res.message
				document.querySelector('[data-fieldname="create_anaesthesia_record"]').style.display = "none";
				
				anaesthesia_name = anaes.name;

				item_array.push(
					`
					<tr style="background-color: #b5651d">
						<td style="white-space: nowrap;">
							<a style="color: blue" href="/app/anaesthetists-record/${anaes.name}" >${anaes.name}</a>
						</td>
						<td style = "white-space: nowrap;">
							${anaes.drug_latext_allergy ? anaes.drug_latext_allergy: "Pending"}
						</td>
						<td style = "white-space: nowrap;">
							${anaes.relevant_medical_surgical_history_problem_list ? anaes.relevant_medical_surgical_history_problem_list: "Pending"}
						</td>
						<td style = "white-space: nowrap;">
							${anaes.mallampati_score ? anaes.mallampati_score: "Pending"}
						</td>
						<td style = "white-space: nowrap;">
							${anaes.general_condition ? anaes.general_condition:"Pending"}
						</td>
						<td style = "white-space: nowrap;">
							${anaes.risks_discussed ? anaes.risks_discussed: "Pending"}
						</td>
						<td style = "white-space: nowrap;">
							${anaes.anaesthetist_name ? anaes.anaesthetist_name: "Pending"}
						</td>
					</tr>
					`
				)
				$(".anaesthesia-record").html(item_array);
			}else{
				console.log(res.message);
			}
		}
	})
}

frappe.ui.form.on('Theatre Overview', {
	refresh: function(frm) {
		console.log("huku");
		if(!frm.doc.__islocal){
			get_surgical_notes(frm.doc.name);
			get_theatre_nursing_checklist(frm.doc.name);
			get_anaesthetist_document(frm.doc.name);
			get_pre_anaesthesia_assessment(frm.doc.name);
			get_pre_induction_assessment(frm.doc.name);
			get_intraop_management(frm.doc.name);
			get_preop_checklist(frm.doc.name);
		}

		frm.add_custom_button(__("Treatment Sheet"), function () {
			const url = `/app/treatment-sheet/${frm.doc.inpatient_record}`;
			window.location.href = url;
		});

		// Theatre Nursing Tools

		frm.add_custom_button(__("Procedure Consent form"),
			function () {
				// msgprint("Tool Not available")
				frappe.route_options ={
					"is_inpatient": 1,
					"inpatient_record": frm.doc.inpatient_record,
					"consent_template": "Theatre Procedure Consent Form"
				};
				frappe.new_doc("Consent Form")
			},
			__("Nursing Tools")
		);

		frm.add_custom_button(__("Pre-Operative Checklist"),
			function () {
				if(preop){
					const url = `/app/nursing-preoperative-checklist/${preop}`;
					window.location.href= url;
				}else {
					frappe.route_options = {
						"inpatient_record": frm.doc.inpatient_record,
						"theatre_overview": frm.doc.name
					};
					frappe.new_doc("Nursing Preoperative Checklist")
				}
				
			},
			__("Nursing Tools")
		);

		frm.add_custom_button(__("Intra-Operative Management"),
			function () {
				if(intraop_doc){
					const url = `/app/theatre-nursing-intraoperative-management/${intraop_doc}`;
					window.location.href= url;
				}else {
					frappe.route_options = {
						"inpatient_record": frm.doc.inpatient_record,
						"theatre_overview": frm.doc.name
					};
					frappe.new_doc("Theatre Nursing IntraOperative Management")
				}
			},
			__("Nursing Tools")
		);

		frm.add_custom_button(__("Post-Operative Checklist"),
			function () {
				if(postop_doc){
					const url = `/app/post-operative-checklist/${postop_doc}`;
					window.location.href= url;
				}else {
					frappe.route_options = {
						"inpatient_record": frm.doc.inpatient_record,
						"theatre_overview": frm.doc.name
					};
					frappe.new_doc("Post Operative Checklist")
				}
				
			},
			__("Nursing Tools")
		);

		frm.add_custom_button(__("Post Operative Patient Observation Chart"),
			function () {
				const url = `/app/post-operative-checklist`;
				window.location.href= url;
			},
			__("Nursing Tools")
		);

		frm.add_custom_button(__("Handsoff Tool"),
			function () {
				frappe.new_doc("Nursing Handsoff Tool");
			},
			__("Nursing Tools")
		);


		// Anaesthetists Tools

		frm.add_custom_button(__("Anaesthesia Consent Form"),
			function () {
				// const url = `/app/anaesthetists-record/${anaesthesia_name}`;
				// window.location.href = url;
				frappe.route_options ={
					is_inpatient: true,
					inpatient_record: cur_frm.doc.inpatient_record,
					consent_template: "Anaesthesia Consent Form"
				};
				frappe.new_doc("Consent Form")
			},
			__("Anaesthetists Tools")
		);

		frm.add_custom_button(__("Pre-Anaesthesia Assessment"),
			function () {
				if(pre_anaesthesia){
					const url = `/app/pre-anaesthesia-assessment/${pre_anaesthesia}`;
					window.location.href = url;
				}else {
					frappe.route_options = {
						"inpatient_record": frm.doc.inpatient_record,
						"theatre_overview": frm.doc.name
					};
					frappe.new_doc("Pre Anaesthesia Assessment")
				}
				
			},
			__("Anaesthetists Tools")
		);

		frm.add_custom_button(__("Pre-Induction Assessment"),
			function () {
				if(pre_induction){
					const url = `/app/pre-induction-assessment/${pre_induction}`;
					window.location.href = url;
				} else {
					frappe.route_options = {
						"inpatient_record": frm.doc.inpatient_record,
						"theatre_overview": frm.doc.name
					};
					frappe.new_doc("Pre Induction Assessment")
				}
			},
			__("Anaesthetists Tools")
		);

		frm.add_custom_button(__("Anaesthesia Record"),
			function () {
				const url = `/app/anaesthetists-record/${anaesthesia_name}`;
				window.location.href = url;
			},
			__("Anaesthetists Tools")
		);

		//  Surgeon Tools

		frm.add_custom_button(__("Operating Theatre Surgeon Document"),
			function () {
				const url = `/app/surgical-notes/${surgeon_doc}`;
				window.location.href = url;
			},
			__("Surgeon's Tools")
		);


	},

	surgeons_notes_table: (frm) => {
		frappe.route_options = {
			inpatient_record: frm.doc.inpatient_record,
			theatre_overview: frm.doc.name
		};
		frappe.new_doc("Surgical Notes")
	},

	create_anaesthesia_record: (frm) => {
		frappe.route_options = {
			inpatient_record: frm.doc.inpatient_record,
			theatre_overview: frm.doc.name
		};
		frappe.new_doc("Anaesthetists Record")
	},

	create_theatre_nursing_checklist: (frm) => {
		frappe.route_options = {
			inpatient_record: frm.doc.inpatient_record,
			theatre_overview: frm.doc.name
		};
		frappe.new_doc("Theatre Nursing Checklist")
	}

});
