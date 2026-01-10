from __future__ import annotations

import sqlite3
from typing import Iterable

SCHEMA_STATEMENTS: Iterable[str] = (
    """
    CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        calories_per_minute REAL NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        warmup_seconds INTEGER NOT NULL,
        recovery_seconds INTEGER NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        position INTEGER NOT NULL,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS intervals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        block_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL,
        exercise_id INTEGER,
        FOREIGN KEY(block_id) REFERENCES blocks(id) ON DELETE CASCADE,
        FOREIGN KEY(exercise_id) REFERENCES exercises(id)
    )
    """,
)


def initialize_sqlite(connection: sqlite3.Connection) -> None:
    connection.execute("PRAGMA foreign_keys = ON")
    for statement in SCHEMA_STATEMENTS:
        connection.execute(statement)
    connection.commit()
