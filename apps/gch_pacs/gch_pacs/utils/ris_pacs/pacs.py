import frappe
import requests
import json
import uuid


version: str = "v1"
language: str = "en-US"
client: str = "eGERTIES-TEST"
api_key: str = "RvtPcfYtWN46vn8Uzf3f"
baseurl: str = "http://192.168.1.221:91"
headers = {
            "Content-Type": "application/json"
        }


class PacsController:
    @frappe.whitelist(allow_guest=True)
    def create_service_request(
        patient_uhid: str,
        request_id: str,
        request_pacs_id: str,
        department: str,
        physician: str,
        description: str,
        clinical_notes: str,
        location: str,
        price: str = '1',
    ):
        try:
            patient = frappe.get_doc("Patient", {"uhid_code": patient_uhid})
            practitioner = frappe.get_doc("Healthcare Practitioner", physician)
            radiology_request = frappe.get_doc(
                "Radiology Prescriptions",
                request_id
            )   
            frappe.log_error({"Patient": patient, "Practitioner": practitioner, "Radiology Request": radiology_request}, "Elements")

            if patient is None or practitioner is None or radiology_request is None:
                frappe.log_error({"Patient": patient, "Practitioner": practitioner, "Radiology Request": radiology_request}, "Elements")
                frappe.msgprint("Patient, Practitioner, or Radiology Request not found.")
                return {"message": False}
            
            payload = {
                "resourceType": "ServiceRequest",
                "subject": "Radiology",
                "id": request_id,
                "text": {
                    "status": "generated",
                },
                "status": "generated",
                "intent": "order",
                "groupIdentifier": {
                    "system": client,
                    "value": request_id,
                    "department": department,
                    "physician": physician,
                    "description": description,
                    "clinicalNotes": clinical_notes,
                },
                "participant": [
                    {
                        "actor": {
                            "reference": "patient",
                            "code": patient_uhid,
                            "display": patient.name,
                        }
                    },
                    {
                        "actor": {
                            "reference": "practitioner",
                            "code": practitioner.name,
                            "display": practitioner.name,
                        }
                    },
                    {
                        "actor": {
                            "reference": "location",
                            "code": location,
                            "display": location,
                        }
                    }
                ],
                "code": {
                    "coding": [
                        {
                            "system": client,
                            "value": request_id,
                            "code": radiology_request.test_name,
                            "display": radiology_request.test_name,
                            "priority": "N",
                            "description": radiology_request.test_name,
                            "clinicalNotes": clinical_notes,
                            "status": "requested",
                            "price": price,
                        }
                    ]
                },
                "client": client,
                "api_key": api_key,
            }
            frappe.log_error(payload,"Pacs payload")     
            try:
                formatted_url = baseurl + '/api/' + version + '/'+ language + '/service/service-request/'

                    
                r = requests.post(
                    formatted_url,
                    json=payload,
                    headers=headers,
                )
                r.raise_for_status()
                response = r.json()
                response["message"] = True
                return response
            except requests.exceptions.HTTPError as e:
                if r.status_code == 400:
                    response = r.json()
                    response["message"] = False
                    return response
                elif r.status_code == 200:
                    response = r.json()
                    response["message"] = True
                    return response
                else:
                    frappe.log_error(e,"Error sending service request to pacs/ pacs.py")
                    return {"message":False}
            except Exception as err:
                frappe.log_error(e,"Error creating service request on pacs not httpp error")
                return {"message":False}
        except Exception as e:
                frappe.log_error(e,"Error creating service request on pacs presend")
                return {"message":False}
        

    @frappe.whitelist(allow_guest=True)
    def cancel_services_request():
        payload = {
            "resourceType": "ServiceRequest",
            "subject" : "Radiology",
            "id": "MessageId",
            "text": {
            "status": "generated"
            },
            "status": "generated",
            "intent": "cancel",
            "groupIdentifier": {
            "system": "HIS",
            "value": "RequisitionNumber",
            "description": "ReasonForCancelling"
            },
            "client": "clientName",
            "api_key": "apiKey"
        }
        formatted_url = baseurl + '/api/' + version + '/'+ language + '/service/service-request/'

        res = requests.post(formatted_url, json=payload, headers=headers)
        response = res.json()
        return response
        
    @frappe.whitelist(allow_guest=True)
    def create_or_update_patient(
        uhid,
        first_name: str,
        middle_name: str,
        last_name: str,
        mobile_number: str,
        gender: str,
        birthdate: str,
        vip: int = 0,
        allergy: object = None,
        type: str = "generated"
    ):
        """
        Creates a patient
        """
        try:
            if gender == "Male":
                formated_gender = "M"
            elif gender == "Female":
                formated_gender = "F"
            else:
                formated_gender = "O"
            payload = {
                "resourceType": "Patient",
                "id": uhid,
                "text": {"status": "generated"},
                "identifier": [
                    {
                        "use": "usual",
                        "type": {
                            "coding": [
                                {"system": "http://hl7.org/fhir/v2/0203", "code": "MR"}
                            ]
                        },
                        "system": client,
                        "value": uhid,
                        "period": {"start": "20240726"},
                        "assigner": {"display": client},
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
                    {
                        "system": "phone",
                        "value": mobile_number,
                        "use": "mobile",
                    }
                ],
                "gender": formated_gender,
                "birthDate": birthdate,
                "vip": vip,
                "allergy": allergy,
                "active": True,
                "client": client,
                "api_key": api_key,            
            }
            r = requests.post(
                f"{baseurl}/api/{version}/{language}/patient/patient-create/",
                json=payload,
                headers=headers,
            )
            r.raise_for_status()
            response = r.json()
            response['message'] = True
            return response
        except requests.exceptions.HTTPError as err:
            if r.status_code == 400:
                response = r.json()
                response['message'] = True
                return response
            else:
                frappe.log_error("Error sending to Pacs",err)
                return {"message": False}
        except Exception as err:
            frappe.log_error("Error creating patient on pacs", err)
            return {"message": False}
       
    @frappe.whitelist(allow_guest=True)
    def update_patient_details(uhid: str):
        """
        Send <update patient request to pacs>
        """

        patient = frappe.get_doc()
        payload = {
            "resourceType": "Patient",
            "id": "MessageId",
            "text": {
            "status": "modify"
            },
            "identifier": [
                {
                    "use": "usual",
                    "type": {
                    "coding": [
                    {
                    "system": "http://hl7.org/fhir/v2/0203",
                    "code": "MR"
                    }
                    ]
                    },
                    "system": "HIS",
                    "value": "MedicalRecordNumber",
                    "period": {
                    "start": "Date"
                    },
                    "assigner": {
                    "display": "HIS"
                    }
                }
            ],
            "name": [
                {
                    "use": "official",
                    "family": "LastName",
                    "given": [
                    "FirstName",
                    "OtherName"
                    ]
                }
            ],
            "telecom": [
                {
                    "system": "phone",
                    "value": "+254 722001002",
                    "use": "mobile"
                },
                {
                    "system": "email",
                    "value": "john.doe@example.org",
                    "use": "home"
                }
            ],
            "gender": "Gender",
            "birthDate": "DateOfBirth",
            "deceasedBoolean": 0,
            "vip": 0,
            "allergy": [],
            "address": [
                {
                    "use": "home",
                    "line": [
                        "Address"
                    ],
                    "city": "City/Town",
                    "postalCode": "PostalCode"
                }
            ],
            "contact": [
                {
                    "relationship": "",
                    "name": "",
                    "telecom": "",
                    "address": []
                }
            ],
            "active": 1,
            "client": "clientName",
            "api_key": "apiKey"
        }

    @frappe.whitelist(allow_guest=True)
    def receive_results(request_id: str):
        """
        Receive results from pacs
        """
        pass
    

    @frappe.whitelist(allow_guest=True)
    def test_apis():
        try:
            r = requests.get('https://dogapi.dog/api/v2/breeds')
            r.raise_for_status()
            response = r.json()
            return response
        except requests.exceptions.ConnectionError as errc:
                frappe.log_error(errc, "Connection Error")
                return {"error": "Connection Error"}
        except requests.exceptions.Timeout as errt:
            frappe.log_error(errt, "Timeout Error")
            return {"error": "Timeout Error"}
        except requests.exceptions.RequestException as err:
            frappe.log_error(err, "Request Exception")
            return {"error": "Request Exception"}