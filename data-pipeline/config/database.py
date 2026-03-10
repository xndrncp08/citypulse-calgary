import psycopg2
import psycopg2.extras
from contextlib import contextmanager
from typing import Generator
import structlog
from config.settings import settings

logger = structlog.get_logger(__name__)


def get_connection() -> psycopg2.extensions.connection:
    """Return a new database connection."""
    return psycopg2.connect(settings.database_url)


@contextmanager
def db_cursor() -> Generator[psycopg2.extensions.cursor, None, None]:
    """Context manager providing a committed cursor."""
    conn = get_connection()
    try:
        with conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                yield cur
    finally:
        conn.close()
