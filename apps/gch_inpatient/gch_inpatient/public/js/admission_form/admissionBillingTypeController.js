const admissionBillingTypeController = (frm) => {
  console.log("admissionBillingTypeController");

  switch (frm.doc.billing_type) {
    case "Corporate":
      console.log("Corporate");
      handleCorporatePay(frm);
      clearInsuranceFields(frm);
      break;
    case "Insurance":
      console.log("Insurance");
      handleInsurancePay(frm);
      break;
    case "Self Pay":
      console.log("Self Pay");
      clearInsuranceFields(frm);
      handleSelfPay(frm);
      break;
    case "Credit Card":
      console.log("Credit Card");
      clearInsuranceFields(frm);
      handleCreditCardPay(frm);
      break;
    case "Staff Clinic":
      console.log("Staff Clinic");
      clearInsuranceFields(frm);
      handleStaffClinicPay(frm);
      break;
    default:
      clearInsuranceFields(frm);
      console.log("default");
      break;
  }
};

const clearInsuranceFields = (frm) => {
  frm.set_value("insurance_category", "");
  frm.refresh_field("insurance_category");
  frm.set_value("principal_member", "");
  frm.refresh_field("principal_member");
  frm.set_value("insurance_member_id", "");
  frm.refresh_field("insurance_member_id");
  frm.set_value("principal_member_name", "");
  frm.refresh_field("principal_member_name");
};

const handleInsurancePay = (frm) => {
  // get patient insurances
  console.log("hello");
  let _patient = frm.doc.patient;
  frappe.call({
    method: "gch_inpatient.services.inpatient_billing.get_patient_insurances",

    args: {
      patient: _patient,
    },
    callback: (res) => {
      let { message: _insurances } = res;

      const _default_insurance = _insurances.find((i) => i.is_default == 1);

      if (!_default_insurance) {
        frappe.msgprint({
          title: "Success",
          indicator: "green",
          message: `Patient: ${_patient} has no default insurance kindly update patient record.`,
        });
        frm.set_value("billing_type", "");
        frm.refresh_field("billing_type");
        return;
      }
      console.log(_default_insurance);
      frm.set_value("insurance_category", _default_insurance.insurance__scheme);
      frm.refresh_field("insurance_category");
      frm.set_value("principal_member", _default_insurance.principal_member);
      frm.refresh_field("principal_member");
      frm.set_value("insurance_member_id", _default_insurance.membership_no);
      frm.refresh_field("insurance_member_id");

      // Fetching Principal Member Name
      frappe.db.get_value("Parent", {"name": _default_insurance.principal_member}, ['full_name']).then( (res) => {
        console.log(res, "Parent Name")

        frm.set_value("principal_member_name", res.message.full_name)
        frm.refresh_field("principal_member_name")

      })
    },
  });
};

const handleSelfPay = (frm) => {};

const handleCreditCardPay = (frm) => {};

const handleStaffClinicPay = (frm) => {};

const handleCorporatePay = (frm) => {};
