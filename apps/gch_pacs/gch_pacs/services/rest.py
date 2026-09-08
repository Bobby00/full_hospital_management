import frappe

logger = frappe.logger("gch_pacs", allow_site=True, with_more_info=True, file_count=50)


class RISPACS:
    def __init__(self, *args, **kwargs):
        ...

    def register_patient(self, patient_uhid) -> str:
        """Register a patient in RIS PACS
        """
        ...