from atexit import register
from .erp_insurance import get_intergrator_details
from gch_custom.services.erp_mobile import ScannerAppController
from .rest import api, register_emergency_patient
from .invoice import reopen_invoice

# create_procedure_test, get_encounter_lab_tests, get_encounter_prescription, get_encounter_vaccinations
from.rest import create_procedure_test
from .slade import slade
from .erp_mtiba import ErpMTibaController, submit_mtiba_invoice
from .erp_pdq import request_pdq_payment
from .erp_mpesa import mpesa_payment_processor, mpesa_payment_processor_callback, send_stk_push_request, check_mpesa_payment, mpesa_confirmed, mpesa_validated, register_urls, checkTransactionStatus, validation_url_handler, confirmation_url_handler, confirm_stk_request,allocate_amount_to_invoice
# from .erp_mpesa import (
#     send_stk_push_request,
#     check_mpesa_payment,
#     mpesa_confirmed,
#     mpesa_validated,
#     register_urls,
#     checkTransactionStatus,
#     validation_url_handler,
#     confirmation_url_handler,
# )

# from .erp_slade import submit_slade_invoice
from .erp_slade import ErpSladeController

from .erp_lct import ErpLctController

from .workflow_controller import WorkflowController
from .erp_smart import ErpSmartController

from .prescription_controller import PrescriptionController
from .stock_level_controller import StockLevelController
from .erp_kranium_services import KraniumServicesController
update_encounter = api.update_encounter
ldap_login = api.ldap_login
generate_otp = api.generate_otp
get_parent_details = api.get_parent_details
query_uhid = api.query_patient_by_uhid
query_children = api.query_children
query_encounter_diagnoses = api.get_encounter_diagnoses
query_guidelines = api.get_treatment_guidelines
request_mpesa = api.request_mpesa
check_mpesa = api.check_mpesa
mp_callback = api.mp_callback
mp_process = api.mp_process
request_pdq = api.request_pdq
draft_prescriptions = api.get_prescriptions
nurse_wards = api.list_nurse_wards
occupancy = api.get_ward_occupancy
process_mtiba = submit_mtiba_invoice
process_pdq = request_pdq_payment
clean_patient_data = api.clean_patient_data
send_adt = api.send_adt
send_labtest = api.send_labtest
update_save_kranium = api.update_save_from_kranium
list_nurse_wards = api.list_nurse_wards
assign_bed = api.assign_bed
transfer_patient = api.transfer_patient
list_ward_rooms = api.list_ward_rooms
list_beds = api.list_beds
# process_slade=submit_slade_invoice

# PATIENT
register_emergency_patient = register_emergency_patient


# MPESA PAYMENT
confirm_mpesa_payment = check_mpesa_payment
confirmed = mpesa_confirmed
validated = mpesa_validated
test_mpesa = checkTransactionStatus
register_urls = register_urls
valid_url = validation_url_handler
confirm_url = confirmation_url_handler
send_stk_request = send_stk_push_request
confirm_stk_request = confirm_stk_request
mpesa_payment_processor = mpesa_payment_processor
processor_callback = mpesa_payment_processor_callback

# Slade
slade_authorize = ErpSladeController.get_patient_auth
slade_claim_create = ErpSladeController.create_claim
slade_invoice_create = ErpSladeController.submit_slade_invoice
slade_upload_attachment = ErpSladeController.upload_invoice_attachment
slade_upload_invoice_attachment = ErpSladeController.upload_invoice_attachment
slade_upload_claim_attachment = ErpSladeController.upload_claim_attachment


# lct stuff
lct_member_details = ErpLctController.get_member_details
lct_claim_create = ErpLctController.create_claim
lct_claim_process = ErpLctController.process_claim
lct_membership_process = ErpLctController.lct_membership_callback

# Smart
test_smart = ErpSmartController.close_visit
smart_fetch_visits = ErpSmartController.fetch_visits
smart_merge_visits = ErpSmartController.merge_visit_to_session
smart_fetch_member_details = ErpSmartController.fetch_member_details
smart_invoice_create = ErpSmartController.upload_claim
smart_close_visit = ErpSmartController.close_visit

get_smart_benefits_options = ErpSmartController.get_smart_benefits_options


# MTIBA
mtiba_get_treatment_info = ErpMTibaController.get_treatment_info
mtiba_process_notification = ErpMTibaController.process_opened_treatment_notification
mtiba_reserve_item_bill = ErpMTibaController.reserve_item_bill
mtiba_payment_submit = ErpMTibaController.submit_payment
mtiba_reserve_bulk_items_bill = ErpMTibaController.reserve_bulk_items_bill


get_service_units = ScannerAppController.get_service_units
check_patient_appointments = ScannerAppController.check_patient_appointments

test_create_invoice = ErpSladeController.get_patient_auth

patient_encounter_workflow_controller = (
    WorkflowController.patient_encounter_workflow_controller
)
get_encounter_sales_invoice = WorkflowController.get_encounter_sales_invoice


# Prescription
create_prescription = PrescriptionController.create_new_prescription
get_prices = PrescriptionController.get_item_price
get_routes = PrescriptionController.get_item_routes
update_prescription = PrescriptionController.partial_update_prescription_table
get_item_based_on_generic = PrescriptionController.get_item_based_on_generic
get_batches = PrescriptionController.get_batches_linked_to_item
get_station_details = PrescriptionController.get_user_warehouse
set_total_cost = PrescriptionController.update_billed_quantity_total_price
get_stock_levels = PrescriptionController.get_stock_levels
reduce_stock = PrescriptionController.reduce_stock_dispensed
reduce_stock_from_invoice = PrescriptionController.reduce_stock_from_invoice
mark_dispensed_as_false = PrescriptionController.mark_prescription_dispense_as_false
get_item_batch = (
    PrescriptionController.check_if_item_has_batch_and_return_earliest_batch_in
)
prescription_return_details = PrescriptionController.prescription_return_details
change_vaccines_to_dispensed_after_save_on_encounter = PrescriptionController.change_vaccines_to_dispensed_after_save_on_encounter
get_item_generic = PrescriptionController.get_item_generic
set_drug_allergy_on_patient_record = PrescriptionController.set_drug_allergy_on_patient_record
set_food_allergy_on_patient_record = PrescriptionController.set_food_allergy_on_patient_record
set_other_allergy_on_patient_record = PrescriptionController.set_other_allergy_on_patient_record

# Stock Management
deduct_stock = StockLevelController.deduct_stock
test_invoice_items = StockLevelController.get_invoice_items
return_stock = StockLevelController.return_stock
test_presc = StockLevelController.test_rad_presc    


# Outsourced services
get_outsourced_services = StockLevelController.get_outsourced_services


# Procedures
get_encounter_procedures = rest.get_encounter_procedures


# wellbaby Audiology
check_audiology = rest.check_if_patient_had_audiology_done_and_analyse_results

# Kranium Data
get_kranium_physical_exams = KraniumServicesController.get_patient_history
get_kranium_medical_history = KraniumServicesController.get_medical_history
get_possible_patient_matches = KraniumServicesController.fetch_possible_matches


get_intergrator_details = get_intergrator_details
# get_sales_invoice_items = rest.get_sales_invoice_items


reopen_invoice = reopen_invoice

allocate_amount_to_invoice=allocate_amount_to_invoice