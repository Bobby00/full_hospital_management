const field_list = [
    "generated_by",
    "generated_at",
    "level_1_approval",
    "level_1_approval_at",
    "level_2_approval",
    "level_2_approval_at",
    "section_addresses",
    "currency_and_price_list",
    "sec_warehouse",
    "apply_tds",
    "sb_last_purchase",
    "section_break_48",
    "taxes_section",
    "section_break_52",
    "sec_tax_breakup",
    "totals",
    "discount_section",
    "totals_section",
    "payment_schedule_section",
    "tracking_section",
    "terms_section_break",
    "column_break5",
    "subscription_section",
    "more_info",
    "schedule_date",
    "sent_to_supplier",
    "set_warehouse",
    "first_approval",
    "final_approval",
    "supplier_section",
    "before_items_section"
]

const Psi_field_list = [
    "generated_by",
    "generated_at",
    "level_1_approval",
    "level_1_approval_at",
    "level_2_approval",
    "level_2_approval_at",
    "section_addresses",
    "currency_and_price_list",
    "sec_warehouse",
    "apply_tds",
    "sb_last_purchase",
    "section_break_48",
    "taxes_section",
    "section_break_52",
    "sec_tax_breakup",
    "totals",
    "discount_section",
    "totals_section",
    "payment_schedule_section",
    "tracking_section",
    "terms_section_break",
    "column_break5",
    "subscription_section",
    "more_info",
    "schedule_date",
    "sent_to_supplier",
    "set_warehouse",
    "first_approval",
    "final_approval",
    "before_items_section",
    "second_approval"
]


const readonly_fields = [
    "rejected_by",
    "reject_reason"
]

const reject_purchase_order_with_comment = function(field_element){
    console.log("Button Pressed");
    field_element = field_element;
	
	frappe.prompt([
        {
            label: 'Reason for Rejecting Purchase Order',
            fieldname: 'comment',
            fieldtype: 'Text',
            reqd: 1
        }
    ],
    function(values) {
        console.log(values);

        // update doc
        frappe.call({
            method: "gch_purchases.services.reject_purchase_order_with_comment",
            args: {
                "purchase_order": cur_frm.doc.name,
                "comment": values.comment
            },
            callback: function(r) {
                if(r.message){
                    // frm.refresh();
                    frappe.ui.form.trigger('refresh', cur_frm.doc.doctype, cur_frm.doc.name);
                    frappe.show_alert({message: `Purchase Order Rejected successfuly`, indicator: 'green'});
                    cur_frm.reload_doc();
                }else{
                    frappe.show_alert({message: `Error Rejecting Purchase Order. Please try again`, indicator: 'red'})
                }
                
            }
        });
    },
    'Reject Purchase Order'
    );
}

const approve_purchase_order = (field_element) => {
    console.log("Approve Button Pressed");
	field_element = field_element;

    if(cur_frm.doc.workflow_state == "Pending PSI Review"){
        frappe.prompt(
            [
                {
                    label: "Review Actions Taken",
                    fieldname: "review_actions_taken",
                    fieldtype: "Text",
                    reqd: 1
                }
            ],
            function(values) {
                console.log(values);

                // update doc
                frappe.call({
                    method: "gch_purchases.services.approve_purchase_order_with_comment",
                    args: {
                        "purchase_order": cur_frm.doc.name,
                        "comment": values.review_actions_taken
                    },
                    callback: function(r) {
                        if(r.message){
                            // frm.refresh();
                            frappe.ui.form.trigger('refresh', cur_frm.doc.doctype, cur_frm.doc.name);
                            frappe.show_alert({message: `Purchase Order Approved successfuly`, indicator: 'green'});
                            cur_frm.reload_doc();
                        }else{
                            frappe.show_alert({message: `Error Approving Purchase Order. Please try again`, indicator: 'red'})
                        }
                    }
                })
                    
            }
        )
    } else{
        frappe.call({
            method: "gch_purchases.services.approve_purchase_order",
            args: {
                "purchase_order": cur_frm.doc.name
            },
            callback: function(r) {
                if(r.message){
                    // frm.refresh();
                    frappe.ui.form.trigger('refresh', cur_frm.doc.doctype, cur_frm.doc.name);
                    frappe.show_alert({message: `Purchase Order Approved successfuly`, indicator: 'green'});
                    cur_frm.reload_doc();
                }else{
                    frappe.show_alert({message: `Error Approving Purchase Order. Please try again`, indicator: 'red'})
                }

            }
        });
    }

	
}

const return_for_review = function(field_element){
    console.log("Button Pressed");
    field_element = field_element;
	
	frappe.prompt([
        {
            label: 'Review Reason',
            fieldname: 'comment',
            fieldtype: 'Text',
            reqd: 1
        }
    ],
    function(values) {
        console.log(values);

        // update doc
        frappe.call({
            method: "gch_purchases.services.return_for_review",
            args: {
                "purchase_order": cur_frm.doc.name,
                "comment": values.comment
            },
            callback: function(r) {
                if(r.message){
                    // frm.refresh();
                    frappe.ui.form.trigger('refresh', cur_frm.doc.doctype, cur_frm.doc.name);
                    frappe.show_alert({message: `Purchase Order sent for review`, indicator: 'green'});
                    cur_frm.reload_doc();
                }else{
                    frappe.show_alert({message: `Error Send for review Unsuccessful. Please try again`, indicator: 'red'})
                }
                
            }
        });
    },
    'Return Purchase Order for Review'
    );
}

frappe.ui.form.on("Purchase Order",{

    onload:(frm)=>{
        frm.add_custom_button(
            "Back to Queue",
            () => {                
                history.back();
            }
        );

        $('[class="actions-btn-group"]').hide()   
        
        $('.btn-open-row').hide();
    },


    
    after_workflow_action: (frm) => {
        frappe.call({
            method: "gch_purchases.services.notify_queue_purchase_order",
            args: {
                "purchase_order": frm.doc.name,
                "current_workflow_state": frm.doc.workflow_state
            },
            callback: (res) => {
                console.log(res);
            }
        })
    },

    setup: (frm) => {
        let user_ = frappe.user  
        
        if(!user_.has_role('GCH-Clinical Supplier Officer')){
            frappe.require("/assets/gch_custom/js/gch_utilities/index.js", () => {
                field_list.forEach((field) =>{
                    toggle_permission(frm, field, true)
                })
                readonly_fields.forEach((field) => {
                    frm.set_df_property(field, 'read_only', 1);
                })
            });
        }else {
            frappe.require("/assets/gch_custom/js/gch_utilities/index.js", () => {
                Psi_field_list.forEach((field) =>{
                    toggle_permission(frm, field, true)
                })
                readonly_fields.forEach((field) => {
                    frm.set_df_property(field, 'read_only', 1);
                })
            });
        }

        frm.add_custom_button(
            "Back to Queue",
            () => {                
                history.back();
            }
        );
        // frm.set_df_property("required_by", "reqd", 0);
    },

    refresh: (frm) => {
        let user_ = frappe.user
        let branch = ""
        let warehouse = ""

        if(frm.doc.__islocal){
            frappe.call({
                method: "gch_purchases.services.get_user_branch_and_warehouse",
                callback: (res)=> {
                    if(res.message){
                        branch = res.message.branch
                        warehouse = res.message.warehouse
                        frm.set_value("branch", branch)
                        frm.set_value("warehouse", warehouse)
                        frm.refresh_field("branch")
                        frm.refresh_field("warehouse")
                    }
                }
            })
        }
        
        if(!user_.has_role('GCH-Clinical Supplier Officer')){
            frappe.require("/assets/gch_custom/js/gch_utilities/index.js", () => {
                field_list.forEach((field) =>{
                    toggle_permission(frm, field, true)
                })
                readonly_fields.forEach((field) => {
                    frm.set_df_property(field, 'read_only', 1);
                })
            });
        }else {
            frappe.require("/assets/gch_custom/js/gch_utilities/index.js", () => {
                Psi_field_list.forEach((field) =>{
                    toggle_permission(frm, field, true)
                })
                readonly_fields.forEach((field) => {
                    frm.set_df_property(field, 'read_only', 1);
                })
            });
        }
        

        if((user_.has_role('GCH-Chief Pharmacist')  && cur_frm.doc.docstatus == 0 && cur_frm.doc.workflow_state == "Pending Chief Pharmacy Approval")){
            
            frm.add_custom_button(
                "Approve",
                () => approve_purchase_order(this),
                "Actions");
            frm.add_custom_button(
                "Reject PO",
                () => reject_purchase_order_with_comment(this),
                "Actions");
            frm.add_custom_button(
                "Return For Review",
                () => return_for_review(this),
                "Actions");
        }

        if((user_.has_role('GCH-Surgical Manager')  && cur_frm.doc.docstatus == 0 && cur_frm.doc.workflow_state == "Pending Surgical Manager Approval")){
            
            frm.add_custom_button(
                "Approve",
                () => approve_purchase_order(this),
                "Actions");
            frm.add_custom_button(
                "Reject PO",
                () => reject_purchase_order_with_comment(this),
                "Actions");
            frm.add_custom_button(
                "Return For Review",
                () => return_for_review(this),
                "Actions");
        }

        if((user_.has_role('GCH-Dental Manager')  && cur_frm.doc.docstatus == 0 && cur_frm.doc.workflow_state == "Pending Dental Manager Approval")){
            
            frm.add_custom_button(
                "Approve",
                () => approve_purchase_order(this),
                "Actions");
            frm.add_custom_button(
                "Reject PO",
                () => reject_purchase_order_with_comment(this),
                "Actions");
            frm.add_custom_button(
                "Return For Review",
                () => return_for_review(this),
                "Actions");
        }

        if((user_.has_role('GCH-Clinical Supplier Incharge')  && cur_frm.doc.docstatus == 0 && (cur_frm.doc.workflow_state == "Pending PSI Approval" || cur_frm.doc.workflow_state == "Pending PSI Review"))){
            frm.add_custom_button(
                "Approve",
                () => approve_purchase_order(this),
                "Actions");
            frm.add_custom_button(
                "Reject PO",
                () => reject_purchase_order_with_comment(this),
                "Actions");
            frm.add_custom_button(
                "Return For Review",
                () => return_for_review(this),
                "Actions");
        }

        if((user_.has_role('GCH-Clinical Supplier Officer')  && cur_frm.doc.docstatus == 0 && (cur_frm.doc.workflow_state == "Pending Review"))){
            frm.add_custom_button(
                "Approve",
                () => approve_purchase_order(this),
                "Actions");
            frm.add_custom_button(
                "Reject PO",
                () => reject_purchase_order_with_comment(this),
                "Actions");
        }

        frm.add_custom_button(
            "Back to Queue",
            () => {                
                history.back();               
            }
        );

        
    },

    validate: (frm) => {
        frm.doc.items.forEach((item) => {
            if(item.qty %1 !== 0 || item.qty <= 0){
                frappe.msgprint(__('Quantity must be a Positive Whole number.'));
                frappe.validated = false;
                return;
            }
        });
    }
});

frappe.ui.form.on("Purchase Order Item",{
    item_code: async(frm,cdt,cdn) => {

        // get date tommorow
        var date = frappe.datetime.add_days(frappe.datetime.get_today(), 2);

        var pack_size = 0;
        var rate = 0;
        var selling_unit_price = 0;
        var child = locals[cdt][cdn];
        var item_code = child.item_code;
        var selected_supplier = "";
        let warehouse = frm.doc.warehouse
        
        await frappe.call({
            method: 'gch_purchases.services.get_item_defaults',
            args: {
                item_code: item_code,
                warehouse: warehouse
            },
            callback: (res) => {
                console.log(res.message);
                pack_size = res.message.pack_size   
                if(res.message[0].item_defaults[0].default_supplier){
                    selected_supplier = res.message[0].item_defaults[0].default_supplier
                    pack_size = res.message[0]?.pack_size
                    selling_unit_price = res.message[1]?.price_list_rate
                } else {
                    console.log("NO supplier");
                    selected_supplier = "Main Stores"

                    // frappe.throw("This Item Has no default supplier, Contact main stores for assistance.")
                }
            }
        })

        let row = locals[cdt][cdn];
        row.schedule_date = date;
        row.pack_size = pack_size;
        row.selling_unit_price = selling_unit_price;
        row.warehouse = warehouse;

        frm.refresh_field("items")
    }
})