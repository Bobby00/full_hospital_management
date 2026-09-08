from __future__ import unicode_literals

import frappe
import unittest

from gch_custom.services.mtiba import Mtiba

class TestMTIBA(unittest.TestCase):
    def test_mtiba_auth(self):
        # mtiba = Mtiba(username="gch", password="gch", baseIntegrationUrl="https://api.mtiba.com")
        # print(mtiba.token)
        assert(1)
        ...