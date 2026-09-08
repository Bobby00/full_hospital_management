import urllib.request as urllib2
import frappe
import random
from datetime import date
import datetime
import re


def cleanNumber(num):
    cleanNum = num
    b = re.search("^254", num)
    if b:
        z = re.split("^254", num)
        cleanNum = z[1]

    a = re.search("^0", num)
    if a:
        x = re.split("^0", num)
        cleanNum = x[1]
    return cleanNum


# STATUS CODES AND REUSABLE VARIABLES
SUCCESS = 200
NOT_FOUND = 404
BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
    "Accept-Encoding": "none",
    "Accept-Language": "en-US,en;q=0.8",
    "Connection": "keep-alive",
}


def send_message(phone_number, message):

    url = (
        "http://messaging.advantasms.com/bulksms/sendsms.jsp?user=wellbaby@gertrudes&password=wellbaby&mobiles="
        + phone_number
        + "&sms="
        + message
        + "&unicode=1"
    )

    url = str(url).replace(" ", "+")

    req = urllib2.Request(url, headers=BROWSER_HEADERS)

    try:
        page = urllib2.urlopen(req)

        frappe.msgprint(("Message sent successfully"))

        return page.read()
    except urllib2.HTTPError as e:
        frappe.throw(f"Error occured! {e}")
        print(e.fp.read())
    return ""


@frappe.whitelist(allow_guest=True)
def send_patient_sms(**args):

    phone_number = args.get("patient_mobile")
    first_name = args.get("first_name")

    message = (
        "Hello " + first_name + ", this is a test message from ERPNext custom API!"
    )

    if phone_number:
        send_message(phone_number, message)
    else:
        frappe.throw("Please enter patient's mobile phone number.")


@frappe.whitelist()
def generate_otp(phone_number):

    # Query patient with the mibile number
    patient_details = frappe.db.sql(
        f"""SELECT first_name, name FROM `tabParents` WHERE phone_number={cleanNumber(phone_number)};""",
        as_dict=True,
    )

    if patient_details:

        # Generate the OTP
        otp = random.randint(1000, 9999)

        status_code = SUCCESS
        body = otp

        # Update patient record, insert OPT value
        frappe.db.sql(
            f"""UPDATE `tabParents` SET otp={otp} WHERE phone_number={cleanNumber(phone_number)};"""
        )
        frappe.db.commit()

        # Send the message
        message = f"Here is your code {otp}"

        send_message("254" + cleanNumber(phone_number), message)

    else:

        status_code = NOT_FOUND
        body = "Sorry, your record is not found. Please visit Gertrude's Children's Hospital for registration."

    # Put together and return the info
    response = dict(status_code=status_code, body=body)

    return response


@frappe.whitelist()
def get_patient_details(phone_number, otp):

    # Query patient with the mobile number
    parent_details = frappe.db.sql(
        f"""SELECT first_name, last_name, email FROM `tabParents` WHERE phone_number={cleanNumber(phone_number)} AND otp={otp};""",
        as_dict=True,
    )

    if parent_details:

        status_code = SUCCESS
        body = parent_details

    else:

        status_code = (NOT_FOUND,)
        body = "Sorry, we cannot find this record!."

    # Put together and return the info
    response = dict(status_code=status_code, body=body)

    return response


@frappe.whitelist()
def query_patient_by_barcode(barcode):

    patient = frappe.db.sql(
        f"""SELECT name, patient_name FROM `tabPatient` WHERE patient_barcode_code={barcode};""",
        as_dict=True,
    )

    if patient:

        service_units = frappe.db.sql(
            f""" SELECT name, healthcare_service_unit_name FROM `tabHealthcare Service Unit` """,
            as_dict=True,
        )

        status_code = SUCCESS
        body = service_units, patient

    else:

        status_code = (NOT_FOUND,)
        body = "Sorry, we cannot find this record!."

    # Put together and return the info
    response = dict(status_code=status_code, body=body)

    return response


@frappe.whitelist()
def open_patient_encounter(patient_pk, service_unit):

    patient_record = frappe.db.sql(
        f"""SELECT * FROM `tabPatient` WHERE name='{patient_pk}';""", as_dict=True
    )

    if patient_record:
        patient_encounter = frappe.get_doc(
            {
                "doctype": "Patient Encounter",
                "patient": patient_pk,
                "patient_name": patient_record[0].patient_name,
                "patient_sex": patient_record[0].sex,
                "patient_age": "2 years",
                "practitioner": "HLC-PRAC-2021-00001",
            }
        )

        patient_encounter.insert()
        frappe.db.commit()

        queue_group = frappe.db.sql(
            f"""SELECT name FROM `tabQueue Group` LIMIT 1;""", as_dict=True
        )
        queue_group = queue_group[0].name

        queue_priority = frappe.db.sql(
            f"""SELECT queue_type FROM `tabQueue Group` WHERE name='{queue_group}';""",
            as_dict=True,
        )

        if queue_priority[0].queue_type == "Normal":

            # Check the largest queue position number
            last_queue_item = frappe.db.sql(
                f"""SELECT MAX(queue_position) as last_item_in_queue FROM `tabQueue` WHERE queue_group='{queue_group}';""",
                as_dict=True,
            )

            if last_queue_item[0].last_item_in_queue == None:
                queue_position = 1
            else:
                queue_position = int(last_queue_item[0].last_item_in_queue) + 1

        else:
            # Queue position will be at the front of the queue
            current_queue_items = frappe.db.sql(
                f"""SELECT name, queue_position FROM `tabQueue`;""", as_dict=True
            )

            # Check for emergencies in the table
            emergencies_in_queue = frappe.db.sql(
                f""" SELECT queue_position FROM `tabQueue` AS table1 LEFT JOIN `tabQueue Group` AS table2 ON table1.queue_group = table2.name WHERE table2.queue_type='Emergency';"""
            )

            if emergencies_in_queue:
                # Get the largest number in the emergency queue
                largest_emergency_number = max(emergencies_in_queue)
                new_queue_position = largest_emergency_number[0] + 1

                non_emergencies_in_queue = frappe.db.sql(
                    f""" SELECT table1.name, queue_position FROM `tabQueue` AS table1 LEFT JOIN `tabQueue Group` AS table2 ON table1.queue_group = table2.name WHERE table2.queue_type='Normal';""",
                    as_dict=True,
                )

                for item in non_emergencies_in_queue:
                    update_current_queue = frappe.db.sql(
                        f"""UPDATE `tabQueue` SET queue_position={item.queue_position + 1} WHERE name='{item.name}';"""
                    )
                    frappe.db.commit()

            else:
                new_queue_position = 1

                for item in current_queue_items:
                    update_current_queue = frappe.db.sql(
                        f"""UPDATE `tabQueue` SET queue_position={item.queue_position + 1} WHERE name='{item.name}';"""
                    )
                    frappe.db.commit()

            queue_position = new_queue_position

        patient_encounter = patient_encounter.name

        add_patient_to_triage_queue(
            patient_pk, queue_group, patient_encounter, queue_position
        )

        return queue_position


def add_patient_to_triage_queue(
    patient_pk, queue_group, patient_encounter, queue_position
):

    status = "Waiting"

    patient_queue_record = frappe.get_doc(
        {
            "doctype": "Queue",
            "patient": patient_pk,
            "queue_group": queue_group,
            "patient_encounter": patient_encounter,
            "queue_position": queue_position,
            "status": status,
        }
    )

    patient_queue_record.insert()
    frappe.db.commit()

    return True


def change_encounter_type(doc, handler=None):

    new_queue_group = doc.queue_group

    queue_item = frappe.db.sql(
        f"""SELECT name, queue_group FROM `tabQueue` WHERE patient_encounter='{doc.name}';""",
        as_dict=True,
    )

    if doc.is_emergency == 1:
        # queue_item = frappe.db.sql(f"""SELECT name, queue_group FROM `tabQueue` WHERE patient_encounter='{doc.name}';""", as_dict=True)

        queue_group = frappe.db.sql(
            f"""SELECT queue_type FROM `tabQueue Group` WHERE name='{queue_item[0].queue_group}';""",
            as_dict=True,
        )

        if queue_group[0].queue_type == "Normal":

            # Queue position will be at the front of the queue
            current_queue_items = frappe.db.sql(
                f"""SELECT name, queue_position FROM `tabQueue`;""", as_dict=True
            )

            # Check for emergencies in the table
            emergencies_in_queue = frappe.db.sql(
                f""" SELECT queue_position FROM `tabQueue` AS table1 LEFT JOIN `tabQueue Group` AS table2 ON table1.queue_group = table2.name WHERE table2.queue_type='Emergency';"""
            )

            if emergencies_in_queue:
                # Get the largest number in the emergency queue
                largest_emergency_number = max(emergencies_in_queue)
                new_queue_position = largest_emergency_number[0] + 1

                non_emergencies_in_queue = frappe.db.sql(
                    f""" SELECT table1.name, queue_position FROM `tabQueue` AS table1 LEFT JOIN `tabQueue Group` AS table2 ON table1.queue_group = table2.name WHERE table2.queue_type='Normal';""",
                    as_dict=True,
                )

                for item in non_emergencies_in_queue:
                    update_current_queue = frappe.db.sql(
                        f"""UPDATE `tabQueue` SET queue_position={item.queue_position + 1} WHERE name='{item.name}';"""
                    )
                    frappe.db.commit()

            else:
                new_queue_position = 1

                for item in current_queue_items:
                    update_current_queue = frappe.db.sql(
                        f"""UPDATE `tabQueue` SET queue_position={item.queue_position + 1} WHERE name='{item.name}';"""
                    )
                    frappe.db.commit()

            queue_position = new_queue_position

            update_current_queue = frappe.db.sql(
                f"""UPDATE `tabQueue` SET queue_position={queue_position} WHERE name='{queue_item[0].name}';"""
            )
            frappe.db.commit()

            # Update queue group to the appropriate category

        else:
            frappe.throw("Already Emergency")

            return False
    else:

        last_queue_item = frappe.db.sql(
            f"""SELECT MAX(queue_position) as last_item_in_queue FROM `tabQueue` WHERE queue_group='{new_queue_group}';""",
            as_dict=True,
        )

        if last_queue_item[0].last_item_in_queue == None:
            queue_position = 1
        else:
            queue_position = int(last_queue_item[0].last_item_in_queue) + 1

        if doc.workflow_state != "Pending Triage":
            update_current_queue = frappe.db.sql(
                f"""UPDATE `tabQueue` SET queue_group='{new_queue_group}', status='{doc.workflow_state}', queue_position='{queue_position}' WHERE name='{queue_item[0].name}';"""
            )
            frappe.db.commit()

            return True

        else:
            return False
