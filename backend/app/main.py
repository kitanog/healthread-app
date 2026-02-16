"""
GLP-1 Companion Backend API
============================
GLP-1 medication companion app API with Sources (read) and Actions (write) pattern.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db.database import engine, Base
from app.db.seed import seed_database
from app.api import sources, actions, auth
from sqlalchemy import inspect, text


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and seed data on startup."""
    # Create tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    # Verify tables were created
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables found: {len(tables)}")
    for t in tables:
        print(f"  - {t}")

    # Seed reference data
    try:
        seed_database()
    except Exception as e:
        print(f"Error seeding database: {e}")
        import traceback
        traceback.print_exc()
    yield


app = FastAPI(
    title="GLP-1 Companion API",
    description="GLP-1 medication companion app API with provenance",
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
        "name": "GLP-1 Companion API",
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


@app.get("/db-status")
async def db_status():
    """Check database status and list all tables."""
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        # Expected tables
        expected = [
            'users', 'medications', 'symptom_logs', 'positive_effects',
            'food_logs', 'health_reports', 'ai_insights', 'provenance',
            'reference_medications', 'side_effects', 'reference_symptoms',
            'reference_positive_effects', 'reference_foods',
            'symptom_medication_association', 'positive_effect_medication_association',
            'food_medication_association', 'food_symptom_association'
        ]

        missing = [t for t in expected if t not in tables]
        extra = [t for t in tables if t not in expected]

        # Get row counts for key tables
        counts = {}
        with engine.connect() as conn:
            for table in ['users', 'reference_medications', 'reference_foods', 'medications', 'food_logs']:
                if table in tables:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    counts[table] = result.scalar()

        return {
            "status": "connected",
            "tables_found": len(tables),
            "tables": sorted(tables),
            "missing_tables": missing,
            "extra_tables": extra,
            "row_counts": counts,
            "healthy": len(missing) == 0
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "healthy": False
        }
