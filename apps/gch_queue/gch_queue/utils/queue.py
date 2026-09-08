import heapq as hq
import itertools
from typing import Dict, List
from collections import OrderedDict

import frappe


class GCHPriorityQueue:
    """
    GCH Patient Priority Queue with fast member checking and variable tie
    breaking (LIFO or FIFO).
    """

    def __init__(self, policy: str = "FIFO") -> None:
        """Initialization

        Args:
            policy (str, optional): The Default Tie-breaking Algorithm. FIFO or LIFO. Defaults to "FIFO".
        """
        if policy == "LIFO":
            self.step = -1
        else:  # policy == 'FIFO'
            self.step = 1

        self.count_ = itertools.count()
        self.heap: List = []
        self.entries: Dict = {}
        self.ordered_entries: OrderedDict = OrderedDict()
        self.removed_key: str = "<REMOVED>"

    def push(self, priority: int, key: str, encounter_detail:Dict) -> None:
        """Adds Patient to Queue

        Args:
            priority (int): The Priority of the Patient - 1 for High, 2 for Normal
            key (str): The Patient Identifier
        """
        if key in self.entries:
            self.remove(key)
        cnt = next(self.count_) * self.step
        entry = [priority, cnt, key, encounter_detail]
        hq.heappush(self.heap, entry)
        self.entries[key] = entry
        hq.heapify(self.heap)
        hq.heapify(self.heap)
        for i in self.heap:
            self.ordered_entries = OrderedDict(
                sorted(self.entries.items(), key=lambda x: x[1][0])
            )

    def __contains__(self, key: str) -> bool:
        """Checks if a key is contained within the entries.

        Useful for checking if a patient

        Args:
            key ([type]): [description]

        Returns:
            bool: [description]
        """
        return self.entries.has_key(key)

    def __len__(self) -> int:
        """Returns the number of entries within the heap

        Returns:
            int: Number of entries
        """
        return len(self.entries)

    def clean(self) -> None:
        """
        Remove all heap entries marked for removal.
        """
        self.heap = [entry for entry in self.heap if entry[-1] != self.removed_key]

    def remove(self, key: str) -> None:
        """Remove Entry

        Args:
            key ([type]): The Patient Identifier
        """
        entry = self.entries.pop(key)
        entry[-1] = self.removed_key

    def pop(self) -> str:
        """Pop highest priority Identifier

        Returns:
            str: The highest priority item removed from the heap
        """
        priority, cnt, key = hq.heappop(self.heap)

        while key == self.removed_key:
            priority, cnt, key = hq.heappop(self.heap)

        del self.entries[key]
        return key
