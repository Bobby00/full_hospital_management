from dataclasses import dataclass


@dataclass
class Paths:
    RECEPTION_PATH: str = "/app/receptionist-dashboard"
    DOCTOR_PATH: str = "/app/doctor-dashboard"
    NURSE_PATH: str = "/app/nurse-dashboard"
    SET_STATION_PATH: str = "/app/set-station"
