from dataclasses import dataclass

from typing import List, Dict, Any

@dataclass
class PatientPayload:
    resourceType: str
    id: str
    text: Dict[str, str]
    identifier: List[Dict[str, Any]]
    name: List[Dict[str, Any]]
    telecom: List[Dict[str, str]]
    gender: str
    birthDate: str
    vip: bool
    allergy: List[Any]
    address: List[Dict[str, str]]
    contact: List[Dict[str, Any]]
    active: bool