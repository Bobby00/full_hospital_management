const consume_stock_from_invoice = function (frm) {
    // console.log("button pressed",frm);
    let encounter = frm.doc.encounter;
    console.log(encounter,"Consuming stock..................");

    if(encounter){
        frappe.call({
            method: "gch_custom.services.reduce_stock",
            args: {
                encounter: frm.doc.encounter
            }, callback: function (data) {
                console.log(data);
                frappe.show_alert({
                    message:__(data.message),
                    indicator: 'green'
                }, 7);
            }
        });
    } else {
        frappe.call({
            method: "gch_custom.services.reduce_stock_from_invoice",
            args: {
                invoice: frm.doc.name
            }, callback: function (data) {
                console.log(data);
                frappe.show_alert({
                    message:__(data.message),
                    indicator: 'green'
                }, 7);
            }
        });
    }

    
}