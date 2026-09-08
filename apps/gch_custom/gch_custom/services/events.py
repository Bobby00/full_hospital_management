import frappe
import datetime
from gch_custom.tasks import gch_tasks

def create_wellbaby_schedule(doc, event):
    print("GOING GOING GOING")
    gch_tasks.enqueue_create_wellbaby(doc=doc, event=event)
    ...


    # patient_name = doc.name



    # schedule = frappe.db.sql(
    #     f""" SELECT name FROM `tabWellbaby Schedule` WHERE patient='{patient_name}' """, as_dict=True)

    # if len(schedule) == 0:

    #     vaccine_administrations = frappe.db.sql(
    #         """ SELECT name FROM `tabVaccine Administration` """, as_dict=True)

    #     for vaccine_administration in vaccine_administrations:

    #         period = vaccine_administration.name

    #         vaccines = frappe.db.sql(
    #             f""" SELECT name FROM tabVaccine WHERE administered_at='{period}' """, as_dict=True)

    #         """Remove the time element from dob to avoid unconverted data exception"""
    #         dob = str(doc.dob).split(" ",1)[0]

    #         # Start of getting the date the vaccination is to take place
    #         patient_dob = datetime.datetime.strptime(dob,"%Y-%m-%d")


    #         if(period == "Birth"):
    #             vaccination_date = doc.dob
    #         elif(period == "6 Weeks"):
    #             additional_days = datetime.timedelta(days=42)
    #             vaccination_date = patient_dob + additional_days
    #         elif(period == "10 Weeks"):
    #             additional_days = datetime.timedelta(days=70)
    #             vaccination_date = patient_dob + additional_days
    #         elif(period == "14 Weeks"):
    #             additional_days = datetime.timedelta(days=98)
    #             vaccination_date = patient_dob + additional_days
    #         elif(period == "18 Weeks"):
    #             additional_days = datetime.timedelta(days=126)
    #             vaccination_date = patient_dob + additional_days
    #         elif(period == "6 Months"):
    #             additional_days = datetime.timedelta(days=184)
    #             vaccination_date = patient_dob + additional_days
    #         elif(period == "7 Months"):
    #             additional_days = datetime.timedelta(days=213)
    #             vaccination_date = patient_dob + additional_days
    #         elif(period == "9 Months"):
    #             additional_days = datetime.timedelta(days=274)
    #             vaccination_date = patient_dob + additional_days
    #         elif(period == "1 Year"):
    #             additional_days = datetime.timedelta(days=365)
    #             vaccination_date = patient_dob + additional_days
    #         elif(period == "15 Months"):
    #             additional_days = datetime.timedelta(days=455)
    #             vaccination_date = patient_dob + additional_days
    #         elif(period == "2 Years"):
    #             additional_days = datetime.timedelta(days=731)
    #             vaccination_date = patient_dob + additional_days
    #         elif(period == "6 Years"):
    #             additional_days = datetime.timedelta(days=2193)
    #             vaccination_date = patient_dob + additional_days
    #         elif(period == "10 Years"):
    #             additional_days = datetime.timedelta(days=3655)
    #             vaccination_date = patient_dob + additional_days
    #         else:
    #             vaccination_date = doc.dob

    #         # End of getting the date the vaccination is to take place

    #         for vaccine in vaccines:

    #             new_vaccine = frappe.get_doc({
    #                 "doctype": "Wellbaby Schedule",
    #                 "vaccine_name": vaccine.name,
    #                 "display_name": vaccine.name,
    #                 "visit_period": period,
    #                 "patient": doc.name,
    #                 "vaccination_date": vaccination_date
    #             })

    #             new_vaccine.insert()
    #             frappe.db.commit()


def generate_item_display_name(doc, event):
    doc.display_name = doc.item_name


def update_vaccination_status(doc, event):
    vaccines = doc.vaccines
    patient = doc.patient

    vaccination_date = datetime.date.today()

    for vaccine in vaccines:
        if(vaccine.vaccinated == 'Yes'):
            vaccination_status = "Vaccinated"
        else:
            vaccination_status = "Not Vaccinated"

        frappe.db.sql(
            f''' UPDATE `tabWellbaby Schedule` SET status="{vaccination_status}", vaccination_date="{vaccination_date}" WHERE vaccine_name="{vaccine.wellbaby_vaccine}" AND patient="{patient}" ''')

    frappe.db.commit()


@frappe.whitelist(allow_guest=True)
def get_vaccinations(duration):
    vaccinations = frappe.db.sql(
        f"""SELECT name FROM `tabVaccine` WHERE administered_at='{duration}' """,
        as_dict=True,
    )
    return vaccinations


@frappe.whitelist(allow_guest=True)
def administered_vaccines(patient):
    """
    query = f"SELECT * FROM tabWellbaby Schedule WHERE status='Vaccinated' AND patient='{patient.replace(\"'\", \"''\")}'" - this should prevent SQL injection and should also make it safe to include apostrophes.


    Args:
        patient (_type_): _description_

    Returns:
        _type_: _description_
    """
    # query = f"SELECT * FROM tabWellbaby Schedule WHERE status='Vaccinated' AND patient='{patient.replace('\'', '\'\'')}"

    # query = f"SELECT * FROM tabWellbaby Schedule WHERE status='Vaccinated' AND patient='{patient.replace(\"'\", \"''\")}'"
    # query = f"SELECT * FROM tabWellbaby Schedule WHERE status='Vaccinated' AND patient='{patient.replace('\'', '\'\'')}'"
    query = f"SELECT * FROM `tabWellbaby Schedule` WHERE status='Vaccinated' AND patient={repr(patient)}"
    vaccines = frappe.db.sql(
        query,
        as_dict=True,
    )

    return vaccines
