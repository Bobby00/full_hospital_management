from email.policy import strict
import zeep
import frappe
from lxml import etree

from zeep.plugins import HistoryPlugin
from zeep.settings import Settings
from zeep.wsdl.utils import etree_to_string
from zeep.cache import SqliteCache

WSDL = "https://PACS_URL_HERE"


class PacsService:
    """_summary_
    """
    def __init__(self, *args, **kwargs) -> None:
        self.settings = Settings(strict=False, xml_huge_tree=True)
        self.history = HistoryPlugin()
        self.service = None
        self.client = None
        self.cache = SqliteCache(path=frappe.get_site_path("cache", "zeep_cache.db"))

        super(PacsService, self).__init__(*args, **kwargs)


    def get_client(self) -> None:
        """Get the client for the PACS service"""
        ...

    def login(self) -> None:
        """Login to the PACS service"""
        ...

    