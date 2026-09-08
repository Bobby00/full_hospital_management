import frappe
from typing import Any, List
from datetime import datetime, timedelta
from frappe import _
from frappe.utils.csvutils import build_csv_response


class GCHTheatreAPI:
    def __init__(self) -> None:
        """
        init
        """
        ...

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def render_theatre_timeline():
        """
        Get Theatre Timeline.

        { theatre: 'Theatre 1', start: '2023-08-15T10:00:00', end: '2023-08-15T12:00:00', title: 'Patient One' },
        { theatre: 'Theatre 2', start: '2023-08-15T13:00:00', end: '2023-08-15T15:00:00', title: 'Patient One' },
        { theatre: 'Theatre 3', start: '2023-08-15T16:00:00', end: '2023-08-15T18:00:00', title: 'Patient One' },
        { theatre: 'Theatre 1', start: '2023-08-15T12:05:00', end: '2023-08-15T15:26:00', title: 'Patient One' },
        { theatre: 'Theatre 2', start: '2023-08-16T13:00:00', end: '2023-08-16T15:00:00', title: 'Patient One' },
        { theatre: 'Theatre 3', start: '2023-08-16T16:00:00', end: '2023-08-16T18:00:00', title: 'Patient One' },
        { theatre: 'Theatre 1', start: '2023-08-15T15:30:00', end: '2023-08-15T17:00:00', title: 'Patient One' },
        """

        bookings = frappe.get_all(
            "Theatre Booking",
            filters={"is_patient_confirmed": True, "is_finance_team_confirmed": True},
            fields=["*"],
        )
        response = {"bookings": bookings}
        # print(response)
        return response

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def render_bookings(
        booked_date=None, surgeon: Any = None, anaesthetist: Any = None
    ) -> Any:
        """
        Get Theatre Bookings for the following day.
        surgery_time: is a datetime field.
        """
        tomorrow_date = frappe.utils.add_days(frappe.utils.nowdate(), 1)
        tomorrow_date = datetime.strptime(tomorrow_date, "%Y-%m-%d").date()
        if booked_date:
            tomorrow_date = booked_date
        tomorrow_start = datetime.combine(tomorrow_date, datetime.min.time())
        tomorrow_end = datetime.combine(tomorrow_date, datetime.max.time())

        filters = {
            "surgery_start_time": ["between", (tomorrow_start, tomorrow_end)],
        }

        if surgeon:
            filters["surgeon_or_doctor"] = surgeon

        if anaesthetist:
            filters["anaesthetist"] = anaesthetist

        bookings: List = frappe.get_all(
            "Theatre Booking", filters=filters, fields=["*"]
        )
        response = {"bookings": bookings, "date": tomorrow_date}
        return response

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def render_calendar_bookings(surgeon: str = None, clinical_procedure: str = None):
        print(surgeon, clinical_procedure)
        if not surgeon and not clinical_procedure:
            query = """
            SELECT name, surgery_start_time, surgery_end_time, theatre, surgeon_or_doctor, anaesthetist, docstatus, patient_name, patient, surgeon_name
        
            FROM `tabTheatre Booking`
            """
            records = frappe.db.sql(query, as_dict=1)
        if surgeon:
            query = """
            SELECT name, surgery_start_time, surgery_end_time, theatre, surgeon_or_doctor, docstatus, patient_name, patient, surgeon_name
        
            FROM `tabTheatre Booking` where surgeon_or_doctor = %(surgeon)s or anaesthetist = %(surgeon)s
            """
            records = frappe.db.sql(query, {"surgeon": surgeon}, as_dict=1)
        # if clinical_procedure:
        #     query = """
        #     SELECT name, surgery_start_time, surgery_end_time, theatre, surgeon_or_doctor, docstatus

        #     FROM `tabTheatre Booking` where surgeon_or_doctor = %(surgeon)
        #     """
        #     records = frappe.db.sql(
        #         query, {"clinical_procedure": clinical_procedure}, as_dict=1
        #     )
        print(records)
        for record in records:
            print(record.patient, record.patient_name)
        response = [
            {
                "id": record.name,
                "resourceId": record.theatre,
                "groupId":record.theatre,
                "overlap":False,
                "eventOverlap":False,

                "title": (
                    record.title
                    if record.title
                    else f"{record.patient_name} with {record.surgeon_name}"
                ),
                "start": record.surgery_start_time,
                "end": record.surgery_end_time,
            }
            for record in records
        ]
        return response

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def render_all_bookings(start, end, filters=None):
        """
        Render all bookings for Calendar View.
        """
        events = []
        from frappe.desk.reportview import get_filters_cond

        conditions = get_filters_cond("Theatre Booking", filters, [])

        return []

    def add_booking_calendar(events, start, end, conditions=None):
        query = """
        SELECT name, surgery_start_time, surgery_end_time, theatre, surgeon_or_doctor, docstatus 
        
        FROM `tabTheatre Booking` WHERE 

        surgery_start_time >= %(start_time)s or surgery_end_time  <= %(end_time)s

        OR (%(start_time)s BETWEEN surgery_start_time AND surgery_end_time AND %(end_time)s BETWEEN surgery_start_time AND surgery_end_time)

        """
        if conditions:
            query += conditions

        records = frappe.db.sql(
            query, {"surgery_start_time": start, "surgery_end_time": end}, as_dict=1
        )
        return

    def render_bookings1(
        booked_date=None, surgeon: Any = None, anaesthetist: Any = None
    ) -> Any:
        """
        Get Theatre Bookings for the following day.
        surgery_time: is a datetime field.

        """
        tomorrow = frappe.utils.add_days(frappe.utils.nowdate(), 1)
        if booked_date:
            tomorrow = booked_date
        if surgeon:
            return frappe.get_all(
                "Theatre Booking",
                filters={
                    "surgery_time": tomorrow,
                    "surgeon_or_doctor": surgeon,
                    "is_patient_confirmed": True,
                    "is_finance_team_confirmed": True,
                },
                fields=["*"],
            )
        if anaesthetist:
            return frappe.get_all(
                "Theatre Booking",
                filters={
                    "surgery_time": tomorrow,
                    "anaesthetist": anaesthetist,
                    "is_patient_confirmed": True,
                    "is_finance_team_confirmed": True,
                },
                fields=["*"],
            )
        return frappe.get_all(
            "Theatre Booking",
            filters={
                "surgery_time": tomorrow,
                "is_patient_confirmed": True,
                "is_finance_team_confirmed": True,
            },
            fields=["*"],
        )

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def create_theatre_booking(
        patient_name,
        patient_phone,
        surgery_name,
        surgeon_name,
        anaesthetist_name,
        surgery_start_time,
        surgery_end_time,
    ):
        from datetime import datetime

        start_time = datetime.fromisoformat(surgery_start_time)
        formatted_start_time = start_time.strftime("%Y-%m-%d %H:%M:%S")

        end_time = datetime.fromisoformat(surgery_end_time)
        formatted_end_time = end_time.strftime("%Y-%m-%d %H:%M:%S")

        print(formatted_start_time, formatted_end_time)

        try:
            # Create a new Theatre Booking document
            theatre_booking = frappe.get_doc(
                {
                    "doctype": "Theatre Booking",
                    "patient_name": patient_name,
                    "patient_phone": patient_phone,
                    "surgery_name": surgery_name,
                    "surgeon_or_doctor": surgeon_name,
                    "anaesthetist": anaesthetist_name,
                    "surgery_start_time": formatted_start_time,
                    "surgery_end_time": formatted_end_time,
                }
            )

            theatre_booking.insert(ignore_permissions=True)
            frappe.db.commit()

            return _("Theatre Booking created successfully")

        except Exception as e:
            print(str(e))
            frappe.log_error(
                frappe.get_traceback(), _("Theatre Booking Creation Failed")
            )
            return _("Failed to create Theatre Booking: {0}").format(str(e))

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def fetch_booking_procedures(theatre_booking_name):
        procedures = frappe.get_all(
            "Theatre Booking Clinical Procedure Template",
            filters={"parent": theatre_booking_name},
            fields=[
                "clinical_procedure_template",
                "item_code",
                "price",
                "medical_code",
                "surgeon",
                "surgeon_name",
            ],
        )
        return procedures

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def cancel_booking(docname):
        """Cancel Theatre Booking"""
        try:
            frappe.db.set_value("Theatre Booking", docname, "docstatus", 2)
        except Exception as error:
            return "Failed to reschedule Booking. Try again later."
        return _("Theatre Booking has been cancelled.")

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def reschedule_booking(docname):
        """Reschedule Theatre Booking"""
        try:
            frappe.db.set_value("Theatre Booking", docname, "docstatus", 0)
        except Exception as error:
            return "Failed to reschedule Booking. Try again later."
        return _("Theatre booking opened for rescheduling")

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def export_theatre_bookings(filters=None):
        
        # filters_dict = frappe.parse_json(filters)
        # records = frappe.get_all('Theatre Booking', filters=filters_dict, fields="*", as_list=True)
        # records = frappe.get_all('Theatre Booking', fields="*", as_list=True)

        # csv_data = '\n'.join([','.join(map(str, record)) for record in records])
        # filename = "Theatre Booking Records.csv"
        # return build_csv_response(csv_data, filename)
        import json
        filters = json.loads(frappe.form_dict.get('filters'))
        print(filters)
        data = frappe.get_list('Theatre Booking', filters=filters, fields=['name', 'patient', 'surgeon_or_doctor', 'surgery_start_time', 'surgery_end_time'])
        return data
    
    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def get_inpatient_doc(inpatient_record: str):
        """
        Use Inpatient Record to get the Inpatient Document
        """
        try:
            inpatient_doc = frappe.get_doc("Inpatient Record", inpatient_record)
            return inpatient_doc
        except Exception as e:
            frappe.throw(f"Error getting Inpatient Document: {e}")

    @frappe.whitelist(allow_guest=True)
    @staticmethod
    def get_all_assessments(theatre_overview: str, inpatient_record: str):
        """
        Use inpatiet record and theatre overview to get all assessments done from theatre
        """
        try:
            patient_assessments = frappe.get_all(
                "Patient Assessment",
                filters={
                    "theatre_overview": theatre_overview,
                    "inpatient_record": inpatient_record,
                },
                fields=["name", "assessment_template", "assessment_date",
                        "assessment_time","owner","action"],
            )
            return patient_assessments
        except Exception as e:
            frappe.throw(f"Error getting Patient Assessments: {e}")
            return {"message": False}


gch_theatre_api = GCHTheatreAPI()
