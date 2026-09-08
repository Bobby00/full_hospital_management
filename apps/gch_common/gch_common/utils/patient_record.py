import frappe
from fuzzywuzzy import fuzz

from typing import Union


def find_patient_record(patient_name: str, dob: str=None) -> Union[list, None]:
    """
    Simplified util to query the name + dob for a patient whose existence on DB is not known.
    """
    # TODO: Add Parent Phone Number
    # Split the given patient_name for flexible search
    name_parts = patient_name.split()
    if dob and dob != "":
        similar_names = frappe.db.sql("""
            SELECT p.name, p.dob, ppd.phone_number
            FROM `tabPatient` p
            LEFT JOIN (
                SELECT parent, phone_number
                FROM `tabPatient Parents Detail`
                WHERE is_primary = 1
            ) ppd ON ppd.parent = p.name
            WHERE p.dob = %(dob)s AND p.name LIKE %(name)s
        """, {
            "dob": dob,
            "name": f"%{name_parts[-1]}%"
        }, as_dict=True)
    else:
        similar_names = frappe.db.sql("""
            SELECT p.name, p.dob, ppd.phone_number
            FROM `tabPatient` p
            LEFT JOIN (
                SELECT parent, phone_number
                FROM `tabPatient Parents Detail`
                WHERE is_primary = 1
            ) ppd ON ppd.parent = p.name
            WHERE p.name LIKE %(name)s
        """, {
            "name": f"%{name_parts[-1]}%"
        }, as_dict=True)

   
    # # Initialize a list to store fuzzy matching scores and corresponding records
    scores = []
    
    # Iterate through the results
    for record in similar_names:
        # Calculate the similarity score for names
        name_similarity = fuzz.token_sort_ratio(patient_name.lower(), record.get("name").lower())
        print(name_similarity)
        print(record.get('dob'))
        # if all(part.lower() in record.get("name").lower() for part in name_parts) and record.get("dob") == dob:    # Let's omit dob here since it is factored in already in the DOB DB search above
        if all(part.lower() in record.get("name").lower() for part in name_parts):
            scores.append((record, max(name_similarity, 95)))  # Assign a minimum score of 95 for exact matches
    
    # Sort scores in descending order of similarity
    sorted_scores = sorted(scores, key=lambda x: x[1], reverse=True)
    
    # Extract sorted records
    sorted_records = [record for record, _ in sorted_scores]
    
    return sorted_records


# Attempt 2
# def find_patient_record(patient_name: str, dob: str=None) -> Union[list, None]:
#     name_parts = patient_name.split()
#     query_params = {"name": f"%{name_parts[-1]}%"}

#     # if dob and dob != "":
#     #     query = """
#     #         SELECT p.name, p.dob, ppd.phone_number
#     #         FROM `tabPatient` p
#     #         LEFT JOIN `tabPatient Parents Detail` ppd ON ppd.parent = p.name
#     #         WHERE p.dob = %(dob)s AND p.name LIKE %(name)s AND ppd.is_primary = 1
#     #     """
#     #     query_params["dob"] = dob
#     # else:
#     #     query = """
#     #         SELECT p.name, p.dob, ppd.phone_number
#     #         FROM `tabPatient` p
#     #         LEFT JOIN `tabPatient Parents Detail` ppd ON ppd.parent = p.name
#     #         WHERE p.name LIKE %(name)s AND ppd.is_primary = 1
#     #     """

#     similar_names = frappe.db.sql(query, query_params, as_dict=True)
    
#     scores = []
#     for record in similar_names:
#         name_similarity = fuzz.token_sort_ratio(patient_name.lower(), record.get("name").lower())
#         if all(part.lower() in record.get("name").lower() for part in name_parts):
#             scores.append((record, max(name_similarity, 95)))
    
#     sorted_scores = sorted(scores, key=lambda x: x[1], reverse=True)
#     sorted_records = [record for record, _ in sorted_scores]
    
#     return sorted_records