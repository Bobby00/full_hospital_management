// Copyright (c) 2023, Redward, Levy Riungu and contributors
// For license information, please see license.txt

const field_list = [
	"section_break_12"
]

var user_list = []


const build_user_select_list = () => {
    let user_select_list = []
    user_list.forEach((user) => {
        user_select_list.push(
			`<option value="${user.full_name}">${user.full_name}</option>`
		)
    })
    return user_select_list

}

let update_field_value = (selected) => {
    console.log(selected.value, "Fiiiirring!!!!!!!!")
    console.log(selected.id)

    let selected_option = selected.value
    let selected_id = selected.id

    cur_frm.set_value(selected_id, selected_option)
    cur_frm.refresh_field(selected_id)

}

window.update_field_value = update_field_value;

frappe.ui.form.on('Pre Procedure Checklist', {
	refresh: async function(frm) {

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


		await frappe.call({
			method: "gch_inpatient.services.get_get_user_list",
			callback: (res) => {
				if (res.message) {
					user_list = res.message
					console.log(res.message);
				}
			}
		})

		frappe.require("/assets/gch_custom/js/gch_utilities/index.js", () => {
            field_list.forEach((field) =>{
                toggle_permission(frm, field, true)
            })
        });

        let date_today = frappe.datetime.now_date().split(" ")[0];
        cur_frm.set_value("date", date_today);

		// <input type="text" id="identity_checked_by" placeholder="Checked by" class="input-with-feedback form-control ellipsis" >


		let HTML_TEMPLATE = `
        
        <table style="background: lightskyblue" class="table table-bordered">
			<tr>
				<th scope="col">Pre-Procedure checks</th>
				<th scope="col">YES/NO/N/A</th>
				<th scope="col">Checked by</th>
				<th scope="col">Counter Checked by</th>
			</tr>
			<th>
				Check 1 - To be done before taking patient to procedure area
			</th>
			<tb>
				<tr>
					<td>
						Patient has been correctly identfied.
					</td>
					<td>
						<select id="patient_identity" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
							<option>${cur_frm.doc.patient_identity ? cur_frm.doc.patient_identity: ""}</option>
							
							<option value="YES">YES</option>
							<option value="NO">NO</option>
							<option value="N/A">N/A</option>
						</select>
					</td>
					<td>

					<input type="text" id="identity_checked_by" placeholder="Checked by" class="input-with-feedback form-control ellipsis" >

					</td>
					<td>
						<input type="text" id="identity_counter_checked_by" placeholder="Counter checked by" class="input-with-feedback form-control ellipsis" >
					</td>
				</tr>
				<tr>
					<td>
						Informed consent has been completed.
					</td>
					<td>
						<select id="informed_consent" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
							<option>${cur_frm.doc.informed_consent ? cur_frm.doc.informed_consent: ""}</option>
							
							<option value="YES">YES</option>
							<option value="NO">NO</option>
							<option value="N/A">N/A</option>
						</select>
					</td>
					<td>
						<input type="text" id="consent_checked_by" placeholder="Checked by" class="input-with-feedback form-control ellipsis" >
					</td>
					<td>
						<input type="text" id="consent_counter_checked_by" placeholder="Counter Checked by" class="input-with-feedback form-control ellipsis" >
					</td>
				</tr>
				<tr>
					<td>
						Procedure site has been marked with a site marker.
					</td>
					<td>
						<select id="site_marker" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
							<option>${cur_frm.doc.site_marker ? cur_frm.doc.site_marker: ""}</option>
							
							<option value="YES">YES</option>
							<option value="NO">NO</option>
							<option value="N/A">N/A</option>
						</select>
					</td>
					<td>
						<input type="text" id="site_marker_checked_by" placeholder="Checked by" class="input-with-feedback form-control ellipsis" >
					</td>
					<td>
						<input type="text" id="site_marker_counter_checked_by" placeholder="Counter Checked by" class="input-with-feedback form-control ellipsis" >
					</td>
					
				</tr>
				<tr>
					<td>
						Relevant diagnostic images are present.
					</td>
					<td>
						<select id="diagnostic_images" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
							<option>${cur_frm.doc.diagnostic_images ? cur_frm.doc.diagnostic_images: ""}</option>
							
							<option value="YES">YES</option>
							<option value="NO">NO</option>
							<option value="N/A">N/A</option>
						</select>
					</td>
					<td>
						<input type="text" id="diagnostic_images_checked_by" placeholder="Checked by" class="input-with-feedback form-control ellipsis" >
					</td>
					<td>
						<input type="text" id="diagnostic_images_counter_checked_by" placeholder="Counter Checked by" class="input-with-feedback form-control ellipsis" >
					</td>
					

				</tr>
				<tr>
					<td>
						Relevant pre-procedure preparations are present.
					</td>
					<td>
						<select id="pre_procedure_preparations" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
							<option>${cur_frm.doc.pre_procedure_preparations ? cur_frm.doc.pre_procedure_preparations: ""}</option>
							
							<option value="YES">YES</option>
							<option value="NO">NO</option>
							<option value="N/A">N/A</option>
						</select>
					</td>
					<td>
						<input type="text" id="pre_procedure_preparations_checked_by" placeholder="Checked by" class="input-with-feedback form-control ellipsis" >
					</td>
					<td>
						<input type="text" id="pre_procedure_preparations_counter_checked_by" placeholder="Counter Checked by" class="input-with-feedback form-control ellipsis" >
					</td>
					

				</tr>
			</tb>

			<th>
				Check 2 (Time-Out)-To be performed just before the start of the procedure.
			</th>
            <tb>
			<tr>
				<td>
					Patient identity verified.
				</td>
				<td>
					<select id="identity_verification" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
						<option>${cur_frm.doc.identity_verification ? cur_frm.doc.identity_verification: ""}</option>
						
						<option value="YES">YES</option>
						<option value="NO">NO</option>
						<option value="N/A">N/A</option>
					</select>
				</td>
				<td>
					<input type="text" id="identity_verification_checked_by" placeholder="Checked by" class="input-with-feedback form-control ellipsis" >
				</td>
				<td>
					<input type="text" id="identity_verification_counter_checked_by" placeholder="Counter Checked by" class="input-with-feedback form-control ellipsis" >
				</td>				

			</tr>

			<tr>
				<td>
					Procedure to be done verified.
				</td>
				<td>
					<select id="procedure_verification" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
						<option>${cur_frm.doc.procedure_verification ? cur_frm.doc.procedure_verification: ""}</option>
						
						<option value="YES">YES</option>
						<option value="NO">NO</option>
						<option value="N/A">N/A</option>
					</select>
				</td>
				<td>
					<input type="text" id="procedure_verification_checked_by" placeholder="Checked by" class="input-with-feedback form-control ellipsis" >
				</td>
				<td>
					<input type="text" id="procedure_verification_counter_checked_by" placeholder="Counter Checked by" class="input-with-feedback form-control ellipsis" >
				</td>				

			</tr>

			<tr>
				<td>
					Procedure side and site reconfirmed including site mark visualization.
				</td>
				<td>
					<select id="site_reconfirmed" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
						<option>${cur_frm.doc.site_reconfirmed ? cur_frm.doc.site_reconfirmed: ""}</option>
						
						<option value="YES">YES</option>
						<option value="NO">NO</option>
						<option value="N/A">N/A</option>
					</select>
				</td>
				<td>
					<input type="text" id="site_reconfirmation_checked_by" placeholder="Checked by" class="input-with-feedback form-control ellipsis" >
				</td>
				<td>
					<input type="text" id="site_reconfirmation_counter_checked_by" placeholder="Counter Checked by" class="input-with-feedback form-control ellipsis" >
				</td>				

			</tr>

			<tr>
				<td>
					Patient positioning for procedure verified.
				</td>
				<td>
					<select id="patient_positioning" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
						<option>${cur_frm.doc.patient_positioning ? cur_frm.doc.patient_positioning: ""}</option>
						
						<option value="YES">YES</option>
						<option value="NO">NO</option>
						<option value="N/A">N/A</option>
					</select>
				</td>
				<td>
					<input type="text" id="positioning_checked_by" placeholder="Checked by" class="input-with-feedback form-control ellipsis" >
				</td>
				<td>
					<input type="text" id="positioning_counter_checked_by" placeholder="Counter Checked by" class="input-with-feedback form-control ellipsis" >
				</td>				

			</tr>

			<tr>
				<td>
					As appropriate, imaging, equipment, implants or special requirements verified.
				</td>
				<td>
					<select id="final_verification" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis">
						<option>${cur_frm.doc.final_verification ? cur_frm.doc.final_verification: ""}</option>
						
						<option value="YES">YES</option>
						<option value="NO">NO</option>
						<option value="N/A">N/A</option>
					</select>
				</td>
				<td>
					<input type="text" id="final_verification_checked_by" placeholder="Checked by" class="input-with-feedback form-control ellipsis" >
				</td>
				<td>
					<input type="text" id="final_verification_counter_checked_by" placeholder="Counter Checked by" class="input-with-feedback form-control ellipsis" >
				</td>				

			</tr>

            </tb>
            
        </table>
        `
        $(frm.fields_dict["html_template"].wrapper).prepend(HTML_TEMPLATE);

	},
    on_submit: (frm) => {
        frappe.call({
            method: "gch_custom.gch_custom.doctype.nursing_checklist.nursing_checklist.creating_completed_nursing_tools",
            args: {
                "inpatient_record": cur_frm.doc.inpatient_record,
                "tool_name": 'PRE-PROCEDURE AND TIMEOUT CHECKLIST FOR OUT OF THEATRE SURGICAL PROCEDURES',
                "tool_id": cur_frm.doc.name,
                "tool_link": `<a href='/app/pre-procedure-checklist/${cur_frm.doc.name}'><p style='color: blue;'>View</p></a>`
            },
            callback: (res) => {
                console.log(res, "============= SUBMITTEDDD ==========")
            }
        })
    }

});
