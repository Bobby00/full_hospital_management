frappe.ui.form.on("Pick List",{
    before_save: (frm) => {
        console.log(frm.doc.material_request)
    },
    onload: (frm) => {
        console.log(frm.doc, "PPPPPPPPIIIIIIIIIIIIIIIIIIIIIIIIII");

        frm.set_df_property("parent_warehouse", "hidden", true)
        // frm.set_df_property("get_item_locations", "hidden", 1)

        

    },

    on_submit: function(frm) {
        console.log(frm.doc, "PPPPPPPPIIIIIIIIIIIIIIIIIIIIIIIIII");
        let hapa = frm.doc.material_request
        frappe.call({
            method: "gch_purchases.services.update_material_request_status",
            args: {"material_request":hapa},
            callback: (res) => {
                console.log(res)
                if(res.message){
                    let items = res.message
                    console.log("iTTTTTTTTEEEEEEEEEEEms",items)
                }
            }
        })

    }
})