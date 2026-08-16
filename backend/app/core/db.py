"""
Database engine and session management.

Everything else in the app imports `get_db` (a FastAPI dependency) rather
than creating its own engine/session — one shared connection pool.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import get_settings

settings = get_settings()

# NOTE: using the sync psycopg2 driver for now (simpler for Alembic and
# early development). Architecture Doc §5 specifies asyncpg for the async
# app path — we can migrate to an async engine once the basic CRUD flow
# is working, per Document 7 §11 ("working software over complete software").
_sync_url = settings.database_url.replace("+asyncpg", "")

engine = create_engine(_sync_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a DB session, closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()