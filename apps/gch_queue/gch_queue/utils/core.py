# Core utility

from gch_queue.utils.constants import QueueConstants
from typing import Any, Tuple
from decouple import config
import frappe
from heapq import heapify, heappush, heappushpop
import phonenumbers
import itertools
import requests


class QueueUtility:
    def __init__(self) -> None:
        """ """
        self.pq = []  # list of entries arranged in a heap
        self.entry_finder = {}  # mapping of patients to entries
        self.REMOVED = "<removed-patient>"  # placeholder for a removed patient
        self.counter = itertools.count()  # unique sequence count

    def add_patient_to_queue(self, patient, priority=0):
        """
        Add a new patient or update the priority of an existing patient"""
        if patient in self.entry_finder:
            self.remove_patient(patient)
        count = next(self.counter)
        entry = [priority, count, patient]
        self.entry_finder[patient] = entry
        heappush(self.pq, entry)

    def remove_patient(self, patient):
        """
        Mark an existing patient as REMOVED.  Raise KeyError if not found.
        """
        entry = self.entry_finder.pop(patient)
        entry[-1] = self.REMOVED
        

    def list_patients(self):
        """
        List Patients
        """

        return sorted(self.pq)

    def pop_patient(self):
        """
        Remove patients
        """
        while self.pq:
            priority, count, patient = self.heappop(self.pq)
            if patient is not self.REMOVED:
                del self.entry_finder[patient]
                return patient
        raise KeyError("pop from an empty PriorityQueue")

    def add_patient_to_triage_queue(
        self, patient_pk, queue_group, patient_encounter, queue_position
    ):

        status = "Waiting"

        patient_queue_record = frappe.get_doc(
            {
                "doctype": "Queue",
                "patient": patient_pk,
                "queue_group": queue_group,
                "patient_encounter": patient_encounter,
                "queue_position": queue_position,
                "status": status,
            }
        )

        patient_queue_record.insert()
        frappe.db.commit()

        return True

    def change_encounter_type(self, doc, handler=None):

        new_queue_group = doc.queue_group

        queue_item = frappe.db.sql(
            f"""SELECT name, queue_group FROM `tabQueue` WHERE patient_encounter='{doc.name}';""",
            as_dict=True,
        )

        if doc.is_emergency == 1:
            # queue_item = frappe.db.sql(f"""SELECT name, queue_group FROM `tabQueue` WHERE patient_encounter='{doc.name}';""", as_dict=True)

            queue_group = frappe.db.sql(
                f"""SELECT queue_type FROM `tabQueue Group` WHERE name='{queue_item[0].queue_group}';""",
                as_dict=True,
            )

            if queue_group[0].queue_type == "Normal":

                # Queue position will be at the front of the queue
                current_queue_items = frappe.db.sql(
                    f"""SELECT name, queue_position FROM `tabQueue`;""", as_dict=True
                )

                # Check for emergencies in the table
                emergencies_in_queue = frappe.db.sql(
                    f""" SELECT queue_position FROM `tabQueue` AS table1 LEFT JOIN `tabQueue Group` AS table2 ON table1.queue_group = table2.name WHERE table2.queue_type='Emergency';"""
                )

                if emergencies_in_queue:
                    # Get the largest number in the emergency queue
                    largest_emergency_number = max(emergencies_in_queue)
                    new_queue_position = largest_emergency_number[0] + 1

                    non_emergencies_in_queue = frappe.db.sql(
                        f""" SELECT table1.name, queue_position FROM `tabQueue` AS table1 LEFT JOIN `tabQueue Group` AS table2 ON table1.queue_group = table2.name WHERE table2.queue_type='Normal';""",
                        as_dict=True,
                    )

                    for item in non_emergencies_in_queue:
                        update_current_queue = frappe.db.sql(
                            f"""UPDATE `tabQueue` SET queue_position={item.queue_position + 1} WHERE name='{item.name}';"""
                        )
                        frappe.db.commit()

                else:
                    new_queue_position = 1

                    for item in current_queue_items:
                        update_current_queue = frappe.db.sql(
                            f"""UPDATE `tabQueue` SET queue_position={item.queue_position + 1} WHERE name='{item.name}';"""
                        )
                        frappe.db.commit()

                queue_position = new_queue_position

                update_current_queue = frappe.db.sql(
                    f"""UPDATE `tabQueue` SET queue_position={queue_position} WHERE name='{queue_item[0].name}';"""
                )
                frappe.db.commit()

                # Update queue group to the appropriate category

            else:
                frappe.throw("Already Emergency")

                return False
        else:

            last_queue_item = frappe.db.sql(
                f"""SELECT MAX(queue_position) as last_item_in_queue FROM `tabQueue` WHERE queue_group='{new_queue_group}';""",
                as_dict=True,
            )

            if last_queue_item[0].last_item_in_queue == None:
                queue_position = 1
            else:
                queue_position = int(last_queue_item[0].last_item_in_queue) + 1

            if doc.workflow_state != "Pending Triage":
                update_current_queue = frappe.db.sql(
                    f"""UPDATE `tabQueue` SET queue_group='{new_queue_group}', status='{doc.workflow_state}', queue_position='{queue_position}' WHERE name='{queue_item[0].name}';"""
                )
                frappe.db.commit()

                return True

            else:
                return False




queue_utility = QueueUtility()
