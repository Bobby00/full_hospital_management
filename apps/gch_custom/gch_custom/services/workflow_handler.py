from dataclasses import dataclass
from multiprocessing.pool import CLOSE
from time import clock_settime_ns


@dataclass
class WFStates:
    PENDING_TRIAGE: str = "Pending Triage"
    PENDING_RECEPTION: str = "Pending Reception"
    PENDING_VACCINATION_PAYMENT: str = "Pending Vaccination Payment"
    PENDING_VACCINATION: str = "Pending Vaccination"
    PENDING_REVIEW: str = "Pending Review"
    PENDING_REGISTRATION: str = "Pending Registration"
    PENDING_RADIOLOGY_PAYMENT: str = "Pending Radiology Payment"
    PENDING_RADIOLOGY: str = "Pending Radiology"
    PENDING_PROCEDURE_PAYMENT: str = "Pending Procedure Payment"
    PENDING_PROCEDURE: str = "Pending Procedure"
    PENDING_PRESCRIPTION_PAYMENT: str = "Pending Prescription Payment"
    PENDING_PHARMACY: str = "Pending Pharmacy"
    PENDING_LAB: str = "Pending LAB/Investigation"
    PENDING_LAB_PAYMENT: str = "Pending Lab Payment"
    PENDING_DOCTOR: str = "Pending Doctor"
    PENDING_DISPENSE: str = "Pending Dispense"
    PENDING_DISCHARGE: str = "Pending Discharge"
    PENDING_CHECKOUT: str = "Pending Checkout"
    ENCOUNTER_CLOSED: str = "Encounter Closed"
    PAID: str = "Paid"
    DISPENSED: str = "Dispensed"
    VACCINATED: str = "Vaccinated"
    DISCHARGED: str = "Discharged"
    CLOSE_ENCOUNTER: str = "Close Encounter"
    PENDING_INVOICE_CLOSING: str = "Pending Invoice Closing"
    PENDING_HRP: str = "Pending HRP"
    PENDING_ENDOCRINOLOGY:str = "Pending Endocrinology"
    PENDING_DERMATOLOGY: str = "Pending Dermatology"
    PENDING_ENT:str = "Pending ENT"
    PENDING_GASTROENTEROLOGY: str = "Pending Gastroenterology"
    PENDING_NUTRITION: str = "Pending Nutrition"
    PENDING_SPEECH_THERAPY: str = "Pending Speech Therapy"
    PENDING_HEMATOLOGY: str = "Pending Hematology"
    PENDING_CDC: str = "Pending CDC"
    PENDING_ECHO: str = "Pending Echo"
    PENDING_PEDIATRIC_REVIEW: str = "Pending Pediatric Review"
    PENDING_OCCUPATIONAL_THERAPY: str = "Pending Occupational Therapy"
    PENDING_STAFF_CLINIC: str = "Pending Staff Clinic"
    PENDING_CARDIOLOGY: str = "Pending Cardiology"
    PENDING_NEUROLOGY:str = "Pending Neurology"
    PENDING_OPHTHAMOLOGY_CLINIC: str = "Pending Ophthalmology  Clinic"
    PENDING_PHARMACY_RETURNS:str = "Pending Pharmacy (Returns)"
    PENDING_BILLING: str = "Pending Billing"



@dataclass
class WFActions:
    PROCEED_TO_RECEPTION: str = "Proceed to Reception"
    PULL_TO_RECEPTION: str = "Pull to Reception"
    PROCEED_TO_DOCTOR: str = "Proceed to Doctor"
    PROCEED_TO_LAB: str = "Proceed to Lab"
    PROCEED_TO_PHARMACY: str = "Proceed to Pharmacy"
    PROCEED_TO_PROCEDURE: str = "Proceed to Procedure"
    PROCEED_TO_CHECKOUT: str = "Proceed to Checkout"
    CLOSE_ENCOUNTER: str = "Close Encounter"
    PROCEED_TO_VACCINATION: str = "Proceed to Vaccination"
    PROCEED_TO_TRIAGE: str = "Proceed to Triage"
    PROCEED_TO_RADIOLOGY: str = "Proceed to Radiology"
    PROCEED_TO_DISCHARGE: str = "Proceed to Discharge"
    PROCEED_TO_PAYMENT: str = "Proceed to Payment"
    BROWN_BAG: str = "Brown Bag"
    DISPENSE_VACCINATIONS: str = "Dispense Vaccinations"
    DISCHARGE_PATIENT: str = "Discharge Patient"
    PROCEED_TO_RECEPTION_INVOICE_CLOSING: str = "Proceed to Reception (Invoice Closing)"
    BILL_LAB: str = "Bill Lab"
    BILL_PROCEDURE: str = "Bill Procedure"
    BILL_RADIOLOGY: str = "Bill Radiology"
    COMPLETE: str = "Complete"
    PROCEED_TO_BILLING: str = 'Proceed to Billing'


class WorkflowHandler:
    def __init__(self) -> None:
        pass

    def get_next_workflow_state(self, workflow_state: str, action: str, mode_of_payment: str) -> str:

        # initial billing process
        if workflow_state == WFStates.PENDING_TRIAGE and action == WFActions.PROCEED_TO_BILLING:
            return WFStates.PENDING_BILLING
        
        if workflow_state == WFStates.PENDING_BILLING and action == WFActions.PROCEED_TO_RECEPTION:
            return WFStates.PENDING_RECEPTION
        
        if workflow_state == WFStates.PENDING_BILLING and action == WFActions.PULL_TO_RECEPTION:
            return WFStates.PENDING_RECEPTION
        
        # End of billing workflow

        if workflow_state == WFStates.PENDING_TRIAGE and action == WFActions.PROCEED_TO_RECEPTION:
            return WFStates.PENDING_RECEPTION
        
        if workflow_state == WFStates.PENDING_TRIAGE and action == WFActions.PULL_TO_RECEPTION:
            return WFStates.PENDING_RECEPTION

        #  check if the action is to proceed to doctor

        if workflow_state == WFStates.PENDING_RECEPTION and action == WFActions.PROCEED_TO_DOCTOR:
            return WFStates.PENDING_DOCTOR

        # check if the action is to proceed to procedure

        if workflow_state == WFStates.PENDING_RECEPTION and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE_PAYMENT
        
        if workflow_state == WFStates.PENDING_RECEPTION and action == WFActions.BILL_PROCEDURE:
            return WFStates.PENDING_PROCEDURE_PAYMENT
        
        # note to self confirm this flow
        if workflow_state == WFStates.PENDING_DOCTOR and action == WFActions.PROCEED_TO_PROCEDURE and mode_of_payment == "Cash":
            return WFStates.PENDING_PROCEDURE_PAYMENT

        # check if procedure payment is done
        if workflow_state == WFStates.PENDING_PROCEDURE_PAYMENT and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        
        # Proceed insurance patients to procedure without billing at this stage
        if workflow_state == WFStates.PENDING_DOCTOR and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_LAB and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_RADIOLOGY and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_VACCINATION and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_HRP and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_ENDOCRINOLOGY and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_DERMATOLOGY and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_ENT and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_GASTROENTEROLOGY and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_NUTRITION and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_SPEECH_THERAPY and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_HEMATOLOGY and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_CDC and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_ECHO and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_PEDIATRIC_REVIEW and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_OCCUPATIONAL_THERAPY and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_STAFF_CLINIC and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_CARDIOLOGY and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_NEUROLOGY and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE
        if workflow_state == WFStates.PENDING_OPHTHAMOLOGY_CLINIC and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE


        #  check if the action is to proceed to lab
        # if workflow_state == WFStates.PENDING_RECEPTION and action == WFActions.PROCEED_TO_LAB:
        #     return WFStates.PENDING_LAB_PAYMENT

        if workflow_state == WFStates.PENDING_RECEPTION and action == WFActions.BILL_LAB:
            return WFStates.PENDING_LAB_PAYMENT

        if workflow_state == WFStates.PENDING_DOCTOR and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_HRP and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_ENDOCRINOLOGY and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_DERMATOLOGY and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_ENT and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_GASTROENTEROLOGY and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_NUTRITION and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_SPEECH_THERAPY and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_HEMATOLOGY and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_CDC and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_ECHO and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_PEDIATRIC_REVIEW and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_OCCUPATIONAL_THERAPY and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_STAFF_CLINIC and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_CARDIOLOGY and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_NEUROLOGY and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        if workflow_state == WFStates.PENDING_OPHTHAMOLOGY_CLINIC and action == WFActions.PROCEED_TO_LAB and mode_of_payment == "Cash":
            return WFStates.PENDING_LAB_PAYMENT
        

        #  check if the lab payment is done
        if workflow_state == WFStates.PENDING_LAB_PAYMENT and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB

        # Proceed insurance patients to lab without billing at this stage
        if workflow_state == WFStates.PENDING_DOCTOR and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_RADIOLOGY and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_VACCINATION and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_HRP and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_ENDOCRINOLOGY and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_DERMATOLOGY and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_ENT and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_GASTROENTEROLOGY and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_NUTRITION and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_SPEECH_THERAPY and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_HEMATOLOGY and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_CDC and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_ECHO and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_PEDIATRIC_REVIEW and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_OCCUPATIONAL_THERAPY and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_STAFF_CLINIC and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_CARDIOLOGY and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_NEUROLOGY and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_OPHTHAMOLOGY_CLINIC and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_PROCEDURE and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_RADIOLOGY and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_VACCINATION and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB

        # check if the action is to proceed to Radiology

        # if workflow_state == WFStates.PENDING_RECEPTION and action == WFActions.PROCEED_TO_RADIOLOGY:
        #     return WFStates.PENDING_RADIOLOGY_PAYMENT

        if workflow_state == WFStates.PENDING_RECEPTION and action == WFActions.BILL_RADIOLOGY:
            return WFStates.PENDING_RADIOLOGY_PAYMENT

        if workflow_state == WFStates.PENDING_DOCTOR and action == WFActions.PROCEED_TO_RADIOLOGY and mode_of_payment == "Cash":
            return WFStates.PENDING_RADIOLOGY_PAYMENT

        # check if the Radiology payment is done
        if workflow_state == WFStates.PENDING_RADIOLOGY_PAYMENT and action == WFActions.PROCEED_TO_RADIOLOGY:
            return WFStates.PENDING_RADIOLOGY

        # Proceed insurance patients to radiology without billing at this stage
        if workflow_state == WFStates.PENDING_DOCTOR and action == WFActions.PROCEED_TO_RADIOLOGY:
            return WFStates.PENDING_RADIOLOGY
        if workflow_state == WFStates.PENDING_PROCEDURE and action == WFActions.PROCEED_TO_RADIOLOGY:
            return WFStates.PENDING_RADIOLOGY
        if workflow_state == WFStates.PENDING_LAB and action == WFActions.PROCEED_TO_RADIOLOGY:
            return WFStates.PENDING_RADIOLOGY
        if workflow_state == WFStates.PENDING_VACCINATION and action == WFActions.PROCEED_TO_RADIOLOGY:
            return WFStates.PENDING_RADIOLOGY

        # check if the action is to proceed to vaccination
        if workflow_state == WFStates.PENDING_RECEPTION and action == WFActions.PROCEED_TO_VACCINATION:
            return WFStates.PENDING_VACCINATION_PAYMENT

        if workflow_state == WFStates.PENDING_DOCTOR and action == WFActions.PROCEED_TO_VACCINATION:
            return WFStates.PENDING_VACCINATION_PAYMENT

        # check if the action is to proceed to Pharmacy
        # if workflow_state == WFStates.PENDING_RECEPTION and action == WFActions.PROCEED_TO_PHARMACY:
        #     return WFStates.PENDING_PRESCRIPTION_PAYMENT

        if workflow_state == WFStates.PENDING_PHARMACY and action == WFActions.PROCEED_TO_PAYMENT:
            return WFStates.PENDING_PRESCRIPTION_PAYMENT
        if workflow_state == WFStates.PENDING_PHARMACY and action == WFActions.PROCEED_TO_LAB:
            return WFStates.PENDING_LAB
        if workflow_state == WFStates.PENDING_PHARMACY and action == WFActions.PROCEED_TO_PROCEDURE:
            return WFStates.PENDING_PROCEDURE

        # Next action to dispense medication and reduce stock
        if workflow_state == WFStates.PENDING_PRESCRIPTION_PAYMENT and WFActions == WFActions.PROCEED_TO_PHARMACY:
            return WFStates.PAID
        if workflow_state == WFStates.PENDING_INVOICE_CLOSING and WFActions == WFActions.PROCEED_TO_PHARMACY:
            return WFStates.PAID
        
        if workflow_state == WFStates.PAID and action == WFActions.BROWN_BAG:
            return WFStates.DISPENSED

        # check if the action is to proceed to Checkout

        if workflow_state == WFStates.PENDING_LAB and action == WFActions.PROCEED_TO_DOCTOR:
            return WFStates.PENDING_DOCTOR

        # if workflow_state == WFStates.PENDING_DOCTOR and action == WFActions.PROCEED_TO_PHARMACY:
        #     return WFStates.PENDING_PHARMACY

        if workflow_state == WFStates.PENDING_VACCINATION and action == WFActions.DISPENSE_VACCINATIONS:
            return WFStates.VACCINATED

        # if workflow_state == WFStates.PENDING_RECEPTION and action == WFActions.PROCEED_TO_PROCEDURE:
        #     return WFStates.PENDING_PROCEDURE

        if workflow_state == WFStates.PENDING_DOCTOR and action == WFActions.PROCEED_TO_CHECKOUT:
            return WFStates.PENDING_CHECKOUT

        # Check if action is proceed to invoice closing

        if workflow_state == WFStates.PENDING_DOCTOR and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_PHARMACY and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_LAB and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_PROCEDURE and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_RADIOLOGY and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_VACCINATION and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_HRP and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_ENDOCRINOLOGY and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_DERMATOLOGY and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_ENT and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_GASTROENTEROLOGY and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_NUTRITION and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_SPEECH_THERAPY and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_HEMATOLOGY and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_CDC and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_ECHO and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_PEDIATRIC_REVIEW and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_OCCUPATIONAL_THERAPY and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_STAFF_CLINIC and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_CARDIOLOGY and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_NEUROLOGY and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_OPHTHAMOLOGY_CLINIC and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        if workflow_state == WFStates.PENDING_PROCEDURE and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING

        
        #  Pharmacy returns
        if workflow_state == WFStates.PENDING_PHARMACY_RETURNS and action == WFActions.PROCEED_TO_RECEPTION_INVOICE_CLOSING:
            return WFStates.PENDING_INVOICE_CLOSING
        
        # Handle complete button.
        if workflow_state == WFStates.PENDING_DOCTOR and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_HRP and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_ENDOCRINOLOGY and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_DERMATOLOGY and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_ENT and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_GASTROENTEROLOGY and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_NUTRITION and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_SPEECH_THERAPY and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_HEMATOLOGY and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_CDC and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_ECHO and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_PEDIATRIC_REVIEW and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_OCCUPATIONAL_THERAPY and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_STAFF_CLINIC and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_CARDIOLOGY and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_NEUROLOGY and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        if workflow_state == WFStates.PENDING_OPHTHAMOLOGY_CLINIC and action == WFActions.COMPLETE:
            return WFStates.PENDING_RECEPTION
        
    

        


wf_handler = WorkflowHandler()
