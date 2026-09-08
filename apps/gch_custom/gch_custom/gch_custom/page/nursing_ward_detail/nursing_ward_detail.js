// frappe.provide("frappe.gch_nursing_ward");


var parts = `${window.location.pathname}/`.split('/');
var ward_name = decodeURI(parts.pop() || parts.pop());  // handle potential trailing slash


frappe.pages['nursing-ward-detail'].on_page_load = function (wrapper) {
	// console.log(wrapper)
	new NursingWardDetail(wrapper);
}

frappe.pages['nursing-ward-detail'].onload = function (wrapper) {
	console.log("LOADED")
}

frappe.pages['nursing-ward-detail'].on_page_hide = function (wrapper) {

}



frappe.pages['nursing-ward-detail'].on_page_remove = function(wrapper) {
	console.log('on_page_remove');
}

frappe.pages['nursing-ward-detail'].refresh = function (wrapper) {
	console.log(wrapper)
	// wrapper.refresh()
	// window.location.reload()
	var parts = `${window.location.pathname}/`.split('/');
	ward_name = decodeURI(parts.pop() || parts.pop());  // handle potential trailing slash
	console.log(ward_name);
	// new NursingWardDetailRefresh(wrapper);



	// frappe.views.pageview.show(pagename)
	// new NursingWardDetailRefresh(wrapper);
	// new NursingWardDetail(wrapper).make();

}


var get_nursing_ward_detail = async (nursing_ward) => {
	console.log(nursing_ward);
	let detail = await frappe.db.get_value("Nursing Ward", nursing_ward, ["name", "total_beds", "total_cots","locked_beds"])
	// console.log(detail);
	return detail.message;

}

var get_nursing_ward_occupancy = async (nursing_ward) => {
	let occupancy = await frappe.call({
		method: "gch_custom.services.occupancy",
		args: {
			ward_name: nursing_ward
		}
	})
	console.log(occupancy.message);
	return occupancy.message;
}

NursingWardDetail = Class.extend({
	init: function (wrapper) {
		template_name = "nursing_ward_detail"

		// frappe.views.pageview.show("nursing-ward-detail")
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: `${ward_name} Nursing Ward`,
			single_column: true
		});

		

		this.make();
		// this.page.refresh();
	

	},

	make: async function () {
		console.log(`${ward_name} Nursing Ward`);
		// this.page.refresh();
		// delete locals.Page["nursing-ward-detail"]

		// delete frappe.pages["nursing-ward-detail"]

		// delete frappe.templates[template_name]
		// delete frappe.template.debug[template_name]
		// delete frappe.template.compiled[template_name]

		this.ward_details = await get_nursing_ward_detail(ward_name);
		this.ward_occupancy = await get_nursing_ward_occupancy(ward_name);
		// this.page.refresh()
		console.log(this.page.main.html)
		// this.page.main.remove();
		// this.page.main.html(frappe.render_template(frappe.templates.nursing_ward_detail, {"ward_details":""}));
		this.page.main.html(frappe.render_template(frappe.templates.nursing_ward_detail, this)).html();
		// $(frappe.render_template('nursing_ward_detail', {})).appendTo(this.page.main);
	}
});


NursingWardDetailRefresh = Class.extend({
	init: function (wrapper) {

		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: `${ward_name} Nursing Ward`,
			single_column: true
		});

		this.make(wrapper);

	},

	make: async function (wrapper) {
		this.ward_details = await get_nursing_ward_detail(ward_name);
		// this.page.refresh()
		console.log(this.page.main.html)
		// this.page.main.remove();
		// this.page.main.html(frappe.render_template(frappe.templates.nursing_ward_detail, {"ward_details":""}));
		// this.page.main.html(frappe.render_template(frappe.templates.nursing_ward_detail, this)).html();
	}
});