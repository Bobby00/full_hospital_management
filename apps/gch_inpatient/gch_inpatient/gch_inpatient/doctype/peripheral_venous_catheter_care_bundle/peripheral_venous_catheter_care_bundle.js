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

frappe.ui.form.on('PERIPHERAL VENOUS CATHETER CARE BUNDLE', {
	refresh: function(frm) {

        if(cur_frm.doc.__islocal && !cur_frm.doc.items){
            console.log("Add procedure item...")

            let procedure_item_row = cur_frm.get_field("items").grid.add_new_row()

            // Fetch Peripheral venous catheter care bundle
            let item_doc;

            frappe.db.get_doc("Item", "PERIPHERAL VENOUS CATHETER CARE BUNDLE").then( (res) => {
                console.log(res)
                
                procedure_item_row.item_code = res.item_code
                procedure_item_row.item_name = res.item_name
                procedure_item_row.uom = res.uoms[0].uom
                procedure_item_row.qty = 1

                console.log("here")

                cur_frm.refresh_field("items")
            } )
            

        }

        if(cur_frm.doc.inpatient_record) {
            cur_frm.set_value("is_inpatient", 1)
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
        cur_frm.fields_dict["peripheral_venous_maintenance_html"].wrapper.innerHTML = ""

        // BUILDING VENTILATOR HTML TABLE
        let PERIPHERAL_VENOUS_CARE_HTML_TABLE = `
        <table style="background: lightskyblue" class="table table-bordered">
            
            <tr>
                <td>
                    Date
                </td>

                <td>
                    <input type="date" value="${cur_frm.doc.date_of_insertion ? cur_frm.doc.date_of_insertion: ""}" id="date_of_insertion" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>
            <tr>
                <td>
                    Time
                </td>

                <td>
                    <input type="time" value="${cur_frm.doc.time_of_insertion ? cur_frm.doc.time_of_insertion: ""}" id="time_of_insertion" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>
            
            <tr>
                <td>
                    Hours post insertion
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.hours_post_insertion ? cur_frm.doc.hours_post_insertion: ""}" id="hours_post_insertion" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    Name of person checking
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.name_of_person_checking ? cur_frm.doc.name_of_person_checking: ""}" id="name_of_person_checking" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    1. Appropriate hand hygiene followed before handling patient: hand wash or hand rub?
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.appropriate_hand_hygiene_followed_before_handling_patient ? cur_frm.doc.appropriate_hand_hygiene_followed_before_handling_patient: ""}" id="appropriate_hand_hygiene_followed_before_handling_patient" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    2. Appearance of protective bandage layer. Wet, Soiled or OK
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.appearance_of_protective_bandage_layer ? cur_frm.doc.appearance_of_protective_bandage_layer: ""}" id="appearance_of_protective_bandage_layer" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    3. Any patient interference
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.any_patient_interference ? cur_frm.doc.any_patient_interference: ""}" id="any_patient_interference" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    4. Details of catheter site and limb: e.g. Pain, Limb Swelling Pressure sores, Erythema, OK
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.details_of_catheter_site_and_limb ? cur_frm.doc.details_of_catheter_site_and_limb: ""}" id="details_of_catheter_site_and_limb" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    5. Catheter flushed with?
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.catheter_flushed_with ? cur_frm.doc.catheter_flushed_with: ""}" id="catheter_flushed_with" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    6. Injection port cleaned with?
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.injection_port_cleaned_with ? cur_frm.doc.injection_port_cleaned_with: ""}" id="injection_port_cleaned_with" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    7. Daily review of necessity - does the patient still need the catheter?
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.daily_review_of_necessary ? cur_frm.doc.daily_review_of_necessary: ""}" id="daily_review_of_necessary" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    8. Catheter removed? Reason for removal
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.catheter_removed ? cur_frm.doc.catheter_removed: ""}" id="catheter_removed" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            

        </table>
        
        `

        $(frm.fields_dict["peripheral_venous_maintenance_html"].wrapper).prepend(PERIPHERAL_VENOUS_CARE_HTML_TABLE);

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
                "tool_link": `<a href='/app/peripheral-venous-catheter-care-bundle/${cur_frm.doc.name}'><p style='color: blue;'>View</p></a>`
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
            method: "gch_inpatient.gch_inpatient.doctype.peripheral_venous_care_bundle.peripheral_venous_care_bundle.invoice_procedure_consumables",
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
