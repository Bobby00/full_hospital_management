// Copyright (c) 2023, Redward and contributors
// For license information, please see license.txt

let update_field_value = (selected) => {
  console.log(selected.value, "Fiiiirring!!!!!!!!");
  console.log(selected.id);

  let selected_option = selected.value;
  let selected_id = selected.id;

  cur_frm.set_value(selected_id, selected_option);
  cur_frm.refresh_field(selected_id);
};

window.update_field_value = update_field_value;

frappe.ui.form.on("VENTILATOR BUNDLE CHECKLIST", {
  refresh: function (frm) {
    if (cur_frm.doc.inpatient_record && cur_frm.doc.inpatient_record != "") {
      frappe.require(
        "/assets/gch_inpatient/js/inpatient_record_utils.js",
        () => {
          block_nurse_from_editing(frm);
        }
      );
    }
    // Hiding encounter side nav, but can be reopened
    $(".layout-side-section").css("display", "none");

    // Clearing tables to avoid duplication after save
    cur_frm.fields_dict["ventilator_bundle_html"].wrapper.innerHTML = "";

    // BUILDING VENTILATOR HTML TABLE
    let VENTILLATOR_HTML_TABLE = `
        <table style="background: lightskyblue" class="table table-bordered">
            <tr>
                <td>
                    Ventilator Day
                </td>

                <td>
                    <input type="text" value="${
                      cur_frm.doc.ventilator_day
                        ? cur_frm.doc.ventilator_day
                        : ""
                    }" id="ventilator_day" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>
            <tr>
                <td>
                    Date
                </td>

                <td>
                    <input type="date" value="${
                      cur_frm.doc.date ? cur_frm.doc.date : ""
                    }" id="date" data-date="" data-date-format="DD MMMM YYYY" onchange="update_field_value(this)" style="display: unset;" class="input-with-feedback form-control ellipsis"/>
                </td>

            </tr>
            <tr>
                <td>
                    Head of the bed 30 degrees
                </td>

                <td>
                    <select id="head_of_the_bed_thirty_degrees" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis" style="width: 30%;">
                        <option value="">${
                          cur_frm.doc.head_of_the_bed_thirty_degrees
                            ? cur_frm.doc.head_of_the_bed_thirty_degrees
                            : ""
                        }</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                        <option value="N/A">N/A</option>
                    </select>
                </td>

            </tr>
            <tr>
                <td>
                    Daily sedative interruption and daily assessment of readiness to extubate
                </td>

                <td>
                    <select id="daily_sedative_interruption_and_daily_assessment_of_readiness" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis" style="width: 30%;">
                        <option value="">${
                          cur_frm.doc
                            .daily_sedative_interruption_and_daily_assessment_of_readiness
                            ? cur_frm.doc
                                .daily_sedative_interruption_and_daily_assessment_of_readiness
                            : ""
                        }</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                        <option value="N/A">N/A</option>
                    </select>
                </td>

            </tr>
            <tr>
                <td>
                    PUD Prophylaxis
                </td>

                <td>
                    <select id="pud_prophylaxis" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis" style="width: 30%;">
                        <option value="">${
                          cur_frm.doc.pud_prophylaxis
                            ? cur_frm.doc.pud_prophylaxis
                            : ""
                        }</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                        <option value="N/A">N/A</option>
                    </select>
                </td>

            </tr>
            <tr>
                <td>
                    DVT Prophylaxis
                </td>

                <td>
                    <select id="dvt_prophylaxis" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis" style="width: 30%;">
                        <option value="">${
                          cur_frm.doc.dvt_prophylaxis
                            ? cur_frm.doc.dvt_prophylaxis
                            : ""
                        }</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                        <option value="N/A">N/A</option>
                    </select>
                </td>

            </tr>
            <tr>
                <td>
                    Daily Oral Care (6 hly& PRN oral care)
                </td>

                <td>
                    <select id="daily_oral_care" onchange="update_field_value(this)" class="input-with-feedback form-control ellipsis" style="width: 30%;">
                        <option value="">${
                          cur_frm.doc.daily_oral_care
                            ? cur_frm.doc.daily_oral_care
                            : ""
                        }</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                        <option value="N/A">N/A</option>
                    </select>
                </td>

            </tr>

        </table>
        
        `;

    $(frm.fields_dict["ventilator_bundle_html"].wrapper).prepend(
      VENTILLATOR_HTML_TABLE
    );
  },
  inpatient_record: function (frm) {
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
      method:
        "gch_custom.gch_custom.doctype.nursing_checklist.nursing_checklist.creating_completed_nursing_tools",
      args: {
        inpatient_record: cur_frm.doc.inpatient_record,
        tool_name: cur_frm.doc.doctype,
        tool_id: cur_frm.doc.name,
        tool_link: `<a href='/app/ventilator-bundle-checklist/${cur_frm.doc.name}'><p style='color: blue;'>View</p></a>`,
      },
      callback: (res) => {
        console.log(res, "============= SUBMITTEDDD ==========");
      },
    });
  },
});
