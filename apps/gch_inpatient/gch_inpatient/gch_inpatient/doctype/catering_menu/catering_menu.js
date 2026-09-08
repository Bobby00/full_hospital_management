// Copyright (c) 2023, Redward and contributors
// For license information, please see license.txt

frappe.ui.form.on('Catering Menu', {
	refresh: function(frm, cdt, cdn) {

        console.log("YEIIII BOY!")

        
        frm.set_query("nursing_ward_room", "catering_menu_ward_details", function(doc, cdt, cdn) {
            var item = locals[cdt][cdn];
            console.log(item, "Generics.....")

            return {
                // query: "gch_custom.services.rest.only_show_generic_name",
                filters: {
                    'nursing_ward': item.nursing_ward,
                }
            };
        });

        frm.set_query("nursing_ward_bed", "catering_menu_ward_details", function(doc, cdt, cdn) {
            var item = locals[cdt][cdn];
            console.log(item, "Generics.....")

            return {
                // query: "gch_custom.services.rest.only_show_generic_name",
                filters: {
                    'ward_room': item.nursing_ward_room,
                }
            };
        });


	}
});


// frappe.ui.form.on("Catering Menu Ward Details", {
//     nursing_ward_room: (frm, cdt, cdn) => {

//         // let row = locals[cdt][cdn];


//         // console.log(row, frm)


//         // console.log(frm)

//         // frm.set_query("clinical_procedure_template", "clinical_procedures", function(doc, cdt, cdn) {
//         //     var item = locals[cdt][cdn];
//         //     console.log(item, "Generics.....")
//         //     return {
//         //         // query: "gch_custom.services.rest.only_show_generic_name",
//         //         filters: {
//         //             'medical_department': "Surgical Clinic",
//         //         }
//         //     };
//         // });
        
//         // frm.set_query("nursing_ward_room", (doc, cdt) => {

//         //     console.log("Finally....")

//         //     return {
//         //         filters: [["ward_room", "in", ["NWDRM-GCHNWD-CASUALTY.00052"]]],
//         //     }

//         // })

//     },
    
// })
