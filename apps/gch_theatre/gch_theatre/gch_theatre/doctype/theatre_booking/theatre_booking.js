// Console.log "No Results" if link query to `patient` field on Theatre Booking returns no results

const showAdmissionForm = (frm) => {
	console.log(frm.doc.surgeon_or_doctor)
	// frappe.route_options = {
	// 	patient: frm.doc.patient,
	// 	patient_name: frm.doc.patient_name,
	// 	doctor: frm.doc.surgeon_or_doctor,
	// 	admission_type: "Surgery",
	// 	theatre_booking: frm.doc.name
	// }
	let route_options = {
		patient: frm.doc.patient,
		patient_name: frm.doc.patient_name,
		date_of_birth: frm.doc.patient_dob,
		doctor: frm.doc.surgeon_or_doctor,
		admission_type: "Surgery",
		theater_booking: frm.doc.name
	}
	frappe.new_doc("Admission Form", route_options)
}

function toggleEndTimeVisibility(frm) {
	var show_end_time = frm.doc.surgery_start_time && frm.doc.surgery_duration;
	console.log(show_end_time);
	frm.toggle_display('surgery_end_time', show_end_time);
}

function calculateEndTime(frm) {
	var start_time = frm.doc.surgery_start_time;
	var duration_seconds = frm.doc.surgery_duration;

	if (start_time && duration_seconds) {
		// Convert duration to milliseconds (moment expects milliseconds)
		var duration_milliseconds = duration_seconds * 1000;

		// Calculate end time
		var end_time = moment(start_time).add(duration_milliseconds, 'milliseconds');

		// Set the calculated end time in the form
		frm.set_value('surgery_end_time', end_time.format('YYYY-MM-DD HH:mm:ss'));
		frm.refresh_field('surgery_end_time')
		frm.set_df_property('surgery_end_time', "read_only", true);
	}
}


async function searchByUHID(frm, uhid) {
	frappe.show_alert({
		message: __(`Searching for UHID ${uhid}...`),
		indicator: 'green'
	}, 5)

	let patient = await frappe.db.get_doc(
		"Patient", null, {
		uhid_code: uhid
	}
	)
	console.log(patient)
	frm.set_value("patient", patient.name)
	//   frm.set_value
	frm.refresh_field('patient')

}

function secondsToHMS(seconds) {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let remainingSeconds = seconds % 60;
    
    return {
        hours: hours,
        minutes: minutes,
        seconds: remainingSeconds
    };
}

// frappe.listview_settings['Theatre Booking'].onload = function (listview) {
// 	window.location.href = "/app/theatre-booking/view/calendar/default";
// };

frappe.ui.form.on('Theatre Booking', {
	openAdmissionForm(frm) {
		showAdmissionForm(frm)
	},

	before_submit: function (frm) {
		console.log("SUBMIT HAPPENING...")
		frm.disable_save()
		frm.disable_save();
		// Create a new dialog instance
		var dialog = new frappe.ui.Dialog({
			title: 'Form Data Confirmation',
			fields: [
				{
					fieldtype: 'HTML',
					fieldname: 'form_data'
				}
			],
			primary_action_label: 'Submit',
			primary_action: function () {
				// Submit the form if the user confirms
				frm.save('Submit');
				dialog.hide();
			}
		});

		// Prepare the HTML content for the dialog
		var dialog_content = '<div><strong>Name:</strong> ' + frm.doc.name + '</div>';
		dialog_content += '<div><strong>Owner:</strong> ' + frm.doc.owner + '</div>';
		dialog_content += '<div><strong>Creation:</strong> ' + frm.doc.creation + '</div>';
		dialog_content += '<div><strong>Modified:</strong> ' + frm.doc.modified + '</div>';
		dialog_content += '<div><strong>Surgeon or Doctor:</strong> ' + frm.doc.surgeon_or_doctor + '</div>';
		dialog_content += '<div><strong>Surgeon Name:</strong> ' + frm.doc.surgeon_name + '</div>';
		dialog_content += '<div><strong>Anaesthetist:</strong> ' + frm.doc.anaesthetist + '</div>';
		dialog_content += '<div><strong>Title:</strong> ' + frm.doc.title + '</div>';
		dialog_content += '<div><strong>Anaesthetist Name:</strong> ' + frm.doc.anaesthetist_name + '</div>';
		dialog_content += '<div><strong>Patient:</strong> ' + frm.doc.patient + '</div>';
		dialog_content += '<div><strong>Patient Name:</strong> ' + frm.doc.patient_name + '</div>';
		dialog_content += '<div><strong>Patient UHID:</strong> ' + frm.doc.patient_uhid + '</div>';
		dialog_content += '<div><strong>Patient Phone:</strong> ' + frm.doc.patient_phone + '</div>';
		dialog_content += '<div><strong>Theatre:</strong> ' + frm.doc.theatre + '</div>';
		dialog_content += '<div><strong>Theatre Name:</strong> ' + frm.doc.theatre_name + '</div>';
		dialog_content += '<div><strong>Is Patient Confirmed:</strong> ' + frm.doc.is_patient_confirmed + '</div>';
		dialog_content += '<div><strong>Is Finance Team Confirmed:</strong> ' + frm.doc.is_finance_team_confirmed + '</div>';
		dialog_content += '<div><strong>Surgery Start Time:</strong> ' + frm.doc.surgery_start_time + '</div>';
		dialog_content += '<div><strong>Surgery Duration:</strong> ' + frm.doc.surgery_duration + '</div>';
		dialog_content += '<div><strong>Surgery End Time:</strong> ' + frm.doc.surgery_end_time + '</div>';
		dialog_content += '<div><strong>Is Forwarded:</strong> ' + frm.doc.is_forwarded + '</div>';
		dialog_content += '<div><strong>Special Requirements:</strong> ' + frm.doc.special_requirements + '</div>';
		// Set the HTML content to the dialog
		dialog.set_value('form_data', dialog_content);
		// Show the dialog
		dialog.show();

		return false;
	},

	onload: function (frm) {
		console.log("LOADED")
		const queryString = window.location.search;
		console.log(queryString)
		// console.log(frappe.route_options)
	},
	setup: function (frm) {
		console.log(frm.primary_action)

		if (!frm.is_new()) {
			frm.add_custom_button(__("Open Admission"), function () {
				showAdmissionForm(frm)
			})
		}

		frm.fields_dict["surgeon_or_doctor"].get_query = function (doc) {
			return {
				filters: {
					"department": "Surgical Clinic"
				}
			}
		}

		frm.fields_dict["anaesthetist"].get_query = function (doc) {
			return {
				filters: {
					"department": "Anaesthetist"
				}
			}
		}

		frm.set_query("clinical_procedure_template", "clinical_procedures", function(doc, cdt, cdn) {
			var item = locals[cdt][cdn];
			console.log(item, "Generics.....")
			return {
				// query: "gch_custom.services.rest.only_show_generic_name",
				filters: {
				    'medical_department': "Surgical Clinic",
				}
			};
		});
	},
	refresh: function (frm) {
		const queryString = window.location.search;
		console.log(queryString)
		const urlParams = new URLSearchParams(queryString);
		console.log(urlParams)
		const surgery_start_time = urlParams.get("surgery_start_time");
		const default_duration = urlParams.get("surgery_duration")
		console.log(surgery_start_time)
		if (surgery_start_time) {
			// frm.set_value('surgery_start_time', surgery_start_time);
			frm.set_value('surgery_start_time', moment(surgery_start_time, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"));
			frm.refresh_field("surgery_start_time")
		}
		if (default_duration) {
			frm.set_value("surgery_duration", 3600)
			frm.refresh_field("surgery_duration")
			toggleEndTimeVisibility(frm);
			calculateEndTime(frm);
		}

		frm.page.set_primary_action(__('Submit'), function () {
			var dialog = new frappe.ui.Dialog({
				title: 'Form Data Confirmation',
				fields: [
					{
						fieldtype: 'HTML',
						fieldname: 'form_data'
					}
				],
				primary_action_label: 'Submit',
				primary_action: function () {
					// Submit the form if the user confirms
					frm.save('Submit');
					dialog.hide();
				}
			});

			// Prepare the HTML content for the dialog
			var dialog_content = '';
			dialog_content += '<div><strong>Owner:</strong> ' + frm.doc.owner + '</div>';
			dialog_content += '<div><strong>Surgeon Name:</strong> ' + frm.doc.surgeon_name + '</div>';
			dialog_content += '<div><strong>Anaesthetist Name:</strong> ' + frm.doc.anaesthetist_name + '</div>';
			dialog_content += '<div><strong>Patient Name:</strong> ' + frm.doc.patient_name + '</div>';
			dialog_content += '<div><strong>Patient UHID:</strong> ' + frm.doc.patient_uhid + '</div>';
			dialog_content += '<div><strong>Patient Phone:</strong> ' + frm.doc.patient_phone + '</div>';
			dialog_content += '<div><strong>Theatre Name:</strong> ' + frm.doc.theatre_name + '</div>';
			dialog_content += '<div><strong>Is Patient Confirmed:</strong> ' + frm.doc.is_patient_confirmed ? '<div><strong>Patient Confirmed:</strong> Yes </div>' : '<div><strong>Patient Confirmed:</strong> No </div>' + '</div>';
			dialog_content += '<div><strong>Finance Team Confirmed:</strong> ' + frm.doc.is_finance_team_confirmed ? '<div><strong>Finance Team Confirmed:</strong>Yes</div>' : '<div><strong>Finance Team Confirmed:</strong> No</div>' + '</div>';
			dialog_content += '<div><strong>Surgery Start Time:</strong> ' + frm.doc.surgery_start_time + '</div>';
			var surgeryDuration = secondsToHMS(frm.doc.surgery_duration);
			dialog_content += '<div><strong>Surgery Duration:</strong> ' + surgeryDuration.hours + ' hours, ' + surgeryDuration.minutes + ' minutes, ' + surgeryDuration.seconds + ' seconds</div>';
			dialog_content += '<div><strong>Surgery End Time:</strong> ' + frm.doc.surgery_end_time + '</div>';
			dialog_content += '<div><strong>Special Requirements:</strong> ' + frm.doc?.special_requirements ?? 'N/A' + '</div>';
			dialog_content += '<div><strong>Patient Education:</strong> ' + frm.doc?.patient_education ?? 'N/A' + '</div>';


			// Set the HTML content to the dialog
			dialog.set_value('form_data', dialog_content);

			// Show the dialog
			dialog.show();

			return false;
		});
		if (frm.doc.docstatus === 1) { // Check if document status is "Submitted"
			frm.page.add_menu_item(__('Cancel Booking'), function () {
				frappe.call({
					method: 'gch_theatre.services.cancel_booking',
					args: {
						docname: frm.doc.name
					},
					callback: function (response) {
						frappe.msgprint(response.message);
						frm.reload_doc();
					},
					freeze: true,
					freeze_message: __("Cancelling booking..."),
				});
			});

		}
		if (frm.doc.docstatus === 1 || frm.doc.docstatus === 2) {
			frm.page.add_menu_item(__('Reschedule Booking'), function () {
				frappe.call({
					method: 'gch_theatre.services.reschedule_booking',
					args: {
						docname: frm.doc.name
					},
					callback: function (response) {
						frappe.msgprint(response.message);
						frm.reload_doc();
					},
					freeze: true,
					freeze_message: __("Opening booking for rescheduling..."),
				});
			});
		}
		if (!frm.is_new() && frm.doc.docstatus == 1) {
			console.log(frm.doc.docstatus)
			frm.add_custom_button(__("Open Admission"), function () {
				showAdmissionForm(frm)
			})
		}
		frm.set_query("patient", function () {
			return {
				"filters": {
					"patient": frm.doc.patient
				}
			};
		});
		if (frm.doc.patient && !frm.doc.not_in_system) {
			console.log(frm.doc.patient)
			console.log("Patient in system")
			let patient = frappe.get_doc("Patient", frm.doc.patient)
			console.log(patient)
		}

		frm.fields_dict['surgery_start_time'].df.change = function () {
			toggleEndTimeVisibility(frm);
			calculateEndTime(frm);
		};
		frm.fields_dict['surgery_duration'].df.change = function () {
			toggleEndTimeVisibility(frm);
			calculateEndTime(frm);
		};

		// Initially hide the surgery end time field
		toggleEndTimeVisibility(frm);


		frm.fields_dict['uhid_search'].$input.on('keydown', function (e) {
			if (e.key === 'Enter' && this.value && this === document.activeElement) {
				e.preventDefault();
				searchByUHID(frm, this.value);

			}
		});

		// if (frm.fields_dict["is_patient_confirmed"].value == 1) {
		// 	if (frm.patient_dob == "" || frm.patient_dob == undefined || frm.patient_dob == null) {
		// 		frappe.throw(__("Please capture patient DOB"))
		// 	}
		// }

		// frm.fields_dict["is_patient_confirmed"].df.change = function () {
		// 	console.log("CONFIRMING PATIENT")
		// 	let patient_confirmed = frm.fields_dict["is_patient_confirmed"].value
		// 	console.log(frm.fields_dict["is_patient_confirmed"].value)
		// 	if (patient_confirmed == 1) {
		// 		if (frm.patient_dob == "" || frm.patient_dob == undefined || frm.patient_dob == null) {
		// 			frappe.throw(__("Please capture patient DOB"))
		// 		}
		// 	}
		// }


	},
	patient: function (frm) {
		if (frm.doc.patient && !frm.doc.not_in_system) {
			frappe.call({
				method: "gch_custom.services.rest.fetch_primary_parent_phone_to_appointment",
				args: { "patient": frm.doc.patient },
				callback: (res) => {
					if (res?.message?.dob) {
						frm.set_value("patient_dob", res?.message?.dob);
					}
					if (res.message.parents.length > 0) {
						for (let parent in res.message.parents) {
							if (res.message.parents[parent].is_primary) {
								let phone = res.message.parents[parent].phone_number
								frm.set_value("patient_phone", phone)
								frm.set_value("contact_phone", phone)
								frappe.show_alert(
									{
										message: __("Primary Parent Phone Number Fetched Successfully"),
										indicator: "green",
									},
									4
								);
							} else {
								frappe.show_alert(
								    {
								      message: __("Primary Parent not set"),
								      indicator: "red",
								    },
								    2
								);
							}
						}
					} else {
						frappe.show_alert(
							{
								message: __("Patient has no parents registered on system"),
								indicator: "red",
							},
							3
						);
					}
					// console.log(res)
				},
				freeze: true,
				freeze_message: __("Fetching patient phone..."),
			})
		}
	},
	surgery_duration: function (frm) {
		frm.fields_dict['surgery_start_time'].df.change = function () {
			toggleEndTimeVisibility(frm);
			calculateEndTime(frm);
		};
		frm.fields_dict['surgery_duration'].df.change = function () {
			toggleEndTimeVisibility(frm);
			calculateEndTime(frm);
		};

		// Initially hide the surgery end time field
		toggleEndTimeVisibility(frm);
	},
	patient_confirmed: function (frm) {

	},
	is_finance_team_confirmed: function (frm) {
		frm.fields_dict["is_finance_team_confirmed"].df.change = function () {
			console.log("Changing finance team")
			console.log(frm.doc.is_finance_team_confirmed)
			if (frm.doc.is_finance_team_confirmed == 0) {
				frm.doc.finance_team_status = ""
				frm.refresh_field("finance_team_status")
			}
		}
		// frm.fields_dict.is_finance_team_confirmed.$input.on('change', function() {
		//     // Log the value of the checkbox field to the console
		//     console.log("Checkbox value:", frm.doc.is_finance_team_confirmed);
		// });
	}

});
