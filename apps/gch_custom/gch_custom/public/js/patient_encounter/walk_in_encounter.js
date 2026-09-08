const field_list = [
  "emergency_flagging",
  "priority_flagging",
  "anthropometry",
  "vital_signs",
  "growth_monitoring",
  "wellbaby_audiology",
  // "allergies",
  "nutrition_screening",
  "triage_notes",
  "nursing_diagnosis",
  "immunization",
  "vaccination_record",
  "assessment_tools",
  "traige_drugs_administered",
  "encounter_history",
  "physical_examinations",
  "plan_of_action",
  "codification",
  "service_referrals",
  "out_patient_discharge",
];

const review_field_list = [
  "emergency_flagging",
  "priority_flagging",
  "anthropometry",
  "vital_signs",
  "growth_monitoring",
  "wellbaby_audiology",
  // "allergies",
  "nutrition_screening",
  "triage_notes",
  "nursing_diagnosis",
  "immunization",
  "vaccination_record",
  "assessment_tools",
  "traige_drugs_administered",
]

const handle_walk_in = (frm) => {
  frappe.require("/assets/gch_custom/js/gch_utilities/index.js", () => {
    // if (cur_frm.doc.clinic.includes("Walk-In") && cur_frm.doc.workflow_state !=  "Pending Procedure") {
    //   field_list.forEach((field) => {
    //     toggle_permission(frm, field, true);
    //   });
    // }

    if(
      cur_frm.doc.clinic.includes("Results")
    ) {
      review_field_list.forEach((field) => {
        toggle_permission(frm, field, true);
      })
      cur_frm.set_df_property("plan_of_action", "hidden", false);
      cur_frm.refresh_field("plan_of_action");

      cur_frm.set_df_property("patient_plan_of_action_notes", "hidden", false);
      cur_frm.refresh_field("patient_plan_of_action_notes");
    }

    if (
      cur_frm.doc.clinic.includes("Walk-In") &&
      cur_frm.doc.workflow_state == "Pending Procedure"
    ) {
      console.log("Herereee Wal Procedure");
      field_list.forEach((field) => {
        toggle_permission(frm, field, true);
      });
      cur_frm.set_df_property("triage_notes", "hidden", false);
      cur_frm.refresh_field("triage_notes");
    } else if (
      cur_frm.doc.clinic.includes("Walk-In") &&
      cur_frm.doc.workflow_state == "Pending Doctor"
    ) {
      console.log("Herereee Wal Procedure");
      field_list.forEach((field) => {
        toggle_permission(frm, field, true);
      });
      cur_frm.set_df_property("encounter_history", "hidden", false);
      cur_frm.refresh_field("encounter_history");
    } else if (
      cur_frm.doc.clinic.includes("Walk-In") &&
      (cur_frm.doc.workflow_state != "Pending Doctor" ||
        cur_frm.doc.workflow_state != "Pending Procedure")
    ) {
      // console.log("Herereee Wal Procedure");
      field_list.forEach((field) => {
        toggle_permission(frm, field, true);
      });
      // cur_frm.set_df_property("encounter_history", "hidden", false);
      // cur_frm.refresh_field("encounter_history");
    } else {
      // now make them visible
      field_list.forEach((field) => {
        toggle_permission(frm, field, false);
      });
    }
  });
};
