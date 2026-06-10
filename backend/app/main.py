"""
Healthread Backend API
======================
Ontology-driven health tracking with Sources (read) and Actions (write) pattern.

Schema management is handled by Alembic (see prestart.py / alembic/);
the application no longer creates or mutates tables at startup.
"""

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.db.database import engine
from app.api import sources, actions, auth

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("healthread")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

app = FastAPI(
    title="Healthread API",
    description="Ontology-driven health tracking API with provenance",
    version="1.0.0",
    # Don't expose interactive API docs in production
    docs_url="/docs" if ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if ENVIRONMENT != "production" else None,
)


def _cors_origins() -> list[str]:
    """
    Comma-separated list of allowed origins, e.g.
    CORS_ORIGINS=https://app.example.com,https://www.example.com
    """
    raw = os.getenv("CORS_ORIGINS", "")
    return [o.strip() for o in raw.split(",") if o.strip()]


cors_origins = _cors_origins()
if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # No explicit origins configured: allow any origin but without
    # credentials (the API uses Bearer tokens, not cookies, so this is safe
    # and keeps existing deployments working until CORS_ORIGINS is set).
    if ENVIRONMENT == "production":
        logger.warning(
            "CORS_ORIGINS is not set; falling back to wildcard origins. "
            "Set CORS_ORIGINS to your frontend URL(s) in production."
        )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Mount API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(sources.router, prefix="/api/sources", tags=["Sources (Read)"])
app.include_router(actions.router, prefix="/api/actions", tags=["Actions (Write)"])


@app.get("/")
async def root():
    return {
        "name": "Healthread API",
        "version": "1.0.0",
        "ontology_version": "1.0",
        "endpoints": {
            "sources": "/api/sources - Read operations (Logical Sources)",
            "actions": "/api/actions - Write operations (Systems of Action)",
            "auth": "/api/auth - Authentication",
        }
    }


@app.get("/health")
async def health():
    """Liveness/readiness probe: verifies the database is reachable."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        logger.exception("Health check failed: database unreachable")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "unreachable"},
        )
