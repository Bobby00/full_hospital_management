from __future__ import unicode_literals

import unittest

from gch_custom.services.slade import slade
from gch_custom.services.slade.types import SladeTokenResponseType


class TestSlade(unittest.TestCase):

    def test_slade_init(self):
        assert(slade.access_token)

    def test_slade_oauth(self):
        """Test Slade OAuth"""
        token: SladeTokenResponseType  = slade._get_oauth_token()
        assert(token.get("error") is None)
        assert(token.get("access_token") !="")
        self.token = token

    def test_slade_auth_verification(self):
        """Test Slade Auth Verification
        /authorizations/validate_authorization_token
        """
  
        payload = {"first_name": "first_name",
            "last_name": "last_name",
            "other_names": "other_names",
            "auth_token": "auth_token",
            "member_number": "member_number",
            "visit_type": "OUTPATIENT",
            "scheme_code": "scheme_code",
            "scheme_name": "scheme_name",
            "payer_code": "payer_code"}
        response = slade.verify_authorization(**payload)
        assert(response.get("error") is None)

    def test_slade_submit_claim(self):
        """Test Slade Submit Claim"""
        payload = {
            "payer_code": "payer_code",
            "payer_name": "payer_name",
            "patient_name": "patient_name",
            "patient_number": "patient_number",
            "member_number": "member_number",
            "service_type": "service_type",
            "location_code": "location_code",
            "location_name": "location_name",
            "scheme_code": "scheme_code",
            "scheme_name": "scheme_name",
            "visit_number": "visit_number",
            "visit_start": "visit_start",
            "visit_end": "visit_end",
            "icd10_code": "icd10_code"
        }
        response = slade.submit_claim(**payload)
        assert(response.get("detail") is None)


        
        


