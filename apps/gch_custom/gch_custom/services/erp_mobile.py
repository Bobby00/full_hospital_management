import frappe


class ScannerAppController:
    @frappe.whitelist(allow_guest=True)
    def check_patient_appointments(patient: str, service_unit: str):
        """
        Used to get the all open apppointments for a patient
        :param patient: name of the patient
        :param service_unit: name of the service unit

        :return: list of appointments
        title
        appointment_date
        appointment_time
        practitioner
        department
        """
        try:

            appointments_list = frappe.db.get_list(
                "Patient Appointment", filters={"patient": patient, "status": "Scheduled", "service_unit": service_unit}, fields=["name", "title", "appointment_date", "appointment_time", "practitioner", "department", "service_unit"])

            return appointments_list

        except Exception as e:
            print(e)
            frappe.log_error(
                e, "MOBILE CHECK PATIENT APPOINTMENT ERROR  /erp_mobile.py")
            return []

    @frappe.whitelist(allow_guest=True)
    def create_patient_encounter_with_appoint(patient: str, appointment: str, service_unit: str):
        pass

    @frappe.whitelist(allow_guest=True)
    def get_service_units(branch: str):
        """
        used to get the service units for a branch

        :param branch: name of the branch
        :return: list of service units

        name
        location
        service_unit
        requires_appointments
        """
        try:
            service_units = frappe.db.get_list("Queue Group", filters={
                                               "location": branch}, fields=["name", "location", "service_unit", "require_appointments"])
            return service_units
        except Exception as e:
            print(e)
            frappe.log_error(
                e, "MOBILE GET SERVICE UNITS ERROR  /erp_mobile.py")
            return []
