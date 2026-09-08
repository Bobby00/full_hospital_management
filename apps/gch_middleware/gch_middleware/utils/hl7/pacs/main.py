import datetime
from typing import Any, List, Tuple
import frappe
import hl7apy
from hl7apy.core import Message
from hl7apy.exceptions import UnsupportedVersion
from hl7apy.parser import parse_message

class PACSHL7Wrapper:
    def __init__(self) -> None:
        pass

    def send_to_pacs(self, encounter: Any, *args, **kwargs) -> Any:
        """Util to send an encounter details to PACS

        Args:
            encounter (GCHPatientEncounter): Patient Encounter to send to PACS
        """
        pass