import { EmergencyAnalysis, EmergencyType, TriageInput } from '../../types';
import { MEDICAL_DISCLAIMER } from '../../utils/constants';
import { clamp } from '../../utils/helpers';
import { PROTOCOLS, getProtocol, toFirstAidSteps } from './emergencyProtocols';
import { classifySeverity } from './severityClassifier';
import { levelFromSeverity, recommendedCareForLevel } from './riskScoring';

interface ProtocolScore {
  type: EmergencyType;
  score: number;
  matched: string[];
}

/** Score every protocol against the free-text description. */
const scoreProtocols = (text: string): ProtocolScore[] => {
  const lower = ` ${text.toLowerCase()} `;
  return PROTOCOLS.map((protocol) => {
    let score = 0;
    const matched: string[] = [];
    for (const signal of protocol.signals) {
      if (lower.includes(signal.term.toLowerCase())) {
        score += signal.weight;
        matched.push(signal.term);
      }
    }
    return { type: protocol.type, score, matched };
  }).sort((a, b) => b.score - a.score);
};

/** Derive a base confidence from match strength and how decisive the top match is. */
const deriveConfidence = (scores: ProtocolScore[]): number => {
  const top = scores[0];
  if (!top || top.score === 0) return 45; // nothing matched -> low confidence
  const runnerUp = scores[1]?.score ?? 0;
  const margin = top.score - runnerUp;
  const base = 55 + Math.min(top.score * 4, 34); // strength component
  const decisiveness = Math.min(margin * 2, 8); // clarity component
  return clamp(Math.round(base + decisiveness), 45, 95);
};

/**
 * Deterministic, rule-based triage engine.
 * Used as the offline fallback when Gemini is unavailable, and as a safety
 * cross-check for Gemini output. Produces a complete, actionable analysis.
 */
export const runTriageEngine = (input: TriageInput): EmergencyAnalysis => {
  const text = (input.text ?? '').trim();
  const scores = scoreProtocols(text);
  const top = scores[0];
  const type: EmergencyType = top && top.score > 0 ? top.type : 'general';
  const protocol = getProtocol(type);

  let confidence = deriveConfidence(scores);

  // An image was supplied but the offline engine has no vision capability.
  const imageNote = input.image
    ? ' An image was provided but automated visual analysis requires the AI service; assessment is based on the text description.'
    : '';
  if (input.image) confidence = clamp(confidence - 5, 40, 95);

  const { severity, confidence: adjustedConfidence, reason } = classifySeverity({
    severity: protocol.baseSeverity,
    confidence,
    text,
  });

  const reasoning =
    `Matched the "${protocol.label}" protocol based on the reported symptoms` +
    (top && top.matched.length
      ? ` (signals: ${top.matched.slice(0, 4).join(', ')}).`
      : ' (no specific red-flag signals detected).') +
    ` ${reason}${imageNote}`;

  const riskLevel = levelFromSeverity(severity);
  const defaultScore: Record<string, number> = { critical: 85, urgent: 62, moderate: 38, mild: 15 };

  return {
    primaryEmergency: protocol.label,
    emergencyType: type,
    severity,
    riskLevel,
    riskScore: defaultScore[severity] ?? 40,
    confidence: adjustedConfidence,
    possibleConditions: protocol.conditions,
    actions: protocol.actions.map((action, i) => ({ priority: i + 1, action })),
    firstAid: toFirstAidSteps(protocol.firstAid),
    redFlags: protocol.redFlags,
    medicines: protocol.medicines,
    recommendedCare: recommendedCareForLevel(riskLevel),
    hospitalRequired: protocol.hospitalRequired || severity === 'critical' || severity === 'urgent',
    ambulanceRequired: protocol.ambulanceRequired || severity === 'critical',
    reasoning,
    disclaimer: MEDICAL_DISCLAIMER,
    source: 'fallback',
  };
};

export default runTriageEngine;
