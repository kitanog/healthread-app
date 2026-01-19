# Healthread V1 Architecture

## Philosophy

This architecture follows three core principles:

1. **Palantir Foundry Ontology** - Data as first-class citizens with semantic relationships
2. **Brett Victor's Design** - Immediate feedback, direct manipulation, visible state
3. **P-Plan Methodology** - Provenance-aware, reproducible workflows

---

## Ontology Model

### Core Object Types

```
┌─────────────────────────────────────────────────────────────────┐
│                     HEALTHREAD ONTOLOGY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐      takes        ┌────────────┐                  │
│  │  User   │─────────────────▶│ Medication │                   │
│  └────┬────┘                   └─────┬──────┘                   │
│       │                              │                          │
│       │ logs                         │ has_known                │
│       ▼                              ▼                          │
│  ┌─────────┐    correlates    ┌────────────┐                   │
│  │SymptomLog│◀───────────────▶│ SideEffect │                   │
│  └────┬────┘                   └────────────┘                   │
│       │                                                         │
│       │ contrasts                                               │
│       ▼                                                         │
│  ┌──────────────┐                                               │
│  │PositiveEffect│                                               │
│  └──────────────┘                                               │
│                                                                 │
│  ┌─────────────┐   generated_from   ┌──────────────┐           │
│  │ HealthReport│◀──────────────────│ AI Insight   │            │
│  └─────────────┘                    └──────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Object Definitions

#### User
```typescript
interface User {
  id: string;                    // UUID
  email: string;
  name: string;
  created_at: timestamp;
  profile: {
    date_of_birth?: date;
    blood_type?: string;
    height_cm?: number;
    weight_kg?: number;
    allergies?: string[];
  };
}
```

#### Medication
```typescript
interface Medication {
  id: string;
  user_id: string;               // Link to User
  name: string;                  // e.g., "Metformin"
  generic_name?: string;         // e.g., "metformin hydrochloride"
  dosage: string;                // e.g., "500mg"
  frequency: string;             // e.g., "twice daily"
  times?: string[];              // e.g., ["08:00", "20:00"]
  prescribed_for?: string;       // e.g., "Type 2 Diabetes"
  start_date: date;
  end_date?: date;
  active: boolean;
  notes?: string;
  
  // Linked known side effects (from reference data)
  known_side_effects: SideEffect[];
}
```

#### SideEffect (Reference Data)
```typescript
interface SideEffect {
  id: string;
  medication_name: string;       // Canonical medication name
  effect_name: string;           // e.g., "Nausea"
  frequency: 'common' | 'uncommon' | 'rare' | 'very_rare';
  frequency_percentage?: number; // e.g., 0.25 for 25%
  description?: string;
  severity: 'mild' | 'moderate' | 'severe';
}
```

#### SymptomLog
```typescript
interface SymptomLog {
  id: string;
  user_id: string;
  timestamp: timestamp;
  symptom_name: string;          // e.g., "Nausea"
  severity: 1 | 2 | 3 | 4 | 5;   // 1=minimal, 5=severe
  duration_minutes?: number;
  notes?: string;
  
  // Links
  associated_medications: string[];  // Medication IDs
  
  // Computed (by system)
  matches_known_side_effect: boolean;
  matched_side_effects: SideEffect[];
}
```

#### PositiveEffect
```typescript
interface PositiveEffect {
  id: string;
  user_id: string;
  timestamp: timestamp;
  effect_name: string;           // e.g., "Improved energy"
  notes?: string;
  
  // Links
  associated_medications: string[];
}
```

#### HealthReport
```typescript
interface HealthReport {
  id: string;
  user_id: string;
  created_at: timestamp;
  date_range: {
    start: date;
    end: date;
  };
  
  // Aggregated data
  medications: Medication[];
  symptom_summary: {
    symptom_name: string;
    count: number;
    avg_severity: number;
    matches_side_effect: boolean;
  }[];
  positive_effects_summary: {
    effect_name: string;
    count: number;
  }[];
  
  // AI-generated
  ai_insights?: AIInsight[];
  
  // Sharing
  share_token?: string;
  share_expires_at?: timestamp;
}
```

#### AIInsight
```typescript
interface AIInsight {
  id: string;
  user_id: string;
  generated_at: timestamp;
  insight_type: 'summary' | 'recommendation' | 'correlation' | 'warning';
  title: string;
  content: string;
  confidence: number;            // 0-1
  based_on: {
    symptom_logs: string[];      // IDs
    medications: string[];
    positive_effects: string[];
  };
}
```

---

## Logical Sources (Read Layer)

Following Palantir's pattern, we separate **Sources** (where data lives) from **Actions** (how data changes).

### Source: UserSource
- **Purpose**: Retrieve user profile and settings
- **Queries**: `getUser(id)`, `getUserByEmail(email)`

### Source: MedicationSource
- **Purpose**: User's medications and reference side effects
- **Queries**: 
  - `getActiveMedications(userId)`
  - `getMedicationHistory(userId)`
  - `getKnownSideEffects(medicationName)`

### Source: SymptomLogSource
- **Purpose**: User's logged symptoms
- **Queries**:
  - `getRecentSymptoms(userId, days)`
  - `getSymptomsInRange(userId, startDate, endDate)`
  - `getSymptomTrends(userId)` - aggregated

### Source: PositiveEffectSource
- **Purpose**: User's logged positive effects
- **Queries**:
  - `getRecentPositiveEffects(userId, days)`
  - `getPositiveEffectsInRange(userId, startDate, endDate)`

### Source: ReportSource
- **Purpose**: Generated health reports
- **Queries**:
  - `getReports(userId)`
  - `getReportByShareToken(token)`

### Source: InsightSource
- **Purpose**: AI-generated insights
- **Queries**:
  - `getLatestInsights(userId)`
  - `getWeeklySummary(userId)`

---

## Systems of Action (Write Layer)

Actions are the **only** way to mutate state. Each action is:
- Validated
- Logged for provenance
- Triggers downstream computations

### Action: LogSymptom
```typescript
interface LogSymptomAction {
  type: 'LOG_SYMPTOM';
  payload: {
    symptom_name: string;
    severity: 1-5;
    duration_minutes?: number;
    notes?: string;
    associated_medications?: string[];
    timestamp?: timestamp;  // defaults to now
  };
  
  // Side effects:
  // 1. Creates SymptomLog record
  // 2. Computes side effect matches
  // 3. Triggers insight regeneration (async)
}
```

### Action: LogPositiveEffect
```typescript
interface LogPositiveEffectAction {
  type: 'LOG_POSITIVE_EFFECT';
  payload: {
    effect_name: string;
    notes?: string;
    associated_medications?: string[];
    timestamp?: timestamp;
  };
}
```

### Action: AddMedication
```typescript
interface AddMedicationAction {
  type: 'ADD_MEDICATION';
  payload: {
    name: string;
    dosage: string;
    frequency: string;
    times?: string[];
    prescribed_for?: string;
    start_date: date;
    notes?: string;
  };
  
  // Side effects:
  // 1. Creates Medication record
  // 2. Links known side effects from reference data
}
```

### Action: StopMedication
```typescript
interface StopMedicationAction {
  type: 'STOP_MEDICATION';
  payload: {
    medication_id: string;
    end_date: date;
    reason?: string;
  };
}
```

### Action: GenerateReport
```typescript
interface GenerateReportAction {
  type: 'GENERATE_REPORT';
  payload: {
    date_range: { start: date; end: date };
    include_ai_insights: boolean;
  };
  
  // Side effects:
  // 1. Aggregates data from sources
  // 2. Optionally generates AI insights
  // 3. Creates HealthReport record
}
```

### Action: ShareReport
```typescript
interface ShareReportAction {
  type: 'SHARE_REPORT';
  payload: {
    report_id: string;
    expires_in_days: number;
  };
  
  // Side effects:
  // 1. Generates secure share token
  // 2. Updates report with share info
}
```

---

## Brett Victor Design Principles Applied

### 1. Immediate Feedback
- **Log Entry**: As user types symptom, show matching known side effects in real-time
- **Severity Slider**: Visual feedback with color gradient as severity increases
- **Dashboard Charts**: Update instantly when new data is logged

### 2. Direct Manipulation
- **Drag to associate**: Drag a symptom onto a medication to create association
- **Timeline scrubbing**: Scrub through time to see health state at any point
- **Inline editing**: Click any logged entry to edit in place

### 3. Visible State
- **Always show context**: Current medications visible in sidebar
- **Provenance trails**: Every insight shows "Based on X symptoms over Y days"
- **No hidden modes**: All actions available, contextually highlighted

### 4. Linked Representations
- **Dashboard ↔ Log**: Click chart point to see original log entry
- **Symptom ↔ Side Effect**: Visual connection between logged symptoms and known effects
- **Report ↔ Source Data**: Every report item links back to raw logs

---

## Technical Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + TypeScript + TailwindCSS + React Query             │
│  - Dashboard views                                           │
│  - Log entry forms                                           │
│  - Report generation                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  FastAPI (Python)                                            │
│  - /api/sources/* (read operations)                          │
│  - /api/actions/* (write operations)                         │
│  - /api/ai/* (AI features)                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                               │
│  PostgreSQL                                                  │
│  - Users, Medications, SymptomLogs, etc.                    │
│  - Full-text search for symptoms                            │
│  - Time-series optimized queries                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    REFERENCE DATA                            │
│  Side Effects Database (seeded from drugs.com / FDA)        │
│  - ~5000 common medications                                  │
│  - Known side effects with frequencies                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Docker Deployment

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    
  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [db]
    
  db:
    image: postgres:16
    volumes: [postgres_data:/var/lib/postgresql/data]
```

---

## P-Plan Provenance

Every action and computation maintains provenance:

```typescript
interface Provenance {
  action_id: string;           // Unique action execution ID
  timestamp: timestamp;
  actor: string;               // User ID or 'system'
  action_type: string;
  inputs: Record<string, any>; // What data was used
  outputs: string[];           // What records were created/modified
  parent_actions?: string[];   // For derived computations
}
```

This enables:
- **Audit trails**: See exactly how any piece of data was created
- **Reproducibility**: Re-run any computation with same inputs
- **Explainability**: AI insights link back to source data

---

## File Structure

```
healthread-app/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   └── public/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── sources/
│   │   ├── actions/
│   │   ├── api/
│   │   └── db/
│   └── seed_data/
└── docs/
    └── ARCHITECTURE.md
```
