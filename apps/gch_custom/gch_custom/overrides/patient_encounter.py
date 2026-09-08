from erpnext.healthcare.doctype.patient_encounter.patient_encounter import (
    PatientEncounter,
)
from erpnext.healthcare.doctype.patient.patient import Patient
import frappe
from gch_queue.queue_management.doctype.queue.queue import Queue


class GCHPatientEncounter(PatientEncounter):
    # def check_if_latest(self):
    #     """
    #     Overrides logic to check if the document is latest.

    #     Gets rid of the TimestampMismatch error
    #     """
    #     conflict = False
    #     self._action = "save"
    #     # super().check_if_latest()

    def handle_multiple_queues(self, patient, service_unit):
        """
        Sends patients to multiple queues
        """
        bulk_send_services = [
            "Radiology - GCH",
            "Pharmacy - GCH",
            "Laboratory - GCH",
            "Procedure - GCH",
            "Main Pharmacy - GCH",
            "Neuro Pharmacy - GCH",
            "Executive Pharmacy - GCH",
            "Premier Pharmacy - GCH"
        ]
        if service_unit in bulk_send_services:
            qg = frappe.get_value("Queue Group", {"service_unit": service_unit})
            # frappe.log_error(
            #     f"Sending patient {patient} to {service_unit} queue group {qg}", "GCH Patient Encounter"
            # )
            try:
                patient_in_queue = frappe.db.exists(
                    {"doctype": "Queue", "patient": patient, "queue_group": qg}
                )
                print(f"Patient in queue: {patient_in_queue}")
                if not patient_in_queue:
                    queue_record = {
                        "doctype": "Queue",
                        "patient": patient,
                        "queue_group": qg,
                        "priority": self.priority,
                        "phone": self.phone_number,
                        "patient_encounter": self.name,
                        "is_in":0
                    }
                    queue_doc = frappe.get_doc(queue_record)
                    queue_doc.insert()
                else:
                    try:
                        queue_doc = frappe.get_doc("Queue", patient_in_queue[0][0], queue_group=qg)
                        frappe.db.set_value(
                            "Queue",
                            patient_in_queue[0][0],
                            {
                                "queue_group":qg,
                                "priority": self.priority,
                                "phone": self.phone_number,
                                "patient_encounter": self.name,
                                "is_in":0
                            },
                            update_modified=True
                        )
                    except Exception as error:
                        frappe.log_error(error, "ERROR UPDATING TO QUEUE")
            except Exception as error:
                frappe.log_error(error, "ERROR ON HANDLING MULTIPLE QUEUES")
                pass
        ...

    def validate(self):
        """Validate Encounter on insertion and saving

        1. Get Patient

        2. Get Queue that Patient belongs to (if any)

        3. Update the Queue Group of the Queue to what is herein.

        4. If patient is not in any Queue, add them to a new Queue

        5. If no Queue Group is assigned to the patient, add them to the Default Receptionist (Reception - GCH))

        6. If Patient has Pharmacy, Lab or Radiology, push them to all those queues.
        """
        patient: Patient = frappe.get_value("Patient", {"name": self.patient})

        # Handle different Pharmacy queue groups based on clinic
        clinic = frappe.get_doc("Healthcare Service Unit",self.clinic)
        queue_service_unit = "Pharmacy - GCH"

        if self.branch == "Muthaiga":
            if clinic.parent_healthcare_service_unit is not None:
                queue_service_unit = clinic.parent_healthcare_service_unit
                # frappe.log_error(
                #     f"Validate muthaiga Branch .Queue Service Unit: {queue_service_unit}", "GCH Patient Encounter"
                # )


        receptionist_qg = frappe.get_value(
            "Queue Group", {"service_unit": "Reception - GCH"}
        )
        queue_group = (
            self.queue_group if self.queue_group is not None else receptionist_qg
        )

        has_pharmacy = (
            self.prescription_table is not None and len(self.prescription_table) > 0
        )
        has_radiology = (
            self.radiology_details is not None and len(self.radiology_details) > 0
        )
        has_procedure = (
            self.procedure_prescription is not None
            and len(self.procedure_prescription) > 0
        )
        has_lab = (
            self.lab_test_prescription is not None
            and len(self.lab_test_prescription) > 0
        )
        if has_lab or has_pharmacy or has_radiology or has_procedure:
            route_table = {
                "lab": {"service_unit": "Laboratory - GCH", "to_send": has_lab},
                "pharmacy": {
                    "service_unit": queue_service_unit,
                    "to_send": has_pharmacy,
                },
                "radiology": {
                    "service_unit": "Radiology - GCH",
                    "to_send": has_radiology,
                },
                "procedure": {
                    "service_unit": "Procedure - GCH",
                    "to_send": has_procedure,
                },
            }
            print(route_table)

            for key, value in route_table.items():
                if value.get("to_send") == True:
                    self.handle_multiple_queues(
                        patient=patient, service_unit=value.get("service_unit")
                    )
            ...

        patient_in_queue = frappe.db.exists(
            {"doctype": "Queue", "patient": patient, "queue_group": queue_group}
        )
        if patient_in_queue:
            try:
                queue_doc = frappe.get_doc("Queue", patient_in_queue[0][0], queue_group=queue_group)
                frappe.db.set_value(
                    "Queue",
                    patient_in_queue[0][0],
                    {
                        "queue_group": queue_group,
                        "priority": self.priority,
                        "phone": self.phone_number,
                        "patient_encounter": self.name,
                        "is_in":0
                    },
                    update_modified=True
                )
            except Exception as error:
                frappe.log_error(error, "ERROR UPDATING TO QUEUE")
        if not patient_in_queue:
            try:
                queue_record = {
                    "doctype": "Queue",
                    "patient": patient,
                    "queue_group": queue_group,
                    "priority": self.priority,
                    "phone": self.phone_number,
                    "patient_encounter": self.name,
                    "is_in":0
                }
                queue_doc = frappe.get_doc(queue_record)
                queue_doc.insert()
            except Exception as error:
                frappe.log_error(error, "ERROR ADDING TO QUEUE")
        super().validate()

    def after_insert(self):
        print("INSERTED")
        # print(self.__dict__)
        from gch_custom.tasks.main import gch_tasks
        
        resp = gch_tasks.enqueue_send_encounter_to_labware(doc=self, event="after_save")
        print(resp)
        # from gch_middleware.utils.hl7.labware.service import gch_labware_service

        # encounter_time = (
        #     str(self.creation)
        #     .split(".")[0]
        #     .replace("-", "")
        #     .replace(":", "")
        #     .replace(" ", "")
        # )
        # patient: Patient = frappe.get_doc("Patient", {"name": self.patient})
        # creator = frappe.get_doc("User", {"name": self.owner})
        # actor = None
        # try:
        #     actor = frappe.session.user
        # except:
        #     pass
        # if not actor or actor == "Guest":
        #     actor = creator

        # healthcare_practs = frappe.qb.DocType("Healthcare Practitioner")
        # healthcare_pract = (
        #     frappe.qb.from_(healthcare_practs)
        #     .select("*")
        #     .where(healthcare_practs.user_id == actor)
        #     .run(as_dict=True)
        # )
        # user_ = [{"name": None}]
        # if not healthcare_pract:
        #     users = frappe.qb.DocType("User")
        #     user_ = (
        #         frappe.qb.from_(users)
        #         .select("*")
        #         .where(users.name == actor)
        #         .run(as_dict=True)
        #     )

        # station_entry_exists = (
        #     frappe.db.exists(
        #         {
        #             "doctype": "Practitioner Station Entry",
        #             "healthcare_practitioner": healthcare_pract[0].get("name"),
        #         }
        #     )
        #     if healthcare_pract
        #     else frappe.db.exists(
        #         {
        #             "doctype": "Practitioner Station Entry",
        #             "user": user_[0].get("name"),
        #         }
        #     )
        # )
        # station_entry = None
        # if station_entry_exists is not None and len(station_entry_exists) > 0:
        #     station_entry = (
        #         frappe.get_doc(
        #             "Practitioner Station Entry",
        #             {"healthcare_practitioner": healthcare_pract[0].get("name")},
        #         )
        #         if healthcare_pract
        #         else frappe.get_doc(
        #             "Practitioner Station Entry",
        #             {"user": user_[0].get("name")},
        #         )
        #     )
        # BRANCH = frappe.qb.DocType("Branch")
        # branches = frappe.qb.from_(BRANCH).select("*").run(as_dict=True)
        # branch = station_entry.branch if station_entry else branches[0].name
        # self.branch = branch
        # self.save(ignore_permissions=True)

        # branch_ = frappe.get_doc("Branch", {"name": self.branch})
        # try:
        #     response = gch_labware_service.register_patient(
        #         message_id=self.name,
        #         uhid=self.patient_uhid,
        #         first_name=patient.first_name,
        #         middle_name=patient.middle_name
        #         if patient.middle_name != "" or patient.middle_name != None
        #         else patient.last_name[0],
        #         last_name=patient.last_name,
        #         dob=patient.dob.strftime("%Y-%m-%d").replace("-", ""),
        #         gender=patient.sex[0],
        #         address=patient.town,
        #         country_code="001234567",
        #         phone_number=self.phone_number,
        #         multiple_birth_indicator="N",
        #         country_name="Kenya",
        #         patient_class="O",
        #         admission_type="C",q
        #         hospital_service="M",
        #         encounter_number=self.name,
        #         admission_time=encounter_time,
        #         reason_for_admission="0101",
        #         expected_discharge_time=encounter_time,
        #         email_address=f"{patient.first_name}{patient.last_name}@gmail.com",
        #         sending_facility=branch_.branch_code,
        #     )
        #     # frappe.log_error(e, response)
        # except Exception as e:
        #     frappe.log_error(
        #         e, f"Error in registering patient in labware service: {str(e)}"
        #     )
        #     ...

    def before_save(self):
        self.set("kranium_physican_exams_table", [])

    # def on_update(self):
    #     print(self.head_circumference_in_centimeters)

    def after_save(self):
        print("RUNNING AFTER SAVE")
        from gch_custom.services import update_encounter
        update_encounter(
            data={},
            users=[],
            encounter=self.name,
            modified_by=self.modified_by,
            notify_all=True
        )

    def on_change(self):
        from gch_custom.services import update_encounter
        update_encounter(
            data={},
            users=[],
            encounter=self.name,
            modified_by=self.modified_by
        )
