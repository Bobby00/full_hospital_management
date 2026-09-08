import frappe

class CleanPatientData:
    def prune_wrong_patient_data(self):
        """Prunes patient records that have wrong data

        1. Retrieve Patient records with:

            1. `first_name` == FNAME
            2. `last_name` == NULL

        2. Retrieve and delete `Wellbaby Schedule`s for patients satisfying the above condition
        3. Retrieve and delete `Contact`s for patients satisfying the above condition 
        4. Delete the patient records
        5. Optionally, retrieve and delete `Customer`s for patients satisfying the above condition
        """
        patients = frappe.qb.DocType("Patient")

        incorrect_patients = frappe.qb.from_(patients).select("name", "first_name", "last_name").where((patients.first_name == "FNAME") & (patients.last_name == "NULL")).run(as_dict=True)
        wellbaby_schedules = frappe.qb.DocType("Wellbaby Schedule")

        contacts = frappe.qb.DocType("Contact")

        customers = frappe.qb.DocType("Customer")

        for patient in incorrect_patients:

            affected_wbs = frappe.qb.from_(wellbaby_schedules).select("name").where((wellbaby_schedules.patient == patient.name)).run(as_dict=True)

            for wb in affected_wbs:
                frappe.delete_doc("Wellbaby Schedule", wb.name)
                frappe.db.commit()

            contact_name = f"{patient.first_name} {patient.last_name}-{patient.name}"
            # Fname NULL-Fname _GATHONI NULL
            affected_contacts = frappe.qb.from_(contacts).select("name").where((contacts.name == contact_name)).run(as_dict=True)

            for contact in affected_contacts:
                frappe.delete_doc("Contact", contact.name)
                frappe.db.commit()
            try:

                frappe.delete_doc("Patient", patient.name)
                frappe.db.commit()
            except Exception as e:
                print(e)

            if frappe.db.exists("Customer", {"customer_name": patient.name}):
                frappe.delete_doc("Customer", patient.name)
                frappe.db.commit()

        



        
clean_patient_data = CleanPatientData()
