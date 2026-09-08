function filterRouteAndPreparation(frm) {
  // Filters for Drug Route
  let selectedRouteArray = [];

  if (cur_frm.doc.route.length > 0) {
    cur_frm.doc.route.map((single_route) => {
      selectedRouteArray.push(single_route.drug_route);
    });
  }

  frm.fields_dict["generic_name_formulation"].grid.get_field(
    "route"
  ).get_query = function (doc, cdt, cdn) {
    var child = locals[cdt][cdn];
    if (selectedRouteArray.length > 0) {
      return {
        filters: [["route", "in", selectedRouteArray]],
      };
    }
  };

  frm.fields_dict["ageweight_band"].grid.get_field("route").get_query =
    function (doc, cdt, cdn) {
      var child = locals[cdt][cdn];
      if (selectedRouteArray.length > 0) {
        return {
          filters: [["route", "in", selectedRouteArray]],
        };
      }
    };

  // Filters for Drug Preparation
  let selectedPreparationArray = [];

  if (cur_frm.doc.preparation.length > 0) {
    cur_frm.doc.preparation.map((single_formula) => {
      selectedPreparationArray.push(single_formula.generic_drug_formula);
    });
  }

  frm.fields_dict["generic_name_formulation"].grid.get_field(
    "preparation"
  ).get_query = function (doc, cdt, cdn) {
    var child = locals[cdt][cdn];
    if (selectedPreparationArray.length > 0) {
      return {
        filters: [["formula", "in", selectedPreparationArray]],
      };
    }
  };

  frm.fields_dict["ageweight_band"].grid.get_field("preparation").get_query =
    function (doc, cdt, cdn) {
      var child = locals[cdt][cdn];
      if (selectedPreparationArray.length > 0) {
        return {
          filters: [["formula", "in", selectedPreparationArray]],
        };
      }
    };
}

// Start of a fucntion to get selected options for Drug UOM
function filterDrugUOMPreparation(frm) {
  let selectedPreparationArray = [];

  if (cur_frm.doc.preparation.length > 0) {
    cur_frm.doc.preparation.map((single_formula) => {
      selectedPreparationArray.push(single_formula.generic_drug_formula);
    });
  }

  frm.fields_dict["drug_uom"].grid.get_field("preparation").get_query =
    function (doc, cdt, cdn) {
      var child = locals[cdt][cdn];
      if (selectedPreparationArray.length > 0) {
        return {
          filters: [["formula", "in", selectedPreparationArray]],
        };
      }
    };
}
// End of a fucntion to get selected options for Drug UOM

// Start of a fucntion to get selected options for Standard Treatment Guideline
function filterStandardTreatmentGuidelinePreparation(frm) {
  let selectedPreparationArray = [];

  if (cur_frm.doc.preparation.length > 0) {
    cur_frm.doc.preparation.map((single_formula) => {
      selectedPreparationArray.push(single_formula.generic_drug_formula);
    });
  }

  frm.fields_dict["diagnosis"].grid.get_field("preparation").get_query =
    function (doc, cdt, cdn) {
      var child = locals[cdt][cdn];
      if (selectedPreparationArray.length > 0) {
        return {
          filters: [["formula", "in", selectedPreparationArray]],
        };
      }
    };
}
// End of a fucntion to get selected options for Standard Treatment Guideline

frappe.ui.form.on("Generic Drug Name", {
  setup: function (frm) {
    frm.set_query("code", function () {
      return {
        filters: [
          [
            "medical_code_standard",
            "in",
            ["ICD-11-Nonmedicinal", "ICD-11-Medicaments", "ATC", "GERTIES-GEN"],
          ],
        ],
      };
    });
  },

  route: function (frm) {
    filterRouteAndFormula(frm);
  },
  formula: function (frm) {
    filterRouteAndFormula(frm);
  },

  // Start of methods to get the options related to the selected option
  main_category(frm) {
    frappe
      .call({
        method: "gch_custom.services.rest.get_classifications",
        args: { main_category: frm.doc.main_category },
      })
      .done((r) => {
        frm.set_df_property("classification", "options", r.message);
      })
      .fail((f) => {
        console.log(f);
      });
  },

  classification(frm) {
    frappe
      .call({
        method: "gch_custom.services.rest.get_sub_classifications",
        args: { classification: frm.doc.classification },
      })
      .done((r) => {
        frm.set_df_property("sub_classification", "options", r.message);
      })
      .fail((f) => {
        console.log(f);
      });
  },
  // End of methods to get the options related to the selected option
});

frappe.ui.form.on("Generic Name Formulation", {
  generic_name_formulation_add(frm, cdt, cdn) {
    filterRouteAndPreparation(frm);
  },
});

frappe.ui.form.on("Generic Drug UOM", {
  drug_uom_add(frm, cdt, cdn) {
    filterDrugUOMPreparation(frm);
  },
});

frappe.ui.form.on("Age Weight Band Details", {
  ageweight_band_add(frm, cdt, cdn) {
    filterRouteAndPreparation(frm);
  },
});

frappe.ui.form.on("GCH Standard Treatment Guideline", {
  diagnosis_add(frm, cdt, cdn) {
    console.log("Running Run");
    filterStandardTreatmentGuidelinePreparation(frm);
  },
});
