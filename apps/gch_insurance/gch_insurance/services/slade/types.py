from dataclasses import dataclass

@dataclass
class SladeTokenResponseType:
    """Slade Token Response Type
    """
    token_type: str
    access_token: str
    scope: str
    refresh_token: str
    expires_in: int
