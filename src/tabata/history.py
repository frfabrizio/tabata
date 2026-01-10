from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, Optional


ISO_FORMAT = "%Y-%m-%dT%H:%M:%S"


@dataclass(frozen=True)
class SessionRecord:
    duration_minutes: int
    calories: int
    completed_at: datetime
    source_session: str

    def to_dict(self) -> dict:
        data = asdict(self)
        data["completed_at"] = self.completed_at.strftime(ISO_FORMAT)
        return data

    @classmethod
    def from_dict(cls, data: dict) -> "SessionRecord":
        return cls(
            duration_minutes=int(data["duration_minutes"]),
            calories=int(data["calories"]),
            completed_at=datetime.strptime(data["completed_at"], ISO_FORMAT),
            source_session=str(data["source_session"]),
        )


class HistoryStore:
    def __init__(self, path: Path) -> None:
        self._path = path

    def add_session(self, record: SessionRecord) -> None:
        sessions = list(self._load())
        sessions.append(record)
        sessions.sort(key=lambda item: item.completed_at)
        self._save(sessions)

    def list_sessions(
        self,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> list[SessionRecord]:
        sessions = self._load()
        if start:
            sessions = [item for item in sessions if item.completed_at >= start]
        if end:
            sessions = [item for item in sessions if item.completed_at <= end]
        return sorted(sessions, key=lambda item: item.completed_at, reverse=True)

    def _load(self) -> list[SessionRecord]:
        if not self._path.exists():
            return []
        data = json.loads(self._path.read_text(encoding="utf-8"))
        return [SessionRecord.from_dict(item) for item in data]

    def _save(self, sessions: Iterable[SessionRecord]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        payload = [item.to_dict() for item in sessions]
        self._path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
