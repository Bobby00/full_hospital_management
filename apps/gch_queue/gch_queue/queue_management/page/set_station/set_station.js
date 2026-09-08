// frappe.pages['set-station'].on_page_load = function (wrapper) {
// 	let d = new frappe.ui.Dialog({
// 		title: 'Enter Your Current Station',
// 		fields: [
// 			{
// 				label: 'Select Station',
// 				fieldname: 'station',
// 				fieldtype: 'Link',
// 				options: 'Healthcare Service Unit'
// 			},

// 		],
// 		primary_action_label: 'Submit',
// 		primary_action(values) {

// 			payload = {
// 				"service_unit": values.station,
// 			}
// 			frappe.call({
// 				method: "gch_queue.services.set_station",
// 				args: payload,
// 				callback: function (r) {
// 					if (r.message.docstatus == 0) {
// 						frappe.set_route("/app");
// 						d.hide();
// 					}
// 					else {

// 					}
// 				}
// 			})

// 		}
// 	});
// 	var page = frappe.ui.make_app_page({
// 		parent: wrapper,
// 		title: 'Set Station',
// 		single_column: true
// 	});
// 	d.show();

// }



frappe.pages['set-station'].on_page_load = function (wrapper) {

	// $('navbar-brand navbar-home').
	$('.navbar ').find('a, button, input, select, textarea, img, container ').prop('disabled', true);
	$('.navbar-brand .navbar-home').prop('disabled', true)
	$('.navbar a').prop('disabled', true);
	$('a').prop('disabled', true)
	$('.navbar a').attr("disabled", "disabled");
	$('.navbar a').css("pointer-events", "none");
	$("#navbar-breadcrumbs").attr("disabled", "disabled");
	$("#navbar-breadcrumbs").css("pointer-events", "none")



	var fields = [
		{
			label: 'Select Station',
			fieldname: 'station',
			fieldtype: 'Link',
			options: 'Healthcare Service Unit',
			reqd: 1
		}
	];

	// Create the form
	var form = $('<div class="set-station-section">').appendTo(wrapper);
	var frm = new frappe.ui.FieldGroup({
		fields: fields,
		parent: form,
		on_submit: function () {
			var values = frm.get_values();
			var payload = {
				"service_unit": values.station
			};

			frappe.call({
				method: "gch_queue.services.set_station",
				args: payload,
				callback: function (r) {
					if (r.message.docstatus == 0) {
						$('.navbar ').find('a, button, input, select, textarea, img, container ').prop('disabled', false);
						$('.navbar-brand .navbar-home').prop('disabled', false)
						$('.navbar a').prop('disabled', false);
						$('a').prop('disabled', false)
						$('.navbar a').attr("disabled", false);
						$('.navbar a').css("pointer-events", "default");
						$("#navbar-breadcrumbs").attr("disabled", false);
						$("#navbar-breadcrumbs").css("pointer-events", "default")
						window.location.href = '/app';

					} else {
					}
				}
			});
		}
	});

	frm.make();

	form.append('<button class="btn btn-primary mt-2 ml-3 btn-block mr-3" style="max-width:140px;">Submit</button>');
	form.find('button').on('click', function () {
		frm.on_submit();
	});
};
