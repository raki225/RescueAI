import {
  FollowUpAnswer,
  FollowUpQuestion,
  ImageFindings,
  RiskContribution,
  RiskLevel,
  RiskScoreResult,
  Severity,
} from '../../types';
import { clamp } from '../../utils/helpers';
import { CATEGORY_META, getQuestionsForCategory } from './followUpQuestions';

/** Score band → user-facing risk level. Mirrors the product spec exactly. */
export const riskLevelFromScore = (score: number): RiskLevel => {
  if (score >= 75) return 'emergency';
  if (score >= 50) return 'urgent';
  if (score >= 25) return 'moderate';
  return 'low';
};

export const severityFromLevel = (level: RiskLevel): Severity => {
  switch (level) {
    case 'emergency':
      return 'critical';
    case 'urgent':
      return 'urgent';
    case 'moderate':
      return 'moderate';
    default:
      return 'mild';
  }
};

export const levelFromSeverity = (severity: Severity): RiskLevel => {
  switch (severity) {
    case 'critical':
      return 'emergency';
    case 'urgent':
      return 'urgent';
    case 'moderate':
      return 'moderate';
    default:
      return 'low';
  }
};

/** Concrete "what to do now" guidance for each risk level. */
export const recommendedCareForLevel = (level: RiskLevel): string => {
  switch (level) {
    case 'emergency':
      return 'Call 108 / 112 now — this may be life-threatening. Go to the nearest emergency department.';
    case 'urgent':
      return 'Needs medical assessment within 2–4 hours. Visit the nearest emergency department or urgent care.';
    case 'moderate':
      return 'See a doctor within 24 hours. Monitor closely and seek care sooner if it worsens.';
    default:
      return 'Home care and monitoring are usually enough. Seek care if symptoms worsen or new red flags appear.';
  }
};

/** Return the more urgent of two severities (never de-escalate). */
export const higherSeverity = (a: Severity, b: Severity): Severity => {
  const rank: Record<Severity, number> = { critical: 4, urgent: 3, moderate: 2, mild: 1 };
  return rank[a] >= rank[b] ? a : b;
};

/** Minimum score implied by a severity, so image/AI severity feeds the score. */
const scoreFloorForSeverity = (severity: Severity): number => {
  switch (severity) {
    case 'critical':
      return 78;
    case 'urgent':
      return 55;
    case 'moderate':
      return 30;
    default:
      return 8;
  }
};

const evalScaleAnswer = (q: FollowUpQuestion, value: number): { points: number; redFlag: boolean } => {
  if (!q.scalePoints || q.scalePoints.length === 0) return { points: 0, redFlag: false };
  for (const bucket of q.scalePoints) {
    if (value <= bucket.upTo) return { points: bucket.points, redFlag: Boolean(bucket.redFlag) };
  }
  const last = q.scalePoints[q.scalePoints.length - 1];
  return { points: last?.points ?? 0, redFlag: Boolean(last?.redFlag) };
};

/** Points contributed by objective image findings. */
const scoreImageFindings = (f: ImageFindings): RiskContribution[] => {
  const out: RiskContribution[] = [];
  if (f.bleeding) out.push({ label: 'Visible bleeding', points: 25 });
  if (f.openWound) out.push({ label: 'Open wound', points: 18 });
  if (f.infectionSigns) out.push({ label: 'Signs of infection', points: 20 });
  if (f.swelling) out.push({ label: 'Swelling present', points: 10 });
  if (f.blisters) out.push({ label: 'Blisters present', points: 8 });
  if (/severe|third|full|deep/i.test(f.burnSeverity)) out.push({ label: 'Severe burn appearance', points: 30 });
  else if (/second|partial|moderate/i.test(f.burnSeverity)) out.push({ label: 'Moderate burn appearance', points: 15 });
  if (/rapid|wide|spreading|extensive/i.test(f.rashDistribution))
    out.push({ label: 'Widespread distribution', points: 12 });
  return out;
};

export interface RiskInput {
  category: string;
  answers?: FollowUpAnswer[];
  imageFindings?: ImageFindings;
  /** Severity produced by the AI/rule engine, folded in as a score floor. */
  baseSeverity?: Severity;
  /** Whether a hard critical keyword was detected in the text. */
  criticalKeyword?: boolean;
}

/**
 * Compute a transparent, additive 0–100 risk score. Every answer moves the
 * score; red-flag answers force EMERGENCY. This is the deterministic core that
 * turns adaptive answers into a defensible triage level.
 */
export const computeRiskScore = (input: RiskInput): RiskScoreResult => {
  const meta = CATEGORY_META[input.category];
  const questions = getQuestionsForCategory(input.category);
  const qById = new Map(questions.map((q) => [q.id, q]));

  const contributions: RiskContribution[] = [];
  let score = 0;
  let redFlagTriggered = false;

  if (meta && meta.basePoints > 0) {
    score += meta.basePoints;
    contributions.push({ label: `${meta.label} (baseline)`, points: meta.basePoints });
  }

  for (const answer of input.answers ?? []) {
    const q = qById.get(answer.id);
    if (!q) continue;

    if ((q.kind === 'scale' || q.kind === 'number') && typeof answer.value === 'number') {
      const { points, redFlag } = evalScaleAnswer(q, answer.value);
      if (points) contributions.push({ label: `${q.question} → ${answer.value}`, points });
      score += points;
      if (redFlag) redFlagTriggered = true;
      continue;
    }

    const chosen = Array.isArray(answer.value)
      ? answer.value.map(String)
      : [String(answer.value)];
    for (const val of chosen) {
      const opt = q.options?.find((o) => o.value === val);
      if (!opt) continue;
      if (opt.points) {
        score += opt.points;
        contributions.push({ label: `${q.question} → ${opt.label}`, points: opt.points });
      }
      if (opt.redFlag) redFlagTriggered = true;
    }
  }

  if (input.imageFindings) {
    const imgContribs = scoreImageFindings(input.imageFindings);
    for (const c of imgContribs) {
      score += c.points;
      contributions.push(c);
    }
  }

  if (input.criticalKeyword) {
    redFlagTriggered = true;
    contributions.push({ label: 'Critical symptom keyword detected', points: 60 });
    score += 60;
  }

  // Fold the AI/rule engine severity in as a score floor — but only when it is
  // genuinely decisive. A CRITICAL reading always floors (never de-escalate a
  // life-threatening emergency; critical keywords/red-flags reinforce this). A
  // cautious URGENT/MODERATE/MILD reading only floors when the user hasn't
  // answered any follow-ups yet; once answers exist, the dynamic answer-driven
  // score is the arbiter, so a vague symptom the AI flagged as URGENT can be
  // correctly refined down to LOW/MODERATE by clearly benign answers.
  if (input.baseSeverity) {
    const hasAnswers = (input.answers?.length ?? 0) > 0;
    const decisiveBase = input.baseSeverity === 'critical';
    if (decisiveBase || !hasAnswers) {
      const floor = scoreFloorForSeverity(input.baseSeverity);
      if (score < floor) {
        contributions.push({ label: `AI baseline (${input.baseSeverity})`, points: floor - score });
        score = floor;
      }
    }
  }

  if (redFlagTriggered) score = Math.max(score, 80);

  score = clamp(Math.round(score), 0, 100);
  const level = riskLevelFromScore(score);
  const severity = severityFromLevel(level);

  contributions.sort((a, b) => b.points - a.points);

  return { score, level, severity, contributions, redFlagTriggered };
};

export default computeRiskScore;
