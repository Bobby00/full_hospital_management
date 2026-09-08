class BKNode:
    def __init__(self, term):
        self.term = term
        self.children = {}
    
    def add_child(self, term, child_node):
        distance = self.levenshtein_distance(self.term, term)
        if distance in self.children:
            self.children[distance].add_child(term, child_node)
        else:
            self.children[distance] = child_node
    
    def levenshtein_distance(self, s1, s2):
        len_s1 = len(s1)
        len_s2 = len(s2)
        matrix = [[0] * (len_s2 + 1) for _ in range(len_s1 + 1)]

        for i in range(len_s1 + 1):
            matrix[i][0] = i

        for j in range(len_s2 + 1):
            matrix[0][j] = j

        for i in range(1, len_s1 + 1):
            for j in range(1, len_s2 + 1):
                cost = 0 if s1[i - 1] == s2[j - 1] else 1
                matrix[i][j] = min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                )

        return matrix[len_s1][len_s2]


class BKTree:
    def __init__(self):
        self.root = None
    
    def add(self, term):
        if not self.root:
            self.root = BKNode(term)
        else:
            self._add_to_node(self.root, term)
    
    def _add_to_node(self, node, term):
        node.add_child(term, BKNode(term))
    
    def fuzzy_search(self, term, max_distance):
        if not self.root:
            return []

        result = []
        self._fuzzy_search_node(self.root, term, max_distance, result)
        return result
    
    def _fuzzy_search_node(self, node, term, max_distance, result):
        distance = node.levenshtein_distance(node.term, term)
        if distance <= max_distance:
            result.append((node.term, distance))

        min_dist = distance - max_distance
        max_dist = distance + max_distance

        for d in range(min_dist, max_dist + 1):
            if d in node.children:
                self._fuzzy_search_node(node.children[d], term, max_distance, result)
