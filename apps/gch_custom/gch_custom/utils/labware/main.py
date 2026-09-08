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

def send_encounter_to_labware(encounter: GCHPatientEncounter):
    """
    Sends Encounter to labware once it is opened for the first time.
    """
    from gch_middleware.utils.hl7.labware.service import gch_labware_service
   
    encounter_time = (
        str(encounter.creation)
        .split(".")[0]
        .replace("-", "")
        .replace(":", "")
        .replace(" ", "")
    )
    patient = frappe.get_doc("Patient", {"name": encounter.patient})
    creator = frappe.get_doc("User", {"name": encounter.owner})
    actor = None
    try:
        actor = frappe.session.user
    except:
        pass
    if not actor or actor == "Guest":
        actor = creator

    healthcare_practs = frappe.qb.DocType("Healthcare Practitioner")
    healthcare_pract = (
        frappe.qb.from_(healthcare_practs)
        .select("*")
        .where(healthcare_practs.user_id == actor)
        .run(as_dict=True)
    )
    user_ = [{"name": None}]
    if not healthcare_pract:
        users = frappe.qb.DocType("User")
        user_ = (
            frappe.qb.from_(users)
            .select("*")
            .where(users.name == actor)
            .run(as_dict=True)
        )

    station_entry_exists = (
        frappe.db.exists(
            {
                "doctype": "Practitioner Station Entry",
                "healthcare_practitioner": healthcare_pract[0].get("name"),
            }
        )
        if healthcare_pract
        else frappe.db.exists(
            {
                "doctype": "Practitioner Station Entry",
                "user": user_[0].get("name"),
            }
        )
    )
    station_entry = None
    if station_entry_exists is not None and len(station_entry_exists) > 0:
        station_entry = (
            frappe.get_doc(
                "Practitioner Station Entry",
                {"healthcare_practitioner": healthcare_pract[0].get("name")},
            )
            if healthcare_pract
            else frappe.get_doc(
                "Practitioner Station Entry",
                {"user": user_[0].get("name")},
            )
        )
    BRANCH = frappe.qb.DocType("Branch")
    branches = frappe.qb.from_(BRANCH).select("*").run(as_dict=True)
    branch = station_entry.branch if station_entry else branches[0].name
    frappe.db.set_value("Patient Encounter", encounter.name, 'branch', branch, update_modified=False)
    frappe.db.commit()

    # encounter.branch = branch
    # encounter.save(ignore_permissions=True)

    branch_ = frappe.get_doc("Branch", {"name": encounter.branch})
    try:
        response = gch_labware_service.register_patient(
            message_id=encounter.name,
            uhid=encounter.patient_uhid,
            first_name=patient.first_name,
            middle_name=patient.middle_name
            if patient.middle_name != "" or patient.middle_name != None
            else patient.last_name[0],
            last_name=patient.last_name,
            dob=patient.dob.strftime("%Y-%m-%d").replace("-", ""),
            gender=patient.sex[0],
            address=patient.town,
            country_code="001234567",
            phone_number=encounter.phone_number,
            multiple_birth_indicator="N",
            country_name="Kenya",
            patient_class="O",
            admission_type="C",
            hospital_service="M",
            encounter_number=encounter.name,
            admission_time=encounter_time,
            reason_for_admission="0101",
            expected_discharge_time=encounter_time,
            email_address=f"{patient.first_name}{patient.last_name}@gmail.com",
            sending_facility=branch_.branch_code,
        )
        # frappe.log_error(e, response)
    except Exception as e:
        frappe.log_error(
            e, f"Error in registering patient in labware service: {str(e)}"
        )
        ...

def send_to_labware(encounter: GCHPatientEncounter) -> bool:
    """Send Lab Test to Labware.

    Returns either True or False based on response from Labware.
    """
    from gch_middleware.utils.hl7.labware.service import gch_labware_service
    patient = encounter.patient
    location = encounter.branch
    practitioner = encounter.practitioner
    enc_branch = encounter.branch
    patient_history = encounter.patient_history
    clinical_notes = "Missing Clinical Notes"
    if len(patient_history) > 0:
        clinical_notes = patient_history[0].patient_encounter_chief_complaint if patient_history[0].patient_encounter_chief_complaint != "" and patient_history[0].patient_encounter_chief_complaint != None else "Clinical Notes Missing"    
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
    print(lab_prescriptions)
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
                clinical_notes=clinical_notes
            )
            print(sent)
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
                    print("ERRORs")
                    print(e)
            if sent is not None:
                print("SENT")
                batch_doc.db_set("status", "SENT")
                # Update each lab prescription and add the batch number and sent status
                for test in lab_tests:
                    tst_prescription = frappe.get_doc(
                        "Lab Prescription",
                        test.get("name"),
                    )
                    tst_prescription.db_set("sent", 1)
                    

                print("Successfully Sent")
                frappe.publish_realtime(event='eval_js', message='frappe.show_alert("{0}")'.format("Sent Lab Test"), user=frappe.session.user)

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
        print("No Labtest")
        return False

    return True

def send_to_labware_ip(inpatient: str) -> bool:
    """Send Lab Test to Labware.

    Returns either True or False based on response from Labware.
    """
    from gch_middleware.utils.hl7.labware.service import gch_labware_service # type: ignore

    inpatient_record = frappe.get_doc("Inpatient Record",inpatient)
    patient = inpatient_record.patient
    location = inpatient_record.branch
    practitioner = inpatient_record.primary_practitioner
    enc_branch = inpatient_record.branch
    patient_history = "History"
    clinical_notes = "Missing Clinical Notes"
    # if len(patient_history) > 0:
    #     clinical_notes = patient_history[0].patient_inpatient_record_chief_complaint if patient_history[0].patient_inpatient_record_chief_complaint != "" and patient_history[0].patient_inpatient_record_chief_complaint != None else "Clinical Notes Missing"    
    lab_prescriptions = frappe.db.get_list(
        "Lab Prescription",
        filters={"parent": inpatient, "sent": 0},
        fields=[
            "name",
            "lab_test_code",
            "lab_test_name",
            "assigned_test",
            "assigned_lab_test",
            "batch_number",
            "sent",
            "department"
        ],
    )
    lab_tests = []
    if not practitioner:
        frappe.throw("Primary practitioner is required")
    if inpatient_record.patient:
        patient = frappe.get_doc("Patient", {"name": inpatient_record.patient}, as_dict=1)
    if practitioner:
        practitioner = frappe.get_doc(
            "Healthcare Practitioner", {"name": practitioner}, as_dict=1
        )
    if enc_branch:
        branch = frappe.get_doc("Branch", {"name": enc_branch}, as_dict=1)
    else:
        frappe.throw('Encounter has no branch. Tests not sent to labware')
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
        practitioner_name = inpatient_record.practitioner_name
        practitioner_number = practitioner.healthcare_practitioner_number
    if len(lab_prescriptions) > 0:
        """
        keys = [lab_test['department'] for lab_test in lab_tests]
        new_dict = dict(zip(keys, lab_tests))
        """
        for lab_test in lab_prescriptions:
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
        frappe.log_error(departments,"Departments")
        frappe.log_error(lab_tests,"Tests")
        frappe.log_error(lab_prescriptions,"prescriptions")

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
                "is_inpatient": 1,
                "inpatient_record": inpatient_record.name,
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
                            inpatient_record.name,
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

            # reload the inpatient_record to get the saved lab tests. IMPORTANT.
            inpatient_record.reload()
            
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
                inpatient_record_number=inpatient_record.name,
                practitioner_number=practitioner_number,
                practitioner_name=practitioner_name,
                lab_tests=lab_tests,
                sending_facility=branch.branch_code,
                clinical_notes=clinical_notes
            )
            print(sent)
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
                    print("ERRORs")
                    print(e)
            if sent is not None:
                print("SENT")
                batch_doc.db_set("status", "SENT")
                # Update each lab prescription and add the batch number and sent status
                for test in lab_tests:
                    tst_prescription = frappe.get_doc(
                        "Lab Prescription",
                        test.get("name"),
                    )
                    tst_prescription.db_set("sent", 1)
                    

                print("Successfully Sent")
                frappe.publish_realtime(event='eval_js', message='frappe.show_alert("{0}")'.format("Sent Lab Test"), user=frappe.session.user)

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
        print("No Labtest")
        return False

    return True

