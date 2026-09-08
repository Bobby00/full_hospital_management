const request_items_from_redistribution = async function(frm){
    console.log("Borrowed", frm.doc.items);

    let branch = ""
    let warehouse = ""
    await frappe.call({
        method: "gch_purchases.services.get_branch_and_warehouse",
        args: {
            item_code: frm.doc.item_code
        },
        callback: (res) => {
            if(res.message){
                branch = res.message.branch
                warehouse = res.message.warehouse
                // frm.set_value('branch', res.message.branch)
                // frm.set_value('warehouse', res.message.warehouse)
                // frm.set_value('declared_by', res.message.user)
            }
        }
    })

    if(warehouse == frm.doc.warehouse){
        frappe.throw("Cannot borrow from your own warehouse")
    } else {
        frappe.call({
            method: "gch_purchases.services.inititate_goods_transfer",
            args: {
                "items": frm.doc.items,
                "source_warehouse": frm.doc.warehouse
            },
            callback: (res) => {
                if(res.message){
                    console.log(res.message);
                }
            }
        })
    }

    
}

frappe.ui.form.on("Stock Available For Redistribution",{
    onload: function(frm) {

        
        if(frm.doc.__islocal == 1) {
            frappe.call({
                method: "gch_purchases.services.get_branch_and_warehouse",
                args: {
                    item_code: frm.doc.item_code
                },
                callback: (res) => {
                    if(res.message){
                        console.log(res.message);
                        frm.set_value('branch', res.message.branch)
                        frm.set_value('warehouse', res.message.warehouse)
                        // frm.set_value('declared_by', res.message.user)
                    }
                }
            })
        }

        frm.add_custom_button(
            "Request Items",
            () => request_items_from_redistribution(frm)
        );
    },

    refresh: function(frm){
        frm.add_custom_button(
            "Request Items",
            () => request_items_from_redistribution(frm)
        );
    }
});

frappe.ui.form.on("Stock Available For Redistribution Item",{
    quantity: (frm,cdt,cdn) => {

        let row = locals[cdt][cdn];
        let selected_quantity = row["quantity"];
        console.log(row);
        console.log("selected_quantity", selected_quantity);

        row.issued_quantity = 0;
        row.remaining_quantity = selected_quantity;

        frm.refresh_fields("items");

    },
    item_code: async (frm,cdt,cdn) => {
        let row = locals[cdt][cdn];

        let warehouse = ""
        let user_branch = ""

        await frappe.call({
            method: "gch_purchases.services.get_branch_and_warehouse",
            callback: (res) => {
                console.log(res.message)
                warehouse = res.message.warehouse
                user_branch = res.message.branch
            }
        });

        row.branch = user_branch
        row.warehouse = warehouse

        frm.refresh_fields("items");
    }
});