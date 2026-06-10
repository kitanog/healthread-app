#!/usr/bin/env python3
"""
Pre-start bootstrap: run database migrations (and seed reference data)
before the API server starts.

Handles three cases:
  1. Fresh database              -> alembic upgrade head (creates everything)
  2. Existing pre-Alembic schema -> alembic stamp 0001 (baseline), then upgrade
  3. Alembic-managed database    -> alembic upgrade head

Case 2 covers the live deployment: its schema was created by
Base.metadata.create_all() from the same models the baseline migration was
generated from, so stamping the baseline is safe.
"""

import logging
import os
import sys
import time

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect, text

from app.db.database import engine

logging.basicConfig(level=logging.INFO, format="%(levelname)s [prestart] %(message)s")
logger = logging.getLogger(__name__)

BASELINE_REVISION = "0001"
ALEMBIC_INI = os.path.join(os.path.dirname(os.path.abspath(__file__)), "alembic.ini")


def wait_for_db(retries: int = 30, delay: float = 2.0) -> None:
    """Block until the database accepts connections."""
    for attempt in range(1, retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database is reachable.")
            return
        except Exception as e:
            logger.warning("Database not ready (attempt %d/%d): %s", attempt, retries, e)
            time.sleep(delay)
    logger.error("Database never became reachable; giving up.")
    sys.exit(1)


def run_migrations() -> None:
    cfg = Config(ALEMBIC_INI)
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    if "alembic_version" not in tables and "users" in tables:
        # Pre-Alembic database: adopt the existing schema as the baseline.
        logger.info("Existing schema without alembic_version found; stamping baseline %s.", BASELINE_REVISION)
        command.stamp(cfg, BASELINE_REVISION)

    logger.info("Running alembic upgrade head...")
    command.upgrade(cfg, "head")
    logger.info("Migrations complete.")


def run_seed() -> None:
    if os.getenv("SEED_ON_STARTUP", "true").lower() not in ("1", "true", "yes"):
        logger.info("SEED_ON_STARTUP disabled; skipping seed.")
        return
    from app.db.seed import seed_database
    seed_database()


if __name__ == "__main__":
    wait_for_db()
    run_migrations()
    run_seed()
