frappe.pages['inpatient-pharmacy-q'].on_page_load = function(wrapper) {
	// var page = frappe.ui.make_app_page({
	// 	parent: wrapper,
	// 	title: 'None',
	// 	single_column: true
	// });
	new InpatientPharmacyQ(wrapper)
}

let renderQueue = async () => {
	// console.log("renderQueue");
	let queue = await frappe.call({
		method: "gch_inpatient.services.pharmacy_queue",
	});
	let queue_list = queue.message;
	return queue_list;
}

const formatCreatedTime = (date = new Date()) => {
    if (date) {
        const dateTime = new Date(date);
        const dateString = dateTime.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const timeString = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const formattedString = `${dateString} ${timeString}`;
        return formattedString;
    }

}

const new_and_repeat_medication = async(page) => {
	// console.log("new_and_repeat_medication");
	let queue = await frappe.call({
		method: "gch_inpatient.services.new_and_repeat_medication",
	});

	let queue_list = queue.message;
	let details = "";
	let i;

	page.page.main
	.html(frappe.render_template(frappe.templates.inpatient_queue, queue_list))
	.html();

	var queueList = document.querySelector('.queue-list');
	queueList.innerHTML = "";

	for (i = 0; i < queue_list.length; i++) {
		let encounter = queue_list[i].parent;
		let primary_key = queue_list[i].name;
		let patient = queue_list[i].patient;
		let time_joined_queue = queue_list[i].prescribed_at;
		let queue = "Pharmacy Queue";
		let ward = queue_list[i].ward_station;
		let practitioner_name = queue_list[i].prescribed_by;
		let mode_of_payment = "Insurance";
		let presc_number = queue_list[i].prescription_number;

		let color = "#53ccf3";
		if(queue_list[i].prescription_frequency == "Stat") {
			color = "rgb(155, 4, 155,0.726)"
		}

		let discharge = ``
		let darasa = ``
		if(queue_list[i].discharge_status == "Discharge Initiated"){
			discharge = `<span class="badge badge-pill badge-warning">Discharge Initiated</span>`
			darasa = `sticker`
		}

		details += `
		<div class="level list-row ${darasa}" style="background-color: ${color};">
			<div class="level-left ellipsis">
				<div>
					<input type="hidden" class="level-item list-row-checkout hidden-xs" 
						type="checkbox" data-name="${primary_key}">
					<span class="level-item" style="margin-bottom: 1px;">
						<span class="like-action not-liked" data-name="${patient}"
							data-doctype="Patient" data-liked-by="null" title=""></span>
					<span class="likes-count"></span>
					</span>
				</div>
				<div class="list-row-col queue ellipsis hidden-xs">
					<span class="level-item bold ellipsis" style="display:flex; flex-direction:column;" title=${patient}>
						<a class="ellipsis" href="/app/patient/${patient}" title=${patient}
							data-doctype="Patient" data-name="${patient}">
							${patient} 
						</a>
					</span>
					<span class="badge badge-pill badge-warning">
							${practitioner_name}
					</span>
				</div>
			
				<div class="list-row-col queue ellipsis hidden-xs">
					<span title="Inpatient Record: ${encounter}" >
					<a href="/app/inpatient-record/${encounter}" class="filterable ellipsis" data-filter="inpatient_record,=,${encounter}">${encounter}</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Service Unit: ${time_joined_queue}">
						<a class="filterable ellipsis" data-filter="patient_type">
							${time_joined_queue}
						</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Service Unit: ${ward}">
						<a class="filterable ellipsis" data-filter="patient_type">
							${ward}
						</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsi" title="Payment Mode: ${mode_of_payment}">
						<a class="filterable ellipsi" data-filter="mode_of_payment">
						${mode_of_payment}
						</a>
					
					</span>   
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Action: See Patient">
						<span class="btn btn-primary btn-sm"  onClick="handleDispenseMedication('${presc_number}','${encounter}')">
						Dispense Medication
						</span>
						${discharge}
					</span>
				</div>
			</div>
		</div>
		`
	}
	queueList.innerHTML = details;
}

const dischargeMedication = async(page) => {
	console.log("discharge");
	let queue = await frappe.call({
		method: "gch_inpatient.services.discharge_medication",
	});

	let queue_list = queue.message;
	let details = "";
	let i;

	page.page.main
	.html(frappe.render_template(frappe.templates.inpatient_queue, queue_list))
	.html();

	var queueList = document.querySelector('.queue-list');
	queueList.innerHTML = "";

	for (i = 0; i < queue_list.length; i++) {
		let encounter = queue_list[i].parent;
		let primary_key = queue_list[i].name;
		let patient = queue_list[i].patient;
		let time_joined_queue = queue_list[i].prescribed_at;
		let parsedDate = new Date(time_joined_queue);
		let formattedDate = parsedDate.toLocaleString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			timeZone: 'Africa/Nairobi' // Set the timezone to Nairobi, Kenya
		});
		let queue = "Pharmacy Queue";
		let ward = queue_list[i].ward_station;
		let practitioner_name = queue_list[i].prescribed_by;
		let mode_of_payment = "Insurance";
		let presc_number = queue_list[i].prescription_number;


		let color = "#90ee90";
		let discharge = ``
		let darasa = ``
		if(queue_list[i].discharge_status == "Discharge Initiated"){
			discharge = `<span class="badge badge-pill badge-warning">Discharge Initiated</span>`
			darasa = `sticker`
		}

		details += `
		<div class="level list-row ${darasa}" style="background-color: ${color}">
			<div class="level-left ellipsis">
				<div>
					<input type="hidden" class="level-item list-row-checkout hidden-xs" 
						type="checkbox" data-name="${primary_key}">
					<span class="level-item" style="margin-bottom: 1px;">
						<span class="like-action not-liked" data-name="${patient}"
							data-doctype="Patient" data-liked-by="null" title=""></span>
					<span class="likes-count"></span>
					</span>
				</div>
				<div class="list-row-col queue ellipsis hidden-xs">
					<span class="level-item bold ellipsis" style="display:flex; flex-direction:column;" title=${patient}>
						<a class="ellipsis" href="/app/patient/${patient}" title=${patient}
							data-doctype="Patient" data-name="${patient}">
							${patient} 
						</a>
					</span>
					<span class="badge badge-pill badge-warning">
							${practitioner_name}
					</span>
				</div>
			
				<div class="list-row-col queue ellipsis hidden-xs">
					<span title="Inpatient Record: ${encounter}" >
					<a href="/app/inpatient-record/${encounter}" class="filterable ellipsis" data-filter="inpatient_record,=,${encounter}">${encounter}</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Service Unit: ${formattedDate}">
						<a class="filterable ellipsis" data-filter="patient_type">
							${formattedDate}
						</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Service Unit: ${ward}">
						<a class="filterable ellipsis" data-filter="patient_type">
							${ward}
						</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsi" title="Payment Mode: ${mode_of_payment}">
						<a class="filterable ellipsi" data-filter="mode_of_payment">
						${mode_of_payment}
						</a>
					
					</span>   
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Action: See Patient">
						<span class="btn btn-primary btn-sm"  onClick="handleDispenseMedication('${presc_number}','${encounter}')">
						Dispense Medication
						</span>
						${discharge}
					</span>
				</div>
			</div>
		</div>
		`
	}
	queueList.innerHTML = details;
}

const returnQueue = async (page) => {
	console.log("here");

	let queue = await frappe.call({
		method: "gch_inpatient.services.inpatient_returns"
	});

	let queue_list = queue.message;
	let details = "";
	let i;


	page.page.main
	.html(frappe.render_template(frappe.templates.inpatient_returns, page))
	.html();

	var queueList = document.querySelector('.queue-list');
	queueList.innerHTML = "";

	for(i = 0; i < queue_list.length; i++){
		let color = "#90ee90";

		details += `
		<div class="level list-row" style="background-color: ${color}">
			<div class="level-left ellipsis">

				<div style="margin-right: 16%;">
					<span class="level-item" style="margin-bottom: 1px;">
						<span class="like-action not-liked" data-name="${queue_list[i].name}"
							data-doctype="Patient" data-liked-by="null" title=""></span>
					<span class="likes-count"></span>
					</span>

					<span title="Inpatient Return Record: ${queue_list[i].name}" >
					<a href="/app/inpatient-pharmacy-return/${queue_list[i].name}" class="filterable ellipsis" data-filter="inpatient_record,=,${queue_list[i].name}">${queue_list[i].name}</a>
					</span>

				</div>
				
				<div class="list-row-col queue ellipsis hidden-xs">
					<span title=${queue_list[i].ward}>
						<a  class="filterable ellipsis" data-filter="Patient,=,${queue_list[i].ward}">${queue_list[i].ward}</a>
					</span>
				</div>
			
				<div class="list-row-col queue ellipsis hidden-xs">
					<span title="Patient: ${queue_list[i].patient}" >
					<a href="/app/patient/${queue_list[i].patient}" class="filterable ellipsis" data-filter="Patient,=,${queue_list[i].patient}">${queue_list[i].patient}</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Service Unit: ${queue_list[i].owner}">
						<a class="filterable ellipsis" data-filter="patient_type">
							${queue_list[i].owner}
						</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Status">
						<a class="filterable ellipsis" data-filter="patient_type">
							Pending pharmacy
						</a>
					</span>
				</div>
				
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Action: See Patient">
						
						<span class="btn btn-primary btn-sm"  >
						<a href="/app/inpatient-pharmacy-return/${queue_list[i].name}" class="filterable ellipsis" data-filter="inpatient_record,=,${queue_list[i].name}">
							View Returned Items
						</a>
						</span>
					</span>
				</div>
			</div>
		</div>

		`
	}

	queueList.innerHTML = details;

}

const main_queue = async(page) => {
	queue_list = await renderQueue();
	
	let me = this;
	let details = "";
	let i;

	page.page.main
	.html(frappe.render_template(frappe.templates.inpatient_queue, queue_list))
	.html();


	var queueList = document.querySelector('.queue-list');

	console.log(queueList);
	queueList.innerHTML = "";
	for (i = 0; i < queue_list.length; i++) {
		let encounter = queue_list[i].parent;
		let primary_key = queue_list[i].name;
		let patient = queue_list[i].patient;
		let time_joined_queue = queue_list[i].prescribed_at;
		let parsedDate = new Date(time_joined_queue);
		let formattedDate = parsedDate.toLocaleString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			timeZone: 'Africa/Nairobi' // Set the timezone to Nairobi, Kenya
		});
		let queue = "Pharmacy Queue";
		let ward = queue_list[i].ward_station;
		let practitioner_name = queue_list[i].prescribed_by;
		let mode_of_payment = "Insurance";
		let presc_number = queue_list[i].prescription_number;


		let color = "#90ee90";
		if((queue_list[i].indication == "New" || queue_list[i].indication == "Repeat") && queue_list[i].prescription_frequency != "Stat" && queue_list[i].high_alert == 0){
			color = "#53ccf3"
		}
		else if((queue_list[i].indication == "New" || queue_list[i].indication == "Repeat") && queue_list[i].prescription_frequency == "Stat" && queue_list[i].high_alert == 0){
			color = "rgb(155, 4, 155,0.726)";
		}
		else if(queue_list[i].indication == "Discharge"){
			color = "#90ee90"
		}else if(queue_list[i].high_alert == 1){
			color = "yellow"
		}

		let discharge = ``
		let darasa = ``
		if(queue_list[i].discharge_status == "Discharge Initiated"){
			discharge = `<span class="badge badge-pill badge-warning">Discharge Initiated</span>`
			darasa = `sticker`
		}

		details += `
		<div class="level list-row ${darasa}" style="background-color: ${color};">
			<div class="level-left ellipsis" style="color: white;">
				<div>
					<input type="hidden" class="level-item list-row-checkout hidden-xs" 
						type="checkbox" data-name="${primary_key}">
					<span class="level-item" style="margin-bottom: 1px;">
						<span class="like-action not-liked" data-name="${patient}"
							data-doctype="Patient" data-liked-by="null" title=""></span>
					<span class="likes-count"></span>
					</span>
				</div>
				<div class="list-row-col queue ellipsis hidden-xs">
					<span class="level-item bold ellipsis" style="display:flex; flex-direction:column;" title=${patient}>
						<a class="ellipsis" href="/app/patient/${patient}" title=${patient}
							data-doctype="Patient" data-name="${patient}">
							${patient} 
						</a>
					</span>
					<span class="badge badge-pill badge-warning">
							${practitioner_name}
					</span>
				</div>
			
				<div class="list-row-col queue ellipsis hidden-xs">
					<span title="Inpatient Record: ${encounter}" >
					<a href="/app/inpatient-record/${encounter}" class="filterable ellipsis" data-filter="inpatient_record,=,${encounter}">${encounter}</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Service Unit: ${formattedDate}">
						<a class="filterable ellipsis" data-filter="patient_type">
							${formattedDate}
						</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Service Unit: ${ward}">
						<a class="filterable ellipsis" data-filter="patient_type">
							${ward}
						</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsi" title="Payment Mode: ${mode_of_payment}">
						<a class="filterable ellipsi" data-filter="mode_of_payment">
						${mode_of_payment}
						</a>
					
					</span>   
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Action: See Patient">
						<span class="btn btn-primary btn-sm"  onClick="handleDispenseMedication('${presc_number}','${encounter}')">
						Dispense Medication
						</span>
						${discharge}
					</span>
				</div>
			</div>
		</div>
		`
	}

	queueList.innerHTML = details;
}

const high_alert= async(page) => {
	console.log("highalert");
	let queue = await frappe.call({
		method: "gch_inpatient.services.high_alerts",
	});
	let queue_list = queue.message;

	page.page.main
	.html(frappe.render_template(frappe.templates.inpatient_queue, queue_list))
	.html();

	let details = "";
	let i;
	// empty element with class .queue-list
	var queueList = document.querySelector('.queue-list');
	queueList.innerHTML = "";

	for (i = 0; i < queue_list.length; i++) {
		let encounter = queue_list[i].parent;
		let primary_key = queue_list[i].name;
		let patient = queue_list[i].patient;
		let time_joined_queue = queue_list[i].prescribed_at;
		let parsedDate = new Date(time_joined_queue);
		let formattedDate = parsedDate.toLocaleString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			timeZone: 'Africa/Nairobi' // Set the timezone to Nairobi, Kenya
		});
		let queue = "Pharmacy Queue";
		let ward = queue_list[i].ward_station;
		let practitioner_name = queue_list[i].prescribed_by;
		let mode_of_payment = "Insurance";
		let presc_number = queue_list[i].prescription_number;

		let discharge = ``
		let darasa = ``
		if(queue_list[i].discharge_status == "Discharge Initiated"){
			discharge = `<span class="badge badge-pill badge-warning">Discharge Initiated</span>`
			darasa = `sticker`
		}

		let color = "yellow";

		details += `
		<div class="level list-row ${darasa}" style="background-color: ${color}">
			<div class="level-left ellipsis">
				<div>
					<input type="hidden" class="level-item list-row-checkout hidden-xs" 
						type="checkbox" data-name="${primary_key}">
					<span class="level-item" style="margin-bottom: 1px;">
						<span class="like-action not-liked" data-name="${patient}"
							data-doctype="Patient" data-liked-by="null" title=""></span>
					<span class="likes-count"></span>
					</span>
				</div>
				<div class="list-row-col queue ellipsis hidden-xs">
					<span class="level-item bold ellipsis" style="display:flex; flex-direction:column;" title=${patient}>
						<a class="ellipsis" href="/app/patient/${patient}" title=${patient}
							data-doctype="Patient" data-name="${patient}">
							${patient} 
						</a>
					</span>
					<span class="badge badge-pill badge-warning">
							${practitioner_name}
					</span>
				</div>
			
				<div class="list-row-col queue ellipsis hidden-xs">
					<span title="Inpatient Record: ${encounter}" >
					<a href="/app/inpatient-record/${encounter}" class="filterable ellipsis" data-filter="inpatient_record,=,${encounter}">${encounter}</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Service Unit: ${formattedDate}">
						<a class="filterable ellipsis" data-filter="patient_type">
							${formattedDate}
						</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Service Unit: ${ward}">
						<a class="filterable ellipsis" data-filter="patient_type">
							${ward}
						</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsi" title="Payment Mode: ${mode_of_payment}">
						<a class="filterable ellipsi" data-filter="mode_of_payment">
						${mode_of_payment}
						</a>
					
					</span>   
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Action: See Patient">
						<span class="btn btn-primary btn-sm"  onClick="handleDispenseMedication('${presc_number}','${encounter}')">
						Dispense Medication
						</span>
						${discharge}
					</span>
				</div>
			</div>
		</div>
		`
	}
	queueList.innerHTML = details;
}

const handleDispenseMedication = (presc_number, inpatient_record)=> {
	if(presc_number) {	
		sessionStorage.setItem("prescription_number", presc_number);
		console.log(presc_number);
	}else {
		sessionStorage.setItem("prescription_number", "Unavailable");
		console.log("unavailable");
	}

	window.location.href = `/app/inpatient-record/${inpatient_record}`;

	// console.log(sessionStorage.getItem("prescription_number"), inpatient_record);
}



InpatientPharmacyQ = Class.extend({
	init: function(wrapper){
		this.make(wrapper);
	},

	

	refresh_queue: async function(queue_list){
	let me = this;
	let details = "";
	let i;
	me.page.main.find('.queue-list').empty();
	for (i = 0; i < queue_list.length; i++) {
		let encounter = queue_list[i].parent;
		let primary_key = queue_list[i].name;
		let patient = queue_list[i].patient;
		let time_joined_queue = queue_list[i].prescribed_at;
		let parsedDate = new Date(time_joined_queue);
		let formattedDate = parsedDate.toLocaleString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			timeZone: 'Africa/Nairobi' // Set the timezone to Nairobi, Kenya
		});
		let queue = "Pharmacy Queue";
		let ward = queue_list[i].ward_station;
		let practitioner_name = queue_list[i].prescribed_by;
		let mode_of_payment = "Insurance";
		let presc_number = queue_list[i].prescription_number;


		let color = "#90ee90";
		if((queue_list[i].indication == "New" || queue_list[i].indication == "Repeat") && queue_list[i].prescription_frequency != "Stat" && queue_list[i].high_alert == 0){
			color = "#53ccf3";
		}
		else if((queue_list[i].indication == "New" || queue_list[i].indication == "Repeat") && queue_list[i].prescription_frequency == "Stat" && queue_list[i].high_alert == 0){
			color = "rgb(155, 4, 155,0.726)";
		}
		else if(queue_list[i].indication == "Discharge"){
			color = "#90ee90";
		}else if(queue_list[i].high_alert == 1){
			color = "yellow"
		}


		let discharge = ``
		let darasa = ``
		if(queue_list[i].discharge_status == "Discharge Initiated"){
			discharge = `<span class="badge badge-pill badge-warning">Discharge Initiated</span>`
			darasa = `sticker`
		}

		details += `
		<div class="level list-row ${darasa}" style="background-color: ${color};">
			<div class="level-left ellipsis" style="color: white;">
				<div>
					<input type="hidden" class="level-item list-row-checkout hidden-xs" 
						type="checkbox" data-name="${primary_key}">
					<span class="level-item" style="margin-bottom: 1px;">
						<span class="like-action not-liked" data-name="${patient}"
							data-doctype="Patient" data-liked-by="null" title=""></span>
					<span class="likes-count"></span>
					</span>
				</div>
				<div class="list-row-col queue ellipsis hidden-xs">
					<span class="level-item bold ellipsis" style="display:flex; flex-direction:column;" title=${patient}>
						<a class="ellipsis" href="/app/patient/${patient}" title=${patient}
							data-doctype="Patient" data-name="${patient}">
							${patient} 
						</a>
					</span>
					<span class="badge badge-pill badge-warning">
							${practitioner_name}
					</span>
				</div>
			
				<div class="list-row-col queue ellipsis hidden-xs">
					<span title="Inpatient Record: ${encounter}" >
					<a href="/app/inpatient-record/${encounter}" class="filterable ellipsis" data-filter="inpatient_record,=,${encounter}">${encounter}</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Service Unit: ${formattedDate}">
						<a class="filterable ellipsis" data-filter="patient_type">
							${formattedDate}
						</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Service Unit: ${ward}">
						<a class="filterable ellipsis" data-filter="patient_type">
							${ward}
						</a>
					</span>
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsi" title="Payment Mode: ${mode_of_payment}">
						<a class="filterable ellipsi" data-filter="mode_of_payment">
						${mode_of_payment}
						</a>
					
					</span>   
				</div>
				<div class="list-row-col queue ellipsis ">
					<span class="ellipsis" title="Action: See Patient">
						<span class="btn btn-primary btn-sm"  onClick="handleDispenseMedication('${presc_number}','${encounter}')">
						Dispense Medication
						</span>
						${discharge}
					</span>
				</div>
			</div>
		</div>
		`
	}
	this.page.main.find('.queue-list').append(details);
	},


	make: async function(wrapper){
		this.formatCreatedTime = formatCreatedTime;

		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: "Inpatient Queue",
			single_column: true
		})

		this.page.main.html(
			frappe.render_template(
				frappe.templates.inpatient_queue,
				this
			)
		).html();

		let dept_filter_field = frappe.ui.form.make_control({
            parent: $('.dept-filter'),
            render_input: 1,
            df: {
                fieldtype: "Link",
                fieldname: "doctor",
                placeholder: __('Filter By Prescribing Doctor'),
                options: "Healthcare Practitioner",
                change: async () => {
                    let selected_dept = dept_filter_field.get_value()
                    console.log(selected_dept);
                }
            }
        });

		this.queue_list = await renderQueue();
		this.refresh_queue(this.queue_list);

		// this.page.add_inner_button("Test", () => {
		// 	frappe.call({
		// 		method: "gch_inpatient.services.return_ip_items",
		// 	})
		// });

		this.page.add_inner_button("Inpatient returns", () => returnQueue(this));
		this.page.add_inner_button("Main Queue", () => main_queue(this));
		this.page.add_inner_button("HAM Approvals", () => high_alert(this));
		this.page.add_inner_button("Discharge Medication", () => dischargeMedication(this));
		this.page.add_inner_button("New And Repeat Medication", () => new_and_repeat_medication(this));
		

		dept_filter_field.toggle_label(false);
        dept_filter_field.refresh();
	},

	
	discharge: async() => {
		console.log("discharge");
		let queue = await frappe.call({
			method: "gch_inpatient.services.discharge_patient",
		});
		let queue_list = queue.message;

		this.refresh_queue(queue_list);
	},
})