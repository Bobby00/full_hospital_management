const handleSeePatient = (event, encounter) => {
    // alert(`Hola: ${encounter}`)
    // frappe.db.set_value("Patient Encounter", encounter, {
    //     is_with_doctor: 1
    // })

    // Setting Primary Doctor on encounter when see patient button is clicked by doctor

    // Fetching practitioner from the logged in doctors email
    if (frappe.user.has_role("GCH-Doctor")){ 

        frappe.call({
            method: "gch_queue.services.fetch_practitioner_name",
            async: false,
            args: { "practitioner_email" : frappe.user.name },
            callback: (res) => {
                // console.log(res.message)
                frappe.db.set_value("Patient Encounter", encounter, {
                    practitioner: res.message[0].name
                })

            }
        })

        frappe.db.set_value("Patient Encounter", encounter, {
            is_with_doctor: 1,
        });
    }

    document.location.href = `/app/patient-encounter/${encounter}`


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

// Function to run every minute to determine elapsed time given a particular date
const getElapsedTime = (date) => {
    const now = new Date();
    const elapsed = now - new Date(date);
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''}`;
    }
    if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
}

frappe.pages['all-queues'].on_page_load = function (wrapper) {
	new AllQueueList(wrapper)
}
let renderQueue = async () => {
	let queue = await frappe.call({
        method: "gch_queue.services.render_all_queues",
        
    });
    let queue_list = queue.message;
    return queue_list;
}

AllQueueList = Class.extend({
	init: function (wrapper) {
		template_name = "all_queues"
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: "All Queues",
			single_column: true
		});
		this.make()
	},

	refresh_queue: async function (queue_list, service_unit) {
        let me = this;
        let details = ""
        let i;
        me.page.main.find(".queue-list").empty()
        for (i = 0; i < queue_list.length; i++) {
            let is_emergency_patient = queue_list[i][1][0]
            let patient_priority = queue_list[i][1][0]
            let pill_color;
            let priority = "";
            if (patient_priority === 1) {
                pill_color = "red"
                priority = "Emergency"
                textClass = "text-danger"
            }
            else if (patient_priority === 2) {
                pill_color = "yellow"
                priority = "Priority"
                textClass = "text-warning"
            }
            else {
                pill_color = "green"
                priority = "Normal"
                textClass = "text-success"
            }
            // let priority = is_emergency_patient === 1 ? "Emergency" : "Normal"
            let patient = queue_list[i][0]
            let patient_encounter = queue_list[i][1][3].patient_encounter
            let practitioner_name = queue_list[i][1][3].practitioner_name
            let creation_time = queue_list[i][1][3].creation
            let updated_time = queue_list[i][1][3].modified
            let patient_type = queue_list[i][1][3].type
            let clinic = queue_list[i][1][3].clinic
            let mode_of_payment = queue_list[i][1][3].mode_of_payment
            let workflow_state = queue_list[i][1][3].workflow_state
            details += `
            <div class="level list-row">
            <div
            class="level-left ellipsis indicator-pill ${pill_color}">
            <div class="list-row-col ellipsis list-subject level">
                <input class="level-item list-row-checkbox hidden-xs" type="checkbox"
                    data-name=${patient}>
                <span class="level-item" style="margin-bottom: 1px;">
                    <span class="like-action not-liked" data-name="${patient}"
                        data-doctype="Patient" data-liked-by="null" title=""></span>
                    <span class="likes-count"></span>
                </span>
                <div style="flex-direction:column; display:flex;">
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
    
            </div>
            <div class="list-row-col ellipsis hidden-xs ">
                <span class="ellipsis"
                    title="Patient Encounter: ${patient_encounter}">
                    <a href="/app/patient-encounter/${patient_encounter}" class="filterable ellipsis"
                        data-filter="encounter,=,${patient_encounter}"
                        >
                        ${patient_encounter}
                    </a>
                </span>
            </div>
            <div class="list-row-col ellipsis hidden-xs hidden-sm hidden-md hidden-lg ">
                <span class="ellipsis" title="Creation Time: ${creation_time}">
                    <a class="filterable ellipsis">
                        ${this.formatCreatedTime(creation_time)}
                    </a>
                </span>
            </div>
            <div class="list-row-col ellipsis hidden-xs ">
                <span class="ellipsis" title="Updated Time:  ${updated_time}">
                    <a class="filterable ellipsis"
                        data-filter="gch_patient_age,=,patient">
                        ${this.formatCreatedTime(updated_time)}
                    </a>    
                </span>
            </div>
            <div class="list-row-col ellipsis hidden-xs ">
                <span class="ellipsis" title="Creation Time: ${creation_time}">
                    <a class="filterable ellipsis">
                        ${this.getElapsedTime(updated_time)}
                    </a>
                </span>
            </div>
            <div class="list-row-col ellipsis hidden-xs ">
                <span class="ellipsis" title="Service Unit: ${service_unit}">
                    <a class="filterable ellipsis" data-filter="patient_type">
                        ${service_unit}
                    </a>
                </span>
            </div>
            <div class="list-row-col ellipsis hidden-xs ">
                <span class="ellipsis" title="Priority: ${priority}">
                    <a class="filterable ellipsis" data-filter="queue_position,=,${is_emergency_patient}">
                        ${priority}
                    </a>
                </span>
            </div>
            <div class="list-row-col ellipsis hidden-xs ">
                <span class="ellipsis" title="Clinic: ${clinic}">
                    <a class="filterable ellipsis" data-filter="patient_type">
                        ${clinic}
                    </a>
                </span>
            </div>
            <div class="list-row-col ellipsis hidden-xs ">
                <span class="ellipsi" title="Payment Mode: ${mode_of_payment}">
                    <a class="filterable ellipsi" data-filter="mode_of_payment">
                       ${mode_of_payment}
                    </a>
                   
                </span>   
            </div>
            <div class="list-row-col ellipsis hidden-xs ">
                <span class="ellipsis" title="Workflow State: ${workflow_state}">
                    <a class="filterable ellipsis" data-filter="patient_type">
                        ${workflow_state}
                    </a>
                </span>
            </div>
            <div class="list-row-col ellipsis hidden-xs ">
            <span class="ellipsis" title="Action: See Patient">
                <span class="badge badge-pill badge-success"  onClick="handleSeePatient(event, \'${(patient_encounter)}\')">
                  See Patient
                </span>
            </span>
        </div>
        </div>
        </div>
        `
        }
        // console.log(details)
        this.page.main.find('.queue-list').append(details);
    },
	make: async function(){
		this.formatCreatedTime = formatCreatedTime;
        this.getElapsedTime = getElapsedTime;
		let user_ = frappe.user;

        let current_station = await frappe.db.get_list('Practitioner Station Entry', {
            fields: ['*'],
            filters: {
                user: user_.name
            }
        })
        this.current_station_entry = current_station[0];

        if (current_station.length < 1) {
            healthcare_practitioner = await frappe.db.get_list('Healthcare Practitioner', {
                fields: ['*'],
                filters: {
                    user_id: user_.name
                }
            })
            if (healthcare_practitioner.length > 0) {
                current_station = await frappe.db.get_list('Practitioner Station Entry', {
                    fields: ['*'],
                    filters: {
                        healthcare_practitioner: healthcare_practitioner[0].name
                    }
                })
            }

        }
        if (current_station.length > 0) {
            console.log('CURRENT STATION', current_station)
            let service_unit_ = current_station[0].station;
            this.service_unit = service_unit_;
            console.log(this.service_unit, service_unit_)
            // console.log(get_default_range())
        }

		this.page.main.html(frappe.render_template(frappe.templates.all_queues, this)).html();
		this.queue = await renderQueue()
		this.refresh_queue(this.queue, this.service_unit)
		console.log(this.queue)
	}
})