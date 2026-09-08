frappe.ui.form.on("Batch", {
    refresh: (frm) => {
        console.log("Hook on batch client script")
    },

    // Custom script to confirm if batch has been disabled to adjust quantity on the Item Master screen
    disabled: (frm) => {

        if (cur_frm.doc.disabled == 1) {
            msgprint("Disabling this batch will also remove associated quantities from all linked Warehouses")
        } else if (cur_frm.doc.disabled == 0 && cur_frm.doc.was_disabled == 1) {
            msgprint("Re-enabling this batch will return the removed stock levels when disabling it")
        }

    },

    before_save: (frm) => {

        if (cur_frm.doc.was_disabled == 0 && cur_frm.doc.disabled == 1) {
            // Set was disabled value to true to only run function once

            // Submit a material issue that removes the disabled batch quantity for all associated warehouses
            frappe.call({
                method: "gch_custom.services.rest.update_quanity_when_batch_is_disabled",
                args: {
                    item_code: cur_frm.doc.item,
                    batch_code: cur_frm.doc.batch_id

                },
                callback: (res) => {
                    console.log(res)
                    if(res.message == 1) {
                        frm.reload_doc()
                        frappe.msgprint("Batch quantites have been disabled in the respective warehouses")
                    }
                }
            })

        }

        if (cur_frm.doc.was_disabled == 1 && cur_frm.doc.disabled == 0) {
            // Set was disabled value to true to only run function once
            // cur_frm.set_value("was_disabled", 0)
            // cur_frm.refresh_field("was_disabled")

            // console.log("Here....")

            // Submit a material receipt that adds the disabled batch quantity for all associated warehouses
            frappe.call({
                method: "gch_custom.services.rest.update_quanity_when_batch_is_enabled",
                args: {
                    item_code: cur_frm.doc.item,
                    batch_code: cur_frm.doc.batch_id,
                    material_issue: cur_frm.doc.disabled_stock_material_issue

                },
                callback: (res) => {
                    console.log(res)
                    if(res.message == 1) {
                        frm.reload_doc()
                        frappe.msgprint("Previous disabled Batch quantity has been readded to the respective warehouses")
                    }
                }
            })

        }

    }

})