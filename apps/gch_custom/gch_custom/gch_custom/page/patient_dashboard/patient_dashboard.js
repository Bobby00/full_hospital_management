frappe.provide('frappe.patient-dashboard');

frappe.pages['patient-dashboard'].on_page_load = function(wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __('Patient Dashboard')
	});

	let patient_dashboard = new PatientDashboard(wrapper);
	$(wrapper).bind('show', ()=> {
		patient_dashboard.show();
	});
};

let calculate_age = function (birth) {
    let ageMS = Date.parse(Date()) - Date.parse(birth);
    let gch_patient_age = new Date();
    gch_patient_age.setTime(ageMS);
    let years = gch_patient_age.getFullYear() - 1970;

    return `${years} ${__("Year(s)")} ${gch_patient_age.getMonth()} ${__(
    "Month(s)"
    )} ${gch_patient_age.getDate()} ${__("Day(s)")}`;
};

let fetch_patient_data = async (patient_name) => {
    // FETCH DATA FROM ENDPOINTS
    let data = await frappe.call({
        method: 'gch_custom.services.rest.fetch_patient_data',
        args: {
            "patient": patient_name
        },
        callback: function (r) {
          console.log(r);
        }
    })

    return data
}

let fetch_encounter_data = async (patient_name) => {
    // FETCH DATA FROM ENDPOINTS
    let encounter_data = await frappe.call({
        method: 'gch_custom.services.rest.fetch_encounter_data',
        args: {
            "patient": patient_name
        },
        callback: function (r) {
          console.log(r);
        }
    })

    return encounter_data
}


let fetch_significant_diagnosis = async (encounter_list) => {
    let significant_diagnosis = frappe.call({
        method: "gch_custom.services.rest.fetch_significant_diagnosis",
        args: {
            "enc_list": encounter_list 
        },
        callback: function (r) {
            console.log(r, "diagnosis_data")
        }
    })

    return significant_diagnosis
}

let fetch_chronic_medication = async (encounter_list) => {
    let chronic_medication = frappe.call({
        method: "gch_custom.services.rest.fetch_chronic_medication",
        args: {
            "enc_list": encounter_list 
        },
        callback: function (r) {
            console.log(r, "chronic_med_data")
        }
    })

    return chronic_medication
}

let fetch_patient_history = async (encounter_list) => {
    let patient_history = frappe.call({
        method: "gch_custom.services.rest.fetch_patient_history",
        args: {
            "enc_list": encounter_list 
        },
        callback: function (r) {
            console.log(r, "Patient History")
        }
    })

    return patient_history
}

let fetch_patient_allergies = async (encounter_list) => {
    let patient_allergies = frappe.call({
        method: "gch_custom.services.rest.fetch_patient_allergies",
        args: {
            "enc_list": encounter_list
        },
        callback: function (r) {
            console.log(r, "Patient Allergies")
        }
    })

    return patient_allergies
}

class PatientDashboard {
	constructor(wrapper) {
		this.wrapper = $(wrapper);
		this.page = wrapper.page;
		this.sidebar = this.wrapper.find('.layout-side-section');
		this.main_section = this.wrapper.find('.layout-main-section');
		this.start = 0;
	}

	show() {
        frappe.breadcrumbs.add('Healthcare');
		this.sidebar.empty();

		let me = this;
		let patient = frappe.ui.form.make_control({
			parent: me.sidebar,
			df: {
				fieldtype: 'Link',
				options: 'Patient',
				fieldname: 'patient',
				placeholder: __('Select Patient'),
				only_select: true,
				change: () => {
					me.patient_id = '';
					if (me.patient_id != patient.get_value() && patient.get_value()) {
						me.start = 0;
						me.patient_id = patient.get_value();
                        // console.log(me.patient_id)
                        this.patient_id = me.patient_id
						me.make_patient_profile();
					}
				}
			}
		});
		patient.refresh();

		if (frappe.route_options && !this.patient_id) {
			patient.set_value(frappe.route_options.patient);
			this.patient_id = frappe.route_options.patient;
		}

		this.sidebar.find('[data-fieldname="patient"]').append('<div class="patient-info"></div>');
        
    }

    async make_patient_profile () {
		// this.page.set_title(__('Patient History'));
        this.patient_data = await fetch_patient_data(this.patient_id)
        this.encounter_data = await fetch_encounter_data(this.patient_id)

        // console.log(this.encounter_data, "encounter_data////////////////////")

        // Latest Ecounter
        this.latest_enc = this.encounter_data.message.at(-1)

        // console.log(this.encounter_data, "Latest...........")

        // console.log(this.encounter_data, "Data.............")

        let middle_name
        
        if (this.patient_data.message.middle_name) {
            middle_name = this.patient_data.message.middle_name.toUpperCase()
        } else {
            middle_name = " "
        }
        
        // Patient Name to uppercase
        this.first_name = this.patient_data.message.first_name.toUpperCase() || " "
        this.middle_name = middle_name
        this.last_name = this.patient_data.message.last_name.toUpperCase() || " "

        // Calculate patient age GCH format
        this.patient_age = calculate_age(this.patient_data.message.dob)

        
        // Fetching Medical cover scheme
        if (this.patient_data.message.patient_medical_cover_details.length < 1) {
            this.patient_insurance_scheme = " "
        } else if (this.patient_data.message.patient_medical_cover_details.length > 0) {
            this.patient_insurance_scheme = this.patient_data.message.patient_medical_cover_details[0].insurance__scheme.toUpperCase()
        }


        // Fetching Parent Names
        let parents = this.patient_data.message.parents
        this.father_name = " "
        this.mother_name = " "

        for (var i = 0; i < parents.length; ++i) {
            if(parents[i].relationship == 'Father') {
                this.father_name = parents[i].first_name.toUpperCase() + " " + parents[i].last_name.toUpperCase() || " "
            } else if (parents[i].relationship == 'Mother') {
                this.mother_name = parents[i].first_name.toUpperCase() + " " + parents[i].last_name.toUpperCase() || " "
            }

            // console.log(parents[i].first_name + ", " + parents[i].relationship);
        }

        // Encounter list for filtering records fetched
        let enc_data = this.encounter_data.message
        let enc_list = []
        for (i in enc_data) {
            enc_list.push(enc_data[i].name)
            // console.log(enc_data[i].name)
        }
        // console.log(enc_list)


        // Fetching Significant Diagnosis through codification table
        this.significant_diagnosis = await fetch_significant_diagnosis(enc_list)

        let significant_diag_list = []

        let significant_diag = this.significant_diagnosis.message

        // console.log(significant_diag.length)

        // console.log(this.significant_diagnosis)

        var filtered = significant_diag.filter(function(element, index, array) {

            if (index % 2 === 1 && element.length < 1) {
                // pass
            } else {
                return (index % 2 === 1)
            }
            
        });
        for (let i in filtered) {
            // console.log(filtered[i].length, "data here.......")
            if (filtered[i].length == 1) {
                significant_diag_list.push(filtered[i][0])
            } else if (filtered[i].length > 1) {
                for(let r in filtered[i]) {
                    significant_diag_list.push(filtered[i][r])
                }
            }
        }
        // console.log(significant_diag_list, "the final list///////")

        // Removing duplicate diagnosis
        function getUniqueListBy(arr, key) {
            return [...new Map(arr.map(item => [item[key], item])).values()]
        }
        significant_diag_list = getUniqueListBy(significant_diag_list, "code")
        this.significant_diag_list = significant_diag_list

        
        // Fetch patient history
        this.patient_history = await fetch_patient_history(enc_list)
        let patient_history_list = []

        let patient_history = this.patient_history.message

        var filtered_history = patient_history.filter(function(element, index, array) {

            if (index % 2 === 1 && element.length < 1) {
                // pass
            } else {
                return (index % 2 === 1)
            }
            
        });
        for (let i in filtered_history) {
            // console.log(filtered[i].length, "data here.......")
            if (filtered_history[i].length == 1) {
                patient_history_list.push(filtered_history[i][0])
            } else if (filtered_history[i].length > 1) {
                for(let r in filtered_history[i]) {
                    patient_history_list.push(filtered_history[i][r])
                }
            }
        }
        this.most_recent_patient_history = patient_history_list.at(-1) || " "

        
        // Fetching Allergies from all encounters
        this.patient_allergies = await fetch_patient_allergies(enc_list)

        let drug_allergy_list = []
        let food_allergy_list = []
        let other_allergy_list = []

        let drug_allergies = this.patient_allergies.message[0]
        let food_allergies = this.patient_allergies.message[1]
        let other_allergies = this.patient_allergies.message[2]

        // console.log(drug_allergies.length)
        // console.log(food_allergies.length)

        // console.log(this.patient_allergies)

        var filtered_drugs = drug_allergies.filter(function(element, index, array) {

            if (index % 2 === 1 && element.length < 1) {
                // pass
            } else {
                return (index % 2 === 1)
            }
            
        });

        var filtered_foods = food_allergies.filter(function(element, index, array) {

            if (index % 2 === 1 && element.length < 1) {
                // pass
            } else {
                return (index % 2 === 1)
            }
            
        });

        var filtered_others = other_allergies.filter(function(element, index, array) {

            if (index % 2 === 1 && element.length < 1) {
                // pass
            } else {
                return (index % 2 === 1)
            }
            
        });

        for (let i in filtered_drugs) {
            // console.log(filtered[i].length, "data here.......")
            if (filtered_drugs[i].length == 1) {
                drug_allergy_list.push(filtered_drugs[i][0])
            } else if (filtered_drugs[i].length > 1) {
                for(let r in filtered_drugs[i]) {
                    drug_allergy_list.push(filtered_drugs[i][r])
                }
            }
        }

        for (let i in filtered_foods) {
            // console.log(filtered[i].length, "data here.......")
            if (filtered_foods[i].length == 1) {
                food_allergy_list.push(filtered_foods[i][0])
            } else if (filtered_foods[i].length > 1) {
                for(let r in filtered_foods[i]) {
                    food_allergy_list.push(filtered_foods[i][r])
                }
            }
        }

        for (let i in filtered_others) {
            // console.log(filtered[i].length, "data here.......")
            if (filtered_others[i].length == 1) {
                other_allergy_list.push(filtered_others[i][0])
            } else if (filtered_others[i].length > 1) {
                for(let r in filtered_others[i]) {
                    other_allergy_list.push(filtered_others[i][r])
                }
            }
        }
        // console.log(significant_diag_list, "the final list///////")

        drug_allergy_list = getUniqueListBy(drug_allergy_list, "drug_allergy")
        this.drug_allergy_list = drug_allergy_list

        food_allergy_list = getUniqueListBy(food_allergy_list, "drug_allergy")
        this.food_allergy_list = food_allergy_list

        other_allergy_list = getUniqueListBy(other_allergy_list, "other_allergy")
        this.other_allergy_list = other_allergy_list

        // Fetching Encounter with the latest audiology details
        this.latest_audiology = []

        for(var i in this.encounter_data.message) {
            if(this.encounter_data.message[i].done_by) {
                this.latest_audiology = this.encounter_data.message[i] || " "
            }
        }
        // console.log(this.latest_audiology, "Latest audiology............")


        // Fetching chronic Medication from Doctor Prescription Table
        this.chronic_medication = await fetch_chronic_medication(enc_list)

        let chronic_medication_list = []

        let chronic_med = this.chronic_medication.message

        // console.log(this.chronic_medication)

        var filtered_meds = chronic_med.filter(function(element, index, array) {

            if (index % 2 === 1 && element.length < 1) {
                // pass
            } else {
                return (index % 2 === 1)
            }
            
        });
        
        for (let i in filtered_meds) {
            // console.log(filtered[i].length, "data here.......")
            if (filtered_meds[i].length == 1) {
                chronic_medication_list.push(filtered_meds[i][0])
            } else if (filtered_meds[i].length > 1) {
                for(let r in filtered_meds[i]) {
                    chronic_medication_list.push(filtered_meds[i][r])
                }
            }
        }
        // Removing duplicate diagnosis
        function getUniqueListBy(arr, key) {
            return [...new Map(arr.map(item => [item[key], item])).values()]
        }
        chronic_medication_list = getUniqueListBy(chronic_medication_list, "item_name")
        this.chronic_medication_list = chronic_medication_list

        console.log(this.chronic_medication_list, "Chronicc meds only.....")

        // console.log(this.patient_data.message.gch_patient_age)
        // console.log(parents)

        this.main_section.empty()
        $(frappe.render_template('patient-dashboard', this)).appendTo(this.page.main);
		// this.main_section.empty().append(frappe.render_template('patient-dashboard', this));
        // this.setup_filters();
		// this.setup_documents();
		// this.show_patient_info();
		// this.setup_buttons();
		// this.show_patient_vital_charts('bp', 'mmHg', 'Blood Pressure');
	}

}
