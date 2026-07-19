import { Severity, EmergencyType, RiskLevel, ImageCategory, HospitalCategory } from '../types';

export const EMERGENCY_NUMBERS = {
  ambulance: '108',
  unified: '112',
  police: '100',
  fire: '101',
  poison: '1066',
};

/* ── Developer / portfolio ────────────────────────────────────────────────── */

/** Single source of truth for the developer's identity and portfolio links. */
export const DEVELOPER = {
  name: 'Rakesh Sivala',
  roles: ['Full Stack Developer', 'AI & MERN Stack Developer'],
  github: 'https://github.com/raki225',
  linkedin: 'https://www.linkedin.com/in/rakesh-sivala-51a7b9313/',
  email: 'rakirakesh901422@gmail.com',
} as const;

export type SocialKey = 'github' | 'linkedin' | 'email';

export interface SocialLink {
  key: SocialKey;
  label: string;
  /** Fully-qualified href (https:// for profiles, mailto: for email). */
  href: string;
  /** External links open in a new tab; mailto does not. */
  external: boolean;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { key: 'github', label: 'GitHub', href: DEVELOPER.github, external: true },
  { key: 'linkedin', label: 'LinkedIn', href: DEVELOPER.linkedin, external: true },
  { key: 'email', label: 'Email', href: `mailto:${DEVELOPER.email}`, external: false },
];

export const MEDICAL_DISCLAIMER =
  'This assessment is an AI decision-support tool and is not a medical diagnosis. If symptoms ' +
  'worsen or you suspect a life-threatening emergency, call 108 or 112 immediately.';

export const IMAGE_DISCLAIMER =
  'This image analysis is an AI-assisted assessment and is not a confirmed medical diagnosis. ' +
  'Seek professional medical care if symptoms are severe, worsening, or if you suspect an emergency.';

interface SeverityMeta {
  label: string;
  color: string;
  bg: string;
  ring: string;
  text: string;
  description: string;
  timeframe: string;
}

export const SEVERITY_META: Record<Severity, SeverityMeta> = {
  critical: {
    label: 'CRITICAL',
    color: '#DC2626',
    bg: 'bg-severity-critical',
    ring: 'ring-severity-critical',
    text: 'text-severity-critical',
    description: 'Immediately life-threatening',
    timeframe: 'Call emergency services NOW',
  },
  urgent: {
    label: 'URGENT',
    color: '#FF6B35',
    bg: 'bg-severity-urgent',
    ring: 'ring-severity-urgent',
    text: 'text-severity-urgent',
    description: 'Serious — needs prompt care',
    timeframe: 'Medical attention within 1 hour',
  },
  moderate: {
    label: 'MODERATE',
    color: '#F5A623',
    bg: 'bg-severity-moderate',
    ring: 'ring-severity-moderate',
    text: 'text-severity-moderate',
    description: 'Should be evaluated soon',
    timeframe: 'Medical attention within 24 hours',
  },
  mild: {
    label: 'MILD',
    color: '#22C55E',
    bg: 'bg-severity-mild',
    ring: 'ring-severity-mild',
    text: 'text-severity-mild',
    description: 'Manageable with monitoring',
    timeframe: 'Home care & observation',
  },
};

export interface RiskLevelMeta {
  label: string;
  color: string;
  emoji: string;
  description: string;
  action: string;
}

/** User-facing 4-level risk bands (product spec). */
export const RISK_LEVEL_META: Record<RiskLevel, RiskLevelMeta> = {
  emergency: {
    label: 'EMERGENCY',
    color: '#DC2626',
    emoji: '🔴',
    description: 'Life-threatening',
    action: 'Call 108 / 112 immediately',
  },
  urgent: {
    label: 'URGENT',
    color: '#FF6B35',
    emoji: '🟠',
    description: 'Needs medical assessment within 2–4 hours',
    action: 'Go to the nearest emergency department',
  },
  moderate: {
    label: 'MODERATE',
    color: '#F5A623',
    emoji: '🟡',
    description: 'Visit a doctor within 24 hours',
    action: 'Book a doctor or clinic visit',
  },
  low: {
    label: 'LOW',
    color: '#22C55E',
    emoji: '🟢',
    description: 'Minor — home care & monitoring',
    action: 'Monitor symptoms at home',
  },
};

export const EMERGENCY_TYPE_LABEL: Record<EmergencyType, string> = {
  cardiac: 'Cardiac',
  respiratory: 'Respiratory',
  neurological: 'Neurological',
  trauma: 'Trauma / Injury',
  bleeding: 'Bleeding',
  burn: 'Burn',
  poisoning: 'Poisoning',
  allergic: 'Allergic',
  heat: 'Heat-related',
  diabetic: 'Diabetic',
  abdominal: 'Abdominal',
  dermatological: 'Skin / Visible',
  general: 'General',
};

export const EMERGENCY_TYPE_ICON: Record<EmergencyType, string> = {
  cardiac: '🫀',
  respiratory: '🫁',
  neurological: '🧠',
  trauma: '🦴',
  bleeding: '🩸',
  burn: '🔥',
  poisoning: '☠️',
  allergic: '🐝',
  heat: '🌡️',
  diabetic: '💉',
  abdominal: '🩹',
  dermatological: '🔬',
  general: '🩺',
};

/* ── Image condition categories (23 supported types) ──────────────────────── */

export interface ImageCategoryMeta {
  label: string;
  emoji: string;
}

export const IMAGE_CATEGORY_META: Record<ImageCategory, ImageCategoryMeta> = {
  skin_rash: { label: 'Skin Rash', emoji: '🌡️' },
  skin_allergy: { label: 'Skin Allergy', emoji: '🌼' },
  burn: { label: 'Burn', emoji: '🔥' },
  cut: { label: 'Cut', emoji: '🔪' },
  bruise: { label: 'Bruise', emoji: '🟣' },
  swelling: { label: 'Swelling', emoji: '🎈' },
  insect_bite: { label: 'Insect Bite', emoji: '🦟' },
  animal_bite: { label: 'Animal Bite', emoji: '🐕' },
  eye_redness: { label: 'Eye Redness', emoji: '👁️' },
  lip_swelling: { label: 'Lip Swelling', emoji: '👄' },
  hand_infection: { label: 'Hand Infection', emoji: '✋' },
  foot_infection: { label: 'Foot Infection', emoji: '🦶' },
  nail_infection: { label: 'Nail Infection', emoji: '💅' },
  mouth_ulcer: { label: 'Mouth Ulcer', emoji: '👅' },
  wound: { label: 'Visible Wound', emoji: '🩹' },
  bleeding: { label: 'Bleeding', emoji: '🩸' },
  skin_infection: { label: 'Skin Infection', emoji: '🦠' },
  chickenpox_rash: { label: 'Chickenpox-like Rash', emoji: '🔴' },
  fungal_infection: { label: 'Fungal Infection', emoji: '🍄' },
  cellulitis: { label: 'Cellulitis', emoji: '🔴' },
  acne: { label: 'Acne', emoji: '🧴' },
  boil: { label: 'Boil', emoji: '🔴' },
  blister: { label: 'Blister', emoji: '💧' },
  other: { label: 'Other Visible Condition', emoji: '🔍' },
};

/** Ordered list for the "what are you showing?" picker. */
export const IMAGE_CATEGORY_ORDER: ImageCategory[] = [
  'skin_rash', 'skin_allergy', 'burn', 'cut', 'bruise', 'swelling', 'insect_bite', 'animal_bite',
  'eye_redness', 'lip_swelling', 'hand_infection', 'foot_infection', 'nail_infection',
  'mouth_ulcer', 'wound', 'bleeding', 'skin_infection', 'chickenpox_rash', 'fungal_infection',
  'cellulitis', 'acne', 'boil', 'blister', 'other',
];

/* ── Hospital filters ─────────────────────────────────────────────────────── */

export const HOSPITAL_TYPE_FILTERS = [
  { key: 'all', label: 'All', emoji: '🏥' },
  { key: 'government', label: 'Government', emoji: '🏛️' },
  { key: 'private', label: 'Private', emoji: '🏢' },
] as const;

export const SERVICE_FILTERS = [
  { key: 'all', label: 'All Services', emoji: '🩺' },
  { key: 'emergency', label: 'Emergency', emoji: '🚨' },
  { key: 'cardiology', label: 'Cardiology', emoji: '🫀' },
  { key: 'neurology', label: 'Neurology', emoji: '🧠' },
  { key: 'orthopedic', label: 'Orthopedic', emoji: '🦴' },
  { key: 'pulmonology', label: 'Pulmonology', emoji: '🫁' },
  { key: 'pediatrics', label: 'Pediatrics', emoji: '👶' },
  { key: 'general', label: 'General Medicine', emoji: '🩺' },
  { key: 'icu', label: 'ICU', emoji: '🏥' },
  { key: 'ventilator', label: 'Ventilator', emoji: '💨' },
  { key: 'blood_bank', label: 'Blood Bank', emoji: '🩸' },
  { key: 'ambulance', label: 'Ambulance', emoji: '🚑' },
  { key: 'women', label: "Women's", emoji: '👩' },
  { key: 'children', label: "Children's", emoji: '🧒' },
  { key: 'trauma', label: 'Trauma Center', emoji: '🚑' },
  { key: 'burn', label: 'Burn Unit', emoji: '🔥' },
  { key: 'dialysis', label: 'Dialysis', emoji: '💧' },
] as const;

export const HOSPITAL_CATEGORY_LABEL: Record<HospitalCategory, string> = {
  government: 'Government',
  private: 'Private',
  phc: 'Primary Health Centre',
  chc: 'Community Health Centre',
  medical_college: 'Medical College',
  district: 'District Hospital',
  multi_speciality: 'Multi-Speciality',
  super_speciality: 'Super-Speciality',
  clinic: 'Clinic',
  unknown: 'Hospital',
};

export const RADIUS_STEPS = [5, 10, 25, 50, 100];
