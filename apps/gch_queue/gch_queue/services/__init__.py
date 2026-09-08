from .rest import gch_queue

render_queue = gch_queue.render_queue
render_all_queues = gch_queue.render_all_queues
open_encounter = gch_queue.open_encounter
add = gch_queue.add_patient_to_queue
doctor_queue = gch_queue.check_doctor_queue
set_station = gch_queue.set_user_station
notify_queue = gch_queue.notify_queue
fetch_practitioner_name = gch_queue.fetch_practitioner_name