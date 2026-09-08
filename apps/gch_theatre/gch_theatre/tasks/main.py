import frappe
from frappe import enqueue

class GCHTheatreTask:
    """Utility class to manage calls to the Theatre Background task handler"""
    def __init__(self) -> None:
        pass

    def enqueue_send_booking_sms(self, doc, event, **kwargs):
        print(doc, event, kwargs)
        response = enqueue(
            "gch_theatre.tasks.send_sms_booking.send_sms_job",
            queue="default",
            doc=doc,
            event=event,
            message=kwargs.get("message")
        )
        print(response)
        return response
    

gch_theatre_tasks = GCHTheatreTask()