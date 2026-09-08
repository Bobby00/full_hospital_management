from typing import Any, List, Dict
import frappe
from frappe import enqueue
from urllib.parse import urlparse


class GCHMiddlewareTasks:
    """Utility class to manage calls to the background task handler"""

    def __init__(self) -> None:
        ...

    # A periodic task that runs every 6 hours everyday

    def enqueue_parse_lab(self, payload: str) -> Any:
        """Enqueues the Labware Response to the parser.

        Args:
            payload (str): _description_

        Returns:
            Any: _description_
        """
        # response = enqueue()
        response = enqueue(
            "gch_middleware.utils.hl7.labware.main.gch_labware.receive_lab",
            payload=payload,
        )
        return response

    def enqueue_map_results(self, batch_number, result_document):
        response = enqueue(
            "gch_custom.utils.labware.main.map_results_to_lab_test",
            batch_number=batch_number,
            result_document=result_document,
        )
        return response

    @staticmethod
    def handle_lab_result_doc(
        payload,
        message_id,
        sec_message_id,
        result_doc,
        labware_id,
        branch_code,
        *args,
        **kwargs,
    ):
        from gch_middleware.services.rest import is_ip_address

        result_doc = result_doc.replace("\\", "/")
        domain = result_doc.split("/")[2]
        valid, ip_address = is_ip_address(domain)
        if not valid:
            ip_address = "192.168.0.173"
        folder_path = "/".join(result_doc.split("/")[-3:])
        abs_url = f"http://{ip_address}/{folder_path}"
        result_doc = f"file:{result_doc}"

        try:
            batch = frappe.get_doc("Lab Test Batch", {"name": message_id})
        except frappe.DoesNotExistError:
            try:
                batch = frappe.get_doc("Lab Test Batch", {"name": sec_message_id})
            except frappe.DoesNotExistError:
                batch = None
        except Exception as e:
            batch = None
        if batch:
            try:
                batch.db_set("raw_result", payload)
                batch.db_set("result_document", abs_url)
                batch.db_set("status", "COMPLETED")
                batch_lab_tests = frappe.db.get_all(
                    "Lab Test", filters={"batch": batch.name}
                )
                for batch_lab_test in batch_lab_tests:
                    b_lab_test = frappe.get_doc(
                        "Lab Test", {"name": batch_lab_test.name}
                    )
                    try:
                        b_lab_test.db_set("result_document_url", abs_url)
                    except Exception as e:
                        print(f"ERR: {str(e)}")
                        print(e)
                # processed = tasks.enqueue_map_results(batch_number=batch.name, result_document=result_doc)
            except Exception as e:
                print(f"ERROR: {str(e)}")

    def enqueue_receive_lab_result_doc(
        self, payload, message_id, sec_message_id, result_doc, labware_id, branch_code
    ):
        # Move this to a background task
        print("Enqueuing Lab Result Doc")
        host_url = frappe.utils.get_url()
        response = enqueue(
            "gch_middleware.utils.hl7.labware.main.handle_lab_result_doc",
            payload=payload,
            message_id=message_id,
            sec_message_id=sec_message_id,
            result_doc=result_doc,
            labware_id=labware_id,
            branch_code=branch_code,
        )
        return response


middleware_tasks = GCHMiddlewareTasks()
