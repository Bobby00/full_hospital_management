# import pymysql.cursors
# from collections import defaultdict
# from fuzzywuzzy import fuzz

# import frappe

# class BKTree:
#     def __init__(self):
#         self.tree = None

#     def distance(self, a, b):
#         return fuzz.token_sort_ratio(a, b)

#     def add(self, node, parent=None):
#         if parent is None:
#             self.tree = {node: {}}
#             return

#         distance = self.distance(node, parent)

#         if distance in self.tree[parent]:
#             self.add(node, self.tree[parent][distance])
#         else:
#             self.tree[parent][distance] = {node: {}}

#     def build(self, items):
#         if not items:
#             return

#         self.tree = {items[0]: {}}

#         for item in items[1:]:
#             self.add(item)

#     def query(self, item, threshold):
#         if not self.tree:
#             return []

#         results = defaultdict(list)

#         def search(node, current_threshold):
#             distance = self.distance(node, item)
#             if distance <= current_threshold:
#                 results[distance].append(node)

#             for d in range(distance - current_threshold, distance + current_threshold + 1):
#                 if d in self.tree[node]:
#                     search(self.tree[node][d], current_threshold)

#         search(list(self.tree.keys())[0], threshold)

#         return [result for distance, nodes in results.items() for result in nodes]

# def fetch_patient_names_from_database():
#     # Connect to the database
#     connection = pymysql.connect(
#         host='',
#         user='',
#         password='',
#         database='',
#         cursorclass=pymysql.cursors.DictCursor
#     )

#     try:
#         with connection.cursor() as cursor:
#             # Fetch patient names from the database
#             cursor.execute("SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM tabPatient")
#             result = cursor.fetchall()
#             return [record['full_name'] for record in result]
#     finally:
#         connection.close()

# if __name__ == "__main__":
#     # Fetch patient names from the database
#     patient_names = fetch_patient_names_from_database()

#     # Initialize BK-tree
#     bk_tree = BKTree()
#     bk_tree.build(patient_names)

#     # Example search
#     entered_patient_name = "Jonh Doo"
#     threshold = 70

#     similar_names = bk_tree.query(entered_patient_name, threshold)
#     print("Similar Names:", similar_names)


# from collections import defaultdict
# from fuzzywuzzy import fuzz

# class BK1Tree:
#     def __init__(self):
#         self.tree = None

#     def distance(self, node, query):
#         # Calculate similarity score based on First Name, Middle Name, Last Name, and DOB
#         name_similarity = fuzz.token_sort_ratio(node['first_name'] + node['middle_name'] + node['last_name'], query['name'])
#         dob_similarity = fuzz.ratio(node['date_of_birth'], query['dob'])

#         # Adjust weights or additional scoring logic based on your requirements
#         total_similarity = name_similarity + dob_similarity  # Add up the scores

#         return total_similarity  # Return the combined score

#     def add(self, node, parent=None):
#         if parent is None:
#             self.tree = {node: {}}
#             return

#         distance = self.distance(node, parent)

#         if distance in self.tree[parent]:
#             self.add(node, self.tree[parent][distance])
#         else:
#             self.tree[parent][distance] = {node: {}}

#     def build(self, items):
#         if not items:
#             return

#         self.tree = {items[0]: {}}

#         for item in items[1:]:
#             self.add(item)

#     def query(self, query, threshold):
#         if not self.tree:
#             return []

#         results = defaultdict(list)

#         def search(node, current_threshold):
#             distance = self.distance(node, query)
#             if distance >= current_threshold:
#                 results[distance].append(node)

#             for d in range(distance - current_threshold, distance + current_threshold + 1):
#                 if d in self.tree[node]:
#                     search(self.tree[node][d], current_threshold)

#         search(list(self.tree.keys())[0], threshold)

#         return [result for distance, nodes in results.items() for result in nodes]


from collections import defaultdict
from fuzzywuzzy import fuzz


# # Define the BKTree class
# class BK2Tree:
#     def __init__(self):
#         self.tree = None

#     def distance(self, node, query):
#         # Calculate similarity score based on First Name, Middle Name, Last Name, and DOB
#         name_similarity = fuzz.token_sort_ratio(
#             node["first_name"] + node["middle_name"] + node["last_name"], query[0:3]
#         )
#         dob_similarity = fuzz.ratio(node["date_of_birth"], query[:-1])

#       
#         total_similarity = name_similarity + dob_similarity  # Add up the scores

#         return total_similarity  # Return the combined score

#     def add(self, node, parent=None):
#         if parent is None:
#             self.tree = {node: {}}
#             return

#         distance = self.distance(node, parent)

#         if distance in self.tree[parent]:
#             self.add(node, self.tree[parent][distance])
#         else:
#             self.tree[parent][distance] = {node: {}}

#     def build(self, items):
#         if not items:
#             return

#         # Convert dictionary items into tuples
#         if isinstance(items[0], dict):
#             items = [tuple(item.values()) for item in items]

#         self.tree = {items[0]: {}}

#         for item in items[1:]:
#             self.add(item, list(self.tree.keys())[0])

#     # def build(self, items):
#     #     print(type(items))
#     #     if not items:
#     #         return
#     #     breakpoint()
#     #     self.tree = {items[0]: {}}

#     #     for item in items[1:]:
#     #         self.add(item, list(self.tree.keys())[0])

#     def query(self, query, threshold):
#         if not self.tree:
#             return []

#         results = defaultdict(list)

#         def search(node, current_threshold):
#             distance = self.distance(node, query)
#             if distance >= current_threshold:
#                 results[distance].append(node)

#             for d in range(
#                 distance - current_threshold, distance + current_threshold + 1
#             ):
#                 if d in self.tree[node]:
#                     search(list(self.tree[node][d].keys())[0], current_threshold)

#         search(list(self.tree.keys())[0], threshold)

#         return [result for distance, nodes in results.items() for result in nodes]


# class BKTree:
#     def __init__(self):
#         self.tree = None

#     def distance(self, node, query):
#         print(node, query)
#         name = "".join(node[:3])
#         query_name = "".join(query[:3])
#         dob_similarity = fuzz.ratio(node[-1], query[-1])
        
#         print(name, query_name)
#         name_similarity = fuzz.token_sort_ratio(
#             name, query_name
#         )  # Use integer indices 0, 1, 2
#         # print(name_similarity)
#         dob_similarity = fuzz.ratio(node[-1:], query[-1:])
#         # print(dob_similarity)
#         # Adjust weights or additional scoring logic based on your requirements
#         total_similarity = name_similarity + dob_similarity  # Add up the scores
#         # print(total_similarity)
#         return total_similarity  # Return the combined score

#     def add(self, node, parent=None):
#         if parent is None:
#             self.tree = {node: {}}
#             return

#         distance = self.distance(node, parent)

#         if distance in self.tree[parent]:
#             self.add(node, self.tree[parent][distance])
#         else:
#             self.tree[parent][distance] = {node: {}}

#     def build(self, items):
#         if not items:
#             return

#         if isinstance(items[0], dict):
#             items = [tuple(item.values()) for item in items]

#         self.tree = {items[0]: {}}

#         for item in items[1:]:
#             self.add(item, list(self.tree.keys())[0])

#     def query(self, query, threshold):
#         if not self.tree:
#             return []

#         results = defaultdict(list)

#         def search(node, current_threshold):
#             distance = self.distance(node, query)
#             if distance >= current_threshold:
#                 results[distance].append(node)

#             for d in range(
#                 distance - current_threshold, distance + current_threshold + 1
#             ):
#                 if d in self.tree[node]:
#                     search(
#                         list(self.tree[node][d].keys())[0], current_threshold
#                     )  # Extract the node

#         search(list(self.tree.keys())[0], threshold)

#         return [result for distance, nodes in results.items() for result in nodes]



class BKTree:
    def __init__(self):
        self.tree = None

    def distance(self, a, b):
        return fuzz.token_sort_ratio(a, b)

    def add(self, node, parent=None):
        if parent is None:
            self.tree = {node: {}}
            return

        distance = self.distance(node, parent)

        if distance in self.tree[parent]:
            self.add(node, self.tree[parent][distance])
        else:
            self.tree[parent][distance] = {node: {}}

    def build(self, items):
        if not items:
            return

        self.tree = {items[0]: {}}

        for item in items[1:]:
            self.add(item)

    def query(self, item, threshold):
        if not self.tree:
            return []

        results = defaultdict(list)

        def search(node, current_threshold):
            distance = self.distance(node, item)
            if distance <= current_threshold:
                results[distance].append(node)

            for d in range(distance - current_threshold, distance + current_threshold + 1):
                if d in self.tree[node]:
                    search(self.tree[node][d], current_threshold)

        search(list(self.tree.keys())[0], threshold)

        return [result for distance, nodes in results.items() for result in nodes]

if __name__ == "__main__":
    sample_patient_records = [
        {
            "first_name": "John",
            "middle_name": "",
            "last_name": "Doe",
            "date_of_birth": "1990-01-01",
        },
        {
            "first_name": "Jane",
            "middle_name": "Alice",
            "last_name": "Smith",
            "date_of_birth": "1985-05-20",
        },
        {
            "first_name": "Alice",
            "middle_name": "Mary",
            "last_name": "Johnson",
            "date_of_birth": "1978-09-12",
        },
        {
            "first_name": "Robert",
            "middle_name": "",
            "last_name": "Brown",
            "date_of_birth": "1992-03-25",
        },
        {
            "first_name": "Michael",
            "middle_name": "David",
            "last_name": "Davis",
            "date_of_birth": "1989-11-30",
        },
        {
            "first_name": "Sarah",
            "middle_name": "Jane",
            "last_name": "Anderson",
            "date_of_birth": "1994-07-15",
        },
        {
            "first_name": "Emily",
            "middle_name": "Grace",
            "last_name": "Wilson",
            "date_of_birth": "1980-12-05",
        },
        {
            "first_name": "David",
            "middle_name": "",
            "last_name": "Taylor",
            "date_of_birth": "1976-06-18",
        },
        {
            "first_name": "Olivia",
            "middle_name": "",
            "last_name": "Thomas",
            "date_of_birth": "1997-09-28",
        },
        {
            "first_name": "Ethan",
            "middle_name": "Michael",
            "last_name": "Robinson",
            "date_of_birth": "1991-04-08",
        },
    ]
    # Example query parameters
    query_params = {
        "name": ("Jonh", "", "Doo"),  # Replace with the query name as a tuple
        "dob": "1990-01-01",  # Replace with the query DOB
    }

    # Initialize BK-tree
    bk_tree = BKTree()
    bk_tree.build(sample_patient_records)

    
    threshold = 150 

    similar_records = bk_tree.query(query_params, threshold)
    print("Similar Records:", similar_records)

    # query_params = {
    #     "name": "Jonh Doo",
    #     "dob": "1990-01-01"
    # }

    # bk_tree = BKTree()
    # bk_tree.build(sample_patient_records)

    # threshold = 150

    # similar_records = bk_tree.query(query_params, threshold)
    # print("Similar Records:", similar_records)
