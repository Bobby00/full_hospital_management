
frappe.ui.form.on("Healthcare Practitioner", {
   
    refresh: function(frm){
        
        frm.set_query('service_unit', function(){
			return {
				filters: {
					'is_group': false,
					'allow_appointments': true,
                    'disable_service_unit': 0
				}
			};
		});

    },
    
})
