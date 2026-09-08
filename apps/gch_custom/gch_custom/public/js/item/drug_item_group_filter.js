const handle_drug_group_filter = (frm) => {
    // console.log("Hello.... 2")
    if (cur_frm.doc.parent_item_group == "Drug" || 
        cur_frm.doc.item_group == "Drug" || 
        cur_frm.doc.item_group=="Dialysis solution" || 
        cur_frm.doc.item_group=="Eye Oint and drops" || 
        cur_frm.doc.item_group=="Granules & Powder" || 
        cur_frm.doc.item_group=="Infusions" || 
        cur_frm.doc.item_group=="Inhaler" || 
        cur_frm.doc.item_group=="Injection" || 
        cur_frm.doc.item_group=="Mixtures,syrups,suspension,oral drops" || 
        cur_frm.doc.item_group=="Ointment,creams,gels,paste,paint ,lotion" || 
        cur_frm.doc.item_group=="Nasal spray, Sprays and Vapocaps" || 
        cur_frm.doc.item_group=="Pessaries,suppositories,rectal gel" || 
        cur_frm.doc.item_group=="Soaps and shampoos" || 
        cur_frm.doc.item_group=="Solution" || 
        cur_frm.doc.item_group=="Spacer" || 
        cur_frm.doc.item_group=="Tablets and Lozenges" || 
        cur_frm.doc.item_group=="Vaccine") {

        // console.log("Condition False")
                  
        cur_frm.set_df_property("generic_drug", "hidden", false);
        cur_frm.set_df_property("generic_drug", "reqd", 1);
        cur_frm.refresh_field("generic_drug");

        cur_frm.set_df_property("product_type", "reqd", 1);
        cur_frm.refresh_field("product_type");
        
        cur_frm.set_df_property("product_route", "reqd", 1);
        cur_frm.refresh_field("product_route");
        
        cur_frm.set_value("has_batch_no", 1);
        cur_frm,refresh_field("has_batch_no");

        cur_frm.set_df_property("allergen", "hidden", false);
        cur_frm.refresh_field("allergen");

        cur_frm.set_df_property("vaccine_type", "hidden", false);
        cur_frm.refresh_field("vaccine_type");

        cur_frm.set_df_property("classification", "hidden", false);
        cur_frm.refresh_field("classification");

        cur_frm.set_df_property("sub_classification", "hidden", false);
        cur_frm.refresh_field("sub_classification");
    
    } else {

        // console.log("Condition True")

        cur_frm.set_df_property("generic_drug", "hidden", true);
        cur_frm.refresh_field("generic_drug");

        cur_frm.set_df_property("allergen", "hidden", true);
        cur_frm.refresh_field("allergen");

        cur_frm.set_df_property("vaccine_type", "hidden", true);
        cur_frm.refresh_field("vaccine_type");

        cur_frm.set_df_property("sub_classification", "hidden", true);
        cur_frm.refresh_field("sub_classification");

    }
}