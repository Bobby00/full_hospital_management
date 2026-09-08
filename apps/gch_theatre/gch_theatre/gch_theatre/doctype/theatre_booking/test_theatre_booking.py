# # Copyright (c) 2023, eGerties Developers and Contributors
# # See license.txt

# # import frappe
# import unittest

# class TestTheatreBooking(unittest.TestCase):
# 	pass

import frappe
import unittest
from unittest.mock import patch

# Import the function to be tested
from gch_theatre.utils.emailing import get_emails_from_group

class TestGetEmailsFromGroup(unittest.TestCase):
    
    @patch('frappe.get_all')
    def test_get_emails_from_group(self, mock_get_all):
        # Mocking the frappe.get_all method response
        mock_get_all.return_value = [
            {"email": "email1@example.com"},
            {"email": "email2@example.com"},
            {"email": "email3@example.com"}
        ]
        
        # Call the function with a mocked group name
        group_name = "mocked_group"
        expected_result = ["email1@example.com", "email2@example.com", "email3@example.com"]
        result = get_emails_from_group(group_name)
        
        # Assert the result matches the expected output
        self.assertEqual(result, expected_result)


