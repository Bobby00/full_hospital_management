import requests
from requests.auth import HTTPBasicAuth
import json
import uuid


# API Name: “GERTIS-TEST”
# API-KEY: “TiT0U.rgE92HbeyX7hU#”

"""

1.        http://192.168.1.221:91/api/v1/en-US/patient/patient-create/

2.        http://192.168.1.221:91/api/v1/en-US/patient/patient-modify/  

3.        http://192.168.1.221:91/api/v1/en-US/service/service-request/

4.        http://192.168.1.221:91/api/v1/en-US/service/service-update/  

 
"""


class Pacs:
    def __init__(
        self,
        version: str = "v1",
        language: str = "en-US",
        client: str = "eGERTIES-TEST",
        api_key: str = "RvtPcfYtWN46vn8Uzf3f",
        baseurl: str = "http://192.168.1.221:91",
    ):
        self._version = version
        self._language = language
        self._client = client
        self._api_key = api_key
        self._baseurl = baseurl
        self.patient_uhid = "EGH012121"
        self.headers = {
            "Content-Type": "application/json",
        }

    def create_appointment(self):
        """
        Creates appointment for service.

        request body
        ============
        {
            "resourceType": "Appointment",
            "id": "MessageId",
            "text": {
                "status": "generated"
            },
            "status": "booked",
            "serviceType": [
                {
                "coding": [
                    {
                    "code": "DR",
                    "display": "Digital Radiography"
                    }
                ]
                }
            ],
            "specialty": [
                {
                "coding": [
                    {
                    "code": "10001",
                    "display": "Chest X-Ray (PA)"
                    }
                ]
                }
            ],
            "priority": "N",
            "description": "LT Chest pain for 2/7",
            "start": "2020-10-10T09:00:00Z",
            "end": "2020-10-10T11:00:00Z",
            "created": "2020-10-09",
            "comment": "No preparation.",
            "basedOn": [
                {
                "reference": "AccessionNumber/AccessionNumber"
                }
            ],
            "participant": [
                {
                "actor": {
                    "reference": "Patient/MedicalRecordNumber",
                    "display": "PatientLastName^PatientFirstName^PatientOtherName"
                }
                },
                {
                "actor": {
                    "reference": "Practitioner/DoctorCode",
                    "display": "DoctorName"
                }
                },
                {
                "actor": {
                    "reference": "Location/RequestingDepartmentCode",
                    "display": "RequestingDepartmentName"
                }
                }
            ]
            }
            Successful Response
            ============
            {
                "status": "OK",
                "body": {
                    "resourceType": "AppointmentResponse",
                    "id": "MessageId",
                    "requestIdentifier": {
                    "value": "RequisitionNumber"
                    },
                    "code": {
                    "coding": [
                        {
                        "value": "ReferenceNumber",
                        "accessionNumber": "AccessionNumber"
                        }
                    ]
                    },
                    "requisitionStatus": "accepted"
                }
            }

            Error Response
            ============
            {
                "status": "ERROR",
                "errors": {
                    "resourceType": "AppointmentResponse",
                    "id": "MessageId",
                    "referenceIdentifier": {
                    "value": "AccessionNumber"
                    },
                    "requisitionStatus": "rejected",
                    "message": "ErrorMessage"
                }
            }

            Fail Response
            ============
            {
                "status": "Fail",
                "errors": {
                    "code": "ErrorCode",
                    "message": "ErrorMessage"
                }
            }

        """
        payload = {
            "resourceType": "Appointment",
            "id": str(uuid.uuid4()).replace("-", ""),
            "text": {"status": "generated"},
            "status": "booked",
            "serviceType": [
                {"coding": [{"code": "DR", "display": "Digital Radiography"}]}
            ],
            "specialty": [
                {"coding": [{"code": "10001", "display": "Chest X-Ray (PA)"}]}
            ],
            "priority": "N",
            "description": "LT Chest pain for 2/7",
            "start": "2023-05-25T09:00:00Z",
            "end": "2023-05-25T11:00:00Z",
            "created": "2023-05-25",
            "comment": "No preparation.",
            "basedOn": [{"reference": "AccessionNumber/AccessionNumber"}],
            "participant": [
                {
                    "actor": {
                        "reference": "Patient/MedicalRecordNumber",
                        "display": "PatientLastName^PatientFirstName^PatientOtherName",
                    }
                },
                {
                    "actor": {
                        "reference": "Practitioner/DoctorCode",
                        "display": "DoctorName",
                    }
                },
                {
                    "actor": {
                        "reference": "Location/RequestingDepartmentCode",
                        "display": "RequestingDepartmentName",
                    }
                },
            ],
        }
        try:
            r = requests.post(self._baseurl, json=payload, headers=self.headers)
            response = r.json()
        except Exception as e:
            return {"error": True}
        return response

    def modify_appointment(self):
        """
        Modifies appointment for service

        request body
        ============
        {
            "resourceType": "Appointment",
            "id": "MessageId",
            "text": {
                "status": "modify"
            },
            "status": "arrived",
            "serviceType": [
                {
                "coding": [
                    {
                    "code": "DR",
                    "display": "Digital Radiography"
                    }
                ]
                }
            ],
            "specialty": [
                {
                "coding": [
                    {
                    "code": "10001",
                    "display": "Chest X-Ray (PA)"
                    }
                ]
                }
            ],
            "priority": "N",
            "description": "LT Chest pain for 2/7",
            "start": "2020-10-10T09:00:00Z",
            "end": "2020-10-10T11:00:00Z",
            "created": "2020-10-10",
            "comment": "Arrived",
            "basedOn": [
                {
                "reference": "AccessionNumber/AccessionNumber",
                "requestIdentifier": "RequisitionNumber"
                }
            ],
            "participant": [
                {
                "actor": {
                    "reference": "Patient/MedicalRecordNumber",
                    "display": "PatientLastName^PatientFirstName^PatientOtherName"
                }
                },
                {
                "actor": {
                    "reference": "Practitioner/DoctorCode",
                    "display": "DoctorName"
                }
                },
                {
                "actor": {
                    "reference": "Location/RequestingDepartmentCode",
                    "display": "RequestingDepartmentName"
                }
                }
            ]
            }

            Successful Response
            ============
            {
                "status": "OK",
                "body": {
                    "resourceType": "AppointmentResponse",
                    "id": "MessageId",
                    "requestIdentifier": {
                    "value": "RequisitionNumber"
                    },
                    "code": {
                    "coding": [
                        {
                        "value": "ReferenceNumber",
                        "accessionNumber": "AccessionNumber"
                        }
                    ]
                    },
                    "requisitionStatus": "accepted"
                }
            }

            Error Response
            ============
            {
                "status": "ERROR",
                "errors": {
                    "resourceType": "AppointmentResponse",
                    "id": "MessageId",
                    "referenceIdentifier": {
                    "value": "AccessionNumber"
                    },
                    "requisitionStatus": "rejected",
                    "message": "ErrorMessage"
                }
            }

            Fail Response
            ============
            {
                "status": "Fail",
                "errors": {
                    "code": "ErrorCode",
                    "message": "ErrorMessage"
                }
            }
        """
        payload = {}
        try:
            r = requests.post(self._baseurl, json=payload, headers=self.headers)
            response = r.json()
        except Exception as e:
            return {"error": True}
        return response

    def create_patient(self):
        """
        Creates a patient
        """
        payload = {
            "resourceType": "Patient",
            "id": str(uuid.uuid4()).replace("-", ""),
            "text": {"status": "generated"},
            "identifier": [
                {
                    "use": "usual",
                    "type": {
                        "coding": [
                            {"system": "http://hl7.org/fhir/v2/0203", "code": "MR"}
                        ]
                    },
                    "system": "eGERTIES-TEST",
                    "value": self.patient_uhid,
                    "period": {"start": "2023-05-25"},
                    "assigner": {"display": "eGERTIES-TEST"},
                }
            ],
            "name": [
                {"use": "official", "family": "Nyende", "given": ["Ebenezer", "Shalom"]}
            ],
            "telecom": [
                {"system": "phone", "value": "+254722001002", "use": "mobile"},
            ],
            "gender": "M",
            "birthDate": "19942205",
            "vip": False,
            "allergy": [],
            "address": [
                {
                    "use": "home",
                    "line": ["Address"],
                    "city": "City/Town",
                    "postalCode": "PostalCode",
                }
            ],
            "contact": [{"relationship": "", "name": "", "telecom": "", "address": []}],
            "active": True,
            "client": "eGERTIES-TEST",
            "api_key": "RvtPcfYtWN46vn8Uzf3f",
        }
        try:
            r = requests.post(
                f"{self._baseurl}/api/{self._version}/{self._language}/patient/patient-create/",
                json=payload,
                headers=self.headers,
            )
            response = r.json()
        except Exception as e:
            print(e)
            return {"error": True}
        return response

    def modify_patient(self):
        # medical_record_number = "6ee59f44"
        payload = {
            "resourceType": "Patient",
            "id": str(uuid.uuid4()).replace("-", ""),
            "text": {"status": "modify"},
            "identifier": [
                {
                    "use": "usual",
                    "type": {
                        "coding": [
                            {"system": "http://hl7.org/fhir/v2/0203", "code": "MR"}
                        ]
                    },
                    "system": "eGERTIES-TEST",
                    "value": self.patient_uhid,
                    "period": {"start": "20230525"},
                    "assigner": {"display": "eGERTIES"},
                }
            ],
            "name": [
                {
                    "use": "official",
                    "family": "Nyende",
                    "given": ["Shalom", "Ebenezer"],
                }
            ],
            "telecom": [
                {"system": "phone", "value": "+254711497350", "use": "mobile"},
            ],
            "gender": "M",
            "birthDate": "19942205",
            "deceasedBoolean": False,
            "vip": False,
            "allergy": [],
            "address": [
                {
                    "use": "home",
                    "line": ["Address"],
                    "city": "City/Town",
                    "postalCode": "PostalCode",
                }
            ],
            "contact": [{"relationship": "", "name": "", "telecom": "", "address": []}],
            "active": True,
            "client": self._client,
            "api_key": self._api_key,
        }
        try:
            r = requests.post(
                f"{self._baseurl}/api/{self._version}/{self._language}/patient/patient-modify/",
                json=payload,
                headers=self.headers,
            )
            response = r.json()
        except Exception as e:
            print(e)
            return {"error": True}
        return response

    def create_service_request(self):
        payload = {
            "resourceType": "ServiceRequest",
            "subject": "Radiology",
            "id": "MessageId",
            "text": {"status": "generated"},
            "status": "generated",
            "intent": "order",
            "groupIdentifier": {
                "system": "KRANIUM",
                "value": "RequisitionNumber",
                "department": "DepartmentCode^DepartmentName",
                "physician": "RequestingPhysicianCode^RequestingPhysicianName",
                "description": "RequestDescription",
                "clinicalNotes": "clinicalNotes",
            },
            "participant": [
                {
                    "actor": {
                        "reference": "patient",
                        "code": "MedicalRecordNumber",
                        "display": "PatientLastName^PatientFirstName^PatientOtherName",
                    }
                },
                {},
                {
                    "actor": {
                        "reference": "Location",
                        "code": "RequestingDepartmentCode",
                        "display": "RequestingDepartmentName",
                    }
                },
            ],
            "code": {
                "coding": [
                    {
                        "system": "KRANIUM",
                        "value": "ReferenceNumber",
                        "code": "ExamCode",
                        "display": "ExamName",
                        "priority": "Priority",
                        "description": "ExamDescription",
                        "clinicalNotes": "clinicalNotes",
                        "status": "proposed|draft|planned|requested|received|accepted|in- progress|review|completed|cancelled|suspended|rejected|failed",
                        "price": "amountChargesForExam",
                    }
                ]
            },
            "client": "eGERTIES-TEST",
            "api_key": "RvtPcfYtWN46vn8Uzf3f",
        }
        try:
            r = requests.post(f"{self._baseurl}/api/{self._version}/{self._language}/service/service-request/", json=payload, headers=self.headers)
            response = r.json()
        except Exception as e:
            return {"error": True}
        return response

    def cancel_service_request(self):
        payload = {}
        try:
            r = requests.post(self._baseurl, json=payload, headers=self.headers)
            response = r.json()
        except Exception as e:
            return {"error": True}
        return response

    def get_result(self):
        payload = {}
        try:
            r = requests.post(self._baseurl, json=payload, headers=self.headers)
            response = r.json()
        except Exception as e:
            return {"error": True}
        return response
