#!/usr/bin/env python3
"""
Database initialization script.
Run this to create/recreate all tables and seed data.

Usage:
  python init_db.py           # Create tables (won't drop existing)
  python init_db.py --reset   # Drop all tables and recreate
"""

import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import engine, Base
from app.db.models import (
    User, Medication, SymptomLog, PositiveEffect, FoodLog,
    HealthReport, AIInsight, Provenance,
    ReferenceMedication, SideEffect, ReferenceSymptom,
    ReferencePositiveEffect, ReferenceFood
)
from app.db.seed import seed_database


def init_database(reset=False):
    """Initialize the database."""
    print("=" * 50)
    print("GLP-1 Companion Database Initialization")
    print("=" * 50)

    if reset:
        print("\n[WARNING] Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("All tables dropped.")

    print("\nCreating tables...")

    # List all tables that should be created
    tables = [
        'users', 'medications', 'symptom_logs', 'positive_effects',
        'food_logs', 'health_reports', 'ai_insights', 'provenance',
        'reference_medications', 'side_effects', 'reference_symptoms',
        'reference_positive_effects', 'reference_foods',
        'symptom_medication_association', 'positive_effect_medication_association',
        'food_medication_association', 'food_symptom_association'
    ]

    print(f"Tables to create: {len(tables)}")
    for table in tables:
        print(f"  - {table}")

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("\nTables created successfully!")

    # Verify tables exist
    from sqlalchemy import inspect
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    print(f"\nVerifying tables exist ({len(existing_tables)} found):")
    missing = []
    for table in tables:
        if table in existing_tables:
            print(f"  [OK] {table}")
        else:
            print(f"  [MISSING] {table}")
            missing.append(table)

    if missing:
        print(f"\n[ERROR] Missing tables: {missing}")
        return False

    # Seed reference data
    print("\nSeeding reference data...")
    try:
        seed_database()
        print("Seeding completed!")
    except Exception as e:
        print(f"[ERROR] Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    print("\n" + "=" * 50)
    print("Database initialization complete!")
    print("=" * 50)
    return True


if __name__ == "__main__":
    reset = "--reset" in sys.argv

    if reset:
        confirm = input("This will DELETE ALL DATA. Type 'yes' to confirm: ")
        if confirm.lower() != 'yes':
            print("Aborted.")
            sys.exit(1)

    success = init_database(reset=reset)
    sys.exit(0 if success else 1)
