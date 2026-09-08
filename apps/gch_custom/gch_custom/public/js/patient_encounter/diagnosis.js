let diagnosis_length_checker = 0;

const handle_roles = (frm) => {
    console.log('handling roles');
    /**
     * GCH-Doctor
     * - Make Diagnosis Editable
     * 
     * GCH-Pharmacist
     * - Make Diagnosis Read Only
     * 
     */
    let is_doctor = frappe.user_roles.includes('GCH-Doctor')
    let is_pharma = frappe.user_roles.includes('GCH-Pharmacy')
    frm.toggle_display("dont_issue", is_pharma);
    handle_fields(frm, is_doctor, is_pharma)

    // frm.toggle_display()

}


const handle_fields = (frm, is_doctor, is_pharma) => {
    var medication = frappe.meta.get_docfield("Doctor Prescription Table", "medication", frm.doc.name);
    var refillable = frappe.meta.get_docfield("Doctor Prescription Table", "refillable", frm.doc.name);
    var refill_section = frappe.meta.get_docfield("Doctor Prescription Table", "refill_section", frm.doc.name);
    
    var prescription_frequency = frappe.meta.get_docfield("Doctor Prescription Table", "pharmacy_frequency", frm.doc.name)
    var dose = frappe.meta.get_docfield("Doctor Prescription Table", "pharmacy_dose", frm.doc.name)
    var duration = frappe.meta.get_docfield("Doctor Prescription Table", "pharmacy_duration", frm.doc.name)



    console.log(medication)
    if (is_doctor) {
        console.log('Is Doctor True')
        medication.hidden = 1;
        refillable.hidden = 1;
        refill_section.hidden = 1;
        prescription_frequency.hidden = 1;
        dose.hidden = 1;
        duration.hidden = 1;
    }
    if (is_pharma) {
        console.log('Is Pharma')
        medication.hidden = 0;
        refillable.hidden = 0;
        // refill_section.hidden = 1;
        prescription_frequency.hidden = 0;
        dose.hidden = 0;
        duration.hidden = 0;
    }
    frm.refresh_fields();

}
const fetch_guidelines = (frm) => {
    /**
     * Handles Fetching of GCH Guideline Mappings based on the patient Diagnosis
     */
    console.log("fetching guidelines")
    frappe.call({
        type: "POST",
        url: `${window.location.origin}/api/method/gch_custom.services.query_encounter_diagnoses`,
        args: {
            encounter_number: frm.doc.name,
        },
        callback: function (res) {
            let { template_guidelines } = res.message;
            console.log('guidelines', res.message)
            frm.clear_table("gch_standard_treatment_guideline_mapping");
            console.log(template_guidelines.length);
            template_guidelines.forEach((guideline) => {
                let child = {
                    medical_code: guideline.medical_code,
                    standard_treatment: guideline.name,
                    code: guideline.code,
                    description: guideline.description,
                    formula: guideline.preparation,
                    treatment_option: guideline.preparation,
                    generic_drug: guideline.generic_drug
                };
                frm.add_child("gch_standard_treatment_guideline_mapping", child);
            });
            if (template_guidelines.length > 0) {
                console.log('Guidelines found')
            }

        },
    });
}


const handle_diagnosis_table = (frm) => {
    console.log('Handle Diagnosis Table');
    frm.set_df_property("gertrudes_standard_treatment_guidelines_med_doses", "hidden", 1); //Hide redundant Mapping section. Deleting this section seems to raise more issues. Workaround.
    frm.refresh_field("gertrudes_standard_treatment_guidelines_med_doses");

    handle_roles(frm);

    let diagnoses_len = frm.doc.diagnosis_table?.length;
    let cur_clinic = frm.doc.clinic

    if (diagnoses_len > 0 || cur_clinic == "Walk-In - GCH") {
        console.log('Diagnosis Table has data');
        /**
         * 1. Fetch Guidelines
         * 2. Show Mapping Section
         * 3. Show Prescription Section
         */
        if (frm.doc.name && !frm.is_new()) {
            fetch_guidelines(frm);
        }
        frm.set_df_property("gertrudes_standard_treatment_guidelines_med_doses", "hidden", 1); //Hide redundant Mapping section. Deleting this section seems to raise more issues. Workaround.
        frm.refresh_field("gertrudes_standard_treatment_guidelines_med_doses");
        frm.set_df_property("prescription_details_section", "hidden", 0);
        // Hide mapping section for pharma
        if (frappe.user_roles.includes('GCH-Pharmacy')) {
            frm.set_df_property("gch_standard_treatment_guideline_mapping", "read_only", true);
            frm.set_df_property("gch_standard_treatment_guideline_mapping", "hidden", 1);
            frm.refresh_field("gch_standard_treatment_guideline_mapping");
        }

        frm.set_df_property("prescription_table", "read_only", false);
        frm.set_df_property("prescription_table", "hidden", false);

        frm.refresh_field("prescription_details_section");
        frm.refresh_field("gch_standard_treatment_guideline_mapping");
        frm.refresh_field("prescription_table");

    }
    if (diagnoses_len < 1 && cur_clinic != "Walk-In - GCH") {
        /**
         * 1. Hide Mapping Section
         * 2. Hide Prescription Section
         */

        console.log("no diagnosis data");
        frm.set_df_property("gertrudes_standard_treatment_guidelines_med_doses", "hidden", 1); //Hide redundant Mapping section. Deleting this section seems to raise more issues. Workaround.
        frm.refresh_field("gertrudes_standard_treatment_guidelines_med_doses");
        frm.set_df_property(
            "gch_standard_treatment_guideline_mapping",
            "read_only",
            true
        );
        frm.set_df_property(
            "gch_standard_treatment_guideline_mapping",
            "hidden",
            true
        );
        frm.set_df_property("prescription_details_section", "hidden", 0);
        frm.set_df_property("prescription_table", "read_only", false);
        frm.set_df_property("prescription_table", "hidden", false);
        frm.refresh_field("gch_standard_treatment_guideline_mapping");
        frm.refresh_field("prescription_details_section");
        frm.refresh_field("prescription_table");
    }


}
