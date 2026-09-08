// Copyright (c) 2023, Redward, Levy Riungu  and contributors
// For license information, please see license.txt

const field_list = [
    "central_line_day",
    "need_for_central_line",
    "gauze_and_tape_change",
    "transparent_dressing_less_than_a_week",
    "soiled_catheter_changed",
    "each_time_the_line_is_used_during_the_day_section"
]

let update_field_value = (selected) => {
    console.log(selected.value, "Fiiiirring!!!!!!!!")
    console.log(selected.id)

    let selected_option = selected.value
    let selected_id = selected.id

    cur_frm.set_value(selected_id, selected_option)
    cur_frm.refresh_field(selected_id)

}

window.update_field_value = update_field_value


frappe.ui.form.on('Central Line Maintenance Bundle Checklist', {
	refresh: function(frm) {

        if(cur_frm.doc.__islocal && !cur_frm.doc.items){
            console.log("Add procedure item...")

            let procedure_item_row = cur_frm.get_field("items").grid.add_new_row()

            // Fetch Peripheral venous catheter care bundle
            let item_doc;

            frappe.db.get_doc("Item", "CENTRAL LINE MAINTENANCE BUNDLE").then( (res) => {
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

        cur_frm.fields_dict["html_template"].wrapper.innerHTML = ""

        frappe.require("/assets/gch_custom/js/gch_utilities/index.js", () => {
            field_list.forEach((field) =>{
                toggle_permission(frm, field, true)
            })
        });

        let date_today = frappe.datetime.now_date().split(" ")[0];
        cur_frm.set_value("date", date_today);

		let HTML_TEMPLATE = `
        
        <table style="background: lightskyblue" class="table table-bordered">
            <tr>
                <td>
                    Central Line day (Indicate exact day here).
                </td>
                <td>
                    <input type="date" id="central_line_day" value="${cur_frm.doc.central_line_day? cur_frm.doc.central_line_day: ""}" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                </td>
            </tr>
            <tr>
                <td>
                    The need for a central line or possible removal was discussed during the patient round today.
                </td>
                <td>
                    <select id="need_for_central_line" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option>${cur_frm.doc.need_for_central_line ? cur_frm.doc.need_for_central_line: ""}</option>
                        
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td>
                    If gauze and tape dressing was used, the dressing has been changed today.
                </td>
                <td>
                    <select id="gauze_and_tape_change" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option>${cur_frm.doc.gauze_and_tape_change ? cur_frm.doc.gauze_and_tape_change: ""}</option>
                        
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td>
                    If a transparent dressing was used, the catheter dressing is not more than seven days old.
                </td>
                <td>
                    <select id="transparent_dressing_less_than_a_week" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option >${cur_frm.doc.transparent_dressing_less_than_a_week ? cur_frm.doc.transparent_dressing_less_than_a_week: ""}</option>
                        
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td>
                    If a catheter dressing is soiled or collecting moisture underneath it, it has been changed.
                </td>
                <td>
                    <select id="soiled_catheter_changed" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option >${cur_frm.doc.soiled_catheter_changed ? cur_frm.doc.soiled_catheter_changed: ""}</option>
                        
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>

            <th>
                Each time the line is used during the day,
            </th>
            <tb>
            <tr>
                <td>
                    Appropriate hand hygiene is performed prior to use of central line.
                </td>
                <td>
                    <select id="appropriate_hand_hygiene" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option >${cur_frm.doc.appropriate_hand_hygiene ? cur_frm.doc.appropriate_hand_hygiene: ""}</option>
                        
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td>
                    The healthcare worker either wore sterile gloves prior to using the central line or used clean gloves and a sterile no-touch technique to access  the central line.
                </td>
                <td>
                    <select id="sterile_gloves_or_no_touch" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option >${cur_frm.doc.sterile_gloves_or_no_touch ? cur_frm.doc.sterile_gloves_or_no_touch: ""}</option>
                        
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td>
                    The healthcare worker cleaned the ports/ dressing area with a 0.5% to 2% chlorhexidine solution and allowed it to dry prior to accessing the line.
                </td>
                <td>
                    <select id="chlorhexidine_solution_used" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option >${cur_frm.doc.chlorhexidine_solution_used ? cur_frm.doc.chlorhexidine_solution_used: ""}</option>
                        
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td>
                    A pulsated flushing technique(push-pause technique) was used to flush the line.
                </td>
                <td>
                    <select id="push_pause_technique" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option >${cur_frm.doc.push_pause_technique ? cur_frm.doc.push_pause_technique: ""}</option>
                        
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td>
                    If parenteral nutrition is being administered, this is done on its own dedicated lumen.
                </td>
                <td>
                    <select id="paranteral_nutrition" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option >${cur_frm.doc.paranteral_nutrition ? cur_frm.doc.paranteral_nutrition: ""}</option>
                        
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </td>
            </tr>
            <tr style="text-align: center;">
                <td>
                    <span>Checked by:</span>
                    <input id="checked_by" readonly value='${frappe.session.user}' type="text" style="width: 50%; display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>
            </tr>
            </tb>
            
        </table>
        `
        $(frm.fields_dict["html_template"].wrapper).prepend(HTML_TEMPLATE);

	},
    inpatient_record: (frm) => {
        if (cur_frm.doc.inpatient_record && cur_frm.doc.inpatient_record != "") {
          frappe.require(
            "/assets/gch_inpatient/js/inpatient_record_utils.js",
            () => {
              block_nurse_from_editing(frm);
            }
          );
        }
        
    },
    on_submit: (frm) => {
        frappe.call({
            method: "gch_custom.gch_custom.doctype.nursing_checklist.nursing_checklist.creating_completed_nursing_tools",
            args: {
                "inpatient_record": cur_frm.doc.inpatient_record,
                "tool_name": cur_frm.doc.doctype,
                "tool_id": cur_frm.doc.name,
                "tool_link": `<a href='/app/central-line-maintenance-bundle-checklist/${cur_frm.doc.name}'><p style='color: blue;'>View</p></a>`
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
            method: "gch_inpatient.gch_inpatient.doctype.central_line_maintenance_bundle_checklist.central_line_maintenance_bundle_checklist.invoice_procedure_consumables",
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
