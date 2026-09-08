import requests
from requests.auth import HTTPBasicAuth
import json
import uuid
import frappe


# API Name: “GERTIS-TEST”
# API-KEY: “TiT0U.rgE92HbeyX7hU#”

"""

1.        http://192.168.1.221:91/api/v1/en-US/patient/patient-create/

2.        http://192.168.1.221:91/api/v1/en-US/patient/patient-modify/  

3.        http://192.168.1.221:91/api/v1/en-US/service/service-request/

4.        http://192.168.1.221:91/api/v1/en-US/service/service-update/  

 
"""

version: str = "v1"
language: str = "en-US"
client: str = "eGERTIES-TEST"
api_key: str = "RvtPcfYtWN46vn8Uzf3f"
baseurl: str = "192.168.1.221:91"
headers = {
            "Content-Type": "application/json"
        }

@frappe.whitelist(allow_guest=True)
def create_service_request():
    frappe.log_error("create_service_request")
    payload = {
        "resourceType": "ServiceRequest",
        "subject": "Radiology",
        "id": str(uuid.uuid4()).replace("-", ""),
        "text": {"status": "generated"},
        "status": "generated",
        "intent": "order",
        "groupIdentifier": {
            "system": "eGERTIES-TEST",
            "value": str(uuid.uuid4()).replace("-", ""),
            "department": "X-Ray^X-Ray",
            "physician": "HLC-PRAC-2022-00005^DR Jacqueline Chitte",
            "description": "RequestDescription",
            "clinicalNotes": "clinicalNotes here",
        },
        "participant": [
            {
                "actor": {
                    "reference": "patient",
                    "code": "patient_uhid",
                    "display": "Nyende^Ebenezer^Shalom",
                }
            },
            {
                "actor": {
                    "reference": "Practitioner",
                    "code": "HLC-PRAC-2022-00005",
                    "display": "DR Jacqueline Chitte",
                }
            },
            {
                "actor": {
                    "reference": "Location",
                    "code": "X-Ray",
                    "display": "X-Ray",
                }
            },
        ],
        "code": {
            "coding": [
                {
                    "system": "eGERTIES-TEST",
                    "value": str(uuid.uuid4()).replace("-", ""),
                    "code": "PNS",
                    "display": "PNS X RAY",
                    "priority": "N",
                    "description": "ExamDescription",
                    "clinicalNotes": "clinicalNotes",
                    "status": "proposed",
                    "price": "10.00",
                }
            ]
        },
        "client": "eGERTIES-TEST",
        "api_key": "RvtPcfYtWN46vn8Uzf3f",
    }
    frappe.log_error(payload)
    try:
        formatted_url = baseurl + '/api' + version + '/'+ language + '/service/service-request/'
        r = requests.post(
            formatted_url,
            json=payload,
            headers=headers,
        )
        frappe.log_error(r.text)
        response = r.json()
        return response
    except Exception as e:
        print(e)
        frappe.log_error(e,"Error sending to Pacs   ")
        return {"error": True}
    return response

class Pacs:
    def __init__(
        self,
        version: str = "v1",
        language: str = "en-US",
        client: str = "eGERTIES-TEST",
        api_key: str = "RvtPcfYtWN46vn8Uzf3f",
        baseurl: str = "http://192.168.5.221:91",
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
        self.logged_in = False

    def create_appointment(self, payload: dict):
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

    def create_patient(self, payload: dict) -> tuple[bool, dict]:
        """
        Creates a patient in RIS/PACS.

        Args:
            payload (dict): A dictionary containing the patient details for creation.

        Returns:
            tuple: A tuple containing a boolean indicating the success status and a dictionary
                with the response data. The response data contains either the created patient
                information or an error message.

        """
        patient_uhid = payload.get("patient_uhid", "EGH012121")
        is_active = payload.get("is_active", True)
        first_name = payload.get("first_name", "Shalom")
        last_name = payload.get("last_name", "Nyende")
        middle_name = payload.get("middle_name", f"{first_name}[0]{last_name}[0]")
        start_date = payload.get("start_date", "20023-05-25")
        mobile_phone = payload.get("mobile_phone", "+254711497350")
        patient_gender = payload.get("gender", "M")
        birth_date = payload.get("birth_date", "19942205")
        is_vip = payload.get("is_vip", False)
        allergies = payload.get("allergies", [])
        patient_address = payload.get("patient_address", [])
        patient_city = payload.get("patient_city", "Nairobi")
        patient_postal_code = payload.get("patient_postal_code", "00100")
        next_of_kin = payload.get("next_of_kin", {})
        next_of_kin_name = next_of_kin.get("name", "")
        next_of_kin_relationship = next_of_kin.get("relationship", "")
        next_of_kin_phone = next_of_kin.get("next_of_kin_phone", "")
        next_of_kin_address = next_of_kin.get("next_of_kin_address", [])

        patient_payload = {
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
                    "system": self._client,
                    "value": patient_uhid,
                    "period": {"start": start_date},
                    "assigner": {"display": self._client},
                }
            ],
            "name": [
                {
                    "use": "official",
                    "family": last_name,
                    "given": [first_name, middle_name],
                }
            ],
            "telecom": [
                {"system": "phone", "value": mobile_phone, "use": "mobile"},
            ],
            "gender": patient_gender,
            "birthDate": birth_date,
            "vip": is_vip,
            "allergy": allergies,
            "address": [
                {
                    "use": "home",
                    "line": [patient_address],
                    "city": patient_city,
                    "postalCode": patient_postal_code,
                }
            ],
            "contact": [
                {
                    "relationship": next_of_kin_relationship,
                    "name": next_of_kin_name,
                    "telecom": next_of_kin_phone,
                    "address": next_of_kin_address,
                }
            ],
            "active": is_active,
            "client": self._client,
            "api_key": self._api_key,
        }
        try:
            r = requests.post(
                f"{self._baseurl}/api/{self._version}/{self._language}/patient/patient-create/",
                json=patient_payload,
                headers=self.headers,
            )
            response = True, r.json()
        except Exception as e:
            print(e)
            response = False, {"error": True, "message": str(e)}
        return response

    def modify_patient(self):
        medical_record_number = "6ee59f44"
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
                    "city": "City Town",
                    "postalCode": "123464",
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
            print(r.text)
            response = r.json()
        except Exception as e:
            print(e)
            return {"error": True}
        return response

    def create_service_request(self):
        payload = {
            "resourceType": "ServiceRequest",
            "subject": "Radiology",
            "id": str(uuid.uuid4()).replace("-", ""),
            "text": {"status": "generated"},
            "status": "generated",
            "intent": "order",
            "groupIdentifier": {
                "system": "eGERTIES-TEST",
                "value": str(uuid.uuid4()).replace("-", ""),
                "department": "X-Ray^X-Ray",
                "physician": "HLC-PRAC-2022-00005^DR Jacqueline Chitte",
                "description": "RequestDescription",
                "clinicalNotes": "clinicalNotes here",
            },
            "participant": [
                {
                    "actor": {
                        "reference": "patient",
                        "code": self.patient_uhid,
                        "display": "Nyende^Ebenezer^Shalom",
                    }
                },
                {
                    "actor": {
                        "reference": "Practitioner",
                        "code": "HLC-PRAC-2022-00005",
                        "display": "DR Jacqueline Chitte",
                    }
                },
                {
                    "actor": {
                        "reference": "Location",
                        "code": "X-Ray",
                        "display": "X-Ray",
                    }
                },
            ],
            "code": {
                "coding": [
                    {
                        "system": "eGERTIES-TEST",
                        "value": str(uuid.uuid4()).replace("-", ""),
                        "code": "PNS",
                        "display": "PNS X RAY",
                        "priority": "N",
                        "description": "ExamDescription",
                        "clinicalNotes": "clinicalNotes",
                        "status": "proposed",
                        "price": "10.00",
                    }
                ]
            },
            "client": "eGERTIES-TEST",
            "api_key": "RvtPcfYtWN46vn8Uzf3f",
        }
        try:
            r = requests.post(
                f"{self._baseurl}/api/{self._version}/{self._language}/service/service-request/",
                json=payload,
                headers=self.headers,
            )
            print(r.text)
            response = r.json()
        except Exception as e:
            print(e)
            return {"error": True}
        return response

    def cancel_service_request(self):
        payload = {
            "resourceType": "ServiceRequest",
            "subject": "Radiology",
            "id": str(uuid.uuid4()).replace("-", ""),
            "text": {"status": "generated"},
            "status": "generated",
            "intent": "cancel",
            "groupIdentifier": {
                "system": "eGERTIES-TEST",
                "value": str(uuid.uuid4()).replace("-", ""),
                "description": "ReasonForCancelling",
            },
            "client": "eGERTIES-TEST",
            "api_key": "RvtPcfYtWN46vn8Uzf3f",
        }
        try:
            r = requests.post(f"{self._baseurl}/api/{self._version}/{self._language}/service/service-update/", json=payload, headers=self.headers)
            response = r.json()
            print(response)
        except Exception as e:
            print(e)
            return {"error": True}
        return response

    def get_result(self):
        payload = {}
        try:
            r = requests.post(self._baseurl, json=payload, headers=self.headers)
            response = r.json()
            print(response)
        except Exception as e:
            print(e)
            return {"error": True}
        return response


if __name__ == "__main__":
    p = Pacs()
    # p.create_service_request()
    p.cancel_service_request()
