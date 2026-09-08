from .pacs import PacsController

create_patient = PacsController.create_or_update_patient
create_request = PacsController.create_service_request
test_apis = PacsController.test_apis