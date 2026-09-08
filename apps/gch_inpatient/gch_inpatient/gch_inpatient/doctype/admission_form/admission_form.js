// For license information, please see license.txt

const assign_to_bed = (id) => {
  console.log(id);
  // Run call to assign patient to bed
  let patient = cur_frm.doc.patient;
  let bed_number = document.getElementById(`bed_number_row-${id}`).innerHTML;
  let room_number = document.getElementById(`ward_room_row-${id}`).innerHTML;
  let bed_code = document.getElementById(`bed_code_row-${id}`).innerHTML;
  let room_type = document.getElementById(`room_category_row-${id}`).innerHTML;

  console.log(patient, bed_code);

  frappe.call({
    method: "gch_custom.services.assign_bed",
    async: false,
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

        // window.location.reload()

        // Update bed and room information on admission record
        cur_frm.set_value("room_number", room_number);
        cur_frm.set_value("bed_number", bed_number);

        cur_frm.refresh_field("room_number");
        cur_frm.refresh_field("bed_number");

        cur_frm.save();
      }
    },
  });
};

window.assign_to_bed = assign_to_bed;

let calculate_age = function (birth) {
  let ageMS = Date.parse(Date()) - Date.parse(birth);
  let gch_patient_age = new Date();
  gch_patient_age.setTime(ageMS);
  let years = gch_patient_age.getFullYear() - 1970;

  return `${years} ${__("Year(s)")} ${gch_patient_age.getMonth()} ${__(
    "Month(s)"
  )} ${gch_patient_age.getDate()} ${__("Day(s)")}`;
};

function renderPopupModal(data, frm) {
  var selectedPatient = null;

  // Create a dialog to display the list of patients with radio buttons
  var dialog = new frappe.ui.Dialog({
    title: "Matching Patient Records",
    fields: [
      {
        fieldtype: "HTML",
        label: "Patients",
        fieldname: "patient_list",
        options: getPatientTable(data), // Generate HTML with radio buttons for patients
      },
      {
        fieldtype: "Button",
        label: "Confirm",
        fieldname: "confirm_button",
        inputClass: "btn-primary block btn-block",
        inputStyle: "width: 100%; background-color: #007bff; color: #fff;",
      },
      {
        fieldtype: "Button",
        label: "Cancel",
        fieldname: "cancel_button",
        inputClass: "btn-danger block btn-block",
        inputStyle:
          "width: 48%; background-color: #dc3545; color: #fff; float: left; margin-right: 2%;",
      },
      {
        fieldtype: "Data",
        label: "selected_patient",
        fieldname: "selected_patient",
        hidden: 1,
      },
    ],
  });

  // Show the dialog
  dialog.show();

  // Listen for changes in radio button selection
  dialog.$wrapper.find('[name="patient_radio"]').on("change", function () {
    var selectedPatient = dialog.$wrapper
      .find('[name="patient_radio"]:checked')
      .val();
    dialog.fields_dict.selected_patient.set_value(selectedPatient);
    dialog.fields_dict.selected_patient.refresh();
  });

  // Handle the confirm button click event
  dialog.fields_dict.confirm_button.input.onclick = function () {
    if (dialog.fields_dict.selected_patient.value !== "") {
      let selectedPatient = dialog.fields_dict.selected_patient.value;

      frm.set_value("patient", selectedPatient);
      frm.set_value("patient_name", selectedPatient);

      // Close the dialog after selection
      dialog.hide();
    } else {
      frappe.msgprint("Please select a patient.");
    }
  };

  // Handle the cancel button click event

  dialog.fields_dict.cancel_button.input.onclick = function () {
    dialog.hide();
  };
}

// Helper function to generate HTML with radio boxes for patients
function getPatientRadioBoxes(data) {
  var html = "<div>";

  data.forEach(function (patient) {
    html += `
            <label>
                <input type="radio" name="patient_radio" value="${patient.name}" data-patient-dob="${patient.dob}">
                ${patient.name} - ${patient.dob}
            </label>
            <br>`;
  });

  html += "</div>";
  return html;
}

function getPatientTable(data) {
  var html = `
        <style>
            table {
                border-collapse: collapse;
                width: 100%;
                border-radius: 8px;
                overflow: hidden;
                margin-bottom: 10px;
            }
            th, td {
                border: 1px solid #ccc;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #f2f2f2;
            }
            .confirm-button-wrapper {
                text-align: center;
            }
        </style>
    `;

  html +=
    "<table><tr><th>Name</th><th>DOB</th><th>Parent Phone</th><th>Select</th></tr>";

  data.forEach(function (patient) {
    html += `
            <tr>
                <td><a href="/desk#Form/Patient/${patient.name}" target="_blank">${patient.name}</a></td>
                <td>${patient.dob}</td>
                <td>${patient.phone_number}</td>
                <td><input type="radio" name="patient_radio" value="${patient.name}" data-patient-dob="${patient.dob}"></td>
            </tr>`;
  });

  html += "</table>";
  return html;
}

frappe.ui.form.on("Admission Form", {
  // setup: (frm) => {
  //     cur_frm.get_field("vital_signs_table").grid.toggle_reqd("patient_encounter_heart_rate", true)
  //     cur_frm.get_field("vital_signs_table").grid.toggle_reqd("patient_encounter_respiratory_rate", true)
  //     cur_frm.get_field("vital_signs_table").grid.toggle_reqd("patient_encounter_percutaneous_oxygen", true)
  //     cur_frm.get_field("vital_signs_table").grid.toggle_reqd("patient_encounter_bp_systolic", true)
  //     cur_frm.get_field("vital_signs_table").grid.toggle_reqd("patient_encounter_diastolic", true)

  //     cur_frm.refresh_field("vital_signs_table")
  // },

  refresh: (frm) => {
    // Patient Static Information
    frappe.require(
        "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
        () => {
          handleHighlightedMenu(cur_frm);
        }
    );

    $('.prev-doc, .next-doc').hide();

    // Add button that redirects to existing sales invoice
    frappe.db.get_value("Sales Invoice", {"inpatient_record": cur_frm.doc.inpatient_record}, ["name"]).then((res) => {
        console.log(res, "sales invocie")
        if (res.message.name) {
            cur_frm.add_custom_button(__("Sales Invoice"), () => {
                window.location.href = "/app/sales-invoice/"+ res.message.name
            });
        }
    })
            

    // Adding Advance Payment button
    if (cur_frm.doc.inpatient_record) {
        // Add the "Advance Payment" button
        frm.add_custom_button(__('Create Advance Payment'), () => {
            // Call the server-side function
            const dialog = new frappe.ui.Dialog({
                title: 'Enter Payment Entry Details',
                fields: [
                    {
                        label: 'Mode of Payment',
                        fieldname: 'mode_of_payment',
                        fieldtype: 'Link',
                        options: 'Mode of Payment',
                        reqd: 1,
                        description: 'Select the payment method'
                    },
                    {
                        label: 'Transaction ID',
                        fieldname: 'transaction_id',
                        fieldtype: 'Data',
                        reqd: 1,
                        description: "Mpesa Code/Insurance/Transaction Code"
                    },
                    {
                        label: 'Amount',
                        fieldname: 'amount',
                        fieldtype: 'Currency',
                        default: cur_frm.doc.outstanding_amount,
                        reqd: 1
                    }
                ],
                primary_action_label: 'Create Payment Entry',
                primary_action(values) {
                    if (values.amount) {
                        // Make call to create payment entry
                        frappe.call({
                            method: 'gch_custom.services.rest.generate_payment_entry', // Add your method here
                            args: {
                                "amount": values.amount,
                                "customer": cur_frm.doc.patient,
                                "mode_of_payment": values.mode_of_payment,
                                "branch": "Muthaiga",
                                "transaction_id": values.transaction_id
                            },
                            callback: (res) => {
                                console.log(res);
                                if (res.message == true) {
                                    frappe.msgprint("Payment Entry Created Successfully");

                                    // Auto fetching advances after successful payment
                                    // cur_frm.call({
                                    //     method: "set_advances",
                                    //     doc: cur_frm.doc,
                                    //     callback: function(r, rt) {
                                    //         refresh_field("advances");
                                    //     }
                                    // })

                                    // cur_frm.save()
                                }
                            }
                        });

                        dialog.hide(); // Close the dialog
                    } else {
                        frappe.msgprint(__('Please enter an amount.'));
                    }
                }
            });

            dialog.show();

            // Add event listener to update Transaction ID dynamically
            dialog.fields_dict.mode_of_payment.df.onchange = function () {
                const modeOfPayment = dialog.get_value('mode_of_payment');
                if (modeOfPayment == 'Insurance') {
                    dialog.set_value('transaction_id', cur_frm.doc.default_insurance);
                } else {
                    dialog.set_value('transaction_id', '');
                }
            };

        });       
    }
    
    frappe.require(
      "/assets/gch_inpatient/js/admission_form/admissionBillingTypeController.js",
      () => {
        admissionBillingTypeController(cur_frm);
      }
    );

    if (!frm.doc.patient && frm.doc.patient_name) {
      frm.add_custom_button(__("Feeling Lucky"), function () {
        let args = {
          patient_name: frm.doc.patient_name,
        };
        if (frm.doc.date_of_birth) {
          args.dob = frm.doc.date_of_birth;
        }
        frappe.confirm(
          "No patient record is set for this Form. Would you like to attempt to match? (Name and DOB are factored in the search)",
          () => {
            frappe.call({
              method: "gch_common.services.render_matching_patients",
              args: {
                ...args,
              },
              callback: function (response) {
                if (response.message) {
                  // Display modal with fetched data
                  renderPopupModal(response.message, frm);
                  console.log(response?.message);
                } else {
                  frappe.msgprint("No data found."); // Display a message if no data is returned
                }
              },
            });
          },
          () => {
            // action to perform if No is selected
          }
        );
      });
    }

    if(cur_frm.doc.ward_of_preference && cur_frm.doc.lodger_form) {
        cur_frm.doc.is_lodging = 1
        cur_frm.refresh_field("is_lodging")
    }

    console.log(frm.doc.patient, frm.doc.patient_name);
    // Hiding encounter side nav, but can be reopened
    $(".layout-side-section").css("display", "none");

    // Adding search functionality by uhid
    // frm.set_query("patient", function (doc, cdt, cdn) {
    //   var item = locals[cdt][cdn];
    //   console.log(item);
    //   return {
    //     query:
    //       "gch_inpatient.gch_inpatient.doctype.admission_form.admission_form.search_through_uhid_code",
    //     // filters: {
    //     //     'item': item.item_code,
    //     // }
    //   };
    // });

    // Show Proceed to Inpatient Record on save

    // Checking if doc has been saved already

    if (!frm.doc.__islocal && !frm.doc.__is_saved && frm.doc.inpatient_record) {
      frm.add_custom_button(__("Proceed to Inpatient Record"), function () {
        const url = `/app/inpatient-record/${frm.doc.inpatient_record}`;
        window.location.href = url;
      });
    }

    // Highlighting Assign Patient to Ward button if room and bed are not set
    if (!frm.doc.bed_number || !frm.doc.room_number) {
      $('button[data-fieldname="show_ward_vacancy"]').css(
        "background-color",
        "yellow"
      );
    }

    if (frm.doc.inpatient_record) {
      $('button[data-label="Proceed%20to%20Inpatient%20Record"]').css(
        "background-color",
        "rgb(3 255 3)"
      );
      $('button[data-label="Proceed%20to%20Inpatient%20Record"]').css(
        "font-weight",
        "600"
      );
    }

    // Setting fields as mandatory after the document is saved
    if (!frm.doc.__islocal) {
      cur_frm.set_df_property("doctor", "reqd", 1);
      cur_frm.refresh_field("doctor");

      cur_frm.set_df_property("ward_station", "reqd", 1);
      cur_frm.refresh_field("ward_station");
    }
  },
  billing_type: (frm) => {
    frappe.require(
      "/assets/gch_inpatient/js/admission_form/admissionBillingTypeController.js",
      () => {
        admissionBillingTypeController(cur_frm);
      }
    );
  },
  before_save: (frm) => {
    // Check if patient has open encounters or bills before saving an admission form
  },

  after_save: (frm) => {
    if (
      !frm.doc.inpatient_record &&
      frm.doc.doctor &&
      frm.doc.billing_type &&
      frm.doc.ward_station &&
      frm.doc.bed_number
    ) {
      // Create Inpatient Record but with the status Admission Scheduled until the admitting nurse admits the patient
      // Add validation checks before creating an inpatient record
      // Also has a method that auto generates a nursing handsoff file and data can be pushed to it from the multidisciplinary
      console.log("Creating Inpatient Record.....");
      let theatre_booking = ""
      if(frm.doc.theater_booking){
        theatre_booking = frm.doc.theater_booking
      }
      frappe.call({
        method:
          "gch_inpatient.gch_inpatient.doctype.admission_form.admission_form.create_inpatient_record",
        async: false,
        args: {
          "patient": cur_frm.doc.patient,
          "op_encounter": cur_frm.doc.patient_encounter,
          "admission_form_name": cur_frm.doc.name,
          "primary_doctor": cur_frm.doc.doctor,
          "secondary_doctor": cur_frm.doc.admitting_doctor || "",
          "medical_department": cur_frm.doc.ward_station,
          "admission_class": cur_frm.doc.admission_class,
          "ward": cur_frm.doc.ward_station,
          "room_number": cur_frm.doc.room_number,
          "bed_number": frm.doc.bed_number,
          "theatre_booking": theatre_booking
        },
        callback: (res) => {
          frm.set_value("inpatient_record", res.message.name);
          frm.refresh_field("inpatient_record");
          if(res.addmission_type == "Surgery"){
            frappe.call({
              method: "gch_inpatient.services.inpatient_billing.bill_package",
              args: {
                "theatre_booking": theatre_booking,
                "inpatient_record": res.name
              },
              callback: (res) => {
                if(res.message){
                  frappe.show_alert(
                    {
                      message: __("Invoice created."),
                      indicator: "green",
                    },
                    5
                  );
                }
              }
            })
          }else {
            frappe.call({
              method:
                "gch_inpatient.services.inpatient_billing.invoice_inpatient_record_items",
              args: {
                inpatient_record: res.message.name,
              },
              callback: (res) => {
                if (res.message.code == 200) {
                  console.log(res.message.sales_invoice);
                }
                if (res.message.code == 201) {
                  cur_frm.doc.sales_invoice = res.message.sales_invoice;
                  // refresh field
                  cur_frm.reload_doc();
                }
                frappe.show_alert(
                  {
                    message: __(res.message.message),
                    indicator: "green",
                  },
                  5
                );

                // console.log(res);
              },
            });
          }
         

          frappe.msgprint({
            title: __("Notification"),
            indicator: "green",
            message: __("Inpatient Record Created Successfully...."),
          });

          cur_frm.reload_doc();

          // create invoice and assign to patient TODO:
          
        },
        freeze: true,
        freeze_message: __("Generating Inpatient Record"),
      });
    }
  },

  patient_encounter: (frm) => {
    // Check change of field and update to latest encounter number
    // if (frm.doc.patient) {
    //     frappe.call({
    //         method: "gch_custom.gch_custom.doctype.admission_form.admission_form.fetch_latest_outpatient_encounter",
    //         args: {
    //             "patient": frm.doc.patient,
    //             // "patient_uhid" : frm.doc.patient_uhid
    //         },
    //         callback: (res) => {
    //             if(res.message) {
    //                 frm.set_value("patient_encounter", res.message.name)
    //                 frm.refresh_field("patient_encounter")
    //             }
    //         }
    //     })
    // }
  },

  patient: (frm) => {
    // Clear fields whenever the patient is changed to prevent auto filling false information
    for (let i in frm.doc) {
      if (
        i == "fathers_name" ||
        i == "mothers_name" ||
        i == "fathers_phone_number" ||
        i == "mothers_phone_number" ||
        i == "principal_member" ||
        i == "insurance_member_id" ||
        i == "insurance_category" ||
        i == "residence" ||
        i == "principal_member_name"
      ) {
        frm.set_value(i, "");
      }
    }

    // Auto pulling latest encounter when patient is selected from form
    if (frm.doc.patient) {
      frappe.call({
        method:
          "gch_inpatient.gch_inpatient.doctype.admission_form.admission_form.fetch_latest_outpatient_encounter",
        args: {
          patient: frm.doc.patient,
          // "patient_uhid" : frm.doc.patient_uhid
        },
        callback: (res) => {
          if (res.message) {
            frm.set_value("patient_encounter", res.message.name);
            frm.refresh_field("patient_encounter");
          }
          frm.refresh();
        },
      });
    }
  },

  patient_uhid: (frm) => {
    // Add method to search patients through UHID code
    // console.log(frm.doc.patient_uhid)
    frappe.call({
      method:
        "gch_inpatient.gch_inpatient.doctype.admission_form.admission_form.fetch_parent_details",
      args: {
        patient_uhid: cur_frm.doc.patient_uhid,
      },
      freeze: true,
      freeze_message: __("Fetching Parent and Insurance Information"),
      callback: (res) => {
        console.log(res);
        if (res.message) {
          if (res.message.parents) {
            let parent_data = res.message.parents;
            // Looping through parents to fill in Mother and Father Details
            for (let i in parent_data) {
              if (
                parent_data[i].relationship == "Father" ||
                parent_data[i].relationship == "FATHER"
              ) {
                cur_frm.set_value(
                  "fathers_name",
                  parent_data[i].first_name + " " + parent_data[i].last_name
                );
                cur_frm.set_value(
                  "fathers_phone_number",
                  parent_data[i].phone_number
                );
                cur_frm.set_value("fathers_id", parent_data[i].parents);

                cur_frm.refresh_field("fathers_id");
                cur_frm.refresh_field("fathers_name");
                cur_frm.refresh_field("fathers_phone_number");
              } else if (
                parent_data[i].relationship == "Mother" ||
                parent_data[i].relationship == "MOTHER"
              ) {
                cur_frm.set_value(
                  "mothers_name",
                  parent_data[i].first_name + " " + parent_data[i].last_name
                );
                cur_frm.set_value(
                  "mothers_phone_number",
                  parent_data[i].phone_number
                );
                cur_frm.set_value("mothers_id", parent_data[i].parents);

                cur_frm.refresh_field("mothers_name");
                cur_frm.refresh_field("mothers_phone_number");
                cur_frm.refresh_field("mothers_id");
              } else {
                // pass
                // Add code to pull other guadians' info and save them in a html field on form
              }
            }
          }

          // Fetching Residence/Ward information
          if (res.message.ward) {
            cur_frm.set_value("residence", res.message.ward);
          }

          // Setting patient Age
          // Calculate the patient age

          let patient_age = calculate_age(cur_frm.doc.date_of_birth);

          cur_frm.set_value("age", patient_age);
          cur_frm.refresh_field("age");

          // Fetching medical cover details
          if (res.message.patient_medical_cover_details) {
            let cover_details = res.message.patient_medical_cover_details;
            for (let i in cover_details) {
              if (cover_details[i].is_default) {
                cur_frm.set_value(
                  "principal_member",
                  cover_details[i].principal_member
                );
                cur_frm.refresh_field("principal_member");

                cur_frm.set_value(
                  "insurance_member_id",
                  cover_details[i].membership_no
                );
                cur_frm.refresh_field("insurance_member_id");

                console.log(
                  cover_details[i].insurance__scheme,
                  "MEDICAL COVER DETAILS ----------------------"
                );

                cur_frm.set_value(
                  "insurance_category",
                  cover_details[i].insurance__scheme
                );
                cur_frm.refresh_field("insurance_category");
              }
            }
          }
          frappe.show_alert(
            {
              message: __(
                "Parent and Insurance Information fetched successfully"
              ),
              indicator: "green",
            },
            5
          );
        }
      },
    });
  },

  principal_member: (frm) => {
    // Fetching Principal Member Name
    // if (frm.doc.principal_member) {
    //   frappe.call({
    //     method:
    //       "gch_inpatient.gch_inpatient.doctype.admission_form.admission_form.fetch_principal_member_name",
    //     args: { parent: frm.doc.principal_member },
    //     callback: (res) => {
    //       // console.log(res.message)
    //       if (res.message.full_name) {
    //         frm.set_value("principal_member_name", res.message.full_name);
    //         frm.refresh_field("principal_member_name");
    //       }
    //     },
    //   });
    // }
  },

  fill_lodger_form: (frm) => {
    
    if (!cur_frm.doc.lodger_form) {
        frappe.route_options = {
            patient: frm.doc.patient,
            admission_form: frm.doc.name,
            ward_of_preference: frm.doc.actual_patient_ward
        };
        frappe.new_doc("Lodger Form");
    }
    

  },

  show_ward_vacancy: (frm) => {
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
                  console.log(res.message, "hERE......");
                  let occupancy_info_doc = res.message[0];

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
                                                <tr style="${row_wrapper}" id="ward_bed_row-${i}">
                                                    <td>
                                                        <span style="font-size: 12px; font-weight: 500;" class="text-sm"><strong>Room No:</strong> <span id="ward_room_row-${i}">${
                          occupancy_info_doc.bed_details[i].ward_room
                        }</span> </span>
                                                        <br>
                                                        <span style="font-size: 12px; font-weight: 500;" class="text-sm"><strong>Bed:</strong> <span id="bed_number_row-${i}">${
                          occupancy_info_doc.bed_details[i].bed_number
                        }</span> </span>
                                                        <span style="display: none;" id="bed_code_row-${i}">${
                          occupancy_info_doc.bed_details[i].name
                        }</span>
                                                        <br>
                                                        <span style="font-size: 12px; font-weight: 500;" class="text-sm"><strong>Room Type:</strong> <span id="room_category_row-${i}">${
                          occupancy_info_doc.bed_details[i].room_category || ""
                        }</span></span>
                                                    </td>
                                                    <td class="text-center">
                                                        ${gender_icon}  
                                                        <strong>${booked_message} ${patient} ${lodging_message}</strong>
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
                                                        <span style="font-size: 12px; font-weight: 500;" class="text-sm"><strong>Room No:</strong> <span id="ward_room_row-${i}">${
                          occupancy_info_doc.bed_details[i].ward_room
                        }</span> </span>
                                                        <br>
                                                        <span style="font-size: 12px; font-weight: 500;" class="text-sm"><strong>Bed:</strong> <span id="bed_number_row-${i}">${
                          occupancy_info_doc.bed_details[i].bed_number
                        }</span> </span>
                                                        <span style="display: none;" id="bed_code_row-${i}">${
                          occupancy_info_doc.bed_details[i].name
                        }</span>
                                                        <br>
                                                        <span style="font-size: 12px; font-weight: 500;" class="text-sm"><strong>Room Type:</strong> <span id="room_category_row-${i}">${
                          occupancy_info_doc.bed_details[i].room_category || ""
                        }</span></span>
                                                    </td>
                                                    <td class="text-center"> 
                                                        ${gender_icon} 
                                                        <strong>${booked_message} ${patient} ${lodging_message}</strong>
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
                            assign_or_locked_bed = `<button style="font-size: 10px; background: mediumseagreen;" id=${i} onclick="assign_to_bed(${i})" class="btn btn-primary btn-sm">Assign Here</button>`
                        }

                        WARD_BED_ROWS += `
                                                <tr id="ward_bed_row-${i}">
                                                    <td>
                                                        <span style="font-size: 12px; font-weight: 500;" class="text-sm"><strong>Room No:</strong> <span id="ward_room_row-${i}">${
                            occupancy_info_doc.bed_details[i].ward_room
                        }</span> </span>
                                                        <br>
                                                        <span style="font-size: 12px; font-weight: 500;" class="text-sm"><strong>Bed:</strong> <span id="bed_number_row-${i}">${
                            occupancy_info_doc.bed_details[i].bed_number
                        }</span> </span>
                                                        <span style="display: none;" id="bed_code_row-${i}">${
                            occupancy_info_doc.bed_details[i].name
                        }</span>
                                                        <br>
                                                        <span style="font-size: 12px; font-weight: 500;" class="text-sm"><strong>Room Type:</strong> <span id="room_category_row-${i}">${
                            occupancy_info_doc.bed_details[i].room_category || ""
                        }</span></span>
                                                    </td>
                                                    <td class="text-center"></td>
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
                    `
                                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
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
});
