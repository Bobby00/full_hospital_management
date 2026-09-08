from . import __version__ as app_version

app_name = "gch_custom"
app_title = "GCH Custom"
app_publisher = "eGerties Devs"
app_description = "Healthcare management customizations"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "info@gerties.org"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/gch_custom/css/gch_custom.css"
# app_include_js = [
#     "public/js/patient/patient_search.js",
# ]

# include js, css files in header of web template
# web_include_css = "/assets/gch_custom/css/gch_custom.css"
# web_include_js = "/assets/gch_custom/js/gch_custom.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "gch_custom/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
doctype_list_js = {
    "Patient Encounter": "public/js/patient_encounter/patient_encounter_list.js",
    "Lab Test": "public/js/lab_test/lab_test_list.js",
    }
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

doctype_js = {
    "Patient Encounter": "public/js/patient_encounter/patient_encounter.js",
    # "Patient":"public/js/patient/patient.js",
    # "Patient Encounter" : "public/js/patient_encounter/patient_encounter.js",
    "Patient": "public/js/patient/patient.js",
    # "Patient-List": "public/js/patient/quick_registration.js",
    "Item": "public/js/item/item.js",
    "Clinical Procedure": "public/js/clinical_procedure/clinical_procedure.js",
    "Sales Invoice": "public/js/sales_invoice/sales_invoice.js",
    "Patient Assessment": "public/js/patient_assessment/patient_assessment.js",
    "Nursing Checklist": "public/js/nursing_checklist/nursing_checklist.js",
    "Pharmacy Dispensement Form": "public/js/pharmacy_dispensement_form/pharmacy_dispensement_form.js",
    "Lab Test": "public/js/lab_test.js",
    "Stock Reconciliation": "public/js/stock_reconciliation/stock_reconciliation.js",
    "Batch": "public/js/batch/batch.js",
    "Patient Appointment": "public/js/patient_appointment/patient_appointment.js",
    "Healthcare Practitioner": "public/js/healthcare_practitioner/healthcare_practitioner.js"
}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "gch_custom.utils.jinja_methods",
# 	"filters": "gch_custom.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "gch_custom.install.before_install"
# after_install = "gch_custom.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "gch_custom.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
    # "*": {
    # 	"on_update": "method",
    # 	"on_cancel": "method",
    # 	"on_trash": "method"
    # },
    "Patient Encounter": {
        "after_save": [
            # "gch_custom.gch_custom.page.multidisciplinary.multidisciplinary.update_review_status",
            "gch_custom.services.events.update_vaccination_status",
        ],
        # "on_update": ["gch_custom.utils.workflow_hook"],
    },
    # "Patient Encounter": {
    #     "on_update": "gch_custom.gch_custom.page.multidisciplinary.multidisciplinary.update_multidisciplinary_tables",
    # },
    # "Patient": {
    #     "before_save": "gch_custom.services.events.create_wellbaby_schedule",
    # },
    "Item": {
        "before_save": "gch_custom.services.events.generate_item_display_name",
    },
}

# On Login: handler to redirect to appropriate dashboard page
on_session_creation = "gch_custom.overrides.login.on_login_override"

# Scheduled Tasks
# ---------------

scheduler_events = {
    "cron": {
        "* * * * *": [
            "gch_custom.gch_task.cron",
        ],
        "0 */4 * * *": [
            "gch_custom.overrides.patient_appointment.send_patient_appointment_reminder",
        ],
    },
    "all": [
        "gch_custom.tasks.all",
        # "gch_custom.overrides.patient_appointment.send_appointment_reminder"
    ],
    "daily": ["gch_custom.tasks.daily"],
    "hourly": ["gch_custom.tasks.hourly"],
    "weekly": ["gch_custom.tasks.weekly"],
    "monthly": ["gch_custom.tasks.monthly"],

}

# Testing
# -------

# before_tests = "gch_custom.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "gch_custom.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "gch_custom.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]


# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"gch_custom.auth.validate"
# ]


# Fixtures

patient_fields = [
    "Patient-patient_parents_section",
    "Patient-parents",
    "Patient-physical_file",
    "Patient-uhid",
    "Patient-uhid_code",
    "Patient-communication_need_assessment",
    "Patient-consent_to_receive_communication",
    "Patient-patient_parents_section",
    "Patient-requires_additional_privacy",
    "Patient-cultural_or_religious_preferences",
    "Patient-more_info_needed_to_improve_communication",
    "Patient-requires_assistive_communication_devices",
    "Patient-requires_support_to_move_around",
    "Patient-uses_assistive_devices_in_movement",
    "Patient-requires_translation",
    "Patient-requires_support_to_fill_out_form",
]

patient_encounter_fields = [
    "Patient Encounter-patient_details",
    "Patient Encounter-encounter_information",
    "Patient Encounter-primary_doctor",
    "Patient Encounter-primary_doctor_name",
    "Patient Encounter-encounter_number",
    "Patient Encounter-branch",
    "Patient Encounter-reason_for_visit",
    "Patient Encounter-anthropometry",
    "Patient Encounter-head_circumference_in_centimeters",
    "Patient Encounter-bsa",
    "Patient Encounter-height_in_centimeters",
    "Patient Encounter-bmi",
    "Patient Encounter-anthropometry_break",
    "Patient Encounter-weight_in_kilograms",
    "Patient Encounter-heart_rate",
    "Patient Encounter-temperature",
    "Patient Encounter-respiratory_rate",
    "Patient Encounter-percutaneous_oxygen_saturation",
    "Patient Encounter-vital_signs",
    "Patient Encounter-pediatric_early_warning",
    "Patient Encounter-pews_score",
    "Patient Encounter-fall_risk_score",
    "Patient Encounter-fall_risk_assessment",
    "Patient Encounter-pain_level_assessment",
    "Patient Encounter-drug_allergy",
    "Patient Encounter-allergies",
    "Patient Encounter-triage_notes",
    "Patient Encounter-triage_chief_complaint",
    "Patient Encounter-triage_complaint_duration",
    "Patient Encounter-triage_notes_cbreak",
    "Patient Encounter-assessment_cbreak2",
    "Patient Encounter-assessment_cbreak1",
    "Patient Encounter-weak_or_absent_breathing",
    "Patient Encounter-obstructed_breathing",
    "Patient Encounter-severe_respiratory_distress",
    "Patient Encounter-circulation",
    "Patient Encounter-pulse_rate_lt_60_per_min",
    "Patient Encounter-capillary_return_time_gt_3_sec",
    "Patient Encounter-coma_convulsing_confusions",
    "Patient Encounter-chest_wall_indrawing",
    "Patient Encounter-wheeze",
    "Patient Encounter-stridor",
    "Patient Encounter-drooling",
    "Patient Encounter-priority_cbreak1",
    "Patient Encounter-tiny_child",
    "Patient Encounter-major_trauma",
    "Patient Encounter-pain",
    "Patient Encounter-poisoning",
    "Patient Encounter-severe_palmar_pallor",
    "Patient Encounter-restless_irritable_floppy",
    "Patient Encounter-priority_cbreak2",
    "Patient Encounter-referral",
    "Patient Encounter-malnutrition_severe_wasting",
    "Patient Encounter-oedeme_of_both_feet",
    "Patient Encounter-severe_burns",
    "Patient Encounter-unable_to_drink_or_vomits_anything",
    "Patient Encounter-nutrition_screening",
    "Patient Encounter-chief_complaint_duration",
    "Patient Encounter-past_medical_history",
    "Patient Encounter-milestones",
    "Patient Encounter-other_relevant_history",
    "Patient Encounter-immunizations",
    "Patient Encounter-family_history",
    "Patient Encounter-nutrition_history",
    "Patient Encounter-socio_economic_history",
    "Patient Encounter-drug_history",
    "Patient Encounter-general",
    "Patient Encounter-cardiovascular_system",
    "Patient Encounter-genitourinary",
    "Patient Encounter-ear_nose_and_throat",
    "Patient Encounter-skin",
    "Patient Encounter-physical_exam_cbreak",
    "Patient Encounter-respiratory_system",
    "Patient Encounter-abdomen",
    "Patient Encounter-central_nervous_system",
    "Patient Encounter-eyes",
    "Patient Encounter-musculoskeletal",
    "Patient Encounter-physical_examinations",
    "Patient Encounter-patient_cbreak",
    "Patient Encounter-pain_assessment_score",
    "Patient Encounter-central_cyanosis_or_spo2",
    "Patient Encounter-weak_or_fast_pulse_gt_160",
    "Patient Encounter-blood_pressure_systolic",
    "Patient Encounter-blood_pressure_diastolic",
    "Patient Encounter-vital_signs_cbreak",
    "Patient Encounter-blood_pressure",
    "Patient Encounter-triage_additional_notes",
    "Patient Encounter-anthropometry_notes",
    "Patient Encounter-vital_signs_comments",
    "Patient Encounter-other_allergy",
    "Patient Encounter-food_allergy",
    "Patient Encounter-allergy_cbreak",
    "Patient Encounter-assessment_tools",
    "Patient Encounter-section_break_59",
    "Patient Encounter-emergency_flagging",
    "Patient Encounter-airway_and_breathing",
    "Patient Encounter-cold_hands_with",
    "Patient Encounter-avpu_is_p_or_u_or_convulsion",
    "Patient Encounter-diarrhea",
    "Patient Encounter-diarrhea_with_sunken_eyes",
    "Patient Encounter-emergency_cbreak",
    "Patient Encounter-anaphylaxis",
    "Patient Encounter-emergency_other",
    "Patient Encounter-bulging_anterior_fontanelle",
    "Patient Encounter-intraosseous_line_in_place",
    "Patient Encounter-neck_stiffness",
    "Patient Encounter-artificial_airway",
    "Patient Encounter-hypothermia",
    "Patient Encounter-hypoglycemia",
    "Patient Encounter-immediate_post_ictal_period",
    "Patient Encounter-priority_flagging",
    "Patient Encounter-fast_breathing",
    "Patient Encounter-grunting",
    "Patient Encounter-unintentional_weight_loss",
    "Patient Encounter-nutritional_supplementation_or_specialized_feeding",
    "Patient Encounter-nutritional_counselling_at_6",
    "Patient Encounter-traige_drugs_administered",
    "Patient Encounter-triage_medication",
    "Patient Encounter-request_approval",
    "Patient Encounter-request_approval_by",
    "Patient Encounter-prescribed_by",
    "Patient Encounter-approve_prescription",
    "Patient Encounter-encounter_history",
    "Patient Encounter-history_of_present_illness",
    "Patient Encounter-systematic_enquiry",
    "Patient Encounter-history_cbreak",
    "Patient Encounter-plan_of_action_notes",
    "Patient Encounter-plan_of_action",
    "Patient Encounter-radiology_details",
    "Patient Encounter-radiology",
    "Patient Encounter-is_emergency_patient",
    "Patient Encounter-is_priority_patient",
    "Patient Encounter-is_drug_allergy_patient",
    "Patient Encounter-is_fall_risk_patient",
    "Patient Encounter-is_isolation_patient",
    "Patient Encounter-revisit_reason_dur",
    "Patient Encounter-has_no_drug_allergy",
    "Patient Encounter-has_no_food_allergy",
    "Patient Encounter-out_patient_discharge",
    "Patient Encounter-outpatient_discharge_barrier_to_care_notes",
    "Patient Encounter-outpatient_discharge_patient_education_notes",
    "Patient Encounter-outpatient_discharge_patients_condition_at_discharge",
    "Patient Encounter-patient_discharge_cbreak",
    "Patient Encounter-outpatient_discharge_conclusions_at_end",
    "Patient Encounter-op_discharge_has_barrier_to_care",
    "Patient Encounter-op_discharge_has_education",
    "Patient Encounter-outpatient_discharge_patient_education",
    "Patient Encounter-outpatient_discharge_barriers_to_care_",
    "Patient Encounter-heart_rate_sleeping",
    "Patient Encounter-immunization",
    "Patient Encounter-height_for_age",
    "Patient Encounter-weight_for_age",
    "Patient Encounter-nursing_notes",
]

patient_assessment_fields = [
    "Patient Assessment-encounter",
    "Patient Assessment-vital_signs",
    "Patient Assessment-assessment_branch",
    "Patient Assessment-assessment_details",
    "Patient Assessment-assessment_cbreak1",
    "Patient Assessment-template",
    "Patient Assessment-assessment_date",
    "Patient Assessment-assessment_time",
    "Patient Assessment-action",
    "Patient Assessment-assessment_comment",
    "Patient Assessment-wong_baker_face",
    "Patient Assessment-wong_baker_faces",
]

items_fields = [
    "Item-display_name",
    "Item-generic_drug",
    "Item-product_type",
    "Item-product_route",
    "Item-classification",
    "Item-sub_classification",
    "Item-is_triage_medication",
    "Item-is_controlled_drug",
    "Item-is_high_alert",
    "Item-emergency_medication",
    "Item-allergen",
    "Item-dosage",
    "Item-dosage_unit_of_measure",
    "Item-rounding_level",
    "Item-frequency",
    "Item-frequency_period",
    "Item-min_duration",
    "Item-max_duration",
    "Item-drug_label",
    "Item-formula_guidelines",
    "Item-minimum_dose_as_selected_uom_per_kg",
    "Item-maximum_dose_as_selected_uom_per_kg",
    "Item-absolute_maximum",
    "Item-column_break",
    "Item-stock_details",
    "Item-tracking_number_type",
    "Item-tracking_number_type",
    "Item-serial_number",
    "Item-manufacturer_name",
    "Item-is_consignment",
    "Item-is_cssd_package",
    "Item-item_barcode",
    "Item-age_and_weight_band",
]


patient_assessment_sheet_fields = ["Patient Assessment Sheet-score_guideline"]

parent_fields = ["Parent-otp"]
fixtures = [
    # {
    #     "dt": "Custom Field",
    #     "filters": [
    #         [
    #             "name",
    #             "in",
    #             [
    #                 *patient_fields,
    #                 *patient_encounter_fields,
    #                 *parent_fields,
    #                 *patient_assessment_fields,
    #                 *patient_assessment_sheet_fields,
    #             ],
    #         ]
    #     ],
    # },
    "Custom Field",
    {
        "dt": "Role",
        "filters": [
            [
                "name",
                "in",
                [
                    "GCH-Nurse",
                    "GCH-TriageNurse",
                    "GCH-Doctor",
                    "GCH-Reception",
                    "GCH-LabTechnician",
                    "GCH-Pharmacy",
                ],
            ]
        ],
    },
    {"dt": "Custom DocPerm", "filters": [["role", "like", "GCH-%"]]},
    # "Race",
    # "Identification Type",
    # "Nationality",
    "Client Script",
    # "Medical Code Standard",
    # "Patient Assessment Parameter",
    # "Score Guideline",
    # "Patient Assessment Template",
    # "Parameter Score Guideline",
    # "Medical Code Standard",
    # "Patient Assessment Action",
    # "Patient Body Section",
    # "Imaging Technology",
    # "Medical Code",

    # "Barrier To Care Education",
    # "Patient Education",
    # "Vaccine",
    # "Vaccine Administration",
    # "Slade Settings",

    # "Generic Main Category",
    # "Generic Classification",
    # "Generic Sub Classification",
    # "Discharge Conclusion",
    # "Duration Period",
    # "Workflow",
    # "Workflow State",
    # "Role",
    # "Workflow Action"

    # 'DocField',
    # 'DocPerm',
    # 'DocType Action',
    # 'DocType Link',
    # 'User',
    # 'Has Role',
    # 'Page',
    # 'Module Def',
    # 'Print Format',
    # 'Report',
    # 'Customize Form',
    # 'Customize Form Field',
    # 'Property Setter',
    # 'Custom Field',
    # 'Client Script'
]


override_doctype_class = {
    "Patient": "gch_custom.overrides.patient.GCHPatient",
    "Patient Encounter": "gch_custom.overrides.patient_encounter.GCHPatientEncounter",
    "Sales Invoice": "gch_custom.overrides.sales_invoice.GCHSalesInvoice",
    "LDAP Settings": "gch_custom.overrides.ldap.GCHLDAPSettings",
    "Lab Test": "gch_custom.overrides.lab_test.GCHLabTest",
    "Stock Reconciliation": "gch_custom.overrides.stock_reconciliation.GCHStockReconciliation",
    "Patient Appointment": "gch_custom.overrides.patient_appointment.GCHPatientAppointment",
    # "User": "gch_custom.overrides.user.GCHUser",
    # "Drug Prescription":"gch_custom.overrides.drug_prescription.Prescription",
}

update_website_context = [
  'gch_custom.update_context'
]