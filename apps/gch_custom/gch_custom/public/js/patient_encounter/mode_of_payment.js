const handle_mode_of_payment = (frm) => {
  if (frm.doc.mode_of_payment == "Insurance") {
    frappe.require("/assets/gch_custom/js/patient_encounter/lct.js", () => {
      handle_lct(frm);
    });
    frappe.require("/assets/gch_custom/js/patient_encounter/slade.js", () => {
      handle_slade(frm);
    });
    if (frm.doc.patient) {
      //  get medical
      // Parent Medical Cover Detail
      const patient_insurance_list = get_patient_insurance(frm.doc.patient);

      console.log(patient_insurance_list);

      if (patient_insurance_list.length > 0) {
        let insurances = [];
        for (let index = 0; index < patient_insurance_list.length; index++) {
          const insurance = patient_insurance_list[index];
          insurances.push(insurance.insurance__scheme);
          if (insurance.is_default) {
            // "principal_member", "membership_no"
            frm.set_value("principal_member", insurance.principal_member);
            frm.refresh_field("principal_member");
            frm.set_value("membership_no", insurance.membership_no);
            frm.refresh_field("membership_no");
            frm.set_value("default_insurance", insurance.insurance__scheme);
            frm.refresh_field("default_insurance");
          }
        }
        frm.set_query("default_insurance", function () {
          return {
            filters: [["name", "in", [...insurances, "general"]]],
          };
        });
      } else {
        frm.set_query("default_insurance", function () {
          return {
            filters: [["name", "in", ["general"]]],
          };
        });
      }
    }
  }
};

const get_patient_insurance = (patient) => {
  let patient_insurance_list;
  frappe
    .call({
      method: "gch_custom.services.rest.get_patient_insurance",
      args: { patient },
    })
    .done((r) => {
      patient_insurance_list = r.message;
    });
  return patient_insurance_list;
};
