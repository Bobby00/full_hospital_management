from __future__ import unicode_literals

import frappe
import unittest
from gch_custom.services import airtel_money

from gch_custom.services.airtel_money import AirtelMoney

class TestAirtelMoney(unittest.TestCase):
    def test_airtel_money_auth(self):
        # airtel: AirtelMoney = AirtelMoney(client_id="gch", client_secret="gch", base_url="https://api.airtel.com")
        # print(airtel.token)
        assert(1)