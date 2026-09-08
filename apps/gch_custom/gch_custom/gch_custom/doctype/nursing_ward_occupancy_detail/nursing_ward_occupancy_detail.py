# Copyright (c) 2021, Karani and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now
from frappe import _


class NursingWardOccupancyDetail(Document):
    def validate(self):
        """Checks for
        1. No start date
        2. If start date is in the future
        3. If end date is before start date
        """
        if not self.start_date:
            frappe.throw(_("Start Date is mandatory"))
        if self.start_date > now():
            frappe.throw(_("Start Date cannot be greater than today"))
        if self.end_date:
            if self.end_date < self.start_date:
                frappe.throw(_("End Date cannot be before Start Date"))

    def before_save(self):
        """Update occupied state of Nursing Ward Bed"""
        bed, cot = None, None
        bed_name = self.ward_bed
        cot_name = self.ward_cot
        if bed_name:
            bed = frappe.get_doc("Nursing Ward Bed", bed_name)
        if cot_name:
            cot = frappe.get_doc("Nursing Ward Cot", cot_name)
        patient = frappe.get_doc("Patient", self.patient)
        self.patient_gender = patient.sex
        consulting_doctor = frappe.get_doc(
            "Healthcare Practitioner", self.doctor_on_duty
        )
        self.consulting_doctor = consulting_doctor.practitioner_name
        # ward_room =bed.nursing_ward
        type_occupied = bed
        if bed:
            self.nursing_ward = bed.nursing_ward

            type_occupied = bed
        if cot:
            self.nursing_ward = cot.nursing_ward
            type_occupied = cot

        if self.end_date != None:
            if self.end_date < self.start_date:
                frappe.throw("End Date cannot be before Start Date")
            if self.end_date < now():
                type_occupied.is_occupied = 0
        if self.end_date == None:
            if self.start_date > now():
                type_occupied.is_occupied = 0
            else:
                type_occupied.is_occupied = 1
        else:
            type_occupied.is_occupied = 1
        self.ward_room = type_occupied.ward_room
        type_occupied.save()
