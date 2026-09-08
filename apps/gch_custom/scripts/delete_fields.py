import frappe


fields = [
   # Start of Karani's fields
   #Encounter
   "Patient Encounter-hearing_notes",
   "Patient Encounter-milestone_monitoring_notes",
   "Patient Encounter-child_safety_advice",
   "Patient Encounter-nutrition_counselling",
   "Patient Encounter-advice_on_general_pediatric_illness",
   "Patient Encounter-advice_on_social_and_behavioral_development",
   "Patient Encounter-wellbaby_education",
   "Patient Encounter-wellbaby_education_column_break",
   "Patient Encounter-child_bmi",
   "Patient Encounter-bmi_for_age",
   "Patient Encounter-height_for_age",
   "Patient Encounter-growth_monitoring_notes",
   "Patient Encounter-growth_monitoring_column_break",
   "Patient Encounter-milestone_monitoring_column_break",
   "Patient Encounter-services",
   "Patient Encounter-vaccination_notes",
   "Patient Encounter-vaccination",
   "Patient Encounter-status",
   "Patient Encounter-visit_details",
   "Patient Encounter-wellbaby_column_break_2",

   #Item
   "Item-max_duration",
   "Item-min_duration",
   "Item-frequency_period",
   "Item-frequency",
   "Item-rounding_level",
   "Item-dosage_unit_of_measure",
   "Item-age_and_weight_band",
   "Item-absolute_maximum",
   "Item-maximum_dose_as_selected_uom_per_kg",
   "Item-minimum_dose_as_selected_uom_per_kg",
   "Item-formula_guidelines",
   "Item-drug_label",
   "Item-is_triage_medication",
   "Item-is_controlled_drug",
   "Item-is_high_alert",
   "Item-tracking_number_type",
   "Item-serial_number",
   "Item-manufacturer_name",
   "Item-custom_label",
   "Item-max_duration",
   "Patient Encounter-respiratory_system"

   # End of Karani's fields
]


for field in fields:
   frappe.db.sql(f""" DELETE FROM `tabCustom Field`  WHERE name = '{field}' """)

print("Successfully removed fields!")