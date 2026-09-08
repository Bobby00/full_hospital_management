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

const setOtherFieldToMandatory = (
  frm,
  FIELD,
  OTHER_FIELD,
  CONDITION_OPTION
) => {
  var element = frm.doc[FIELD];

  let hasOther = element.some(
    (el) => el[FIELD]?.toLowerCase() == CONDITION_OPTION
  );
  if (hasOther) {
    frm.set_df_property(OTHER_FIELD, "reqd", 1);
  } else {
    frm.set_df_property(OTHER_FIELD, "reqd", 0);
  }
  frm.toggle_display([OTHER_FIELD], hasOther);
  frm.refresh_field(OTHER_FIELD);
};

frappe.ui.form.on("Gastroentology Form", {
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
  character_of_pain: function (frm) {
    const OTHER_FIELD = "character_of_pain_other";
    const FIELD = "character_of_pain";
    setOtherFieldToMandatory(frm, FIELD, OTHER_FIELD, "other");
  },

  character_of_pain_reliever: function (frm) {
    const OTHER_FIELD = "character_of_pain_reliever_other";
    const FIELD = "character_of_pain_reliever";

    setOtherFieldToMandatory(
      frm,
      FIELD,
      "character_of_pain_reliever_medication",
      "medication"
    );
    setOtherFieldToMandatory(frm, FIELD, OTHER_FIELD, "other");
  },
  abdomenal_pain_location: function (frm) {
    const OTHER_FIELD = "abdomenal_pain_location_other";
    const FIELD = "abdomenal_pain_location";
    setOtherFieldToMandatory(frm, FIELD, OTHER_FIELD, "other");
  },
  abdomenal_pain_occurrence: function (frm) {
    const OTHER_FIELD = "abdomenal_pain_occurrence_other";
    const FIELD = "abdomenal_pain_occurrence";
    setOtherFieldToMandatory(frm, FIELD, OTHER_FIELD, "other");
  },
  abdomenal_pain_aggravator: function (frm) {
    const OTHER_FIELD = "abdomenal_pain_aggravator_other";
    const FIELD = "abdomenal_pain_aggravator";
    setOtherFieldToMandatory(frm, FIELD, OTHER_FIELD, "other");
  },
  other_gastro_symptoms: function (frm) {
    const OTHER_FIELD = "other_gastro_symptoms_other";
    const FIELD = "other_gastro_symptoms";
    setOtherFieldToMandatory(frm, FIELD, OTHER_FIELD, "other");
    setOtherFieldToMandatory(frm, FIELD, "vomit", "vomit");
  },
});
