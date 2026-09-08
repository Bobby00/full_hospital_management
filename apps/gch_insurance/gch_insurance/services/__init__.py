from gch_insurance.services.erp_smart import ErpSmartController
from .insurance_controller import InsuranceController

print("gch_insurance.services.__init__.py")


checkRequest = InsuranceController.checkRequest
# used to initiate insurance requests for LCT, MTIBA, SMART, SLADE
initiate_insurance = InsuranceController.initiate_insurance

# used to process insurance requests for LCT, MTIBA, SMART, SLADE
process_insurance = InsuranceController.process_insurance

get_smart_benefits_options = ErpSmartController.get_smart_benefits_options
