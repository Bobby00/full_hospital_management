// Copyright (c) 2024, Redward and contributors
// For license information, please see license.txt

frappe.ui.form.on('Patient History', {
	refresh: function(frm) {

        // Custom button to navigate to inpatient record
        if (cur_frm.doc.inpatient_record) {

            frm.add_custom_button(__("Inpatient Record"), () => {
                window.location.href = "/app/inpatient-record/"+ cur_frm.doc.inpatient_record
            })

        }
        
            

        frappe.require(
            "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
            () => {
              handleHighlightedMenu(cur_frm);
            }
        );

        // Auto generate history complaints rows
        let list1 = ["Fever", "Chest Pain", "Snoring", "Leg Swelling", "Abdominal Pain", "Vomiting", "Constipation", "Dysuria",
                    "Oliguria", "Irritability", "Convulsions", "Eye Discharge", "Ear Discharge", "Allergies"]

        let list2 = ["Cough", "Difficulty in Breathing", "Sweating", "Dysphagia", "Anorexia", "Diarrhoea", "Urinary Frequency",
        "Discolored Urine", "Headache", "Altered Conciousness", "Eye Pain", "Ear Pain", "Skin Rash", "Injuries"]


        if(cur_frm.doc.__islocal && !cur_frm.doc.complaints_1) {

            list1.forEach((item) => {
                console.log(item)

                let row = cur_frm.add_child("complaints_1")
                row.description = item

            } )

            cur_frm.refresh_field("complaints_1")

        }


        if(cur_frm.doc.__islocal && !cur_frm.doc.complaints_2) {

            list2.forEach((item) => {
                console.log(item)

                let row = cur_frm.add_child("complaints_2")
                row.description = item

            } )

            cur_frm.refresh_field("complaints_2")

        }
        

        $('.row-index').css({ "display": "none" });
        $('.grid-footer').css({ "display": "none" });

        // Check if ward, consulting doctor and triage information is available
        if (cur_frm.doc.inpatient_record) {

            frappe.db.get_doc("Inpatient Record", cur_frm.doc.inpatient_record).then((res) => {

                console.log(res)

                if (!cur_frm.doc.wardroombed) {
                    cur_frm.set_value("wardroombed", res.ward_station + "/" + res.room_no + "/" + res.bed_number);
                }

                if (!cur_frm.doc.weight) {
                    let latest_anthro = res.anthropometry_details[res.anthropometry_details.length -1]
                    let latest_temp = res.vital_signs_table[res.vital_signs_table.length - 1]

                    cur_frm.set_value("weight", latest_anthro.weight_in_kilograms)
                    cur_frm.set_value("height", latest_anthro.height_in_centimeters)
                    cur_frm.set_value("bsa", latest_anthro.bsa)
                    cur_frm.set_value("bmi", latest_anthro.bmi)
                    cur_frm.set_value("temperature", latest_temp.patient_encounter_temperature)
                }

            })
        }
        

	}
});
