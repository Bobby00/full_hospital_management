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

frappe.ui.form.on('NUTRITION SCREENING TOOL', {
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
        cur_frm.fields_dict["nutrition_screening_tool_html"].wrapper.innerHTML = ""

        // BUILDING NUTRITION SCREENING HTML TABLE
        let NUTRITION_SCREENING_HTML_TABLE = `
        <table style="background: lightskyblue" class="table table-bordered">

            <tr style="background-color: darksalmon;">
                <th>1</th>
                <th>Weight</th>
                <th></th>
            </tr>

            <tr>
                <td>a</td>
                <td>Normal Weight</td>
                <td>
                <select id="normal_weight" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                    <option value="">${cur_frm.doc.normal_weight ? cur_frm.doc.normal_weight: ""}</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
                </td>
            </tr>

            <tr>
                <td>
                    b
                </td>

                <td>
                    Weight for age/Weight for height <-1SD/1Oth percentile (at risk)

                </td>

                <td>
                    <select id="weight_for_ageweight_for_height_10_percentile_at_risk" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.weight_for_ageweight_for_height_10_percentile_at_risk ? cur_frm.doc.weight_for_ageweight_for_height_10_percentile_at_risk: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>
            
            <tr>
                <td>
                    c
                </td>

                <td>
                    Weight for age/Weight for height <-2SD/3rd percentile (Underweight)

                </td>

                <td>
                    <select id="weight_for_age_weight_for_height_third_percentile_underweight" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.weight_for_age_weight_for_height_third_percentile_underweight ? cur_frm.doc.weight_for_age_weight_for_height_third_percentile_underweight: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td>
                    d
                </td>

                <td>
                    Weight for height <-3SD (Severe Acute Malnutrition)

                </td>

                <td>
                    <select id="weight_for_height_three_sd_severe_acute_malnutrition" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.weight_for_height_three_sd_severe_acute_malnutrition ? cur_frm.doc.weight_for_height_three_sd_severe_acute_malnutrition: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td>
                    e
                </td>

                <td>
                    Weight for age/Weight for height <-3SD/85th percentile (Overweight)

                </td>

                <td>
                    <select id="weight_for_age_weight_for_height_eighty_fifth_percentile" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.weight_for_age_weight_for_height_eighty_fifth_percentile ? cur_frm.doc.weight_for_age_weight_for_height_eighty_fifth_percentile: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td>
                    f
                </td>

                <td>
                    Unintentional weight loss in the past 1 month

                </td>

                <td>
                    <select id="unintentional_weight_loss_in_the_past_one_month" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.unintentional_weight_loss_in_the_past_one_month ? cur_frm.doc.unintentional_weight_loss_in_the_past_one_month: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td></td>
                <td>NB. If yes for any except Normal Weight Refer for Further Nutrition Assessment</td>
                <td></td>
            </tr>

            <tr style="background-color: darksalmon;">
                <th>2</th>
                <th>DIETARY INTAKE</th>
                <th></th>
            </tr>

            <tr>
                <td>
                    a
                </td>

                <td>
                    Normal food intake

                </td>

                <td>
                    <select id="normal_food_intake" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.normal_food_intake ? cur_frm.doc.normal_food_intake: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td>
                    b
                </td>

                <td>
                    Decreased appetite but taking usual foods
                </td>

                <td>
                    <select id="decreased_appetite_but_taking_usual_foods" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.decreased_appetite_but_taking_usual_foods ? cur_frm.doc.decreased_appetite_but_taking_usual_foods: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td>
                    c
                </td>

                <td>
                    Use of nutritional supplements or specialized feeding (NGT, Gastronomy)
                </td>

                <td>
                    <select id="use_of_nutritional_supplements_or_specialized_feeding" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.use_of_nutritional_supplements_or_specialized_feeding ? cur_frm.doc.use_of_nutritional_supplements_or_specialized_feeding: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td>
                    d
                </td>

                <td>
                    Taking very little foods or liquids only
                </td>

                <td>
                    <select id="taking_very_little_food_or_liquids" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.taking_very_little_food_or_liquids ? cur_frm.doc.taking_very_little_food_or_liquids: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td></td>
                <td>NB. If yes for C and D Refer for Further Nutrition Assessment</td>
                <td></td>
            </tr>

            <tr style="background-color: darksalmon;">
                <th>3</th>
                <th>MEDICAL DIAGNOSIS</th>
                <th></th>
            </tr>

            <tr>
                <td>
                    a
                </td>

                <td>
                    Diabetes
                </td>

                <td>
                    <select id="diabetes" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.diabetes ? cur_frm.doc.diabetes: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td>
                    b
                </td>

                <td>
                    Cancer
                </td>

                <td>
                    <select id="cancer" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.cancer ? cur_frm.doc.cancer: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>
            <tr>
                <td>
                    c
                </td>

                <td>
                    Burns > 10%
                </td>

                <td>
                    <select id="burns_over_ten_percent" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.burns_over_ten_percent ? cur_frm.doc.burns_over_ten_percent: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>
            <tr>
                <td>
                    d
                </td>

                <td>
                    ICU Care
                </td>

                <td>
                    <select id="icu_care" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.icu_care ? cur_frm.doc.icu_care: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>
            <tr>
                <td>
                    e
                </td>

                <td>
                    Renal
                </td>

                <td>
                    <select id="renal" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.renal ? cur_frm.doc.renal: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>
            <tr>
                <td>
                    f
                </td>

                <td>
                    Cardiac
                </td>

                <td>
                    <select id="cardiac" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.cardiac ? cur_frm.doc.cardiac: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>
            <tr>
                <td>
                    g
                </td>

                <td>
                    Hepatitis
                </td>

                <td>
                    <select id="hepatitis" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.hepatitis ? cur_frm.doc.hepatitis: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td></td>
                <td>NB. If yes for any Refer for Further Nutrition Assessment</td>
                <td></td>
            </tr>

            <tr style="background-color: darksalmon;">
                <th>4</th>
                <th>OTHERS</th>
                <th></th>
            </tr>

            <tr>
                <td>
                    a
                </td>

                <td>
                    Documented nutritional Deficiencies e.g. Iron deficiency anaemia
                </td>

                <td>
                    <select id="documented_nutritional_deficiencies" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.documented_nutritional_deficiencies ? cur_frm.doc.documented_nutritional_deficiencies: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td>
                    b
                </td>

                <td>
                    Documented food allergies and intolerances e,g, Milk protein allergy
                </td>

                <td>
                    <select id="documented_food_allergies_and_intolerances" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.documented_food_allergies_and_intolerances ? cur_frm.doc.documented_food_allergies_and_intolerances: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td>
                    c
                </td>

                <td>
                    GIT symptoms e.g. nausea, vomiting and diarrhea affecting dietary intake
                </td>

                <td>
                    <select id="git_symptoms" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.git_symptoms ? cur_frm.doc.git_symptoms: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td>
                    d
                </td>

                <td>
                    Complementary feeding age (6 months)
                </td>

                <td>
                    <select id="complementary_feeding_age" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option value="">${cur_frm.doc.complementary_feeding_age ? cur_frm.doc.complementary_feeding_age: ""}</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>

            </tr>

            <tr>
                <td></td>
                <td>NB. If yes for any Refer for Further Nutrition Assessment</td>
                <td></td>
            </tr>


        </table>
        
        `

        $(frm.fields_dict["nutrition_screening_tool_html"].wrapper).prepend(NUTRITION_SCREENING_HTML_TABLE);

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
    on_submit: (frm) => {
        frappe.call({
            method: "gch_custom.gch_custom.doctype.nursing_checklist.nursing_checklist.creating_completed_nursing_tools",
            args: {
                "inpatient_record": cur_frm.doc.inpatient_record,
                "tool_name": cur_frm.doc.doctype,
                "tool_id": cur_frm.doc.name,
                "tool_link": `<a href='/app/nutrition-screening-tool/${cur_frm.doc.name}'><p style='color: blue;'>View</p></a>`
            },
            callback: (res) => {
                console.log(res, "============= SUBMITTEDDD ==========")
            }
        })
    }
});
