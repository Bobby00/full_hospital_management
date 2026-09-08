
frappe.ui.form.on("Lab Test", {
    setup: function(frm){
        console.log("setup Lab Test");
        console.log(frm);
        if(frm.doc?.result_document_url && frm.doc?.result_document_url !== ""){
            console.log("result_document_url is not empty");
            // result_document_url
            $(frm.fields_dict['view_result'].wrapper).html(`<a class="btn btn-primary btn-sm" href="${frm.doc.result_document_url}" target="_blank">View Result</a>`);
        }
    },
    refresh: function(frm){
        if(frm.doc?.result_document_url && frm.doc?.result_document_url !== "" ){
            console.log("result_document_url is not empty");
            frm.add_custom_button(__("View Results"), function(){
                window.open(frm.doc?.result_document_url);
            }).addClass("btn-primary");
            // result_document_url
            $(frm.fields_dict['view_result'].wrapper).html(`<a class="btn btn-primary btn-sm" href="${frm.doc?.result_document_url}" target="_blank">Open Result</a>`);
            $(frm.fields_dict['lab_result_document'].wrapper).html(`<div>
            <iframe height="700px" src="${frm.doc?.result_document_url}" width="100%">
            </iframe></div>`);
        }
    },
    before_submit: async (frm) => {
        if(frm.doc.is_inpatient){
            await frappe.call({
                method: "gch_inpatient.services.add_lab_test_to_invoice",
                args: {
                    "lab_test": frm.doc.name,
                    "inpatient_record": frm.doc.inpatient_record,
                }
            })
            await frm.reload_doc();
        }
    }
})
