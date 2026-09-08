import frappe
import uuid

from urllib.parse import urlparse
from urllib.parse import parse_qs
import requests


@frappe.whitelist()
def get_multidisciplinary_data(encounter_number):

    query = f"""
        SELECT 
        MR.creation,
        MR.modified_by,
        PE.patient_encounter_temperature,
        PE.patient_encounter_heart_rate,
        PE.patient_encounter_bp_systolic,
        PE.patient_encounter_bp_diastolic,
        NCC.chief_complaint,
        NCC.duration_measure,
        PEH.patient_encounter_chief_complaint,
        PEH.patient_encounter_history_of_present_illness,
        PEH.patient_encounter_systematic_enquiry,
        PEH.patient_encounter_past_medical_history,
        PEH.patient_encounter_family_history,
        PEH.patient_encounter_nutrition_history,
        PEH.patient_encounter_socio_economic_history,
        PEH.patient_encounter_milestones,
        PEH.patient_encounter_other_relevant_history,
        PEPE.patient_encounter_general,
        PEPE.patient_encounter_cardiovascular_system,
        PEPE.patient_encounter_genitourinary,
        PEPE.patient_encounter_ear_nose_and_throat,
        PEPE.patient_encounter_respiratory_system,
        PEPE.patient_encounter_abdomen,
        PEPE.patient_encounter_central_nervous_system,
        PEPE.patient_encounter_skin,
        PEPE.patient_encounter_eyes,
        PEPE.patient_encounter_musculoskeletal,
        CT.description,
        PEPA.patient_encounter_plan_of_action_notes,
        LP.lab_test_name,
        PP.procedure_name

        FROM `tabMultidisciplinary Review` AS MR 
        LEFT JOIN `tabPatient Encounter Vital Signs` AS PE ON MR.review_identity = PE.review_identifier 
        LEFT JOIN `tabNursing Chief Complaint` AS NCC ON MR.review_identity = NCC.review_identifier
        LEFT JOIN `tabPatient Encounter History Details` AS PEH ON MR.review_identity = PEH.review_identifier
        LEFT JOIN `tabPatient Encounter Physical Examination Details` AS PEPE ON MR.review_identity = PEPE.review_identifier
        LEFT JOIN `tabCodification Table` AS CT ON MR.review_identity = CT.review_identifier
        LEFT JOIN `tabPatient Encounter Plan of Action` AS PEPA ON MR.review_identity = PEPA.review_identifier
        LEFT JOIN `tabLab Prescription` AS LP ON MR.review_identity = LP.review_identifier
        LEFT JOIN `tabProcedure Prescription` AS PP ON MR.review_identity = PP.review_identifier
        WHERE MR.doc_status != 0
        AND MR.encounter = '{encounter_number}'
        ORDER BY MR.creation DESC
        ;
    ;"""

    data = frappe.db.sql(query, as_dict=True)


    return data



@frappe.whitelist()
def multidisciplinary_tables(review_identifier, user, patient, encounter):

    query = f""" SELECT review_identity FROM `tabMultidisciplinary Review` 
    WHERE owner='{user}' AND doc_status=0 """

    value_exists = frappe.db.sql(query, as_dict=True)


    if(value_exists):
        review_code = value_exists[0].review_identity
    else:

        review_id = frappe.get_doc({
            "doctype": "Multidisciplinary Review",
            "review_identity": review_identifier,
            "patient": patient,
            "encounter": encounter,
            "doc_status": 0
        })

        review_id.insert()

        review_code = review_identifier

    return review_code
    




def update_review_status(doc, event):
    """ 
    Update review status to 1 when the document is submitted 
    
    
    """


    query = f"UPDATE `tabMultidisciplinary Review` SET doc_status=1 WHERE patient={repr(doc.patient)} AND doc_status=0"

    # query = f""" UPDATE `tabMultidisciplinary Review` SET doc_status=1 WHERE patient='{doc.patient}' AND doc_status=0 """

    frappe.db.sql(query)
    
    return