"""
Healthread Backend API
======================
Ontology-driven health tracking with Sources (read) and Actions (write) pattern.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db.database import engine, Base
from app.db.seed import seed_database
from app.api import sources, actions, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and seed data on startup."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Seed reference data
    try:
        seed_database()
    except Exception as e:
        print(f"Error seeding database: {e}")
    yield


app = FastAPI(
    title="Healthread API",
    description="Ontology-driven health tracking API with provenance",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origins=["*"],  # Allow all origins for simplicity; adjust in production
    allow_credentials=True,
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
            "docs": "/docs - OpenAPI documentation"
        }
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
