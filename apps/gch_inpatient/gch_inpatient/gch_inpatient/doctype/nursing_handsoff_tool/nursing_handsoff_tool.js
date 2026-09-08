// Copyright (c) 2023, Redward and contributors
// For license information, please see license.txt
function get_encounter_assessment() {
  frappe.call({
    method: "gch_inpatient.overrides.inpatient_record.encounter_assessments",
    async: false,
    args: {
      encounter: cur_frm.doc.inpatient_record,
    },

    callback: function (data) {
      let assessment = data.message;

      console.log(assessment);

      assessment.forEach((assess) => {
        if (
          assess.assessment_template.includes("Falls") &&
          !cur_frm.doc.falls
        ) {
          cur_frm.set_value("falls", assess.total_score_obtained);
          cur_frm.set_value('falls_link', assess.name)

          console.log(assess);
        } else if (
          assess.assessment_template == "Paedriatic Early Warning" &&
          !cur_frm.doc.pews
        ) {
          cur_frm.set_value("pews", assess.total_score_obtained);
          // Setting falls link
          cur_frm.set_value('pews_link', assess.name)

        } else if (
          assess.assessment_template.includes("Pain") &&
          !cur_frm.doc.pain
        ) {
          cur_frm.set_value("pain", assess.total_score_obtained);
          // setting pain link
          cur_frm.set_value("pain_link", assess.name)
        }

        console.log(assess, "========================");
      });

      //   const clinic = cur_frm.doc.clinic;

      //   let is_walkin = false;

      //   if (cur_frm.doc.clinic.includes("Walk-In") || "Procedure - GCH" || "Results") {
      //     is_walkin = true;
      //   }

      // // // console.log(assessment.length, "Assess length");

      // if (assessment.length > 0) {
      //   // frm.set_df_property("patient_assessment", "reqd", 0);
      //   // frm.refresh_field("patient_assessment");

      //   // Setting the value of the field to the assessment's name, Forces user to save to retain P.A info
      //   cur_frm.set_value("patient_assessment", assessment[0].assessment_template);
      //   cur_frm.refresh_field("patient_assessment");
      //   // frappe.validated = true;
      //   assessment.forEach((assess) => {
      //     if (assess.total_score_obtained > 3) {
      //       item_array.push(
      //         `<tr style="background-color:#ff00000a;">
      //                           <td style = "white-space: nowrap; color:red;">` +
      //         assess.name +
      //         `</td>
      //                           <td style = "white-space: nowrap; color:red;">` +
      //         assess.assessment_template +
      //         `</td>
      //                           <td style = "white-space: nowrap; color:red;">` +
      //         assess.total_score_obtained +
      //         `</td>
      //                           <td style = "white-space: nowrap; color:red;">` +
      //         assess.assessment_date +
      //         `</td>
      //                           <td style = "white-space: nowrap; color:red;">` +
      //         assess.assessment_time +
      //         `</td>
      //                           <td style = "white-space: nowrap;  color:red;">` +
      //         assess.owner +
      //         `</td>
      //                           <td style="color: red;">` +
      //         assess.action +
      //         `</td>

      //                       </tr>`
      //       );
      //     } else {
      //       item_array.push(
      //         `<tr>
      //                           <td style = "white-space: nowrap">` +
      //         assess.name +
      //         `</td>
      //                           <td style = "white-space: nowrap">` +
      //         assess.assessment_template +
      //         `</td>
      //                           <td style = "white-space: nowrap">` +
      //         assess.total_score_obtained +
      //         `</td>
      //                           <td style = "white-space: nowrap">` +
      //         assess.assessment_date +
      //         `</td>
      //                           <td style = "white-space: nowrap">` +
      //         assess.assessment_time +
      //         `</td>
      //                           <td style = "white-space: nowrap">` +
      //         assess.owner +
      //         `</td>
      //                           <td>` +
      //         assess.action +
      //         `</td>

      //                       </tr>`
      //       );
      //     }
      //   });

      //   $(".encounter-assessment").html(item_array);
      // } else if (assessment.length <= 0 && frm.doc.__islocal != 1) {
      //   // Making the field mandatory if no record is found
      //   // // // console.log("No assessment found, Making field required");
      //   // // // console.log("islocal", frm.doc.__islocal);
      //   // frm.set_df_property("patient_assessment", "reqd", 1);
      //   // frm.refresh_field("patient_assessment");
      // }
      //   else if (is_walkin) {
      //     frm.set_df_property("patient_assessment", "reqd", 0);
      //     frm.refresh_field("patient_assessment");
      //   }
    },
  });
}

frappe.ui.form.on("Nursing Handsoff Tool", {
  before_workflow_action: (frm) => {
    console.log("INFO: Before Workflow Action");
    const workflow_state = frm.doc.workflow_state;
    const selected_workflow_action = frm.selected_workflow_action;
    console.log({ workflow_state, selected_workflow_action });
  },
  after_workflow_action: (frm) => {
    console.log("INFO: After Workflow Action");
    const workflow_state = frm.doc.workflow_state;
    if (workflow_state === "Accepted") {
      frappe.call({
        method: "gch_inpatient.services.set_current_primary_nurse",
        args: {
          inpatient_record: frm.doc.inpatient_record,
          primary_nurse: frm.doc.name_of_the_receiving_nurse,
        },
        callback: function (r) {
          console.log(`INFO: ${r.message}`);
          console.log(`INFO: ${frappe.session.user}`);
          if (r.message) {
            frappe.msgprint(__("Primary nurse updated successfully."));
          } else {
            frappe.msgprint(
              __(
                "Something went wrong while updating the primary nurse, please try again."
              )
            );
          }
        },
      });
    }
  },
  refresh: function (frm) {
    frappe.require("/assets/gch_inpatient/js/inpatient_record_utils.js", () => {
        if (cur_frm.doc.workflow_state == "Pending Acceptance") {
          unblock_receiving_nurse(frm);
        } else {
          block_nurse_from_editing(frm);
        }
    });

    // Hiding encounter side nav, but can be reopened
    $(".layout-side-section").css("display", "none");

    // Loading Highlighted Menu
    frappe.require(
        "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
        () => {
          handleHighlightedMenu(cur_frm);
        }
    );

    // Filling age
    if(cur_frm.doc.age == "" || !cur_frm.doc.age) {
        let calculate_age = function (birth) {
            let ageMS = Date.parse(Date()) - Date.parse(birth);
            let gch_patient_age = new Date();
            gch_patient_age.setTime(ageMS);
            let years = gch_patient_age.getFullYear() - 1970;
        
            return `${years} ${__("Year(s)")} ${gch_patient_age.getMonth()} ${__(
            "Month(s)"
            )} ${gch_patient_age.getDate()} ${__("Day(s)")}`;
        };

        let patient_age = calculate_age(cur_frm.doc.dob)

        console.log(patient_age)

        cur_frm.set_value("age", calculate_age(cur_frm.doc.dob))
        cur_frm.refresh_field("age")
    }

    // Pulling Latest Height and Weight
    if(!cur_frm.doc.height || !cur_frm.doc.weight) {
        frappe.db.get_doc("Inpatient Record", cur_frm.doc.inpatient_record,).then( (res) => {
            
            console.log(res, "Res")
            
            let latest_vitals_row = res.anthropometry_details[res.anthropometry_details.length - 1]

            console.log(latest_vitals_row, "Latest vitals row")

            cur_frm.set_value("height_in_centimeters", latest_vitals_row.height_in_centimeters)
            cur_frm.set_value("weight_in_kilograms", latest_vitals_row.weight_in_kilograms)
            
        })
    }


    // Pulling latest vitals data
    if (cur_frm.doc.__islocal && cur_frm.doc.inpatient_record) {
      frappe.call({
        method:
          "gch_inpatient.gch_inpatient.doctype.nursing_handsoff_tool.nursing_handsoff_tool.fetch_latest_vitals",
        args: {
          inpatient_record: cur_frm.doc.inpatient_record,
        },
        callback: (res) => {
          console.log(res.message.vital_signs_table.slice(-1));
          let latest_vitals_row = res.message.vital_signs_table.slice(-1);

          var child = cur_frm.add_child("vital_signs_table");
          frappe.model.set_value(
            child.doctype,
            child.name,
            "patient_encounter_temperature",
            latest_vitals_row[0].patient_encounter_temperature
          );
          frappe.model.set_value(
            child.doctype,
            child.name,
            "patient_encounter_respiratory_rate",
            latest_vitals_row[0].patient_encounter_respiratory_rate
          );
          frappe.model.set_value(
            child.doctype,
            child.name,
            "patient_encounter_percutaneous_oxygen",
            latest_vitals_row[0].patient_encounter_percutaneous_oxygen
          );
          frappe.model.set_value(
            child.doctype,
            child.name,
            "patient_encounter_heart_rate_sleeping",
            latest_vitals_row[0].patient_encounter_heart_rate_sleeping
          );
          frappe.model.set_value(
            child.doctype,
            child.name,
            "patient_encounter_heart_rate",
            latest_vitals_row[0].patient_encounter_heart_rate
          );
          frappe.model.set_value(
            child.doctype,
            child.name,
            "patient_encounter_bp_systolic",
            latest_vitals_row[0].patient_encounter_bp_systolic
          );
          frappe.model.set_value(
            child.doctype,
            child.name,
            "patient_encounter_bp_diastolic",
            latest_vitals_row[0].patient_encounter_bp_diastolic
          );
          cur_frm.refresh_field("vital_signs_table");

          cur_frm.set_value(
            "mean_arterial_pressure",
            latest_vitals_row[0].patient_encounter_mean_arterial_pressure
          );
          cur_frm.set_value(
            "spo2",
            latest_vitals_row[0].patient_encounter_percutaneous_oxygen
          );

          cur_frm.set_value("mean_bp", latest_vitals_row[0].patient_encounter_bp_systolic + "/" + latest_vitals_row[0].patient_encounter_bp_diastolic)

          cur_frm.refresh_field("mean_arterial_pressure");
          cur_frm.refresh_field("spo2");
          cur_frm.refresh_field("mean_bp")
        },
      });

      // Pulling latest PEWS, Pain and Falls Risk Assessments from IP record
      get_encounter_assessment();

      // Auto filling practioner filling the nursing handsoff tool
        if(!cur_frm.doc.name_of_the_nurse_handing_over && frappe.user.has_role("GCH-Nurse")) {
            // Fetch Healthcare Practitioner from the user ID
            console.log("Attempting to auto fill nurse handing over")

            let nurse_email = frappe.session.user

            frappe.call({
                method: "gch_inpatient.overrides.inpatient_record.fetch_primary_nurse_from_practitioner",
                args: {
                    user_id : nurse_email
                },
                callback: (res) => {

                    if (res.message[0].name) {
                        cur_frm.set_value("name_of_the_nurse_handing_over", res.message[0].name)
                        cur_frm.refresh_field("name_of_the_nurse_handing_over")

                        // frappe.show_alert({message: `Primary Nurse Auto Assigned from current user`, indicator: 'green'});

                    }

                }
            })
            
        }    

    }
  },
  before_workflow_action: (frm) => {

    // Making fields on the nursing handsoff mandatory
    if (cur_frm.doc.patient_name) {
        Object.keys(frm.fields_dict).forEach(function (fieldname) {
            let field = frm.fields_dict[fieldname];
            // Make the field mandatory if it's not already mandatory
            if (!field.df.reqd) {
                field.df.reqd = 1;
            }
        });
        frm.refresh();
    }


  },
  before_submit: (frm) => {
    console.log("INFO: Before Submit");
  },
  on_submit: (frm) => {
    frappe.call({
      method:
        "gch_custom.gch_custom.doctype.nursing_checklist.nursing_checklist.creating_completed_nursing_tools",
      args: {
        inpatient_record: cur_frm.doc.inpatient_record,
        tool_name: cur_frm.doc.doctype,
        tool_id: cur_frm.doc.name,
        tool_link: `<a href='/app/nursing-handsoff-tool/${cur_frm.doc.name}'><p style='color: blue;'>View</p></a>`,
      },
      callback: (res) => {
        console.log(res, "============= SUBMITTEDDD ==========");
      },
    });
  },
});
