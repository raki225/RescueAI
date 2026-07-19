import { Severity } from '../../types';
import {
  CRITICAL_KEYWORDS,
  LOW_CONFIDENCE_THRESHOLD,
  SEVERITY_ORDER,
  SEVERITY_RANK,
} from '../../utils/constants';
import { clamp } from '../../utils/helpers';

export interface SeverityInput {
  severity: Severity;
  confidence: number;
  text: string;
}

export interface SeverityResult {
  severity: Severity;
  confidence: number;
  reason: string;
  escalated: boolean;
}

/** Phrases that intensify severity even without a hard critical keyword. */
const ESCALATION_MODIFIERS = [
  'severe',
  'suddenly',
  'sudden',
  'worst',
  'getting worse',
  'rapidly',
  'profuse',
  'uncontrolled',
  'passed out',
  'blue lips',
  'cannot move',
  "can't move",
];

const escalate = (severity: Severity, steps = 1): Severity => {
  const idx = SEVERITY_ORDER.indexOf(severity);
  const next = clamp(idx - steps, 0, SEVERITY_ORDER.length - 1);
  return SEVERITY_ORDER[next] as Severity;
};

/**
 * Post-processes any severity assessment (from Gemini OR the fallback engine)
 * with deterministic, safety-biased rules. We never de-escalate — only raise
 * urgency when the evidence warrants it. This is the "AI makes a decision, then
 * we verify it" safety layer.
 */
export const classifySeverity = (input: SeverityInput): SeverityResult => {
  const text = input.text.toLowerCase();
  let severity = input.severity;
  let confidence = clamp(Math.round(input.confidence), 0, 100);
  const reasons: string[] = [];
  let escalated = false;

  // 1. Hard critical keywords always force CRITICAL.
  const matchedCritical = CRITICAL_KEYWORDS.filter((k) => text.includes(k));
  if (matchedCritical.length > 0) {
    if (SEVERITY_RANK[severity] < SEVERITY_RANK.critical) {
      severity = 'critical';
      escalated = true;
    }
    confidence = clamp(confidence + 10, 0, 100);
    reasons.push(`Critical indicator detected: "${matchedCritical[0]}".`);
  }

  // 2. Escalation modifiers bump severity up one level.
  const matchedModifier = ESCALATION_MODIFIERS.find((m) => text.includes(m));
  if (matchedModifier && severity !== 'critical') {
    severity = escalate(severity, 1);
    escalated = true;
    reasons.push(`Symptom intensifier detected: "${matchedModifier}".`);
  }

  // 3. Low confidence widens caution but never manufactures urgency on its own.
  //    Uncertainty nudges MILD → MODERATE (a single gentle step) so a vague or
  //    unmatched symptom is reviewed, but it must NOT jump straight to URGENT or
  //    EMERGENCY. Real escalation only comes from critical keywords (rule 1),
  //    intensifier modifiers (rule 2), or red-flag follow-up answers downstream.
  //    This is what stops "every symptom becomes URGENT" in the offline engine.
  if (confidence < LOW_CONFIDENCE_THRESHOLD && severity === 'mild') {
    severity = 'moderate';
    escalated = true;
    reasons.push('Assessment is uncertain — nudged to MODERATE as a mild precaution; answer the follow-up questions for an accurate level.');
  }

  if (reasons.length === 0) {
    reasons.push('Assessment consistent with reported symptoms.');
  }

  // Medical humility: never present absolute certainty.
  confidence = clamp(confidence, 0, 97);

  return { severity, confidence, reason: reasons.join(' '), escalated };
};

export default classifySeverity;
