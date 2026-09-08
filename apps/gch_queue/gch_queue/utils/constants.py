# Queue Management Constants
from dataclasses import dataclass


@dataclass
class QueueConstants:
    EMERGENCY: int = 1
    PRIORITY: int = 2
    NORMAL: int = 3
