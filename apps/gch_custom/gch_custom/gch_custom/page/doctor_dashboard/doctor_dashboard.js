frappe.pages['doctor-dashboard'].on_page_load = function(wrapper) {
	new DoctorDashboardPage(wrapper);
}

let pending_prescriptions = async () => {
   let prescriptions_data = await frappe.call({
      method:"gch_custom.services.draft_prescriptions"
   })
   console.log(prescriptions_data)
   return prescriptions_data.message
}

let fetch_scheduled = async() =>  {
   return []
}

let patient_with_doc = async () => {
   return {}
}

// let patients_on_queue = async () => {
//    let queue_data = await frappe
//    .call({
//      method:
//        "gch_queue.services.doctor_queue",
//    //   "gch_queue.services.render_queue",
//    })
//    console.log(queue_data)
//    return queue_data.message;
//
//}

let patients_on_queue = async () => {
   return []
}

let completed_consultations = async () => {
   return []
}

let diagnostic_report_status = async () => {
   return []
}


DoctorDashboardPage = Class.extend({
init: function(wrapper) {
   this.page = frappe.ui.make_app_page({
	   parent: wrapper,
	   title: "Doctor Dashboard",
	   single_column: true
   });
   this.make();

},


make: async function() {
   this.scheduled = await fetch_scheduled();
   this.patients_on_queue = await patients_on_queue();
   this.pending_prescriptions = await pending_prescriptions();
   $(frappe.render_template("doctor-dashboard", this)).appendTo(this.page.main);
   
}
})