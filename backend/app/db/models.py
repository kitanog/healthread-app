"""
Healthread Ontology Models
==========================
SQLAlchemy models representing the core ontology objects.
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date, Text,
    ForeignKey, Table, JSON, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime, date
import uuid
import enum

from app.db.database import Base


# ============================================================
# ENUMS
# ============================================================

class SeverityLevel(enum.IntEnum):
    MINIMAL = 1
    MILD = 2
    MODERATE = 3
    SIGNIFICANT = 4
    SEVERE = 5


class FrequencyCategory(str, enum.Enum):
    COMMON = "common"           # >10%
    UNCOMMON = "uncommon"       # 1-10%
    RARE = "rare"               # 0.1-1%
    VERY_RARE = "very_rare"     # <0.1%


class InsightType(str, enum.Enum):
    SUMMARY = "summary"
    RECOMMENDATION = "recommendation"
    CORRELATION = "correlation"
    WARNING = "warning"


# ============================================================
# ASSOCIATION TABLES
# ============================================================

symptom_medication_association = Table(
    'symptom_medication_association',
    Base.metadata,
    Column('symptom_log_id', UUID(as_uuid=True), ForeignKey('symptom_logs.id')),
    Column('medication_id', UUID(as_uuid=True), ForeignKey('medications.id'))
)

positive_effect_medication_association = Table(
    'positive_effect_medication_association',
    Base.metadata,
    Column('positive_effect_id', UUID(as_uuid=True), ForeignKey('positive_effects.id')),
    Column('medication_id', UUID(as_uuid=True), ForeignKey('medications.id'))
)


# ============================================================
# REFERENCE DATA TABLES
# ============================================================

class ReferenceMedication(Base):
    """
    Reference medication data - canonical list of medications.
    Used for autocomplete and linking to side effects.
    """
    __tablename__ = "reference_medications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True, index=True)
    name_lower = Column(String(255), nullable=False, index=True)  # For case-insensitive matching
    generic_name = Column(String(255), nullable=True)
    drug_class = Column(String(255), nullable=True)
    common_uses = Column(ARRAY(String), default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    side_effects = relationship("SideEffect", back_populates="reference_medication", cascade="all, delete-orphan")


class SideEffect(Base):
    """
    SideEffect object - REFERENCE DATA for known medication side effects.
    This is seeded from external sources (FDA, drugs.com, etc.)
    Now linked to ReferenceMedication for proper foreign key relationships.
    """
    __tablename__ = "side_effects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference_medication_id = Column(UUID(as_uuid=True), ForeignKey("reference_medications.id"), nullable=False)
    medication_name = Column(String(255), nullable=False, index=True)  # Denormalized for quick lookups
    medication_name_lower = Column(String(255), nullable=False, index=True)
    effect_name = Column(String(255), nullable=False, index=True)
    effect_name_lower = Column(String(255), nullable=False, index=True)  # Lowercase for case-insensitive matching
    frequency = Column(SQLEnum(FrequencyCategory), nullable=False)
    frequency_percentage = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    severity = Column(String(20), default="mild")  # mild, moderate, severe
    
    # Relationships
    reference_medication = relationship("ReferenceMedication", back_populates="side_effects")
    
    # Indexes for efficient lookups
    __table_args__ = (
        Index('ix_side_effects_med_lower_effect_lower', 'medication_name_lower', 'effect_name_lower'),
    )


class ReferenceSymptom(Base):
    """
    Reference symptom data - canonical list of symptoms for autocomplete.
    """
    __tablename__ = "reference_symptoms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True, index=True)
    name_lower = Column(String(255), nullable=False, index=True)  # For case-insensitive search
    category = Column(String(100), nullable=True)  # e.g., "gastrointestinal", "neurological"
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ReferencePositiveEffect(Base):
    """
    Reference positive effect data - canonical list for autocomplete.
    """
    __tablename__ = "reference_positive_effects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True, index=True)
    name_lower = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================
# CORE ONTOLOGY OBJECTS
# ============================================================

class User(Base):
    """
    User object - the primary actor in the ontology.
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Profile / Baseline Metrics
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(50), nullable=True)
    blood_type = Column(String(10), nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    allergies = Column(ARRAY(String), default=[])
    medical_conditions = Column(ARRAY(String), default=[])
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    
    # Relationships
    medications = relationship("Medication", back_populates="user", cascade="all, delete-orphan")
    symptom_logs = relationship("SymptomLog", back_populates="user", cascade="all, delete-orphan")
    positive_effects = relationship("PositiveEffect", back_populates="user", cascade="all, delete-orphan")
    health_reports = relationship("HealthReport", back_populates="user", cascade="all, delete-orphan")
    ai_insights = relationship("AIInsight", back_populates="user", cascade="all, delete-orphan")


class Medication(Base):
    """
    Medication object - represents a medication a user is taking.
    Links to reference SideEffect data.
    """
    __tablename__ = "medications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reference_medication_id = Column(UUID(as_uuid=True), ForeignKey("reference_medications.id"), nullable=True)
    
    name = Column(String(255), nullable=False, index=True)
    name_lower = Column(String(255), nullable=False, index=True)  # For matching
    generic_name = Column(String(255), nullable=True)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    times = Column(ARRAY(String), default=[])
    prescribed_for = Column(String(255), nullable=True)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="medications")
    reference_medication = relationship("ReferenceMedication")
    symptom_logs = relationship(
        "SymptomLog",
        secondary=symptom_medication_association,
        back_populates="associated_medications"
    )
    positive_effects = relationship(
        "PositiveEffect",
        secondary=positive_effect_medication_association,
        back_populates="associated_medications"
    )


class SymptomLog(Base):
    """
    SymptomLog object - a logged symptom instance.
    Core tracking object with provenance.
    """
    __tablename__ = "symptom_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    symptom_name = Column(String(255), nullable=False, index=True)
    symptom_name_lower = Column(String(255), nullable=False, index=True)
    severity = Column(Integer, nullable=False)  # 1-5
    duration_minutes = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Computed fields (set by system)
    matches_known_side_effect = Column(Boolean, default=False)
    matched_side_effect_ids = Column(ARRAY(UUID(as_uuid=True)), default=[])
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="symptom_logs")
    associated_medications = relationship(
        "Medication",
        secondary=symptom_medication_association,
        back_populates="symptom_logs"
    )


class PositiveEffect(Base):
    """
    PositiveEffect object - a logged positive health effect/improvement.
    """
    __tablename__ = "positive_effects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    effect_name = Column(String(255), nullable=False, index=True)
    effect_name_lower = Column(String(255), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="positive_effects")
    associated_medications = relationship(
        "Medication",
        secondary=positive_effect_medication_association,
        back_populates="positive_effects"
    )


class HealthReport(Base):
    """
    HealthReport object - aggregated health summary for sharing.
    """
    __tablename__ = "health_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    date_range_start = Column(Date, nullable=False)
    date_range_end = Column(Date, nullable=False)
    
    # Aggregated data stored as JSON
    report_data = Column(JSON, nullable=False)
    
    # Sharing
    share_token = Column(String(64), unique=True, nullable=True, index=True)
    share_expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="health_reports")


class AIInsight(Base):
    """
    AIInsight object - AI-generated health insight with provenance.
    """
    __tablename__ = "ai_insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    generated_at = Column(DateTime, default=datetime.utcnow)
    insight_type = Column(SQLEnum(InsightType), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    confidence = Column(Float, default=0.8)
    
    # Provenance - what data was this based on?
    based_on = Column(JSON, nullable=False)  # {symptom_log_ids, medication_ids, etc.}
    
    # Relationships
    user = relationship("User", back_populates="ai_insights")


class Provenance(Base):
    """
    Provenance tracking for all actions (P-Plan methodology).
    """
    __tablename__ = "provenance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    actor_id = Column(UUID(as_uuid=True), nullable=True)  # User ID or null for system
    actor_type = Column(String(50), nullable=False)  # 'user' or 'system'
    
    action_type = Column(String(100), nullable=False, index=True)
    inputs = Column(JSON, nullable=False)
    outputs = Column(ARRAY(UUID(as_uuid=True)), default=[])
    
    parent_action_ids = Column(ARRAY(UUID(as_uuid=True)), default=[])
