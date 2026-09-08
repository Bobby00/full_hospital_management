import frappe


@frappe.whitelist()
def get_current_queues():
    current_queue_items = frappe.db.sql(f"""
		SELECT
		DISTINCT
		patientEncounter.name as encounter,
		patientEncounter.is_emergency_patient,
		patientEncounter.is_drug_allergy_patient,
		patientEncounter.is_priority_patient,
		patientEncounter.is_fall_risk_patient,
		patientEncounter.is_isolation_patient,
		tabQueue.name,
		tabQueue.queue_position,
		tabPatient.name as patient, 
		tabPatient.gch_patient_age,
		queuGroup.name as queue_group,
		queuGroup.service_unit,
		(SELECT COUNT(*) FROM `tabLab Prescription` WHERE parent = patientEncounter.name) AS lab_prescription_count,
		(SELECT COUNT(*) FROM `tabProcedure Prescription` WHERE parent = patientEncounter.name) AS procedure_prescription_count,
		(SELECT COUNT(*) FROM `tabDoctor Prescription Table` WHERE parent = patientEncounter.name) AS doctor_prescription_count
		
		FROM `tabQueue`
		JOIN `tabQueue Group` as queuGroup ON tabQueue.queue_group = queuGroup.name
		JOIN `tabPatient` ON tabQueue.patient = tabPatient.name
		JOIN `tabPatient Encounter` as patientEncounter ON patientEncounter.patient = tabPatient.name
		WHERE patientEncounter.docstatus = 0
		ORDER BY is_emergency_patient DESC, patientEncounter.creation
		;
		""", as_dict=True)

    return current_queue_items
