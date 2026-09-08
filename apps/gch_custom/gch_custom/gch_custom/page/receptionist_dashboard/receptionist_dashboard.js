frappe.pages['receptionist-dashboard'].on_page_load = function (wrapper) {
	new ReceptionistDashboardPage(wrapper);
}

let pending_prescriptions = async () => {
	return []
 }
 
 let fetch_scheduled = async() =>  {
	return []
 }
 
 let patient_with_doc = async () => {
	return {}
 }
 
//  let patients_on_queue = async () => {
// 	let queue_data = await frappe
// 	.call({
// 	  method:
// 		"gch_queue.services.doctor_queue",
// 	//   "gch_queue.services.render_queue",
// 	})
// 	console.log(queue_data)
// 	return queue_data.message;
 
//  }

let patients_on_queue = async () => {
	return []
}

ReceptionistDashboardPage = Class.extend({
	init: function (wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: "Front Office Dashboard",
			single_column: true
		});
		this.make();
	},

make: async function () {
	this.scheduled = await fetch_scheduled();
	this.patients_on_queue = await patients_on_queue();
	$(frappe.render_template("receptionist-dashboard", this)).appendTo(this.page.main);
	}
})