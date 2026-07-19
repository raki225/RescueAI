import { Severity } from '../types';

/** India-first emergency contact numbers. */
export const EMERGENCY_NUMBERS = {
  ambulance: '108',
  unified: '112',
  police: '100',
  fire: '101',
  women: '1091',
  poison: '1066',
} as const;

export const MEDICAL_DISCLAIMER =
  'This assessment is an AI decision-support tool and is not a medical diagnosis. If symptoms ' +
  'worsen or you suspect a life-threatening emergency, call 108 or 112 immediately.';

/** Ordered from most to least urgent. */
export const SEVERITY_ORDER: Severity[] = ['critical', 'urgent', 'moderate', 'mild'];

export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 4,
  urgent: 3,
  moderate: 2,
  mild: 1,
};

/**
 * Keywords that always force a CRITICAL classification — safety-first escalation.
 * These map to immediately life-threatening presentations.
 */
export const CRITICAL_KEYWORDS: string[] = [
  'unconscious',
  'not breathing',
  'no pulse',
  'cardiac arrest',
  'chest pain',
  'heart attack',
  'stroke',
  'seizure',
  'severe bleeding',
  'heavy bleeding',
  'choking',
  'drowning',
  'anaphylaxis',
  'suicide',
  'overdose',
  'gunshot',
  'stab',
];

/** Confidence threshold below which we escalate severity for safety. */
export const LOW_CONFIDENCE_THRESHOLD = 60;

/** Average urban ambulance/road speed used for rough ETA estimates (km/h). */
export const AVG_SPEED_KMH = 30;
