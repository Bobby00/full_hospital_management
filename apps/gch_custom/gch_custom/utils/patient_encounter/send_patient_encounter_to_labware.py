import frappe
logger = frappe.logger("hello", allow_site=True )
class SendEncounterLabware:
    @staticmethod
    def send_to_labware(doc, event=None):
        from gch_middleware.utils.hl7.labware.service import gch_labware_service

        encounter_time = (
            str(doc.creation)
            .split(".")[0]
            .replace("-", "")
            .replace(":", "")
            .replace(" ", "")
        )
        patient = frappe.get_doc("Patient", {"name": doc.patient})
        creator = frappe.get_doc("User", {"name": doc.owner})
        actor = None
        try:
            actor = frappe.session.user
        except:
            pass
        if not actor or actor == "Guest":
            actor = creator

        healthcare_practs = frappe.qb.DocType("Healthcare Practitioner")
        healthcare_pract = (
            frappe.qb.from_(healthcare_practs)
            .select("*")
            .where(healthcare_practs.user_id == actor)
            .run(as_dict=True)
        )
        user_ = [{"name": None}]
        if not healthcare_pract:
            users = frappe.qb.DocType("User")
            user_ = (
                frappe.qb.from_(users)
                .select("*")
                .where(users.name == actor)
                .run(as_dict=True)
            )

        station_entry_exists = (
            frappe.db.exists(
                {
                    "doctype": "Practitioner Station Entry",
                    "healthcare_practitioner": healthcare_pract[0].get("name"),
                }
            )
            if healthcare_pract
            else frappe.db.exists(
                {
                    "doctype": "Practitioner Station Entry",
                    "user": user_[0].get("name"),
                }
            )
        )
        station_entry = None
        if station_entry_exists is not None and len(station_entry_exists) > 0:
            station_entry = (
                frappe.get_doc(
                    "Practitioner Station Entry",
                    {"healthcare_practitioner": healthcare_pract[0].get("name")},
                )
                if healthcare_pract
                else frappe.get_doc(
                    "Practitioner Station Entry",
                    {"user": user_[0].get("name")},
                )
            )
        BRANCH = frappe.qb.DocType("Branch")
        branches = frappe.qb.from_(BRANCH).select("*").run(as_dict=True)
        branch = station_entry.branch if station_entry else branches[0].name
        frappe.db.set_value("Patient Encounter", doc.name, 'branch', branch, update_modified=False)
        frappe.db.commit()
        doc.reload()
        # doc.branch = branch
        # doc.save(ignore_permissions=True)
        # logger.info('saved....')
        
        branch_ = frappe.get_doc("Branch", {"name": doc.branch})
        try:
            response = gch_labware_service.register_patient(
                message_id=doc.name,
                uhid=doc.patient_uhid,
                first_name=patient.first_name,
                middle_name=patient.middle_name
                if patient.middle_name != "" or patient.middle_name != None
                else patient.last_name[0],
                last_name=patient.last_name,
                dob=patient.dob.strftime("%Y-%m-%d").replace("-", ""),
                gender=patient.sex[0],
                address=patient.town,
                country_code="001234567",
                phone_number=doc.phone_number,
                multiple_birth_indicator="N",
                country_name="Kenya",
                patient_class="O",
                admission_type="C",
                hospital_service="M",
                encounter_number=doc.name,
                admission_time=encounter_time,
                reason_for_admission="0101",
                expected_discharge_time=encounter_time,
                email_address=f"{patient.first_name}{patient.last_name}@gmail.com",
                sending_facility=branch_.branch_code,
            )
            # frappe.log_error(e, response)
            logger.info(response)
            frappe.publish_realtime(
                event="eval_js",
                message='frappe.show_alert("{0}")'.format("Sending Patient ADT to Labware"),
                user=frappe.session.user,
            )
        
        except Exception as e:
            frappe.publish_realtime(
                event="eval_js",
                message='frappe.show_alert("{0} - {1}")'.format("Error sending Patient ADT to Labware", str(e)),
                user=frappe.session.user,
            )
            logger.info(f"Error in registering patient in labware service: {str(e)}")
            frappe.log_error(
                e, f"Error in registering patient in labware service: {str(e)}"
            )  


send_encounter = SendEncounterLabware()
