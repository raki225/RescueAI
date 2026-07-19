export type Severity = 'critical' | 'urgent' | 'moderate' | 'mild';
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

export interface MedicineSuggestion {
  name: string;
  purpose: string;
  dosage?: string;
  caution?: string;
  category: 'otc' | 'prescription' | 'avoid';
}

export interface RiskContribution {
  label: string;
  points: number;
}

/* ── Adaptive follow-up questions ─────────────────────────────────────────── */

export type QuestionKind = 'single' | 'multi' | 'boolean' | 'scale' | 'number' | 'text';

export interface QuestionOption {
  value: string;
  label: string;
  points?: number;
  redFlag?: boolean;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  kind: QuestionKind;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  scalePoints?: { upTo: number; points: number; redFlag?: boolean }[];
  helpText?: string;
  emoji?: string;
}

export interface FollowUpAnswer {
  id: string;
  value: string | number | boolean | string[];
}

/* ── Image analysis ───────────────────────────────────────────────────────── */

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

/* ── Core analysis ────────────────────────────────────────────────────────── */

export interface EmergencyAnalysis {
  primaryEmergency: string;
  emergencyType: EmergencyType;
  severity: Severity;
  riskLevel: RiskLevel;
  riskScore: number;
  confidence: number;
  possibleConditions: PossibleCondition[];
  actions: TriageAction[];
  firstAid: FirstAidStep[];
  redFlags: string[];
  medicines: MedicineSuggestion[];
  recommendedCare: string;
  hospitalRequired: boolean;
  ambulanceRequired: boolean;
  reasoning: string;
  imageFindings?: ImageFindings;
  detectedCategory?: string;
  riskContributions?: RiskContribution[];
  disclaimer: string;
  source: 'gemini' | 'fallback';
}

export interface TriageResult {
  sessionId: string;
  analysis: EmergencyAnalysis;
  imageAnalysis?: ImageAnalysis;
  createdAt?: string;
}

export interface QuestionsResponse {
  category: string;
  categoryLabel: string;
  emoji: string;
  questions: FollowUpQuestion[];
  imageAnalysis?: ImageAnalysis;
}

/* ── Location + hospitals ─────────────────────────────────────────────────── */

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  accuracyMeters?: number;
}

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

export interface Hospital {
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

export interface FirstAidGuide {
  type: EmergencyType;
  label: string;
  steps: string[];
  redFlags: string[];
}

export interface EmergencyReport {
  reportId: string;
  sessionId: string;
  patientInfo: {
    name: string;
    age?: number;
    gender: string;
    preexistingConditions: string[];
  };
  incident: {
    description: string;
    timestamp: string;
    location: string;
  };
  severity: Severity;
  confidence: number;
  aiAnalysis: string;
  possibleConditions: PossibleCondition[];
  recommendedActions: string[];
  firstAidSteps: string[];
  hospitalDestination: {
    name: string;
    address: string;
    phone: string;
    distanceKm?: number;
  };
  reportGenerated: string;
}
