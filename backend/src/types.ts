/**
 * Shared domain types for the RescueAI triage engine.
 */

export type Severity = 'critical' | 'urgent' | 'moderate' | 'mild';

/** User-facing 4-level risk band (maps 1:1 to Severity). */
export type RiskLevel = 'emergency' | 'urgent' | 'moderate' | 'low';

export type EmergencyType =
  | 'cardiac'
  | 'respiratory'
  | 'neurological'
  | 'trauma'
  | 'bleeding'
  | 'burn'
  | 'poisoning'
  | 'allergic'
  | 'heat'
  | 'diabetic'
  | 'abdominal'
  | 'dermatological'
  | 'general';

export interface PossibleCondition {
  condition: string;
  probability: number;
}

export interface TriageAction {
  priority: number;
  action: string;
}

export interface FirstAidStep {
  step: number;
  instruction: string;
}

/** A vetted, self-care medicine/tablet suggestion shown alongside triage results. */
export interface MedicineSuggestion {
  /** Common brand/generic name, e.g. "Paracetamol (Crocin / Dolo)". */
  name: string;
  /** What it is for / when it helps. */
  purpose: string;
  /** General, label-level dosage guidance (optional). */
  dosage?: string;
  /** Important safety caveat for a layperson. */
  caution?: string;
  /**
   * otc          — safe over-the-counter self-care tablet
   * prescription — only if already prescribed to this specific person
   * avoid        — explicitly do NOT give (shown as a warning)
   */
  category: 'otc' | 'prescription' | 'avoid';
}

/* ────────────────────────────────────────────────────────────────────────
 *  Adaptive follow-up questions + risk scoring
 * ──────────────────────────────────────────────────────────────────────── */

export type QuestionKind = 'single' | 'multi' | 'boolean' | 'scale' | 'number' | 'text';

export interface QuestionOption {
  value: string;
  label: string;
  /** Points added to the risk score when this option is chosen. */
  points?: number;
  /** When true, choosing this option is a red flag that forces EMERGENCY. */
  redFlag?: boolean;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  kind: QuestionKind;
  options?: QuestionOption[];
  /** For `scale`/`number` questions. */
  min?: number;
  max?: number;
  /** Points per scale bucket, evaluated for `scale`/`number` answers. */
  scalePoints?: { upTo: number; points: number; redFlag?: boolean }[];
  helpText?: string;
  /** Icon/emoji shown beside the question in the UI. */
  emoji?: string;
}

export interface FollowUpAnswer {
  id: string;
  value: string | number | boolean | string[];
}

export interface RiskContribution {
  label: string;
  points: number;
}

export interface RiskScoreResult {
  score: number; // 0–100
  level: RiskLevel;
  severity: Severity;
  contributions: RiskContribution[];
  redFlagTriggered: boolean;
}

/* ────────────────────────────────────────────────────────────────────────
 *  Medical image analysis
 * ──────────────────────────────────────────────────────────────────────── */

/** Machine key of the visible condition category detected/selected. */
export type ImageCategory =
  | 'skin_rash'
  | 'skin_allergy'
  | 'burn'
  | 'cut'
  | 'bruise'
  | 'swelling'
  | 'insect_bite'
  | 'animal_bite'
  | 'eye_redness'
  | 'lip_swelling'
  | 'hand_infection'
  | 'foot_infection'
  | 'nail_infection'
  | 'mouth_ulcer'
  | 'wound'
  | 'bleeding'
  | 'skin_infection'
  | 'chickenpox_rash'
  | 'fungal_infection'
  | 'cellulitis'
  | 'acne'
  | 'boil'
  | 'blister'
  | 'other';

export interface ImageQuality {
  acceptable: boolean;
  /** e.g. 'blurry', 'too_dark', 'too_bright', 'no_subject', 'too_small'. */
  issues: string[];
  message: string;
  brightness?: number;
  sharpness?: number;
}

export interface ImageFindings {
  redness: boolean;
  swelling: boolean;
  skinColor: string;
  blisters: boolean;
  openWound: boolean;
  bleeding: boolean;
  rashDistribution: string;
  size: string;
  shape: string;
  burnSeverity: string;
  infectionSigns: boolean;
  notes: string[];
}

export interface ImageAnalysis {
  category: ImageCategory;
  categoryLabel: string;
  findings: ImageFindings;
  possibleConditions: PossibleCondition[];
  confidence: number;
  quality: ImageQuality;
  source: 'gemini' | 'fallback';
}

/* ────────────────────────────────────────────────────────────────────────
 *  Core analysis result
 * ──────────────────────────────────────────────────────────────────────── */

export interface EmergencyAnalysis {
  primaryEmergency: string;
  emergencyType: EmergencyType;
  severity: Severity;
  /** User-facing risk band derived from severity/score. */
  riskLevel: RiskLevel;
  /** 0–100 composite risk score. */
  riskScore: number;
  confidence: number;
  possibleConditions: PossibleCondition[];
  actions: TriageAction[];
  firstAid: FirstAidStep[];
  redFlags: string[];
  /** Vetted OTC / self-care medicine suggestions (may include "avoid" warnings). */
  medicines: MedicineSuggestion[];
  /** Concrete "what to do" recommendation, e.g. "Call 108/112 now". */
  recommendedCare: string;
  hospitalRequired: boolean;
  ambulanceRequired: boolean;
  reasoning: string;
  /** Present when an image was part of the assessment. */
  imageFindings?: ImageFindings;
  detectedCategory?: string;
  riskContributions?: RiskContribution[];
  disclaimer: string;
  source: 'gemini' | 'fallback';
}

export interface TriageInput {
  text: string;
  image?: string; // base64 data URL or raw base64
  imageCategory?: ImageCategory;
  answers?: FollowUpAnswer[];
  category?: string;
  location?: { lat: number; lng: number };
}

/* ────────────────────────────────────────────────────────────────────────
 *  Geocoding + places
 * ──────────────────────────────────────────────────────────────────────── */

export interface LocationDetails {
  lat: number;
  lng: number;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
  formatted: string;
  accuracyMeters?: number;
}

export type HospitalCategory =
  | 'government'
  | 'private'
  | 'phc'
  | 'chc'
  | 'medical_college'
  | 'district'
  | 'multi_speciality'
  | 'super_speciality'
  | 'clinic'
  | 'unknown';

export interface PlaceHospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating: number;
  category: HospitalCategory;
  ownership: 'government' | 'private' | 'unknown';
  emergencyServices: boolean;
  is24x7: boolean;
  services: string[];
  specialties: string[];
  lat: number;
  lng: number;
  distanceKm: number;
  etaMinutes: number;
  availability: {
    beds: number;
    emergencyBeds: number;
    icuBeds: number;
    ventilators: number;
    ambulances: number;
  };
  source: 'live' | 'seed';
}
