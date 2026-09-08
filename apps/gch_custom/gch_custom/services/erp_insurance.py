import frappe


@frappe.whitelist(allow_guest=True)
def get_intergrator_details(patient_encounter):
    """
    Get intergrator details from patient encounter
    """
    intergrator_details = frappe.db.get_value(
        "Patient Encounter",
        patient_encounter,
        ["integrator", "auth_token"],
        as_dict=True,
    )
    return intergrator_details
