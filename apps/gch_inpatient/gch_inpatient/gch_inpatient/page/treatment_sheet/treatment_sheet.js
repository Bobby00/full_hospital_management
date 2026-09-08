frappe.pages['treatment-sheet'].on_page_load = function(wrapper) {
	// var page = frappe.ui.make_app_page({
	// 	parent: wrapper,
	// 	title: `Treatment Sheet ${patient_name}`,
	// 	single_column: true
	// });	
	new TreatmentSheet(wrapper)

}

let page_status = ""
let bg_color = "red"
let bincard_data = [];
let selected = [];
let qty_validated = true;

let FREQUENCY_OPTIONS = [
    "Every 24 hrs",
    "Every 12 hrs",
    "Every 8 hrs",
    "Every 6 hrs",
    "Every 5 hrs",
    "Every 4 hrs",
    "Every 3 hrs",
    "Every 2 hrs",
    "Every 1 hr",
    "As Needed",
    "Stat",
    "Weekly",
    "Monthly",
    "Quarterly",
];

const back_to_queue = () => {
    window.location.href = "/app/inpatient-pharmacy-q";
}

const patientBincard = async(test,inpatient_record) => {
    await frappe.call({
        method: "gch_inpatient.services.get_bincard_data",
        args: {
            "inpatient_record": inpatient_record
        },
        callback: (res) => {
            if(res.message) {
                console.log(res.message);
                test.bincard_data = res.message;
                bincard_data = res.message;
                test.page.main
                .html(frappe.render_template(frappe.templates.patient_bincard, test))
                    .html();
            }else {
                frappe.show_alert({message: "No bincard data for this encounter", indicator: 'green'});
            }
        }
    })
}

const showStoppedMed = async(test,inpatient_record) => {

    await frappe.call({
        method: "gch_inpatient.services.get_stopped_meds_list",
        args: {
            "inpatient_record": inpatient_record
        },
        callback: (res) => {
            if(res.message.length > 0) {
                test.inpatient_data = res.message;
                test.page.main
                .html(frappe.render_template(frappe.templates.stopped_meds, test))
                    .html();
            }else {
                frappe.show_alert({message: "No stopped medication for this encounter", indicator: 'green'});
            }
        }
    })

}

const addVerbalOrder = async (test,inpatient_record) => {
    let item_options = "";
    

    var inpatient_doc = await frappe.db.get_doc("Inpatient Record", inpatient_record);
    // console.log(inpatient_doc);
    // return;
    let primary_doc = inpatient_doc.primary_practitioner;
    let secndary_doc = inpatient_doc.secondary_practitioner;
    let doc_list = [primary_doc,secndary_doc]

    let freq = FREQUENCY_OPTIONS.map(
        item =>({label: item, value: item})
    )
    let practitioner_list = doc_list.map(
        item =>({label: item, value: item})
    )

    await frappe.call({
        method: "gch_inpatient.services.get_medication_list",
        callback: (res) => {
            item_options = res.message.map(
                item =>({label: item.item_name, value: item.item_code})
            )
        }
    });

    await frappe.call({
        method: "gch_inpatient.services.get_medication_list",
        callback: (res) => {
            item_options = res.message.map(
                item =>({label: item.item_name, value: item.item_code})
            )
        }
    })


    frappe.prompt([
        {
            label: "Drug",
            fieldname: "Item",
            fieldtype: "Select",
            options: item_options,
            reqd: 1,
        },
        {
            label: "Dosage",
            fieldname: "dose",
            fieldtype: "Int",
            reqd: 1,
        },
        {
            label: "Dosage UOM",
            fieldname: "dose_uom",
            fieldtype: "Data",
            reqd: 1,
        },
        {
            label: "Frequency",
            fieldname: "frequency",
            fieldtype: "Select",
            options: freq,
            reqd: 1,
        },
        {
            label: "Duration (Days)",
            fieldname: "duration",
            fieldtype: "Int",
            reqd: 1,
        },
        {
            label: "Refering Physician",
            fieldname: "referring_physician",
            fieldtype: "Select",
            options: practitioner_list,
            reqd: 1,
        },
        {
            label: "remark",
            fieldname: "remark",
            fieldtype: "Data",
            reqd: 0,
        }
    ],
    function(values){
        console.log(values);
        let medication = values.Item;
        let dose = values.dose;
        let dose_uom = values.dose_uom;
        let freq = values.frequency;
        let duration = values.duration;
        let referring_physician = values.referring_physician;
        let remark = values.remark;

        frappe.call({
            method: "gch_inpatient.services.add_verbal_order",
            args: {
                "inpatient_record": inpatient_record,
                "medication": medication,
                "dose": dose,
                "dose_uom": dose_uom,
                "freq": freq,
                "duration": duration,
                "referring_physician": referring_physician,
                "remark": remark
            },
            callback: (res) =>{
                console.log(res.message);
                frappe.show_alert({message: "Error adding verbal order", indicator:'red'});

                // if(res.message){
                //     frappe.show_alert({message: "Verbal order added successfully", indicator: 'green'});
                // }else {
                //     frappe.show_alert({message: "Error adding verbal order", indicator:'red'});
                // }
            }
        })
    },
    "Add Verbal order"
    )

}

const showActiveMed = async (test,inpatient_record) => {

    var params = frappe.get_route();
    var inpatient_record = params[1];
    var date = moment();

    today = date.format('YYYY-MM-D');
    // console.log(today);

    await frappe.call({
        method: "gch_inpatient.services.get_medical_order_list",
        args: {
            "inpatient_record": inpatient_record
        },
        callback: (res) => {
            if(res.message.length > 0){
                page_status = "Active medication"
                test.inpatient_data = res.message;
                test.page.main
                .html(frappe.render_template(frappe.templates.treatment_sheet, test))
                    .html();
            }else {
                frappe.show_alert({message: "No active medication for this encounter", indicator: 'green'});

            }
        }
    })
}

const showDischargeMed = async (test,inpatient_record) => {

    var params = frappe.get_route();
    var inpatient_record = params[1];
    var date = moment();

    today = date.format('YYYY-MM-D');
    // console.log(today);

    await frappe.call({
        method: "gch_inpatient.services.get_discharge_medication_list",
        args: {
            "inpatient_record": inpatient_record
        },
        callback: (res) => {
            if(res.message.length > 0){
                page_status = "Discharge Medication"
                test.inpatient_data = res.message;
                test.page.main
                .html(frappe.render_template(frappe.templates.treatment_sheet, test))
                    .html();
                document.getElementById("presc_card").style.backgroundColor = "#3b993b";
                document.getElementById("patient_name").style.backgroundColor = "#3b993b";
            }else {
                frappe.show_alert({message: "No Discharge medication for this encounter", indicator: 'green'});
            }
        }
    })
}

const showCommentField = (entry,second_Approval  = false) => {
	frappe.prompt([
        {
            label: 'Comment',
            fieldname: 'user_comment',
            fieldtype: 'Text',
            reqd: 1
        }
    ],
    function(values) {
		console.log(entry);

        // add comment to doc
        if(second_Approval == true) {
            frappe.call({
                method: "gch_inpatient.services.second_approval_high_alert_medication",
                args: {
                    "prescription_tracker": entry,
                    "comment": values.user_comment
                },
                callback: function(res) {
                    if(res.message){
                        let shceduled_time = res.message.time;
                        var today = new Date();
                        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                        // let time_diff = Math.abs(shceduled_time - time) / 1000 / 60;
                        console.log(shceduled_time);
                        frappe.show_alert({message: "Comment added", indicator: 'green'});
                        window.location.reload();
                    }
                    
                }
            });
        }else {
            frappe.call({
                method: "gch_inpatient.services.administer_with_comment",
                args: {
                    "prescription_tracker": entry,
                    "comment": values.user_comment
                },
                callback: function(res) {
                    if(res.message){
                        let shceduled_time = res.message.time;
                        var today = new Date();
                        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                        // let time_diff = Math.abs(shceduled_time - time) / 1000 / 60;
                        console.log(shceduled_time);
                        frappe.show_alert({message: "Comment added", indicator: 'green'});
                        window.location.reload();
                    }
                    
                }
            });
        }
        
        // Process the captured comment, e.g., save it to the database
        // Example: saveCommentToDatabase(values.user_comment);
    },
    'Dispensing Comment'
    );
}

const backToIpRecord = (ip) => {
	const url = `/app/inpatient-record/${ip}`
	window.location.href = url;
}

const route_to_multidisciplinary = async (ip) => {
    await frappe.call({
        method: "gch_inpatient.services.check_multidisciplinary_status",
        args: {
            inpatient_record: ip
        },
        callback: (res) => {
            if(res.message.length > 0) {
                console.log(res.message)
                multidisciplinary_name = res.message[0].name
                    const url = `/app/multidisciplinary/${multidisciplinary_name}`
                    window.location.href = url;
            }else {
                frappe.show_alert({message: "No multidisciplinary record found for this encounter", indicator: 'green'});
            }
        }
    });
}

const stopMedication = (field_element) => {
	// field_element = field_element;
	let prescription_stoppped = field_element.id

    console.log(field_element.id);
	
	frappe.prompt([
        {
            label: 'Reason for Stopping Medication',
            fieldname: 'stop_reason',
            fieldtype: 'Text',
            reqd: 1
        }
    ],
    function(values) {
        // console.log(values);
        // frappe.show_alert({message: `Medication stopped`, indicator: 'green'});

        // update doc
        frappe.call({
            method: "gch_inpatient.services.stop_medication",
            args: {
                "prescription": prescription_stoppped,
                "comment": values.stop_reason
            },
            callback: function(r) {
                if(r.message){
                    frappe.show_alert({message: `Medication stopped`, indicator: 'green'});
                }else{
                    frappe.show_alert({message: `Error stopping medication`, indicator:'red'});
                }
                // frm.refresh();
            }
        });
    },
    'Stop Medication'
    );
}


const high_alert_medication_second_approval = (field_element) => {
    let entry = field_element.id;

    frappe.prompt([
        {
            label: "Do you want to approve with comment?",
            fieldname: 'comment',
            fieldtype: 'Select',
            options: 'Yes\nNo',
            reqd: 1
        }
    ],
    function(values) {
        if (values.comment === 'Yes') {
            showCommentField(entry,true);
        } else {
            // administer_without_comment
            frappe.call({
                method: "gch_inpatient.services.second_approval_high_alert_medication",
                args: {
                    "prescription_tracker": entry
                },
                callback: (res) =>{
                    if(res.message){
                        frappe.show_alert({message: "Approved", indicator: 'green'});
                    }
                }
            })
        }
    }
    
    )
}

const returnMedication = (field_element) => {
    let prescription_item = field_element.dataset.name;
    let issued_qty = field_element.dataset.issued;
    
    frappe.confirm(
        "Do you want to return this medication?",
        () =>
            frappe.prompt([
                {
                    label: 'Reason for returning this medication?',
                    fieldname: 'comment',
                    fieldtype: 'Data',
                    reqd: 1
                },
                {
                    label: 'Return Quantity',
                    fieldname: 'return_qty',
                    fieldtype: 'Int',
                    reqd: 1
                },
            ],
            (values)=> {
                // console.log(values);
                if (values.return_qty > issued_qty) {
                    frappe.show_alert({message: "Return quantity cannot be greater than issued quantity", indicator: 'red'});
                }else {
                    frappe.call({
                        method: "gch_inpatient.services.return_item",
                        args: {
                            "prescription": prescription_item,
                            "comment": values.comment,
                            "return_qty": values.return_qty
                        },
                        callback: (res) => {
                            console.log(res);
                        }
                    })
                }
            }),
        () => {
            window.location.reload();
        }
    )
}


const flagDrugAllergy = (field_element) => {
    let entry = field_element.dataset.item;
    frappe.confirm(
        `Do you want to flag patient ${window.patient} as allergic to ${entry}?`,
        () =>
            frappe.prompt([
                {
                    label: 'Reason for flagging this medication?',
                    fieldname: 'comment',
                    fieldtype: 'Text',
                    reqd: 1
                },
            ],
            (values) => {
                console.log(values,window.patient);
            }),
        () => {
            window.location.reload();
        }
    )
}


const administerMedications = (field_element) => {
	let entry = field_element.id
	frappe.prompt([
        {
            label: 'Do you want to administer with comment?',
            fieldname: 'comment',
            fieldtype: 'Select',
            options: 'Yes\nNo',
            reqd: 1
        }
    ],
    function(values) {
        if (values.comment === 'Yes') {
            showCommentField(entry);
        } else {
            // administer_without_comment

            frappe.call({
                method: "gch_inpatient.services.administer_without_comment",
                args: {
                    "prescription_tracker": entry
                },
                callback: function(res) {
                    if(res.message){
                        frappe.show_alert({message: "Administered", indicator: 'green'});
                    }
                    
                }
            });
            cur_frm.reload_doc();
            // Call a different function or perform other actions
            // when the user chooses "No"
            // Example: yourOtherFunction();
        }
    },
    'Comment Dialog'
    );
}

let calculate_age = function (birth) {
    let ageMS = Date.parse(Date()) - Date.parse(birth);
    let gch_patient_age = new Date();
    gch_patient_age.setTime(ageMS);
    let years = gch_patient_age.getFullYear() - 1970;

    return `${years} ${__(
      "Year(s)"
    )} ${gch_patient_age.getMonth()} ${__(
      "Month(s)"
    )} ${gch_patient_age.getDate()} ${__("Day(s)")}`;
};

const reopen_slot = (field_element) =>{
    let entry_id = field_element.dataset.entry; 
    console.log(entry_id);
    let reopen_dialog = new frappe.ui.Dialog({
        title: "Reason for Reopening Slot",
        fields:[
            {
                label: " Reopen Reason",
                fieldname: "reopen_reason",
                fieldtype: "Data",
            }
        ],
        size: 'small',
        static: true,
        primary_action_label: "Reopen",
        primary_action(values) {
            let reason = values.reopen_reason;
            if(!reason){
                frappe.throw("Please enter reason");
            }
            frappe.call({
                method: "gch_inpatient.services.reopen_slot",
                args: {
                    "entry": entry_id,
                    "reason": reason
                },
                callback: (res)=>{
                    console.log(res);
                    if(res.message){
                        frappe.show_alert({message: "Slot Reopened", indicator: 'green'});
                        window.location.reload();
                    }
                }
            })

        },
        secondary_action_label: 'Cancel',
        secondary_action() {
            reopen_dialog.hide();
        }
    });
    reopen_dialog.show()
}

const receive_meds = (field_element) => {

    let presc = field_element.id
    let inpatient = field_element.dataset.name;
    let qty = field_element.dataset.dispensed;
    console.log(inpatient);
    // return 
    frappe.prompt([
        {
            label: 'Received Quatity',
            fieldname: 'qty',
            fieldtype: 'Int',
            reqd: 1,
            validate: function(value) {
                // Custom validation function
                if (value <= 0) {
                    msgprint('Please enter a positive integer.');
                    validated = false;
                }
                if(value > qty){
                    msgprint('Received quantity cannot be greater than dispensed quantity');
                    validated = false;
                }
            }
        },
        {
            label: "Comment",
            fieldname: "comment",
            fieldtype: "Text",
            reqd: 0
        }
    ], //Inpatient Doctor Prescription Table
    function(values) {
        // console.log(values);
        // frappe.show_alert({message: `Medication stopped`, indicator: 'green'});

        // Cancel the request if value is greater than qty
        let receive_qty = values.qty
        if(receive_qty > qty){
            frappe.throw("Received quantity cannot be greater than dispensed quantity");
        }
        if(receive_qty <= 0){
            frappe.throw("Received quantity cannot be less than 1");
        }

        // update doc
        frappe.call({
            method: "gch_inpatient.services.receive_meds_and_create_schedule",
            args: {
                "prescription": presc,
                "comment": values.comment,
                "qty": values.qty,
                "inpatient": inpatient
            },
            callback: function(r) {
                if(r.message){
                    frappe.show_alert({message: "Received successfuly", indicator: 'green'});
                    window.location.reload();
                }else {
                    frappe.show_alert({message: "Error receiving medication. Please refresh the page and try again.", indicator:'red'});
                }
                
            }
        });
    },
    'Receive Medication'
    );
}

const handleQtyChange = async (field_element,max_qty)=>{
    // Use id to retrieve objected from selected and update quantity
    let id = field_element.getAttribute("data-name");
    let value = field_element.value;
    if(max_qty < value || value < 0){
      frappe.show_alert({
        indicator: 'orange',
        message: 'Quantity cannot exceed the maximum quantity',
        title: 'Warning'
      })
      qty_validated = false;
      return;
    }else {
      qty_validated = true
    }
    
  }

const getSelectedItems =  function () {
    // Get all rows with the class "list-row"
    const rows = document.querySelectorAll('.list-row');

    const selected_items = []
    
    // Iterate through each row
    rows.forEach(row => {
        // Check if the checkbox in the current row is checked
        const isChecked = row.querySelector('.row-checkbox') ? row.querySelector('.row-checkbox').checked : false;
        const rowId = row.id;
        // Proceed only if the checkbox is checked
        if (isChecked) {
            // Extract values from the checked row
            const itemName = row.querySelector('.list-row-col:nth-child(1) span').textContent.trim();
            const billedQuantity = row.querySelector('.list-row-col:nth-child(2) span').textContent.trim();
            const duration = row.querySelector('.list-row-col:nth-child(3) span').textContent.trim();
            const prescribingDoctor = row.querySelector('.list-row-col:nth-child(4) span').textContent.trim();
            const dispensedBy = row.querySelector('.list-row-col:nth-child(5) span').textContent.trim();
            const receivingNurse = row.querySelector('.list-row-col:nth-child(6) span').textContent.trim();
            const indication = row.querySelector('.list-row-col:nth-child(7) span').textContent.trim();
            
            // Log or store the values for further use
           
            selected_items.push({
                itemName,
                billedQuantity,
                duration,
                prescribingDoctor,
                dispensedBy,
                receivingNurse,
                indication,
                rowId
            })
        }
    });

    console.log(selected_items);
    

    return selected_items
}

const initiate_returns = async() => {
    let selected_items = getSelectedItems();

    let d = new frappe.ui.Dialog({
        title: 'Confirm Number of items to return',
        fields: [
            {
                label: "Item Name",
                fieldname: 'html',
                fieldtype: 'HTML'
            }
        ],
        size: "extra-large",
        primary_action_label: 'Submit',
        primary_action(){
            if(!qty_validated){
                frappe.show_alert({
                  indicator: 'orange',
                  message: 'Cannot Create request, Confirm quantities before submit',
                  title: 'Warning'
                })
                return;
            }else{
                let values = [];
                var table = document.getElementById('confirm')

                console.log(table,"Table-----------------------here");
                
            
                for (var i = 1, row; row = table.rows[i]; i++) {
                    let row_values = {};
                    let presc = row.id;
                    let qty_element = $(`#return_qty${presc}`);
                    let qty = qty_element.val();
                    let issued_qty = qty_element.data('qty');
                    let item = qty_element.data('item');
                    let comment = $(`#return_comment${presc}`).val() ? $(`#return_comment${presc}`).val(): "None";

                    if(qty > issued_qty){
                        frappe.show_alert({message: `Cannot return more ${item} than was issued`, indicator: 'orange'});
                        d.hide();
                        return;
                    }else{
                        row_values.name = presc;
                        row_values.qty = qty;
                        row_values.comment = comment;
                        values.push(row_values);
                    }
                }

                console.log(values);
                frappe.call({
                    method: "gch_inpatient.services.initiate_returns",
                    args: {
                        "values": values,
                    },
                    callback: (res) => {
                        console.log(res);
                        frappe.msgprint(res.message)
                        d.hide()
                    }
                })
                console.log(values);
            }
        }
    });
    let ROWS = "";

    for(i=0;i<selected_items.length;i++){

        ROWS+=`
            <tr id="${selected_items[i].rowId}" style="font-weight: bolder; font-size: 12px;>
                <td scope="col"></td>    
                <td scope="col">${selected_items[i].itemName}</td>
                <td scope="col">${selected_items[i].billedQuantity}</td>
                <td scope="col">
                    <input class="form-control" min="0" 
                        type="number"
                        id="return_qty${selected_items[i].rowId}"
                        data-qty="${selected_items[i].billedQuantity}"
                        data-item="${selected_items[i].itemName}"
                        onchange="handleQtyChange(this,${selected_items[i].billedQuantity})"
                        >
                </td>
                <td scope="col">${selected_items[i].dispensedBy}</td>
                <td scope="col">
                    <input type="text" id="return_comment${selected_items[i].rowId}" class="form-control" placeholder="comment" >
                </td>
            </tr>        
        `
    }

    let  htmlC = `
        <table id="confirm" class="table table-bordered table-hover" style="font-size: 12px;">
            <thead>
                <tr>
                    <th scope="col" style="min-width: 12.875rem">Item</th>
                    <th scope="col">Issued Qty</th>
                    <th scope="col" >Quantity</th>
                    <th scope="col"">Issued By</th>
                    <th scope="col"">Comment</th>
                </tr>
            </thead>

            <tbody id="dynamic_prescription_items">`
            +
            ROWS 
            +
            `</tbody>
        </table>
    `;

    d.set_value("html",htmlC)

    d.show();
}


const toggleCheckAll = (source) => {
    var checkboxes = document.querySelectorAll('.row-checkbox');

    if(source.checked){
        document.getElementById('return-items').style.display = "block";
    }else{
        document.getElementById('return-items').style.display = "none";
    }

    checkboxes.forEach(function(checkbox){
        checkbox.checked = source.checked
    })
}

TreatmentSheet = Class.extend({
	init: function(wrapper) {		
		this.make(wrapper);
	},
	
	make: async function (wrapper) {

		var params = frappe.get_route();
		var inpatient_record = params[1];
        var date = moment();

        today = date.format('YYYY-MM-DD');
        // console.log(today);

		await frappe.call({
			method: "gch_inpatient.services.get_medical_order_list",
			args: {
				"inpatient_record": inpatient_record
			},
			callback: (res) => {
				if(res.message){
					this.inpatient_data = res.message;
                    page_status = "Active medication"	
				}
			}
		})

		// Get patient information and allergies.
        let dob = '';
        let cur_frm = []
        var DATA = '';

        await frappe.call({
            method: "gch_inpatient.services.get_patient_information",
            args: {
                "inpatient_record": inpatient_record
            },
            callback: (res) => {
                if(res.message){
                    this.patient_data = res.message;
                    if(res.message.dob){
                        dob = res.message.dob;
                        if(dob){
                            this.age = calculate_age(dob);
                        }
                    }
                    let food_allergies = res.message.food_allergies;
                    let drug_allergies = res.message.drug_allergy;
                    let other_allergies = res.message.other_allergies;

                    window.patient = res.message.patient_name;

                    DATA = `
                        <ul style="display: grid;grid-template-columns: repeat(4,1fr);list-style: none;">
                            <li><strong>Patient: </strong> ${res.message.patient_name}</li>
                            <li><strong>UHID: </strong> ${res.message.uhid}</li>
                            <li><strong>Age: </strong> ${this.age}</li>
                            <li><strong>DOB: </strong> ${res.message.dob}
                            <li><strong>Drug Allergies: </strong>  
                            ${drug_allergies.map(
                                (allergy) =>
                                  `<span class="badge badge-pill badge-warning ml-2" id="patientFoodAllergy" >${allergy.drug_allergy}</span>`
                              )}
                            </li>
                            <li><strong>Food Allergies : </strong>
                            ${food_allergies.map(
                                (allergy) =>
                                  `<span class="badge badge-pill badge-warning ml-2" id="patientFoodAllergy" >${allergy.food_allergy}</span>`
                              )}
                            </li>
                            <li><strong>Other Allergies: </strong>  
                            ${other_allergies.map(
                                (allergy) =>
                                  `<span class="badge badge-pill badge-warning ml-2" id="patientFoodAllergy" >${allergy.other_allergy}</span>`
                              )}
                            </li>
                            <li><strong>Weight: </strong>  ${res.message.weight_in_kilograms}</li> 
                        </ul>

                        <ul style="display: grid;grid-template-columns: repeat(4,1fr);list-style: none;">
                            <li><strong>Diagnosis: </strong> ${res.message.diagnosis_table[0].description ? res.message.diagnosis_table[0].description : "N/A"}</li>
                            <li><strong>Current Ward: </strong> 
                                ${res.message.ward_station ? res.message.ward_station : "N/A"}
                                <strong> Room: </strong> ${res.message.room_no ? res.message.room_no : "N/A"}
                                <strong> Bed: </strong> ${res.message.bed_number ? res.message.bed_number : "N/A"}
                            </li>
                            <li><strong>Insurance Details:</strong>
                        </ul>
                    `;
                    if(res.message.dob){
                        dob = res.message.dob;
                    }
                }
            }

        })

        // calculate patient age
        if(dob){
            this.age = calculate_age(dob);
        }


		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: `Treatment Sheet`,
			single_column: true,
		});
		
		this.page.main.html(
			frappe.render_template(
				frappe.templates.treatment_sheet,
				this
			)
		).html();
        
        

        const MENU_ELEMENT = document.getElementsByClassName("page-head");
        console.log(MENU_ELEMENT);
        
        const HIGHLIGHTED_MENU_CONTAINER = document.createElement("div");
        HIGHLIGHTED_MENU_CONTAINER.id = "highlighted_menu_id";
        HIGHLIGHTED_MENU_CONTAINER.className = "container p-2";
        HIGHLIGHTED_MENU_CONTAINER.innerHTML = DATA;
        MENU_ELEMENT[0].setAttribute("style", " flex-direction:column;");
        MENU_ELEMENT[0].appendChild(HIGHLIGHTED_MENU_CONTAINER);

		// this.page.add_inner_button("Add Verbal Order", () => addVerbalOrder(this,inpatient_record));
		this.page.add_inner_button("Pharmacy Queue", () => back_to_queue());
		this.page.add_inner_button("Patient Bincard", () => patientBincard(this,inpatient_record));
		this.page.add_inner_button("Active Medication", () => showActiveMed(this,inpatient_record));
		this.page.add_inner_button("Stopped Medication", () => showStoppedMed(this,inpatient_record));
		this.page.add_inner_button("Discharge Medication", () => showDischargeMed(this,inpatient_record));
		this.page.add_inner_button("Back to Inpatient Record", () => backToIpRecord(inpatient_record));
        this.page.add_inner_button("Multidiciplinary Record", () => route_to_multidisciplinary(inpatient_record));
        


	}

})

window.administerMedications = administerMedications;
window.flagDrugAllergy = flagDrugAllergy;
window.stopMedication = stopMedication;
window.route_to_multidisciplinary = route_to_multidisciplinary;
window.addVerbalOrder = addVerbalOrder;
window.calculate_age = calculate_age;
let today = "";
let time = frappe.utils.nowtime;