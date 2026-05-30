import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "stats.db")


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS stats (
                key   TEXT PRIMARY KEY,
                value INTEGER NOT NULL DEFAULT 0
            )
        """)
        conn.execute("INSERT OR IGNORE INTO stats VALUES ('repos_scanned', 0)")
        conn.execute("INSERT OR IGNORE INTO stats VALUES ('vulns_found', 0)")


def increment(repos: int = 0, vulns: int = 0):
    with _connect() as conn:
        if repos:
            conn.execute("UPDATE stats SET value = value + ? WHERE key = 'repos_scanned'", (repos,))
        if vulns:
            conn.execute("UPDATE stats SET value = value + ? WHERE key = 'vulns_found'", (vulns,))


def get_stats() -> dict:
    with _connect() as conn:
        rows = conn.execute("SELECT key, value FROM stats").fetchall()
    return {k: v for k, v in rows}
