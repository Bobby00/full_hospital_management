from erpnext.healthcare.doctype.inpatient_record.inpatient_record import (
    InpatientRecord,
)

import json

import frappe
from frappe import _
from frappe.desk.reportview import get_match_cond
from frappe.model.document import Document
from frappe.utils import get_datetime, get_link_to_form, getdate, now_datetime, today


@frappe.whitelist(allow_guest=True)
def create_procedure_test(patient: str, procedure: str, encounter: str):
    """
    Used to create labtest given the patient and the item code
    """
    print(patient, procedure)
    try:
        current_patient = frappe.get_doc("Patient", patient)
        current_procedure_template = frappe.get_doc(
            "Clinical Procedure Template", {"item": procedure}
        )
        
        
        doc = frappe.new_doc(
            {
                "completed_nursing_checklist": [],
                "consume_stock": 0,
                "consumption_invoiced": 0,
                "docstatus": 0,
                "doctype": "Clinical Procedure",
                "inpatient_record": encounter,
                "type": "Inpatient",
                "invoice_separately_as_consumables": 0,
                "invoiced": 0,
                "items": [],
                "medical_code": None,
                "medical_department": None,
                "name": "new-clinical-procedure-1",
                "naming_series": "HLC-CPR-.YYYY.-",
                "nursing_checklist": "",
                "owner": "Administrator",
                "patient": current_patient.name,
                "patient_age": current_patient.gch_patient_age,
                "patient_name": current_patient.name,
                "patient_sex": current_patient.sex,
                "procedure_template": current_procedure_template.procedure_name,
                "status": "Draft",
                "notes": ",",
            }
        )
        doc.insert(ignore_permissions=True)
        
        return doc
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return "Error on line {}".format(sys.exc_info()[-1].tb_lineno)


@frappe.whitelist(allow_guest=True)
def get_encounter_radiology_tests(parent_doc):
    """
    Used to get the current radiologist tests on an parent_doc
    """
    try:
        labsss = frappe.db.get_list(
            "Lab Prescription",
            filters={"parent": parent_doc, "parentfield": "lab_test_prescription"},
            fields=[
                "name",
                "lab_test_code",
                "lab_test_name",
                "assigned_lab_test",
                "assigned_test",
            ],
        )
        return labsss
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        return []


@frappe.whitelist(allow_guest=True)
def get_encounter_lab_tests(parent_doc):
    """
    Used to get the current labtest on an parent_doc
    """
    try:
        labsss = frappe.db.get_list(
            "Lab Prescription",
            filters={"parent": parent_doc, "parentfield": "lab_tests"},
            fields=[
                "name",
                "lab_test_code",
                "lab_test_name",
                "assigned_lab_test",
                "assigned_test",
            ],
        )
        return labsss
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        return []


@frappe.whitelist(allow_guest=True)
def get_encounter_procedures(parent_doc):
    """
    Used to get the current clinical Procedures on an parent_doc
    """
    try:
        item_list = []
        procedure_list = frappe.db.get_list(
            "Procedure Prescription",
            filters={"parent": parent_doc},
            fields=["procedure_name", "procedure_created"],
        )
        return procedure_list

    except Exception as e:
        frappe.log_error(e, "REST ERROR  overrides/inpatient_record.py")
        return []

# @frappe.whitelist(allow_guest=True)
# def add_patient_to_pharmacy_queue(
#     patient_id: str, priority: str, service_unit: str, phone: str = None
# ):
#     """Add user to pharmacy queue"""
#     try:
#         from gch_queue.utils.queue import GCHPriorityQueue

#         queue_group = frappe.db.sql(
#             f""" SELECT name FROM `tabQueue Group` WHERE service_unit = '{service_unit}'; """,
#             as_dict=True,
#         )
#         patient_in_queue = frappe.db.exists(
#             {
#                 "doctype": "Queue",
#                 "patient": patient_id,
#             }
#         )
#         if patient_in_queue:
#             frappe.db.set_value(
#                 "Queue",
#                 patient_in_queue[0][0],
#                 {"priority": priority, "queue_group": queue_group[0].get("name")},
#             )
#             queue_doc = frappe.get_doc("Queue", patient_in_queue[0][0])

#         if not patient_in_queue:
#             queue_record = {
#                 "doctype": "Queue",
#                 "patient": patient_id,
#                 "priority": priority,
#                 "queue_group": queue_group[0].get("name"),
#                 "phone": phone,
#             }
#             queue_doc = frappe.get_doc(queue_record)
#             queue_doc.insert()
        
#         timestamp = queue_doc.modified

#         encounters_on_queue = frappe.db.sql(
#             f"""SELECT * FROM tabQueue JOIN `tabQueue Group` as tabQueueGroup ON tabQueueGroup.name = tabQueue.queue_group WHERE tabQueueGroup.service_unit = '{service_unit}' and tabQueueGroup.name = '{queue_group[0].get("name")}'; """,
#             as_dict=True,
#         )
#         current_queue = GCHPriorityQueue(policy="FIFO")
#         for encounter in encounters_on_queue:
#             patient_priority = encounter.get("priority")
#             if patient_priority == "" or patient_priority == None:
#                 patient_priority = 2
#             current_queue.push(
#                 priority=int(patient_priority),
#                 key=encounter.patient,
#                 encounter_detail=encounter,
#             )
#         # current_position = (
#         #     list(current_queue.ordered_entries.keys()).index(patient_id) + 1
#         # )  # +1 because the queue starts at 0
#         # SMS phone
#         # messaging.send_sms(
#         #     message=f"You have been added to the {service_unit}  Queue. You are position {current_position}.",
#         #     recipient=phone,
#         # )
#         return current_queue.ordered_entries


#         return
#     except Exception as e:
#         frappe.log_error(e, "REST ERROR  overrides/inpatient_record.py")
#         return []


class GCHInpatientRecord(InpatientRecord):
    def validate(self):
        print("Here>>>>>>........................2")

    # def after_save(self):

    #     # from gch_custom.services import create_procedure_test

    #     print("After save started.............../inpatient_record.py")

    #     # procedure_list = get_encounter_procedures(self.name)
    #     # TODO: Levy create procedure test
    #     # Get all procedures not created
        
    #     # lab_tests = get_encounter_lab_tests(self.name)
    #     # print(lab_tests)
    #     # radiology_tests = get_encounter_radiology_tests(self.name)
    #     # print(radiology_tests)

    #     # TODO: SHALOM
    #     # from gch_custom.utils.labware.main import send_to_labware

    #     # send_to_labware(self)

    
    @frappe.whitelist()
    def discharge(self, check_out=None):
        if not check_out:
            check_out = now_datetime()
        if (getdate(check_out) < getdate(self.admitted_datetime)):
            frappe.throw(_('Discharge date cannot be less than Admission date'))
        GCHInpatientRecord.discharge_patient(self, check_out)

    
    @frappe.whitelist()
    def discharge_patient(inpatient_record, check_out):
        GCHInpatientRecord.validate_inpatient_invoicing(inpatient_record)

        sales_invoice = inpatient_record.sales_invoice
        if sales_invoice:
            message = _("Cannot Dispense patient before invoice is closed")

            invoice = frappe.get_doc("Sales Invoice", sales_invoice)
            if invoice.docstatus == 0:
                frappe.throw(message, title=_("Pending Invoice"), is_minimizable=True, wide=True)
        
        inpatient_record.can_close = True
        inpatient_record.discharge_datetime = check_out
        inpatient_record.status = "Discharged"

        inpatient_record.save(ignore_permissions = True)

        # Delete ward occupancy
        try:
            ward_occupancy = frappe.db.get_value('Nursing Ward Occupancy', {'patient': inpatient_record.patient},['name'])
            frappe.delete_doc('Nursing Ward Occupancy', ward_occupancy)
            frappe.db.commit()
        except Exception as e:
            frappe.log_error(e, "error removing patient from bed")


    
    @frappe.whitelist()
    def validate_inpatient_invoicing(inpatient_record):
        if frappe.db.get_single_value("Healthcare Settings", "allow_discharge_despite_unbilled_services"):
            return

        pending_invoices = GCHInpatientRecord.get_pending_invoices(inpatient_record)

        if pending_invoices:
            message = _("Cannot mark Inpatient Record as Discharged since there are incomplete services. ")

            inpatient_record.can_close = False
            inpatient_record.save(ignore_permissions = True)

            formatted_doc_rows = ''

            for doctype, docnames in pending_invoices.items():
                formatted_doc_rows += """
                    <td>{0}</td>
                    <td>{1}</td>
                </tr>""".format(doctype, docnames)

            message += """
                <table class='table'>
                    <thead>
                        <th>{0}</th>
                        <th>{1}</th>
                    </thead>
                    {2}
                </table>
            """.format(_("Healthcare Service"), _("Documents"), formatted_doc_rows)

            frappe.throw(message, title=_("Unbilled Services"), is_minimizable=True, wide=True)


    
    @frappe.whitelist()
    def get_pending_invoices(inpatient_record):
        pending_invoices = {}

        docs = ["Lab Test", "Clinical Procedure"]

        pending_meds = GCHInpatientRecord.check_for_undispensed_meds(inpatient_record)
        pending_labs = GCHInpatientRecord.get_incomplete_labs(inpatient_record)
        pending_procedures = GCHInpatientRecord.get_incomplete_procedures(inpatient_record)

        if pending_meds:
            pending_invoices["Pending Meds"] = pending_meds
        if pending_labs:
            pending_invoices["Pending Labs"] = pending_labs
        if pending_procedures:
            pending_invoices["Pending Procedures"] = pending_procedures

        # TODO: Add checks for pending radiology (Levy)

        # for doc in docs:
        #     doc_name_list = GCHInpatientRecord.get_unbilled_inpatient_docs(doc, inpatient_record)
        #     if doc_name_list:
        #         pending_invoices = GCHInpatientRecord.get_pending_doc(doc, doc_name_list, pending_invoices)

        return pending_invoices
    
    @frappe.whitelist()
    def get_incomplete_labs(inpatient_record):
        tests = frappe.db.sql("""
                SELECT lab_test_name
                FROM `tabLab Test`
                WHERE patient = %s
                AND inpatient_record = %s
                AND docstatus = 0
                AND patient_declined = 0
                AND  clinician_cancelled = 0
            """, (inpatient_record.patient,inpatient_record.name)
            )
        return tests
    
    @frappe.whitelist()
    def get_incomplete_procedures(inpatient_record):
        tests = frappe.db.sql("""
                SELECT procedure_template
                FROM `tabClinical Procedure`
                WHERE patient = %s
                AND inpatient_record = %s
                AND docstatus = 0
                AND patient_declined = 0 
                AND clinician_cancelled = 0
            """, (inpatient_record.patient,inpatient_record.name)
            )
        return tests

    @frappe.whitelist()
    def get_pending_doc(doc, doc_name_list, pending_invoices):
        if doc_name_list:
            doc_ids = False
            for doc_name in doc_name_list:
                doc_link = get_link_to_form(doc, doc_name.name)
                if doc_ids:
                    doc_ids += ", " + doc_link
                else:
                    doc_ids = doc_link
            if doc_ids:
                pending_invoices[doc] =  doc_ids

        return pending_invoices

    @frappe.whitelist()
    def check_for_undispensed_meds(inpatient_record: str):
        """
        Using inpatient record check for medication that have not been dispensed
        """
        try:
            prescriptions = frappe.db.get_list(
                "Inpatient Doctor Prescription Table",
                filters={'parent': inpatient_record.name,"dont_issue": 0,"dispensed": 0},
                fields = ["generic_drug_name"]
            )
            return prescriptions
        except Exception as e:
            frappe.log_error(e, "Error Checking for undispensed meds / inpatient_record.py")
            return {"message": False}


    @frappe.whitelist()
    def admit(self, service_unit, check_in, expected_discharge=None):
        try:
            admit_patient(self, service_unit, check_in, expected_discharge)
            return True
        except Exception as e:
            return e

    # @frappe.whitelist()
    # def create_multidisciplinary(**args):
    #     multidisciplinary_doc = frappe.get_doc("Multidisciplinary Test")
    #     multidisciplinary_doc.patient = args['patient']
    #     multidisciplinary_doc.gender = args['patient_gender'],
    #     multidisciplinary_doc.op_enco

    #     patient_gender : cur_frm.doc.gender,
    #                 op_encounter: cur_frm.doc.admission_encounter,
    #                 blood_group: cur_frm.doc.blood_group,
    #                 patient_dob: cur_frm.doc.dob,
    #                 admission_note:


def admit_patient(inpatient_record, service_unit, check_in, expected_discharge=None):
    inpatient_record.admitted_datetime = check_in
    inpatient_record.status = "Admitted"
    inpatient_record.expected_discharge = expected_discharge

    inpatient_record.set("inpatient_occupancies", [])
    transfer_patient(inpatient_record, service_unit, check_in)

    frappe.db.set_value(
        "Patient", inpatient_record.patient, "inpatient_status", "Admitted"
    )
    frappe.db.set_value(
        "Patient", inpatient_record.patient, "inpatient_record", inpatient_record.name
    )


def transfer_patient(inpatient_record, service_unit, check_in):
    item_line = inpatient_record.append("inpatient_occupancies", {})
    item_line.service_unit = service_unit
    item_line.check_in = check_in

    inpatient_record.save(ignore_permissions=True)

    frappe.db.set_value(
        "Healthcare Service Unit", service_unit, "occupancy_status", "Occupied"
    )


@frappe.whitelist()
def update_ward_room_bed_info(**args):
    doc = frappe.get_doc("Inpatient Record", args["inpatient_record"])
    doc.ward_station = args["ward_station"]
    doc.room_no = args["room_no"]
    doc.bed_number = args["bed_number"]
    doc.bed_type = args["room_type"]
    doc.save(ignore_permissions=True)


@frappe.whitelist()
def generate_multidisciplinary_record(**args):
    try:
        # Generate record and fetch patient history from last op encounter
        inpatient_record = args["inpatient_record"]
        op_encounter = args["op_encounter"]
        patient = args["patient"]

        # Fetch the latest op encounter to pull patient history and other relevant data
        if op_encounter != '':
            op_doc = frappe.get_doc("Patient Encounter", op_encounter)
        else:
            op_doc = ''
        

        multid_doc = frappe.get_doc(doctype="Multidisciplinary")
        multid_doc.age = op_doc.patient_age if op_encounter else ''
        multid_doc.date_of_bith = op_doc.date_of_birth if op_encounter else ''
        multid_doc.height_in_centimeters = op_doc.height_in_centimeters if op_encounter else ''
        multid_doc.weight_in_kilograms = op_doc.weight_in_kilograms if op_encounter else ''
        multid_doc.room_no = args["room_no"]
        multid_doc.bed_no = args["bed_no"]
        multid_doc.gender = op_doc.patient_sex if op_encounter else ''
        multid_doc.patient_encounter = op_encounter
        multid_doc.inpatient_record = inpatient_record
        multid_doc.patient = patient
        multid_doc.save(ignore_permissions=True)

        # Create Multidisciplinary Care Plan Child record that will hold history from encounter
        multidisciplinary_table = frappe.get_doc(doctype="Multidisciplinary Care Plan")
        multidisciplinary_table.parent = multid_doc.name
        multidisciplinary_table.practitioner = ""
        multidisciplinary_table.parentfield = "multidisciplinary_care_plan_table"
        multidisciplinary_table.parenttype = "Multidisciplinary"
        multidisciplinary_table.owner = "Admission Notes"
        multidisciplinary_table.modified_by = "Admission Notes"

        if op_doc != '':
            multidisciplinary_table.assessment = f"""<p style='font-size:14px;'><b>COMPLAINTS</b></p>
													<p>{op_doc.patient_history[0].patient_encounter_chief_complaint or ''}</p>
													<p style='font-size:14px'><b>HISTORY</b></p>
													<div style='margin-bottom: 16px;' class='row'>
														<div class='col-6'>
															<b>History of <br> Present Illness:</b>
															<br>
														</div>
														<div class='col-6'>
															<p>{op_doc.patient_history[0].patient_encounter_history_of_present_illness or '-'}</p>
														</div>
													</div>
													<div style='margin-bottom: 16px;' class='row'>
														<div class='col-6'>
															<b>Systematic Inquiry:</b>
															<br>
														</div>
														<div class='col-6'>
															{op_doc.patient_history[0].patient_encounter_systematic_enquiry or '-'}
														</div>
													</div>
													<div style='margin-bottom: 16px;' class='row'>
														<div class='col-6'>
															<b>Past of Medical History:</b>
															<br>
														</div>
														<div class='col-6'>
															{op_doc.patient_history[0].patient_encounter_past_medical_history or '-'}
														</div>
													</div>
													<div style='margin-bottom: 16px;' class='row'>
														<div class='col-6'>
															<b>Milestones:</b>
															<br>
														</div>
														<div class='col-6'>
															{op_doc.patient_history[0].patient_encounter_milestones or '-'}
														</div>
													</div>
													<div style='margin-bottom: 16px;' class='row'>
														<div class='col-6'>
															<b>Immunization:</b>
															<br>
														</div>
														<div class='col-6'>
															{op_doc.patient_history[0].patient_encounter_other_immunization or '-'}
														</div>
													</div>
													<div style='margin-bottom: 16px;' class='row'>
														<div class='col-6'>
															<b>Nutrition History:</b>
															<br>
														</div>
														<div class='col-6'>
															{op_doc.patient_history[0].patient_encounter_nutrition_history or '-'}
														</div>
													</div>
													<div style='margin-bottom: 16px;' class='row'>
														<div class='col-6'>
															<b>Family History:</b>
															<br>
														</div>
														<div class='col-6'>
															{op_doc.patient_history[0].patient_encounter_family_history or '-'}
														</div>
													</div>
													<div style='margin-bottom: 16px;' class='row'>
														<div class='col-6'>
															<b>Socio economic <br> history:</b>
															<br>
														</div>
														<div class='col-6'>
															{op_doc.patient_history[0].patient_encounter_socio_economic_history or '-'}
														</div>
													</div>
													<div style='margin-bottom: 16px;' class='row'>
														<div class='col-6'>
															<b>Chronic Care <br> Medication History:</b>
															<br>
														</div>
														<div class='col-6'>
															{op_doc.patient_history[0].patient_encounter_chronic_care_med_history or '-'}
														</div>
													</div>
													<div style='margin-bottom: 16px;' class='row'>
														<div class='col-6'>
															<b>Other Relevant History:</b>
															<br>
														</div>
														<div class='col-6'>
															{op_doc.patient_history[0].patient_encounter_other_relevant_history or '-'}
														</div>
													</div>

												
												"""

        multidisciplinary_table.implementation = ""

        if op_doc != '':
            if op_doc.diagnosis_table:
                holder = ""

                for i in op_doc.diagnosis_table:
                    holder += (
                        i.code + "&nbsp;&nbsp;&nbsp;&nbsp;" + i.description + "<br><br>"
                    )

                multidisciplinary_table.diagnosis = (
                    f"""
                                                    <p><b>ICD10</b><br></p>
                                                    <br>
                                                    <div class="row">
                                                        <div class="col-4">
                                                            <p>Code</p>
                                                        </div>
                                                        <div class="col-8">
                                                        <p>Description</p>
                                                        </div>
                                                    </div>
                                                    <br>
                                                    """
                    + holder
                )

        multidisciplinary_table.evaluation = ""
        multidisciplinary_table.patient_order = ""
        multidisciplinary_table.implementation = ""
        multidisciplinary_table.care_objectives = ""

        multidisciplinary_table.save(ignore_permissions=True)

        # Auto generating Input Output chart on Admission
        nursing_input_output = frappe.new_doc("Nursing Input Output Chart")
        nursing_input_output.patient = patient
        nursing_input_output.inpatient_record = inpatient_record
        nursing_input_output.multidisciplinary = multid_doc.name
        nursing_input_output.save(ignore_permissions=True)

        # Updating Nursing Ward Occupancy once patient is admitted from boooked to assigned
        doc = frappe.get_last_doc("Nursing Ward Occupancy", filters={'patient': args["patient"]})
        doc.is_booking = 0
        doc.is_assigned = 1
        doc.insert(ignore_permissions=True)

        return True
    except Exception as e:
        frappe.log_error(e, "Admission/input output Error")
        return e


@frappe.whitelist(allow_guest=True)
def encounter_assessments(encounter):
    all_assessments = frappe.get_all(
        "Patient Assessment",
        filters={"inpatient_record": encounter},
        fields=[
            "name",
            "assessment_template",
            "total_score_obtained",
            "assessment_date",
            "assessment_time",
            "owner",
            "action",
            "pulled_to_multidisciplinary",
        ],
    )
    # assessments = frappe.db.sql(
    #     f""" SELECT * FROM `tabPatient Assessment` WHERE encounter ='{encounter}' ORDER BY modified DESC """,
    #     as_dict=True,
    # )

    return all_assessments

@frappe.whitelist(allow_guest=True)
def fetch_completed_nursing_tools(**args):
    try:
        completed_tools_doc = frappe.db.get_list("Completed Nursing Tools", filters={'inpatient_record': args["inpatient_record"]}, fields=['tool_name', 'nursing_tool_link', 'modified', 'owner'])
        return completed_tools_doc

    except Exception as e:
        return e
    

@frappe.whitelist(allow_guest=True)
def get_ward_overview_data(**args):
    try:
        ward_overview_data = frappe.get_doc("Nursing Ward", args["ward_name"])
        return ward_overview_data
    except Exception as e:
        return e
    
@frappe.whitelist(allow_guest=True)
def updating_ward_occupany_status(**args):
    try:
        doc = frappe.get_last_doc("Nursing Ward Occupancy", filters={"patient": args["patient"]})
        print("\n\n\n ====================== WARD OCCUPANCY DOC ====================== \n\n\n")
        doc.is_booking = 0
        doc.is_assigned = 1
        doc.save(ignore_permissions=True)
        
        return doc
    except Exception as e:
        return e
    

@frappe.whitelist(allow_guest=True)
def fetch_primary_nurse_from_practitioner(**args):
    try:
        practitioner_id = frappe.db.get_list('Healthcare Practitioner', filters={'user_id': args["user_id"]}, fields=['name'])
        return practitioner_id
    
    except Exception as e:
        return e
    
@frappe.whitelist(allow_guest=True)
def fetch_patient_doc_for_highlighted_menu(**args):
    try:
        doc = frappe.get_doc("Patient", args["patient"])
        return doc
    except Exception as e:
        return e
    

@frappe.whitelist(allow_guest=True)
def fetch_inpatient_record(**args):
    try:
        doc = frappe.get_doc("Inpatient Record", args["inpatient_record"])
        return doc
    except Exception as e:
        return e
    
@frappe.whitelist(allow_guest=True)
def check_if_ward_is_pccu(**args):
    try:
        is_pccu = frappe.db.get_value("Nursing Ward", args["ward"], ['is_pccu_ward'])
        
        if is_pccu == 1:
            return True
        else:
            return False
        
    except Exception as e:
        return e
    
@frappe.whitelist(allow_guest=True)
def check_existing_discharge_summary(**args):
    try:
        existing_discharge_summary = frappe.get_list(doctype='Inpatient Discharge Summary', filters={'inpatient_record': args["inpatient_record"]})
        return existing_discharge_summary
    except Exception as e:
        return e
    
@frappe.whitelist(allow_guest=True)
def delete_ward_occupancy_record(**args):
    try:
        ward_occupancy_record = frappe.db.get_value('Nursing Ward Occupancy', {'patient': args['patient']}, ['name'])
        
        frappe.delete_doc('Nursing Ward Occupancy', ward_occupancy_record)
        
        # frappe.db.delete("Nursing Ward Occupancy", {"bed": args['bed'], 'ward': args['ward']})
        return ward_occupancy_record
    except Exception as e:
        return e
    
@frappe.whitelist(allow_guest=True)
def fetch_vitals_from_op(**args):
    try:
        latest_doc = frappe.get_last_doc("Patient Encounter", filters={"patient": args["patient"]})
        return latest_doc
    except Exception as e:
        return e
    

@frappe.whitelist(allow_guest=True)
def fetch_anthropometry_from_op(**args):
    try:
        latest_doc = frappe.get_last_doc("Patient Encounter", filters={"patient": args["patient"]}, )
        return latest_doc
    except Exception as e:
        return e