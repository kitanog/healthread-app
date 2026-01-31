// ============================================================
// HEALTHREAD ONTOLOGY TYPES
// TypeScript types matching the backend ontology
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  // Profile / Baseline Metrics
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  height_cm?: number;
  weight_kg?: number;
  allergies: string[];
  medical_conditions: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface UserProfileUpdate {
  name?: string;
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  height_cm?: number;
  weight_kg?: number;
  allergies?: string[];
  medical_conditions?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

// ============================================================
// REFERENCE DATA TYPES
// ============================================================

export interface ReferenceMedication {
  id: string;
  name: string;
  generic_name?: string;
  drug_class?: string;
  common_uses: string[];
}

export interface ReferenceSymptom {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

export interface ReferencePositiveEffect {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

export interface ReferenceFood {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  serving_size?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  diet_tags: string[];
  allergens: string[];
  barcode?: string;
}

// ============================================================
// ENUMS
// ============================================================

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beverage' | 'supplement';

export type DietType =
  | 'standard'
  | 'keto'
  | 'low_carb'
  | 'vegan'
  | 'vegetarian'
  | 'paleo'
  | 'mediterranean'
  | 'gluten_free'
  | 'dairy_free'
  | 'low_sodium'
  | 'diabetic_friendly';

// Common allergens
export const COMMON_ALLERGENS = [
  'dairy',
  'eggs',
  'fish',
  'shellfish',
  'tree_nuts',
  'peanuts',
  'wheat',
  'gluten',
  'soy',
  'sesame',
  'sulfites',
  'corn',
  'nightshades'
] as const;

export type Allergen = typeof COMMON_ALLERGENS[number];

// ============================================================
// CORE TYPES
// ============================================================

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  times: string[];
  prescribed_for?: string;
  start_date: string;
  end_date?: string;
  active: boolean;
  notes?: string;
  created_at: string;
}

export interface SideEffect {
  id: string;
  medication_name: string;
  effect_name: string;
  frequency: 'common' | 'uncommon' | 'rare' | 'very_rare';
  frequency_percentage?: number;
  description?: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface SymptomLog {
  id: string;
  user_id: string;
  timestamp: string;
  symptom_name: string;
  severity: 1 | 2 | 3 | 4 | 5;
  duration_minutes?: number;
  notes?: string;
  matches_known_side_effect: boolean;
  matched_side_effect_ids: string[];
  created_at: string;
  associated_medications: Medication[];
}

export interface PositiveEffect {
  id: string;
  user_id: string;
  timestamp: string;
  effect_name: string;
  notes?: string;
  created_at: string;
  associated_medications: Medication[];
}

export interface FoodLog {
  id: string;
  user_id: string;
  timestamp: string;
  name: string;
  brand?: string;
  meal_category: MealCategory;
  serving_size?: string;
  servings: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  diet_tags: string[];
  allergens: string[];
  had_reaction: boolean;
  reaction_severity?: 1 | 2 | 3 | 4 | 5;
  reaction_notes?: string;
  notes?: string;
  barcode?: string;
  created_at: string;
  associated_medications: Medication[];
}

export interface DailyNutritionSummary {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  total_sugar_g: number;
  total_sodium_mg: number;
  meals_count: number;
  foods_with_reactions: number;
}

export interface FoodReactionSummary {
  food_name: string;
  reaction_count: number;
  avg_severity: number;
  last_reaction: string;
  common_symptoms: string[];
}

export interface HealthReport {
  id: string;
  user_id: string;
  created_at: string;
  date_range_start: string;
  date_range_end: string;
  report_data: ReportData;
  share_token?: string;
  share_expires_at?: string;
}

export interface ReportData {
  patient: {
    name: string;
    id: string;
  };
  date_range: {
    start: string;
    end: string;
  };
  summary: {
    days_tracked: number;
    active_medications: number;
    total_symptoms: number;
    total_positive_effects: number;
  };
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    start_date: string;
    active: boolean;
  }[];
  symptoms: {
    symptom_name: string;
    count: number;
    avg_severity: number;
    matches_side_effect: boolean;
    matched_medication?: string;
  }[];
  positive_effects: {
    effect_name: string;
    count: number;
  }[];
  ai_insights?: {
    type: string;
    title: string;
    content: string;
  }[];
}

export interface AIInsight {
  id: string;
  user_id: string;
  generated_at: string;
  insight_type: 'summary' | 'recommendation' | 'correlation' | 'warning';
  title: string;
  content: string;
  confidence: number;
  based_on: Record<string, unknown>;
}

// ============================================================
// DASHBOARD TYPES
// ============================================================

export interface DashboardStats {
  positive_effects_count: number;
  positive_effects_trend: number;
  symptoms_count: number;
  symptoms_trend: number;
  active_medications: number;
  days_tracked: number;
  // Food tracking stats
  todays_calories: number;
  foods_logged_today: number;
  foods_with_reactions: number;
}

export interface TrendDataPoint {
  date: string;
  symptoms: number;
  positive_effects: number;
  avg_severity?: number;
}

export interface SideEffectAlert {
  symptom: string;
  medication: string;
  frequency: string;
  frequency_pct?: number;
  severity: string;
  timestamp: string;
}

export interface RecentActivity {
  type: 'symptom' | 'positive_effect';
  id: string;
  name: string;
  severity?: number;
  timestamp: string;
  matches_side_effect?: boolean;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_activity: RecentActivity[];
  trends: TrendDataPoint[];
  side_effect_alerts: SideEffectAlert[];
  medications: Medication[];
}

// ============================================================
// API REQUEST/RESPONSE TYPES
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface MedicationCreateRequest {
  name: string;
  dosage: string;
  frequency: string;
  times?: string[];
  prescribed_for?: string;
  start_date: string;
  generic_name?: string;
  notes?: string;
}

export interface SymptomLogCreateRequest {
  symptom_name: string;
  severity: number;
  duration_minutes?: number;
  notes?: string;
  timestamp?: string;
  associated_medication_ids?: string[];
}

export interface PositiveEffectCreateRequest {
  effect_name: string;
  notes?: string;
  timestamp?: string;
  associated_medication_ids?: string[];
}

export interface FoodLogCreateRequest {
  name: string;
  brand?: string;
  meal_category: MealCategory;
  serving_size?: string;
  servings?: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  diet_tags?: string[];
  allergens?: string[];
  notes?: string;
  barcode?: string;
  timestamp?: string;
  associated_medication_ids?: string[];
  had_reaction?: boolean;
  reaction_severity?: number;
  reaction_notes?: string;
}

export interface FoodLogUpdateRequest {
  name?: string;
  brand?: string;
  meal_category?: MealCategory;
  serving_size?: string;
  servings?: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  diet_tags?: string[];
  allergens?: string[];
  notes?: string;
  had_reaction?: boolean;
  reaction_severity?: number;
  reaction_notes?: string;
}

export interface ReportCreateRequest {
  date_range: {
    start: string;
    end: string;
  };
  include_ai_insights: boolean;
}
