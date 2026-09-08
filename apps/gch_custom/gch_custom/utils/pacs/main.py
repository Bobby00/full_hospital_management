from typing import Any
import frappe

from gch_custom.overrides.patient_encounter import GCHPatientEncounter


class GCHPACSUtil:
    def __init__(self):
        ...


    def send_to_pacs(self, encounter: GCHPatientEncounter, *args, **kwargs) -> Any:
        """Util to send an encounter details to PACS

        Args:
            encounter (GCHPatientEncounter): Patient Encounter to send to PACS
        """
        ...


gch_pacs = GCHPACSUtil()


@frappe.whitelist(allow_guest=True)
def create_patient_on_pac(patient:str):
    """
    Create Patients on pacs
    """
    patient = frappe.get_doc("Patient", patient)
    return patient


@frappe.whitelist(allow_guest=True)
def send_to_pacs(encounter: GCHPatientEncounter) -> Any:
    """
    Util to send an encounter details to PACS
    """
    from gch_pacs.utils.ris_pacs import create_patient, create_request

    encounter = frappe.get_doc("Patient Encounter", encounter)
    patient_ = frappe.get_doc("Patient", encounter.patient)
    # prescribing_doctor=frappe.get_doc("Healthcare Practitioner", encounter.practitioner)
    radiology_test_list = encounter.radiology_details
    if radiology_test_list:

        uhid: str = patient_.uhid_code
        first_name: str = patient_.first_name
        last_name: str = patient_.last_name
        middle_name: str = patient_.middle_name
        gender: str = patient_.sex
        dob: str = patient_.dob
        mobile_number: str = "0712345678"
        clinical_notes: str = "Test Clinical Notes"

        dob_str = str(dob)
        birthdate = dob_str.replace("-", "")
        vip = patient_.is_vip_patient

        if patient_.sent_to_pacs == 0:
            adt = create_patient(
                uhid,
                first_name,
                middle_name,
                last_name,
                mobile_number,
                gender,
                birthdate,
                vip
            )

            if adt:
                frappe.log_error(adt,"Pacs error")
                if adt['status'] == "OK" or adt['status'] == "ERROR":

                    frappe.db.set_value(
                        "Patient",
                        patient_.name,{
                            "sent_to_pacs": 1
                        },
                        update_modified=False,
                    )
                    frappe.db.commit()

                    for test in radiology_test_list:
                        if test.sent_to_pacs == 0:
                            test_price = test.price
                            price = str(test_price)
                            created_request = create_request(
                                uhid,
                                test.name,
                                test.name,
                                test.department,
                                encounter.practitioner,
                                test.test_name,
                                test.comment,
                                encounter.branch,
                                price,
                            )
                            frappe.log_error(created_request,"created_request here")

                            # Handle success and fails
                            if 'status' in created_request:
                                if created_request['status'] == 'OK':
                                    coding_list = created_request.get('body', {}).get('code', {}).get('coding', [])
                                    accession_number = coding_list[0][0].get('accessionNumber')  
                                    message = created_request.get('message')
                                    if coding_list and coding_list[0]:
                                        accession_number = coding_list[0][0].get('accessionNumber')                        
                                        if accession_number:
                                            test = frappe.get_doc("Radiology Prescriptions", test.name)
                                            test.accessionnumber = accession_number
                                            test.sent_to_pacs = 1
                                            test.save()
                                    return True
                                elif created_request['status'] == 'ERROR':
                                    errors = created_request['errors']
                                    error_id = errors.get('id')
                                    requisition_status = errors.get('requisitionStatus')
                                    actors_issue = errors.get('actors')

                                    frappe.log_error(errors,"Request to pacs declined")
                                    frappe.throw(actors_issue + '. Kindly consult IT for assistance')
                                    return False
                                else:
                                    frappe.log_error(created_request,"Error while creating pacs request")
                                    frappe.throw('Error while creating pacs request. Please try again')
                                    return False

                            # coding_list = created_request.get('body', {}).get('code', {}).get('coding', [])
                            # accession_number = coding_list[0][0].get('accessionNumber')  
                            # message = created_request.get('message')
                            # frappe.log_error({'message':message,'coding_list': coding_list,'accessionNumber': accession_number},'Pacs response')
                            # if message:
                            #     coding_list = created_request.get('body', {}).get('code', {}).get('coding', [])
                            #     if coding_list and coding_list[0]:
                            #         accession_number = coding_list[0][0].get('accessionNumber')  
                            #         frappe.log_error(accession_number, 'accession Number')                         
                            #         if accession_number:
                            #             test = frappe.get_doc("Radiology Prescriptions", test.name)
                            #             test.accessionnumber = accession_number
                            #             test.sent_to_pacs = 1
                            #             test.save()
                            # elif message is False:
                            #     frappe.log_error(
                            #         created_request,
                            #         "Request to pacs declined",
                            #     )
                            else:
                                frappe.log_error(
                                    created_request,
                                    "Error sending request to PACS",
                                )
                                return {"message": False}
                else:
                    frappe.msgprint(
                        "error",
                        "Error creating patient on PACS",
                    )
                    frappe.log_error(adt,f"Error creating patient  on pacs")
                    return {"message": False}
            else:
                frappe.msgprint(
                    "error",
                    "Error creating patient on PACS",
                )
                return {"message": False}
        else:
            for test in radiology_test_list:
                if test.sent_to_pacs == 0:
                    test_price = test.price
                    price = str(test_price)
                    created_request = create_request(
                        uhid,
                        test.name,
                        test.name,
                        test.department,
                        encounter.practitioner,
                        test.test_name,
                        test.comment,
                        encounter.branch,
                        price,
                    )
                    frappe.log_error(created_request,"created_request here")

                    # Handle success and fails
                    if 'status' in created_request:
                        if created_request['status'] == 'OK':
                            coding_list = created_request.get('body', {}).get('code', {}).get('coding', [])
                            accession_number = coding_list[0][0].get('accessionNumber')  
                            message = created_request.get('message')
                            if coding_list and coding_list[0]:
                                accession_number = coding_list[0][0].get('accessionNumber')                        
                                if accession_number:
                                    test = frappe.get_doc("Radiology Prescriptions", test.name)
                                    test.accessionnumber = accession_number
                                    test.sent_to_pacs = 1
                                    test.save()
                            return True
                        elif created_request['status'] == 'ERROR':
                            errors = created_request['errors']
                            error_id = errors.get('id')
                            requisition_status = errors.get('requisitionStatus')
                            actors_issue = errors.get('actors')

                            frappe.log_error(errors,"Request to pacs declined")
                            frappe.throw(actors_issue + '. Kindly consult IT for assistance')
                            return False
                        else:
                            frappe.log_error(created_request,"Error while creating pacs request")
                            frappe.throw('Error while creating pacs request. Please try again')
                            return False
                    # coding_list = created_request.get('body', {}).get('code', {}).get('coding', [])
                    # accession_number = coding_list[0][0].get('accessionNumber')  
                    # message = created_request.get('message')
                    # frappe.log_error({'message':message,'coding_list': coding_list,'accessionNumber': accession_number},'Pacs response')
                    # message = created_request.get('message')
                    # if message:                        
                    #     if accession_number:
                    #         test = frappe.get_doc("Radiology Prescriptions", test.name)
                    #         test.accessionnumber = accession_number
                    #         test.sent_to_pacs = 1
                    #         test.save()
                    # elif message is False:
                    #     frappe.log_error(
                    #         created_request,
                    #         "Request to pacs declined",
                    #     )
                    else:
                        frappe.log_error(
                            created_request,
                            "Error sending request to PACS",
                        )
                        return {"message": False}

