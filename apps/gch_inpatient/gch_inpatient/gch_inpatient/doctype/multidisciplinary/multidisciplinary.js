// Copyright (c) 2023, Redward and contributors
// For license information, please see license.txt

const save_multidisciplinary_row = (frm) => {
    console.log("Firing.....")
    // Save records to multidisciplinary care plan doc

    // Getting user role for color coding
    let user_role;

    if (frappe.user.has_role('GCH-Nurse')) {
        user_role = 'GCH-Nurse'
    }
    else if (frappe.user.has_role('GCH-Doctor')) {
        user_role = 'GCH-Doctor'
    } 
    else if (frappe.user.has_role('GCH-Pharmacy')) {
        user_role = 'GCH-Pharmacy'
    }
    else if (frappe.user.has_role('GCH-Nutrition')) {
        user_role = 'GCH-Nutrition'
    }
    else if (frappe.user.has_role('GCH-Radiology')) {
        user_role = 'GCH-Radiology'
    }
    else if (frappe.user.has_role('GCH-Therapist')) {
        user_role = 'GCH-Therapist'
    }
    else {
        user_role = ''
    }
 
    frappe.call({
        method:"gch_inpatient.gch_inpatient.doctype.multidisciplinary.multidisciplinary.save_multidisciplinary_row",
        args: {
            "parent": cur_frm.doc.name,
            "row_assessment": document.getElementById("multid_assessment").value.replace(/\n/g, "<br/>"),
            "row_diagnosis": document.getElementById("multid_diagnosis").value.replace(/\n/g, "<br/>"),
            "row_care_objectives": document.getElementById("multid_care_objectives").value.replace(/\n/g, "<br/>"),
            "row_patient_order": document.getElementById("multid_patient_order").value.replace(/\n/g, "<br/>"),
            "row_implementation": document.getElementById("multid_implementation").value.replace(/\n/g, "<br/>"),
            "row_evaluation": document.getElementById("multid_evaluation").value.replace(/\n/g, "<br/>"),
            "row_practitioner": frappe.session.user,
            "inpatient_record": cur_frm.doc.inpatient_record,
            "user_type": user_role
        },
        callback: (res) => {
            console.log(res)

            frappe.show_alert(
                {
                  message: __("Row Added Successfully"),
                  indicator: "green",
                },
                5
            );

            // frm.refresh_fields()
            
            // Add new row manually to Multidisciplinary Record Table HTML
            let latest_table_row = $("#multidisciplinary_scrollable_table").find("tr").last()
            
            if (frappe.user.has_role('GCH-Doctor')) {
                //  Get the text from "Patient Orders" field, remove any HTML tags and then set it in Nursing Handoff Tool ONLY FOR DOCTORS)
                console.log("Testing if you get here")
                frappe.call({
                    method: "gch_inpatient.gch_inpatient.doctype.multidisciplinary.multidisciplinary.save_patient_orders_to_handsoff",
                    args: {
                        "patient_order":  document.getElementById("multid_patient_order").value,
                        "patient": cur_frm.doc.patient,
                        "doctors_name": frappe.user.full_name
                    },
                    callback: (res) => {
                        console.log(res, "Here it is......")

                        if (res.message.doctors_instructions) {
                            frappe.show_alert(
                                {
                                  message: __("Patient Order Added to Handsoff Successfully"),
                                  indicator: "green",
                                },
                                5
                            );
                        }
                        else {
                            frappe.show_alert(
                                {
                                  message: __(res),
                                  indicator: "red",
                                },
                                10
                            );
                        }
                        

                    }
                })
            }


            // Fetch current time

            if (frappe.user.has_role('GCH-Nurse')) {
                $(`
                <tr id="" class="nurse-row" style="display: table-row; background: linear-gradient(90deg, #00b3ff38 0%, #53ccf3 72%)">
                            
                    <td style="vertical-align: middle;">
                        <span> ${frappe.session.user}</span>
                        <br><br>
                        <span> ${frappe.datetime.nowdate()} - ${frappe.datetime.now_datetime().split(" ")[1]} </span>
                    </td>

                    <td scope="col">
                        ${document.getElementById("multid_assessment").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_diagnosis").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_care_objectives").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_patient_order").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_implementation").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_evaluation").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col" style="vertical-align: middle;">
                        ${frappe.session.user}
                    </td>
                    
                </tr>
                `).insertAfter(latest_table_row)
            }
            else if (frappe.user.has_role('GCH-Doctor')) {
                $(`
                <tr id="" class="nurse-row" style="display: table-row; background: linear-gradient(90deg, pink 0%, #ffc0cba8 72%);">
                            
                    <td style="vertical-align: middle;">
                        <span> ${frappe.session.user}</span>
                        <br><br>
                        <span> ${frappe.datetime.nowdate()} - ${frappe.datetime.now_datetime().split(" ")[1]} </span>
                    </td>

                    <td scope="col">
                        ${document.getElementById("multid_assessment").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_diagnosis").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_care_objectives").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_patient_order").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_implementation").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_evaluation").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col" style="vertical-align: middle;">
                        ${frappe.session.user}
                    </td>
                    
                </tr>
                `).insertAfter(latest_table_row)


            } 
            else if (frappe.user.has_role('GCH-Pharmacy')) {
                $(`
                <tr id="" class="nurse-row" style="display: table-row; background: linear-gradient(90deg, lightgreen 0%, #90ee9082 72%);">
                            
                    <td style="vertical-align: middle;">
                        <span> ${frappe.session.user}</span>
                        <br><br>
                        <span> ${frappe.datetime.nowdate()} - ${frappe.datetime.now_datetime().split(" ")[1]} </span>
                    </td>

                    <td scope="col">
                        ${document.getElementById("multid_assessment").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_diagnosis").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_care_objectives").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_patient_order").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_implementation").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_evaluation").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col" style="vertical-align: middle;">
                        ${frappe.session.user}
                    </td>
                    
                </tr>
                `).insertAfter(latest_table_row)
            }
            else if (frappe.user.has_role('GCH-Nutrition')) {

                $(`
                <tr id="" class="nurse-row" style="display: table-row; background-color: #c7c70085">
                            
                    <td style="vertical-align: middle;">
                        <span> ${frappe.session.user}</span>
                        <br><br>
                        <span> ${frappe.datetime.nowdate()} - ${frappe.datetime.now_datetime().split(" ")[1]} </span>
                    </td>

                    <td scope="col">
                        ${document.getElementById("multid_assessment").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_diagnosis").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_care_objectives").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_patient_order").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_implementation").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_evaluation").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col" style="vertical-align: middle;">
                        ${frappe.session.user}
                    </td>
                    
                </tr>
                `).insertAfter(latest_table_row)

            }
            // Confirm Therapist Role
            else if (frappe.user.has_role('GCH-Therapist')) {
                $(`
                <tr id="" class="nurse-row" style="display: table-row; background: linear-gradient(90deg, #a52a2a42 0%, #a52a2a54 72%);">
                            
                    <td style="vertical-align: middle;">
                        <span> ${frappe.session.user}</span>
                        <br><br>
                        <span> ${frappe.datetime.nowdate()} - ${frappe.datetime.now_datetime().split(" ")[1]} </span>
                    </td>

                    <td scope="col">
                        ${document.getElementById("multid_assessment").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_diagnosis").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_care_objectives").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_patient_order").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_implementation").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_evaluation").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col" style="vertical-align: middle;">
                        ${frappe.session.user}
                    </td>
                    
                </tr>
                `).insertAfter(latest_table_row)
            }
            else if(frappe.user.has_role("GCH-Radiology")) {
                $(`
                <tr id="" class="nurse-row" style="display: table-row; background: linear-gradient(90deg, #80808047 0%, #8080800d 72%);">
                            
                    <td style="vertical-align: middle;">
                        <span> ${frappe.session.user}</span>
                        <br><br>
                        <span> ${frappe.datetime.nowdate()} - ${frappe.datetime.now_datetime().split(" ")[1]} </span>
                    </td>

                    <td scope="col">
                        ${document.getElementById("multid_assessment").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_diagnosis").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_care_objectives").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_patient_order").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_implementation").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_evaluation").value.replace(/\n/g, "<br/>")}
                    </td>
                    <td scope="col" style="vertical-align: middle;">
                        ${frappe.session.user}
                    </td>
                    
                </tr>
                `).insertAfter(latest_table_row)

            }
            else {
                $(`
                <tr id="" style="display: table-row;">
                            
                    <td style="vertical-align: middle;">
                        <span> ${frappe.session.user}</span>
                        <br><br>
                        <span> ${frappe.datetime.nowdate()} - ${frappe.datetime.now_datetime().split(" ")[1]} </span>
                    </td>

                    <td scope="col">
                        ${document.getElementById("multid_assessment").value}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_diagnosis").value}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_care_objectives").value}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_patient_order").value}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_implementation").value}
                    </td>
                    <td scope="col">
                        ${document.getElementById("multid_evaluation").value}
                    </td>
                    <td scope="col" style="vertical-align: middle;">
                        ${frappe.session.user}
                    </td>
                    
                </tr>
                `).insertAfter(latest_table_row)
            }
            
            // console.log(latest_table_row)

            // Clear fields and refresh tables
            document.getElementById("multid_assessment").value = ""
            document.getElementById("multid_diagnosis").value = ""
            document.getElementById("multid_care_objectives").value = ""
            document.getElementById("multid_patient_order").value = ""
            document.getElementById("multid_implementation").value = ""
            document.getElementById("multid_evaluation").value = ""

            
        }
    })
    

}

window.save_multidisciplinary_row = save_multidisciplinary_row



// BUILDING DIALOGS THAT FETCH AND ENTER NURSING ASSESSMENTS, DIAGNOSIS, CARE OBJECTIVES, IMPLEMENTATION

const show_assessment_options = () => {
    // Run a delayed function that will populate select options for assessments
    setTimeout(function(){
        frappe.call({
            async: false,
            method: "gch_inpatient.gch_inpatient.doctype.multidisciplinary.multidisciplinary.fetch_multidisciplinary_assessments",
            callback: (res) => {
                //console.log(res)
                let dialog_assessment = res.message

                let DIALOG_ASSESSMENT_OPTIONS = ``

                for(let i in dialog_assessment) {
                    DIALOG_ASSESSMENT_OPTIONS += `    
                                                    <p id = "assessment_option_${i}"
                                                          onclick="dialog_assessment_click(${i})">
                                                          <span style="padding: 4px 8px; background: #2490ef; border-radius: 20px; color: white; font-weight: 600; cursor: pointer;">${dialog_assessment[i].name}\n</span>
                                                    </p>
                                            
                                              `
                }

                let DIALOG_ASSESSMENT_LIST =  `
                                                <div id='dialog_assessment_options' style='margin: 18px 0px;'>
                                                    ${DIALOG_ASSESSMENT_OPTIONS}
                                                </div>
                                              `

                assessment_dialog.set_value("assessment_options", DIALOG_ASSESSMENT_LIST)
            }
        })

    }, 500); 


    let assessment_dialog = new frappe.ui.Dialog({
        title: 'Select Assessment',
        fields: [
            // {
            //     label: "Select Patient Assessment",
            //     fieldname: 'select_patient_assessment',
            //     fieldtype: 'Link',
            //     options: 'Patient Assessment Template'
            // },
            // {
            //     label: "Start Patient Assessment",
            //     fieldname: 'start_patient_assessment',
            //     fieldtype: 'Button',
            //     onchange: function(e) {
            //         console.log("Onchange ", this.value);
            //     }
            // },
            {
                label: "Spacer",
                fieldname: 'assessments_spacer',
                fieldtype: 'HTML',
                options: '<p><b>Nursing Assessments</b></p>'
            },
            {
                label: 'Select Assessment',
                fieldname: 'assessment_options',
                fieldtype: 'HTML'
            },
            
        ],
        size: 'small', // small, large, extra-large 
        primary_action_label: 'Enter',
        primary_action(values) {
            console.log(values);
            assessment_dialog.hide();
        }
    });
    
    assessment_dialog.show();
}

const dialog_assessment_click = (dialog_assessment_id) => {
    // console.log(dialog_assessment_id, "Assessment ID")

    let assessment_select_option_value = document.getElementById(`assessment_option_${dialog_assessment_id}`).getElementsByTagName("span")[0].innerHTML
    // // Append assessment to multidisciplinary entry form
    document.getElementById("multid_assessment").value += `\n${assessment_select_option_value}`

    frappe.show_alert(
        {
          message: __("Added Successfully"),
          indicator: "green",
        },
        2
    );

}

window.dialog_assessment_click = dialog_assessment_click
window.show_assessment_options = show_assessment_options



// START OF DIAGNOSIS DIALOG

const show_diagnosis_options = () => {
    // Run a delayed function that will populate select options for diagnosis
    setTimeout(function(){
        frappe.call({
            async: false,
            method: "gch_inpatient.gch_inpatient.doctype.multidisciplinary.multidisciplinary.fetch_multidisciplinary_diagnosis",
            callback: (res) => {
                //console.log(res)
                let dialog_diagnosis = res.message

                let DIALOG_DIAGNOSIS_OPTIONS = ``

                for(let i in dialog_diagnosis) {
                    DIALOG_DIAGNOSIS_OPTIONS += `    
                                                    <p id = "diagnosis_option_${i}"
                                                          onclick="dialog_diagnosis_click(${i})">
                                                          <span style="padding: 4px 8px; background: #2490ef; border-radius: 20px; color: white; font-weight: 600; cursor: pointer;">${dialog_diagnosis[i].name}\n</span>
                                                    </p>
                                                    <br>
                                              `
                }

                let DIALOG_DIAGNOSIS_LIST =  `
                                                <div id='dialog_assessment_options' style='margin: 18px 0px;'>
                                                    ${DIALOG_DIAGNOSIS_OPTIONS}
                                                </div>
                                              `

                diagnosis_dialog.set_value("diagnosis_options", DIALOG_DIAGNOSIS_LIST)
            }
        })

    }, 500); 


    let diagnosis_dialog = new frappe.ui.Dialog({
        title: 'Select Diagnosis',
        fields: [
            {
                fieldtype: 'Link',
                options: 'Medical Code',
                label: 'Enter Diagnosis',
                fieldname: 'enter_multidisciplinary_diagnosis',
                depends_on: frappe.user.has_role("GCH-Doctor")
            },
            // {
            //     label: "Diagnosis Description",
            //     fieldname: 'diagnosis_description',
            //     fieldtype: 'Data',
            //     read_only: 1,
            //     fetch_from: fields.enter_multidisciplinary_diagnosis
            // },
            {
                label: 'Select Diagnosis',
                fieldname: 'diagnosis_options',
                fieldtype: 'HTML',
                depends_on: frappe.user.has_role("GCH-Nurse")
            }
            
        ],
        size: 'small', // small, large, extra-large 
        primary_action_label: 'Enter',
        primary_action(values) {
            console.log(values);
            if(values.enter_multidisciplinary_diagnosis) {
                document.getElementById("multid_diagnosis").value += `\n${values.enter_multidisciplinary_diagnosis}`
            }
            diagnosis_dialog.hide();
        }
    });
    
    diagnosis_dialog.show();
}

const dialog_diagnosis_click = (dialog_diagnosis_id) => {
    // console.log(dialog_assessment_id, "Assessment ID")

    let diagnosis_select_option_value = document.getElementById(`diagnosis_option_${dialog_diagnosis_id}`).getElementsByTagName("span")[0].innerHTML
    // // Append assessment to multidisciplinary entry form
    document.getElementById("multid_diagnosis").value += `\n${diagnosis_select_option_value}`

    frappe.show_alert(
        {
          message: __("Added Successfully"),
          indicator: "green",
        },
        2
    );

}

window.dialog_diagnosis_click = dialog_diagnosis_click
window.show_diagnosis_options = show_diagnosis_options

// end of diagnosis dialogue



// start of care objectives dialog

const show_care_objective_options = () => {
    // Run a delayed function that will populate select options for care_objective
    setTimeout(function(){
        frappe.call({
            async: false,
            method: "gch_inpatient.gch_inpatient.doctype.multidisciplinary.multidisciplinary.fetch_multidisciplinary_care_objectives",
            callback: (res) => {
                //console.log(res)
                let dialog_care_objective = res.message

                let DIALOG_CARE_OBJECTIVE_OPTIONS = ``

                for(let i in dialog_care_objective) {
                    DIALOG_CARE_OBJECTIVE_OPTIONS += `    
                                                    <p id = "care_objective_option_${i}"
                                                          onclick="dialog_care_objective_click(${i})">
                                                          <span style="padding: 4px 8px; background: #2490ef; border-radius: 20px; color: white; font-weight: 600; cursor: pointer;">${dialog_care_objective[i].name}\n</span>
                                                    </p>
                                                    <br>
                                              `
                }

                let DIALOG_CARE_OBJECTIVE_LIST =  `
                                                <div id='dialog_care_objective_options' style='margin: 18px 0px;'>
                                                    ${DIALOG_CARE_OBJECTIVE_OPTIONS}
                                                </div>
                                              `

                care_objective_dialog.set_value("care_objective_options", DIALOG_CARE_OBJECTIVE_LIST)
            }
        })

    }, 500); 


    let care_objective_dialog = new frappe.ui.Dialog({
        title: 'Select Care Objective',
        fields: [
            {
                label: 'Select Care Objective',
                fieldname: 'care_objective_options',
                fieldtype: 'HTML'
            },
            
        ],
        size: 'small', // small, large, extra-large 
        primary_action_label: 'Enter',
        primary_action(values) {
            console.log(values);
            care_objective_dialog.hide();
        }
    });
    
    care_objective_dialog.show();
}

const dialog_care_objective_click = (dialog_care_objective_id) => {
    // console.log(dialog_assessment_id, "Assessment ID")

    let care_objective_select_option_value = document.getElementById(`care_objective_option_${dialog_care_objective_id}`).getElementsByTagName("span")[0].innerHTML
    // // Append assessment to multidisciplinary entry form
    document.getElementById("multid_care_objectives").value += `\n${care_objective_select_option_value}`

    frappe.show_alert(
        {
          message: __("Added Successfully"),
          indicator: "green",
        },
        2
    );

}

window.dialog_care_objective_click = dialog_care_objective_click
window.show_care_objective_options = show_care_objective_options

// end of care objectives dialog



// start of implementation dialog

const show_patient_order_options = () => {
    // Run a delayed function that will populate select options for implementation
    setTimeout(function(){
        frappe.call({
            async: false,
            method: "gch_inpatient.gch_inpatient.doctype.multidisciplinary.multidisciplinary.fetch_multidisciplinary_patient_orders",
            callback: (res) => {
                //console.log(res)
                let dialog_implementation = res.message

                let DIALOG_IMPLEMENTATION_OPTIONS = ``

                for(let i in dialog_implementation) {
                    DIALOG_IMPLEMENTATION_OPTIONS += `    
                                                    <p style="margin-bottom: 16px;" id = "implementation_option_${i}"
                                                          onclick="dialog_implementation_click(${i})">
                                                          <span style="padding: 4px 8px; background: #2490ef; border-radius: 20px; color: white; font-weight: 600; cursor: pointer;">${dialog_implementation[i].name}\n</span>
                                                    </p>
                                                    
                                              `
                }

                let DIALOG_IMPLEMENTATION_LIST =  `
                                                <div id='dialog_implementation_options' style='margin: 18px 0px;'>
                                                    ${DIALOG_IMPLEMENTATION_OPTIONS}
                                                </div>
                                              `

                implementation_dialog.set_value("implementation_options", DIALOG_IMPLEMENTATION_LIST)
            }
        })

    }, 500); 


    let implementation_dialog = new frappe.ui.Dialog({
        title: 'Select Patient Order',
        fields: [
            {
                label: 'Select Implementation',
                fieldname: 'implementation_options',
                fieldtype: 'HTML'
            },
            
        ],
        size: 'small', // small, large, extra-large 
        primary_action_label: 'Enter',
        primary_action(values) {
            console.log(values);
            implementation_dialog.hide();
        }
    });
    
    implementation_dialog.show();
}

const dialog_implementation_click = (dialog_implementation_id) => {
    // console.log(dialog_assessment_id, "Assessment ID")

    let implementation_select_option_value = document.getElementById(`implementation_option_${dialog_implementation_id}`).getElementsByTagName("span")[0].innerHTML
    // // Append assessment to multidisciplinary entry form
    document.getElementById("multid_implementation").value += `\n${implementation_select_option_value}`

    frappe.show_alert(
        {
          message: __("Item Added Successfully"),
          indicator: "green",
        },
        5
    );

}

window.dialog_implementation_click = dialog_implementation_click
window.show_patient_order_options = show_patient_order_options

// end of implementation dialog


// BUILDING DIALOGS THAT FETCH AND ENTER NURSING ASSESSMENTS, DIAGNOSIS, CARE OBJECTIVES, IMPLEMENTATION




const BUILD_TABLE_ROWS = (frm) => {
    
        let ROWS = '';

        if (cur_frm.doc.multidisciplinary_care_plan_table) {

            // Order table rows in order of creation
            let multi_care_plan_table = cur_frm.doc.multidisciplinary_care_plan_table
            
            var sortedKeys = Object.keys(multi_care_plan_table).sort(function(a, b) {
                return new Date(multi_care_plan_table[a].creation) - new Date(multi_care_plan_table[b].creation)
            })



            // console.log(sortedKeys)

            for (let index in sortedKeys) {
                // console.log(sortedKeys[index])
                let index_item = sortedKeys[index]
                console.log(index_item, "==================")
                let single_row = cur_frm.doc.multidisciplinary_care_plan_table[index_item];

                console.log(single_row)

                if (single_row.user_type == "GCH-Nurse") {
                    ROWS += (`
                        <tr id="__${single_row.name}" style="background: linear-gradient(90deg, #00b3ff38 0%, #53ccf3 72%)">
                            
                            <td style="vertical-align: middle;">
                                <span> ${single_row.owner}</span>
                                <br><br>
                                <span> ${single_row.date} - ${single_row.time.split(".")[0]} </span>
                            </td>
                
                            <td scope="col">
                                ${single_row.assessment}
                            </td>
                            <td scope="col">
                                ${single_row.diagnosis}
                            </td>
                            <td scope="col">
                                ${single_row.care_objectives}
                            </td>
                            <td scope="col">
                                ${single_row.patient_order}
                            </td>
                            <td scope="col">
                                ${single_row.implementation}
                            </td>
                            <td scope="col">
                                ${single_row.evaluation}  
                            </td>
                            <td scope="col" style="vertical-align: middle;">
                                ${single_row.practitioner}
                            </td>
                            
                        </tr>
                    `);
                }
                else if (single_row.user_type == "GCH-Doctor") {
                    ROWS += (`
                        <tr id="__${single_row.name}" style="background: pink">
                            
                            <td style="vertical-align: middle;">
                                <span> ${single_row.owner}</span>
                                <br><br>
                                <span> ${single_row.date} - ${single_row.time.split(".")[0]} </span>
                            </td>
                
                            <td scope="col">
                                ${single_row.assessment}
                            </td>
                            <td scope="col">
                                ${single_row.diagnosis}
                            </td>
                            <td scope="col">
                                ${single_row.care_objectives}
                            </td>
                            <td scope="col">
                                ${single_row.patient_order}
                            </td>
                            <td scope="col">
                                ${single_row.implementation}
                            </td>
                            <td scope="col">
                                ${single_row.evaluation}  
                            </td>
                            <td scope="col" style="vertical-align: middle;">
                                ${single_row.practitioner}
                            </td>
                            
                        </tr>
                    `);
                }
                else if (single_row.user_type == "GCH-Pharmacy") {
                    ROWS += (`
                        <tr id="__${single_row.name}" style="background-color: #3aaf3a8c">
                            
                            <td style="vertical-align: middle;">
                                <span> ${single_row.owner}</span>
                                <br><br>
                                <span> ${single_row.date} - ${single_row.time.split(".")[0]} </span>
                            </td>
                
                            <td scope="col">
                                ${single_row.assessment}
                            </td>
                            <td scope="col">
                                ${single_row.diagnosis}
                            </td>
                            <td scope="col">
                                ${single_row.care_objectives}
                            </td>
                            <td scope="col">
                                ${single_row.patient_order}
                            </td>
                            <td scope="col">
                                ${single_row.implementation}
                            </td>
                            <td scope="col">
                                ${single_row.evaluation}  
                            </td>
                            <td scope="col" style="vertical-align: middle;">
                                ${single_row.practitioner}
                            </td>
                            
                        </tr>
                    `);
                }
                else if (single_row.user_type == "GCH-Nutritionist") {
                    ROWS += (`
                        <tr id="__${single_row.name}" style="background-color: #c7c70085">
                            
                            <td style="vertical-align: middle;">
                                <span> ${single_row.owner}</span>
                                <br><br>
                                <span> ${single_row.date} - ${single_row.time.split(".")[0]} </span>
                            </td>
                
                            <td scope="col">
                                ${single_row.assessment}
                            </td>
                            <td scope="col">
                                ${single_row.diagnosis}
                            </td>
                            <td scope="col">
                                ${single_row.care_objectives}
                            </td>
                            <td scope="col">
                                ${single_row.patient_order}
                            </td>
                            <td scope="col">
                                ${single_row.implementation}
                            </td>
                            <td scope="col">
                                ${single_row.evaluation}  
                            </td>
                            <td scope="col" style="vertical-align: middle;">
                                ${single_row.practitioner}
                            </td>
                            
                        </tr>
                    `);
                }
                else 
                {

                    ROWS += (`
                        <tr id="__${single_row.name}">
                            
                            <td style="vertical-align: middle;">
                                <span> ${single_row.owner}</span>
                                <br><br>
                                <span> ${single_row.date} - ${single_row.time.split(".")[0]} </span>
                            </td>
                
                            <td scope="col">
                                ${single_row.assessment}
                            </td>
                            <td scope="col">
                                ${single_row.diagnosis}
                            </td>
                            <td scope="col">
                                ${single_row.care_objectives}
                            </td>
                            <td scope="col">
                                ${single_row.patient_order}
                            </td>
                            <td scope="col">
                                ${single_row.implementation}
                            </td>
                            <td scope="col">
                                ${single_row.evaluation}  
                            </td>
                            <td scope="col" style="vertical-align: middle;">
                                ${single_row.practitioner}
                            </td>
                            
                        </tr>
                    `);

                } 
                

            }

            return ROWS;
       
            // for (let index = 0; index < frm.doc.multidisciplinary_care_plan_table.length; index++) {

            

                

            //     // console.log(single_row, "Here ----- row -----")

            //     const stringfied_row = JSON.stringify(single_row);
            //     // console.log(single_row, "single_row", stringfied_row);
            
                // ROWS += (`
                //     <tr id="__${single_row.name}">
                        
                //         <td style="vertical-align: middle;">
                //             <span> ${single_row.owner}</span>
                //             <br><br>
                //             <span> ${single_row.date} - ${single_row.time.split(".")[0]} </span>
                //         </td>
            
                //         <td scope="col">
                //             ${single_row.assessment}
                //         </td>
                //         <td scope="col">
                //             ${single_row.diagnosis}
                //         </td>
                //         <td scope="col">
                //             ${single_row.care_objectives}
                //         </td>
                //         <td scope="col">
                //             ${single_row.patient_order}
                //         </td>
                //         <td scope="col">
                //             ${single_row.evaluation}
                //         </td>
                //         <td scope="col">
                //             ${single_row.implementation}  
                //         </td>
                //         <td scope="col" style="vertical-align: middle;">
                //             ${single_row.practitioner}
                //         </td>
                        
                //     </tr>
                // `);
            
            //     // <button class="btn btn-primary" style="font-size: 8px"
            //     // onclick="handleDuplicate('${encodeURIComponent(stringfied_row)}')"
            //     // >Duplicate</button>
            // }
            // return ROWS;
        }
};


const BUILD_INPUT_TABLE_ROWS = (frm) => {
    
    let ROWS = [];
   
   
    ROWS.push(`
        <tr">
            <td scope="col">
                <textarea id="multid_assessment" class="form-control"></textarea>
            </td>

            <td scope="col">
            <textarea id="multid_diagnosis" class="form-control"></textarea>
            </td>
            <td scope="col">
            <textarea id="multid_care_objectives" class="form-control"></textarea>
            </td>
            <td scope="col">
            <textarea id="multid_patient_order" class="form-control"></textarea>
            </td>
            <td scope="col">
            <textarea id="multid_implementation" class="form-control"></textarea>  
            </td>
            <td scope="col">
            <textarea id="multid_evaluation" class="form-control"></textarea>
            </td>
            <td  scope="col" style="vertical-align: middle;">
            <button class="btn btn-primary btn-sm" onclick="save_multidisciplinary_row()">Save</button>
            </td>
            
        </tr>
    `);
   
      // <button class="btn btn-primary" style="font-size: 8px"
      // onclick="handleDuplicate('${encodeURIComponent(stringfied_row)}')"
      // >Duplicate</button>
    
    return ROWS;
};

const BUILD_MULTIDISCIPLINARY_HTML = (frm) => {
    console.log("Here")

    let TABLE_ROWS = BUILD_TABLE_ROWS(frm)

    const HTML_TEMPLATE = `
        <div id="multidisciplinary_scrollable_table" class="mb-4">
            <table class="table table-bordered table-hover">
                <thead>
                    <tr>
                        <th scope="col"></th>
                        <th scope="col">Assessment</th>
                        <th scope="col">Diagnosis/Condition</th>
                        <th scope="col">Care Objectives</th>
                        <th scope="col">Patient Orders/Nursing Plan of Action</th>
                        <th scope="col">Nursing Actions/<br>Implementation</th>
                        <th scope="col">Evaluation/<br>Progress Note</th>
                        <th scope="col">Practitioner</th> 
                    </tr>
                </thead>
                <tbody id="dynamic_purchase_receipt_table">
                    ${TABLE_ROWS}
                </tbody>
            </table>
        </div>
    `

    $(frm.fields_dict["multidisciplinary_table"].wrapper).prepend(HTML_TEMPLATE);
}

const BUILD_MULTIDISCIPLINARY_INPUT_HTML = (frm) => {
    console.log("Here")

    let INPUT_ROWS = BUILD_INPUT_TABLE_ROWS(frm)

    const HTML_TEMPLATE = `
        <div id="pharmacy_scrollable_table" class="mb-4">
            <table style="background: #2490ef33;" class="table table-bordered table-hover">
                <thead>
                    <tr>
                        <th scope="col"><span style="color: #078ed6; cursor: pointer;" onclick="show_assessment_options()">Assessment</span></th>
                        <th scope="col"><span style="color: #078ed6; cursor: pointer;" onclick="show_diagnosis_options()">Diagnosis/Condition</span></th>
                        <th scope="col"><span style="color: #078ed6; cursor: pointer;" onclick="show_care_objective_options()">Care Objectives</span></th>
                        <th scope="col"><span style="color: #078ed6; cursor:pointer;" onclick="show_patient_order_options()">Patient Orders/<br>Nursing Plan of Action</span></th>
                        <th scope="col"><span>Nursing Actions/<br>Implementation</span></th>
                        <th scope="col"><span>Evaluation/<br>Progress Note</span></th>
                        <th scope="col"></th> 
                    </tr>
                </thead>
                <tbody id="dynamic_purchase_receipt_table">
                    ${INPUT_ROWS}
                </tbody>
            </table>
        </div>
    `

    $(frm.fields_dict["multidisciplinary_table_input"].wrapper).prepend(HTML_TEMPLATE);
}

window.BUILD_MULTIDISCIPLINARY_HTML = BUILD_MULTIDISCIPLINARY_HTML
window.BUILD_MULTIDISCIPLINARY_INPUT_HTML = BUILD_MULTIDISCIPLINARY_INPUT_HTML
window.BUILD_TABLE_ROWS = BUILD_TABLE_ROWS



frappe.ui.form.on('Multidisciplinary', {
	// refresh: function(frm) {
    //     console.log('Reading from app......')
	// }
    setup: (frm) => {
        // Loading tinymce editor synchronusly
        // let tinymce = document.createElement("script");
        // tinymce.setAttribute(
        // "src",
        // "/assets/gch_inpatient/js/multidisciplinary/tinymce/tinymce.min.js"
        // );
        // tinymce.async = false;
        // document.body.appendChild(tinymce);


        // frappe.require(
        //     "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
        //     () => {
        //       handleHighlightedMenu(cur_frm);
        //     }
        // );

        

    },
    onload: (frm) => {
        const PAGE_WRAPPER = document.querySelector(".page-body");
        PAGE_WRAPPER.classList.remove("container");
        PAGE_WRAPPER.classList.add("m-4");
    },


    refresh: (frm) => {
        const PAGE_WRAPPER = document.querySelector(".page-body");
        PAGE_WRAPPER.classList.remove("container");
        PAGE_WRAPPER.classList.add("m-4");

        $('.prev-doc, .next-doc').hide();


        // Loading Highlighted Menu
        frappe.require(
            "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
            () => {
              handleHighlightedMenu(cur_frm);
            }
        );

        

        // $(frm.fields_dict["multidisciplinary_table"].wrapper).remove()
        // $(frm.fields_dict["multidisciplinary_table_input"].wrapper).remove()
        
        // Clearing the html tables before  reloading them again with new data
        cur_frm.fields_dict["multidisciplinary_table"].wrapper.innerHTML = ""
        cur_frm.fields_dict["multidisciplinary_table_input"].wrapper.innerHTML = ""

        BUILD_MULTIDISCIPLINARY_HTML(frm)
        BUILD_MULTIDISCIPLINARY_INPUT_HTML(frm)


        // Bill Items
        frappe.require(
            "/assets/gch_inpatient/js/inpatient_record/inpatient_create_invoice.js",
            () => {
              handle_inpatient_create_invoice(cur_frm,true);
            }
        );

        // Building list of Nursing tools
        if(!cur_frm.doc.__islocal) {
            
            // Handsoff Tool
            frm.add_custom_button(__("NURSING HANDSOFF TOOL"), function () {
                
                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record
                };
                frappe.new_doc("Nursing Handsoff Tool");

            }, __("NURSING TOOLS")); 

            // OPD FALLS RISK ASSESSMENT
            frm.add_custom_button(__("OPD FALLS RISK ASSESSMENT TOOL"), function () {
                
                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    is_inpatient : 1,
                    assessment_template: "OutPatient Falls Risk Assessment"
                    // assessment_branch: frm.doc.branch,
                };
                frappe.new_doc("Patient Assessment");

            }, __("NURSING TOOLS"));

            // INPATIENT FALLS RISK ASSESSMENT
            frm.add_custom_button(__("INPATIENT FALLS RISK ASSESSMENT TOOL"), function () {
                
                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    is_inpatient : 1,
                    assessment_template: "InPatient Falls Risk Assessment"
                    // assessment_branch: frm.doc.branch,
                };
                frappe.new_doc("Patient Assessment");

            }, __("NURSING TOOLS"));

            // FLACC Pain Management tool
            frm.add_custom_button(__("PAIN ASSESSMENT TOOL - FLACC"), function () {
                
                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    is_inpatient : 1,
                    assessment_template: "Pain Assessment - FLACC"
                    // assessment_branch: frm.doc.branch,
                };
                frappe.new_doc("Patient Assessment");

            }, __("NURSING TOOLS"));

            // NEONATAL PAIN ASSESSMENT
            frm.add_custom_button(__("PAIN ASSESSMENT TOOL - NEONATAL"), function () {
                
                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    is_inpatient : 1,
                    assessment_template: "Pain Assessment - Neonatal"
                    // assessment_branch: frm.doc.branch,
                };
                frappe.new_doc("Patient Assessment");

            }, __("NURSING TOOLS"));

            // WONG BAKER PAIN ASSESSMENT
            frm.add_custom_button(__("PAIN ASSESSMENT TOOL - WONG BAKER FACES"), function () {
                
                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    is_inpatient : 1,
                    assessment_template: "Pain Assessment - Wong Baker Face"
                    // assessment_branch: frm.doc.branch,
                };
                frappe.new_doc("Patient Assessment");

            }, __("NURSING TOOLS"));

            // Numeric scale pain assessment
            frm.add_custom_button(__("PAIN ASSESSMENT TOOL - NUMERIC SCALE"), function () {
                
                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    is_inpatient : 1,
                    assessment_template: "Pain Assessment - Numeric Scale"
                    // assessment_branch: frm.doc.branch,
                };
                frappe.new_doc("Patient Assessment");

            }, __("NURSING TOOLS"));

            // PEADEATRIC EARLY WARNING
            frm.add_custom_button(__("PAEDIATRIC EARLY WARNING SIGNS CHART"), function () {
                
                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    is_inpatient : 1,
                    assessment_template: "Paedriatic Early Warning"
                    // assessment_branch: frm.doc.branch,
                };
                frappe.new_doc("Patient Assessment");

            }, __("NURSING TOOLS"));

            // Cauti prevention checklist
            frm.add_custom_button(__("CAUTI PREVENTION CHECKLIST"), function () {

                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    is_inpatient : 1,
                    checklist_template: "GCH-NCT-10898 : Urinary catheter care bundle (CAUTI)"
                    // assessment_branch: frm.doc.branch,
                };
                frappe.new_doc("Nursing Checklist");


            }, __("NURSING TOOLS"));

            // Central line insertion checklist
            frm.add_custom_button(__("CENTRAL LINE INSERTION CHECKLIST"), function () {

                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    is_inpatient : 1,
                    wardroombed: frm.doc.ward_station.split("-")[1] + "/" + frm.doc.room_no + "/" + frm.doc.bed_number,
                    consulting_doctor: frm.doc.primary_practitioner
                    

                    // assessment_branch: frm.doc.branch,
                };
                frappe.new_doc("CENTRAL LINE INSERTION CHECKLIST");

            }, __("NURSING TOOLS"));

            // Central Line maintanance bundle checklist
            frm.add_custom_button(__("CENTRAL LINE MAINTENANCE BUNDLE CHECKLIST"), function () {
                
                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    is_inpatient : 1,
                    checklist_template: "GCH-NCT-11846 : Central Line (CLABSI) Care Bundle"
                    // assessment_branch: frm.doc.branch,
                };
                frappe.new_doc("Nursing Checklist");

            }, __("NURSING TOOLS"));

            // SSI prevenetion Checklist
            frm.add_custom_button(__("SSI PREVENTION CHECKLIST"), function () {
                
                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    is_inpatient : 1,
                    checklist_template: "GCH-NCT-10900 : Surgical Site Infections (SSI) bundle"
                    // assessment_branch: frm.doc.branch,
                };
                frappe.new_doc("Nursing Checklist");

            }, __("NURSING TOOLS"));

            // Ventilator bundle
            frm.add_custom_button(__("VENTILLATOR BUNDLE CHECKLIST"), function () {

                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    is_inpatient : 1,
                    wardroombed: frm.doc.ward_station.split("-")[1] + "/" + frm.doc.room_no + "/" + frm.doc.bed_number,
                    consulting_doctor: frm.doc.primary_practitioner
                    
                };
                frappe.new_doc("VENTILATOR BUNDLE CHECKLIST");

            }, __("NURSING TOOLS"));

            // Pre-procedure and timeout checklist for thratre surgical procedures
            frm.add_custom_button(__("PRE-PROCEDURE AND TIMEOUT CHECKLIST FOR OUT OF THEATRE SURGICAL PROCEDURES"), function () {
                // TO DO


            }, __("NURSING TOOLS"));

            // PERIPHERAL VENOUS CATHETER INSERTION CHECKLIST 
            frm.add_custom_button(__("PERIPHERAL VENOUS CATHETER INSERTION CHECKLIST"), function () {
                
                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    wardroombed: frm.doc.ward_station.split("-")[1] + "/" + frm.doc.room_no + "/" + frm.doc.bed_number,
                    consulting_doctor: frm.doc.primary_practitioner
                };
                frappe.new_doc("PERIPHERAL VENOUS CATHETER INSERTION CHECKLIST");
                

            }, __("NURSING TOOLS"));

            // PERIPHERAL VENOUS CATHETER CARE BUNDLE CHECKLIST 
            frm.add_custom_button(__("PERIPHERAL VENOUS CATHETER CARE BUNDLE CHECKLIST"), function () {
                
                // CONFIRM ON EXISTANCE OF TEMPLATE BUNDLE DATA
                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    wardroombed: frm.doc.ward_station.split("-")[1] + "/" + frm.doc.room_no + "/" + frm.doc.bed_number,
                    consulting_doctor: frm.doc.primary_practitioner
                };
                frappe.new_doc("PERIPHERAL VENOUS CATHETER CARE BUNDLE");


            }, __("NURSING TOOLS"));

            // NUTRITION SCREENING
            frm.add_custom_button(__("NUTRITION SCREENING"), function () {
                

                frappe.route_options = {
                    patient: frm.doc.patient,
                    inpatient_record: frm.doc.inpatient_record,
                    is_inpatient : 1,
                    wardroombed: frm.doc.ward_station.split("-")[1] + "/" + frm.doc.room_no + "/" + frm.doc.bed_number,
                    consulting_doctor: frm.doc.primary_practitioner
                    

                    // assessment_branch: frm.doc.branch,
                };
                frappe.new_doc("NUTRITION SCREENING TOOL");

            }, __("NURSING TOOLS"));

            // Neurological observation chart
            frm.add_custom_button(__("NEUROLOGICAL OBSERVATION CHART"), function () {
                // TO DO DATA UPLOAD


            }, __("NURSING TOOLS"));
        }
        
        
        // $('button[data-fieldname="pull_data_to_multidisciplinary"]').css('background-color', '#ff12ff')

        
    },

    pull_data_to_multidisciplinary: (frm) => {
        // frappe.msgprint("Pulling External Multidisciplinary Data");

        let d = new frappe.ui.Dialog({
            title: 'Pull Data to Multidisciplinary',
            fields: [
                {
                    label: 'Select Section',
                    fieldname: 'select_section',
                    fieldtype: 'Select',
                    options: ['Assessment', 'Diagnosis/Condition', 'Care Objectives', 'Patient Orders', 'Nursing Actions/Implementation', 'Evaluation/Progress Note'],
                    reqd: 1
                },
                {
                    label: 'Select Data to Pull',
                    fieldname: 'select_data',
                    fieldtype: 'Select',
                    options: ['Patient Assessments', 'Vitals', 'Treatment Sheet', 'I/O Chart', 'Lab Tests'],
                }
            ],
            size: 'small', // small, large, extra-large 
            primary_action_label: 'Submit',
            primary_action(values) {
                console.log(values);

                // Pulling Assessments Data
                let pulling_assessments = () => {
                    frappe.call({
                        method: "gch_inpatient.overrides.inpatient_record.encounter_assessments",
                        async: false,
                        args: {
                          encounter: cur_frm.doc.inpatient_record,
                        },
                    
                        callback: function (data) {
                          let assessments = data.message;
                          
                          // Checking assessments that haven't been pulled to Multidisciplinary Page
                          for (let assessment in assessments) {
                              // console.log(assessments[assessment])
                              if(assessments[assessment].pulled_to_multidisciplinary == 0) {
                                  console.log(assessments[assessment])
                                  
                                  document.getElementById(section_holder).value += assessments[assessment].assessment_template + ' - ' + assessments[assessment].total_score_obtained + '\n'
                  
                                }
                            }
                            frappe.show_alert(
                                {
                                message: __("Assessments Added Successfully"),
                                indicator: "green",
                                },
                                5
                            );
                        }
                    })
                }
                

                // Fetching Vitals Data from Inpatient Record to populate multidisciplinary
                let pulling_vitals = () => {
                    frappe.call({
                        'method': 'gch_inpatient.gch_inpatient.doctype.multidisciplinary.multidisciplinary.fetch_vitals_from_inpatient_record',
                        args: {
                            "inpatient_record": cur_frm.doc.inpatient_record
                        },
                        callback: (res) => {
                            console.log(res, "Vitals--------------------------")
                            let vitals_list = res.message
                            
                            for (let vital_row in vitals_list) {
                                console.log(vitals_list[vital_row], "Vital row")
    
                                document.getElementById(section_holder).value += 'Temperature: ' + vitals_list[vital_row].patient_encounter_temperature + "\n"
                                document.getElementById(section_holder).value += 'Heart Rate: ' + vitals_list[vital_row].patient_encounter_heart_rate + "\n"
                                document.getElementById(section_holder).value += 'Respiratory Rate: ' + vitals_list[vital_row].patient_encounter_respiratory_rate + "\n"
                                document.getElementById(section_holder).value += 'Oxygen Saturation: ' + vitals_list[vital_row].patient_encounter_percutaneous_oxygen + "\n\n"
                            }
                            frappe.show_alert(
                                {
                                message: __("Vitals Added Successfully"),
                                indicator: "green",
                                },
                                5
                            );
                        }
                    })
                }

                // Setting check for section selected to populate it with pulled data
                let section_holder

                if (values.select_section == 'Assessment') {
                    section_holder = "multid_assessment"

                    if (values.select_data == "Patient Assessments") {
                        pulling_assessments()
                    } else if (values.select_data == "Vitals") {
                        pulling_vitals()
                    }

                } else if (values.select_section == 'Diagnosis/Condition') {
                    section_holder = "multid_diagnosis"

                    if (values.select_data == "Patient Assessments") {
                        pulling_assessments()
                    } else if (values.select_data == "Vitals") {
                        pulling_vitals()
                    }


                } else if (values.select_section == 'Care Objectives') {
                    section_holder = "multid_care_objectives"

                    if (values.select_data == "Patient Assessments") {
                        pulling_assessments()
                    } else if (values.select_data == "Vitals") {
                        pulling_vitals()
                    }


                } else if (values.select_section == 'Patient Orders') {
                    section_holder = 'multid_patient_order'

                    if (values.select_data == "Patient Assessments") {
                        pulling_assessments()
                    } else if (values.select_data == "Vitals") {
                        pulling_vitals()
                    }
                    

                } else if (values.select_section == 'Nursing Actions/Implementation') {
                    section_holder = 'multid_implementation'

                    if (values.select_data == "Patient Assessments") {
                        pulling_assessments()
                    } else if (values.select_data == "Vitals") {
                        pulling_vitals()
                    }


                } else if (values.select_section == 'Evaluation/Progress Note') {
                    section_holder = 'multid_evaluation'

                    if (values.select_data == "Patient Assessments") {
                        pulling_assessments()
                    } else if (values.select_data == "Vitals") {
                        pulling_vitals()
                    }

                }

                


                d.hide();
            }
        });
        
        d.show();

        
        
    }
});
