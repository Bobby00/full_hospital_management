function openDetailModal(item) {

}


function fetchPrimaryParentPhone(patient, dialog) {
	frappe.call({
		method: "gch_custom.services.rest.fetch_primary_parent_phone_to_appointment",
		args: { "patient": patient },
		callback: (res) => {
			console.log(res)
			// if (res?.message?.dob) {
			// 	frm.set_value("patient_dob", res?.message?.dob);
			// }
			if (res.message.parents.length > 0) {
				for (let parent in res.message.parents) {
					// console.log(res.message.parents[parent], "===================")
					if (res.message.parents[parent].is_primary) {
						dialog.set_value("patient_phone", res.message.parents[parent].phone_number)
						console.log(res.message.parents[parent].phone_number)
						frappe.show_alert(
							{
								message: __("Primary Parent Phone Number Fetched Successfully"),
								indicator: "green",
							},
							4
						);
					} else {
						// frappe.show_alert(
						//     {
						//       message: __("Primary Parent not set"),
						//       indicator: "red",
						//     },
						//     2
						// );
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
		}
	})
}
function openBookingForm(item) {
	console.log(item)
	console.log(item?.date)


	let start_time = item?.date.toISOString();
	surgery_start_time = moment(item?.date).format("YYYY-MM-DD HH:mm:ss");

	// surgery_start_time = moment(new Date(item?.date).toISOString(), 'DD/MM/YYYY, HH:mm:ss').format("YYYY-MM-DD HH:mm:ss")
	frappe.route_options = {
		surgery_start_time: surgery_start_time,
		surgery_duration: "1h",
		theatre: item?.resource?.id
	}
	let params = {
		surgery_start_time: surgery_start_time,
		surgery_duration: "1h",
		theatre: item?.resource?.id
	}
	const path = `/app/theatre-booking/new-theatre-booking-1`;
	const queryParams = {
		"surgery_start_time": surgery_start_time,
		"surgery_duration": "1h",
		"theatre": item?.resource?.id
	}
	const url = `${path}?${$.param(queryParams)}`;
	window.location.href = url
}

function openBookingModal(item) {
	frappe.db.get_doc("DocType", "Clinical Procedure Template",).then(() => {
		var dialog = new frappe.ui.Dialog({
			title: `Add New Booking for ${item?.resource?.title}`,
			fields: [
				{ fieldname: 'patient', label: 'Patient', fieldtype: 'Link', options: 'Patient' },
				{ fieldname: 'patient_name', label: 'Patient Name', fieldtype: 'Data', hidden: 1 },
				{ fieldname: 'search_by_uhid', label: 'Search By UHID - Press ENTER to search', fieldtype: 'Data' },
				{ fieldname: 'patient_not_in_system', label: 'Patient Not In System', fieldtype: 'Check' },
				{ fieldname: 'patient_phone', label: 'Patient Phone', fieldtype: 'Data', reqd: 1 },
				{ fieldname: 'medical_diagnosis', label: 'Medical Diagnosis', fieldtype: 'Link', options: 'Codification Table' },
				{ fieldname: 'surgery_name', label: 'Surgery Name', fieldtype: 'Table MultiSelect', options: 'Clinical Procedure Template' },
				{ fieldname: 'surgeon_name', label: 'Surgeon Name', fieldtype: 'Link', options: 'Healthcare Practitioner', reqd: 1 },
				{ fieldname: 'anaesthetist_name', label: 'Anaesthetist Name', fieldtype: 'Link', options: 'Healthcare Practitioner', reqd: 1 },
			],
			primary_action_label: 'Save',
			primary_action: async function () {
				console.log('')
				var patientName = dialog.get_value('patient_name');
				var surgeryName = dialog.get_value('surgery_name');
				var surgeonName = dialog.get_value('surgeon_name');
				var anaesthetistName = dialog.get_value('anaesthetist_name');

				var allValues = {};
				dialog.fields.forEach(field => {
					allValues[field.fieldname] = dialog.get_value(field.fieldname);
				});
				console.log(allValues);

				console.log(item)
				item['content'] = patientName

				// POST to API using FrappeJS
				frappe.call({
					method: 'gch_theatre.services.create_theatre_booking',
					args: {
						patient_name: patientName,
						patient_phone: allValues['patient_phone'],
						surgery_name: surgeryName,
						surgeon_name: surgeonName,
						anaesthetist_name: anaesthetistName,
						surgery_start_time: item?.start?.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '').substr(0, 19),
						surgery_end_time: item?.start?.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '').substr(0, 19)
					},
					//toISOString().replace('T', ' ').replace(/\.\d+Z$/, '').substr(0, 19);
					callback: function (response) {
						if (!response.exc) {
							console.log('Theatre Booking created successfully');
							// Additional handling after successful creation
						} else {
							console.log('Failed to create Theatre Booking:', response.exc);
							// Error handling;
						}
					}
				});

				dialog.hide();
			},
		});
		console.log(dialog.fields_dict)
		dialog.fields_dict.patient_not_in_system.$input.on('change', function () {
			var patientNotInSystem = dialog.get_value('patient_not_in_system');
			var patientField = dialog.get_field('patient')
			var patientNameField = dialog.get_field('patient_name');
			if (patientNotInSystem) {
				console.log('patient not in system')
				patientNameField.toggle(true);
				patientField.toggle(false);
			} else {
				console.log('patient in system')
				patientNameField.toggle(false);
				patientField.toggle(true);
			}
		});

		dialog.fields_dict.search_by_uhid.$input.keydown(function (e) {
			if (e.which === 13) { // Check if Enter key is pressed
				e.preventDefault();
				var uhidValue = dialog.get_value('search_by_uhid');
				frappe.show_alert({
					message: __(`Searching for UHID ${uhidValue}...`),
					indicator: 'green'
				}, 5)

				let patient = frappe.db.get_doc(
					"Patient", null, {
					uhid_code: uhidValue
				}
				).then((patient) => {
					frappe.show_alert({
						message: __(`Patient found for UHID ${uhidValue}`),
						indicator: 'green'
					}, 5)

					console.log(patient)
					dialog.set_value('patient_name', patient.name);
					dialog.set_value('patient', patient.name)
					var patientField = dialog.get_field('patient')
					var patientNameField = dialog.get_field('patient_name');
					patientField.toggle(true);
					patientNameField.toggle(true);
					fetchPrimaryParentPhone(patient.name, dialog)

				}).catch((error) => {
					frappe.show_alert({
						message: __(`No patient found for UHID ${uhidValue}`),
						indicator: 'red'
					}, 4)
				})

			}
		});

		var patientField = dialog.get_field('patient').$input[0];
		patientField.addEventListener('awesomplete-selectcomplete', function () {
			var patientLinkValue = dialog.get_value('patient');
			console.log('PATIENT SELECTED');

			if (patientLinkValue) {
				frappe.model.with_doc("Patient", patientLinkValue, function () {
					var patient = frappe.model.get_doc("Patient", patientLinkValue);
					if (patient) {
						console.log(`patient`, patient);
						dialog.set_value('patient_name', patient.patient_name);
						dialog.set_value('search_by_uhid', patient.uhid_code);
						// var patientNotInSystem = dialog.get_value('patient_not_in_system');
						// var patientField = dialog.get_field('patient');
						var patientNameField = dialog.get_field('patient_name');
						// patientField.toggle(true);
						patientNameField.toggle(true);
						fetchPrimaryParentPhone(patient.name, dialog)
						// patientNotInSystem.toggle(false);
					}
				});
			}
		});



		dialog.fields_dict.patient.$input.on('keypress', function () {
			var patientLinkValue = dialog.get_value('patient');
			console.log('PATIENT SET');
			if (patientLinkValue) {
				console.log(patientLinkValue)
				// frappe.model.with_doc("Patient", patientLinkValue, function () {
				// 	var patient = frappe.model.get_doc("Patient", patientLinkValue);
				// 	if (patient) {
				// 		console.log(patient);
				// 		dialog.set_value('patient_name', patient.patient_name);
				// 		var patientNotInSystem = dialog.get_value('patient_not_in_system');
				// 		var patientField = dialog.get_field('patient').$wrapper;
				// 		var patientNameField = dialog.get_field('patient_name').$wrapper;
				// 		patientField.toggle(true);
				// 		patientNameField.toggle(true);
				// 		patientNotInSystem.toggle(false);
				// 		dialog.set_value('search_by_uhid', patient.uhid_code);
				// 	}
				// });
			}
		});
		if (dialog.get_value("patient")) {
			console.log("Patient is present")
		}


		dialog.show();
	})

}

function generatePopoverContent(event) {
	console.log(event)
	return '<div><strong>Start Time:</strong> ' + moment(event.start).format('YYYY-MM-DD HH:mm') + '</div>' +
		'<div><strong>End Time:</strong> ' + moment(event.end).format('YYYY-MM-DD HH:mm') + '</div>'

}
function getTheatres() {
	return frappe.db.get_list(
		"Theatre", {
		fields: ["name", "theatre_name"]
	}
	).then((theatres) => {
		return theatres.map(theatre => ({
			id: theatre.name,
			title: theatre.theatre_name,
			group: 'Theatre'
		}));
	}).catch((error) => {
		console.log(error)
		return []
	})
}

const getBookings = async (surgeon = null, clinical_procedure = null) => {
	console.log(surgeon, clinical_procedure)
	try {
		let bookingData = await frappe.call({
			method: "gch_theatre.services.calendar_bookings_view",
			args: {
				surgeon: surgeon,
				clinical_procedure: clinical_procedure
			}
		})
		console.log(bookingData);
		return bookingData
	}
	catch {
		return []
	}

}

function openBookingModal2(item) {
	frappe.route_options = {
		theatre: item?.resource?.title,
		surgery_start_time: item?.date?.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '').substr(0, 19),
	}
	let route_options = {
		theatre: item?.resource?.title,
		surgery_start_time: item?.date?.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '').substr(0, 19),
	}
	console.log(route_options)
	frappe.new_doc(
		"Theatre Booking",
		route_options
	)

}

frappe.pages["theatre-booking-time"].on_page_load = function (wrapper) {
	new TheatreBookingTime(wrapper);
}

TheatreBookingTime = Class.extend({
	init: function (wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: "Theatre Booking Timeline",
			single_column: true
		})
		this.showCalendar();
		this.make()
	},

	make: async function () {
		var me = this;
		me.page.main.html(frappe.render_template("theatre_booking_time", this)).html();
		let surgeon_filter_field = frappe.ui.form.make_control({
			parent: $('.surgeon-filter'),
			render_input: 1,
			df: {
				fieldtype: "Link",
				fieldname: "surgeon_filter",
				placeholder: __('Filter By Surgeon'),
				options: "Healthcare Practitioner",
				change: async () => {
					let selected_surgeon = surgeon_filter_field.get_value()
					console.log(selected_surgeon);
					await this.showCalendar(surgeon = selected_surgeon, clinical_procedure = null);

				}
			}
		});

		surgeon_filter_field.toggle_label(false);
		surgeon_filter_field.refresh();

		let procedure_filter_field = frappe.ui.form.make_control({
			parent: $('.procedure-filter'),
			render_input: 1,
			df: {
				fieldtype: "Link",
				fieldname: "procedure_filter",
				placeholder: __('Filter By Procedure'),
				options: "Clinical Procedure",
				change: async () => {
					let selected_procedure = procedure_filter_field.get_value()
					console.log(selected_procedure);
				}
			}
		});

		procedure_filter_field.toggle_label(false);
		procedure_filter_field.refresh();


	},
	// showFilteredCalendar: async function (){
	// 	frappe.require('/assets/gch_theatre/timeline/index.global.min.js', async () => {
	// 		getTheatres.then((theatres) => {
	// 			let theatres_list = theatres;
	// 			get
	// 		})
	// 	})
	// },

	showCalendar: async function (surgeon, clinical_procedure) {
		frappe.require('/assets/gch_theatre/timeline/index.global.min.js', async () => {

			getTheatres().then((theatres) => {
				console.log(theatres)
				let theatres_list = theatres
				getBookings(surgeon, clinical_procedure).then((bookings) => {
					let calendarDiv = document.getElementById("calendar");
					var calendar = new FullCalendar.Calendar(calendarDiv, {
						initialView: 'resourceTimelineWeek',
						defaultDate: new Date(),
						schedulerLicenseKey: "CC-Attribution-NonCommercial-NoDerivatives",
						resourceGroupField: 'group',
						resources: theatres_list,
						nowIndicator: true,
						expandRows: true,
						events: bookings?.message,
						displayEventTime: true,
						eventOverlap: false,
						overlap: false,
						headerToolbar: {
							left: 'prev,next today',
							center: 'title',
							right: 'resourceTimelineWeek,resourceTimelineMonth, listWeek'
						},
						eventClick: function (info) {
							console.log(info.event.id)
							// alert('Booking clicked: ' + info.event.title);
							frappe.set_route("Form", "Theatre Booking", info?.event?.id)
							// frappe.new_doc("Theatre Booking", info)
						},
						dateClick: function (info) {
							let clickedResource = calendar.getResourceById(info?.resource?.id)
							var events = clickedResource.getEvents();
							// console.log(events)
							let matching = events.filter(function (event) {
								return event.start.getHours() === info.date.getHours();
							});
							console.log(matching)
							if (matching.length > 0) {
								frappe.msgprint({
									title: __('Slot is taken.'),
									indicator: 'red',
									message: __('Unable to book for that time. Another booking is slotted for the same time.')
								});
								return
							}
							if (info && info.date && new Date(info.date) < new Date()) {
								frappe.msgprint({
									title: __('Date and Time is in the past.'),
									indicator: 'red',
									message: __('Unable to book for that time. The date and time are in the past.')
								});
								return;
							}
							openBookingForm(info)
						},

						eventMouseEnter: function (info) {
							console.log(info)
							var content = generatePopoverContent(info.event);

							$(info.el).popover({
								title: info.event.title,
								content: content,
								html: true,
								placement: 'top',
								container: 'body'
							}).popover('show');
						},
						eventMouseEnter2: function (info) {
							if (!$(info.el).data('bs.popover')) {
								var content = '<div><strong>Title:</strong> ' + info.event.title + '</div>';
								content += '<div><strong>Start Time:</strong> ' + moment(info.event.start).format('YYYY-MM-DD HH:mm') + '</div>';
								content += '<div><strong>End Time:</strong> ' + moment(info.event.end).format('YYYY-MM-DD HH:mm') + '</div>';
								content += '<div><strong>Description:</strong> ' + info.event.extendedProps.description + '</div>';
								content += '<div><strong>Location:</strong> ' + info.event.extendedProps.location + '</div>';

								$(info.el).popover({
									title: 'Event Details',
									content: content,
									html: true,
									placement: 'top',
									container: 'body'
								}).popover('show');
							}
						},
						eventMouseEnter1: function (info) {
							console.log(info?.event)
							// let content = '<div><strong>Title:</strong> ' + info.event.title + '</div>';
							// content += '<div><strong>Start Time:</strong> ' + moment(info.event.start).format('YYYY-MM-DD HH:mm') + '</div>';
							// content += '<div><strong>End Time:</strong> ' + moment(info.event.end).format('YYYY-MM-DD HH:mm') + '</div>';
							// content += '<div><strong>Description:</strong> ' + info.event.extendedProps.description + '</div>';
							// content += '<div><strong>Location:</strong> ' + info.event.extendedProps.location + '</div>';

							$(info.el).popover({
								title: info?.event?.title,
								content: "hello",
								html: true,
								placement: 'top',
								trigger: 'manual',
								container: 'body'
							});
							$(info.el).popover('show');
						},
						eventMouseLeave: function (info) {
							console.log('Leaving')
							$(info.el).popover('hide').popover('dispose');
						}
					});
					calendar.render();
				}).catch((error) => console.log(error));
			}).catch((error) =>
				console.log(error))



			// var calendarGrid = new FullCalendar.Calendar(calendarGridDiv, {
			// 	// timeZone: '',
			// 	initialView: 'resourceTimeGridFourDay',
			// 	datesAboveResources: true,
			// 	schedulerLicenseKey: "CC-Attribution-NonCommercial-NoDerivatives",
			// 	nowIndicator: true,
			// 	slotDuration: '00:20:00',
			// 	headerToolbar: {
			// 		left: 'prev,next',
			// 		center: 'title',
			// 		right: 'resourceTimeGridDay,resourceTimeGridFourDay,resourceTimeGridEightDay,resourceTimeGrid14Day,resourceTimeGrid30Day'
			// 	},
			// 	views: {
			// 		resourceTimeGridFourDay: {
			// 			type: 'resourceTimeGrid',
			// 			duration: { days: 4 },
			// 			buttonText: '4 days'
			// 		},
			// 		resourceTimeGridEightDay: {
			// 			type: 'resourceTimeGrid',
			// 			duration: { days: 8 },
			// 			buttonText: '8 days'
			// 		},
			// 		resourceTimeGrid14Day: {
			// 			type: 'resourceTimeGrid',
			// 			duration: { days: 14 },
			// 			buttonText: '14 days'
			// 		},
			// 		resourceTimeGrid30Day: {
			// 			type: 'resourceTimeGrid',
			// 			duration: { days: 30 },
			// 			buttonText: '30 days'
			// 		},
			// 	},
			// 	resources: [
			// 		{ id: 'a', title: 'THT 1' },
			// 		{ id: 'b', title: 'THT 2' },
			// 		{ id: 'c', title: 'THT 3' }
			// 	],
			// 	// events: bookings2,
			// 	events: '/api/method/gch_theatre.services.render_bookings',
			// 	eventClick: function (info) {
			// 		alert('Clicked event')
			// 	},
			// 	dateClick: function (info) {
			// 		console.log(info)
			// 		openBookingModal2(info)
			// 	}
			// });

			// calendarGrid.render();
		})
	}
});
