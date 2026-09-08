let user_warehouse = "";


const approve_stock_transfer = async(doc_name)=>{
    console.log("Approve");
    
    await frappe.call({
        method: "gch_purchases.services.approve_stock_transfer",
        args: {
            name: doc_name
        },
        callback: (res)=>{
            if(res.message){
                frappe.show_alert({
                    indicator: 'green',
                    message: 'Stock Transfer Approved',
                    title: 'Success'
                })
                cur_frm.reload_doc();
            }
        }
    })
}

const decline_stock_transfer = async(doc_name)=>{
    console.log("Decline");

    frappe.prompt([
        {
            label: 'Reason for Rejecting Request',
            fieldname: 'comment',
            fieldtype: 'Text',
            reqd: 1
        }
    ],
    function(values) {
        console.log(values);

        // update doc
        frappe.call({
            method: "gch_purchases.services.decline_stock_transfer",
            args: {
                name: doc_name,
                reason: values.comment
            },
            callback: (res)=>{
                if(res.message){
                    frappe.show_alert({
                        indicator: 'red',
                        message: 'Request declined',
                        title: 'Success'
                    })
                    cur_frm.reload_doc();
                } else {
                    cur_frm.reload_doc();
                    frappe.show_alert({
                        indicator: 'red',
                        message: 'Error declining request, Please try again',
                        title: 'Error'
                    })
                }
            }
        })
    },
    'Reject Request'
    );
}

const receive_stock = async(doc_name)=>{
    console.log("Receive");
    await frappe.call({
        method: "gch_purchases.services.receive_stock",
        args: {
            name: doc_name
        },
        callback: (res)=>{
            if(res.message){
                frappe.show_alert({
                    indicator: 'green',
                    message: 'Stock received',
                    title: 'Success'
                })
                cur_frm.reload_doc();
            }
        }
    })
}


frappe.ui.form.on("Stock Entry", {
    setup: async (frm) => {
        frappe.call({
            method: "gch_purchases.services.set_global_warehouse",
        })
    },

    before_save: (frm) => {
        console.log(frm);
    },
    onload: async(frm) => {

        let warehouse = ""
        await frappe.call({
            method: "gch_purchases.services.get_warehouse",
            callback: (res)=>{
                if(res.message){
                    warehouse = res.message;
                }
            }
        })


        if(frm.doc.stock_entry_type == "Material Transfer"){
            $('.primary-action').hide();
            $("button[data-label='Submit']").hide();

            console.log("Material Transfer");
        }

        if(frm.doc.stock_entry_type == "Material Transfer" && frm.doc.docstatus == 0 && frm.doc.status !="Declined") {
            console.log("Material Transfer");
            console.log(warehouse);
            console.log(frm.doc.s_warehouse);

            if(frm.doc.from_warehouse == warehouse){
                frm.add_custom_button(
                    "Approve",
                    () => approve_stock_transfer(frm.doc.name),
                    "Actions"
                );
                frm.add_custom_button(
                    "Decline",
                    () => decline_stock_transfer(frm.doc.name),
                    "Actions"
                );
            }else if(frm.doc.to_warehouse == warehouse && frm.doc.status == "In-transit"){
                frm.add_custom_button(
                    "Receive",
                    () => receive_stock(frm.doc.name),
                    "Actions"
                );
            }


            $('.primary-action').hide();
            $("button[data-label='Submit']").hide();
        }
    },

    refresh: async (frm) => {

        let warehouse = ""
        await frappe.call({
            method: "gch_purchases.services.get_warehouse",
            callback: (res)=>{
                if(res.message){
                    warehouse = res.message;
                }
            }
        })

        if(frm.doc.stock_entry_type == "Material Transfer" && frm.doc.docstatus == 0 && frm.doc.status !="Declined") {
            
            console.log("Material Transfer");
            $('.primary-action').hide();

            // $("button[data-label='Submit']").hide();

        }
    },
    on_submit: (frm) => {
        console.log("Material Transfer");
    }
})