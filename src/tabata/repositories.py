from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable, List, Optional

from tabata.models import Block, Exercise, Session


class ExerciseRepository(ABC):
    @abstractmethod
    def create(self, exercise: Exercise) -> Exercise:
        raise NotImplementedError

    @abstractmethod
    def get(self, exercise_id: int) -> Optional[Exercise]:
        raise NotImplementedError

    @abstractmethod
    def list(self) -> List[Exercise]:
        raise NotImplementedError

    @abstractmethod
    def list_by_category(self, category: str) -> List[Exercise]:
        raise NotImplementedError

    @abstractmethod
    def update(self, exercise: Exercise) -> Exercise:
        raise NotImplementedError

    @abstractmethod
    def delete(self, exercise_id: int) -> None:
        raise NotImplementedError


class BlockRepository(ABC):
    @abstractmethod
    def create(self, block: Block, session_id: int) -> Block:
        raise NotImplementedError

    @abstractmethod
    def get(self, block_id: int) -> Optional[Block]:
        raise NotImplementedError

    @abstractmethod
    def list_by_session(self, session_id: int) -> List[Block]:
        raise NotImplementedError

    @abstractmethod
    def get_with_intervals(self, block_id: int) -> Optional[Block]:
        raise NotImplementedError

    @abstractmethod
    def list_with_intervals(self, session_id: int) -> List[Block]:
        raise NotImplementedError

    @abstractmethod
    def update(self, block: Block) -> Block:
        raise NotImplementedError

    @abstractmethod
    def delete(self, block_id: int) -> None:
        raise NotImplementedError


class SessionRepository(ABC):
    @abstractmethod
    def create(self, session: Session) -> Session:
        raise NotImplementedError

    @abstractmethod
    def create_with_blocks(self, session: Session) -> Session:
        raise NotImplementedError

    @abstractmethod
    def get(self, session_id: int) -> Optional[Session]:
        raise NotImplementedError

    @abstractmethod
    def get_with_details(self, session_id: int) -> Optional[Session]:
        raise NotImplementedError

    @abstractmethod
    def list(self) -> List[Session]:
        raise NotImplementedError

    @abstractmethod
    def update(self, session: Session) -> Session:
        raise NotImplementedError

    @abstractmethod
    def update_with_blocks(self, session: Session) -> Session:
        raise NotImplementedError

    @abstractmethod
    def delete(self, session_id: int) -> None:
        raise NotImplementedError

    @abstractmethod
    def total_duration_seconds(self, session_id: int) -> int:
        raise NotImplementedError

    @abstractmethod
    def estimate_calories(self, session_id: int) -> float:
        raise NotImplementedError

    @abstractmethod
    def estimate_calories_for_history(self, session_ids: Iterable[int]) -> float:
        raise NotImplementedError
