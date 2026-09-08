// frappe.pages['nursing-wards-page'].on_page_load = function (wrapper) {
// 	var page = frappe.ui.make_app_page({
// 		parent: wrapper,
// 		title: 'Nursing Wards',
// 		single_column: true
// 	});
// 	let filter_datetime_label = page.add_field({
// 		fieldtype: 'HTML',
// 		options: '<label><span class="label-area"><b>Show Availability for</b></span></label>'
// 	})
// 	let filter_datetime = page.add_field({
// 		label: 'Show Availability for Date',
// 		fieldtype: 'Datetime',
// 		fieldname: 'datetime',
// 		default: frappe.datetime.now_datetime().toLocaleString(),

// 		change() {
// 			console.log(field.get_value());
// 		}
// 	});

// }

frappe.pages['nursing-wards-page'].on_page_load = function (wrapper) {
	new NursingWardsPage(wrapper);
}

let all_nursing_wards = async () => {
	// console.log(availability);
	let results = await frappe.call({
		method: 'gch_custom.services.nurse_wards',
	})
	return results.message;
}

NursingWardsPage = Class.extend({

	init: function (wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: 'Nursing Wards',
			single_column: true
		});

		let filter_datetime_label = this.page.add_field({
			fieldtype: 'HTML',
			options: '<div class="form-group frappe-control input-max-width"><span class="label-area">Show Bed Availability for:</span></div>',
			//options: '<label><span class="label-area"><b>Show Availability for</b></span></label>'
		});
		let filter_datetime = this.page.add_field({
			label: 'Show Availability for Date',
			fieldtype: 'Datetime',
			fieldname: 'datetime',
			default: frappe.datetime.now_datetime().toLocaleString(),

			change() {
				console.log(field.get_value());
				this.nursing_wards = all_nursing_wards(field.get_value())
			}
		});
		this.make();
	},

	make: async function () {
		this.nursing_wards = await all_nursing_wards();

		$(frappe.render_template('nursing-wards', this)).appendTo(this.page.main);
	}
})