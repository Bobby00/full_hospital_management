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


frappe.ui.form.on('CENTRAL LINE INSERTION CHECKLIST', {
    
	refresh: function(frm) {

        if(cur_frm.doc.__islocal && !cur_frm.doc.items){
            console.log("Add procedure item...")

            let procedure_item_row = cur_frm.get_field("items").grid.add_new_row()

            // Fetch Peripheral venous catheter care bundle
            let item_doc;

            frappe.db.get_doc("Item", "CENTRAL LINE INSERTION").then( (res) => {
                console.log(res)
                
                procedure_item_row.item_code = res.item_code
                procedure_item_row.item_name = res.item_name
                procedure_item_row.uom = res.uoms[0].uom
                procedure_item_row.qty = 1

                console.log("here")

                cur_frm.refresh_field("items")
            } )
            

        }

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
        cur_frm.fields_dict["timeout_html_table"].wrapper.innerHTML = ""
        cur_frm.fields_dict["procedure_html_table"].wrapper.innerHTML = ""
        cur_frm.fields_dict["post_procedure_html_table"].wrapper.innerHTML = ""

        if(cur_frm.doc.inpatient_record) {
            cur_frm.set_value("is_inpatient", 1)
        }

        
        // BUILDING TIMEOUT HTML TABLE
        let TIMEOUT_HTML_TABLE = `
            <table style="background: lightskyblue" class="table table-bordered">
                <tr>
                    <td>
                        Correct patient verified by using two (2) patient identifiers
                    </td>

                    <td>
                        <select id="correct_patient_verified_by_using_two_2_patient_identifiers" onchange="update_field_value(this)" data-fieldtype="Select" class="input-with-feedback form-control ellipsis">
                            <option value="">${cur_frm.doc.correct_patient_verified_by_using_two_2_patient_identifiers ? cur_frm.doc.correct_patient_verified_by_using_two_2_patient_identifiers: ""}</option>
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                        </select>
                    </td>

                </tr>

                <tr>
                    <td>
                        Correct site identified
                    </td>

                    <td>
                        <select onchange="update_field_value(this)" id="correct_site_identified" class="input-with-feedback form-control ellipsis">
                            <option value="">${cur_frm.doc.correct_site_identified ? cur_frm.doc.correct_site_identified: ""}</option>
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                        </select>
                    </td>
                </tr>

                <tr>
                    <td>
                        Completed, correct, signed procedure consent form
                    </td>

                    <td>
                        <select onchange="update_field_value(this)" id="completed_correct_signed_procedure_consent_form" class="input-with-feedback form-control ellipsis">
                            <option value="">${cur_frm.doc.completed_correct_signed_procedure_consent_form ? cur_frm.doc.completed_correct_signed_procedure_consent_form: ""}</option>
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                        </select>
                    </td>
                </tr>

                <tr>
                    <td>
                        Relevant documentation available
                    </td>

                    <td>
                        <select id="relevant_documentation_available" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                            <option value="">${cur_frm.doc.relevant_documentation_available ? cur_frm.doc.relevant_documentation_available: ""}</option>
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                        </select>
                    </td>
                </tr>

                <tr>
                    <td>
                        Allergies
                    </td>

                    <td>
                        
                    </td>
                    
                </tr>

                <tr style="text-align: center;">
                    <td>
                        <span>List Know Allergies</span>
                        <input id="list_known_allergies" value="${cur_frm.doc.list_known_allergies ? cur_frm.doc.list_known_allergies: ""}" onchange="update_field_value(this)" type="text" style="width: 50%; display: unset;" class="input-with-feedback form-control ellipsis"/>
                    </td>

                </tr>

                <tr>
                    <td>
                        Any safety precautions dictated by patient history on medication use
                    </td>

                    <td>
                        <select id="safety_precautions_dictated_by_patient_history_on_med_use" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                            <option value="">${cur_frm.doc.safety_precautions_dictated_by_patient_history_on_med_use ? cur_frm.doc.safety_precautions_dictated_by_patient_history_on_med_use: ""}</option>
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                        </select>
                    </td>
                </tr>

                <tr style="text-align: center;">
                    <td>
                        <span>Explain</span>
                        <input id="explain" value="${cur_frm.doc.explain ? cur_frm.doc.explain: ""}" onchange="update_field_value(this)" type="text" style="width: 50%; display: unset;" class="input-with-feedback form-control ellipsis"/>
                    </td>

                </tr>

                <tr>
                    <td>
                        Physical examination of the patient done to establish suitability for  central line insertion
                    </td>

                    <td>
                        <select id="physical_examination_to_establish_suitability_for_central_line" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                            <option value="">${cur_frm.doc.physical_examination_to_establish_suitability_for_central_line ? cur_frm.doc.physical_examination_to_establish_suitability_for_central_line: ""}</option>
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                        </select>
                    </td>
                </tr>

                <tr>
                    <td>
                        Assessment of most suitable site for central line insertion done by  proceduralist
                    </td>

                    <td>
                        <select id="assessment_of_most_suitable_site_for_central_line_insertion" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                            <option value="">${cur_frm.doc.assessment_of_most_suitable_site_for_central_line_insertion ? cur_frm.doc.assessment_of_most_suitable_site_for_central_line_insertion: ""}</option>
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                        </select>
                    </td>
                </tr>

                <tr>
                    <td>
                        Patient/family received education: prevention of central  line-associated bloodstream infections
                    </td>

                    <td>
                        <select id="patient_education_on_prevention_of_central_line_infections" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                            <option value="">${cur_frm.doc.patient_education_on_prevention_of_central_line_infections ? cur_frm.doc.patient_education_on_prevention_of_central_line_infections: ""}</option>
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                        </select>
                    </td>
                </tr>

            </table>
            
        `
        $(frm.fields_dict["timeout_html_table"].wrapper).prepend(TIMEOUT_HTML_TABLE);

        // BUILDING PROCEDURE HTML TABLE
        let PROCEDURE_HTML_TABLE = `
        <table style="background: lightskyblue" class="table table-bordered">
            <tr>
                <td>
                    0.5% to 2% Chlorohexidine in 70% alcohol used to disinfect site
                </td>

                <td>
                    <select id="zero_to_two_chlorohexidine_in_70_alcohol_used_to_disinfect_site" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.zero_to_two_chlorohexidine_in_70_alcohol_used_to_disinfect_site ? cur_frm.doc.zero_to_two_chlorohexidine_in_70_alcohol_used_to_disinfect_site: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td>
                    Chlorhexidine allowed to dry before skin puncture
                </td>

                <td>
                    <select id="chlorhexidine_allowed_to_dry_before_skin_puncture" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.chlorhexidine_allowed_to_dry_before_skin_puncture ? cur_frm.doc.chlorhexidine_allowed_to_dry_before_skin_puncture: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>

            <tr>
                <td>
                    Hand hygiene performed before catheter insertion or manipulation
                </td>

                <td>
                    <select id="hand_hygiene_performed_before_catheter_insertion" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.hand_hygiene_performed_before_catheter_insertion ? cur_frm.doc.hand_hygiene_performed_before_catheter_insertion: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>


            <tr>
                <td>
                    Head cover, mask and sterile gown and gloves worn for procedure
                </td>

                <td>
                    
                </td>
                
            </tr>

            <tr>
                <td>
                    a. Proceduralist
                </td>

                <td>
                    <select id="proceduralist_gloves_worn_before" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.proceduralist_gloves_worn_before ? cur_frm.doc.proceduralist_gloves_worn_before: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>

            <tr>
                <td>
                    b. Procedure Assistant
                </td>

                <td>
                    <select id="procedure_assisstant_gloves_worn_before" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.procedure_assisstant_gloves_worn_before ? cur_frm.doc.procedure_assisstant_gloves_worn_before: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>

            <tr>
                <td>
                    Large sterile drapes used as per protocol
                </td>

                <td>
                    <select id="large_sterile_drapes_used_as_per_protocol" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.large_sterile_drapes_used_as_per_protocol ? cur_frm.doc.large_sterile_drapes_used_as_per_protocol: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>

            <tr>
                <td>
                    Sterile field maintained throughout procedure
                </td>

                <td>
                    <select id="sterile_field_maintained_throughout_procedure" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.sterile_field_maintained_throughout_procedure ? cur_frm.doc.sterile_field_maintained_throughout_procedure: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>

            <tr>
                <td>
                    Dressing applied using sterile technique
                </td>

                <td>
                    <select id="dressing_applied_using_sterile_technique" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.dressing_applied_using_sterile_technique ? cur_frm.doc.dressing_applied_using_sterile_technique: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>

            <tr>
                <td>
                    Dressing dated as per policy
                </td>

                <td>
                    <select id="dressing_dated_as_per_policy" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.dressing_dated_as_per_policy ? cur_frm.doc.dressing_dated_as_per_policy: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>

            <tr>
                <td>
                    Central line insertion guided by ultrasound
                </td>

                <td>
                    <select id="central_line_insertion_guided_by_ultrasound" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.central_line_insertion_guided_by_ultrasound ? cur_frm.doc.central_line_insertion_guided_by_ultrasound: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>

            <tr>
                <td>
                    Femoral vein not used unless other sites are not available
                </td>

                <td>
                    <select id="femoral_vein_not_used_unless_other_sites_are_not_available" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.femoral_vein_not_used_unless_other_sites_are_not_available ? cur_frm.doc.femoral_vein_not_used_unless_other_sites_are_not_available: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>

            <tr style="text-align: center;">
                <td>
                    <span>Explain</span>
                    <input id="explain_procedure_section" value="${cur_frm.doc.explain_procedure_section ? cur_frm.doc.explain_procedure_section: ""}" onchange="update_field_value(this)" type="text" style="width: 50%; display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>
            </tr>

        </table>
        `
        $(frm.fields_dict["procedure_html_table"].wrapper).prepend(PROCEDURE_HTML_TABLE);


        // BUILDING POST PROCEDURE CHECKS HTML TABLE
        let POST_PROCEDURE_HTML_TABLE = `
        
        <table style="background: lightskyblue" class="table table-bordered">
            <tr>
                <td>
                    Procedure documented in the patient's medical record
                </td>

                <td>
                    <select id="procedure_documented_in_the_patients_medical_record" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.procedure_documented_in_the_patients_medical_record ? cur_frm.doc.procedure_documented_in_the_patients_medical_record: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td>
                    Post check X-ray ordered?
                </td>

                <td>
                    <select id="post_check_x_ray_ordered" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.post_check_x_ray_ordered ? cur_frm.doc.post_check_x_ray_ordered: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>

            <tr>
                <td>
                    Confirmation of correct placement received
                </td>

                <td>
                    <select id="confirmation_of_correct_placement_received" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.confirmation_of_correct_placement_received ? cur_frm.doc.confirmation_of_correct_placement_received: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>



            <tr>
                <td>
                    Any equipment problems to be addressed
                </td>

                <td>
                    <select id="any_equipment_problems_to_be_addressed" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.any_equipment_problems_to_be_addressed ? cur_frm.doc.any_equipment_problems_to_be_addressed: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>

            <tr style="text-align: center;">
                <td>
                    <span>Explain</span>
                    <input id="explain_equipment_problem" onchange="update_field_value(this)" value="${cur_frm.doc.explain_equipment_problem ? cur_frm.doc.explain_equipment_problem: ""}" type="text" style="width: 50%; display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>
            </tr>

        </table>

        `
        $(frm.fields_dict["post_procedure_html_table"].wrapper).prepend(POST_PROCEDURE_HTML_TABLE);
	},
    inpatient_record: (frm) => {
        if (cur_frm.doc.inpatient_record && cur_frm.doc.inpatient_record != "") {

          // BLOCKING EDITING OF RELATED TOOLS TO THE ASSIGNED PRIMARY NURSE
          frappe.require(
            "/assets/gch_inpatient/js/inpatient_record_utils.js",
            () => {
              block_nurse_from_editing(frm);
            }
          );

          // Attempting to pull triage information from the associated  InPatient Record
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
    on_submit: (frm) => {
        frappe.call({
            method: "gch_custom.gch_custom.doctype.nursing_checklist.nursing_checklist.creating_completed_nursing_tools",
            args: {
                "inpatient_record": cur_frm.doc.inpatient_record,
                "tool_name": cur_frm.doc.doctype,
                "tool_id": cur_frm.doc.name,
                "tool_link": `<a href='/app/central-line-insertion-checklist/${cur_frm.doc.name}'><p style='color: blue;'>View</p></a>`
            },
            callback: (res) => {
                console.log(res, "============= SUBMITTEDDD ==========")
            }
        })

        let encounter;

        if (cur_frm.doc.is_inpatient && cur_frm.doc.inpatient_record) {
            encounter = cur_frm.doc.inpatient_record
        } 
        else if (!cur_frm.doc.is_inpatient && cur_frm.doc.patient_encounter) {
            encounter = cur_frm.doc.patient_encounter
        }

        // Invoice Procedure consumables
        frappe.call({
            method: "gch_inpatient.gch_inpatient.doctype.central_line_insertion_checklist.central_line_insertion_checklist.invoice_procedure_consumables",
            args: {
              encounter: encounter,
              procedure: cur_frm.doc.name
            },callback(r){
              if(r.message){
                console.log(r.message)

                frappe.msgprint({
                    title: __('Notification'),
                    indicator: 'green',
                    message: __(r.message)
                });

              }else {
                console.log(r)

                frappe.msgprint({
                    title: __('Notification'),
                    indicator: 'red',
                    message: __(r)
                });

              }
            }
        })

    }
});
