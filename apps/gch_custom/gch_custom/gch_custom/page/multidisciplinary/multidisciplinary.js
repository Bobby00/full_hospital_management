frappe.pages["multidisciplinary"].on_page_load = function (wrapper) {
  new MultidisciplinaryPage(wrapper);
};

let multidisciplinary_data = async () => {


  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const encounter = urlParams.get('encounter')

  console.log(encounter)

  let multidisciplinary_data = await frappe.call({
    method:
      "gch_custom.gch_custom.page.multidisciplinary.multidisciplinary.get_multidisciplinary_data",
      args: { encounter_number: encounter},
  });

  console.log(multidisciplinary_data.message);

  return multidisciplinary_data.message;
};

let OurLoop = async () => await multidisciplinary_data();

MultidisciplinaryPage = Class.extend({
  init: function (wrapper) {
    this.page = frappe.ui.make_app_page({
      parent: wrapper,
      title: "Multidisciplinary",
      single_column: true,
    });

    this.make();
  },

  make: async function () {
    this.multidisciplinary_data = await multidisciplinary_data();
    $(frappe.render_template("multidisciplinary", this)).appendTo(
      this.page.main
    );
  },
});
