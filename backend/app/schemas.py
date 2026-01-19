"""
Pydantic schemas for API request/response validation.
Maps to the Healthread ontology.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from enum import Enum


# ============================================================
# ENUMS
# ============================================================

class SeverityLevel(int, Enum):
    MINIMAL = 1
    MILD = 2
    MODERATE = 3
    SIGNIFICANT = 4
    SEVERE = 5


class FrequencyCategory(str, Enum):
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    VERY_RARE = "very_rare"


class InsightType(str, Enum):
    SUMMARY = "summary"
    RECOMMENDATION = "recommendation"
    CORRELATION = "correlation"
    WARNING = "warning"


# ============================================================
# USER SCHEMAS
# ============================================================

class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str


class UserProfile(BaseModel):
    """User profile / baseline metrics"""
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    allergies: List[str] = []
    medical_conditions: List[str] = []
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class UserProfileUpdate(BaseModel):
    """For updating user profile"""
    name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    allergies: Optional[List[str]] = None
    medical_conditions: Optional[List[str]] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    allergies: List[str] = []
    medical_conditions: List[str] = []
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# REFERENCE DATA SCHEMAS
# ============================================================

class ReferenceMedicationResponse(BaseModel):
    id: UUID
    name: str
    generic_name: Optional[str] = None
    drug_class: Optional[str] = None
    common_uses: List[str] = []

    class Config:
        from_attributes = True


class ReferenceSymptomResponse(BaseModel):
    id: UUID
    name: str
    category: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class ReferencePositiveEffectResponse(BaseModel):
    id: UUID
    name: str
    category: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# MEDICATION SCHEMAS
# ============================================================

class MedicationBase(BaseModel):
    name: str
    dosage: str
    frequency: str
    times: List[str] = []
    prescribed_for: Optional[str] = None
    notes: Optional[str] = None


class MedicationCreate(MedicationBase):
    start_date: date
    generic_name: Optional[str] = None


class MedicationUpdate(BaseModel):
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    times: Optional[List[str]] = None
    notes: Optional[str] = None
    end_date: Optional[date] = None
    active: Optional[bool] = None


class MedicationResponse(MedicationBase):
    id: UUID
    user_id: UUID
    generic_name: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# SIDE EFFECT SCHEMAS (Reference Data)
# ============================================================

class SideEffectResponse(BaseModel):
    id: UUID
    medication_name: str
    effect_name: str
    frequency: FrequencyCategory
    frequency_percentage: Optional[float] = None
    description: Optional[str] = None
    severity: str

    class Config:
        from_attributes = True


# ============================================================
# SYMPTOM LOG SCHEMAS
# ============================================================

class SymptomLogBase(BaseModel):
    symptom_name: str
    severity: int = Field(ge=1, le=5)
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None


class SymptomLogCreate(SymptomLogBase):
    timestamp: Optional[datetime] = None  # If not provided, uses current time
    associated_medication_ids: List[UUID] = []


class SymptomLogResponse(SymptomLogBase):
    id: UUID
    user_id: UUID
    timestamp: datetime
    matches_known_side_effect: bool
    matched_side_effect_ids: List[UUID] = []
    created_at: datetime
    associated_medications: List[MedicationResponse] = []

    class Config:
        from_attributes = True


# ============================================================
# POSITIVE EFFECT SCHEMAS
# ============================================================

class PositiveEffectBase(BaseModel):
    effect_name: str
    notes: Optional[str] = None


class PositiveEffectCreate(PositiveEffectBase):
    timestamp: Optional[datetime] = None  # If not provided, uses current time
    associated_medication_ids: List[UUID] = []


class PositiveEffectResponse(PositiveEffectBase):
    id: UUID
    user_id: UUID
    timestamp: datetime
    created_at: datetime
    associated_medications: List[MedicationResponse] = []

    class Config:
        from_attributes = True


# ============================================================
# HEALTH REPORT SCHEMAS
# ============================================================

class ReportDateRange(BaseModel):
    start: date
    end: date


class SymptomSummary(BaseModel):
    symptom_name: str
    count: int
    avg_severity: float
    matches_side_effect: bool
    matched_medication: Optional[str] = None


class PositiveEffectSummary(BaseModel):
    effect_name: str
    count: int


class HealthReportCreate(BaseModel):
    date_range: ReportDateRange
    include_ai_insights: bool = False


class HealthReportResponse(BaseModel):
    id: UUID
    user_id: UUID
    created_at: datetime
    date_range_start: date
    date_range_end: date
    report_data: dict
    share_token: Optional[str] = None
    share_expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ShareReportRequest(BaseModel):
    expires_in_days: int = Field(default=7, ge=1, le=30)


# ============================================================
# AI INSIGHT SCHEMAS
# ============================================================

class AIInsightResponse(BaseModel):
    id: UUID
    user_id: UUID
    generated_at: datetime
    insight_type: InsightType
    title: str
    content: str
    confidence: float
    based_on: dict

    class Config:
        from_attributes = True


# ============================================================
# DASHBOARD / AGGREGATION SCHEMAS
# ============================================================

class DashboardStats(BaseModel):
    positive_effects_count: int
    positive_effects_trend: float  # percentage change
    symptoms_count: int
    symptoms_trend: float
    active_medications: int
    days_tracked: int


class TrendDataPoint(BaseModel):
    date: date
    symptoms: int
    positive_effects: int
    avg_severity: Optional[float] = None


class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_activity: List[dict]
    trends: List[TrendDataPoint]
    side_effect_alerts: List[dict]
    medications: List[MedicationResponse]


# ============================================================
# AUTH SCHEMAS
# ============================================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
