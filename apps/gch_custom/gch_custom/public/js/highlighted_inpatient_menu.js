const handleHighlightedMenu = (frm) => {
  let patient_name = "";
  let patient_age = "";
  let patient_dob = "";
  let patient_weight = "";
  let patient_height = "";
  let patient_drug_allergies = "";
  let patient_food_allergies = "";
  let patient_other_allergies = "";
  let patient_uhid = "";
  let patient_gender = "";
  let patient_ward = "";
  let patient_bed = "";
  let patient_inpatient_record = "";

  frappe.call({
    method: "frappe.client.get",
    args: {
      doctype: "Inpatient Record",
      name: frm.doc.inpatient_record,
    },
    callback: function (r) {
      if (r.message) {
        console.log(r.message);
        patient_name = r.message.patient_name;
        patient_age = r.message.patient_age;
        patient_dob = r.message.dob;
        patient_gender = r.message.gender;
        patient_ward = r.message.ward_station;
        patient_bed = r.message.bed_number;
        patient_uhid = r.message.uhid;
        patient_inpatient_record = r.message.name;

        const DATA = `
        <ul style="display: grid;grid-template-columns: repeat(4,1fr);list-style: none;">
              <li><strong>Patient: <a href="/app/patient/${encodeURI(
                patient_name
              )}"> ${patient_name}  </a></strong>  </li>
              <li><strong>UHID: </strong> ${patient_uhid}  </li>  
              <li><strong>Encounter: </strong> <a href="/app/inpatient-record/${encodeURI(
                patient_inpatient_record
              )}">${patient_inpatient_record}  </a> </li>
              <li><strong>Ward: </strong> <a href="/app/nursing-ward/${encodeURI(
                patient_ward
              )}">${patient_ward} / ${patient_bed}    </a>  </li>
              <li><strong>Age: </strong> ${patient_age}   </li>
              <li><strong>Gender: </strong> ${patient_gender}   </li>
              <li><strong>DOB: </strong>  ${patient_dob} </li>
              <li><strong>Weight: </strong> ${patient_weight}  Kgs</li>
              <li><strong>Height: </strong>  ${patient_height}   cm</li>
              <li><strong>Drug Allergies: </strong>   ${patient_drug_allergies}  </li>
              <li><strong>Food Allergies: </strong>  ${patient_food_allergies}   </li>
              <li><strong>Other Allergies: </strong>   ${patient_other_allergies}  </li>
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
      }
    },
  });
};
