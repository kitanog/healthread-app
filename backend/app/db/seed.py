"""
Seed database with reference data.
Includes common medications, side effects, symptoms, and positive effects.
"""

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import (
    ReferenceMedication, SideEffect, ReferenceSymptom, 
    ReferencePositiveEffect, FrequencyCategory, User
)
from app.auth import get_password_hash
import uuid


# Common medications and their side effects
# Source: FDA labels, drugs.com, medical literature
MEDICATIONS_SIDE_EFFECTS = {
    "Metformin": {
        "generic_name": "metformin hydrochloride",
        "drug_class": "Biguanides",
        "common_uses": ["Type 2 Diabetes", "PCOS", "Prediabetes"],
        "side_effects": [
            {"effect": "Nausea", "frequency": FrequencyCategory.COMMON, "pct": 0.25, "severity": "mild"},
            {"effect": "Diarrhea", "frequency": FrequencyCategory.COMMON, "pct": 0.53, "severity": "mild"},
            {"effect": "Stomach upset", "frequency": FrequencyCategory.COMMON, "pct": 0.10, "severity": "mild"},
            {"effect": "Decreased appetite", "frequency": FrequencyCategory.COMMON, "pct": 0.10, "severity": "mild"},
            {"effect": "Metallic taste", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.05, "severity": "mild"},
            {"effect": "Vitamin B12 deficiency", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.07, "severity": "moderate"},
            {"effect": "Lactic acidosis", "frequency": FrequencyCategory.VERY_RARE, "pct": 0.001, "severity": "severe"},
        ]
    },
    "Lisinopril": {
        "generic_name": "lisinopril",
        "drug_class": "ACE Inhibitors",
        "common_uses": ["High Blood Pressure", "Heart Failure", "Diabetic Nephropathy"],
        "side_effects": [
            {"effect": "Dry cough", "frequency": FrequencyCategory.COMMON, "pct": 0.20, "severity": "mild"},
            {"effect": "Dizziness", "frequency": FrequencyCategory.COMMON, "pct": 0.12, "severity": "mild"},
            {"effect": "Headache", "frequency": FrequencyCategory.COMMON, "pct": 0.10, "severity": "mild"},
            {"effect": "Fatigue", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.05, "severity": "mild"},
            {"effect": "Hyperkalemia", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.03, "severity": "moderate"},
            {"effect": "Angioedema", "frequency": FrequencyCategory.RARE, "pct": 0.005, "severity": "severe"},
        ]
    },
    "Atorvastatin": {
        "generic_name": "atorvastatin calcium",
        "drug_class": "Statins",
        "common_uses": ["High Cholesterol", "Heart Disease Prevention"],
        "side_effects": [
            {"effect": "Muscle pain", "frequency": FrequencyCategory.COMMON, "pct": 0.10, "severity": "mild"},
            {"effect": "Joint pain", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.05, "severity": "mild"},
            {"effect": "Diarrhea", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.04, "severity": "mild"},
            {"effect": "Nausea", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.03, "severity": "mild"},
            {"effect": "Elevated liver enzymes", "frequency": FrequencyCategory.RARE, "pct": 0.01, "severity": "moderate"},
            {"effect": "Rhabdomyolysis", "frequency": FrequencyCategory.VERY_RARE, "pct": 0.001, "severity": "severe"},
        ]
    },
    "Omeprazole": {
        "generic_name": "omeprazole",
        "drug_class": "Proton Pump Inhibitors",
        "common_uses": ["GERD", "Stomach Ulcers", "Heartburn"],
        "side_effects": [
            {"effect": "Headache", "frequency": FrequencyCategory.COMMON, "pct": 0.07, "severity": "mild"},
            {"effect": "Abdominal pain", "frequency": FrequencyCategory.COMMON, "pct": 0.05, "severity": "mild"},
            {"effect": "Nausea", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.04, "severity": "mild"},
            {"effect": "Diarrhea", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.04, "severity": "mild"},
            {"effect": "Vitamin B12 deficiency", "frequency": FrequencyCategory.RARE, "pct": 0.01, "severity": "moderate"},
            {"effect": "Bone fractures", "frequency": FrequencyCategory.RARE, "pct": 0.01, "severity": "moderate"},
        ]
    },
    "Sertraline": {
        "generic_name": "sertraline hydrochloride",
        "drug_class": "SSRIs",
        "common_uses": ["Depression", "Anxiety", "PTSD", "OCD"],
        "side_effects": [
            {"effect": "Nausea", "frequency": FrequencyCategory.COMMON, "pct": 0.26, "severity": "mild"},
            {"effect": "Diarrhea", "frequency": FrequencyCategory.COMMON, "pct": 0.20, "severity": "mild"},
            {"effect": "Insomnia", "frequency": FrequencyCategory.COMMON, "pct": 0.20, "severity": "mild"},
            {"effect": "Dry mouth", "frequency": FrequencyCategory.COMMON, "pct": 0.14, "severity": "mild"},
            {"effect": "Dizziness", "frequency": FrequencyCategory.COMMON, "pct": 0.12, "severity": "mild"},
            {"effect": "Fatigue", "frequency": FrequencyCategory.COMMON, "pct": 0.12, "severity": "mild"},
            {"effect": "Sexual dysfunction", "frequency": FrequencyCategory.COMMON, "pct": 0.15, "severity": "moderate"},
            {"effect": "Increased anxiety", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.05, "severity": "moderate"},
        ]
    },
    "Amlodipine": {
        "generic_name": "amlodipine besylate",
        "drug_class": "Calcium Channel Blockers",
        "common_uses": ["High Blood Pressure", "Angina"],
        "side_effects": [
            {"effect": "Swelling (edema)", "frequency": FrequencyCategory.COMMON, "pct": 0.15, "severity": "mild"},
            {"effect": "Dizziness", "frequency": FrequencyCategory.COMMON, "pct": 0.08, "severity": "mild"},
            {"effect": "Flushing", "frequency": FrequencyCategory.COMMON, "pct": 0.05, "severity": "mild"},
            {"effect": "Fatigue", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.04, "severity": "mild"},
            {"effect": "Palpitations", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.03, "severity": "mild"},
            {"effect": "Nausea", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.03, "severity": "mild"},
        ]
    },
    "Levothyroxine": {
        "generic_name": "levothyroxine sodium",
        "drug_class": "Thyroid Hormones",
        "common_uses": ["Hypothyroidism", "Thyroid Cancer"],
        "side_effects": [
            {"effect": "Weight changes", "frequency": FrequencyCategory.COMMON, "pct": 0.10, "severity": "mild"},
            {"effect": "Increased appetite", "frequency": FrequencyCategory.COMMON, "pct": 0.08, "severity": "mild"},
            {"effect": "Tremor", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.05, "severity": "mild"},
            {"effect": "Insomnia", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.05, "severity": "mild"},
            {"effect": "Palpitations", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.04, "severity": "moderate"},
            {"effect": "Heat intolerance", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.03, "severity": "mild"},
        ]
    },
    "Gabapentin": {
        "generic_name": "gabapentin",
        "drug_class": "Anticonvulsants",
        "common_uses": ["Seizures", "Nerve Pain", "Restless Leg Syndrome"],
        "side_effects": [
            {"effect": "Drowsiness", "frequency": FrequencyCategory.COMMON, "pct": 0.20, "severity": "mild"},
            {"effect": "Dizziness", "frequency": FrequencyCategory.COMMON, "pct": 0.17, "severity": "mild"},
            {"effect": "Fatigue", "frequency": FrequencyCategory.COMMON, "pct": 0.11, "severity": "mild"},
            {"effect": "Peripheral edema", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.08, "severity": "mild"},
            {"effect": "Coordination problems", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.06, "severity": "moderate"},
            {"effect": "Blurred vision", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.04, "severity": "mild"},
        ]
    },
    "Hydrochlorothiazide": {
        "generic_name": "hydrochlorothiazide",
        "drug_class": "Thiazide Diuretics",
        "common_uses": ["High Blood Pressure", "Edema"],
        "side_effects": [
            {"effect": "Frequent urination", "frequency": FrequencyCategory.COMMON, "pct": 0.15, "severity": "mild"},
            {"effect": "Dizziness", "frequency": FrequencyCategory.COMMON, "pct": 0.10, "severity": "mild"},
            {"effect": "Electrolyte imbalance", "frequency": FrequencyCategory.COMMON, "pct": 0.08, "severity": "moderate"},
            {"effect": "Muscle cramps", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.05, "severity": "mild"},
            {"effect": "Increased blood sugar", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.05, "severity": "moderate"},
            {"effect": "Photosensitivity", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.03, "severity": "mild"},
        ]
    },
    "Ibuprofen": {
        "generic_name": "ibuprofen",
        "drug_class": "NSAIDs",
        "common_uses": ["Pain Relief", "Inflammation", "Fever"],
        "side_effects": [
            {"effect": "Stomach upset", "frequency": FrequencyCategory.COMMON, "pct": 0.15, "severity": "mild"},
            {"effect": "Nausea", "frequency": FrequencyCategory.COMMON, "pct": 0.10, "severity": "mild"},
            {"effect": "Heartburn", "frequency": FrequencyCategory.COMMON, "pct": 0.10, "severity": "mild"},
            {"effect": "Dizziness", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.05, "severity": "mild"},
            {"effect": "Stomach ulcers", "frequency": FrequencyCategory.RARE, "pct": 0.01, "severity": "severe"},
            {"effect": "Kidney problems", "frequency": FrequencyCategory.RARE, "pct": 0.01, "severity": "severe"},
        ]
    },
    "Vitamin D3": {
        "generic_name": "cholecalciferol",
        "drug_class": "Vitamins",
        "common_uses": ["Vitamin D Deficiency", "Bone Health"],
        "side_effects": [
            {"effect": "Nausea", "frequency": FrequencyCategory.RARE, "pct": 0.01, "severity": "mild"},
            {"effect": "Constipation", "frequency": FrequencyCategory.RARE, "pct": 0.01, "severity": "mild"},
            {"effect": "Weakness", "frequency": FrequencyCategory.VERY_RARE, "pct": 0.005, "severity": "mild"},
            {"effect": "Hypercalcemia", "frequency": FrequencyCategory.VERY_RARE, "pct": 0.001, "severity": "moderate"},
        ]
    },
    "Adderall": {
        "generic_name": "amphetamine/dextroamphetamine",
        "drug_class": "Stimulants",
        "common_uses": ["ADHD", "Narcolepsy"],
        "side_effects": [
            {"effect": "Decreased appetite", "frequency": FrequencyCategory.COMMON, "pct": 0.35, "severity": "mild"},
            {"effect": "Insomnia", "frequency": FrequencyCategory.COMMON, "pct": 0.27, "severity": "moderate"},
            {"effect": "Dry mouth", "frequency": FrequencyCategory.COMMON, "pct": 0.20, "severity": "mild"},
            {"effect": "Increased heart rate", "frequency": FrequencyCategory.COMMON, "pct": 0.15, "severity": "moderate"},
            {"effect": "Anxiety", "frequency": FrequencyCategory.COMMON, "pct": 0.12, "severity": "moderate"},
            {"effect": "Headache", "frequency": FrequencyCategory.COMMON, "pct": 0.10, "severity": "mild"},
            {"effect": "Irritability", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.08, "severity": "mild"},
        ]
    },
    "Prednisone": {
        "generic_name": "prednisone",
        "drug_class": "Corticosteroids",
        "common_uses": ["Inflammation", "Autoimmune Diseases", "Allergies"],
        "side_effects": [
            {"effect": "Increased appetite", "frequency": FrequencyCategory.COMMON, "pct": 0.30, "severity": "mild"},
            {"effect": "Weight gain", "frequency": FrequencyCategory.COMMON, "pct": 0.25, "severity": "mild"},
            {"effect": "Insomnia", "frequency": FrequencyCategory.COMMON, "pct": 0.20, "severity": "moderate"},
            {"effect": "Mood changes", "frequency": FrequencyCategory.COMMON, "pct": 0.15, "severity": "moderate"},
            {"effect": "Fluid retention", "frequency": FrequencyCategory.COMMON, "pct": 0.12, "severity": "mild"},
            {"effect": "Elevated blood sugar", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.08, "severity": "moderate"},
            {"effect": "Bone loss", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.05, "severity": "moderate"},
        ]
    },
    "Acetaminophen": {
        "generic_name": "acetaminophen",
        "drug_class": "Analgesics",
        "common_uses": ["Pain Relief", "Fever"],
        "side_effects": [
            {"effect": "Nausea", "frequency": FrequencyCategory.RARE, "pct": 0.01, "severity": "mild"},
            {"effect": "Rash", "frequency": FrequencyCategory.RARE, "pct": 0.01, "severity": "mild"},
            {"effect": "Liver damage", "frequency": FrequencyCategory.VERY_RARE, "pct": 0.001, "severity": "severe"},
        ]
    },
    "Losartan": {
        "generic_name": "losartan potassium",
        "drug_class": "ARBs",
        "common_uses": ["High Blood Pressure", "Diabetic Kidney Disease"],
        "side_effects": [
            {"effect": "Dizziness", "frequency": FrequencyCategory.COMMON, "pct": 0.08, "severity": "mild"},
            {"effect": "Upper respiratory infection", "frequency": FrequencyCategory.COMMON, "pct": 0.06, "severity": "mild"},
            {"effect": "Fatigue", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.04, "severity": "mild"},
            {"effect": "Hyperkalemia", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.03, "severity": "moderate"},
            {"effect": "Back pain", "frequency": FrequencyCategory.UNCOMMON, "pct": 0.02, "severity": "mild"},
        ]
    },
}

# Common symptom names for autocomplete
COMMON_SYMPTOMS = [
    {"name": "Nausea", "category": "gastrointestinal"},
    {"name": "Headache", "category": "neurological"},
    {"name": "Fatigue", "category": "general"},
    {"name": "Dizziness", "category": "neurological"},
    {"name": "Insomnia", "category": "sleep"},
    {"name": "Stomach pain", "category": "gastrointestinal"},
    {"name": "Diarrhea", "category": "gastrointestinal"},
    {"name": "Constipation", "category": "gastrointestinal"},
    {"name": "Dry mouth", "category": "oral"},
    {"name": "Muscle pain", "category": "musculoskeletal"},
    {"name": "Joint pain", "category": "musculoskeletal"},
    {"name": "Anxiety", "category": "mental"},
    {"name": "Depression", "category": "mental"},
    {"name": "Irritability", "category": "mental"},
    {"name": "Brain fog", "category": "neurological"},
    {"name": "Shortness of breath", "category": "respiratory"},
    {"name": "Chest pain", "category": "cardiovascular"},
    {"name": "Palpitations", "category": "cardiovascular"},
    {"name": "Swelling", "category": "general"},
    {"name": "Rash", "category": "skin"},
    {"name": "Itching", "category": "skin"},
    {"name": "Blurred vision", "category": "vision"},
    {"name": "Tremor", "category": "neurological"},
    {"name": "Weakness", "category": "general"},
    {"name": "Loss of appetite", "category": "gastrointestinal"},
    {"name": "Increased appetite", "category": "gastrointestinal"},
    {"name": "Weight gain", "category": "metabolic"},
    {"name": "Weight loss", "category": "metabolic"},
    {"name": "Hot flashes", "category": "general"},
    {"name": "Cold intolerance", "category": "general"},
    {"name": "Sweating", "category": "general"},
    {"name": "Numbness", "category": "neurological"},
    {"name": "Tingling", "category": "neurological"},
    {"name": "Back pain", "category": "musculoskeletal"},
    {"name": "Neck pain", "category": "musculoskeletal"},
    {"name": "Cough", "category": "respiratory"},
    {"name": "Sore throat", "category": "respiratory"},
    {"name": "Runny nose", "category": "respiratory"},
    {"name": "Fever", "category": "general"},
    {"name": "Chills", "category": "general"},
]

# Common positive effects for autocomplete
COMMON_POSITIVE_EFFECTS = [
    {"name": "Improved energy", "category": "energy"},
    {"name": "Better sleep", "category": "sleep"},
    {"name": "Reduced pain", "category": "pain"},
    {"name": "Improved mood", "category": "mental"},
    {"name": "Better focus", "category": "cognitive"},
    {"name": "Reduced anxiety", "category": "mental"},
    {"name": "Improved appetite", "category": "gastrointestinal"},
    {"name": "Weight loss", "category": "metabolic"},
    {"name": "Lower blood pressure", "category": "cardiovascular"},
    {"name": "Improved digestion", "category": "gastrointestinal"},
    {"name": "Clearer thinking", "category": "cognitive"},
    {"name": "Reduced inflammation", "category": "general"},
    {"name": "Better mobility", "category": "musculoskeletal"},
    {"name": "Improved breathing", "category": "respiratory"},
    {"name": "Stabilized blood sugar", "category": "metabolic"},
    {"name": "Reduced swelling", "category": "general"},
    {"name": "Better coordination", "category": "neurological"},
    {"name": "Increased strength", "category": "musculoskeletal"},
    {"name": "Improved skin", "category": "skin"},
    {"name": "Better memory", "category": "cognitive"},
    {"name": "More motivation", "category": "mental"},
    {"name": "Reduced stress", "category": "mental"},
    {"name": "Better balance", "category": "neurological"},
    {"name": "Improved vision", "category": "vision"},
]


def seed_database():
    """Seed the database with reference data."""
    db = SessionLocal()
    
    try:
        # Check if already seeded
        existing = db.query(ReferenceMedication).first()
        if existing:
            print("Database already seeded, skipping...")
            return
        
        print("Seeding database with reference data...")
        
        # Seed reference medications and side effects
        for med_name, med_data in MEDICATIONS_SIDE_EFFECTS.items():
            # Create reference medication
            ref_med = ReferenceMedication(
                id=uuid.uuid4(),
                name=med_name,
                name_lower=med_name.lower(),
                generic_name=med_data.get("generic_name"),
                drug_class=med_data.get("drug_class"),
                common_uses=med_data.get("common_uses", [])
            )
            db.add(ref_med)
            db.flush()  # Get the ID
            
            # Create side effects linked to this medication
            for se in med_data["side_effects"]:
                side_effect = SideEffect(
                    id=uuid.uuid4(),
                    reference_medication_id=ref_med.id,
                    medication_name=med_name,
                    medication_name_lower=med_name.lower(),
                    effect_name=se["effect"],
                    effect_name_lower=se["effect"].lower(),
                    frequency=se["frequency"],
                    frequency_percentage=se["pct"],
                    severity=se["severity"],
                    description=f"{se['effect']} is a {se['frequency'].value} side effect of {med_name}"
                )
                db.add(side_effect)
        
        print(f"Seeded {len(MEDICATIONS_SIDE_EFFECTS)} medications with side effects")
        
        # Seed reference symptoms
        for symptom in COMMON_SYMPTOMS:
            ref_symptom = ReferenceSymptom(
                id=uuid.uuid4(),
                name=symptom["name"],
                name_lower=symptom["name"].lower(),
                category=symptom.get("category")
            )
            db.add(ref_symptom)
        
        print(f"Seeded {len(COMMON_SYMPTOMS)} reference symptoms")
        
        # Seed reference positive effects
        for effect in COMMON_POSITIVE_EFFECTS:
            ref_effect = ReferencePositiveEffect(
                id=uuid.uuid4(),
                name=effect["name"],
                name_lower=effect["name"].lower(),
                category=effect.get("category")
            )
            db.add(ref_effect)
        
        print(f"Seeded {len(COMMON_POSITIVE_EFFECTS)} reference positive effects")
        
        # Seed test user
        test_email = "test@healthread.app"
        user_exists = db.query(User).filter(User.email == test_email).first()
        
        if not user_exists:
            print("Seeding test user...")
            test_user = User(
                email=test_email,
                name="Demo User",
                hashed_password=get_password_hash("password123"),
                allergies=["Peanuts", "Penicillin"],
                blood_type="O+",
                height_cm=175.0,
                weight_kg=70.0
            )
            db.add(test_user)
            print(f"Test user created: {test_email} / password123")
        
        db.commit()
        print("Database seeding completed successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


# Export for use in API
__all__ = ['seed_database', 'COMMON_SYMPTOMS', 'COMMON_POSITIVE_EFFECTS', 'MEDICATIONS_SIDE_EFFECTS']
