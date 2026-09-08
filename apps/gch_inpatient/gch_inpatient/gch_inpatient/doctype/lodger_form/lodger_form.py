# Copyright (c) 2024, Redward and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class LodgerForm(Document):
	pass

@frappe.whitelist(allow_guest=True)
def update_admission_and_inpatient_record(**args):
    """Update Admission Record and Inpatient Record with the data from Lodger Form."""

    try:
        # frappe.db.set_value('Admission Form', args["admission_form"], {
        #     #  'is_lodging', 1,
        #     #  'lodger_form', args["lodger_form"],
        #     #  'actual_patient_ward', args["ward_of_preference"]
        #      })

        admission_doc = frappe.get_doc("Admission Form", args["admission_form"])
        admission_doc.is_lodging = 1
        admission_doc.lodger_form = args["lodger_form"]
        admission_doc.actual_patient_ward = args["ward_of_preference"]
        admission_doc.save()
        
        if args["inpatient_record"]:
            inpatient_doc = frappe.get_doc("Admission Form", args["admission_form"])
            inpatient_doc.is_lodging = 1
            inpatient_doc.lodger_form = args["lodger_form"]
            inpatient_doc.actual_patient_ward = args["ward_of_preference"]
            inpatient_doc.save()
        
        return True

    except Exception as e:
        return e