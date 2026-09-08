// Copyright (c) 2023, Redward, Levy Riungu and contributors
// For license information, please see license.txt

const field_list = [
	"section_break_2"
]

let update_field_value = (selected) => {
    console.log(selected.value, "Fiiiirring!!!!!!!!")
    console.log(selected.id)

    let selected_option = selected.value
    let selected_id = selected.id

    cur_frm.set_value(selected_id, selected_option)
    cur_frm.refresh_field(selected_id)

}

window.update_field_value = update_field_value;

frappe.ui.form.on('SSI PREVENTION CHECKLIST', {
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
				<th scope="col">THE BUNDLE</th>
				<th scope="col">CRITERIA</th>
				<th scope="col">YES/NO/NA</th>
			</tr>
            <tr>
                <td>
                    If at all possible avoid hair removal; if hair removal is necessary,avoid the use of razors
                </td>
				<td>
                    Hair removal was avoided of clippers were used.
                </td>
                <td>
                    <select id="hair_removal" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
                        <option>${cur_frm.doc.hair_removal ? cur_frm.doc.hair_removal: ""}</option>
                        
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                        <option value="N/A">N/A</option>
                    </select>
                </td>
            </tr>
            <tr>
				<td>
					Ensure prophylaxis antibiotic is appropriate.
				</td>
				<td>
					Was Prescription of prophylaxis antibiotics appropriate?
				</td>
				<td>
					<select id="prophylaxis_antibiotics" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
						<option>${cur_frm.doc.prophylaxis_antibiotics ? cur_frm.doc.prophylaxis_antibiotics: ""}</option>
						
						<option value="YES">YES</option>
						<option value="NO">NO</option>
						<option value="N/A">N/A</option>
					</select>
				</td>
            </tr>
            <tr>
				<td>
					Ensure prophylaxis antibiotic is adiministered within 60 minutes prior to the operation.
				</td>
				<td>
					Was prophylaxis antibiotic administered within 60 minutes prior to the operation?
				</td>
				<td>
					<select id="prophylaxis_admin_time" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
						<option>${cur_frm.doc.prophylaxis_admin_time ? cur_frm.doc.prophylaxis_admin_time: ""}</option>
						
						<option value="YES">YES</option>
						<option value="NO">NO</option>
						<option value="N/A">N/A</option>
					</select>
				</td>
            </tr>
            <tr>
				<td>
					Ensure the patient's body temparature was normal throughout the operation (excludes cardiac patients).
				</td>
				<td>
					Was the patient's body temperature normal throughout the operation?(Unless where it was intentionally lowered e.g in cardiac surgeries or was abnormal even before operation).
				</td>
				<td>
					<select id="normal_temperature" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
						<option>${cur_frm.doc.normal_temperature ? cur_frm.doc.normal_temperature: ""}</option>
						
						<option value="YES">YES</option>
						<option value="NO">NO</option>
						<option value="N/A">N/A</option>
					</select>
				</td>

            </tr>
            <tr>
				<td>
					Ensure the patient's body glucose level was normal throughout the operation(Diabetic patients only)
				</td>
				<td>
					Was the patient's body body glucose level normal throughout the operation? (Diabetic patients only).
				</td>
				<td>
					<select id="blood_glucose" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
						<option>${cur_frm.doc.blood_glucose ? cur_frm.doc.blood_glucose: ""}</option>
						
						<option value="YES">YES</option>
						<option value="NO">NO</option>
						<option value="N/A">N/A</option>
					</select>
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
                "tool_link": `<a href='/app/ssi-prevention-checklist/${cur_frm.doc.name}'><p style='color: blue;'>View</p></a>`
            },
            callback: (res) => {
                console.log(res, "============= SUBMITTEDDD ==========")
            }
        })
    }
});
