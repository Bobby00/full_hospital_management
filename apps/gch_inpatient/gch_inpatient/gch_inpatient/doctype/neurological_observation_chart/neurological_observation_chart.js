// Copyright (c) 2023, Redward and contributors
// For license information, please see license.txt

let update_field_value = (selected) => {
    console.log(selected.value, "Fiiiirring!!!!!!!!")
    console.log(selected.id)

    let selected_option = selected.value
    let selected_id = selected.id

    cur_frm.set_value(selected_id, selected_option)
    cur_frm.refresh_field(selected_id)

}

window.update_field_value = update_field_value


frappe.ui.form.on('NEUROLOGICAL OBSERVATION CHART', {
	refresh: function(frm) {
        if (cur_frm.doc.inpatient_record && cur_frm.doc.inpatient_record != "") {
            frappe.require(
              "/assets/gch_inpatient/js/inpatient_record_utils.js",
              () => {
                block_nurse_from_editing(frm);
              }
            );
        }

        // Hiding encounter side nav, but can be reopened
        $('.layout-side-section').css("display","none")

        
        

        // Clearing tables to avoid duplication after save
        cur_frm.fields_dict["neurological_observation_html"].wrapper.innerHTML = ""

        // BUILDING NEUROLOGICAL OBSERVATION CHART HTML TABLE
        let NEUROLOGICAL_OBSERVATION_HTML_TABLE = `
        <table style="background: lightskyblue" class="table table-bordered">

            <tr style="background-color: darksalmon;">
                <th>Diagnosis</th>
                <th></th>
                <th></th>
            </tr>

            <tr>
                <th>Glascow Coma Scale - Mark with X in the row of the appropriate score below</th>
                <th></th>
                <th></th>
            </tr>

            <tr>
                <td style="vertical-align: middle;">EYE OPENING</td>
                <td>
                    <select id="eye_opening" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.eye_opening ? cur_frm.doc.eye_opening: ""}</option>
                        <option value="Spontenous - 4">Spontenous - 4</option>
                        <option value="To Speech - 3">To Speech - 3</option>
                        <option value="To Pain - 2">To Pain - 2</option>
                        <option value="None - 1">None - 1</option>
                        <option value="Not Applicable - 0">Not Applicable - 0</option>
                    </select>
                </td>
                <td>
                    score: ${cur_frm.doc.eye_opening ? cur_frm.doc.eye_opening.split("-")[1]: ""}
                </td>
            </tr>

            <tr>
                <td>BEST MOTOR RESPONSE</td>
                <td>
                    <select id="best_motor_response" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.best_motor_response ? cur_frm.doc.best_motor_response: ""}</option>
                        <option value="Obey's Commands - 6">Obey's Commands - 6</option>
                        <option value="Localizes Pain - 5">Localizes Pain - 5</option>
                        <option value="Withdraws from Pain - 4">Withdraws from Pain - 4</option>
                        <option value="Flexion to pain - 3">Flexion to pain - 3</option>
                        <option value="Extenstion to pain - 1">Extenstion to pain - 1</option>
                        <option value="None - 0">None - 0</option>
                    </select>
                </td>
                <td>
                    score: ${cur_frm.doc.best_motor_response ? cur_frm.doc.best_motor_response.split("-")[1]: ""}
                </td>
            </tr>

            <tr>
                <td>BEST VERBAL RESPONSE AGE BELOW 2YR</td>
                <td>
                    <select id="best_verbal_response_age_below_2yr" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.best_verbal_response_age_below_2yr ? cur_frm.doc.best_verbal_response_age_below_2yr: ""}</option>
                        <option value="Smiles, listens, follows - 5">Smiles, listens, follows - 5</option>
                        <option value="Cries consolably - 4">Cries consolably - 4</option>
                        <option value="Inappropriate persistent cry - 3">Inappropriate persistent cry - 3</option>
                        <option value="Agitated or restless - 2">Agitated or restless - 2</option>
                        <option value="None - 1">None - 1</option>
                        <option value="Not Applicable - 0">Not Applicable - 0</option>
                    </select>
                </td>
                <td>
                    score: ${cur_frm.doc.best_verbal_response_age_below_2yr ? cur_frm.doc.best_verbal_response_age_below_2yr.split("-")[1]: ""}
                </td>
            </tr>

            <tr>
                <td>BEST VERBAL RESPONSE AGE ABOVE 2YR</td>
                <td>
                    <select id="best_verbal_response_age_above_2yr" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.best_verbal_response_age_above_2yr ? cur_frm.doc.best_verbal_response_age_above_2yr: ""}</option>
                        <option value="Smiles, listens, follows - 5">Smiles, listens, follows - 5</option>
                        <option value="Cries consolably - 4">Cries consolably - 4</option>
                        <option value="Inappropriate persistent cry - 3">Inappropriate persistent cry - 3</option>
                        <option value="Agitated or restless - 2">Agitated or restless - 2</option>
                        <option value="None - 1">None - 1</option>
                        <option value="Not Applicable - 0">Not Applicable - 0</option>
                    </select>
                </td>
                <td>
                    score: ${cur_frm.doc.best_verbal_response_age_above_2yr ? cur_frm.doc.best_verbal_response_age_above_2yr.split("-")[1]: ""}
                </td>
            </tr>

            <tr>
                <td>GLASCOW COMA SCALE SCORE (Maximum  15)</td>
                <td>
                    <input type="text" value="${cur_frm.doc.the_glascow_coma_scale_score ? cur_frm.doc.the_glascow_coma_scale_score: ""}" id="the_glascow_coma_scale_score" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>
                <td>
                    Scale score: ${cur_frm.doc.the_glascow_coma_scale_score ? cur_frm.doc.the_glascow_coma_scale_score: ""}
                </td>
            </tr>

            <tr>
                <td style="vertical-align: middle;">PUPILS</td>
                <td>
                    
                    <table style="background: lightskyblue" class="table table-bordered">

                
                        <tr>
                            <td>Brisk - ++</td>
                            <td rowspan="2" style="vertical-align: middle;">Right</td>
                            <td>Size - mm</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.right_pupil_size ? cur_frm.doc.right_pupil_size: ""}" id="right_pupil_size" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>


                        <tr>
                            <td>Sluggish - +</td>
                            
                            <td>Reaction</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.right_pupil_reaction ? cur_frm.doc.right_pupil_reaction: ""}" id="right_pupil_reaction" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>

                        <tr>
                            <td>No reaction --</td>
                            <td rowspan="2" style="vertical-align: middle;">Left</td>
                            <td>Size - mm</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.left_pupil_size ? cur_frm.doc.left_pupil_size: ""}" id="left_pupil_size" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>

                        <tr>
                            <td>Eyes closed - C</td>
                            
                            <td>Reaction</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.left_pupil_reaction ? cur_frm.doc.left_pupil_reaction: ""}" id="left_pupil_reaction" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>
            
                        
                    </table> 

                </td>
                <td>
                     
                </td>
            </tr>

            <tr>
                <td style="vertical-align: middle;">LIMB MOVEMENTS</td>
                <td>

                    <table style="background: lightskyblue" class="table table-bordered">

                
                        <tr>
                            <td rowspan="6" style="vertical-align: middle;">ARMS - Record R or L to indicate side if assymetric</td>
                            <td></td>
                            <td>R</td>
                            <td>L</td>
                        </tr>

                        <tr>
                            
                            <td>Normal Power</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.right_arm_normal_power ? cur_frm.doc.right_arm_normal_power: ""}" id="right_arm_normal_power" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                            
                            <td>
                                <input type="text" value="${cur_frm.doc.left_arm_normal_power ? cur_frm.doc.left_arm_normal_power: ""}" id="left_arm_normal_power" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>

                        <tr>
                            
                            <td>Severe Weakness</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.right_arm_severe_weakness ? cur_frm.doc.right_arm_severe_weakness: ""}" id="right_arm_severe_weakness" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                            
                            <td>
                                <input type="text" value="${cur_frm.doc.left_arm_severe_weakness ? cur_frm.doc.left_arm_severe_weakness: ""}" id="left_arm_severe_weakness" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>

                        <tr>
                            
                            <td>Spastic Flexion</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.right_arm_spastic_flexion ? cur_frm.doc.right_arm_spastic_flexion: ""}" id="right_arm_spastic_flexion" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                            
                            <td>
                                <input type="text" value="${cur_frm.doc.left_arm_spastic_flexion ? cur_frm.doc.left_arm_spastic_flexion: ""}" id="left_arm_spastic_flexion" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>

                        <tr>
                            
                            <td>Extension</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.right_arm_extension ? cur_frm.doc.right_arm_extension: ""}" id="right_arm_extension" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                            
                            <td>
                                <input type="text" value="${cur_frm.doc.left_arm_extension ? cur_frm.doc.left_arm_extension: ""}" id="left_arm_extension" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>

                        <tr>
                            
                            <td>No response</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.right_arm_no_response ? cur_frm.doc.right_arm_no_response: ""}" id="right_arm_no_response" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                            
                            <td>
                                <input type="text" value="${cur_frm.doc.left_arm_no_response ? cur_frm.doc.left_arm_no_response: ""}" id="left_arm_no_response" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>
            
                        
                    </table>

                    <table style="background: lightskyblue" class="table table-bordered">

            
                        <tr>
                            <td style="vertical-align: middle;" rowspan="6">LEGS - Record R or L to indicate side if assymetric</td>
                            <td></td>
                            <td>R</td>
                            <td>L</td>
                        </tr>

                        <tr>
                            
                            <td>Normal Power</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.right_leg_normal_power ? cur_frm.doc.right_leg_normal_power: ""}" id="right_leg_normal_power" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                            
                            <td>
                                <input type="text" value="${cur_frm.doc.left_leg_normal_power ? cur_frm.doc.left_leg_normal_power: ""}" id="left_leg_normal_power" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>

                        <tr>
                            
                            <td>Mild Weakness</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.right_leg_mild_weakness ? cur_frm.doc.right_leg_mild_weakness: ""}" id="right_leg_mild_weakness" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                            
                            <td>
                                <input type="text" value="${cur_frm.doc.left_leg_mild_weakness ? cur_frm.doc.left_leg_mild_weakness: ""}" id="left_leg_mild_weakness" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>

                        <tr>
                            
                            <td>Severe Weakness</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.right_leg_severe_weakness ? cur_frm.doc.right_leg_severe_weakness: ""}" id="right_leg_severe_weakness" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                            
                            <td>
                                <input type="text" value="${cur_frm.doc.left_leg_severe_weakness ? cur_frm.doc.left_leg_severe_weakness: ""}" id="left_leg_severe_weakness" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>

                        <tr>
                            
                            <td>Extension</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.right_leg_extension ? cur_frm.doc.right_leg_extension: ""}" id="right_leg_extension" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                            
                            <td>
                                <input type="text" value="${cur_frm.doc.left_leg_extension ? cur_frm.doc.left_leg_extension: ""}" id="left_leg_extension" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>

                        <tr>
                            
                            <td>No response</td>
                            <td>
                                <input type="text" value="${cur_frm.doc.right_leg_no_response ? cur_frm.doc.right_leg_no_response: ""}" id="right_leg_no_response" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                            
                            <td>
                                <input type="text" value="${cur_frm.doc.left_leg_no_response ? cur_frm.doc.left_leg_no_response: ""}" id="left_leg_no_response" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                            </td>
                        </tr>
            
                        
                    </table>
                    
                </td>
                <td>
                    
                </td>
            </tr>

            
        </table>
        
        `
        $(frm.fields_dict["neurological_observation_html"].wrapper).prepend(NEUROLOGICAL_OBSERVATION_HTML_TABLE);
	},
    inpatient_record: (frm) => {
        if (cur_frm.doc.inpatient_record && cur_frm.doc.inpatient_record != "") {
          frappe.require(
            "/assets/gch_inpatient/js/inpatient_record_utils.js",
            () => {
              block_nurse_from_editing(frm);
            }
          );

          frappe.call({
            method: "gch_inpatient.gch_inpatient.doctype.central_line_insertion_checklist.central_line_insertion_checklist.fetching_triage_information",
            args: {
            "inpatient_record": frm.doc.inpatient_record,
            },
            callback: function (res) {
            // console.log(res.message, "Triage Info Response");

            // Popping only the latest record
            let latest_vitals = res.message.vital_signs_table.pop()
            let latest_anthro = res.message.anthropometry_details.pop()

            
            
            cur_frm.set_value("weight", latest_anthro.weight_in_kilograms)
            cur_frm.set_value("height", latest_anthro.height_in_centimeters)
            cur_frm.set_value("bmi", latest_anthro.bmi)
            cur_frm.set_value("bsa", latest_anthro.bsa)
            cur_frm.set_value("temperature", latest_vitals.patient_encounter_temperature)

            }
        })

        }
    },
    eye_opening: (frm) => {
        // Populating Glascow Coma Scale Score
        let total_glascow_score = 0;

        if (cur_frm.doc.eye_opening) {
            total_glascow_score += parseInt(cur_frm.doc.eye_opening.split("-")[1])
        }

        if (cur_frm.doc.best_motor_response) {
            total_glascow_score += parseInt(cur_frm.doc.best_motor_response.split("-")[1])
        }

        if (cur_frm.doc.best_verbal_response_age_below_2yr) {
            total_glascow_score += parseInt(cur_frm.doc.best_verbal_response_age_below_2yr.split("-")[1])
        }

        if (cur_frm.doc.best_verbal_response_age_above_2yr) {
            total_glascow_score += parseInt(cur_frm.doc.best_verbal_response_age_above_2yr.split("-")[1])
        }

        cur_frm.set_value("the_glascow_coma_scale_score", total_glascow_score)
        cur_frm.refresh_field("the_glascow_coma_scale_score")
    },
    best_motor_response: (frm) => {
        // Populating Glascow Coma Scale Score
        let total_glascow_score = 0;

        if (cur_frm.doc.eye_opening) {
            total_glascow_score += parseInt(cur_frm.doc.eye_opening.split("-")[1])
        }

        if (cur_frm.doc.best_motor_response) {
            total_glascow_score += parseInt(cur_frm.doc.best_motor_response.split("-")[1])
        }

        if (cur_frm.doc.best_verbal_response_age_below_2yr) {
            total_glascow_score += parseInt(cur_frm.doc.best_verbal_response_age_below_2yr.split("-")[1])
        }

        if (cur_frm.doc.best_verbal_response_age_above_2yr) {
            total_glascow_score += parseInt(cur_frm.doc.best_verbal_response_age_above_2yr.split("-")[1])
        }

        cur_frm.set_value("the_glascow_coma_scale_score", total_glascow_score)
        cur_frm.refresh_field("the_glascow_coma_scale_score")
    },

    best_verbal_response_age_below_2yr: (frm) => {
        // Populating Glascow Coma Scale Score
        let total_glascow_score = 0;

        if (cur_frm.doc.eye_opening) {
            total_glascow_score += parseInt(cur_frm.doc.eye_opening.split("-")[1])
        }

        if (cur_frm.doc.best_motor_response) {
            total_glascow_score += parseInt(cur_frm.doc.best_motor_response.split("-")[1])
        }

        if (cur_frm.doc.best_verbal_response_age_below_2yr) {
            total_glascow_score += parseInt(cur_frm.doc.best_verbal_response_age_below_2yr.split("-")[1])
        }

        if (cur_frm.doc.best_verbal_response_age_above_2yr) {
            total_glascow_score += parseInt(cur_frm.doc.best_verbal_response_age_above_2yr.split("-")[1])
        }

        cur_frm.set_value("the_glascow_coma_scale_score", total_glascow_score)
        cur_frm.refresh_field("the_glascow_coma_scale_score")
    },
    best_verbal_response_age_above_2yr: (frm) => {
        // Populating Glascow Coma Scale Score
        let total_glascow_score = 0;

        if (cur_frm.doc.eye_opening) {
            total_glascow_score += parseInt(cur_frm.doc.eye_opening.split("-")[1])
        }

        if (cur_frm.doc.best_motor_response) {
            total_glascow_score += parseInt(cur_frm.doc.best_motor_response.split("-")[1])
        }

        if (cur_frm.doc.best_verbal_response_age_below_2yr) {
            total_glascow_score += parseInt(cur_frm.doc.best_verbal_response_age_below_2yr.split("-")[1])
        }

        if (cur_frm.doc.best_verbal_response_age_above_2yr) {
            total_glascow_score += parseInt(cur_frm.doc.best_verbal_response_age_above_2yr.split("-")[1])
        }

        cur_frm.set_value("the_glascow_coma_scale_score", total_glascow_score)
        cur_frm.refresh_field("the_glascow_coma_scale_score")
    },

    best_verbal_response_age_above_2yr: (frm) => {
        // Populating Glascow Coma Scale Score
        let total_glascow_score = 0;

        if (cur_frm.doc.eye_opening) {
            total_glascow_score += parseInt(cur_frm.doc.eye_opening.split("-")[1])
        }

        if (cur_frm.doc.best_motor_response) {
            total_glascow_score += parseInt(cur_frm.doc.best_motor_response.split("-")[1])
        }

        if (cur_frm.doc.best_verbal_response_age_below_2yr) {
            total_glascow_score += parseInt(cur_frm.doc.best_verbal_response_age_below_2yr.split("-")[1])
        }

        if (cur_frm.doc.best_verbal_response_age_above_2yr) {
            total_glascow_score += parseInt(cur_frm.doc.best_verbal_response_age_above_2yr.split("-")[1])
        }

        cur_frm.set_value("the_glascow_coma_scale_score", total_glascow_score)
        cur_frm.refresh_field("the_glascow_coma_scale_score")
    },

    on_submit: (frm) => {
        frappe.call({
            method: "gch_custom.gch_custom.doctype.nursing_checklist.nursing_checklist.creating_completed_nursing_tools",
            args: {
                "inpatient_record": cur_frm.doc.inpatient_record,
                "tool_name": cur_frm.doc.doctype,
                "tool_id": cur_frm.doc.name,
                "tool_link": `<a href='/app/neurological-observation-chart/${cur_frm.doc.name}'><p style='color: blue;'>View</p></a>`
            },
            callback: (res) => {
                console.log(res, "============= SUBMITTEDDD ==========")
            }
        })
    }
});
