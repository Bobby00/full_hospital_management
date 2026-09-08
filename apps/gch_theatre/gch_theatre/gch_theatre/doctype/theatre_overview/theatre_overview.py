# Copyright (c) 2024, eGerties Developers and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class TheatreOverview(Document):
	pass

@frappe.whitelist(allow_guest=True)
def fetch_surgical_notes(theatre_overview: str):
	"""
	Surgical notes
	"""
	try:
		notes = frappe.db.get_value(
			"Surgical Notes",
			{"theatre_overview": theatre_overview},
			[
				"surgeon","name",
				"perioperative_complications","post_op_instructions"
			],as_dict=True
		)
		return notes
	except Exception as e:
		frappe.log_error(e,"Error getting surgical notess")
		return {"message": False}

@frappe.whitelist(allow_guest=True)
def fetch_pre_anaesthesia_assessment(theatre_overview: str):
	"""
	Pre-Anaesthesia assessment
	"""
	try:
		assessment = frappe.db.get_value(
			"Pre Anaesthesia Assessment",
			{"theatre_overview": theatre_overview},
			[
				"name", "drug_latext_allergy", "npo_orders", "anaesthetic_history",
				"airway_assessment"
			], as_dict=True
		)
		return assessment
	except Exception as e:
		frappe.log_error(e, "Pre anaesthesia assessment")
		return {"message": False} # 
	

@frappe.whitelist(allow_guest=True)
def fetch_preop_checklist(theatre_overview: str):
	"""
	Get intra op management doc
	"""
	try:
		management = frappe.db.get_value(
			"Nursing Preoperative Checklist",
			{"theatre_overview": theatre_overview},
			[
				"name"
			], as_dict=True
		)
	except Exception as e:
		frappe.log_error(e,"Error getting intra op management")
		return {"message": False}



@frappe.whitelist(allow_guest=True)
def fetch_intraop_management(theatre_overview: str):
	"""
	Get intra op management doc
	"""
	try:
		management = frappe.db.get_value(
			"Theatre Nursing IntraOperative Management",
			{"theatre_overview": theatre_overview},
			[
				"name", "holding_area", "anaesthesia_assessment_done", "op_consent_signed",
				"prophylactic_antiboitic_ordered"
			], as_dict=True
		)
	except Exception as e:
		frappe.log_error(e,"Error getting intra op management")
		return {"message": False}

	
@frappe.whitelist(allow_guest=True)
def fetch_pre_induction_assessment(theatre_overview: str):
	"""
	Pre-Induction assessment
	"""
	try:
		assessment = frappe.db.get_value(
			"Pre Induction Assessment",
			{"theatre_overview": theatre_overview},
			[
				"name", "diagnosis_change", "plan_risk_discussed_with_parent_caregiver", "blood_available",
				"scavenger_check"
			], as_dict=True
		)
		return assessment
	except Exception as e:
		frappe.log_error(e, "Pre Induction Assessment")
		return {"message": False}

@frappe.whitelist(allow_guest=True)
def fetch_nursing_checklist(theatre_overview: str):
	"""
	Surgical notes
	"""
	try:
		notes = frappe.db.get_value(
			"Theatre Nursing Checklist",
			{"theatre_overview": theatre_overview},
			[
				"name", "both_doctors_informed","theatre_staff_informed","consent_obtained",
				"time_of_last_feed","blood_available","prepared_by"
			],as_dict=True
		)
		return notes
	except Exception as e:
		frappe.log_error(e,"Error getting surgical notess")
		return {"message": False}


@frappe.whitelist(allow_guest=True)
def fetch_anaesthetist_checklist(theatre_overview: str):
	"""
	Surgical notes
	"""
	try:
		notes = frappe.db.get_value(
			"Anaesthetists Record",
			{"theatre_overview": theatre_overview},
			[
				"name","drug_latext_allergy","relevant_medical_surgical_history_problem_list","mallampati_score",
				"general_condition","risks_discussed","anaesthetist_name"
			],as_dict=True
		)
		return notes
	except Exception as e:
		frappe.log_error(e,"Error getting surgical notess")
		return {"message": False}
	
@frappe.whitelist(allow_guest=True)
def fetch_post_op_checklist(theatre_overview: str):
	"""
	Use theatre overvie name to get post op checklist
	"""
	try:
		post_op_checklist = frappe.db.get_value(
			"Theatre Post Operative Checklist",
			{"theatre_overview": theatre_overview},
			[
				"name", "spo2_monitoring", "analgesia", "spec_instructions",
				"nurse_led_discharge", "time_arrived","receiving_nurse"
			], as_dict=True
		)
		return post_op_checklist
	except Exception as e:
		frappe.log_error(e,"Error getting post op checklist")
		return {"message": False}
