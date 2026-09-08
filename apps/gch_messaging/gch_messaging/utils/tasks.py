from frappe import enqueue
from gch_messaging.utils.core import messaging
import asyncio
from rq.decorators import job
from rq import Queue
from redis import Redis

conn1 = Redis('localhost', 6379)


async def _enqueue_sms(recipient: str, message: str):
    print("Starting")
    enqueue('gch_messaging.utils.send_sms', recipient=recipient, timeout=3000, event='gch_messaging.utils.core.messaging.send_sms', message=message, now=True, job_name="send_sms", on_success=report_success, on_failure=report_failure, is_async=True)
    print("Done")

# @job(queue="default", connection=conn1)
# def enqueue_sms(message: str, recipient: str):
def enqueue_sms(*args, **kwargs):
    # messaging.send_sms(message=message, recipient=recipient)
    asyncio.run(_enqueue_sms(*args, **kwargs))

def report_success(job, connection, result, *args, **kwargs):
    print("Success")


def report_failure(job, connection, result, *args, **kwargs):
    print("Failed")