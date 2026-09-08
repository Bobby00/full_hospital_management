frappe.provide('frappe.nursing-ward-overview');

frappe.pages['nursing-ward-overview'].on_page_load = function(wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Nursing Ward Overview',
        single_column: true
	});

    const PAGE_WRAPPER = document.querySelector(".page-body");
    PAGE_WRAPPER.classList.remove("container");
    PAGE_WRAPPER.classList.add("m-4");

    document.querySelector(".layout-main-section").style.padding = "20px";

    let ward_overview = new NursingWardOverview(wrapper);
	$(wrapper).bind('show', ()=> {
		ward_overview.show();
	});

};



let fetch_occupancy_info_doc = async (ward_name) => {
    let occupancy_data = await frappe.call({
        method: "gch_custom.services.list_beds",
        args: {
            ward: ward_name
        },
        callback: (res) => {
            console.log(res, "Occupancy Data =================")        
        }
    })
    return occupancy_data
}

let transfer_patient = (row) => {
    console.log(row);

    console.log(row.dataset.bed_number)

}

window.transfer_patient = transfer_patient



let redirectOrCreate = (row) => {
    let doctype = row.dataset.doctype
    let doc_link = row.dataset.doc_link
    let existing_record = row.dataset.existing_record
    let inpatient_record = row.dataset.inpatient_record

    if (existing_record != "") {
        window.location.href = doc_link + existing_record
    }
    else {
        frappe.route_options = {
        inpatient_record: inpatient_record,
        };
        frappe.new_doc(doctype);

    }


    console.log(doctype, doc_link, existing_record == "", inpatient_record)

}
window.redirectOrCreate = redirectOrCreate

// Fetch Ward Lsit
// function ward_list() {
//     frappe.db.get_list("Nursing Ward").then( (res)=> {
    
//         for (let ward in res) {
//             // console.log(res[ward].name)
//             wards_btn_holder += `<button class="btn">${res[ward].name}</button>`
//         }
    
//     })
//     return wards_btn_holder
// }


// console.log(ward_list(), "here")

class NursingWardOverview {
	constructor(wrapper) {
		this.wrapper = $(wrapper);
		this.page = wrapper.page;
		this.sidebar = this.wrapper.find('.layout-side-section');
		this.main_section = this.wrapper.find('.layout-main-section');
		this.start = 0;
	}

	show() {
        frappe.breadcrumbs.add('Healthcare');
		this.main_section.empty();

		let me = this;

        let wards_btn_holder = ``;

        frappe.call({
            method: "gch_inpatient.gch_inpatient.doctype.nursing_ward.nursing_ward.fetch_nursing_wards",
            async: false,
            args: {},
            callback: function(res) {
                console.log(res);

                for (let ward of res.message) {
                    // Create each button with a unique id or data attribute
                    wards_btn_holder += `<button class='btn btn-primary btn-sm ml-3 ward-btn' data-ward-name="${ward.name}">${ward.name}</button>`;
                }

                // // After generating the buttons, attach event listeners
                // setTimeout(() => {
                //     // Select all the buttons with class 'ward-btn'
                //     document.querySelectorAll('.ward-btn').forEach(button => {
                //         button.addEventListener('click', function() {
                //             let wardName = this.getAttribute('data-ward-name');
                //             console.log(`Ward ${wardName} button clicked!`);

                //              // Remove 'active' class from all buttons
                //             document.querySelectorAll('.ward-btn').forEach(btn => btn.classList.remove('active'));

                //             // Add 'active' class to the clicked button
                //             this.classList.add('active');

                //             // Trigger the action when a button is clicked
                //             wardClicked(wardName);
                //         });
                //     });
                // }, 100);  // Use a small timeout to ensure HTML is rendered before adding event listeners


                setTimeout(() => {
                    const buttons = document.querySelectorAll('.ward-btn');
                    
                    // Check if there's a previously selected ward in local storage
                    const lastSelectedWard = localStorage.getItem('lastSelectedWard');
                    
                    buttons.forEach(button => {
                        let wardName = button.getAttribute('data-ward-name');
                        
                        // If this button matches the last selected ward, add the 'active' class
                        if (wardName === lastSelectedWard) {
                            button.classList.add('active');
                            wardClicked(wardName);  // Optional: trigger any function for pre-selected ward
                        }
        
                        // Add event listener for the button
                        button.addEventListener('click', function() {
                            console.log(`Ward ${wardName} button clicked!`);
        
                            // Remove 'active' class from all buttons
                            buttons.forEach(btn => btn.classList.remove('active'));
                            
                            // Add 'active' class to the clicked button
                            this.classList.add('active');
        
                            // Save the selected ward in local storage
                            localStorage.setItem('lastSelectedWard', wardName);
        
                            // Trigger the action when a button is clicked
                            wardClicked(wardName);
                        });
                    });
                }, 100);  // Delay to ensure HTML is rendered before adding event listeners

            }
        });

        // Define the action when a ward button is clicked
        function wardClicked(wardName) {
            console.log(`Ward selected: ${wardName}`);
            // Perform any action when the ward is selected
            // For example, you can trigger an overview or any other function
            me.start = 0;
            me.ward_id = wardName;
            me.make_ward_overview();
        }

        // Create the Frappe control for displaying the buttons
        let ward = frappe.ui.form.make_control({
            parent: me.main_section,
            df: 
            {
                fieldtype: 'HTML',
                options: wards_btn_holder,  // Set the generated buttons as HTML
                fieldname: 'wards',
                label: 'Select Ward',
                only_select: true,
                change: () => {
                    // Handle change if needed
                }
            }
        });



		ward.refresh();

        // creating div element to hold ward overview information
        this.main_section.append('<div class="ward-information"></div>');

		if (frappe.route_options && !this.ward_id) {
			ward.set_value(frappe.route_options.ward);
			this.ward_id = frappe.route_options.ward;
		}

        
    }

    async make_ward_overview () {
        this.occupancy_info_doc = await fetch_occupancy_info_doc(this.ward_id)

        this.ward_name = this.ward_id.split("-")[1]

        this.occupancy_info_doc = this.occupancy_info_doc.message[0]


        // Getting total number of male and female patient's in ward
        let females = 0
        let males = 0

        let total_beds = 0
        let total_occupied_beds = 0

        if (this.occupancy_info_doc) {
            for (let i in this.occupancy_info_doc.bed_details) {
                // console.log(this.occupancy_info_doc.bed_details[i], "Spawneeeeeeeeeeddddddddddd")
                total_beds += 1

                if (this.occupancy_info_doc.bed_details[i].occupant) {
                    total_occupied_beds += 1

                    if(this.occupancy_info_doc.bed_details[i].occupant.sex == "Female") {
                        females += 1
                        console.log("Female")
                    } else if (this.occupancy_info_doc.bed_details[i].occupant.sex == "Male"){
                        males += 1
                        console.log("Male")
                    }
                }

            }
        }

        this.female_count = females
        this.male_count = males

        this.total_beds = total_beds
        this.total_occupied_beds = total_occupied_beds
        this.total_unoccupied_beds = total_beds - total_occupied_beds

        this.today_date = new Date().toLocaleString();


        // // Fetching matron notes if exists for inpatient record
        // if (this.occupancy_info_doc) {
        //     for (let i in this.occupancy_info_doc.bed_details) {

        //         if (this.occupancy_info_doc.bed_details[i].inpatient_record) {
        //             // Check if Matron notes record exists
        //             frappe.db.get_value("Matron Notes", {"inpatient_record": this.occupancy_info_doc.bed_details[i].inpatient_record.name}, ['name']).then( (res) => {
        //                 console.log(res, "Matron NOtes Doc")
        //             })
        //         }


        //     }
        // }
          
          
        
        // console.log(this.occupancy_info_doc, "Here==================")

        // console.log(this.occupancy_info_doc, "OCCUPANCY =======================")

        this.wrapper.find('.ward-information').empty()
        $(frappe.render_template('nursing_ward_overview', this)).appendTo(this.wrapper.find('.ward-information'));
		// this.main_section.empty().append(frappe.render_template('patient-dashboard', this));
        // this.setup_filters();
		// this.setup_documents();
		// this.show_patient_info();
		// this.setup_buttons();
		// this.show_patient_vital_charts('bp', 'mmHg', 'Blood Pressure');
	}

}