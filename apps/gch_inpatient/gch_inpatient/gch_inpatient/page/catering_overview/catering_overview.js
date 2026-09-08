frappe.provide('frappe.catering-overview');

frappe.pages['catering-overview'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Catering Overview',
		single_column: true
	});

    const PAGE_WRAPPER = document.querySelector(".page-body");
    PAGE_WRAPPER.classList.remove("container");
    PAGE_WRAPPER.classList.add("m-4");

    document.querySelector(".layout-main-section").style.padding = "20px";

    let catering_overview = new CateringOverview(wrapper);
	$(wrapper).bind('show', ()=> {
		catering_overview.show();
	});


}


let fetch_meal_order_info_doc = async (ward_name) => {
    let catering_order_data = await frappe.call({
        method: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.fetch_catering_overview_data",
        args: {
            ward: ward_name
        },
        callback: (res) => {
            console.log(res, "Catering Order Data =================")        
        }
    })
    return catering_order_data
}

let fetch_all_catering_items_count = async () => {
    let catering_items_count = await frappe.call({
        method: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.fetch_catering_items_count",
        args: {

        },
        callback: (res) => {
            console.log(res, "items count")
        //   this.all_catering_items_count = res.message

        }
        
    })

    return catering_items_count
}


class CateringOverview {
    constructor(wrapper) {
        this.wrapper = $(wrapper);
        this.page = wrapper.page
        this.sidebar = this.wrapper.find('.layout-side-section');
		this.main_section = this.wrapper.find('.layout-main-section');
		this.start = 0;
    }

    show() {
        frappe.breadcrumbs.add('Healthcare');
		this.main_section.empty();

		let me = this;

		me.make_catering_overview();

        // creating div element to hold ward overview information
        this.main_section.append('<div class="catering-information"></div>');

		// if (frappe.route_options && !this.ward_id) {
		// 	ward.set_value(frappe.route_options.ward);
		// 	this.ward_id = frappe.route_options.ward;
		// }


        ward.refresh()

    }

    async make_catering_overview () {
        this.catering_info_docs = await fetch_meal_order_info_doc(this.ward_id)
        this.catering_items_total_count = await fetch_all_catering_items_count()

        console.log(this.catering_items_total_count, "Total Catering Items...")

        this.ward_name = this.ward_id

        this.catering_info_docs = this.catering_info_docs.message
        this.catering_items_total_count = this.catering_items_total_count.message

        this.total_orders = this.catering_info_docs.length
        
        this.total_completed_orders = 0
        this.total_pending_orders = 0
        this.total_delivered_orders = 0
        this.total_cancelled_orders = 0
        // this.total_catering_items = 0

        for(let item in this.catering_info_docs) {

            console.log(this.catering_info_docs[item], "Here.......")

            item = this.catering_info_docs[item]

            console.log(item.workflow_state)

            if (item.workflow_state == "Cancelled") {
                this.total_cancelled_orders += 1
            }
            else if (item.workflow_state == "Issued") {
                this.total_completed_orders += 1
            }
            else if (item.workflow_state == "Ordered") {
                this.total_pending_orders += 1
            }
            else if (item.workflow_state == "Delivered") {
                this.total_delivered_orders += 1
            }


        }

        this.all_catering_items_count = 0;
        // FETCHING ALL CATERING ITEMS
        frappe.call({
            method: "gch_inpatient.gch_inpatient.doctype.patient_meal_order.patient_meal_order.fetch_catering_items_count",
            args: {

            },
            callback: (res) => {
                console.log(res, "items count")
                this.all_catering_items_count = res.message

            }
        })

        this.current_viewer = frappe.session.user


        console.log(this.catering_info_docs, "Catering Info Docs..............")

        // // Getting total number of male and female patient's in ward
        // let females = 0
        // let males = 0
        // if (this.occupancy_info_doc) {
        //     for (let i in this.occupancy_info_doc.bed_details) {
        //         // console.log(this.occupancy_info_doc.bed_details[i], "Spawneeeeeeeeeeddddddddddd")

        //         if (this.occupancy_info_doc.bed_details[i].occupant) {
        //             if(this.occupancy_info_doc.bed_details[i].occupant.sex == "Female") {
        //                 females += 1
        //                 console.log("Female")
        //             } else if (this.occupancy_info_doc.bed_details[i].occupant.sex == "Male"){
        //                 males += 1
        //                 console.log("Male")
        //             }
        //         }

        //     }
        // }

        // this.female_count = females
        // this.male_count = males
          
          
        
        // console.log(this.occupancy_info_doc, "Here==================")

        // console.log(this.occupancy_info_doc, "OCCUPANCY =======================")

        this.wrapper.find('.catering-information').empty()
        $(frappe.render_template('catering_overview', this)).appendTo(this.wrapper.find('.catering-information'));
		// this.main_section.empty().append(frappe.render_template('patient-dashboard', this));
        // this.setup_filters();
		// this.setup_documents();
		// this.show_patient_info();
		// this.setup_buttons();
		// this.show_patient_vital_charts('bp', 'mmHg', 'Blood Pressure');
	}

}