"""
Actions API - Systems of Action (Write Operations)
==================================================
Following Palantir Foundry pattern: Actions are the ONLY way to mutate state.
Each action is validated, logged for provenance, and may trigger downstream computations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID
import uuid
import secrets

from app.db.database import get_db
from app.db.models import (
    User, Medication, SideEffect, SymptomLog, 
    PositiveEffect, HealthReport, AIInsight, Provenance,
    InsightType, ReferenceMedication
)
from app.schemas import (
    MedicationCreate, MedicationUpdate, MedicationResponse,
    SymptomLogCreate, SymptomLogResponse,
    PositiveEffectCreate, PositiveEffectResponse,
    HealthReportCreate, HealthReportResponse,
    ShareReportRequest, UserProfileUpdate, UserResponse
)
from app.auth import get_current_user


router = APIRouter()


# ============================================================
# PROVENANCE HELPER
# ============================================================

def log_provenance(
    db: Session,
    actor_id: Optional[UUID],
    actor_type: str,
    action_type: str,
    inputs: dict,
    outputs: List[UUID],
    parent_action_ids: List[UUID] = []
) -> Provenance:
    """Log an action for provenance tracking (P-Plan)."""
    provenance = Provenance(
        id=uuid.uuid4(),
        actor_id=actor_id,
        actor_type=actor_type,
        action_type=action_type,
        inputs=inputs,
        outputs=[str(o) for o in outputs],
        parent_action_ids=[str(p) for p in parent_action_ids]
    )
    db.add(provenance)
    return provenance


# ============================================================
# USER PROFILE ACTIONS
# ============================================================

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ACTION: UpdateProfile
    Updates the user's profile / baseline metrics.
    """
    update_dict = profile_data.model_dump(exclude_unset=True)
    
    for field, value in update_dict.items():
        setattr(current_user, field, value)
    
    log_provenance(
        db=db,
        actor_id=current_user.id,
        actor_type="user",
        action_type="UPDATE_PROFILE",
        inputs={"updates": {k: str(v) if v else None for k, v in update_dict.items()}},
        outputs=[current_user.id]
    )
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


# ============================================================
# MEDICATION ACTIONS
# ============================================================

@router.post("/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def add_medication(
    medication_data: MedicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ACTION: AddMedication
    Creates a new medication record and links known side effects.
    """
    # Try to find matching reference medication for linking
    ref_med = db.query(ReferenceMedication).filter(
        ReferenceMedication.name_lower == medication_data.name.lower()
    ).first()
    
    medication = Medication(
        id=uuid.uuid4(),
        user_id=current_user.id,
        reference_medication_id=ref_med.id if ref_med else None,
        name=medication_data.name,
        name_lower=medication_data.name.lower(),
        generic_name=medication_data.generic_name,
        dosage=medication_data.dosage,
        frequency=medication_data.frequency,
        times=medication_data.times or [],
        prescribed_for=medication_data.prescribed_for,
        start_date=medication_data.start_date,
        notes=medication_data.notes,
        active=True
    )
    
    db.add(medication)
    
    log_provenance(
        db=db,
        actor_id=current_user.id,
        actor_type="user",
        action_type="ADD_MEDICATION",
        inputs={
            "name": medication_data.name,
            "dosage": medication_data.dosage,
            "frequency": medication_data.frequency
        },
        outputs=[medication.id]
    )
    
    db.commit()
    db.refresh(medication)
    
    return medication


@router.put("/medications/{medication_id}", response_model=MedicationResponse)
async def update_medication(
    medication_id: UUID,
    update_data: MedicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ACTION: UpdateMedication
    Updates an existing medication record.
    """
    medication = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.user_id == current_user.id
    ).first()
    
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(medication, field, value)
    
    log_provenance(
        db=db,
        actor_id=current_user.id,
        actor_type="user",
        action_type="UPDATE_MEDICATION",
        inputs={"medication_id": str(medication_id), "updates": update_dict},
        outputs=[medication.id]
    )
    
    db.commit()
    db.refresh(medication)
    
    return medication


@router.post("/medications/{medication_id}/stop", response_model=MedicationResponse)
async def stop_medication(
    medication_id: UUID,
    end_date: Optional[datetime] = None,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ACTION: StopMedication
    Marks a medication as inactive with an end date.
    """
    medication = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.user_id == current_user.id
    ).first()
    
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    medication.active = False
    medication.end_date = end_date or datetime.utcnow().date()
    if reason:
        medication.notes = f"{medication.notes or ''}\nStopped: {reason}".strip()
    
    log_provenance(
        db=db,
        actor_id=current_user.id,
        actor_type="user",
        action_type="STOP_MEDICATION",
        inputs={
            "medication_id": str(medication_id),
            "end_date": str(medication.end_date),
            "reason": reason
        },
        outputs=[medication.id]
    )
    
    db.commit()
    db.refresh(medication)
    
    return medication


# ============================================================
# SYMPTOM LOG ACTIONS
# ============================================================

def check_side_effect_match(db: Session, symptom_name: str, user_id: UUID) -> List[SideEffect]:
    """Check if a symptom matches known side effects of user's active medications."""
    active_meds = db.query(Medication).filter(
        Medication.user_id == user_id,
        Medication.active == True
    ).all()
    
    symptom_lower = symptom_name.lower()
    matched = []
    
    for med in active_meds:
        # Use case-insensitive matching with lowercase columns
        side_effect = db.query(SideEffect).filter(
            SideEffect.medication_name_lower == med.name_lower,
            SideEffect.effect_name_lower == symptom_lower
        ).first()
        
        if side_effect:
            matched.append(side_effect)
    
    return matched


@router.post("/symptoms", response_model=SymptomLogResponse, status_code=status.HTTP_201_CREATED)
async def log_symptom(
    symptom_data: SymptomLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ACTION: LogSymptom
    Creates a symptom log entry and computes side effect matches.
    """
    # Use provided timestamp or current time
    timestamp = symptom_data.timestamp or datetime.utcnow()
    
    symptom = SymptomLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        symptom_name=symptom_data.symptom_name,
        symptom_name_lower=symptom_data.symptom_name.lower(),
        severity=symptom_data.severity,
        duration_minutes=symptom_data.duration_minutes,
        notes=symptom_data.notes,
        timestamp=timestamp
    )
    
    if symptom_data.associated_medication_ids:
        medications = db.query(Medication).filter(
            Medication.id.in_(symptom_data.associated_medication_ids),
            Medication.user_id == current_user.id
        ).all()
        symptom.associated_medications = medications
    
    # Check for side effect matches
    matched_side_effects = check_side_effect_match(db, symptom.symptom_name, current_user.id)
    
    if matched_side_effects:
        symptom.matches_known_side_effect = True
        symptom.matched_side_effect_ids = [se.id for se in matched_side_effects]
    
    db.add(symptom)
    
    log_provenance(
        db=db,
        actor_id=current_user.id,
        actor_type="user",
        action_type="LOG_SYMPTOM",
        inputs={
            "symptom_name": symptom_data.symptom_name,
            "severity": symptom_data.severity,
            "timestamp": timestamp.isoformat(),
            "associated_medications": [str(m) for m in symptom_data.associated_medication_ids]
        },
        outputs=[symptom.id]
    )
    
    db.commit()
    db.refresh(symptom)
    
    return symptom


@router.delete("/symptoms/{symptom_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_symptom(
    symptom_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ACTION: DeleteSymptom
    Removes a symptom log entry.
    """
    symptom = db.query(SymptomLog).filter(
        SymptomLog.id == symptom_id,
        SymptomLog.user_id == current_user.id
    ).first()
    
    if not symptom:
        raise HTTPException(status_code=404, detail="Symptom log not found")
    
    log_provenance(
        db=db,
        actor_id=current_user.id,
        actor_type="user",
        action_type="DELETE_SYMPTOM",
        inputs={"symptom_id": str(symptom_id)},
        outputs=[]
    )
    
    db.delete(symptom)
    db.commit()


# ============================================================
# POSITIVE EFFECT ACTIONS
# ============================================================

@router.post("/positive-effects", response_model=PositiveEffectResponse, status_code=status.HTTP_201_CREATED)
async def log_positive_effect(
    effect_data: PositiveEffectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ACTION: LogPositiveEffect
    Creates a positive effect log entry.
    """
    # Use provided timestamp or current time
    timestamp = effect_data.timestamp or datetime.utcnow()
    
    effect = PositiveEffect(
        id=uuid.uuid4(),
        user_id=current_user.id,
        effect_name=effect_data.effect_name,
        effect_name_lower=effect_data.effect_name.lower(),
        notes=effect_data.notes,
        timestamp=timestamp
    )
    
    if effect_data.associated_medication_ids:
        medications = db.query(Medication).filter(
            Medication.id.in_(effect_data.associated_medication_ids),
            Medication.user_id == current_user.id
        ).all()
        effect.associated_medications = medications
    
    db.add(effect)
    
    log_provenance(
        db=db,
        actor_id=current_user.id,
        actor_type="user",
        action_type="LOG_POSITIVE_EFFECT",
        inputs={
            "effect_name": effect_data.effect_name,
            "timestamp": timestamp.isoformat(),
            "associated_medications": [str(m) for m in effect_data.associated_medication_ids]
        },
        outputs=[effect.id]
    )
    
    db.commit()
    db.refresh(effect)
    
    return effect


@router.delete("/positive-effects/{effect_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_positive_effect(
    effect_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ACTION: DeletePositiveEffect
    Removes a positive effect log entry.
    """
    effect = db.query(PositiveEffect).filter(
        PositiveEffect.id == effect_id,
        PositiveEffect.user_id == current_user.id
    ).first()
    
    if not effect:
        raise HTTPException(status_code=404, detail="Positive effect not found")
    
    log_provenance(
        db=db,
        actor_id=current_user.id,
        actor_type="user",
        action_type="DELETE_POSITIVE_EFFECT",
        inputs={"effect_id": str(effect_id)},
        outputs=[]
    )
    
    db.delete(effect)
    db.commit()


# ============================================================
# HEALTH REPORT ACTIONS
# ============================================================

def generate_ai_insights(
    db: Session,
    user_id: UUID,
    symptoms: List[SymptomLog],
    positive_effects: List[PositiveEffect],
    medications: List[Medication]
) -> List[AIInsight]:
    """Generate AI insights based on user data (rule-based for now)."""
    insights = []
    
    # Insight 1: Overall summary
    if symptoms or positive_effects:
        symptom_count = len(symptoms)
        positive_count = len(positive_effects)
        
        if positive_count > symptom_count:
            status_text = "positive improvement"
            content = f"Your health metrics show overall improvement. You logged {positive_count} positive effects compared to {symptom_count} symptoms during this period."
        elif symptom_count > positive_count * 2:
            status_text = "needs attention"
            content = f"You experienced {symptom_count} symptoms during this period. Consider discussing patterns with your healthcare provider."
        else:
            status_text = "stable"
            content = f"Your health appears stable with {symptom_count} symptoms and {positive_count} positive effects logged."
        
        insight = AIInsight(
            id=uuid.uuid4(),
            user_id=user_id,
            insight_type=InsightType.SUMMARY,
            title=f"Overall Status: {status_text.title()}",
            content=content,
            confidence=0.85,
            based_on={
                "symptom_count": symptom_count,
                "positive_effect_count": positive_count
            }
        )
        db.add(insight)
        insights.append(insight)
    
    # Insight 2: Side effect correlation
    side_effect_symptoms = [s for s in symptoms if s.matches_known_side_effect]
    if side_effect_symptoms:
        insight = AIInsight(
            id=uuid.uuid4(),
            user_id=user_id,
            insight_type=InsightType.CORRELATION,
            title="Side Effect Pattern Detected",
            content=f"{len(side_effect_symptoms)} of your logged symptoms match known medication side effects. This correlation may be worth discussing with your doctor.",
            confidence=0.9,
            based_on={
                "matched_symptom_ids": [str(s.id) for s in side_effect_symptoms]
            }
        )
        db.add(insight)
        insights.append(insight)
    
    # Insight 3: Timing recommendation
    if medications and symptoms:
        morning_symptoms = [s for s in symptoms if s.timestamp.hour < 12]
        if len(morning_symptoms) > len(symptoms) * 0.6:
            insight = AIInsight(
                id=uuid.uuid4(),
                user_id=user_id,
                insight_type=InsightType.RECOMMENDATION,
                title="Morning Symptom Pattern",
                content="Most of your symptoms occur in the morning. If you take medication in the morning, consider taking it with food or discussing timing adjustments with your doctor.",
                confidence=0.75,
                based_on={
                    "morning_symptom_count": len(morning_symptoms),
                    "total_symptom_count": len(symptoms)
                }
            )
            db.add(insight)
            insights.append(insight)
    
    return insights


@router.post("/reports", response_model=HealthReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    report_data: HealthReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ACTION: GenerateReport
    Aggregates health data into a shareable report.
    """
    start_date = report_data.date_range.start
    end_date = report_data.date_range.end
    
    # Aggregate medications
    medications = db.query(Medication).filter(
        Medication.user_id == current_user.id,
        Medication.start_date <= end_date,
        (Medication.end_date >= start_date) | (Medication.end_date.is_(None))
    ).all()
    
    # Aggregate symptoms
    symptoms = db.query(SymptomLog).filter(
        SymptomLog.user_id == current_user.id,
        func.date(SymptomLog.timestamp) >= start_date,
        func.date(SymptomLog.timestamp) <= end_date
    ).all()
    
    # Aggregate positive effects
    positive_effects = db.query(PositiveEffect).filter(
        PositiveEffect.user_id == current_user.id,
        func.date(PositiveEffect.timestamp) >= start_date,
        func.date(PositiveEffect.timestamp) <= end_date
    ).all()
    
    # Build symptom summary
    symptom_summary = {}
    for s in symptoms:
        if s.symptom_name not in symptom_summary:
            symptom_summary[s.symptom_name] = {
                "count": 0,
                "total_severity": 0,
                "matches_side_effect": False,
                "matched_medication": None
            }
        symptom_summary[s.symptom_name]["count"] += 1
        symptom_summary[s.symptom_name]["total_severity"] += s.severity
        if s.matches_known_side_effect:
            symptom_summary[s.symptom_name]["matches_side_effect"] = True
            for med in medications:
                side_effect = db.query(SideEffect).filter(
                    SideEffect.medication_name_lower == med.name_lower,
                    SideEffect.effect_name_lower == s.symptom_name_lower
                ).first()
                if side_effect:
                    symptom_summary[s.symptom_name]["matched_medication"] = med.name
                    break
    
    symptom_list = []
    for name, data in symptom_summary.items():
        symptom_list.append({
            "symptom_name": name,
            "count": data["count"],
            "avg_severity": round(data["total_severity"] / data["count"], 1),
            "matches_side_effect": data["matches_side_effect"],
            "matched_medication": data["matched_medication"]
        })
    
    # Build positive effect summary
    effect_summary = {}
    for e in positive_effects:
        if e.effect_name not in effect_summary:
            effect_summary[e.effect_name] = 0
        effect_summary[e.effect_name] += 1
    
    effect_list = [
        {"effect_name": name, "count": count}
        for name, count in effect_summary.items()
    ]
    
    # Build report data
    report_content = {
        "patient": {
            "name": current_user.name,
            "id": str(current_user.id)[:8].upper()
        },
        "date_range": {
            "start": str(start_date),
            "end": str(end_date)
        },
        "summary": {
            "days_tracked": (end_date - start_date).days + 1,
            "active_medications": len([m for m in medications if m.active]),
            "total_symptoms": len(symptoms),
            "total_positive_effects": len(positive_effects)
        },
        "medications": [
            {
                "name": m.name,
                "dosage": m.dosage,
                "frequency": m.frequency,
                "start_date": str(m.start_date),
                "active": m.active
            }
            for m in medications
        ],
        "symptoms": sorted(symptom_list, key=lambda x: x["count"], reverse=True),
        "positive_effects": sorted(effect_list, key=lambda x: x["count"], reverse=True)
    }
    
    # Generate AI insights if requested
    ai_insights = []
    if report_data.include_ai_insights:
        ai_insights = generate_ai_insights(db, current_user.id, symptoms, positive_effects, medications)
        report_content["ai_insights"] = [
            {
                "type": i.insight_type.value,
                "title": i.title,
                "content": i.content
            }
            for i in ai_insights
        ]
    
    # Create report
    report = HealthReport(
        id=uuid.uuid4(),
        user_id=current_user.id,
        date_range_start=start_date,
        date_range_end=end_date,
        report_data=report_content
    )
    
    db.add(report)
    
    log_provenance(
        db=db,
        actor_id=current_user.id,
        actor_type="user",
        action_type="GENERATE_REPORT",
        inputs={
            "date_range": {"start": str(start_date), "end": str(end_date)},
            "include_ai_insights": report_data.include_ai_insights
        },
        outputs=[report.id] + [i.id for i in ai_insights]
    )
    
    db.commit()
    db.refresh(report)
    
    return report


@router.post("/reports/{report_id}/share", response_model=HealthReportResponse)
async def share_report(
    report_id: UUID,
    share_data: ShareReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ACTION: ShareReport
    Generates a secure share token for a report.
    """
    report = db.query(HealthReport).filter(
        HealthReport.id == report_id,
        HealthReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.share_token = secrets.token_urlsafe(32)
    report.share_expires_at = datetime.utcnow() + timedelta(days=share_data.expires_in_days)
    
    log_provenance(
        db=db,
        actor_id=current_user.id,
        actor_type="user",
        action_type="SHARE_REPORT",
        inputs={
            "report_id": str(report_id),
            "expires_in_days": share_data.expires_in_days
        },
        outputs=[report.id]
    )
    
    db.commit()
    db.refresh(report)
    
    return report


@router.delete("/reports/{report_id}/share", response_model=HealthReportResponse)
async def revoke_share(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ACTION: RevokeShare
    Removes the share token from a report.
    """
    report = db.query(HealthReport).filter(
        HealthReport.id == report_id,
        HealthReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.share_token = None
    report.share_expires_at = None
    
    log_provenance(
        db=db,
        actor_id=current_user.id,
        actor_type="user",
        action_type="REVOKE_SHARE",
        inputs={"report_id": str(report_id)},
        outputs=[report.id]
    )
    
    db.commit()
    db.refresh(report)
    
    return report
