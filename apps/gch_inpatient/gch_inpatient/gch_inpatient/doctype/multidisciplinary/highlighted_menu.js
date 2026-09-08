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

    // Build allergies
    // drug_allergies = []
    // food_allergies = []
    // other_allergies = []
  
    // console.log(frm.doc.food_allergy, 'HAAAAAAAPPPPAAAAAAAAAAAAAOOOOOO')
    // if(frm.doc.drug_allergy.length > 0){
    //   for(let i=0; i < frm.doc.drug_allergy.length; i++){
    //     console.log(i)
    //     drug_allergies.push(
    //       `<span class="badge badge-pill badge-warning ml-2" style="font-size:0.6em">${frm.doc.drug_allergy[i].drug_allergy}</span>`
    //     )
    //   }
    // } else {
    //   drug_allergies.push(
    //       `<strong>None</strong>`
    //     )
    // }
    
  
    // if(frm.doc.food_allergy.length > 0){
    //   for(let i=0; i < frm.doc.food_allergy.length; i++){
    //     console.log(i)
    //     food_allergies.push(
    //       `<span class="badge badge-pill badge-warning ml-2" style="font-size:0.6em">${frm.doc.food_allergy[i].food_allergy}</span>`
    //     )
    //   }
    // }else{
    //   food_allergies.push(
    //     `<strong>None</strong>`
    //   )
    // }
  
    // if(frm.doc.other_allergy.length > 0){
    //   for(let i=0; i < frm.doc.other_allergy.length; i++){
    //     console.log(i)
    //     other_allergies.push(
    //       `<span class="badge badge-pill badge-warning ml-2" style="font-size:0.6em">${frm.doc.other_allergy[i].other_allergy}</span>`
    //     )
    //   }
    // }else{
    //   other_allergies.push(
    //     `<strong>None</strong>`
    //   )
    // }
    
  
    const DATA = `
      <ul style="display: grid;grid-template-columns: repeat(4,1fr);list-style: none;">
            <li><strong>Patient: </strong> ${frm.doc.patient_name}</li>
            <li><strong>UHID: </strong> ${frm.doc.uhid}</li>
            <li><strong>Age: </strong>  ${calculate_age(frm.doc.dob)}</li>
            <li><strong>DOB: </strong> ${frm.doc.dob}
            <li><strong>Drug Allergies: </strong>  NONE</li>
          <li><strong>Food Allergies : </strong>  NONE</li>
          <li><strong>Other Allergies: </strong>  NONE</li>
            
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
  
  