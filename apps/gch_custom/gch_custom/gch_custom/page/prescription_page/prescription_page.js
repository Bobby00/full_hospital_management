frappe.pages['prescription-page'].on_page_load = function (wrapper) {
	new PrescriptionPage(wrapper);
}


PrescriptionPage = Class.extend({
	init: function (wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: "Prescription Page",
			single_column: true
		});
		this.make();

	},


	make: async function () {
		$(frappe.render_template("prescription_page", this)).appendTo(this.page.main);
	}
})