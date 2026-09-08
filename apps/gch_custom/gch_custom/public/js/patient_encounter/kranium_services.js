function convertDate(inputFormat) {
  function pad(s) {
    return s < 10 ? "0" + s : s;
  }
  var d = new Date(inputFormat);
  return [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join("-");
}

const handle_get_patient_physical_examinations = (frm, cur_frm) => {
  cur_frm.clear_table("kranium_physican_exams_table");
  cur_frm.refresh_fields("kranium_physican_exams_table");

  // message alert
  frappe.msgprint({
    title: __("Please wait"),
    indicator: "blue",
    message: __("Getting patient physical examinations..."),
  });

  frappe
    .call({
      method: "gch_custom.services.get_kranium_physical_exams",
      args: { patient: frm.doc.patient },
    })
    .done((r) => {
      // append respose to child table
      const data = r.message;

      data.forEach((history) => {
        console.log(history);

        const childTable = cur_frm.add_child("kranium_physican_exams_table");
        childTable.kranium_encounter = history.encounter;
        childTable.seen_by = history.seen_by;
        childTable.description = history.description;
        childTable.kranium_uhid = history.uhid;
        childTable.encounter_date = convertDate(history.encounter_date);
        childTable.medication =
          history.medication.length > 0
            ? history.medication
                .map(
                  (med) =>
                    `${med["Dosage"]} - ${med["Drug Name"]} (${med["Product Type"]}) : ${med["Frequency"]} for ${med["Duration"]}`
                )
                .join("\r\n")
            : "No Medication";
      });

      cur_frm.refresh_fields("kranium_physican_exams_table");
      frappe.msgprint({
        title: __("Success"),
        indicator: "green",
        message: __("Patient physical examinations fetched successfully"),
      });
    });
};
const handle_get_patient_medical_history = (frm, cur_frm) => {
  console.log("handle_get_patient_medical_history");
};
