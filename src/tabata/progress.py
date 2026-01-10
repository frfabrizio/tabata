from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Iterable

from .history import SessionRecord


@dataclass(frozen=True)
class WeeklyProgress:
    week_start: datetime
    total_minutes: int
    total_calories: int
    sessions_completed: int


@dataclass(frozen=True)
class YearlyProgress:
    year: int
    total_minutes: int
    total_calories: int
    sessions_completed: int


def weekly_progress(sessions: Iterable[SessionRecord]) -> list[WeeklyProgress]:
    buckets: dict[datetime, list[SessionRecord]] = {}
    for session in sessions:
        week_start = _week_start(session.completed_at)
        buckets.setdefault(week_start, []).append(session)
    return [
        WeeklyProgress(
            week_start=week_start,
            total_minutes=sum(item.duration_minutes for item in items),
            total_calories=sum(item.calories for item in items),
            sessions_completed=len(items),
        )
        for week_start, items in sorted(buckets.items())
    ]


def yearly_progress(sessions: Iterable[SessionRecord]) -> list[YearlyProgress]:
    buckets: dict[int, list[SessionRecord]] = {}
    for session in sessions:
        buckets.setdefault(session.completed_at.year, []).append(session)
    return [
        YearlyProgress(
            year=year,
            total_minutes=sum(item.duration_minutes for item in items),
            total_calories=sum(item.calories for item in items),
            sessions_completed=len(items),
        )
        for year, items in sorted(buckets.items())
    ]


def total_minutes(sessions: Iterable[SessionRecord]) -> int:
    return sum(item.duration_minutes for item in sessions)


def total_calories(sessions: Iterable[SessionRecord]) -> int:
    return sum(item.calories for item in sessions)


def weekly_frequency(sessions: Iterable[SessionRecord]) -> dict[datetime, int]:
    frequency: dict[datetime, int] = {}
    for session in sessions:
        week_start = _week_start(session.completed_at)
        frequency[week_start] = frequency.get(week_start, 0) + 1
    return dict(sorted(frequency.items()))


def _week_start(timestamp: datetime) -> datetime:
    monday = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
    return monday.replace(day=monday.day - monday.weekday())
