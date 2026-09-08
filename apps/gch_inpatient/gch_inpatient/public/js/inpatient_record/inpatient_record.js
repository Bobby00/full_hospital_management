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

const generate_random_unique_code = (length) => {
  let code = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return code;
};

const view_results_url = (accession_number, uhid, username,results_key) =>{
  let url = `http://192.168.1.221:90/viewer/${uhid}/${accession_number}/${username}/${results_key}`;
  window.open(url, "_blank");
}

const initiate_discharge = (frm) => {
  console.log("discharge initiated");
  const discharge_p = new frappe.ui.Dialog({
    title: "Inpatient Discharge",
    fields: [
      {
        label: 'Discharge Date',
        fieldname: 'discharge_date',
        fieldtype: 'Datetime',
        // validate against previous dates
        reqd: 1,
        default: frappe.datetime.get_today(),
      },
    //   {
    //     label: "Follow-up Date",
    //     fieldname: "follow_up_date",
    //     fieldtype: "Date",
        
    //   },
    //   {
    //     label: "Discharge Instructions",
    //     fieldname: "discharge_instructions",
    //     fieldtype: "Small Text",
    //   },
      {
        label: "Discharge Note",
        fieldname: "discharge_note",
        fieldtype: "Text",
        reqd: 1,
      }
    ],
    primary_action_label: "Initiate Discharge",
    primary_action: function (values) {
      if (!values.discharge_date) {
        frappe.throw("Discharge Date is required");
      }
      // if (!values.follow_up_date) {
      //   frappe.throw("Follow-up Date is required");
      // }

      let discharge_ordered_datetime = values.discharge_date
      let discharging_officer = frappe.session.user;
      let encounter = cur_frm.doc.name;
    //   let discharge_instructions = values.discharge_instructions;
    //   let follow_up_date = values.follow_up_date;
      let discharge_note = values.discharge_note;

      frappe.call({
        method: "gch_inpatient.services.initiate_discharge",
        args: {
          discharge_ordered_datetime: discharge_ordered_datetime,
          discharging_officer: discharging_officer,
          encounter: encounter,
        //   discharge_instructions: discharge_instructions,
        //   follow_up_date: follow_up_date,
          discharge_note: discharge_note
        },
        callback: (res) => {
          if(res.message){
            msgprint("Patient Discharge initiated")
          }

          

        }
      })


      discharge_p.hide();
    }
  })

  discharge_p.show();
}

// const show_discharge_summary = (frm) => {
//     console.log("discharge initiated");
//     const discharge_p = new frappe.ui.Dialog({
//         title: "Inpatient Discharge",
//         fields: [
//         {
//             label: 'Discharge Date',
//             fieldname: 'discharge_date',
//             fieldtype: 'Datetime',
//             // validate against previous dates
//             reqd: 1,
//             default: frappe.datetime.get_today(),
//         },
//         {
//             label: "Follow-up Date",
//             fieldname: "follow_up_date",
//             fieldtype: "Date",
            
//         },
//         {
//             label: "Discharge Instructions",
//             fieldname: "discharge_instructions",
//             fieldtype: "Small Text",
//         },
//         {
//             label: "Discharge Note",
//             fieldname: "discharge_note",
//             fieldtype: "Text",
//             reqd: 1,
//         }
//         ],
//         primary_action_label: "Initiate Discharge",
//         primary_action: function (values) {
//         if (!values.discharge_date) {
//             frappe.throw("Discharge Date is required");
//         }
//         if (!values.follow_up_date) {
//             frappe.throw("Follow-up Date is required");
//         }

//         let discharge_ordered_datetime = values.discharge_date
//         let discharging_officer = frappe.session.user;
//         let encounter = cur_frm.doc.name;
//         let discharge_instructions = values.discharge_instructions;
//         let follow_up_date = values.follow_up_date;
//         let discharge_note = values.discharge_note;

//         frappe.call({
//             method: "gch_inpatient.services.initiate_discharge",
//             args: {
//             discharge_ordered_datetime: discharge_ordered_datetime,
//             discharging_officer: discharging_officer,
//             encounter: encounter,
//             discharge_instructions: discharge_instructions,
//             follow_up_date: follow_up_date,
//             discharge_note: discharge_note
//             },
//             callback: (res) => {
//             if(res.message){
//                 msgprint("Patient Discharge initiated")
//             }
//             }
//         })


//         discharge_p.hide();
//         }
//     })

//     discharge_p.show();
// }

const remove_dispensed_meds = (frm) => {
  let presc = frm.doc.inpatient_prescription_table;
  let i = presc.length;
  console.log(i);
  // if(i > 0) {
  //   while (i--) {
  //     if (presc[i].sent_to_pharmacy == 1) {
  //       frm.get_field("inpatient_prescription_table").grid.grid_rows[i].doc.read_only=1;
  //     }
  //   }
  //   frm.get_field("inpatient_prescription_table").grid.refresh();
  // }
}


// Assign patient to bed function
const assign_to_bed = (id) => {
  console.log(id);
  // Run call to assign patient to bed
  let patient = cur_frm.doc.patient;
  let bed_number = document.getElementById(`bed_number_row-${id}`).innerHTML;
  let room_number = document.getElementById(`ward_room_row-${id}`).innerHTML;
  let bed_code = document.getElementById(`bed_code_row-${id}`).innerHTML;
  let room_type = document.getElementById(`room_category_row-${id}`).innerHTML;

  console.log(
    patient,
    "patient",
    bed_number,
    "bed number",
    room_number,
    "room number",
    bed_code,
    "bedcode",
    room_type,
    "room type",
    "CHECK HERERERERERERERERERERERERERER"
  );

  // return

  frappe.call({
    method: "gch_custom.services.assign_bed",
    args: {
      patient: patient,
      bed: bed_code,
    },
    callback: (res) => {
      console.log(res);

      if (res.message == true) {
        frappe.show_alert(
          {
            message: __("Patient Assigned to bed Successfully"),
            indicator: "green",
          },
          5
        );
      }

    //   cur_frm.save();
    //   cur_frm.refresh_fields();
    //   cur_frm.reload_doc();
    },
    freeze: true,
    freeze_message: __(`Assigning Patient to ${bed_code}`)
  });

  // Save ward, room and bed records to inpatient record
  let room_no = room_number.split(".")[1];
  frappe.call({
    method:
      "gch_inpatient.overrides.inpatient_record.update_ward_room_bed_info",
    args: {
      inpatient_record: cur_frm.doc.name,
      room_no: room_number,
      bed_number: bed_number,
      bed_code: bed_code,
      room_type: room_type,
      ward_station: cur_frm.doc.ward_station,
    },
    callback: (res) => {
      console.log(res);
    },
  });

  location.reload();

//   // Add room charge to invoice after assigning patient to bed
//   frappe.call({
//     method: "gch_inpatient.overrides.inpatient_record.add_ward_charges_to_invoice",
//     args: {
//         inpatient_record: cur_frm.doc.name,
//     },
//     callback: (res) => {
//         console.log(res);
//     }
//   })



};

const transfer_patient = (id) => {
  console.log(id);
  // Run call to assign patient to bed
  let patient = cur_frm.doc.patient;
  let bed_number = document.getElementById(`bed_number_row-${id}`).innerHTML;
  let room_number = document.getElementById(`ward_room_row-${id}`).innerHTML;
  let bed_code = document.getElementById(`bed_code_row-${id}`).innerHTML;
  let room_type = document.getElementById(`room_category_row-${id}`).innerHTML;

  console.log(patient, bed_code);

  console.log($('[data-fieldname="ward_name"]').find("input").val());

  // Updating ward name on IP Record
  cur_frm.doc.ward_station = $('[data-fieldname="ward_name"]')
    .find("input")
    .val();
  cur_frm.set_value(
    "ward_station",
    $('[data-fieldname="ward_name"]').find("input").val()
  );

  frappe.call({
    method: "gch_custom.services.transfer_patient",
    args: {
      patient: patient,
      bed: bed_code,
    },
    callback: (res) => {
      console.log(res.message);

      if (res.message == true) {
        frappe.show_alert(
          {
            message: __(`Patient Transferred to ${bed_code} Successfully`),
            indicator: "green",
          },
          5
        );
      }

    //   cur_frm.save();
    //   cur_frm.refresh_fields();
    //   cur_frm.reload_doc();
    //   location.reload();
    },
    freeze: true,
    freeze_message: __(`Transferring Patient to ${bed_code}`)
  });

  // Save ward, room and bed records to inpatient record
  frappe.call({
    method:
      "gch_inpatient.overrides.inpatient_record.update_ward_room_bed_info",
    args: {
      inpatient_record: cur_frm.doc.name,
      room_no: room_number,
      bed_number: bed_number,
      bed_code: bed_code,
      room_type: room_type,
      ward_station: cur_frm.doc.ward_station,
    },
    callback: (res) => {
      console.log(res);
    },
  });

  // ADD WARD ROOM CHARGES WHEN PATIENT IS TRANSFERED TO A DIFFERENT WARD
  frappe.call({
    method: "gch_inpatient.services.inpatient_billing.add_ward_charges_to_invoice",
    args: {
        "sales_invoice": cur_frm.doc.sales_invoice,
        "ward": cur_frm.doc.ward_station,
        "bed_number": bed_number,
        "room_no": room_number,
        "patient": cur_frm.doc.patient
    },
    callback: (res) => {
        console.log(res)
    }
  })


  location.reload()

};

window.assign_to_bed = assign_to_bed;
window.transfer_patient = transfer_patient;

frappe.ui.form.on("Inpatient Record", {
  setup: (frm) => {
    $('.prev-doc, .next-doc').hide();

    // Hiding encounter side nav, but can be reopened
    $(".layout-side-section").css("display", "none");

    // Hiding Investigations Section on inpatient record
    cur_frm.set_df_property("lab_test_prescription", "hidden", 1);
    cur_frm.refresh_field("lab_test_prescription");

    // Hiding default admit before page fully loads
    if (document.querySelector('[data-label="Admit"]')) {
      document.querySelector('[data-label="Admit"]').style.display = "none";
    }

    // Filtering Diagnosis to ICD 10
    frm.set_query("medical_code", "diagnosis_table", function () {
        return {
          query: "gch_custom.services.rest.group_medical_query",
          filters: [
            ["medical_code_standard", "in", ["ICD-10-Diagnosis"]],
          ],
        };
    });

    // Changing Transfer Patient button color
    $('[data-fieldname="transfer_patient"]')
      .find("button")
      .css({ background: "#078ED6" });
    $('[data-fieldname="transfer_patient"]').css({ color: "#FFFFFF" });

    // Checking if patient is admitted to add custom ward status on top of page
    if (cur_frm.doc.status != "Admission Scheduled") {
      const doc_status_pill = $(".page-head").find(".indicator-pill");
      const ward_status_pill = $(
        `<span style="margin-left: 20px;" class='indicator-pill whitespace-nowrap blue'><span><b>Current Ward</b>: ${
          cur_frm.doc.ward_station ? cur_frm.doc.ward_station : "No Ward"
        }</span></span>`
      ).insertAfter(doc_status_pill);
      const room_bed_pill = $(
        `<span style="margin-left: 20px;" class='indicator-pill whitespace-nowrap green'><span><b>Room</b>: ${cur_frm.doc.room_no}</span> <span style="margin-left: 10px;"><b>Bed</b>: ${cur_frm.doc.bed_number}</span></span>`
      ).insertAfter(ward_status_pill);
      room_bed_pill;
    }

    frappe.require(
      "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
      () => {
        handleHighlightedMenu(cur_frm);
      }
    );
  },


  refresh: (frm) => {
    // Hiding unnecessary connections
    $('[data-doctype="Vital Signs"]').hide();
    $('[data-doctype="Sample Collection"]').hide();

    const doc_status_pill =  $(".page-head").find(".indicator-pill");

    $('.prev-doc, .next-doc').hide();

    // Check if vitals and anthropomtry exist and attempt to pull from latest outpatient record
    if (cur_frm.doc.vital_signs_table && cur_frm.doc.vital_signs_table.length < 1) {
        let latest_patient_encounter
        
        frappe.call({
            method: "gch_inpatient.overrides.inpatient_record.fetch_vitals_from_op",
            args: {
                "patient": cur_frm.doc.patient
            },
            callback: (res) => {
                console.log(res)

                if (res.message && res.message.vital_signs_table && res.message.vital_signs_table.length > 0) {
                    // Get the last record from the vital_signs_table array
                    let lastRecord = res.message.vital_signs_table[res.message.vital_signs_table.length - 1];
                    
                    // Add the last record to the child table using add_child
                    let child_doc = cur_frm.add_child('vital_signs_table'); // Create a new row in the child table
                    
                    // Loop through each field of the lastRecord and assign it to the child row
                    // Map fields from lastRecord to the new child row
                    child_doc.patient_encounter_bp_diastolic = lastRecord.patient_encounter_bp_diastolic;
                    child_doc.patient_encounter_bp_systolic = lastRecord.patient_encounter_bp_systolic;
                    child_doc.patient_encounter_heart_rate = lastRecord.patient_encounter_heart_rate;
                    child_doc.patient_encounter_heart_rate_sleeping = lastRecord.patient_encounter_heart_rate_sleeping;
                    child_doc.patient_encounter_percutaneous_oxygen = lastRecord.patient_encounter_percutaneous_oxygen;
                    child_doc.patient_encounter_respiratory_rate = lastRecord.patient_encounter_respiratory_rate;
                    child_doc.patient_encounter_temperature = lastRecord.patient_encounter_temperature;

                    // Set other metadata fields if necessary (e.g., creation, modified, etc.)
                    child_doc.creation = lastRecord.creation;
                    child_doc.recorded_at = lastRecord.recorded_at;
                    child_doc.modified = lastRecord.modified;
                    child_doc.modified_by = lastRecord.modified_by;
                    child_doc.owner = lastRecord.owner;
                    
                    // Refresh the child table to reflect the new data
                    cur_frm.refresh_field('vital_signs_table');
                }
            }
        })

    }

    if (cur_frm.doc.anthropometry_details && cur_frm.doc.anthropometry_details.length < 1) {
        frappe.call({
            method: "gch_inpatient.overrides.inpatient_record.fetch_anthropometry_from_op",
            args: {
                "patient": cur_frm.doc.patient
            },
            callback: (res) => {
                console.log(res)

                // Check if the response contains anthropometry details
                if (res.message && res.message.anthropometry_details && res.message.anthropometry_details.length > 0) {
                    // Get the last record from the anthropometry_details array
                    let lastRecord = res.message.anthropometry_details[res.message.anthropometry_details.length - 1];
                    
                    // Add the last record to the child table using add_child
                    let child_doc = cur_frm.add_child('anthropometry_details'); // Create a new row in the child table
                    
                    // Map fields from lastRecord to the new child row
                    child_doc.bmi = lastRecord.bmi;
                    child_doc.bmi_for_age_percentile = lastRecord.bmi_for_age_percentile;
                    child_doc.bsa = lastRecord.bsa;
                    child_doc.head_circumference_in_centimeters = lastRecord.head_circumference_in_centimeters;
                    child_doc.height_for_age_percentile = lastRecord.height_for_age_percentile;
                    child_doc.height_in_centimeters = lastRecord.height_in_centimeters;
                    child_doc.muac = lastRecord.muac;
                    child_doc.weight_for_age_percentile = lastRecord.weight_for_age_percentile;
                    child_doc.weight_in_kilograms = lastRecord.weight_in_kilograms;

                    // Set other metadata fields if necessary (e.g., creation, modified, etc.)
                    child_doc.creation = lastRecord.creation;
                    child_doc.date_taken = lastRecord.date_taken;
                    child_doc.modified = lastRecord.modified;
                    child_doc.modified_by = lastRecord.modified_by;
                    child_doc.owner = lastRecord.owner;
                    
                    // Refresh the child table to reflect the new data
                    cur_frm.refresh_field('anthropometry_details');
                }

            }
        })
    }

    // Handle insurance
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

    // Set branch if branch is blank
    if (frm.doc.branch != "Muthaiga") {
      frm.set_value("branch", "Muthaiga");
    }

    window.view_results_url = view_results_url;
    
    // checkif admission type is surgery and display theatre template else hide it
    if(frm.doc.admission_type == "Surgery"){
      frm.set_df_property("theatre_overview", "hidden", 0);
    }else{
      frm.set_df_property("theatre_overview", "hidden", 1);
    }

    // Schedule surgery
    frappe.require(
      "/assets/gch_inpatient/js/inpatient_record/inpatient_theatre.js",
      () => {
        booking_patients_to_theatre(frm);
      }
    );


    // Pharmacy 
    frappe.require(
      "/assets/gch_inpatient/js/inpatient_record/pharmacy.js",
      () => {
        handle_pharmacy(frm);
      }
    );

    // Adding icons to each section dropdown
    let section_dropdows = $(".card-section.visible-section").find(".section-head")

    for(let i in section_dropdows) {
        let dropdown_section = section_dropdows[i].innerText

        // if(dropdown_section.includes("Patient")) {
        //     section_dropdows[i].innerHTML = `<i class="fa-solid fa-user" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        // }
        // else if (dropdown_section.includes("Ward")) {
        //     section_dropdows[i].innerHTML = `<i class="fa-solid fa-bed-pulse" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        // }
        // else if (dropdown_section.includes("Admission Order")) {
        //     section_dropdows[i].innerHTML = `<i class="fa-solid fa-hospital-user" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        // }
        // else if (dropdown_section.includes("Vital")) {
        //     section_dropdows[i].innerHTML = `<i class="fa-solid fa-heart-pulse" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        // }
        // else if (dropdown_section.includes("Assessment Tools")) {
        //     section_dropdows[i].innerHTML = `<i class="fa-solid fa-file-waveform" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        // }
        // else if (dropdown_section.includes("Completed Nursing Tools")) {
        //     section_dropdows[i].innerHTML = `<i class="fa-solid fa-user-nurse" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        // }
        // else if (dropdown_section.includes("Medical Diagnosis")) {
        //     section_dropdows[i].innerHTML = `<i class="fa-solid fa-file-medical" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        // }
        // else if(dropdown_section.includes("Medications")) {
        //     section_dropdows[i].innerHTML = `<i class="fa-solid fa-prescription" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        // }
        // else if(dropdown_section.includes("Anthropometry")) {
        //     section_dropdows[i].innerHTML = `<i class="fa-solid fa-weight-scale" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        // }
        // else if(dropdown_section.includes("Payment Details")) {
        //     section_dropdows[i].innerHTML = `<i class="fa-solid fa-file-invoice" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        // }
        // else if(dropdown_section.includes("Radiology")) {
        //     section_dropdows[i].innerHTML = `<i class="fa-solid fa-radiation" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        // }
        // else if(dropdown_section.includes("Laboratory")) {
        //     section_dropdows[i].innerHTML = `<i class="fa-solid fa-microscope" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        // }

        if(dropdown_section == " Patient Details ") {
            section_dropdows[i].innerHTML = `<i class="fa-solid fa-user" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        }
        else if (dropdown_section == "Ward Information") {
            section_dropdows[i].innerHTML = `<i class="fa-solid fa-bed-pulse" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        }
        else if (dropdown_section == "Admission Order Details") {
            section_dropdows[i].innerHTML = `<i class="fa-solid fa-hospital-user" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        }
        else if (dropdown_section == "Vital Signs") {
            section_dropdows[i].innerHTML = `<i class="fa-solid fa-heart-pulse" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        }
        else if (dropdown_section == "Assessment Tools") {
            section_dropdows[i].innerHTML = `<i class="fa-solid fa-file-waveform" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        }
        else if (dropdown_section == "Completed Nursing Tools") {
            section_dropdows[i].innerHTML = `<i class="fa-solid fa-user-nurse" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        }
        else if (dropdown_section == "Medical Diagnosis") {
            section_dropdows[i].innerHTML = `<i class="fa-solid fa-file-medical" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        }
        else if(dropdown_section == "Medications") {
            section_dropdows[i].innerHTML = `<i class="fa-solid fa-prescription" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        }
        else if(dropdown_section == "Anthropometry") {
            section_dropdows[i].innerHTML = `<i class="fa-solid fa-weight-scale" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        }
        else if(dropdown_section == "Payment Details") {
            section_dropdows[i].innerHTML = `<i class="fa-solid fa-file-invoice" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        }
        else if(dropdown_section == "Radiology") {
            section_dropdows[i].innerHTML = `<i class="fa-solid fa-radiation" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        }
        else if(dropdown_section == "Laboratory") {
            section_dropdows[i].innerHTML = `<i class="fa-solid fa-microscope" style="margin-right: 8px;"></i>` + section_dropdows[i].innerHTML
        }           
 
    }
 
    cur_frm.fields_dict['vital_signs_table'].grid.toggle_reqd("patient_encounter_heart_rate", 1)
    cur_frm.fields_dict['vital_signs_table'].grid.toggle_reqd("patient_encounter_bp_systolic", 1)
    cur_frm.fields_dict['vital_signs_table'].grid.toggle_reqd("patient_encounter_bp_diastolic", 1)
    cur_frm.fields_dict['vital_signs_table'].grid.toggle_reqd("patient_encounter_respiratory_rate", 1)
    cur_frm.fields_dict['vital_signs_table'].grid.toggle_reqd("patient_encounter_percutaneous_oxygen", 1)

    // hide dispensed meds
    remove_dispensed_meds(frm)


    // Disable Deletion of rows on vitals table
    $('[data-fieldname="vital_signs_table"]').find('.grid-remove-rows').hide();
    $('[data-fieldname="vital_signs_table"]').find('.grid-remove-all-rows').hide()
    $('[data-fieldname="vital_signs_table"]').find('.grid-delete-row').hide();


    // Auto Assigning the Primary nurse if unavailable
    if(!cur_frm.doc.primary_nurse && frappe.user.has_role("GCH-Nurse")) {
        // Fetch Healthcare Practitioner from the user ID
        console.log("Attempting to fill primary nurse")

        let nurse_email = frappe.session.user

        frappe.call({
            method: "gch_inpatient.overrides.inpatient_record.fetch_primary_nurse_from_practitioner",
            args: {
                user_id : nurse_email
            },
            callback: (res) => {

                if (res.message[0].name) {
                    cur_frm.set_value("primary_nurse", res.message[0].name)
                    cur_frm.refresh_field("primary_nurse")

                    frappe.show_alert({message: `Primary Nurse Auto Assigned from current user`, indicator: 'green'});

                }

            }
        })
        
    }


    if(cur_frm.doc.ward_of_preference && cur_frm.doc.lodger_form) {
        cur_frm.doc.is_lodging = 1
        cur_frm.refresh_field("is_lodging")
    }
 
    $('div[data-fieldname="vital_signs_graph"]').css("width", "60%")

    // Fetching Completed Nursing Tools
    frappe.call({
      method:
        "gch_inpatient.overrides.inpatient_record.fetch_completed_nursing_tools",
      args: {
        inpatient_record: cur_frm.doc.name,
      },
      callback: (res) => {
        console.log(res.message, "Nursing Tool Data");

        let completed_tools = res.message;

        let item_array = [];

        completed_tools.forEach((tool) => {
          item_array.push(
            `<tr>
                                <td style = "white-space: nowrap;">` +
              tool.tool_name +
              `</td>
                                    <td style = "white-space: nowrap;">` +
              tool.modified.split(" ")[0] +
              `</td>
                                    <td style = "white-space: nowrap;">` +
              tool.modified.split(" ")[1].split(".")[0] +
              `</td>
                                    <td style = "white-space: nowrap;">` +
              tool.owner +
              `</td>
                                    <td style = "white-space: nowrap;">` +
              tool.nursing_tool_link +
              `</td>
                                    
                                </tr>`
          );
        });

        $(".completed-tools").html(item_array);
      },
    });

    // Hiding encounter side nav, but can be reopened
    $(".layout-side-section").css("display", "none");

    frappe.require(
      "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
      () => {
        handleHighlightedMenu(cur_frm);
      }
    );

    frappe.require(
      "/assets/gch_inpatient/js/inpatient_record/inpatient_create_invoice.js",
      () => {
        handle_inpatient_create_invoice(cur_frm);
      }
    );

    frm.set_df_property("medication_section", "collapsible", 0);

    // Hiding Investigations Section on inpatient record
    cur_frm.set_df_property("lab_test_prescription", "hidden", 1);
    cur_frm.refresh_field("lab_test_prescription");

    // Custom button for going to Multidisciplinary view

    if (document.querySelector('[data-label="Admit"]')) {
      document.querySelector('[data-label="Admit"]').style.display = "none";
    }

    // if(frm.doc.diagnosis_table.length == 0 || frm.doc.anthropometry_details.length == 0 ) {
    //   cur_frm.set_df_property("medication_section", "hidden", 1);
    //   cur_frm.refresh_field("medication_section");
    // }

    if (frm.doc.inpatient_prescription_table.length) {
      //     console.log("LOOOAAAAADDED!!!");
      frm.add_custom_button(__("Treatment Sheet"), function () {
        const url = `/app/treatment-sheet/${frm.doc.name}`;
        window.location.href = url;
      });

      // frm.add_custom_button(__("Click here"), function () {
      //   frappe.call({
      //     method: "gch_inpatient.services.test_stuff",
      //     args: {
      //       "inpatient_record": frm.doc.name,
      //     }
      //   })
      // });
    }


    if (
      !frm.doc.__islocal &&
      (frm.doc.status == "Admission Scheduled" || frm.doc.status == "Admitted" || frm.doc.status == "Discharge Scheduled")
    ) {
      frm.enable_save();
    } else {
      frm.disable_save();
    }

    if (!frm.doc.__islocal && frm.doc.status == "Admission Scheduled") {
      frm.add_custom_button(__("Admit Patient"), function () {
        admit_patient_dialog2(frm);
      });
    }

    // Hiding default admit before page fully loads
    if (document.querySelector('[data-label="Admit"]')) {
      document.querySelector('[data-label="Admit"]').style.display = "none";
    }

    // Changing Transfer Patient button color
    $('[data-fieldname="transfer_patient"]')
      .find("button")
      .css({ background: "#078ED6" });
    $('[data-fieldname="transfer_patient"]').css({ color: "#FFFFFF" });

    // Removing readonly for Expected discharge date
    cur_frm.set_df_property("expected_discharge", "read_only", 0);

    if (cur_frm.doc.name) {
      get_encounter_assessment(frm);
      console.log("Fetched!!!!!!!!!!!!!!!!!!");
    }

    // Building list of Nursing tools
    if (cur_frm.doc.status == "Admitted" || cur_frm.doc.status == "Discharge Scheduled") {
      
      let last_vitals_array = cur_frm.doc.vital_signs_table[cur_frm.doc.vital_signs_table.length - 1]
      let last_anthro_array = cur_frm.doc.anthropometry_details[cur_frm.doc.anthropometry_details.length -1]

      console.log(last_anthro_array, "Anthro arrray")

      // Checking if patient ward is PCCU to add PCCU overview button (The button opens or creates a new PCCU record)
      if(cur_frm.doc.ward_station) {
        console.log("Checking Ward Station.....")

        frappe.call({
            method: "gch_inpatient.overrides.inpatient_record.check_if_ward_is_pccu",
            args: {
                "ward": cur_frm.doc.ward_station,
            },
            callback: (res) => {
                console.log(res.message, "Heerreeee....")
                if (res.message == true) {
                    // show PCCU button
                    cur_frm.add_custom_button(__("PCCU Overview"), function () {
                        console.log("Here.....")
                        // Check if PCCU Overview exists
                        frappe.db.get_value('PCCU Overview', {"inpatient_record":cur_frm.doc.name}, ['name']).then((res)=> {
                            console.log(res, "PCCU Overview name")

                            if(res.message.name) {
                                window.location.href = "/app/pccu-overview/"+ res.message.name
                            } else {

                                frappe.route_options = {
                                    patient: frm.doc.patient,
                                    inpatient_record: frm.doc.name
                                }
                                frappe.new_doc("PCCU Overview")

                            }

                        })

                    },
                    __("PCCU")
                );

                } else {
                    console.log("Not PCCU ward")
                }
                
            }
        })
      }

      // Handsoff Tool
      frm.add_custom_button(
        __("NURSING HANDSOFF TOOL"),
        function () {
          // Check for existing handsoff tool
          frappe.db.get_value('Nursing Handsoff Tool', {"inpatient_record":cur_frm.doc.name}, ['name', 'docstatus']).then((res) => {
            console.log(res.message)    
                if (res.message.name && res.message.docstatus == 0) {

                    window.location.href = "/app/nursing-handsoff-tool/" + res.message.name

                } else {

                    frappe.route_options = {
                        patient: frm.doc.patient,
                        inpatient_record: frm.doc.name,
                    };
                    frappe.new_doc("Nursing Handsoff Tool");

                }
            });
        },
        __("NURSING TOOLS")
      );

      // OPD FALLS RISK ASSESSMENT
      frm.add_custom_button(
        __("OPD FALLS RISK ASSESSMENT TOOL"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            assessment_template: "OutPatient Falls Risk Assessment",

            assessment_branch: cur_frm.doc.branch,
            weight: last_anthro_array.weight_in_kilograms,
            height: last_anthro_array.height_in_centimeters,
            temperature: last_vitals_array.patient_encounter_temperature,
            bmi: last_anthro_array.bmi,
            bsa: last_anthro_array.bsa
            // assessment_branch: frm.doc.branch,
          };
          frappe.new_doc("Patient Assessment");
        },
        __("NURSING TOOLS")
      );
     
      // input output chart
      frm.add_custom_button(
        __("PATIENT NUTRITION OVERVIEW"),
        function () {
          // Check if a nutrition overview

            frappe.db.get_value('Patient Nutrition Overview', {"inpatient_record":cur_frm.doc.name}, ["name"]).then( (res) => {
                console.log(res, "  Nutrition Overview Name.............")

                if(res.message.name ) {
                    
                    window.location.href = "/app/patient-nutrition-overview/"+ res.message.name

                } else {

                    frappe.route_options = {
                        patient: frm.doc.patient,
                        inpatient_record: frm.doc.name,
                        anthropometry_details: frm.doc.anthropometry_details
            
                      
                      };
                      frappe.new_doc("Patient Nutrition Overview");

                }

              })
              


        },
        __("Examinations")
      );

      // Matron Notes
      frm.add_custom_button(
        __("NIGHT SUPERINTENDENT / MATRON'S NOTES"),
        function () {
          // Check if a matron notes exist

            frappe.db.get_value('Matron Notes', {"inpatient_record":cur_frm.doc.name}, ["name"]).then( (res) => {
                console.log(res, "  MATRON'S NOTE Name.............")

                if(res.message.name ) {
                    
                    window.location.href = "/app/matron-notes/"+ res.message.name

                } else {

                    frappe.route_options = {
                        patient: frm.doc.patient,
                        inpatient_record: frm.doc.name
                      };
                      frappe.new_doc("Matron Notes");

                }

              })
              


        },
        __("Examinations")
      );

      // input output chart
      frm.add_custom_button(
        __("INPUT OUTPUT CHART"),
        function () {

        frappe.db.get_value('Nursing Input Output Chart', {"inpatient_record":cur_frm.doc.name}, ["name"]).then( (res) => {
            console.log(res, "  INPUT OUTPUT CHART Name.............")

            if(res.message.name ) {
                
                window.location.href = "/app/nursing-input-output-chart/"+ res.message.name

            } else {

                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.name,
        
                    // assessment_branch: frm.doc.branch,
                  };
                frappe.new_doc("Nursing Input Output Chart");

            }

            })

          
        },
        __("Examinations")
      );
      // input head to toe
      frm.add_custom_button(
        __("HEAD TO TOE ASSESSMENT"),
        function () {
          // Check for existing head to toe record
          frappe.db.get_value('Head to Toe Examination', {"inpatient_record":cur_frm.doc.name}, ["name"]).then((res) => {
                if (res.message.name) {
                    // Redirect to existing head to toe record
                    window.location.href = "/app/head-to-toe-examination/" + res.message.name;
                } else {
                    // Create new head to toe record

                    frappe.route_options = {
                        patient: frm.doc.patient,
                        inpatient_record: frm.doc.name,

                        // assessment_branch: frm.doc.branch,
                    };
                    frappe.new_doc("Head to Toe Examination");
                }
                });
        },
        __("Examinations")
      );

      // INPATIENT FALLS RISK ASSESSMENT
      frm.add_custom_button(
        __("INPATIENT FALLS RISK ASSESSMENT TOOL"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            assessment_template: "InPatient Falls Risk Assessment",
            assessment_branch: cur_frm.doc.branch,
            weight: last_anthro_array.weight_in_kilograms,
            height: last_anthro_array.height_in_centimeters,
            temperature: last_vitals_array.patient_encounter_temperature,
            bmi: last_anthro_array.bmi,
            bsa: last_anthro_array.bsa
          };
          frappe.new_doc("Patient Assessment");
        },
        __("NURSING TOOLS")
      );

      // FLACC Pain Management tool
      frm.add_custom_button(
        __("PAIN ASSESSMENT TOOL - FLACC"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            assessment_template: "Pain Assessment - FLACC",
            assessment_branch: cur_frm.doc.branch,
            weight: last_anthro_array.weight_in_kilograms,
            height: last_anthro_array.height_in_centimeters,
            temperature: last_vitals_array.patient_encounter_temperature,
            bmi: last_anthro_array.bmi,
            bsa: last_anthro_array.bsa
            // assessment_branch: frm.doc.branch,
          };
          frappe.new_doc("Patient Assessment");
        },
        __("NURSING TOOLS")
      );

      // NEONATAL PAIN ASSESSMENT
      frm.add_custom_button(
        __("PAIN ASSESSMENT TOOL - NEONATAL"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            assessment_template: "Pain Assessment - Neonatal",
            assessment_branch: cur_frm.doc.branch,
            weight: last_anthro_array.weight_in_kilograms,
            height: last_anthro_array.height_in_centimeters,
            temperature: last_vitals_array.patient_encounter_temperature,
            bmi: last_anthro_array.bmi,
            bsa: last_anthro_array.bsa
            // assessment_branch: frm.doc.branch,
          };
          frappe.new_doc("Patient Assessment");
        },
        __("NURSING TOOLS")
      );

      // WONG BAKER PAIN ASSESSMENT
      frm.add_custom_button(
        __("PAIN ASSESSMENT TOOL - WONG BAKER FACES"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            assessment_template: "Pain Assessment - Wong Baker Face",
            assessment_branch: cur_frm.doc.branch,
            weight: last_anthro_array.weight_in_kilograms,
            height: last_anthro_array.height_in_centimeters,
            temperature: last_vitals_array.patient_encounter_temperature,
            bmi: last_anthro_array.bmi,
            bsa: last_anthro_array.bsa
            // assessment_branch: frm.doc.branch,
          };
          frappe.new_doc("Patient Assessment");
        },
        __("NURSING TOOLS")
      );

      // Numeric scale pain assessment
      frm.add_custom_button(
        __("PAIN ASSESSMENT TOOL - NUMERIC SCALE"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            assessment_template: "Pain Assessment - Numeric Scale",
            assessment_branch: cur_frm.doc.branch,
            weight: last_anthro_array.weight_in_kilograms,
            height: last_anthro_array.height_in_centimeters,
            temperature: last_vitals_array.patient_encounter_temperature,
            bmi: last_anthro_array.bmi,
            bsa: last_anthro_array.bsa
            // assessment_branch: frm.doc.branch,
          };
          frappe.new_doc("Patient Assessment");
        },
        __("NURSING TOOLS")
      );

      // PEADEATRIC EARLY WARNING
      frm.add_custom_button(
        __("PAEDIATRIC EARLY WARNING SIGNS CHART"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            assessment_template: "Paedriatic Early Warning",
            assessment_branch: cur_frm.doc.branch,
            weight: last_anthro_array.weight_in_kilograms,
            height: last_anthro_array.height_in_centimeters,
            temperature: last_vitals_array.patient_encounter_temperature,
            bmi: last_anthro_array.bmi,
            bsa: last_anthro_array.bsa
            // assessment_branch: frm.doc.branch,
          };
          frappe.new_doc("Patient Assessment");
        },
        __("NURSING TOOLS")
      );

      // Cauti prevention checklist
      frm.add_custom_button(
        __("CAUTI PREVENTION CHECKLIST"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            checklist_template:
              "GCH-NCT-10898 : Urinary catheter care bundle (CAUTI)",
            // assessment_branch: frm.doc.branch,
          };
          frappe.new_doc("Nursing Checklist");
        },
        __("NURSING TOOLS")
      );

      // Central line insertion checklist
      frm.add_custom_button(
        __("CENTRAL LINE INSERTION CHECKLIST"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            wardroombed:
              frm.doc.ward_station +
              "/" +
              frm.doc.room_no +
              "/" +
              frm.doc.bed_number,
            consulting_doctor: frm.doc.primary_practitioner,

            // assessment_branch: frm.doc.branch,
          };
          frappe.new_doc("CENTRAL LINE INSERTION CHECKLIST");
        },
        __("NURSING TOOLS")
      );

      // Central Line maintanance bundle checklist
      frm.add_custom_button(
        __("CENTRAL LINE MAINTENANCE BUNDLE CHECKLIST"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            wardroombed:
              frm.doc.ward_station +
              "/" +
              frm.doc.room_no +
              "/" +
              frm.doc.bed_number,
            consulting_doctor: frm.doc.primary_practitioner,
            // assessment_branch: frm.doc.branch,
          };
          frappe.new_doc("Central Line Maintenance Bundle Checklist");
        },
        __("NURSING TOOLS")
      );

      // SSI prevenetion Checklist
      frm.add_custom_button(
        __("SSI PREVENTION CHECKLIST"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            wardroombed:
              frm.doc.ward_station +
              "/" +
              frm.doc.room_no +
              "/" +
              frm.doc.bed_number,
            consulting_doctor: frm.doc.primary_practitioner,
            // assessment_branch: frm.doc.branch,
          };
          frappe.new_doc("SSI PREVENTION CHECKLIST");
        },
        __("NURSING TOOLS")
      );

      // Ventilator bundle
      frm.add_custom_button(
        __("VENTILLATOR BUNDLE CHECKLIST"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            wardroombed:
              frm.doc.ward_station +
              "/" +
              frm.doc.room_no +
              "/" +
              frm.doc.bed_number,
            consulting_doctor: frm.doc.primary_practitioner,
          };
          frappe.new_doc("VENTILATOR BUNDLE CHECKLIST");
        },
        __("NURSING TOOLS")
      );

      // Pre-procedure and timeout checklist for thratre surgical procedures
      frm.add_custom_button(
        __(
          "PRE-PROCEDURE AND TIMEOUT CHECKLIST FOR OUT OF THEATRE SURGICAL PROCEDURES"
        ),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            wardroombed:
              frm.doc.ward_station +
              "/" +
              frm.doc.room_no +
              "/" +
              frm.doc.bed_number,
            consulting_doctor: frm.doc.primary_practitioner,
          };
          frappe.new_doc("Pre Procedure Checklist");
        },
        __("NURSING TOOLS")
      );

      // PERIPHERAL VENOUS CATHETER INSERTION CHECKLIST
      frm.add_custom_button(
        __("PERIPHERAL VENOUS CATHETER INSERTION CHECKLIST"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            wardroombed:
              frm.doc.ward_station +
              "/" +
              frm.doc.room_no +
              "/" +
              frm.doc.bed_number,
            consulting_doctor: frm.doc.primary_practitioner,
          };
          frappe.new_doc("PERIPHERAL VENOUS CATHETER INSERTION CHECKLIST");
        },
        __("NURSING TOOLS")
      );

      // PERIPHERAL VENOUS CATHETER CARE BUNDLE CHECKLIST
      frm.add_custom_button(
        __("PERIPHERAL VENOUS CATHETER CARE BUNDLE CHECKLIST"),
        function () {
          // CONFIRM ON EXISTANCE OF TEMPLATE BUNDLE DATA
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            wardroombed:
              frm.doc.ward_station +
              "/" +
              frm.doc.room_no +
              "/" +
              frm.doc.bed_number,
            consulting_doctor: frm.doc.primary_practitioner,
          };
          frappe.new_doc("PERIPHERAL VENOUS CATHETER CARE BUNDLE");
        },
        __("NURSING TOOLS")
      );

      // NUTRITION SCREENING
      frm.add_custom_button(
        __("NUTRITION SCREENING"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            is_inpatient: 1,
            wardroombed:
              frm.doc.ward_station +
              "/" +
              frm.doc.room_no +
              "/" +
              frm.doc.bed_number,
            consulting_doctor: frm.doc.primary_practitioner,

            // assessment_branch: frm.doc.branch,
          };
          frappe.new_doc("NUTRITION SCREENING TOOL");
        },
        __("NURSING TOOLS")
      );

      // Neurological observation chart
      frm.add_custom_button(
        __("NEUROLOGICAL OBSERVATION CHART"),
        function () {
          frappe.route_options = {
            patient: frm.doc.patient,
            inpatient_record: frm.doc.name,
            wardroombed:
              frm.doc.ward_station +
              "/" +
              frm.doc.room_no +
              "/" +
              frm.doc.bed_number,
            consulting_doctor: frm.doc.primary_practitioner,

            // assessment_branch: frm.doc.branch,
          };
          frappe.new_doc("NEUROLOGICAL OBSERVATION CHART");
        },
        __("NURSING TOOLS")
      );
    }


    if(frm.doc.status == "Admitted") {
      frm.add_custom_button(
        "Initiate Discharge",
        () => initiate_discharge(this),
    "Discharge Actions");
    }

    if(frm.doc.status == "Admitted" || frm.doc.status == 'Discharge Scheduled') {
        frm.add_custom_button(
            "Discharge Summary",
        () => {
            
            // Check for existing discharge summary before creating a new one          
            // frappe.db.get_("Inpatient Discharge Summary", {"inpatient_record": cur_frm.doc.name}, ['name']).then( (res) => {
            //     console.log(res, "DISCHARGE SUMMARY CHECK")
            // })
            frappe.call({
                method : "gch_inpatient.overrides.inpatient_record.check_existing_discharge_summary",
                async: false,
                args: {
                    inpatient_record: cur_frm.doc.name,
                },
                callback: (res) => {
                    console.log(res.message.length)
                    if (res.message.length > 0) {
                        // REDIRECT TO THE EXISTING DISCHARGE SUMMARY
                        console.log(res.message)
                        window.location.replace('/app/inpatient-discharge-summary/'+ res.message[0].name)

                    } else {
                        // CREATE A NEW DISCHARGE SUMMARY
                        frappe.route_options = {
                            patient: frm.doc.patient,
                            inpatient_record: frm.doc.name,
                            wardroombed:
                              frm.doc.ward_station +
                              "/" +
                              frm.doc.room_no +
                              "/"+
                              frm.doc.bed_number,
                            consulting_doctor: frm.doc.primary_practitioner,
                
                            // assessment_branch: frm.doc.branch,
                        };
                        frappe.new_doc("Inpatient Discharge Summary");
                    }
                }
            })

            


        },
        "Discharge Actions");
    }
    

    // frm.set_df_property("medication_section", "collapsible", 0);

    // Load graph script  for charts if not already loaded
    let temperatureChart = document.createElement("script")

    temperatureChart.setAttribute("src", "/assets/gch_inpatient/js/inpatient_record/vitals_charts.js")
    temperatureChart.async = false;
    document.body.appendChild(temperatureChart);
    
    let dateBundle = document.createElement("script")

    dateBundle.setAttribute("src", "https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js")
    dateBundle.async = false;
    document.body.appendChild(dateBundle);


    // frappe.require(
    //     "/assets/gch_inpatient/js/inpatient_record/vital_signs_graph.js",
    //     () => {
    //       handleVitalSignsGraph(cur_frm);
    //     }
    // );

    // Custom button for going to Multidisciplinary view

    if (document.querySelector('[data-label="Admit"]')) {
      document.querySelector('[data-label="Admit"]').style.display = "none";
    }

    if (frm.doc.inpatient_prescription_table.length) {
      //     console.log("LOOOAAAAADDED!!!");
      frm.add_custom_button(__("Treatment Sheet"), function () {
        const url = `/app/treatment-sheet/${frm.doc.name}`;
        window.location.href = url;
      });
    }

    

    if (!frm.doc.__islocal && frm.doc.status == "Admission Scheduled") {
      frm.add_custom_button(__("Admit Patient"), function () {
        admit_patient_dialog2(frm);
      });
    }

    // Hiding default admit before page fully loads
    if (document.querySelector('[data-label="Admit"]')) {
      document.querySelector('[data-label="Admit"]').style.display = "none";
    }

    // Changing Transfer Patient button color
    $('[data-fieldname="transfer_patient"]')
      .find("button")
      .css({ background: "#078ED6" });
    $('[data-fieldname="transfer_patient"]').css({ color: "#FFFFFF" });

    // Removing readonly for Expected discharge date
    cur_frm.set_df_property("expected_discharge", "read_only", 0);

    if (cur_frm.doc.name) {
      get_encounter_assessment(frm);
      console.log("Fetched!!!!!!!!!!!!!!!!!!");
    }
  
    // FILTERING LAB ITEMS ON LAB TABLE
    frm.set_query("lab_test_code", "lab_tests", function () {
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

    // FILTERING LAB ITEMS ON LAB TABLE
    frm.set_query("lab_test_code", "radiology_details", function () {
      return {
        filters: [
          [
            "lab_test_group",
            "in",
            [
              "Radiology",
              "CT SCAN",
            ],
          ],
        ],
      };
    });
  },

  before_save: (frm) => {
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

  view_results: (frm) => {
    let tests = frm.doc.radiology_details;
    if(tests.length > 0){
      let results = [];
      let ROWS = [];
      let current_user = frappe.session.user;
      let username = current_user.split("@")[0];
      let uhid = frm.doc.uhid;
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
                <td scope="col"><button class="btn btn-primary btn-sm" onclick="view_results_url('${accession_number},${uhid},'${username}',${results_key}')">View Results</button></td>
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
  
  send_to_pharmacy: async (frm) => {
    const stat_presc_number = generate_random_unique_code(12)
    const new_presc_number = generate_random_unique_code(12)
    const discharge_presc_number = generate_random_unique_code(12)
    const high_alert_presc_number = generate_random_unique_code(12)

    const prescribed_by = frappe.session.user;
    console.log("Clicked!");
    let presc_list = frm.doc.inpatient_prescription_table 
    for (let i = 0; i < presc_list.length; i++) {
      if(presc_list[i].sent_to_pharmacy == 0) {
        if(presc_list[i].indication != "Discharge" && presc_list[i].prescription_frequency != "Stat") {
          console.log("NEW and Repeat with no stat", new_presc_number);
          // Update prescription details
          await frappe.call({
            method: "gch_inpatient.services.update_prescription_details",
            args: {
              "prescription_number": new_presc_number,
              "prescribed_by": prescribed_by,
              "prescription_id": presc_list[i].name
            },
            callback: (res) => {
              if(res.message){
                console.log(res.message,"Updated!!!!!!!!!!!!!!!!!!")
              }
              else {
                frappe.throw(__("Error in updating prescription details"));
              }
            }
          })
          // frm.doc.inpatient_prescription_table[i].prescription_number = new_presc_number;
          frm.refresh_field('inpatient_prescription_table');
        }
        else if(presc_list[i].indication == "Discharge" && presc_list[i].prescription_frequency != "Stat") {
          await frappe.call({
            method: "gch_inpatient.services.update_prescription_details",
            args: {
              "prescription_number": discharge_presc_number,
              "prescribed_by": prescribed_by,
              "prescription_id": presc_list[i].name
            },
            callback: (res) => {
              if(res.message){
                console.log("Updated!!!!!!!!!!!!!!!!!!")
              }
              else {
                frappe.throw(__("Error in updating prescription details"));
              }
            }
          })
          frm.refresh_field('inpatient_prescription_table');

        }
        else if(presc_list[i].prescription_frequency == "Stat"){
          await frappe.call({
            method: "gch_inpatient.services.update_prescription_details",
            args: {
              "prescription_number": stat_presc_number,
              "prescribed_by": prescribed_by,
              "prescription_id": presc_list[i].name
            },
            callback: (res) => {
              if(res.message){
                console.log("Updated!!!!!!!!!!!!!!!!!!")
              }
              else {
                frappe.throw(__("Error in updating prescription details"));
              }
            }
          })
          frm.refresh_field('inpatient_prescription_table');
        }      
      }
    }
    msgprint("Prescription sent to Pharmacy");
    
  },

  show_vacancy: (frm) => {
    // describe dialog
    let d = new frappe.ui.Dialog({
      title: "Enter details",
      fields: [
        {
          label: "Ward Name",
          fieldname: "ward_name",
          fieldtype: "Link",
          options: "Nursing Ward",
          default: cur_frm.doc.ward_station,
          onchange: () => {
            // On field change check if not empty and fetch selected ward occupany
            // console.log(d.fields_dict.ward_name.value)
            if (d.fields_dict.ward_name.value) {
              frappe.call({
                method: "gch_custom.services.list_beds",
                async: false,
                args: {
                  ward: d.fields_dict.ward_name.value,
                },
                callback: (res) => {
                  let occupancy_info_doc = res.message[0];

                  let result = occupancy_info_doc.bed_details.reduce(function (
                    r,
                    a
                  ) {
                    r[a.ward_room] = r[a.ward_room] || [];
                    r[a.ward_room].push(a);
                    return r;
                  },
                  Object.create(null));

                  // console.log(result, "hERE 22......");

                  for (let room in result) {
                    // console.log("ROOM : ", result[room], result[room].length, ".........")
                    // Get patient
                    let patient = "";

                    // Generate action
                    let action = "";

                    for (let i = 0; i < result[room].length; i++) {
                      console.log(
                        result[room][i],
                        "========== bed information =========="
                      );
                    }
                  }

                  console.log(res.message);

                  // let occupancy_info_doc = res.message[0]

                  // BUILD WARD BED ROWS HTML FROM COUNT OF BEDS AND COTS

                  let WARD_BED_ROWS = "";

                  for (let i in occupancy_info_doc.bed_details) {
                    console.log(occupancy_info_doc.bed_details[i].ward_room);

                    // Get patient
                    let patient = "";

                    // Generate action
                    let action = "";

                    let booked_message = "";

                    let lodging_message = "";

                    if (occupancy_info_doc.bed_details[i].occupant) {
                      patient = occupancy_info_doc.bed_details[i].occupant.name;

                      let row_wrapper = "";

                      // Checking if patient is assigned, booked or lodging to change row wrapper
                      if (
                        occupancy_info_doc.bed_details[i].occupancy_status
                          .is_assigned
                      ) {
                        row_wrapper = "background: #2490ef30;";
                        // Assigning actions available
                      } else if (
                        occupancy_info_doc.bed_details[i].occupancy_status
                          .is_booking
                      ) {
                        row_wrapper = "background: #ef242430;";
                        // assigning actions available
                        booked_message =
                          "<span style='color: red'>BED BOOKED FOR</span> ";
                      } else if (
                        occupancy_info_doc.bed_details[i].occupancy_status
                          .is_lodging
                      ) {
                        row_wrapper = "background: #6d24ef30";
                        // Assigning actions available
                        lodging_message =
                          "<span style='color: purple;'> (LODGING) </span>";
                      }

                      if (patient == cur_frm.doc.patient) {
                        WARD_BED_ROWS += `
                                                <tr style="${row_wrapper}" id="ward_bed_row-${i}">
                                                    <td>
                                                        <span style="font-size: 12px; fomt-weight: 500;" class="text-sm">Room No: <strong><span id="ward_room_row-${i}">${
                          occupancy_info_doc.bed_details[i].ward_room
                        }</span></strong> </span>
                                                        <br>
                                                        <span style="font-size: 12px; fomt-weight: 500;" class="text-sm">Bed: <strong><span id="bed_number_row-${i}">${
                          occupancy_info_doc.bed_details[i].bed_number
                        }</span></strong> </span>
                                                        <span style="display: none;" id="bed_code_row-${i}">${
                          occupancy_info_doc.bed_details[i].name
                        }</span>
                                                        <br>
                                                        <span style="font-size: 11px; fomt-weight: 500;" class="text-sm">Bed Type: <strong><span id="room_category_row-${i}">${
                          occupancy_info_doc.bed_details[i].bed_type || ""
                        }</span></strong></span>
                                                    </td>
                                                    <td class="text-center"> 
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12 2.5a5.5 5.5 0 0 1 3.096 10.047 9.005 9.005 0 0 1 5.9 8.181.75.75 0 1 1-1.499.044 7.5 7.5 0 0 0-14.993 0 .75.75 0 0 1-1.5-.045 9.005 9.005 0 0 1 5.9-8.18A5.5 5.5 0 0 1 12 2.5ZM8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"></path></svg> 
                                                        <strong>${booked_message} <a href="/app/patient/${patient}">${patient}</a> ${lodging_message}</strong>
                                                    </td>
                                                    <td class="text-center"> 
                                                    ${occupancy_info_doc.bed_details[i].bed_days}
                                                    </td>
                                                    <td class="text-center"> ${
                                                      occupancy_info_doc
                                                        .bed_details[i]
                                                        .inpatient_record
                                                        .practitioner_name || ""
                                                    } </td>
                                                    <td class="text-center"> ${
                                                      occupancy_info_doc
                                                        .bed_details[i]
                                                        .inpatient_record
                                                        .billing_type
                                                    } </td>
                                                    <td class="text-center">
                                                        <a style="margin-right: 6px;" href="/app/treatment-sheet/${
                                                          occupancy_info_doc
                                                            .bed_details[i]
                                                            .inpatient_record
                                                            .name
                                                        }"><i title="Open Treatment Sheet" style="color: forestgreen;" class="fa-solid fa-file-prescription fa-2x"></i></a>
                                                        <a style="margin-right: 6px;" href="/app/multidisciplinary/${
                                                          occupancy_info_doc
                                                            .bed_details[i]
                                                            .inpatient_record
                                                            .multidisciplinary
                                                        }"><i title="Open Multidisciplinary" style="color: darkgoldenrod;" class="fa-solid fa-hospital-user fa-2x"></i></a>
                                                        <a href="/app/nursing-input-output-chart"><i title="Open Input Output Chart" style="color: orange;" class="fa-solid fa-droplet fa-2x"></i></a>

                                                    </td>
                                                    <td class="text-center">
                                                        <p>-</p>
                                                    </td>
                                                </tr>
                                                `;
                      } else {
                        WARD_BED_ROWS += `
                                                <tr style="${row_wrapper}" id="ward_bed_row-${i}">
                                                    <td>
                                                        <span style="font-size: 12px; fomt-weight: 500;" class="text-sm">Room No: <strong><span id="ward_room_row-${i}">${
                          occupancy_info_doc.bed_details[i].ward_room
                        }</span></strong> </span>
                                                        <br>
                                                        <span style="font-size: 12px; fomt-weight: 500;" class="text-sm">Bed: <strong><span id="bed_number_row-${i}">${
                          occupancy_info_doc.bed_details[i].bed_number
                        }</span></strong> </span>
                                                        <span style="display: none;" id="bed_code_row-${i}">${
                          occupancy_info_doc.bed_details[i].name
                        }</span>
                                                        <br>
                                                        <span style="font-size: 11px; fomt-weight: 500;" class="text-sm">Bed Type: <strong><span id="room_category_row-${i}">${
                          occupancy_info_doc.bed_details[i].room_category || ""
                        }</span></strong></span>
                                                    </td>
                                                    <td class="text-center"> 
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12 2.5a5.5 5.5 0 0 1 3.096 10.047 9.005 9.005 0 0 1 5.9 8.181.75.75 0 1 1-1.499.044 7.5 7.5 0 0 0-14.993 0 .75.75 0 0 1-1.5-.045 9.005 9.005 0 0 1 5.9-8.18A5.5 5.5 0 0 1 12 2.5ZM8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"></path></svg> 
                                                        <strong>${booked_message} <a href="/app/patient/${patient}">${patient}</a> ${lodging_message}</strong>
                                                    </td>
                                                    
                                                    <td class="text-center"> 
                                                        ${occupancy_info_doc.bed_details[i].bed_days}
                                                    </td>
                                                    <td class="text-center"> ${
                                                      occupancy_info_doc
                                                        .bed_details[i]
                                                        .inpatient_record
                                                        .practitioner_name || ""
                                                    } </td>
                                                    <td class="text-center"> ${
                                                      occupancy_info_doc
                                                        .bed_details[i]
                                                        .inpatient_record
                                                        .billing_type
                                                    } </td>
                                                    <td class="text-center">
                                                        <a style="margin-right: 6px;" href="/app/inpatient-record/${ occupancy_info_doc.bed_details[i].inpatient_record.name }"><i title="View Inpatient Encounter" style="color: deepskyblue;" class="fa-solid fa-id-card-clip fa-2x"></i></a>
                                                        <a style="margin-right: 6px;" href="/app/treatment-sheet/${
                                                          occupancy_info_doc
                                                            .bed_details[i]
                                                            .inpatient_record
                                                            .name
                                                        }"><i title="Open Treatment Sheet" style="color: forestgreen;" class="fa-solid fa-file-prescription fa-2x"></i></a>
                                                        <a style="margin-right: 6px;" href="/app/multidisciplinary/${
                                                          occupancy_info_doc
                                                            .bed_details[i]
                                                            .inpatient_record
                                                            .multidisciplinary
                                                        }"><i title="Open Multidisciplinary" style="color: darkgoldenrod;" class="fa-solid fa-hospital-user fa-2x"></i></a>
                                                        <a href="/app/nursing-input-output-chart"><i title="Open Input Output Chart" style="color: orange;" class="fa-solid fa-droplet fa-2x"></i></a>
                        

                                                        <a style="margin-right: 6px;" href="/app/patient-nutrition-overview/${ occupancy_info_doc.bed_details[i].nutrition_information.name }}"><i title="Nutrition Overview" style="color: rgb(255, 94, 0);" class="fa-solid fa-utensils fa-2x"></i></a>

                            
                                                    </td>
                                                    <td class="text-center">
                                                        <p>-</p>
                                                    </td>
                                                </tr>
                                                `;
                      }
                    } else {
                        let assign_or_locked_bed = ``

                        if (occupancy_info_doc.bed_details[i].is_locked == 1) {
                            assign_or_locked_bed = `<p style="font-size: 16px; font-weight: 700; color: firebrick;">BED LOCKED</p>`
                        } else {
                            assign_or_locked_bed = `<button style="font-size: 10px; background: mediumseagreen;" id=${i} onclick="transfer_patient(${i})" class="btn btn-primary btn-sm">Assign Here</button>`
                        }

                        WARD_BED_ROWS += `
                                                <tr id="ward_bed_row-${i}">
                                                    <td>
                                                        <span style="font-size: 12px; fomt-weight: 500;" class="text-sm">Room No: <strong><span id="ward_room_row-${i}">${
                            occupancy_info_doc.bed_details[i].ward_room
                        }</span></strong> </span>
                                                        <br>
                                                        <span style="font-size: 12px; fomt-weight: 500;" class="text-sm">Bed: <strong><span id="bed_number_row-${i}">${
                            occupancy_info_doc.bed_details[i].bed_number
                        }</span></strong> </span>
                                                        <span style="display: none;" id="bed_code_row-${i}">${
                            occupancy_info_doc.bed_details[i].name
                        }</span>
                                                        <br>
                                                        <span style="font-size: 11px; fomt-weight: 500;" class="text-sm">Bed Type: <strong><span id="room_category_row-${i}">${
                            occupancy_info_doc.bed_details[i].bed_type || ""
                        }</span></strong></span>
                                                    </td>
                                                    <td class="text-center">-</td>
                                                    <td class="text-center"> 
                                                        
                                                    </td>
                                                    <td class="text-center"> - </td>
                                                    <td class="text-center"> - </td>
                                                    <td class="text-center">
                                                        `
                                                        +
                                                            assign_or_locked_bed
                                                        +
                                                        `    
                                                    </td>
                                                    <td class="text-center">
                                                        <p>-</p>
                                                    </td>
                                                </tr>
                                                `;
                        }
                  }

                  // BUILD HTML TO BE INSERTED IN THE ward_overview_html FIELD
                  let ward_html =
                    `                   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
                                        <br><br>
                                        <h3>Ward Availability Information</h3>
                                        <p><strong>Total Beds & Cots:</strong> ${occupancy_info_doc.total_beds}</p>
                                        <div class="row">
                                            <div class="col-3">    
                                                <p><strong>Available beds for admission:</strong> ${occupancy_info_doc.unoccupied_beds} </p>
                                                <p><strong>Available cots for admission:</strong> ${occupancy_info_doc.unoccupied_cots} </p>
                                            </div>
                                            <div class="col-3">
                                                <p><strong>Locked Beds:</strong> ${occupancy_info_doc.locked_beds}</p>
                                                <p><strong>Locked Cots:</strong> ${occupancy_info_doc.locked_cots}</p>
                                                
                                            </div>
                                            <div class="col-3">
                                                <p><strong>Occupied Beds:</strong> ${occupancy_info_doc.occupied_beds}</p>
                                                <p><strong>Occupied Cots:</strong> ${occupancy_info_doc.occupied_cots}</p>
                                            </div>
                                            <div class="col-3">
                                                <p><strong>Unoccupied Beds:</strong> ${occupancy_info_doc.unoccupied_beds}</p>
                                                <p><strong>Unoccupied Cots:</strong> ${occupancy_info_doc.unoccupied_cots}</p>
                                            </div>
                                        </div>

                                        <div class="row">
                                        <table class="table table-bordered table-hover">
                                            <tr class="text-center" style="background: steelblue; font-size: 15px; color: white;">
                                                <th>Room & Bed Info</th>
                                                <th>Patient Name</th>
                                                <th>Bed days</th>
                                                <th>Consultant</th>
                                                <th>Payment Type</th>
                                                <th>Action</th>
                                                <th>Discharge<br>Information</th>
                                            </tr>
                                    ` +
                    WARD_BED_ROWS +
                    `
                                        </table>

                                    </div>
                                    `;
                  // console.log(ward_html)
                  d.set_value("ward_overview_html", ward_html);
                  // console.log(d.fields_dict.ward_overview_html = ward_html)
                },
              });
            }
          },
        },
        {
          label: "WARD OVERVIEW",
          fieldname: "ward_overview_html",
          fieldtype: "HTML",
        },
      ],
      size: "extra-large", // small, large, extra-large
      primary_action_label: "Done",
      primary_action(values) {
        console.log(values);
        d.hide();
      },
    });

    d.show();
  },

  after_save: async (frm) => {
    console.log("Onsave active");
    await frappe.call({
      method: "gch_inpatient.services.create_procedure_tests",
      args: {
        'patient': frm.doc.patient,
        "inpatient_record": frm.doc.name
      },
      callback: (res) => {
        if(res.message){
          frm.reload_doc();
          // frappe.show_alert({message: `Procedures created successfully`, indicator: 'green'});
        }else {
          // frappe.show_alert({message: `There was a problem creating procedures`, indicator: 'red'});
        }
      }
    })

    if(frm.doc.lab_tests.length > 0 || frm.doc.radiology_details.length > 0){
      await frappe.call({
        method: "gch_inpatient.services.add_tests_to_invoice",
        args: {
          'inpatient_record': frm.doc.name,
        },
        callback: (res) => {
          if(res.message){
            console.log(res);
          }
        }
      })
    }
  },

  onload: (frm) => {
    frm.set_df_property("drug_prescription", "hidden", 1);
    frm.set_df_property("medication_section", "collapsible", 0);

    if (frm.doc.inpatient_prescription_table.length) {
      //     console.log("LOOOAAAAADDED!!!");
      frm.add_custom_button(__("Treatment Sheet"), function () {
        const url = `/app/treatment-sheet/${frm.doc.name}`;
        window.location.href = url;
      });
    }

    frappe.require(
      "/assets/gch_inpatient/js/inpatient_record/pharmacy.js",
      () => {
        handle_pharmacy(frm);
      }
    );
  },
  transfer_patient: (frm) => {
    // describe patient transfer dialog
    let d = new frappe.ui.Dialog({
      title: "Transfer Patient",
      fields: [
        {
          label: "From Ward Name",
          fieldname: "from_ward_name",
          fieldtype: "Link",
          options: "Nursing Ward",
          default: cur_frm.doc.ward_station,
        },
        {
          label: "To Ward Name",
          fieldname: "ward_name",
          fieldtype: "Link",
          options: "Nursing Ward",
          onchange: () => {
            // On field change check if not empty and fetch selected ward occupany
            // console.log(d.fields_dict.ward_name.value)
            if (d.fields_dict.ward_name.value) {
              frappe.call({
                method: "gch_custom.services.list_beds",
                async: false,
                args: {
                  ward: d.fields_dict.ward_name.value,
                },
                callback: (res) => {
                  console.log(res.message, "hERE......");

                  let occupancy_info_doc = res.message[0];

                  // console.log(occupancy_info_doc, "Occupancy Information Doc========================")

                  let result = occupancy_info_doc.bed_details.reduce(function (
                    r,
                    a
                  ) {
                    r[a.ward_room] = r[a.ward_room] || [];
                    r[a.ward_room].push(a);
                    return r;
                  },
                  Object.create(null));

                  // console.log(result, "hERE 22......");

                  for (let room in result) {
                    // console.log("ROOM : ", result[room], result[room].length, ".........")
                    // Get patient
                    let patient = "";

                    // Generate action
                    let action = "";

                    for (let i = 0; i < result[room].length; i++) {
                      console.log(
                        result[room][i],
                        "================== bed information ================="
                      );
                    }
                  }

                  // BUILD WARD BED ROWS HTML FROM COUNT OF BEDS AND COTS

                  let WARD_BED_ROWS = "";

                  for (let i in occupancy_info_doc.bed_details) {
                    // Get patient
                    let patient = "";

                    // Generate action
                    let action = "";

                    let booked_message = "";

                    let lodging_message = "";

                    if (occupancy_info_doc.bed_details[i].occupant) {
                      patient = occupancy_info_doc.bed_details[i].occupant.name;

                      let row_wrapper = "";

                      // Checking if patient is assigned, booked or lodging to change row wrapper
                      if (
                        occupancy_info_doc.bed_details[i].occupancy_status
                          .is_assigned
                      ) {
                        row_wrapper = "background: #2490ef21;";
                        // Assigning actions available
                      } else if (
                        occupancy_info_doc.bed_details[i].occupancy_status
                          .is_booking
                      ) {
                        row_wrapper = "background: #ef242430;";
                        // assigning actions available
                        booked_message =
                          "<span style='color: red'>BED BOOKED FOR</span> ";
                      } else if (
                        occupancy_info_doc.bed_details[i].occupancy_status
                          .is_lodging
                      ) {
                        row_wrapper = "background: #6d24ef30";
                        // Assigning actions available
                        lodging_message =
                          "<span style='color: purple;'> (LODGING) </span>";
                      }

                      let gender_icon = "";

                      if (
                        occupancy_info_doc.bed_details[i].occupant.sex == "Male"
                      ) {
                        gender_icon =
                          '<i style="color: blue;" class="fa-solid fa-mars fa-2x"></i>';
                      } else if (
                        occupancy_info_doc.bed_details[i].occupant.sex ==
                        "Female"
                      ) {
                        gender_icon =
                          '<i style="color: #f3a6b4;" class="fa-solid fa-venus fa-2x"></i>';
                      }

                      if (patient == cur_frm.doc.patient) {
                        row_wrapper = "background: #24ef2e30;";
                        WARD_BED_ROWS += `      

                                                <tr style="${row_wrapper};" id="ward_bed_row-${i}">
                                                    <td>
                                                        <span style="font-size: 12px; fomt-weight: 500;" class="text-sm">Room No: <strong><span id="ward_room_row-${i}">${
                          occupancy_info_doc.bed_details[i].ward_room
                        }</span></strong> </span>
                                                        <br>
                                                        <span style="font-size: 12px; fomt-weight: 500;" class="text-sm">Bed: <strong><span id="bed_number_row-${i}">${
                          occupancy_info_doc.bed_details[i].bed_number
                        }</span></strong> </span>
                                                        <span style="display: none;" id="bed_code_row-${i}">${
                          occupancy_info_doc.bed_details[i].name
                        }</span>
                                                        <br>
                                                        <span style="font-size: 11px; fomt-weight: 500;" class="text-sm">Bed Type: <strong><span id="room_category_row-${i}">${
                          occupancy_info_doc.bed_details[i].bed_type || ""
                        }</span></strong></span>
                                                    </td>
                                                    <td class="text-center"> 
                                                        ${gender_icon} 
                                                        <strong>${booked_message} <a href="/app/patient/${patient}">${patient}</a> ${lodging_message}</strong>
                                                    </td>
                                                    <td class="text-center"> 
                                                        ${occupancy_info_doc.bed_details[i].bed_days}
                                                    </td>
                                                    <td class="text-center"> ${
                                                      occupancy_info_doc
                                                        .bed_details[i]
                                                        .inpatient_record
                                                        .practitioner_name || ""
                                                    } </td>
                                                    <td class="text-center"> ${
                                                      occupancy_info_doc
                                                        .bed_details[i]
                                                        .inpatient_record
                                                        .billing_type
                                                    } </td>
                                                    <td class="text-center">
                                                        <a style="margin-right: 6px;" href="/app/treatment-sheet/${
                                                          occupancy_info_doc
                                                            .bed_details[i]
                                                            .inpatient_record
                                                            .name
                                                        }"><i title="Open Treatment Sheet" style="color: forestgreen;" class="fa-solid fa-file-prescription fa-2x"></i></a>
                                                        <a style="margin-right: 6px;" href="/app/multidisciplinary/${
                                                          occupancy_info_doc
                                                            .bed_details[i]
                                                            .inpatient_record
                                                            .multidisciplinary
                                                        }"><i title="Open Multidisciplinary" style="color: darkgoldenrod;" class="fa-solid fa-hospital-user fa-2x"></i></a>
                                                        <a href="/app/nursing-input-output-chart"><i title="Open Input Output Chart" style="color: orange;" class="fa-solid fa-droplet fa-2x"></i></a>
                                                        
                                                    </td>
                                                    <td class="text-center">
                                                        <p>-</p>
                                                    </td>
                                                </tr>
                                                `;
                      } else {
                        WARD_BED_ROWS += `
                                                <tr style="${row_wrapper};" id="ward_bed_row-${i}">
                                                    <td>
                                                        <span style="font-size: 12px; fomt-weight: 500;" class="text-sm">Room No: <strong><span id="ward_room_row-${i}">${
                          occupancy_info_doc.bed_details[i].ward_room
                        }</span></strong> </span>
                                                        <br>
                                                        <span style="font-size: 12px; fomt-weight: 500;" class="text-sm">Bed: <strong><span id="bed_number_row-${i}">${
                          occupancy_info_doc.bed_details[i].bed_number
                        }</span></strong> </span>
                                                        <span style="display: none;" id="bed_code_row-${i}">${
                          occupancy_info_doc.bed_details[i].name
                        }</span>
                                                        <br>
                                                        <span style="font-size: 11px; fomt-weight: 500;" class="text-sm">Bed Type: <strong><span id="room_category_row-${i}">${
                          occupancy_info_doc.bed_details[i].bed_type || ""
                        }</span></strong></span>
                                                    </td>
                                                    <td class="text-center"> 
                                                    ${gender_icon} 
                                                        <strong>${booked_message} <a href="/app/patient/${patient}">${patient}</a> ${lodging_message}</strong>
                                                    </td>
                                                    <td class="text-center"> 
                                                        ${occupancy_info_doc.bed_details[i].bed_days}
                                                    </td>
                                                    <td class="text-center"> ${
                                                      occupancy_info_doc
                                                        .bed_details[i]
                                                        .inpatient_record
                                                        .practitioner_name || ""
                                                    } </td>
                                                    <td class="text-center"> ${
                                                      occupancy_info_doc
                                                        .bed_details[i]
                                                        .inpatient_record
                                                        .billing_type
                                                    } </td>
                                                    <td class="text-center">
                                                        <a style="margin-right: 6px;" href="/app/inpatient-record/${ occupancy_info_doc.bed_details[i].inpatient_record.name }"><i title="View Inpatient Encounter" style="color: deepskyblue;" class="fa-solid fa-id-card-clip fa-2x"></i></a>
                                                        <a style="margin-right: 6px;" href="/app/treatment-sheet/${
                                                          occupancy_info_doc
                                                            .bed_details[i]
                                                            .inpatient_record
                                                            .name
                                                        }"><i title="Open Treatment Sheet" style="color: forestgreen;" class="fa-solid fa-file-prescription fa-2x"></i></a>
                                                        <a style="margin-right: 6px;" href="/app/multidisciplinary/${
                                                          occupancy_info_doc
                                                            .bed_details[i]
                                                            .inpatient_record
                                                            .multidisciplinary
                                                        }"><i title="Open Multidisciplinary" style="color: darkgoldenrod;" class="fa-solid fa-hospital-user fa-2x"></i></a>
                                                        <a href="/app/nursing-input-output-chart"><i title="Open Input Output Chart" style="color: orange;" class="fa-solid fa-droplet fa-2x"></i></a>
                        

                                                        <a style="margin-right: 6px;" href="/app/patient-nutrition-overview/${ occupancy_info_doc.bed_details[i].nutrition_information.name }}"><i title="Nutrition Overview" style="color: rgb(255, 94, 0);" class="fa-solid fa-utensils fa-2x"></i></a>
                                                    </td>
                                                    <td class="text-center">
                                                        <p>-</p>
                                                    </td>
                                                </tr>
                                                `;
                      }
                    } else {
                        let transfer_or_locked_bed = ``

                        if (occupancy_info_doc.bed_details[i].is_locked == 1) {
                            transfer_or_locked_bed = `<p style="font-size: 16px; font-weight: 700; color: firebrick;">BED LOCKED</p>`
                        } else {
                            transfer_or_locked_bed = `<button style="font-size: 10px; background: mediumseagreen;" id=${i} onclick="transfer_patient(${i})" class="btn btn-primary btn-sm">Transfer Here</button>`
                        }

                      WARD_BED_ROWS += `
                                            <tr id="ward_bed_row-${i}">
                                                <td>
                                                    <span style="font-size: 12px; fomt-weight: 500;" class="text-sm">Room No: <strong><span id="ward_room_row-${i}">${
                        occupancy_info_doc.bed_details[i].ward_room
                      }</span></strong> </span>
                                                    <br>
                                                    <span style="font-size: 12px; fomt-weight: 500;" class="text-sm">Bed: <strong><span id="bed_number_row-${i}">${
                        occupancy_info_doc.bed_details[i].bed_number
                      }</span></strong> </span>
                                                    <span style="display: none;" id="bed_code_row-${i}">${
                        occupancy_info_doc.bed_details[i].name
                      }</span>
                                                    <br>
                                                    <span style="font-size: 11px; fomt-weight: 500;" class="text-sm">Bed Type: <strong><span id="room_category_row-${i}">${
                        occupancy_info_doc.bed_details[i].bed_type || ""
                      }</span></strong></span>
                                                </td>
                                                <td class="text-center">-</td>
                                                <td class="text-center"> 
                                                    
                                                </td>
                                                <td class="text-center"> - </td>
                                                <td class="text-center"> - </td>
                                                <td class="text-center">
                                                    
                                                    `
                                                    +
                                                        transfer_or_locked_bed
                                                    +
                                                    `
                                                </td>
                                                <td class="text-center">
                                                    <p>-</p>
                                                </td>
                                            </tr>
                                            `;
                    }
                  }

                  // BUILD HTML TO BE INSERTED IN THE ward_overview_html FIELD
                  let ward_html =
                    `                   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
                                        <br><br>
                                        <h3>Ward Availability Information</h3>
                                        <p><strong>Total Beds & Cots:</strong> ${occupancy_info_doc.total_beds}</p>
                                        <div class="row">
                                            <div class="col-3">    
                                                <p><strong>Available beds for admission:</strong> ${occupancy_info_doc.unoccupied_beds} </p>
                                                <p><strong>Available cots for admission:</strong> ${occupancy_info_doc.unoccupied_cots} </p>
                                            </div>
                                            <div class="col-3">
                                                <p><strong>Locked Beds:</strong> ${occupancy_info_doc.locked_beds}</p>
                                                <p><strong>Locked Cots:</strong> ${occupancy_info_doc.locked_cots}</p>
                                                
                                            </div>
                                            <div class="col-3">
                                                <p><strong>Occupied Beds:</strong> ${occupancy_info_doc.occupied_beds}</p>
                                                <p><strong>Occupied Cots:</strong> ${occupancy_info_doc.occupied_cots}</p>
                                            </div>
                                            <div class="col-3">
                                                <p><strong>Unoccupied Beds:</strong> ${occupancy_info_doc.unoccupied_beds}</p>
                                                <p><strong>Unoccupied Cots:</strong> ${occupancy_info_doc.unoccupied_cots}</p>
                                            </div>
                                        </div>

                                        <div class="row">
                                        <table class="table table-bordered table-hover">
                                            <tr class="text-center" style="background: steelblue; font-size: 15px; color: white;">
                                                <th>Room & Bed Info</th>
                                                <th>Patient Name</th>
                                                <th>Bed days</th>
                                                <th>Consultant</th>
                                                <th>Payment Type</th>
                                                <th>Action</th>
                                                <th>Discharge<br>Information</th>
                                            </tr>
                                    ` +
                    WARD_BED_ROWS +
                    `
                                        </table>

                                    </div>
                                    `;
                  // console.log(ward_html)
                  d.set_value("ward_overview_html", ward_html);
                  // console.log(d.fields_dict.ward_overview_html = ward_html)
                },
              });
            }
          },
        },
        {
          label: "WARD OVERVIEW",
          fieldname: "ward_overview_html",
          fieldtype: "HTML",
        },
      ],
      size: "extra-large", // small, large, extra-large
      primary_action_label: "Done",
      primary_action(values) {
        console.log(values);
        d.hide();
      },
    });

    d.show();
  },
  start_patient_assessment: function (frm) {
    // if (!frm.doc.__islocal) {
    create_patient_assessment(frm);

    // assessment_btn_press_count +=1;
  },
});

frappe.ui.form.on("Anthropometry Details GCH", {
  weight_in_kilograms: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    console.log("weight", row.weight_in_kilograms);

    if (row.weight_in_kilograms <= 0) {
      // validated = false;
      msgprint("Invalid Weight");
      //   frappe.model.set_value(frm.doctype, frm.docname, "bmi", "");
      //   frappe.model.set_value(frm.doctype, frm.docname, "bsa", "");
    } else {
      if (row.height_in_centimeters && row.weight_in_kilograms) {
        // Calculating BMI
        var bmi =
          row.weight_in_kilograms /
          ((row.height_in_centimeters / 100) *
            (row.height_in_centimeters / 100));
        row.bmi = bmi;

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

        console.log(bmi, bmi_note, "BMI and NOte");
        // Calculating BSA
        // Mosteller formula
        // BSA (m2) = square root of (height (cm) x weight (kg)/3600)
        var bsa = Math.sqrt(
          row.height_in_centimeters * (row.weight_in_kilograms / 3600)
        );
        row.bsa = bsa;
        cur_frm.refresh_field("anthropometry_details");

        console.log("BSA", bsa, row);

        // CALCULATING PERCENTILE DATA
        // calculate_bmi_age_percentile(frm);
        // calculate_height_age_percentile(frm);
        // calculate_weight_age_percentile(frm);
      }
    }
  },

  // patient_assessment: function (frm) {
  //   // // console.log("P.A Field Changed.....")
  // },

  height_in_centimeters: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    console.log("height", row.height_in_centimeters);

    if (row.height_in_centimeters <= 10 || row.height_in_centimeters >= 200) {
      msgprint("Invalid Height");
      //   validated = false;
      //   frappe.model.set_value(frm.doctype, frm.docname, "bmi", "");
      //   frappe.model.set_value(frm.doctype, frm.docname, "bsa", "");
    } else {
      if (row.height_in_centimeters && row.weight_in_kilograms) {
        // Calculating BMI
        var bmi =
          row.weight_in_kilograms /
          ((row.height_in_centimeters / 100) *
            (row.height_in_centimeters / 100));
        row.bmi = bmi;

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

        console.log(bmi, bmi_note, "BMI and NOte");
        // Calculating BSA
        // Mosteller formula
        // BSA (m2) = square root of (height (cm) x weight (kg)/3600)
        var bsa = Math.sqrt(
          row.height_in_centimeters * (row.weight_in_kilograms / 3600)
        );
        row.bsa = bsa;
        console.log("BSA", bsa, row);

        cur_frm.refresh_field("anthropometry_details");
        // // CALCULATING PERCENTILE DATA
        // calculate_bmi_age_percentile(frm);
        // calculate_height_age_percentile(frm);
        // calculate_weight_age_percentile(frm);

        // Get Date of Birth
        // if (frm.doc.patient) {
        //   frappe.call({
        //     method: "frappe.client.get",
        //     args: {
        //       doctype: "Patient",
        //       name: frm.doc.patient,
        //     },
        //     callback: function (data) {
        //       const z_patientdob = data.message.dob;
        //       const z_patientage = calculate_age(z_patientdob);
        //       const z_gender = frm.doc.patient_sex;

        //       //Check Gender here..if not M or F!
        //       if (
        //         z_patientdob &&
        //         z_patientage < 6935 &&
        //         (z_gender == "Female" || z_gender == "Male")
        //       ) {
        //         getcalculate_zscore(
        //           z_patientdob,
        //           z_gender,
        //           frm.doc.weight_in_kilograms,
        //           frm.doc.height_in_centimeters
        //         );
        //       } else {
        //         if (z_gender != "Female" && z_gender != "Male") {
        //           msgprint({
        //             title: __("Warning"),
        //             indicator: "orange",
        //             message: __(
        //               "Z-score percentiles NOT calculated. Gender not Male or Female"
        //             ),
        //           });
        //         }
        //       }
        //     },
        //   });
        // }
      }
    }
  },
});

let admit_patient_dialog2 = function (frm) {
  // Check if patient has been assigned to a specific room and bed before admission
  if (!cur_frm.doc.room_number && !cur_frm.doc.bed_number) {
    frappe.throw(
      "Please assign the patient to a specific room and bed number using the show vacancy button"
    );
  }

  let dialog = new frappe.ui.Dialog({
    title: "Admit Patient",
    width: 100,
    fields: [
      {
        fieldtype: "Link",
        label: "Service Unit",
        fieldname: "service_unit",
        options: "Healthcare Service Unit",
        reqd: 0,
        default: "Inpatient - GCH",
        hidden: true,
      },
      {
        fieldtype: "HTML",
        label: "",
        fieldname: "Admission Confirmation",
        options: `<p style="font-size: 20px;"><br><br>Confirm Admission of <strong>${cur_frm.doc.patient}</strong> to <strong>${cur_frm.doc.ward_station}</strong> in Room <strong>${cur_frm.doc.room_no}</strong> and Bed <strong>${cur_frm.doc.bed_number}</strong></p> <br><br><br>`,
      },
      {
        fieldtype: "Datetime",
        label: "Admission Datetime",
        fieldname: "check_in",
        reqd: 1,
        default: frappe.datetime.now_datetime(),
      },
      {
        fieldtype: "Data",
        label: "Expected Discharge Date",
        fieldname: "expected_discharge",
        default: frm.doc.expected_length_of_stay
          ? frappe.datetime.add_days(
              frappe.datetime.now_datetime(),
              frm.doc.expected_length_of_stay
            )
          : "",
      },
    ],
    primary_action_label: __("Admit"),
    primary_action: function () {
      let service_unit = dialog.get_value("service_unit");
      let check_in = dialog.get_value("check_in");
      let expected_discharge = null;
      if (dialog.get_value("expected_discharge")) {
        expected_discharge = dialog.get_value("expected_discharge");
      }
      if (!check_in) {
        return;
      }
      frappe.call({
        doc: frm.doc,
        method: "admit",
        args: {
          service_unit: service_unit,
          check_in: check_in,
          expected_discharge: expected_discharge,
        },
        callback: function (data) {
          if (!data.exc) {
            frm.reload_doc();
          }
        },
        freeze: true,
        freeze_message: __("Processing Patient Admission"),
      });
      // frm.refresh_fields();
      dialog.hide();

      // Auto generate Multidisciplinary Form and Input Output chart on admission
      frappe.call({
        method:
          "gch_inpatient.overrides.inpatient_record.generate_multidisciplinary_record",
        args: {
          inpatient_record: cur_frm.doc.name,
          op_encounter: cur_frm.doc.admission_encounter,
          patient: cur_frm.doc.patient,
          room_no: cur_frm.doc.room_no,
          bed_no: cur_frm.doc.bed_number,
        },
        callback: (res) => {
          console.log(res);
          if (res.message == true) {
            frappe.show_alert(
              {
                message: __("Multidisciplinary Record Generated Successfully"),
                indicator: "green",
              },
              5
            );
          }
        },
      });

      // Updating Nursing Ward Occupancy from booked to assigned after patient admission
      frappe.call({
        method:
          "gch_inpatient.overrides.inpatient_record.updating_ward_occupany_status",
        args: {
          patient: cur_frm.doc.patient,
        },
        callback: (res) => {
          console.log(res.message);
        },
      });

      cur_frm.refresh_fields();
    },
  });

  dialog.show();
};

function create_patient_assessment(frm) {
  let last_vitals_array = cur_frm.doc.vital_signs_table.pop()
  let last_anthro_array = cur_frm.doc.anthropometry_details.pop()

  frappe.route_options = {
    patient: frm.doc.patient,
    inpatient_record: frm.doc.name,
    is_inpatient: 1,
    assessment_template: cur_frm.doc.patient_assessment,
    assessment_branch: cur_frm.doc.branch,
    weight: last_anthro_array.weight_in_kilograms,
    height: last_anthro_array.height_in_centimeters,
    temperature: last_vitals_array.patient_encounter_temperature,
    bmi: last_anthro_array.bmi,
    bsa: last_anthro_array.bsa

  };
  frappe.new_doc("Patient Assessment");
}

let assessment_length = 0;

function get_encounter_assessment(frm) {
  frappe.call({
    method: "gch_inpatient.overrides.inpatient_record.encounter_assessments",
    async: false,
    args: {
      encounter: frm.doc.name,
    },

    callback: function (data) {
      let assessment = data.message;

      console.log(assessment);

      let item_array = [];

      //   const clinic = cur_frm.doc.clinic;

      //   let is_walkin = false;

      //   if (cur_frm.doc.clinic.includes("Walk-In") || "Procedure - GCH" || "Results") {
      //     is_walkin = true;
      //   }

      assessment_length = assessment.length;

      assessment_length_global = assessment.length;

      // // // console.log(assessment.length, "Assess length");

      if (assessment.length > 0) {
        // frm.set_df_property("patient_assessment", "reqd", 0);
        // frm.refresh_field("patient_assessment");

        // Setting the value of the field to the assessment's name, Forces user to save to retain P.A info
        cur_frm.set_value(
          "patient_assessment",
          assessment[0].assessment_template
        );
        cur_frm.refresh_field("patient_assessment");
        // frappe.validated = true;
        assessment.forEach((assess) => {
        if (parseInt(assess.assessment_template.includes("Falls Risk") && (assess.total_score_obtained) == 4 || parseInt(assess.total_score_obtained) == 5) ) {
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
          } else if (parseInt(assess.total_score_obtained) > 5) {
            item_array.push(
                `   <tr style="background-color:#ff00000a; color: black;">
                                <td style = "white-space: nowrap; color:red;"> <a style="color: blue;" href="/app/patient-assessment/${assess.name}">` +
                    assess.name +
                    `</a></td>
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
                                <td style = "white-space: nowrap; color:blue;"> <a style="color: blue;" href="/app/patient-assessment/${assess.name}">` +
                    assess.name +
                    `</a></td>
                                        <td style = "white-space: nowrap;">` +
                    assess.assessment_template +
                    `</td>
                                        <td style = "white-space: nowrap;">` +
                    assess.total_score_obtained +
                    `</td>
                                        <td style = "white-space: nowrap;">` +
                    assess.assessment_date +
                    `</td>
                                        <td style = "white-space: nowrap;">` +
                    assess.assessment_time +
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
      } else if (assessment.length <= 0 && frm.doc.__islocal != 1) {
        // Making the field mandatory if no record is found
        // // // console.log("No assessment found, Making field required");
        // // // console.log("islocal", frm.doc.__islocal);
        // frm.set_df_property("patient_assessment", "reqd", 1);
        // frm.refresh_field("patient_assessment");
      }
      //   else if (is_walkin) {
      //     frm.set_df_property("patient_assessment", "reqd", 0);
      //     frm.refresh_field("patient_assessment");
      //   }
    },
  });
}

let calculate_age = function (birth) {
  let ageMS = Date.parse(Date()) - Date.parse(birth);
  let gch_patient_age = new Date();
  gch_patient_age.setTime(ageMS);
  let years = gch_patient_age.getFullYear() - 1970;

  return `${years} ${__("Year(s)")} ${gch_patient_age.getMonth()} ${__(
    "Month(s)"
  )} ${gch_patient_age.getDate()} ${__("Day(s)")}`;
};

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
      // cur_frm.set_value("is_emergency_patient", 1);
      // cur_frm.refresh_field("is_emergency_patient");

      // Updating number of emergency vitals
      // let current_emergency_vitals = cur_frm.doc.number_of_emergency_vitals
      // cur_frm.set_value("number_of_emergency_vitals", current_emergency_vitals + 1)
      // cur_frm.refresh_field("number_of_emergency_vitals")

      // Mild Fever
    } else if (temp >= 38 && temp <= 39) {
      $('input[data-fieldname="patient_encounter_temperature"]').css(
        "color",
        "#fd9937"
      );

      // Emptying value of field if vital is not critical
      // var empty = "";

      //   frappe.model.set_value(
      //     cur_frm.doctype,
      //     cur_frm.docname,
      //     "critical_vital_temperature",
      //     empty
      //   );

      // // // console.log("Mild Fever!!!!");

      $('[data-fieldname="patient_encounter_temperature"]').find(
        "label"
      )[0].style.color = "#fd9937";

      // cur_frm.set_value("is_priority_patient", 1);
      // cur_frm.refresh_field("is_priority_patient");

      // // Updating number of priority vitals
      // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      // cur_frm.refresh_field("number_of_priority_vitals")

      // Emptying value of field if vital is not critical
      var empty = "";

      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_temperature",
        empty
      );

      // Normal Temperature
    } else if (temp > 35 && temp <= 37) {
      $('input[data-fieldname="patient_encounter_temperature"]').css(
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

      // cur_frm.set_value("is_emergency_patient", 0)
      // cur_frm.refresh_field("is_emergency_patient")

      // cur_frm.set_value("is_priority_patient", 0);
      // cur_frm.refresh_field("is_priority_patient");

      // Emptying value of field if vital is not critical
      var empty = "";

      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_temperature",
        empty
      );

      // Hypothermia
    } else if (temp < 35) {
      $('input[data-fieldname="patient_encounter_temperature"]').css(
        "color",
        "#2CBAE1"
      );

      // Emptying value of field if vital is not critical
      var empty = "";

      frappe.model.set_value(
        cur_frm.doctype,
        cur_frm.docname,
        "critical_vital_temperature",
        empty
      );

      // // console.log("Hypothermia!");

      $('[data-fieldname="patient_encounter_temperature"]').find(
        "label"
      )[0].innerHTML = "Temperature (Hypothermia!)";

      $('[data-fieldname="patient_encounter_temperature"]').find(
        "label"
      )[0].style.color = "#2CBAE1";

      // cur_frm.set_value("is_emergency_patient", 1);
      // cur_frm.refresh_field("is_emergency_patient");

      // Updating number of emergency vitals
      // let current_emergency_vitals = cur_frm.doc.number_of_emergency_vitals
      // cur_frm.set_value("number_of_emergency_vitals", current_emergency_vitals + 1)
      // cur_frm.refresh_field("number_of_emergency_vitals")
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
      // cur_frm.set_value("is_priority_patient", 0);
      // cur_frm.refresh_field("is_priority_patient");

      // cur_frm.set_value("is_emergency_patient", 0);
      // cur_frm.refresh_field("is_emergency_patient");
    }
  });
};

let check_heartrate = function (frm, heart_age, heart_rate, sleep_rate) {
  //   // cur_frm.set_value("is_priority_patient", 1);
  var getYears = parseInt(heart_age.trim().split(/\s+/)[0]) * 12;
  var getMonths = parseInt(heart_age.trim().split(/\s+/)[2]);
  var getDays = parseInt(heart_age.trim().split(/\s+/)[4]);

  // Assuming 28+ days to be a month
  if (getDays >= 28) {
    getMonths += 1;
  }

  // GETTING TOTAL NUMBER OF MONTHS
  var heart_age = parseInt(getYears + getMonths);

  console.log(heart_age, "HEART AGE (MONTHS)");

  //Awake Rate
  if (sleep_rate == 0) {
    if (heart_rate < 60 || heart_rate > 180) {
      // Emergency Flagging
      //   cur_frm.set_value("is_emergency_patient", 1);
      //   cur_frm.refresh_field("is_emergency_patient");

      //   // Updating number of emergency vitals
      //   let current_emergency_vitals = cur_frm.doc.number_of_emergency_vitals
      //   cur_frm.set_value("number_of_emergency_vitals", current_emergency_vitals + 1)
      //   cur_frm.refresh_field("number_of_emergency_vitals")
      $('input[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
      $('div[data-fieldname="patient_encounter_heart_rate"]').css(
        "color",
        "red"
      );
    } else if (heart_age < 1 && (heart_rate < 100 || heart_rate > 180)) {
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
      // cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      // cur_frm.refresh_field("number_of_priority_vitals")
    } else if (
      heart_age >= 1 &&
      heart_age < 12 &&
      (heart_rate < 80 || heart_rate > 170)
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
      // cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      // cur_frm.refresh_field("number_of_priority_vitals")
    } else if (
      heart_age >= 12 &&
      heart_age < 24 &&
      (heart_rate < 90 || heart_rate > 120) // Added a +10 allowance on heart rate..... Implemented to have margin before flagging
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
      // cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
    //   let current_priority_vitals = cur_frm.doc.number_of_priority_vitals;
    //   cur_frm.set_value(
    //     "number_of_priority_vitals",
    //     current_priority_vitals + 1
    //   );
    //   cur_frm.refresh_field("number_of_priority_vitals");
    } else if (
      heart_age >= 24 &&
      heart_age < 60 &&
      (heart_rate < 70 || heart_rate > 110)
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
      // cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      // cur_frm.refresh_field("number_of_priority_vitals")
    } else if (
      heart_age >= 60 &&
      heart_age < 132 &&
      (heart_rate < 60 || heart_rate > 110) // Added a +10 allowance on heart rate..... Implemented to have margin before flagging
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
      // cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      // cur_frm.refresh_field("number_of_priority_vitals")
    } else if (heart_age >= 132 && (heart_rate < 60 || heart_rate > 110)) {
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
      // cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      // cur_frm.refresh_field("number_of_priority_vitals")

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

      // cur_frm.set_value("is_priority_patient", 0);
      // set_priority_off(frm);

      // Updating number of priority vitals
      // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      // cur_frm.refresh_field("number_of_priority_vitals")
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
      // cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      // cur_frm.refresh_field("number_of_priority_vitals")

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
      // cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      // cur_frm.refresh_field("number_of_priority_vitals")
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
      // cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      // cur_frm.refresh_field("number_of_priority_vitals")

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
      // cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      // cur_frm.refresh_field("number_of_priority_vitals")
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
      // cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      // cur_frm.refresh_field("number_of_priority_vitals")
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
      // cur_frm.set_value("is_priority_patient", 1);

      // Updating number of priority vitals
      // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
      // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
      // cur_frm.refresh_field("number_of_priority_vitals")
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

      // // cur_frm.set_value("is_priority_patient", 0);
      // set_priority_off(frm);
    }
  }
};

// Calculating respiratory rate according to age.
let validate_respiratory_rate = function (patientage, respiratory_rate) {
  //   // cur_frm.set_value("is_priority_patient", 1);

  var getYears = parseInt(patientage.trim().split(/\s+/)[0]) * 12;
  var getMonths = parseInt(patientage.trim().split(/\s+/)[2]);
  var getDays = parseInt(patientage.trim().split(/\s+/)[4]);

  // Assuming 28+ days to be a month
  if (getDays >= 28) {
    getMonths += 1;
  }

  // GETTING TOTAL NUMBER OF MONTHS
  var patientage = parseInt(getYears + getMonths);

  if (respiratory_rate < 12 || respiratory_rate > 60) {
    //   cur_frm.set_value("is_emergency_patient", 1);
    //   cur_frm.refresh_field("is_emergency_patient");

    // Updating number of emergency vitals
    //   let current_emergency_vitals = cur_frm.doc.number_of_emergency_vitals
    //   cur_frm.set_value("number_of_emergency_vitals", current_emergency_vitals + 1)
    //   cur_frm.refresh_field("number_of_emergency_vitals")

    $('input[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "red"
    );

    $('div[data-fieldname="patient_encounter_respiratory_rate"]').css(
      "color",
      "red"
    );

    //   frappe.model.set_value(
    //       cur_frm.doctype,
    //       cur_frm.docname,
    //       "critical_vital_respiratory_rate",
    //       respiratory_rate
    //   );
  } else if (
    patientage <= 12 &&
    (respiratory_rate < 30 || respiratory_rate > 60)
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
    // cur_frm.set_value("is_priority_patient", 1);

    // Updating number of priority vitals
    // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    // cur_frm.refresh_field("number_of_priority_vitals")
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
    // cur_frm.set_value("is_priority_patient", 1);

    // Updating number of priority vitals
    //   let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //   cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //   cur_frm.refresh_field("number_of_priority_vitals")
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
    // cur_frm.set_value("is_priority_patient", 1);

    // Updating number of priority vitals
    //   let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //   cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //   cur_frm.refresh_field("number_of_priority_vitals")
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
    // cur_frm.set_value("is_priority_patient", 1);

    // Updating number of priority vitals
    // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    // cur_frm.refresh_field("number_of_priority_vitals")
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
    // cur_frm.set_value("is_priority_patient", 1);

    // Updating number of priority vitals
    // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    // cur_frm.refresh_field("number_of_priority_vitals")
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

    // cur_frm.set_value("is_priority_patient", 0);
  }
};

//Blood Pressure Systolic Validation #Editted by Robert to pick the correct patient age in months and use weight for new borns
let bp_systolic = function (frm, patient_age, bpsystolic) {
  //   cur_frm.set_value("is_priority_patient", 1);

  console.log(patient_age, bpsystolic, "JGEDFASDLFMSD");

  var getYears = parseInt(patient_age.trim().split(/\s+/)[0]) * 12;
  var getMonths = parseInt(patient_age.trim().split(/\s+/)[2]);
  var getDays = parseInt(patient_age.trim().split(/\s+/)[4]);

  // Assuming 28+ days to be a month
  if (getDays >= 28) {
    getMonths += 1;
  }

  // Gettting Patient Weight
  // var patientWeight = parseInt(cur_frm.doc.weight_in_kilograms);

  // GETTING TOTAL NUMBER OF MONTHS
  var patient_age = parseInt(getYears + getMonths);

  // // console.log(patientWeight, "patientWeight");

  if (bpsystolic < 50 || bpsystolic > 130) {
    //   cur_frm.set_value("is_emergency_patient", 1);
    //   cur_frm.refresh_field("is_emergency_patient");
    //   // Updating number of emergency vitals
    //   let current_emergency_vitals = cur_frm.doc.number_of_emergency_vitals
    //   cur_frm.set_value("number_of_emergency_vitals", current_emergency_vitals + 1)
    //   cur_frm.refresh_field("number_of_emergency_vitals")
  } else if (bpsystolic < 50 || bpsystolic > 60) {
    // Added a +5 allowance on hbpsystolic..... Implemented to have margin before flagging
    // $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    //   );
    //   $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    // );

    // Flagging patient as priority
    //   cur_frm.set_value("is_priority_patient", 1);

    //     // Updating number of priority vitals
    //     let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //     cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //     cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpsystolic",
      bpsystolic
    );
  } else if (bpsystolic < 60 || bpsystolic > 90) {
    // Added a +5 allowance on hbpsystolic..... Implemented to have margin before flagging
    // $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    //   );
    //   $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    // );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

    // Updating number of priority vitals
    // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals;
    // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1);
    // cur_frm.refresh_field("number_of_priority_vitals");

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
    // $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    //   );
    //   $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    // );

    // Flagging patient as priority
    //   cur_frm.set_value("is_priority_patient", 1);

    //     // Updating number of priority vitals
    //     let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //     cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //     cur_frm.refresh_field("number_of_priority_vitals")

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
    // $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    //   );
    //   $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    // );

    // Flagging patient as priority
    cur_frm.set_value("is_priority_patient", 1);

    // Updating number of priority vitals
    // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals;
    // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1);
    // cur_frm.refresh_field("number_of_priority_vitals");

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
    // $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    //   );
    //   $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    // );

    // Flagging patient as priority
    //   cur_frm.set_value("is_priority_patient", 1);

    //     // Updating number of priority vitals
    //     let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //     cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //     cur_frm.refresh_field("number_of_priority_vitals")

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
    // $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    //   );
    //   $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    // );

    // Flagging patient as priority
    //   cur_frm.set_value("is_priority_patient", 1);

    //     // Updating number of priority vitals
    //     let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //     cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //     cur_frm.refresh_field("number_of_priority_vitals")

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
    // $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    //   );
    //   $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    // );

    // Flagging patient as priority
    //   cur_frm.set_value("is_priority_patient", 1);

    //     // Updating number of priority vitals
    //     let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //     cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //     cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpsystolic",
      bpsystolic
    );
  } else if (patient_age > 132 && (bpsystolic < 112 || bpsystolic > 130)) {
    // Added a +5 allowance on hbpsystolic..... Implemented to have margin before flagging
    // $('input[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    //   );
    //   $('div[data-fieldname="patient_encounter_bp_systolic"]').css(
    //     "color",
    //     "red"
    // );

    // Flagging patient as priority
    //   cur_frm.set_value("is_priority_patient", 1);

    //     // Updating number of priority vitals
    //     let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //     cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //     cur_frm.refresh_field("number_of_priority_vitals")

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

    //   cur_frm.set_value("is_priority_patient", 0);
    //   set_priority_off(frm);
  }
};

let bp_diastolic = function (frm, patient_age, bpdiastolic) {
  //   cur_frm.set_value("is_priority_patient", 1);

  console.log(patient_age, bpdiastolic, "Test.....");

  var getYears = parseInt(patient_age.trim().split(/\s+/)[0]) * 12;
  var getMonths = parseInt(patient_age.trim().split(/\s+/)[2]);
  var getDays = parseInt(patient_age.trim().split(/\s+/)[4]);

  // Assuming 28+ days to be a month
  if (getDays >= 28) {
    getMonths += 1;
  }

  // Gettting Patient Weight
  // var patientWeight = parseInt(cur_frm.doc.weight_in_kilograms);

  // GETTING TOTAL NUMBER OF MONTHS
  var patient_age = parseInt(getYears + getMonths);

  if (bpdiastolic < 35 || bpdiastolic > 90) {
    //   cur_frm.set_value("is_emergency_patient", 1);
    //   cur_frm.refresh_field("is_emergency_patient");
    //   // Updating number of emergency vitals
    //   let current_emergency_vitals = cur_frm.doc.number_of_emergency_vitals
    //   cur_frm.set_value("number_of_emergency_vitals", current_emergency_vitals + 1)
    //   cur_frm.refresh_field("number_of_emergency_vitals")
    // $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
    //     "color",
    //     "red"
    // );
    // $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
    //     "color",
    //     "red"
    // );
  } else if (bpdiastolic < 35 || bpdiastolic > 45) {
    // $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );
    // $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );

    // Flagging patient as priority
    //   cur_frm.set_value("is_priority_patient", 1);

    //     // Updating number of priority vitals
    //     let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //     cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //     cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpdiastolic",
      bpdiastolic
    );
  } else if (bpdiastolic < 40 || bpdiastolic > 45) {
    // Added a +5 allowance on bpdiastolic..... Implemented to have margin before flagging
    // $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );
    // $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );
    // Flagging patient as priority
    //   cur_frm.set_value("is_priority_patient", 1);
    //     // Updating number of priority vitals
    //     let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //     cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //     cur_frm.refresh_field("number_of_priority_vitals")
  } else if (
    patient_age > 0 &&
    patient_age <= 12 &&
    (bpdiastolic < 40 || bpdiastolic > 65) // Added a +5 allowance on bpdiastolic..... Implemented to have margin before flagging
  ) {
    // $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );
    // $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );
    // Flagging patient as priority
    //   cur_frm.set_value("is_priority_patient", 1);
    //     // Updating number of priority vitals
    //     let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //     cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //     cur_frm.refresh_field("number_of_priority_vitals")
  } else if (
    patient_age > 12 &&
    patient_age <= 24 &&
    (bpdiastolic < 50 || bpdiastolic > 75)
  ) {
    // $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );
    // $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );

    // Flagging patient as priority
    //   cur_frm.set_value("is_priority_patient", 1);

    //     // Updating number of priority vitals
    //     let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //     cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //     cur_frm.refresh_field("number_of_priority_vitals")

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
    // $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );
    // $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );

    // Flagging patient as priority
    //   cur_frm.set_value("is_priority_patient", 1);

    //     // Updating number of priority vitals
    //     let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //     cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //     cur_frm.refresh_field("number_of_priority_vitals")

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
    // $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );
    // $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );

    // Flagging patient as priority
    //   cur_frm.set_value("is_priority_patient", 1);

    //     // Updating number of priority vitals
    //     let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //     cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //     cur_frm.refresh_field("number_of_priority_vitals")

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
    // $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );
    // $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );

    // Flagging patient as priority
    //   cur_frm.set_value("is_priority_patient", 1);

    //     // Updating number of priority vitals
    //     let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    //     cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    //     cur_frm.refresh_field("number_of_priority_vitals")

    frappe.model.set_value(
      cur_frm.doctype,
      cur_frm.docname,
      "critical_vital_bpdiastolic",
      bpdiastolic
    );
  } else if (patient_age > 144 && (bpdiastolic < 70 || bpdiastolic > 90)) {
    // $('input[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );
    // $('div[data-fieldname="patient_encounter_bp_diastolic"]').css(
    // "color",
    // "red"
    // );

    // Flagging patient as priority
    // cur_frm.set_value("is_priority_patient", 1);

    // Updating number of priority vitals
    // let current_priority_vitals = cur_frm.doc.number_of_priority_vitals
    // cur_frm.set_value("number_of_priority_vitals", current_priority_vitals + 1)
    // cur_frm.refresh_field("number_of_priority_vitals")

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

    // cur_frm.set_value("is_priority_patient", 0);
  }
};

frappe.ui.form.on("Inpatient Doctor Prescription Table", {
  form_render: (frm, cdt, cdn) => {
    // // // console.log(frm);
    // // // console.log(cdt, cdn);

    let row = locals[cdt][cdn];
    let date_of_birth = frm.doc.dob;
    let age = calculate_age(date_of_birth)

    console.log(age,"Looaading!!");

    // row.dob = date_of_birth;
    // row.age = age;
    // row.height_in_centimeters = frm.doc.height_in_centimeters;
    // row.weight_in_kilograms = frm.doc.weight_in_kilograms;
    // row.bmi = frm.doc.bmi;
    // cur_frm.refresh_field("inpatient_prescription_table");
    // console.log(cur_frm, "Cuurent Form");

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
    console.log(`on refresh`);
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
      console.log(cur_frm.doc.drug_allergy[allergy]);
      if (
        cur_frm.doc.drug_allergy[allergy].drug_allergy.toLowerCase() ==
        row.generic_drug_name.toLowerCase()
      ) {
        console.log("True.....");
        $('[data-fieldname="generic_drug"]').find("label")[0].innerHTML =
          "Generic Drug (Patient is allergic to generic)";
        $('[data-fieldname="generic_drug"]').find("label")[0].style.color =
          "red";
        $('[data-fieldname="generic_drug"]').find("label")[0].style.fontSize =
          "13px";
        $('[data-fieldname="generic_drug"]').find("label")[0].style.fontWeight =
          "800";
        $('[data-fieldname="generic_drug"]').find("input")[0].style.color =
          "red";
        $('[data-fieldname="generic_drug"]').find(
          "input"
        )[0].style.backgroundColor = "#ff000014";

        $('[data-fieldname="prescription_table"]').find("label")[0].innerHTML =
          "Prescription Table (Patient is allergic to generic)";
        $('[data-fieldname="prescription_table"]').find(
          "label"
        )[0].style.color = "red";
        $('[data-fieldname="prescription_table"]').find(
          "label"
        )[0].style.fontSize = "13px";
        $('[data-fieldname="prescription_table"]').find(
          "label"
        )[0].style.fontWeight = "800";

        $('[data-fieldname="prescription_table"]')[0].style.borderColor = "red";
        $('[data-fieldname="prescription_table"]')[0].style.border =
          "2px solid";
      } else {
        console.log("False");
      }
    }
  },

  onload: (frm, cdt, cdn) => {
    // // console.log(`onload ${frm}`);

    frappe.require(
      "/assets/gch_custom/js/patient_encounter/highlighted_menu.js",
      () => {
        handleHighlightedMenu(cur_frm);
      }
    );

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

    // frappe.require(
    //   "/assets/gch_inpatient/js/inpatient_record/pharmacy.js",
    //   () => {
    //     handle_pharmacy(frm);
    //   }
    // );
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
      console.log(cur_frm.doc.drug_allergy[allergy]);
      if (
        cur_frm.doc.drug_allergy[allergy].drug_allergy.toLowerCase() ==
        row.generic_drug_name.toLowerCase()
      ) {
        console.log("True.....");
        $('[data-fieldname="generic_drug"]').find("label")[0].innerHTML =
          "Generic Drug (Patient is allergic to generic)";
        $('[data-fieldname="generic_drug"]').find("label")[0].style.color =
          "red";
        $('[data-fieldname="generic_drug"]').find("label")[0].style.fontSize =
          "13px";
        $('[data-fieldname="generic_drug"]').find("label")[0].style.fontWeight =
          "800";
        $('[data-fieldname="generic_drug"]').find("input")[0].style.color =
          "red";
        $('[data-fieldname="generic_drug"]').find(
          "input"
        )[0].style.backgroundColor = "#ff000014";
      } else {
        console.log("False");
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

frappe.ui.form.on("Inpatient Doctor Prescription Table", {
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
    cur_frm.refresh_field("inpatient_prescription_table");
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

          frm.fields_dict.inpatient_prescription_table.grid.update_docfield_property(
            "preparation_type",
            "options",
            [""].concat(mapped_preps)
          );
          frm.fields_dict.inpatient_prescription_table.grid.update_docfield_property(
            "route",
            "options",
            [""].concat(mapped_routes)
          );
          frm.fields_dict.inpatient_prescription_table.grid.update_docfield_property(
            "dose_uom",
            "options",
            [""].concat(mapped_uoms)
          );
          frm.fields_dict.inpatient_prescription_table.grid.update_docfield_property(
            "prescription_frequency",
            "options",
            FREQUENCY_OPTIONS
          );
          frm.fields_dict.inpatient_prescription_table.grid.update_docfield_property(
            "pharmacy_frequency",
            "options",
            [""].concat([...range(1, 100)])
            // FREQUENCY_OPTIONS
          );

          frm.refresh_field("inpatient_prescription_table");
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
      frm.refresh_field("inpatient_prescription_table");
    }
  },
  refresh: (frm, cdt, cdn) => {
    // // console.log(`on refresh`);
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
      frm.refresh_field("inpatient_prescription_table");
    }

    // FLAGGING IF PATIENT IS ALLERGIC TO GENERIC NAME CHOSEN
    // -------------------------------
    // if (row.generic_drug_name )
    for (var allergy in cur_frm.doc.drug_allergy) {
      console.log(cur_frm.doc.drug_allergy[allergy]);
      if (
        cur_frm.doc.drug_allergy[allergy].drug_allergy.toLowerCase() ==
        row.generic_drug_name.toLowerCase()
      ) {
        console.log("True.....");
        $('[data-fieldname="generic_drug"]').find("label")[0].innerHTML =
          "Generic Drug (Patient is allergic to generic)";
        $('[data-fieldname="generic_drug"]').find("label")[0].style.color =
          "red";
        $('[data-fieldname="generic_drug"]').find("label")[0].style.fontSize =
          "13px";
        $('[data-fieldname="generic_drug"]').find("label")[0].style.fontWeight =
          "800";
        $('[data-fieldname="generic_drug"]').find("input")[0].style.color =
          "red";
        $('[data-fieldname="generic_drug"]').find(
          "input"
        )[0].style.backgroundColor = "#ff000014";

        $('[data-fieldname="inpatient_prescription_table"]').find(
          "label"
        )[0].innerHTML = "Prescription Table (Patient is allergic to generic)";
        $('[data-fieldname="inpatient_prescription_table"]').find(
          "label"
        )[0].style.color = "red";
        $('[data-fieldname="inpatient_prescription_table"]').find(
          "label"
        )[0].style.fontSize = "13px";
        $('[data-fieldname="inpatient_prescription_table"]').find(
          "label"
        )[0].style.fontWeight = "800";

        $(
          '[data-fieldname="inpatient_prescription_table"]'
        )[0].style.borderColor = "red";
        $('[data-fieldname="inpatient_prescription_table"]')[0].style.border =
          "2px solid";
      } else {
        console.log("False");
      }
    }
  },

  onload: (frm, cdt, cdn) => {
    // // console.log(`onload ${frm}`);

    frappe.require(
      "/assets/gch_custom/js/patient_encounter/highlighted_menu.js",
      () => {
        handleHighlightedMenu(cur_frm);
      }
    );

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
      frm.refresh_field("inpatient_prescription_table");
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

        frm.fields_dict.inpatient_prescription_table.grid.update_docfield_property(
          "preparation_type",
          "options",
          [""].concat(mapped_preps)
        );
        frm.fields_dict.inpatient_prescription_table.grid.update_docfield_property(
          "route",
          "options",
          [""].concat(mapped_routes)
        );
        frm.fields_dict.inpatient_prescription_table.grid.update_docfield_property(
          "dose_uom",
          "options",
          [""].concat(mapped_uoms)
        );
        frm.fields_dict.inpatient_prescription_table.grid.update_docfield_property(
          "prescription_frequency",
          "options",
          // [""].concat([...range(1, 100)])
          FREQUENCY_OPTIONS
        );
        frm.fields_dict.inpatient_prescription_table.grid.update_docfield_property(
          "pharmacy_frequency",
          "options",
          [""].concat([...range(1, 100)])
        );

        frm.refresh_field("inpatient_prescription_table");
      });

    // FLAGGING IF PATIENT IS ALLERGIC TO GENERIC NAME CHOSEN
    // -------------------------------
    // if (row.generic_drug_name )
    for (var allergy in cur_frm.doc.drug_allergy) {
      console.log(cur_frm.doc.drug_allergy[allergy]);
      if (
        cur_frm.doc.drug_allergy[allergy].drug_allergy.toLowerCase() ==
        row.generic_drug_name.toLowerCase()
      ) {
        console.log("True.....");
        $('[data-fieldname="generic_drug"]').find("label")[0].innerHTML =
          "Generic Drug (Patient is allergic to generic)";
        $('[data-fieldname="generic_drug"]').find("label")[0].style.color =
          "red";
        $('[data-fieldname="generic_drug"]').find("label")[0].style.fontSize =
          "13px";
        $('[data-fieldname="generic_drug"]').find("label")[0].style.fontWeight =
          "800";
        $('[data-fieldname="generic_drug"]').find("input")[0].style.color =
          "red";
        $('[data-fieldname="generic_drug"]').find(
          "input"
        )[0].style.backgroundColor = "#ff000014";
      } else {
        console.log("False");
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
    //   frm.refresh_field("inpatient_prescription_table");
    // })
    // let item_price = frappe.db.get_doc("Item Price",null, {item_code:selected_medication}).then((r) => {
    //   // // console.log(r)
    //   row.unit_price = r.price_list_rate;
    //   frm.refresh_field("inpatient_prescription_table");
    // })
    // // console.log("Refreshing table");
    frm.refresh_field("inpatient_prescription_table");
  },
});

frappe.ui.form.on("Patient Encounter Vital Signs", {
  form_render: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let temp = row.patient_encounter_temperature;
    let heart_rate = row.patient_encounter_heart_rate;

    (cur_frm.fields_dict["vital_signs_table"].grid.get_field(
      "patient_encounter_temperature"
    ).get_query = function (doc, cdt, cdn) {
      var child = locals[cdt][cdn];
    }),
      cur_frm.fields_dict["vital_signs_table"].$wrapper
        .find(".grid-body .rows")
        .find(".grid-row")
        .each(function (i, item) {
          let d =
            locals[cur_frm.fields_dict["vital_signs_table"].grid.doctype][
              $(item).attr("data-name")
            ];

          const mytemp = d["patient_encounter_temperature"];

          if (mytemp < 35 || mytemp > 38) {
            $(item)
              .find(".grid-static-col")
              .css({ "background-color": "transparent" });
          } else {
            $(item)
              .find(".grid-static-col")
              .css({ "background-color": "transparent" });
          }

          if (mytemp > 38) {
            // cur_frm.set_value("is_priority_patient", 1);
          }
        });

    //   frm.set_df_property(row.patient_encounter_heart_rate, "reqd", "1")
    //   frm.refresh_field(row.patient_encounter_heart_rate)
  },

  patient_encounter_temperature: function (frm, cdt, cdn) {
    check_vitals_temperature();
    let row = locals[cdt][cdn];
    let temp = row.patient_encounter_temperature;

    cur_frm.fields_dict["vital_signs_table"].$wrapper
      .find(".grid-body .rows")
      .find(".grid-row")
      .each(function (i, item) {
        let d =
          locals[cur_frm.fields_dict["vital_signs_table"].grid.doctype][
            $(item).attr("data-name")
          ];

        const mytemp = d["patient_encounter_temperature"];

        if (mytemp < 35 || mytemp > 38) {
          $(item)
            .find(".grid-static-col")
            .css({ "background-color": "transparent" });
        } else {
          $(item)
            .find(".grid-static-col")
            .css({ "background-color": "transparent" });
        }

        if (mytemp > 38) {
          //   cur_frm.set_value("is_priority_patient", 1);
        }
      });
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

    // const rrpatientdob = "";
    // var rrvitals_age = 0;

    if (cur_frm.doc.patient) {
      frappe.db.get_value(
        "Patient",
        { name: cur_frm.doc.patient },
        "dob",
        (r) => {
          const rrpatientdob = r.dob;
          var rrvitals_age = calculate_age(rrpatientdob);

          // console.log(rrpatientdob, rrvitals_age, "CHeck here")

          // console.log("HEEEEEEEEEEEEEEEEEERRRRRRRRRRRRRR")

          if (row.patient_encounter_respiratory_rate <= 0) {
            msgprint("Please enter a valid Respiratory Rate");
            frappe.validated = false;
          } else {
            if (rrvitals_age)
              validate_respiratory_rate(rrvitals_age, respiratory_rate);
          }
        }
      );
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
      // cur_frm.set_value("is_emergency_patient", 1);
      // cur_frm.refresh_field("is_emergency_patient");
    }

    if (oxygen_level > 100) {
      msgprint("Invalid Percutaneous Oxygen Saturation Value");
      cur_frm.set_value("percutaneous_oxygen_saturation", " ");
      cur_frm.refresh_field("percutaneous_oxygen_saturation");
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
      //   cur_frm.set_value("is_emergency_patient", 1);
      //   document.querySelectorAll(
      //     "[data-fieldname='is_emergency_patient']"
      //   )[0].style.color = "red";
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
      // cur_frm.set_value("is_emergency_patient", 1);
      //   document.querySelectorAll(
      //     "[data-fieldname='is_emergency_patient']"
      //   )[0].style.color = "red";
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
    }
  },
  patient_encounter_bp_systolic: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let bp_systolics = row.patient_encounter_bp_systolic;
    let bp_diastolics = row.patient_encounter_bp_diastolic;
    // let blood_pressure = row.patient_encounter_blood_pressure;

    const bp_patientdob = "";
    const sbp_age = 0;

    if (frm.doc.patient) {
      frappe.db.get_value("Patient", { name: frm.doc.patient }, "dob", (r) => {
        const bp_patientdob = r.dob;
        var sbp_age = calculate_age(bp_patientdob);

        if (row.patient_encounter_bp_systolic <= 0) {
          msgprint("Please enter a valid BP Systoic Value ");
          // frappe.validated = false;
        } else {
          if (sbp_age) bp_systolic(frm, sbp_age, bp_systolics);
        }
      });
    } else {
      msgprint("Patient is required ");
      cur_frm.set_value(row.patient_encounter_bp_systolic, "");
      cur_frm.refresh_field("patient_encounter_bp_systolic");
    }

    // if (bp_systolics && bp_diastolics) {
    //   // var bpsd = bp_systolics + "/" + bp_diastolics + " mmHg";

    // //   var bpsd2 = (bp_systolics + bp_diastolics) / 2;

    // //   row.patient_encounter_blood_pressure = bpsd2;
    // //   cur_frm.refresh_field("vital_signs_table");
    // }

    // bp_systolic(frm, sbp_age, bp_systolics);
  },

  patient_encounter_bp_diastolic: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let bpsystolic = row.patient_encounter_bp_systolic;
    let bpdiastolic = row.patient_encounter_bp_diastolic;
    // let blood_pressure = row.patient_encounter_blood_pressure;

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

    // if (bpsystolic && bpdiastolic) {
    //   //   set_bpsd(frm, bpsystolic, bpdiastolic);
    //   // var bpsd = bp_systolics + "/" + bp_diastolics + " mmHg";

    //   console.log(bpsystolic / bpdiastolic, typeof bpdiastolic, "Heerreee");

    //   var bpsd2 = (bpsystolic + bpdiastolic) / 2;

    //   console.log(bpsd2);

    //   row.patient_encounter_blood_pressure = bpsd2;
    //   cur_frm.refresh_field("vital_signs_table");
    // }

    bp_diastolic(frm, dbp_age, bpdiastolic);
  },
});
