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



const handleHighlightedMenu = (frm) => {

    // Checking if is inpatient record, or document linked to inpatient record
    let inpatient_record = ""

    if ( frm.doc.name.includes("INP") ) {
        inpatient_record = frm.doc
    } else {
        let inpatient_record_name = frm.doc.inpatient_record

        frappe.call({
            method: "gch_inpatient.overrides.inpatient_record.fetch_inpatient_record",
            async: false,
            args: {
                "inpatient_record": inpatient_record_name
            },
            callback: function (res) {

                inpatient_record = res.message
            }
        })

    }
    
    console.log(inpatient_record, "INPATIENT RECORD FROM HIGHLIGHTED MENU")

    let patient_weight = 0
    let patient_height = 0

    if (inpatient_record != "" && inpatient_record.anthropometry_details.length > 0) {
        patient_weight = inpatient_record.anthropometry_details[inpatient_record.anthropometry_details.length - 1].weight_in_kilograms
        patient_height = inpatient_record.anthropometry_details[inpatient_record.anthropometry_details.length - 1].height_in_centimeters
    }


    // Fetching allergies from patient doc
    let drug_allergies = []
    let food_allergies = []
    let other_allergies = []

    frappe.call({
        method: "gch_inpatient.overrides.inpatient_record.fetch_patient_doc_for_highlighted_menu",
        async: false,
        args: {
            "patient": frm.doc.patient
        },
        callback: (res) => {
            console.log(res.message," pATIENT DATA")

            if (res.message.drug_allergies.length > 0) {
                for (let allergy in res.message.drug_allergies) {
                    drug_allergies.push('<span style="background: orange; padding: 2px 4px; border-radius: 30px; font-weight: 700;">' + res.message.drug_allergies[allergy].drug_allergy + '</span>' )
        
                }
            } else {
                drug_allergies.push('<strong>No Known Allergies</strong>')
            }
            
            if (res.message.food_allergies.length > 0) {
                for (let allergy in res.message.food_allergies) {
                    food_allergies.push('<span style="background: orange; padding: 2px 4px; border-radius: 30px; font-weight: 700;">' + res.message.food_allergies[allergy].food_allergy + '</span>')
        
                }
            } else {
                food_allergies.push('<strong>No Known Allergies</strong>')
            }

            if(res.message.other_allergies.length > 0) {
                for (let allergy in res.message.other_allergies) {
                    other_allergies.push('<span style="background: orange; padding: 2px 4px; border-radius: 30px; font-weight: 700;">' + res.message.other_allergies[allergy].other_allergy + '</span>')
        
                }
            } else {
                other_allergies.push("<strong>No Known Allergies</strong>")
            }
            

            console.log(drug_allergies, "DRUG ALLLERGIES ")

        }
    }) 

    const DATA = `
      <ul style="display: grid;grid-template-columns: repeat(4,1fr);list-style: none;">
            <li><strong>Patient: </strong> ${inpatient_record.patient_name}</li>
            <li><strong>UHID: </strong> ${inpatient_record.uhid}</li>
            <li><strong>Age: </strong>  ${calculate_age(inpatient_record.dob)}</li>
            <li><strong>DOB: </strong> ${inpatient_record.dob} </li>
            <li><strong>Weight: </strong> ${patient_weight} KGs </li>
            <li><strong>Height: </strong> ${patient_height} CMs </li>
            <li><strong>Drug Allergies: </strong> ${drug_allergies} </li>
            <li><strong>Food Allergies : </strong> ${food_allergies} </li>
            <li><strong>Other Allergies: </strong>  ${other_allergies} </li>
            <li><strong>Diagnosis: </strong> ${inpatient_record.diagnosis_table[0] ? inpatient_record.diagnosis_table[0].description : "N/A"}</li>
        </ul>
        <ul style="display: grid;grid-template-columns: repeat(4,1fr);list-style: none;">
                <li>
                    <strong>Current Ward: </strong> ${inpatient_record.ward_station ? inpatient_record.ward_station : "N/A"}
                </li>
                <li>
                    <strong> Room: </strong>${inpatient_record.room_no ? inpatient_record.room_no : "N/A"}  
                    <strong> Bed: </strong> ${inpatient_record.bed_number ? inpatient_record.bed_number : "N/A"}
                </li>
                <li><strong>Insurance Details:</strong> ${inpatient_record.insurance_or_corporate ? inpatient_record.insurance_or_corporate : "N/A"}</li>
        </ul>
      `;
    const MENU_ELEMENT = document.getElementsByClassName("page-head");
    const PREV_HIGHLIGHTED_MENU_CONTAINER =
      document.getElementById("highted_menu_id");
    console.log(PREV_HIGHLIGHTED_MENU_CONTAINER);
  
    if (PREV_HIGHLIGHTED_MENU_CONTAINER != null) {
      PREV_HIGHLIGHTED_MENU_CONTAINER.innerHTML = DATA;
      return;
    } else {
      console.log(MENU_ELEMENT);
      const HIGHLIGHTED_MENU_CONTAINER = document.createElement("div");
      HIGHLIGHTED_MENU_CONTAINER.id = "highted_menu_id";
      HIGHLIGHTED_MENU_CONTAINER.className = "container p-2";
      HIGHLIGHTED_MENU_CONTAINER.innerHTML = DATA;
      MENU_ELEMENT[0].setAttribute("style", " flex-direction:column;");
      MENU_ELEMENT[0].appendChild(HIGHLIGHTED_MENU_CONTAINER);
      return;
    }
  };
  


//   // Get patient information and allergies.
//   let dob = '';
//   let cur_frm = []
//   var DATA = ''
//   await frappe.call({
//       method: "gch_inpatient.services.get_patient_information",
//       args: {
//           "inpatient_record": inpatient_record
//       },
//       callback: (res) => {
//           if(res.message){
//               this.patient_data = res.message;
//               if(res.message.dob){
//                   dob = res.message.dob;
//                   if(dob){
//                       this.age = calculate_age(dob);
//                   }
//               }
//               let food_allergies = res.message.food_allergies;
//               let drug_allergies = res.message.drug_allergy;
//               let other_allergies = res.message.other_allergies;

//               window.patient = res.message.patient_name;

//               DATA = `
//                   <ul style="display: grid;grid-template-columns: repeat(4,1fr);list-style: none;">
//                       <li><strong>Patient: </strong> ${res.message.patient_name}</li>
//                       <li><strong>UHID: </strong> ${res.message.uhid}</li>
//                       <li><strong>Age: </strong> ${this.age}</li>
//                       <li><strong>DOB: </strong> ${res.message.dob}
//                       <li><strong>Drug Allergies: </strong>  
//                       ${drug_allergies.map(
//                           (allergy) =>
//                             `<span class="badge badge-pill badge-warning ml-2" id="patientFoodAllergy" >${allergy.drug_allergy}</span>`
//                         )}
//                       </li>
//                       <li><strong>Food Allergies : </strong>
//                       ${food_allergies.map(
//                           (allergy) =>
//                             `<span class="badge badge-pill badge-warning ml-2" id="patientFoodAllergy" >${allergy.food_allergy}</span>`
//                         )}
//                       </li>
//                       <li><strong>Other Allergies: </strong>  
//                       ${other_allergies.map(
//                           (allergy) =>
//                             `<span class="badge badge-pill badge-warning ml-2" id="patientFoodAllergy" >${allergy.other_allergy}</span>`
//                         )}
//                       </li>
//                       <li><strong>Weight: </strong>  ${res.message.weight_in_kilograms}</li> 
//                   </ul>

//                   <ul style="display: grid;grid-template-columns: repeat(4,1fr);list-style: none;">
//                       <li><strong>Diagnosis: </strong> ${res.message.diagnosis_table[0].description ? res.message.diagnosis_table[0].description : "N/A"}</li>
//                       <li><strong>Current Ward: </strong> 
//                           ${res.message.ward_station ? res.message.ward_station : "N/A"}
//                           <strong> Room: </strong> ${res.message.room_no ? res.message.room_no : "N/A"}
//                           <strong> Bed: </strong> ${res.message.bed_number ? res.message.bed_number : "N/A"}
//                       </li>
//                       <li><strong>Insurance Details:</strong>
//                   </ul>
//               `;
//               if(res.message.dob){
//                   dob = res.message.dob;
//               }
//           }
//       }

//   })
  