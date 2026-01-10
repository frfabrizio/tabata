from __future__ import annotations

import re
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

MIGRATION_DIR = Path(__file__).resolve().parent / "migrations"
MIGRATION_PATTERN = re.compile(r"^(\d+)_([a-z0-9_]+)\.sql$")


@dataclass(frozen=True)
class Migration:
    version: int
    name: str
    path: Path


class MigrationError(RuntimeError):
    pass


def _split_sql_statements(sql_text: str) -> List[str]:
    statements: List[str] = []
    buffer: List[str] = []
    in_single_quote = False
    in_double_quote = False

    for char in sql_text:
        if char == "'" and not in_double_quote:
            in_single_quote = not in_single_quote
        elif char == '"' and not in_single_quote:
            in_double_quote = not in_double_quote

        if char == ";" and not in_single_quote and not in_double_quote:
            statement = "".join(buffer).strip()
            if statement:
                statements.append(statement)
            buffer = []
        else:
            buffer.append(char)

    trailing = "".join(buffer).strip()
    if trailing:
        statements.append(trailing)
    return statements


def _column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    cursor = conn.execute(f"PRAGMA table_info({table});")
    return any(row[1] == column for row in cursor.fetchall())


def _index_exists(conn: sqlite3.Connection, index: str) -> bool:
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='index' AND name=?;", (index,))
    return cursor.fetchone() is not None


def _guarded_execute(conn: sqlite3.Connection, statement: str) -> None:
    alter_match = re.match(
        r"^ALTER\s+TABLE\s+(?P<table>\w+)\s+ADD\s+COLUMN\s+(?P<column>\w+)",
        statement,
        flags=re.IGNORECASE,
    )
    if alter_match:
        table = alter_match.group("table")
        column = alter_match.group("column")
        if _column_exists(conn, table, column):
            return

    index_match = re.match(
        r"^CREATE\s+INDEX\s+(IF\s+NOT\s+EXISTS\s+)?(?P<index>\w+)",
        statement,
        flags=re.IGNORECASE,
    )
    if index_match and _index_exists(conn, index_match.group("index")):
        return

    conn.execute(statement)


def load_migrations(directory: Path = MIGRATION_DIR) -> List[Migration]:
    migrations: List[Migration] = []
    for path in sorted(directory.glob("*.sql")):
        match = MIGRATION_PATTERN.match(path.name)
        if not match:
            raise MigrationError(f"Invalid migration filename: {path.name}")
        version = int(match.group(1))
        name = match.group(2)
        migrations.append(Migration(version=version, name=name, path=path))
    validate_migrations(migrations)
    return migrations


def validate_migrations(migrations: Iterable[Migration]) -> None:
    versions = [migration.version for migration in migrations]
    if not versions:
        raise MigrationError("No migrations found")
    if versions[0] != 1:
        raise MigrationError("Initial migration must be version 1")
    if versions != sorted(versions):
        raise MigrationError("Migrations must be in strictly increasing order")
    if len(set(versions)) != len(versions):
        raise MigrationError("Duplicate migration versions detected")


def _ensure_schema_table(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        """
    )


def _applied_versions(conn: sqlite3.Connection) -> set[int]:
    cursor = conn.execute("SELECT version FROM schema_version ORDER BY version;")
    return {row[0] for row in cursor.fetchall()}


def apply_migrations(conn: sqlite3.Connection, migrations: Iterable[Migration]) -> None:
    _ensure_schema_table(conn)
    applied = _applied_versions(conn)

    for migration in migrations:
        if migration.version in applied:
            continue
        sql_text = migration.path.read_text(encoding="utf-8")
        statements = _split_sql_statements(sql_text)
        for statement in statements:
            _guarded_execute(conn, statement)
        conn.execute("INSERT INTO schema_version (version) VALUES (?);", (migration.version,))


def migrate(db_path: Path) -> None:
    migrations = load_migrations()
    with sqlite3.connect(db_path) as conn:
        apply_migrations(conn, migrations)
        conn.commit()


def main() -> None:
    db_path = Path("var/app.db")
    db_path.parent.mkdir(parents=True, exist_ok=True)
    migrate(db_path)


if __name__ == "__main__":
    main()
