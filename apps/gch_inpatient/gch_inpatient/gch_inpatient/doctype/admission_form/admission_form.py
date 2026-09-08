# Copyright (c) 2023, Redward and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from frappe.desk.reportview import get_filters_cond, get_match_cond
from frappe.utils import get_datetime, get_link_to_form, getdate, now_datetime, today


class AdmissionForm(Document):
    pass


# @frappe.whitelist(allow_guest=True)
# def set_ip_child_records(inpatient_record, inpatient_record_child, encounter_child):
#     for item in encounter_child:
#         table = inpatient_record.append(inpatient_record_child)
#         for df in table.meta.get("fields"):
#             table.set(df.fieldname, item.get(df.fieldname))


@frappe.whitelist(allow_guest=True)
def fetch_parent_details(**args):
    patient_uhid = args["patient_uhid"]
    doc = frappe.get_doc("Patient", {"uhid_code": patient_uhid})
    return doc


@frappe.whitelist(allow_guest=True)
def fetch_principal_member_name(**args):
    parent = args["parent"]
    doc = frappe.get_doc("Parent", parent, fields=["full_name"])
    return doc


@frappe.whitelist(allow_guest=True)
def fetch_latest_outpatient_encounter(**args):
    patient = args["patient"]

    latest_enc = frappe.get_list(
        "Patient Encounter", filters={"patient": patient}, order_by="creation desc"
    )
	# Check if there are encounters for the patient
    if len(latest_enc) > 0:
        return latest_enc[0]
    return []


@frappe.whitelist(allow_guest=True)
def search_through_uhid_code(doctype, txt, searchfield, start, page_len, filters):
    doctype = "Patient"
    conditions = []

    return frappe.db.sql(
        """
		select patient_name, uhid_code, dob from `tabPatient`
			where ({key} like %(txt)s
				or uhid_code like %(txt)s)
			{fcond} {mcond}
		limit %(page_len)s offset %(start)s""".format(
            **{
                "fields": "patient_name, uhid_code, dob",
                "key": searchfield,
                "fcond": get_filters_cond(doctype, filters, conditions),
                "mcond": get_match_cond(doctype),
            }
        ),
        {
            "txt": "%%%s%%" % txt,
            "_txt": txt.replace("%", ""),
            "start": start,
            "page_len": page_len,
        },
    )


@frappe.whitelist(allow_guest=True)
def create_inpatient_record(**args):
    try:
        from gch_custom.services.rest import (create_procedure_test)

        inpatient_record = frappe.new_doc("Inpatient Record")

        if "op_encounter" in args:
            op_encounter = args["op_encounter"]
        else:
            op_encounter = ""

        # Fetch Admission Notes from latest prev op encounter if exists
        if op_encounter:
            admission_notes = frappe.get_doc(
                "Patient Encounter", args["op_encounter"], fields=["consultant_comments"]
            )
        else:
            admission_notes = ""

        # Patient details
        patient = frappe.get_doc("Patient", args["patient"])
        inpatient_record.patient = patient.name
        inpatient_record.patient_name = patient.patient_name
        inpatient_record.gender = patient.sex
        inpatient_record.blood_group = patient.blood_group
        inpatient_record.dob = patient.dob
        inpatient_record.mobile = patient.mobile
        inpatient_record.email = patient.email
        inpatient_record.phone = patient.phone
        inpatient_record.scheduled_date = today()
        inpatient_record.patient_encounter = op_encounter or ""
        inpatient_record.primary_practitioner = args["primary_doctor"]
        inpatient_record.secondary_practitioner = args["secondary_doctor"]
        inpatient_record.medical_department = ""
        inpatient_record.admission_instruction = admission_notes
        inpatient_record.admission_ordered_for = today()
        inpatient_record.admission_service_unit_type = args["admission_class"]
        inpatient_record.admission_form = args["admission_form_name"]
        inpatient_record.admission_encounter = op_encounter
        inpatient_record.ward_station = args["ward"]
        inpatient_record.room_no = args["room_number"]
        inpatient_record.bed_number = args["bed_number"]
        # inpatient_record.bed_type = "Standard"

        if args['theatre_booking']:
            booking_doc = frappe.get_doc('Theatre Booking', args['theatre_booking'])
            theatre_procedures = booking_doc.clinical_procedures
            if theatre_procedures:
                inpatient_record.admission_type = "Surgery"
                inpatient_record.theatre_booking = booking_doc.name
                inpatient_record.stop_auto_billing = 1
                for proc in theatre_procedures:
                    procedure = frappe.new_doc("Procedure Prescription")
                    procedure.procedure = proc.clinical_procedure_template
                    procedure.department = "Surgical Clinic"
                    procedure.practitioner = booking_doc.surgeon_or_doctor
                    procedure.date = booking_doc.surgery_start_time
                    procedure.procedure_created = 1

                    # Create procedure template
                    create_procedure_test(
                        patient.name, proc.clinical_procedure_template, inpatient_record.name, True
                    )

                    inpatient_record.append("procedure_prescription", procedure)


        inpatient_record.status = "Admission Scheduled"
        inpatient_record.save(ignore_permissions=True)

        # After Inpatient record is generated, Pull latest vitals row and allergies from the OP
        if op_encounter:
            doc = frappe.get_doc("Patient Encounter", op_encounter)


            anthropometry_doc = frappe.new_doc("Anthropometry Details GCH")
            anthropometry_doc.weight_in_kilograms = doc.weight_in_kilograms
            anthropometry_doc.height_in_centimeters = doc.height_in_centimeters
            anthropometry_doc.bmi = doc.bmi
            anthropometry_doc.bsa = doc.bsa
            anthropometry_doc.head_circumference_in_centimeters = doc.head_circumference_in_centimeters
            anthropometry_doc.muac = doc.muac
            anthropometry_doc.bmi_for_age_percentile = doc.bmi_for_age
            anthropometry_doc.height_for_age_percentile = doc.height_for_age
            anthropometry_doc.weight_for_age_percentile = doc.weight_for_age
            anthropometry_doc.doctype = "Anthropometry Details GCH"
            anthropometry_doc.parentfield = "anthropometry_details"
            anthropometry_doc.parenttype = "Inpatient Record"
            anthropometry_doc.parent = inpatient_record.name

            anthropometry_doc.save(ignore_permissions=True)

            # Creating drug allergies
            drug_allergies = doc.drug_allergy

            if drug_allergies:
                for i in range(len(drug_allergies)):
                    drug_allergy_doc = frappe.new_doc("Patient Drug Allergy")
                    drug_allergy_doc.doctype = "Patient Drug Allergy"
                    drug_allergy_doc.parentfield = "drug_allergy"
                    drug_allergy_doc.parenttype = "Inpatient Record"
                    drug_allergy_doc.parent = inpatient_record.name
                    drug_allergy_doc.drug_allergy = drug_allergies[i].drug_allergy
                    drug_allergy_doc.docstatus = drug_allergies[i].docstatus
                    drug_allergy_doc.creation = drug_allergies[i].creation

                    drug_allergy_doc.save(ignore_permissions=True)

            food_allergies = doc.food_allergy
            if food_allergies:
                for i in range(len(food_allergies)):
                    food_allergy_doc = frappe.new_doc("Patient Food Allergy")
                    food_allergy_doc.doctype = "Patient Food Allergy"
                    food_allergy_doc.parentfield = "food_allergy"
                    food_allergy_doc.parenttype = "Inpatient Record"
                    food_allergy_doc.parent = inpatient_record.name
                    food_allergy_doc.food_allergy = food_allergies[i].food_allergy
                    food_allergy_doc.docstatus = food_allergies[i].docstatus
                    food_allergy_doc.creation = food_allergies[i].creation

                    food_allergy_doc.save(ignore_permissions=True)

            other_allergies = doc.other_allergy
            if other_allergies:
                for i in range(len(other_allergies)):
                    other_allergy_doc = frappe.new_doc("Patient Other Allergy")
                    other_allergy_doc.doctype = "Patient Other Allergy"
                    other_allergy_doc.parentfield = "other_allergy"
                    other_allergy_doc.parenttype = "Inpatient Record"
                    other_allergy_doc.parent = inpatient_record.name
                    other_allergy_doc.other_allergy = other_allergies[i].other_allergy
                    other_allergy_doc.docstatus = other_allergies[i].docstatus
                    other_allergy_doc.creation = other_allergies[i].creation

                    other_allergy_doc.save(ignore_permissions=True)
            vitals = doc.vital_signs_table
            # CREATING RECORDS TO RESPECTIVE DOCTYPES
            # Vitals
            if vitals:
                for i in range(len(vitals)):

                    # print("\n\n\n\n", vitals[i].patient_encounter_bp_systolic, "\n\n\n\n")

                    vitals_doc = frappe.new_doc("Patient Encounter Vital Signs")
                    print(vitals[i])

                    vitals_doc.creation = vitals[i].creation
                    vitals_doc.docstatus = vitals[i].docstatus
                    vitals_doc.doctype = vitals[i].doctype
                    vitals_doc.owner = vitals[i].owner
                    vitals_doc.parent = inpatient_record.name
                    vitals_doc.parentfield = vitals[i].parentfield
                    vitals_doc.parenttype = "Inpatient Record"
                    vitals_doc.patient_encounter_blood_pressure = vitals[i].patient_encounter_blood_pressure
                    vitals_doc.patient_encounter_bp_diastolic = vitals[i].patient_encounter_bp_diastolic
                    vitals_doc.patient_encounter_bp_systolic = vitals[i].patient_encounter_bp_systolic
                    vitals_doc.patient_encounter_heart_rate = vitals[i].patient_encounter_heart_rate
                    vitals_doc.patient_encounter_heart_rate_sleeping = vitals[i].patient_encounter_heart_rate_sleeping
                    vitals_doc.patient_encounter_percutaneous_oxygen = vitals[i].patient_encounter_percutaneous_oxygen
                    vitals_doc.patient_encounter_respiratory_rate = vitals[i].patient_encounter_respiratory_rate
                    vitals_doc.patient_encounter_temperature = vitals[i].patient_encounter_temperature
                    vitals_doc.pulled_to_multidisciplinary = vitals[i].pulled_to_multidisciplinary
                    vitals_doc.save(ignore_permissions=True)

                    print("\n\n\n\n", vitals_doc, "\n\n\n\n")

            
            


        # update Encounter witn Inpatient Record info to create connection
        # if op_encounter:
        #     enc_doc = frappe.get_doc("Patient Encounter", args["op_encounter"])
        #     enc_doc.inpatient_record = inpatient_record.name
        #     enc_doc.inpatient_status = "Admission Scheduled"
        #     enc_doc.insert(ignore_permissions=True)

        # Set Value of inpatient name to admission record
        doc = frappe.get_doc("Admission Form", args["admission_form_name"])
        doc.inpatient_record = inpatient_record.name
        doc.save(ignore_permissions=True)

        return inpatient_record
    except Exception as e:
        frappe.log_error(e,"Error creating inpatient record")
        
        
@frappe.whitelist(allow_guest=True)
def create_multidisciplinary_record(**args):
    try:
        multidisciplinary = frappe.get_doc("Multidisciplinary")
        multidisciplinary.patient_encounter = args["patient_encounter"]
        multidisciplinary.inpatient_record = args["inpatient_record"]
        multidisciplinary.save(ignore_permissions=True)

        return multidisciplinary

    except Exception as e:
        return e
