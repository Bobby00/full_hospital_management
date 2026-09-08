const view_patient = (field_element) => {
	let patient = field_element.dataset.patient;
	let url = `/app/patient/${patient}`;
	window.location.href = url;
}

window.view_patient = view_patient;

const QuickAddPatientDiag = new frappe.ui.Dialog({
  title: "Patient Details",
  fields: [
    {
      fieldname: "first_name",
      fieldtype: "Data",
      label: "First Name",
      no_copy: 1,
      oldfieldtype: "Data",
      reqd: 1,
    },
    {
      fieldname: "middle_name",
      fieldtype: "Data",
      label: "Middle Name (optional)",
      no_copy: 1,
    },
    {
      fieldname: "last_name",
      fieldtype: "Data",
      label: "Last Name",
      no_copy: 1,
      reqd: 1,
    },

    {
      fieldname: "sex",
      fieldtype: "Link",
      in_preview: 1,
      label: "Gender",
      options: "Gender",
      reqd: 1,
    },
    {
      bold: 1,
      fieldname: "dob",
      fieldtype: "Date",
      in_preview: 1,
      label: "Date of birth",
      no_copy: 1,
      reqd: 1,
    },
  ],
  primary_action_label: "Create Patient",
  primary_action(values) {
    console.log(values);

    const { first_name, middle_name, last_name, sex, dob } = values;
    QuickAddPatientDiag.hide();

    frappe.call({
      method: "gch_custom.services.register_emergency_patient",
      args: {
        first_name,
        middle_name,
        last_name,
        sex,
        dob,
      },      
    }).done((r) => {
      console.log(r);
	  let data = r.message;      
      if(data.type == "New"){
        frappe.msgprint({
          title: "Success",
          indicator: "green",
          message: `Patient ${data.patient.name} created successfully`,
        });
      }else if(data.type == "Egerties"){
		console.log(data);	
		if(data.patients.length > 0){
			let patient_match_row = ``;
			for(let row in data.patients){
				let patient  = data.patients[row];

				let patient_link = patient.name
				patient_match_row += `
					<tr>		
						<td>
							<p>${patient.first_name}</p>
						</td>

						<td>
							<p>${patient.middle_name}</p>
						</td>

						<td>
							<p>${patient.last_name}</p>
						</td>

						<td>
							<p>${patient.dob}</p>
						</td>

						<td>
							<p>${patient.uhid_code}</p>
						</td>

						<td>
							<p>${patient.sex}</p>
						</td>

						<td>
							<div class="btn btn-sm" data-patient="${patient.name}" onclick="view_patient(this)">View Patient</div>
						</td>
						
					</tr>
				`
			}

			let patient_posslble_matches_holder = `
				<div class="row">
					<table class="table table-bordered table-hover">
						<thead>
							<tr>
								<th>First Name</th>
								<th>Middle Name</th>
								<th>Last Name</th>
								<th>DOB</th>
								<th>UHID</th>
								<th>Gender</th>
								<th>Actions</th>
							</tr>
						</thead>
						`+ patient_match_row + `
					</table>
				</div>
				`
				let possible_patient_match_dialog = new frappe.ui.Dialog({
					title: 'Patients found on eGerties',
					fields: [
						{
							label: 'Select Patient',
							fieldname: 'patient_match_list',
							fieldtype: 'HTML',
							options: patient_posslble_matches_holder
						}
					],
					size: 'extra-large',//'large', // small, large, extra-large 
					primary_action_label: 'Close',
					static: true,
					primary_action(values) {
						console.log(values);
						possible_patient_match_dialog.hide();
					}
				});
				
				possible_patient_match_dialog.show();
		}	
	  }else{
        if(data.patients.length > 0){
          // BUILDING HTML WITH SELECT OPTIONS FOR EACH PATIENT FOUND
							let patient_match_row = ``

		
							for (let row in data.patients){
								let patient = data.patients[row]
		
								let patient_gender = ''
		
								if (patient.gender == "f") {
									patient_gender = "Female"
								}
								else if (patient_gender == 'm') {
									patient_gender = "Male"
								}
		
								patient_match_row += `
									<tr>
										<td>
											<div class="btn btn-sm btn-primary"
											id="register_${patient.UHID}" 
											data-father_name="${patient.father_name ? patient.father_name: "Not Found" }"
											data-mother_name="${patient.mother_name ? patient.mother_name: "Not Found"}"
											data-patient_fname="${patient.first_name}"
											data-patient_mname="${patient.middle_name}"
											data-patient_lname="${patient.last_name}"
											data-patient_dob="${patient.date_birth}"
											data-patient_gender="${patient_gender}"
											data-kranium_uhid="${patient.UHID}"
											data-patient_phone="${patient.phone}"
											onclick="register_patient(this)" style="font-size: 12px" >Register on Egerties</div>
										</td>
		
										<td>
											<p>${patient.first_name}</p>
										</td>
		
										<td>
											<p>${patient.middle_name}</p>
										</td>
		
										<td>
											<p>${patient.last_name}</p>
										</td>
		
										<td>
											<p>${patient.date_birth}</p>
										</td>
		
										<td>
											<p>${patient.UHID}</p>
										</td>
		
										<td>
											<p>${patient_gender}</p>
										</td>
		
										<td>
											<p>${patient.father_name ? patient.father_name: "Not Found" }</p>
										</td>
										<td>
											<p>${patient.mother_name ? patient.mother_name: "Not Found"}</p>
										</td>
										<td>
											<p>${patient.phone ? patient.phone: "Not found"}</p>
										</td>
										
									</tr>
								`
							}
		
		
							let patient_posslble_matches_holder = `
							<div class="row">
								<table class="table table-bordered table-hover">
									<thead>
										<tr>
											<th>Action</th>
											<th>First Name</th>
											<th>Middle Name</th>
											<th>Last Name</th>
											<th>DOB</th>
											<th>UHID</th>
											<th>Gender</th>
											<th>Father's Name</th>
											<th>Mother's Name</th>
											<th>Phone</th>
										</tr>
									</thead>
									`+ patient_match_row + `
								</table>
							</div>
							`
							
							for (let patient in data.patients) {
								console.log(data.patients[patient])
							}
		
							let possible_patient_match_dialog = new frappe.ui.Dialog({
								title: 'Possible Patient Matches From Kranium',
								fields: [
									{
										label: 'Select A Possible Match From Kranium',
										fieldname: 'patient_match_list',
										fieldtype: 'HTML',
										options: patient_posslble_matches_holder
									}
								],
								size: 'extra-large',//'large', small, large, 
								static: true,
								primary_action_label: 'Close',
								primary_action(values) {
									console.log(values);
									possible_patient_match_dialog.hide();
								}
							});
							
							possible_patient_match_dialog.show();
        }
      }
    });
  },
});


let register_patient = (field_element) => {
	let data = {
		first_name :field_element.dataset.patient_fname,
		middle_name :field_element.dataset.patient_mname,
		last_name :field_element.dataset.patient_lname,
		father_name :field_element.dataset.father_name,
		mother_name :field_element.dataset.mother_name,
		dob :field_element.dataset.patient_dob,
		gender :field_element.dataset.patient_gender,
		kranium_uhid :field_element.dataset.kranium_uhid,
		phone_number : field_element.dataset.patient_phone,
	}
	
	let gender = field_element.dataset.patient_gender;
	if(!gender){
		frappe.throw("Cannot create since patient has no gender");
	}


	field_element.style.pointerEvents = "none";
    field_element.style.opacity = "0.6"; // Adjust opacity to give a disabled look
	field_element.textContent = "Registering...";
	

	// return
	frappe.call({
		method: 'gch_queue.services.register_kranium_patient_on_egerties',
		args: {
			...data
		},
		async: false,
		callback: function(r) {
			if (r.message){
				frappe.msgprint(`Patient ${r.message.name} has been successfuly created. `)
				field_element.style.display = "none";
			}
		}
	})
}

window.register_patient = register_patient;

frappe.listview_settings["Patient"] = {
  onload(listview) {
    // triggers once before the list is loaded
    console.log("loaded", listview);
    listview.page.add_action_item("My custom Action", () =>
      my_action_handler()
    );
    listview.page.set_secondary_action(
      "Add Emergency Patient",
      () => QuickAddPatientDiag.show(),
      "octicon octicon-sync"
    );
  },
};
