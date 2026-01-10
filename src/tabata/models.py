from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, List, Optional


@dataclass
class Exercise:
    id: Optional[int]
    name: str
    category: str
    calories_per_minute: float


@dataclass
class Interval:
    id: Optional[int]
    position: int
    duration_seconds: int
    exercise: Optional[Exercise] = None


@dataclass
class Block:
    id: Optional[int]
    name: str
    position: int
    intervals: List[Interval] = field(default_factory=list)

    def ordered_intervals(self) -> Iterable[Interval]:
        return sorted(self.intervals, key=lambda interval: interval.position)


@dataclass
class Session:
    id: Optional[int]
    name: str
    warmup_seconds: int
    recovery_seconds: int
    blocks: List[Block] = field(default_factory=list)

    def ordered_blocks(self) -> Iterable[Block]:
        return sorted(self.blocks, key=lambda block: block.position)
