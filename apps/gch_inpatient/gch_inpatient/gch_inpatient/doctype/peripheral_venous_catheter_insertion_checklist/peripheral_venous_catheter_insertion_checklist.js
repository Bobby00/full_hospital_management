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


frappe.ui.form.on('PERIPHERAL VENOUS CATHETER INSERTION CHECKLIST', {
	refresh: function(frm) {
        
        if(cur_frm.doc.__islocal && !cur_frm.doc.items){
            console.log("Add procedure item...")

            let procedure_item_row = cur_frm.get_field("items").grid.add_new_row()

            // Fetch Peripheral venous catheter insertion item doc
            let item_doc;

            frappe.db.get_doc("Item", "PERIPHERAL VENOUS CATHETER INSERTION").then( (res) => {
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
        cur_frm.fields_dict["peripheral_venous_html"].wrapper.innerHTML = ""

        // BUILDING VENTILATOR HTML TABLE
        let PERIPHERAL_VENOUS_HTML_TABLE = `
        <table style="background: lightskyblue" class="table table-bordered">
            <tr>
                <th>Catheter Insertion Procedure</th>
                <th>Response</th>
            </tr>
            <tr>
                <td>
                    1. Date of insertion
                </td>

                <td>
                    <input type="date" value="${cur_frm.doc.date_of_insertion ? cur_frm.doc.date_of_insertion: ""}" id="date_of_insertion" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>
            <tr>
                <td>
                    2. Time of insertion
                </td>

                <td>
                    <input type="time" value="${cur_frm.doc.time_of_insertion ? cur_frm.doc.time_of_insertion: ""}" id="time_of_insertion" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>
            
            <tr>
                <td>
                    3. Name of person inserting
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.name_of_person_inserting ? cur_frm.doc.name_of_person_inserting: ""}" id="name_of_person_inserting" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    4. Location of peripheral catheter (e.g. Left cephalic vein)
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.location_of_peripheral_catheter ? cur_frm.doc.location_of_peripheral_catheter: ""}" id="location_of_peripheral_catheter" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    5. Catheter gauge
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.catheter_gauge ? cur_frm.doc.catheter_gauge: ""}" id="catheter_gauge" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    6. Reason of catheter insertion (e.g. GA, Infusion, IV medications)
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.reason_of_catheter_insertion ? cur_frm.doc.reason_of_catheter_insertion: ""}" id="reason_of_catheter_insertion" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    7. Catheter site cleaned with?
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.catheter_site_cleaned_with ? cur_frm.doc.catheter_site_cleaned_with: ""}" id="catheter_site_cleaned_with" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    8. Ease of insertion of catheter (e.g. First attempt without resistance)
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.ease_of_insertion_of_catheter ? cur_frm.doc.ease_of_insertion_of_catheter: ""}" id="ease_of_insertion_of_catheter" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    9. Patient compliance Level (e.g. Minimal restraint required)
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.patient_compliance_level ? cur_frm.doc.patient_compliance_level: ""}" id="patient_compliance_level" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    10. Appearance of catheter site and limp prior  to insertion (e.g. Pain, Limb swelling, Pressure sores, Erythema, OK)
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.appearance_of_catheter_site_and_limp_prior_to_insertion ? cur_frm.doc.appearance_of_catheter_site_and_limp_prior_to_insertion: ""}" id="appearance_of_catheter_site_and_limp_prior_to_insertion" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            <tr>
                <td>
                    11. Catheter flushed with?
                </td>

                <td>
                    <input type="text" value="${cur_frm.doc.catheter_flushed_with ? cur_frm.doc.catheter_flushed_with: ""}" id="catheter_flushed_with" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>

            

        </table>
        
        `

        $(frm.fields_dict["peripheral_venous_html"].wrapper).prepend(PERIPHERAL_VENOUS_HTML_TABLE);

	},
    inpatient_record: (frm) => {
        if (cur_frm.doc.inpatient_record && cur_frm.doc.inpatient_record != "") {
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
                "tool_link": `<a href='/app/peripheral-venous-catheter-insertion-checklist/${cur_frm.doc.name}'><p style='color: blue;'>View</p></a>`
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
            method: "gch_inpatient.gch_inpatient.doctype.peripheral_venous_catheter_insertion_checklist.peripheral_venous_catheter_insertion_checklist.invoice_procedure_consumables",
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
