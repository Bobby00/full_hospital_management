import json
import sys
from typing import Dict, List, Any
from unittest import case

from gch_custom.services.erp_mpesa import get_mpesa_settings, initiate_mpesa
from gch_custom.overrides.login.paths import Paths
from gch_custom.services.workflow_controller import WorkflowController
from .mpesa import Mpesa
from .absa_pdq import ABSA_PDQ
from erpnext.accounts.utils import (
    get_outstanding_invoices,
    get_account_currency,
    get_balance_on,
)
from .workflow_handler import WFStates, wf_handler
import uuid
import frappe
import random
from gch_messaging.utils.constants import MessagingConstants
from gch_messaging.utils.core import messaging
import random
from frappe import msgprint, _
import datetime
from frappe.utils import now, get_datetime, unique, date_diff
from . import tools
from erpnext import get_default_company
import re
from erpnext.healthcare.doctype.patient.patient import Patient

from frappe.desk.reportview import get_filters_cond, get_match_cond


company = frappe.defaults.get_global_default("company")

index_g = company.find('Gert')
if index_g != -1:
    suffix = " - GCH"
index_w = company.find('Wema')
if index_w != -1:
    suffix = " - W"

def cleanNumber(x):
    num = str(x)
    cleanNum = num
    b = re.search("^254", num)
    if b:
        z = re.split("^254", num)
        cleanNum = z[1]

    a = re.search("^0", num)
    if a:
        x = re.split("^0", num)
        cleanNum = x[1]
    return cleanNum


# frappe.utils.logger.set_log_level("DEBUG")
logger = frappe.logger("api", allow_site=True, file_count=50)


class GCHAPI:
    @frappe.whitelist(allow_guest=True)
    def update_encounter(data=None, users=None, encounter=None, modified_by=None):
        print(f"USERS: {users}")
        if users and len(users) > 0:
            [
                frappe.publish_realtime(
                    "patient_encounter_updates",
                    {"data": data, "encounter": encounter, "modified_by": modified_by},
                    user=user,
                )
                for user in users
            ]
        else:
            frappe.publish_realtime(
                "patient_encounter_updates",
                {"data": data, "encounter": encounter, "modified_by": modified_by},
            )

        return

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def update_save_from_kranium(data):
        """
        {
            "location": 10,
            "uhid": 207309,
            "registration_date": "2010-12-13T10:27:51",
            "first_name": "Ryee",
            "middle_name": "Kimani ",
            "last_name": "Maina",
            "date_birth": "2010-10-30",
            "address_1": "KASARANI ",
            "address_2": "",
            "phone": "0726168248",
            "cellphone": "0715235311",
            "gender": "Male",
            "title": "Master",
            "status": "normal",
            "email": "kgerties@gmail.com",
            "address": "KASARANI ",
            "cell_phone": "0715235311"
        }

        Args:
            data (_type_): _description_
        """

        patient_info = json.loads(data)
        print(patient_info)
        uhid = patient_info.get("uhid")
        first_name = patient_info.get("first_name")
        middle_name = patient_info.get("middle_name")
        last_name = patient_info.get("last_name")
        date_of_birth = patient_info.get("date_birth")
        address = patient_info.get("address")
        phone = patient_info.get("phone")
        gender = patient_info.get("gender")
        email = patient_info.get("email")
        country_code = patient_info.get("country_code")

        patients = frappe.qb.DocType("Patient")
        patient = (
            frappe.qb.from_(patients)
            .select("*")
            .where((patients.uhid_code == uhid) | (patients.kranium_uhid == uhid))
            .run(as_dict=True)
        )
        if patient:
            # Update Patient
            patient = patient[0]
            patient["first_name"] = first_name
            patient["middle_name"] = middle_name
            patient["last_name"] = last_name
            patient["dob"] = date_of_birth
            patient["address"] = address
            patient["phone"] = phone
            patient["sex"] = gender
            patient["email"] = email
            patient["country_code"] = country_code
            patient["kranium_uhid"] = uhid
            # Save patient
            frappe.get_doc(patient).save()

        if not patient:
            new_patient = {
                "doctype": "Patient",
                "country_code": country_code,
                "first_name": first_name,
                "middle_name": middle_name,
                "last_name": last_name,
                "dob": date_of_birth,
                "address": address,
                "phone": phone,
                "sex": gender,
                "kranium_uhid": uhid,
            }
            doc = frappe.get_doc(new_patient)
            doc.insert(ignore_permissions=True, ignore_mandatory=True)
        return {"patient": patient}

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def send_labtest(encounter_number: str):
        """_summary_

        Args:
            encounter_number (str): _description_

        Returns:
            _type_: _description_
        """
        from gch_custom.utils.labware.main import send_to_labware
        created_tests = ""
        try:
            current_encounter: GCHPatientEncounter = frappe.get_doc(
                "Patient Encounter", encounter_number
            )
            patient = current_encounter.patient
            patient_ = frappe.get_doc("Patient", patient)
            lab_prescriptions = frappe.db.get_list(
                "Lab Prescription",
                filters={
                    "parent": encounter_number,
                    "parentfield": "lab_test_prescription",
                },
                fields=[
                    "name",
                    "lab_test_code",
                    "lab_test_name",
                    "assigned_test",
                    "assigned_lab_test",
                ],
            )
            for lab_prescription in lab_prescriptions:
                lab_presc = frappe.get_doc("Lab Prescription", lab_prescription.name)
                if lab_presc.assigned_test != 1:
                    created_lab_test = create_lab_test(
                        patient,
                        lab_presc.lab_test_code,
                        encounter_number,
                        lab_prescription=lab_presc.name,
                    )
                    # created_tests += lab_prescription.lab_test_code + ","
                    try:
                        lab_presc.db_set("assigned_test", 1)
                        lab_presc.db_set("lab_test_created", 1)
                        lab_presc.db_set("assigned_lab_test", created_lab_test.name)
                        frappe.db.set_value(
                            "Lab Prescription",
                            lab_prescription.name,
                            {
                                "assigned_lab_test": created_lab_test.name,
                                "assigned_test": 1,
                                "lab_test_created": 1,
                            },
                            update_modified=False,
                        )
                        frappe.db.commit()
                        lab_presc.reload()
                    except Exception as e:
                        frappe.log_error(e, "Labware ORM Error")
                        print("ERROR:", e)
                        return {"sent": False}

            # reload the encounter to get the saved lab tests. IMPORTANT.
            current_encounter.reload()

            sent = send_to_labware(current_encounter)
            print("SENT: ", sent)
        except Exception as error:
            print(error)
            frappe.log_error(error, "Labware ORM Error")
            sent = False
        return {"sent": sent}

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def send_adt(encounter_number: str):
        """_summary_

        Args:
            encounter_number (str): _description_

        Returns:
            _type_: _description_
        """
        encounter = frappe.get_doc("Patient Encounter", encounter_number)
        from gch_middleware.utils.hl7.labware.service import gch_labware_service

        encounter_time = (
            str(encounter.creation)
            .split(".")[0]
            .replace("-", "")
            .replace(":", "")
            .replace(" ", "")
        )
        logger.info(encounter.creation)
        logger.info(encounter_time)
        patient: Patient = frappe.get_doc("Patient", {"name": encounter.patient})
        try:
            branch = frappe.get_doc("Branch", {"name": encounter.branch})
        except Exception as error:
            return None

        response = {}
        # return {}
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
                sending_facility=branch.branch_code,
            )
            print(response)
            if response is not None:
                frappe.publish_realtime(
                    event="eval_js",
                    message='frappe.show_alert("{0}")'.format("Sent ADT to Labware"),
                    user=frappe.session.user,
                )
            else:
                frappe.publish_realtime(
                    event="eval_js",
                    message='frappe.show_alert("{0}")'.format(
                        "Failed to send ADT to Labware"
                    ),
                    user=frappe.session.user,
                )
        except Exception as e:
            logger.info(str(e))
            from gch_sentry.utils import capture_exception

            capture_exception("Error", str(e))
            return {"error": str(e)}
            ...
        return {"response": response}

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def ldap_login():
        """
        Custom login method for LDAP
        """
        # LDAP LOGIN LOGIC
        args = frappe.form_dict
        ldap = frappe.get_doc("LDAP Settings")

        user = ldap.authenticate(
            frappe.as_unicode(args.usr), frappe.as_unicode(args.pwd)
        )

        frappe.local.login_manager.user = user.name
        # if should_run_2fa(user.name):
        #     authenticate_for_2factor(user.name)
        #     if not confirm_otp_token(frappe.local.login_manager):
        #         return False
        frappe.local.login_manager.post_login()
        # Set the home_page response attr to `/app/set-statio` to allow LDAP users to select where they are stationed.
        frappe.local.response["home_page"] = Paths.SET_STATION_PATH

        # because of a GET request!
        frappe.db.commit()

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def generate_otp(phone_number, country_code) -> Dict:
        """
        Generates OTP and sends it to the provided phone number
        """

        try:
            # Query parent with the mibile number
            patient_details = frappe.db.sql(
                f"""SELECT first_name, name FROM `tabParent` WHERE  phone_number={cleanNumber(phone_number)};""",
                as_dict=True,
            )

            if patient_details:
                # Generate the OTP
                otp = random.randint(1000, 9999)
                status_code = MessagingConstants.SUCCESS

                # Update parent record, insert OTP value
                frappe.db.sql(
                    f"""UPDATE `tabParent` SET otp={otp} WHERE  phone_number={cleanNumber(phone_number)};"""
                )
                frappe.db.commit()

                # Send the message
                message = f"Use this as your GCH Code: {otp}"
                sent, resp = messaging.send_sms(
                    recipient="254" + cleanNumber(phone_number), message=message
                )

                body = (
                    f"An OTP code has been sent to {phone_number}"
                    if sent
                    else f"OTP not sent"
                )
            else:
                status_code = MessagingConstants.NOT_FOUND
                body = f"Sorry, your record is not found. Please visit Gertrude's Children's Hospital for registration.{cleanNumber(phone_number)}"
            response = dict(status_code=status_code, body=body)
            return response
        except Exception as e:
            return dict(body="Failed to complete your request at this time")

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def get_parent_details(phone_number: str, otp: str = None) -> Dict:
        """
        Fetches Parent Details given a Parent's phone number
        """
        QUERY = f"""SELECT first_name, last_name, phone_number FROM `tabParent` WHERE phone_number={cleanNumber(phone_number)} AND otp={otp};"""

        try:
            # Query patient with the mobile number
            parent_details = frappe.db.sql(
                QUERY,
                as_dict=True,
            )

            if parent_details:
                status_code = MessagingConstants.SUCCESS
                body = parent_details
                response = dict(status_code=status_code, body=body)
            else:
                status_code = (MessagingConstants.NOT_FOUND,)
                body = "Sorry, we cannot find this record!."
                response = dict(status_code=status_code, body=body)
        except Exception as e:
            frappe.log_error(e, "REST ERROR  /rest.py")
            response = dict(
                status_code=400,
                body="Failed to fetch your details at this moment. Try again later",
            )
        return response

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def query_patient_by_uhid(uhid: str) -> Dict:
        patient = frappe.db.sql(
            f"""SELECT patient_name, uhid_code, uhid, sex, blood_group FROM `tabPatient` WHERE uhid_code={uhid};""",
            as_dict=True,
        )

        if patient:
            service_units = frappe.db.sql(
                f""" SELECT name, healthcare_service_unit_name FROM `tabHealthcare Service Unit` """,
                as_dict=True,
            )
            status_code = MessagingConstants.SUCCESS
            body = service_units, patient
        else:
            status_code = (MessagingConstants.NOT_FOUND,)
            body = "Sorry, we cannot find this record!."
        response = dict(status_code=status_code, body=body)
        return response

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def query_children(phone_number: str) -> Dict:
        """Query Children associated with parent given parent's phone"""
        parent = frappe.db.sql(
            f"""SELECT * from tabParent where phone_number={cleanNumber(phone_number)}""",
            as_dict=1,
        )

        if not parent:
            status_code = MessagingConstants.NOT_FOUND
            body = f"Parent record with phone number {phone_number} not found"

        if parent:
            CHILDREN_BY_PHONE_QUERY = (
                "SELECT parent.full_phone_number, patient.patient_name, patient.sex, "
                "patient.blood_group, patient.dob, patient.uhid_code, patient.image, "
                "patient.marital_status, patient_details, uhid_code "
                "from tabPatient as patient INNER JOIN `tabPatient Parents Detail` as patd "
                "on patient.patient_name=patd.parent LEFT JOIN tabParent as parent on patd.parents=parent.name "
                "WHERE parent.full_phone_number LIKE '%{phone_number}%'"
            )
            children = frappe.db.sql(
                CHILDREN_BY_PHONE_QUERY.format(phone_number=phone_number), as_dict=True
            )
            status_code = MessagingConstants.SUCCESS
            body = children
        response = dict(status_code=status_code, body=body)
        return response

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def get_treatment_guidelines(codes: List, *args) -> Dict:
        """Retrieves GCH Standard Treatment Guidelines for given diagnosis codes

        Args:
            codes (List): list of diagnosis codes

        Returns:
            Dict: Dictionary containing the treatment guidelines
        """
        codes = json.loads(codes)
        codes = codes.get("codes", [])

        if len(codes) < 1:
            return {}

        code_templates = frappe.get_all(
            "GCH Standard Treatment Guideline",
            filters=[["code", "in", codes]],
            fields="*",
            as_list=0,
        )
        response = {
            "template_guidelines": code_templates,
        }
        return response

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def get_encounter_diagnoses(encounter_number: str):
        encounter = frappe.get_doc("Patient Encounter", encounter_number)
        standard_templates = []
        encounter_info = encounter.as_dict()
        patient = encounter_info.get("patient")
        patient_info = frappe.get_doc("Patient", patient)
        diagnoses = encounter_info.get("diagnosis_table")
        drug_allergies = encounter_info.get("drug_allergy")
        food_allergies = encounter_info.get("food_allergy")

        enc_info = encounter_info = {
            "has_no_food_allergy": encounter_info.get("has_no_food_allergy")
        }

        """
        [
            {
                'name': '7176318ba4', 
                'owner': 'Administrator', 
                'creation': datetime.datetime(2021, 9, 3, 13, 26, 14, 796395), 
                'modified': datetime.datetime(2021, 9, 3, 13, 42, 41, 408513), 
                'modified_by': 'Administrator', 
                'parent': 'HLC-ENC-2021-00001', 
                'parentfield': 'diagnosis_table', 
                'parenttype': 'Patient Encounter', 
                'idx': 1, 
                'docstatus': 0, 
                'medical_code': 'ICD-11 1B12.4Z', 
                'code': '1B12.4Z', 
                'description': 'Tuberculosis of the musculoskeletal system, unspecified', 
                'doctype': 'Codification Table'
            }, 
            {
                'name': '1bc6ecee97', 
                'owner': 'Administrator', 
                'creation': datetime.datetime(2021, 9, 3, 13, 26, 14, 796395), 
                'modified': datetime.datetime(2021, 9, 3, 13, 42, 41, 408513), 
                'modified_by': 'Administrator', 
                'parent': 'HLC-ENC-2021-00001', 
                'parentfield': 'diagnosis_table', 
                'parenttype': 'Patient Encounter', 
                'idx': 2, 
                'docstatus': 0, 
                'medical_code': 'ICD-11 1B13', 
                'code': '1B13', 
                'description': 'Miliary tuberculosis', 
                'doctype': 'Codification Table'
            }
        ]
       
        """
        codes = [diag.get("code") for diag in diagnoses]

        code_templates = frappe.get_all(
            "GCH Standard Treatment Guideline",
            filters=[["code", "in", codes]],
            fields="*",
            as_list=0,
        )
        response = {
            "encounter_diagnoses": diagnoses,
            "template_guidelines": code_templates,
            "food_allergies": food_allergies,
            "drug_allergies": drug_allergies,
            "patient_info": patient_info,
            "allergy_info": enc_info,
        }

        return response

    def get_nursing_ward_occupancy(self, nursing_ward: str) -> Dict:
        """
        Retrieves occupancy of a ward.
        """
        # if nursing_ward and nursing_ward != "":
        ward = frappe.get_doc("Nursing Ward", nursing_ward)
        print(ward)
        beds = frappe.db.get_list(
            "Nursing Ward Bed",
            filters={"nursing_ward": ward.name},
            fields=[
                "bed_type",
                "bed_number",
                "ward_room",
                "is_occupied",
                "is_locked",
                "nursing_ward",
            ],
        )

        if len(beds) < 1:
            return {}
        return beds[0]

    def get_nursing_ward_occupancy1(self, nursing_ward: str) -> Dict:
        """
        Get occupancy of all nursing wards
        """
        ward = frappe.get_doc("Nursing Ward", nursing_ward)
        locked_beds = frappe.db.count(
            "Nursing Ward Bed", filters={"nursing_ward": nursing_ward, "is_locked": 1}
        )
        locked_cots = frappe.db.count(
            "Nursing Ward Cot", filters={"nursing_ward": nursing_ward, "is_locked": 1}
        )

        OCCUPIED_BEDS = f"""
            SELECT COUNT(*) as beds FROM `tabNursing Ward Occupancy Detail` WHERE nursing_ward='{nursing_ward}' AND type='Bed' AND (end_date is NULL OR end_date > NOW()) AND start_date < NOW()
            """

        OCCUPIED_COTS = f"""
            SELECT COUNT(*) as cots FROM `tabNursing Ward Occupancy Detail` WHERE nursing_ward='{nursing_ward}' AND type='Cot' AND (end_date is NULL OR end_date > NOW()) AND start_date < NOW()
            """
        occupied_beds = frappe.db.sql(OCCUPIED_BEDS, as_dict=1)[0].get("beds")
        occupied_cots = frappe.db.sql(OCCUPIED_COTS, as_dict=1)[0].get("cots")

        available_beds_for_admission = (
            int(ward.total_beds) - occupied_beds - locked_beds
        )
        available_cots_for_admission = (
            int(ward.total_cots) - occupied_cots - locked_cots
        )
        unoccupied_beds = int(ward.total_beds) - occupied_beds
        unoccupied_cots = int(ward.total_cots) - occupied_cots
        response = {
            "occupied_beds": occupied_beds,
            "occupied_cots": occupied_cots,
            "unoccupied_beds": unoccupied_beds,
            "unoccupied_cots": unoccupied_cots,
            "locked_beds": locked_beds,
            "locked_cots": locked_cots,
            "available_beds_for_admission": available_beds_for_admission,
            "available_cots_for_admission": available_cots_for_admission,
        }
        return response

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def list_nurse_wards(*args):
        response = []
        all_nursing_wards = frappe.get_all(
            "Nursing Ward",
            fields=[
                "name",
                "ward_name",
                "locked_beds",
                "total_beds",
                "total_cots",
            ],
        )
        for ward in all_nursing_wards:
            """Get Occupancies in Ward
            1. Get
            """
            occupancy_details = GCHAPI().get_nursing_ward_occupancy(ward.name)
            print(occupancy_details)
            response.append(
                {
                    "name": ward.name,
                    "ward_name": ward.ward_name,
                    "total_cots": ward.total_cots,
                    "total_beds": ward.total_beds,
                    **occupancy_details,
                }
            )
        return response

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def list_beds(ward: str):
        beds = []

        try:
            ward_room = frappe.get_doc("Nursing Ward", ward)
            print(ward_room)
            total_ward_beds = frappe.db.count(
                "Nursing Ward Bed",
                filters={
                    "nursing_ward": ward,
                },
            )
            occupied_beds = frappe.db.count(
                "Nursing Ward Bed", filters={"nursing_ward": ward, "is_occupied": 1}
            )
            unoccupied_beds = frappe.db.count(
                "Nursing Ward Bed", filters={"nursing_ward": ward, "is_occupied": 0}
            )
            occupied_cots = frappe.db.count(
                "Nursing Ward Cot", filters={"nursing_ward": ward, "is_occupied": 1}
            )
            unoccupied_cots = frappe.db.count(
                "Nursing Ward Cot", filters={"nursing_ward": ward, "is_occupied": 0}
            )
            locked_beds = frappe.db.count(
                "Nursing Ward Bed", filters={"nursing_ward": ward, "is_locked": 1}
            )
            locked_cots = frappe.db.count(
                "Nursing Ward Cot", filters={"nursing_ward": ward, "is_locked": 1}
            )
            all_beds = frappe.get_list(
                "Nursing Ward Bed",
                filters={"nursing_ward": ward},
                fields=[
                    "name",
                    "is_occupied",
                    "is_locked",
                    "bed_type",
                    "nursing_ward",
                    "ward_room",
                    "bed_number",
                    "room_category",
                    "creation"
                ],
                order_by='creation'
            )

            print(all_beds)

            for bed in all_beds:
                occupant = frappe.db.get_value(
                    "Nursing Ward Occupancy", {"bed": bed["name"]}, ["patient", "is_booking", "is_assigned", "is_lodging"], as_dict=True
                )

                occupancy_status = occupant

                # Fetching latest IP record to get payment info, bed days, allergies, stat medication etc
                
                # inpatient_record = frappe.get_last_doc("Inpatient Record", filters= {"patient": })
                
                print(bed, occupant)
                if occupant:
                    patient = frappe.db.get_value(
                        "Patient",
                        occupant.patient,
                        [
                            "name",
                            "uhid_code",
                            "blood_group",
                            "sex",
                            "dob",
                            "is_vip_patient",
                            "blood_group",
                            "requires_assistive_communication_devices",
                            "requires_support_to_move_around",
                        ],
                        as_dict=True,
                    )

                    # Fetching Latest Inpatient Record Dictionary\
                    try:
                        doc = frappe.get_last_doc("Inpatient Record", filters= {"patient": patient.name})
                        inpatient_record = doc

                        from datetime import datetime
                        # Calculating Bed Days
                        if inpatient_record.admitted_datetime:
                            bed_days = (datetime.now() - inpatient_record.admitted_datetime).days

                    except Exception as e:
                        inpatient_record = {}
                        print(e, "++++++++++++Inpatient Record+++++++++++++++")

                    print(inpatient_record.name)

                    try:
                        doc2 = frappe.get_last_doc("Patient Nutrition Overview", filters= {"inpatient_record": inpatient_record.name})
                        nutrition_information = doc2

                        diet_requests = ""

                        for item in nutrition_information.diet_details_table:
                            if item.diet_prescription == "NILL BY MOUTH":
                                diet_requests += '<p style="color: red; font-weight: 600;"> -'+item.diet_prescription+'-</p>'
                            else:
                                diet_requests += '<p style="color: green; font-weight: 600;"> -'+item.diet_prescription+'-</p>'


                    except Exception as e:
                        diet_requests = ''
                        nutrition_information = {}
                        print(e, "+++++++++++++Nutrition Information++++++++++++++")


                    # Fetch Patient last Nutrition overview record

                    # Fetch Matrons Notes Doc Name if available
                    try:
                        doc3 = frappe.get_value("Matron Notes", {"inpatient_record": inpatient_record.name}, ['name'])
                        matron_notes = doc3

                    except Exception as e:
                        matron_notes = ""
                        print(e, "++++++++++++++++Matron Notes++++++++++++")


                    # Fetch latest Input Ouput Record
                    try:
                        input_output = frappe.get_last_doc("Nursing Input Output Chart", filters={"inpatient_record": inpatient_record.name})
                    except Exception as e:
                        input_output = ""
                        print(e, "++++++++++++++++Input Output Chart++++++++++++")

                    # Fetch multidisciplinary record
                    try:
                        multidisciplinary_record = frappe.get_last_doc("Multidisciplinary", filters={"inpatient_record": inpatient_record.name})
                    except Exception as err:
                        multidisciplinary_record = ""
                        print(err, "++++++++++++++++Multidisciplinary Record++++++++++++")
                    

                    # bed["occupant"] = patient
                    
                    bed.update({"occupant": patient})
                    bed.update({"occupancy_status": occupancy_status})
                    bed.update({"nutrition_information": nutrition_information})
                    bed.update({"input_output": input_output})
                    bed.update({"matron_notes": matron_notes})
                    bed.update({"diet_requests": diet_requests})
                    bed.update({"inpatient_record": inpatient_record})
                    bed.update({"bed_days": bed_days})
                    bed.update({"multidisciplinary_record": multidisciplinary_record})
            # else:
            #     bed["occupant"] = None

            # bed["occupant"] = occupant
            # bed_occupants = [frappe.get_doc("Nursing Ward Occupancy", )]

            # Fetch the category for each bed using list comprehension
            # bed_categories = [frappe.get_value("Nursing Ward Bed", bed["name"], "category") for bed in all_beds]

            # Combine the beds and their respective categories
            # for i, bed in enumerate(all_beds):
            #     bed["category"] = bed_categories[i]

            print(beds)
        except Exception as error:
            return {"ward_room": ward, "error": str(error)}
        beds.append(
            {
                "ward": ward,
                "total_beds": total_ward_beds,
                "occupied_beds": occupied_beds,
                "unoccupied_beds": unoccupied_beds,
                "occupied_cots": occupied_cots,
                "unoccupied_cots": unoccupied_cots,
                "locked_beds": locked_beds,
                "locked_cots": locked_cots,
                "bed_details": all_beds,
            }
        )
        return beds

    def list_beds1(ward: str):
        beds = []

        try:
            ward_room = frappe.get_doc("Nursing Ward", ward)
            print(ward_room)
            total_ward_beds = frappe.db.count(
                "Nursing Ward Bed",
                filters={
                    "nursing_ward": ward,
                },
            )
            occupied_beds = frappe.db.count(
                "Nursing Ward Bed", filters={"nursing_ward": ward, "is_occupied": 1}
            )
            unoccupied_beds = frappe.db.count(
                "Nursing Ward Bed", filters={"nursing_ward": ward, "is_occupied": 0}
            )
            all_beds = frappe.get_list(
                "Nursing Ward Bed",
                filters={
                    "nursing_ward": ward,
                },
                fields=[
                    "name",
                    "is_occupied",
                    "is_locked",
                    "ward_room",
                    "bed_type",
                    "nursing_ward",
                    "ward_room.category",
                ],
            )

            print(beds)
        except Exception as error:
            return {"ward_room": ward, "error": str(error)}
        beds.append(
            {
                "ward": ward,
                "total_beds": total_ward_beds,
                "occupied_beds": occupied_beds,
                "unoccupied_beds": unoccupied_beds,
                "bed_details": all_beds,
            }
        )
        return beds

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def assign_bed(patient, bed):
        """
        Assign a patient a bed.
        """
        nw_patient = frappe.get_doc("Patient", patient)

        nw_bed = frappe.get_doc("Nursing Ward Bed", bed)
        try:
            # Check if patient is already assigned to avoid double bookings
            doc_exists_check = frappe.get_list(doctype="Nursing Ward Occupancy", filters={"patient": patient}, fields=['name'])

            if doc_exists_check:
                frappe.throw(patient + " has already been assigned")
                return False

            occupancy_record = {
                "doctype": "Nursing Ward Occupancy",
                "is_occupied": True,
                "patient": nw_patient.name,
                "bed": nw_bed.name,
                "is_booking" : 1
            }
            occupancy_doc = frappe.get_doc(occupancy_record)
            occupancy_doc.insert()

            # Updating Nursing Ward Bed doc to is occupied True
            nw_bed.db_set({"is_occupied": 1})

            return True

        except Exception as e:
            return {"error": e}

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def transfer_patient(patient, bed):
        # Delete existing Nursing Ward Occupany Record
        old_occupancy = frappe.get_list(
            doctype="Nursing Ward Occupancy", filters={"patient": patient}, fields=['name', 'bed']
        )
        if old_occupancy:
            for i in old_occupancy:
                frappe.db.delete("Nursing Ward Occupancy", i.name)

            print(old_occupancy, "=================================")
            # Remove is occupied for the previously assigned bed
            old_bed_doc = frappe.get_doc("Nursing Ward Bed", old_occupancy[0].bed)
            old_bed_doc.is_occupied = 0
            old_bed_doc.save()

        """
        Assign a patient a bed.
        """

        nw_patient = frappe.get_doc("Patient", patient)

        nw_bed = frappe.get_doc("Nursing Ward Bed", bed)
        try:
            occupancy_record = {
                "doctype": "Nursing Ward Occupancy",
                "is_occupied": True,
                "patient": nw_patient.name,
                "bed": nw_bed.name,
            }
            occupancy_doc = frappe.get_doc(occupancy_record)
            occupancy_doc.insert()

            # Updating Nursing Ward Bed doc to is occupied True
            nw_bed.db_set({"is_occupied": 1})

            return True

        except Exception as e:
            return {"error": e}

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def list_ward_rooms(ward=None):
        rooms = []
        if not ward:
            rooms = frappe.db.get_list(
                "Nursing Ward Room", fields=["display_name", "nursing_ward", "category"]
            )
        if ward:
            rooms = frappe.db.get_list(
                "Nursing Ward Room",
                filters={"nursing_ward": ward},
                fields=["display_name", "nursing_ward", "category"],
            )
        return rooms

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def request_mobile_money_payment(*args):
        """
        Payment Request via Mobile Money

        Pass in params to determine whether payment is via MPESA or AIRTEL MONEY
        """

        return {}

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def request_mpesa(**args):
        user = frappe.session.user

        """ Get user Location"""
        branch = frappe.db.get_value("User Location", user, ["branch"])
        # branch = "Muthaiga"

        mpesa_settings = get_mpesa_settings(branch)

        # breakpoint()

        mpesa = initiate_mpesa(mpesa_settings)

        name = mpesa_settings.get("name")

        mpesa_account_parent = f"Mpesa-{name}"

        """ Get Account for mpesa"""
        company, default_account = frappe.db.get_value(
            "Mode of Payment Account",
            {"parent": mpesa_account_parent},
            ["company", "default_account"],
        )

        invoice = args["invoice"]
        phone_number = args["phone_number"]

        print(phone_number)
        outstanding_amount = args["amount"]
        provider = args["provider"]

        name, patient = frappe.db.get_value(
            "Sales Invoice", invoice, ["name", "patient"]
        )
        try:
            response = mpesa.sktPush(
                phone_number, outstanding_amount, name, mpesa_account_parent
            )
            """ Log """
            logger.info("{0} has initiated Mpesa Payment Push".format(user))
            logger.debug(response)

            """ Save Account"""
            doc = frappe.get_doc(
                doctype="Mpesa STK Request",
                merchantrequestid=response["MerchantRequestID"],
                checkoutrequestid=response["CheckoutRequestID"],
                responsecode=response["ResponseCode"],
                responsedescription=response["ResponseDescription"],
                customermessage=response["CustomerMessage"],
                mpesanumber=phone_number,
                invoiceno=name,
                patient=patient,
                default_account=default_account,
                company=company,
                mode_of_payment=mpesa_account_parent,
                branch=branch,
            )
            doc.insert()
            return response["CheckoutRequestID"]
        except Exception as e:
            frappe.log_error(response, "Mpesa STK Push initialization failed")
            """ Log """
            logger.debug(response)
            return "Error"

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def check_mpesa(**args):
        CheckoutRequestID = args["CheckoutRequestID"]

        request_doc = frappe.get_doc("Mpesa STK Request", CheckoutRequestID)

        branch = request_doc.branch

        mpesa_settings = get_mpesa_settings(branch)

        mpesa = initiate_mpesa(mpesa_settings)

        response = mpesa.stkCheck(CheckoutRequestID)
        """ Log """
        logger.info("{0} has initiated Check Mpesa Payment".format(branch))
        logger.debug(response)

        ResultCodeKey = "ResultCode"
        if ResultCodeKey in response:
            doc = frappe.get_doc("Mpesa STK Request", CheckoutRequestID)
            doc.resultcode = response["ResultCode"]
            doc.resultdesc = response["ResultDesc"]
            doc.save()

            return response
        else:
            return response

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def mp_callback(**args):
        response = args["Body"]["stkCallback"]

        try:
            if response["ResultCode"] == 0:
                item = response["CallbackMetadata"]["Item"]

                amount = item[0]["Value"]
                mpesa_code = item[1]["Value"]
                timestamp = item[3]["Value"]
                mpesa_number = item[4]["Value"]

                date = "{0}-{1}-{2}".format(
                    str(timestamp)[0:4], str(timestamp)[4:6], str(timestamp)[6:8]
                )

                CheckoutRequestID = response["CheckoutRequestID"]
                (
                    invoice_no,
                    company,
                    default_account,
                    mode_of_payment,
                ) = frappe.get_value(
                    "Mpesa STK Request",
                    CheckoutRequestID,
                    ["invoiceno", "company", "default_account", "mode_of_payment"],
                )

                invoiced_customer, invoiced_customer_name, owner = frappe.get_value(
                    "Sales Invoice", invoice_no, ["patient", "patient_name", "owner"]
                )

                print(invoiced_customer, invoiced_customer_name, owner)

                doc = frappe.get_doc("Mpesa STK Request", CheckoutRequestID)
                doc.cb_resultcode = response["ResultCode"]
                doc.cb_resultdesc = response["ResultDesc"]
                doc.amount = amount
                doc.mpesa_code = mpesa_code
                doc.save(ignore_permissions=True)

                print("saved")

                # todo
                #  create a payment entry with details

                def get_party_and_account_balance(
                    company,
                    date,
                    paid_from=None,
                    paid_to=None,
                    ptype=None,
                    pty=None,
                    cost_center=None,
                ):
                    return frappe._dict(
                        {
                            "party_balance": get_balance_on(
                                party_type=ptype, party=pty, cost_center=cost_center
                            ),
                            "paid_from_account_balance": get_balance_on(
                                paid_from, date, cost_center=cost_center
                            ),
                            "paid_to_account_balance": get_balance_on(
                                paid_to, date=date, cost_center=cost_center
                            ),
                        }
                    )

                bal = get_party_and_account_balance(
                    company,
                    date,
                    "Debtors"+suffix,
                    default_account,
                    "Customer",
                    invoiced_customer,
                    "Main"+suffix,
                )

                doc = frappe.get_doc(
                    {
                        "doctype": "Payment Entry",
                        "apply_tax_withholding_amount": 0,
                        "base_paid_amount": amount,
                        "base_received_amount": amount,
                        "base_total_allocated_amount": 0,
                        "company": company,
                        "custom_remarks": 0,
                        "difference_amount": None,
                        "docstatus": 1,
                        "doctype": "Payment Entry",
                        "mode_of_payment": mode_of_payment,
                        "name": "new-payment-entry-1",
                        "naming_series": "ACC-PAY-.YYYY.-",
                        "owner": owner,
                        "paid_amount": amount,
                        "paid_from": "Debtors"+suffix,
                        "paid_from_account_balance": bal[
                            "paid_from_account_balance"
                        ],  # this
                        "paid_from_account_currency": "KES",
                        "paid_to": default_account,
                        "paid_to_account_balance": bal["paid_to_account_balance"],
                        "paid_to_account_currency": "KES",
                        "party": invoiced_customer,
                        "party_balance": bal["party_balance"],  # this
                        "party_name": invoiced_customer_name,
                        "party_type": "Customer",
                        "payment_order_status": "Initiated",
                        "payment_type": "Receive",
                        "posting_date": date,
                        "received_amount": amount,
                        "reference_date": date,
                        "reference_no": mpesa_code,
                        "references": [],
                        "source_exchange_rate": 1,
                        "status": "Draft",
                        "target_exchange_rate": 1,
                        "total_allocated_amount": 0,
                        "unallocated_amount": None,
                    }
                )

                doc.insert(ignore_permissions=True)
                return "Ok"
            else:
                frappe.log_error(args, "Mpesa Callback Error")
                return "Ok"

        except Exception as e:
            frappe.log_error(e, "REST ERROR  /rest.py")
            frappe.log_error(e, "Mpesa Callbak Error")
            return "Ok"

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def mp_process(**args):
        CheckoutRequestID = args["CheckoutRequestID"]
        doc = frappe.get_doc("Mpesa STK Request", CheckoutRequestID)
        doc.processed = 1
        doc.save(ignore_permissions=True)

        return "Done"

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def request_pdq(**args):
        """Get Current User"""
        user = frappe.session.user

        """ Arguments """
        amount = int(args["amount"]) * 100
        phone_number = args["phone_number"]
        invoiced_customer = args["invoiced_customer"]
        invoiced_customer_name = args["invoiced_customer_name"]

        """ Get user Location"""
        branch, healthcare_service_unit = frappe.db.get_value(
            "User Location", user, ["branch", "healthcare_service_unit"]
        )

        """ Get Pinpad Location and Details """
        ip_address, default_port, teller_id = frappe.db.get_value(
            "Pinpad Settings",
            {"branch": branch, "service_unit": healthcare_service_unit},
            ["ip_address", "default_port", "teller_id"],
        )

        """ Initialize Pinpad Class """
        absa = ABSA_PDQ(default_port, teller_id, ip_address)

        """ Check if pinpad is online """
        isPinpadAvailable = absa._check_status()

        if not isPinpadAvailable:
            return f"""No Pinpad Device connected at {healthcare_service_unit} > {branch}"""

        """ Create a Uniq Transactions Key """
        tran_key = str(uuid.uuid4().hex)

        """ Initialize Payment """
        response = absa.sale(amount, tran_key)

        """ Log """
        logger.info("{0} has initiated Pinpad Payment".format(user))
        logger.debug(response)

        """ Get Account for Credit Card"""
        mode_of_payment = "Credit Card"
        company, default_account = frappe.db.get_value(
            "Mode of Payment Account",
            {"parent": mode_of_payment},
            ["company", "default_account"],
        )

        print(company, default_account)

        ResultCodeKey = "rspCode"
        if ResultCodeKey in response:
            if response[ResultCodeKey] == "000":
                """Response Details needed to create Payment Entry"""

                reference_no = response["retRefNr"]
                amount = response["amount"] / 100
                pan = response["pan"]
                scheme = response["scheme"]

                # date="2021-11-03"
                date = datetime.datetime.today().strftime("%Y-%m-%d")

                """ Create and Send Confirmation Message to arg['phone_number']  """
                message = "You have sent KES {0} from {1}: {2} to Getrudes Childrens Hospital, Thank you.".format(
                    amount, scheme, pan
                )
                sent, resp = messaging.send_sms(recipient=phone_number, message=message)

                """ Log Error if message not sent """
                if not sent:
                    frappe.log_error(resp, "Confirmation SMS Error")

                print(resp)

                """ Create Notifiacation Message for user"""
                notification = "Received KES {0} from {1}: {2}, Successfuly".format(
                    amount, scheme, pan
                )

                """ Add Payment to payment entry """

                def get_party_and_account_balance(
                    company,
                    date,
                    paid_from=None,
                    paid_to=None,
                    ptype=None,
                    pty=None,
                    cost_center=None,
                ):
                    return frappe._dict(
                        {
                            "party_balance": get_balance_on(
                                party_type=ptype, party=pty, cost_center=cost_center
                            ),
                            "paid_from_account_balance": get_balance_on(
                                paid_from, date, cost_center=cost_center
                            ),
                            "paid_to_account_balance": get_balance_on(
                                paid_to, date=date, cost_center=cost_center
                            ),
                        }
                    )

                """ Account Balances """
                bal = get_party_and_account_balance(
                    company,
                    date,
                    "Debtors"+suffix,
                    default_account,
                    "Customer",
                    invoiced_customer,
                    "Main"+suffix,
                )

                """ Create and Submit a payment Entry for Transaction"""
                doc = frappe.get_doc(
                    {
                        "doctype": "Payment Entry",
                        "apply_tax_withholding_amount": 0,
                        "base_paid_amount": amount,
                        "base_received_amount": amount,
                        "base_total_allocated_amount": 0,
                        "company": company,
                        "custom_remarks": 0,
                        "difference_amount": None,
                        "docstatus": 1,
                        "doctype": "Payment Entry",
                        "mode_of_payment": mode_of_payment,
                        "name": "new-payment-entry-1",
                        "naming_series": "ACC-PAY-.YYYY.-",
                        "owner": user,
                        "paid_amount": amount,
                        "paid_from": "Debtors"+suffix,
                        "paid_from_account_balance": bal[
                            "paid_from_account_balance"
                        ],  # this
                        "paid_from_account_currency": "KES",
                        "paid_to": default_account,
                        "paid_to_account_balance": bal["paid_to_account_balance"],
                        "paid_to_account_currency": "KES",
                        "party": invoiced_customer,
                        "party_balance": bal["party_balance"],  # this
                        "party_name": invoiced_customer_name,
                        "party_type": "Customer",
                        "payment_order_status": "Initiated",
                        "payment_type": "Receive",
                        "posting_date": date,
                        "received_amount": amount,
                        "reference_date": date,
                        "reference_no": "{0}-{1}".format(pan, reference_no),
                        "references": [],
                        "source_exchange_rate": 1,
                        "status": "Draft",
                        "target_exchange_rate": 1,
                        "total_allocated_amount": 0,
                        "unallocated_amount": None,
                    }
                )

                doc.insert(ignore_permissions=True)

                return notification
            else:
                print("PAYMENT NOT DONE")
                frappe.log_error(response, "Pinpad Error")
                return response["message"]
        else:
            print("SOMETHING WENT WRONG")
            frappe.log_error(response, "Pinpad Error")
            return "Something Went"

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def clean_patient_data():
        """
        Clean Patient Data.

        Calls a background taks that goes through
        the database and clears out the patients
        matching `FNAME <NAME> NULL`
        """
        from gch_custom.tasks import gch_tasks

        response = gch_tasks.enqueue_prune_patient_records()

        return {"initiated": True, "task_id": response}

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def create_payment_entry():
        pe = frappe.new_doc("Payment Entry")
        return pe

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def get_prescriptions() -> Dict:
        """Get List of Prescriptions in Draft Status

        Returns:
        """
        draft_prescriptions = frappe.db.get_list(
            "Prescription",
            {"docstatus": "0"},
            ["name", "patient_name", "prescription_date"],
        )
        return draft_prescriptions

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def get_ward_occupancy(ward_name: str) -> Dict:
        """Get Occupancy of a ward

        Args:
            ward_name: Name of the ward

        Returns:
            Occupancy of the ward
        """
        availability_info = GCHAPI().get_nursing_ward_occupancy(ward_name)
        response = {"availability_info": availability_info}

        ACTIVE_OCCUPANCY = f"""SELECT * FROM `tabNursing Ward Occupancy Detail` WHERE nursing_ward = '{ward_name}' AND start_date < NOW() AND (end_date > NOW() OR end_date IS NULL)"""
        active_ward_occupancy = frappe.db.sql(ACTIVE_OCCUPANCY, as_dict=True)

        ward_occupancy = frappe.db.get_list(
            "Nursing Ward Occupancy Detail", {"nursing_ward": ward_name}, ["*"]
        )

        for occupancy in active_ward_occupancy:
            if occupancy.end_date:
                bed_days = occupancy.end_date - occupancy.start_date
            else:
                bed_days = datetime.datetime.today() - occupancy.start_date
            encounter = frappe.get_doc(
                "Patient Encounter",
                {"patient": occupancy.patient, "docstatus": 1},
                ["*"],
            )
            if occupancy.get("type") == "Bed":
                bed_number = occupancy.ward_bed
            elif occupancy.get("type") == "Cot":
                bed_number = occupancy.ward_cot
            occupancy.update(
                {
                    # "pews_alert": encounter.pews_score,
                    "diet_allergy": not encounter.has_no_food_allergy,
                    "bed_days": bed_days.days,
                    "bed_number": bed_number,
                }
            )
        response.update({"ward_occupancy": active_ward_occupancy})
        return response


api = GCHAPI()

# Search Patient Drug Allergy for the Patient selected at Patient and Encounter


@frappe.whitelist(allow_guest=True)
def get_assessment_guideline(doctype, txt, searchfield, start, page_len, filters):
    if not filters.get("parameter"):
        frappe.msgprint(_("Select an Assessment Parameter."))
        return []

    return frappe.db.sql(
        """select score_guideline, score from `tabParameter Guidelines`
        where  parent = %(parameter)s and score_guideline like %(txt)s 
        order by score """.format(),
        {"txt": "%{0}%".format(txt), "parameter": filters["parameter"]},
    )


# Search Patient Drug Allergy for the Patient and Encounter
@frappe.whitelist(allow_guest=True)
def get_patient_drug_allergy(patient):
    QUERY = f"""SELECT distinct drug_allergy FROM `tabPatient Drug Allergy` WHERE parent in ('{patient}');"""

    allergy = frappe.db.sql(
        QUERY,
        as_dict=True,
    )

    if allergy:
        drug_allergy = allergy
    else:
        drug_allergy = ""

    response = dict(drug_allergy=drug_allergy)
    return response


# Search Patient Food Allergy for Patient and Encounter
@frappe.whitelist(allow_guest=True)
def get_patient_food_allergy(filters):
    QUERY = f"""SELECT distinct food_allergy FROM `tabPatient Food Allergy` WHERE parent in ('{filters}');"""

    qs_allergy = frappe.db.sql(
        QUERY,
        as_dict=True,
    )

    if qs_allergy:
        food_allergy = qs_allergy
    else:
        food_allergy = ""

    response = dict(food_allergy=food_allergy)
    return response


# Reopen Encounter


@frappe.whitelist(allow_guest=True)
def reopen_encounter(**args):
    # Inserting records to Encounter Reopen Doc

    try:
        try:
            reopen = frappe.new_doc("Encounter Reopen")
            reopen.encounter = args["encounter"]
            reopen.reopened_by = args["reopened_by"]
            reopen.reopening_date_and_time = args["reopening_date_time"]
            reopen.reopening_reason = args["reopening_reason"]
            reopen.insert(ignore_permissions=True)

            # Creating a workflow comment that will show who reopened the encounter
            workflow_comment = frappe.new_doc("Comment")
            workflow_comment.comment_email = args["reopened_by"]
            workflow_comment.comment_type = "Workflow"
            workflow_comment.content = (
                "<h5><b>Reopening Reason</b></h5><p>"
                + args["reopening_reason"]
                + "</p>"
            )
            workflow_comment.docstatus = 0
            workflow_comment.doctype = "Comment"
            workflow_comment.modified = args["reopening_date_time"]
            workflow_comment.modified_by = args["reopened_by"]
            workflow_comment.published = 0
            workflow_comment.reference_doctype = "Patient Encounter"
            workflow_comment.reference_name = args["encounter"]
            workflow_comment.insert(ignore_permissions=True)

        except Exception as e:
            print(e)
            return e

            exit()

        opened_enc = frappe.db.set_value(
            "Patient Encounter",
            args["encounter"],
            {"docstatus": 0, "workflow_state": "Pending Reception"},
        )

        return True

    except Exception as e:
        print(e)
        return e


# Get Patient's Time since Last Encounter
@frappe.whitelist(allow_guest=True)
def get_last_pe_detail(filters):
    patient = filters

    patient_last_encounter = frappe.db.sql(
        """select modified, closing_date_and_time from `tabPatient Encounter` where patient=%s
        order by modified desc limit 1""",
        (patient),
        as_dict=True,
    )

    if patient_last_encounter:
        lastv_details = patient_last_encounter[0]

        ts = datetime.datetime.now()

        if lastv_details.closing_date_and_time is not None:
            dur_diff = ts - lastv_details.closing_date_and_time
            print(dur_diff, "Actual closing date and time \n\n\n")
        else:
            dur_diff = ts - lastv_details.modified
            print(dur_diff, "Last Modification date and time \n\n\n")

        dur_diff_hrs = divmod(dur_diff.total_seconds(), 3600)[0] + 3

    else:
        dur_diff_hrs = -1
        frappe.msgprint(_("No Previous Encounter"), alert=True)

    last_visit = dur_diff_hrs

    response = dict(lastv_hrs=last_visit)

    return response


@frappe.whitelist(allow_guest=True)
def fetch_data_from_recent_encounter(filters):
    patient = filters

    patient_last_encounter = frappe.db.sql(
        """select
        name,
        modified
        from `tabPatient Encounter` where patient=%s
        order by modified desc limit 1""",
        (patient),
        as_dict=True,
    )

    if patient_last_encounter:
        all_encounter_fields = frappe.get_doc(
            "Patient Encounter", patient_last_encounter[0].name
        )

        print("\n\n\n", all_encounter_fields, "\n\n\n")

        return all_encounter_fields


@frappe.whitelist(allow_guest=True)
def fetch_data_from_recent_encounter2(filters):
    patient = filters

    patient_last_encounter = frappe.db.sql(
        """select
        name,
        modified
        from `tabPatient Encounter` where patient=%s
        order by modified desc limit 2""",
        (patient),
        as_dict=True,
    )

    if len(patient_last_encounter) > 1:
        all_encounter_fields = frappe.get_doc(
            "Patient Encounter", patient_last_encounter[1].name
        )

    print("\n\n\n", all_encounter_fields, "\n\n\n")

    return all_encounter_fields


@frappe.whitelist(allow_guest=True)
def duplicate_drug_allergy_to_recent_enc(**args):
    try:
        drug_allergy = frappe.get_doc(
            {
                "creation": args["creation"],
                "doctype": args["doctype"],
                "drug_allergy": args["drug_allergy"],
                "modified": args["modified"],
                "modified_by": args["modified_by"],
                "owner": args["owner"],
                "parent": args["parent"],
                "parentfield": args["parentfield"],
                "parenttype": args["parenttype"],
            }
        )

        drug_allergy.insert(ignore_permissions=True)

        return True

    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def duplicate_food_allergy_to_recent_enc(**args):
    try:
        food_allergy = frappe.get_doc(
            {
                "creation": args["creation"],
                "doctype": args["doctype"],
                "food_allergy": args["food_allergy"],
                "modified": args["modified"],
                "modified_by": args["modified_by"],
                "owner": args["owner"],
                "parent": args["parent"],
                "parentfield": args["parentfield"],
                "parenttype": args["parenttype"],
            }
        )

        food_allergy.insert(ignore_permissions=True)

        return True

    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def duplicate_other_allergy_to_recent_enc(**args):
    try:
        other_allergy = frappe.get_doc(
            {
                "creation": args["creation"],
                "doctype": args["doctype"],
                "other_allergy": args["other_allergy"],
                "modified": args["modified"],
                "modified_by": args["modified_by"],
                "owner": args["owner"],
                "parent": args["parent"],
                "parentfield": args["parentfield"],
                "parenttype": args["parenttype"],
            }
        )

        other_allergy.insert(ignore_permissions=True)

        return True

    except Exception as e:
        return e

# @frappe.whitelist(allow_guest=True)
# def fetch_patient_history_within_2wks(**args):
#     """Fetch patient history within 2 weeks"""

#     all_encounter_fields = ""

#     patient_last_encounter = frappe.db.sql(
#     """select
#     name,
#     modified
#     from `tabPatient Encounter` where patient=%s
#     order by modified desc limit 2""",
#     (args["patient"]),
#     as_dict=True,
#     )

#     if len(patient_last_encounter) > 1:
#         all_encounter_fields = frappe.get_doc(
#             "Patient Encounter", patient_last_encounter[1].name
#         )

#     print("\n\n\n", all_encounter_fields, "\n\n\n")


#     # Creating duplicate record of patient history
    
#     try:
#         patient_history =  frappe.get_doc(
#             {
#                 "creation": all_encounter_fields.patient_history[0].creation,
#                 "doctype": "Patient Encounter History Details",
#                 "owner": all_encounter_fields.patient_history[0].owner,
#                 "parent": patient_last_encounter[0].name,
#                 "parentfield": "patient_history",
#                 "parenttype": "Patient Encounter",
#                 "patient_encounter_chief_complaint": all_encounter_fields.patient_history[0].patient_encounter_chief_complaint,
#                 "patient_encounter_chronic_care_med_history": all_encounter_fields.patient_history[0].patient_encounter_chronic_care_med_history,
#                 "patient_encounter_family_history": all_encounter_fields.patient_history[0].patient_encounter_family_history,
#                 "patient_encounter_history_of_present_illness": all_encounter_fields.patient_history[0].patient_encounter_history_of_present_illness,
#                 "patient_encounter_milestones": all_encounter_fields.patient_history[0].patient_encounter_milestones,
#                 "patient_encounter_nutrition_history": all_encounter_fields.patient_history[0].patient_encounter_nutrition_history,
#                 "patient_encounter_other_immunization": all_encounter_fields.patient_history[0].patient_encounter_other_immunization,
#                 "patient_encounter_other_relevant_history": all_encounter_fields.patient_history[0].patient_encounter_other_relevant_history,
#                 "patient_encounter_past_medical_history": all_encounter_fields.patient_history[0].patient_encounter_past_medical_history,
#                 "patient_encounter_socio_economic_history": all_encounter_fields.patient_history[0].patient_encounter_socio_economic_history,
#                 "patient_encounter_systematic_enquiry": all_encounter_fields.patient_history[0].patient_encounter_systematic_enquiry,
#                 "modified": all_encounter_fields.patient_history[0].modified
#             }
#         )

#         patient_history.insert(ignore_permissions=True)

#         return True

#     except Exception as e:
#         return e

    # return all_encounter_fields

# Get Patient Assessment Action
@frappe.whitelist(allow_guest=True)
def get_patient_assessment_action(template: str, score: int) -> Dict:
    QUERY = f"""SELECT action FROM `tabAssessment Template Action` 
    WHERE parent = '{template}' and {score} between minimum_score and maximum_score;"""

    assess_action = frappe.db.sql(QUERY, as_dict=True)

    if assess_action:
        assessment_action = assess_action[0]
    else:
        assessment_action = "No Action"

    response = dict(pa_action=assessment_action)

    return response


# Check if Patient has open Encounter
@frappe.whitelist(allow_guest=True)
def check_open_encounter(patient):
    QUERY = f"""SELECT name FROM `tabPatient Encounter` 
    WHERE patient = '{patient}' and docstatus != 1;"""

    has_open_encounter = frappe.db.sql(QUERY, as_dict=True)

    enc_name = 0

    if len(has_open_encounter) != 0:
        # frappe.msgprint(
        #     _("Patient has Open Encounter: " + str(has_open_encounter[0].name))
        # )
        open_encounters = 1
        enc_name = has_open_encounter[0].name

    else:
        open_encounters = 0

    context = {"open_encounter": open_encounters, "enc_name": enc_name}

    response = dict(context)

    return response


@frappe.whitelist(allow_guest=True)
def save_wongbaker(docno: str, score: int) -> Dict:
    frappe.db.sql(
        f""" UPDATE `tabPatient Assessment` SET total_score_obtained='{score}' WHERE name='{docno}' """
    )
    frappe.db.commit()


@frappe.whitelist()
def get_classifications(main_category):
    classifications = frappe.db.sql(
        f""" SELECT classification_name FROM `tabGeneric Classification` WHERE category='{main_category}' """
    )
    return classifications


@frappe.whitelist()
def get_sub_classifications(classification):
    sub_classifications = frappe.db.sql(
        f""" SELECT sub_classification_name FROM `tabGeneric Sub Classification` WHERE classification='{classification}' """
    )
    return sub_classifications


@frappe.whitelist()
def get_generic_item_data(selected_generic_drug):
    get_generic_item_data = frappe.db.sql(
        f""" SELECT classification, sub_classification, name FROM `tabGeneric Drug Name` WHERE name='{selected_generic_drug}' """,
        as_dict=True,
    )

    get_drug_preparation = frappe.db.sql(
        f""" SELECT generic_drug_formula FROM `tabGeneric Drug Formula Link` WHERE parent='{get_generic_item_data[0].name}' AND parentfield='preparation' """
    )
    get_drug_route = frappe.db.sql(
        f""" SELECT drug_route FROM `tabGeneric Drug Route` WHERE parent='{get_generic_item_data[0].name}' AND parentfield='route' """
    )

    context = {
        "get_generic_item_data": get_generic_item_data,
        "get_drug_preparation": get_drug_preparation,
        "get_drug_route": get_drug_route,
    }

    return context


@frappe.whitelist(allow_guest=True)
def generate_item_code(item_string):
    search_query = item_string + "-"

    current_goup_items = frappe.db.sql(
        f""" SELECT COUNT(*) AS current_items FROM `tabItem` WHERE item_code LIKE '{search_query}%' """,
        as_dict=True,
    )

    item_number = current_goup_items[0].current_items + 1

    item_number = str(item_number).zfill(4)

    item_code = search_query + item_number

    return item_code


@frappe.whitelist(allow_guest=True)
def get_encounter_diagnosis(**args):
    """
    Used to get the child table of diagnosis from the encounter given the encounter id
    """
    diagnosis_list = frappe.db.get_list(
        "Codification Table",
        filters={"parent": args["encounter"]},
        fields=["medical_code", "code", "description"],
    )
    return diagnosis_list


@frappe.whitelist(allow_guest=True)
def get_items_from_invoice(**args):
    """
    Used to get the child table of items list from an invoice given the invoice id
    """
    invoice_item_list = frappe.db.get_list(
        "Sales Invoice Item",
        filters={"parent": args["sales_invoice"]},
        fields=["item_code", "amount"],
    )
    return invoice_item_list


@frappe.whitelist(allow_guest=True)
def get_patient_from_invoice(**args):
    """
    Used to get the patient from invoice given the invoice id
    """
    patient = frappe.db.get_value("Sales Invoice", args["sales_invoice"], ["patient"])
    return patient


@frappe.whitelist(allow_guest=True)
def get_patient_current_encounter(**args):
    """
    Used to get the current encounter given the patient
    """
    name = frappe.db.get_value(
        "Patient Encounter", {"patient": args["patient"], "docstatus": 0}, ["name"]
    )
    return name


@frappe.whitelist(allow_guest=True)
def get_insurance_preauth_items_table(**args):
    """
    Used to get the current preauth items covered by an insurance company given the insurance and apply for
    e.g all / outpatient / inpatient
    """
    insurance_company = args["insurance_company"]
    applies_for = args["apply_for"]
    today = datetime.datetime.today().strftime("%d-%m-%Y")

    inpatient_preauth_items_list = frappe.db.get_list(
        "Insurance Scheme Preauthorization",
        filters=[
            ["parent", "=", insurance_company],
            ["applies_for", "=", applies_for],
            ["valid_from", "<", today],
            ["valid_upto", ">", today],
        ],
        # filters={"parent": insurance_company, "applies_for": applies_for},
        fields=["item", "applies_for", "valid_from", "valid_upto", "amount"],
    )
    return inpatient_preauth_items_list


@frappe.whitelist(allow_guest=True)
def get_insurance_copay_items_table(**args):
    """
    Used to get the current copay items covered by an insurance company given the insurance and apply for
    e.g Outpatient / Inpatient
    """
    insurance_company = args["insurance_company"]
    applies_for = args["apply_for"]
    today = datetime.datetime.today().strftime("%d-%m-%Y")

    print(today, insurance_company, applies_for)

    copay_items_list = frappe.db.get_list(
        "Copayment Detail",
        # filters={"parent": insurance_company, "covering": applies_for},
        filters=[
            ["parent", "=", insurance_company],
            ["covering", "=", applies_for],
            ["valid_from", "<", today],
            ["valid_upto", ">", today],
        ],
        fields=[
            "healthcare_service_unit",
            "copay_type",
            "covering",
            "percentage_of",
            "amount",
            "percentage",
            "valid_from",
            "valid_upto",
        ],
    )
    return copay_items_list


@frappe.whitelist(allow_guest=True)
def get_insurance_excluded_items_table(**args):
    """
    Used to get the current excluded items not covered by an insurance company given the insurance and apply for
    e.g Outpatient / Inpatient
    """
    insurance_company = args["insurance_company"]
    applies_for = args["apply_for"]
    today = datetime.datetime.today().strftime("%d-%m-%Y")
    excluded_items_list = frappe.db.get_list(
        "Insurance Scheme Exclusion",
        filters=[
            ["parent", "=", insurance_company],
            ["applies_for", "=", applies_for],
            ["valid_from", "<", today],
            ["valid_upto", ">", today],
        ],
        # filters={"parent": insurance_company, "applies_for": applies_for},
        fields=["item", "applies_for", "valid_from", "valid_upto", "amount"],
    )
    return excluded_items_list


@frappe.whitelist(allow_guest=True)
def get_insurance_billing_rules_items_table(**args):
    """
    Used to get the current billing rule by an insurance company given the insurance and applies for
    e.g Outpatient / Inpatient
    """
    if args["insurance_company"]:
        insurance_company = args["insurance_company"]
    insurance_category = args["insurance_category"]
    applies_for = args["apply_for"]
    today = datetime.datetime.today().strftime("%d-%m-%Y")

    """
    Step 1: Fetching insurace category and insurance company ids
    Step 2: Fetching billing rules from both insurance category and insurance company
    Step 3: If billing rules exist in both, the insurance category billing rule takes precedence
    """

    # Fetching insurance company ID
    if args["insurance_company"]:
        insurance_company_id = frappe.db.get_value("Insurance Company", {"company_name": insurance_company}, ["name"])

    # # Fetching insurance category ID
    # insurance_category_id = frappe.db.get_value("Insurance Category", {"name1": insurance_category}, ["name"])

    print("\n\n\n\n", insurance_category, "insurance category", insurance_company_id, "insurance category", "\n\n\n\n")
    

    insurance_company_billing_rule_items_list = frappe.db.get_list(
        "Insurance Billing Rule",
        filters=[
            ["parent", "=", insurance_company_id],
            ["applies_for", "=", applies_for],
            ["valid_from", "<", today],
            ["valid_upto", ">", today],
        ],
        fields=[
            "insurance_billing_rule_templates",
            "applies_for",
            "valid_from",
            "valid_upto",
        ],
    )

    insurance_category_billing_rule_items_list = frappe.db.get_list(
        "Insurance Billing Rule",
        filters=[
            ["parent", "=", args["insurance_category"]],
            ["applies_for", "=", applies_for],
            ["valid_from", "<", today],
            ["valid_upto", ">", today],
        ],
        fields=[
            "insurance_billing_rule_templates",
            "applies_for",
            "valid_from",
            "valid_upto",
        ],
    )

    print("\n\n\n\n", insurance_company_billing_rule_items_list, "insurance company billing", insurance_category_billing_rule_items_list, "insurance category billing", "\n\n\n\n")

    billing_rule_items_list = ""

    if len(insurance_category_billing_rule_items_list) > 0:
        billing_rule_items_list = insurance_category_billing_rule_items_list

    elif len(insurance_category_billing_rule_items_list) < 1 and len(insurance_company_billing_rule_items_list) > 0:
        billing_rule_items_list = insurance_company_billing_rule_items_list

    # print("\n\n\n\n\n\n\n", billing_rule_items_list, "SEKECTED INSURANCE COMPANY \n\n\n\n\n")


    return billing_rule_items_list


# Get Previous Encounter Details
@frappe.whitelist(allow_guest=True)
def get_previous_encounter(patient):
    drugs_allergy = ""
    foods_allergy = ""
    family_hist = ""
    medical_hist = ""

    last_enc = frappe.db.sql(
        """select name from `tabPatient Encounter` where patient=%s
        order by modified desc limit 1""",
        (patient),
        as_dict=True,
    )

    if last_enc:
        enc_details = frappe.get_last_doc(
            "Patient Encounter", filters={"patient": patient}, order_by="modified desc"
        )

        encounter_info = enc_details.as_dict()
        enc_no = encounter_info.get("name")
        family_hist = encounter_info.get("family_history")
        medical_hist = encounter_info.get("patient_history")

        drug_allergies = get_patient_drug_allergy(enc_no)
        food_allergies = get_patient_food_allergy(enc_no)

        drugs_allergy = drug_allergies["drug_allergy"]
        foods_allergy = food_allergies["food_allergy"]
    else:
        enc_details = ""

    response = {
        "food_allergy": foods_allergy,
        "drug_allergy": drugs_allergy,
        "family_history": family_hist,
        "medical_history": medical_hist,
    }

    return response


# Filtering Medical code serch to only show children elements
@frappe.whitelist(allow_guest=True)
def group_medical_query(doctype, txt, searchfield, start, page_len, filters):
    doctype = "Medical Code"
    conditions = []

    return frappe.db.sql(
        """
        select name, parent_medical_code, description, is_communicable from `tabMedical Code`
        where is_group=0
            and medical_code_standard in ('ICD-10-Diagnosis', 'ICD-10')
            and ({key} like %(txt)s
				or code like %(txt)s
                or description like %(txt)s)
			{fcond} {mcond}
        limit %(page_len)s offset %(start)s""".format(
            **{
                "fields": "name, code, parent_medical_code, description, is_communicable",
                "key": searchfield,
                "fcond": get_filters_cond(doctype, filters, conditions),
                "mcond": get_match_cond(doctype),
            }
        ),
        {
            "txt": "%%%s%%" % txt,
            "_txt": txt.replace("%", ""),
            "start": start,
            "page_len": page_len,
        },
    )

    # # medical_code_groups = frappe.db.sql("""select name From `tabMedical Code`
    # #                         where
    # #                             is_group=1
    # #                             and medical_code_standard in ('ICD-10-Diagnosis', 'ICD-10')""")

    # medical_code_children = frappe.db.sql("""select name, parent_medical_code, description, is_communicable From `tabMedical Code`
    #                         where
    #                             is_group=0
    #                             and medical_code_standard in ('ICD-10-Diagnosis', 'ICD-10')""")

    # lst = list(medical_code_children)

    # buffer = []

    # for i in lst:
    #     diagnosis = list(i)[0]
    #     if list(i)[1]:
    #         parent = 'Group: ' + list(i)[1].split(' ')[1]
    #     else:
    #         parent = "N/A"
    #     description = list(i)[2]
    #     communicable = list(i)[3]

    #     # print("............................", communicable, "............................")

    #     temp = []

    #     temp.append(diagnosis)
    #     temp.append(parent)
    #     temp.append(description)
    #     temp.append(communicable)

    #     buffer.append(temp)

    # res = tuple(map(tuple, buffer))
    # print("buffer,,,,,,,,,,,,,,,", buffer, ".....................")
    # return res
# Generate Payment Entry for unsubmitted invoices
@frappe.whitelist(allow_guest=True)
def generate_payment_entry(**args):
    amount = float(args["amount"])
    mode_of_payment = args["mode_of_payment"]
    customer = args["customer"]
    transaction_id = args["transaction_id"]
    branch = args["branch"]

    mpesa_name = frappe.db.get_value(
        "Mpesa Settings", {"branch": branch}, ["name"])

    mpesa_account_parent = f"Mpesa-{mpesa_name}"

    date = datetime.datetime.today().strftime("%Y-%m-%d")

    default_account = frappe.db.get_value(
        "Mode of Payment Account",
        {"parent": mpesa_account_parent},
        ["default_account"],

    )

    date = datetime.datetime.today().strftime("%Y-%m-%d")
    print(date)

    try:
        doc = frappe.get_doc(
            {
                    "doctype": "Payment Entry",
                    "apply_tax_withholding_amount": 0,
                    "base_paid_amount": amount,
                    "base_received_amount": amount,
                    "base_total_allocated_amount": 0,
                    "company": company,
                    "custom_remarks": 0,
                    "difference_amount": None,
                    "docstatus": 1,
                    "doctype": "Payment Entry",
                    "mode_of_payment": mode_of_payment,
                    "name": "new-payment-entry-1",
                    "naming_series": "ACC-PAY-.YYYY.-",
                    # "owner": owner,
                    "paid_amount": amount,
                    "paid_from": "Debtors - GCH",
                    "paid_from_account_balance": 0,
                    "paid_from_account_currency": "KES",
                    "paid_to": default_account,
                    "paid_to_account_balance": 0,
                    "paid_to_account_currency": "KES",
                    "party": customer,
                    "party_balance": 0,
                    "party_name": customer,
                    "party_type": "Customer",
                    "payment_order_status": "Initiated",
                    "payment_type": "Receive",
                    "posting_date": date,
                    "received_amount": amount,
                    "reference_date": date,
                    "reference_no": transaction_id,
                    "references": [],
                    "source_exchange_rate": 1,
                    "status": "Draft",
                    "target_exchange_rate": 1,
                    "total_allocated_amount": amount,
                    "unallocated_amount": 0,
                }
            )
        doc.insert(ignore_permissions=True)

        return True
    
    except Exception as e:
        return e


# Reduced the number of fields fetched to reduce load time -- robert
@frappe.whitelist(allow_guest=True)
def encounter_assessments(encounter):
    all_assessments = frappe.get_all(
        "Patient Assessment",
        filters={"encounter": encounter},
        fields=[
            "name",
            "assessment_template",
            "total_score_obtained",
            "assessment_date",
            "assessment_time",
            "owner",
            "action",
        ],
    )
    # assessments = frappe.db.sql(
    #     f""" SELECT * FROM `tabPatient Assessment` WHERE encounter ='{encounter}' ORDER BY modified DESC """,
    #     as_dict=True,
    # )

    return all_assessments


@frappe.whitelist(allow_guest=True)
def duplicate_prev_assessment_templates(prev_encounter, current_encounter):
    all_assessments = frappe.get_list(
        "Patient Assessment", filters={"encounter": prev_encounter}, pluck="name"
    )

    try:
        # frappe.db.set_value(
        #     "Patient Encounter",
        #     current_encounter,
        #     {"data_fetched_from_prev_enc": 1},
        #     update_modfied=False,
        # )

        encounter = frappe.get_doc("Patient Encounter", current_encounter)
        encounter.data_fetched_from_prev_enc = 1
        encounter.save()

        print(True)

    except Exception as e:
        print(False)

    # print(frappe.get_doc("Patient Encounter", current_encounter), "\n\n\n\n\n HEERAEKDMSAKMD;AMS ;DMASDM;ASMD;ASM \n\n\n\n")

    assessment_details = []

    for assessment in all_assessments:
        assess = frappe.get_doc("Patient Assessment", assessment)
        assessment_details.append(assess)

        new_assess_doc = frappe.get_doc(
            {
                "doctype": "Patient Assessment",
                "action": assess.action,
                "assessment_branch": assess.assessment_branch,
                "assessment_date": assess.assessment_date,
                "assessment_datetime": assess.assessment_datetime,
                "assessment_sheet": assess.assessment_sheet,
                "assessment_template": assess.assessment_template,
                "assessment_time": assess.assessment_time,
                "company": assess.company,
                "creation": assess.creation,
                "docstatus": assess.docstatus,
                "encounter": current_encounter,
                "modified": assess.modified,
                "modified_by": assess.modified_by,
                "naming_series": assess.naming_series,
                "obtained_score": assess.obtained_score,
                "owner": assess.owner,
                "checked_by": assess.owner,
                "patient": assess.patient,
                "scale_max": assess.scale_max,
                "scale_min": assess.scale_min,
                "total_score": assess.total_score,
                "total_score_obtained": assess.total_score_obtained,
            }
        )

        new_assess_doc.insert(ignore_permissions=True)

        # Updating encounter to ensure the data fetched check is true
        # opened_enc = frappe.db.set_value(
        #     "Patient Encounter", current_encounter, {"workflow_state": "Pending Triage"}, update_modified=False
        # )

    return assessment_details


@frappe.whitelist(allow_guest=True)
def get_insurance_billing_rule_template(**args):
    """
    Used to get the current billing rule templete given the billing rule template name
    """
    billing_rule_name = args["billing_rule_name"]
    name = frappe.db.get_value(
        "Insurance Billing Rule Template",
        billing_rule_name,
        [
            "name",
            "rate_type",
            "percentage_discount",
            "discount_amount",
            "maximum_amount",
            "fixed_amount",
            "amount",
            "is_cumulative",
            "apply_on",
        ],
        as_dict=1,
    )
    return name


@frappe.whitelist(allow_guest=True)
def get_billing_rule_template_items(**args):
    """
    Used to get the current billing rule template items given the billing rule template name
    """
    billing_rule_name = args["billing_rule_name"]

    billing_rule_template_items_list = frappe.db.get_list(
        "Pricing Rule Item Code",
        filters={"parent": billing_rule_name},
        fields=["item_code"],
    )

    return billing_rule_template_items_list


@frappe.whitelist(allow_guest=True)
def get_user_location():
    """Get user Location"""

    user = frappe.session.user
    try:
        actor = frappe.session.user
    except Exception as e:
        print(e)
    if not actor or actor == "Guest":
        actor = user
    if not actor:
        frappe.throw(
            title="Error",
            msg="You need to sign in to continue",
        )
    healthcare_practs = frappe.qb.DocType("Healthcare Practitioner")

    healthcare_pract = (
        frappe.qb.from_(healthcare_practs)
        .select("*")
        .where(healthcare_practs.user_id == actor)
        .run(as_dict=True)
    )
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

        return station_entry.branch


@frappe.whitelist(allow_guest=True)
def get_parent_employers(**args):
    """
    Used to get the current parent list of employers given the parent ID
    """
    parent = args["parent"]

    parent_employer_list = frappe.db.get_list(
        "Parent Employment Details", filters={"parent": parent}, fields=["employer"]
    )
    return parent_employer_list


# --- robert ---
@frappe.whitelist(allow_guest=True)
def get_encounter_list(**args):
    """
    Used to get the encounter list of the given patient ID
    """
    patient_id = args["patient_id"]
    patient_dob = args["patient_dob"]
    patient_age = args["patient_age"]

    encounter_list = frappe.db.get_list(
        "Patient Encounter", filters={"patient_uhid": patient_id}
    )

    # Setting the new dob and age for the patient
    for encounter in encounter_list:
        # print("encounter", encounter.name)
        frappe.db.set_value(
            "Patient Encounter",
            encounter.name,
            {
                "date_of_birth": patient_dob,
                "patient_age": patient_age,
            },
            update_modified=False,
        )

    return encounter_list


# --- robert ---


@frappe.whitelist(allow_guest=True)
def check_for_open_bills_and_encounters(**args):
    """
    Used to get the bill list of the given patient ID
    """
    patient_uhid = args["patient_uhid"]

    bill_list = frappe.db.get_list(
        "Sales Invoice", filters={"customer_uhid": patient_uhid}, pluck="docstatus"
    )

    encounter_list = frappe.db.get_list(
        "Patient Encounter",
        filters={"patient_uhid": patient_uhid},
        pluck="workflow_state",
    )

    print("Encounters,,,,,", encounter_list)

    open_encounters = 0
    open_bills = 0

    for encounter in encounter_list:
        if encounter != "Encounter Closed":
            open_encounters += 1
            print("Please close these encounters before opening a new encounter")

    for bill in bill_list:
        if bill == 0:
            open_bills += 1
            print("bill is not submitted")

    return open_encounters, open_bills

    # if open_encounters > 0 and open_bills > 0:
    #     return frappe.throw("You have " + str(open_encounters) + " open encounters and " + str(open_bills) + " open bills. Ensure you close any open encounters and submit all open bills for this patient before proceeding....")
    # elif open_encounters > 0 and open_bills <= 0:
    #     return "You have " + str(open_encounters) + " open encounters"
    # elif open_bills > 0 and open_encounters <=0:
    #     return "You have " + str(open_bills) + " open bills"
    # else:
    #     return "You have no open encounters or bills"


# --- robert ---


@frappe.whitelist(allow_guest=True)
def update_dob_from_encounter(**args):
    # patient_uhid = args["patient_uhid"]
    # encounter_number = args["encounter_number"]
    new_dob = args["new_dob"]
    patient = args["patient"]

    # encounter = frappe.get_doc("Patient Encounter", encounter_number)
    patient = frappe.get_doc("Patient", patient)
    patient.db_set("dob", new_dob)
    # frappe.db.set_value("Patient", patient, {"dob": new_dob})

    # current_patient = frappe.get_doc("Patient", {"name": patient})

    # print("Yeiii this call is working........")
    # print("Patient Data Here........", current_patient)

    return patient


# --- robert ---


# @frappe.whitelist(allow_guest=True)
# def update_encounters_on_name_change(**args):
#     patient_id = args["patient_id"]
#     fname = args["new_fname"]
#     mname = args["new_mname"]
#     lname = args["new_lname"]
#     full_name = args["new_full_name"]

#     encounter_list = frappe.db.get_list(
#         "Patient Encounter", filters={"patient_uhid": patient_id}, pluck='name'
#     )

#     buffer = []

#     for encounter in encounter_list:
#         try:
#             frappe.db.set_value('Patient Encounter', encounter, {
#                 'patient_name': full_name,
#             })
#         except Exception as e:
#             frappe.log_error(
#                 e, "Change patient name on encounter  /rest.py line 1739")
#             return {"name": e}

#     return True


# --- robert ---
@frappe.whitelist(allow_guest=True)
def fetch_parents(**args):
    patient = args["patient"]

    # parent_list = frappe.db.get_all(
    #     "Patient", filters={"patient_name":patient},

    # )

    patient_info = frappe.get_doc("Patient", patient)

    print(patient_info)

    return patient_info


@frappe.whitelist(allow_guest=True)
def get_all_checklist_tasks(**args):
    """
    Used to get all checklist tasks of a checklist template given the checklist template ID
    """
    checklist_template = args["checklist_template"]

    checklist_template_tasks_list = frappe.db.get_list(
        "Nursing Checklist Template Details",
        filters={"parent": checklist_template},
        fields=["checklist_task", "task_name"],
    )
    return checklist_template_tasks_list


@frappe.whitelist(allow_guest=True)
def get_all_required_checklists(**args):
    """
    Used to get all checklist templates of a procedure template given the procedure template ID
    """
    procedure_template = args["procedure_template"]

    procedure_template_list = frappe.db.get_list(
        "Required Checklist Template Details",
        filters={"parent": procedure_template},
        fields=["nursing_checklist_template", "template_name"],
    )
    return procedure_template_list


@frappe.whitelist(allow_guest=True)
def request_mpesa_payment(phone_number, ref_id, amount):
    """
    Used to send an sms to the user requesting payment for item given the item, mpesa number, paybill and amount
    """

    #  i am here

    mpesa_message = "Dear {0}, kindly make payment of {1} to PayBill:{2}, Account No:{3}, Please Call +254721476778 for any enquiries".format()

    return mpesa_message


def invoice_encounter_items(
    patient,
    invoiced_items,
    encounter,
    invoice,
    current_invoiced_items,
    mode_of_payment="Cash",
    type="Outpatient",
):
    try:
        from gch_custom.overrides.patient_encounter import GCHPatientEncounter

        if type == "Outpatient":
            current_encounter: GCHPatientEncounter = frappe.get_doc(
                    "Patient Encounter", encounter
                )
        elif type == "Inpatient":
            current_encounter = frappe.get_doc(
                    "Inpatient Record", encounter
                )

        _current_invoiced_items = current_invoiced_items

        if invoice == "":
            # TODO: Add naming series based on branch

            invoice = frappe.new_doc("Sales Invoice")
            invoice.patient = patient.name
            invoice.patient_name = patient.patient_name
            invoice.customer = patient.customer
            invoice.conversion_rate = 1
            invoice.price_list_currency = "KES"
            invoice.plc_conversion_rate = 1
            invoice.encounter = encounter
            invoice.mode_of_payment = mode_of_payment
            # invoice.ref_practitioner = current_encounter.practitioner_name
            invoice.branch = current_encounter.branch

            # add naming series based on branch

            current_branch = frappe.get_doc("Branch", current_encounter.branch)

            naming_series = "22.YY.MM.######"

            if current_branch.invoice_naming_series:
                naming_series = current_branch.invoice_naming_series

            invoice.naming_series = naming_series

            for item in invoiced_items:
                invoice.append("items", item)

            invoice.base_net_total = 0
            invoice.base_grand_total = 0
            invoice.grand_total = 0
            invoice.debit_to = "Debtors"+suffix
            try:
                invoice.insert(ignore_permissions=True)
                # invoice.submit()
                return invoice
            except Exception as e:
                frappe.log_error(e, "Save new invoice  /rest.py line 2610")
                return {"name": e}

        invoice = frappe.get_doc("Sales Invoice", invoice)

        for item in invoiced_items:
            if item["item_code"] not in _current_invoiced_items:
                # print(
                #     "******************************break****************************************"
                # )
                # print(item["item_code"])
                invoice.append("items", item)
                # print(
                #     "******************************break****************************************"
                # )
            if item["item_code"] in _current_invoiced_items:
                _current_invoiced_items.remove(item["item_code"])

        invoice.save()
        # invoice.submit()
        return invoice
    except Exception as e:
        frappe.log_error(e, "Save invoice  /rest.py")
        return {"name": e}


@frappe.whitelist(allow_guest=True)
def get_encounter_lab_tests(encounter):
    """
    Used to get the current labtest on an encounter
    """
    try:
        labsss = frappe.db.get_list(
            "Lab Prescription",
            filters={"parent": encounter, "parentfield": "lab_test_prescription"},
            fields=[
                "name",
                "lab_test_code",
                "lab_test_name",
                "assigned_lab_test",
                "assigned_test",
            ],
        )
        # lab_test_list = frappe.db.get_list(
        #     "Lab Prescription",
        #     filters={"parent": encounter, "parentfield": "lab_test_prescription"},
        #     pluck="lab_test_code",
        # )
        return labsss
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        return []


@frappe.whitelist(allow_guest=True)
def get_encounter_procedures(encounter):
    """
    Used to get the current clinical Procedures on an encounter
    """
    try:
        item_list = []
        procedure_list = frappe.db.get_list(
            "Procedure Prescription",
            filters={"parent": encounter},
            fields=["procedure_name", "procedure_created","procedure"],
        )
        print(procedure_list)
        return procedure_list

    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        return []


@frappe.whitelist(allow_guest=True)
def get_procedure_consumables(procedure):
    """
    Get all encounter procedure and consumed items
    """
    try:
        procedure_consumable_list = frappe.db.get_list(
            "Clinical Procedure Item",
            filters={"parent": procedure, "invoice_separately_as_consumables": 1},
            fields=["name", "item_name", "item_code", "qty", "uom", "stock_uom"],
        )
        return procedure_consumable_list
    except Exception as e:
        frappe.log_error(e, "Error Getting Procedure /rest.py")
        return e


def get_encounter_radiology_tests(encounter):
    """
    Used to get the current Radiology on an encounter
    """
    try:
        radilogy_list = frappe.db.get_list(
            "Radiology Prescriptions",
            filters={"parent": encounter, "parentfield": "radiology_details"},
            fields=["name", "lab_test_code","sent_to_pacs"],
        )
        # frappe.log_error(radilogy_list, "GETTING... RADIOLGY LIST/rest.py")

        return radilogy_list
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        return []


@frappe.whitelist(allow_guest=True)
def get_encounter_vaccinations(encounter):
    """
    Used to get the current Vaccinations on an encounter
    """
    try:
        vaccination_list = frappe.db.get_list(
            "Wellbaby Vaccine Details",
            filters={"parent": encounter},
            fields=["uom", "drug", "quantity", "name", "vaccine_dispensed", "revaccination"],
        )

        return vaccination_list
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        return []


@frappe.whitelist(allow_guest=True)
def get_encounter_prescription(encounter):
    """
    Used to get the current Prescriptions on an encounter
    """
    try:
        prescription_list = frappe.db.get_list(
            "Doctor Prescription Table",
            filters={"parent": encounter},
            fields=[
                "medication",
                "unit_of_measure",
                "selling_quantity",
                "dont_issue",
                "selected_item_batch",
                "dispensed",
                "generic_drug_name",
            ],
        )

        return prescription_list
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        return []


def is_encounter_invoiced(encounter):
    return frappe.db.count("Sales Invoice", {"encounter": encounter})


@frappe.whitelist(allow_guest=True)
def check_vital_signs(encounter):
    vitals_temp = []
    QUERY = f"""select patient_encounter_temperature from `tabPatient Encounter Vital Signs` where parent = '{encounter}' order by idx;"""

    has_vital_signs = frappe.db.sql(QUERY, as_dict=True)

    if len(has_vital_signs) != 0:
        enc_temp = has_vital_signs
    else:
        enc_temp = ""

    for checkin in enc_temp:
        vitals_temp.append(checkin.patient_encounter_temperature)

    context = {"vital_signs_temp": vitals_temp}

    response = dict(context)

    return response


# Get Patient Anthropometry
@frappe.whitelist(allow_guest=True)
def get_anthropometry(patient):
    patient_anthro = []
    QUERY = f"""select height_for_age, weight_for_age, DATEDIFF(date(creation), (select dob from `tabPatient` where name ='{patient}')) AS Age from `tabPatient Encounter` where patient = '{patient}';"""

    has_anthropometry = frappe.db.sql(QUERY, as_dict=True)

    if len(has_anthropometry) != 0:
        anthropometry_details = has_anthropometry
    else:
        anthropometry_details = ""

    context = {"patient_anthro": anthropometry_details}

    print(f"context...{context}")

    response = dict(context)

    return response


# Fetching Previous Anthropometry Readings from encounters


@frappe.whitelist(allow_guest=True)
def fetch_anthropometry_history(**args):
    patient = args["patient"]
    patient_uhid = args["patient_uhid"]

    encounters = frappe.db.get_all(
        "Patient Encounter",
        filters={"patient": patient, "patient_uhid": patient_uhid},
        fields=[
            "patient_age",
            "weight_in_kilograms",
            "height_in_centimeters",
            "head_circumference_in_centimeters",
            "muac",
            "bsa",
            "bmi",
            "bmi_for_age",
            "height_for_age",
            "weight_for_age",
            "encounter_number",
            "creation",
        ],
    )

    return encounters


@frappe.whitelist(allow_guest=True)
def get_procedure_completed_checklists(clinical_procedure):
    """
    Used to get the current completed checklists given the clinical procedure
    """

    clinical_procedure_checklist_list = frappe.db.get_list(
        "Nursing Checklist",
        filters={"procedure": clinical_procedure},
        fields=[
            "checklist_template",
            "checklist_name",
            "name",
        ],
    )

    return clinical_procedure_checklist_list


@frappe.whitelist(allow_guest=True)
def get_patient_insurance(patient):
    """
    Used to get the current valid insurance categories for a patient given the patient
    """

    patient_insurance_categories = frappe.db.get_list(
        "Parent Medical Cover Detail",
        filters={"parent": patient},
        fields=["insurance__scheme", "principal_member", "membership_no", "is_default"],
    )

    return patient_insurance_categories

@frappe.whitelist(allow_guest=True)
def create_pacs_test(
    patient: str, item_code: str, encounter: str, pacs_prescription: str
):
    """
    Create pacs template given the patient and the item code
    """
    try:
        current_lab_prescription = None
        current_patient = frappe.get_doc("Patient", patient)
        current_encounter = frappe.get_doc("Patient Encounter", encounter)
        
        current_lab_prescription = frappe.get_doc(
                "Lab Prescription", pacs_prescription
        )
        current_lab_template = frappe.get_doc("Lab Test Template", {"item": item_code})
        
        doc = frappe.get_doc(
            {
                "department": current_lab_template.department,
                "descriptive_toggle": 0,
                "docstatus": 0,
                "doctype": "Lab Test",
                "inpatient_record": None,
                "patient_encounter": encounter,
                "lab_test_group": current_lab_template.lab_test_group,
                "lab_test_name": current_lab_template.lab_test_name,
                "legend_print_position": "",
                "medical_code": current_lab_template.medical_code,
                "name": "new-lab-test-1",
                "naming_series": "HLC-LAB-.YYYY.-",
                "normal_toggle": 0,
                "owner": "Administrator",
                "practitioner": current_encounter.practitioner,
                "patient": current_patient.name,
                "patient_age": current_patient.gch_patient_age,
                "patient_name": current_patient.name,
                "patient_sex": current_patient.sex,
                "printed": 0,
                "report_preference": "",
                "sensitivity_toggle": 0,
                "sms_sent": 0,
                "status": "Draft",
                "template": current_lab_template.item,
                "lab_test_comment": current_lab_prescription.lab_test_comment if current_lab_prescription.lab_test_comment else "",
                "branch": current_encounter.branch if current_encounter.branch else None,
            }
        )
        doc.insert()
        
        return doc
    except Exception as e:
        frappe.log_error(e, "create_pacs_test error/ rest.py")
        return None


@frappe.whitelist(allow_guest=True)
def create_lab_test(
    patient: str, item_code: str, encounter: str, lab_prescription: str = None
):
    """
    Used to create labtest given the patient and the item code
    """
    print(patient, item_code)
    try:
        current_lab_prescription = None
        current_patient = frappe.get_doc("Patient", patient)
        current_encounter = frappe.get_doc("Patient Encounter", encounter)
        if lab_prescription:
            current_lab_prescription = frappe.get_doc(
                "Lab Prescription", lab_prescription
            )
        current_lab_template = frappe.get_doc("Lab Test Template", {"item": item_code})
        
        doc = frappe.get_doc(
            {
                "department": current_lab_template.department,
                "descriptive_toggle": 0,
                "docstatus": 0,
                "doctype": "Lab Test",
                "inpatient_record": None,
                "patient_encounter": encounter,
                "lab_test_group": current_lab_template.lab_test_group,
                "lab_test_name": current_lab_template.lab_test_name,
                "legend_print_position": "",
                "medical_code": current_lab_template.medical_code,
                "name": "new-lab-test-1",
                "naming_series": "HLC-LAB-.YYYY.-",
                "normal_toggle": 0,
                "owner": "Administrator",
                "practitioner": current_encounter.practitioner,
                "patient": current_patient.name,
                "patient_age": current_patient.gch_patient_age,
                "patient_name": current_patient.name,
                "patient_sex": current_patient.sex,
                "printed": 0,
                "report_preference": "",
                "sensitivity_toggle": 0,
                "sms_sent": 0,
                "status": "Draft",
                "template": current_lab_template.item,
                "prescription": current_lab_prescription.name,
                "lab_test_comment": current_lab_prescription.lab_test_comment,
                "branch": current_encounter.branch if current_encounter.branch else None,
            }
        )
        doc.insert()

        # Update Lab Prescription with Created Lab Test
        current_lab_prescription.db_set("assigned_lab_test", doc.name)
        current_lab_prescription.db_set("assigned_test", 1)

        return doc

        return f"{current_lab_template.lab_test_name}: Created"
    except Exception as e:
        print(f"ERROR: {str(e)}")
        frappe.log_error(e, "LabTest Creatioj error")
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return None
        # return "Error on line {}".format(sys.exc_info()[-1].tb_lineno)


@frappe.whitelist(allow_guest=True)
def create_procedure_test(patient: str, procedure: str, encounter: str, inpatient = False):
    """
    Used to create labtest given the patient and the item code
    """
    print(patient, procedure)
    try:
        current_patient = frappe.get_doc("Patient", patient)
        current_procedure_template = frappe.get_doc(
            "Clinical Procedure Template", {"item": procedure}
        )
        if inpatient:
            doc = frappe.get_doc(
                {
                    "completed_nursing_checklist": [],
                    "consume_stock": 0,
                    "consumption_invoiced": 0,
                    "docstatus": 0,
                    "doctype": "Clinical Procedure",
                    "inpatient_record": None,
                    "invoice_separately_as_consumables": 0,
                    "invoiced": 0,
                    "items": [],
                    "medical_code": None,
                    "medical_department": None,
                    "name": "new-clinical-procedure-1",
                    "naming_series": "HLC-CPR-.YYYY.-",
                    "nursing_checklist": "",
                    "owner": "Administrator",
                    "patient": current_patient.name,
                    "patient_age": current_patient.gch_patient_age,
                    "patient_name": current_patient.name,
                    "patient_sex": current_patient.sex,
                    "procedure_template": current_procedure_template.name,
                    "inpatient_record": encounter,
                    "type": "Inpatient",
                    "status": "Draft",
                    "warehouse": "Stores - GCH",
                    "notes": ",",
                }
            )
            doc.insert(ignore_permissions=True)
            return doc
        else:
            doc = frappe.get_doc(
                {
                    "completed_nursing_checklist": [],
                    "consume_stock": 0,
                    "consumption_invoiced": 0,
                    "docstatus": 0,
                    "doctype": "Clinical Procedure",
                    "inpatient_record": None,
                    "invoice_separately_as_consumables": 0,
                    "invoiced": 0,
                    "items": [],
                    "medical_code": None,
                    "medical_department": None,
                    "name": "new-clinical-procedure-1",
                    "naming_series": "HLC-CPR-.YYYY.-",
                    "nursing_checklist": "",
                    "owner": "Administrator",
                    "patient": current_patient.name,
                    "patient_age": current_patient.gch_patient_age,
                    "patient_name": current_patient.name,
                    "patient_sex": current_patient.sex,
                    "procedure_template": current_procedure_template.name,
                    "patient_encounter": encounter,
                    "type": "Outpatient",
                    "status": "Draft",
                    "warehouse": "Stores - GCH",
                    "notes": ",",
                }
            )
            doc.insert(ignore_permissions=True)
            return doc
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return "Error on line {}".format(sys.exc_info()[-1].tb_lineno)


@frappe.whitelist(allow_guest=True)
def register_emergency_patient(
    first_name: str, last_name: str, sex: str, dob: str, middle_name: str = ""
):
    """
    Used to register a patient with first_name,last_name,sex and dob
    """
    try:
        
        # CHeck if patient exists in egerties
        # Check if patient exists in Kranium
        # If it doesnt exist in both create patient
        from gch_custom.services.erp_kranium_services import KraniumServicesController
        query =  """
            SELECT * FROM `tabPatient`
            WHERE (first_name LIKE %s OR last_name LIKE %s)
            AND dob = %s
        """
        patients = frappe.db.sql(query, (first_name, last_name, dob), as_dict=True)
        if len(patients) > 0:
            # frappe.throw("Patient already exists")
            results = {
                "type": "Egerties",
                "patients": patients
            }
            return results
        else:
            kranium_patients = KraniumServicesController.search_patient_on_kranium(first_name,last_name, dob)
            if isinstance(kranium_patients, dict) and "patients" in kranium_patients and len(kranium_patients["patients"]) > 0:
                results = {
                    "type": "Kranium",
                    "patients": kranium_patients["patients"]
                }
                return results
            
            else:        
                doc = frappe.get_doc(
                    {
                        "doctype": "Patient",
                        "first_name": first_name,
                        "middle_name": middle_name,
                        "last_name": last_name,
                        "sex": sex,
                        "dob": dob,
                    }
                )
                doc.insert(ignore_permissions=True, ignore_mandatory=True)
                results = {
                    "type": "New",
                    "patient": doc
                }

                return results
    except Exception as e:
        err = str(e)
        frappe.log_error(err, "ERROR searchingand creating patient  /rest.py")
        return e


@frappe.whitelist(allow_guest=True)
def get_scroll_table_data(encounter_name: str):
    """
    Used to
    """
    from gch_custom.services.prescription_controller import PrescriptionController

    try:
        current_encounter = frappe.get_doc("Patient Encounter", encounter_name)
        prescription_table = current_encounter.prescription_table
        print(prescription_table)

        data = []
        stock_table = frappe.qb.DocType("Bin")
        item_table = frappe.qb.DocType("Item")
        warehouse = PrescriptionController.get_user_warehouse()

        for prescription in prescription_table:
            print(prescription, "Prescrpition----------")

            drug_option = (
                frappe.qb.from_(item_table)
                .where(item_table.generic_drug == prescription.generic_drug)
                .where(item_table.disabled == 0)
                .inner_join(stock_table)
                .on(stock_table.item_code == item_table.name)
                .select(
                    item_table.name,
                    item_table.item_name,
                    stock_table.actual_qty,
                    item_table.display_name,
                    item_table.has_batch_no,
                )
                .where(stock_table.warehouse == warehouse)
                .orderby(item_table.display_name)
                .run(as_dict=True)
            )

            # drug_option = frappe.db.get_list(
            #     "Item",
            #     filters={"generic_drug": prescription.generic_drug, "disabled": 0},
            #     fields=[
            #         "name",
            #         "item_name",
            #         "display_name",
            #         "has_batch_no",
            #     ],
            # )
            generic_drug = prescription.generic_drug
            is_priority = frappe.db.get_list(
                "Generic Drug Name",
                filters={"name": generic_drug},
                fields=["name", "is_high_alert"],
            )
            data.append(
                {
                    "item": prescription,
                    "item_options": drug_option,
                    "high_alert": is_priority,
                }
            )

        return {"prescription_table": data}
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return e


@frappe.whitelist(allow_guest=True)
def update_prescription_table(id: str, value: str, column: str):
    """
    Used to
    """
    try:
        doc = frappe.get_doc("Doctor Prescription Table", id)

        if column == "pharmacy_dose":
            doc.pharmacy_dose = value

        elif column == "pharmacy_frequency":
            doc.pharmacy_frequency = value
        elif column == "pharmacy_duration":
            doc.pharmacy_duration = value
        elif column == "medication":
            doc.medication = value
        elif column == "billed_quantity":
            doc.billed_quantity = value
            doc.selling_quantity = value
        elif column == "discount":
            doc.discount = value
        elif column == "pharmacy_remark":
            doc.pharmacy_remark = value
        elif column == "do_not_issue":
            doc.dont_issue = value
        elif column == "selected_item_batch":
            doc.selected_item_batch = value
        else:
            return "Invalid Column"

        doc.save()
        return doc

    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return e


@frappe.whitelist(allow_guest=True)
def get_drugs():
    """
    Function to fetch all drugs in Generic Drug Name tables
    """
    try:
        DrugName = frappe.qb.DocType("Generic Drug Name")
        MedicalCode = frappe.qb.DocType("Medical Code")

        req_drugs = (
            frappe.qb.from_(DrugName)
            .inner_join(MedicalCode)
            .on(MedicalCode.name == DrugName.code)
            .select(DrugName.name, DrugName.generic_name)
            .where(
                (MedicalCode.medical_code_standard == "ATC")
                | (MedicalCode.medical_code_standard == "ICD-11-Nonmedicinal")
                | (MedicalCode.medical_code_standard == "ICD-11-Medicaments")
                | (MedicalCode.medical_code_standard == "GERTIES-GEN")
            )
            .orderby(DrugName.generic_name)
            .run(as_dict=True)
        )
        return req_drugs
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return []


@frappe.whitelist(allow_guest=True)
def get_routes():
    """
    Function to fetch all drugs in Generic Drug Name tables
    """
    try:
        doc = frappe.db.get_list("Generic Drug Route", fields=["drug_route"])
        return doc
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return []


@frappe.whitelist(allow_guest=True)
def get_drug_uom():
    """
    Function to fetch all drugs in Generic Drug Name tables
    """
    try:
        doc = frappe.db.get_list("Generic Drug UOM", fields=["preparation", "uom"])
        return doc
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return []


@frappe.whitelist(allow_guest=True)
def get_drug_item_name(generic_drug: str):
    """
    Function to fetch all drugs in Generic Drug Name tables
    """
    from gch_custom.services import PrescriptionController

    try:
        stock_table = frappe.qb.DocType("Bin")
        item_table = frappe.qb.DocType("Item")
        warehouse = PrescriptionController.get_user_warehouse()

        docy = (
            frappe.qb.from_(item_table)
            .where(item_table.generic_drug == generic_drug)
            .where(item_table.disabled == 0)
            .inner_join(stock_table)
            .on(stock_table.item_code == item_table.name)
            .select(
                item_table.name,
                item_table.item_name,
                stock_table.actual_qty,
                item_table.display_name,
                item_table.has_batch_no,
                item_table.valuation_rate,
                item_table.additional_label_info,
                item_table.sub_preparation_type,
                item_table.stock_uom,
            )
            .where(stock_table.warehouse == warehouse)
            .orderby(item_table.display_name)
            .run(as_dict=True)
        )

        # doc = frappe.db.get_list(
        #     "Item",
        #     filters={"generic_drug": generic_drug, "disabled": 0},
        #     fields=[
        #         "item_code",
        #         "item_name",
        #         "valuation_rate",
        #         "additional_label_info",
        #         "sub_preparation_type",
        #         "stock_uom",
        #         "has_batch_no",
        #     ],
        # )
        return docy
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return []


@frappe.whitelist(allow_guest=True)
def get_all_drug_items():
    """
    Function to fetch all drugs in Generic Drug Name tables
    """
    try:
        doc = frappe.db.get_list(
            "Item",
            filters={"disabled": 0},
            fields=[
                "item_code",
                "item_name",
                "valuation_rate",
                "additional_label_info",
                "sub_preparation_type",
                "stock_uom",
                "has_batch_no",
            ],
        )
        return doc
    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return []


@frappe.whitelist(allow_guest=True)
def check_if_code_exists_within_code_standard(**args):
    """
    Function for preventing duplicate codes with a medical code standard
    """

    medical_code_standard = args["medical_code_standard"]
    code = args["code"]

    try:
        doc = frappe.db.get_list(
            "Medical Code",
            filters={"is_group": 0, "medical_code_standard": medical_code_standard},
            fields=[
                "code",
                "medical_code_standard",
            ],
        )

        for item in doc:
            if item.code == code:
                frappe.throw(
                    "Cannot have duplicate codes within the same medical standard"
                )
                break

    except Exception as e:
        frappe.log_error(e, "REST ERROR  /rest.py")
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return []


@frappe.whitelist(allow_guest=True)
def invoice_procedure_consumables(encounter: str="", procedure: str="", inpatient_record:str=""):
    """Get all consumables used in a procedure"""
    try:
    
        invoice = ""
        patient=""

        CURRENT_INVOICED_ITEMS = []
        ALL_CONSUMABLES = []

        procedure_done =  frappe.get_doc("Clinical Procedure", procedure)
        

        if procedure_done.type == "Inpatient":
            encounter = procedure_done.inpatient_record
            current_encounter = frappe.get_doc("Inpatient Record", encounter)
            invoice= current_encounter.sales_invoice
            patient= current_encounter.patient
            procedure_test_item = WorkflowController.create_invoice_item(
                procedure_done.procedure_template,
                "Nos",
                1,
                "",
                "",
                "",
                1
            )
            ALL_CONSUMABLES.append(procedure_test_item)
        
        elif procedure_done.type == "Outpatient":
            encounter = procedure_done.patient_encounter
            current_encounter = frappe.get_doc("Patient Encounter", encounter)
            patient = current_encounter.patient
            invoice= current_encounter.sales_invoice
            
        if encounter=="":
            frappe.log_error("INFO: Calling invoice consumbles without encounter or inpatient record", "billing consumables /rest.py")
            return  
        all_consumed_items = frappe.db.get_list(
                "Clinical Procedure Item",
                {"parent": procedure, "invoice_separately_as_consumables": 1},
                ["name", "item_code", "qty", "uom", "batch_no"],
            )
        
        
        
        if patient == "":
            frappe.log_error("INFO: Calling invoice consumbles without patient", "billing consumables /rest.py")
            return
        
        patient_ = frappe.get_doc("Patient", patient)
        customer_group = patient_.customer_group
            
        if all_consumed_items:
            for consumable in all_consumed_items:
                item = WorkflowController.create_invoice_item(
                    consumable["item_code"],
                    consumable["uom"],
                    consumable["qty"],
                    customer_group,
                    consumable["batch_no"],
                )
                ALL_CONSUMABLES.append(item)
        # Create the invoice

        created_invoice = invoice_encounter_items(
            patient_, ALL_CONSUMABLES, encounter, invoice, CURRENT_INVOICED_ITEMS,"",procedure_done.type
        )

        return "Invoice Updated Successfully : " + created_invoice.name   
    except Exception as e:
        frappe.log_error(e, "REST ERROR invoicing procedure  /rest.py")
        print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return []


@frappe.whitelist(allow_guest=True)
def invoice_dental_procedure_consumables(**args):
    """Get all consumables used in a dental procedure"""
    all_consumed_dental_items = frappe.db.get_list(
        "Dental Clinic Procedure",
        {"parent": args["dental_procedure"]},
        ["name", "item_code", "qty", "uom", "batch_no"],
    )
    invoice = ""
    CURRENT_INVOICED_ITEMS = []
    ALL_CONSUMABLES = []
    current_encounter = frappe.get_doc("Patient Encounter", args["patient_encounter"])
    patient = current_encounter.patient
    patient_ = frappe.get_doc("Patient", patient)
    customer_group = patient_.customer_group
    # Get current invoice or create one
    try:
        has_invoice = frappe.db.count("Sales Invoice", {"encounter": encounter})
        if has_invoice:
            invoice = frappe.db.get_value(
                "Sales Invoice", {"encounter": encounter}, ["name", "docstatus"]
            )
    except Exception as e:
        print(e)

    # Checking if invoice is submitted to avoid adding the item to invoice

    if invoice[-1] == 0:
        if all_consumed_items:
            for consumable in all_consumed_items:
                item = WorkflowController.create_invoice_item(
                    consumable["item_code"],
                    consumable["uom"],
                    consumable["qty"],
                    customer_group,
                    consumable["batch_no"],
                )
                ALL_CONSUMABLES.append(item)
        # Create the invoice

        created_invoice = invoice_encounter_items(
            patient_, ALL_CONSUMABLES, encounter, invoice[0], CURRENT_INVOICED_ITEMS
        )

        return "Invoice Updated Successfully : " + created_invoice.name


@frappe.whitelist(allow_guest=True)
def adding_dental_procedures_to_invoice(**args):
    invoice = ""
    CURRENT_INVOICED_ITEMS = []
    ALL_DENTAL_PROCEDURE_ITEMS = []

    dental_procedures = args["procedures"]
    encounter = args["encounter"]

    current_encounter = frappe.get_doc("Patient Encounter", encounter)
    patient = current_encounter.patient
    patient_ = frappe.get_doc("Patient", patient)
    customer_group = patient_.customer_group

    # Get current invoice or create one
    try:
        has_invoice = frappe.db.count("Sales Invoice", {"encounter": encounter})
        if has_invoice:
            invoice = frappe.db.get_value(
                "Sales Invoice", {"encounter": encounter}, ["name", "docstatus"]
            )
        else:
            print("No invoice")
    except Exception as e:
        print(e)

    procedure_dic = eval(dental_procedures)

    # print(procedure_dic)

    # Checking if invoice is submitted to avoid adding the item to invoice

    if invoice[-1] == 0:
        for procedure, quantity in procedure_dic.items():
            print(procedure, ":", quantity, "\n\n\n procedure and quntity")

            item = WorkflowController.create_invoice_item(
                procedure, "Unit", quantity, customer_group, "", "", "", 1
            )
            ALL_DENTAL_PROCEDURE_ITEMS.append(item)

        print(ALL_DENTAL_PROCEDURE_ITEMS, "\n\n")

        # Create the invoice

        created_invoice = invoice_encounter_items(
            patient_,
            ALL_DENTAL_PROCEDURE_ITEMS,
            encounter,
            invoice[0],
            CURRENT_INVOICED_ITEMS,
        )

        # print(created_invoice)

        return True


@frappe.whitelist(allow_guest=True)
def add_dental_diagnosis_and_prescription_to_encounter(**args):
    # Get patient encounter
    # diagnosis_table = frappe.get_doc("Codification Table", args["patient_encounter"])
    physical_examination = args["physical_examination"]
    patient_history = args["patient_history"]
    medical_codes = args["medical_codes"]
    plan_of_action = args["plan_of_action"]
    doctor_prescriptions = args["doctor_prescriptions"]
    service_referrals = args["service_referrals"]
    radiology_details = args["radiology_details"]
    lab_tests = args["lab_tests"]

    physicals = list(eval(physical_examination))
    history = list(eval(patient_history))
    codes = list(eval(medical_codes))
    care_objectives = list(eval(plan_of_action))
    prescriptions = list(eval(doctor_prescriptions))
    referrals = list(eval(service_referrals))
    radiology_details = list(eval(radiology_details))
    lab_tests = list(eval(lab_tests))

    count_physicals = -1

    for i in physicals:
        count_physicals = count_physicals + 1

        print(physicals, "physicallsssss")

        # if physicals[count_physicals].get("patient_encounter_central_nervous_system") is not None:
        #     print("AVAILABLE\n\n\n\n")
        # else:
        #     print("Ongeeeee bwana\n\n\n")

        try:
            doc = frappe.get_doc(
                {
                    "doctype": i["doctype"],
                    "creation": i["creation"],
                    "docstatus": 0,
                    "name": i["name"],
                    "parent": args["patient_encounter"],
                    "parentfield": "patient_physical_examination",
                    "modified": i["modified"],
                    "modified_by": i["modified_by"],
                    "owner": i["owner"],
                    "parenttype": "Patient Encounter",
                    "patient_encounter_abdomen": i["patient_encounter_abdomen"]
                    if physicals[count_physicals].get("patient_encounter_abdomen")
                    is not None
                    else " ",
                    "patient_encounter_cardiovascular_system": i[
                        "patient_encounter_cardiovascular_system"
                    ]
                    if physicals[count_physicals].get(
                        "patient_encounter_cardiovascular_system"
                    )
                    is not None
                    else " ",
                    "patient_encounter_central_nervous_system": i[
                        "patient_encounter_central_nervous_system"
                    ]
                    if physicals[count_physicals].get(
                        "patient_encounter_central_nervous_system"
                    )
                    is not None
                    else " ",
                    "patient_encounter_ear_nose_and_throat": i[
                        "patient_encounter_ear_nose_and_throat"
                    ]
                    if physicals[count_physicals].get(
                        "patient_encounter_ear_nose_and_throat"
                    )
                    is not None
                    else " ",
                    "patient_encounter_eyes": i["patient_encounter_eyes"]
                    if physicals[count_physicals].get("patient_encounter_eyes")
                    is not None
                    else " ",
                    "patient_encounter_general": i["patient_encounter_general"]
                    if physicals[count_physicals].get("patient_encounter_general")
                    is not None
                    else " ",
                    "patient_encounter_genitourinary": i[
                        "patient_encounter_genitourinary"
                    ]
                    if physicals[count_physicals].get("patient_encounter_genitourinary")
                    is not None
                    else " ",
                    "patient_encounter_musculoskeletal": i[
                        "patient_encounter_musculoskeletal"
                    ]
                    if physicals[count_physicals].get(
                        "patient_encounter_musculoskeletal"
                    )
                    is not None
                    else " ",
                    "patient_encounter_respiratory_system": i[
                        "patient_encounter_respiratory_system"
                    ]
                    if physicals[count_physicals].get(
                        "patient_encounter_respiratory_system"
                    )
                    is not None
                    else " ",
                    "patient_encounter_skin": i["patient_encounter_skin"]
                    if physicals[count_physicals].get("patient_encounter_skin")
                    is not None
                    else " ",
                }
            )

            doc.insert(ignore_permissions=True)

            print(doc)

        except Exception as e:
            print(e)
            frappe.log_error(e, "CREATE PHYSICAL EXAMINATION ROW ERROR  /rest.py")
            return {"message": e}

    count_history = -1

    for i in history:
        count_history = count_history + 1

        # if "patient_encounter_chief_complaint" in history:
        #     chief_complaint = i["patient_encounter_chief_complaint"]
        # else:
        #     chief_complaint = " "

        # print(chief_complaint, "Complaiiiiiiiiiiiiiiiinttttttttttttttttt\n\n\n")

        try:
            doc = frappe.get_doc(
                {
                    "doctype": i["doctype"],
                    "creation": i["creation"],
                    "docstatus": 0,
                    "name": i["name"],
                    "parent": args["patient_encounter"],
                    "parentfield": "patient_history",
                    "modified": i["modified"],
                    "modified_by": i["modified_by"],
                    "owner": i["owner"],
                    "parenttype": "Patient Encounter",
                    "patient_encounter_chief_complaint": i[
                        "patient_encounter_chief_complaint"
                    ]
                    if history[count_history].get("patient_encounter_chief_complaint")
                    is not None
                    else " ",
                    "patient_encounter_chronic_care_med_history": i[
                        "patient_encounter_chronic_care_med_history"
                    ]
                    if history[count_history].get(
                        "patient_encounter_chronic_care_med_history"
                    )
                    is not None
                    else " ",
                    "patient_encounter_family_history": i[
                        "patient_encounter_family_history"
                    ]
                    if history[count_history].get("patient_encounter_family_history")
                    is not None
                    else " ",
                    "patient_encounter_history_of_present_illness": i[
                        "patient_encounter_history_of_present_illness"
                    ]
                    if history[count_history].get(
                        "patient_encounter_history_of_present_illness"
                    )
                    is not None
                    else " ",
                    "patient_encounter_milestones": i["patient_encounter_milestones"]
                    if history[count_history].get("patient_encounter_milestones")
                    is not None
                    else " ",
                    "patient_encounter_nutrition_history": i[
                        "patient_encounter_nutrition_history"
                    ]
                    if history[count_history].get("patient_encounter_nutrition_history")
                    is not None
                    else " ",
                    "patient_encounter_other_immunization": i[
                        "patient_encounter_other_immunization"
                    ]
                    if history[count_history].get(
                        "patient_encounter_other_immunization"
                    )
                    is not None
                    else " ",
                    "patient_encounter_other_relevant_history": i[
                        "patient_encounter_other_relevant_history"
                    ]
                    if history[count_history].get(
                        "patient_encounter_other_relevant_history"
                    )
                    is not None
                    else " ",
                    "patient_encounter_past_medical_history": i[
                        "patient_encounter_past_medical_history"
                    ]
                    if history[count_history].get(
                        "patient_encounter_past_medical_history"
                    )
                    is not None
                    else " ",
                    "patient_encounter_socio_economic_history": i[
                        "patient_encounter_socio_economic_history"
                    ]
                    if history[count_history].get(
                        "patient_encounter_socio_economic_history"
                    )
                    is not None
                    else " ",
                    "patient_encounter_systematic_enquiry": i[
                        "patient_encounter_systematic_enquiry"
                    ]
                    if history[count_history].get(
                        "patient_encounter_systematic_enquiry"
                    )
                    is not None
                    else " ",
                }
            )

            doc.insert(ignore_permissions=True)

            print(doc)

        except Exception as e:
            print(e)
            frappe.log_error(e, "CREATE PATIENT HISTORY ROW ERROR  /rest.py")
            return {"message": e}

    for i in codes:
        try:
            doc = frappe.get_doc(
                {
                    "doctype": i["doctype"],
                    "code": i["code"],
                    "creation": i["creation"],
                    "description": i["description"],
                    "docstatus": 0,
                    "is_communicable": int(i["is_communicable"]),
                    "is_significant": int(i["is_significant"]),
                    "name": i["name"],
                    "parent": args["patient_encounter"],
                    "parentfield": "diagnosis_table",
                    "modified": i["modified"],
                    "modified_by": i["modified_by"],
                    "owner": i["owner"],
                    "parenttype": "Patient Encounter",
                    "medical_code": i["medical_code"],
                }
            )

            doc.insert(ignore_permissions=True)

            print(doc)

        except Exception as e:
            print(e)
            frappe.log_error(e, "CREATE DENTAL DIAGNOSIS ROW ERROR  /rest.py")
            return {"message": e}

    for i in care_objectives:
        try:
            doc = frappe.get_doc(
                {
                    "doctype": i["doctype"],
                    "creation": i["creation"],
                    "docstatus": 0,
                    "name": i["name"],
                    "parent": args["patient_encounter"],
                    "parentfield": "patient_plan_of_action_notes",
                    "modified": i["modified"],
                    "modified_by": i["modified_by"],
                    "owner": i["owner"],
                    "parenttype": "Patient Encounter",
                    "patient_encounter_plan_of_action_notes": i[
                        "patient_encounter_plan_of_action_notes"
                    ],
                }
            )

            doc.insert(ignore_permissions=True)

            print(doc)

        except Exception as e:
            print(e)
            frappe.log_error(e, "CREATE CARE OBJECTIVE ROW ERROR  /rest.py")
            return {"message": e}

    for i in prescriptions:
        try:
            doc = frappe.get_doc(
                {
                    "doctype": i["doctype"],
                    # "available_quantity": i["available_quantity"],
                    # "additional_item_info" : i["additional_item_info"],
                    # "discount": i["discount"],
                    "creation": i["creation"],
                    "age": i["age"],
                    "docstatus": i["docstatus"],
                    "bmi": i["bmi"],
                    "name": i["name"],
                    "parent": args["patient_encounter"],
                    "parentfield": i["parentfield"],
                    "parenttype": "Patient Encounter",
                    "modified": i["modified"],
                    "modified_by": i["modified_by"],
                    "owner": i["owner"],
                    # "brand" : i["brand"],
                    "dob": i["dob"],
                    "dont_issue": i["dont_issue"],
                    "dont_issue_reason": i["dont_issue_reason"],
                    "dose": i["dose"],
                    "dose_uom": i["dose_uom"],
                    "duration": i["duration"],
                    "frequency_type": i["frequency_type"],
                    "generic_drug": i["generic_drug"],
                    "generic_drug_name": i["generic_drug_name"],
                    "height_in_centimeters": i["height_in_centimeters"],
                    # "item_description" : i["item_description"],
                    # "item_name" : i["item_name"],
                    # "medication" : i["medication"],
                    "period_type": i["period_type"],
                    # "pharmacy_duration" : i["pharmacy_duration"],
                    # "pharmacy_frequency" : i["pharmacy_frequency"],
                    "prescription_frequency": i["prescription_frequency"],
                    "refill_type": i["refill_type"],
                    "refillable": i["refillable"],
                    # "remarks" : i["remarks"],
                    "route": i["route"],
                    # "selling_quantity" : i["selling_quantity"],
                    "preparation_type": i["preparation_type"],
                    # "unit_of_measure" : i["unit_of_measure"],
                    # "unit_price" : i["unit_price"],
                    "weight_in_kilograms": i["weight_in_kilograms"],
                }
            )

            doc.insert(ignore_permissions=True)

            print(doc)

        except Exception as e:
            print(e)
            frappe.log_error(e, "CREATE DENTAL DIAGNOSIS ROW ERROR  /rest.py")
            return {"message": e}

    count_referrals = -1

    for i in referrals:
        count_referrals = count_referrals + 1

        try:
            doc = frappe.get_doc(
                {
                    "doctype": i["doctype"],
                    "creation": i["creation"],
                    "docstatus": 0,
                    "name": i["name"],
                    "parent": args["patient_encounter"],
                    "parentfield": "service_referral",
                    "modified": i["modified"],
                    "modified_by": i["modified_by"],
                    "owner": i["owner"],
                    "parenttype": "Patient Encounter",
                    "service_referral": i["service_referral"]
                    if referrals[count_referrals].get("service_referral") is not None
                    else " ",
                    "description": i["description"]
                    if referrals[count_referrals].get("description") is not None
                    else " ",
                }
            )

            doc.insert(ignore_permissions=True)

            print(doc)

        except Exception as e:
            print(e)
            frappe.log_error(e, "CREATE SERVICE REFERRAL ROW ERROR  /rest.py")
            return {"message": e}

    count_radiology = -1

    for i in radiology_details:
        count_radiology = count_radiology + 1

        try:
            doc = frappe.get_doc(
                {
                    "doctype": i["doctype"],
                    "creation": i["creation"],
                    "docstatus": 0,
                    "name": i["name"],
                    "parent": args["patient_encounter"],
                    "parentfield": i["parentfield"],
                    "modified": i["modified"],
                    "modified_by": i["modified_by"],
                    "invoiced": i["invoiced"],
                    "lab_test_code": i["lab_test_code"],
                    "lab_test_comment": i["lab_test_comment"]
                    if radiology_details[count_radiology].get("lab_test_comment")
                    is not None
                    else " ",
                    "lab_test_created": i["lab_test_created"],
                    "lab_test_name": i["lab_test_name"],
                    "owner": i["owner"],
                    "parenttype": "Patient Encounter",
                }
            )

            doc.insert(ignore_permissions=True)

            print(doc)

        except Exception as e:
            print(e)
            frappe.log_error(e, "CREATE RADIOLOGY ROW ERROR  /rest.py")
            return {"message": e}

    count_lab_tests = -1

    for i in lab_tests:
        count_lab_tests = count_lab_tests + 1

        try:
            doc = frappe.get_doc(
                {
                    "doctype": i["doctype"],
                    "creation": i["creation"],
                    "docstatus": 0,
                    "name": i["name"],
                    "parent": args["patient_encounter"],
                    "parentfield": "lab_test_prescription",
                    "modified": i["modified"],
                    "modified_by": i["modified_by"],
                    "invoiced": i["invoiced"],
                    "lab_test_code": i["lab_test_code"],
                    "lab_test_comment": i["lab_test_comment"]
                    if lab_tests[count_lab_tests].get("lab_test_comment") is not None
                    else " ",
                    "lab_test_created": i["lab_test_created"],
                    "lab_test_name": i["lab_test_name"],
                    "owner": i["owner"],
                    "parenttype": "Patient Encounter",
                }
            )

            doc.insert(ignore_permissions=True)

            print(doc)

        except Exception as e:
            print(e)
            frappe.log_error(e, "CREATE LAB TEST ROW ERROR  /rest.py")
            return {"message": e}

    return True


@frappe.whitelist(allow_guest=True)
def add_clinical_records_to_enconter(**args):
    # Get patient encounter
    # diagnosis_table = frappe.get_doc("Codification Table", args["patient_encounter"])
    physical_examination = args["physical_examination"]
    patient_history = args["patient_history"]
    plan_of_action = args["plan_of_action"]
    nursing_chief_complaint = args["nursing_chief_complaint"]
    service_referrals = args["service_referrals"]

    nurse_notes = args["nursing_notes"]
    encounter = args["encounter"]

    physicals = list(eval(physical_examination))
    history = list(eval(patient_history))
    care_objectives = list(eval(plan_of_action))
    nursing_chief_complaint = list(eval(nursing_chief_complaint))
    referrals = list(eval(service_referrals))

    # Adding NUrsing Notes to Encounter
    try:
        frappe.db.set_value(
            "Patient Encounter",
            encounter,
            {"nurse_notes": nurse_notes},
            update_modified=False,
        )
        print(True)

    except Exception as e:
        print(False)

    # Adding Physical Examination to Encounter
    count_physicals = -1

    for i in physicals:
        count_physicals = count_physicals + 1

        print(physicals, "physicallsssss")

        # if physicals[count_physicals].get("patient_encounter_central_nervous_system") is not None:
        #     print("AVAILABLE\n\n\n\n")
        # else:
        #     print("Ongeeeee bwana\n\n\n")

        try:
            doc = frappe.get_doc(
                {
                    "doctype": i["doctype"],
                    "creation": i["creation"],
                    "docstatus": 0,
                    "name": i["name"],
                    "parent": args["patient_encounter"],
                    "parentfield": "patient_physical_examination",
                    "modified": i["modified"],
                    "modified_by": i["modified_by"],
                    "owner": i["owner"],
                    "parenttype": "Patient Encounter",
                    "patient_encounter_abdomen": i["patient_encounter_abdomen"]
                    if physicals[count_physicals].get("patient_encounter_abdomen")
                    is not None
                    else " ",
                    "patient_encounter_cardiovascular_system": i[
                        "patient_encounter_cardiovascular_system"
                    ]
                    if physicals[count_physicals].get(
                        "patient_encounter_cardiovascular_system"
                    )
                    is not None
                    else " ",
                    "patient_encounter_central_nervous_system": i[
                        "patient_encounter_central_nervous_system"
                    ]
                    if physicals[count_physicals].get(
                        "patient_encounter_central_nervous_system"
                    )
                    is not None
                    else " ",
                    "patient_encounter_ear_nose_and_throat": i[
                        "patient_encounter_ear_nose_and_throat"
                    ]
                    if physicals[count_physicals].get(
                        "patient_encounter_ear_nose_and_throat"
                    )
                    is not None
                    else " ",
                    "patient_encounter_eyes": i["patient_encounter_eyes"]
                    if physicals[count_physicals].get("patient_encounter_eyes")
                    is not None
                    else " ",
                    "patient_encounter_general": i["patient_encounter_general"]
                    if physicals[count_physicals].get("patient_encounter_general")
                    is not None
                    else " ",
                    "patient_encounter_genitourinary": i[
                        "patient_encounter_genitourinary"
                    ]
                    if physicals[count_physicals].get("patient_encounter_genitourinary")
                    is not None
                    else " ",
                    "patient_encounter_musculoskeletal": i[
                        "patient_encounter_musculoskeletal"
                    ]
                    if physicals[count_physicals].get(
                        "patient_encounter_musculoskeletal"
                    )
                    is not None
                    else " ",
                    "patient_encounter_respiratory_system": i[
                        "patient_encounter_respiratory_system"
                    ]
                    if physicals[count_physicals].get(
                        "patient_encounter_respiratory_system"
                    )
                    is not None
                    else " ",
                    "patient_encounter_skin": i["patient_encounter_skin"]
                    if physicals[count_physicals].get("patient_encounter_skin")
                    is not None
                    else " ",
                }
            )

            doc.insert(ignore_permissions=True)

            print(doc)

        except Exception as e:
            print(e)
            frappe.log_error(e, "CREATE PHYSICAL EXAMINATION ROW ERROR  /rest.py")
            return {"message": e}

    count_history = -1

    for i in history:
        count_history = count_history + 1

        # if "patient_encounter_chief_complaint" in history:
        #     chief_complaint = i["patient_encounter_chief_complaint"]
        # else:
        #     chief_complaint = " "

        # print(chief_complaint, "Complaiiiiiiiiiiiiiiiinttttttttttttttttt\n\n\n")

        try:
            doc = frappe.get_doc(
                {
                    "doctype": i["doctype"],
                    "creation": i["creation"],
                    "docstatus": 0,
                    "name": i["name"],
                    "parent": args["patient_encounter"],
                    "parentfield": "patient_history",
                    "modified": i["modified"],
                    "modified_by": i["modified_by"],
                    "owner": i["owner"],
                    "parenttype": "Patient Encounter",
                    "patient_encounter_chief_complaint": i[
                        "patient_encounter_chief_complaint"
                    ]
                    if history[count_history].get("patient_encounter_chief_complaint")
                    is not None
                    else " ",
                    "patient_encounter_chronic_care_med_history": i[
                        "patient_encounter_chronic_care_med_history"
                    ]
                    if history[count_history].get(
                        "patient_encounter_chronic_care_med_history"
                    )
                    is not None
                    else " ",
                    "patient_encounter_family_history": i[
                        "patient_encounter_family_history"
                    ]
                    if history[count_history].get("patient_encounter_family_history")
                    is not None
                    else " ",
                    "patient_encounter_history_of_present_illness": i[
                        "patient_encounter_history_of_present_illness"
                    ]
                    if history[count_history].get(
                        "patient_encounter_history_of_present_illness"
                    )
                    is not None
                    else " ",
                    "patient_encounter_milestones": i["patient_encounter_milestones"]
                    if history[count_history].get("patient_encounter_milestones")
                    is not None
                    else " ",
                    "patient_encounter_nutrition_history": i[
                        "patient_encounter_nutrition_history"
                    ]
                    if history[count_history].get("patient_encounter_nutrition_history")
                    is not None
                    else " ",
                    "patient_encounter_other_immunization": i[
                        "patient_encounter_other_immunization"
                    ]
                    if history[count_history].get(
                        "patient_encounter_other_immunization"
                    )
                    is not None
                    else " ",
                    "patient_encounter_other_relevant_history": i[
                        "patient_encounter_other_relevant_history"
                    ]
                    if history[count_history].get(
                        "patient_encounter_other_relevant_history"
                    )
                    is not None
                    else " ",
                    "patient_encounter_past_medical_history": i[
                        "patient_encounter_past_medical_history"
                    ]
                    if history[count_history].get(
                        "patient_encounter_past_medical_history"
                    )
                    is not None
                    else " ",
                    "patient_encounter_socio_economic_history": i[
                        "patient_encounter_socio_economic_history"
                    ]
                    if history[count_history].get(
                        "patient_encounter_socio_economic_history"
                    )
                    is not None
                    else " ",
                    "patient_encounter_systematic_enquiry": i[
                        "patient_encounter_systematic_enquiry"
                    ]
                    if history[count_history].get(
                        "patient_encounter_systematic_enquiry"
                    )
                    is not None
                    else " ",
                }
            )

            doc.insert(ignore_permissions=True)

            print(doc)

        except Exception as e:
            print(e)
            frappe.log_error(e, "CREATE PATIENT HISTORY ROW ERROR  /rest.py")
            return {"message": e}

    for i in care_objectives:
        try:
            doc = frappe.get_doc(
                {
                    "doctype": i["doctype"],
                    "creation": i["creation"],
                    "docstatus": 0,
                    "name": i["name"],
                    "parent": args["patient_encounter"],
                    "parentfield": "patient_plan_of_action_notes",
                    "modified": i["modified"],
                    "modified_by": i["modified_by"],
                    "owner": i["owner"],
                    "parenttype": "Patient Encounter",
                    "patient_encounter_plan_of_action_notes": i[
                        "patient_encounter_plan_of_action_notes"
                    ],
                }
            )

            doc.insert(ignore_permissions=True)

            print(doc)

        except Exception as e:
            print(e)
            frappe.log_error(e, "CREATE CARE OBJECTIVE ROW ERROR  /rest.py")
            return {"message": e}

    for i in nursing_chief_complaint:
        try:
            doc = frappe.get_doc(
                {
                    "doctype": i["doctype"],
                    "creation": i["creation"],
                    "docstatus": 0,
                    "duration": 0,
                    "name": i["name"],
                    "parent": args["patient_encounter"],
                    "parentfield": "nursing_chief_complaint",
                    "modified": i["modified"],
                    "modified_by": i["modified_by"],
                    "owner": i["owner"],
                    "parenttype": "Patient Encounter",
                    "chief_complaint": i["chief_complaint"],
                }
            )

            doc.insert(ignore_permissions=True)

            print(doc)

        except Exception as e:
            print(e)
            frappe.log_error(e, "CREATE NURSE CHIEF COMPLAINT ROW ERROR  /rest.py")
            return {"message": e}

    count_referrals = -1

    for i in referrals:
        count_referrals = count_referrals + 1

        try:
            doc = frappe.get_doc(
                {
                    "doctype": i["doctype"],
                    "creation": i["creation"],
                    "docstatus": 0,
                    "name": i["name"],
                    "parent": args["patient_encounter"],
                    "parentfield": "service_referral",
                    "modified": i["modified"],
                    "modified_by": i["modified_by"],
                    "owner": i["owner"],
                    "parenttype": "Patient Encounter",
                    "service_referral": i["service_referral"]
                    if referrals[count_referrals].get("service_referral") is not None
                    else " ",
                    "description": i["description"]
                    if referrals[count_referrals].get("description") is not None
                    else " ",
                }
            )

            doc.insert(ignore_permissions=True)

            print(doc)

        except Exception as e:
            print(e)
            frappe.log_error(e, "CREATE SERVICE REFERRAL ROW ERROR  /rest.py")
            return {"message": e}

    return True


@frappe.whitelist(allow_guest=True)
def fetch_patient_data(**args):
    patient = args["patient"]
    data = frappe.get_doc("Patient", patient)
    return data


@frappe.whitelist(allow_guest=True)
def fetch_encounter_data(**args):
    patient = args["patient"]
    data = frappe.get_list(
        "Patient Encounter",
        filters={"patient": args["patient"]},
        fields=[
            # "diagnosis_table",
            "relative_with_ear_surgery",
            "relative_with_hearing_loss",
            "relative_with_hearing_devices",
            "nurse_notes",
            "encounter_date",
            "encounter_time",
            "done_by",
            # "patient_history",
            "right_ear_results",
            "left_ear_results",
            "_followup_actions",
            "creation",
            "name",
            "modified",
        ],
        order_by="modified",
    )
    return data


@frappe.whitelist(allow_guest=True)
def fetch_significant_diagnosis(**args):
    enc_list = eval(args["enc_list"])

    significant_diag_list = []

    for enc in enc_list:
        significant_diag_list.append(enc)
        significant_diag = frappe.get_list(
            "Codification Table",
            filters={"parent": enc, "is_significant": 1},
            fields=["code", "medical_code", "description"],
        )

        significant_diag_list.append(significant_diag)

    return significant_diag_list


@frappe.whitelist(allow_guest=True)
def fetch_chronic_medication(**args):
    enc_list = eval(args["enc_list"])

    chronic_med_list = []

    for enc in enc_list:
        chronic_med_list.append(enc)
        chronic_med = frappe.get_list(
            "Doctor Prescription Table",
            filters={"parent": enc, "is_chronic": 1},
            fields=["item_name", "modified"],
        )

        chronic_med_list.append(chronic_med)

    return chronic_med_list


@frappe.whitelist(allow_guest=True)
def fetch_patient_history(**args):
    enc_list = eval(args["enc_list"])

    patient_history_list = []

    for enc in enc_list:
        patient_history_list.append(enc)
        patient_history = frappe.get_list(
            "Patient Encounter History Details",
            filters={"parent": enc},
            fields=[
                "patient_encounter_family_history",
                "patient_encounter_other_relevant_history",
                "patient_encounter_past_medical_history",
                "creation",
                "modified",
            ],
            order_by="modified",
        )

        patient_history_list.append(patient_history)

    return patient_history_list


@frappe.whitelist(allow_guest=True)
def fetch_patient_allergies(**args):
    enc_list = eval(args["enc_list"])

    drug_allergies_list = []
    food_allergies_list = []
    other_allergies_list = []

    for enc in enc_list:
        drug_allergies_list.append(enc)
        drug_allergies = frappe.get_list(
            "Patient Drug Allergy",
            filters={"parent": enc},
            fields=["drug_allergy", "modified"],
            order_by="modified",
        )

        drug_allergies_list.append(drug_allergies)

    for enc in enc_list:
        food_allergies_list.append(enc)
        food_allergies = frappe.get_list(
            "Patient Food Allergy",
            filters={"parent": enc},
            fields=["food_allergy", "modified"],
            order_by="modified",
        )

        food_allergies_list.append(food_allergies)

    for enc in enc_list:
        other_allergies_list.append(enc)
        other_allergies = frappe.get_list(
            "Patient Other Allergy",
            filters={"parent": enc},
            fields=["other_allergy", "modified"],
            order_by="modified",
        )

        other_allergies_list.append(other_allergies)

    return drug_allergies_list, food_allergies_list, other_allergies_list


@frappe.whitelist(allow_guest=True)
def is_invoice_open(**args):
    encounter = args["encounter_number"]

    try:
        invoice = frappe.get_list(
            "Sales Invoice",
            filters={"encounter": encounter, "docstatus": 0},
            fields=["name"],
        )

        print(invoice)
        return True

    except Exception as e:
        print(e)


@frappe.whitelist(allow_guest=True)
def check_if_insurance_suspended(**args):
    insurance_catgry = args["insurance_category"]

    try:
        if insurance_catgry:
            doc = frappe.get_doc("Insurance Category", insurance_catgry)
            return doc
    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def update_enc_insurance_from_sales_invoice(**args):
    changed_insurance = args["changed_default_insurance"]
    encounter = args["encounter"] or " "

    try:
        insurance_doc = frappe.get_doc("Insurance Category", changed_insurance)

        frappe.db.set_value(
            "Patient Encounter",
            encounter,
            {
                "default_insurance": insurance_doc.name,
                "insurance_category_name": insurance_doc.display_name,
                "insurance_category_employer": insurance_doc.outpatient_insurance_company,
            },
            update_modified=False,
        )

        return True
    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def update_sales_invoice_insurance_from_enc(**args):
    changed_insurance = args["changed_default_insurance"]
    invoice = args["invoice_number"]

    try:
        insurance_doc = frappe.get_doc("Insurance Category", changed_insurance)

        frappe.db.set_value(
            "Sales Invoice",
            invoice,
            {
                "default_insurance": insurance_doc.name,
                "insurance_category_name": insurance_doc.display_name,
                "insurance_category_employer": insurance_doc.outpatient_insurance_company,
                "insurance_outpatient_limit": insurance_doc.outpatient_cover_limit,
                "insurance_inpatient_company_name": insurance_doc.inpatient_insurance_company,
                "insurance_inpatient_limit": insurance_doc.inpatient_cover_limit,
            },
        )

        return True
    except Exception as e:
        return e

@frappe.whitelist(allow_guest=True)
def update_sales_invoice_membership_no_from_enc(**args):
    membership_no = args["changed_membership_no"]
    invoice = args["invoice_number"]

    try:
        frappe.db.set_value(
            "Sales Invoice",
            invoice,
            {
                "membership_no": membership_no
            },
        )
    except Exception as e:
        return e

@frappe.whitelist(allow_guest=True)
def update_sales_invoice_principal_member_from_enc(**args):
    principal_member = args["changed_principal_member"]
    invoice = args["invoice_number"]

    parent_details = frappe.get_doc("Parent", principal_member)

    try:
        frappe.db.set_value(
            "Sales Invoice",
            invoice,
            {
                "principal_member": principal_member,
                "principal_member_name": parent_details.full_name
            },
        )
    except Exception as e:
        return e




@frappe.whitelist(allow_guest=True)
def update_encounter_membership_no_from_invoice(**args):
    membership_no = args["changed_membership_no"]
    encounter = args["encounter_number"]

    try:
        frappe.db.set_value(
            "Patient Encounter",
            encounter,
            {
                "membership_no": membership_no
            },
        )
    except Exception as e:
        return e

@frappe.whitelist(allow_guest=True)
def update_encounter_principal_member_from_invoice(**args):
    principal_member = args["changed_principal_member"]
    encounter = args["encounter_number"]

    parent_details = frappe.get_doc("Parent", principal_member)

    try:
        frappe.db.set_value(
            "Patient Encounter",
            encounter,
            {
                "principal_member": principal_member,
                "principal_member_name": parent_details.full_name
            },
        )
    except Exception as e:
        return e




@frappe.whitelist(allow_guest=True)
def update_branch_on_walkin_invoice():
    """
    Get user barnch and set it as invoice branch
    """
    user_branch = get_user_location()
    return user_branch


@frappe.whitelist(allow_guest=True)
def check_if_patient_had_audiology_done_and_analyse_results(encounter: str):
    """
    Use encounter number to get patient and the previous encounter.
    Check results for previous encounter to determine if audiology is required for current encounter
    """
    from gch_custom.overrides.patient_encounter import GCHPatientEncounter

    current_encounter: GCHPatientEncounter = frappe.get_doc(
        "Patient Encounter", encounter
    )
    patient = current_encounter.patient
    # patient_ = frappe.get_doc("Patient", patient)

    # Get previous encounter left ear right ear and follow up
    prev_encounters = frappe.db.get_list(
        "Patient Encounter",
        {"patient": patient},
        [
            "name",
            "left_ear_results",
            "right_ear_results",
            "_followup_actions",
            "relative_with_ear_surgery",
            "relative_with_hearing_devices",
            "relative_with_hearing_loss",
        ],
        order_by="creation desc",
        limit=2,
    )
    # Chech if patient passed and return true else return false
    if len(prev_encounters) == 2:
        prev_encounter = prev_encounters[1]
        if (
            prev_encounter.left_ear_results == "Passed"
            or "Refer"
            and prev_encounter.right_ear_results == "Passed"
            or "Refer"
            and prev_encounter._followup_actions == "Passed"
            or "Refer"
        ):
            return prev_encounter
        else:
            return False
    else:
        return False


@frappe.whitelist(allow_guest=True)
def check_branch_pricelist(item_code: str):
    """
    Use Branch code to get price list if None default to standard selling.
    """
    try:
        # user = frappe.session.user
        # user_branch = frappe.db.get_value(
        #     "Practitioner Station Entry", {"user": user}, ["branch"]
        # )

        # branch_selling_price_list = frappe.db.get_value(
        #     "Branch", {"branch": user_branch}, ["default_selling_price_list"]
        # )
        # pricelist = ""
        # if branch_selling_price_list:
        #     pricelist = branch_selling_price_list
        # else:
        #     pricelist = "Standard Selling"
        pricelist = "Standard Selling"

        fee = frappe.db.get_value(
            "Item Price",
            {"item_code": item_code, "price_list": pricelist},
            ["price_list_rate"],
        )
        if fee:
            return fee
        else:
            frappe.throw(f"Item with item_code {item_code} has no default price list")
    except Exception as e:
        frappe.log_error(e, "REST ERROR /rest.py")
        return e


@frappe.whitelist(allow_guest=True)
def add_procedure_nurse_notes_to_encounter(**args):
    try:
        doc = frappe.get_doc(
            {
                "doctype": "Nurse Notes Table",
                "date_and_time": args["procedure_date"] + " " + args["procedure_time"],
                "docstatus": 0,
                "nurse_name": args["nurse_name"],
                "nurse_note": args["nurse_note"],
                "parent": args["encounter"],
                "parentfield": "nurse_notes_table",
                "parenttype": "Patient Encounter",
            }
        )

        doc.insert(ignore_permissions=True)

        print(doc)
        return True
    except Exception as e:
        print(e)
        return {"message": e}


@frappe.whitelist(allow_guest=True)
def fetch_practitoner_signature(practitioner_code):
    try:
        doc = frappe.get_doc("Healthcare Practitioner", practitioner_code)
        return doc

    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def update_quanity_when_batch_is_disabled(**args):
    batch_code = args["batch_code"]
    item_code = args["item_code"]

    stock_ledger_entries = frappe.db.sql(
        """ SELECT warehouse, SUM(actual_qty) AS total_qty, valuation_rate, stock_uom, warehouse, item_code, batch_no, company FROM `tabStock Ledger Entry` 
                                            WHERE item_code = %(item_code)s 
                                            AND batch_no = %(batch_code)s 
                                            AND is_cancelled = 0 
                                             
                                            AND warehouse 
                                            IN ( SELECT DISTINCT warehouse 
                                            FROM `tabStock Ledger Entry` 
                                            WHERE item_code = %(item_code)s 
                                            AND batch_no =  %(batch_code)s
                                            AND is_cancelled = 0 
                                             ) 
                                            GROUP BY warehouse """,
        {"item_code": item_code, "batch_code": batch_code},
        as_dict=True,
    )

    # Setting items with disabled batches into a list
    disabled_batch_items = []
    try:
        for i in stock_ledger_entries:
            # Only updating items where total stock quantity in current batch is not zero or a negative integer
            if i.total_qty >= 0:
                item = {
                    "actual_qty": i.total_qty,
                    "amount": i.total_qty * i.valuation_rate,
                    "batch_no": i.batch_no,
                    "docstatus": 1,
                    "doctype": "Stock Entry Detail",
                    "item_code": i.item_code,
                    "qty": i.total_qty,
                    "s_warehouse": i.warehouse,
                    "stock_uom": i.stock_uom,
                    "transfer_qty": i.total_qty,
                    "uom": i.stock_uom,
                    "valuation_rate": i.valuation_rate,
                }
                # print(item)
                disabled_batch_items.append(item)
                print(disabled_batch_items)

        if disabled_batch_items:
            # Create material issue to be able to deduct the stock from disabled batches
            material_issue_doc = frappe.get_doc(
                {
                    "doctype": "Stock Entry",
                    "company": i.company,
                    "docstatus": 1,
                    "fg_completed_qty": 0,
                    "is_opening": "No",
                    "items": disabled_batch_items,
                    "is_return": 0,
                    "modified_by": "System Generated",
                    "owner": "System Generated",
                    "purpose": "Material Issue",
                    "stock_entry_type": "Material Issue",
                    "title": "Material Issue Auto Generated",
                }
            )

            material_issue_doc.insert()
            material_issue_doc.add_comment(
                "Comment",
                text="This Material Issue was auto generated to deduct stock from disabled batch",
            )

            print(material_issue_doc)

            # Updating the disabled batch with the name of the material issue used to deduct stock count
            batch_doc = frappe.get_doc("Batch", batch_code)
            batch_doc.disabled_stock_material_issue = material_issue_doc.name

            # Setting batch code as was disabled after removing stock
            batch_doc.disabled = 1
            batch_doc.was_disabled = 1
            batch_doc.save()

        return True

    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def update_quanity_when_batch_is_enabled(**args):
    batch_code = args["batch_code"]
    item_code = args["item_code"]
    material_issue_name = args["material_issue"]

    # Fetching the material issue used to deduct disabled batch stock
    material_doc = frappe.get_doc("Stock Entry", material_issue_name)

    # Setting items with disabled batches into a list
    disabled_batch_items = []

    try:
        for i in material_doc.items:
            item = {
                "amount": i.amount,
                "batch_no": i.batch_no,
                "docstatus": 1,
                "doctype": "Stock Entry Detail",
                "item_code": i.item_code,
                "qty": i.qty,
                "t_warehouse": i.s_warehouse,
                "stock_uom": i.stock_uom,
                "transfer_qty": i.transfer_qty,
                "uom": i.uom,
                "valuation_rate": i.valuation_rate,
            }
            disabled_batch_items.append(item)
            print(disabled_batch_items)

        if disabled_batch_items:
            # Create material receipt to be able to readd the stock from disabled batche
            material_receipt_doc = frappe.get_doc(
                {
                    "doctype": "Stock Entry",
                    "company": material_doc.company,
                    "docstatus": 1,
                    "fg_completed_qty": 0,
                    "is_opening": "No",
                    "items": disabled_batch_items,
                    "is_return": 0,
                    "modified_by": "System Generated",
                    "owner": "System Generated",
                    "purpose": "Material Receipt",
                    "stock_entry_type": "Material Receipt",
                    "title": "Material Receipt",
                }
            )
            material_receipt_doc.insert()

            print(material_receipt_doc)

            # Setting batch code as was disabled after removing stock
            batch_doc = frappe.get_doc("Batch", batch_code)
            batch_doc.disabled = 0
            batch_doc.was_disabled = 0
            batch_doc.save()

        return True

    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def fetch_primary_parent_phone_to_appointment(**args):
    try:
        doc = frappe.get_doc("Patient", args["patient"])
        return doc
    except Exception as e:
        return e


# Capturing values for when an encounter is closed for more accuracy than modified fields
@frappe.whitelist(allow_guest=True)
def update_closing_date_time_user(**args):
    try:
        doc = frappe.get_doc("Patient Encounter", args["encounter"])
        doc.encounter_closed_by = args["closed_by"]
        doc.closing_date_and_time = args["closing_date_and_time"]
        doc.save()
        return doc

    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def only_show_generic_name(doctype, txt, searchfield, start, page_len, filters):
    doctype = "Generic Drug Name"
    conditions = []

    return frappe.db.sql(
        """
		select name,generic_name from `tabGeneric Drug Name`
			where ({key} like %(txt)s
				or generic_name like %(txt)s)
			{fcond} {mcond}
		limit %(page_len)s offset %(start)s""".format(
            **{
                "fields": "name, generic_name",
                "key": searchfield,
                "fcond": get_filters_cond(doctype, filters, conditions),
                "mcond": get_match_cond(doctype),
            }
        ),
        {
            "txt": "%%%s%%" % txt,
            "_txt": txt.replace("%", ""),
            "start": start,
            "page_len": page_len,
        },
    )

@frappe.whitelist(allow_guest=True)
def only_show_procedure_name(doctype, txt, searchfield, start, page_len, filters):
    pass
    # doctype = "Procedure Prescription"
    # conditions = []

    # return frappe.db.sql(
    #     """
	# 	select name,generic_name from `tabProcedure Prescription`
	# 		where ({key} like %(txt)s
	# 			or generic_name like %(txt)s)
	# 		{fcond} {mcond}
	# 	limit %(page_len)s offset %(start)s""".format(
    #         **{
    #             "fields": "name, generic_name",
    #             "key": searchfield,
    #             "fcond": get_filters_cond(doctype, filters, conditions),
    #             "mcond": get_match_cond(doctype),
    #         }
    #     ),
    #     {
    #         "txt": "%%%s%%" % txt,
    #         "_txt": txt.replace("%", ""),
    #         "start": start,
    #         "page_len": page_len,
    #     },
    # )


@frappe.whitelist(allow_guest=True)
def only_show_supplier_name(doctype, txt, searchfield, start, page_len, filters):
    doctype = "Item"
    conditions = []

    return frappe.db.sql(
        """
		select name, supplier_name from `tabSupplier`
			where ({key} like %(txt)s
				or supplier_name like %(txt)s)
			{fcond} {mcond}
		limit %(page_len)s offset %(start)s""".format(
            **{
                "fields": "name, supplier_name",
                "key": searchfield,
                "fcond": get_filters_cond(doctype, filters, conditions),
                "mcond": get_match_cond(doctype),
            }
        ),
        {
            "txt": "%%%s%%" % txt,
            "_txt": txt.replace("%", ""),
            "start": start,
            "page_len": page_len,
        },
    )

@frappe.whitelist(allow_guest=True)
def fetch_practitioner_name(**args):
    try:
        practitioner = frappe.db.get_list("Healthcare Practitioner",
                                        filters={'user_id': args['practitioner_email']},
                                        fields=['name', 'role_profile']
                                        )
        
        if practitioner[0].role_profile == "Doctor":
            # print(practitioner[0].role_profile, "Hereeeeeeeee")
            return practitioner
        
    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def fetch_practitioner_name_procedures(**args):
    try:
        practitioner = frappe.db.get_list("Healthcare Practitioner",
                                        filters={'user_id': args['practitioner_email']},
                                        fields=['name', 'role_profile']
                                        )
        return practitioner
        
    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def fetch_encounter_invoice_number(**args):
    try:
        invoice_number = frappe.db.get_value('Sales Invoice', {'encounter': args['encounter_number']}, "name")
        return invoice_number
    except Exception as e:
        return e

@frappe.whitelist(allow_guest=True)
def fetch_vaccines_from_prev_wellbaby_encounter(**args):
    try:
        prev_well_baby_vaccine_details = frappe.db.get_list("Patient Encounter", 
                                filters={'patient' : args["patient"], 
                                        'clinic' : "Wellbaby - GCH"},
                                fields=['visit_schedule', 'name', 'creation'],
                                order_by='creation desc',
                                limit=1
                                )
        
        # # Fetching the entire Encounter Doc to get vaccines
        if len(prev_well_baby_vaccine_details) > 0:
            enc_doc = frappe.get_doc("Patient Encounter", prev_well_baby_vaccine_details[0].name)
        
        print(enc_doc)
        return(enc_doc)
        
    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def create_encounter_assessment_record(**args):
    try:
        assessment = frappe.get_doc(doctype="Encounter Assessments Table")
        assessment.action = args["action"]
        assessment.assessment_no = args["assessment_no"]
        assessment.doctype = "Encounter Assessments Table"
        assessment.done_by = args["done_by"]
        assessment.owner = args["done_by"]
        assessment.parent = args["encounter"]
        assessment.parentfield = "encounter_assessment_table"
        assessment.parenttype = "Patient Encounter"
        assessment.score = args["score"]
        assessment.time = args["time"]
        assessment.date = args["date"]
        assessment.type = args["type"]
        assessment.insert(ignore_permissions=True)

        return assessment
        

    except Exception as e:
        return e

@frappe.whitelist(allow_guest=True)
def check_if_is_managed_care_invoice_and_get_billing_rule_price(**args):
    try:
        doc = frappe.db.get_value("Insurance Company", {'company_name': args["insurance_company"]}, ['is_managed_care', 'name'], as_dict=1)

        if doc.is_managed_care == 1:

            # return False

            # Fetching price from the insurance category billing rule
            insurance_category_doc = frappe.get_doc("Insurance Category", args["insurance_category"])

            insurance_company_doc = frappe.get_doc("Insurance Company", doc.name)

            managed_care_splits = insurance_company_doc.managed_care_splits_table[0]


            return [True, insurance_category_doc, managed_care_splits]
        else:
            return False

    except Exception as e:
        return e
    
@frappe.whitelist(allow_guest=True)
def update_mop_on_encounter(**args):
    try:
        frappe.db.set_value("Patient Encounter", args["patient_encounter"], {"mode_of_payment": args["mode_of_payment"]})
        return True
    except Exception as e:
        return e

@frappe.whitelist(allow_guest=True)
def update_mop_on_invoice(**args):
    try:
        frappe.db.set_value("Sales Invoice", args["sales_invoice"], {"mode_of_payment": args["mode_of_payment"]})
        return True
    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def check_if_invoice_has_copay(**args):
    
    try:
        doc = frappe.get_list("Payment Entry Reference", filters={"reference_name" :args["sales_invoice_no"]})
        if doc:
            return True
        else:
            return False
               
    except Exception as e:
        return e
    
@frappe.whitelist(allow_guest=True)
def fetch_outpatient_company_kra_pin(**args):

    try:
        company_kra_pin = frappe.db.get_value("Insurance Company", {'company_name': args["outpatient_company"]}, ['kra_pin', 'is_main_kra_pin'], as_dict=1)
        category_kra_pin = frappe.db.get_value("Insurance Category" , {'name': args["default_category"]}, ['insurance_category_kra_pin', 'is_main_kra_pin'], as_dict=1)

        if category_kra_pin.insurance_category_kra_pin != "" and category_kra_pin.is_main_kra_pin:
            return category_kra_pin
        
        else:
            return company_kra_pin
        
    except Exception as e:
        return e

@frappe.whitelist(allow_guest=True)
def fetch_price_from_billing_rule(**args):
    try:
        doc = frappe.db.get_value("Insurance Billing Rule Template", args["billing_rule_name"], ["fixed_amount"], as_dict=1)

        return doc
    except Exception as e:
        return e


# @frappe.whitelist(allow_guest=True)
# def check_patient_last_vaccination_shedule(**args):
#     try:
#         # prev_well_baby_schedule = frappe.db.get_list("Patient Encounter", 
#         #                    filters={'patient' : args["patient"], 
#         #                             'clinic' : "Wellbaby - GCH" or "Wellbaby Growth Monitoring - GCH"},
#         #                    fields=['visit_schedule', 'name', 'creation'],
#         #                    order_by='creation desc',
#         #                    limit=1
#         #                    )    
        
#         # Fetching Vaccination Adminstration List and writing a script that predicts the next schedule from patient age
#         vaccine_administration_list = frappe.db.get_list("Vaccine Administration", pluck='name')
#         print(vaccine_administration_list)

#         patient_age_in_weeks = int(args["patient_age_in_weeks"])

#         # Weekly Adminstration entry sort
#         weekly_adminstrations_buffer = []

#         for vac in vaccine_administration_list:
#             if "Weeks" in vac:
#                 print(vac, "===========================")
#                 weekly_adminstrations_buffer.append(vac.split(" ")[0])

#         print(weekly_adminstrations_buffer)

#         numbers = weekly_adminstrations_buffer
#         target = int(patient_age_in_weeks)

#         # Convert the list of strings to a list of integers
#         numbers = [int(num) for num in numbers]

#         # Initialize variables to keep track of the closest number and its difference from the target
#         closest_number = None
#         closest_difference = float('inf')

#         for num in numbers:
#             difference = abs(num - target)
            
#             # Check if the current number is closer to the target
#             if difference < closest_difference:
#                 closest_number = num
#                 closest_difference = difference

#         print(closest_number, "Closest Weekly Vaccine Adminstration=============")

#         # print(args["patient_age_in_weeks"], "=======================================")

#         # patient_age_in_weeks = args["patient_age_in_weeks"]

#         # Starting with birth
#         if patient_age_in_weeks < 6:
#             vaccine_adminstration = "Birth"
        
#         # Handle for weeks
#         elif patient_age_in_weeks >=6 and patient_age_in_weeks < 26:
#             # Weekly Adminstration entry sort
#             weekly_adminstrations_buffer = []

#             for vac in vaccine_administration_list:
#                 if "Weeks" in vac:
#                     print(vac, "===========================")
#                     weekly_adminstrations_buffer.append(vac.split(" ")[0])

#             print(weekly_adminstrations_buffer)

#             numbers = weekly_adminstrations_buffer
#             target = int(patient_age_in_weeks)

#             # Convert the list of strings to a list of integers
#             numbers = [int(num) for num in numbers]

#             # Initialize variables to keep track of the closest number and its difference from the target
#             closest_number = None
#             closest_difference = float('inf')

#             for num in numbers:
#                 difference = abs(num - target)
                
#                 # Check if the current number is closer to the target
#                 if difference < closest_difference:
#                     closest_number = num
#                     closest_difference = difference
                    
#             # Checking if closest number is less than patient age in weeks
#             if (closest_number >= patient_age_in_weeks) :
#                 weeks_vaccine_adminstration = str(closest_number) + " Weeks"
#                 print(weeks_vaccine_adminstration)
#                 return weeks_vaccine_adminstration
                
#             elif (closest_number < patient_age_in_weeks):
#                 # Arrange weekly buffer in ascending order and pick the index after it
#                 sorted_list = sorted(weekly_adminstrations_buffer, key=int)
#                 next_admn_index = sorted_list.index(str(closest_number))
#                 weeks_vaccine_adminstration = sorted_list[next_admn_index + 1] + " Weeks"
#                 print(weeks_vaccine_adminstration, "FETCHED INDEX LARGER SINCE CLOSEST NUMBER IS SMALLER================")
                
#                 return weeks_vaccine_adminstration

#         # Handle for Months and Years
#         elif patient_age_in_weeks >= 26 and patient_age_in_weeks < :


        

#         # for adminstration in vaccine_administration_list:
#         #     if vaccine

#         return vaccine_administration_list
#     except Exception as e:
#         return e

# Capturing values for when an invoice is submitted
# @frappe.whitelist(allow_guest=True)
# def update_invoice_submission_details(**args):
#     try:
#         doc = frappe.get_doc("Sales Invoice", args["invoice"])

#         # Unsubmitting the invoice temporarily to allow adding of data
#         doc.submitted_date_and_time = args["submission_date_time"]
#         doc.submitted_by = args["submitted_by"]
#         doc.save(ignore_permissions=True)
#         return doc
#     except Exception as e:
#         return e

# @frappe.whitelist(allow_guest=True)
# def notify_users_batches_abt_to_expire(**args):
# 	try:
# 		batch_list = frappe.db.get_list('Batch',
# 			filters={
# 				'disabled': 0
# 			},
# 			fields=['batch_id', 'batch_qty', 'item', 'item_name', 'expiry_date', 'modified_by']
# 		)
# 		date_today = frappe.utils.nowdate()
# 		for batch in batch_list:
# 			if(batch.expiry_date and batch.batch_qty > 0 and date_diff(batch.expiry_date, date_today) < 0):
# 				frappe.sendmail(
# 					recipients="redward@gerties.org",
# 					subject="Batch About to Expire",
# 					message= "Hello,\n The following batch is about to expire:\n" +
# 						"Batch Code:" + str(batch.batch_id) +
# 						"\n Batch Quantity" + str(batch.batch_qty) +
# 						"\n Item Name" + str(batch.item_name) +
# 						"\n Item Code" + str(batch.item)
# 					)
# 		return batch_list
# 	except Exception as e:
# 		return e


@frappe.whitelist(allow_guest=True)
def fetch_mpesa_stk_push_payment(**args):
    try:
        sales_invoice = args["sales_invoice"]
        phone_number = args["phone_number"]
        amount = args["amount"]

        # Formatting number
        num_str = str(phone_number)

        first_part = num_str[:4]
        last_part = num_str[-3:]

        formatted_phone_number = first_part + " ***** " + last_part


        amount = args["amount"]


        print("\n\n\n\n\n", sales_invoice, formatted_phone_number, amount, "\n\n\n\n\n")

        successful_transaction = frappe.get_list("Mpesa C2B Request", 
                        filters={
                            'bill_ref_number': sales_invoice,
                            'msisdn': formatted_phone_number,
                            'trans_amount': amount + ".00"
                        },
                        fields=["bill_ref_number", "name", "trans_id", "trans_amount", "msisdn", "first_name"])
        
        if successful_transaction:
            return [True, successful_transaction]
        else:
            return [False, "Transaction not found"]

    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def fetch_mode_of_payment_from_encounter(**args):
    mode_of_payment = frappe.db.get_value("Patient Encounter", args["encounter"], "mode_of_payment")
    return mode_of_payment

@frappe.whitelist(allow_guest=True)
def get_service_mobile_units(branch: str):
    try:
        service_units = frappe.db.get_list(
            "Healthcare Service Unit",
            filters={"branch": branch},
            fields=[
                "name",
                "service_unit_type",
                "mobile_app_display_name",
                "outpatient_consultation_item",
            ],
        )
        print(service_units)
        return service_units
    except Exception as e:
        return e


@frappe.whitelist(allow_guest=True)
def get_service_unit_consultation_item_price(item: str) -> int:
    try:
        # TODO:
        consultation_item = frappe.db.get_value(
            "Item", filters={"name": item}, fieldname=["standard_rate"]
        )
        if consultation_item == None:
            raise Exception("Consultation Item not found")

        return consultation_item
    except Exception as e:
        frappe.log_error(e, "REST ERROR /rest.py")
        return 0


@frappe.whitelist(allow_guest=True)
def create_mobile_app_encounter(
    patient: str, clinic: str, branch: str, naming_series: str
):
    doc = frappe.get_doc(
        {
            "doctype": "Patient Encounter",
            "name": "new-patient-encounter-1",
            "naming_series": "HLC-ENC-.YYYY.-",
            "revisit_reason_dur": -1,
            "reason_for_visit": "",
            "is_first_time_reception": 1,
            "priority": "2",
            "mode_of_payment": "",
            "invoiced": 0,
            "symptoms_in_print": 0,
            "weak_or_absent_breathing": 0,
            "obstructed_breathing": 0,
            "central_cyanosis_or_spo2": 0,
            "severe_respiratory_distress": 0,
            "weak_or_fast_pulse_gt_160": 0,
            "capillary_return_time_gt_3_sec": 0,
            "pulse_rate_lt_60_per_min": 0,
            "avpu_is_p_or_u_or_convulsion": 0,
            "diarrhea_with_sunken_eyes": 0,
            "anaphylaxis": 0,
            "bulging_anterior_fontanelle": 0,
            "intraosseous_line_in_place": 0,
            "neck_stiffness": 0,
            "artificial_airway": 0,
            "hypothermia": 0,
            "hypoglycemia": 0,
            "immediate_post_ictal_period": 0,
            "fast_breathing": 0,
            "grunting": 0,
            "chest_wall_indrawing": 0,
            "wheeze": 0,
            "stridor": 0,
            "drooling": 0,
            "tiny_child": 0,
            "major_trauma": 0,
            "pain": 0,
            "poisoning": 0,
            "severe_palmar_pallor": 0,
            "restless_irritable_floppy": 0,
            "referral": 0,
            "malnutrition_severe_wasting": 0,
            "oedeme_of_both_feet": 0,
            "severe_burns": 0,
            "unable_to_drink_or_vomits_anything": 0,
            "cord_stump_healing": "",
            "eyesight_and_hearing": "",
            "development_eyesight": "",
            "development_hearing": "",
            "child_milestone": "",
            "relative_with_ear_surgery": "",
            "relative_with_hearing_loss": "",
            "relative_with_hearing_devices": "",
            "right_ear_results": "",
            "left_ear_results": "",
            "_followup_actions": "",
            "has_no_drug_allergy": 0,
            "has_no_food_allergy": 0,
            "unintentional_weight_loss": "",
            "routine_nutritional_counselling_not_done_at_6_months": "",
            "nutritional_supplementation_or_specialized_feeding": "",
            "nurse_notes": "  ",
            "child_fit_for_vaccination": "",
            "diagnosis_in_print": 1,
            "prescription_total": 0,
            "reason_for_referral": "",
            "wellbaby_child_safety_advice": "",
            "wellbaby_nutrition_counselling": "",
            "outpatient_discharge_patients_condition_at_discharge": "",
            "wellbaby_advice_on_social_and_behavioral_development": "",
            "practitioner": "HLC-PRAC-2022-00001",
            "practitioner_name": "Anthonys",
            "naming_series": naming_series,
            "patient": patient,
            "clinic": clinic,
            "branch": branch,
        }
    )
    # doc.practitioner = "HLC-PRAC-2022-00001"
    doc.insert(
        ignore_permissions=True,  # ignore write permissions during insert
        ignore_links=True,  # ignore Link validation in the document
        ignore_if_duplicate=True,  # dont insert if DuplicateEntryError is thrown
        ignore_mandatory=True,
    )
    return doc

@frappe.whitelist(allow_guest=True)
def update_patient_kranium_uhid(**args):
    try:
        patient = args["patient"]
        patient_uhid = args["patient_kranium_uhid"]

        frappe.db.sql("""
            UPDATE `tabPatient`
            SET kranium_uhid = %s
            WHERE name = %s
        """, (patient_uhid, patient))

        # Optionally, commit the transaction to save the change
        frappe.db.commit()

        # patient = frappe.get_doc("Patient", patient)
        # patient.kranium_uhid = patient_uhid
        # patient.update(ignore_permissions=True, ignore_mandatory=True)
        return True
    except Exception as e:
        print(e)
        frappe.log(e)
        return e

@frappe.whitelist(allow_guest=True)
def autoclose_encounter(**args):
    encounter = args["patient_encounter"]

    try:
        doc = frappe.get_doc("Patient Encounter", encounter)
        doc.docstatus = 1
        doc.workflow_state = "Encounter Closed"
        doc.insert(ignore_permissions=True, ignore_mandatory=True)
        return True
    except Exception as e:
        return e