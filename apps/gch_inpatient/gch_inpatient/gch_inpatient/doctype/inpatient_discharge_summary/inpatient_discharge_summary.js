// Copyright (c) 2024, Redward and contributors
// For license information, please see license.txt

frappe.ui.form.on('Inpatient Discharge Summary', {
	refresh: function(frm) {

        // Pull Diagnosis information from inpatient record on creatiom
        if(cur_frm.doc.inpatient_record) {

            frappe.db.get_doc("Inpatient Record", cur_frm.doc.inpatient_record).then( (res) => {
                console.log(res, "Inpatient Record")

                cur_frm.set_value("wardroombed", res.ward_station + "/" + res.room_no + "/" + res.bed_number)
                cur_frm.refresh_field("wardroombed")

                let diagnosis_holder = ''
                let counter = 0

                for (let diagnosis in res.diagnosis_table) {
                    console.log(res.diagnosis_table[diagnosis])
                    counter += 1

                    diagnosis_holder += counter + '. ' + res.diagnosis_table[diagnosis].code + ' : ' + res.diagnosis_table[diagnosis].description + '\n'

                }

                cur_frm.set_value('diagnosis', diagnosis_holder)
                cur_frm.refresh_field('diagnosis')

            } )

        }

        let medication_holder = ``

        // Pull latests discharge medication from inpatient record
        frappe.db.get_doc("Inpatient Record", cur_frm.doc.inpatient_record).then((res) => {
            console.log(res, "Inpatient Record")

            if(res.inpatient_prescription_table.length > 0) {
                for (let medication in res.inpatient_prescription_table) {
                    
                    let item = res.inpatient_prescription_table[medication]


                    if (item.indication == "Discharge") {
                        medication_holder += 
                        `
                        Generic drug name: ${item.generic_drug_name ? item.generic_drug_name: "No generic selected"}
                        Item Route: ${item.route ? item.route: "No route selected"}
                        Item Dose: ${item.dose ? item.dose: "No item dose selected"} ${item.dose_uom ? item.dose_uom: "No item dose uom selected"}
                        Item Prescription: ${item.prescription_frequency ? item.prescription_frequency : 'No prescription frequency selected'}  
                        item Duration: ${item.duration ? item.duration : "No duration selected"} days 
                        Item Remarks: ${item.remarks ? item.remarks : "No remarks"} \n\n
                        `

                    }


                }
            }

            cur_frm.set_value("medication", medication_holder)

            console.log(medication_holder, "DISCHAGE MEDDDDDDDDDDDSSSSSSSSSSSSS")

        })

	},
    date_of_birth: (frm) => {
        console.log("here")
        if (cur_frm.doc.inpatient_record) {
            // Calculate current patient age at the point of creation
            let calculate_age = function (birth) {
                let ageMS = Date.parse(Date()) - Date.parse(birth);
                let gch_patient_age = new Date();
                gch_patient_age.setTime(ageMS);
                let years = gch_patient_age.getFullYear() - 1970;
            
                return `${years} ${__("Year(s)")} ${gch_patient_age.getMonth()} ${__(
                "Month(s)"
                )} ${gch_patient_age.getDate()} ${__("Day(s)")}`;
            };
            console.log("here....", cur_frm.doc.date_of_birth)
            cur_frm.set_value("age", calculate_age(cur_frm.doc.date_of_birth))
        }
    }
});
