frappe.listview_settings['Patient Encounter'] = {

    add_fields: ['kranium_uhid', 'branch'],
    onload: function (listview) {
        console.log(listview)

        /** Set route option: branch = user branch */
        frappe.call({
            method: 'gch_custom.services.rest.get_user_location',
            args: {
                user: frappe.session.user
            },
            callback: function (r) {
                if (r.message) {
                    const branch = r.message;
                    // this.branch = branch;
                    console.log(branch)
                    frappe.route_options = {
                        "branch":["=",  branch]
                    };
                    listview.refresh();
                }
            }
        });
        // listview.refresh();
    }, 
    
};

