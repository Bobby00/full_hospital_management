from typing import Dict, Tuple

import frappe
from gch_custom.overrides.patient_encounter import GCHPatientEncounter


class GCHCommonUtils:
    """A collection of common utilities in use across the GCH ecosystem

    1. get_practitioner

    2. check open encounters
    """

    def __init__(self) -> None:

        ...

    def has_open_encounters(self, patient: str) -> Tuple[bool, Dict]:
        """Check whether Patient object does have an open encounter

        Args:
            patient (str): The Patient in Question

        Returns:
            Tuple[bool, Dict]: True or False (Patient has open encounter), Patient Encounter object (An empty Dict if no open encounters found)
        """
        has_open_encounter = False
        open_encounters = None
        try:
            has_open_encounter = frappe.db.exists(
                "Patient Encounter", {"patient": patient, "docstatus": 0}
            )

        except:
            pass
        if has_open_encounter:
            open_encounters = frappe.db.get_value(
                "Patient Encounter",
                {"patient": patient, "docstatus": 0},
                ["name", "patient", "encounter_date", "encounter_time"],
            )
            has_open_encounter_ = True
        else:
            has_open_encounter_ = False
        return has_open_encounter_, open_encounters

    def get_practitioner(self, email: str) -> Tuple[bool, Dict]:
        """Retrieve Healthcare Practitioner DocType given their email

        Args:
            email (str): [description]

        Returns:
            Tuple[bool, Dict]: [description]

        Healthcare Practitioner is linked to User

        1. Retrieve User
        2. Retrieve Healthcare Practitioner whose `user_id` attribute is the User email
        """
        healthcare_practitioner = None
        try:
            user = frappe.get_doc("User", {"email": email})
        except (frappe.DoesNotExistError, Exception):
            return False, {}

        if user:
            healthcare_practitioner = frappe.db.get_values(
                "Healthcare Practitioner",
                {"user_id": user.email},
                [
                    "name",
                    "first_name",
                    "middle_name",
                    "last_name",
                    "practitioner_name",
                    "gender",
                    "mobile_phone",
                    "user_id",
                    "department",
                    "designation",
                ],
                as_dict=1,
            )

        return True, healthcare_practitioner

    def encounter_workflow_handler(self, encounter:GCHPatientEncounter, action:str, *args, **kwargs) -> None:
        """Util to handle Queues on Patient Encounter Workflow change

        Args:
            encounter (GCHPatientEncounter): _description_
            action (str): _description_
        """
        from gch_queue.services import add

        phone = encounter.phone_number
        patient = encounter.patient
        priority = encounter.priority
        is_priority_patient = encounter.is_priority_patient
        is_emergency_patient = encounter.is_emergency_patient

        qg_service_unit = frappe.db.get_value(
            "Queue Group",
            {"name": encounter.queue_group},
            ["service_unit",],
            as_dict=1,
        )
        if qg_service_unit is not None:
            qg_service_unit = qg_service_unit.get("service_unit")
            added = add(patient_id=patient, phone=phone, service_unit=qg_service_unit, priority=priority)
        ...


common = GCHCommonUtils()
