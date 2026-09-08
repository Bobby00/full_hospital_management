frappe.provide("frappe.gch_custom");

var parts = `${window.location.pathname}/`.split('/');
var ward_name = decodeURI(parts.pop() || parts.pop());

frappe.pages["nursing-ward-detail"].on_page_load = function (wrapper) {
  var wardpage = frappe.gch_custom.nursing_ward_detail;
  wardpage.setup(wrapper);
  $(wrapper).bind("show", () => {
    wardpage.refresh();
  });
};

frappe.gch_custom.nursing_ward_detail = {
  addfilters: function () {

  },
  setup: function (wrapper, filters) {
    var parts = `${window.location.pathname}/`.split('/');
    var ward_name = decodeURI(parts.pop() || parts.pop());
    this.page = frappe.ui.make_app_page({
      parent: wrapper,
      title: `${ward_name} Nursing Ward`,
      single_column: true,
    });
    this.wrapper = $(wrapper);
    // this.main_section = this.wrapper.find(".layout-main-section");
    // this.page.set_title("Employee Profile");
    this.page.clear_fields();
	template_name = 'nursing_ward_detail'
	console.log(this.page)
	console.log(locals.Page)
	// delete locals.Page[this.page]
    // delete frappe.pages[this.page.page_name]
    // delete frappe.templates[template_name]
    // delete frappe.template.debug[template_name]
    // delete frappe.template.compiled[template_name]
    // frappe.views.pageview.show(this.page.page_name)

    // this.page.refresh();
    // frappe.breadcrumbs.add("Credence");
    // this.main_section.append(`<div id="employee-profile"> </div>`);
    // $(frappe.render_template('nursing-ward-detail', this))
  },
  refresh: function (wrapper) {
    console.log("Refreshing")
	console.log(wrapper)
	console.log(locals.Page)
	// delete locals.Page 

    // this.setup(this.wrapper, this.addfilters());
    template_name = "nursing_ward_detail"
    delete locals.Page["nursing-ward-detail"]

	delete frappe.pages["nursing-ward-detail"]
	
    delete frappe.templates[template_name]
    delete frappe.template.debug[template_name]
    delete frappe.template.compiled[template_name]
    // frappe.views.pageview.show("nursing-ward-detail")
    $(frappe.render_template(frappe.templates.nursing_ward_detail, this)).appendTo(wardpage.main);
  }
}
