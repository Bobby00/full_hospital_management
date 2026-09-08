import frappe

def get_emails_from_group(group_name):
    email_members = frappe.get_all(
        "Email Group Member",
        filters={"email_group": group_name},
        fields=["email"]
    )
    email_list = [member.get("email") for member in email_members]
    return email_list