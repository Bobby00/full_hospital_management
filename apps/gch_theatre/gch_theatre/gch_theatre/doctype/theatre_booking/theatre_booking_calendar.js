frappe.views.calendar["Theatre Booking"] = {
	fields: [
		"surgery_start_time", "surgery_end_time", "name", "patient_name", "theatre", "surgeon_name","docstatus","is_patient_confirmed", "is_finance_team_confirmed", "title"
	],
	field_map: {
		start: "surgery_start_time",
		end: "surgery_end_time",
		id: "name",
		allDay: "all_day",
		title: 'title',
		// status: "is_patient_confirmed",
		docstatus: 1
		// color: "green",
	},
	// style_map: {
	// 	Public: "success",
	// 	Private: "info",
	// },
	gantt: true,
	get_css_class: function(data) {
		console.log(data)
		if(data.is_patient_confirmed===1 && data.is_finance_team_confirmed === 1) {
			return "success";
		} else if((data.is_patient_confirmed===1 && data.is_finance_team_confirmed === 0) || (data.is_patient_confirmed===0 && data.is_finance_team_confirmed === 1)) {
			return "warning";
		} else {
			return "info";
		}
	},
	filters: [
		{
			"fieldtype": "Link",
			"fieldname": "theatre",
			"options": "Theatre",
			"label": __("Theatre")
		}
	],
	// get_events_method: "gch_theatre.services.render_bookings"
};