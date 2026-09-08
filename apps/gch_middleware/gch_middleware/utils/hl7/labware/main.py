import datetime
from typing import Any, List, Tuple
import frappe
import hl7apy
from hl7apy.core import Message
from hl7apy.exceptions import UnsupportedVersion
from hl7apy.parser import parse_message
import re
# TODO
# Notifiy LabWare on each change of patient
# MANDATORY = PID

logger = frappe.logger("labware4", allow_site=True, file_count=50)


class LabwareHL7Wrapper:
    def __init__(self, *args, **kwargs) -> None:
        self.ADT_VERSION = "2.5.1"
        self.ADT_OLD_VERSION = "2.2"
        self.ORM_VERSION = "2.2"
        self.branch = kwargs.get("Branch", "Muthaiga")
        self.sending_application = "eGerties"
        self.sending_facility = "GCH"
        self.receiving_application = "Lab Ware"
        self.acknowledgement_type = "AL"
        self.application_acknowledgement_type = "NE"
        self.country_code = "EN"
        ...

    def _return_current_datetime(self) -> str:
        sasa = datetime.datetime.now()
        formatted = sasa.strftime("%Y%m%d%H%M%S")
        return formatted

    def _generate_adt(
        self,
        type: str = "A01",
        message_time: str = "Timestamp of message sent (At opening of encounter)",
        message_id: str = "Unique ID of Message",
        uhid: str = "Patient UHID",
        first_name: str = "Patient First Name",
        middle_name: str = "Patient Middle Name",
        last_name: str = "Patient Last Name",
        dob: str = "Patient DOB YYYYMMDD",
        gender: str = "Patient Gender",
        address: str = "Mombasa",
        county_code: str = "Hardcoded as 001234567",
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
        **kwargs,
    ) -> Message:
        adt_msg = Message(f"ADT_{type}", version=self.ADT_VERSION if type=="A01" else self.ADT_OLD_VERSION)

        """
        **MSH**
        MSH|^~\&|eGerties|GCH|Lab Ware|1|20220501100138||ADT^A01|3220748|P|2.5.1|||AL|NE|EN

        MSH.1: MSH
        MSH.2: Encoding Characters (^~\&)
        MSH.3: Sending Application (eGerties)
        MSH.4: Sending Facility (GCH)
        MSH.5: Receiving Application (Lab Ware)
        MSH.6: Receiving Facility (1)
        MSH.7: Date/Time of Message (20220501100138)
        MSH.8: Security (blank)
        MSH.9: Message Type (ADT^A01)
        MSH.10: Message Control ID (3220748)
        MSH.11: Processing ID (P)
        MSH.12: Version ID (2.5.1)
        MSH.13: Sequence Number (blank)
        MSH.14: Continuation Pointer (blank)
        MSH.15: Accept Acknowledgment Type (AL)
        MSH.16: Application Acknowledgment Type (NE)
        MSH.17: Country Code (EN)

        **PID**
        PID||585496|585496||ZOEY^ADIPO^OPONDO||20160518|f|||^2^Mombasa^^0^D|001234567|0720574838^^^k@gerties.org|||||||||||N||||^Kenya|

        PID.1: Blank
        PID.2: Patient ID (585496)
        PID.3: Patient Identifier List (585496)
        PID.4: Alternate Patient ID (Blank)
        PID.5: Patient Name (ZOEY^ADIPO^OPONDO)
        PID.6: Mother's Maiden Name (Blank)
        PID.7: Date of Birth (20160518) YYYYMMDD
        PID.8: Administrative sex / Gender (f)
        PID.9: Patient Alias (Blank)
        PID.10: Race (Blank)
        PID.11: Patient Address (^2^Mombasa^^0^D)
            Street Address (Blank)
            Other Designation (2)
            City (Mombasa)
            State/Province (Blank)
            Zip/Postal Code (0)
                String Data (Blank)
            Country (D)
        PID.12: County Code (001234567)
        PID.13: Phone Number Home (0720574838)
            PID.13.4 Email Address(k@gerties.org)
        PID.14: Phone Number Business (Blank)
        PID.15: Primary Language (Blank)
        PID.16: Marital Status (Blank)
        PID.17: Religion (Blank)
        PID.18: Patient Account Number (Blank)
        PID.19: SSN Number (Blank)
        PID.20: Driver's License Number (Blank)
        PID.21: Mother's Identifier (Blank)
        PID.22: Ethnic Group
        PID.23: Birth Place (Blank)
        PID.24: Multiple Birth Indicator (N)
        PID.25: Birth Order (Blanl)
        PID.26: Citizenship (Blank)
        PID.27: Veterans Military Status(Blank)
        PID.28: Nationality

        **PV1**

        MSH|^~\&|eGerties|GCH|Lab Ware|1|20220501100138||ADT^A01|3220748|P|2.5.1|||AL|NE|EN
        EVN|A01|20220501100138
        PID||585496|585496||ZOEY^ADIPO^OPONDO||20160518|f|||^2^Mombasa^^0^D|001234567|0720574838^^^k@gerties.org|||||||||||N||||^Kenya|
        PV1||I|^|C||||||M|||||||||202205014002|||||||||||||||||||||||||20220501100138
        PV2|||0101||||||20220501100138

        """
        sasa = self._return_current_datetime()
        
        patient_name = re.sub(r'\s+', ' ', f"{first_name} {middle_name} {last_name}".strip()).replace(" ", "^").upper()
        adt_msg.msh = f"MSH|^~\&|{self.sending_application}|{self.sending_facility}|Lab Ware|1|{sasa}||ADT^{type}|{message_id}|P|2.5.1|||AL|NE|EN"
        adt_msg.evn = f"EVN|{type}|{sasa}"
        adt_msg.pid = f"PID||{uhid}|{uhid}||{patient_name}||{dob}|{gender}|||^2^{address}^^0^D|001234567|{phone_number}^^^{email_address}|||||||||||N||||^Kenya|"
        adt_msg.pv1 = f"PV1||I|^|C||||||M|||||||||{encounter_number}|||||||||||||||||||||||||{sasa}"
        adt_msg.pv2 = f"PV2|||0101||||||{sasa}"

        return adt_msg

    def register_patient(
        self,
        # message_time: str="Timestamp of message sent (At opening of encounter)",
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
    ) -> Any:
        """_summary_

        Args:
            message_time (str, optional): _description_. Defaults to "Timestamp of message sent (At opening of encounter)".
            message_id (str, optional): _description_. Defaults to "Unique ID of Message".
            uhid (str, optional): _description_. Defaults to "Patient UHID".
            first_name (str, optional): _description_. Defaults to "Patient First Name".
            middle_name (str, optional): _description_. Defaults to "Patient Middle Name".
            last_name (str, optional): _description_. Defaults to "Patient Last Name".
            dob (str, optional): _description_. Defaults to "Patient DOB YYYYMMDD".
            gender (str, optional): _description_. Defaults to "Patient Gender".
            address (_type_, optional): _description_. Defaults to "Patient Address: ^Box^City^^0^D".
            country_code (str, optional): _description_. Defaults to "Hardcoded as 001234567".
            phone_number (str, optional): _description_. Defaults to "Primary Parent Phone Number".
            multiple_birth_indicator (List[str,str], optional): _description_. Defaults to "Yes (Y) or No (N)".
            country_name (str, optional): _description_. Defaults to "Kenya".
            patient_class (_type_, optional): _description_. Defaults to "I: Inpatient, E:Emergency, O: Outpatient, C:Commercial".
            admission_type (_type_, optional): _description_. Defaults to "C: Elective, A: Accident, E: Emergency".
            hospital_service (_type_, optional): _description_. Defaults to "M: Medical Service, P: Pulmonary Service, S: Surgical Service".
            encounter_number (str, optional): _description_. Defaults to "Patient Encounter Number".
            admission_time (str, optional): _description_. Defaults to "Encounter Time".
            reason_for_admission (str, optional): _description_. Defaults to "0101".
            expected_discharge_time (str, optional): _description_. Defaults to "Encounter Time".

        Returns:
            Any: _description_
        """
        message_time = self._return_current_datetime()
        try:
            adt_message = self._generate_adt(
                type="A01",
                message_time=message_time,
                message_id=message_id,
                uhid=uhid,
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
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
            # logger.info(f"{str(e)}")
        except Exception as e:
            logger.info(f"{str(e)}")
            return {}
        return adt_message

    def update_patient(
        self,
        # message_time: str="Timestamp of message sent (At opening of encounter)",
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
    ) -> Any:
        """_summary_

        Args:
            message_time (str, optional): _description_. Defaults to "Timestamp of message sent (At opening of encounter)".
            message_id (str, optional): _description_. Defaults to "Unique ID of Message".
            uhid (str, optional): _description_. Defaults to "Patient UHID".
            first_name (str, optional): _description_. Defaults to "Patient First Name".
            middle_name (str, optional): _description_. Defaults to "Patient Middle Name".
            last_name (str, optional): _description_. Defaults to "Patient Last Name".
            dob (str, optional): _description_. Defaults to "Patient DOB YYYYMMDD".
            gender (str, optional): _description_. Defaults to "Patient Gender".
            address (_type_, optional): _description_. Defaults to "Patient Address: ^Box^City^^0^D".
            country_code (str, optional): _description_. Defaults to "Hardcoded as 001234567".
            phone_number (str, optional): _description_. Defaults to "Primary Parent Phone Number".
            multiple_birth_indicator (List[str,str], optional): _description_. Defaults to "Yes (Y) or No (N)".
            country_name (str, optional): _description_. Defaults to "Kenya".
            patient_class (_type_, optional): _description_. Defaults to "I: Inpatient, E:Emergency, O: Outpatient, C:Commercial".
            admission_type (_type_, optional): _description_. Defaults to "C: Elective, A: Accident, E: Emergency".
            hospital_service (_type_, optional): _description_. Defaults to "M: Medical Service, P: Pulmonary Service, S: Surgical Service".
            encounter_number (str, optional): _description_. Defaults to "Patient Encounter Number".
            admission_time (str, optional): _description_. Defaults to "Encounter Time".
            reason_for_admission (str, optional): _description_. Defaults to "0101".
            expected_discharge_time (str, optional): _description_. Defaults to "Encounter Time".

        Returns:
            Any: _description_
        """
        message_time = self._return_current_datetime()
        try:
            adt_message = self._generate_adt(
                type="A08",
                message_time=message_time,
                message_id=message_id,
                uhid=uhid,
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
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
            # logger.info(f"{str(e)}")
        except Exception as e:
            print(f"Exception {e}")
            logger.info(f"{str(e)}")
            return {}
        return adt_message

    def _generate_orm(
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
        clinical_notes: str = "",
        sending_facility="",
    ) -> Message:
        """Generates an ORM Message

        MSH|^~\&|Kranium HMIS|GCH|Lab Ware|1|20220501101449||ORM^O01|3220767|P|2.2|||AL|NE|EN
        PID||585496|585496||OPONDO^ZOEY||20160518|f|||^^Mombasa^^0^D|001234567|0720574838^^^k@gerties.org|||||||||||N||||^|
        PV1||I|^|C||||||M|||||||||202205014002|||||||||||||||||||||||||20220501101449
        ORC|NW|3078525|3078525||||||20220501101449|||101298^Dr Sumaiya Said|^^^20||||||
        OBR|1|3078525|3078525|_micro29^Stool Microscopy-Including Concentration|R||20220501101449|20220501101449||||||||||||||||
        """

        # orm_msg = Message("ORM_O01", version=self.ORM_VERSION)
        sasa = self._return_current_datetime()
        type = "O"
        default_clinic = "OUT"
        clinic_id = "300"

        patient_name = re.sub(r'\s+', ' ', f"{first_name} {middle_name} {last_name}".strip()).replace(" ", "^").upper()
        msh = f"MSH|^~\&|eGerties|GCH|Lab Ware|1|{sasa}||ORM^O01|{message_id}|P|2.2|||AL|NE|EN\r"
        pid = f"PID||{uhid}|{uhid}||{patient_name}||{dob}|{gender}|||^^{location}^^0^D|001234567|{phone_number}^^^{email_address}|||||||||||N|||{clinical_notes}|^|\r"

        pv1 = f"PV1||I|^|C||||||M|||||||||{encounter_number}|||||||||||||||||||||||||{sasa}\r"
        orc = f"ORC|NW|{message_id}|{message_id}||||||{sasa}|||{practitioner_number}^{practitioner_name}|^^^{sending_facility}||||||\r"
        """ 
        for x in zip(range(len(lab_tests)), lab_tests):
            print(x)
        """
        obrs = []
        orm_message = msh + pid + pv1 + orc
        # orm_msg.add_group()
        for index, value in enumerate(lab_tests):
            """
            {
                "item_code": "_haem49",
                "item_name": "NAME_HERE",
            }
            """
            # orm_msg.obr.add()
            orm_message += f"OBR|{index+1}|{message_id}|{message_id}|{value.get('item_code')}^{value.get('item_name')}|R||{sasa}|{sasa}|||||{value.get('comment')}^{value.get('comment')}|||||||||||\r"
        # print(orm_msg.obr.va)

        # print(orm_message)
        try:

            orm_msg = parse_message(orm_message)
            return orm_msg
        except Exception as e:
            print("UNABLE TO GENERATE", e)

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
        clinical_notes="",
        sending_facility="",
    ):
        """
        1. When a Lab request is raised, Patient Details ( ADT ) are sent to labware. This helps create this patient on Labware as we await for the order

        # Sample message:
              1 2     3            4    5      6        7       8     9   10     11 12  131415
            MSH|^~\&|Kranium HMIS|GCH|Lab Ware|1|20220501100138||ADT^A01|3220748|P|2.5.1|||AL|NE|EN

            Breakdown
            **MSH**
            LabWare Receiving Application
            1 - Location
            20220501100138 - Message Time
            3220748 - Message Control Unique ID
            P - Processing ID
            2.5.1 - Version
            AL - Application Acceptance Type (AL = ALWAYS)
            NE -

            **EVN**
            EVN
            A01 = ADT, A08 Update
            20220501100138 - Encounter Date/Time

            **PID**
            PID||585496|585496||ZOEY^ADIPO^OPONDO||20160518|f|||^2^Mombasa^^0^D|001234567|0720574838^^^k@gerties.org|||||||||||N||||^Kenya|
            PID
            585496 - UHID
            585496 - PID/UHID
            ZOEY^ADIPO^OPONDO - Patient Name (First Name, Middle Name, Last Name)
            || - Mother's Maiden Name
            20160518 - Date of Birth YYYYMMDD
            f - Gender

            ^2^Mombasa^^0^D - Address (Box Address, City, Province, Postal Code, Country)

            **PV1**

            PV1||I|^|C||||||M|||||||||202205014002|||||||||||||||||||||||||20220501100138

            EVN|A01|20220501100138
            PID||585496|585496||ZOEY^ADIPO^OPONDO||20160518|f|||^2^Mombasa^^0^D|001234567|0720574838^^^k@gerties.org|||||||||||N||||^Kenya|
            PID||585496|585496||ZOEY^ADIPO^OPONDO||20160518|f|||^2^Mombasa^^0^D|001234567|0720574838^^^k@gerties.org|||||||||||N||||^|
            PV1||I|^|C||||||M|||||||||202205014002|||||||||||||||||||||||||20220501100138
            PV1||I|^|C||||||M|||||||||202205014002|||||||||||||||||||||||||20220501101449
            PV2|||0101||||||20220501100138

            On UPDATES TO PATIENT DETAILS
            MSH|^~\&|Kranium HMIS|GCH|Lab Ware|1|20220501100138||ADT^A01|3220748|P|2.5.1|||AL|NE|EN
            EVN|A08|20220501100138
            PID||585496|585496||ZOEY^ADIPO^OPONDO||20160518|f|||^2^Mombasa^^0^D|001234567|0720574838^^^k@gerties.org|||||||||||N||||^Kenya|
            PV1||I|^|C||||||M|||||||||202205014002|||||||||||||||||||||||||20220501100138
            PV2|||0101||||||20220501100138


        2. The lab is then sent in the form of an ORM:

            MSH|^~\&|Kranium HMIS|GCH|Lab Ware|1|20220501101449||ORM^O01|3220767|P|2.2|||AL|NE|EN
            PID||585496|585496||OPONDO^ZOEY||20160518|f|||^^Mombasa^^0^D|001234567|0720574838^^^k@gerties.org|||||||||||N||||^|
            PV1||I|^|C||||||M|||||||||202205014002|||||||||||||||||||||||||20220501101449
            ORC|NW|3078525|3078525||||||20220501101449|||101298^Dr Sumaiya Said|^^^20||||||
            OBR|1|3078525|3078525|_micro29^Stool Microscopy-Including Concentration|R||20220501101449|20220501101449|||||||||||||||| |

        """
        orm_msg = self._generate_orm(
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
        return orm_msg

    def receive_lab(self, payload: str) -> Tuple[str, str, str, str, str]:
        # import time
        # time.sleep(10)
        """
        3. Once the results are out, Lab results are sent to HMIS in the form of an ORU Message. the message has a pdf report and the results per test component

            MSH|^~\&|LabWare Prod^2.16.840^ISO|Gertrude's Children's Hospital^^ISO|KRANIUM|Gertrudes Children's Hospital|20220501103825-M22083342||ORU^R01^ORU_R01|20220501103825-M22083342|T|2.5.1|||AL||KEN|||||GCHLabReport
            PID|1||585496^^^LabWare Prod&&ISO^PI^^^^^~585496||OPONDO^ZOEY^^^^^L||20160518000000+0300|F||2106-3^^HL70005^^KEN^L^20070424^v unknown|k@gerties.org^^^Mombasa^^KEN||720574838^^^k@gerties.org|720574838^^^k@gerties.org||||||||||||^KEN|||||||20220501101606+0300||^^ISO|^2.11.111.1.111111.1.1.11111^ISO
            ORC|RE|M22083342^GCH^3078525^ISO|M22083342^MOMBASA^\\192.168.0.173\LabWare\CHT-OTHER\SecureReports\2022\202205\00111070.PDF^ISO|||||||||^^^^^^^^Mombasa Clinic^^^^NPI^^^^^^^^^^~^Request^Self^^^^^^Mombasa Clinic^U|||||||||Mombasa Clinic^D^^^^LabWare Prod&2.16.840.1.114222.4.3.3.23&ISO^XX^^^GCH|123 Somewhere^^Nairobi^^Nairobi^Mombasa^M|+254730645005^^^info@gerties.org^^000^+254730645005|^^^^^000^0000000|^^^^^000^0000000|^^^^^000^0000000
            OBR|1|MBM220000494^GCH^^ISO|MBM220000494^MOMBASA|2779192^Stool Analysis^LN^STOOL_O_C^Stool Analysis^L^2.34^v unknown^STOOL_O_C|||20180716150759-0400|||||||||^Request^Self^^^^^^Mombasa Clinic^^^^NPI^^^^^^^^^^~^Request^Self^^^^^^^U||||||20220501103826+0300|||F|F|F|F|F
            SPM|1|MBM220000494^&LabWare Prod||^^^STOOL^STOOL^L^20110131|||||||||||||20220501103527+0300|20220501103203+0300
            OBX|1|ED|M22083342^FINAL^^^^^2.34||^TEXT^pdf^Link^\\192.168.0.173\LabWare\CHT-OTHER\SecureReports\2022\202205\00111070.PDF||||||F||||||||||||Mombasa Clinic^D^^^^CLIA&2.11.111.1.111111.1.1.11111&ISO^XX^^^GCH|123 Somewhere^^Nairobi^^0^KEN^B|^^^^^^^^^L
            OBX|2|NM|_micro29^Consistency^LN^Consistency^Consistency^L^2.34||Semi-Soft|^^^NONE^-^^1.8.2|||||F|||20180716150759-0400||FMAHMOUD^^^^^^^^LabWare Prod&2.16.840.1.114222.4.3.3.23&ISO^D^^^PN|||20220501103704+0300||||Mombasa Clinic^D^^^^GCH^XX^^^9999999|123 Somewhere^ERROR^Nairobi^GCH^^Mombasa^B|^^^^^^^^^L
            OBX|3|NM|_micro29^Colour^LN^Colour^Colour^L^2.34||Brown|^^^NONE^-^^1.8.2|||||F|||20180716150759-0400||FMAHMOUD^^^^^^^^LabWare Prod&2.16.840.1.114222.4.3.3.23&ISO^D^^^PN|||20220501103704+0300||||Mombasa Clinic^D^^^^GCH^XX^^^9999999|123 Somewhere^ERROR^Nairobi^GCH^^Mombasa^B|^^^^^^^^^L
            OBX|4|NM|_micro29^Mucoid^LN^Mucoid^Mucoid^L^2.34||Present|^^^NONE^-^^1.8.2|||||F|||20180716150759-0400||FMAHMOUD^^^^^^^^LabWare Prod&2.16.840.1.114222.4.3.3.23&ISO^D^^^PN|||20220501103704+0300||||Mombasa Clinic^D^^^^GCH^XX^^^9999999|123 Somewhere^ERROR^Nairobi^GCH^^Mombasa^B|^^^^^^^^^L
            OBX|5|NM|_micro29^Trophozoites^LN^Trophozoites^Trophozoites^L^2.34||No Trophozoite Seen|^^^NONE^-^^1.8.2|||||F|||20180716150759-0400||FMAHMOUD^^^^^^^^LabWare Prod&2.16.840.1.114222.4.3.3.23&ISO^D^^^PN|||20220501103704+0300||||Mombasa Clinic^D^^^^GCH^XX^^^9999999|123 Somewhere^ERROR^Nairobi^GCH^^Mombasa^B|^^^^^^^^^L
            OBX|6|NM|_micro29^Cyst^LN^Cyst^Cyst^L^2.34||No Cyst Seen|^^^NONE^-^^1.8.2|||||F|||20180716150759-0400||FMAHMOUD^^^^^^^^LabWare Prod&2.16.840.1.114222.4.3.3.23&ISO^D^^^PN|||20220501103704+0300||||Mombasa Clinic^D^^^^GCH^XX^^^9999999|123 Somewhere^ERROR^Nairobi^GCH^^Mombasa^B|^^^^^^^^^L
            OBX|7|NM|_micro29^Ova^LN^Ova^Ova^L^2.34||No Ova Seen|^^^NONE^-^^1.8.2|||||F|||20180716150759-0400||FMAHMOUD^^^^^^^^LabWare Prod&2.16.840.1.114222.4.3.3.23&ISO^D^^^PN|||20220501103704+0300||||Mombasa Clinic^D^^^^GCH^XX^^^9999999|123 Somewhere^ERROR^Nairobi^GCH^^Mombasa^B|^^^^^^^^^L
            OBX|8|NM|_micro29^Crystals^LN^Crystals^Crystals^L^2.34||Nil|^^^NONE^-^^1.8.2|||||F|||20180716150759-0400||FMAHMOUD^^^^^^^^LabWare Prod&2.16.840.1.114222.4.3.3.23&ISO^D^^^PN|||20220501103704+0300||||Mombasa Clinic^D^^^^GCH^XX^^^9999999|123 Somewhere^ERROR^Nairobi^GCH^^Mombasa^B|^^^^^^^^^L
            OBX|9|NM|_micro29^Yeast Cells^LN^Yeast Cells^Yeast Cells^L^2.34||Absent|^^^NONE^-^^1.8.2|||||F|||20180716150759-0400||FMAHMOUD^^^^^^^^LabWare Prod&2.16.840.1.114222.4.3.3.23&ISO^D^^^PN|||20220501103704+0300||||Mombasa Clinic^D^^^^GCH^XX^^^9999999|123 Somewhere^ERROR^Nairobi^GCH^^Mombasa^B|^^^^^^^^^L
            OBX|10|NM|_micro29^Starch Granules^LN^Starch Granules^Starch Granules^L^2.34||Present|^^^NONE^-^^1.8.2|||||F|||20180716150759-0400||FMAHMOUD^^^^^^^^LabWare Prod&2.16.840.1.114222.4.3.3.23&ISO^D^^^PN|||20220501103704+0300||||Mombasa Clinic^D^^^^GCH^XX^^^9999999|123 Somewhere^ERROR^Nairobi^GCH^^Mombasa^B|^^^^^^^^^L
            OBX|11|NM|_micro29^RBC^LN^RBC^RBC^L^2.34||Few|^^^NONE^-^^1.8.2|||||F|||20180716150759-0400||FMAHMOUD^^^^^^^^LabWare Prod&2.16.840.1.114222.4.3.3.23&ISO^D^^^PN|||20220501103704+0300||||Mombasa Clinic^D^^^^GCH^XX^^^9999999|123 Somewhere^ERROR^Nairobi^GCH^^Mombasa^B|^^^^^^^^^L
            OBX|12|NM|_micro29^Pus Cells^LN^Pus Cells^Pus Cells^L^2.34||Many|^^^NONE^-^^1.8.2|||||F|||20180716150759-0400||FMAHMOUD^^^^^^^^LabWare Prod&2.16.840.1.114222.4.3.3.23&ISO^D^^^PN|||20220501103704+0300||||Mombasa Clinic^D^^^^GCH^XX^^^9999999|123 Somewhere^ERROR^Nairobi^GCH^^Mombasa^B|^^^^^^^^^L
            OBX|13|NM|_micro29^Larvae^LN^Larvae^Larvae^L^2.34||Absent|^^^NONE^-^^1.8.2|||||F|||20180716150759-0400||FMAHMOUD^^^^^^^^LabWare Prod&2.16.840.1.114222.4.3.3.23&ISO^D^^^PN|||20220501103704+0300||||Mombasa Clinic^D^^^^GCH^XX^^^9999999|123 Somewhere^ERROR^Nairobi^GCH^^Mombasa^B|^^^^^^^^^L
            OBR|1|M22083342^GCH|M22083342^Mombasa Clinic^^ISO|55752-0^Clinical Information^LN^^^^2.34||20220501101606+0300|20220501103827+0300|||||||20220501103203+0300|STOOL|^Welby^Self^^^^^^^U|+254730645005^^^info@gerties.org|||||20220501103527+0300|||F

        4. Labware expects an acknowledgement message from HMIS Confirming receipt of the same.

            MSH|^~\&|||Manufacturer|Kranium|20220501103906||ACK^R01|20220501103825-M22083342|P|2.3.1||||0||ASCII|||
            MSA|AA|20220501103825-M22083342|Message accepted|||0|


        """
        try:
            lab_data = parse_message(
                payload.replace("\n", "\r"), find_groups=False, validation_level=2
            )
        except Exception as e:
            print(e)
            frappe.log_error(e,"Error receiving lab results")
            return None, None, None, None, None

        message_id = lab_data.msh.msh_7.value
        sec_message_id = lab_data.orc.orc_2.orc_2_3.value
        print(f"sec message id: {sec_message_id}")
        labware_id = lab_data.orc.orc_2.orc_2_1.value
        branch_code = lab_data.orc.orc_3.orc_3_2.value
        result_data = lab_data.orc.orc_3.orc_3_3.value.replace("\E", "")
        return (message_id, sec_message_id, result_data, labware_id, branch_code)


def handle_lab_result_doc(
    payload,
    message_id,
    sec_message_id,
    result_doc,
    labware_id,
    branch_code,
    *args,
    **kwargs,
):
    """
    Factoring in the branch_code, we need to check on which the instance is running.
    1. Get Labware Settings DocType
    2. Retrieve the Branch code from Labware Settings
    3. Retrieve Branch Code from the Payload
    4. If the two branch codes do not match, retrieve the 
    """
    from gch_middleware.services.rest import is_ip_address
    host_url = frappe.utils.get_url()
    result_doc = result_doc.replace("\\", "/")
    domain = result_doc.split("/")[2]
    valid, ip_address = is_ip_address(domain)
    if not valid:
        ip_address = "192.168.0.173"
    folder_path = "/".join(result_doc.split("/")[-3:])
    abs_url = f"http://{ip_address}/{folder_path}"
    result_doc = f"file:{result_doc}"
    try:
        batch = frappe.get_doc("Lab Test Batch", {"name": message_id})
    except frappe.DoesNotExistError:
        try:
            batch = frappe.get_doc("Lab Test Batch", {"name": sec_message_id})
        except frappe.DoesNotExistError:
            batch = None
    except Exception as e:
        batch = None
    if batch:
        try:
            batch.db_set("raw_result", payload)
            batch.db_set("result_document", abs_url)
            batch.db_set("status", "COMPLETED")
            frappe.db.commit()
            batch_lab_tests = frappe.db.get_all(
                "Lab Test", filters={"batch": batch.name}
            )
            batch_number = batch.name

            # Update has_result to 1 for all lab prescriptions in the batch

            lab_prescriptions = frappe.db.get_all(
                "Lab Prescription", filters={"batch_number": batch_number}
            )
            for lab_prescription in lab_prescriptions:
                try:
                    lab_pres = frappe.get_doc(
                        "Lab Prescription", {"name": lab_prescription.name}
                    )
                    lab_pres.db_set("has_result", 1)
                    frappe.db.commit()
                except Exception as e:
                    print(f"ERR: {str(e)}")
                    print(e)
            

            # Update results for all lab tests in the batch
            for batch_lab_test in batch_lab_tests:
                b_lab_test = frappe.get_doc("Lab Test", {"name": batch_lab_test.name})

                try:
                    b_lab_test.db_set("result_document_url", abs_url)
                    frappe.db.commit()
                except Exception as e:
                    print(f"ERR: {str(e)}")
                    print(e)
                
                
            # processed = tasks.enqueue_map_results(batch_number=batch.name, result_document=result_doc)
        except Exception as e:
            print(f"ERROR: {str(e)}")


gch_labware = LabwareHL7Wrapper()
