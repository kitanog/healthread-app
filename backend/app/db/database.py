"""
Database configuration and session management.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os


def get_database_url() -> str:
    """
    Build the SQLAlchemy database URL from the environment.

    Railway (and Heroku-style providers) inject DATABASE_URL using the
    legacy "postgres://" scheme, which SQLAlchemy 2.x no longer accepts.
    Normalize it to "postgresql://".
    """
    url = os.getenv(
        "DATABASE_URL",
        "postgresql://healthread:healthread@localhost:5432/healthread"
    )
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


DATABASE_URL = get_database_url()

engine = create_engine(
    DATABASE_URL,
    # Recover transparently from stale/dropped connections (common with
    # managed Postgres instances that close idle connections).
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency for FastAPI routes to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
