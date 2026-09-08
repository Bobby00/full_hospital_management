from typing import Any, Dict, List
import frappe
from gch_queue.utils import queue_utility
from gch_queue.utils.constants import QueueConstants as qc
from gch_messaging.utils import messaging
import urllib.request as urllib2
import datetime
from frappe.utils import now, get_datetime

from gch_custom.services.rest import check_open_encounter
from gch_queue.utils.constants import QueueConstants as QC
from gch_queue.utils.queue import GCHPriorityQueue
from gch_queue.utils.network import gch_ip_util
from gch_queue.utils.station import create_station_entry, update_station_entry

leo = (datetime.datetime.today() + datetime.timedelta(days=1)).date()
jana = leo - datetime.timedelta(days=1)
leo_ = str(leo)
jana_ = str(jana)

BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
    "Accept-Encoding": "none",
    "Accept-Language": "en-US,en;q=0.8",
    "Connection": "keep-alive",
}


class GCHQueueAPI:
    def __init__(self) -> None:
        """
        Queue
        """
        ENC_QUERY = f"""

            """
        ...

    # def set_request_ip(self):
    #     if frappe.get_request_header('X-Forwarded-For'):
    #         frappe.local.request_ip = (frappe.get_request_header('X-Forwarded-For').split(",")[0]).strip()

    #     elif frappe.get_request_header('REMOTE_ADDR'):
    #         frappe.local.request_ip = frappe.get_request_header('REMOTE_ADDR')

    #     else:
    #         frappe.local.request_ip = '127.0.0.1'

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def render_all_queues() -> List:
        user = frappe.session.user
        try:
            actor = frappe.session.user
        except Exception as e:
            print(e)
        if not actor or actor == "Guest":
            actor = user
        if not actor:
            frappe.throw(
                title="Error",
                msg="You need to sign in to continue",
            )
        healthcare_practs = frappe.qb.DocType("Healthcare Practitioner")
        healthcare_pract = (
            frappe.qb.from_(healthcare_practs)
            .select("*")
            .where(healthcare_practs.user_id == actor)
            .run(as_dict=True)
        )
        if not healthcare_pract:
            users = frappe.qb.DocType("User")
            user_ = (
                frappe.qb.from_(users)
                .select("*")
                .where(users.name == actor)
                .run(as_dict=True)
            )
        station_entry_exists = (
            frappe.db.exists(
                {
                    "doctype": "Practitioner Station Entry",
                    "healthcare_practitioner": healthcare_pract[0].get("name"),
                }
            )
            if healthcare_pract
            else frappe.db.exists(
                {
                    "doctype": "Practitioner Station Entry",
                    "user": user_[0].get("name"),
                }
            )
        )

        if station_entry_exists is not None and len(station_entry_exists) > 0:
            station_entry = (
                frappe.get_doc(
                    "Practitioner Station Entry",
                    {"healthcare_practitioner": healthcare_pract[0].get("name")},
                )
                if healthcare_pract
                else frappe.get_doc(
                    "Practitioner Station Entry",
                    {"user": user_[0].get("name")},
                )
            )

        ENC_QUERY = f"""
            SELECT pq.priority,pq.patient,pq.patient_encounter,pq.creation, pq.modified, pq.name
            FROM tabQueue as pq INNER JOIN `tabQueue Group` as qg
            ON qg.name = pq.queue_group INNER JOIN `tabPatient Encounter` as pe ON pe.name = pq.patient_encounter
            WHERE pq.is_in=0 AND pe.workflow_state != "Encounter Closed" AND pe.branch = '{station_entry.branch}' and pq.modified BETWEEN '{jana_}' AND '{leo_}' ORDER BY pq.modified;"""
        encounters_on_queue = frappe.db.sql(ENC_QUERY, as_dict=True)
        current_queue: GCHPriorityQueue = GCHPriorityQueue(policy="FIFO")

        for encounter in encounters_on_queue:
            encounter_details = frappe.db.get_list(
                "Patient Encounter",
                filters={"name": encounter.get("patient_encounter")},
                fields=[
                    "clinic",
                    "mode_of_payment",
                    "workflow_state",
                    "is_emergency_patient",
                    "is_priority_patient",
                    "practitioner_name",
                ],
            )
            default_clinic = {"clinic": "clinic Not selected"}
            if encounter_details:
                encounter.update(encounter_details[0])
            else:
                encounter.update(default_clinic)

            patient_priority = encounter.get("priority")

            is_emergency = encounter.get("is_emergency_patient")
            is_priority = encounter.get("is_priority_patient")

            if is_emergency == 1:
                patient_priority = 1
                encounter.update({"priority": patient_priority})
            elif is_priority == 1:
                patient_priority = 2
                encounter.update({"priority": patient_priority})
            else:
                patient_priority = 3
            # if patient_priority == "" or patient_priority == None:
            #     patient_priority = 2
            current_queue.push(
                priority=int(patient_priority),
                key=encounter.patient,
                encounter_detail=encounter,
            )
        return list(current_queue.ordered_entries.items())

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def render_queue(
        service_unit: str, start_date: Any = None, end_date: Any = None
    ) -> List:
        # from sentry.utils import capture_exception
        """
        API endpoint to list queue


        :param Service Unit - Queue under which we wish to list patients.

        """
        user = frappe.session.user
        try:
            actor = frappe.session.user
        except Exception as e:
            print(e)
        if not actor or actor == "Guest":
            actor = user
        if not actor:
            frappe.throw(
                title="Error",
                msg="You need to sign in to continue",
            )
        healthcare_practs = frappe.qb.DocType("Healthcare Practitioner")
        healthcare_pract = (
            frappe.qb.from_(healthcare_practs)
            .select("*")
            .where(healthcare_practs.user_id == actor)
            .run(as_dict=True)
        )
        if not healthcare_pract:
            users = frappe.qb.DocType("User")
            user_ = (
                frappe.qb.from_(users)
                .select("*")
                .where(users.name == actor)
                .run(as_dict=True)
            )
        station_entry_exists = (
            frappe.db.exists(
                {
                    "doctype": "Practitioner Station Entry",
                    "healthcare_practitioner": healthcare_pract[0].get("name"),
                }
            )
            if healthcare_pract
            else frappe.db.exists(
                {
                    "doctype": "Practitioner Station Entry",
                    "user": user_[0].get("name"),
                }
            )
        )

        if station_entry_exists is not None and len(station_entry_exists) > 0:
            station_entry = (
                frappe.get_doc(
                    "Practitioner Station Entry",
                    {"healthcare_practitioner": healthcare_pract[0].get("name")},
                )
                if healthcare_pract
                else frappe.get_doc(
                    "Practitioner Station Entry",
                    {"user": user_[0].get("name")},
                )
            )
            # (SELECT COUNT(*) FROM `tabLab Prescription` WHERE parent= pq.patient_encounter AND parentfield='lab_test_prescription' AND has_result=1) AS lab_prescription_submitted_count,

            ENC_QUERY = (
                f"""
            SELECT pq.priority,pq.patient,pq.patient_encounter,pq.creation, pq.modified, pq.name,
            	(SELECT COUNT(*) FROM `tabLab Prescription` WHERE parent = pq.patient_encounter AND parentfield='lab_test_prescription') AS lab_prescription_count,
                (SELECT COUNT(*) FROM `tabLab Prescription` WHERE parent= pq.patient_encounter AND parentfield='lab_test_prescription' AND has_result=1) AS lab_prescription_result_count,
		(SELECT COUNT(*) FROM `tabLab Prescription` WHERE parent = pq.patient_encounter AND parentfield='radiology_details') AS radiology_prescription_count,
             (SELECT COUNT(*) FROM `tabProcedure Prescription` WHERE parent = pq.patient_encounter) AS procedure_prescription_count,
             (SELECT COUNT(*) FROM `tabClinical Procedure` WHERE patient_encounter = pq.patient_encounter AND docstatus=1) AS procedure_prescription_submitted_count,
             (SELECT COUNT(*) FROM `tabDoctor Prescription Table` WHERE parent = pq.patient_encounter) AS doctor_prescription_count
            FROM tabQueue as pq INNER JOIN `tabQueue Group` as qg
            ON qg.name = pq.queue_group INNER JOIN `tabPatient Encounter` as pe ON pe.name = pq.patient_encounter
            WHERE pq.is_in=0 AND pe.workflow_state != "Encounter Closed" AND qg.service_unit = '{service_unit}' AND pe.branch = '{station_entry.branch}' and pq.modified BETWEEN '{jana_}' AND '{leo_}' ORDER BY pq.modified;"""
                if (start_date == "" and end_date == "")
                or (start_date == jana_ and end_date == jana_)
                else f"""
            SELECT pq.priority,pq.patient,pq.patient_encounter,pq.creation, pq.modified, pq.name,
            	(SELECT COUNT(*) FROM `tabLab Prescription` WHERE parent = pq.patient_encounter AND parentfield='lab_test_prescription') AS lab_prescription_count,
                (SELECT COUNT(*) FROM `tabLab Prescription` WHERE parent= pq.patient_encounter AND parentfield='lab_test_prescription' AND has_result=1) AS lab_prescription_result_count,
		(SELECT COUNT(*) FROM `tabLab Prescription` WHERE parent = pq.patient_encounter AND parentfield='radiology_details') AS radiology_prescription_count,
             (SELECT COUNT(*) FROM `tabProcedure Prescription` WHERE parent = pq.patient_encounter) AS procedure_prescription_count,
             (SELECT COUNT(*) FROM `tabClinical Procedure` WHERE patient_encounter = pq.patient_encounter AND docstatus=1) AS procedure_prescription_submitted_count,
             (SELECT COUNT(*) FROM `tabDoctor Prescription Table` WHERE parent = pq.patient_encounter) AS doctor_prescription_count

            FROM tabQueue as pq INNER JOIN `tabQueue Group` as qg
            ON qg.name = pq.queue_group INNER JOIN `tabPatient Encounter` as pe ON pe.name = pq.patient_encounter
            WHERE pq.is_in=0 AND pe.workflow_state != "Encounter Closed" AND qg.service_unit = '{service_unit}' AND pe.branch = '{station_entry.branch}' and pq.modified BETWEEN '{start_date}' AND '{end_date}'  ORDER BY pq.modified;
            """
            )

            # ENC_QUERY = f"""
            # SELECT priority,patient,patient_encounter,tabQueue.creation, tabQueue.modified
            # FROM tabQueue as tq INNER JOIN `tabQueue Group` as tabQueueGroup
            # ON tabQueueGroup.name = tabQueue.queue_group WHERE tabQueueGroup.service_unit = '{service_unit}' AND tabQueueGroup.location = '{station_entry.branch}' ORDER BY tabQueue.creation; """

            encounters_on_queue = frappe.db.sql(ENC_QUERY, as_dict=True)
            print(encounters_on_queue)
            current_queue: GCHPriorityQueue = GCHPriorityQueue(policy="FIFO")

            for encounter in encounters_on_queue:
                encounter_details = frappe.db.get_list(
                    "Patient Encounter",
                    filters={"name": encounter.get("patient_encounter")},
                    fields=[
                        "clinic",
                        "mode_of_payment",
                        "workflow_state",
                        "is_emergency_patient",
                        "is_priority_patient",
                        "practitioner_name",
                    ],
                )
                default_clinic = {"clinic": "clinic Not selected"}
                if encounter_details:
                    encounter.update(encounter_details[0])
                else:
                    encounter.update(default_clinic)

                patient_priority = encounter.get("priority")

                is_emergency = encounter.get("is_emergency_patient")
                is_priority = encounter.get("is_priority_patient")

                if is_emergency == 1:
                    patient_priority = 1
                    encounter.update({"priority": patient_priority})
                elif is_priority == 1:
                    patient_priority = 2
                    encounter.update({"priority": patient_priority})
                else:
                    patient_priority = 3
                # if patient_priority == "" or patient_priority == None:
                #     patient_priority = 2
                current_queue.push(
                    priority=int(patient_priority),
                    key=encounter.patient,
                    encounter_detail=encounter,
                )
            return list(current_queue.ordered_entries.items())
        
   
    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def set_user_station(service_unit: str, user: str = None, *args) -> Dict:
        """Set the logged in user's station.
        The Station is a Healthcare Service Unit.

        1. Retrieve the Healthcare Practitioner Object
        2. Retrieve the Healthcare Service Unit Object
        3. Create/Update Practitioner Station Entry Object

        """
        user_ip = frappe.local.request_ip
        frappe.msgprint("User IP: {}".format(user_ip))
        user_branch = None
        BRANCH = frappe.qb.DocType("Branch")

        # branch = frappe.qb.from_(branches).select("*").where(branches.ip_range == user_ip).run(as_dict=True)
        branches = frappe.qb.from_(BRANCH).select("*").run(as_dict=True)
        for branch in branches:
            if branch.has_multiple_ips:
                ranges = frappe.db.get_list(
                    "Ip Range",
                    filters={"parent": branch.name},
                    fields=["range"],
                )
                for range in ranges:
                    if gch_ip_util.ip_in_prefix(user_ip, range.range.strip(" ")):
                        user_branch = branch.name
                
            else:
                if branch.ip_range == None or branch.ip_range == "":
                    continue
                # ranges = branch.ip_range
                if gch_ip_util.ip_in_prefix(user_ip, branch.ip_range.strip(" ")):
                    user_branch = branch.name
            # if ranges is not None and ranges != "" and ranges is not " ":
            # for ip_range in ranges:
            #     if gch_ip_util.ip_in_prefix(user_ip, ip_range.strip(" ")):
            #         # frappe.msgprint(f"IP {user_ip} in range {branch.ip_range}")
            #         # frappe.msgprint(f"Welcome, You are in {branch.name}")
            #         user_branch = branch.name
            #         break
        if user_branch == None:
            user_branch = branches[0].name
        frappe.msgprint(f"Welcome, You are in {user_branch}")
        actor = None
        try:
            actor = frappe.session.user
        except Exception as e:
            print(e)
        if not actor or actor == "Guest":
            actor = user
        if not actor:
            frappe.throw(
                title="Error",
                msg="You need to sign in to continue",
            )
        healthcare_practs = frappe.qb.DocType("Healthcare Practitioner")
        healthcare_pract = (
            frappe.qb.from_(healthcare_practs)
            .select("*")
            .where(healthcare_practs.user_id == actor)
            .run(as_dict=True)
        )
        users = frappe.qb.DocType("User")
        user_ = (
            frappe.qb.from_(users)
            .select("*")
            .where(users.name == actor)
            .run(as_dict=True)
        )
        # if not healthcare_pract :

        #     user_ = (
        #         frappe.qb.from_(users)
        #         .select("*")
        #         .where(users.name == actor)
        #         .run(as_dict=True)
        #     )
        #     # print(user_)
        #     # frappe.throw(
        #     #     title="Error",
        #     #     msg="You are not allowed to perform this action. Only Healthcare Practitioners can perform this action.",
        #     # )
        #     # return {
        #     #     "status": False,
        #     #     "message": "You are not allowed to perform this action. Only Healthcare Practitioners can perform this action.",
        #     # }
        healthcare_service_unit = frappe.get_doc(
            "Healthcare Service Unit", service_unit
        )
        # frappe.session['custom_attribute'] = 'some_value'

        if not healthcare_service_unit:
            frappe.throw(
                title="Error",
                msg="The Healthcare Service Unit you are trying to set does not exist.",
            )
            return {"status": "error", "message": "Service Unit not found"}
        healthcare_pract_entry_exists = None
        user_entry_exists = None

        # print(healthcare_pract[0].get("name"), "\n\n\n Healthcare Practitioner...... \n\n\n")
        # print(user_[0].get("name"), "\n\n\n User.......... \n\n\n")

        if len(healthcare_pract) > 0:
            healthcare_pract_entry_exists = frappe.db.exists(
                    "Practitioner Station Entry",
                    {"healthcare_practitioner": healthcare_pract[0].get("name")}
                
            )
        if len(user_) > 0:
            user_entry_exists = frappe.db.exists(
                "Practitioner Station Entry",
                {"user": user_[0].get("name")}
            )

        # print(healthcare_pract_entry_exists, "\n\n\n User.......... \n\n\n", user_entry_exists)

        if (
            healthcare_pract_entry_exists is not None
        ):
            station_entry = frappe.get_doc(
                "Practitioner Station Entry",
                {"healthcare_practitioner": healthcare_pract[0].get("name")},
            )
            station_entry.station = healthcare_service_unit.get("name")
            station_entry.time_in = get_datetime()
            station_entry.user_ip = user_ip
            station_entry.time_out = None
            station_entry.branch = user_branch
            station_entry.save(ignore_permissions=True)
            return station_entry.as_dict()

        if user_entry_exists is not None:
            station_entry = frappe.get_doc(
                "Practitioner Station Entry",
                {"user": user_[0].get("name")},
            )
            station_entry.station = healthcare_service_unit.get("name")
            station_entry.time_in = get_datetime()
            station_entry.user_ip = user_ip
            station_entry.time_out = None
            station_entry.branch = user_branch
            station_entry.save(ignore_permissions=True)
            return station_entry.as_dict()
        if (user_entry_exists is None or user_entry_exists is False):
            if user_:
                try:
                    station_entry = frappe.get_doc(
                        {
                            "doctype": "Practitioner Station Entry",
                            "user": user_[0].get("name"),
                            "station": healthcare_service_unit.get("name"),
                            "time_in": get_datetime(),
                            "branch": user_branch,
                            "user_ip": user_ip,
                        }
                    )

                    station_entry.insert(ignore_permissions=True)
                    return station_entry.as_dict()
                except Exception:
                    frappe.throw(
                        title="Error",
                        msg="There was an error setting your station. Please try again.",
                    )

        if (
            healthcare_pract_entry_exists is None
            or healthcare_pract_entry_exists is False
        ):
            if healthcare_pract:
                try:
                    station_entry = frappe.get_doc(
                        {
                            "doctype": "Practitioner Station Entry",
                            "healthcare_practitioner": healthcare_pract[0].get("name"),
                            "station": healthcare_service_unit.get("name"),
                            "time_in": get_datetime(),
                            "branch": user_branch,
                            "user_ip": user_ip,
                        }
                    )
                    station_entry.insert(ignore_permissions=True)
                    return station_entry.as_dict()
                except Exception:
                    frappe.throw(
                        title="Error",
                        msg="There was an error setting your station. Please try again.",
                    )
        return

        # station_entry_exists = (
        #     frappe.db.exists(
        #         {
        #             "doctype": "Practitioner Station Entry",
        #             "healthcare_practitioner": healthcare_pract[0].get("name"),
        #         }
        #     )
        #     if healthcare_pract and not user_
        #     else frappe.db.exists(
        #         {
        #             "doctype": "Practitioner Station Entry",
        #             "user": user_[0].get("name"),
        #         }
        #     )
        # )

        if station_entry_exists is not None and len(station_entry_exists) > 0:
            station_entry = (
                frappe.get_doc(
                    "Practitioner Station Entry",
                    {"healthcare_practitioner": healthcare_pract[0].get("name")},
                )
                if healthcare_pract
                else frappe.get_doc(
                    "Practitioner Station Entry",
                    {"user": user_[0].get("name")},
                )
            )
            station_entry.station = healthcare_service_unit.get("name")
            station_entry.time_in = get_datetime()
            station_entry.user_ip = user_ip
            station_entry.time_out = None
            station_entry.branch = user_branch
            station_entry.save(ignore_permissions=True)
            return station_entry.as_dict()

        else:
            try:
                station_entry = (
                    frappe.get_doc(
                        {
                            "doctype": "Practitioner Station Entry",
                            "healthcare_practitioner": healthcare_pract[0].get("name"),
                            "station": healthcare_service_unit.get("name"),
                            "time_in": get_datetime(),
                            "branch": user_branch,
                            "user_ip": user_ip,
                        }
                    )
                    if healthcare_pract
                    else frappe.get_doc(
                        {
                            "doctype": "Practitioner Station Entry",
                            "user": user_[0].get("name"),
                            "station": healthcare_service_unit.get("name"),
                            "time_in": get_datetime(),
                            "branch": user_branch,
                            "user_ip": user_ip,
                        }
                    )
                )
                station_entry.insert(ignore_permissions=True)
                return station_entry.as_dict()
            except Exception as e:
                frappe.throw(
                    title="Error",
                    msg="There was an error setting your station. Please try again.",
                )
                return {"status": False, "message": "Error creating station entry"}

        return

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def add_patient_to_queue(
        patient_id: str, priority: str, service_unit: str, phone: str = None
    ) -> Any:
        """
        Adds Patient to the Queue based on their priority.

        :param patient_id - Patient ID
        :param priority - The Priority of the patient on the queue
        :param queue_group - The Queue Group to be added

        """
        queue_group = frappe.db.sql(
            f""" SELECT name FROM `tabQueue Group` WHERE service_unit = '{service_unit}'; """,
            as_dict=True,
        )
        patient_in_queue = frappe.db.exists(
            {
                "doctype": "Queue",
                "patient": patient_id,
            }
        )
        if patient_in_queue:
            frappe.db.set_value(
                "Queue",
                patient_in_queue[0][0],
                {"priority": priority, "queue_group": queue_group[0].get("name")},
            )

            queue_doc = frappe.get_doc("Queue", patient_in_queue[0][0])

        if not patient_in_queue:
            queue_record = {
                "doctype": "Queue",
                "patient": patient_id,
                "priority": priority,
                "queue_group": queue_group[0].get("name"),
                "phone": phone,
            }
            queue_doc = frappe.get_doc(queue_record)
            queue_doc.insert()
        timestamp = queue_doc.modified

        encounters_on_queue = frappe.db.sql(
            f"""SELECT * FROM tabQueue JOIN `tabQueue Group` as tabQueueGroup ON tabQueueGroup.name = tabQueue.queue_group WHERE tabQueueGroup.service_unit = '{service_unit}' and tabQueueGroup.name = '{queue_group[0].get("name")}'; """,
            as_dict=True,
        )

        current_queue = GCHPriorityQueue(policy="FIFO")
        for encounter in encounters_on_queue:
            patient_priority = encounter.get("priority")
            if patient_priority == "" or patient_priority == None:
                patient_priority = 2
            current_queue.push(
                priority=int(patient_priority),
                key=encounter.patient,
                encounter_detail=encounter,
            )
        current_position = (
            list(current_queue.ordered_entries.keys()).index(patient_id) + 1
        )  # +1 because the queue starts at 0
        # SMS phone
        messaging.send_sms(
            message=f"You have been added to the {service_unit}  Queue. You are position {current_position}.",
            recipient=phone,
        )
        return current_queue.ordered_entries

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def open_encounter(
        patient: str,
        service_unit: str,
        phone_number: str,
        branch: str,
        mode_of_payment: str,
        appointment: str = "",
        priority: int = QC.NORMAL,
    ) -> Any:
        """
        Utility to Open an Encounter.
        """
        encounter_response = check_open_encounter(patient)
        station_entry = None
        if encounter_response.get("open_encounter") != 0:
            return {"status": False, "message": "Patient already has an Open Encounter"}

        if check_open_encounter(patient):
            if encounter_response.get("open_encounter") != 1:
                healthcare_practitioner_ = None

                queue_group = frappe.db.sql(
                    f""" SELECT name FROM `tabQueue Group` WHERE service_unit = '{service_unit}'; """,
                    as_dict=True,
                )
                if len(queue_group) < 1:
                    return {
                        "status": "error",
                        "message": f"Queue Group for service unit {service_unit} not found. Ensure this has been set up beforehand.",
                    }
                """Open a Patient Encounter
                Args:
                    patient (str): The Patient in question

                Returns:
                    Dict : Payload containing the encounter details
                """
                patient_ = ("",)

                if not patient_:
                    return {"error": f"No patient record {patient} found."}
                patient_obj = frappe.get_doc("Patient", patient)
                healthcare_service_unit = frappe.get_doc(
                    "Healthcare Service Unit", service_unit
                )
                if not healthcare_service_unit:
                    frappe.throw(
                        title="Error",
                        msg="The Healthcare Service Unit you are trying to set does not exist.",
                    )
                    return {"status": "error", "message": "Service Unit not found"}

                station_entry_exists = frappe.db.exists(
                    {
                        "doctype": "Practitioner Station Entry",
                        "station": healthcare_service_unit.get("name"),
                    }
                )
                if station_entry_exists:
                    station_entry = frappe.get_doc(
                        "Practitioner Station Entry",
                        {"station": healthcare_service_unit.get("name")},
                    )
                    if station_entry.healthcare_practitioner:
                        healthcare_practitioner_ = frappe.get_doc(
                            "Healthcare Practitioner",
                            station_entry.healthcare_practitioner,
                        )
                    if healthcare_practitioner_ is not None:
                        healthcare_practitioner = healthcare_practitioner_.name
                    elif healthcare_practitioner_ is None:
                        print("No Healthcare Practitioner found")
                        # Use user in station entry
                        healthcare_practitioners = frappe.get_list(
                            "Healthcare Practitioner"
                        )
                        healthcare_practitioner = healthcare_practitioners[0].get(
                            "name"
                        )
                if not station_entry_exists:
                    try:
                        healthcare_practitioners = frappe.get_list(
                            "Healthcare Practitioner"
                        )
                        healthcare_practitioner = healthcare_practitioners[0].get(
                            "name"
                        )
                    except Exception as e:
                        return {"error": "No Healthcare Practitioner found"}
                """
                get patient details from appointment
                Thagichu
                """
                appointment_id = None
                appointment_type = None
                department = None

                if appointment != "" and appointment != None:
                    appointment_ = frappe.get_doc("Patient Appointment", appointment)
                    patient_ = frappe.db.get_value(
                        "Patient",
                        {"name": appointment_.patient},
                        ["name", "patient_name", "sex", "dob", "uhid_code"],
                        as_dict=True,
                    )
                    appointment_id = appointment_.name
                    appointment_type = appointment_.appointment_type
                    healthcare_practitioner = appointment_.practitioner
                    department = appointment_.department
                if appointment == "":
                    patient_: dict = frappe.db.get_value(
                        "Patient",
                        {"name": patient},
                        ["name", "patient_name", "sex", "dob", "uhid_code"],
                        as_dict=True,
                    )
                data = {
                    "doctype": "Patient Encounter",
                    "patient": patient,
                    "patient_name": patient_.get("patient_name"),
                    "patient_sex": patient_.get("sex"),
                    "patient_age": patient_obj.get_age(),
                    "practitioner": healthcare_practitioner,
                    "clinic": service_unit,
                    "phone_number": phone_number,
                    "branch": branch,
                    "queue_group": queue_group[0].name,
                    "mode_of_payment": mode_of_payment,
                    "primary_doctor": healthcare_practitioner,
                    "priority": priority,
                    "appointment": appointment_id,
                    "appointment_type": appointment_type,
                    "department": department,
                }
                patient_encounter = frappe.get_doc(data)
                patient_encounter.insert(ignore_permissions=True)
                frappe.db.commit()
                if station_entry_exists and station_entry:
                    if station_entry.station == patient_encounter.branch:
                        gch_queue.notify_queue(queue_group=queue_group[0].name)
                ENC_QUERY = f"""
                SELECT pq.priority,pq.patient,pq.patient_encounter,pq.creation, pq.modified
                FROM tabQueue as pq INNER JOIN `tabQueue Group` as qg
                ON qg.name = pq.queue_group INNER JOIN `tabPatient Encounter` as pe ON pe.name = pq.patient_encounter
                WHERE pe.workflow_state != "Encounter Closed" AND qg.service_unit = '{service_unit}' AND pe.branch = '{branch}' and pq.modified BETWEEN '{jana_}' AND '{leo_}' ORDER BY pq.modified;"""
                encounters_on_queue = frappe.db.sql(
                    ENC_QUERY,
                    as_dict=True,
                )
                current_queue = GCHPriorityQueue(policy="FIFO")
                for encounter in encounters_on_queue:
                    patient_priority = encounter.get("priority")
                    if patient_priority == "" or patient_priority == None:
                        patient_priority = 3
                    current_queue.push(
                        priority=int(patient_priority),
                        key=encounter.patient,
                        encounter_detail=encounter,
                    )
                current_position = (
                    list(current_queue.ordered_entries.keys()).index(
                        patient_encounter.patient
                    )
                    + 1
                )  # +1 because the queue starts at 0
                message = f'Hello {patient_.get("patient_name")}, you are position {current_position} in the {service_unit} queue at {patient_encounter.branch}'
                messaging.send_sms(
                    message=message,
                    recipient=phone_number,
                )
                context = {
                    "patient_encounter": patient_encounter,
                    "queue_position": current_position,
                }
                return context
        else:
            ...

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def check_doctor_queue():
        on_queue = frappe.db.sql(
            f"""SELECT * from tabQueue
        """,
            as_dict=True,
        )
        return on_queue

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def notify_queue(queue_group: str):
        """API to trigger realtime updates to the queue"""
        recipient = None
        recipients = []
        if queue_group is not None:
            try:
                qg = frappe.get_doc("Queue Group", queue_group)
                users = frappe.db.get_list(
                    "Practitioner Station Entry",
                    filters={"station": qg.service_unit},
                    fields=["name", "healthcare_practitioner", "user"],
                )
                for index, user in enumerate(users):
                    if user.healthcare_practitioner:
                        healthcare_practs = frappe.qb.DocType("Healthcare Practitioner")
                        healthcare_pract = (
                            frappe.qb.from_(healthcare_practs)
                            .select("*")
                            .where(
                                healthcare_practs.name == user.healthcare_practitioner
                            )
                            .run(as_dict=True)
                        )
                        if len(healthcare_pract) > 0:
                            if healthcare_pract[0].user_id:
                                recipient = healthcare_pract.user_id
                                recipients.append(recipient)
                    if user.user:
                        recipient = user.user
                        recipients.append(recipient)

                    frappe.publish_realtime(
                        "queue_updates",
                        {"service_unit": qg.service_unit, "last": True},
                        user=recipient,
                    )
                if recipient:
                    recipients.append(recipient)
                    recipient.append("last")
                    frappe.publish_realtime(
                        "queue_updates",
                        {"service_unit": qg.service_unit, "last": True},
                        user=recipient,
                    )
            except Exception as e:
                print(f"Exception: {str(e)}")
        return {"success": True}

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def fetch_practitioner_name(**args):
        try:
            practitioner = frappe.db.get_list(
                "Healthcare Practitioner",
                filters={"user_id": args["practitioner_email"]},
                fields=["name"],
            )
            return practitioner
        except Exception as e:
            return e


gch_queue = GCHQueueAPI()
