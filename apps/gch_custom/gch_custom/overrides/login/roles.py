from dataclasses import dataclass


@dataclass
class Roles:
    """Role Mapping
    """
    SYSTEM_MANAGER: str = "System Manager"
    GCH_RECEPTION: str = "GCH-Reception"
    GCH_NURSE: str = "GCH-Nurse"
    GCH_TRIAGE_NURSE: str = "GCH-TriageNurse"
    GCH_DOCTOR: str = "GCH-Doctor"
    GCH_PHARMACY: str = "GCH-Pharmacy"
    GCH_LAB_TECHNICIAN: str = "GCH-LabTechnician"