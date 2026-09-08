import frappe
from frappe import enqueue


class GCHTask:
    """Utility class to manage calls to the background task handler"""

    def __init__(self):
        ...

    def enqueue_send_encounter_to_labware(self, doc, event):
        """
        Sends Encounter to Labware
        """
        response = enqueue(
            "gch_custom.utils.patient_encounter.send_encounter",
            queue="long",
            doc=doc,
            event=event
        )
        return response

    def enqueue_prune_patient_records(self):
        """Enqueues prune patient records task"""
        response = enqueue(
            "gch_custom.utils.patients.clean_patients",
            queue="long",
            timeout=999999999999999999999999,
        )
        return response

    
    def enqueue_create_wellbaby(self, doc, event=None):
        """_summary_

        Args:
            doc (_type_): _description_
            event (_type_): _description_
        """
        print('Creating wellbaby task')
       
        response = enqueue(
            "gch_custom.utils.patients.create_wellbaby_schedule",
            doc=doc,
            event=event,
            queue="long"
        )
        print(response)
        return response
    
    # def enqueue_send_patient_data_to_labware(self, doc, event=None):
    #     """_summary_

    #     Args:
    #         doc (_type_): _description_
    #         event (_type_): _description_
    #     """
    #     print('Sending patient data to labware')
       
    #     response = enqueue(
    #         "gch_custom.utils.patient.send_patient_data_to_labware",
    #         doc=doc,
    #         event=event,
    #         queue="long"
    #     )
    #     print(response)
    #     return response


gch_tasks = GCHTask()
