import sqlite3
import unittest
from pathlib import Path

from db.migration_runner import apply_migrations, load_migrations


def _column_names(conn: sqlite3.Connection, table: str) -> set[str]:
    cursor = conn.execute(f"PRAGMA table_info({table});")
    return {row[1] for row in cursor.fetchall()}


def _index_names(conn: sqlite3.Connection) -> set[str]:
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='index';")
    return {row[0] for row in cursor.fetchall()}


class MigrationRunnerTest(unittest.TestCase):
    def test_apply_migrations_is_idempotent(self) -> None:
        db_path = Path("/tmp/app.db")
        if db_path.exists():
            db_path.unlink()
        migrations = load_migrations()

        with sqlite3.connect(db_path) as conn:
            apply_migrations(conn, migrations)
            apply_migrations(conn, migrations)
            conn.commit()

        with sqlite3.connect(db_path) as conn:
            columns = _column_names(conn, "entries")
            indexes = _index_names(conn)
            self.assertIn("notes", columns)
            self.assertIn("idx_entries_created_at", indexes)
            versions = [row[0] for row in conn.execute("SELECT version FROM schema_version ORDER BY version;")]
            self.assertEqual(versions, [1, 2])


if __name__ == "__main__":
    unittest.main()
