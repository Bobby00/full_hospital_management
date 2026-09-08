import requests
from decouple import config


class AdvantaService():
    def __init__(self, partner_id="3408", short_code="GERTRUDES", api_url="https://quicksms.advantasms.com/api/services"):
        self._api_url = api_url
        self._api_key = config("ADVANTA_API_KEY")
        self._partner_id = partner_id
        self._short_code = short_code

    def send_sms(self, message, recipient) -> bool:
        try:
            request_url = f"{self._api_url}/sendsms/"

            request_payload = {
                "apikey": self._api_key,
                "partnerID": self._partner_id,
                "message": message,
                "shortcode": self._short_code,
                "mobile": recipient,
                "pass_type": "plain"
            }

            result = requests.post(request_url, data=request_payload)
            json_result = result.json()

            # {'responses': [{'response-code': 200, 'response-description': 'Success', 'mobile': 254721476778, 'messageid': '1087244009', 'networkid': 1}]}

            return True

        except Exception as e:
            print(e)
            return False

    def check_balance(self) -> int:
        try:
            request_url = f"{self._api_url}/getbalance/"
            request_payload = {
                "apikey": self._api_key,
                "partnerID": self._partner_id,
            }
            result = requests.post(request_url, data=request_payload)
            json_result = result.json()

            if json_result["response-code"] == 200:

                return float(json_result["credit"])

            return 0
        except Exception as e:
            print(e)
            return 0
