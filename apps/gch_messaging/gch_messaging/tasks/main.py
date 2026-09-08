from typing import Any, Dict
import frappe
from frappe import enqueue
import time

class GCHMessagingTasks:
    """Utility class to manage calls to the background task handler.

    """
    def __init__(self) -> None:
        ...

    def enqueue_send_sms(self, message:str, recipient:str) -> Any:
        """Enqueues SMS message requests

        Args:
            message (str): The message being sent
            recipient (str): The recipient of the message

        Returns:
            Any: The Task/Job object
        """
        
        response = enqueue('gch_messaging.utils.send_sms', message=message, recipient=recipient)
        return response


messaging_tasks = GCHMessagingTasks()   

# def long_job(arg1, arg2):
#     frappe.publish_realtime('msgprint', 'Starting long job...')
#     time.sleep(20)
#     # this job takes a long time to process
#     frappe.publish_realtime('msgprint', 'Ending long job...')

# def enqueue_long_job(arg1, args2):
#     enqueue('gch_messaging.tasks.long_job', arg1=arg1, arg2=args2)