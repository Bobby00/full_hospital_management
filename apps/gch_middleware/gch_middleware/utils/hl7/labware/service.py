from typing import List
import zeep
from lxml import etree

from zeep.plugins import HistoryPlugin
from zeep.settings import Settings
from zeep.wsdl.utils import etree_to_string
from zeep.cache import SqliteCache
import frappe
from gch_sentry.utils import capture_exception


from zeep.transports import Transport
from gch_middleware.utils.hl7.labware.main import gch_labware


logger = frappe.logger("labware", allow_site=True, file_count=50)


def print_history(h):
    """Utility to facilitate printing of the payload. For Debugging."""
    print(
        etree.tostring(h.last_sent["envelope"], encoding="unicode", pretty_print=True)
    )
    print(
        etree.tostring(
            h.last_received["envelope"], encoding="unicode", pretty_print=True
        )
    )


class LabwareService:
    """Labware Service class."""

    def __init__(self, *args, **kwargs) -> None:
        self.settings = Settings(strict=False, xml_huge_tree=True)

        self.token = None
        self.service = None
        self.setup()
        self.history = HistoryPlugin()
        super(LabwareService, self).__init__(*args, **kwargs)

    def setup(self):
        try:
            labware_settings = frappe.get_last_doc("Labware Settings")
            self.LOGIN_WSDL = (
                f"{labware_settings.base_url}/labware_weblims_authenticate?wsdl"
            )
            self.SEND_WSDL = f"{labware_settings.base_url}/PL_RECEIVE_HL7?wsdl"
            self.LOGOUT_WSDL = f"{labware_settings.base_url}/labware_weblims_close?wsdl"
            self.WSDL = f"{labware_settings.base_url}?wsdl"
            self.LIMSDSName = labware_settings.limsdsname
            self.USERNAME = labware_settings.username
            self.PASSWORD = labware_settings.get_password("password")
            print(self.LOGIN_WSDL, self.SEND_WSDL, self.LOGOUT_WSDL, self.USERNAME, self.PASSWORD, self.LIMSDSName)

        except Exception as e:
            frappe.publish_realtime(
                event="eval_js",
                message='frappe.show_alert("{0}")'.format(
                    "Looks like Labware Settings have not been set up. Please reach out to support for assistance."
                ),
                user=frappe.session.user,
            )
            return False

    def get_client(self, action: str) -> None:
        transport = Transport(cache=SqliteCache(), timeout=5)
        try:

            if action == "login":
                try:
                    self.client = zeep.Client(
                        self.LOGIN_WSDL,
                        settings=self.settings,
                        transport=transport,
                    )
                except Exception as e:
                    print(f"LABREQUEST LOGIN: {str(e)}")
                    # frappe.log_error(e, f"LABWARE login: {str(e)}")
                    frappe.publish_realtime(
                        event="eval_js",
                        message='frappe.show_alert("{0}")'.format(
                            "Looks like Labware is down at the moment. Please reach out to support for assistance."
                        ),
                        user=frappe.session.user,
                    )

                    self.client = None
            elif action == "send":
                try:
                    self.client = zeep.Client(
                        self.SEND_WSDL,
                        settings=self.settings,
                        transport=transport,
                    )
                except Exception as e:
                    logger.info(f"LABREQUEST SEND: {str(e)}")
                    # frappe.log_error(e, f"LABWARE send: {str(e)}")
                    frappe.publish_realtime(
                        event="eval_js",
                        message='frappe.show_alert("{0}")'.format(
                            "Looks like Labware is down at the moment. Please reach out to support for assistance."
                        ),
                        user=frappe.session.user,
                    )

                    self.client = None
            elif action == "logout":
                try:
                    self.client = zeep.Client(
                        self.LOGOUT_WSDL,
                        settings=self.settings,
                        transport=transport,
                    )
                except Exception as e:
                    logger.info(f"LABREQUEST LOGOUT: {str(e)}")
                    frappe.publish_realtime(
                        event="eval_js",
                        message='frappe.show_alert("{0}")'.format(
                            "Looks like Labware is down at the moment. Please reach out to support for assistance."
                        ),
                        user=frappe.session.user,
                    )

                    # frappe.log_error(e, f"LABWARE logout: {str(e)}")
                    self.client = None
            else:
                logger.info(f"LABREQUEST LOGIN: NONE")
                frappe.publish_realtime(
                    event="eval_js",
                    message='frappe.show_alert("{0}")'.format(
                        "Looks like Labware is down at the moment. Please reach out to support for assistance."
                    ),
                    user=frappe.session.user,
                )

                self.client = None
        except Exception as e:
            frappe.publish_realtime(
                event="eval_js",
                message='frappe.show_alert("{0}")'.format(
                    "Looks like Labware is down at the moment. Please reach out to support for assistance."
                ),
                user=frappe.session.user,
            )
            # frappe.log_error(e, f"LABWARE get_client: {str(e)}")
            self.client = None
        # try:
        #     self.client = zeep.Client(
        #         WSDL,
        #         plugins=[self.history],
        #         settings=self.settings,
        #         transport=transport,
        #     )
        # except Exception as e:
        #     self.client = None
        if self.client is None:
            # from gch_sentry.utils import capture_exception

            # capture_exception("Hello", "There")
            frappe.publish_realtime(
                event="eval_js",
                message='frappe.show_alert("{0}")'.format(
                    "Unable to connect to Labware at this moment, proceeding anyway"
                ),
                user=frappe.session.user,
            )
            # frappe.show_alert("Unable to connect to Labware Service at this moment. Proceeding anyway.")
        return self.client

    def login(self) -> None:
        """Login to service and retrieve session token

        <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:lab="labware_weblims_authenticate">
        <soap:Header/>
            <soap:Body>
                <lab:authenticate>
                    <!--Optional:-->
                    <lab:username>?</lab:username>
                    <!--Optional:-->
                    <lab:password>?</lab:password>
                    <!--Optional:-->
                    <lab:limsDSName>LIMSDEV</lab:limsDSName>
                    <!--Optional:-->
                    <lab:limsServiceName>WEB</lab:limsServiceName>
                </lab:authenticate>
            </soap:Body>
        </soap:Envelope>
        """

        login_client = self.get_client(action="login")
        # message = login_client.wsdl.dump()
        if self.client is not None:

            payload = {
                "username": self.USERNAME,
                "password": self.PASSWORD,
                "limsDSName": self.LIMSDSName,
                "limsServiceName": "WEB",
            }
            logger.debug(payload)
            self.token = login_client.service.authenticate(**payload)
            logger.debug(self.token)
            return self.token
        return None
        ...

    def update_patient(
        self,
        message_id: str = "Unique ID of Message",
        uhid: str = "Patient UHID",
        first_name: str = "Patient First Name",
        middle_name: str = "Patient Middle Name",
        last_name: str = "Patient Last Name",
        dob: str = "Patient DOB YYYYMMDD",
        gender: str = "Patient Gender",
        address: str = "Patient Address: ^Box^City^^0^D",
        country_code: str = "Hardcoded as 001234567",
        phone_number: str = "Primary Parent Phone Number",
        multiple_birth_indicator: str = "Yes (Y) or No (N)",
        country_name: str = "Kenya",
        patient_class: str = "I: Inpatient, E:Emergency, O: Outpatient, C:Commercial",
        admission_type: str = "C: Elective, A: Accident, E: Emergency",
        hospital_service: str = "M: Medical Service, P: Pulmonary Service, S: Surgical Service",
        encounter_number: str = "Patient Encounter Number",
        admission_time: str = "Encounter Time",
        reason_for_admission: str = "0101",
        expected_discharge_time: str = "Encounter Time",
        email_address: str = "Patient Email Address",
        sending_facility: str = "Sending Facility",
    ) -> None:
        """Send the HL7 message to the service.
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://www.labware.com/webservice">
        <soapenv:Header/>
            <soapenv:Body>
                <web:invoke>
                    <!--Optional:-->
                    <web:authToken>?</web:authToken>
                    <!--Optional:-->
                    <web:sendingApplicationC>eGerties</web:sendingApplicationC>
                    <!--Optional:-->
                    <web:sendingFacilityC>MOMBASA <CODE?></web:sendingFacilityC>
                    <!--Optional:-->
                    <web:hl7MessageStringC>?</web:hl7MessageStringC>
                </web:invoke>
            </soapenv:Body>
        </soapenv:Envelope>
        """
        message = gch_labware.update_patient(
            message_id=message_id,
            uhid=uhid,
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
            dob=dob,
            gender=gender,
            address=address,
            country_code=country_code,
            phone_number=phone_number,
            multiple_birth_indicator=multiple_birth_indicator,
            country_name=country_name,
            patient_class=patient_class,
            admission_type=admission_type,
            hospital_service=hospital_service,
            encounter_number=encounter_number,
            admission_time=admission_time,
            reason_for_admission=reason_for_admission,
            expected_discharge_time=expected_discharge_time,
            email_address=email_address,
        )
        print(message)
        auth_token = self.login()
        if auth_token is not None:
            payload = {
                "authToken": auth_token,
                "sendingApplicationC": "eGerties",
                "sendingFacilityC": sending_facility,
                "hl7MessageStringC": f"<![CDATA[{message.value}]]>",
            }
            print(payload)
            logger.info(f"LABREQUEST: {payload}")
            logger.debug(payload)
            print(payload)

            send_client = self.get_client(action="send")
            # send_client.wsdl.dump()
            # Create Labware Request Log
            labware_request_log = frappe.get_doc(
                {
                    "doctype": "Labware Request Log",
                    "uhid": uhid,
                    "type": "ADT-A08",
                    "payload": message.value, 
                }
            )
            labware_request_log.insert(ignore_permissions=True)
            sent = send_client.service.invoke(**payload)
            if sent:
                labware_request_log.db_set("sent", 1)
                labware_request_log.db_set("labware_response", sent)
            
            self.logout()
            return sent
        self.logout()
        return None

    def register_patient(
        self,
        message_id: str = "Unique ID of Message",
        uhid: str = "Patient UHID",
        first_name: str = "Patient First Name",
        middle_name: str = "Patient Middle Name",
        last_name: str = "Patient Last Name",
        dob: str = "Patient DOB YYYYMMDD",
        gender: str = "Patient Gender",
        address: str = "Patient Address: ^Box^City^^0^D",
        country_code: str = "Hardcoded as 001234567",
        phone_number: str = "Primary Parent Phone Number",
        multiple_birth_indicator: str = "Yes (Y) or No (N)",
        country_name: str = "Kenya",
        patient_class: str = "I: Inpatient, E:Emergency, O: Outpatient, C:Commercial",
        admission_type: str = "C: Elective, A: Accident, E: Emergency",
        hospital_service: str = "M: Medical Service, P: Pulmonary Service, S: Surgical Service",
        encounter_number: str = "Patient Encounter Number",
        admission_time: str = "Encounter Time",
        reason_for_admission: str = "0101",
        expected_discharge_time: str = "Encounter Time",
        email_address: str = "Patient Email Address",
        sending_facility: str = "Sending Facility",
    ) -> None:
        """Send the HL7 message to the service.
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://www.labware.com/webservice">
        <soapenv:Header/>
            <soapenv:Body>
                <web:invoke>
                    <!--Optional:-->
                    <web:authToken>?</web:authToken>
                    <!--Optional:-->
                    <web:sendingApplicationC>eGerties</web:sendingApplicationC>
                    <!--Optional:-->
                    <web:sendingFacilityC>MOMBASA <CODE?></web:sendingFacilityC>
                    <!--Optional:-->
                    <web:hl7MessageStringC>?</web:hl7MessageStringC>
                </web:invoke>
            </soapenv:Body>
        </soapenv:Envelope>
        """
        message = gch_labware.register_patient(
            message_id=message_id,
            uhid=uhid,
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
            dob=dob,
            gender=gender,
            address=address,
            country_code=country_code,
            phone_number=phone_number,
            multiple_birth_indicator=multiple_birth_indicator,
            country_name=country_name,
            patient_class=patient_class,
            admission_type=admission_type,
            hospital_service=hospital_service,
            encounter_number=encounter_number,
            admission_time=admission_time,
            reason_for_admission=reason_for_admission,
            expected_discharge_time=expected_discharge_time,
            email_address=email_address,
        )

        auth_token = self.login()
        if auth_token is not None:
            payload = {
                "authToken": auth_token,
                "sendingApplicationC": "eGerties",
                "sendingFacilityC": sending_facility,
                "hl7MessageStringC": f"<![CDATA[{message.value}]]>",
            }
            print(payload)
            logger.info(f"LABREQUEST: {payload}")
            logger.debug(payload)

            send_client = self.get_client(action="send")
            send_client.wsdl.dump()
            print(send_client.wsdl.dump())
            # Create Labware Request Log
            labware_request_log = frappe.get_doc(
                {
                    "doctype": "Labware Request Log",
                    "uhid": uhid,
                    "type": "ADT-A01",
                    "payload": message.value, 
                }
            )
            labware_request_log.insert(ignore_permissions=True)
            sent = send_client.service.invoke(**payload)
            print("SENTTTTT: ", sent)
            if sent:
                labware_request_log.db_set("sent", 1)
                labware_request_log.db_set("labware_response", sent)
            
            self.logout()
            return sent
        self.logout()
        return None

    def request_lab(
        self,
        message_id: str = "",
        first_name: str = "",
        middle_name: str = "",
        last_name: str = "",
        uhid: str = "",
        dob: str = "",
        gender: str = "",
        location: str = "",
        phone_number: str = "",
        email_address: str = "",
        encounter_number: str = "",
        practitioner_number: str = "",
        practitioner_name: str = "",
        lab_tests: List[str] = [],
        sending_facility: str = "",
        clinical_notes: str = "",
        *args,
        **kwargs
    ):
        message = gch_labware.request_lab(
            message_id=message_id,
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
            uhid=uhid,
            dob=dob,
            gender=gender,
            location=location,
            phone_number=phone_number,
            email_address=email_address,
            encounter_number=encounter_number,
            practitioner_number=practitioner_number,
            practitioner_name=practitioner_name,
            lab_tests=lab_tests,
            clinical_notes=clinical_notes,
            sending_facility=sending_facility,
        )
        print(message)
        auth_token = self.login()
        if auth_token is not None:
            payload = {
                "authToken": auth_token,
                "sendingApplicationC": "eGerties",
                "sendingFacilityC": sending_facility,
                "hl7MessageStringC": f"<![CDATA[{message.value}]]>",
            }
            send_client = self.get_client(action="send")
            # send_client.wsdl.dump()
            # Create Labware Request Log
            labware_request_log = frappe.get_doc(
                {
                    "doctype": "Labware Request Log",
                    "uhid": uhid,
                    "type": "ORM-O01",
                    "payload": message.value,
                }
            )
            labware_request_log.insert(ignore_permissions=True)
            sent = send_client.service.invoke(**payload)
            print(sent)
            if sent:
                labware_request_log.db_set("sent", 1)
                labware_request_log.db_set("labware_response", sent)
            self.logout()
            return sent
        self.logout()
        return None

    def logout(self) -> None:
        """Logout by closing the session token
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:lab="labware_weblims_close">
        <soapenv:Header/>
            <soapenv:Body>
                <lab:close>
                    <!--Optional:-->
                    <lab:authToken>?</lab:authToken>
                </lab:close>
            </soapenv:Body>
        </soapenv:Envelope>
        """
        logout_client = self.get_client(action="logout")
        if logout_client:
            payload = {"authToken": self.token}
            logout_client.service.close(**payload)
        self.token = None
        return self.token


gch_labware_service = LabwareService()
