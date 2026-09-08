// Copyright (c) 2024, Redward and contributors
// For license information, please see license.txt

frappe.ui.form.on('Matron Notes', {
	refresh: function(frm) {
        $('.prev-doc, .next-doc').hide();
        // Fetch Latest Vitals and Diagnosis from the inpatient record

        if(cur_frm.doc.inpatient_record) {

            frappe.db.get_doc("Inpatient Record", cur_frm.doc.inpatient_record).then((res) => {

                cur_frm.set_value("ward_room_bed", res.ward_station + "/" + res.room_no + "/" + res.bed_number)
                cur_frm.refresh_field("ward_room_bed")


                console.log(res.diagnosis_table)
                
                if (res.vital_signs_table.length > 0) {

                    cur_frm.set_value("vital_signs_table", "")

                    for (let item in res.vital_signs_table) {


                        let row = res.vital_signs_table[item]

                        let row_data = frm.get_field("vital_signs_table").grid.add_new_row();

                        row_data.patient_encounter_temperature = row.patient_encounter_temperature
                        row_data.patient_encounter_respiratory_rate = row.patient_encounter_respiratory_rate
                        row_data.patient_encounter_percutaneous_oxygen = row.patient_encounter_percutaneous_oxygen
                        row_data.patient_encounter_mean_arterial_pressure = row.patient_encounter_mean_arterial_pressure
                        row_data.patient_encounter_heart_rate_sleeping = row.patient_encounter_heart_rate_sleeping
                        row_data.patient_encounter_heart_rate = row.patient_encounter_heart_rate
                        row_data.patient_encounter_bp_diastolic = row.patient_encounter_bp_diastolic
                        row_data.patient_encounter_bp_systolic = row.patient_encounter_bp_systolic
                        row_data.creation = row.creation
                        row_data.owner = row.owner
                        row_data.recorded_at = row.recorded_at

                    }

                    cur_frm.refresh_field("vital_signs_table")

                }

                if (res.diagnosis_table.length > 0) {

                    cur_frm.set_value("diagnosis", '')

                    let diagnosis_holder = ``

                    for (let item in res.diagnosis_table) {

                        console.log(res.diagnosis_table[item])

                        let row = res.diagnosis_table[item]

                        diagnosis_holder += `${row.code} - ${row.description} \n`

                    }

                    cur_frm.set_value("diagnosis", diagnosis_holder)

                }
                
            })

        }

	},
    inpatient_record: (frm) => {
        console.log("here")
        if (!cur_frm.doc.ward_room_bed) {
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
            console.log("here....")
            cur_frm.set_value("patient_age", calculate_age(cur_frm.doc.age))
        }
    }
});
