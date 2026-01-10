from __future__ import annotations

import sqlite3
from typing import Iterable, List, Optional

from tabata.models import Block, Exercise, Interval, Session
from tabata.repositories import BlockRepository, ExerciseRepository, SessionRepository


class SqliteExerciseRepository(ExerciseRepository):
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection

    def create(self, exercise: Exercise) -> Exercise:
        cursor = self._connection.execute(
            """
            INSERT INTO exercises (name, category, calories_per_minute)
            VALUES (?, ?, ?)
            """,
            (exercise.name, exercise.category, exercise.calories_per_minute),
        )
        return Exercise(
            id=cursor.lastrowid,
            name=exercise.name,
            category=exercise.category,
            calories_per_minute=exercise.calories_per_minute,
        )

    def get(self, exercise_id: int) -> Optional[Exercise]:
        row = self._connection.execute(
            "SELECT id, name, category, calories_per_minute FROM exercises WHERE id = ?",
            (exercise_id,),
        ).fetchone()
        if row is None:
            return None
        return Exercise(id=row[0], name=row[1], category=row[2], calories_per_minute=row[3])

    def list(self) -> List[Exercise]:
        rows = self._connection.execute(
            "SELECT id, name, category, calories_per_minute FROM exercises ORDER BY name"
        ).fetchall()
        return [
            Exercise(id=row[0], name=row[1], category=row[2], calories_per_minute=row[3])
            for row in rows
        ]

    def list_by_category(self, category: str) -> List[Exercise]:
        rows = self._connection.execute(
            """
            SELECT id, name, category, calories_per_minute
            FROM exercises
            WHERE category = ?
            ORDER BY name
            """,
            (category,),
        ).fetchall()
        return [
            Exercise(id=row[0], name=row[1], category=row[2], calories_per_minute=row[3])
            for row in rows
        ]

    def update(self, exercise: Exercise) -> Exercise:
        if exercise.id is None:
            raise ValueError("Exercise id is required for update")
        self._connection.execute(
            """
            UPDATE exercises
            SET name = ?, category = ?, calories_per_minute = ?
            WHERE id = ?
            """,
            (exercise.name, exercise.category, exercise.calories_per_minute, exercise.id),
        )
        return exercise

    def delete(self, exercise_id: int) -> None:
        self._connection.execute("DELETE FROM exercises WHERE id = ?", (exercise_id,))


class SqliteBlockRepository(BlockRepository):
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection

    def create(self, block: Block, session_id: int) -> Block:
        cursor = self._connection.execute(
            """
            INSERT INTO blocks (session_id, name, position)
            VALUES (?, ?, ?)
            """,
            (session_id, block.name, block.position),
        )
        created = Block(id=cursor.lastrowid, name=block.name, position=block.position)
        created.intervals = []
        for interval in block.ordered_intervals():
            created_interval = self._create_interval(cursor.lastrowid, interval)
            created.intervals.append(created_interval)
        return created

    def get(self, block_id: int) -> Optional[Block]:
        row = self._connection.execute(
            "SELECT id, name, position FROM blocks WHERE id = ?",
            (block_id,),
        ).fetchone()
        if row is None:
            return None
        return Block(id=row[0], name=row[1], position=row[2])

    def list_by_session(self, session_id: int) -> List[Block]:
        rows = self._connection.execute(
            """
            SELECT id, name, position
            FROM blocks
            WHERE session_id = ?
            ORDER BY position
            """,
            (session_id,),
        ).fetchall()
        return [Block(id=row[0], name=row[1], position=row[2]) for row in rows]

    def get_with_intervals(self, block_id: int) -> Optional[Block]:
        row = self._connection.execute(
            "SELECT id, name, position FROM blocks WHERE id = ?",
            (block_id,),
        ).fetchone()
        if row is None:
            return None
        block = Block(id=row[0], name=row[1], position=row[2])
        block.intervals = self._list_intervals(block.id)
        return block

    def list_with_intervals(self, session_id: int) -> List[Block]:
        blocks = self.list_by_session(session_id)
        for block in blocks:
            block.intervals = self._list_intervals(block.id)
        return blocks

    def update(self, block: Block) -> Block:
        if block.id is None:
            raise ValueError("Block id is required for update")
        self._connection.execute(
            "UPDATE blocks SET name = ?, position = ? WHERE id = ?",
            (block.name, block.position, block.id),
        )
        return block

    def delete(self, block_id: int) -> None:
        self._connection.execute("DELETE FROM blocks WHERE id = ?", (block_id,))

    def _list_intervals(self, block_id: int) -> List[Interval]:
        rows = self._connection.execute(
            """
            SELECT intervals.id, intervals.position, intervals.duration_seconds,
                   exercises.id, exercises.name, exercises.category, exercises.calories_per_minute
            FROM intervals
            LEFT JOIN exercises ON intervals.exercise_id = exercises.id
            WHERE intervals.block_id = ?
            ORDER BY intervals.position
            """,
            (block_id,),
        ).fetchall()
        intervals: List[Interval] = []
        for row in rows:
            exercise = None
            if row[3] is not None:
                exercise = Exercise(
                    id=row[3],
                    name=row[4],
                    category=row[5],
                    calories_per_minute=row[6],
                )
            intervals.append(
                Interval(id=row[0], position=row[1], duration_seconds=row[2], exercise=exercise)
            )
        return intervals

    def _create_interval(self, block_id: int, interval: Interval) -> Interval:
        cursor = self._connection.execute(
            """
            INSERT INTO intervals (block_id, position, duration_seconds, exercise_id)
            VALUES (?, ?, ?, ?)
            """,
            (
                block_id,
                interval.position,
                interval.duration_seconds,
                interval.exercise.id if interval.exercise else None,
            ),
        )
        return Interval(
            id=cursor.lastrowid,
            position=interval.position,
            duration_seconds=interval.duration_seconds,
            exercise=interval.exercise,
        )


class SqliteSessionRepository(SessionRepository):
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection
        self._block_repo = SqliteBlockRepository(connection)

    def create(self, session: Session) -> Session:
        cursor = self._connection.execute(
            """
            INSERT INTO sessions (name, warmup_seconds, recovery_seconds)
            VALUES (?, ?, ?)
            """,
            (session.name, session.warmup_seconds, session.recovery_seconds),
        )
        return Session(
            id=cursor.lastrowid,
            name=session.name,
            warmup_seconds=session.warmup_seconds,
            recovery_seconds=session.recovery_seconds,
            blocks=[],
        )

    def create_with_blocks(self, session: Session) -> Session:
        with self._connection:
            created = self.create(session)
            created.blocks = []
            for block in session.ordered_blocks():
                created.blocks.append(self._block_repo.create(block, created.id))
            return created

    def get(self, session_id: int) -> Optional[Session]:
        row = self._connection.execute(
            "SELECT id, name, warmup_seconds, recovery_seconds FROM sessions WHERE id = ?",
            (session_id,),
        ).fetchone()
        if row is None:
            return None
        return Session(id=row[0], name=row[1], warmup_seconds=row[2], recovery_seconds=row[3])

    def get_with_details(self, session_id: int) -> Optional[Session]:
        session = self.get(session_id)
        if session is None:
            return None
        session.blocks = self._block_repo.list_with_intervals(session_id)
        return session

    def list(self) -> List[Session]:
        rows = self._connection.execute(
            """
            SELECT id, name, warmup_seconds, recovery_seconds
            FROM sessions
            ORDER BY id
            """
        ).fetchall()
        return [Session(id=row[0], name=row[1], warmup_seconds=row[2], recovery_seconds=row[3]) for row in rows]

    def update(self, session: Session) -> Session:
        if session.id is None:
            raise ValueError("Session id is required for update")
        self._connection.execute(
            """
            UPDATE sessions
            SET name = ?, warmup_seconds = ?, recovery_seconds = ?
            WHERE id = ?
            """,
            (session.name, session.warmup_seconds, session.recovery_seconds, session.id),
        )
        return session

    def update_with_blocks(self, session: Session) -> Session:
        if session.id is None:
            raise ValueError("Session id is required for update")
        with self._connection:
            self.update(session)
            self._connection.execute(
                "DELETE FROM blocks WHERE session_id = ?",
                (session.id,),
            )
            session.blocks = [
                self._block_repo.create(block, session.id) for block in session.ordered_blocks()
            ]
        return session

    def delete(self, session_id: int) -> None:
        self._connection.execute("DELETE FROM sessions WHERE id = ?", (session_id,))

    def total_duration_seconds(self, session_id: int) -> int:
        row = self._connection.execute(
            """
            SELECT
                sessions.warmup_seconds,
                sessions.recovery_seconds,
                COALESCE(SUM(intervals.duration_seconds), 0)
            FROM sessions
            LEFT JOIN blocks ON blocks.session_id = sessions.id
            LEFT JOIN intervals ON intervals.block_id = blocks.id
            WHERE sessions.id = ?
            GROUP BY sessions.id
            """,
            (session_id,),
        ).fetchone()
        if row is None:
            return 0
        return int(row[0]) + int(row[1]) + int(row[2])

    def estimate_calories(self, session_id: int) -> float:
        row = self._connection.execute(
            """
            SELECT COALESCE(SUM(intervals.duration_seconds * exercises.calories_per_minute / 60.0), 0)
            FROM sessions
            LEFT JOIN blocks ON blocks.session_id = sessions.id
            LEFT JOIN intervals ON intervals.block_id = blocks.id
            LEFT JOIN exercises ON intervals.exercise_id = exercises.id
            WHERE sessions.id = ?
            """,
            (session_id,),
        ).fetchone()
        if row is None:
            return 0.0
        return float(row[0])

    def estimate_calories_for_history(self, session_ids: Iterable[int]) -> float:
        ids = list(session_ids)
        if not ids:
            return 0.0
        placeholders = ", ".join("?" for _ in ids)
        row = self._connection.execute(
            f"""
            SELECT COALESCE(SUM(intervals.duration_seconds * exercises.calories_per_minute / 60.0), 0)
            FROM sessions
            LEFT JOIN blocks ON blocks.session_id = sessions.id
            LEFT JOIN intervals ON intervals.block_id = blocks.id
            LEFT JOIN exercises ON intervals.exercise_id = exercises.id
            WHERE sessions.id IN ({placeholders})
            """,
            ids,
        ).fetchone()
        if row is None:
            return 0.0
        return float(row[0])
