// var vis = frappe.require('/assets/gch_theatre/visjs/vis-timeline-graph2d.min.js');



frappe.pages['theatre-bookings'].on_page_load = function (wrapper) {
	new TheatreBookings(wrapper);
}

function openBookingModal2(clickedTime) {
	console.log(clickedTime);
	var dialog = new frappe.ui.Dialog({
		title: `Add New Booking`,
		fields: [
			{ fieldname: 'patient_name', label: 'Patient Name', fieldtype: 'Data', reqd: 1 },
			{ fieldname: 'surgery_name', label: 'Surgery Name', fieldtype: 'Data', reqd: 1 },
			{ fieldname: 'surgeon_name', label: 'Surgeon Name', fieldtype: 'Link', options: 'Healthcare Practitioner', reqd: 1 },
			{ fieldname: 'anaesthetist_name', label: 'Anaesthetist Name', fieldtype: 'Link', options: 'Healthcare Practitioner', reqd: 1 },
		],
		primary_action_label: 'Save',
		primary_action: async function () {
			var patientName = dialog.get_value('patient_name');
			var surgeryName = dialog.get_value('surgery_name');
			var surgeonName = dialog.get_value('surgeon_name');
			var anaesthetistName = dialog.get_value('anaesthetist_name');

			console.log('Patient Name:', patientName);
			console.log('Surgery Name:', surgeryName);
			console.log('Surgeon Name:', surgeonName);
			console.log('Anaesthetist Name:', anaesthetistName);

			//POST to API
			let payload = {

			}

			dialog.hide();
		},
	});

	dialog.show();
}


function openBookingModal(item) {
	console.log(`OPENING WITH ${JSON.stringify(item)}`);
	frappe.db.get_doc("DocType", "Clinical Procedure Template", ).then(() => {
		var dialog = new frappe.ui.Dialog({
			title: `Add New Booking`,
			fields: [
				{ fieldname: 'patient_name', label: 'Patient Name', fieldtype: 'Data', reqd: 1 },
				{ fieldname: 'patient_phone', label: 'Patient Phone', fieldtype: 'Data', reqd: 1 },
				{ fieldname: 'medical_diagnosis', label: 'Medical Diagnosis', fieldtype: 'Link', options: 'Codification Table' },
				{ fieldname: 'surgery_name', label: 'Surgery Name', fieldtype: 'Table MultiSelect', options:'Clinical Procedure Template' },
				{ fieldname: 'surgeon_name', label: 'Surgeon Name', fieldtype: 'Link', options: 'Healthcare Practitioner', reqd: 1 },
				{ fieldname: 'anaesthetist_name', label: 'Anaesthetist Name', fieldtype: 'Link', options: 'Healthcare Practitioner', reqd: 1 },
			],
			primary_action_label: 'Save',
			primary_action: async function () {
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
							console.log('Failed tcreate Theatre Booking:', response.exc);
							// Error handling
						}
					}
				});
	
				dialog.hide();
			},
		});
	
		dialog.show();
	})

}


function openBookingModal2(clickedTime) {
	console.log(clickedTime)
	var dialog = new frappe.ui.Dialog({
		title: `Add New Booking`,
		fields: [

			{ fieldname: 'patient_name', label: 'Patient Name', fieldtype: 'Data', reqd: 1 },
			{ fieldname: 'surgery_name', label: 'Surgery Name', fieldtype: 'Link', options: 'Clincal Procedure Template', reqd: 1 },
			{ fieldname: 'surgeon_name', label: 'Surgeon Name', fieldtype: 'Link', options: 'Healthcare Practitioner', reqd: 1 },
			{ fieldname: 'anaesthetist_name', label: 'Anaesthetist Name', fieldtype: 'Link', options: 'Healthcare Practitioner', reqd: 1 },
		],

		primary_action_label: 'Save',
		primary_action: function () {
			var patientName = dialog.get_value('patient_name');
			var surgeryName = dialog.get_value('surgery_name');
			var surgeonName = dialog.get_value('surgeon_name');
			var anaesthetistName = dialog.get_value('anaesthetist_name');

			console.log('Patient Name:', patientName);
			console.log('Surgery Name:', surgeryName);
			console.log('Surgeon Name:', surgeonName);
			console.log('Anaesthetist Name:', anaesthetistName);

			// Add the values to the timeline
			var container = document.getElementById('timeline');
			var timeline = new vis.Timeline(container);
			var groups = new vis.DataSet([]);
			dialog.hide();
		},
	});

	dialog.show();

}

let renderBookings = async () => {

	let bookings = await frappe.call({
		method: "gch_theatre.services.render_bookings",
	});
	console.log(bookings)
	let bookings_list = bookings.message;
	return bookings_list;
}

TheatreBookings = Class.extend({

	init: function (wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: 'Theatre Bookings',
			single_column: true
		});
		this.showTimeline();
		this.make();
	},



	make: async function () {

		let bookings_list = await renderBookings();
		let theatre_bookings = bookings_list?.bookings
		let booking_date = bookings_list?.date
		this.booking_date = booking_date;

		var me = this;
		me.page.main.html(frappe.render_template('theatre_bookings', this)).html();
		let bookings = me.page.main.find(".bookings-list");
		bookings.empty();

		theatre_bookings.forEach(function (booking) {

			let patient = booking.patient_name;
			let surgery_name = booking.surgery_name;
			let surgeon = booking.surgeon_name;
			let anaesthetist = booking.anaesthetist_name;
			let surgery_start_time = booking.surgery_start_time;
			let theatre_name = booking.theatre_name

			let booking_html = `
				<div class="level list-row">
					<div class="level-left ellipsis indicator-pill">
						<div class="list-row-col ellipsis list-subject level">
							<input class="level-item list-row-checkbox hidden-xs" type="checkbox" data-name=${patient}>
							<span class="level-item" style="margin-bottom: 1px;">
								<span class="like-action not-liked" data-name="${patient}" data-doctype="Patient" data-liked-by="null"
									title=""></span>
								<span class="likes-count"></span>
							</span>
							<div style="flex-direction:column; display:flex;">
								<span class="level-item bold ellipsis" style="display:flex; flex-direction:column;" title=${patient}>
									<a class="ellipsis" href="/app/patient/${patient}" title=${patient} data-doctype="Patient"
										data-name="${patient}">
										${patient}
									</a>
								</span>
							</div>
						</div>
						<div class="list-row-col ellipsis hidden-xs ">
							<span class="ellipsis" title="Surgeon: ${surgeon}">
								<a  class="filterable ellipsis"
									data-filter="surgeon,=,${surgeon}">
									${surgeon}
								</a>
							</span>
						</div>
						<div class="list-row-col ellipsis hidden-xs ">
							<span class="ellipsis" title="Anaesthetist:  ${anaesthetist}">
								<a class="filterable ellipsis" data-filter="gch_patient_age,=,patient">
									${anaesthetist}
								</a>
							</span>
						</div>
						<div class="list-row-col ellipsis hidden-xs">
							<span class="ellipsis" title="Surgery Name: ${surgery_name}">
								<a class="filterable ellipsis">
									${surgery_name}
								</a>
							</span>
						</div>
						<div class="list-row-col ellipsis hidden-xs ">
							<span class="ellipsis" title="Surgery time: ${surgery_start_time}">
								<a class="filterable ellipsis" data-filter="patient_type">
									${surgery_start_time}
								</a>
							</span>
						</div>
						<div class="list-row-col ellipsis hidden-xs ">
							<span class="ellipsis" title="Theatre Name: ${theatre_name}">
								<a class="filterable ellipsis" data-filter="patient_type">
									${theatre_name}
								</a>
							</span>
						</div>
					</div>
				</div>
			`;
			bookings.append(booking_html);
		});
	},
	showTimeline: async function () {
		frappe.require('/assets/gch_theatre/visjs/vis-timeline-graph2d.css', () => {
			frappe.require(['/assets/gch_theatre/visjs/vis-timeline-graph2d.min.js'], async () => {

				var container = document.getElementById('timeline');
				var timeline = new vis.Timeline(container);
				var groups = new vis.DataSet([]);

				let theatreBookingsMsg = await frappe.call({
					method: "gch_theatre.services.render_timeline",
				})
				console.log(theatreBookingsMsg)
				let theatreBookings = theatreBookingsMsg.message?.bookings;

				var timelineData = [];

				// groups should be fetched from the theatreBookings `theatre` attribute
				theatreBookings.forEach(function (booking) {
					//extract the `theatre` attr
					var theatre_name = booking?.theatre_name;
					//check if the group already exists
					var group = groups.get(theatre_name);
					//if not, create a new group
					if (!group) {
						group = {
							id: theatre_name,
							content: theatre_name,
							value: groups.length + 1,
							className: 'openwheel'
						};
						groups.add(group);
					}
					var startTime = moment(booking?.surgery_start_time, 'YYYY-MM-DD HH:mm:ss').toDate();
					var endTime = moment(booking?.surgery_end_time, 'YYYY-MM-DD HH:mm:ss').toDate();

					var tooltipContent =
						'<strong>Patient:</strong> ' + booking?.patient_name +
						'<br><strong>Surgeon:</strong> ' + booking?.surgeon_name +
						'<br><strong>Anaesthetist:</strong> ' + booking?.anaesthetist_name +
						'<br><strong>Surgery:</strong> ' + booking?.surgery_name +
						'<br><strong>Start:</strong> ' + moment(startTime).format('LT') +
						'<br><strong>End:</strong> ' + moment(endTime).format('LT');

					timelineData.push({
						id: booking.name, // Create a unique ID for each booking
						content: booking.patient_name + ' - ' + booking.surgery_name,
						start: startTime,
						group: booking.theatre_name,
						end: endTime,
						title: tooltipContent

					});

				})


				var options = {
					editable: true,
					orientation: 'top',
					stack: true,
					// start: '2021-01-01',
					// end: '2021-12-31',
					// zoomMin: 1000 * 60 * 60 * 24 * 31,
					// zoomMax: 1000 * 60 * 60 * 24 * 31 * 12,
					zoomable: true,
					selectable: true,
					showCurrentTime: true,
					groupOrder: function (a, b) {
						return a.value - b.value;
					},
					groupOrderSwap: function (a, b, groups) {
						var v = a.value;
						a.value = b.value;
						b.value = v;
					},
					groupEditable: true,
					onAdd: function (item, callback) {
						console.log('onAdd', item);
						openBookingModal(item);
						callback(item); // send back adjusted new item
						console.log(item)
					}

				}

				timeline.setOptions(options);
				timeline.setGroups(groups);
				timeline.setItems(timelineData);
			});
		})



	},
});