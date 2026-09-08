from .rest import middleware_mixin 

get_patient = middleware_mixin.get_patient
receive_oru = middleware_mixin.receive_oru
fetch_registrations = middleware_mixin.fetch_registrations
search_patient_kranium = middleware_mixin.search_patient_kranium