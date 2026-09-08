const nonreqd = [
  "country",
  "county",
  "religion",
  "primary_language",
  "requires_support_to_fill_out_form_options",
  "requires_translation_options",
  "uses_assistive_devices_in_movement_options",
  "requires_support_to_move_around_options",
  "cultural_or_religious_preferences_options",
  "requires_assistive_communication_devices_options",
  "consent_to_receive_communication_options"
]


const regex = /^[a-zA-Z]\w+/g;

// Validates name contains only letters
let validate_name = function (name) {
  let valid = name.match(regex)?.length >= 0;
  return valid;
};

// Calculate the patient age
let calculate_age = function (birth) {
  let ageMS = Date.parse(Date()) - Date.parse(birth);
  let gch_patient_age = new Date();
  gch_patient_age.setTime(ageMS);
  let years = gch_patient_age.getFullYear() - 1970;

  return `${years} ${__("Year(s)")} ${gch_patient_age.getMonth()} ${__(
    "Month(s)"
  )} ${gch_patient_age.getDate()} ${__("Day(s)")}`;
};

let checkIsAdult = function (dateOfBirth) {
  let ageMS = Date.parse(Date()) - Date.parse(dateOfBirth);
  let gch_patient_age = new Date();
  gch_patient_age.setTime(ageMS);
  let years = gch_patient_age.getFullYear() - 1970;
  return years >= 21 ? 1 : 0;
};

// creating variable that will check if any of the names was editted
let fname_change = false;
let mname_change = false;
let lname_change = false;

function search_kranium_uhid(frm, kranium_uhid) {
  frappe.show_alert({
    message: __(`Searching for UHID ${kranium_uhid}...`),
    indicator: 'green'
  }, 5);
  frappe
    .call({
      method: "gch_middleware.services.search_patient_kranium",
      type: "POST",
      args: {
        uhid_code: kranium_uhid,
      },
    })
    .done((r) => {
      let response = r.message;
      let patient_details = response.patient;
      if (patient_details && Object.keys(patient_details).length > 0) {
        let dialog = new frappe.ui.Dialog({
          title: `Patient Details - via ${response?.via}`,
          fields: [
            { fieldtype: 'Data', fieldname: 'uhid', label: 'UHID', default: patient_details.uhid, read_only: 1 },
            { fieldtype: 'Link', options: 'Title', fieldname: 'title', label: 'Title', default: patient_details.title },
            { fieldtype: 'Data', fieldname: 'first_name', label: 'First Name', default: patient_details.first_name },
            { fieldtype: 'Data', fieldname: 'middle_name', label: 'Middle Name', default: patient_details.middle_name },
            { fieldtype: 'Data', fieldname: 'last_name', label: 'Last Name', default: patient_details.last_name },
            { fieldtype: 'Link', options: 'Gender', fieldname: 'gender', label: 'Gender', default: patient_details.gender },
            { fieldtype: 'Column Break' },
            { fieldtype: 'Date', fieldname: 'date_birth', label: 'Date of Birth', default: patient_details.date_birth },
            { fieldtype: 'Date', fieldname: 'registration_date', label: 'Registration Date', default: patient_details.registration_date, read_only: 1 },
            { fieldtype: 'Data', fieldname: 'country_code', label: 'Country Code',  },
            { fieldtype: 'Data', fieldname: 'cell_phone', label: 'Cell Phone', default: patient_details.cellphone },
            { fieldtype: 'Data', fieldname: 'phone', label: 'Phone', default: patient_details.phone },
            { fieldtype: 'Data', fieldname: 'email', label: 'Email', default: patient_details.email },
            { fieldtype: 'Data', fieldname: 'address', label: 'Address', default: patient_details.address },
          ],
          primary_action_label: 'Update and Save',
          primary_action: function () {
            let updated_patient_details = dialog.get_values();
            let merged_patient_details = { ...patient_details, ...updated_patient_details };
            console.log(merged_patient_details);
            frappe.call({
              method: "gch_custom.services.update_save_kranium",
              type: "POST",
              args: {
                data: merged_patient_details,
              },
              callback: function (response) {
                // Handle the response from the server
                console.log(response);
              },
            });
            dialog.hide();
          }
        });

        dialog.show();
      }
      else {
        frappe.show_alert({
          message: __(`No Patient with UHID ${kranium_uhid} found`),
          indicator: 'green'
        }, 5);
      }
    }).fail(() => {
      // Hide the searching indicator dialog if the call fails
      frappe.show_progress('An error occurred while searching for patient details.', 100, 100, 'Please wait', true)
      frappe.msgprint('An error occurred while searching for patient details.');
    });
}




frappe.ui.form.on("Patient", {

  onload(frm) {

    nonreqd.forEach((field) => {
      frm.set_df_property(field, "reqd", 0);
      frm.refresh_field(field);
    });
    
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
    }

    // Hiding Heatmap Overview Section
    $(".form-heatmap").hide()

  },

  refresh(frm) {
    // make all fields non mandatory
    nonreqd.forEach((field) => {
      frm.set_df_property(field, "reqd", 0);
      frm.refresh_field(field);
    });

    // Checking if patient is above 21 years to auto check the is_adult flag
    if(checkIsAdult(cur_frm.doc.dob) == 1) {
        frappe.model.set_value(
            frm.doctype,
            frm.docname,
            "is_adult",
            checkIsAdult(frm.doc.dob)
        );
    }

    frm.fields_dict['kranium_uhid'].$input.on('keydown', function (e) {
      if (e.key === 'Enter' && this.value && this === document.activeElement) {
        e.preventDefault();
        search_kranium_uhid(frm, this.value);

      }
    });
    if (frm.doc.dob) {
      let gch_patient_age = calculate_age(frm.doc.dob);
      frm.set_value("gch_patient_age", gch_patient_age);
      cur_frm.doc.gch_patient_age = gch_patient_age;
    }
    cur_frm.doc.uhid = cur_frm.doc.uhid_code;
    cur_frm.refresh_field("uhid");

    // Filter to only show insurance categories that have NOT been suspended
    frm.fields_dict["patient_medical_cover_details"].grid.get_field(
      "insurance__scheme"
    ).get_query = function (doc, cdt, cdn) {
      return {
        filters: [["suspend", "in", ["0"]]],
      };
    };

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
    }


    // Hiding Heatmap Overview Section
    $(".form-heatmap").hide()


    // Adding Fetch Kranium UHID button
    if(!cur_frm.doc.kranium_uhid) {
        frm.add_custom_button(
            __("Fetch Kranium UHID"),
            () => {
            // frappe.msgprint({
            //     title: __('Notification'),
            //     indicator: 'green',
            //     message: __('Fetching Possible Matches...')
            // });

            let first_name = cur_frm.doc.first_name
            let middle_name = cur_frm.doc.middle_name
            let last_name = cur_frm.doc.last_name
            let date_birth = cur_frm.doc.dob
            let gender = '';
            let phone_number = ''

            if (cur_frm.doc.sex ==  "Male"){
                gender = "m"
            }
            if (cur_frm.doc.sex == "Female") {
                gender = "f"
            }

            // if (cur_frm.doc.parents) {
            //     phone_number = cur_frm.doc.parents[0].phone_number
            // }

              
            frappe
                .call({
                method: "gch_custom.services.get_possible_patient_matches",
                args: { 
                    "first_name": first_name,
                    "middle_name": middle_name,
                    "last_name": last_name,
                    "dob": date_birth, 
                    "gender": gender
                },
                })
                .done((r) => {
                // append respose to child table
                const data = r.message;

                console.log(data)
                
                if (data.patients.length > 0) {
                    // BUILDING HTML WITH SELECT OPTIONS FOR EACH PATIENT FOUND
                    let patient_match_row = ``

                    for (let row in data.patients){
                        let patient = data.patients[row]

                        let patient_gender = ''

                        if (patient.gender == "f") {
                            patient_gender = "Female"
                        }
                        else if (patient_gender == 'm') {
                            patient_gender = "Male"
                        }

                        patient_match_row += `
                            <tr>
                                <td class='text-center'>
                                    <input type="radio" id="${patient.UHID}" name="selected_patient" value="patient-${patient.UHID}">  
                                </td>

                                <td>
                                    <p>${patient.first_name}</p>
                                </td>

                                <td>
                                    <p>${patient.middle_name}</p>
                                </td>

                                <td>
                                    <p>${patient.last_name}</p>
                                </td>

                                <td>
                                    <p>${patient.date_birth}</p>
                                </td>

                                <td>
                                    <p>${patient.UHID}</p>
                                </td>

                                <td>
                                    <p>${patient_gender}</p>
                                </td>

                                <td>
                                    <p>${patient.address}</p>
                                </td>
                                
                            </tr>
                        `
                    }


                    let patient_posslble_matches_holder = `
                    <div class="row">
                        <table class="table table-bordered table-hover">
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>First Name</th>
                                    <th>Middle Name</th>
                                    <th>Last Name</th>
                                    <th>DOB</th>
                                    <th>UHID</th>
                                    <th>Gender</th>
                                    <th>Address</th>
                                </tr>
                            </thead>
                            `+ patient_match_row + `
                        </table>
                    </div>
                    `
                    
                    for (let patient in data.patients) {
                        console.log(data.patients[patient])
                    }

                    let possible_patient_match_dialog = new frappe.ui.Dialog({
                        title: 'Select Possible Patient Match From Kranium',
                        fields: [
                            {
                                label: 'Select A Possible Match From Kranium',
                                fieldname: 'patient_match_list',
                                fieldtype: 'HTML',
                                options: patient_posslble_matches_holder
                            }
                        ],
                        size: 'large', // small, large, extra-large 
                        primary_action_label: 'Submit',
                        primary_action(values) {
                            console.log(values);
                            
                            let selected_patient = $('input[name="selected_patient"]:checked').val();

                            console.log(selected_patient, "SELECTED PATIENT")

                            cur_frm.set_value("kranium_uhid", selected_patient.split("-")[1])

                            frappe.call({
                                method: "gch_custom.services.rest.update_patient_kranium_uhid",
                                args: {
                                    "patient": cur_frm.doc.name,
                                    "patient_kranium_uhid" : selected_patient.split("-")[1]
                                },
                                callback : (res) => {

                                    if (res.message == true) {
                                        frappe.msgprint({
                                            title: __('Notification'),
                                            indicator: 'green',
                                            message: __('Kranium UHID updated successfully')
                                        });
                                        window.reload
                                    }
                                    
                                }
                            })
                            cur_frm.set_value("kramium", selected_patient.split("-")[1])
                            cur_frm.refresh_field("kranium_uhid")
                            possible_patient_match_dialog.hide();
                        }
                    });
                    
                    possible_patient_match_dialog.show();
                } else {
                    frappe.msgprint("No Possible Patient Match Found");
                }

                
            
                // data.forEach((history) => {
                //     console.log(history);
            
                //     const childTable = cur_frm.add_child("kranium_physican_exams_table");
                //     childTable.kranium_encounter = history.encounter;
                //     childTable.seen_by = history.seen_by;
                //     childTable.description = history.description;
                //     childTable.kranium_uhid = history.uhid;
                //     childTable.encounter_date = convertDate(history.encounter_date);
                //     childTable.medication =
                //     history.medication.length > 0
                //         ? history.medication
                //             .map(
                //             (med) =>
                //                 `${med["Dosage"]} - ${med["Drug Name"]} (${med["Product Type"]}) : ${med["Frequency"]} for ${med["Duration"]}`
                //             )
                //             .join("\r\n")
                //         : "No Medication";
                // });
            
                // cur_frm.refresh_fields("kranium_physican_exams_table");
                // frappe.msgprint({
                //     title: __("Success"),
                //     indicator: "green",
                //     message: __("Patient physical examinations fetched successfully"),
                // });
            });

            // frappe.call({
            //     method: "",
            //     args: {
            //         "first_name": first_name,
            //         "middle_name": middle_name,
            //         "last_name": last_name,
            //         "date_birth": date_birth,
            //         "gender": gender,
            //         "phone_number": phone_number
            //     },
            //     callback: function(res) {

            //     }
            // })

            // frappe.call({
            //     method: "gch_custom.services.test_presc",
            //     callback: (res) => {
            //     console.log(res);
            //     }
            // })
            }
        );
    }

  },
  validate: function (frm) {
    // checking if any of the names was changed to update all existing encounters, invoices and patient fields
    // if (fname_change || mname_change || lname_change) {
    //   let patient_id = frm.doc.uhid_code
    //   let new_fname = frm.doc.first_name.charAt(0).toUpperCase() + frm.doc.first_name.slice(1)
    //   let new_mname = frm.doc.middle_name.charAt(0).toUpperCase() + frm.doc.middle_name.slice(1) || (frm.doc.last_name[0]).toUpperCase()
    //   let new_lname = frm.doc.last_name.charAt(0).toUpperCase() + frm.doc.last_name.slice(1)

    //   let new_full_name = new_fname + " " + new_mname + " " + new_lname

    //   console.log(new_full_name)
    //   console.log("Updating name in encounters")

    //   frappe
    //   .call({
    //     method: "gch_custom.services.rest.update_encounters_on_name_change",
    //     args: { patient_id, new_fname, new_mname, new_lname },
    //   })
    //   .done((r) => {
    //     let encounter_list = r.message;
    //     console.log(encounter_list)
    //   });

    // } else {
    //   pass
    // }

    if (frm.doc.first_name && !validate_name(frm.doc.first_name)) {
      frappe.msgprint(__("Invalid First Name"));
      frappe.validated = false;
    }

    if (frm.doc.last_name && !validate_name(frm.doc.last_name)) {
      frappe.msgprint(__("Invalid Last Name"));
      frappe.validated = false;
    }

    if (frm.doc.dob > frappe.datetime.add_days(frappe.datetime.get_today(), -(365 * 18))) {
      if (frm.doc.is_adult) {
        frappe.msgprint(__("You can not save a child as an Adult"));
        frappe.validated = false;
      }
    }
    if (frm.doc.parents?.length > 0) {
      let there_is_primary_parent = false;
      frm.doc.parents.map((parent) => {
        if (parent.is_primary == 1) {
          there_is_primary_parent = true;
          return;
        }
      });
      if (!there_is_primary_parent) {
        frappe.msgprint(__("You must have atleast one parent as primary"));
        frappe.validated = false;
      }
    }
  },
  // checking if the name fields have been editted and setting the checker to true
  //   first_name: function(frm) {
  //     fname_change = true
  //     console.log("fname editted", fname_change)
  //   },

  //   middle_name: function(frm) {
  //     mname_change = true
  //     console.log("mname editted", mname_change)
  //   },

  //   last_name:function(frm) {
  //     lname_change = true
  //     console.log("lname editted", lname_change)
  //   },

  dob: function (frm) {
    frappe.model.set_value(
      frm.doctype,
      frm.docname,
      "is_adult",
      checkIsAdult(frm.doc.dob)
    );

    // Updating all encounters with the set age and dob of patient
    let patient_id = cur_frm.doc.uhid_code
    let patient_dob = cur_frm.doc.dob
    let patient_age = calculate_age(frm.doc.dob)

    let encounter_list;

    // checking whether document has been saved
    if (!cur_frm.doc.__islocal) {
      frappe
        .call({
          method: "gch_custom.services.rest.get_encounter_list",
          args: { patient_id, patient_dob, patient_age },
        })
        .done((r) => {
          encounter_list = r.message;
        });
    }

  },

  is_staff: function (frm) {
    console.log("here",frm.doc.is_staff);
    let staff_status = 0;
    staff_status = frm.doc.is_staff
    if(staff_status == 1){
      frm.set_value("customer_group","Gertrudes Staff");
      frm.refresh_field("customer_group")
    }else {
      frm.set_value("customer_group","");
      frm.refresh_field("customer_group")
    }
  },



  county: function (frm) {
    if (cur_frm.doc.county) {
      frm.set_query("town", function () {
        return {
          filters: [["county", "in", [cur_frm.doc.county]]],
        };
      });
      // frm.set_query("ward", function () {
      //   return {
      //     filters: [["county", "in", [cur_frm.doc.county]]],
      //   };
      // });
    }
  },
  town: function (frm) {
    if (cur_frm.doc.town) {
      frm.set_query("ward", function () {
        return {
          filters: [["town", "in", [cur_frm.doc.town]]],
        };
      });
    }
  },
  religion: function (frm) {
    if (cur_frm.doc.religion) {
      frm.set_query("denomination", function () {
        return {
          filters: [["religion", "in", [cur_frm.doc.religion]]],
        };
      });
    }
  },
});
const get_parent_employers = async (parent) => {
  let parent_employer_list;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_parent_employers",
      args: { parent },
    })
    .done((r) => {
      parent_employer_list = r.message;
    });
  return parent_employer_list;
};

frappe.ui.form.on("Parent Medical Cover Detail", {
  patient_medical_cover_details_add(frm, cdt, cdn) {
    // let companyArray = [];
    // if (cur_frm.doc.is_adult) {
    //   let companies = cur_frm.doc._employer_details;
    //   if (companies.length > 0) {
    //     companies.forEach((s_company) => {
    //       companyArray.push(s_company.employer);
    //     });
    //   }
    // } else {
    //   const parentsArray = frm.doc.parents;
    //   if (frm.doc.parents.length > 0) {
    //     frm.doc.parents.map(async (parent) => {
    //       let parentId = parent.parents;
    //       let employerDb = await get_parent_employers(parentId);
    //       employerDb.map((employerDetails) => {
    //         companyArray.push(employerDetails.employer);
    //       });
    //     });
    //     console.log(companyArray);
    //   }
    // }
    // frm.fields_dict["patient_medical_cover_details"].grid.get_field(
    //   "insurance__scheme"
    // ).get_query = function (doc, cdt, cdn) {
    //   var child = locals[cdt][cdn];
    //   //console.log(child);
    //   if (companyArray.length > 0) {
    //     const employers = companyArray.filter(
    //       (value, index, self) => self.indexOf(value) === index
    //     );
    //     return {
    //       filters: [["corporate_company", "in", [...employers, "General"]]],
    //     };
    //   }
    //   return {
    //     filters: [["corporate_company", "in", ["General"]]],
    //   };
    // };
  },
});

const EmergencyDialog = new frappe.ui.Dialog({
  title: "Pinpad Details",
  fields: [
    {
      label: "Phone Number",
      fieldname: "phone_number",
      fieldtype: "Link",
      options: "Patient Encounter",
    },
    {
      label: "Amount",
      fieldname: "amount",
      fieldtype: "Int",
    },
  ],
  primary_action_label: "Send Payment Request",
  primary_action(values) {
    console.log(values);
    EmergencyDialog.hide();
    frappe.msgprint({
      title: "Success",
      indicator: "green",
      message: "Credit Card Payment Initiated, Please Swipe Card on Device",
    });
    frappe.call({
      method: "gch_custom.services.request_pdq",
      args: {
        phone_number: values.phone_number,
        amount: values.amount,
      },
      callback: function (r) {
        const { message } = r;
        frappe.msgprint({
          title: "Success",
          indicator: "green",
          message: message,
        });
      },
    });
  },
});

frappe.listview_settings["Patient"] = {
  onload(listview) {
    // triggers once before the list is loaded
    console.log("loaded", listview);
    listview.page.add_action_item("My custom Action", () =>
      my_action_handler()
    );
    listview.page.set_secondary_action(
      "Add Emergency Patient",
      () => EmergencyDialog.show(),
      "octicon octicon-sync"
    );
  },
};
