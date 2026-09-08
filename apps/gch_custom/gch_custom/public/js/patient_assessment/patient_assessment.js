let wongbaker_score = 0;
let total_score = 0;
let fall_risk_age = 0;
let fall_risk_gender = '';


// FOR INPATIENT FALLS RISK SELECTION TABLE
let update_field_value = (selected) => {
    console.log(selected.value, "Fiiiirring!!!!!!!!")
    console.log(selected.id)

    let selected_option = selected.value
    let selected_id = selected.id

    cur_frm.set_value(selected_id, selected_option)
    cur_frm.refresh_field(selected_id)

}

window.update_field_value = update_field_value


frappe.ui.form.on('Patient Assessment', {
refresh: (frm) => {
// console.log("Refresh here............")
// your code here
    // if ((frm.doc.assessment_template != 'Pain Assessment - Wong Baker Face') && (frm.doc.assessment_template != 'Pain Assessment - Numeric Scale')){
    frm.set_query("score_guideline", "assessment_sheet", function (_doc, cdt, cdn) {
    let d = locals[cdt][cdn];
    return {
    query: "gch_custom.services.rest.get_assessment_guideline",
    filters: {
    "parameter": d.parameter
    }
    };
    });
    // }


    // Flagging assessments
    if (cur_frm.doc.total_score_obtained > 5 && cur_frm.doc.assessment_template.includes("Falls Risk")) {
        // $(".grid-body")[0].style.background = "yellow"

        $('[data-fieldname="total_score_obtained"]').find('.control-value')[0].style.background = 'yellow'
        $('textarea')[0].style.background = "yellow"

    } else if (cur_frm.doc.total_score_obtained > 5) {
        $('[data-fieldname="total_score_obtained"]').find('.control-value')[0].style.background = '#ff8181'
        $('textarea')[0].style.background = "#ff8181"
    } else {
        $('[data-fieldname="total_score_obtained"]').find('.control-value')[0].style.background = 'white'
        $('textarea')[0].style.background = "white"
    }

    if (frm.doc.__islocal===1) {
        frm.set_value('total_score_obtained', wongbaker_score);
        cur_frm.refresh_field('total_score_obtained');
    }

    if(frm.doc.__islocal && frm.doc.inpatient_record) {
        cur_frm.set_value("is_inpatient", 1)
        cur_frm.refresh_field("is_inpatient")
    }

    // Clearing tables to avoid duplication after save
    cur_frm.fields_dict["inpatient_falls_risk_assessment_html"].wrapper.innerHTML = ""

    // BUILDING NUTRITION SCREENING HTML TABLE
    let INPATIENT_FALLS_RISK_HTML_TABLE = `
    <table style="background: lightskyblue" class="table table-bordered">

        <tr>
            <td></td>
            <td>CRITERIA / DATE</td>
            <td>
                <input type="text" value="${cur_frm.doc.criteria_date ? cur_frm.doc.criteria_date: ""}" id="criteria_date" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
            </td>
        </tr>

        <tr style="background-color: darksalmon;">
            <td></td>
            <td>Falls Precautions</td>
            <td>
                YES/NO
            </td>
        </tr>

        <tr>
            <td style="vertical-align: middle;" rowspan="3">Supervision</td>
            <td>1. Patient is under 24hr care by a care taker</td>
            
            <td>
                <select id="patient_is_under_twenty_four_hour_care_by_a_care_taker" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.patient_is_under_twenty_four_hour_care_by_a_care_taker ? cur_frm.doc.patient_is_under_twenty_four_hour_care_by_a_care_taker: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td>2. Patient is supervised during transfers</td>
            
            <td>
                <select id="patient_is_supervised_during_transfers" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.patient_is_supervised_during_transfers ? cur_frm.doc.patient_is_supervised_during_transfers: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td>3. During procedure patient is supervised</td>
            
            <td>
                <select id="during_procedure_patient_is_supervised" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.during_procedure_patient_is_supervised ? cur_frm.doc.during_procedure_patient_is_supervised: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td rowspan="6" style="vertical-align: middle;">Patient Room</td>
            <td>4. Room is free of clutter and unsecured cords</td>
            
            <td>
                <select id="room_is_free_of_clutter_and_unsecured_cords" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.room_is_free_of_clutter_and_unsecured_cords ? cur_frm.doc.room_is_free_of_clutter_and_unsecured_cords: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td>5. Cot rails are up</td>
            
            <td>
                <select id="cot_rails_are_up" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.cot_rails_are_up ? cur_frm.doc.cot_rails_are_up: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td>6. Wheeled equipments secured</td>
            
            <td>
                <select id="wheeled_equipments_secured" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.wheeled_equipments_secured ? cur_frm.doc.wheeled_equipments_secured: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td>7. Patient is not left on unsecured bed or high places</td>
            
            <td>
                <select id="patient_is_not_left_on_unsecured_bed_or_high_places" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.patient_is_not_left_on_unsecured_bed_or_high_places ? cur_frm.doc.patient_is_not_left_on_unsecured_bed_or_high_places: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td>8. Room is well lit and obstruction free</td>
            
            <td>
                <select id="room_is_well_lit_and_obstruction_free" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.room_is_well_lit_and_obstruction_free ? cur_frm.doc.room_is_well_lit_and_obstruction_free: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td>9. Call bells are accessible and functional</td>
            
            <td>
                <select id="call_bells_are_accessible_and_functional" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.call_bells_are_accessible_and_functional ? cur_frm.doc.call_bells_are_accessible_and_functional: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td rowspan="3" style="vertical-align: middle;">High risk patients (score > 6)</td>
            <td>10. Room is close to nurses station or view</td>
            
            <td>
                <select id="room_is_close_to_nurses_station_or_view" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.room_is_close_to_nurses_station_or_view ? cur_frm.doc.room_is_close_to_nurses_station_or_view: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td>11. Yellow indication snap is put on patient's armband</td>
            
            <td>
                <select id="yellow_identification_snap_is_put_on_patient_armband" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.yellow_identification_snap_is_put_on_patient_armband ? cur_frm.doc.yellow_identification_snap_is_put_on_patient_armband: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td>12. Falls High Risk Poster has been placed</td>
            
            <td>
                <select id="falls_high_risk_poster_has_been_placed" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.falls_high_risk_poster_has_been_placed ? cur_frm.doc.falls_high_risk_poster_has_been_placed: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td rowspan="4" style="vertical-align: middle;">Patient and family</td>
            <td>13. Oriented to room and ward/department</td>
            
            <td>
                <select id="oriented_to_room_and_ward_or_department" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.oriented_to_room_and_ward_or_department ? cur_frm.doc.oriented_to_room_and_ward_or_department: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td>14. Educated on falls prevention and these falls precautions</td>
            
            <td>
                <select id="educated_on_falls_prevention_and_these_falls_precautions" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.educated_on_falls_prevention_and_these_falls_precautions ? cur_frm.doc.educated_on_falls_prevention_and_these_falls_precautions: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td>15. Did patient experience any fall associated with injury today?</td>
            
            <td>
                <select id="did_patient_experience_any_fall_associated_with_injury_today" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.did_patient_experience_any_fall_associated_with_injury_today ? cur_frm.doc.did_patient_experience_any_fall_associated_with_injury_today: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td>16. Q-Pulse SE No. if Yes in 4.3 (For follow up)</td>
            
            <td>
                <select id="q_pulse_se_no" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.q_pulse_se_no ? cur_frm.doc.q_pulse_se_no: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </td>
        </tr>

        <tr>
            <td></td>

            <td>Checked by (Nurse initials)</td>
            
            <td>
                <input type="text" value="${cur_frm.doc.checked_by ? cur_frm.doc.checked_by: ""}" id="checked_by" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
            </td>
        </tr>

        
    </table>
    `

    $(frm.fields_dict["inpatient_falls_risk_assessment_html"].wrapper).prepend(INPATIENT_FALLS_RISK_HTML_TABLE);


    

},
onload: function(frm){
        console.log("onload here............")

        const wongbaker_score = 0;
        const total_score = 0;
       
        const nowtime = frappe.datetime.now_datetime();
       
        cur_frm.set_value("assessment_time", frappe.datetime.now_time());        
        cur_frm.refresh_field('assessment_time');

        // Adding color to the background of each section
        $('.progress-area').css('background', '#bbe4f1')

        $('.card-section').css('background', '#bbe4f1')

        $('.form-layout').css('background', '#a0c5d1')

        $('.grid-footer').css('background', '#bbe4f1!important')

        


        // Hiding default Fields
        cur_frm.set_df_property("naming_series", "hidden", true);

        cur_frm.set_df_property("therapy_session", "hidden", true);

        
       
},

assessment_template: function (frm, cdt, cdn) {
    // console.log("Assessment Template here............")
    
    // if ((frm.doc.assessment_template == 'Pain Assessment - Wong Baker Face') || (frm.doc.assessment_template == 'Pain Assessment - Numeric Scale')){
    //     cur_frm.toggle_enable("total_score_obtained", true)
    // }
    // else {
    //     // cur_frm.toggle_enable(false);
    //     cur_frm.toggle_enable("total_score_obtained", false);
    // }
    
    //Get Age and Gender
    if  (frm.doc.assessment_template == 'OutPatient Falls Risk Assessment'){
        if (frm.doc.patient){
            frappe.db.get_value("Patient", {name: frm.doc.patient}, ["dob", "sex"], (r) => {
                const patientdob = r.dob;
                console.log(patientdob)
                const fall_risk_gender = r.sex;
                const fall_risk_age = calculate_age(patientdob);
                let age_in_years = Math.floor(fall_risk_age/365);
                
                let entry = frm.add_child('assessment_sheet');
                cur_frm.refresh_field('score_guideline');                
            // });    
        
            cur_frm.doc.assessment_sheet.forEach(item => {                  

                const rowno = item.idx;
                const fall_parameter = item.parameter;
                const fall_score_guide = item.score_guideline;
            
                if (fall_parameter == 'Gender'){
                    switch(fall_risk_gender) {
                        case "Male":
                            item.score_guideline = 'Boy';
                            item.score_2 = 1;
                            break;
                        case "Female":
                            item.score_guideline = 'Girl';
                            item.score_2 = 0;
                        break;
                    }                                    
                    
                    $("div[data-idx='"+item.idx+"']").find("input[data-fieldname='score_guideline']").css('pointer-events','none');
                    cur_frm.refresh_field('assessment_sheet')
                }
            
                if (fall_parameter == 'Patient Age'){
                    if (age_in_years >= 0 && age_in_years < 3){
                        item.score_guideline = 'Less than 3 years';
                        item.score_2 = 3;
                    }    
                    else if (age_in_years > 2 && age_in_years < 7){
                        item.score_guideline = '3 to less than 7 years';
                        item.score_2 = 2;
                    }  
                    else if (age_in_years > 6 && age_in_years < 13){
                        item.score_guideline = '7 to less than 13 years';
                        item.score_2 = 1;
                    }
                    else if (age_in_years > 12){
                        item.score_guideline = '13 years and above';
                        item.score_2 = 0;
                    }

                    cur_frm.refresh_field('assessment_sheet')
                    
                }
            });

        });
        }; //if Patient
    
    }//Fall Risk
},
   
total_score_obtained: function (frm) {
    // console.log("total score obtained here............")

    const assess_type = frm.doc.assessment_template;
    console.log(frm.doc.total_score_obtained)
    frm.doc.obtained_score = parseInt(frm.doc.total_score_obtained);

    if ((assess_type == 'Pain Assessment - Wong Baker Face') && !frm.doc.__islocal || (assess_type == 'Pain Assessment - Numeric Scale') && !frm.doc.__islocal ){
        total_score = frm.doc.assessment_sheet[0].score_2;
        wongbaker_score =  frm.doc.assessment_sheet[0].score_2;
        
        console.log(wongbaker_score)
        

        frm.set_value('total_score_obtained', parseInt(total_score));
    }

},
     
before_save:function(frm){
    // console.log("Before save............")

    const total_score = frm.doc.total_score_obtained;
    const wongbaker_score = total_score;
    const assess_type = frm.doc.assessment_template;

    if (!frm.doc.__islocal) {
        frappe.call({
                "method": "gch_custom.services.rest.get_patient_assessment_action",
                args: {
                    doctype: "Assessment Template Action",
                "template": frm.doc.assessment_template,
                "score": frm.doc.total_score_obtained,
                },
                callback: function (data) {
                    if(data.message) {
                        cur_frm.set_value('action', data.message.pa_action['action']);
                    
                        cur_frm.refresh_field('action');
                    }
                }
        });
    }
           
},
after_save:function(frm){
//    console.log("After save............")
   const assessm_type = frm.doc.assessment_template;
   
    if ((assessm_type == 'Pain Assessment - Wong Baker Face') || (assessm_type == 'Pain Assessment - Numeric Scale')){
    // frappe.model.set_value(frm.doctype,frm.docname,"total_score_obtained",frm.doc.obtained_score);
    // cur_frm.set_value("total_score_obtained",frm.doc.obtained_score);
    // frappe.call({
    //     "method": "gch_custom.services.rest.save_wongbaker",
    //         args: {
    //         doctype: "Patient Assessment",
    //         "docno": frm.doc.name,
    //         "score": wongbaker_score
    //     },
    //     callback: function (data) {
    //         frm.set_value("total_score_obtained", wongbaker_score)
            
    //         }
    // });
        // cur_frm.set_value("total_score_obtained", frm.doc.assessment_sheet[0].score)
        // cur_frm.refresh_field("total_score_obtained")

       
    }
},
calculate_total_score: function(frm, cdt, cdn) {

    // console.log("Calculate total score............")
    let row = locals[cdt][cdn];
    let total_score = 0;
        const assessm_type = frm.doc.assessment_template;
   
    if ((assessm_type == 'Pain Assessment - Wong Baker Face') || (assessm_type == 'Pain Assessment - Numeric Scale')){
        cur_frm.set_value("total_score_obtained", frm.doc.assessment_sheet[0].score_2)
        cur_frm.refresh_field("total_score_obtained")
    }
},
on_submit: function(frm) {
    // Checking if is IP or OP encounter to redirect to the right page
    if(!cur_frm.doc.is_inpatient) {
        // Creating a duplicate record of in the encounter assessment child doc on OP
        frappe.call({
            method: "gch_custom.services.rest.create_encounter_assessment_record",
            args: {
                "encounter": cur_frm.doc.encounter,
                "action": cur_frm.doc.action,
                "assessment_no": cur_frm.doc.name,
                "type": cur_frm.doc.assessment_template,
                "score": cur_frm.doc.total_score_obtained,
                "date": cur_frm.doc.assessment_date,
                "time": cur_frm.doc.assessment_time,
                "done_by": cur_frm.doc.owner,
                "action": cur_frm.doc.action
            },
            callback: (res) => {
                console.log(res)
            }
        })


        // auto redirecting to the encounter on submit
        window.location.href = "/app/patient-encounter/" + cur_frm.doc.encounter
    
        // Refreshing the patient encounter doc
        // Reloading Doc
        cur_frm.reload_doc()
        frappe.reload_doc('healthcare', doctype, 'patient encounter')
    } else if (cur_frm.doc.is_inpatient) {
        window.location.href = "/app/inpatient-encounter/" + cur_frm.doc.inpatient_record
        // frappe.reload_doc('healthcare', doctype, 'i encounter')
    }

    // frm.refresh()
}
});


//Calulate Age in Days
let calculate_age = function (birthdate) {
    let ageMS = Date.parse(Date()) - Date.parse(birthdate);
    const day_cons = 86400000;
    let agedays = Math.trunc(ageMS / day_cons);
 
    return agedays;
  };

frappe.ui.form.on('Patient Assessment Sheet', {
parameter: function(frm, cdt, cdn) {
         
       
}
})
