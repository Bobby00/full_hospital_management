from typing import Any, Dict, Tuple, List

import frappe
from gch_middleware.tasks import middleware_tasks as tasks
from gch_middleware.utils.hl7.labware.main import gch_labware
from werkzeug.wrappers import Response
from gch_middleware.utils.kranium import gch_middleware_kranium
import ipaddress
from urllib.parse import urlparse
import requests

logger = frappe.logger("lbwared", allow_site=True, file_count=50)

def is_ip_address(ip_string) -> Tuple[bool, Any]:
    try:
        ip_object = ipaddress.ip_address(ip_string)
        print(f"The IP address '{ip_object}' is valid.")
        return True, ip_string
    except ValueError:
        print(f"The IP address '{ip_string}' is not valid")
        return False, None


class GCHMiddlewareMixin:
    def __init__(self) -> None:
        pass

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def search_patient_kranium(uhid_code: str) -> Dict:
        """
        {
            location: 29,
            UHID: 10255447,
            Registration Date: "2023-03-15T10:38:57",
            First Name: "pracxidies",
            Middle Name: "Wangui",
            Last Name: "",
            Date Birth: "2022-06-13",
            address 1: "",
            address 2: "",
            Phone: null,
            cellphone: null,
            Gender: "",
            title: "Baby",
            status: "normal",
            email: null,
            address: "",
        }
        """
        via = "EGerties"
        patients = frappe.qb.DocType("Patient")
        patient = (
            frappe.qb.from_(patients)
            .select(
                patients.patient_name,
                patients.first_name,
                patients.last_name,
                patients.middle_name,
                patients.uhid_code,
                patients.kranium_uhid,
                patients.creation,
                patients.modified,
                patients.phone,
                patients.sex,
                patients.dob,
                patients.email,
                patients.title,
                patients.county,
            )
            .where(
                (patients.uhid_code == uhid_code) | (patients.kranium_uhid == uhid_code)
            )
        ).run(as_dict=True)
        if patient:
            patient_ = patient[0]
            """
           
            """
            patient = {
                "location": "",
                "uhid": patient_.get("uhid_code"),
                "registration_date": patient_.get("creation"),
                "first_name": patient_.get("first_name"),
                "middle_name": patient_.get("middle_name"),
                "last_name": patient_.get("last_name"),
                "date_birth": patient_.get("dob"),
                "address_1": "",
                "address_2": "",
                "phone": patient_.get("phone"),
                "cellphone": patient_.get("phone"),
                "gender": patient_.get("sex"),
                "title": patient_.get("title"),
                "status": "normal",
                "email": patient_.get("email"),
                "address": patient_.get("county"),
            }
        if not patient:
            print("Patient not found in ERPNext")

            try:
                found, patient = gch_middleware_kranium.get_patient(uhid_code)
                via = "Kranium"
            except:
                return {"patient": {}, "via": ""}

        return {"patient": patient, "via": via}

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def fetch_registrations(start_date, end_date, page, limit) -> Response:
        """Fetches the registrations from KRANIUM"""
        regs = gch_middleware_kranium.get_kranium_data(
            start_date, end_date, page, limit
        )
        print(regs)
        return regs
        ...

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def get_patient(uhid_code: str) -> Dict:
        patients = frappe.qb.DocType("Patient")
        patient = (
            frappe.qb.from_(patients)
            .select(patients.patient_name, patients.first_name, patients.last_name)
            .where((patients.uhid_code == uhid_code))
        ).run(as_dict=True)
        if not patient:
            return {"status": False, "message": "Patient not found"}
        return patient

    @frappe.whitelist(
        allow_guest=True,
    )
    @staticmethod
    def receive_oru(**kwargs) -> str:
        """Receive ORU from Labware

        Args:
            payload (str): Payload from Labware.

        Returns:
            str: ACK message to ORU
        """
        received_timestamp = gch_labware._return_current_datetime()
        data = frappe.request.data.decode("utf-8")
        oru_raw = frappe.get_doc({"doctype": "Labware Response", "payload": data})
        oru_raw.insert(ignore_permissions=True)
        logger.info(f"SAVED: {oru_raw}")
        
        
        # Move this to a background task
        message_id, sec_message_id, result_doc, labware_id, branch_code = gch_labware.receive_lab(
            oru_raw.payload
        )
        l_host_name = frappe.utils.get_url()        
        if branch_code:
            branch = frappe.get_doc("Branch", {
                "branch_code": branch_code
            })
            try:
                branch_webhook_url = branch.webhook_url
            except Exception as e:
                branch_webhook_url = None
            if branch_webhook_url and branch_webhook_url.strip() != "":
                # Compare the two URLs
                branch_parsed_url = urlparse(branch_webhook_url)
                request_parsed_url = urlparse(frappe.utils.get_url())
                branch_netloc = branch_parsed_url.netloc
                request_netloc = request_parsed_url.netloc
                branch_host_name = f"{branch_parsed_url.scheme}://{branch_parsed_url.netloc}"
                logger.info(f"BRANCH NETLOC: {branch_netloc}, REQUEST NETLOC: {request_netloc}")
                if branch_netloc != request_netloc:
                    # Call the webhook URL
                    logger.info(f"NOT SAME, sending to {branch_webhook_url}")
                    headers = {'Content-Type': 'text/plain'}
                    try:
                        responsee  = requests.post(branch_webhook_url, data=data.encode("utf-8"), headers=headers, verify=False)
                        logger.info(responsee, responsee.text)
                    except Exception as e:
                        logger.info("Failed to send payload")

            task_response = tasks.enqueue_receive_lab_result_doc(
                        payload=oru_raw.payload,
                        message_id=message_id,
                        sec_message_id=sec_message_id,
                        result_doc=result_doc,
                        labware_id=labware_id,
                        branch_code=branch_code
                    )
            #     else:

            #         task_response = tasks.enqueue_receive_lab_result_doc(
            #             payload=oru_raw.payload,
            #             message_id=message_id,
            #             sec_message_id=sec_message_id,
            #             result_doc=result_doc,
            #             labware_id=labware_id,
            #             branch_code=branch_code
            #         )
            #         print(task_response)

            # else:
            #     task_response = tasks.enqueue_receive_lab_result_doc(
            #             payload=oru_raw.payload,
            #             message_id=message_id,
            #             sec_message_id=sec_message_id,
            #             result_doc=result_doc,
            #             labware_id=labware_id,
            #             branch_code=branch_code
            #         )
                    # result_doc = result_doc.replace("\\", "/")

                    # domain = result_doc.split("/")[2]

                    # valid, ip_address = is_ip_address(domain)
                    # if not valid:
                    #     ip_address = "192.168.0.173"
                    # folder_path = '/'.join(result_doc.split("/")[-3:])
                    # abs_url = f"http://{ip_address}/{folder_path}"
                    # result_doc = f"file:{result_doc}"
                    # try:
                    #     batch = frappe.get_doc("Lab Test Batch", {"name": message_id})
                    # except frappe.DoesNotExistError:
                    #     try:
                    #         batch = frappe.get_doc("Lab Test Batch", {"name": sec_message_id})
                    #     except frappe.DoesNotExistError:
                    #         batch = None
                    # except Exception as e:
                    #     batch = None
                    # if batch:
                    #     try:
                    #         batch.db_set("raw_result", oru_raw.payload)
                    #         batch.db_set("result_document", abs_url)
                    #         batch.db_set("status", "COMPLETED")
                    #         batch_lab_tests = frappe.db.get_all(
                    #             "Lab Test", filters={"batch": batch.name}
                    #         )
                    #         for batch_lab_test in batch_lab_tests:
                    #             b_lab_test = frappe.get_doc(
                    #                 "Lab Test", {"name": batch_lab_test.name}
                    #             )
                    #             try:
                    #                 b_lab_test.db_set("result_document_url", abs_url)
                    #             except Exception as e:
                    #                 print(f"ERR: {str(e)}")
                    #                 print(e)
                    #         # processed = tasks.enqueue_map_results(batch_number=batch.name, result_document=result_doc)
                    #     except Exception as e:
                    #         print(f"ERROR: {str(e)}")
                    #         ...

        response = Response()
        response.mimetype = "text/plain"
        response.charset = "utf-8"
        response_timestamp = gch_labware._return_current_datetime()
        response.data = f"""MSH|^~\&|||Manufacturer|eGerties|{response_timestamp}||ACK^R01|{received_timestamp}-{labware_id}|P|2.3.1||||0||ASCII|||\nMSA|AA|{received_timestamp}-{labware_id}|Message accepted|||0|"""
        return response


middleware_mixin = GCHMiddlewareMixin()
