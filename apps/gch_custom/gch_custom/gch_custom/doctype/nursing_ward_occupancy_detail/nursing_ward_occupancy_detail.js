// Copyright (c) 2021, Karani and contributors
// For license information, please see license.txt

frappe.ui.form.on('Nursing Ward Occupancy Detail', {
	// refresh: function(frm) {

	// }
	setup: function (frm) {
		frm.set_query("ward_bed", function () {
			return {
				"filters": [
					["Nursing Ward Bed", "is_occupied", "=", 0],
					["Nursing Ward Bed", "is_locked", "=", 0]
				]
			}
		});
		frm.set_query("ward_cot", function () {
			return {
				"filters": [
					["Nursing Ward Cot", "is_occupied", "=", 0],
					["Nursing Ward Cot", "is_locked", "=", 0]
				]
			}
		})
	}
});

