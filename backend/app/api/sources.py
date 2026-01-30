"""
Sources API - Logical Sources (Read Operations)
================================================
Following Palantir Foundry pattern: Sources are read-only views into the ontology.
All data retrieval happens through Sources.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from typing import List, Optional
from datetime import datetime, date, timedelta
from uuid import UUID

from app.db.database import get_db
from app.db.models import (
    User, Medication, SideEffect, SymptomLog,
    PositiveEffect, HealthReport, AIInsight, FoodLog,
    ReferenceMedication, ReferenceSymptom, ReferencePositiveEffect, ReferenceFood,
    MealCategory
)
from app.schemas import (
    MedicationResponse, SideEffectResponse, SymptomLogResponse,
    PositiveEffectResponse, HealthReportResponse, AIInsightResponse,
    DashboardResponse, DashboardStats, TrendDataPoint,
    ReferenceMedicationResponse, ReferenceSymptomResponse, ReferencePositiveEffectResponse,
    FoodLogResponse, ReferenceFoodResponse, DailyNutritionSummary, FoodReactionSummary,
    MealCategory as MealCategorySchema
)
from app.auth import get_current_user


router = APIRouter()


# ============================================================
# DASHBOARD SOURCE
# ============================================================

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    days: int = Query(default=14, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard data for the current user."""
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)
    prev_start = start_date - timedelta(days=days)

    current_symptoms = db.query(SymptomLog).filter(
        SymptomLog.user_id == current_user.id,
        SymptomLog.timestamp >= start_date
    ).all()

    current_positive = db.query(PositiveEffect).filter(
        PositiveEffect.user_id == current_user.id,
        PositiveEffect.timestamp >= start_date
    ).all()

    prev_symptoms = db.query(SymptomLog).filter(
        SymptomLog.user_id == current_user.id,
        SymptomLog.timestamp >= prev_start,
        SymptomLog.timestamp < start_date
    ).count()

    prev_positive = db.query(PositiveEffect).filter(
        PositiveEffect.user_id == current_user.id,
        PositiveEffect.timestamp >= prev_start,
        PositiveEffect.timestamp < start_date
    ).count()

    symptoms_trend = calculate_trend(len(current_symptoms), prev_symptoms)
    positive_trend = calculate_trend(len(current_positive), prev_positive)

    active_meds = db.query(Medication).filter(
        Medication.user_id == current_user.id,
        Medication.active == True
    ).all()

    # Food tracking data
    today = now.date()
    todays_foods = db.query(FoodLog).filter(
        FoodLog.user_id == current_user.id,
        func.date(FoodLog.timestamp) == today
    ).all()

    todays_calories = sum((f.calories or 0) * (f.servings or 1) for f in todays_foods)
    foods_with_reactions = db.query(FoodLog).filter(
        FoodLog.user_id == current_user.id,
        FoodLog.timestamp >= start_date,
        FoodLog.had_reaction == True
    ).count()

    first_log = db.query(func.min(SymptomLog.timestamp)).filter(
        SymptomLog.user_id == current_user.id
    ).scalar()
    days_tracked = (now - first_log).days if first_log else 0

    recent_activity = get_recent_activity(db, current_user.id, limit=10)
    trends = get_trend_data(db, current_user.id, days)
    alerts = get_side_effect_alerts(db, current_user.id, current_symptoms, active_meds)

    return DashboardResponse(
        stats=DashboardStats(
            positive_effects_count=len(current_positive),
            positive_effects_trend=positive_trend,
            symptoms_count=len(current_symptoms),
            symptoms_trend=symptoms_trend,
            active_medications=len(active_meds),
            days_tracked=days_tracked,
            todays_calories=todays_calories,
            foods_logged_today=len(todays_foods),
            foods_with_reactions=foods_with_reactions
        ),
        recent_activity=recent_activity,
        trends=trends,
        side_effect_alerts=alerts,
        medications=[MedicationResponse.model_validate(m) for m in active_meds]
    )


def calculate_trend(current: int, previous: int) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


def get_recent_activity(db: Session, user_id: UUID, limit: int = 10) -> List[dict]:
    symptoms = db.query(SymptomLog).filter(
        SymptomLog.user_id == user_id
    ).order_by(desc(SymptomLog.timestamp)).limit(limit).all()
    
    positive = db.query(PositiveEffect).filter(
        PositiveEffect.user_id == user_id
    ).order_by(desc(PositiveEffect.timestamp)).limit(limit).all()
    
    activity = []
    for s in symptoms:
        activity.append({
            "type": "symptom",
            "id": str(s.id),
            "name": s.symptom_name,
            "severity": s.severity,
            "timestamp": s.timestamp.isoformat(),
            "matches_side_effect": s.matches_known_side_effect
        })
    for p in positive:
        activity.append({
            "type": "positive_effect",
            "id": str(p.id),
            "name": p.effect_name,
            "timestamp": p.timestamp.isoformat()
        })
    
    activity.sort(key=lambda x: x["timestamp"], reverse=True)
    return activity[:limit]


def get_trend_data(db: Session, user_id: UUID, days: int) -> List[TrendDataPoint]:
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)
    
    trends = []
    current_date = start_date
    
    while current_date <= end_date:
        symptoms_count = db.query(SymptomLog).filter(
            SymptomLog.user_id == user_id,
            func.date(SymptomLog.timestamp) == current_date
        ).count()
        
        positive_count = db.query(PositiveEffect).filter(
            PositiveEffect.user_id == user_id,
            func.date(PositiveEffect.timestamp) == current_date
        ).count()
        
        avg_severity = db.query(func.avg(SymptomLog.severity)).filter(
            SymptomLog.user_id == user_id,
            func.date(SymptomLog.timestamp) == current_date
        ).scalar()
        
        trends.append(TrendDataPoint(
            date=current_date,
            symptoms=symptoms_count,
            positive_effects=positive_count,
            avg_severity=float(avg_severity) if avg_severity else None
        ))
        
        current_date = current_date + timedelta(days=1)
    
    return trends


def get_side_effect_alerts(db: Session, user_id: UUID, symptoms: List[SymptomLog], medications: List[Medication]) -> List[dict]:
    alerts = []
    
    for symptom in symptoms:
        if symptom.matches_known_side_effect:
            for med in medications:
                side_effect = db.query(SideEffect).filter(
                    SideEffect.medication_name_lower == med.name_lower,
                    SideEffect.effect_name_lower == symptom.symptom_name_lower
                ).first()
                
                if side_effect:
                    alerts.append({
                        "symptom": symptom.symptom_name,
                        "medication": med.name,
                        "frequency": side_effect.frequency.value,
                        "frequency_pct": side_effect.frequency_percentage,
                        "severity": side_effect.severity,
                        "timestamp": symptom.timestamp.isoformat()
                    })
                    break
    
    return alerts[:5]


# ============================================================
# REFERENCE DATA SOURCES
# ============================================================

@router.get("/reference/medications", response_model=List[ReferenceMedicationResponse])
async def get_reference_medications(
    q: str = Query(default="", min_length=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get reference medications for autocomplete."""
    query = db.query(ReferenceMedication)
    
    if q:
        search_term = q.lower()
        query = query.filter(
            or_(
                ReferenceMedication.name_lower.contains(search_term),
                ReferenceMedication.generic_name.ilike(f"%{q}%")
            )
        )
    
    return query.order_by(ReferenceMedication.name).limit(limit).all()


@router.get("/reference/symptoms", response_model=List[ReferenceSymptomResponse])
async def get_reference_symptoms(
    q: str = Query(default="", min_length=0),
    category: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get reference symptoms for autocomplete."""
    query = db.query(ReferenceSymptom)
    
    if q:
        query = query.filter(ReferenceSymptom.name_lower.contains(q.lower()))
    
    if category:
        query = query.filter(ReferenceSymptom.category == category)
    
    return query.order_by(ReferenceSymptom.name).limit(limit).all()


@router.get("/reference/positive-effects", response_model=List[ReferencePositiveEffectResponse])
async def get_reference_positive_effects(
    q: str = Query(default="", min_length=0),
    category: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get reference positive effects for autocomplete."""
    query = db.query(ReferencePositiveEffect)
    
    if q:
        query = query.filter(ReferencePositiveEffect.name_lower.contains(q.lower()))
    
    if category:
        query = query.filter(ReferencePositiveEffect.category == category)
    
    return query.order_by(ReferencePositiveEffect.name).limit(limit).all()


# ============================================================
# MEDICATION SOURCE
# ============================================================

@router.get("/medications", response_model=List[MedicationResponse])
async def get_medications(
    active_only: bool = Query(default=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all medications for the current user."""
    query = db.query(Medication).filter(Medication.user_id == current_user.id)
    if active_only:
        query = query.filter(Medication.active == True)
    return query.order_by(desc(Medication.start_date)).all()


@router.get("/medications/{medication_id}", response_model=MedicationResponse)
async def get_medication(
    medication_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific medication."""
    medication = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.user_id == current_user.id
    ).first()
    
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    return medication


@router.get("/medications/{medication_id}/side-effects", response_model=List[SideEffectResponse])
async def get_medication_side_effects(
    medication_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get known side effects for a specific medication."""
    medication = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.user_id == current_user.id
    ).first()
    
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    # Use case-insensitive exact match on medication name
    side_effects = db.query(SideEffect).filter(
        SideEffect.medication_name_lower == medication.name_lower
    ).order_by(desc(SideEffect.frequency_percentage)).all()
    
    return side_effects


# ============================================================
# SIDE EFFECTS SOURCE (Reference Data)
# ============================================================

@router.get("/side-effects", response_model=List[SideEffectResponse])
async def search_side_effects(
    medication: Optional[str] = Query(default=None),
    effect: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    """Search reference side effects data."""
    query = db.query(SideEffect)
    
    if medication:
        query = query.filter(SideEffect.medication_name_lower.contains(medication.lower()))
    if effect:
        query = query.filter(SideEffect.effect_name_lower.contains(effect.lower()))
    
    return query.limit(50).all()


@router.get("/side-effects/medications", response_model=List[str])
async def get_medication_names(db: Session = Depends(get_db)):
    """Get list of all medication names in reference data."""
    result = db.query(ReferenceMedication.name).order_by(ReferenceMedication.name).all()
    return [r[0] for r in result]


@router.get("/side-effects/by-medication/{medication_name}", response_model=List[SideEffectResponse])
async def get_side_effects_by_medication_name(
    medication_name: str,
    db: Session = Depends(get_db)
):
    """Get side effects for a medication by name (case-insensitive)."""
    side_effects = db.query(SideEffect).filter(
        SideEffect.medication_name_lower == medication_name.lower()
    ).order_by(desc(SideEffect.frequency_percentage)).all()
    
    return side_effects


# ============================================================
# SYMPTOM LOG SOURCE
# ============================================================

@router.get("/symptoms", response_model=List[SymptomLogResponse])
async def get_symptoms(
    days: int = Query(default=30, ge=1, le=365),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get symptom logs for the current user."""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    symptoms = db.query(SymptomLog).filter(
        SymptomLog.user_id == current_user.id,
        SymptomLog.timestamp >= start_date
    ).order_by(desc(SymptomLog.timestamp)).limit(limit).all()
    
    return symptoms


@router.get("/symptoms/suggestions", response_model=List[str])
async def get_symptom_suggestions(
    q: str = Query(default="", min_length=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get symptom name suggestions for autocomplete."""
    user_symptoms = db.query(SymptomLog.symptom_name).filter(
        SymptomLog.user_id == current_user.id
    ).distinct().all()
    user_symptom_names = [s[0] for s in user_symptoms]
    
    ref_symptoms = db.query(ReferenceSymptom.name).all()
    ref_symptom_names = [s[0] for s in ref_symptoms]
    
    all_symptoms = list(set(ref_symptom_names + user_symptom_names))
    
    if q:
        q_lower = q.lower()
        all_symptoms = [s for s in all_symptoms if q_lower in s.lower()]
    
    return sorted(all_symptoms)[:20]


# ============================================================
# POSITIVE EFFECT SOURCE
# ============================================================

@router.get("/positive-effects", response_model=List[PositiveEffectResponse])
async def get_positive_effects(
    days: int = Query(default=30, ge=1, le=365),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get positive effect logs for the current user."""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    effects = db.query(PositiveEffect).filter(
        PositiveEffect.user_id == current_user.id,
        PositiveEffect.timestamp >= start_date
    ).order_by(desc(PositiveEffect.timestamp)).limit(limit).all()
    
    return effects


@router.get("/positive-effects/suggestions", response_model=List[str])
async def get_positive_effect_suggestions(
    q: str = Query(default="", min_length=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get positive effect name suggestions for autocomplete."""
    user_effects = db.query(PositiveEffect.effect_name).filter(
        PositiveEffect.user_id == current_user.id
    ).distinct().all()
    user_effect_names = [e[0] for e in user_effects]
    
    ref_effects = db.query(ReferencePositiveEffect.name).all()
    ref_effect_names = [e[0] for e in ref_effects]
    
    all_effects = list(set(ref_effect_names + user_effect_names))
    
    if q:
        q_lower = q.lower()
        all_effects = [e for e in all_effects if q_lower in e.lower()]
    
    return sorted(all_effects)[:20]


# ============================================================
# HEALTH REPORT SOURCE
# ============================================================

@router.get("/reports", response_model=List[HealthReportResponse])
async def get_reports(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get health reports for the current user."""
    reports = db.query(HealthReport).filter(
        HealthReport.user_id == current_user.id
    ).order_by(desc(HealthReport.created_at)).limit(limit).all()
    
    return reports


@router.get("/reports/{report_id}", response_model=HealthReportResponse)
async def get_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific health report."""
    report = db.query(HealthReport).filter(
        HealthReport.id == report_id,
        HealthReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return report


@router.get("/reports/shared/{share_token}", response_model=HealthReportResponse)
async def get_shared_report(
    share_token: str,
    db: Session = Depends(get_db)
):
    """Get a shared health report (no auth required, uses share token)."""
    report = db.query(HealthReport).filter(
        HealthReport.share_token == share_token
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.share_expires_at and report.share_expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Share link has expired")
    
    return report


# ============================================================
# FOOD LOG SOURCE
# ============================================================

@router.get("/foods", response_model=List[FoodLogResponse])
async def get_food_logs(
    days: int = Query(default=30, ge=1, le=365),
    limit: int = Query(default=100, ge=1, le=500),
    meal_category: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get food logs for the current user."""
    start_date = datetime.utcnow() - timedelta(days=days)

    query = db.query(FoodLog).filter(
        FoodLog.user_id == current_user.id,
        FoodLog.timestamp >= start_date
    )

    if meal_category:
        query = query.filter(FoodLog.meal_category == meal_category)

    foods = query.order_by(desc(FoodLog.timestamp)).limit(limit).all()

    return foods


@router.get("/foods/{food_id}", response_model=FoodLogResponse)
async def get_food_log(
    food_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific food log entry."""
    food = db.query(FoodLog).filter(
        FoodLog.id == food_id,
        FoodLog.user_id == current_user.id
    ).first()

    if not food:
        raise HTTPException(status_code=404, detail="Food log not found")

    return food


@router.get("/foods/nutrition/daily", response_model=List[DailyNutritionSummary])
async def get_daily_nutrition(
    days: int = Query(default=7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get daily nutrition summaries for the user."""
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)

    summaries = []
    current_date = start_date

    while current_date <= end_date:
        day_foods = db.query(FoodLog).filter(
            FoodLog.user_id == current_user.id,
            func.date(FoodLog.timestamp) == current_date
        ).all()

        total_calories = sum((f.calories or 0) * (f.servings or 1) for f in day_foods)
        total_protein = sum((f.protein_g or 0) * (f.servings or 1) for f in day_foods)
        total_carbs = sum((f.carbs_g or 0) * (f.servings or 1) for f in day_foods)
        total_fat = sum((f.fat_g or 0) * (f.servings or 1) for f in day_foods)
        total_fiber = sum((f.fiber_g or 0) * (f.servings or 1) for f in day_foods)
        total_sugar = sum((f.sugar_g or 0) * (f.servings or 1) for f in day_foods)
        total_sodium = sum((f.sodium_mg or 0) * (f.servings or 1) for f in day_foods)
        reactions = sum(1 for f in day_foods if f.had_reaction)

        summaries.append(DailyNutritionSummary(
            date=current_date,
            total_calories=int(total_calories),
            total_protein_g=round(total_protein, 1),
            total_carbs_g=round(total_carbs, 1),
            total_fat_g=round(total_fat, 1),
            total_fiber_g=round(total_fiber, 1),
            total_sugar_g=round(total_sugar, 1),
            total_sodium_mg=round(total_sodium, 1),
            meals_count=len(day_foods),
            foods_with_reactions=reactions
        ))

        current_date = current_date + timedelta(days=1)

    return summaries


@router.get("/foods/reactions/summary", response_model=List[FoodReactionSummary])
async def get_food_reactions_summary(
    days: int = Query(default=90, ge=1, le=365),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get summary of foods that caused reactions, useful for identifying allergies."""
    start_date = datetime.utcnow() - timedelta(days=days)

    # Get all foods with reactions
    reaction_foods = db.query(FoodLog).filter(
        FoodLog.user_id == current_user.id,
        FoodLog.timestamp >= start_date,
        FoodLog.had_reaction == True
    ).all()

    # Group by food name
    food_reactions = {}
    for food in reaction_foods:
        key = food.name_lower
        if key not in food_reactions:
            food_reactions[key] = {
                "food_name": food.name,
                "count": 0,
                "total_severity": 0,
                "last_reaction": food.timestamp,
                "symptoms": []
            }
        food_reactions[key]["count"] += 1
        food_reactions[key]["total_severity"] += food.reaction_severity or 3
        if food.timestamp > food_reactions[key]["last_reaction"]:
            food_reactions[key]["last_reaction"] = food.timestamp
        # Get associated symptoms
        for symptom in food.associated_symptoms:
            if symptom.symptom_name not in food_reactions[key]["symptoms"]:
                food_reactions[key]["symptoms"].append(symptom.symptom_name)

    # Convert to list and sort by count
    summaries = [
        FoodReactionSummary(
            food_name=data["food_name"],
            reaction_count=data["count"],
            avg_severity=round(data["total_severity"] / data["count"], 1),
            last_reaction=data["last_reaction"],
            common_symptoms=data["symptoms"][:5]
        )
        for data in food_reactions.values()
    ]

    summaries.sort(key=lambda x: x.reaction_count, reverse=True)
    return summaries[:limit]


@router.get("/foods/suggestions", response_model=List[str])
async def get_food_suggestions(
    q: str = Query(default="", min_length=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get food name suggestions for autocomplete."""
    # Get user's previously logged foods
    user_foods = db.query(FoodLog.name).filter(
        FoodLog.user_id == current_user.id
    ).distinct().all()
    user_food_names = [f[0] for f in user_foods]

    # Get reference foods
    ref_foods = db.query(ReferenceFood.name).all()
    ref_food_names = [f[0] for f in ref_foods]

    # Combine and deduplicate
    all_foods = list(set(ref_food_names + user_food_names))

    if q:
        q_lower = q.lower()
        all_foods = [f for f in all_foods if q_lower in f.lower()]

    return sorted(all_foods)[:20]


@router.get("/reference/foods", response_model=List[ReferenceFoodResponse])
async def get_reference_foods(
    q: str = Query(default="", min_length=0),
    category: Optional[str] = Query(default=None),
    diet_tag: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get reference foods for autocomplete with nutritional data."""
    query = db.query(ReferenceFood)

    if q:
        query = query.filter(ReferenceFood.name_lower.contains(q.lower()))

    if category:
        query = query.filter(ReferenceFood.category == category)

    if diet_tag:
        query = query.filter(ReferenceFood.diet_tags.any(diet_tag))

    return query.order_by(ReferenceFood.name).limit(limit).all()


@router.get("/reference/foods/{food_id}", response_model=ReferenceFoodResponse)
async def get_reference_food(
    food_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific reference food by ID."""
    food = db.query(ReferenceFood).filter(ReferenceFood.id == food_id).first()

    if not food:
        raise HTTPException(status_code=404, detail="Reference food not found")

    return food


@router.get("/reference/foods/by-barcode/{barcode}", response_model=ReferenceFoodResponse)
async def get_reference_food_by_barcode(
    barcode: str,
    db: Session = Depends(get_db)
):
    """Get a reference food by barcode (for future QR scanning)."""
    food = db.query(ReferenceFood).filter(ReferenceFood.barcode == barcode).first()

    if not food:
        raise HTTPException(status_code=404, detail="Food not found for this barcode")

    return food


# ============================================================
# AI INSIGHT SOURCE
# ============================================================

@router.get("/insights", response_model=List[AIInsightResponse])
async def get_insights(
    limit: int = Query(default=10, ge=1, le=50),
    insight_type: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-generated insights for the current user."""
    query = db.query(AIInsight).filter(AIInsight.user_id == current_user.id)
    
    if insight_type:
        query = query.filter(AIInsight.insight_type == insight_type)
    
    insights = query.order_by(desc(AIInsight.generated_at)).limit(limit).all()
    
    return insights
