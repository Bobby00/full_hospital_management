// Copyright (c) 2024, Redward and contributors
// For license information, please see license.txt

frappe.ui.form.on('PCCU Overview', {
	onload: function(frm) {
        frappe.require(
            "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
            () => {
              handleHighlightedMenu(cur_frm);
            }
          );
    },
    refresh: function(frm) {
        frappe.require(
            "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
            () => {
              handleHighlightedMenu(cur_frm);
            }
        );

        // //  Check if Input Output chart exists and pull
        // frappe.db.get_all("Nursing Input Output Chart", {"inpatient_record": cur_frm.doc.inpatient_record}, ['name']).then( (res) => {
        //     console.log(res, "I/O list")
        // })

        frappe.call({
            method: "gch_pccu.gch_pccu.doctype.pccu_overview.pccu_overview.get_input_ouput_chart_list",
            args: {
                "inpatient_record": cur_frm.doc.inpatient_record
            },
            callback: (res) => {
                console.log(res, "I/O list")

            }
        })


        // Control size of HTML tag that holds the graph
        $('div[data-fieldname="pccu_vital_signs_graph"]').css("width", "75%")

        cur_frm.add_custom_button(__("Open Input Output Chart"), ()=> { 
            // Check if Input Output chart ecists
            frappe.db.get_value("Nursing Input Output Chart", {"inpatient_record": cur_frm.doc.inpatient_record}, ['name']).then((res) => {
                if(res.message.name) {
                    window.location.href = '/app/nursing-input-output-chart/' + res.message.name
                } else {
                    frappe.route_options = {
                        inpatient_record: cur_frm.doc.inpatient_record
                    }

                    frappe.new_doc("Nursing Input Output Chart")
                }
            })

         } )

         cur_frm.add_custom_button(__("Open Multidisciplinary"), ()=> { 
            
            frappe.db.get_value("Multidisciplinary", {"inpatient_record": cur_frm.doc.inpatient_record}, ['name']).then((res)=> {
                console.log(res)
                if (res.message.name) {
                    window.location.href = '/app/multidisciplinary/'+ res.message.name
                }
            })
            
        })

        // Load graph script for vitals if not already loaded
        let vitalsChart = document.createElement("script")

        vitalsChart.setAttribute("src", "/assets/gch_pccu/js/pccu_vitals_chart.js")
        document.body.appendChild(vitalsChart);


        // Bill Items
        frappe.require(
            "/assets/gch_inpatient/js/inpatient_record/inpatient_create_invoice.js",
            () => {
              handle_inpatient_create_invoice(cur_frm, true);
            }
        );

	}
});
