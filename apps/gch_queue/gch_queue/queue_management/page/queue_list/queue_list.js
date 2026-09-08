const handleSeePatient = (event, encounter, queue_name) => {

    console.log(event, encounter, queue_name)
    // alert(`Hola: ${encounter}`)
    // frappe.db.set_value("Patient Encounter", encounter, {
    //     is_with_doctor: 1,
    // });

    frappe.db.set_value("Patient Encounter", encounter, {
        is_with_doctor: 1,
    });
    frappe.db.set_value("Queue", queue_name, {
        is_in: 1
    })

    // Setting Primary Doctor on encounter when see patient button is clicked by doctor
    if (frappe.user.has_role("GCH-Doctor")) {
        frappe.call({
            method: "gch_queue.services.fetch_practitioner_name",
            async: false,
            args: { "practitioner_email": frappe.user.name },
            callback: (res) => {
                // console.log(res.message)
                frappe.db.set_value("Patient Encounter", encounter, {
                    practitioner: res.message[0].name
                })

            }
        })
    }

    // pull to pharmacy when see patient is clicked
    if (frappe.user.has_role("GCH-Pharmacy")) {
        frappe.db.set_value("Patient Encounter", encounter, {
            workflow_state: "Pending Pharmacy",
        });
    }

    document.location.href = `/app/patient-encounter/${encounter}`;
};



frappe.pages["queue-list"].on_page_load = function (wrapper) {
    new QueueList(wrapper, handleSeePatient);
};

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

frappe.pages['queue-list'].on_page_load = function (wrapper) {
    new QueueList(wrapper, handleSeePatient);
}


frappe.realtime.on('queue_updates', (data) => {
    this.formatCreatedTime = formatCreatedTime
    this.getElapsedTime = getElapsedTime
    console.log('queue_updates')
    let date_range = get_default_range()
    console.log(data)
    if (data?.last !== true) {
        frappe.show_alert('Hi, a new patient has been added to your queue', 3);
        frappe.utils.play_sound("alert")
    }
    if (data?.last === true) {

        renderQueue(data.service_unit, start_date = date_range[0], end_date = date_range[1]).then((queue_list) => {
            console.log(queue_list)
            let me = this;
            let details1 = ""
            let details = ""
            let i;
            $(".queue-list").empty()
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
                let queue_name = queue_list[i][1][3].name
                let patient_type = queue_list[i][1][3].type
                let clinic = queue_list[i][1][3].clinic
                let mode_of_payment = queue_list[i][1][3].mode_of_payment
                let workflow_state = queue_list[i][1][3].workflow_state
                let has_lab_test = queue_list[i][1][3].lab_prescription_count > 0;
                let has_lab_result = queue_list[i][1][3].lab_prescription_result_count > 0;
                let has_procedure = queue_list[i][1][3].procedure_prescription_count > 0;
                let has_procedure_result = queue_list[i][1][3].procedure_prescription_submitted_count > 0;
                let has_radiology = queue_list[i][1][3].radiology_prescription_count > 0;
                let has_pharmacy = queue_list[i][1][3].doctor_prescription_count > 0;

                details += `
                <div class="level list-row">
                <div
                class="level-left ellipsis indicator-pill ${pill_color}">
                <div class="list-row-col queue ellipsis list-subject level">
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
                <div class="list-row-col queue ellipsis hidden-xs ">
                    <span class="ellipsis"
                        title="Patient Encounter: ${patient_encounter}">
                        <a href="/app/patient-encounter/${patient_encounter}" class="filterable ellipsis"
                            data-filter="encounter,=,${patient_encounter}"
                            >
                            ${patient_encounter}
                        </a>
                    </span>
                </div>
                <div class="list-row-col queue ellipsis hidden-xs hidden-sm hidden-md hidden-lg ">
                    <span class="ellipsis" title="Creation Time: ${creation_time}">
                        <a class="filterable ellipsis">
                            ${this.formatCreatedTime(creation_time)}
                        </a>
                    </span>
                </div>
                <div class="list-row-col queue ellipsis hidden-xs ">
                    <span class="ellipsis" title="Updated Time:  ${updated_time}">
                        <a class="filterable ellipsis"
                            data-filter="gch_patient_age,=,patient">
                            ${this.formatCreatedTime(updated_time)}
                        </a>    
                    </span>
                </div>
                <div class="list-row-col queue ellipsis hidden-xs ">
                    <span class="ellipsis" title="Creation Time: ${creation_time}">
                        <a class="filterable ellipsis">
                            ${this.getElapsedTime(updated_time)}
                        </a>
                    </span>
                </div>
                <div class="list-row-col queue ellipsis hidden-xs ">
                    <span class="ellipsis" title="Service Unit: ${service_unit}">
                        <a class="filterable ellipsis" data-filter="patient_type">
                            ${service_unit}
                        </a>
                    </span>
                </div>
                <div class="list-row-col queue ellipsis hidden-xs ">
                    <span class="ellipsis" title="Priority: ${priority}">
                        <a class="filterable ellipsis" data-filter="queue_position,=,${is_emergency_patient}">
                            ${priority}
                        </a>
                    </span>
                </div>
                <div class="list-row-col queue ellipsis hidden-xs ">
                    <span class="ellipsis" title="Clinic: ${clinic}">
                        <a class="filterable ellipsis" data-filter="patient_type">
                            ${clinic}
                        </a>
                    </span>
                </div>
                <div class="list-row-col queue ellipsis hidden-xs ">
                    <span class="ellipsi" title="Payment Mode: ${mode_of_payment}">
                        <a class="filterable ellipsi" data-filter="mode_of_payment">
                           ${mode_of_payment}
                        </a>
                       
                    </span>   
                </div>
                <div class="list-row-col queue ellipsis hidden-xs ">
                    <div class="d-flex flex-row flex-wrap gap-4">
                    ${has_procedure
                        ? has_procedure_result
                            ? '<span class="badge badge-pill badge-success p-2 mb-2 mr-2"> Procedure (R) </span>'
                            : '<span class="badge badge-pill badge-info p-2 mb-2 mr-2"> Procedure </span>'
                        : ""
                    }
                       ${has_lab_test
                        ? has_lab_result
                            ? '<span class="badge badge-pill badge-success p-2 mb-2 mr-2"> Lab (R) </span>'
                            : '<span class="badge badge-pill badge-info p-2 mb-2 mr-2"> Lab </span>'
                        : ""

                    }
                        ${has_radiology
                        ? '<span class="badge badge-pill badge-info p-2 mb-2 mr-2"> Radiology </span>'
                        : ""
                    }
                        ${has_pharmacy
                        ? '<span class="badge badge-pill badge-info p-2 mb-2 mr-2"> Pharmacy </span>'
                        : ""
                    }
                      
                    </div>
                </div>
                <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis" title="Action: See Patient">
                    <span class="btn btn-primary btn-sm"  onClick="handleSeePatient(event, \'${patient_encounter}\', \'${queue_name}\')">
                      See Patient
                    </span>
                </span>
            </div>
            </div>
            </div>
            `

                details1 += `
            <div class="level list-row">
            <div
            class="level-left ellipsis indicator-pill ${pill_color}">
            <div class="list-row-col queue ellipsis list-subject level">
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
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis"
                    title="Patient Encounter: ${patient_encounter}">
                    <a href="/app/patient-encounter/${patient_encounter}" class="filterable ellipsis"
                        data-filter="encounter,=,${patient_encounter}"
                        >
                        ${patient_encounter}
                    </a>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs hidden-sm hidden-md hidden-lg ">
                <span class="ellipsis" title="Creation Time: ${creation_time}">
                    <a class="filterable ellipsis">
                        ${this.formatCreatedTime(creation_time)}
                    </a>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis" title="Updated Time:  ${updated_time}">
                    <a class="filterable ellipsis"
                        data-filter="gch_patient_age,=,patient">
                        ${this.formatCreatedTime(updated_time)}
                    </a>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs">
                <span class="ellipsis" title="Creation Time: ${creation_time}">
                    <a class="filterable ellipsis">
                        ${this.getElapsedTime(updated_time)}
                    </a>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis" title="Service Unit: ${service_unit}">
                    <a class="filterable ellipsis" data-filter="patient_type">
                        ${service_unit}
                    </a>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis" title="Priority: ${priority}">
                    <a class="filterable ellipsis" data-filter="queue_position,=,${is_emergency_patient}">
                        ${priority}
                    </a>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis" title="Clinic: ${clinic}">
                    <a class="filterable ellipsis" data-filter="patient_type">
                        ${clinic}
                    </a>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis" title="Payment Mode: ${mode_of_payment}">
                    <a class="filterable ellipsis" data-filter="mode_of_payment">
                       ${mode_of_payment}
                    </a>
                    
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis" title="Workflow State: ${workflow_state}">
                    <a class="filterable ellipsis" data-filter="patient_type">
                        ${workflow_state}
                    </a>
                    <span class="badge badge-pill badge-warning">
                            Lab
                    </span>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis" title="Workflow State: ${workflow_state}">
                    <span class="badge badge-pill badge-success" onClick="handleSeePatient(event, \'${patient_encounter}\', \'${queue_name}\')">
                        See Patient
                    </span>
                </span>
            </div>
        </div>
        </div>
        `;
            }
            $(".queue-list").append(details);
            frappe.utils.play_sound("email");
        });
    }
});


let renderQueue = async (service_unit, start_date = null, end_date = null) => {
    // let user_ = frappe.user;
    // let current_station = await frappe.db.get_list('Practitioner Station Entry', {
    //     fields: ['*'],
    //     filters: {
    //         user: user_.name
    //     }
    // })
    // this.current_station_entry = current_station[0];

    // if (current_station.length < 1) {
    //     healthcare_practitioner = await frappe.db.get_list('Healthcare Practitioner', {
    //         fields: ['*'],
    //         filters: {
    //             user_id: user_.name
    //         }
    //     })
    //     if (healthcare_practitioner.length > 0) {
    //         current_station = await frappe.db.get_list('Practitioner Station Entry', {
    //             fields: ['*'],
    //             filters: {
    //                 healthcare_practitioner: healthcare_practitioner[0].name
    //             }
    //         })
    //     }

    // }
    // if (current_station.length > 0) {
    //     let service_unit_ = current_station[0].station;
    //     this.service_unit = service_unit_;
    //     let queue = await frappe.call({
    //         method: "gch_queue.services.render_queue",
    //         args: {
    //             'service_unit': service_unit_,
    //             'start_date': start_date,
    //             'end_date': end_date
    //         }
    //     });
    //     let queue_list = queue.message;
    //     return queue_list;
    // }

    let queue = await frappe.call({
        method: "gch_queue.services.render_queue",
        args: {
            service_unit: service_unit,
            start_date: start_date,
            end_date: end_date,
        },
    });
    let queue_list = queue.message;
    return queue_list;
};

const get_default_range = () => {
    // check from localstorage first
    const range = localStorage.getItem('queue-range');
    if (range) {
        return range.split(',');
    }
    return [frappe.datetime.get_today(), frappe.datetime.get_today()];
};

QueueList = Class.extend({
    init: function (wrapper, handleSeePatient) {
        template_name = "queue_list"
        this.handleSeePatient = handleSeePatient

        this.page = frappe.ui.make_app_page({
            parent: wrapper,
            title: "Queue List",
            single_column: true,
        });
        this.make();
    },

    addCustomButton: function () {
        // Create the button HTML
        var buttonHtml = '<button id="custom-button" class="btn btn-primary btn-sm">View Open Queues</button>';
        let me = this;
        let reception_btn = me.page.main.find("#reception-btn").append(buttonHtml)

        reception_btn.on('click', '#custom-button', function () {

            window.open("/app/all-queues", "_blank");
        });
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
            let queue_name = queue_list[i][1][3].name
            let patient_type = queue_list[i][1][3].type
            let clinic = queue_list[i][1][3].clinic
            let mode_of_payment = queue_list[i][1][3].mode_of_payment
            let workflow_state = queue_list[i][1][3].workflow_state
            let has_lab_test = queue_list[i][1][3].lab_prescription_count > 0;
            let has_lab_result = queue_list[i][1][3].lab_prescription_result_count > 0;
            let has_procedure = queue_list[i][1][3].procedure_prescription_count > 0;
            let has_procedure_result = queue_list[i][1][3].procedure_prescription_submitted_count > 0;
            let has_radiology = queue_list[i][1][3].radiology_prescription_count > 0;
            let has_pharmacy = queue_list[i][1][3].doctor_prescription_count > 0;
            details += `
            <div class="level list-row">
            <div
            class="level-left ellipsis indicator-pill ${pill_color} queue">
            <div class="list-row-col queue ellipsis list-subject level">
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
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis"
                    title="Patient Encounter: ${patient_encounter}">
                    <a href="/app/patient-encounter/${patient_encounter}" class="filterable ellipsis"
                        data-filter="encounter,=,${patient_encounter}"
                        >
                        ${patient_encounter}
                    </a>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs hidden-sm hidden-md hidden-lg ">
                <span class="ellipsis" title="Creation Time: ${creation_time}">
                    <a class="filterable ellipsis">
                        ${this.formatCreatedTime(creation_time)}
                    </a>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis" title="Updated Time:  ${updated_time}">
                    <a class="filterable ellipsis"
                        data-filter="gch_patient_age,=,patient">
                        ${this.formatCreatedTime(updated_time)}
                    </a>    
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis" title="Creation Time: ${creation_time}">
                    <a class="filterable ellipsis">
                        ${this.getElapsedTime(updated_time)}
                    </a>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis" title="Service Unit: ${service_unit}">
                    <a class="filterable ellipsis" data-filter="patient_type">
                        ${service_unit}
                    </a>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis" title="Priority: ${priority}">
                    <a class="filterable ellipsis" data-filter="queue_position,=,${is_emergency_patient}">
                        ${priority}
                    </a>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsis" title="Clinic: ${clinic}">
                    <a class="filterable ellipsis" data-filter="patient_type">
                        ${clinic}
                    </a>
                </span>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <span class="ellipsi" title="Payment Mode: ${mode_of_payment}">
                    <a class="filterable ellipsi" data-filter="mode_of_payment">
                       ${mode_of_payment}
                    </a>
                   
                </span>   
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
                <div class="d-flex flex-row flex-wrap gap-4">
                ${has_procedure
                    ? has_procedure_result
                        ? '<span class="badge badge-pill badge-success p-2 mb-2 mr-2"> Procedure (R) </span>'
                        : '<span class="badge badge-pill badge-info p-2 mb-2 mr-2"> Procedure </span>'
                    : ""
                }
                   ${has_lab_test
                    ? has_lab_result
                        ? '<span class="badge badge-pill badge-success p-2 mb-2 mr-2"> Lab (R) </span>'
                        : '<span class="badge badge-pill badge-info p-2 mb-2 mr-2"> Lab </span>'
                    : ""

                }
                    ${has_radiology
                    ? '<span class="badge badge-pill badge-info p-2 mb-2 mr-2"> Radiology </span>'
                    : ""
                }
                    ${has_pharmacy
                    ? '<span class="badge badge-pill badge-info p-2 mb-2 mr-2"> Pharmacy </span>'
                    : ""
                }
                  
                </div>
            </div>
            <div class="list-row-col queue ellipsis hidden-xs ">
            <span class="ellipsis" title="Action: See Patient">
                <span class="btn btn-primary btn-sm"  onClick="handleSeePatient(event, \'${patient_encounter}\', \'${queue_name}\')">
                  See Patient
                </span>
            </span>
        </div>
        </div>
        </div>
        `
        }
        this.page.main.find('.queue-list').append(details);
    },

    make: async function () {

        this.formatCreatedTime = formatCreatedTime;
        this.getElapsedTime = getElapsedTime;

        let user_ = frappe.user;

        let current_station = await frappe.db.get_list('Practitioner Station Entry', {
            fields: ['*'],
            filters: {
                user: user_.name
            }
        })
        if( current_station.length > 1){
            this.current_station_entry = current_station[0];

        }

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
            this.current_station_entry = current_station[0];

            let service_unit_ = current_station[0].station;
            this.service_unit = service_unit_;
            console.log(this.service_unit, service_unit_)
            console.log(get_default_range())
        }

        this.page.main.html(frappe.render_template(frappe.templates.queue_list, this)).html();
        this.filter_range = localStorage.getItem('queue-range')
        this.date_filter_range = get_default_range()

        this.queue = await renderQueue(service_unit = this.service_unit, start_date = this.date_filter_range[0],
            end_date = this.date_filter_range[1]);
        if (frappe.user.has_role("GCH-Reception") || frappe.user.has_role("GCH-Nurse")) {
            this.addCustomButton()
        }


        let dept_filter_field = frappe.ui.form.make_control({
            parent: $('.dept-filter'),
            render_input: 1,
            df: {
                fieldtype: "Link",
                fieldname: "dept_filter",
                placeholder: __('Filter By Department'),
                options: "Healthcare Service Unit",
                change: async () => {
                    let selected_dept = dept_filter_field.get_value()
                    console.log(selected_dept);
                }
            }
        });

        dept_filter_field.toggle_label(false);
        dept_filter_field.refresh();

        // if(frappe.user.has_role("GCH-Reception")){
        //     alert("Receptionist in the house!")
        //     frappe.ui.form.add_custom_button('Open Reference form', () => {
        //         frappe.set_route('Form', frm.doc.reference_type, frm.doc.reference_name);
        //     })
        // }

        // this.date_range_field = frappe.ui.form.make_control({
        //     parent: $('.date-filter'),
        //     render_input: 1,
        //     df: {
        //         fieldtype: 'DateRange',
        //         fieldname: 'date_range',
        //         placeholder: __('Filter By Date Range'),
        //         default: this.date_filter_range,
        //         // input_class: 'input-xs',
        //         change: async () => {
        //             let selected_date_range = this.date_range_field.get_value();
        //             if (selected_date_range && selected_date_range.length === 2) {
        //                 console.log(selected_date_range)
        //                 await localStorage.setItem('queue-range', selected_date_range)
        //                 this.queue = await renderQueue(service_unit = this.service_unit, start_date = selected_date_range[0], end_date = selected_date_range[1])
        //                 this.refresh_queue(this.queue, this.service_unit)
        //             }
        //         }
        //     },
        // });

        this.date_range_field = frappe.ui.form.make_control({
            parent: $('.date-filter'),
            render_input: 1,
            df: {
                fieldtype: 'DateRange',
                fieldname: 'date_range',
                placeholder: __('Filter By Date Range'),
                // input_class: 'input-xs',
            },
        });

        // Set the initial date range value
        this.date_range_field.set_input(this.date_filter_range);

        // Attach the change event handler
        this.date_range_field.$input.on('change', async () => {

            console.log('date range changed')
            let selected_date_range = this.date_range_field.get_value();
            if (selected_date_range && selected_date_range.length === 2) {
                console.log(selected_date_range);


                await localStorage.setItem('queue-range', selected_date_range);
                this.queue = await renderQueue(
                    service_unit = this.service_unit,
                    start_date = selected_date_range[0],
                    end_date = selected_date_range[1]
                );
                this.refresh_queue(this.queue, this.service_unit);

                if (new Date() <= new Date(selected_date_range[0]) || new Date() >= new Date(selected_date_range[1])) {
                    frappe.show_alert({
                        message: __("You are viewing queues for a date range that does not include today."),
                        indicator: "red",
                    });

                    // Show informatory dialog
                    frappe.confirm(
                        'You are viewing queues for a date range that does not include today. Do you want to continue?',
                        () => {
                            console.log('Continue');
                        },
                        () => {
                            console.log('Cancel');
                        }
                    );

                }
            }
            else {
                // remove item from localstorage if date range is empty

                localStorage.removeItem('queue-range');
                this.queue = await renderQueue(
                    service_unit = this.service_unit
                );
            }
        });

        // this.date_range_field.$input.focus();
        // $(date_range_field.wrapper).addClass('col-md-3');
        this.date_range_field.toggle_label(false);
        this.date_range_field.refresh();
        this.refresh_queue(this.queue, this.service_unit)

        let today = new Date();
        console.log(today)

        // if today is not within selected date range, show alert
        if (this.date_range_field.get_value().length === 2 && (today <= new Date(this.date_range_field.get_value()[0]) || today >= new Date(this.date_range_field.get_value()[1]))) {
            frappe.show_alert({
                message: __("You are viewing queues for a date range that does not include today."),
                indicator: "red",
            });
            frappe.confirm(
                'You are viewing queues for a date range that does not include today. Do you want to continue?',
                () => {
                    console.log('Continue');
                },
                () => {
                    console.log('Cancel');
                }
            );
        }

        // setInterval(() => {
        //     const elapsedTime = this.getElapsedTime(new Date());
        //     console.log(elapsedTime);
        // }, 1000); // 60000 milliseconds = 1 minute

    }
});
