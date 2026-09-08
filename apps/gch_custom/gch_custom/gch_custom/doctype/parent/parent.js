// Copyright (c) 2021, Karani and contributors
// For license information, please see license.txt

frappe.ui.form.on("Parent", {});

frappe.ui.form.on("Parent Medical Cover Detail", {
  parent_medical_cover_details_add(frm, cdt, cdn) {
    frm.fields_dict["parent_medical_cover_details"].grid.get_field(
      "insurance__scheme"
    ).get_query = function (doc, cdt, cdn) {
      var child = locals[cdt][cdn];
      //console.log(child);

      let companyArray = [];

      let companies = cur_frm.doc.employer_details;
      if (companies.length > 0) {
        companies.forEach((s_company) => {
          companyArray.push(s_company.employer);
        });
      }

      if (companyArray.length > 0) {
        const employers = companyArray.filter(
          (value, index, self) => self.indexOf(value) === index
        );

        return {
          filters: [["corporate_company", "in", [...employers, "General"]]],
        };
      }
    };
  },
});
