// Copyright (c) 2023, eGerties Devs and contributors
// For license information, please see license.txt

const KRANIUM_FORM_FIELDS = [
  "fever",
  "fever_duration",
  "fever_notes",
  "cough",
  "cough_duration",
  "cough_notes",
  "chest_pain",
  "chest_pain_duration",
  "chest_pain_notes",
  "breathing_difficulty",
  "breathing_difficulty_duration",
  "breathing_difficulty_notes",
  "snoring",
  "snoring_duration",
  "snoring_notes",
  "sweating",
  "sweating_duration",
  "sweating_notes",
  "leg_swelling",
  "leg_swelling_duration",
  "leg_swelling_notes",
  "dysphagia",
  "dysphagia_duration",
  "dysphagia_notes",
  "abdominal_pain",
  "abdominal_pain_duration",
  "abdominal_pain_notes",
  "anorexia",
  "anorexia_duration",
  "anorexia_notes",
  "vomiting",
  "vomiting_duration",
  "vomiting_notes",
  "diarrhoea",
  "diarrhoea_duration",
  "diarrhoea_notes",
  "constipation",
  "constipation_duration",
  "constipation_notes",
  "urinary_frequency",
  "urinary_frequency_duration",
  "urinary_frequency_notes",
  "dysuria",
  "dysuria_duration",
  "dysuria_notes",
  "discoloured_urine",
  "discoloured_urine_duration",
  "discoloured_urine_notes",
  "oliguria",
  "oliguria_duration",
  "oliguria_notes",
  "headache",
  "headache_duration",
  "headache_notes",
  "irritability",
  "irritability_duration",
  "irritability_notes",
  "altered_consciousness",
  "altered_consciousness_duration",
  "altered_consciousness_notes",
  "convulsions",
  "convulsions_duration",
  "convulsions_notes",
  "eye_pain",
  "eye_pain_duration",
  "eye_pain_notes",
  "eye_discharge",
  "eye_discharge_duration",
  "eye_discharge_notes",
  "ear_pain",
  "ear_pain_duration",
  "ear_pain_notes",
  "ear_discharge",
  "ear_discharge_duration",
  "ear_discharge_notes",
  "skin_rash",
  "skin_rash_duration",
  "skin_rash_notes",
  "allergies",
  "allergies_duration",
  "allergies_notes",
  "injuries",
  "injuries_duration",
  "injuries_notes",
  "nutrition_history",
  "family_history",
  "socioeconomic_history",
  "drug_history",
  "other_relevant_history",
  "birth_history",
  "immunization",
  "growth_and_development",
  "history_of_present_illness",
];

const KRANIUM_FORM = `
<div style="background-color: #b3e0ff; padding:1rem;">
<table   width="100%">
<thead>
<tr>
<th>Description</th>
<th>Present</th>
<th>Duration</th>
<th>Notes</th>
<th>Description</th>
<th>Present</th>
<th>Duration</th>
<th>Notes</th>
</tr>
</thead>
<form id="kranium_form">
	<tbody>
	  <tr>
		<td>
		  <h5>Fever</h5>
		</td>
		<td>
		  <select name="fever" id="fever">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input  style="width:100%;" type="text" name="fever_duration" id="fever_duration" />
		</td>
		<td>
		  <input style="width:100%;" type="text" name="fever_notes" id="fever_notes" />
		</td>
		<td>
		  <h5>Cough</h5>
		</td>
		<td>
		  <select name="cough" id="cough">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" name="cough_duration" id="cough_duration" />
		</td>
		<td>
		  <input style="width:100%;" type="text" name="cough_notes" id="cough_notes" />
		</td>
	  </tr>

	  <tr>
		<td>
		  <h5>Chest pain</h5>
		</td>
		<td>
		  <select name="chest_pain" id="chest_pain">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="chest_pain_duration"
			id="chest_pain_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="chest_pain_notes"
			id="chest_pain_notes"
		  />
		</td>
		<td>
		  <h5>Difficulty in breathing</h5>
		</td>
		<td>
		  <select name="breathing_difficulty" id="breathing_difficulty">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="breathing_difficulty_duration"
			id="breathing_difficulty_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="breathing_difficulty_notes"
			id="breathing_difficulty_notes"
		  />
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Snoring</h5>
		</td>
		<td>
		  <select name="snoring" id="snoring">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="snoring_duration"
			id="snoring_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" name="snoring_notes" id="snoring_notes" />
		</td>
		<td>
		  <h5>Sweating</h5>
		</td>
		<td>
		  <select name="sweating" id="sweating">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="sweating_duration"
			id="sweating_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" name="sweating_notes" id="sweating_notes" />
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Leg swelling</h5>
		</td>
		<td>
		  <select name="leg_swelling" id="leg_swelling">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="leg_swelling_duration"
			id="leg_swelling_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="leg_swelling_notes"
			id="leg_swelling_notes"
		  />
		</td>
		<td>
		  <h5>Dysphagia</h5>
		</td>
		<td>
		  <select name="dysphagia" id="dysphagia">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="dysphagia_duration"
			id="dysphagia_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="dysphagia_notes"
			id="dysphagia_notes"
		  />
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Abdominal pain</h5>
		</td>
		<td>
		  <select name="abdominal_pain" id="abdominal_pain">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="abdominal_pain_duration"
			id="abdominal_pain_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="abdominal_pain_notes"
			id="abdominal_pain_notes"
		  />
		</td>
		<td>
		  <h5>Anorexia</h5>
		</td>
		<td>
		  <select name="anorexia" id="anorexia">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="anorexia_duration"
			id="anorexia_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" name="anorexia_notes" id="anorexia_notes" />
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Vomiting</h5>
		</td>
		<td>
		  <select name="vomiting" id="vomiting">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="vomiting_duration"
			id="vomiting_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" name="vomiting_notes" id="vomiting_notes" />
		</td>
		<td>
		  <h5>Diarrhoea</h5>
		</td>
		<td>
		  <select name="diarrhoea" id="diarrhoea">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="diarrhoea_duration"
			id="diarrhoea_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="diarrhoea_notes"
			id="diarrhoea_notes"
		  />
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Constipation</h5>
		</td>
		<td>
		  <select name="constipation" id="constipation">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="constipation_duration"
			id="constipation_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="constipation_notes"
			id="constipation_notes"
		  />
		</td>
		<td>
		  <h5>Urinary frequency</h5>
		</td>
		<td>
		  <select name="urinary_frequency" id="urinary_frequency">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="urinary_frequency_duration"
			id="urinary_frequency_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="urinary_frequency_notes"
			id="urinary_frequency_notes"
		  />
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Dysuria</h5>
		</td>
		<td>
		  <select name="dysuria" id="dysuria">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="dysuria_duration"
			id="dysuria_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" name="dysuria_notes" id="dysuria_notes" />
		</td>
		<td>
		  <h5>Discoloured urine</h5>
		</td>
		<td>
		  <select name="discoloured_urine" id="discoloured_urine">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="discoloured_urine_duration"
			id="discoloured_urine_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="discoloured_urine_notes"
			id="discoloured_urine_notes"
		  />
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Oliguria</h5>
		</td>
		<td>
		  <select name="oliguria" id="oliguria">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>

		<td>
		  <input style="width:100%;" type="text" 
			name="oliguria_duration"
			id="oliguria_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" name="oliguria_notes" id="oliguria_notes" />
		</td>
		<td>
		  <h5>Headache</h5>
		</td>
		<td>
		  <select name="headache" id="headache">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>

		<td>
		  <input style="width:100%;" type="text" 
			name="headache_duration"
			id="headache_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" name="headache_notes" id="headache_notes" />
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Irritability</h5>
		</td>
		<td>
		  <select name="irritability" id="irritability">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>

		<td>
		  <input style="width:100%;" type="text" 
			name="irritability_duration"
			id="irritability_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="irritability_notes"
			id="irritability_notes"
		  />
		</td>
		<td>
		  <h5>Altered consciousness</h5>
		</td>
		<td>
		  <select name="altered_consciousness" id="altered_consciousness">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>

		<td>
		  <input style="width:100%;" type="text" 
			name="altered_consciousness_duration"
			id="altered_consciousness_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="altered_consciousness_notes"
			id="altered_consciousness_notes"
		  />
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Convulsions</h5>
		</td>
		<td>
		  <select name="convulsions" id="convulsions">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>

		<td>
		  <input style="width:100%;" type="text" 
			name="convulsions_duration"
			id="convulsions_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="convulsions_notes"
			id="convulsions_notes"
		  />
		</td>
		<td>
		  <h5>Eye pain</h5>
		</td>
		<td>
		  <select name="eye_pain" id="eye_pain">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>

		<td>
		  <input style="width:100%;" type="text" 
			name="eye_pain_duration"
			id="eye_pain_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" name="eye_pain_notes" id="eye_pain_notes" />
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Eye discharge</h5>
		</td>
		<td>
		  <select name="eye_discharge" id="eye_discharge">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>

		<td>
		  <input style="width:100%;" type="text" 
			name="eye_discharge_duration"
			id="eye_discharge_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="eye_discharge_notes"
			id="eye_discharge_notes"
		  />
		</td>
		<td>
		  <h5>Ear pain</h5>
		</td>
		<td>
		  <select name="ear_pain" id="ear_pain">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>

		<td>
		  <input style="width:100%;" type="text" 
			name="ear_pain_duration"
			id="ear_pain_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" name="ear_pain_notes" id="ear_pain_notes" />
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Ear discharge</h5>
		</td>
		<td>
		  <select name="ear_discharge" id="ear_discharge">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>

		<td>
		  <input style="width:100%;" type="text" 
			name="ear_discharge_duration"
			id="ear_discharge_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="ear_discharge_notes"
			id="ear_discharge_notes"
		  />
		</td>
		<td>
		  <h5>Skin rash</h5>
		</td>
		<td>
		  <select name="skin_rash" id="skin_rash">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>

		<td>
		  <input style="width:100%;" type="text" 
			name="skin_rash_duration"
			id="skin_rash_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="skin_rash_notes"
			id="skin_rash_notes"
		  />
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Allergies</h5>
		</td>
		<td>
		  <select name="allergies" id="allergies">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>

		<td>
		  <input style="width:100%;" type="text" 
			name="allergies_duration"
			id="allergies_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" 
			name="allergies_notes"
			id="allergies_notes"
		  />
		</td>
		<td>
		  <h5>Injuries</h5>
		</td>
		<td>
		  <select name="injuries" id="injuries">
			<option value="no">No</option>
			<option value="yes">Yes</option>
		  </select>
		</td>

		<td>
		  <input style="width:100%;" type="text" 
			name="injuries_duration"
			id="injuries_duration"
		  />
		</td>
		<td>
		  <input style="width:100%;" type="text" name="injuries_notes" id="injuries_notes" />
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Nutrition history</h5>
		</td>
		<td colspan="3">
		  <textarea
			name="nutrition_history"
			id="nutrition_history"
			cols="30"
			rows="3"
		  ></textarea>
		</td>
		<td>
		  <h5>Family history</h5>
		</td>
		<td colspan="3">
		  <textarea
			name="family_history"
			id="family_history"
			cols="30"
			rows="3"
		  ></textarea>
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Socioeconomic history</h5>
		</td>
		<td colspan="3">
		  <textarea
			name="socioeconomic_history"
			id="socioeconomic_history"
			cols="30"
			rows="3"
		  ></textarea>
		</td>
		<td>
		  <h5>Drug history</h5>
		</td>
		<td colspan="3">
		  <textarea
			name="drug_history"
			id="drug_history"
			cols="30"
			rows="3"
		  ></textarea>
		</td>
	  </tr>

	  <tr>
		<td>
		  <h5>Other relevant history</h5>
		</td>
		<td colspan="3">
		  <textarea
			name="other_relevant_history"
			id="other_relevant_history"
			cols="30"
			rows="3"
		  ></textarea>
		</td>
		<td>
		  <h5>Birth history</h5>
		</td>
		<td colspan="3">
		  <textarea
			name="birth_history"
			id="birth_history"
			cols="30"
			rows="3"
		  ></textarea>
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>Immunization</h5>
		</td>
		<td colspan="3">
		  <textarea
			name="immunization"
			id="immunization"
			cols="30"
			rows="3"
		  ></textarea>
		</td>
		<td>
		  <h5>Growth and Development(Milestones)</h5>
		</td>
		<td colspan="3">
		  <textarea
			name="growth_and_development"
			id="growth_and_development"
			cols="30"
			rows="3"
		  ></textarea>
		</td>
	  </tr>
	  <tr>
		<td>
		  <h5>History of Present Illness</h5>
		</td>
		<td colspan="7">
		  <textarea
			name="history_of_present_illness"
			id="history_of_present_illness"
			cols="30"
			rows="3"
		  ></textarea>
		</td>
	  </tr>
	</tbody>
	</form>
  </table>
 
</div>
`;
const remove_page_attr = () => {
  const PAGE_WRAPPER = document.querySelector(".page-body");
  PAGE_WRAPPER.classList.remove("container");
  PAGE_WRAPPER.classList.add("m-4");
};
const create_form = () => {
  const KRANIUM_FORM_WRAPPER = document.querySelector(
    '[data-fieldname="kranium_form"]'
  );
  KRANIUM_FORM_WRAPPER.innerHTML = KRANIUM_FORM;

  KRANIUM_FORM_FIELDS.forEach((field) => {
    const field_element = document.getElementById(field);
    if (!field_element) return;
    field_element.value = cur_frm.doc[field] || "";
    field_element.addEventListener("change", (event) => {
      const { name, value } = event.target;
      field_element.value = value;
      cur_frm.set_value(name, value);
      refresh_field(name);
    });
  });
};

frappe.ui.form.on("Nursing Patient History", {
  onload: function (frm) {
    remove_page_attr();
  },
  refresh: function (frm) {
    remove_page_attr();
    // select this div <div class="frappe-control" data-fieldtype="HTML" data-fieldname="kranium_form" title="kranium_form"></div>

    create_form();
  },
  test: function (frm) {
    const form = document.getElementById("kranium_form");

    if (!form || !form.elements) return alert("form not found");

    var formData = new FormData(form);

    console.log(Object.fromEntries(formData));
  },
});
