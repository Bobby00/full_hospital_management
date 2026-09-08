frappe.ui.form.on("Patient Appointment", {
    onload: function(frm){
        // if (frm.doc.patient){
        //     frm.set_df_property("appointment_phone", "hidden", false)
        //     frm.refresh_fields()
        // }
        // else{
        //     frm.set_df_property("appointment_phone", "hidden", true);
        //     frm.refresh_fields()
        // }

    },
    refresh: (frm) => {
        console.log('Here')

        if (frm.doc.status == 'Open' || (frm.doc.status == 'Scheduled' && !frm.doc.__islocal)) {
			frm.add_custom_button(__('Cancel Appointment'), function() {
                console.log("Tring to cancel")
				update_status_gch(frm, 'Cancelled');
			});

            
			// frm.add_custom_button(__('Reschedule'), function() {
			// 	check_and_set_availability(frm);
			// });

			// if (frm.doc.procedure_template) {
			// 	frm.add_custom_button(__('Clinical Procedure'), function() {
			// 		frappe.model.open_mapped_doc({
			// 			method: 'erpnext.healthcare.doctype.clinical_procedure.clinical_procedure.make_procedure',
			// 			frm: frm,
			// 		});
			// 	}, __('Create'));
			// } else if (frm.doc.therapy_type) {
			// 	frm.add_custom_button(__('Therapy Session'), function() {
			// 		frappe.model.open_mapped_doc({
			// 			method: 'erpnext.healthcare.doctype.therapy_session.therapy_session.create_therapy_session',
			// 			frm: frm,
			// 		})
			// 	}, 'Create');
			// } else {
			// 	frm.add_custom_button(__('Patient Encounter'), function() {
			// 		frappe.model.open_mapped_doc({
			// 			method: 'erpnext.healthcare.doctype.patient_appointment.patient_appointment.make_encounter',
			// 			frm: frm,
			// 		});
			// 	}, __('Create'));
			// }

			frm.add_custom_button(__('Vital Signs'), function() {
				create_vital_signs(frm);
			}, __('Create'));
		}

        if (frm.is_new()) {
			frm.page.set_primary_action(__('Check Availability'), function() {
				
                if(frm.doc.patient) {
                    frappe.call({
                        method: 'erpnext.healthcare.doctype.patient_appointment.patient_appointment.check_payment_fields_reqd',
                        args: { 'patient': frm.doc.patient },
                        callback: function(data) {
                            if (data.message == true) {
                                if (frm.doc.mode_of_payment && frm.doc.paid_amount) {
                                    check_and_set_availability(frm);
                                }
                                if (!frm.doc.mode_of_payment) {
                                    frappe.msgprint({
                                        title: __('Not Allowed'),
                                        message: __('Please select a Mode of Payment first'),
                                        indicator: 'red'
                                    });
                                }
                                if (!frm.doc.paid_amount) {
                                    frappe.msgprint({
                                        title: __('Not Allowed'),
                                        message: __('Please set the Paid Amount first'),
                                        indicator: 'red'
                                    });
                                }
                            } else {
                                check_and_set_availability(frm);
                            }
                        }
                    });
                } else {
                    check_and_set_availability(frm);
                }
			});
		} else {
			frm.page.set_primary_action(__('Save'), () => frm.save());
		}

        if(cur_frm.doc.not_in_system) {
            cur_frm.set_df_property("patient", "reqd", false)
            cur_frm.refresh_fields()
        }

        frm.remove_custom_button('Cancel');
        
    },
	patient: function(frm) {
        // Pull the primary parent's phone number
        if(cur_frm.doc.patient) {
            frappe.call({
                method: "gch_custom.services.rest.fetch_primary_parent_phone_to_appointment",
                args: {"patient": cur_frm.doc.patient},
                callback: (res) => {
                    if(res.message.parents.length > 0) {
                        for(let parent in res.message.parents) {
                            // console.log(res.message.parents[parent], "===================")
                            if(res.message.parents[parent].is_primary) {
                                cur_frm.set_value("appointment_phone", res.message.parents[parent].phone_number)

                                frappe.show_alert(
                                    {
                                      message: __("Primary Parent Phone Number Fetched Successfully"),
                                      indicator: "green",
                                    },
                                    4
                                );
                            } else {
                                // frappe.show_alert(
                                //     {
                                //       message: __("Primary Parent not set"),
                                //       indicator: "red",
                                //     },
                                //     2
                                // );
                            }
                        }
                    } else{
                        frappe.show_alert(
                                    {
                                      message: __("Patient has no parents registered on system"),
                                      indicator: "red",
                                    },
                                    3
                                );
                    }
                    // console.log(res)
                }
            })
        }


		// if (frm.doc.patient) {
		// 	frm.trigger('toggle_payment_fields');
		// 	frappe.call({
		// 		method: 'frappe.client.get',
		// 		args: {
		// 			doctype: 'Patient',
		// 			name: frm.doc.patient
		// 		},
		// 		callback: function(data) {
        //             console.log(data)

		// 			let age = null;
        //             let mobile = data?.message?.mobile;
        //             if (mobile === null){
        //                 frm.set_df_property("appointment_phone", "hidden", false);
        //                 frm.refresh_fields()
        //             }
		// 			if (data.message.dob) {
		// 				age = calculate_age(data.message.dob);
		// 			}
        //             if(data?.message?.mobile){
        //                 frappe.mobile.set_value(frm.doctype, frm.docname, 'appointment_phone', data.message.mobile)
        //             }

		// 			frappe.model.set_value(frm.doctype, frm.docname, 'patient_age', age);
		// 		}
		// 	});
		// } else {
		// 	frm.set_value('patient_name', '');
		// 	frm.set_value('patient_sex', '');
		// 	frm.set_value('patient_age', '');
		// 	frm.set_value('inpatient_record', '');
        //     frm.set_df_property("appointment_phone", "hidden", true);
		// }
	},
    visit_schedule: function (frm, cdt, cdn) {
        var visit_schedule = frm.doc.visit_schedule;
    
        if (visit_schedule) {
          frappe
            .call({
              method: "gch_custom.services.events.get_vaccinations",
              args: { duration: visit_schedule },
            })
            .done((r) => {
              frm.doc.vaccines = [];
    
              $.each(r.message, function (_i, e) {
                let entry = frm.add_child("vaccines");
                entry.wellbaby_vaccine = e.name;
              });
              refresh_field("vaccines");
            })
            .fail((f) => {
              // // // console.log(f);
            });
        }
    },
    toggle_payment_fields: function(frm) {
        if(cur_frm.doc.patient) {
            frappe.call({
                method: 'erpnext.healthcare.doctype.patient_appointment.patient_appointment.check_payment_fields_reqd',
                args: { 'patient': frm.doc.patient },
                callback: function(data) {
                    if (data.message.fee_validity) {
                        // if fee validity exists and automated appointment invoicing is enabled,
                        // show payment fields as non-mandatory
                        frm.toggle_display('mode_of_payment', 0);
                        frm.toggle_display('paid_amount', 0);
                        frm.toggle_display('billing_item', 0);
                        frm.toggle_reqd('mode_of_payment', 0);
                        frm.toggle_reqd('paid_amount', 0);
                        frm.toggle_reqd('billing_item', 0);
                    } else if (data.message) {
                        frm.toggle_display('mode_of_payment', 1);
                        frm.toggle_display('paid_amount', 1);
                        frm.toggle_display('billing_item', 1);
                        frm.toggle_reqd('mode_of_payment', 1);
                        frm.toggle_reqd('paid_amount', 1);
                        frm.toggle_reqd('billing_item', 1);
                    } else {
                        // if automated appointment invoicing is disabled, hide fields
                        frm.toggle_display('mode_of_payment', data.message ? 1 : 0);
                        frm.toggle_display('paid_amount', data.message ? 1 : 0);
                        frm.toggle_display('billing_item', data.message ? 1 : 0);
                        frm.toggle_reqd('mode_of_payment', data.message ? 1 : 0);
                        frm.toggle_reqd('paid_amount', data.message ? 1 : 0);
                        frm.toggle_reqd('billing_item', data.message ? 1 : 0);
                    }
                }
            });
        }
		
	},

})


let update_status_gch = function(frm, status) {
	let doc = frm.doc;
	frappe.confirm(__('Are you sure you want to cancel this appointment?'),
		function() {
			frappe.call({
				method: 'gch_custom.overrides.patient_appointment.update_status_gch',
				args: { appointment_id: doc.name, status: status },
				callback: function(data) {
					if (!data.exc) {
						frm.reload_doc();
					}
				}
			});
		}
	);
};