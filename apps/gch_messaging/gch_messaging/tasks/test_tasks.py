import frappe
from gch_messaging.tasks import messaging_tasks
from unittest import TestCase

class TestTasks(TestCase):
    def test_sms_task(self):
        response = messaging_tasks.enqueue_send_sms(message="Test Message Here", recipient="254758462513")
        assert response.id is not None