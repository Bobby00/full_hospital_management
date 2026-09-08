import frappe
from frappe.utils import now, get_datetime

from erpnext.healthcare.doctype.healthcare_service_unit.healthcare_service_unit import (
    HealthcareServiceUnit,
)
from gch_queue.utils.network import gch_ip_util
from typing import Any, Dict, List

@frappe.whitelist(allow_guest=True)
@staticmethod
def set_user_station(service_unit: str, user: str = None, *args) -> Dict:
    """
    Set the logged-in user's station.
    The Station is a Healthcare Service Unit.

    Steps:
    1. Retrieve the Healthcare Practitioner Object
    2. Retrieve the Healthcare Service Unit Object
    3. Create/Update Practitioner Station Entry Object
    """
    user_ip = frappe.local.request_ip
    frappe.msgprint("User IP: {}".format(user_ip))

    # Retrieve Branches
    BRANCH = frappe.qb.DocType("Branch")
    branches = frappe.qb.from_(BRANCH).select("*").run(as_dict=True)

    # Identify user's branch based on IP
    user_branch = next(
        (
            branch.name
            for branch in branches
            if branch.ip_range
            and gch_ip_util.ip_in_prefix(user_ip, branch.ip_range.strip())
        ),
        branches[0].name if branches else None,
    )

    frappe.msgprint(f"Welcomme, You are in {user_branch}")

    # Identify the user
    actor = (
        frappe.session.user
        if frappe.session.user and frappe.session.user != "Guest"
        else user
    )
    if not actor:
        frappe.throw(title="Error", msg="You need to sign in to continue")

    # Retrieve Healthcare Practitioner and User information
    healthcare_practitioner = frappe.get_doc(
        "Healthcare Practitioner", {"user_id": actor}
    )
    user_info = frappe.get_doc("User", {"name": actor})

    # Retrieve Healthcare Service Unit
    healthcare_service_unit = frappe.get_doc("Healthcare Service Unit", service_unit)
    if not healthcare_service_unit:
        frappe.throw(
            title="Error",
            msg="The Healthcare Service Unit you are trying to set does not exist.",
        )

    # Check if entries exist for Healthcare Practitioner and User
    healthcare_pract_entry_exists = frappe.db.exists(
        {
            "doctype": "Practitioner Station Entry",
            "healthcare_practitioner": healthcare_practitioner.name
            if healthcare_practitioner
            else None,
        }
    )
    user_entry_exists = frappe.db.exists(
        {
            "doctype": "Practitioner Station Entry",
            "user": user_info.name if user_info else None,
        }
    )

    # Update or create entries based on existence
    if healthcare_pract_entry_exists:
        update_station_entry(
            "healthcare_practitioner",
            healthcare_practitioner,
            healthcare_service_unit,
            user_branch,
            user_ip,
        )
    if user_entry_exists:
        update_station_entry(
            "user", user_info, healthcare_service_unit, user_branch, user_ip
        )
    elif user_info:
        create_station_entry(
            "user", user_info, healthcare_service_unit, user_branch, user_ip
        )
    if healthcare_practitioner and not healthcare_pract_entry_exists:
        create_station_entry(
            "healthcare_practitioner",
            healthcare_practitioner,
            healthcare_service_unit,
            user_branch,
            user_ip,
        )

    return


def update_station_entry(
    entry_type: str,
    entry_info: dict,
    healthcare_service_unit: HealthcareServiceUnit,
    user_branch: str,
    user_ip: str,
):
    """
    Update the Practitioner Station Entry.
    """
    entry = frappe.get_doc("Practitioner Station Entry", {entry_type: entry_info.name})
    entry.station = healthcare_service_unit.name
    entry.time_in = get_datetime()
    entry.user_ip = user_ip
    entry.time_out = None
    entry.branch = user_branch
    entry.save(ignore_permissions=True)


def create_station_entry(
    entry_type: str,
    entry_info: dict,
    healthcare_service_unit: HealthcareServiceUnit,
    user_branch: str,
    user_ip: str,
):
    """
    Create a new Practitioner Station Entry.
    """
    try:
        station_entry = frappe.get_doc(
            {
                "doctype": "Practitioner Station Entry",
                entry_type: entry_info.name,
                "station": healthcare_service_unit.name,
                "time_in": get_datetime(),
                "branch": user_branch,
                "user_ip": user_ip,
            }
        )
        station_entry.insert(ignore_permissions=True)
    except Exception:
        frappe.throw(
            title="Error",
            msg="There was an error setting your station. Please try again.",
        )
