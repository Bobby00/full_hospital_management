const fields_list =[
    "left_ear_results",
    "right_ear_results",
    "_followup_actions",
    "relative_with_ear_surgery",
    "relative_with_hearing_devices",
    "relative_with_hearing_loss"
]

const handle_wellbaby_audiology = (frm) => {
    frappe.require("/assets/gch_custom/js/gch_utilities/index.js", () => {
        console.log("Current Encounter WellBaby",frm.doc.name);
        
        frappe.call({
            method: "gch_custom.services.check_audiology",
            args: {
                encounter: frm.doc.name
            },
            callback: (res) => {
                if(res.message){
                    
                    console.log(res.message,"PrevIIIIIIIIIIIIIIOUUUUUUUUUUUs")
                    fields_list.forEach((field) =>{
                        toggle_permission(frm, field, false);
                        frm.set_df_property(field, "reqd", 0);
                        frm.refresh_field(field);
                    });
                }else {
                    if(frm.doc.clinic.includes("Wellbaby Growth Monitoring ")){
                        console.log(res.message,"WEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEWEEEEEEEEEEEEEEEE")
                        fields_list.forEach((field) => {
                            toggle_permission(frm, field, false);
                            frm.set_df_property(field, "reqd", 1);
                            frm.refresh_field(field);
                        })
                    } else if(frm.doc.clinic.includes("Wellbaby") && frm.doc.workflow_state.includes("Pending Vaccination")){
                        console.log(res.message,"Pending Vaccination")
                        fields_list.forEach((field) => {
                            toggle_permission(frm, field, false);
                            frm.set_df_property(field, "reqd", 1);
                            frm.refresh_field(field);
                        })
                    }
                     else {
                        fields_list.forEach((field) =>{
                            toggle_permission(frm, field, true);
                            frm.set_df_property(field, "reqd", 0);
                            frm.refresh_field(field);
                        });
                    }
                    
                }
            }
        })
    });
}