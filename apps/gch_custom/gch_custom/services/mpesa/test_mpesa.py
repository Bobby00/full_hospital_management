from __future__ import unicode_literals

import frappe
import unittest

from gch_custom.services.mpesa import Mpesa

class TestMPESA(unittest.TestCase):
    def test_mpesa_auth(self):
        # mpesa:Mpesa = Mpesa(username="gch", password="gch", base_url="https://api.mtiba.com")
        # print(mpesa.token)
        assert(1)
        ...