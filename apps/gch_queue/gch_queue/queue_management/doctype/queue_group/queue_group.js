// Copyright (c) 2021, Karani and contributors
// For license information, please see license.txt

frappe.ui.form.on('Queue Group', {
	refresh: function(frm) {
        // FILTERING SERVICE UNIT TO ONLY SHOW NON-DISABLED CLINICS
        frm.set_query("service_unit", function () {
            return {
            filters: [["disable_service_unit", "in", ["0"]]],
            };
        });
	}
});
