const get_age = function (birth) {
  let ageMS = Date.parse(Date()) - Date.parse(birth);
  let age = new Date();
  age.setTime(ageMS);
  let years = age.getFullYear() - 1970;
  return (
    years +
    " Year(s) " +
    age.getMonth() +
    " Month(s) " +
    age.getDate() +
    " Day(s)"
  );
};

frappe.ui.form.on("Diabetology Form", {
  onload: function (frm) {
    const nowtime = frappe.datetime.now_datetime();
    frm.set_value("date", nowtime);
  },
  bmi: function (frm) {
    $(frm.fields_dict["bmi_html"].wrapper).html(
      `<strong class="mt-2 mb-2">${__("BMI")}</strong> : ${frm.doc.bmi}`
    );
  },
  height: function (frm) {
    $(frm.fields_dict["height_html"].wrapper).html(
      `<strong class="mt-2 mb-2">${__("HEIGHT")}</strong> : ${frm.doc.height}`
    );
  },
  weight: function (frm) {
    $(frm.fields_dict["weight_html"].wrapper).html(
      `<strong class="mt-2 mb-2">${__("WEIGHT")}</strong> : ${frm.doc.weight}`
    );
  },
  gender: function (frm) {
    $(frm.fields_dict["gender_html"].wrapper).html(
      `<strong class="mt-2 mb-2">${__("GENDER")}</strong> : ${frm.doc.gender}`
    );
  },
  dob: function (frm) {
    if (frm.doc.dob) {
      let age_str = get_age(frm.doc.dob);
      $(frm.fields_dict["age"].wrapper).html(
        `<strong class="mt-2 mb-2">${__("AGE")}</strong> : ${age_str}`
      );
    }
  },
});
