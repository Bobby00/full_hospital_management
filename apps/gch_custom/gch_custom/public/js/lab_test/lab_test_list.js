// frappe.listview_settings["Lab Test"] = {
//     add_fields: ['branch'],
//     onload: function (listview) {
        
//         console.log("LOADING")
//         /** Set route option: branch = user branch */



//         frappe.call({
//             method: 'gch_custom.services.rest.get_user_location',
//             args: {
//                 user: frappe.session.user
//             },
//             callback: function (r) {
//                 if (r.message) {
//                     const branch = r.message;
//                     // this.branch = branch;
//                     console.log(branch)
//                     frappe.route_options = {
//                         "branch":["=",  branch]
//                     };
//                     listview.refresh();
//                 }
//             }
//         });
//         // listview.refresh();
//         console.log("DONE")
        
//     },
//     refresh: function (listview) {
//         console.log(listview)
        
//     },
// }

frappe.listview_settings["Lab Test"] = {
    add_fields: ['branch'],
    onload: function (listview) {
        console.log("LOADING");

        // Get the user's branch
        frappe.call({
            method: 'gch_custom.services.rest.get_user_location',
            args: {
                user: frappe.session.user
            },
            callback: function (r) {
                if (r.message) {
                    const branch = r.message;
                    console.log(branch);

                    frappe.route_options = {
                        "branch": ["=", branch]
                    };

                    // Refresh the list view with the updated filter
                    listview.refresh();

                    // Set the filters
                    // listview.filter_list.add_filter("branch", "=", branch);
                    // listview.filter_list.refresh();
                }
            }
        });

        console.log("DONE");
    },
    refresh: function (listview) {
        console.log(listview);
    },
};


// frappe.listview_settings["Lab Test"] = {
//     add_fields: ['branch'],
    
//     // before loading the list view, set the filter option

    


//     before_render: function (listview) {
//         console.log("BEFORE RENDER");

//         // frappe.route_options = {
//         //     "batch": ["=", "BATCHED"] // Use the actual field name for branch
//         // };

//         // frappe.views.set_view_user_settings("Lab Test", {
//         //     filters: {
//         //         batch: "BATCHED"
//         //     }
//         // });

//         // // Refresh the list view with the updated filter
//         // listview.refresh();

//         // Make an asynchronous call to get the user's branch
//         frappe.call({
//             method: 'gch_custom.services.rest.get_user_location',
//             args: {
//                 user: frappe.session.user
//             },
            
//         }).then((r) => {
//             {
//                 if (r.message) {
//                     const branch = r.message;
//                     console.log(branch)
//                     // Set the filter option based on the user's branch
//                     frappe.route_options = {
//                         "batch": ["=", "BATCHED"] // Use the actual field name for branch
//                     };

                    

//                     // Refresh the list view with the updated filter
//                     // listview.refresh();
                    
                   
//                 }
//             }
//         }).then((listview) => {
//             console.log("DONE", listview);
//             // listview.refresh
//         });

//         console.log("DONE");
//     },
//     onload: function (listview) {
//         console.log("ONLOAD")
//         console.log(frappe.route_options)
//         // frappe.route_options = {
//         //     "batch": ["=", "BATCHED"] // Use the actual field name for branch
//         // };

//         // frappe.views.set_view_user_settings("Lab Test", {
//         //     filters: {
//         //         batch: "BATCHED"
//         //     }
//         // });

//         // // Refresh the list view with the updated filter
//         // listview.refresh();
//         // console.log("DONE")
//     },
// }
