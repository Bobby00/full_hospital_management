import frappe
import datetime

logger = frappe.logger("sfd", allow_site=True, file_count=50)


class CreateWellBabySchedule:
    @staticmethod
    def create_wellbaby(doc, event=None):
        # import time
        # time.sleep(100)

        print(f"RUNNING A LOG HERE")
        logger.info(f"RUNNING NOW")

        patient_name = doc.name
        patient_query = f"SELECT name from `tabWellbaby Schedule` WHERE patient={repr(patient_name)}"
        schedule = frappe.db.sql(patient_query, as_dict=True)
        if len(schedule) == 0:
            logger.info("SCHEDULE IS 0")
            vaccine_administrations = frappe.db.sql(
                """ SELECT name FROM `tabVaccine Administration` """, as_dict=True
            )
            for vaccine_administration in vaccine_administrations:
                period = vaccine_administration.name
                vaccines = frappe.db.sql(
                    f""" SELECT name FROM tabVaccine WHERE administered_at='{period}' """,
                    as_dict=True,
                )
                """Remove the time element from dob to avoid unconverted data exception"""
                dob = str(doc.dob).split(" ", 1)[0]
                # Start of getting the date the vaccination is to take place
                patient_dob = datetime.datetime.strptime(dob, "%Y-%m-%d")
                if period == "Birth":
                    vaccination_date = doc.dob
                elif period == "6 Weeks":
                    additional_days = datetime.timedelta(days=42)
                    vaccination_date = patient_dob + additional_days
                elif period == "10 Weeks":
                    additional_days = datetime.timedelta(days=70)
                    vaccination_date = patient_dob + additional_days
                elif period == "14 Weeks":
                    additional_days = datetime.timedelta(days=98)
                    vaccination_date = patient_dob + additional_days
                elif period == "18 Weeks":
                    additional_days = datetime.timedelta(days=126)
                    vaccination_date = patient_dob + additional_days
                elif period == "6 Months":
                    additional_days = datetime.timedelta(days=184)
                    vaccination_date = patient_dob + additional_days
                elif period == "7 Months":
                    additional_days = datetime.timedelta(days=213)
                    vaccination_date = patient_dob + additional_days
                elif period == "9 Months":
                    additional_days = datetime.timedelta(days=274)
                    vaccination_date = patient_dob + additional_days
                elif period == "1 Year":
                    additional_days = datetime.timedelta(days=365)
                    vaccination_date = patient_dob + additional_days
                elif period == "15 Months":
                    additional_days = datetime.timedelta(days=455)
                    vaccination_date = patient_dob + additional_days
                elif period == "2 Years":
                    additional_days = datetime.timedelta(days=731)
                    vaccination_date = patient_dob + additional_days
                elif period == "6 Years":
                    additional_days = datetime.timedelta(days=2193)
                    vaccination_date = patient_dob + additional_days
                elif period == "10 Years":
                    additional_days = datetime.timedelta(days=3655)
                    vaccination_date = patient_dob + additional_days
                else:
                    vaccination_date = doc.dob

                # End of getting the date the vaccination is to take place

                for vaccine in vaccines:
                    new_vaccine = frappe.get_doc(
                        {
                            "doctype": "Wellbaby Schedule",
                            "vaccine_name": vaccine.name,
                            "display_name": vaccine.name,
                            "visit_period": period,
                            "patient": doc.name,
                            "vaccination_date": vaccination_date,
                        }
                    )

                    new_vaccine.insert()
                    frappe.db.commit()
                frappe.msgprint("Wellbaby Schedule Created")
        logger.info("FINISHED ALL")

    ...


create_wellbaby = CreateWellBabySchedule()
