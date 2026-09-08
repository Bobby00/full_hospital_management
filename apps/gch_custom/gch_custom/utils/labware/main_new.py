import email
from typing import Any
import frappe

from gch_custom.services.rest import get_encounter_lab_tests, create_lab_test

from gch_custom.overrides.patient_encounter import GCHPatientEncounter

def map_results_to_lab_test(batch_number, result_document) -> Any:
    """Maps the results to the lab test."""
    batch_lab_tests = frappe.db.get_all(
                    "Lab Test", filters={"batch": batch_number}
                )
    for batch_lab_test in batch_lab_tests:
    
        b_lab_test = frappe.get_doc("Lab Test", {"name":batch_lab_test.name})
        try:
            b_lab_test.db_set("result_document_url", result_document)
        except Exception as e:
            print(e)
        print(f"FINAL: {b_lab_test.result_document_url}")


def send_to_labware(encounter: GCHPatientEncounter) -> bool:
    """Send Lab Test to Labware. 

    Returns either True or False based on response from Labware.
    """
    from gch_middleware.utils.hl7.labware.service import gch_labware_service
    patient = encounter.patient
    location = encounter.branch
    practitioner = encounter.practitioner
    enc_branch = encounter.branch
    lab_prescriptions = frappe.db.get_list(
        "Lab Prescription",
        filters={"parent": encounter, "parentfield": "lab_test_prescription"},
        fields=[
            "name",
            "lab_test_code",
            "lab_test_name",
            "assigned_test",
            "assigned_lab_test",
            "batch_number"
        ],
    )
    lab_tests = []
    if not encounter.practitioner:
        frappe.throw("Practitioner is required")
    if encounter.patient:
        patient = frappe.get_doc("Patient", {"name": encounter.patient}, as_dict=1)
    if encounter.practitioner:
        practitioner = frappe.get_doc(
            "Healthcare Practitioner", {"name": encounter.practitioner}, as_dict=1
        )
    if enc_branch:
        branch = frappe.get_doc("Branch", {"name": encounter.branch}, as_dict=1)
    if patient:
        first_name = patient.first_name
        middle_name = patient.middle_name
        last_name = patient.last_name
        uhid = patient.uhid_code
        dob = patient.dob
        gender = patient.sex
        phone_number = patient.phone
        email_address = patient.email

    if practitioner:
        practitioner_name = encounter.practitioner_name
        practitioner_number = practitioner.healthcare_practitioner_number
    if len(encounter.lab_test_prescription) > 0:
        """
        keys = [lab_test['department'] for lab_test in lab_tests]
        new_dict = dict(zip(keys, lab_tests))
        """
        for lab_test in encounter.lab_test_prescription:
            # print(lab_test.lab_test_code, lab_test.lab_test_name, lab_test.department)
            lb = {
                "name": lab_test.name,
                "item_code": lab_test.lab_test_code,
                "item_name": lab_test.lab_test_name,
                "department": lab_test.department,
                "assigned_lab_test": lab_test.assigned_lab_test,
                "comment": lab_test.lab_test_comment
            }
            if lab_test.sent != 1:
                lab_tests.append(lb)

        batches = []

        """
        
        [
            {
                'department': 'Humanology', 'lab_tests': [{'item_code': 'Test', 'item_name': 'Test Test', 'department': 'Humanology'}]
            }, 
            {
                'department': 'Hematology', 'lab_tests': [{'item_code': '_haem58', 'item_name': 'Mucus Test', 'department': 'Hematology'}, {'item_code': '_haem66', 'item_name': 'Another Haem One', 'department': 'Hematology'}]
            }, 
            {
                'department': 'Lab', 'lab_tests': [{'item_code': 'H', 'item_name': 'Hematology', 'department': 'Lab'}]
            }
        ]
        """

        departments = [lab_test["department"] for lab_test in lab_tests]
        # print(set(departments))

        for department in set(departments):
            department_tests = [
                lab_test
                for lab_test in lab_tests
                if lab_test.get("department") == department
            ]
            batches.append({"department": department, "lab_tests": department_tests})

        for batch in batches:
            department = batch.get("department")
            lab_tests = batch.get("lab_tests")
            dept = frappe.get_doc("Medical Department", {"name": department}, as_dict=1)

            # Create Batch
            created_batch = {
                "doctype": "Lab Test Batch",
                "patient_encounter": encounter.name,
                "department": dept.name,
                "status": "CREATED",
            }

            batch_doc = frappe.get_doc(created_batch)
            batch_doc.insert()
            for lab_test in lab_tests: 
                if lab_test.get("assigned_lab_test") != None and lab_test.get("assigned_lab_test") != "":        
                
                    enc_lab_test = frappe.get_doc("Lab Test", lab_test.get("assigned_lab_test"))
                    enc_lab_test.db_set("batch", batch_doc.name)
                    enc_lab_test.db_set("batch_number", batch_doc.name)
                else:
                    # Create the Lab Test
                    created_tests = ""
                    lab_presc = frappe.get_doc(
                    "Lab Prescription", lab_test.get("name"))
                    if lab_presc.assigned_test != 1:
                        created_lab_test = create_lab_test(
                            patient.name,
                            lab_presc.lab_test_code,
                            encounter.name,
                            lab_prescription=lab_presc.name,
                        )
                        
                        frappe.db.set_value(
                            "Lab Prescription",
                            lab_presc.name,
                            {
                                "assigned_lab_test": created_lab_test.name,
                                "assigned_test": 1,
                                "lab_test_created": 1,
                            },
                        )
                        print(created_lab_test)

            # reload the encounter to get the saved lab tests. IMPORTANT.
            encounter.reload()
            sent = gch_labware_service.request_lab(
                message_id=batch_doc.name,
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
                uhid=uhid,
                dob=dob,
                gender=gender,
                location=location,
                phone_number=phone_number,
                email_address=email_address,
                encounter_number=encounter.name,
                practitioner_number=practitioner_number,
                practitioner_name=practitioner_name,
                lab_tests=lab_tests,
                sending_facility=branch.branch_code,
            )
            for test in lab_tests:
                try:

                    tst_prescription = frappe.get_doc(
                        "Lab Prescription",
                        test.get("name"),  
                    )
                    tst_prescription.db_set("batch_number", batch_doc.name)
                    print("Setting Batch Number")
                    print(tst_prescription.batch_number)

                except Exception as e:
                    print(e)
            if sent is not None:
                batch_doc.db_set("status", "SENT")
                # Update each lab prescription and add the batch number and sent status
                for test in lab_tests:
                    tst_prescription = frappe.get_doc(
                        "Lab Prescription",
                        test.get("name"),  
                    )
                    tst_prescription.db_set("sent", 1)

                print("Successfully Sent")
                # return True
            else:
                print("NOT SENT")
                print(sent)
                batch_doc.db_set("status", "FAILED")
                for test in lab_tests:
                    try:
                        tst_prescription = frappe.get_doc(
                        "Lab Prescription",
                        test.get("name"),  
                    )
                        tst_prescription.db_set("sent", 0)
                    except Exception as e:
                        print(e)
                # return False
    else:
        # print("No Labtest")
        return False
    return False
