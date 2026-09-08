import frappe


class InpatientRecordUtils:
    @frappe.whitelist(allow_guest=True)
    def get_user_account_for_nurse(nurse: str):
        try:
            user = frappe.get_value("Healthcare Practitioner", nurse, "user")
            return user
        except Exception as e:
            frappe.log_error(e, "ERROR: GET USER ACCOUNT FOR NURSE")
            return None

    @frappe.whitelist(allow_guest=True)
    def get_current_primary_nurse(inpatient_record: str):
        try:

            current_primary_nurse = frappe.get_value(
                "Inpatient Record", inpatient_record, "primary_nurse"
            )

            if not current_primary_nurse:
                frappe.log_error(
                    "INFO: NO PRIMARY NURSE SET", "GET CURRENT PRIMARY NURSE"
                )
                return None

            current_user = frappe.get_value(
                "Healthcare Practitioner", current_primary_nurse, "user_id"
            )
            if not current_user:
                frappe.log_error(
                    "INFO: NO USER ACCOUNT FOR PRIMARY NURSE",
                    "GET CURRENT PRIMARY NURSE",
                )
                return None

            return current_user

        except Exception as e:
            frappe.log_error(e, "ERROR: GET CURRENT PRIMARY NURSE")
            return None

    @frappe.whitelist(allow_guest=True)
    def get_receiving_nurse(handsoff: str):
        try:
            receiving_nurse = frappe.get_value(
                "Nursing Handsoff Tool", handsoff, "name_of_the_receiving_nurse"
            )

            if not receiving_nurse:
                frappe.log_error("INFO: NO RECEIVING NURSE SET", "GET RECEIVING NURSE")
                return None
            user = frappe.get_value(
                "Healthcare Practitioner", receiving_nurse, "user_id"
            )
            if not user:
                frappe.log_error(
                    "INFO: NO USER ACCOUNT FOR RECEIVING NURSE",
                    "GET RECEIVING NURSE",
                )
                return None

            return user
        except Exception as e:
            frappe.log_error(e, "ERROR: GET RECEIVING NURSE")
            return None

    @frappe.whitelist(allow_guest=True)
    def set_current_primary_nurse(inpatient_record: str, primary_nurse: str):
        try:
            frappe.db.set_value(
                "Inpatient Record", inpatient_record, "primary_nurse", primary_nurse
            )
            return True
        except Exception as e:
            frappe.log_error(e, "ERROR: SET CURRENT PRIMARY NURSE")
        return False
