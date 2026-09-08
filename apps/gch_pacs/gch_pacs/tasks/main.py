import frappe
from frappe import enqueue


class PACSTask:
    """Utility class to manage calls to the background task handler"""

    def __init__(self):
        ...

    def enqueue_pacs_create_patient(self, doc, event=None):
        """Enqueues PACS create patient task
        
        Args:
            doc (_type_): _description_
            event (_type_): _description_
        """

        response = enqueue(
            "gch_pacs.utils.patients.clean_patients",
            queue="long",
            timeout=999999999999999999999999,
        )
        return response
