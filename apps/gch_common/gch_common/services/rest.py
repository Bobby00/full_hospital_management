import frappe
from typing import Union
from gch_common.utils import patient_record


class GCHCommonAPI:
    def __init__(self):
        ...

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def render_matching_patients(
        patient_name: str, dob: str = None
    ) -> Union[list, None]:
        """
        Render Matching Patient Records if any, given a string for the patient name and a DOB string.

        """
        matching_records: Union[list, None] = patient_record.find_patient_record(
            patient_name=patient_name, dob=dob
        )
        return matching_records


gch_common_api = GCHCommonAPI()
