frappe.listview_settings["Lct Member"] = {
  filters: [["outpatient_status", "=", "Active"]],

  onload(listview) {
    console.log("HEY");
  },

  before_render() {
    // triggers before every render of list records
    console.log("HEY");
  },
};
