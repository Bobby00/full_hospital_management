# Copyright (c) 2023, Redward and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class Multidisciplinary(Document):
	pass


@frappe.whitelist(allow_guest=True)
def save_multidisciplinary_row(**args):
    try:

        print("=============== HERE ===================")
        doc = frappe.get_doc(doctype="Multidisciplinary Care Plan")

        
        doc.parent = args["parent"]
        doc.parenttype = "Multidisciplinary"
        doc.doctype = "Multidisciplinary Care Plan"
        doc.parentfield = "multidisciplinary_care_plan_table"

        doc.assessment = args["row_assessment"]
        doc.diagnosis = args["row_diagnosis"]
        doc.care_objectives = args["row_care_objectives"]
        doc.patient_order = args["row_patient_order"]
        doc.evaluation = args["row_evaluation"]
        doc.implementation = args["row_implementation"]
        doc.practitioner = args["row_practitioner"]
        doc.user_type = args["user_type"]

        doc.save(ignore_permissions=True)

        return doc
    
    except Exception as e:
         return e
    
@frappe.whitelist(allow_guest=True)
def fetch_vitals_from_inpatient_record(**args):
    try:
        vitals_list = frappe.get_list(
            doctype="Patient Encounter Vital Signs", filters={"parent": args['inpatient_record']}, fields=['name', 'patient_encounter_temperature', 'patient_encounter_heart_rate', 'patient_encounter_heart_rate_sleeping', 'patient_encounter_respiratory_rate', 'patient_encounter_percutaneous_oxygen', 'recorded_at']
        )

        return vitals_list
    except Exception as e:
         return e

@frappe.whitelist(allow_guest=True)
def fetch_multidisciplinary_assessments():
    try:
        assessment_doc = frappe.get_list("Multidisciplinary Nursing Assessments")
        return assessment_doc
    except Exception as e:
         return e


@frappe.whitelist(allow_guest=True)
def fetch_multidisciplinary_diagnosis():
    try:
        diagnosis_doc = frappe.get_list("Multidisciplinary Nursing Diagnosis")
        return diagnosis_doc
    except Exception as e:
         return e
    

@frappe.whitelist(allow_guest=True)
def fetch_multidisciplinary_care_objectives():
    try:
        care_objectives_doc = frappe.get_list("Multidisciplinary Nursing Care Objectives")
        return care_objectives_doc
    except Exception as e:
         return e
    
@frappe.whitelist(allow_guest=True)
def fetch_multidisciplinary_patient_orders():
    try:
        patient_orders_list = frappe.get_list("Multidisciplinary Patient Orders")
        return patient_orders_list
    except Exception as e:
         return e
    
@frappe.whitelist(allow_guest=True)
def save_patient_orders_to_handsoff(**args):
    try:
        # GET LATEST HANDSOFF TOOL FOR PATIENT
        doc = frappe.get_last_doc("Nursing Handsoff Tool", filters={"patient_name": args["patient"]})
        print(doc, "================= LATEST HANDSOFF TOOL =======================")
        

        # BUILDING PATIENT ORDER NOTES
        if doc:
            if doc.doctors_instructions:
                
                doc.doctors_instructions = doc.doctors_instructions + "\n\n\n" + args["patient_order"] + "\nDoctors Name: " + args["doctors_name"]

            else:
                doc.doctors_instructions = args["patient_order"] + "\nDoctors name: " + args["doctors_name"]

            doc.save(ignore_permissions=True)

            return doc
    except Exception as e:
        return e
    




