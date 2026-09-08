from typing import Any
import requests

from decouple import config
from decimal import Decimal


class AirtelMoney:
    def __init__(
        self,
        base_url: str,
        client_id: str = "2067ff45-c72d-4bfa-b68a-2c35219382b8",
        client_secret: str = "2067ff45-c72d-4bfa-b68a-2c35219382b8",
    ) -> None:
        self.BASE_URL = base_url
        self.client_id = client_id
        self.client_secret = client_secret
        self.login()

    def login(self) -> None:
        self._get_auth_token()

    def _get_auth_token(self) -> Any:
        """Retrieve the Auth Token"""
        headers = {"Content-Type": "application/json", "Accept": "*/*"}
        body = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "client_credentials",
        }

        r = requests.post(
            f"{self.BASE_URL}/auth/oauth2/token", json=body, headers=headers
        )
        response = r.json()
        token = response.get("access_token")
        self.token = token
        return token

    def _add_headers(self) -> Any:
        """Setup Headers"""
        headers = {"Content-Type": "application/json", "Accept": "*/*"}
        access_token = self.token
        headers.update({"Authorization": f"Bearer {access_token}"})
        self.headers = headers
        return headers

    def stk_push(
        self,
        reference: str,
        phone: str,
        amount: Decimal,
        id: str,
        country: str="KE",
        currency: str="KES",
        trx_currency: str = "KES",
        trx_country: str="KE",
    ) -> Any:
        """
        Initiate USSD Payment Request"""
        headers_ = {
            "X-Country": trx_country,
            "X-Currency": trx_currency,
        }
        headers_.update(self._add_headers())
        body = {
            "reference": reference,
            "subscriber": {"country": country, "currency": currency, "msisdn": phone},
            "transaction": {
                "amount": amount,
                "country": trx_country,
                "currency": trx_currency,
                "id": id,
            },
        }

        r = requests.post(f'{self.BASE_URL}/merchant/v1/payments/', json=body, headers = headers_)
        return r.json()

    def stk_check(self, trx_id:str, trx_country:str="KE", trx_currency:str="KES") -> Any:
        """Check USSD Payment Status"""
        headers_ = {
            "X-Country": trx_country,
            "X-Currency": trx_currency,
        }
        headers_.update(self._add_headers())
        r = requests.get(f'{self.BASE_URL}/standard/v1/payments/{trx_id}', headers = headers_)
        return r.json()

    
