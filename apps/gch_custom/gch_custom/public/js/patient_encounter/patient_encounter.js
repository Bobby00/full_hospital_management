var patientdob = "";
var patient_age = 0;
let assessment_btn_press_count = 0;
let assessment_length_global = 0;

let FREQUENCY_OPTIONS = [
  "Every 24 hrs",
  "Every 12 hrs",
  "Every 8 hrs",
  "Every 6 hrs",
  "Every 5 hrs",
  "Every 4 hrs",
  "Every 3 hrs",
  "Every 2 hrs",
  "Every 1 hr",
  "As Needed",
  "Stat",
  "Weekly",
  "Monthly",
  "Quarterly",
];

let range = (start, end) => {
  return Array(end - start + 1)
    .fill()
    .map((_, idx) => start + idx);
};

const view_results_url = (accession_number, uhid, username,results_key) =>{
  let url = `http://192.168.1.221:90/viewer/${uhid}/${accession_number}/${username}/${results_key}`;
  window.open(url, "_blank");
}


const get_patient_insurance = async (patient) => {
    let patient_insurance_list = [];
    if (!cur_frm.doc.patient || cur_frm.doc.patient == "") return patient_insurance_list;
    await frappe
      .call({
        method: "gch_custom.services.rest.get_patient_insurance",
        args: { patient },
      })
      .done((r) => {
        patient_insurance_list = r.message;
      });
    return patient_insurance_list;
  };


// function compareObjects(obj1, obj2) {
//   var differences = {};

//   function compareProps(prop1, prop2, path) {
//     if (typeof prop1 !== 'object' || typeof prop2 !== 'object') {
//       if (prop1 !== prop2) {
//         differences[path] = {
//           oldValue: prop1,
//           newValue: prop2
//         };
//       }
//       return;
//     }

//     for (var key in prop1) {
//       if (prop1.hasOwnProperty(key) && prop2.hasOwnProperty(key)) {
//         compareProps(prop1[key], prop2[key], path ? `${path}.${key}` : key);
//       } else {
//         differences[path ? `${path}.${key}` : key] = {
//           oldValue: prop1[key],
//           newValue: undefined
//         };
//       }
//     }

//     for (var key in prop2) {
//       if (prop2.hasOwnProperty(key) && !prop1.hasOwnProperty(key)) {
//         differences[path ? `${path}.${key}` : key] = {
//           oldValue: undefined,
//           newValue: prop2[key]
//         };
//       }
//     }
//   }

//   compareProps(obj1, obj2, '');

//   return differences;
// }



// function compareObjects(obj1, obj2) {
//   var differences = {};

//   function compareProps(prop1, prop2, path) {
//     if (typeof prop1 !== 'object' || typeof prop2 !== 'object') {
//       if (prop1 !== prop2) {
//         differences[path] = {
//           oldValue: prop1,
//           newValue: prop2
//         };
//       }
//       return;
//     }

//     for (var key in prop1) {
//       if (prop1.hasOwnProperty(key) && prop2.hasOwnProperty(key)) {
//         compareProps(prop1[key], prop2[key], path ? `${path}.${key}` : key);
//       } else {
//         differences[path ? `${path}.${key}` : key] = {
//           oldValue: prop1[key],
//           newValue: undefined
//         };
//       }
//     }

//     for (var key in prop2) {
//       if (prop2.hasOwnProperty(key) && !prop1.hasOwnProperty(key)) {
//         differences[path ? `${path}.${key}` : key] = {
//           oldValue: undefined,
//           newValue: prop2[key]
//         };
//       }
//     }
//   }

//   compareProps(obj1, obj2, '');

//   return differences;
// }


// frappe.realtime.on('patient_encounter_updates', (data) => {
//   if (data.encounter === cur_frm.doc.name && data.modified_by !== frappe.user.name) {
//     console.log("RECEIVED UPDATE", data);
//     console.log("Applying changes without losing unsaved changes...");

//     // Store the unsaved changes in a temporary variable
//     const unsavedChanges = { ...cur_frm.doc };

//     // Reload the document to fetch the latest changes
//     // cur_frm.reload_doc();
    // cur_frm.reload_doc().then(() => {
    //   // Code to execute after the document is reloaded
    //   Object.assign(cur_frm.doc, unsavedChanges);
    //   console.log(unsavedChanges)

    //   // Refresh the form fields to reflect the updated values
    //   console.log('Refreshing fields')
      
    //   console.log('Refreshed fields')
    // }).catch((error) => {
    //   console.log(error)
    //   // Handle any error that occurred during the reload process
    // });
//     // Restore the unsaved changes to the reloaded document
//     cur_frm.refresh_fields();
//   }
// });

// Get all patient insurance
// given the patient id

// TODO
// frappe.realtime.on('patient_encounter_updates', (data) => {
//   console.log(data);
//   console.log(cur_frm.doc.modified_by);

//   if (data.encounter === cur_frm.doc.name && data.modified_by !== frappe.user.name) {
//     console.log("RECEIVED UPDATE");
//     console.log(locals);
//     let old_values = locals["Patient Encounter"][cur_frm.doc.name];
//     console.log("FETCHED OLD VALUES", old_values.weight_in_kilograms);
//     console.log(old_values);

//     let new_values = JSON.parse(data.data);
//     console.log("FETCHED NEW VALUES", new_values.weight_in_kilograms);
//     console.log(new_values);

//     let diffs = compareObjects(old_values, new_values);
//     console.log(diffs);

//     for (var key in diffs) {
//       if (
//         diffs.hasOwnProperty(key) &&
//         key !== "__last_sync_on" &&
//         key !== "__needs_refresh" &&
//         key !== "modified"
//       ) {
//         var oldValue = diffs[key].oldValue;
//         try {
//           // Check if the key refers to an array
//           if (Array.isArray(cur_frm.doc[key])) {
//             var array = cur_frm.doc[key];
//             var elements = key.split("."); // Split the key to get the array and field names
//             var arrayName = elements.shift(); // Extract the array name
//             var fieldName = elements.join("."); // Remaining elements form the field name

//             for (var i = 0; i < array.length; i++) {
//               array[i][fieldName] = oldValue; // Update the corresponding field in each array element
//             }
//           } else {
//             cur_frm.set_value(key, oldValue); // Set the value for non-array fields
//           }
//         } catch (error) {
//           console.log("Error setting value for key:", key, error);
//         }
//       }
//     }
//     cur_frm.refresh_fields();
//   }
// });

frappe.realtime.on('patient_encounter_updates', (encounter, modified_by, users, data) => {
  console.log(encounter?.encounter == cur_frm.doc.name && encounter?.modified_by != frappe.user.name && cur_frm.doc, "Real-time update log......")
  if (encounter?.encounter == cur_frm.doc.name && encounter?.modified_by != frappe.user.name && cur_frm.doc) {
    frappe.show_alert(
      {
        message: __("Document has been modified. Updating changes."),
        indicator: "green",
      },
      2
    );
    cur_frm.reload_doc().then(() => {
      frappe.show_alert(
        {
          message: __("Document has been updated."),
          indicator: "green",
        },
        1
      );
    })
   
  }
  
})

// frappe.realtime.on('patient_encounter_updates', (data) => {
  
//   if (data.encounter === cur_frm.doc.name && data.modified_by !== frappe.user.name && cur_frm.doc) {
//   frappe.show_alert(
//     {
//       message: __("Document has been modified. Updating changes."),
//       indicator: "green",
//     },
//     2
//   );
//   cur_frm.reload_doc()
//   console.log(data);
//   let new_values = JSON.parse(data.data);
//   // let incoming_muac = new_values.muac
//   // console.log(cur_frm.doc.modified_by);
//   // let current = "Hello"
//   // console.log(current)
//   // cur_frm.reload_doc()
//   // console.log("After reload,", current)
//   let old_values = locals["Patient Encounter"][cur_frm.doc.name];
//   // let muac = old_values?.muac
// if (data.encounter === cur_frm.doc.name && data.modified_by !== frappe.user.name && cur_frm.doc) {
//   console.log("RECEIVED UPDATE");
//   console.log(locals);
//   let old_values = locals["Patient Encounter"][cur_frm.doc.name];
//   console.log("FETCHED OLD VALUES", old_values.weight_in_kilograms);
//   console.log(old_values);

//   let new_values = JSON.parse(data.data);
//   console.log("FETCHED NEW VALUES", new_values.weight_in_kilograms);
//   console.log(new_values);

//   let diffs = compareObjects(old_values, new_values);
//   console.log(diffs);
//   cur_frm.reload_doc().then(() => {
//     // Code to execute after the document is reloaded
//     for (var key in diffs) {
//       if (
//         diffs.hasOwnProperty(key) &&
//         key !== "__last_sync_on" &&
//         key !== "__needs_refresh" &&
//         key !== "modified" &&
//         key !== "__unsaved"
//       ) {
//         var oldValue = diffs[key].oldValue;
//         try {
//           // Check if the key refers to the vital_signs_table array
//           if (key.startsWith("vital_signs_table")) {
//             var index = parseInt(key.split(".")[1]); // Extract the index from the key
//             var field = key.split(".")[2]; // Extract the field name from the key
//             cur_frm.doc.vital_signs_table[index][field] = oldValue; // Update the corresponding field in the array
//           } else {
//             cur_frm.set_value(key, oldValue); // Set the value for non-array fields
//           }
//         } catch (error) {
//           console.log("Error setting value for key:", key, error);
//         }
//       }
//     }
//   }).catch((error) => {
//     console.log(error)
//     // Handle any error that occurred during the reload process
//   });


//   cur_frm.refresh_fields();
//   frappe.show_alert(
//     {
//       message: __("Document updated"),
//       indicator: "green",
//     },
//     5
//   );
// }
// });


// frappe.realtime.on('patient_encounter_updates', (data) => {
//   console.log(data);
//   console.log(cur_frm.doc.modified_by);

//   if (data.encounter === cur_frm.doc.name && data.modified_by !== frappe.user.name) {
//     console.log("RECEIVED UPDATE");
//     console.log(locals);
//     let old_values = locals["Patient Encounter"][cur_frm.doc.name];
//     console.log("FETCHED OLD VALUES", old_values.weight_in_kilograms);
//     console.log(old_values);

//     let new_values = JSON.parse(data.data);
//     console.log("FETCHED NEW VALUES", new_values.weight_in_kilograms);
//     console.log(new_values);

//     let diffs = compareObjects(old_values, new_values);
//     console.log(diffs);

//     for (var key in diffs) {
//       if (diffs.hasOwnProperty(key) && key !== "__last_sync_on" && key !== "__needs_refresh" && key !== "modified") {
//         var oldValue = diffs[key].oldValue;
//         try {
//           cur_frm.set_value(key, oldValue);
//         } catch (error) {
//           console.log("Error setting value for key:", key, error);
//         }
//       }
//     }
//     cur_frm.refresh_fields();
//   }
// });


// frappe.realtime.on('patient_encounter_updates', (data) => {
//   console.log(data)
//   console.log(cur_frm.doc.modified_by)
//   data.encounter == cur_frm.doc.name
//   data?.modified_by == frappe.user?.name
//   if(data.encounter === cur_frm.doc.name && data?.modified_by !== frappe.user?.name){
//     console.log("RECEIVED UPDATE")
//     console.log(locals)
//     let old_values = locals["Patient Encounter"][cur_frm.doc.name]
//     console.log("FETCHED OLD VALUES", old_values.weight_in_kilograms)
//     console.log(old_values)
//     // cur_frm.reload_doc()
//     // cur_frm.refresh()
//     let new_values = JSON.parse(data?.data)
//     console.log("FETCHED NEW VALUES", new_values.weight_in_kilograms)
//     console.log(new_values)

//     let diffs = compareObjects(old_values, new_values)
//     console.log(diffs)
//     for (var key in diffs) {
//       console.log(key)
//       if(diffs[key] != "__last_sync_on" && diffs[key] != "__needs_refresh" && diffs[key] != "modified"){
//         var oldValue = diffs[key].oldValue;
//         try{
//           cur_frm.set_value(key, oldValue);
//         }
//         catch{
//           console.log("CAUGHT")
//         }

//       }

//     }
//     cur_frm.refresh_fields();
//   }


// cur_frm.reload_doc()

//   var unsavedValues = cur_frm.doc;
//   // // console.log(unsavedValues.head_circumference_in_centimeters)

// // Refresh the form
// cur_frm.reload_doc();

// // Restore unsaved values after the form is refreshed
// frappe.after_ajax(function() {
//   if (unsavedValues) {
//     // // console.log("UNSAVED VALUES FOUND")
//     cur_frm.doc = unsavedValues;

//     // cur_frm.refresh_fields();
//     cur_frm.refresh(cur_frm.doc.name)
//   }
// });
// })
const fetch_patient_history_within_2wks = (frm) => {
    frappe.call({
        async: false,
        method: "gch_custom.services.rest.fetch_data_from_recent_encounter",
        args: {
          doctype: "Patient Encounter",
          filters: frm.doc.patient,
        },
        callback: function (data) {
          console.log(data, "data'''''");

          if(data.message) {
            frm.doc.patient_history = [];

            // Auto adding vital signs information

            $.each(data.message.patient_history, function (_i, e) {
                let entry = frm.add_child("patient_history");
                

                // ADD the 3 fields causing required error for nurse (Chief Complaint,History of present illness, Systemic Enquiry)

                // entry.patient_encounter_chief_complaint = 
                // e.patient_encounter_chief_complaint;

                // entry.patient_encounter_history_of_present_illness =
                // e.patient_encounter_history_of_present_illness;

                // entry.patient_encounter_systematic_enquiry = 
                // e.patient_encounter_systematic_enquiry;

                // end of error fixing

                // entry.patient_encounter_chronic_care_med_history =
                // e.patient_encounter_chronic_care_med_history;

                entry.patient_encounter_family_history =
                e.patient_encounter_family_history;
                

                // entry.patient_encounter_milestones =
                // e.patient_encounter_milestones;
                
                // entry.patient_encounter_nutrition_history =
                // e.patient_encounter_nutrition_history;
                
                // entry.patient_encounter_other_immunization =
                // e.patient_encounter_other_immunization;

                // entry.patient_encounter_other_relevant_history =
                // e.patient_encounter_other_relevant_history;

                entry.patient_encounter_past_medical_history =
                e.patient_encounter_past_medical_history;

                entry.patient_encounter_socio_economic_history =
                e.patient_encounter_socio_economic_history;

    
            });

            refresh_field("patient_history");

            // frappe.msgprint({
            //     title: __("Notification"),
            //     indicator: "green",
            //     message: __("Patient history updated successfully"),
            // });
          }
         }
        })
}

const fetch_prev_enc_info = (frm) => {
    frappe.call({
        async: false,
        method: "gch_custom.services.rest.fetch_data_from_recent_encounter",
        args: {
          doctype: "Patient Encounter",
          filters: frm.doc.patient,
        },
        callback: function (data) {
          console.log(data, "data'''''");

          if(data.message) {

            if(data.message.has_no_drug_allergy) {
                frm.set_value("has_no_drug_allergy", 1)
                frm.refresh_field("has_no_drug_allergy")
            }

            if(data.message.has_no_food_allergy) {
                frm.set_value("has_no_food_allergy", 1)
                frm.refresh_field("has_no_food_allergy")
            }

            // Autofilling some Triage data excluding vitals
            frm.set_value("bmi", data.message.bmi);
            frm.refresh_field("bmi");

            frm.set_value("bmi_for_age", data.message.bmi_for_age);
            frm.refresh_field("bmi_for_age");

            frm.set_value("bsa", data.message.bsa);
            frm.refresh_field("bsa");

            frm.set_value(
                "head_circumference_in_centimeters",
                data.message.head_circumference_in_centimeters
            );
            frm.refresh_field("head_circumference_in_centimeters");

            frm.set_value("height_for_age", data.message.height_for_age);
            frm.refresh_field("height_for_age");

            frm.set_value(
                "height_in_centimeters",
                data.message.height_in_centimeters
            );
            frm.refresh_field("height_in_centimeters");

            frm.set_value("muac", data.message.muac);
            frm.refresh_field("muac");

            frm.set_value(
                "nutritional_supplementation_or_specialized_feeding",
                data.message.nutritional_supplementation_or_specialized_feeding
            );
            frm.refresh_field(
                "nutritional_supplementation_or_specialized_feeding"
            );

            frm.set_value(
                "routine_nutritional_counselling_not_done_at_6_months",
                data.message.routine_nutritional_counselling_not_done_at_6_months
            );
            frm.refresh_field(
                "routine_nutritional_counselling_not_done_at_6_months"
            );

            frm.set_value(
                "unintentional_weight_loss",
                data.message.unintentional_weight_loss
            );
            frm.refresh_field("unintentional_weight_loss");

            frm.set_value("weight_for_age", data.message.weight_for_age);
            frm.refresh_field("weight_for_age");

            frm.set_value(
                "weight_in_kilograms",
                data.message.weight_in_kilograms
            );
            frm.refresh_field("weight_in_kilograms");

            // frm.set_value(
            //     "has_no_drug_allergy",
            //     data.message.has_no_drug_allergy
            // );
            // frm.refresh_field("has_no_drug_allergy");

            // frm.set_value(
            //     "has_no_food_allergy",
            //     data.message.has_no_food_allergy
            // );
            // frm.refresh_field("has_no_food_allergy");

            frm.doc.vital_signs_table = [];

            // Auto adding vital signs information

            $.each(data.message.vital_signs_table, function (_i, e) {
                let entry = frm.add_child("vital_signs_table");
                entry.patient_encounter_blood_pressure =
                e.patient_encounter_blood_pressure;
                entry.patient_encounter_bp_diastolic =
                e.patient_encounter_bp_diastolic;
                entry.patient_encounter_bp_systolic =
                e.patient_encounter_bp_systolic;
                entry.patient_encounter_heart_rate = e.patient_encounter_heart_rate;
                entry.head_circumference_in_centimeters =
                e.head_circumference_in_centimeters;
                entry.patient_encounter_heart_rate_sleeping =
                e.patient_encounter_heart_rate_sleeping;
                entry.patient_encounter_percutaneous_oxygen =
                e.patient_encounter_percutaneous_oxygen;
                entry.patient_encounter_respiratory_rate =
                e.patient_encounter_respiratory_rate;
                entry.patient_encounter_temperature =
                e.patient_encounter_temperature;
            });

            refresh_field("vital_signs_table");

            frappe.msgprint({
                title: __("Notification"),
                indicator: "green",
                message: __("Encounter updated successfully"),
            });
          }

        },
    });
}

frappe.ui.form.on("Patient Encounter", {
  setup: function (frm) {
    //   START OF GETTING ADMINISTERED VACCINED
    if (cur_frm.doc.workflow_state == "Encounter Closed") {
        $('.actions-btn-group').hide()
    }

    $('.prev-doc, .next-doc').hide();

    // // // console.log("setup");
    const patient = frm.doc.patient;

    // Hiding encounter side nav, but can be reopened
    $('.layout-side-section').css("display","none")

    if (patient != undefined) {
      frappe.call({
        method: "gch_custom.services.events.administered_vaccines",

        args: {
          patient: patient,
        },

        callback: function (data) {
          let vaccines = data.message;
          let item_array = [];

          if (vaccines) {
            vaccines.forEach((vaccine) => {
              item_array.push(
                `<tr>
                                    <td>` +
                vaccine.vaccine_name +
                `</td>
                                    <td>` +
                vaccine.vaccination_date +
                `</td>
                                </tr>`
              );
            });

            $(".karani").html(item_array);
          }
        },
      });
    }

    // Filtering generic drug list to only show generic name and omit gerties codes
    frm.set_query("generic_drug", "prescription_table", function(doc, cdt, cdn) {
        var item = locals[cdt][cdn];
        console.log(item, "Generics.....")
        return {
            query: "gch_custom.services.rest.only_show_generic_name",
            // filters: {
            //     'item': item.item_code,
            // }
        };
    });

    //   END OF GETTING ADMINISTERED VACCINED

    // // Removing default shedule admission button
    // frm.remove_custom_button(__('Schedule Admission'))


    // const KEPI_VACCINE = "KEPI Vaccine";
    // const PRIVATE_VACCINE = "Private Vaccine";

    // frm.fields_dict["vaccines"].grid.get_field(
    //     "drug"
    //   ).get_query = function (doc, cdt, cdn) {
    //     var child = locals[cdt][cdn];
    //     // // console.log(child)
    //     if(child.vaccine_type == "") return
    //     return {
    //       filters: [["vaccine_type", "in", [child.vaccine_type]]],
    //     };
    //   };

    // get dictionary of table
    // Alternative to the method below

    // frm.fields_dict["diagnosis_table"].grid.get_field(
    //   "medical_code"
    // ).get_query = function (doc, cdt, cdn) {
    //   var child = locals[cdt][cdn];
    //   // // console.log(child, "child!!!!!!!!")
    //   return {
    //     // query: "gch_custom.services.rest.group_medical_query"
    //     filters: [
    //       ["medical_code_standard", "in", ["ICD-10-Diagnosis", "ICD-10"]],
    //     ],
    //   };
    // };

    // if (!frm.doc.__islocal && frm.doc.has_no_food_allergy != true && frm.doc.workflow_state == "Pending Triage" && frm.doc.clinic != "Wellbaby - GCH" && frm.doc.clinic != "Wellbaby Growth Monitoring - GCH") {
    //     frm.set_df_property("food_allergy", "reqd", 1);
    //     frm.refresh_field("food_allergy");
    // }
    // if (!frm.doc.__islocal && frm.doc.has_no_drug_allergy != true && frm.doc.workflow_state == "Pending Triage" && frm.doc.clinic != "Wellbaby - GCH" && frm.doc.clinic != "Wellbaby Growth Monitoring - GCH") {
    //     frm.set_df_property("drug_allergy", "reqd", 1);
    //     frm.refresh_field("drug_allergy");
    // }
    

    frm.set_query("medical_code", "diagnosis_table", function () {
      return {
        query: "gch_custom.services.rest.group_medical_query",
        filters: [
          ["medical_code_standard", "in", ["ICD-10-Diagnosis"]],
        ],
      };
    });

    // FILTERING VACCINATIONS ON VACCINATION TABLE
    frm.set_query("drug", "vaccines", function () {
      return {
        filters: [["item_group", "in", ["Vaccine", "vaccines"]]],
      };
    });

    // FILTERING LAB ITEMS ON LAB TABLE
    frm.set_query("lab_test_code", "lab_test_prescription", function () {
      return {
        filters: [
          [
            "lab_test_group",
            "in",
            [
              "BIOCHEMISTRY",
              "HEMATOLOGY",
              "HISTOLOGY",
              "MICROBIOLOGY",
              "SEROLOGY",
            ],
          ],
        ],
      };
    });

    frm.fields_dict["radiology_details"].grid.get_field(
      "lab_test_code"
    ).get_query = function (doc, cdt, cdn) {
      var child = locals[cdt][cdn];
      // // // console.log(child);

      return {
        filters: [["lab_test_group", "in", ["Radiology"]]],
      };
    };

    frm.fields_dict["triage_medication"].grid.get_field(
      "generic_drug"
    ).get_query = function (doc, cdt, cdn) {
      var child = locals[cdt][cdn];
      // // // console.log(child);

      return {
        filters: [["is_triage_medication", "in", ["1"]]],
      };
    };

    frm.fields_dict["triage_medication"].grid.get_field(
      "medication"
    ).get_query = function (doc, cdt, cdn) {
      var child = locals[cdt][cdn];
      // // // console.log(child);

      return {
        filters: [["is_triage_medication", "in", ["1"]]],
      };
    };

    //Nursing Diagnosis
    frm.fields_dict["patient_nursing_diagnosis"].grid.get_field(
      "medical_code"
    ).get_query = function (doc, cdt, cdn) {
      return {
        filters: [["medical_code_standard", "in", ["ICD-10-CM"]]],
      };
    };

    // HIDING CHART FIELDS ON LOAD
    frm.set_df_property("bmi_for_age_chart", "hidden", true);
    frm.set_df_property("weight_for_age_chart", "hidden", true);
    frm.set_df_property("height_for_age_chart_gch", "hidden", true);

    
    // Filtering Default insurance field to only show unsuspended insurance categories
    frm.set_query("default_insurance", function () {
        return {
          filters: [["suspend", "in", ["0"]]],
        };
    });

    // FILTERING CLINIC TO ONLY SHOW NON-DISABLED CLINICS
    frm.set_query("clinic", function () {
        return {
          filters: [["disable_service_unit", "in", ["0"]]],
        };
    });

    frappe.require(
        "/assets/gch_custom/js/patient_encounter/highlighted_menu.js",
        () => {
          handleHighlightedMenu(cur_frm);
        }
    );

  },
  onload: async (frm) => {
    // // // console.log("Load");
    if(frappe.user.has_role("GCH-Doctor") && cur_frm.doc.workflow_state == "Pending Doctor" && !cur_frm.doc.practitioner){
        console.log("Assigning.......")
        frappe.call({
            method: "gch_custom.services.rest.fetch_practitioner_name",
            args: { "practitioner_email" : frappe.user.name },
            callback: (res) => {
                console.log(res.message, "practitioner name,,,,,,")
                
                if(res.message) {
                    frm.set_value("practitioner", res.message[0].name)
                    // frappe.db.set_value("Patient Encounter", encounter, {
                    //     practitioner: res.message[0].name
                    // })
                    frm.save()
                }

            }
        })

        // frappe.db.set_value("Patient Encounter", encounter, {
        //     is_with_doctor: 1,
        // });
    }

    frappe.require(
      "/assets/gch_custom/js/patient_encounter/highlighted_menu.js",
      () => {
        handleHighlightedMenu(cur_frm);
      }
    );

    // disable ability to add or delete rows
    frm.set_df_property(
      "kranium_physican_exams_table",
      "cannot_delete_rows",
      1
    );
    // $('[data-fieldname="kranium_physican_exams_table"]').find("button.grid-add-row").hide()
    $('[data-fieldname="kranium_physican_exams_table"]')
      .find("button.grid-add-row")
      .hide();

    // Fetching assessments-----------
    // if (cur_frm.doc.encounter_number) {
    //   get_encounter_assessment(frm);
    // }

    // HIDING CHART FIELDS ON LOAD
    frm.set_df_property("bmi_for_age_chart", "hidden", true);
    frm.set_df_property("weight_for_age_chart", "hidden", true);
    frm.set_df_property("height_for_age_chart_gch", "hidden", true);

    if (cur_frm.doc.workflow_state == "Pending Doctor" && frappe.user.has_role("GCH-Doctor")) {
      
      cur_frm.get_field("prescription_table").grid.toggle_reqd("generic_drug", true);

      cur_frm.get_field("prescription_table").grid.toggle_reqd("preparation_type", true);

      cur_frm.get_field("prescription_table").grid.toggle_reqd("route", true);

      cur_frm.get_field("prescription_table").grid.toggle_reqd("dose", true);

      cur_frm.get_field("prescription_table").grid.toggle_reqd("dose_uom", true);

      cur_frm.get_field("prescription_table").grid.toggle_reqd("prescription_frequency", true);

      cur_frm.get_field("prescription_table").grid.toggle_reqd("duration", true);

    }

    // var brand = frappe.meta.get_docfield("Doctor Prescription Table", "brand", frm.doc.name);

    frappe.require(
      "/assets/gch_custom/js/patient_encounter/pharmacy.js",
      () => {
        handle_pharmacy(frm);
      }
    );


    frappe.require(
      "/assets/gch_custom/js/patient_encounter/walk_in_encounter.js",
      () => {
        handle_walk_in(frm);
      }
    );

    frappe.require(
      "/assets/gch_custom/js/patient_encounter/wellbaby_audiology.js",
      () => {
        handle_wellbaby_audiology(frm);
      }
    );

    frappe.require(
      "/assets/gch_custom/js/patient_encounter/diagnosis.js",
      () => {
        handle_diagnosis_table(frm);
      }
    );
    cur_frm.set_value("encounter_number", frm.doc.name);

    // // // console.log("Runnnnnnnnnnnninnnnnnnnggggg", frm.doc.name);

    cur_frm.set_value("encounter_number", frm.doc.name);

    // flag_patient(frm);

    // if (frm.is_new) {
    //   let practitioners = await frappe.db.get_list("Healthcare Practitioner");
    //   if (practitioners.len < 1) {
    //     frappe.msgprint("Please create a Healthcare Practitioner first");
    //     return;
    //   }
    //   cur_frm.set_value("practitioner", practitioners[0].name);
    //   cur_frm.refresh_field("practitioner");
    // }

    //Get User Location
    let dbuser = frappe.session.user;
    const user_branch = await get_user_location(dbuser);

    // if (user_branch) {
    //   cur_frm.set_value("branch", user_branch);
    //   cur_frm.refresh_field("branch");
    // }

    // if (!frappe.user.has_role("GCH-Doctor")) {
    //   frm.set_df_property(
    //     "gch_standard_treatment_guideline_mapping",
    //     "read_only",
    //     true
    //   );

    //   // df.hidden = 1;
    //   // frm.refresh_fields()
    // }
    // if (frappe.user.has_role("GCH-Doctor")) {
    //   frm.set_df_property("do_not_issue", "hidden", true);
    //   // df.hidden = 1;
    //   // frm.refresh_fields()
    // }
    // if (frappe.user.has_role("GCH-Pharmacy")) {
    //   // df.hidden = 0;
    //   // frm.refresh_fields()
    // }

    // if (!frm.is_new()) {
    //   // // console.log("not new");
    // }

    // if (frm.doc.name && !frm.is_new()) {
    //   // // console.log(frm.doc.name);
    //   frappe.call({
    //     type: "POST",
    //     url: `${window.location.origin}/api/method/gch_custom.services.query_encounter_diagnoses`,
    //     args: {
    //       encounter_number: frm.doc.name,
    //     },
    //     callback: function (res) {
    //       let { template_guidelines } = res.message;
    //       frm.clear_table("gch_standard_treatment_guideline_mapping");

    //       template_guidelines.forEach((guideline) => {
    //         // // console.log(guideline);
    //         let child = {
    //           medical_code: guideline.medical_code,
    //           standard_treatment: guideline.name,
    //           code: guideline.code,
    //           description: guideline.description,
    //           formula: guideline.preparation,
    //           treatment_option: guideline.preparation,
    //         };
    //         frm.add_child("gch_standard_treatment_guideline_mapping", child);
    //       });
    //       frm.set_df_property("gch_standard_treatment_guideline_mapping", "read_only", true);
    //       frm.refresh_field("gch_standard_treatment_guideline_mapping");
    //     },
    //   });
    // }

    // if (frm.doc.diagnosis_table?.length < 1) {
    //     frm.set_df_property(
    //       "gch_standard_treatment_guideline_mapping",
    //       "read_only",
    //       true
    //     );
    //     frm.set_df_property("prescription_table", "read_only", true);
    //   }
    //   if (frm.doc.diagnosis_table?.length > 0) {
    //     // frm.set_df_property("gch_standard_treatment_guideline_mapping", "read_only", false);
    //     frm.set_df_property("prescription_table", "read_only", false);
    //   }
    // Checking if the encounter is walk in and disabling mandatory on diagnosis and patient assessment
    if (cur_frm.doc.mode_of_payment == "Insurance") {
        // Highlighting suspended insurance categories
  
  
        frappe.call({
          method: "gch_custom.services.rest.check_if_insurance_suspended",
          args: {
            insurance_category: cur_frm.doc.default_insurance || " ",
          },
          callback: (res) => {
            if (res.message.suspend) {
              $('input[data-fieldname="default_insurance"]').css("color", "red");
              $('input[data-fieldname="default_insurance"]').css(
                "background-color",
                "#ff000014"
              );
              $('[data-fieldname="default_insurance"]').find(
                "label"
              )[0].innerHTML = "Default Insurance (Suspended, please verify!!!)";
              $('[data-fieldname="default_insurance"]').find(
                "label"
              )[0].style.color = "red";
            } else {
              $('input[data-fieldname="default_insurance"]').css(
                "color",
                "black"
              );
              $('input[data-fieldname="default_insurance"]').css(
                "background-color",
                "#F4F5F6"
              );
              $('[data-fieldname="default_insurance"]').find(
                "label"
              )[0].innerHTML = "Default Insurance";
              $('[data-fieldname="default_insurance"]').find(
                "label"
              )[0].style.color = "black";
            }
          },
        });
    }
  },

//   onload_post_render: (frm) => {
//     // Ensuring assessments are fetched once form is loaded and rendered
//     if (cur_frm.doc.encounter_number) {
//         // console.log("Here//////////////// onload post render")
//         get_encounter_assessment(frm);
//     }
//   },

  get_kranium_history: (frm) => {
    // // // console.log("handle_get_patient_physican_examination");
    frappe.require(
      "/assets/gch_custom/js/patient_encounter/kranium_services.js",
      () => {
        handle_get_patient_physical_examinations(frm, cur_frm);
      }
    );
  },

  before_save: (frm) => {

    // Check if user has role doctor then make primarydoctor mandatory
    let wftState = frm.doc.workflow_state;
    if (frappe.user.has_role("GCH-Doctor") || wftState == "Pending Doctor"){
      frm.set_df_property("practitioner", "reqd", 1);
      frm.refresh_field("practitioner");
    }


    // Removing mandatory set on fields when attempting to switch workflow
    // This helps the user save without filling out the mandatory fields
    // However the fields will still be requested before workflow change
    frm.set_df_property("diagnosis_table", "reqd", 0);
    frm.refresh_field("diagnosis_table");

    cur_frm.set_df_property("vital_signs_table", "reqd", 0);
    cur_frm.refresh_field("vital_signs_table");

    cur_frm.set_df_property("unintentional_weight_loss", "reqd", 0);
    cur_frm.refresh_field("unintentional_weight_loss");

    cur_frm.set_df_property(
      "nutritional_supplementation_or_specialized_feeding",
      "reqd",
      0
    );
    cur_frm.refresh_field("nutritional_supplementation_or_specialized_feeding");

    cur_frm.set_df_property(
      "routine_nutritional_counselling_not_done_at_6_months",
      "reqd",
      0
    );
    cur_frm.refresh_field(
      "routine_nutritional_counselling_not_done_at_6_months"
    );

    cur_frm.set_df_property("food_allergy", "reqd", 0);
    cur_frm.refresh_field("food_allergy");

    cur_frm.set_df_property("drug_allergy", "reqd", 0);
    cur_frm.refresh_field("drug_allergy");

    frm.set_df_property("relative_with_ear_surgery", "reqd", 0);
    frm.refresh_field("relative_with_ear_surgery");

    frm.set_df_property("relative_with_hearing_loss", "reqd", 0);
    frm.refresh_field("relative_with_hearing_loss");

    frm.set_df_property("relative_with_hearing_devices", "reqd", 0);
    frm.refresh_field("relative_with_hearing_devices");

    frm.set_df_property("right_ear_results", "reqd", 0);
    frm.refresh_field("right_ear_results");

    frm.set_df_property("left_ear_results", "reqd", 0);
    frm.refresh_field("left_ear_results");

    frm.set_df_property("_followup_actions", "reqd", 0);
    frm.refresh_field("_followup_actions");

    frm.set_df_property("nurse_notes_table", "reqd", 0);
    frm.refresh_field("nurse_notes_table");

    let drug_allergies = frm.doc.drug_allergy ? frm.doc.drug_allergy: [];
    let food_allergies =  frm.doc.food_allergy ? frm.doc.food_allergy: [];
    let other_allergies = frm.doc.other_allergy ? frm.doc.other_allergy: [];
    if(drug_allergies.length > 0){
      frappe.call({
        method: "gch_custom.services.set_drug_allergy_on_patient_record",
        args:{
          patient: frm.doc.patient,
          drug_allergies: drug_allergies,
        },
        callback: (res) => {
          console.log("drug allergy set on patient record",res)
        }
      })
    }

    if(food_allergies.length > 0){
      frappe.call({
        method: "gch_custom.services.set_food_allergy_on_patient_record",
        args:{
          patient: frm.doc.patient,
          food_allergies: food_allergies,
        },
        callback: (res) => {
          console.log("drug allergy set on patient record",res)
        }
      })
    }

    if(other_allergies.length > 0){
      frappe.call({
        method: "gch_custom.services.set_other_allergy_on_patient_record",
        args:{
          patient: frm.doc.patient,
          other_allergies: other_allergies,
        },
        callback: (res) => {
          console.log("drug allergy set on patient record",res)
        }
      })
    }

  },

  refresh: (frm) => {

    window.view_results_url = view_results_url;

    if (cur_frm.doc.workflow_state == "Encounter Closed") {
        $('[data-label="Create"]').hide();
        $('[data-label="View"]').hide();
        $('[data-label="Cancel"]').hide();
    }
    $('.prev-doc, .next-doc').hide();

    frm.add_custom_button(
      "Go to Queue",
      function () {
        let url = '/app/queue-list';
        window.location.href = url;
      },
    );

    if(frm.doc.sales_invoice && cur_frm.doc.workflow_state != "Encounter Closed"){
      frm.add_custom_button(__('Add Items to Bill'),
        () => {        
          const  url = `/app/billing/${frm.doc.sales_invoice}`;
          window.location.href = url
        },
      );
    }

    const get_user_location_not_async = (dbuser) => {
        let location;
        frappe
          .call({
            method: "gch_custom.services.rest.get_user_location",
            args: { dbuser },
            async: false,
          })
          .done((r) => {
            location = r.message;
          });
      
        return location;
    };
    
    // Auto fetching branch when creating a new encounter
    if(cur_frm.doc.__islocal) {
        //Get User Location
        let dbuser = frappe.session.user;
        const user_branch = get_user_location_not_async(dbuser);

        if(!cur_frm.doc.branch) {
            cur_frm.set_value("branch", user_branch);
        }

        console.log(user_branch, "USER BRANCH,,,,,,,,,,,,,,,,,")
    }


    // Ensuring a patient is marked as emergency if they have any emergency vital
    if(!cur_frm.doc.critical_vital_temperature && 
        !cur_frm.doc.critical_vital_heart_rate && 
        !cur_frm.doc.critical_vital_respiratory_rate &&
        !cur_frm.doc.critical_vital_oxygen_saturation &&
        !cur_frm.doc.critical_vital_bpsystolic &&
        !cur_frm.doc.critical_vital_bpdiastolic) {
            cur_frm.set_value("is_emergency_patient", 0)
            cur_frm.refresh_field("is_emergency_patient")
    }

    // Hide new Assessments table
    cur_frm.set_df_property("encounter_assessment_table", "hidden", true);

    // Persist Flagging of a vital if is critical on encounter
    if(cur_frm.doc.critical_vital_temperature) {
        $('input[data-fieldname="patient_encounter_temperature"]').css(
            "color",
            "red"
        );
        $('div[data-fieldname="patient_encounter_temperature"]').css(
            "color",
            "red"
        );
    }
    else if (cur_frm.doc.critical_vital_heart_rate) {
        $('input[data-fieldname="patient_encounter_heart_rate"]').css(
            "color",
            "red"
        );
        $('div[data-fieldname="patient_encounter_heart_rate"]').css(
            "color",
            "red"
        );
    }
    else if (cur_frm.doc.critical_vital_respiratory_rate) {
        $('input[data-fieldname="patient_encounter_respiratory_rate"]').css(
            "color",
            "red"
        );
        $('div[data-fieldname="patient_encounter_respiratory_rate"]').css(
            "color",
            "red"
        );
    }
    else if (cur_frm.doc.critical_vital_oxygen_saturation) {
        $('input[data-fieldname="patient_encounter_percutaneous_oxygen"]').css(
            "color",
            "red"
        );
        $('div[data-fieldname="patient_encounter_percutaneous_oxygen"]').css(
            "color",
            "red"
        );
    }
    else if (cur_frm.doc.critical_vital_bpsystolic) {
        $('input[data-fieldname="patient_encounter_bpsystolic"]').css(
            "color",
            "red"
        );
        $('div[data-fieldname="patient_encounter_bpsystolic"]').css(
            "color",
            "red"
        );
    }
    else if (cur_frm.doc.critical_vital_bpdiastolic) {
        $('input[data-fieldname="patient_encounter_bpdiastolic"]').css(
            "color",
            "red"
        );
        $('div[data-fieldname="patient_encounter_bpdiastolic"]').css(
            "color",
            "red"
        );
    }

    if (cur_frm.doc.bmi < 18.5) {
        
        console.log("UNderweight")
        $('[data-fieldname="bmi"]').find(
        "label"
        )[0].innerHTML = "BMI (Underweight)";
        $('[data-fieldname="bmi"]').find(
        "label"
        )[0].style.color = "red";
        
    } else if (cur_frm.doc.bmi >= 18.5 && cur_frm.doc.bmi < 25) {
        console.log("Normal Weight")
        $('[data-fieldname="bmi"]').find(
            "label"
            )[0].innerHTML = "BMI (Normal)";
            $('[data-fieldname="bmi"]').find(
            "label"
            )[0].style.color = "green";
        
    } else if (cur_frm.doc.bmi >= 25 && cur_frm.doc.bmi < 30) {

        $('[data-fieldname="bmi"]').find(
            "label"
            )[0].innerHTML = "BMI (Overweight)";
            $('[data-fieldname="bmi"]').find(
            "label"
            )[0].style.color = "orange";
        
        console.log("Overweight");
    } else if (cur_frm.doc.bmi >= 30) {
        $('[data-fieldname="bmi"]').find(
            "label"
            )[0].innerHTML = "BMI (Obese)";
            $('[data-fieldname="bmi"]').find(
            "label"
            )[0].style.color = "red";
        console.log("Obese")
    }

    // Load LCT Script
    // // // console.log("Refresh Encounter");

    if(frappe.user.has_role("GCH-Doctor")){
        // console.log("has role doctor===========")
        cur_frm.fields_dict['encounter_history'].collapse()
        cur_frm.fields_dict['physical_examinations'].collapse()
        // cur_frm.fields_dict['prescription_details_section'].collapse()
        cur_frm.fields_dict['plan_of_action'].collapse()
    }

    if(frappe.user.has_role("GCH-Reception")){
        // console.log("has role doctor===========")
        cur_frm.fields_dict['payment_details_section'].collapse()
    }

    if(frappe.user.has_role("GCH-Nurse")){
        // console.log("has role doctor===========")
        cur_frm.fields_dict['vital_signs'].collapse()
        cur_frm.fields_dict['triage_notes'].collapse()
        cur_frm.fields_dict['anthropometry'].collapse()
        cur_frm.fields_dict['allergies'].collapse()
        cur_frm.fields_dict['assessment_tools'].collapse()
        cur_frm.fields_dict['nutrition_screening'].collapse()
        
        
    } else if(frappe.user.has_role("GCH-Nurse") && cur_frm.doc.clinic.includes("Wellbaby")){
        // console.log("has role doctor===========")
        cur_frm.fields_dict['vital_signs'].collapse()
        cur_frm.fields_dict['triage_notes'].collapse()
        cur_frm.fields_dict['anthropometry'].collapse()
        cur_frm.fields_dict['immunization'].collapse()
               
    }

    // Ensuring sales invoice number field is populated if empty on encounter
    if(!cur_frm.doc.__islocal && cur_frm.doc.encounter_number && !cur_frm.doc.sales_invoice) {
        frappe.call({
            method: "gch_custom.services.rest.fetch_encounter_invoice_number",
            args: {
                'encounter_number': cur_frm.doc.encounter_number
            },
            callback: (res) => {
                if(res.message) {
                    cur_frm.set_value('sales_invoice', res.message);
                    cur_frm.refresh_field("sales_invoice")
                    cur_frm.save()
                }
            }
        })
    }

    if(frm.doc.clinic.includes("Wellbaby") && !frm.doc.is_first_time_wellbaby_save && frappe.user.has_role("GCH-Reception") ) {
        
        console.log("Changing workflow...................")
        
        frm.set_value("workflow_state", "Pending Reception")
        frm.set_value("is_first_time_wellbaby_save", 1)
        frm.refresh_field("workflow_state")
        // cur_frm.save()
    }

    // if(frappe.user.has_role("GCH-Pharmacy")){
    //     // console.log("has role doctor===========")
    //     cur_frm.fields_dict['prescription_details_section'].collapse()
    // }

    frappe.require(
      "/assets/gch_custom/js/patient_encounter/highlighted_menu.js",
      () => {
        handleHighlightedMenu(cur_frm);
      }
    );

    // // Removing default shedule admission button
    // frm.remove_custom_button(__('Schedule Admission'))

    // Hiding default schedule admission page before page fully loads
    if(cur_frm.doc.workflow_state == "Encounter Closed" && document.querySelector('[data-label="Schedule%20Admission"]')) {
        document.querySelector('[data-label="Schedule%20Admission"]').style.display = 'none';
    }

    // Hiding default schedule discharge page before page fully loads
    if(cur_frm.doc.workflow_state == "Encounter Closed" && document.querySelector('[data-label="Schedule%20Discharge"]')) {
        document.querySelector('[data-label="Schedule%20Discharge"]').style.display = 'none';
    }


    // Handle redirection of patient to admission page or schedule a discharge if patient is already admitted
    if (!frm.doc.__islocal) {
        if (frm.doc.docstatus === 1) {
            if (frm.doc.inpatient_status == 'Admission Scheduled' || frm.doc.inpatient_status == 'Admitted') {
                frm.add_custom_button(__('Schedule a Discharge'), function() {
                    schedule_discharge(frm);
                });
            } else if (frm.doc.inpatient_status != 'Discharge Scheduled') {
                frm.add_custom_button(__('Schedule an Admission'), function() {
                    console.log("Redirect to Admission Page....")
                    // window.location.href = "/app/admission-form/new-admission-form-1"
                    // frappe.route_options = { patient : frm.doc.patient,
                    //                        }
                    frappe.route_options = {
                        patient: frm.doc.patient,
                        patient_encounter: frm.doc.encounter_number,
                    };
                    frappe.new_doc("Admission Form")

                    // frappe.set_route("List", "Admission Form", {patient_encounter : frm.doc.encounter_number});
                });
            }
        }
    }


    // Ensuring is priority patient field is flagged whenever the page is refreshed
    if (frm.doc.is_priority_patient == 1) {
      document.querySelectorAll(
        "[data-fieldname='is_priority_patient']"
      )[0].style.color = "orange";

      document.querySelectorAll(
        "[data-fieldname='is_priority_patient']"
      )[0].style.fontSize = "13px";

      document.querySelectorAll(
        "[data-fieldname='is_priority_patient']"
      )[0].style.fontWeight = "900";

    } else {
      document.querySelectorAll(
        "[data-fieldname='is_priority_patient']"
      )[0].style.color = "#020f10";

      document.querySelectorAll(
        "[data-fieldname='is_priority_patient']"
      )[0].style.fontSize = "12px";
      
      document.querySelectorAll(
        "[data-fieldname='is_priority_patient']"
      )[0].style.fontWeight = "400";

    }

    if (frm.doc.is_emergency_patient == 1) {
      document.querySelectorAll(
        "[data-fieldname='is_emergency_patient']"
      )[0].style.color = "red";

      document.querySelectorAll(
        "[data-fieldname='is_emergency_patient']"
      )[0].style.fontSize = "13px";

      document.querySelectorAll(
        "[data-fieldname='is_emergency_patient']"
      )[0].style.fontWeight = "900";

    } else {
      document.querySelectorAll(
        "[data-fieldname='is_emergency_patient']"
      )[0].style.color = "#020f10";

      document.querySelectorAll(
        "[data-fieldname='is_emergency_patient']"
      )[0].style.fontSize = "12px";

      document.querySelectorAll(
        "[data-fieldname='is_emergency_patient']"
      )[0].style.fontWeight = "400";

    }

    // disable ability to add or delete rows
    frm.set_df_property(
      "kranium_physican_exams_table",
      "cannot_delete_rows",
      1
    );
    // $('[data-fieldname="kranium_physican_exams_table"]').find("button.grid-add-row").hide()
    $('[data-fieldname="kranium_physican_exams_table"]')
      .find("button.grid-add-row")
      .hide();

    // FILTERING LAB ITEMS ON LAB TABLE
    frm.set_query("lab_test_code", "lab_test_prescription", function () {
      return {
        filters: [
          [
            "lab_test_group",
            "in",
            [
              "BIOCHEMISTRY",
              "HEMATOLOGY",
              "HISTOLOGY",
              "MICROBIOLOGY",
              "SEROLOGY",
            ],
          ],
        ],
      };
    });

    // Filtering generic drug list to only show generic name and omit gerties codes
    frm.set_query("generic_drug", "prescription_table", function(doc, cdt, cdn) {
        var item = locals[cdt][cdn];
        console.log(item, "Generics.....")
        return {
            query: "gch_custom.services.rest.only_show_generic_name",
            // filters: {
            //     'item': item.item_code,
            // }
        };
    });

    // Filtering Default insurance field to only show unsuspended insurance categories
    frm.set_query("default_insurance", function () {
      return {
        filters: [["suspend", "in", ["0"]]],
      };
    });

    if (cur_frm.doc.mode_of_payment == "Insurance") {
      // Highlighting suspended insurance categories

      console.log("Insurance========================")

      frappe.call({
        method: "gch_custom.services.rest.check_if_insurance_suspended",
        args: {
          insurance_category: cur_frm.doc.default_insurance || " ",
        },
        callback: (res) => {
          if (res.message.suspend) {
            $('input[data-fieldname="default_insurance"]').css("color", "red");
            $('input[data-fieldname="default_insurance"]').css(
              "background-color",
              "#ff000014"
            );
            $('[data-fieldname="default_insurance"]').find(
              "label"
            )[0].innerHTML = "Default Insurance (Suspended, please verify!!!)";
            $('[data-fieldname="default_insurance"]').find(
              "label"
            )[0].style.color = "red";
          } else {
            $('input[data-fieldname="default_insurance"]').css(
              "color",
              "black"
            );
            $('input[data-fieldname="default_insurance"]').css(
              "background-color",
              "#F4F5F6"
            );
            $('[data-fieldname="default_insurance"]').find(
              "label"
            )[0].innerHTML = "Default Insurance";
            $('[data-fieldname="default_insurance"]').find(
              "label"
            )[0].style.color = "black";
          }
        },
      });
    }

    // CHECKING IF PATIENT DOB IS 1901 
    // -------------------------------
    var new_dob = frm.doc.date_of_birth || "1901-01-01";

    // checking if set date is greater than date today
    function isInThePast(date) {
      const today = new Date();

      // 👇️ OPTIONAL!
      // This line sets the hour of the current date to midnight
      // so the comparison only returns `true` if the passed in date
      // is at least yesterday
      today.setHours(0, 0, 0, 0);

      return date < today;
    }

    if (!isInThePast(new Date(new_dob))) {
      frappe.warn(
        "Error!!!",
        "Patient Date of Birth CANNOT be a date past today. Please confirm",
        () => {
          $('div[data-fieldname="date_of_birth"]').css(
            "background-color",
            "#ff00001f"
          );

          $('[data-fieldname="date_of_birth"]').find("label")[0].innerHTML =
            "<strong>Date Of Birth (recheck date of birth!)</strong>";

          $('[data-fieldname="date_of_birth"]').find("label")[0].style.color =
            "red";
        },

        "Continue",
        true,
        $('div[data-fieldname="date_of_birth"]').css(
          "background-color",
          "#ff00001f"
        ),

        ($('[data-fieldname="date_of_birth"]').find("label")[0].innerHTML =
          "<strong>Date Of Birth (recheck date of birth)</strong>"),
        ($('[data-fieldname="date_of_birth"]').find("label")[0].style.color =
          "red")
      );
    }






    // Making encounter fields mandatory
    // if(cur_frm.doc.workflow_state == "Pending Doctor") {

    //     frm.set_df_property("diagnosis_table", "reqd", 1);
    //     frm.refresh_field("diagnosis_table");

    //     frm.set_df_property("patient_physical_examination", "reqd", 1);
    //     frm.refresh_field("patient_physical_examination")

    //     cur_frm.fields_dict['diagnosis_table'].grid.toggle_reqd("medical_code", 1)
    // }

    // Make encounter fields mandatory for wellbaby and workflow state is pending vaccination
    // // // console.log(cur_frm.doc.clinic == "Wellbaby Growth Monitoring - GCH")

    // if (cur_frm.doc.clinic == "Wellbaby - GCH" && cur_frm.doc.workflow_state == "Pending Vaccination") {

    //     // // console.log("Hereeeeeeeeee, well babyy....")

    //     frm.set_df_property("unintentional_weight_loss", "reqd", 1);
    //     frm.refresh_field("unintentional_weight_loss")

    //     frm.set_df_property("nutritional_supplementation_or_specialized_feeding", "reqd", 1);
    //     frm.refresh_field("nutritional_supplementation_or_specialized_feeding")

    //     frm.set_df_property("routine_nutritional_counselling_not_done_at_6_months", "reqd", 1);
    //     frm.refresh_field("routine_nutritional_counselling_not_done_at_6_months")

    //     // Wellbaby Audiology
    //     frm.set_df_property("relative_with_ear_surgery", "reqd", 1)
    //     frm.refresh_field("relative_with_ear_surgery")

    //     frm.set_df_property("relative_with_hearing_loss", "reqd", 1)
    //     frm.refresh_field("relative_with_hearing_loss")

    //     frm.set_df_property("relative_with_hearing_devices", "reqd", 1)
    //     frm.refresh_field("relative_with_hearing_devices")

    //     frm.set_df_property("right_ear_results", "reqd", 1)
    //     frm.refresh_field("right_ear_results")

    //     frm.set_df_property("left_ear_results", "reqd", 1)
    //     frm.refresh_field("left_ear_results")

    //     frm.set_df_property("_followup_actions", "reqd", 1)
    //     frm.refresh_field("_followup_actions")

    //     frm.set_df_property("nurse_notes_table", "reqd", 1)
    //     frm.refresh_field("nurse_notes_table")

    // }

    // // Setting nurse notes mandatory at wellbaby growth monitoring
    // if(cur_frm.doc.clinic == "Wellbaby Growth Monitoring - GCH" && cur_frm.doc.workflow_state == "Pending Triage") {
    //     frm.set_df_property("nurse_notes_table", "reqd", 1)
    //     frm.refresh_field("nurse_notes_table")
    // }

    // Setting nurse notes mandatory at wellbaby growth monitoring
    // if(cur_frm.doc.clinic == "Wellbaby - GCH" && cur_frm.doc.workflow_state == "Pending Vaccination") {
    //     frm.set_df_property("nurse_notes_table", "reqd", 1)
    //     frm.refresh_field("nurse_notes_table")
    // }

    // Reopening of encounters within 24 hours
    var reopend_enc = localStorage.getItem("reopened_enc") || " ";

    if (reopend_enc == cur_frm.doc.encounter_number) {
      // // // console.log(true);

      // Only making clinical notes editable but not deletable
      frm.set_df_property("patient_history", "read_only", 0);
      frm.set_df_property("patient_history", "cannot_delete_rows", 1);

      frm.set_df_property("patient_physical_examination", "read_only", 0);
      frm.set_df_property(
        "patient_physical_examination",
        "cannot_delete_rows",
        1
      );

      frm.set_df_property("patient_plan_of_action_notes", "read_only", 0);
      frm.set_df_property(
        "patient_plan_of_action_notes",
        "cannot_delete_rows",
        1
      );

      frm.set_df_property("service_referral", "read_only", 0);
      frm.set_df_property("service_referral", "cannot_delete_rows", 1);

      frm.set_df_property("nursing_chief_complaint", "read_only", 0);
      frm.set_df_property("nursing_chief_complaint", "cannot_delete_rows", 1);

      // Checking if corresponding invoice is open to enable adding of procedures or medication
      frappe.call({
        method: "gch_custom.services.rest.is_invoice_open",
        args: {
          encounter_number: frm.doc.name,
        },
        callback: function (res) {
          // // // console.log(res);
          // frappe.msgprint(res.message);
          if (res == true) {
            frm.set_df_property("procedure_prescription", "read_only", 0);
            frm.set_df_property(
              "procedure_prescription",
              "cannot_delete_rows",
              1
            );

            frm.set_df_property("prescription_table", "read_only", 0);
            frm.set_df_property("prescription_table", "cannot_delete_rows", 1);
          }
        },
      });
    }

    // Flagging COMMUNICABLE medical codes
    // cur_frm.fields_dict["diagnosis_table"].$wrapper
    //   .find(".grid-body .rows")
    //   .find(".grid-row")
    //   .each(function (i, item) {
    //     let d =
    //       locals[cur_frm.fields_dict["diagnosis_table"].grid.doctype][
    //         $(item).attr("data-name")
    //       ];
    //     if (d["is_communicable"] == 1) {
    //       $(item)
    //         .find(".grid-static-col")
    //         .css({ "background-color": "yellow" });
    //     }
    //   });

    // // // console.log(assessment_btn_press_count, "Assessment btn press count....")
    // Auto refreshing the page if the start Patient assessment button is pressed for the first time

    // if(assessment_btn_press_count == 1 && assessment_length_global < 1) {
    //   assessment_btn_press_count +=1
    //   location.reload()
    // }


    // if (
    //   frappe.user.has_role("GCH-Doctor") &&
    //   frm.doc.workflow_state == "Pending Doctor" &&
    //   !frm.doc.__islocal
    // ) {
    //   frm.set_df_property("diagnosis_table", "reqd", 1);
    //   frm.refresh_field("diagnosis_table");
    // } else if (
    //   frappe.user.has_role("GCH-Wellbaby Nurse") &&
    //   !frm.doc.__islocal &&
    //   frm.doc.clinic == "Wellbaby - GCH" &&
    //   frm.doc.workflow_state == "Pending Triage"
    // ) {
    //   frm.set_df_property("diagnosis_table", "reqd", 1);
    //   frm.refresh_field("diagnosis_table");
    // } else {
    //   frm.set_df_property("diagnosis_table", "reqd", 0);
    //   frm.refresh_field("diagnosis_table");
    // }

    if (frm.doc.__islocal) {
      frm.set_df_property("diagnosis_table", "reqd", 0);
      frm.refresh_field("diagnosis_table");
    }

    // Auto unchecking the change dob from encounter checkbox to autohide the dob field
    if (cur_frm.doc.change_date_of_birth == 1) {
      cur_frm.doc.change_date_of_birth = 0;

      cur_frm.set_df_property("change_date_of_birth", "checked", false);
      cur_frm.refresh_field("change_date_of_birth");

      cur_frm.set_df_property("dob", "hidden", true);
      cur_frm.refresh_field("dob");
    }

    frm.refresh_field("prescription_table");
    const encounter_number = frm.doc.encounter_number;

    // Make medical diagnosis mandatory if clinic is wellbaby growth monitoring
    if (
      cur_frm.doc.clinic == "Wellbaby - GCH" &&
      cur_frm.doc.workflow_state == "Pending Triage" &&
      !cur_frm.doc.__islocal
    ) {
      // frm.set_df_property("food_allergy", "reqd", 0);
      // frm.refresh_field("food_allergy");

      frm.set_df_property("diagnosis_table", "reqd", 0);
      frm.refresh_field("diagnosis_table");

      frm.set_df_property("child_fit_for_vaccination", "reqd", 1);
      frm.refresh_field("child_fit_for_vaccination");

      if (frm.doc.child_fit_for_vaccination == "Yes") {
        frm.set_df_property("visit_schedule", "reqd", 1);
        frm.refresh_field("visit_schedule");
      }

      //   frm.set_df_property("relative_with_ear_surgery", "reqd", 1);
      //   frm.refresh_field("relative_with_ear_surgery");

      //   frm.set_df_property("relative_with_hearing_loss", "reqd", 1);
      //   frm.refresh_field("relative_with_hearing_loss");

      //   frm.set_df_property("relative_with_hearing_devices", "reqd", 1);
      //   frm.refresh_field("relative_with_hearing_devices");

      //   frm.set_df_property("right_ear_results", "reqd", 1);
      //   frm.refresh_field("right_ear_results");

      //   frm.set_df_property("left_ear_results", "reqd", 1);
      //   frm.refresh_field("left_ear_results");

      //   frm.set_df_property("_followup_actions", "reqd", 1);
      //   frm.refresh_field("_followup_actions");
    }

    // Removing required on medical diagnosis if encounter is walk in
    if (cur_frm.doc.clinic.includes("Walk-In" || "Procedure - GCH" || "Results")) {
      frm.set_df_property("diagnosis_table", "reqd", 0);
      frm.set_df_property("vital_signs_table")
      
      frm.refresh_field("diagnosis_table");
      frm.refresh_field("vital_signs_table");
    }

    // Adding multidisciplinary custom button
    // frm.add_custom_button(__("Multidisciplinary"), function () {
    //   const url = `/app/multidisciplinary?encounter=${encounter_number}`;
    //   window.location.href = url;
    // });

    // Outsourced Services
    // frm.add_custom_button(
    //   __("Outsourced Services"),
    //   () => {
    //     frappe.call({
    //       method: "gch_custom.services.test_presc",
    //       callback: (res) => {
    //         console.log(res);
    //       }
    //     })
    //   },
    //   "Create test"
    // );

    frm.add_custom_button(
      __("Create Request"),
      () => {
        frappe.route_options = {
          encounter: frm.doc.name,
          type: "Outpatient"
        }
        frappe.new_doc("Outsourced Services");
      },
      "Outsourced Services"
    );

    frm.add_custom_button(
      __("View Requests"),
      async () => {
        // fetch all outsourced services attached to encounter
        await frappe
        .call({
          method: "gch_custom.services.get_outsourced_services",
          args: {
            "type": "outpatient",
            "encounter": frm.doc.name
          },
        })
        .done((r) => {
          let response = r.message;
          let dialog = new frappe.ui.Dialog({
            title: "Outsourced services",
            fields: [
              {
                label: "Outsourced Services List",
                fieldname: 'html',
                fieldtype: 'HTML',
              }
            ],
            size: 'large', // small, large, extra-large 
            primary_action_label: 'Close',
            primary_action() {
              dialog.hide();
            }
          });
      
          if(response.length > 0) {
            let outsourced_request = [];
            let ROWS = [];
      
            response.forEach((service) => {
              // Create a string for the child items
              let childItems = '';
              if (service.items && service.items.length > 0) {
                service.items.forEach(item => {
                  childItems += `
                    <tr>
                      <td colspan="3" style="padding-left: 30px;">- ${item.item_name}, Quantity: ${item.quantity}, Rate: ${item.rate}</td>
                    </tr>
                  `;
                });
              } else {
                childItems = `
                  <tr>
                    <td colspan="3" style="padding-left: 30px;">No items found</td>
                  </tr>
                `;
              }
      
              // Create a row for each service, and add child items below the service row
              ROWS.push(`
                <tr>
                  <td scope="col">${service.name}</td>
                  <td scope="col">${service.status}</td>
                  <td scope="col">
                    <a href="/app/outsourced-services/${service.name}" class="btn btn-sm">view</a>
                  </td>
                </tr>
                ${childItems} <!-- Add child items here -->
              `);
            });
      
            let htmlC = `
            <table id="confirm" class="table table-bordered table-hover" style="font-size: 12px;">
              <thead>
                <tr>
                  <th scope="col">Req No</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody id="dynamic_prescription_table">
                ${ROWS.join('')} <!-- Join all rows here -->
              </tbody>
            </table>
            `;
            
            dialog.set_value('html', htmlC);
            dialog.show();
          }
          else {
            frappe.msgprint('No outsourced services on this encounter');
          }
        });      
        },
      "Outsourced Services"
    );

    // frm.add_custom_button(
    //   __("create pacs patient"),
    //   () => {
    //     console.log();
    //     frappe.call({
    //       method: "gch_pacs.utils.ris_pacs.create_patient",
    //       callback: (res) => {
    //         console.log(res);
    //       }
    //     })
    //   },
    //   "Create"
    // );

    // frm.add_custom_button(
    //   __("Send to pacs"),
    //   () => {
    //     console.log();
    //     frappe.call({
    //       method: "gch_pacs.utils.ris_pacs.create_request",
    //       callback: (res) => {
    //         console.log(res);
    //       }
    //     })
    //   },
    //   "Create"
    // );

    // frm.add_custom_button(
    //   __("Test APIS"),
    //   () => {
    //     console.log();
    //     frappe.call({
    //       method: "gch_pacs.utils.ris_pacs.test_apis",
    //       callback: (res) => {
    //         console.log(res);
    //       }
    //     })
    //   },
    //   "Create"
    // );

    // Adding Patient Dashboard redirect button
    frm.add_custom_button(
      __("Patient Dashboard"),
      function () {
        if (frm.doc.patient) {
          frappe.route_options = { patient: frm.doc.patient };
          frappe.set_route(`patient-dashboard`);
        } else {
          frappe.msgprint(__("Please select Patient"));
        }
      },
      "View"
    );

    frm.add_custom_button(
      __("Medicines Complete"),
      () => {
        window.open(
          "https://www.medicinescomplete.com/log-in/#/",
          "_blank"
        );
      },
      "View"
    );

    // External Medicines Calculator for doctor and pharmacists
    frm.add_custom_button(
      __("Regular Medications Dosage Calculator"),
      () => {
        window.open(
          "https://tender-ride-a0f5af.netlify.app/treatment.html",
          "_blank"
        );
      },
      "View"
    );

    frm.add_custom_button(
      __("Emergency Medications Dosage Calculator"),
      () => {
        window.open(
          "https://tender-ride-a0f5af.netlify.app/emergency.html",
          "_blank"
        );
      },
      "View"
    );

    // Adding Reference Manual PDFs under view button drop down
    frm.add_custom_button(
      __("Laboratory Handbook"),
      () => {
        window.open("/files/lab.pdf", "_blank");
      },
      "View"
    );

    frm.add_custom_button(
      __("Standard Treatment Guidelines"),
      () => {
        window.open("/files/gch_standard_treatment_guidelines.pdf", "_blank");
      },
      "View"
    );

    frm.add_custom_button(
      __("Basic Paediatric Protocols"),
      () => {
        window.open("/files/gch_basic_paediatric_protocol.pdf", "_blank");
      },
      "View"
    );

    frm.add_custom_button(
        __("Nanda Handbook 2021 to 2023"),
        () => {
            window.open("/files/NANDA_Handbook_2021_TO_2023.pdf", "__blank");
        },
        "View"
    );

    frm.add_custom_button(
      __("Electronic Guidelines"),
      () => {
          window.open("/files/Electronic-Guidelines-2019.pdf", "__blank");
      },
      "View"
  );

    // cur_frm.page.add_menu_item(__("Patient Dashboard"), function () {
    //     // // console.log("Here!!!!!!!!!!!!!!!!!!!")

    // }  )

    cur_frm.page.add_action_item(__("Resend Details to Labware"), function () {
      frappe.msgprint({
        title: __("Resend To Labware"),
        message: __("Are you sure you want to proceed?"),
        primary_action: {
          label: "Proceed",
          action: function () {
            frappe.call({
              method: "gch_custom.services.send_adt",
              args: {
                encounter_number: frm.doc.name,
              },
              callback: function (res) {
                console.log(res);
                if(res?.message?.sent === true){
                  frappe.show_alert(
                    {
                      message: __("Resent Patient Details to Labware."),
                      indicator: "green",
                    },
                    5
                  );

                }
                // frappe.msgprint(res.message);
                frappe.hide_msgprint();
              
              },
            });
          },
        },
      });
    });

    cur_frm.page.add_action_item(__("Send Tests to Labware"), function () {
      frappe.msgprint({
        title: __("Send Tests To Labware"),
        message: __("Are you sure you want to proceed?"),
        primary_action: {
          label: "Proceed",
          action: function () {
            frappe.call({
              method: "gch_custom.services.send_labtest",
              args: {
                encounter_number: frm.doc.name,
              },
              callback: function (res) {
                if (res.message.sent === true) {
                  frappe.hide_msgprint()
                  frappe.show_alert(
                    {
                      message: __("Sent Labtests to Labware."),
                      indicator: "green",
                    },
                    5
                  );
                  cur_frm.reload_doc();
                } else {
                  frappe.show_alert(
                    {
                      message: __(
                        "Failed to send Labtests to Labware. Try again later"
                      ),
                      indicator: "red",
                    },
                    5
                  );
                }
              },
            });
          },
        },
      });
    });

    // Fetching assessments if not available in encounter assessment child table
    if (cur_frm.doc.encounter_number) {
      get_encounter_assessment(frm);
    } 
    else if (cur_frm.doc.encounter_number && cur_frm.doc.encounter_assessment_table){

        // FILL ASSESSMENTS HTML TABLE
        let item_array = [];

        let assessment = cur_frm.doc.encounter_assessment_table
        
        assessment.forEach((assess) => {
          console.log(assess)
            
          // Fetch submitted by full name not email
        //   let assess_submitted_by = frappe.db.get_value("User", {name: assess.owner}, "full_name")
        
        //   assess_submitted_by = assess_submitted_by.json

        //   console.log(assess_submitted_by, "USer here.............")

          // Flagging pain assessments 6 and above   
          if (assess.type.includes("Falls Risk") && (parseInt(assess.score) == 4 || parseInt(assess.score) == 5) ) {
            item_array.push(
              `<tr style="background-color:yellow;">
                                <td style = "white-space: nowrap; color:black;"> <a style="color: blue;" href="/app/patient-assessment/${assess.assessment_no}">` +
              assess.assessment_no +
              `</a></td>
                                <td style = "white-space: nowrap; color:black;">` +
              assess.type +
              `</td>
                                <td style = "white-space: nowrap; color:black;">` +
              assess.score +
              `</td>
                                <td style = "white-space: nowrap; color:black;">` +
              assess.date +
              `</td>
                                <td style = "white-space: nowrap; color:black;">` +
              assess.time +
              `</td>
                                <td style = "white-space: nowrap;  color:black;">` +
              assess.owner +
              `</td>
                                <td style="color: black;">` +
              assess.action +
              `</td>
                                
                            </tr>`
            );
            
            // Flagging Falls Risk Assessments 6 and above
          } else if (parseInt(assess.score) > 5) {
            item_array.push(
                `   <tr style="background-color:#ff00000a; color: black;">
                                <td style = "white-space: nowrap; color:red;"> <a style="color: blue;" href="/app/patient-assessment/${assess.assessment_no}">` +
                    assess.assessment_no +
                    `</a></td>
                                        <td style = "white-space: nowrap; color:red;">` +
                    assess.type +
                    `</td>
                                        <td style = "white-space: nowrap; color:red;">` +
                    assess.score +
                    `</td>
                                        <td style = "white-space: nowrap; color:red;">` +
                    assess.date +
                    `</td>
                                        <td style = "white-space: nowrap; color:red;">` +
                    assess.time +
                    `</td>
                                        <td style = "white-space: nowrap;  color:red;">` +
                    assess.owner +
                    `</td>
                                        <td style="color: red;">` +
                    assess.action +
                    `</td>
                                  
                              </tr>`
            );
          } else {
                item_array.push(
                    `<tr>
                                <td style = "white-space: nowrap; color:blue;"> <a style="color: blue;" href="/app/patient-assessment/${assess.assessment_no}">` +
                    assess.assessment_no +
                    `</a></td>
                                        <td style = "white-space: nowrap;">` +
                    assess.type +
                    `</td>
                                        <td style = "white-space: nowrap;">` +
                    assess.score +
                    `</td>
                                        <td style = "white-space: nowrap;">` +
                    assess.date +
                    `</td>
                                        <td style = "white-space: nowrap;">` +
                    assess.time +
                    `</td>
                                        <td style = "white-space: nowrap;">` +
                    assess.owner +
                    `</td>
                                        <td>` +
                    assess.action +
                    `</td>
                                    
                                </tr>`
                );
          }
        });

        $(".encounter-assessment").html(item_array);


    }

    frappe.require("/assets/gch_custom/js/patient_encounter/lct.js", () => {
      handle_lct(frm);
    });
    frappe.require("/assets/gch_custom/js/patient_encounter/slade.js", () => {
      handle_slade(frm);
    });
    frappe.require("/assets/gch_custom/js/patient_encounter/smart.js", () => {
      handle_smart(frm);
    });
    frappe.require("/assets/gch_custom/js/patient_encounter/mtiba.js", () => {
      handle_mtiba(frm);
    });
    frappe.require(
      "/assets/gch_custom/js/patient_encounter/initiate_insurance.js",
      () => {
        handle_initiate_insurance(frm);
      }
    );

    // Creating a custom button that will only be accessible to receptionist for reopening encounters within 24 hrs

    let time_difference_hours = frappe.datetime.get_hour_diff(
      frappe.datetime.now_datetime(),
      cur_frm.doc.modified
    );

    if (
      frappe.user.has_role("GCH-Reception") &&
      cur_frm.doc.workflow_state == "Encounter Closed" &&
      cur_frm.doc.docstatus == 1 &&
      time_difference_hours <= 24
    ) {
      frm
        .add_custom_button(__("Reopen Encounter"), function () {
          let fields = [
            {
              label: "Date and Time of Reopening",
              fieldname: "reopening_date_time",
              fieldtype: "Datetime",
              default: frappe.datetime.now_datetime(),
              reqd: 1,
            },
            {
              label: "Reason for Reopening",
              fieldname: "reopening_reason",
              fieldtype: "Small Text",
              reqd: 1,
            },
          ];

          frappe.prompt(
            fields,
            function (data) {
              frappe.call({
                method: "gch_custom.services.rest.reopen_encounter",
                args: {
                  encounter: cur_frm.doc.name,
                  reopening_date_time: data.reopening_date_time,
                  reopening_reason: data.reopening_reason,
                  reopened_by: frappe.session.user,
                },
                callback: function (res) {
                  if (res.message == true) {
                    // Storing a variable to local storage to know the encounter has been reopened
                    localStorage.setItem(
                      "reopened_enc",
                      cur_frm.doc.encounter_number
                    );

                    // $('*[data-fieldname="diagnosis_table"]').find('.grid-delete-row').hide() ---- Hiding main delete button

                    // $('*[data-fieldname="diagnosis_table"]').find('.grid-remove-rows').hide() ----- Hdding per row delete button

                    cur_frm.reload_doc();

                    frappe.msgprint({
                      title: __("Notification"),
                      indicator: "green",
                      message: __("Document updated successfully"),
                    });
                  } else {
                    frappe.msgprint({
                      title: __("Notification"),
                      indicator: "red",
                      message: __("Something went wrong..... Please try again"),
                    });
                  }
                },
              });
            },
            __("Reopening Encounter"),
            __("Submit")
          );
        })
        .addClass("reopen-encounter")
        .css({ "background-color": "#FD9937", "font-weight": "bold" });
    }
    
    // Making some fields not mandatory in Wellbaby for patients above 14 weeks
    function weeksBetween(d1, d2) {
        return Math.round((d2 - d1) / (7 * 24 * 60 * 60 * 1000));
    }

    let weeks = weeksBetween(new Date(cur_frm.doc.date_of_birth.split("-").join(", ")), new Date());


    if (cur_frm.doc.clinic.includes("Wellbaby") && weeks > 14) {
        frm.set_df_property("relative_with_ear_surgery", "reqd", 0);
        frm.refresh_field("relative_with_ear_surgery");

        frm.set_df_property("relative_with_hearing_loss", "reqd", 0);
        frm.refresh_field("relative_with_hearing_loss");

        frm.set_df_property("relative_with_hearing_devices", "reqd", 0);
        frm.refresh_field("relative_with_hearing_devices");

        frm.set_df_property("right_ear_results", "reqd", 0);
        frm.refresh_field("right_ear_results");

        frm.set_df_property("left_ear_results", "reqd", 0);
        frm.refresh_field("left_ear_results");

        frm.set_df_property("_followup_actions", "reqd", 0);
        frm.refresh_field("_followup_actions");

        frm.set_df_property("diagnosis_table", "reqd", 0);
        frm.refresh_field("diagnosis_table");

        cur_frm.set_df_property("vital_signs_table", "reqd", 0);
        cur_frm.refresh_field("vital_signs_table");

        cur_frm.set_df_property("unintentional_weight_loss", "reqd", 0);
        cur_frm.refresh_field("unintentional_weight_loss");

        cur_frm.set_df_property("routine_nutritional_counselling_not_done_at_6_months", "reqd", 0);
        cur_frm.refresh_field("routine_nutritional_counselling_not_done_at_6_months");


        cur_frm.set_df_property("nutritional_supplementation_or_specialized_feeding", "reqd", 0);
        cur_frm.refresh_field("nutritional_supplementation_or_specialized_feeding");
        
    }

    // Uncollapsing encounter sections based on active user
    // if(frappe.user.has_role("GCH-Doctor")) {
    //     cur_frm.fields_dict['encounter_history'].collapse()
    //     cur_frm.fields_dict['physical_examinations'].collapse()
    //     cur_frm.fields_dict['encounter_history'].collapse()
    //     cur_frm.fields_dict['plan_of_action'].collapse()
    //     cur_frm.fields_dict['prescription_details_section'].collapse()

    //     console.log("Here.........")
        

    // } else if (frappe.user.has_role("GCH-Nurse")) {
    //     cur_frm.fields_dict['triage_notes'].collapse()
    //     cur_frm.fields_dict['physical_examinations'].collapse()
    //     cur_frm.fields_dict['plan_of_action'].collapse()
    //     // cur_frm.fields_dict['encounter_history'].collapse()
        
    // }  else if (frappe.user.has_role("GCH-Pharmacy")) {
    //     cur_frm.fields_dict['traige_drugs_administered'].collapse()
    //     cur_frm.fields_dict['sb_drug_prescription'].collapse()
    //     cur_frm.fields_dict['prescription_details_section'].collapse()
    // }

  },

  has_no_food_allergy: (frm) => {
    if (frm.doc.has_no_food_allergy == 1) {
      // // // console.log("changing");
      frm.set_df_property("food_allergy", "reqd", 0);
      frm.refresh_field("food_allergy");
    } else if (frm.doc.has_no_food_allergy == 0) {
      // // // console.log("mandatory...");
      frm.set_df_property("food_allergy", "reqd", 1);
      frm.refresh_field("food_allergy");
    }
  },

  has_no_drug_allergy: (frm) => {
    if (frm.doc.has_no_drug_allergy == 1) {
      // // // console.log("changing....");
      frm.set_df_property("drug_allergy", "reqd", 0);
      frm.refresh_field("drug_allergy");
    } else if (frm.doc.has_no_drug_allergy == 0) {
      // // // console.log("mandatory...");
      frm.set_df_property("drug_allergy", "reqd", 1);
      frm.refresh_field("drug_allergy");
    }
  },

  generate_bmi_for_age_chart: (frm) => {
    frm.set_df_property("bmi_for_age_chart", "hidden", false);
    frm.refresh_field("bmi_for_age_chart");

    // Loading script synchronusly
    let bmiChart = document.createElement("script");
    bmiChart.setAttribute(
      "src",
      "/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/bmi_for_age_chart.js"
    );
    bmiChart.async = false;
    document.body.appendChild(bmiChart);

    // frappe.require("/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/bmi_for_age_chart.js", () => {
    //   // // console.log("chart loaded")
    // })
  },
  generate_height_for_age_chart: (frm) => {
    frm.set_df_property("height_for_age_chart_gch", "hidden", false);
    frm.refresh_field("height_for_age_chart_gch");

    // Loading script synchronusly
    let heightChart = document.createElement("script");
    heightChart.setAttribute(
      "src",
      "/assets/gch_custom/js/patient_encounter/percentile_data/height_for_age/height_for_age_chart.js"
    );
    heightChart.async = false;
    document.body.appendChild(heightChart);

    // frappe.require("/assets/gch_custom/js/patient_encounter/percentile_data/height_for_age/height_for_age_chart.js")
  },
  generate_weight_for_age_chart: (frm) => {
    frm.set_df_property("weight_for_age_chart", "hidden", false);
    frm.refresh_field("weight_for_age_chart");

    // Loading script synchronusly
    let weightChart = document.createElement("script");
    weightChart.setAttribute(
      "src",
      "/assets/gch_custom/js/patient_encounter/percentile_data/weight_for_age/weight_for_age_chart.js"
    );
    weightChart.async = false;
    document.body.appendChild(weightChart);

    // frappe.require("/assets/gch_custom/js/patient_encounter/percentile_data/weight_for_age/weight_for_age_chart.js")
  },
  fetch_anthropometry_history: (frm) => {
    // // // console.log("Fetching Previous Measurements......");

    let patient = frm.doc.patient;
    let patient_uhid = frm.doc.patient_uhid;
    // 
    // // // console.log(patient, patient_uhid);
    frappe.call({
      method: "gch_custom.services.rest.fetch_anthropometry_history",
      args: {
        patient,
        patient_uhid,
      },
      callback: function (res) {
        // // // console.log(res);

        frm.doc.anthropometry_table = [];

        $.each(res.message, function (_i, e) {
          let entry = frm.add_child("anthropometry_table");
          entry.weight_in_kilograms = e.weight_in_kilograms;
          entry.height_in_centimeters = e.height_in_centimeters;
          entry.muac = e.muac;
          entry.bmi = e.bmi;
          entry.head_circumference_in_centimeters =
            e.head_circumference_in_centimeters;
          entry.date_taken = e.creation;
          entry.bsa = e.bsa;
          entry.bmi_for_age_percentile = e.bmi_for_age;
          entry.weight_for_age_percentile = e.weight_for_age;
          entry.height_for_age_percentile = e.height_for_age;
          entry.encounter = e.encounter_number;
        });
        refresh_field("anthropometry_table");
      },
    });
  },
  child_fit_for_vaccination: (frm) => {
    // // // console.log(frm.doc.child_fit_for_vaccination);
    if (frm.doc.child_fit_for_vaccination == "Yes") {
      frm.set_df_property("vaccination_shedule", "reqd", true);
      frm.refresh_field("vaccination_shedule");
    }
  },
  default_insurance: async (frm) => {
    // Filtering Default insurance field to only show unsuspended insurance categories
    frm.set_query("default_insurance", function () {
      return {
        filters: [["suspend", "in", ["0"]]],
      };
    });

    let insurance_category = cur_frm.doc.default_insurance || " ";

    const patient_insurance_list = await get_patient_insurance(frm.doc.patient);

    // console.log(patient_insurance_list, "Here==================")

    if (patient_insurance_list.length > 0 && frm.doc.docstatus == 0) {
        console.log({ patient_insurance_list });
        let insurances = [];
        for (let index = 0; index < patient_insurance_list.length; index++) {
          const insurance = patient_insurance_list[index];
          insurances.push(insurance.insurance__scheme);
          if (insurance.is_default) {
            // "principal_member", "membership_no"
            frm.set_value("principal_member", insurance.principal_member);
            frm.refresh_field("principal_member");
            frm.set_value("membership_no", insurance.membership_no);
            frm.refresh_field("membership_no");
          }
        }
        
    }

    // Highlighting suspended insurance categories
    frappe.call({
      method: "gch_custom.services.rest.check_if_insurance_suspended",
      args: {
        insurance_category,
      },
      callback: (res) => {
        if (res.message.suspend) {
          $('input[data-fieldname="default_insurance"]').css("color", "red");
          $('input[data-fieldname="default_insurance"]').css(
            "background-color",
            "#ff000014"
          );
          $('[data-fieldname="default_insurance"]').find("label")[0].innerHTML =
            "Default Insurance (Suspended, please verify!)";
          $('[data-fieldname="default_insurance"]').find(
            "label"
          )[0].style.color = "red";
        } else {
          $('input[data-fieldname="default_insurance"]').css("color", "black");
          $('input[data-fieldname="default_insurance"]').css(
            "background-color",
            "#F4F5F6"
          );
          $('[data-fieldname="default_insurance"]').find("label")[0].innerHTML =
            "Default Insurance";
          $('[data-fieldname="default_insurance"]').find(
            "label"
          )[0].style.color = "black";
        }
      },
    });

    // Updating default insurance on encounter if updated on sales invoice
    if (cur_frm.doc.default_insurance && cur_frm.doc.sales_invoice) {
      frappe.call({
        method:
          "gch_custom.services.rest.update_sales_invoice_insurance_from_enc",
        args: {
          changed_default_insurance: cur_frm.doc.default_insurance,
          invoice_number: cur_frm.doc.sales_invoice,
        },
        callback: function (res) {
            // console.log(res);
            if (res.message == true) {
                frappe.show_alert(
                    {
                      message: __("Sales invoice insurance details updated successfully."),
                      indicator: "green",
                    },
                    5
                );
            } else {
                frappe.show_alert(
                    {
                      message: __(res.message),
                      indicator: "red",
                    },
                    10
                );
            }
        },
      });
    }
  },
  membership_no: (frm) => {
    // Updating membership number on sales invoice if changed on encounter
    if(cur_frm.doc.membership_no && cur_frm.doc.sales_invoice) {
        frappe.call({
            method: "gch_custom.services.rest.update_sales_invoice_membership_no_from_enc",
            args: {
                changed_membership_no: cur_frm.doc.membership_no,
                invoice_number: cur_frm.doc.sales_invoice,
            },
            callback: (res) => {
                // console.log(res);
            }
        })
    }

  },
  principal_member: (frm) => {
    // Updating Principal Member Name on Sales Invoice if changed on encounter
    if(cur_frm.doc.principal_member && cur_frm.doc.sales_invoice) {
        frappe.call({
            method: "gch_custom.services.rest.update_sales_invoice_principal_member_from_enc",
            args: {
                changed_principal_member: cur_frm.doc.principal_member,
                invoice_number: cur_frm.doc.sales_invoice,
            },
            callback: (res) => {
                console.log(res)
            }
        })
    }
  },
  mode_of_payment: (frm) => {
    // Making default insurance mandatory if the selected M.O.P is insurance
    if (frm.doc.mode_of_payment == "Insurance") {
      frm.set_df_property("default_insurance", "reqd", 1);
      frm.refresh_field("default_insurance");

      frm.set_df_property('principal_member', 'reqd', 1);
      frm.set_df_property('principal_member')

      frm.set_df_property('membership_no', 'reqd', 1);
      frm.set_df_property('membership_no')

    } else {
      frm.set_df_property("default_insurance", "reqd", 0);
      frm.refresh_field("default_insurance");

      frm.set_df_property('principal_member', 'reqd', 0);
      frm.set_df_property('principal_member')

      frm.set_df_property('membership_no', 'reqd', 0);
      frm.set_df_property('membership_no')

    }
    frappe.require(
      "/assets/gch_custom/js/patient_encounter/mode_of_payment.js",
      () => {
        handle_mode_of_payment(frm);
      }
    );

    // Update mode of payment on invoice if changed on encounter
    if(cur_frm.doc.sales_invoice && !cur_frm.doc.__islocal && cur_frm.doc.mode_of_payment) {
        frappe.call({
            method: "gch_custom.services.rest.update_mop_on_invoice",
            args: {
                "sales_invoice": cur_frm.doc.sales_invoice,
                "mode_of_payment": cur_frm.doc.mode_of_payment
            },
            callback: (res) => {
                if (res.message == true) {
                    frappe.show_alert(
                        {
                          message: __("Mode of Payment Updated on Invoice"),
                          indicator: "green",
                        },
                        5
                    );
                }
            }
        })
    }

  },
  // Make Reason mandatory if Noisy is selected
  reason_right_ear: (frm) => {
    if (frm.doc.right_ear_results == "Noisy") {
      frm.set_df_property("reason_right_ear", "reqd", 1);
      frm.refresh_field("reason_right_ear");
      // // // console.log("Here");
    }
  },

  diagnosis_table: (frm) => {
    if (frm.doc.diagnosis_table.length > 0) {
      // frm.set_df_property("gch_standard_treatment_guideline_mapping", "read_only", true);
    }
  },
  before_workflow_action: (frm) => {
    // Function used to scroll to the fields view when an error is thrown
    let scrollToElementView = (data_field_name) => {
      let offsetPosition =
        $(`[data-fieldname=${data_field_name}]`).get(0).getBoundingClientRect()
          .top +
        window.pageYOffset -
        300;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    };

    // Setting Healthcare Practitioner to encounter if current state is Doctor
    if(cur_frm.doc.workflow_state == "Pending Doctor" && frappe.user.has_role("GCH-Doctor") && !cur_frm.doc.practitioner) {
        console.log("Assigning practitioner.......")
        frappe.call({
            method: "gch_custom.services.rest.fetch_practitioner_name",
            async: false,
            args: { "practitioner_email" : frappe.user.name },
            callback: (res) => {
                if(res.message) {
                    frm.set_value("practitioner", res.message[0].name)
                    // frappe.db.set_value("Patient Encounter", encounter, {
                    //     practitioner: res.message[0].name
                    // })
                    frm.save()
                }

            }
        })
    }

    // Making doctor prescription fields mandatory before changing workflow states
    if (cur_frm.doc.workflow_state == "Pending Doctor" && frappe.user.has_role("GCH-Doctor")) {
      
        cur_frm.get_field("prescription_table").grid.toggle_reqd("generic_drug", true);
  
        cur_frm.get_field("prescription_table").grid.toggle_reqd("preparation_type", true);
  
        cur_frm.get_field("prescription_table").grid.toggle_reqd("route", true);
  
        cur_frm.get_field("prescription_table").grid.toggle_reqd("dose", true);
  
        cur_frm.get_field("prescription_table").grid.toggle_reqd("dose_uom", true);
  
        cur_frm.get_field("prescription_table").grid.toggle_reqd("prescription_frequency", true);
  
        cur_frm.get_field("prescription_table").grid.toggle_reqd("duration", true);
    }

    if (
      cur_frm.doc.clinic == "Wellbaby Growth Monitoring - GCH" ||
      ("Wellbaby - GCH" && cur_frm.doc.workflow_state == "Pending Vaccination")
    ) {
      if (!frm.doc.__islocal && frm.doc.height_in_centimeters <= 10) {
        // frappe.validated = false;
        scrollToElementView("height_in_centimeters");

        frappe.throw(__("Please confirm the patient's height"));
      }

      if (!frm.doc.__islocal && frm.doc.weight_in_kilograms <= 0) {
        // frappe.validated = false;
        scrollToElementView("weight_in_kilograms");

        frappe.throw(__("Please confirm the patient's weight"));
      }

      // for(let i=0; i <= cur_frm.doc.vital_signs_table.length -1; i++) {

      //     if(cur_frm.doc.vital_signs_table[i]) {
      //         // Validate other vitals apart from temperature for well baby
      //         if(cur_frm.doc.vital_signs_table[i].patient_encounter_heart_rate == 0) {

      //             frappe.throw(__("Please verify heart rate in vital signs table"));
      //         }

      //         if(cur_frm.doc.vital_signs_table[i].patient_encounter_respiratory_rate == 0) {
      //             frappe.throw(__("Please verify respiratory rate in vital signs table"));

      //         }

      //         if(cur_frm.doc.vital_signs_table[i].patient_encounter_percutaneous_oxygen == 0) {

      //             frappe.throw(__("Please verify oxygen saturation in vital signs table"));

      //         }

      //         if(cur_frm.doc.vital_signs_table[i].patient_encounter_bp_systolic == 0) {

      //             frappe.throw(__("Please verify bp systolic in vital signs table"));

      //         }

      //         if(cur_frm.doc.vital_signs_table[i].patient_encounter_bp_diastolic == 0) {

      //             frappe.throw(__("Please verify bp diastolic in vital signs table"));

      //         }

      //     }

      // }

      if (
        cur_frm.doc.food_allergy.length == 0 &&
        cur_frm.doc.has_no_food_allergy != 1
      ) {
        frappe.validated = false;
        cur_frm.set_df_property("food_allergy", "reqd", 1);
        cur_frm.refresh_field("food_allergy");

        cur_frm.set_df_property("drug_allergy", "reqd", 1);
        cur_frm.refresh_field("drug_allrgy");

        scrollToElementView("food_allergy");
        frappe.throw(__("Please Enter Food Allergies"));
      }

      if (
        cur_frm.doc.drug_allergy.length == 0 &&
        cur_frm.doc.has_no_drug_allergy != 1
      ) {
        frappe.validated = false;
        cur_frm.set_df_property("food_allergy", "reqd", 1);
        cur_frm.refresh_field("food_allergy");

        cur_frm.set_df_property("drug_allergy", "reqd", 1);
        cur_frm.refresh_field("drug_allrgy");

        scrollToElementView("drug_allergy");
        frappe.throw(__("Please Enter Drug Allergies"));
      }

      if (cur_frm.doc.diagnosis_table.length == 0) {
        frappe.validated = false;
        scrollToElementView("diagnosis_table");
        frappe.throw(__("Please enter Diagnosis"));
      }

      // // // console.log(assessment_length, "length from before workflow");
      if (assessment_length < 1 && !["Walk-In", "Results", "Daktari", "Wellbaby"].some(clinic => cur_frm.doc.clinic.includes(clinic))) 
      {
        frappe.validated = false;
        scrollToElementView("patient_encounter_assessment");
        frappe.throw(__("Please enter an assessment"));
      }



    }

    // Making Vital signs table mandatory during pending triage
    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.workflow_state == "Pending Triage" &&
      cur_frm.doc.vital_signs_table.length < 1 &&
      !cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari")
    ) {
      cur_frm.set_df_property("vital_signs_table", "reqd", 1);
      cur_frm.refresh_field("vital_signs_table");

      frappe.validated = false;

      scrollToElementView("head_circumference_in_centimeters");

      frappe.throw(__("Please Enter Vitals"));
    }
    
    // Ensuring that temperature is added during Triage

    if(cur_frm.doc.vital_signs_table[0]) {

        if (
            !cur_frm.doc.__islocal &&
            cur_frm.doc.workflow_state == "Pending Triage" &&
            cur_frm.doc.vital_signs_table[0].patient_encounter_temperature == 0 &&
            !cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari")
        ) {


            frappe.validated = false;

            scrollToElementView("head_circumference_in_centimeters");

            frappe.throw(__("Please Enter Patient Temperature in Vitals"))

        }

    }


    // Making Vital signs table mandatory during pending triage
    // if(!cur_frm.doc.__islocal &&
    //     cur_frm.doc.workflow_state == "Pending Triage" &&
    //     !cur_frm.doc.clinic.includes("Walk-In"))

    //     {
    //         cur_frm.set_df_property("vital_signs_table", "reqd", 1)
    //         cur_frm.refresh_field("vital_signs_table")

    //     }

    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.workflow_state == "Pending Triage" &&
      cur_frm.doc.clinic != "Wellbaby Growth Monitoring - GCH" &&
      cur_frm.doc.clinic != "Wellbaby - GCH" &&
      !cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari") &&
      frm.doc.clinic != "Procedure - GCH" &&
      !cur_frm.doc.unintentional_weight_loss
    ) {
      frappe.validated = false;

      frm.set_df_property("unintentional_weight_loss", "reqd", 1);
      frm.refresh_field("unintentional_weight_loss");
      frm.set_df_property(
        "nutritional_supplementation_or_specialized_feeding",
        "reqd",
        1
      );
      frm.refresh_field("nutritional_supplementation_or_specialized_feeding");
      frm.set_df_property(
        "routine_nutritional_counselling_not_done_at_6_months",
        "reqd",
        1
      );
      
      frm.refresh_field("routine_nutritional_counselling_not_done_at_6_months");

      scrollToElementView("unintentional_weight_loss");

      frappe.throw(
        __("Please fill in nutrition screening")
      );
    }

    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.workflow_state == "Pending Triage" &&
      cur_frm.doc.clinic != "Wellbaby Growth Monitoring - GCH" &&
      cur_frm.doc.clinic != "Wellbaby - GCH" &&
      !cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari") &&
      frm.doc.clinic != "Procedure - GCH" &&
      !cur_frm.doc.nutritional_supplementation_or_specialized_feeding
    ) {
      frappe.validated = false;
      scrollToElementView("nutritional_supplementation_or_specialized_feeding");

      frm.set_df_property("unintentional_weight_loss", "reqd", 1);
      frm.refresh_field("unintentional_weight_loss");
      frm.set_df_property(
        "nutritional_supplementation_or_specialized_feeding",
        "reqd",
        1
      );
      frm.refresh_field("nutritional_supplementation_or_specialized_feeding");
      frm.set_df_property(
        "routine_nutritional_counselling_not_done_at_6_months",
        "reqd",
        1
      );
      frm.refresh_field("routine_nutritional_counselling_not_done_at_6_months");

      frappe.throw(
        __(
          "Please fill if the patient is on Nutritional supplementations or speciliazed feeding"
        )
      );
    }

    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.workflow_state == "Pending Triage" &&
      cur_frm.doc.clinic != "Wellbaby Growth Monitoring - GCH" &&
      cur_frm.doc.clinic != "Wellbaby - GCH" &&
      !cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari") &&
      frm.doc.clinic != "Procedure - GCH" &&
      !cur_frm.doc.routine_nutritional_counselling_not_done_at_6_months
    ) {
      frappe.validated = false;
      scrollToElementView(
        "routine_nutritional_counselling_not_done_at_6_months"
      );

      frm.set_df_property("unintentional_weight_loss", "reqd", 1);
      frm.refresh_field("unintentional_weight_loss");
      frm.set_df_property(
        "nutritional_supplementation_or_specialized_feeding",
        "reqd",
        1
      );
      frm.refresh_field("nutritional_supplementation_or_specialized_feeding");
      frm.set_df_property(
        "routine_nutritional_counselling_not_done_at_6_months",
        "reqd",
        1
      );
      frm.refresh_field("routine_nutritional_counselling_not_done_at_6_months");

      frappe.throw(
        __(
          "Please fill if routine nutritional counselling was done at age of 6 months"
        )
      );
    }

    // // Making nutrition screening fields mandatory during triage  for normal clinics except wellbaby and walk-ins
    // if (!cur_frm.doc.__islocal &&
    //     cur_frm.doc.workflow_state == "Pending Triage" &&
    //     cur_frm.doc.clinic != "Wellbaby Growth Monitoring - GCH" &&
    //     cur_frm.doc.clinic != "Wellbaby - GCH" &&
    //     !cur_frm.doc.clinic.includes("Walk-In") &&
    //     frm.doc.clinic != "Procedure - GCH")
    //     {

    //     frm.set_df_property("nutritional_supplementation_or_specialized_feeding", "reqd", 1);
    //     frm.refresh_field("nutritional_supplementation_or_specialized_feeding")

    //     frm.set_df_property("routine_nutritional_counselling_not_done_at_6_months", "reqd", 1);
    //     frm.refresh_field("routine_nutritional_counselling_not_done_at_6_months")

    //     // cur_frm.fields_dict['vital_signs_table'].grid.toggle_reqd("patient_encounter_heart_rate", 1)
    //     // cur_frm.fields_dict['vital_signs_table'].grid.toggle_reqd("patient_encounter_respiratory_rate", 1)
    //     // cur_frm.fields_dict['vital_signs_table'].grid.toggle_reqd("patient_encounter_percutaneous_oxygen", 1)
    //     // cur_frm.fields_dict['vital_signs_table'].grid.toggle_reqd("patient_encounter_bp_systolic", 1)
    //     // cur_frm.fields_dict['vital_signs_table'].grid.toggle_reqd("patient_encounter_bp_diastolic", 1)

    // }

    // Making nursing chief complaint mandatory during triage for all clinics except wellbaby-gch
    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.workflow_state == "Pending Triage" &&
      cur_frm.doc.clinic != "Wellbaby - GCH" &&
      cur_frm.doc.clinic != "Wellbaby Growth Monitoring - GCH" &&
      cur_frm.doc.nursing_chief_complaint.length < 1 &&
      cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari") != true
    ) {
      frappe.validated = false;

      scrollToElementView("nursing_chief_complaint");

      frappe.throw("Please Enter Nursing Chief Complaint");
    }

    // Checking height and weight during triage for all clinics except wellbaby and walk-ins
    if (
      !frm.doc.__islocal &&
      frm.doc.weight_in_kilograms <= 0 &&
      !cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari") &&
      frm.doc.clinic != "Procedure - GCH" &&
      frm.doc.workflow_state == "Pending Triage" &&
      // Removing check for wellbaby
      frm.doc.clinic != "Wellbaby Growth Monitoring - GCH" &&
      frm.doc.clinic != "Wellbaby - GCH"
    ) {
      frappe.validated = false;

      scrollToElementView("weight_in_kilograms");

      frappe.throw("Invalid Weight");
    }
    if (
      (!frm.doc.__islocal &&
        !cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari") &&
        frm.doc.clinic != "Procedure - GCH" &&
        frm.doc.workflow_state == "Pending Triage" &&
        // Removing check for wellbaby
        frm.doc.clinic != "Wellbaby Growth Monitoring - GCH" &&
        frm.doc.clinic != "Wellbaby - GCH" &&
        frm.doc.height_in_centimeters <= 10) ||
      frm.doc.height_in_centimeters >= 200
    ) {
      frappe.validated = false;

      scrollToElementView("height_in_centimeters");

      frappe.throw("Invalid Height");
    }

    // Checking if drug and food allergies have been set during triage for normal clinic except wellbaby
    if (
      !frm.doc.__islocal &&
      frm.doc.has_no_food_allergy != true &&
      frm.doc.workflow_state == "Pending Triage" &&
      frm.doc.clinic != "Wellbaby - GCH" &&
      frm.doc.clinic != "Wellbaby Growth Monitoring - GCH" &&
      !cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari") &&
      frm.doc.clinic != "Procedure - GCH"
    ) {
      if (frm.doc.food_allergy.length == 0) {
        frappe.validated = false;

        scrollToElementView("food_allergy");

        frappe.throw("Please Enter Food Allergies");
      }
    }
    if (
      !frm.doc.__islocal &&
      frm.doc.has_no_drug_allergy != true &&
      frm.doc.workflow_state == "Pending Triage" &&
      frm.doc.clinic != "Wellbaby - GCH" &&
      frm.doc.clinic != "Wellbaby Growth Monitoring - GCH" &&
      !cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari") &&
      frm.doc.clinic != "Procedure - GCH"
    ) {
      if (frm.doc.drug_allergy.length == 0) {
        frappe.validated = false;

        scrollToElementView("drug_allergy");

        frappe.throw("Please Enter Drug Allergies");
      }
    }

    // Checking Drug and food allergy before save for wellbaby
    if (
      !frm.doc.__islocal &&
      frm.doc.workflow_state == "Pending Vaccination" &&
      frm.doc.has_no_drug_allergy != true &&
      frm.doc.clinic == "Wellbaby - GCH" &&
      frm.doc.clinic == "Wellbaby Growth Monitoring - GCH"
    ) {
      if (frm.doc.drug_allergy.length == 0) {
        frappe.validated = false;

        scrollToElementView("drug_allergy");

        frappe.throw("Please Enter Drug Allergies");
      }
    }
    if (
      !frm.doc.__islocal &&
      frm.doc.workflow_state == "Pending Vaccination" &&
      frm.doc.has_no_food_allergy != true &&
      frm.doc.clinic == "Wellbaby - GCH" &&
      frm.doc.clinic == "Wellbaby Growth Monitoring - GCH"
    ) {
      if (frm.doc.food_allergy.length == 0) {
        frappe.validated = false;

        scrollToElementView("food_allergy");

        frappe.throw("Please Enter Food Allergies");
      }
    }

    // Diagnosis height and weight for wellbaby growth monitoring is inquired for during the first triage
    if (
      cur_frm.doc.clinic == "Wellbaby Growth Monitoring - GCH" &&
      cur_frm.doc.workflow_state == "Pending Triage"
    ) {
      if (cur_frm.doc.diagnosis_table.length == 0) {
        scrollToElementView("diagnosis_table");
        frappe.throw(__("Please enter Diagnosis"));
      }

      if (!frm.doc.__islocal && frm.doc.height_in_centimeters <= 10) {
        scrollToElementView("height_in_centimeters");
        frappe.throw(__("Please confirm the patient's height"));
      }

      if (!frm.doc.__islocal && frm.doc.weight_in_kilograms <= 0) {
        scrollToElementView("weight_in_kilograms");
        frappe.throw(__("Please confirm the patient's weight"));
      }
    }

    // Checking if child fit for vaccination is filled for normal wellbaby during triage
    if (
      cur_frm.doc.clinic == "Wellbaby - GCH" &&
      cur_frm.doc.workflow_state == "Pending Triage"
    ) {
      if (!cur_frm.doc.child_fit_for_vaccination) {
        scrollToElementView("child_fit_for_vaccination");
        frappe.throw(
          __("Please enter whether the child is fit for vaccination")
        );
      }
      if (cur_frm.doc.diagnosis_table.length == 0) {
        scrollToElementView("diagnosis_table");
        frappe.throw(__("Please Enter Diagnosis"));
      }
    }

    // Making Diagnosis and patient history Mandatory for users with role of doctor
    if (
      frappe.user.has_role("GCH-Doctor") &&
      cur_frm.doc.diagnosis_table.length == 0
    ) {
      scrollToElementView("diagnosis_table");
      cur_frm.fields_dict["diagnosis_table"].grid.toggle_reqd(
        "medical_code",
        1
      );

      frappe.throw(__("Please Enter Diagnosis"));
    }

    // Making care objectives mandatory for role gch-doctor
    if (frappe.user.has_role("GCH-Doctor") && cur_frm.doc.patient_plan_of_action_notes.length == 0 && !frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari")) {
      cur_frm.fields_dict['patient_plan_of_action_notes'].grid.toggle_reqd("patient_encounter_plan_of_action_notes", 1)
      frappe.throw(__("Please Enter Patient Care Objectives or Plan of Action Notes"));
    }


    if (
      frappe.user.has_role("GCH-Doctor") &&
      cur_frm.doc.patient_history.length == 0 &&
      !cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari")
    ) {
      scrollToElementView("patient_history");
      frappe.throw(__("Please Enter Patient's History"));
    }

    // Diagnosis Mandatory for wellbaby nurse
    if (
      frappe.user.has_role("GCH-Wellbaby Nurse") &&
      !frm.doc.__islocal &&
      frm.doc.clinic == "Wellbaby - GCH" &&
      frm.doc.workflow_state == "Pending Triage" &&
      cur_frm.doc.diagnosis_table.length == 0
    ) {
      frm.set_df_property("diagnosis_table", "reqd", 1);
      frm.refresh_field("diagnosis_table");

      scrollToElementView("diagnosis_table");
      cur_frm.fields_dict["diagnosis_table"].grid.toggle_reqd(
        "medical_code",
        1
      );

      frappe.throw(__("Please Enter Diagnosis"));
    }

    // Diagnosis mandatory for wellbaby during vaccination
    if (
      cur_frm.doc.workflow_state == "Pending Vaccination" &&
      cur_frm.doc.clinic == "Wellbaby - GCH" &&
      cur_frm.doc.diagnosis_table.length == 0
    ) {
      frm.set_df_property("diagnosis_table", "reqd", 1);
      frm.refresh_field("diagnosis_table");

      scrollToElementView("diagnosis_table");
      cur_frm.fields_dict["diagnosis_table"].grid.toggle_reqd(
        "medical_code",
        1
      );

      frappe.throw(__("Please Enter Diagnosis"));
    }

    // Diagnosis mandatory for wellbaby growth monitoring during triage
    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.workflow_state == "Pending Triage" &&
      cur_frm.doc.clinic == "Wellbaby Growth Monitoring - GCH" &&
      cur_frm.doc.diagnosis_table.length == 0
    ) {
      frm.set_df_property("diagnosis_table", "reqd", 1);
      frm.refresh_field("diagnosis_table");

      scrollToElementView("diagnosis_table");
      cur_frm.fields_dict["diagnosis_table"].grid.toggle_reqd(
        "medical_code",
        1
      );

      frappe.throw(__("Please Enter Diagnosis"));
    }

    
    function weeksBetween(d1, d2) {
        return Math.round((d2 - d1) / (7 * 24 * 60 * 60 * 1000));
    }

    let weeks = weeksBetween(new Date(cur_frm.doc.date_of_birth.split("-").join(", ")), new Date());

    // Nutrition screening mandatory for wellbaby growth monitoring during triage
    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.workflow_state == "Pending Triage" &&
      cur_frm.doc.clinic == "Wellbaby Growth Monitoring - GCH" &&
      !cur_frm.doc.unintentional_weight_loss && 
      weeks < 15
    ) {
      frm.set_df_property("unintentional_weight_loss", "reqd", 1);
      frm.refresh_field("unintentional_weight_loss");
      frm.set_df_property(
        "nutritional_supplementation_or_specialized_feeding",
        "reqd",
        1
      );
      frm.refresh_field("nutritional_supplementation_or_specialized_feeding");
      frm.set_df_property(
        "routine_nutritional_counselling_not_done_at_6_months",
        "reqd",
        1
      );
      frm.refresh_field("routine_nutritional_counselling_not_done_at_6_months");

      scrollToElementView("unintentional_weight_loss");

      frappe.throw(
        __("Please fill in nutrition screening")
      );
    }

    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.workflow_state == "Pending Triage" &&
      cur_frm.doc.clinic == "Wellbaby Growth Monitoring - GCH" &&
      !cur_frm.doc.nutritional_supplementation_or_specialized_feeding && 
      weeks < 15
    ) {
      frm.set_df_property("unintentional_weight_loss", "reqd", 1);
      frm.refresh_field("unintentional_weight_loss");
      frm.set_df_property(
        "nutritional_supplementation_or_specialized_feeding",
        "reqd",
        1
      );
      frm.refresh_field("nutritional_supplementation_or_specialized_feeding");
      frm.set_df_property(
        "routine_nutritional_counselling_not_done_at_6_months",
        "reqd",
        1
      );
      frm.refresh_field("routine_nutritional_counselling_not_done_at_6_months");

      scrollToElementView("nutritional_supplementation_or_specialized_feeding");

      frappe.throw(
        __(
          "Please fill in nutrition screening"
        )
      );
    }

    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.workflow_state == "Pending Triage" &&
      cur_frm.doc.clinic == "Wellbaby Growth Monitoring - GCH" &&
      !cur_frm.doc.routine_nutritional_counselling_not_done_at_6_months && 
      weeks < 15
    ) {
      frm.set_df_property("unintentional_weight_loss", "reqd", 1);
      frm.refresh_field("unintentional_weight_loss");
      frm.set_df_property(
        "nutritional_supplementation_or_specialized_feeding",
        "reqd",
        1
      );
      frm.refresh_field("nutritional_supplementation_or_specialized_feeding");
      frm.set_df_property(
        "routine_nutritional_counselling_not_done_at_6_months",
        "reqd",
        1
      );
      frm.refresh_field("routine_nutritional_counselling_not_done_at_6_months");

      scrollToElementView(
        "routine_nutritional_counselling_not_done_at_6_months"
      );

      frappe.throw(
        __(
          "Please fill in nutrition screening"
        )
      );
    }

    // Nutrition screening mandatory for wellbaby during vaccination
    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.clinic == "Wellbaby - GCH" &&
      cur_frm.doc.workflow_state == "Pending Vaccination" &&
      !cur_frm.doc.unintentional_weight_loss && 
      weeks < 15
    ) {
      frm.set_df_property("unintentional_weight_loss", "reqd", 1);
      frm.refresh_field("unintentional_weight_loss");
      frm.set_df_property(
        "nutritional_supplementation_or_specialized_feeding",
        "reqd",
        1
      );
      frm.refresh_field("nutritional_supplementation_or_specialized_feeding");
      frm.set_df_property(
        "routine_nutritional_counselling_not_done_at_6_months",
        "reqd",
        1
      );
      frm.refresh_field("routine_nutritional_counselling_not_done_at_6_months");

      scrollToElementView("unintentional_weight_loss");

      frappe.throw(
        __("Please fill in nutrition screening")
      );
    }

    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.clinic == "Wellbaby - GCH" &&
      cur_frm.doc.workflow_state == "Pending Vaccination" &&
      !cur_frm.doc.nutritional_supplementation_or_specialized_feeding && 
      weeks < 15
    ) {
      frm.set_df_property("unintentional_weight_loss", "reqd", 1);
      frm.refresh_field("unintentional_weight_loss");
      frm.set_df_property(
        "nutritional_supplementation_or_specialized_feeding",
        "reqd",
        1
      );
      frm.refresh_field("nutritional_supplementation_or_specialized_feeding");
      frm.set_df_property(
        "routine_nutritional_counselling_not_done_at_6_months",
        "reqd",
        1
      );
      frm.refresh_field("routine_nutritional_counselling_not_done_at_6_months");

      scrollToElementView("nutritional_supplementation_or_specialized_feeding");

      frappe.throw(
        __(
          "Please fill in nutrition screening"
        )
      );
    }

    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.clinic == "Wellbaby - GCH" &&
      cur_frm.doc.workflow_state == "Pending Vaccination" &&
      !cur_frm.doc.routine_nutritional_counselling_not_done_at_6_months && 
      weeks < 15
    ) {
      frm.set_df_property("unintentional_weight_loss", "reqd", 1);
      frm.refresh_field("unintentional_weight_loss");
      frm.set_df_property(
        "nutritional_supplementation_or_specialized_feeding",
        "reqd",
        1
      );
      frm.refresh_field("nutritional_supplementation_or_specialized_feeding");
      frm.set_df_property(
        "routine_nutritional_counselling_not_done_at_6_months",
        "reqd",
        1
      );
      frm.refresh_field("routine_nutritional_counselling_not_done_at_6_months");

      scrollToElementView(
        "routine_nutritional_counselling_not_done_at_6_months"
      );

      frappe.throw(
        __(
          "Please fill in nutrition screening"
        )
      );
    }

    // WELLBABY AUDIOLOGY MANDATORY AT VACCINATION AND NOT MANDATORY IF PATIENT IS ABOVE 14 WEEKS

    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.clinic == "Wellbaby - GCH" &&
      cur_frm.doc.workflow_state == "Pending Vaccination" &&
      !cur_frm.doc.relative_with_ear_surgery &&
      weeks < 15
    ) {
      frm.set_df_property("relative_with_ear_surgery", "reqd", 1);
      frm.refresh_field("relative_with_ear_surgery");

      frm.set_df_property("relative_with_hearing_loss", "reqd", 1);
      frm.refresh_field("relative_with_hearing_loss");

      frm.set_df_property("relative_with_hearing_devices", "reqd", 1);
      frm.refresh_field("relative_with_hearing_devices");

      frm.set_df_property("right_ear_results", "reqd", 1);
      frm.refresh_field("right_ear_results");

      frm.set_df_property("left_ear_results", "reqd", 1);
      frm.refresh_field("left_ear_results");

      frm.set_df_property("_followup_actions", "reqd", 1);
      frm.refresh_field("_followup_actions");

      scrollToElementView("relative_with_ear_surgery");

      frappe.throw(
        __("Please fill relative with ear surgery under Wellbaby Audiology")
      );
    }

    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.clinic == "Wellbaby - GCH" &&
      cur_frm.doc.workflow_state == "Pending Vaccination" &&
      !cur_frm.doc.relative_with_hearing_loss &&
      weeks < 15
    ) {
      frm.set_df_property("relative_with_hearing_loss", "reqd", 1);
      frm.refresh_field("relative_with_hearing_loss");

      scrollToElementView("relative_with_hearing_loss");

      frappe.throw(
        __("Please fill relative with hearing loss under Wellbaby Audiology")
      );
    }

    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.clinic == "Wellbaby - GCH" &&
      cur_frm.doc.workflow_state == "Pending Vaccination" &&
      !cur_frm.doc.relative_with_hearing_devices &&
      weeks < 15
    ) {
      frm.set_df_property("relative_with_hearing_devices", "reqd", 1);
      frm.refresh_field("relative_with_hearing_devices");

      scrollToElementView("relative_with_hearing_devices");

      frappe.throw(
        __("Please fill relative with hearing devices under Wellbaby Audiology")
      );
    }

    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.clinic == "Wellbaby - GCH" &&
      cur_frm.doc.workflow_state == "Pending Vaccination" &&
      !cur_frm.doc.right_ear_results &&
      weeks < 15
    ) {
      frm.set_df_property("right_ear_results", "reqd", 1);
      frm.refresh_field("right_ear_results");

      scrollToElementView("right_ear_results");

      frappe.throw(
        __("Please fill right ear results under Wellbaby Audiology")
      );
    }

    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.clinic == "Wellbaby - GCH" &&
      cur_frm.doc.workflow_state == "Pending Vaccination" &&
      !cur_frm.doc.left_ear_results &&
      weeks < 15
    ) {
      frm.set_df_property("left_ear_results", "reqd", 1);
      frm.refresh_field("left_ear_results");

      scrollToElementView("left_ear_results");

      frappe.throw(__("Please fill left ear results under Wellbaby Audiology"));
    }

    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.clinic == "Wellbaby - GCH" &&
      cur_frm.doc.workflow_state == "Pending Vaccination" &&
      !cur_frm.doc._followup_actions &&
      weeks < 15
    ) {
      frm.set_df_property("_followup_actions", "reqd", 1);
      frm.refresh_field("_followup_actions");

      scrollToElementView("_followup_actions");

      frappe.throw(
        __("Please fill follow-up actions under Wellbaby Audiology")
      );
    }

    // Making nurse notes table mandatory for wellbaby
    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.clinic == "Wellbaby - GCH" &&
      cur_frm.doc.workflow_state == "Pending Vaccination" &&
      cur_frm.doc.nurse_notes_table.length == 0
    ) {
      frm.set_df_property("nurse_notes_table", "reqd", 1);
      frm.refresh_field("nurse_notes_table");

      scrollToElementView("nurse_notes_table");

      frappe.throw(__("Please fill Nurse Notes Table"));
    }

    // Making nurse notes table mandatory for growth monitoring
    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.clinic == "Wellbaby Growth Monitoring - GCH" &&
      cur_frm.doc.workflow_state == "Pending Triage" &&
      cur_frm.doc.nurse_notes_table.length == 0
    ) {
      frm.set_df_property("nurse_notes_table", "reqd", 1);
      frm.refresh_field("nurse_notes_table");

      scrollToElementView("nurse_notes_table");

      frappe.throw(__("Please fill Nurse Notes Table"));
    }

    // -- Checking for mandatory fields before changing the workflow state
    console.log(assessment_length, "Assessment Length.... workflow change");
    if (
      frappe.user.has_role("GCH-Nurse") ||
      (frappe.user.has_role("GCH-TriageNurse") &&
        frm.doc.workflow_state == "Pending Triage" &&
        !cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari")) ||
      "Procedure - GCH"
    ) {

        // checking if an assessment was loaded
        if (
            assessment_length < 1 &&
            !cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari") &&
            frm.doc.clinic != "Procedure - GCH" &&
            frm.doc.clinic != "Wellbaby - GCH" &&
            frm.doc.clinic != "Wellbaby Growth Monitoring - GCH"
        ) {
            frappe.throw(__("Please ensure you've added patient assessments..."));
        }
        else if (
            assessment_length > 0 &&
            !cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari") &&
            frm.doc.clinic != "Procedure - GCH" &&
            frm.doc.clinic != "Wellbaby - GCH" &&
            frm.doc.clinic != "Wellbaby Growth Monitoring - GCH"
        ) {
            // Checking if Fallrisk and pain assessments have been entered
            //Get Patient Assessments
            if (!cur_frm.doc.__islocal && cur_frm.doc.workflow_state == 'Pending Triage'){
                
                let assessments;
                let painf = false;
                let fallrisk = false;

                frappe.call({
                    method: "gch_custom.services.rest.encounter_assessments",
                    async: false,
                    args: {
                        encounter: frm.doc.encounter_number,
                    },
                    callback: function (data) {
                        assessments = data.message;

                        // // // console.log(assessments, "here")

                        if (assessments) {
                            assessments.forEach((assess) => {
                                if (assess.assessment_template.includes("Pain")) {
                                    painf = true;
                                }
                                else if (assess.assessment_template.includes("Falls Risk")) {
                                    fallrisk = true;
                                }
                            });

                            
                        } 
                    }
                });

                console.log(assessments, fallrisk, painf)

                if (fallrisk && painf) {
                    console.log("Pain and Fall Risk Assessment are Okay");
                } else {
                    frappe.throw(__("Pain and Fall Risk Assessments are Required"));
                }
            }
        }
      }


    

    // // make billed quantity mandatory for pharmtech
    // if (frappe.user.has_role("GCH-Pharmacy") && cur_frm.doc.workflow_state == "Pending Pharmacy"
    // ) {
    //   // // // console.log("HEREREREREREE LOGGGG!!!!!!!!!!!!!!!!!");
    //   for (let i = 0; i <= cur_frm.doc.prescription_table.length - 1; i++) {
    //     if (
    //       (!cur_frm.doc.prescription_table[i].billed_quantity ||
    //         cur_frm.doc.prescription_table[i].billed_quantity <= 0) &&
    //       cur_frm.doc.prescription_table[i].dont_issue != 1
    //     ) {
    //       frappe.throw(
    //         __(
    //           `Please select selling quantity for ${cur_frm.doc.prescription_table[i].item_name}`
    //         )
    //       );
    //     }
    //   }
    // }
   

    // frappe.throw(__("Error"));
    // Checking if Patient dob is the default value and prompting user to edit it before saving

    if (frm.doc.date_of_birth == "1901-01-01") {
      // // // console.log("Checking patient age............")
      frappe.throw(__("Please confirm the patient's age and change it..."));
    }

    // Checking if mode of payment has been selected....
    if (
      frappe.user.has_role("GCH-Reception") &&
      cur_frm.doc.workflow_state == "Pending Reception"
    ) {
      if (!cur_frm.doc.mode_of_payment) {
        frappe.throw(__("Please select a mode of payment"));
      }
    }

    frappe.require(
      "/assets/gch_custom/js/patient_encounter/before_workflow.js",
      () => {
        handle_before_workflow_action(frm);
      }
    );
  },
  after_workflow_action: (frm) => {
    // // // console.log("After workflow!!!", assessment_length_global);
    // if(assessment_length_global < 1){
    //   // fetching assessments if zero after workflow change
    //   // // console.log("Fetching assessments after workflow change......")
    //   get_encounter_assessment(frm)
    // }
    frappe.require(
      "/assets/gch_custom/js/patient_encounter/after_workflow.js",
      () => {
        handle_after_workflow_action(frm);
      }
    );
  },
  visit_schedule: function (frm, cdt, cdn) {
    var visit_schedule = frm.doc.visit_schedule;

    if (visit_schedule) {
      // Setting Wellbaby Vaccine Child table fields as mandatory
      cur_frm.fields_dict["vaccines"].grid.toggle_reqd(
            "drug",
            1
        );

        // cur_frm.fields_dict["vaccines"].grid.toggle_reqd(
        //     "vaccine_type",
        //     1
        // );

        cur_frm.fields_dict["vaccines"].grid.toggle_reqd(
            "quantity",
            1
        );

      frappe
        .call({
          method: "gch_custom.services.events.get_vaccinations",
          args: { duration: visit_schedule },
        })
        .done((r) => {
          frm.doc.vaccines = [];

          $.each(r.message, function (_i, e) {
            let entry = frm.add_child("vaccines");
            entry.wellbaby_vaccine = e.name;
          });
          refresh_field("vaccines");
        })
        .fail((f) => {
          // // // console.log(f);
        });
    }
  },

  clinic: function (frm) {
    frappe.require(
      "/assets/gch_custom/js/patient_encounter/walk_in_encounter.js",
      () => {
        handle_walk_in(frm);
      }
    );
    // Checking if clinic is Rescheduled Vaccionation to Auto pull vaccines from the most recent Wellbaby encounter
    // Revaccination variable used below actually represents rescheduling
    if(cur_frm.doc.patient && cur_frm.doc.clinic == "Wellbaby Rescheduled Vaccination - GCH") {
        
        // Fetch the most recent Wellbaby Encounter and fetch the vaccinations table
        frappe.call({
            method: "gch_custom.services.rest.fetch_vaccines_from_prev_wellbaby_encounter",
            args: {
                "patient": cur_frm.doc.patient
            },
            callback: (res) => {
                let vaccinations = res.message.vaccines
                
                // console.log(res.message.vaccines)
                console.log(vaccinations)

                if(vaccinations.length > 0) {
                    console.log(true)
                    for(let vacc in vaccinations) {
                        console.log(vaccinations[vacc])

                        // Checking if vaccine was given to patient or not
                        if ( vaccinations[vacc].vaccinated == "No" ) {
                            let childTable = cur_frm.add_child("vaccines");
                            childTable.drug = vaccinations[vacc].drug
                            childTable.quantity = vaccinations[vacc].quantity
                            childTable.uom = vaccinations[vacc].uom
                            childTable.vaccine_type = vaccinations[vacc].vaccine_type
                            childTable.wellbaby_vaccine = vaccinations[vacc].wellbaby_vaccine
                            childTable.drug_description = vaccinations[vacc].drug_description

                            // setting revaccination to true to avoid billing the vaccine again
                            childTable.revaccination = 1
                            childTable.dispensed = 0

                            cur_frm.refresh_fields("vaccines")
                        }

                    }
                }
                

            }
        }) 
        

    }


    // Auto adding Z23 and Z27 diagnosis for wellbaby and wellbaby growth monitoring
    if(cur_frm.doc.patient && cur_frm.doc.clinic == "Wellbaby - GCH" || cur_frm.doc.clinic == "Wellbaby Rescheduled Vaccination - GCH" ) {
        let childTable = cur_frm.add_child("diagnosis_table");
        childTable.medical_code = "ICD-10-Diagnosis Z23"
        childTable.code = "Z23"
        childTable.description = "Need for immunization against single bacterial diseases"

        cur_frm.refresh_fields("diagnosis_table")

    } else if (cur_frm.doc.patient && cur_frm.doc.clinic == "Wellbaby Growth Monitoring - GCH") {
        let childTable = cur_frm.add_child("diagnosis_table");
        childTable.medical_code = "ICD-10-Diagnosis Z00.1"
        childTable.code = "Z00.1"
        childTable.description = "Routine child health examination"

        cur_frm.refresh_fields("diagnosis_table")


        cur_frm.set_df_property("child_fit_for_vaccination", "reqd", 0);
        cur_frm.refresh_field("child_fit_for_vaccination");
        

    }

    // if (cur_frm.doc.__islocal && frm.doc.clinic.includes("Wellbaby") && frappe.user_roles.includes("GCH-Reception")) {
    //     // Making mode of payment mandatory
    //     cur_frm.set_df_property("mode_of_payment", "reqd", 1)
    //     cur_frm.refresh_field("mode_of_payment")

    //     cur_frm.set_df_property("visit_schedule", "reqd", 1)
    //     cur_frm.refresh_field("visit_schedule")

    //     cur_frm.set_df_property("vaccines", "reqd", 1)
    //     cur_frm.refresh_field("vaccines")
    // }

    // Checking if clinic is well baby to auto fill vaccination shedule
    // if(cur_frm.doc.__islocal) {
    //     if (
    //     frm.doc.clinic == "Wellbaby - GCH" ||
    //     frm.doc.clinic == "Wellbaby Growth Monitoring - GCH"
    //     ) {
        
    //     // Generate patient age in weeks
    //     let calculate_age = function (birth) {
    //         let ageMS = Date.parse(Date()) - Date.parse(birth);
    //         let gch_patient_age = new Date();
    //         gch_patient_age.setTime(ageMS);
            
    //         let years = gch_patient_age.getFullYear() - 1970;
    //         let months = gch_patient_age.getMonth()
    //         let days = gch_patient_age.getDate()

    //         let total_weeks = (years * 52.176) + (months * 4.345) + (days/7)

    //         return total_weeks.toFixed(0)
    //       };


    //     let patient_age = calculate_age(cur_frm.doc.date_of_birth);

    //     console.log(patient_age, "Age in weeeks")
    //     // Checking if patient has had vaccination before and auto generating vaccines
    //     frappe.call({
    //         method: "gch_custom.services.rest.check_patient_last_vaccination_shedule",
    //         args: {
    //             "patient": cur_frm.doc.patient,
    //             "patient_age_in_weeks": patient_age
    //         },
    //         callback: (res) => {
    //             console.log(res)
    //         }
    //     }) 
        
    //     }
    // }

    // Checking on first save if clinic is walk-in to autopull information
    if(
        cur_frm.doc.clinic.includes("Walk-In") || cur_frm.doc.clinic.includes("Results")
      ) {
        fetch_prev_enc_info(frm)

    }

    // Checking if clinic is set to wellbaby before the form is initially saved
    // if(cur_frm.doc.clinic.includes("Wellbaby") && cur_frm.doc.__islocal) {
    //     cur_frm.set_value("workflow_state", "Pending Reception")
    //     cur_frm.refresh_field("workflow_state")
    // }


  },

  validate: function (frm) {
    // // // console.log("At Validate workflow...." + frm.doc.workflow_state);

    // Diagnosis mandatory for normal encounters
    // if(cur_frm.doc.workflow_state == "Pending Doctor") {
    //     frm.set_df_property("diagnosis_table", "reqd", 1);
    //     frm.refresh_field("diagnosis_table");
    // }

    // Diagnosis mandatory for wellbaby during vaccination
    // if(cur_frm.doc.workflow_state == "Pending Vaccination" && cur_frm.doc.clinic == "Wellbaby - GCH") {
    //     frm.set_df_property("diagnosis_table", "reqd", 1);
    //     frm.refresh_field("diagnosis_table");
    // }

    // Diagnosis mandatory for wellbaby growth monitoring during triage
    // if(!cur_frm.doc.__islocal && cur_frm.doc.workflow_state == "Pending Triage" && cur_frm.doc.clinic == "Wellbaby Growth Monitoring - GCH") {
    //     frm.set_df_property("diagnosis_table", "reqd", 1);
    //     frm.refresh_field("diagnosis_table");

    //     frm.set_df_property("unintentional_weight_loss", "reqd", 1);
    //     frm.refresh_field("unintentional_weight_loss");

    //     frm.set_df_property("nutritional_supplementation_or_specialized_feeding", "reqd", 1);
    //     frm.refresh_field("nutritional_supplementation_or_specialized_feeding");

    //     frm.set_df_property("routine_nutritional_counselling_not_done_at_6_months", "reqd", 1);
    //     frm.refresh_field("routine_nutritional_counselling_not_done_at_6_months");
    // }

    // Making some fields unmandatory while in reception
    if (cur_frm.doc.workflow_state == "Pending Reception") {
      frm.set_df_property("diagnosis_table", "reqd", 0);
      frm.refresh_field("diagnosis_table");
    }

    // if(!cur_frm.doc.__islocal &&
    //     cur_frm.doc.workflow_state == "Pending Triage" &&
    //     cur_frm.doc.clinic == "Wellbaby Growth Monitoring - GCH" &&
    //     !cur_frm.doc.nurse_notes) {
    //     frappe.validated = false;
    //     msgprint("Please enter Nursing notes")
    // }

    // if(!cur_frm.doc.__islocal &&
    //     cur_frm.doc.workflow_state == "Pending Vaccination" &&
    //     cur_frm.doc.clinic == "Wellbaby - GCH" &&
    //     !cur_frm.doc.nurse_notes) {
    //     frappe.validate = false;
    //     msgprint("Please enter Nursing notes")
    // }

    // Checking for any open encounters or bills before saving a new encounter
    // It's a fail safe for when the trigger on the patient field is bypassed

    if (frm.doc.__islocal) {
      var patient_uhid = frm.doc.patient_uhid;

      // // // console.log("I'm here........................");

      let bill_list_and_encounter_list;

      if (frm.doc.__islocal == 1) {
        // // // console.log("Local patient", frm.doc.__islocal);
        // // // console.log(
        //   "Checking if patient has any open bills before creating a new encounter"
        // );
        // // // console.log("UHID", patient_uhid);

        frappe
          .call({
            async: false,
            method:
              "gch_custom.services.rest.check_for_open_bills_and_encounters",
            args: { patient_uhid },
          })
          .done((r) => {
            bill_list_and_encounter_list = r.message;

            // // // console.log(bill_list_and_encounter_list);

            let bill_count = bill_list_and_encounter_list[1];
            let encounter_count = bill_list_and_encounter_list[0];

            if (bill_count > 0 && encounter_count > 0) {
              frappe.warn(
                "Error!!!",
                "This Patient has " +
                bill_count +
                " open bills and " +
                encounter_count +
                " encounters, please close them before proceeding....",
                () => {
                  // location.reload();
                },
                "Continue",
                true
              );
              // window.history.back();
              window.history.back();
            } else if (bill_count > 0 && encounter_count == 0) {
              frappe.warn(
                "Error!!!",
                "This patient has " +
                bill_count +
                " Open Bills, please close them before proceeding....",
                () => {
                  // location.reload();
                },
                "Continue",
                true
              );
              window.history.back();
            } else if (bill_count == 0 && encounter_count > 0) {
              frappe.warn(
                "Error!!!",
                "This patient has " +
                encounter_count +
                " Open Encounters, please close them before proceeding....",
                () => {
                  // location.reload();
                },
                "Continue",
                true
              );
              // window.history.back();
              window.history.back();
            } else {
              // // // console.log("This patient has no open encounters or bills");
            }
          });
      }
    }

    // Make encounter fields mandatory for wellbaby and workflow state is pending vaccination
    if (
      !cur_frm.doc.__islocal &&
      cur_frm.doc.workflow_state == "Pending Vaccination" &&
      cur_frm.doc.clinic == "Wellbaby - GCH"
    ) {
      if (!frm.doc.__islocal && frm.doc.height_in_centimeters <= 10) {
        frappe.validated = false;
        frappe.throw("Invalid Height");
      }

      if (!frm.doc.__islocal && frm.doc.weight_in_kilograms <= 0) {
        frappe.validated = false;
        frappe.throw("Invalid Weight");
      }

      // // Validate assessments for wellbaby
      // if(assessment_length < 1) {
      //     frappe.validated = false;
      //     msgprint("Please enter an assessment")
      // }

      // Validate other vitals apart from temperature for well baby
      // for(let i=0; i <= cur_frm.doc.vital_signs_table.length -1; i++) {

      //     if(cur_frm.doc.vital_signs_table[i]) {
      //         // Validate other vitals apart from temperature for well baby
      //         if(cur_frm.doc.vital_signs_table[i].patient_encounter_heart_rate == 0) {

      //             frappe.throw(__("Please verify heart rate in vital signs table"));
      //         }

      //         if(cur_frm.doc.vital_signs_table[i].patient_encounter_respiratory_rate == 0) {
      //             frappe.throw(__("Please verify respiratory rate in vital signs table"));

      //         }

      //         if(cur_frm.doc.vital_signs_table[i].patient_encounter_percutaneous_oxygen == 0) {

      //             frappe.throw(__("Please verify oxygen saturation in vital signs table"));

      //         }

      //         if(cur_frm.doc.vital_signs_table[i].patient_encounter_bp_systolic == 0) {

      //             frappe.throw(__("Please verify bp systolic in vital signs table"));

      //         }

      //         if(cur_frm.doc.vital_signs_table[i].patient_encounter_bp_diastolic == 0) {

      //             frappe.throw(__("Please verify bp diastolic in vital signs table"));

      //         }

      //     }

      // }

    //   if (
    //     !cur_frm.doc.__islocal &&
    //     cur_frm.doc.workflow_state == "Pending Triage" &&
    //     cur_frm.doc.clinic == "Wellbaby Growth Monitoring - GCH"
    //   ) {
    //     // Validate other vitals apart from temperature for well baby
    //     for (let i = 0; i <= cur_frm.doc.vital_signs_table.length - 1; i++) {
    //       // if(cur_frm.doc.vital_signs_table[i]) {
    //       //     // Validate other vitals apart from temperature for well baby
    //       //     if(cur_frm.doc.vital_signs_table[i].patient_encounter_heart_rate == 0) {
    //       //         frappe.throw(__("Please verify heart rate in vital signs table"));
    //       //     }
    //       //     if(cur_frm.doc.vital_signs_table[i].patient_encounter_respiratory_rate == 0) {
    //       //         frappe.throw(__("Please verify respiratory rate in vital signs table"));
    //       //     }
    //       //     if(cur_frm.doc.vital_signs_table[i].patient_encounter_percutaneous_oxygen == 0) {
    //       //         frappe.throw(__("Please verify oxygen saturation in vital signs table"));
    //       //     }
    //       //     if(cur_frm.doc.vital_signs_table[i].patient_encounter_bp_systolic == 0) {
    //       //         frappe.throw(__("Please verify bp systolic in vital signs table"));
    //       //     }
    //       //     if(cur_frm.doc.vital_signs_table[i].patient_encounter_bp_diastolic == 0) {
    //       //         frappe.throw(__("Please verify bp diastolic in vital signs table"));
    //       //     }
    //       // }
    //     }
    //   }

      // if(cur_frm.doc.vital_signs_table[0].patient_encounter_heart_rate == 0) {
      //     frappe.validated = false;
      //     msgprint("Please verify heart rate in vital signs table");
      // }

      // if(cur_frm.doc.vital_signs_table[0].patient_encounter_respiratory_rate == 0) {

      //     frappe.validated = false;
      //     msgprint("Please verify respiratory rate in vital signs table");

      // }

      // if(cur_frm.doc.vital_signs_table[0].patient_encounter_percutaneous_oxygen == 0) {

      //     frappe.validated = false;
      //     msgprint("Please verify oxygen saturation in vital signs table");

      // }

      // if(cur_frm.doc.vital_signs_table[0].patient_encounter_bp_systolic == 0) {

      //     frappe.validated = false;
      //     msgprint("Please verify bp systolic in vital signs table");

      // }

      // if(cur_frm.doc.vital_signs_table[0].patient_encounter_bp_diastolic == 0) {

      //     frappe.validated = false;
      //     msgprint("Please verify bp diastolic in vital signs table");

      // }

      // if(cur_frm.doc.food_allergy.length == 0 && cur_frm.doc.has_no_food_allergy != 1) {
      //     cur_frm.set_df_property("food_allergy", "reqd", 1)
      //     cur_frm.refresh_field("food_allergy")
      //     frappe.validated = false;
      //     msgprint("Please Enter Food Allergies");
      // }

      // if(cur_frm.doc.drug_allergy.length == 0 && cur_frm.doc.has_no_drug_allergy != 1) {
      //     cur_frm.set_df_property("drug_allergy", "reqd", 1)
      //     cur_frm.refresh_field("drug_allergy")
      //     frappe.validated = false;
      //     msgprint("Please Enter Drug Allergies");
      // }

      // frm.set_df_property("diagnosis_table", "reqd", 1);
      // frm.refresh_field("diagnosis_table");
    }

    // if (
    //   frm.doc.workflow_state == "Pending Triage" &&
    //   frm.doc.clinic == "Wellbaby - GCH"
    // ) {
    //   if (frm.doc.patient) {
    //     frappe.db.get_value(
    //       "Patient",
    //       { name: frm.doc.patient },
    //       "dob",
    //       (r) => {
    //         // // // console.log(r.dob);
    //         const cordpatientdob = r.dob;
    //         const cord_age = calculate_age(cordpatientdob);

    //         let age_in_months = Math.round(cord_age / 30);

    //         if (age_in_months < 6) {
    //           //eval:!doc.__islocal && doc.workflow_state == 'Pending Triage'
    //           if (!frm.doc.cord_stump_healing) {
    //             frm.set_df_property("cord_stump_healing", "reqd", 1);
    //             frappe.msgprint("Enter a valid Cord Stump Healing State");
    //             frappe.validated = false;
    //           }
    //         }
    //       }
    //     );
    //   }
    // }

  },

  after_save: (frm) => {
    // Setting Workflow state to Pending Reception after initial save

    let viewing_users = cur_frm.get_docinfo()['viewers']?.current
    frappe.call(
      {
        method: "gch_custom.services.update_encounter",
        args: {
          data: {},
          users: viewing_users,
          encounter: cur_frm.doc.name,
          modified_by: cur_frm.doc.modified_by
        }
      }
    )

    // Starting Encounter from Reception for Wellbaby patients
    if(cur_frm.doc.clinic.includes("Wellbaby") && !cur_frm.doc.is_first_time_wellbaby_save && frappe.user.has_role("GCH-Reception")) {
        
        console.log("Generating Invoice ...................")
        // Generating invoice on first time save for wellbaby reception
        frappe.call({
            method: "gch_custom.services.workflow_controller.get_all_billed_services_and_items",
            // async: false,
            args: {
                "encounter": cur_frm.doc.name,
                "patient_": cur_frm.doc.patient,
                "workflow_state": cur_frm.doc.workflow_state,
                "next_state": "Pending Reception",
                "owner": frappe.session.user
            },
            callback: (res) => {
                console.log(res)
            }
        })
        
        cur_frm.set_value("workflow_state", "Pending Reception")
        cur_frm.refresh_field("workflow_state")
        cur_frm.save()
    }

    if(cur_frm.doc.clinic.includes("Wellbaby") && cur_frm.doc.is_first_time_wellbaby_save && frappe.user.has_role("GCH-Reception") && cur_frm.doc.workflow_state == "Pending Reception") {
        
        console.log("Updating Invoice ...................")
        // Updating invoice on consecutive saves for wellbaby reception
        frappe.call({
            method: "gch_custom.services.workflow_controller.get_all_billed_services_and_items",
            // async: false,
            args: {
                "encounter": cur_frm.doc.name,
                "patient_": cur_frm.doc.patient,
                "workflow_state": cur_frm.doc.workflow_state,
                "next_state": "Pending Reception",
                "owner": frappe.session.user
            },
            callback: (res) => {
                console.log(res)

                if(res.message) {
                    // Changing vaccines to dispensed after save to prevent duplication in the invoice
                    frappe.call({
                        method: "gch_custom.services.change_vaccines_to_dispensed_after_save_on_encounter",
                        args: {
                            "encounter" : cur_frm.doc.encounter_number
                        },
                        callback: (res) => {
                            console.log(res)
                            cur_frm.refresh_field("vaccines")
                        }
                    })
                }
            }
        })  
    }
    

    // // // console.log(cur_frm.doc.data_fetched_from_prev_enc, "Valllllluueeeeeeee");
    // frappe.realtime.on('patient_encounter_updates', function(data) {
    //   // // console.log("ON ENCOUNTER UPDATE");
    //   console.log(cur_frm, frm)
    //   cur_frm.refresh();
    // }); 
    if (
      cur_frm.doc.data_fetched_from_prev_enc == 0 &&
      cur_frm.doc.revisit_reason_dur >= 0 &&
      cur_frm.doc.revisit_reason_dur <= 24 &&
      assessment_length < 1 &&
      !cur_frm.doc.clinic.includes("Walk-in") &&
      !cur_frm.doc.clinic.includes("Results")
    ) {

        fetch_prev_assessments_and_allergies();

    } else if(
        cur_frm.doc.data_fetched_from_prev_enc == 0 &&
        cur_frm.doc.clinic.includes("Walk-in")
    ) {

        fetch_prev_assessments_and_allergies();

    } else if(
        cur_frm.doc.data_fetched_from_prev_enc == 0 &&
        cur_frm.doc.clinic.includes("Results")
    ) {
        fetch_prev_assessments_and_allergies();
    }

  },

  is_drug_allergy_patient: function (frm) {
    flag_patient(frm);
    if (frm.doc.is_drug_allergy_patient == 1)
      document.querySelectorAll(
        "[data-fieldname='is_drug_allergy_patient']"
      )[0].style.color = "Orange";
    else
      document.querySelectorAll(
        "[data-fieldname='is_drug_allergy_patient']"
      )[0].style.color = "#020f10";
  },
  is_priority_patient: function (frm) {
    if (frm.doc.is_priority_patient == 1) {
      document.querySelectorAll(
        "[data-fieldname='is_priority_patient']"
      )[0].style.color = "orange";

      document.querySelectorAll(
        "[data-fieldname='is_priority_patient']"
      )[0].style.fontWeight = "900";

      document.querySelectorAll(
        "[data-fieldname='is_priority_patient']"
      )[0].style.color = "13px";
    } else {
      document.querySelectorAll(
        "[data-fieldname='is_priority_patient']"
      )[0].style.color = "#020f10";

      document.querySelectorAll(
        "[data-fieldname='is_priority_patient']"
      )[0].style.fontSize = "12px";

      document.querySelectorAll(
        "[data-fieldname='is_priority_patient']"
      )[0].style.fontWeight = "400";
    }
  },

  is_fall_risk_patient: function (frm) {
    flag_patient(frm);
  },

  is_isolation_patient: function (frm) {
    flag_patient(frm);
  },

  is_emergency_patient: function (frm) {
    if (frm.doc.is_emergency_patient == 1) {
      document.querySelectorAll(
        "[data-fieldname='is_emergency_patient']"
      )[0].style.color = "red";

      document.querySelectorAll(
        "[data-fieldname='is_emergency_patient']"
      )[0].style.fontSize = "13px";

      document.querySelectorAll(
        "[data-fieldname='is_emergency_patient']"
      )[0].style.fontWeight = "900";

    } else {
      document.querySelectorAll(
        "[data-fieldname='is_emergency_patient']"
      )[0].style.color = "#020f10";

      document.querySelectorAll(
        "[data-fieldname='is_emergency_patient']"
      )[0].style.fontSize = "12px";

      document.querySelectorAll(
        "[data-fieldname='is_emergency_patient']"
      )[0].style.fontWeight = "400";

    }
  },
  weight_in_kilograms: function (frm) {
    if (frm.doc.weight_in_kilograms <= 0) {
      validated = false;
      msgprint("Invalid Weight");
      frappe.model.set_value(frm.doctype, frm.docname, "bmi", "");
      frappe.model.set_value(frm.doctype, frm.docname, "bsa", "");
    } else {
      if (frm.doc.height_in_centimeters && frm.doc.weight_in_kilograms) {
        calculate_bmi(frm);
        calculate_bsa(frm);
        // CALCULATING PERCENTILE DATA
        calculate_bmi_age_percentile(frm);
        calculate_height_age_percentile(frm);
        calculate_weight_age_percentile(frm);

        // Get Patient Date of Birth
        if (frm.doc.patient) {
          frappe.call({
            method: "frappe.client.get",
            args: {
              doctype: "Patient",
              name: frm.doc.patient,
            },
            callback: function (data) {
              const z_patientdob = data.message.dob;
              const z_patientage = calculate_age(z_patientdob);
              const z_gender = frm.doc.patient_sex;

              //Check Gender here..if not M or F!
              if (
                z_patientdob &&
                z_patientage < 6935 &&
                (z_gender == "Female" || z_gender == "Male")
              ) {
                getcalculate_zscore(
                  z_patientdob,
                  z_gender,
                  frm.doc.weight_in_kilograms,
                  frm.doc.height_in_centimeters
                );
              } else {
                if (z_gender != "Female" && z_gender != "Male") {
                  msgprint({
                    title: __("Warning"),
                    indicator: "orange",
                    message: __(
                      "Z-score percentiles NOT calculated. Gender not Male or Female"
                    ),
                  });
                }
              }
            },
          });
        }
      }
    }
  },

  // patient_assessment: function (frm) {
  //   // // console.log("P.A Field Changed.....")
  // },

  height_in_centimeters: function (frm) {
    if (
      (!cur_frm.doc.clinic.includes("Walk-In" || "Results" || "Daktari") &&
        frm.doc.clinic != "Procedure - GCH" &&
        frm.doc.height_in_centimeters <= 10) ||
      frm.doc.height_in_centimeters >= 200
    ) {
      msgprint("Invalid Height");
      validated = false;
      frappe.model.set_value(frm.doctype, frm.docname, "bmi", "");
      frappe.model.set_value(frm.doctype, frm.docname, "bsa", "");
    } else {
      if (frm.doc.height_in_centimeters && frm.doc.weight_in_kilograms) {
        calculate_bmi(frm);
        calculate_bsa(frm);
        // CALCULATING PERCENTILE DATA
        calculate_bmi_age_percentile(frm);
        calculate_height_age_percentile(frm);
        calculate_weight_age_percentile(frm);

        // Get Date of Birth
        if (frm.doc.patient) {
          frappe.call({
            method: "frappe.client.get",
            args: {
              doctype: "Patient",
              name: frm.doc.patient,
            },
            callback: function (data) {
              const z_patientdob = data.message.dob;
              const z_patientage = calculate_age(z_patientdob);
              const z_gender = frm.doc.patient_sex;

              //Check Gender here..if not M or F!
              if (
                z_patientdob &&
                z_patientage < 6935 &&
                (z_gender == "Female" || z_gender == "Male")
              ) {
                getcalculate_zscore(
                  z_patientdob,
                  z_gender,
                  frm.doc.weight_in_kilograms,
                  frm.doc.height_in_centimeters
                );
              } else {
                if (z_gender != "Female" && z_gender != "Male") {
                  msgprint({
                    title: __("Warning"),
                    indicator: "orange",
                    message: __(
                      "Z-score percentiles NOT calculated. Gender not Male or Female"
                    ),
                  });
                }
              }
            },
          });
        }
      }
    }
  },

  patient_assessment_button: function (frm) {
    // if (!frm.doc.__islocal) {
    create_patient_assessment(frm);

    // assessment_btn_press_count +=1;
  },
  pharmacy_dispensement_form: function (frm) {
    // if (!frm.doc.__islocal) {
    create_pharmacy_dispensement_form(frm);
  },

  drug_allergy: function (frm) {
    document.querySelectorAll(
      "[data-fieldname='is_drug_allergy_patient']"
    )[0].style.color = "#020f10";


    if (frm.doc.drug_allergy[0]) {
      if (
        !frm.doc.drug_allergy[0].drug_allergy.trim() ||
        frm.doc.drug_allergy[0].drug_allergy.trim().length === 0
      ) {
        frm.set_value("is_drug_allergy_patient", 0);
      } else {
        frm.set_value("is_drug_allergy_patient", 1);
        document.querySelectorAll(
          "[data-fieldname='is_drug_allergy_patient']"
        )[0].style.color = "Orange"; //"#FFA500";
      }
    } else frm.set_value("is_drug_allergy_patient", 0);
  },

  weak_or_absent_breathing: function (frm) {
    if (frm.doc.weak_or_absent_breathing == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  obstructed_breathing: function (frm) {
    if (frm.doc.obstructed_breathing == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  central_cyanosis_or_spo2: function (frm) {
    if (frm.doc.central_cyanosis_or_spo2 == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  severe_respiratory_distress: function (frm) {
    if (frm.doc.severe_respiratory_distress == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },

  weak_or_fast_pulse_gt_160: function (frm) {
    if (frm.doc.weak_or_fast_pulse_gt_160 == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },

  capillary_return_time_gt_3_sec: function (frm) {
    if (frm.doc.capillary_return_time_gt_3_sec == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  pulse_rate_lt_60_per_min: function (frm) {
    if (frm.doc.pulse_rate_lt_60_per_min == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  avpu_is_p_or_u_or_convulsion: function (frm) {
    if (frm.doc.avpu_is_p_or_u_or_convulsion == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  diarrhea_with_sunken_eyes: function (frm) {
    if (frm.doc.diarrhea_with_sunken_eyes == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  anaphylaxis: function (frm) {
    if (frm.doc.anaphylaxis == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  bulging_anterior_fontanelle: function (frm) {
    if (frm.doc.bulging_anterior_fontanelle == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  intraosseous_line_in_place: function (frm) {
    if (frm.doc.intraosseous_line_in_place == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  neck_stiffness: function (frm) {
    if (frm.doc.neck_stiffness == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  artificial_airway: function (frm) {
    if (frm.doc.artificial_airway == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  hypothermia: function (frm) {
    if (frm.doc.hypothermia == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  hypoglycemia: function (frm) {
    if (frm.doc.hypoglycemia == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  immediate_post_ictal_period: function (frm) {
    if (frm.doc.immediate_post_ictal_period == 1) {
      cur_frm.set_value("is_emergency_patient", 1);
    } else set_emergency_off(frm);
  },
  fast_breathing: function (frm) {
    if (frm.doc.fast_breathing == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  grunting: function (frm) {
    if (frm.doc.grunting == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  chest_wall_indrawing: function (frm) {
    if (frm.doc.chest_wall_indrawing == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  wheeze: function (frm) {
    if (frm.doc.wheeze == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  stridor: function (frm) {
    if (frm.doc.stridor == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  drooling: function (frm) {
    if (frm.doc.drooling == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  tiny_child: function (frm) {
    if (frm.doc.tiny_child == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  major_trauma: function (frm) {
    if (frm.doc.major_trauma == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  pain: function (frm) {
    if (frm.doc.pain == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  poisoning: function (frm) {
    if (frm.doc.poisoning == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  severe_palmar_pallor: function (frm) {
    if (frm.doc.severe_palmar_pallor == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  restless_irritable_floppy: function (frm) {
    if (frm.doc.restless_irritable_floppy == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  referral: function (frm) {
    if (frm.doc.referral == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    }
  },
  malnutrition_severe_wasting: function (frm) {
    if (frm.doc.malnutrition_severe_wasting == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  oedeme_of_both_feet: function (frm) {
    if (frm.doc.oedeme_of_both_feet == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  severe_burns: function (frm) {
    if (frm.doc.severe_burns == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },
  unable_to_drink_or_vomits_anything: function (frm) {
    if (frm.doc.unable_to_drink_or_vomits_anything == 1) {
      cur_frm.set_value("is_priority_patient", 1);
    } else set_priority_off(frm);
  },

  outpatient_discharge_barriers_to_care_: function (frm) {
    var bar_edu = frm.doc.outpatient_discharge_barriers_to_care_;
    if (bar_edu.some((el) => el.barrier == "Other")) {
      frm.set_df_property(
        "outpatient_discharge_barrier_to_care_notes",
        "reqd",
        1
      );
    } else {
      frm.set_df_property(
        "outpatient_discharge_barrier_to_care_notes",
        "reqd",
        0
      );
    }
  },

  outpatient_discharge_patient_education: function (frm) {
    var op_edu = frm.doc.outpatient_discharge_patient_education;

    if (op_edu.some((el) => el.education == "Other")) {
      frm.set_df_property(
        "outpatient_discharge_patient_education_notes",
        "reqd",
        1
      );
    } else {
      frm.set_df_property(
        "outpatient_discharge_patient_education_notes",
        "reqd",
        0
      );
    }
  },

  view_results: function (frm) {
    let tests = frm.doc.radiology_details;
    if(tests.length > 0){
      let results = [];
      let ROWS = [];
      let current_user = frappe.session.user;
      let username = current_user.split("@")[0];
      let uhid = frm.doc.patient_uhid;
      let results_key = 'MjAyMzA4MTYxMjU0'

      let d = new frappe.ui.Dialog({
        title: "Radiology Results",
        fields: [
          {
            label: "Results",
            fieldname: "results",
            fieldtype: "HTML"
          }
        ],
        primary_action_label: "Close",
        primary_action: (frm) => {
          d.hide();
        }
      });

      tests.forEach((test) => {
        let accession_number = test.accessionnumber;
        if(accession_number){
          
          ROWS.push(
            `
              <tr>
                <td scope="col">${test.test_name}</td>
                <td scope="col"><button class="btn btn-primary btn-sm" onclick="view_results_url(${accession_number},'${uhid}','${username}','${results_key}')">View Results</button></td>
              </tr>
            `
          )

        }
        else{
          ROWS.push(
            `
              <tr>
                <td scope="col">${test.test_name}</td>
                <td scope="col">Results not available</td>
              </tr>
            `
          )
        }
      })

      let htmlC = `
        <table id="confirm" class="table table-bordered table-hover" style="font-size: 12px;">
              <thead>
                <tr>
                  <th scope="col" >Test</th>
                  <th scope="col" >Results</th>
                </tr>
              </thead>
              <tbody id="dynamic_prescription_table">
              `
              + ROWS +
              `
              </tbody>
        </table>
      `

      d.set_value("results", htmlC);
      d.show();      

    }else {
      frappe.msgprint("No tests have been ordered yet");
    }
  },

  patient: function (frm) {
    // // // console.log("Patienting....");
    const patient_age = "";
    const patientdob = "";
    if (!frm.is_new() && !frm.doc.patient) {
      frappe.set_route("List", "Patient Encounter", "List");
    }

    //Patient has Open Encounter
    // if (frm.is_new() && frm.doc.patient) {
    //   frappe.call({
    //     method: "gch_custom.services.rest.check_open_encounter",
    //     async: false,
    //     args: {
    //       doctype: "Patient Encounter",
    //       patient: frm.doc.patient,
    //     },
    //     callback: function (data) {
    //       if (data.message) {
    //         if (data.message.open_encounter === 1) {
    //           frappe.set_route("Form", frm.doctype, data.message.enc_name);
    //         }
    //       }
    //     },
    //   });
    // }

    // Storing hours since last encounter globally for processing
    let last_encounter_dur = -1;

    //Fetching Hours passed since last encounter
    if (frm.is_new() && frm.doc.patient) {
      frappe.call({
        async: false,
        method: "gch_custom.services.rest.get_last_pe_detail",
        args: {
          doctype: "Patient Encounter",
          filters: frm.doc.patient,
        },
        callback: function (data) {
          last_encounter_dur = data.message.lastv_hrs;

          if (data.message) {
            frappe.model.set_value(
              frm.doctype,
              frm.docname,
              "revisit_reason_dur",
              data.message.lastv_hrs
            );
          }
        },
      });
    }
    // // // console.log("Last Encounter duration", last_encounter_dur);

    // let patient = frm.doc.patient
    let patient_uhid = frm.doc.patient_uhid;

    // Checking if less than 24 hours have passed to autofill some triage information
    if (
      cur_frm.is_new() &&
      cur_frm.doc.patient &&
      last_encounter_dur < 24 &&
      last_encounter_dur > -1
    ) {
      // Fetch prev encounter information
      console.log("Pulling Anthropometry Information!")
      fetch_prev_enc_info(frm)

    }

    // PULLING HISTORY DATA FROM WITHIN THE LAST 2 WEEKS
    if (cur_frm.is_new() &&
        cur_frm.doc.patient &&
        last_encounter_dur < 336 &&
        last_encounter_dur > -1) {
            fetch_patient_history_within_2wks(frm)
        }

    if (frm.doc.patient) {
      //Get and Display Patient Full Names per JCI
      frappe.call({
        method: "frappe.client.get",
        args: {
          doctype: "Patient",
          // name: frm.doc.patient
          filters: { name: frm.doc.patient },
        },
        callback: function (data) {
          const patientdob = data.message.dob;
          const patient_age = calculate_age(patientdob);
          let age_in_weeks = Math.round(patient_age / 7);

          var dename = strip(
            data.message.first_name +
            " " +
            data.message.middle_name +
            " " +
            data.message.last_name
          ).replace("null", "");
          frappe.model.set_value(
            frm.doctype,
            frm.docname,
            "patient_name",
            strip(dename)
          );

          //Vaccination
          if (frm.doc.clinic == "Wellbaby - GCH") {
            frm.set_query("visit_schedule", function () {
              return {
                filters: [["age_in_weeks", "<=", age_in_weeks]],
              };
            });
          }
        },
      });

      //Get Family history
      frappe.call({
        method: "gch_custom.services.rest.get_previous_encounter",
        // async: false,
        args: {
          doctype: "Patient Encounter",
          patient: frm.doc.patient,
        },
        callback: function (data) {
          if (data.message) {
            // // // console.log("FH...", data.message.family_history);
            // // // console.log("MH...", data.message.medical_history);
            // cur_frm.set_value("food_allergy", data.message.food_allergy);
            // cur_frm.set_value("drug_allergy", data.message.drug_allergy);
            // cur_frm.set_value("family_history", data.message.family_history);
            // cur_frm.set_value("past_medical_history", data.message.medical_history);
            // cur_frm.refresh_field("food_allergy");
            // cur_frm.refresh_field("drug_allergy");
          }
        },
      });

      // Checking if patient has any open bills before creating a new encounter
      let bill_list_and_encounter_list;

      if (frm.doc.__islocal == 1) {
        // // // console.log("Local patient", frm.doc.__islocal);
        // // // console.log(
        // "Checking if patient has any open bills before creating a new encounter"
        // );
        // // // console.log("UHID", patient_uhid);

        frappe
          .call({
            async: false,
            method:
              "gch_custom.services.rest.check_for_open_bills_and_encounters",
            args: { patient_uhid },
          })
          .done((r) => {
            bill_list_and_encounter_list = r.message;

            // // // console.log(bill_list_and_encounter_list);

            let bill_count = bill_list_and_encounter_list[1];
            let encounter_count = bill_list_and_encounter_list[0];

            if (bill_count > 0 && encounter_count > 0) {
              frappe.warn(
                "Error!!!",
                "This Patient has " +
                bill_count +
                " open bills and " +
                encounter_count +
                " encounters, please close them before proceeding....",
                () => {
                  // location.reload();
                },
                "Continue",
                true
              );
              window.history.back();
              // window.history.back();
            } else if (bill_count > 0 && encounter_count == 0) {
              frappe.warn(
                "Error!!!",
                "This patient has " +
                bill_count +
                " Open Bills, please close them before proceeding....",
                () => {
                  // location.reload();
                },
                "Continue",
                true
              );
              window.history.back();
            } else if (bill_count == 0 && encounter_count > 0) {
              frappe.warn(
                "Error!!!",
                "This patient has " +
                encounter_count +
                " Open Encounters, please close them before proceeding....",
                () => {
                  // location.reload();
                },
                "Continue",
                true
              );
              window.history.back();
              // window.history.back();
            } else {
              // // // console.log("This patient has no open encounters or bills");
            }
          });
      }

      // Checking if Patient dob is the default value and prompting user to edit it
      if (frm.doc.date_of_birth == "1901-01-01") {
        // // // console.log("Checking patient age............")
        frappe.warn(
          "Notice!!!",
          "Please confirm the patient's age and change it.",
          () => { },
          "Continue",
          true
        );
      }
      var new_dob = frm.doc.date_of_birth || "1901-01-01";

      // checking if set date is greater than date today
      function isInThePast(date) {
        const today = new Date();

        // 👇️ OPTIONAL!
        // This line sets the hour of the current date to midnight
        // so the comparison only returns `true` if the passed in date
        // is at least yesterday
        today.setHours(0, 0, 0, 0);

        return date < today;
      }

      if (!isInThePast(new Date(new_dob))) {
        frappe.warn(
          "Error!!!",
          "Patient Date of Birth CANNOT be a date past today. Please confirm",
          () => {
            $('div[data-fieldname="date_of_birth"]').css(
              "background-color",
              "#ff00001f"
            );

            $('[data-fieldname="date_of_birth"]').find("label")[0].innerHTML =
              "<strong>Date Of Birth (recheck date of birth!)</strong>";

            $('[data-fieldname="date_of_birth"]').find("label")[0].style.color =
              "red";
          },

          "Continue",
          true,
          $('div[data-fieldname="date_of_birth"]').css(
            "background-color",
            "#ff00001f"
          ),

          ($('[data-fieldname="date_of_birth"]').find("label")[0].innerHTML =
            "<strong>Date Of Birth (recheck date of birth)</strong>"),
          ($('[data-fieldname="date_of_birth"]').find("label")[0].style.color =
            "red")
        );
      }
    }
  },

  // Changing dob on patient list if a nurse of receptionist adds a new DOB value
  dob: function (frm) {
    // // // console.log("Changing dob from encounter");

    var patient = frm.doc.patient;
    var new_dob = frm.doc.dob || "1901-01-01";

    // checking if set date is greater than date today
    function isInThePast(date) {
      const today = new Date();

      // 👇️ OPTIONAL!
      // This line sets the hour of the current date to midnight
      // so the comparison only returns `true` if the passed in date
      // is at least yesterday
      today.setHours(0, 0, 0, 0);

      return date < today;
    }

    if (!isInThePast(new Date(new_dob))) {
      frappe.warn(
        "Error!!!",
        "Patient Date of Birth CANNOT be a date past today. Please confirm",
        () => {
          $('input[data-fieldname="dob"]').css("color", "red");
          $('input[data-fieldname="dob"]').css("background-color", "#ff00001f");

          $('input[data-fieldname="date_of_birth"]').css("color", "red");
          $('input[data-fieldname="date_of_birth"]').css(
            "background-color",
            "#ff00001f"
          );
        },
        "Continue",
        true,
        $('input[data-fieldname="dob"]').css("color", "red"),
        $('input[data-fieldname="dob"]').css("background-color", "#ff00001f"),

        $('input[data-fieldname="date_of_birth"]').css("color", "red"),
        $('input[data-fieldname="date_of_birth"]').css(
          "background-color",
          "#ff00001f"
        )
      );
    } else {
      frappe
        .call({
          method: "gch_custom.services.rest.update_dob_from_encounter",
          args: { patient, new_dob },
        })
        .done((r) => {
          var patient_data = r.message;

          let calculate_age = function (birth) {
            let ageMS = Date.parse(Date()) - Date.parse(birth);
            let gch_patient_age = new Date();
            gch_patient_age.setTime(ageMS);
            let years = gch_patient_age.getFullYear() - 1970;

            return `${years} ${__(
              "Year(s)"
            )} ${gch_patient_age.getMonth()} ${__(
              "Month(s)"
            )} ${gch_patient_age.getDate()} ${__("Day(s)")}`;
          };

          let patient_age = calculate_age(patient_data.dob);

          cur_frm.set_value("date_of_birth", cur_frm.doc.dob);
          cur_frm.refresh_field("date_of_birth");

          cur_frm.set_value("patient_age", patient_age);
          cur_frm.refresh_field("patient_age");

          // // // console.log(patient_age);
        });
    }
  },

  change_date_of_birth: function (frm) {
    if (cur_frm.doc.change_date_of_birth == 1) {
      cur_frm.set_df_property("dob", "hidden", false);
      cur_frm.refresh_field("dob");
    } else {
      cur_frm.set_df_property("dob", "hidden", true);
      cur_frm.refresh_field("dob");
    }
  },

  // Cut off point for MUAC field
  muac: function (frm) {
    let muac_value = parseFloat(frm.doc.muac);

    // // // console.log(muac_value, "MUAC.......")

    if (muac_value < 11.5) {
      // // // console.log("SAM", "Servere Acute Malnutrition");

      frm.set_df_property("malnutrition_level", "hidden", false);
      frm.doc.malnutrition_level = "Servere Acute Malnutrition (SAM)";

      frm.refresh_field("malnutrition_level");
    } else if (muac_value == 11.6 && muac_value < 12.6) {
      // // // console.log("MAM", "Moderate Acute Malnutrition");

      frm.set_df_property("malnutrition_level", "hidden", false);
      frm.doc.malnutrition_level = "Moderate Acute Malnutrition (MAM)";

      frm.refresh_field("malnutrition_level");
    } else if (muac_value == 12.6 && muac_value < 13.0) {
      // // // console.log("Mild Malnutrition");

      frm.set_df_property("malnutrition_level", "hidden", false);
      frm.doc.malnutrition_level = "Mild Malnutrition";

      frm.refresh_field("malnutrition_level");
    } else if (muac_value > 13.1) {
      // // // console.log("Normal");

      frm.set_df_property("malnutrition_level", "hidden", false);
      frm.doc.malnutrition_level = "Normal";

      frm.refresh_field("malnutrition_level");
    }
  },
});

// Function for fetching allergies and assessments for patient's returning within 24hrs
// called separately after the first encounter save since they need to be attached to an encounter number
let fetch_prev_assessments_and_allergies = (frm) => {
  // // // console.log("Inside If check.............");

  setTimeout(() => {

   
    //   frappe.show_progress(
    //     "Updating assessments and allergies..",
    //     75,
    //     100,
    //     "Please wait"
    //   );

      frappe.call({
        async: false,
        method: "gch_custom.services.rest.fetch_data_from_recent_encounter2",
        args: {
          doctype: "Patient Encounter",
          filters: cur_frm.doc.patient,
        },
        callback: function (data) {
          console.log(cur_frm.doc.name, "duplating....");

          // Duplicating previous encounter assessments
          frappe.call({
            method:
              "gch_custom.services.rest.duplicate_prev_assessment_templates",
            async: false,
            args: {
              prev_encounter: data.message.encounter_number,
              current_encounter: cur_frm.doc.name,
            },
            callback: function (data) {
              // // // console.log(data, "duplating2....");
            },
          });

          // Creating duplicate records for allergies after encounter name is generated

          // // // console.log(
          //   data.message.drug_allergy,
          //   "data fetching allergies2...."
          // );

          console.log(data, "mAIN DATA...")

          if (data.message.has_no_drug_allergy == 0) {
            for (let allergy in data.message.drug_allergy) {
              console.log(data.message.drug_allergy[allergy], "drug");

              if (data.message.drug_allergy[allergy]) {
                frappe.call({
                  async: false,
                  method:
                    "gch_custom.services.rest.duplicate_drug_allergy_to_recent_enc",
                  args: {
                    creation: data.message.drug_allergy[allergy].creation,
                    docstatus: data.message.drug_allergy[allergy].docstatus,
                    doctype: data.message.drug_allergy[allergy].doctype,
                    drug_allergy:
                      data.message.drug_allergy[allergy].drug_allergy,
                    idx: data.message.drug_allergy[allergy].idx,
                    modified: data.message.drug_allergy[allergy].modified,
                    modified_by: data.message.drug_allergy[allergy].modified_by,
                    owner: data.message.drug_allergy[allergy].owner,
                    parent: cur_frm.doc.name,
                    parentfield: data.message.drug_allergy[allergy].parentfield,
                    parenttype: data.message.drug_allergy[allergy].parenttype,
                  },
                  callback: (data) => {
                    // // // console.log(data);
                  },
                });
              }
            }
          } 

          if (!data.message.has_no_food_allergy) {
            for (let allergy in data.message.food_allergy) {
              // // // console.log(data.message.food_allergy[allergy], "food");
              if (data.message.food_allergy[allergy]) {
                frappe.call({
                  async: false,
                  method:
                    "gch_custom.services.rest.duplicate_food_allergy_to_recent_enc",
                  args: {
                    creation: data.message.food_allergy[allergy].creation,
                    docstatus: data.message.food_allergy[allergy].docstatus,
                    doctype: data.message.food_allergy[allergy].doctype,
                    food_allergy:
                      data.message.food_allergy[allergy].food_allergy,
                    idx: data.message.food_allergy[allergy].idx,
                    modified: data.message.food_allergy[allergy].modified,
                    modified_by: data.message.food_allergy[allergy].modified_by,
                    owner: data.message.food_allergy[allergy].owner,
                    parent: cur_frm.doc.name,
                    parentfield: data.message.food_allergy[allergy].parentfield,
                    parenttype: data.message.food_allergy[allergy].parenttype,
                  },
                  callback: (data) => {
                    // // // console.log(data);
                  },
                });
              }
            }
          } 

          if (data.message.other_allergy.length > 0) {
            for (let allergy in data.message.other_allergy) {
              // // // console.log(data.message.other_allergy[allergy], "other");

              if (data.message.other_allergy[allergy]) {
                frappe.call({
                  async: false,
                  method:
                    "gch_custom.services.rest.duplicate_other_allergy_to_recent_enc",
                  args: {
                    creation: data.message.other_allergy[allergy].creation,
                    docstatus: data.message.other_allergy[allergy].docstatus,
                    doctype: data.message.other_allergy[allergy].doctype,
                    other_allergy:
                      data.message.other_allergy[allergy].other_allergy,
                    idx: data.message.other_allergy[allergy].idx,
                    modified: data.message.other_allergy[allergy].modified,
                    modified_by:
                      data.message.other_allergy[allergy].modified_by,
                    owner: data.message.other_allergy[allergy].owner,
                    parent: cur_frm.doc.name,
                    parentfield:
                      data.message.other_allergy[allergy].parentfield,
                    parenttype: data.message.other_allergy[allergy].parenttype,
                  },
                  callback: (data) => {
                    // // // console.log(data);
                  },
                });
              }
            }
          }


          cur_frm.set_value("data_fetched_from_prev_enc", 1)
          cur_frm.refresh_field("data_fetched_from_prev_enc")


        },
      });
    frappe.show_alert(
        {
        message: __("Assessments and Allergies have been updated."),
        indicator: "green",
        },
        3
    );

    cur_frm.save()
    cur_frm.reload_doc();
  }, 500);
  // Making call to mark encounter if data is fetched
  cur_frm.set_value("data_fetched_from_prev_enc", 1)
  cur_frm.refresh_field("data_fetched_from_prev_enc")

};


function calculate_bmi(frm) {
  // Reference https://en.wikipedia.org/wiki/Body_mass_index
  // bmi = weight (in Kg) / height * height (in Meter)
  var bmi =
    frm.doc.weight_in_kilograms /
    ((frm.doc.height_in_centimeters / 100) *
      (frm.doc.height_in_centimeters / 100));
  var bmi_note = null;

  if (bmi < 18.5) {
    bmi_note = "Underweight";
  } else if (bmi >= 18.5 && bmi < 25) {
    bmi_note = "Normal";
  } else if (bmi >= 25 && bmi < 30) {
    bmi_note = "Overweight";
  } else if (bmi >= 30) {
    bmi_note = "Obese";
  }
  frappe.model.set_value(frm.doctype, frm.docname, "bmi", bmi);
//   frappe.model.set_value(frm.doctype, frm.docname, "nursing_notes", bmi_note);
}

function calculate_bsa(frm) {
  // Mosteller formula
  // BSA (m2) = square root of (height (cm) x weight (kg)/3600)
  var bsa = Math.sqrt(
    frm.doc.height_in_centimeters * (frm.doc.weight_in_kilograms / 3600)
  );

  frappe.model.set_value(frm.doctype, frm.docname, "bsa", bsa);
}

function calculatePercentileFromZscore(zScore) {
  // Calculating the Percentile from Z-Score
  // z == number of standard deviations from the mean

  // if z is greater than 6.5 standard deviations from the mean the
  // number of significant digits will be outside of a reasonable range

  if (zScore < -6.5) {
    return 0.0;
  }

  if (zScore > 6.5) {
    return 1.0;
  }

  var factK = 1;
  var sum = 0;
  var term = 1;
  var k = 0;
  var loopStop = Math.exp(-23);

  while (Math.abs(term) > loopStop) {
    term =
      (((0.3989422804 * Math.pow(-1, k) * Math.pow(zScore, k)) /
        (2 * k + 1) /
        Math.pow(2, k)) *
        Math.pow(zScore, k + 1)) /
      factK;
    sum += term;
    k++;
    factK *= k;
  }

  sum += 0.5;

  // // // console.log("Percentile", sum);
  return sum;
}

// Fuction to calculate bmi for age percentile
function calculate_bmi_age_percentile(frm) {
  // // // console.log("Calculating BMI for Age Percentile...");
  // STEP ONE CALCULATE THE BMI
  var bmi =
    frm.doc.weight_in_kilograms /
    ((frm.doc.height_in_centimeters / 100) *
      (frm.doc.height_in_centimeters / 100));

  // STEP TWO : CONVERT PATIENT_AGE TO MONTHS
  var getYears = parseInt(frm.doc.patient_age.trim().split(/\s+/)[0]) * 12;
  var getMonths = parseInt(frm.doc.patient_age.trim().split(/\s+/)[2]);
  var getDays = parseInt(frm.doc.patient_age.trim().split(/\s+/)[4]);

  // Assuming 28+ days to be a month
  if (getDays >= 28) {
    getMonths += 1;
  }

  // GETTING TOTAL NUMBER OF MONTHS
  var totalMonths = parseInt(getYears + getMonths);

  // STEP THREE : CALCULATE BMI AGE PERCENTILE
  // check gender
  if (frm.doc.patient_sex == "Male") {
    if (totalMonths > 60) {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/boysPercentileMonth60to240.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Agemos == parseFloat(totalMonths) + 0.5) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((bmi / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var bmiAgePercentile = calculatePercentileFromZscore(zScore);
              bmiAgePercentile = (bmiAgePercentile * 100).toFixed(2);
              // // // console.log("Percentile......", bmiAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "bmi_for_age",
                bmiAgePercentile
              );
              // // // console.log(agePercentile)
              // // // console.log(closest)
              // // // console.log(slicedArray)
            }
            // // // console.log(bmi_age_percentile)
          }
        });
    } else if (totalMonths > 24) {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/boysPercentileMonth24To60.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Month == totalMonths) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((bmi / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var bmiAgePercentile = calculatePercentileFromZscore(zScore);
              bmiAgePercentile = (bmiAgePercentile * 100).toFixed(2);
              // // // console.log("Percentile......", bmiAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "bmi_for_age",
                bmiAgePercentile
              );
              // // // console.log(agePercentile)
              // // // console.log(closest)
              // // // console.log(slicedArray)
            }
            // // // console.log(bmi_age_percentile)
          }
        });
    } else {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/boysPercentileMonth0To24.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Month == totalMonths) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((bmi / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var bmiAgePercentile = calculatePercentileFromZscore(zScore);
              bmiAgePercentile = (bmiAgePercentile * 100).toFixed(2);
              // // // console.log("Percentile......", bmiAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "bmi_for_age",
                bmiAgePercentile
              );
              // // // console.log(agePercentile)
              // // // console.log(closest)
              // // // console.log(slicedArray)
            }
            // // // console.log(bmi_age_percentile)
          }
        });
    }
  } else if (frm.doc.patient_sex == "Female") {
    if (totalMonths > 60) {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/girlsPercentileMonth60to240.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Agemos == parseFloat(totalMonths) + 0.5) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((bmi / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var bmiAgePercentile = calculatePercentileFromZscore(zScore);
              bmiAgePercentile = (bmiAgePercentile * 100).toFixed(2);
              // // // console.log("Percentile......", bmiAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "bmi_for_age",
                bmiAgePercentile
              );
              // // // console.log(agePercentile)
              // // // console.log(closest)
              // // // console.log(slicedArray)
            }
            // // // console.log(bmi_age_percentile)
          }
        });
    } else if (totalMonths > 24) {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/girlsPercentileMonth24To60.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Month == totalMonths) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((bmi / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var bmiAgePercentile = calculatePercentileFromZscore(zScore);
              bmiAgePercentile = (bmiAgePercentile * 100).toFixed(2);
              // // // console.log("Percentile......", bmiAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "bmi_for_age",
                bmiAgePercentile
              );
              // // // console.log(agePercentile)
              // // // console.log(closest)
              // // // console.log(slicedArray)
            }
            // // // console.log(bmi_age_percentile)
          }
        });
    } else {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/girlsPercentileMonth0To24.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Month == totalMonths) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((bmi / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var bmiAgePercentile = calculatePercentileFromZscore(zScore);
              bmiAgePercentile = (bmiAgePercentile * 100).toFixed(2);
              // // // console.log("Percentile......", bmiAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "bmi_for_age",
                bmiAgePercentile
              );
              // // // console.log(agePercentile)
              // // // console.log(closest)
              // // // console.log(slicedArray)
            }
            // // // console.log(bmi_age_percentile)
          }
        });
    }
  }
  // // // console.log("BMI: ", bmi);
  // // // console.log("Age:", frm.doc.patient_age);
  // // // console.log("SEX:", frm.doc.patient_sex);
  // // // console.log("Age Combined:", totalMonths);
}

// Function calculate height for age percentile
function calculate_height_age_percentile(frm) {
  // // // console.log("Calculating Height for Age Percentile...");

  // STEP ONE GET THE HEIGHT IN CENTIMETERS
  var patient_height = frm.doc.height_in_centimeters;

  // STEP TWO : CONVERT PATIENT_AGE TO MONTHS
  var getYears = parseInt(frm.doc.patient_age.trim().split(/\s+/)[0]) * 12;
  var getMonths = parseInt(frm.doc.patient_age.trim().split(/\s+/)[2]);
  var getDays = parseInt(frm.doc.patient_age.trim().split(/\s+/)[4]);

  // Assuming 28+ days to be a month
  if (getDays >= 28) {
    getMonths += 1;
  }

  // GETTING TOTAL NUMBER OF MONTHS
  var totalMonths = parseInt(getYears + getMonths);

  // STEP THREE : CALCULATE HEIGHT FOR AGE PERCENTILE
  // check gender
  if (frm.doc.patient_sex == "Male") {
    if (totalMonths > 60) {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/height_for_age/boysHeightAge60to240.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Agemos == parseFloat(totalMonths) + 0.5) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((patient_height / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var heightAgePercentile = calculatePercentileFromZscore(zScore);
              heightAgePercentile = (heightAgePercentile * 100).toFixed(2);
              // // // console.log("heightAgePercentile......", heightAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "height_for_age",
                heightAgePercentile
              );
              // // // console.log(heightAgePercentile)
            }
          }
        });
    } else if (totalMonths > 24) {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/height_for_age/boysHeightAge24To60.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Month == totalMonths) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((patient_height / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var heightAgePercentile = calculatePercentileFromZscore(zScore);
              heightAgePercentile = (heightAgePercentile * 100).toFixed(2);
              // // // console.log("heightAgePercentile......", heightAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "height_for_age",
                heightAgePercentile
              );
              // // // console.log(heightAgePercentile)
            }
          }
        });
    } else {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/height_for_age/boysHeightAge0To24.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Month == totalMonths) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((patient_height / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var heightAgePercentile = calculatePercentileFromZscore(zScore);
              heightAgePercentile = (heightAgePercentile * 100).toFixed(2);
              // // // console.log("heightAgePercentile......", heightAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "height_for_age",
                heightAgePercentile
              );
              // // // console.log(heightAgePercentile)
            }
          }
        });
    }
  } else if (frm.doc.patient_sex == "Female") {
    if (totalMonths > 60) {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/height_for_age/girlsHeightAge60to240.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Agemos == parseFloat(totalMonths) + 0.5) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((patient_height / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var heightAgePercentile = calculatePercentileFromZscore(zScore);
              heightAgePercentile = (heightAgePercentile * 100).toFixed(2);
              // // // console.log("heightAgePercentile......", heightAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "height_for_age",
                heightAgePercentile
              );
              // // // console.log(heightAgePercentile)
            }
            // // // console.log(bmi_age_percentile)
          }
        });
    } else if (totalMonths > 24) {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/height_for_age/girlsHeightAge24To60.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Month == totalMonths) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((patient_height / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var heightAgePercentile = calculatePercentileFromZscore(zScore);
              heightAgePercentile = (heightAgePercentile * 100).toFixed(2);
              // // // console.log("heightAgePercentile......", heightAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "height_for_age",
                heightAgePercentile
              );
              // // // console.log(heightAgePercentile)
            }
            // // // console.log(bmi_age_percentile)
          }
        });
    } else {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/height_for_age/girlsHeightAge0To24.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Month == totalMonths) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((patient_height / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var heightAgePercentile = calculatePercentileFromZscore(zScore);
              heightAgePercentile = (heightAgePercentile * 100).toFixed(2);
              // // // console.log("heightAgePercentile......", heightAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "height_for_age",
                heightAgePercentile
              );
              // // // console.log(heightAgePercentile)
            }
            // // // console.log(bmi_age_percentile)
          }
        });
    }
  }

  // // // console.log("Patient Height: ", patient_height);
  // // // console.log("Age:", frm.doc.patient_age);
  // // // console.log("SEX:", frm.doc.patient_sex);
  // // // console.log("Age Combined:", totalMonths);
}

// Function calculate weight for age percentile
function calculate_weight_age_percentile(frm) {
  // // // console.log("Calculating Weight for Age Percentile...");

  // STEP ONE GET THE WEIGHT IN KILOGRAMS
  var patient_weight = frm.doc.weight_in_kilograms;

  // STEP TWO : CONVERT PATIENT_AGE TO MONTHS
  var getYears = parseInt(frm.doc.patient_age.trim().split(/\s+/)[0]) * 12;
  var getMonths = parseInt(frm.doc.patient_age.trim().split(/\s+/)[2]);
  var getDays = parseInt(frm.doc.patient_age.trim().split(/\s+/)[4]);

  // Assuming 28+ days to be a month
  if (getDays >= 28) {
    getMonths += 1;
  }

  // GETTING TOTAL NUMBER OF MONTHS
  var totalMonths = parseInt(getYears + getMonths);

  // STEP THREE : CALCULATE WEIGHT FOR AGE PERCENTILE
  // check gender
  if (frm.doc.patient_sex == "Male") {
    if (totalMonths > 60) {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/weight_for_age/boysWeightAge60to240.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            // Adding 0.5 to the total number of months to match records on json file
            if (obj[i].Agemos == parseFloat(totalMonths) + 0.5) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((patient_weight / m) ** l - 1) / (l * s);
              // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var weightAgePercentile = calculatePercentileFromZscore(zScore);
              weightAgePercentile = (weightAgePercentile * 100).toFixed(2);
              // // console.log("weightAgePercentile......", weightAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "weight_for_age",
                weightAgePercentile
              );
              // // // console.log(weightAgePercentile)
            }
          }
        });
    } else {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/weight_for_age/boysWeightAge.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Month == totalMonths) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((patient_weight / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var weightAgePercentile = calculatePercentileFromZscore(zScore);
              weightAgePercentile = (weightAgePercentile * 100).toFixed(2);
              // // // console.log("weightAgePercentile......", weightAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "weight_for_age",
                weightAgePercentile
              );
              // // // console.log(weightAgePercentile)
            }
          }
        });
    }
  } else if (frm.doc.patient_sex == "Female") {
    if (totalMonths > 60) {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/weight_for_age/girlsWeightAge60To240.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Agemos == parseFloat(totalMonths) + 0.5) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((patient_weight / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var weightAgePercentile = calculatePercentileFromZscore(zScore);
              weightAgePercentile = (weightAgePercentile * 100).toFixed(2);
              // // // console.log("weightAgePercentile......", weightAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "weight_for_age",
                weightAgePercentile
              );
              // // // console.log(weightAgePercentile)
            }
          }
        });
    } else {
      var obj; // initializing object to store fetch data
      fetch(
        "/assets/gch_custom/js/patient_encounter/percentile_data/weight_for_age/girlsWeightAge.json"
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          for (var i in obj) {
            if (obj[i].Month == totalMonths) {
              // Getting LMS values from the json file
              const l = obj[i].L;
              const m = obj[i].M;
              const s = obj[i].S;
              // // // console.log("LMS Values...", l, m, s);
              // Calculating the Z-Score from L, M, S values
              var zScore = ((patient_weight / m) ** l - 1) / (l * s);
              // // // console.log("zScore", zScore);

              // Calculating the Percentile from Z-Score
              var weightAgePercentile = calculatePercentileFromZscore(zScore);
              weightAgePercentile = (weightAgePercentile * 100).toFixed(2);
              // // // console.log("weightAgePercentile......", weightAgePercentile);

              // SETTING BMI AGE PERCENTILE TO FIELD
              frappe.model.set_value(
                frm.doctype,
                frm.docname,
                "weight_for_age",
                weightAgePercentile
              );
              // // // console.log(weightAgePercentile)
            }
            // // // console.log(bmi_age_percentile)
          }
        });
    }
  }

  // // // console.log("Patient Weight: ", patient_weight);
  // // // console.log("Age:", frm.doc.patient_age);
  // // // console.log("SEX:", frm.doc.patient_sex);
  // // // console.log("Age Combined:", totalMonths);
}

function create_patient_assessment(frm) {
  frappe.route_options = {
    patient: frm.doc.patient,
    encounter: frm.doc.name,
    assessment_branch: frm.doc.branch,
    assessment_template: frm.doc.patient_assessment,
    weight: cur_frm.doc.weight_in_kilograms,
    height: cur_frm.doc.height_in_centimeters,
    bmi: cur_frm.doc.bmi,
    bsa: cur_frm.doc.bsa,
    temperature: cur_frm.doc.vital_signs_table[0].patient_encounter_temperature
  };
  frappe.new_doc("Patient Assessment");
}
function create_pharmacy_dispensement_form(frm) {
  frappe.route_options = {
    patient_encounter: frm.doc.name,
  };
  frappe.new_doc("Pharmacy Dispensement Form");
}

function flag_patient(frm) {
  if (frm.doc.is_priority_patient == 1)
    document.querySelectorAll(
      "[data-fieldname='is_priority_patient']"
    )[0].style.color = "red";
  else
    document.querySelectorAll(
      "[data-fieldname='is_priority_patient']"
    )[0].style.color = "#020f10";

  if (frm.doc.is_drug_allergy_patient == 1)
    document.querySelectorAll(
      "[data-fieldname='is_drug_allergy_patient']"
    )[0].style.color = "Orange";
  else
    document.querySelectorAll(
      "[data-fieldname='is_drug_allergy_patient']"
    )[0].style.color = "#020f10";

  if (frm.doc.is_fall_risk_patient == 1)
    document.querySelectorAll(
      "[data-fieldname='is_fall_risk_patient']"
    )[0].style.color = "#FFFF00";
  else
    document.querySelectorAll(
      "[data-fieldname='is_fall_risk_patient']"
    )[0].style.color = "#020f10";

  if (frm.doc.is_isolation_patient == 1)
    document.querySelectorAll(
      "[data-fieldname='is_isolation_patient']"
    )[0].style.color = "#800080";
  else
    document.querySelectorAll(
      "[data-fieldname='is_isolation_patient']"
    )[0].style.color = "#020f10";

  if (frm.doc.is_emergency_patient == 1)
    document.querySelectorAll(
      "[data-fieldname='is_emergency_patient']"
    )[0].style.color = "red";
  else
    document.querySelectorAll(
      "[data-fieldname='is_emergency_patient']"
    )[0].style.color = "#020f10";
}

//Emergency Patient Validation
function set_emergency_off(frm) {
  if (
    frm.doc.weak_or_absent_breathing == 0 &&
    frm.doc.obstructed_breathing == 0 &&
    frm.doc.central_cyanosis_or_spo2 == 0 &&
    frm.doc.severe_respiratory_distress == 0 &&
    frm.doc.weak_or_fast_pulse_gt_160 == 0 &&
    frm.doc.capillary_return_time_gt_3_sec == 0 &&
    frm.doc.pulse_rate_lt_60_per_min == 0 &&
    frm.doc.avpu_is_p_or_u_or_convulsion == 0 &&
    frm.doc.diarrhea_with_sunken_eyes == 0 &&
    frm.doc.anaphylaxis == 0 &&
    frm.doc.bulging_anterior_fontanelle == 0 &&
    frm.doc.intraosseous_line_in_place == 0 &&
    frm.doc.neck_stiffness == 0 &&
    frm.doc.artificial_airway == 0 &&
    frm.doc.hypothermia == 0 &&
    frm.doc.hypoglycemia == 0 &&
    frm.doc.immediate_post_ictal_period == 0
  ) {
    cur_frm.set_value("is_emergency_patient", 0);
  }
}

//Priority Patient Validation
function set_priority_off(frm) {
  if (
    frm.doc.fast_breathing == 0 &&
    frm.doc.grunting == 0 &&
    frm.doc.chest_wall_indrawing == 0 &&
    frm.doc.wheeze == 0 &&
    frm.doc.stridor == 0 &&
    frm.doc.drooling == 0 &&
    frm.doc.tiny_child == 0 &&
    frm.doc.major_trauma == 0 &&
    frm.doc.poisoning == 0 &&
    frm.doc.severe_palmar_pallor == 0 &&
    frm.doc.restless_irritable_floppy == 0 &&
    frm.doc.referral == 0 &&
    frm.doc.malnutrition_severe_wasting == 0 &&
    frm.doc.oedeme_of_both_feet == 0 &&
    frm.doc.severe_burns == 0 &&
    frm.doc.unable_to_drink_or_vomits_anything == 0
  )
    cur_frm.set_value("is_priority_patient", 0);
}

//Calulate Age in Days
// let calculate_age = function (birthdate) {
//     let ageMS = Date.parse(Date()) - Date.parse(birthdate);
//     const day_cons = 86400000;
//     let agedays = Math.trunc(ageMS / day_cons);

//     return agedays;
// };

let getcalculate_zscore = function (patdobs, patsgender, patswt, patsht) {
  frappe.call({
    method: "gch_custom.services.tools.calculates_zscore",
    args: {
      patsdob: patdobs,
      pgender: patsgender,
      pweight: patswt,
      pheight: patsht,
    },
    callback: function (data) {
      if (data.message) {
        // // // console.log(data.message)
        if (data.message.bfa) {
          cur_frm.set_value("bmi_for_age", data.message.bfa);
          cur_frm.refresh_field("bmi_for_age");
        }

        if (data.message.hfa) {
          cur_frm.set_value("height_for_age", data.message.hfa);
          cur_frm.refresh_field("height_for_age");
        }

        if (data.message.wfa) {
          cur_frm.set_value("weight_for_age", data.message.wfa);
          cur_frm.refresh_field("weight_for_age");
        }
      }
    },
  });
};

let assessment_length;

if (cur_frm.doc.encounter_assessment_table) {
    assessment_length = cur_frm.doc.encounter_assessment_table.length
} else {
    assessment_length = 0;
}

function get_encounter_assessment(frm) {
  frappe.call({
    method: "gch_custom.services.rest.encounter_assessments",
    args: {
      encounter: frm.doc.encounter_number,
    },

    callback: function (data) {
      let assessment = data.message;

      // // // console.log(assessment);

      let item_array = [];

      let is_walkin = false;

      if (cur_frm.doc.clinic.includes("Walk-In" || "Procedure - GCH" || "Results")) {
        is_walkin = true;
      }

      assessment_length = assessment.length;

      assessment_length_global = assessment.length;

      // // // console.log(assessment.length, "Assess length");

      if (assessment.length > 0) {
        // frm.set_df_property("patient_assessment", "reqd", 0);
        // frm.refresh_field("patient_assessment");

        // Setting the value of the field to the assessment's name, Forces user to save to retain P.A info
        frm.set_value("patient_assessment", assessment[0].assessment_template);
        frm.refresh_field("patient_assessment");
        // frappe.validated = true;
        assessment.forEach((assess) => {
          console.log(assess.assessment_template.includes("Falls Risk"), "Assessments here......")
            
          // Fetch submitted by full name not email
        //   let assess_submitted_by = frappe.db.get_value("User", {name: assess.owner}, "full_name")
        
        //   assess_submitted_by = assess_submitted_by.json

        //   console.log(assess_submitted_by, "USer here.............")

          // Flagging pain assessments 6 and above   
          if (assess.assessment_template.includes("Falls Risk") && (assess.total_score_obtained == 4 || assess.total_score_obtained == 5)) {
            item_array.push(
              `<tr style="background-color:yellow;">
                                <td style = "white-space: nowrap; color:black;"> <a style="color: blue;" href="/app/patient-assessment/${assess.name}">` +
              assess.name +
              `</a></td>
                                <td style = "white-space: nowrap; color:black;">` +
              assess.assessment_template +
              `</td>
                                <td style = "white-space: nowrap; color:black;">` +
              assess.total_score_obtained +
              `</td>
                                <td style = "white-space: nowrap; color:black;">` +
              assess.assessment_date +
              `</td>
                                <td style = "white-space: nowrap; color:black;">` +
              assess.assessment_time +
              `</td>
                                <td style = "white-space: nowrap;  color:black;">` +
              assess.owner +
              `</td>
                                <td style="color: black;">` +
              assess.action +
              `</td>
                                
                            </tr>`
            );
            
            // Flagging Falls Risk Assessments 6 and above
          } else if (assess.total_score_obtained > 5) {
            item_array.push(
                `<tr style="background-color:#ff00000a;">
                                  <td style = "white-space: nowrap; color:red;"> <a style="color: blue;" href="/app/patient-assessment/${assess.name}">` +
                assess.name +
                `<a/></td>
                                  <td style = "white-space: nowrap; color:red;">` +
                assess.assessment_template +
                `</td>
                                  <td style = "white-space: nowrap; color:red;">` +
                assess.total_score_obtained +
                `</td>
                                  <td style = "white-space: nowrap; color:red;">` +
                assess.assessment_date +
                `</td>
                                  <td style = "white-space: nowrap; color:red;">` +
                assess.assessment_time +
                `</td>
                                  <td style = "white-space: nowrap;  color:red;">` +
                assess.owner +
                `</td>
                                  <td style="color: red;">` +
                assess.action +
                `</td>
                                  
                              </tr>`
            );
          } else {
                item_array.push(
                    `<tr>
                                    <td style = "white-space: nowrap"> <a style="color: blue;" href="/app/patient-assessment/${assess.name}">` +
                    assess.name +
                    `</a></td>
                                    <td style = "white-space: nowrap">` +
                    assess.assessment_template +
                    `</td>
                                    <td style = "white-space: nowrap">` +
                    assess.total_score_obtained +
                    `</td>
                                    <td style = "white-space: nowrap">` +
                    assess.assessment_date +
                    `</td>
                                    <td style = "white-space: nowrap">` +
                    assess.assessment_time +
                    `</td>
                                    <td style = "white-space: nowrap">` +
                    assess.owner +
                    `</td>
                                    <td>` +
                    assess.action +
                    `</td>
                                    
                                </tr>`
                );
          }
        });

        $(".encounter-assessment").html(item_array);
      } else if (assessment.length <= 0 && frm.doc.__islocal != 1) {
        // Making the field mandatory if no record is found
        // // // console.log("No assessment found, Making field required");
        // // // console.log("islocal", frm.doc.__islocal);
        // frm.set_df_property("patient_assessment", "reqd", 1);
        // frm.refresh_field("patient_assessment");
      } else if (is_walkin) {
        frm.set_df_property("patient_assessment", "reqd", 0);
        frm.refresh_field("patient_assessment");
      }
    },
  });
}

frappe.ui.form.on("Wellbaby Vaccine Details", {
  vaccine_type: function (frm) {
    // // // console.log("hello");

    frm.fields_dict["vaccines"].grid.get_field("drug").get_query = function (
      doc,
      cdt,
      cdn
    ) {
      var child = locals[cdt][cdn];
      if (child.vaccine_type == "") return;
      return {
        filters: [["vaccine_type", "in", [child.vaccine_type, "omg"]]],
      };
    };
  },
});

const get_user_location = async (dbuser) => {
  let location;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_user_location",
      args: { dbuser },
    })
    .done((r) => {
      location = r.message;
    });

  return location;
};

// Editted to check temperature according to patient age # Editted by Redward

let check_vitals_temperature = function (frm) {
  cur_frm.doc.vital_signs_table.forEach((item) => {
    let rowno = item.idx;
    let temp = item.patient_encounter_temperature;

    // var getYears = parseInt(cur_frm.doc.patient_age.trim().split(/\s+/)[0]) * 12;
    // var getMonths = parseInt(cur_frm.doc.patient_age.trim().split(/\s+/)[2]);
    // var getDays = parseInt(cur_frm.doc.patient_age.trim().split(/\s+/)[4]);

    // // Assuming 28+ days to be a month
    // if (getDays >= 28) {
    //     getMonths += 1;
    // }

    // // GETTING TOTAL NUMBER OF MONTHS
    // var patientage = parseInt(getYears + getMonths);

    // // // console.log(temp);
    // // // console.log(rowno);

    // Priority Patient (High Fever)
    if (temp >= 39.5) {
      $('input[data-fieldname="patient_encounter_temperature"]').css(
        "color",
        "red"
      );
      $('div[data-fieldname="patient_encounter_temperature"]').css(
        "color",
        "red"
      );

      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_temperature",
        temp
      );

      // // // console.log("High fever");

      $('[data-fieldname="patient_encounter_temperature"]').find(
        "label"
      )[0].innerHTML = "Temperature (High Fever!)";

      $('[data-fieldname="patient_encounter_temperature"]').find(
        "label"
      )[0].style.color = "red";

      // Flagging patient as emergency
      cur_frm.set_value("is_emergency_patient", 1);
      cur_frm.refresh_field("is_emergency_patient");

      // Updating number of emergency vitals
      let current_emergency_vitals = cur_frm.doc.number_of_emergency_vitals
      cur_frm.set_value("number_of_emergency_vitals", current_emergency_vitals + 1)
      cur_frm.refresh_field("number_of_emergency_vitals")


      // Mild Fever
    } else if (temp >= 38 && temp <= 39.4) {
      $('input[data-fieldname="patient_encounter_temperature"]').css(
        "color",
        "#fd9937"
      );
      
      $('div[data-fieldname="patient_encounter_temperature"]').css(
        "color",
        "#fd9937"
      );
      

      // Emptying value of field if vital is not critical
      var empty = "";

        frappe.model.set_value(
          cur_frm.doctype,
          cur_frm.docname,
          "critical_vital_temperature",
          empty
        );

      // // // console.log("Mild Fever!!!!");


      $('[data-fieldname="patient_encounter_temperature"]').find(
        "label"
      )[0].style.color = "#fd9937";

      cur_frm.set_value("is_priority_patient", 1);
      cur_frm.refresh_field("is_priority_patient");

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

      // Emptying value of field if vital is not critical
      var empty = "";

      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_temperature",
        empty
      );


      // Normal Temperature
    } else if (temp > 35 && temp <= 37.9) {
      $('input[data-fieldname="patient_encounter_temperature"]').css(
        "color",
        "#28a745"
      );

      $('div[data-fieldname="patient_encounter_temperature"]').css(
        "color",
        "#28a745"
      );

      // Emptying value of field if vital is not critical

      //     frappe.model.set_value(
      //     cur_frm.doctype,
      //     cur_frm.docname,
      //     "critical_vital_temperature",
      //     temp
      // );

      $('[data-fieldname="patient_encounter_temperature"]').find(
        "label"
      )[0].innerHTML = "Temperature (Normal)";

      $('[data-fieldname="patient_encounter_temperature"]').find(
        "label"
      )[0].style.color = "#28a745";

      cur_frm.set_value("is_emergency_patient", 0)
      cur_frm.refresh_field("is_emergency_patient")

      cur_frm.set_value("is_priority_patient", 0);
      cur_frm.refresh_field("is_priority_patient");

      // Emptying value of field if vital is not critical
      var empty = "";

      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_temperature",
        empty
      );

      // Hypothermia
    } else if (temp <= 35) {
      $('input[data-fieldname="patient_encounter_temperature"]').css(
        "color",
        "#2CBAE1"
      );

      $('div[data-fieldname="patient_encounter_temperature"]').css(
        "color",
        "#2CBAE1"
      );

      
      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_temperature",
        temp
      );

      // // console.log("Hypothermia!");

      $('[data-fieldname="patient_encounter_temperature"]').find(
        "label"
      )[0].innerHTML = "Temperature (Hypothermia!)";

      $('[data-fieldname="patient_encounter_temperature"]').find(
        "label"
      )[0].style.color = "#2CBAE1";

      cur_frm.set_value("is_emergency_patient", 1);
      cur_frm.refresh_field("is_emergency_patient");

      // Updating number of emergency vitals
      let current_emergency_vitals = cur_frm.doc.number_of_emergency_vitals
      cur_frm.set_value("number_of_emergency_vitals", current_emergency_vitals + 1)
      cur_frm.refresh_field("number_of_emergency_vitals")

      

    } else {
      $('input[data-fieldname="patient_encounter_temperature"]').css(
        "color",
        "black"
      );

      // Emptying value of field if vital is not critical
      var empty = "";

      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_temperature",
        empty
      );
      cur_frm.set_value("is_priority_patient", 0);
      cur_frm.refresh_field("is_priority_patient");

      cur_frm.set_value("is_emergency_patient", 0);
      cur_frm.refresh_field("is_emergency_patient");
    }
  });
};

//Heart Rate Validation By Age # Editted by Redward
let check_heartrate = function (frm, heart_age, heart_rate, sleep_rate) {
  //   cur_frm.set_value("is_priority_patient", 1);
  var getYears = parseInt(heart_age.trim().split(/\s+/)[0]) * 12;
  var getMonths = parseInt(heart_age.trim().split(/\s+/)[2]);
  var getDays = parseInt(heart_age.trim().split(/\s+/)[4]);

  // Assuming 28+ days to be a month
  if (getDays >= 28) {
    getMonths += 1;
  }

  // GETTING TOTAL NUMBER OF MONTHS
  var heart_age = parseInt(getYears + getMonths);

  //Awake Rate
  if (sleep_rate == 0) {
    if(heart_rate < 60 || heart_rate > 180) {
        
        // Emergency Flagging
        cur_frm.set_value("is_emergency_patient", 1);
        cur_frm.refresh_field("is_emergency_patient");

        // Updating number of emergency vitals
        let current_emergency_vitals = cur_frm.doc.number_of_emergency_vitals
        cur_frm.set_value("number_of_emergency_vitals", current_emergency_vitals + 1)
        cur_frm.refresh_field("number_of_emergency_vitals")

        frappe.model.set_value(
            cur_frm.doctype,
            cur_frm.docname,
            "critical_vital_heart_rate",
            heart_rate
        );

        $('input[data-fieldname="patient_encounter_heart_rate"]').css(
            "color",
            "red"
          );
        $('div[data-fieldname="patient_encounter_heart_rate"]').css(
            "color",
            "red"
        );

    }
     else if (heart_age < 1 && (heart_rate < 100 || heart_rate > 180)) {
      // Added a +10 allowance on heart rate..... Implemented to have margin before flagging
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
      // Flagging patient as priority
      cur_frm.set_value("is_priority_patient", 1);

      
      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    } else if (
      heart_age >= 1 &&
      heart_age < 12 &&
      (heart_rate < 80 || heart_rate > 170)
    ) {
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "orange"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "orange"
      );
      
      // Flagging patient as priority
      cur_frm.set_value("is_priority_patient", 1);
      
      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    } else if (
      heart_age >= 12 &&
      heart_age < 24 &&
      (heart_rate < 90 || heart_rate > 120) // Added a +10 allowance on heart rate..... Implemented to have margin before flagging
    ) {
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "orange"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "orange"
      );
      
      // Flagging patient as priority
      cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    } else if (
      heart_age >= 24 &&
      heart_age < 60 &&
      (heart_rate < 70 || heart_rate > 110)
    ) {
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "orange"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "orange"
      );
      
      // Flagging patient as priority
      cur_frm.set_value("is_priority_patient", 1);
      
      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    } else if (
      heart_age >= 60 &&
      heart_age < 132 &&
      (heart_rate <= 60 || heart_rate >= 110) // Added a +10 allowance on heart rate..... Implemented to have margin before flagging
    ) {
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "orange"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "orange"
      );
      // Flagging patient as priority
      cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    } else if (heart_age >= 132 && (heart_rate < 60 || heart_rate >= 110)) {
      // Added a +10 allowance on heart rate..... Implemented to have margin before flagging
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "orange"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "orange"
      );
      // Flagging patient as priority
      cur_frm.set_value("is_priority_patient", 1);
      
      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_heart_rate",
        heart_rate
      );
    } else {
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "#28a745"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "#28a745"
      );

      // Emptying value of field if vital is not critical
      var empty = "";

      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_heart_rate",
        empty
      );

      cur_frm.set_value("is_priority_patient", 0);
      set_priority_off(frm);

      
    }
  }
  //  Sleeping Rate
  else {
    if (heart_age < 1 && (heart_rate < 90 || heart_rate > 170)) {
      // Added a +10 allowance on heart rate..... Implemented to have margin before flagging
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
      // Flagging patient as priority
      cur_frm.set_value("is_priority_patient", 1);
      
      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_heart_rate",
        heart_rate
      );
    } else if (
      heart_age >= 1 &&
      heart_age < 12 &&
      (heart_rate < 100 || heart_rate > 170) // Added a +10 allowance on heart rate..... Implemented to have margin before flagging
    ) {
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
      // Flagging patient as priority
      cur_frm.set_value("is_priority_patient", 1);

      
      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    } else if (
      heart_age >= 12 &&
      heart_age < 24 &&
      (heart_rate < 90 || heart_rate > 130) // Added a +10 allowance on heart rate..... Implemented to have margin before flagging
    ) {
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
      // Flagging patient as priority
      cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_heart_rate",
        heart_rate
      );
    } else if (
      heart_age >= 24 &&
      heart_age < 60 &&
      (heart_rate < 75 || heart_rate > 110) // Added a +10 allowance on heart rate..... Implemented to have margin before flagging
    ) {
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "orange"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "orange"
      );
      // Flagging patient as priority
      cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

     
    } else if (
      heart_age >= 60 &&
      heart_age < 132 &&
      (heart_rate < 68 || heart_rate > 100) // Added a +10 allowance on heart rate..... Implemented to have margin before flagging
    ) {
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
      // Flagging patient as priority
      cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    
    } else if (heart_age >= 132 && (heart_rate < 60 || heart_rate > 100)) {
      // Added a +10 allowance on heart rate..... Implemented to have margin before flagging
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
      
      // Flagging patient as priority
      cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")
    } else {
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "#28a745"
      );
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "#28a745"
      );

      // Emptying value of field if vital is not critical
      var empty = "";

      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_heart_rate",
        empty
      );

      cur_frm.set_value("is_priority_patient", 0);
      set_priority_off(frm);
    }
  }
};

// Calculating respiratory rate according to age.
let validate_respiratory_rate = function (patientage, respiratory_rate) {
  //   cur_frm.set_value("is_priority_patient", 1);

  var getYears = parseInt(cur_frm.doc.patient_age.trim().split(/\s+/)[0]) * 12;
  var getMonths = parseInt(cur_frm.doc.patient_age.trim().split(/\s+/)[2]);
  var getDays = parseInt(cur_frm.doc.patient_age.trim().split(/\s+/)[4]);

  // Assuming 28+ days to be a month
  if (getDays >= 28) {
    getMonths += 1;
  }

  // GETTING TOTAL NUMBER OF MONTHS
  var patientage = parseInt(getYears + getMonths);

  if(respiratory_rate < 12 || respiratory_rate > 60) {
    cur_frm.set_value("is_emergency_patient", 1);
    cur_frm.refresh_field("is_emergency_patient");

    $('input[data-fieldname="patient_encounter_respiratory_rate"]').css(
        "color",
        "red"
    );
    $('div[data-fieldname="patient_encounter_respiratory_rate"]').css(
        "color",
        "red"
    );

    // Updating number of emergency vitals
    let current_emergency_vitals = cur_frm.doc.number_of_emergency_vitals
    cur_frm.set_value("number_of_emergency_vitals", current_emergency_vitals + 1)
    cur_frm.refresh_field("number_of_emergency_vitals")

    frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_respiratory_rate",
        respiratory_rate
    );

  }
  else if (patientage <= 12 && (respiratory_rate < 30 || respiratory_rate > 60)) {
    $('input[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "red"
    );
    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);
      
      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")
  } else if (
    patientage >= 12 &&
    patientage <= 24 &&
    (respiratory_rate < 26 || respiratory_rate > 34)
  ) {
    $('input[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "red"
    );
    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);
      
    // Updating number of priority vitals
    let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    cur_frm.refresh_field("number_of_priority_vitals")


  } else if (
    patientage >= 25 &&
    patientage <= 60 &&
    (respiratory_rate < 20 || respiratory_rate > 26)
  ) {
    $('input[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "red"
    );
    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);
      
    // Updating number of priority vitals
    let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    cur_frm.refresh_field("number_of_priority_vitals")

  } else if (
    patientage > 61 &&
    patientage <= 96 &&
    (respiratory_rate < 20 || respiratory_rate > 24)
  ) {
    $('input[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);
      
      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")


  } else if (
    patientage > 96 &&
    (respiratory_rate < 12 || respiratory_rate > 20) // Added a +4 allowance on heart rate..... Implemented to have margin before flagging
  ) {
    $('input[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "red"
    );

    $('div[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);
      
      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

  } else {
    $('input[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "#28a745"
    );
    $('div[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "#28a745"
    );

    // Emptying value of field if vital is not critical
    var empty = "";

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_respiratory_rate",
      empty
    );

    cur_frm.set_value("is_priority_patient", 0);
  }
};

//Blood Pressure Systolic Validation #Editted by Robert to pick the correct patient age in months and use weight for new borns
let bp_systolic = function (frm, patient_age, bpsystolic) {
  //   cur_frm.set_value("is_priority_patient", 1);

  var getYears = parseInt(patient_age.trim().split(/\s+/)[0]) * 12;
  var getMonths = parseInt(patient_age.trim().split(/\s+/)[2]);
  var getDays = parseInt(patient_age.trim().split(/\s+/)[4]);

  // Assuming 28+ days to be a month
  if (getDays >= 28) {
    getMonths += 1;
  }

  // Gettting Patient Weight
  var patientWeight = parseInt(cur_frm.doc.weight_in_kilograms);

  // GETTING TOTAL NUMBER OF MONTHS
  var patient_age = parseInt(getYears + getMonths);

  // // console.log(patientWeight, "patientWeight");

  if(bpsystolic < 50 || bpsystolic > 130){

    cur_frm.set_value("is_emergency_patient", 1);
    cur_frm.refresh_field("is_emergency_patient");

    // Updating number of emergency vitals
    let current_emergency_vitals = cur_frm.doc.number_of_emergency_vitals
    cur_frm.set_value("number_of_emergency_vitals", current_emergency_vitals + 1)
    cur_frm.refresh_field("number_of_emergency_vitals")


  } else if (patientWeight < 1 && (bpsystolic < 50 || bpsystolic > 60)) {
    // Added a +5 allowance on hbpsystolic..... Implemented to have margin before flagging
    $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpsystolic",
      bpsystolic
    );
  } else if (patientWeight <= 3 && (bpsystolic < 60 || bpsystolic > 90)) {
    // Added a +5 allowance on hbpsystolic..... Implemented to have margin before flagging
    $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpsystolic",
      bpsystolic
    );
  } else if (
    patient_age > 1 &&
    patient_age <= 12 &&
    (bpsystolic < 83 || bpsystolic > 105)
  ) {
    $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpsystolic",
      bpsystolic
    );
  } else if (
    patient_age > 12 &&
    patient_age <= 24 &&
    (bpsystolic < 95 || bpsystolic > 110) // Added a +5 allowance on hbpsystolic..... Implemented to have margin before flagging
  ) {
    $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpsystolic",
      bpsystolic
    );
  } else if (
    patient_age > 24 &&
    patient_age <= 60 &&
    (bpsystolic < 96 || bpsystolic > 110) // Added a +5 allowance on hbpsystolic..... Implemented to have margin before flagging
  ) {
    $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpsystolic",
      bpsystolic
    );
  } else if (
    patient_age > 60 &&
    patient_age <= 108 &&
    (bpsystolic < 97 || bpsystolic > 112)
  ) {
    $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpsystolic",
      bpsystolic
    );
  } else if (
    patient_age > 108 &&
    patient_age <= 132 &&
    (bpsystolic < 97 || bpsystolic > 130) // Added a +5 allowance on hbpsystolic..... Implemented to have margin before flagging
  ) {
    $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpsystolic",
      bpsystolic
    );
  } else if (patient_age > 132 && (bpsystolic < 112 || bpsystolic > 130)) {
    // Added a +5 allowance on hbpsystolic..... Implemented to have margin before flagging
    $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpsystolic",
      bpsystolic
    );
  } else {
    $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "#28a745"
    );
    $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
      "color",
      "#28a745"
    );

    // Emptying value of field if vital is not critical
    var empty = "";

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpsystolic",
      empty
    );

    cur_frm.set_value("is_priority_patient", 0);
    //   set_priority_off(frm);
  }
};

//Blood Pressure Diastolic Validation
let bp_diastolic = function (frm, patient_age, bpdiastolic) {
  //   cur_frm.set_value("is_priority_patient", 1);

  var getYears = parseInt(patient_age.trim().split(/\s+/)[0]) * 12;
  var getMonths = parseInt(patient_age.trim().split(/\s+/)[2]);
  var getDays = parseInt(patient_age.trim().split(/\s+/)[4]);

  // Assuming 28+ days to be a month
  if (getDays >= 28) {
    getMonths += 1;
  }

  // Gettting Patient Weight
  var patientWeight = parseInt(cur_frm.doc.weight_in_kilograms);

  // GETTING TOTAL NUMBER OF MONTHS
  var patient_age = parseInt(getYears + getMonths);

  if(bpdiastolic < 35 || bpdiastolic > 90) {
    cur_frm.set_value("is_emergency_patient", 1);
    cur_frm.refresh_field("is_emergency_patient");

    // Updating number of emergency vitals
    let current_emergency_vitals = cur_frm.doc.number_of_emergency_vitals
    cur_frm.set_value("number_of_emergency_vitals", current_emergency_vitals + 1)
    cur_frm.refresh_field("number_of_emergency_vitals")

  } else if (patientWeight < 1 && (bpdiastolic < 35 || bpdiastolic > 45)) {
    $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpdiastolic",
      bpdiastolic
    );
  } else if (patientWeight <= 3 && (bpdiastolic < 40 || bpdiastolic > 45)) {
    // Added a +5 allowance on bpdiastolic..... Implemented to have margin before flagging
    $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpdiastolic",
      bpdiastolic
    );
  } else if (
    patient_age > 0 &&
    patient_age <= 12 &&
    (bpdiastolic < 40 || bpdiastolic > 65) // Added a +5 allowance on bpdiastolic..... Implemented to have margin before flagging
  ) {
    $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpdiastolic",
      bpdiastolic
    );
  } else if (
    patient_age > 12 &&
    patient_age <= 24 &&
    (bpdiastolic < 50 || bpdiastolic > 75)
  ) {
    $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpdiastolic",
      bpdiastolic
    );
  } else if (
    patient_age > 24 &&
    patient_age <= 60 &&
    (bpdiastolic < 55 || bpdiastolic > 75)
  ) {
    $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpdiastolic",
      bpdiastolic
    );
  } else if (
    patient_age > 60 &&
    patient_age <= 108 &&
    (bpdiastolic < 55 || bpdiastolic > 80)
  ) {
    $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpdiastolic",
      bpdiastolic
    );
  } else if (
    patient_age > 108 &&
    patient_age <= 144 &&
    (bpdiastolic < 70 || bpdiastolic > 85) // Added a +5 allowance on bpdiastolic..... Implemented to have margin before flagging
  ) {
    $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpdiastolic",
      bpdiastolic
    );
  } else if (patient_age > 144 && (bpdiastolic < 70 || bpdiastolic > 90)) {
    $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );
    $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "red"
    );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpdiastolic",
      bpdiastolic
    );
  } else {
    $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "#28a745"
    );
    $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
      "color",
      "#28a745"
    );

    // Emptying value of field if vital is not critical
    var empty = "";

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpdiastolic",
      empty
    );

    cur_frm.set_value("is_priority_patient", 0);
  }
};

//
// function set_bpsd(frm, bpsystolic, bpdiastolic) {
//   var bpsd = bpsystolic + "/" + bpdiastolic + " mmHg";
//   //   cur_frm.set_value("patient_encounter_blood_pressure", bpsd);
// }

// START OF MULTIDISCIPLINARY REVIEW SCRIPTS

// frappe.ui.form.on("Patient Encounter Vital Signs", {
//   form_render: function (frm, cdt, cdn) {
//     let item = locals[cdt][cdn];
//     let review_identifier = Math.round(+new Date() / 1000);

//     let patient = frm.doc.patient;
//     let patient_encounter = frm.doc.encounter_number;

//     frappe.call({
//       method:
//         "gch_custom.gch_custom.page.multidisciplinary.multidisciplinary.multidisciplinary_tables",
//       args: {
//         review_identifier: review_identifier,
//         user: frappe.session.user,
//         patient: patient,
//         encounter: patient_encounter,
//       },
//       callback: function (r) {
//         // // console.log(r);
//         item.review_identifier = r.message;
//         frm.refresh_field("vital_signs_table");
//       },
//     });
//   },
// });

// frappe.ui.form.on("Patient Encounter History Details", {
//   form_render: function (frm, cdt, cdn) {
//     let item = locals[cdt][cdn];
//     let review_identifier = Math.round(+new Date() / 1000);

//     let patient = frm.doc.patient;
//     let patient_encounter = frm.doc.encounter_number;

//     frappe.call({
//       method:
//         "gch_custom.gch_custom.page.multidisciplinary.multidisciplinary.multidisciplinary_tables",
//       args: {
//         review_identifier: review_identifier,
//         user: frappe.session.user,
//         patient: patient,
//         encounter: patient_encounter,
//       },
//       callback: function (r) {
//         // // console.log(r);
//         item.review_identifier = r.message;
//         frm.refresh_field("patient_history");
//       },
//     });
//   },
// });

// frappe.ui.form.on("Patient Encounter Physical Examination Details", {
//   form_render: function (frm, cdt, cdn) {
//     let item = locals[cdt][cdn];
//     let review_identifier = Math.round(+new Date() / 1000);

//     let patient = frm.doc.patient;
//     let patient_encounter = frm.doc.encounter_number;

//     frappe.call({
//       method:
//         "gch_custom.gch_custom.page.multidisciplinary.multidisciplinary.multidisciplinary_tables",
//       args: {
//         review_identifier: review_identifier,
//         user: frappe.session.user,
//         patient: patient,
//         encounter: patient_encounter,
//       },
//       callback: function (r) {
//         item.review_identifier = r.message;
//         frm.refresh_field("patient_physical_examination");
//       },
//     });
//   },
// });

// frappe.ui.form.on("Codification Table", {
//   // form_render: function (frm, cdt, cdn) {
//   //   let item = locals[cdt][cdn];
//   //   let review_identifier = Math.round(+new Date() / 1000);
//   //   let patient = frm.doc.patient;
//   //   let patient_encounter = frm.doc.encounter_number;
//   //   frappe.call({
//   //     method:
//   //       "gch_custom.gch_custom.page.multidisciplinary.multidisciplinary.multidisciplinary_tables",
//   //     args: {
//   //       review_identifier: review_identifier,
//   //       user: frappe.session.user,
//   //       patient: patient,
//   //       encounter: patient_encounter,
//   //     },
//   //     callback: function (r) {
//   //       item.review_identifier = r.message;
//   //       frm.refresh_field("diagnosis_table");
//   //     },
//   //   });
//   // },
// });

// frappe.ui.form.on("Patient Encounter Plan of Action", {
//   form_render: function (frm, cdt, cdn) {
//     let item = locals[cdt][cdn];
//     let review_identifier = Math.round(+new Date() / 1000);

//     let patient = frm.doc.patient;
//     let patient_encounter = frm.doc.encounter_number;

//     frappe.call({
//       method:
//         "gch_custom.gch_custom.page.multidisciplinary.multidisciplinary.multidisciplinary_tables",
//       args: {
//         review_identifier: review_identifier,
//         user: frappe.session.user,
//         patient: patient,
//         encounter: patient_encounter,
//       },
//       callback: function (r) {
//         item.review_identifier = r.message;
//         frm.refresh_field("patient_plan_of_action_notes");
//       },
//     });
//   },
// });

// END OF MULTIDISCIPLINARY REVIEW SCRIPTS

frappe.ui.form.on("Patient Encounter Vital Signs", {
  // form_render: function (frm, cdt, cdn) {
  //   let row = locals[cdt][cdn];
  //   let temp = row.patient_encounter_temperature;
  //   let heart_rate = row.patient_encounter_heart_rate;

  //   (cur_frm.fields_dict["vital_signs_table"].grid.get_field(
  //     "patient_encounter_temperature"
  //   ).get_query = function (doc, cdt, cdn) {
  //     var child = locals[cdt][cdn];
  //   }),
  //     cur_frm.fields_dict["vital_signs_table"].$wrapper
  //       .find(".grid-body .rows")
  //       .find(".grid-row")
  //       .each(function (i, item) {
  //         let d =
  //           locals[cur_frm.fields_dict["vital_signs_table"].grid.doctype][
  //           $(item).attr("data-name")
  //           ];

  //         const mytemp = d["patient_encounter_temperature"];

  //         if (mytemp < 35 || mytemp > 38) {
  //           $(item)
  //             .find(".grid-static-col")
  //             .css({ "background-color": "transparent" });
  //         } else {
  //           $(item)
  //             .find(".grid-static-col")
  //             .css({ "background-color": "transparent" });
  //         }

  //         if (mytemp > 38) {
  //           // cur_frm.set_value("is_priority_patient", 1);
  //         }
  //       });
  // },

  patient_encounter_temperature: function (frm, cdt, cdn) {
    check_vitals_temperature();
    // let row = locals[cdt][cdn];
    // let temp = row.patient_encounter_temperature;

    // cur_frm.fields_dict["vital_signs_table"].$wrapper
    //   .find(".grid-body .rows")
    //   .find(".grid-row")
    //   .each(function (i, item) {
    //     let d =
    //       locals[cur_frm.fields_dict["vital_signs_table"].grid.doctype][
    //       $(item).attr("data-name")
    //       ];

    //     const mytemp = d["patient_encounter_temperature"];

    //     if (mytemp < 35 || mytemp > 38) {
    //       $(item)
    //         .find(".grid-static-col")
    //         .css({ "background-color": "transparent" });
    //     } else {
    //       $(item)
    //         .find(".grid-static-col")
    //         .css({ "background-color": "transparent" });
    //     }

    //     if (mytemp > 38) {
    //       //   cur_frm.set_value("is_priority_patient", 1);
    //     }
    //   });
  },

  patient_encounter_heart_rate: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let heart_rate = row.patient_encounter_heart_rate;
    const heart_rate_sleeping = row.patient_encounter_heart_rate_sleeping;

    const hrpatientdob = "";
    const hrvitals_age = 0;

    if (frm.doc.patient) {
      frappe.db.get_value("Patient", { name: frm.doc.patient }, "dob", (r) => {
        const hrpatientdob = r.dob;
        var hrvitals_age = calculate_age(hrpatientdob);

        if (row.patient_encounter_heart_rate <= 0) {
          msgprint("Please enter a valid Heart Rate");
          frappe.validated = false;
        } else {
          if (hrvitals_age)
            check_heartrate(frm, hrvitals_age, heart_rate, heart_rate_sleeping);
        }
      });
    } else {
      msgprint("Patient is required ");
      cur_frm.set_value(row.patient_encounter_heart_rate, "");
      cur_frm.refresh_field("patient_encounter_heart_rate");
    }
  },

  patient_encounter_heart_rate_sleeping: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let heart_rate = row.patient_encounter_heart_rate;
    const heart_rate_sleeping = row.patient_encounter_heart_rate_sleeping;

    const hrpatientdob = "";
    const hrvitals_age = 0;

    if (frm.doc.patient) {
      frappe.db.get_value("Patient", { name: frm.doc.patient }, "dob", (r) => {
        const hrpatientdob = r.dob;
        var hrvitals_age = calculate_age(hrpatientdob);

        if (row.patient_encounter_heart_rate <= 0) {
          msgprint("Please enter a valid Heart Rate");
          frappe.validated = false;
        } else {
          if (hrvitals_age)
            check_heartrate(frm, hrvitals_age, heart_rate, heart_rate_sleeping);
        }
      });
    } else {
      msgprint("Patient is required ");
      cur_frm.set_value(row.patient_encounter_heart_rate_sleeping, "");
      cur_frm.refresh_field("patient_encounter_heart_rate_sleeping");
    }
  },

  patient_encounter_respiratory_rate: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let respiratory_rate = row.patient_encounter_respiratory_rate;

    const rrpatientdob = "";
    const rrvitals_age = 0;

    if (frm.doc.patient) {
      frappe.db.get_value("Patient", { name: frm.doc.patient }, "dob", (r) => {
        const rrpatientdob = r.dob;
        var rrvitals_age = calculate_age(rrpatientdob);

        if (row.patient_encounter_respiratory_rate <= 0) {
          msgprint("Please enter a valid Respiratory Rate");
          frappe.validated = false;
        } else {
          if (rrvitals_age)
            validate_respiratory_rate(rrvitals_age, respiratory_rate);
        }
      });
    } else {
      msgprint("Patient is required ");
      cur_frm.set_value(row.patient_encounter_respiratory_rate, "");
      cur_frm.refresh_field("patient_encounter_respiratory_rate");
    }
  },

  patient_encounter_percutaneous_oxygen: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let oxygen_level = row.patient_encounter_percutaneous_oxygen;

    if (oxygen_level < 94) {
        cur_frm.set_value("is_emergency_patient", 1);
        cur_frm.refresh_field("is_emergency_patient");
    }

    if (oxygen_level > 100) {
      msgprint("Invalid Percutaneous Oxygen Saturation Value");
      validated = false;
    }

    if (oxygen_level <= 94) {
      //   document.querySelectorAll("[data-fieldname='patient_encounter_percutaneous_oxygen']" )[0].style.color = "red";
      $('input[data-fieldname="patient_encounter_percutaneous_oxygen"]').css(
        "color",
        "red"
      );
      $('div[data-fieldname="patient_encounter_percutaneous_oxygen"]').css(
        "color",
        "red"
      );
      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_oxygen_saturation",
        oxygen_level
      );
      cur_frm.set_value("is_emergency_patient", 1);
      document.querySelectorAll(
        "[data-fieldname='is_emergency_patient']"
      )[0].style.color = "red";
    } else if (oxygen_level > 100) {
        $('input[data-fieldname="patient_encounter_percutaneous_oxygen"]').css(
            "color",
            "red"
          );
          $('div[data-fieldname="patient_encounter_percutaneous_oxygen"]').css(
            "color",
            "red"
          );
          frappe.model.set_value(
            cur_frm.doctype,
            cur_frm.docname,
            "critical_vital_oxygen_saturation",
            oxygen_level
          );
          cur_frm.set_value("is_emergency_patient", 1);
          document.querySelectorAll(
            "[data-fieldname='is_emergency_patient']"
          )[0].style.color = "red";

    } else {
      $('input[data-fieldname="patient_encounter_percutaneous_oxygen"]').css(
        "color",
        "#28a745"
      );
      $('div[data-fieldname="patient_encounter_percutaneous_oxygen"]').css(
        "color",
        "#28a745"
      );

      // Emptying value of field if vital is not critical
      var empty = "";

      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_oxygen_saturation",
        empty
      );

      set_priority_off(frm);
    }
  },

  patient_encounter_bp_systolic: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let bp_systolics = row.patient_encounter_bp_systolic;
    let bp_diastolics = row.patient_encounter_bp_diastolic;
    let blood_pressure = row.patient_encounter_blood_pressure;

    const bp_patientdob = "";
    const sbp_age = 0;

    if (frm.doc.patient) {
      frappe.db.get_value("Patient", { name: frm.doc.patient }, "dob", (r) => {
        const bp_patientdob = r.dob;
        var sbp_age = calculate_age(bp_patientdob);

        if (row.patient_encounter_bp_systolic <= 0) {
          msgprint("Please enter a valid BP Systoic Value ");
          frappe.validated = false;
        } else {
          if (sbp_age) bp_systolic(frm, sbp_age, bp_systolics);
        }
      });
    } else {
      msgprint("Patient is required ");
      cur_frm.set_value(row.patient_encounter_bp_systolic, "");
      cur_frm.refresh_field("patient_encounter_bp_systolic");
    }

    if (bp_systolics && bp_diastolics) {
      // var bpsd = bp_systolics + "/" + bp_diastolics + " mmHg";

      var bpsd2 = (bp_systolics + bp_diastolics)/2

      row.patient_encounter_blood_pressure = bpsd2;
      cur_frm.refresh_field("vital_signs_table");
    }

    bp_systolic(sbp_age, bp_systolics);
  },

  patient_encounter_bp_diastolic: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let bpsystolic = row.patient_encounter_bp_systolic;
    let bpdiastolic = row.patient_encounter_bp_diastolic;
    let blood_pressure = row.patient_encounter_blood_pressure;

    const dbp_patientdob = "";
    const dbp_age = 0;

    if (frm.doc.patient) {
      frappe.db.get_value("Patient", { name: frm.doc.patient }, "dob", (r) => {
        const dbp_patientdob = r.dob;
        var dbp_age = calculate_age(dbp_patientdob);

        if (row.patient_encounter_bp_diastolic <= 0) {
          msgprint("Please enter a valid BP Diastoic Value ");
          frappe.validated = false;
        } else {
          if (dbp_age) bp_diastolic(frm, dbp_age, bpdiastolic);
        }
      });
    } else {
      msgprint("Patient is required ");
      cur_frm.set_value(row.patient_encounter_bp_diastolic, "");
      cur_frm.refresh_field("patient_encounter_bp_diastolic");
    }

    if (bpsystolic && bpdiastolic) {
      //   set_bpsd(frm, bpsystolic, bpdiastolic);
      // var bpsd = bpsystolic + "/" + bpdiastolic + " mmHg";
      // cur_frm.set_value(blood_pressure, bpsd);
      // frappe.model.set_value(frm.doctype, frm.docname, row.patient_encounter_blood_pressure, bpsd);

      var bpsd2 = (bpsystolic + bpdiastolic)/2

      row.patient_encounter_blood_pressure = bpsd2;
      cur_frm.refresh_field("vital_signs_table");
    }

    bp_diastolic(frm, dbp_age, bpdiastolic);
  },

  diagnosis_table: (frm) => {
    if (frm.doc.diagnosis_table.length > 0) {
      // frm.set_df_property("gch_standard_treatment_guideline_mapping", "read_only", true);
    }
  },
});

frappe.ui.form.on("Codification Table", {
  // form_render: function (frm, cdt, cdn) {

  //     if (frappe.user_roles.includes("GCH-Doctor")) {
  //     }
  // },
  refresh: (frm) => {
    frappe.require(
      "/assets/gch_custom/js/patient_encounter/child_tables/codification_table.js",
      () => {
        handle_codification_table(frm);
      }
    );

    frappe.require(
      "/assets/gch_custom/js/patient_encounter/walk_in_encounter.js",
      () => {
        handle_walk_in(frm);
      }
    );
  },

  medical_code: (frm, cdt, cdn) => {
    // Flagging COMMUNICABLE medical codes
    // cur_frm.fields_dict["diagnosis_table"].$wrapper
    //   .find(".grid-body .rows")
    //   .find(".grid-row")
    //   .each(function (i, item) {
    //     let d =
    //       locals[cur_frm.fields_dict["diagnosis_table"].grid.doctype][
    //         $(item).attr("data-name")
    //       ];
    //     if (d["is_communicable"] == 1) {
    //       $(item)
    //         .find(".grid-static-col")
    //         .css({ "background-color": "yellow" });
    //     }
    //   });

    let codes = frm.doc.diagnosis_table.map((row) => row.code);
    // // console.log("fetching for codes again");
    frm.clear_table("gch_standard_treatment_guideline_mapping");

    // // console.log(codes);

    frappe.call({
      type: "POST",
      url: `${window.location.origin}/api/method/gch_custom.services.query_guidelines`,
      args: {
        codes: {
          codes: codes,
        },
      },
      callback: function (res) {
        let { template_guidelines } = res.message;
        // frm.clear_table("gch_standard_treatment_guideline_mapping")

        template_guidelines.forEach((guideline) => {
          // // console.log(guideline);
          let child = {
            generic_drug: guideline.generic_drug,
            generic_drug_name: guideline.generic_name,
            medical_code: guideline.medical_code,
            standard_treatment: guideline.name,
            code: guideline.code,
            description: guideline.description,
            formula: guideline.preparation,
            treatment_option: guideline.preparation,
          };
          frm.add_child("gch_standard_treatment_guideline_mapping", child);
        });
        frm.set_df_property(
          "gch_standard_treatment_guideline_mapping",
          "read_only",
          true
        );
        frm.refresh_field("gch_standard_treatment_guideline_mapping");
      },
    });
  },

  diagnosis_table_add: (frm, cdt, cdn) => {
    // // console.log("Adding diagnosis");
    // frm.set_df_property("prescription_table", "hidden", false);
    frm.clear_table("gch_standard_treatment_guideline_mapping");

    let added_row = locals[cdt][cdn];
    let added_diagnosis_id = added_row.idx;
    // // console.log(added_row);
    // alert(added_diagnosis_id)

    if (frm.doc.diagnosis_table?.length > 0) {
      let codes = frm.doc.diagnosis_table.map((row) => row.code);
      // // console.log("fetching for codes again add");
      frm.clear_table("gch_standard_treatment_guideline_mapping");

      frappe.call({
        type: "POST",
        url: `${window.location.origin}/api/method/gch_custom.services.query_guidelines`,
        args: {
          codes: {
            codes: codes,
          },
        },
        callback: function (res) {
          let { template_guidelines } = res.message;
          frm.clear_table("gch_standard_treatment_guideline_mapping");

          template_guidelines.forEach((guideline) => {
            // // console.log(guideline);
            let child = {
              generic_drug: guideline.generic_drug,
              generic_drug_name: guideline.generic_name,
              medical_code: guideline.medical_code,
              standard_treatment: guideline.name,
              code: guideline.code,
              description: guideline.description,
              formula: guideline.preparation,
              treatment_option: guideline.preparation,
            };
            frm.add_child("gch_standard_treatment_guideline_mapping", child);
          });
          frm.set_df_property(
            "gch_standard_treatment_guideline_mapping",
            "read_only",
            true
          );
          frm.refresh_field("gch_standard_treatment_guideline_mapping");
        },
      });
      // frm.set_df_property("gch_standard_treatment_guideline_mapping", "read_only", true);

      frm.set_df_property("prescription_table", "read_only", false);
      frm.set_df_property("prescription_table", "hidden", false);
      // frm.refresh_field("gch_standard_treatment_guideline_mapping");
      frm.refresh_field("prescription_table");
    } else {
      frm.clear_table("gch_standard_treatment_guideline_mapping");

      frappe.call({
        type: "POST",
        url: `${window.location.origin}/api/method/gch_custom.services.query_guidelines`,
        args: {
          codes: {
            codes: codes,
          },
        },
        callback: function (res) {
          let { template_guidelines } = res.message;
          frm.clear_table("gch_standard_treatment_guideline_mapping");

          template_guidelines.forEach((guideline) => {
            // // console.log(guideline);
            let child = {
              generic_drug: guideline.generic_drug,
              generic_drug_name: guideline.generic_name,
              medical_code: guideline.medical_code,
              standard_treatment: guideline.name,
              code: guideline.code,
              description: guideline.description,
              formula: guideline.preparation,
              treatment_option: guideline.preparation,
            };
            frm.add_child("gch_standard_treatment_guideline_mapping", child);
          });
          frm.set_df_property(
            "gch_standard_treatment_guideline_mapping",
            "read_only",
            true
          );
          frm.refresh_field("gch_standard_treatment_guideline_mapping");
        },
      });
      // frm.set_df_property("gch_standard_treatment_guideline_mapping", "read_only", true);

      frm.set_df_property("prescription_table", "read_only", true);
      // frm.refresh_field("gch_standard_treatment_guideline_mapping");
      frm.refresh_field("prescription_table");
    }
  },
  diagnosis_table_remove: (frm, cdt, cdn) => {
    // // console.log("Removing Diagnosis");
    // // console.log(frm.doc.diagnosis_table);
    frm.clear_table("gch_standard_treatment_guideline_mapping");

    if (frm.doc.diagnosis_table?.length > 0) {
      let codes = frm.doc.diagnosis_table.map((row) => row.code);
      // // console.log("fetching for codes again");
      frappe.call({
        type: "POST",
        url: `${window.location.origin}/api/method/gch_custom.services.query_guidelines`,
        args: {
          codes: {
            codes: codes,
          },
        },
        callback: function (res) {
          let { template_guidelines } = res.message;
          // frm.clear_table("gch_standard_treatment_guideline_mapping")

          template_guidelines.forEach((guideline) => {
            // // console.log(guideline);
            let child = {
              generic_drug: guideline.generic_drug,
              generic_drug_name: guideline.generic_name,
              medical_code: guideline.medical_code,
              standard_treatment: guideline.name,
              code: guideline.code,
              description: guideline.description,
              formula: guideline.preparation,
              treatment_option: guideline.preparation,
            };
            frm.add_child("gch_standard_treatment_guideline_mapping", child);
          });
          frm.set_df_property(
            "gch_standard_treatment_guideline_mapping",
            "read_only",
            true
          );
          frm.refresh_field("gch_standard_treatment_guideline_mapping");
        },
      });

      // frm.set_df_property("gch_standard_treatment_guideline_mapping", "read_only", true);

      frm.set_df_property("prescription_table", "read_only", false);
      frm.set_df_property("prescription_table", "hidden", false);
      // frm.refresh_field("gch_standard_treatment_guideline_mapping");
      frm.refresh_field("prescription_table");
    } else {
      frm.clear_table("gch_standard_treatment_guideline_mapping");
      frm.set_df_property(
        "gch_standard_treatment_guideline_mapping",
        "read_only",
        true
      );
      frm.set_df_property("prescription_table", "read_only", true);
      frm.refresh_field("gch_standard_treatment_guideline_mapping");
      frm.refresh_field("prescription_table");
    }
  },
});

frappe.ui.form.on("Doctor Prescription Table", {
  form_render: (frm, cdt, cdn) => {
    // // // console.log(frm);
    // // // console.log(cdt, cdn);
    // // // console.log(locals[cdt][cdn]);

    let row = locals[cdt][cdn];

    row.dob = frm.doc.patient_dob;
    row.age = frm.doc.patient_age;
    row.height_in_centimeters = frm.doc.height_in_centimeters;
    row.weight_in_kilograms = frm.doc.weight_in_kilograms;
    row.bmi = frm.doc.bmi;
    cur_frm.refresh_field("prescription_table");
    // // console.log(cur_frm, "Cuurent Form");

    let selected_generic_drug = row["generic_drug"];
    if (selected_generic_drug != undefined) {
      let drug = frappe.db
        .get_doc("Generic Drug Name", selected_generic_drug)
        .then((r) => {
          let mapped_routes = [];
          let mapped_preps = [];
          let mapped_uoms = [];

          r.drug_uom.map((el) => mapped_uoms.push(el.uom));
          r.route.map((el) => mapped_routes.push(`${el.drug_route} \n`));
          r.preparation.map((el) => mapped_preps.push(el.generic_drug_formula));

          frm.fields_dict.prescription_table.grid.update_docfield_property(
            "preparation_type",
            "options",
            [""].concat(mapped_preps)
          );
          frm.fields_dict.prescription_table.grid.update_docfield_property(
            "route",
            "options",
            [""].concat(mapped_routes)
          );
          frm.fields_dict.prescription_table.grid.update_docfield_property(
            "dose_uom",
            "options",
            [""].concat(mapped_uoms)
          );
          frm.fields_dict.prescription_table.grid.update_docfield_property(
            "prescription_frequency",
            "options",
            FREQUENCY_OPTIONS
          );
          frm.fields_dict.prescription_table.grid.update_docfield_property(
            "pharmacy_frequency",
            "options",
            [""].concat([...range(1, 100)])
            // FREQUENCY_OPTIONS
          );

          frm.refresh_field("prescription_table");
        });
    }

    if (frappe.user_roles.includes("GCH-Doctor")) {
      // // console.log("Doctor here on render");
      frm.set_df_property("available_quantity", "read_only", true);
      frm.set_df_property("available_quantity", "hidden", true);
      frm.set_df_property("billed_quantity", "hidden", true);
      frm.set_df_property("selling_quantity", "hidden", true);

      frm.set_df_property("pharmacy_dose", "hidden", true);
      frm.set_df_property("pharmacy_frequency", "hidden", true);
      frm.set_df_property("pharmacy_duration", "hidden", true);

      frm.set_df_property("discount", "hidden", true);
      frm.set_df_property("total", "hidden", true);

      frm.set_df_property("unit_price", "hidden", true);
      frm.set_df_property("total", "hidden", true);
      frm.set_df_property("brand", "read_only", true);
      frm.set_df_property("medication", "hidden", 1);
      frm.refresh_field("prescription_table");
    }
  },
  refresh: (frm, cdt, cdn) => {
    // // console.log("Here goes", cdt, cdn);
    cur_frm.toggle_display("refillable", frappe.user.has_role("GCH-Doctor"));
    if (frappe.user_roles.includes("GCH-Doctor")) {
      // // console.log("Doctor here on refresh");
      frm.set_df_property("available_quantity", "read_only", true);
      frm.set_df_property("available_quantity", "hidden", true);
      frm.set_df_property("billed_quantity", "hidden", true);
      frm.set_df_property("selling_quantity", "hidden", true);

      frm.set_df_property("pharmacy_dose", "hidden", true);
      frm.set_df_property("pharmacy_frequency", "hidden", true);
      frm.set_df_property("pharmacy_duration", "hidden", true);

      frm.set_df_property("discount", "hidden", true);
      frm.set_df_property("total", "hidden", true);

      frm.set_df_property("unit_price", "hidden", true);
      frm.set_df_property("total", "hidden", true);
      frm.set_df_property("brand", "read_only", true);
      frm.set_df_property("medication", "hidden", 1);
      frm.refresh_field("prescription_table");
    }

    // FLAGGING IF PATIENT IS ALLERGIC TO GENERIC NAME CHOSEN 
    // -------------------------------
    // if (row.generic_drug_name )
    for (var allergy in cur_frm.doc.drug_allergy) {
        console.log(cur_frm.doc.drug_allergy[allergy])
        if (cur_frm.doc.drug_allergy[allergy].drug_allergy.toLowerCase() == row.generic_drug_name.toLowerCase()) {
            console.log("True.....")
            $('[data-fieldname="generic_drug"]').find("label")[0].innerHTML = "Generic Drug (Patient is allergic to generic)"
            $('[data-fieldname="generic_drug"]').find("label")[0].style.color = "red";
            $('[data-fieldname="generic_drug"]').find("label")[0].style.fontSize = "13px";
            $('[data-fieldname="generic_drug"]').find("label")[0].style.fontWeight = "800";
            $('[data-fieldname="generic_drug"]').find("input")[0].style.color = "red";
            $('[data-fieldname="generic_drug"]').find("input")[0].style.backgroundColor = "#ff000014";

            $('[data-fieldname="prescription_table"]').find("label")[0].innerHTML = "Prescription Table (Patient is allergic to generic)";
            $('[data-fieldname="prescription_table"]').find("label")[0].style.color = "red";
            $('[data-fieldname="prescription_table"]').find("label")[0].style.fontSize = "13px";
            $('[data-fieldname="prescription_table"]').find("label")[0].style.fontWeight = "800";

            $('[data-fieldname="prescription_table"]')[0].style.borderColor = "red"
            $('[data-fieldname="prescription_table"]')[0].style.border = "2px solid";
            

        } else {
            console.log("False")
        }
    }
  },

  onload: (frm, cdt, cdn) => {
    // // console.log(`onload ${frm}`);

    // frappe.require(
    //   "/assets/gch_custom/js/patient_encounter/highlighted_menu.js",
    //   () => {
    //     handleHighlightedMenu(cur_frm);
    //   }
    // );

    if (frappe.user_roles.includes("GCH-Doctor")) {
      // // console.log("Doctor here");
      frm.set_df_property("available_quantity", "read_only", true);
      frm.set_df_property("available_quantity", "hidden", true);
      frm.set_df_property("billed_quantity", "hidden", true);
      frm.set_df_property("selling_quantity", "hidden", true);

      frm.set_df_property("pharmacy_dose", "hidden", true);
      frm.set_df_property("pharmacy_frequency", "hidden", true);
      frm.set_df_property("pharmacy_duration", "hidden", true);

      frm.set_df_property("discount", "hidden", true);
      frm.set_df_property("total", "hidden", true);

      frm.set_df_property("unit_price", "hidden", true);
      frm.set_df_property("total", "hidden", true);
      frm.set_df_property("brand", "read_only", true);
      frm.set_df_property("medication", "hidden", 1);
      frm.refresh_field("prescription_table");
    }
  },

  generic_drug: (frm, cdt, cdn) => {
    let row = locals[cdt][cdn];
    let selected_generic_drug = row["generic_drug"];
    let frequency_options = [];
    let drug = frappe.db
      .get_doc("Generic Drug Name", selected_generic_drug)
      .then((r) => {
        let mapped_routes = [];
        let mapped_preps = [];
        let mapped_uoms = [];

        r.drug_uom.map((el) => mapped_uoms.push(el.uom));
        r.route.map((el) => mapped_routes.push(`${el.drug_route} \n`));
        r.preparation.map((el) => mapped_preps.push(el.generic_drug_formula));

        frm.fields_dict.prescription_table.grid.update_docfield_property(
          "preparation_type",
          "options",
          [""].concat(mapped_preps)
        );
        frm.fields_dict.prescription_table.grid.update_docfield_property(
          "route",
          "options",
          [""].concat(mapped_routes)
        );
        frm.fields_dict.prescription_table.grid.update_docfield_property(
          "dose_uom",
          "options",
          [""].concat(mapped_uoms)
        );
        frm.fields_dict.prescription_table.grid.update_docfield_property(
          "prescription_frequency",
          "options",
          // [""].concat([...range(1, 100)])
          FREQUENCY_OPTIONS
        );
        frm.fields_dict.prescription_table.grid.update_docfield_property(
          "pharmacy_frequency",
          "options",
          [""].concat([...range(1, 100)])
        );

        frm.refresh_field("prescription_table");
      });

    // FLAGGING IF PATIENT IS ALLERGIC TO GENERIC NAME CHOSEN 
    // -------------------------------
    // if (row.generic_drug_name )
    for (var allergy in cur_frm.doc.drug_allergy) {
        console.log(cur_frm.doc.drug_allergy[allergy])
        if (cur_frm.doc.drug_allergy[allergy].drug_allergy.toLowerCase() == row.generic_drug_name.toLowerCase()) {
            console.log("True.....")
            $('[data-fieldname="generic_drug"]').find("label")[0].innerHTML = "Generic Drug (Patient is allergic to generic)"
            $('[data-fieldname="generic_drug"]').find("label")[0].style.color = "red";
            $('[data-fieldname="generic_drug"]').find("label")[0].style.fontSize = "13px";
            $('[data-fieldname="generic_drug"]').find("label")[0].style.fontWeight = "800";
            $('[data-fieldname="generic_drug"]').find("input")[0].style.color = "red";
            $('[data-fieldname="generic_drug"]').find("input")[0].style.backgroundColor = "#ff000014";
            

        } else {
            console.log("False")
        }
    }
    // console.log(cur_frm.doc.drug_allergy)

  },
  medication: async (frm, cdt, cdn) => {
    let row = locals[cdt][cdn];
    let selected_medication = row["medication"];
    // // console.log(selected_medication);
    let item_data = await frappe.db.get_doc("Item", selected_medication);
    let item_price_data = await frappe.db.get_doc("Item Price", null, {
      item_code: selected_medication,
    });
    // // console.log("Item Data", item_data);
    // // console.log("Item Price Data", item_price_data);
    row.unit_of_measure = item_data.stock_uom;
    row.discount = item_data.max_discount;
    row.available_quantity = item_data.opening_stock;
    row.unit_price = item_price_data.price_list_rate;
    let total = row.unit_price * row.selling_quantity;
    row.total = total;
    // let item = frappe.db.get_doc("Item", selected_medication).then((r) => {
    //   // // console.log(r)
    //   row.unit_of_measure = r.stock_uom;
    //   row.discount = r.max_discount;
    //   row.available_quantity = r.opening_stock;
    //   frm.refresh_field("prescription_table");
    // })
    // let item_price = frappe.db.get_doc("Item Price",null, {item_code:selected_medication}).then((r) => {
    //   // // console.log(r)
    //   row.unit_price = r.price_list_rate;
    //   frm.refresh_field("prescription_table");
    // })
    // // console.log("Refreshing table");
    frm.refresh_field("prescription_table");
  },

  
});

frappe.ui.form.on("Lab Prescription", {
  lab_test_prescription(frm) {
    console.log("Tested labs");
  }
})

frappe.ui.form.on("Kranium Physical Exams Notes", {
  refresh(frm) {
    // // console.log("Cooking with fire");
  },
  onload: (frm) => {
    // // console.log("cooking with gas");
  },
});


frappe.ui.form.on("Triage Drug Administered", {
  medication: async function (frm,cdt,cdn) {
    var child = locals[cdt][cdn];
    console.log(child.medication);
    await frappe.call({
      method: "gch_custom.services.get_item_generic",
      args:{
        "item_code": child.medication
      },
      callback: (res) => {
        if(res.message){
          console.log(res.message);
          child.generic_drug = res.message;
        }
      }
    })
    frm.refresh_field("triage_medication");    
  },
  administered: function (frm,cdt,cdn) {
    var child = locals[cdt][cdn];
    console.log(child.administered);
    if(child.administered == "Yes"){
      child.administered_at = frappe.datetime.now_datetime();
      child.administered_by = frappe.session.user;
    }
    else {
      child.administered_at = "";
      child.administered_by = "";
    }
    frm.refresh_field("triage_medication");
  }


})