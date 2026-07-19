import {
  EmergencyAnalysis,
  EmergencyType,
  FollowUpAnswer,
  FollowUpQuestion,
  ImageAnalysis,
  ImageCategory,
  ImageFindings,
  TriageInput,
} from '../../types';
import { CRITICAL_KEYWORDS, MEDICAL_DISCLAIMER } from '../../utils/constants';
import { clamp } from '../../utils/helpers';
import { analyzeEmergency } from '../ai/geminiService';
import { analyzeImage } from '../ai/imageAnalysisService';
import { getImageFirstAid } from '../ai/imageFirstAid';
import { getProtocol, toFirstAidSteps } from './emergencyProtocols';
import {
  CATEGORY_META,
  detectCategory,
  getQuestionsForCategory,
} from './followUpQuestions';
import {
  computeRiskScore,
  higherSeverity,
  recommendedCareForLevel,
  levelFromSeverity,
} from './riskScoring';

const hasCriticalKeyword = (text: string): boolean => {
  const lower = (text || '').toLowerCase();
  return CRITICAL_KEYWORDS.some((k) => lower.includes(k));
};

/** Resolve the working category from any combination of inputs. */
const resolveCategory = (input: {
  category?: string;
  imageCategory?: ImageCategory;
  imageAnalysis?: ImageAnalysis;
  text: string;
}): string => {
  if (input.category && CATEGORY_META[input.category]) return input.category;
  if (input.imageAnalysis && CATEGORY_META[input.imageAnalysis.category])
    return input.imageAnalysis.category;
  if (input.imageCategory && CATEGORY_META[input.imageCategory]) return input.imageCategory;
  return detectCategory(input.text);
};

export interface QuestionsResult {
  category: string;
  categoryLabel: string;
  emoji: string;
  questions: FollowUpQuestion[];
  imageAnalysis?: ImageAnalysis;
}

/**
 * Stage 1 — determine the category (from text and/or image) and return the
 * adaptive follow-up questions. When an image is present it is analysed here so
 * the UI can run a quality check and show visible findings before questions.
 */
export const getFollowUpQuestions = async (input: {
  text?: string;
  image?: string;
  imageCategory?: ImageCategory;
}): Promise<QuestionsResult> => {
  const text = input.text ?? '';
  let imageAnalysis: ImageAnalysis | undefined;
  if (input.image) {
    imageAnalysis = await analyzeImage({
      image: input.image,
      imageCategory: input.imageCategory,
      text,
    });
  }

  const category = resolveCategory({ imageCategory: input.imageCategory, imageAnalysis, text });
  const meta = CATEGORY_META[category];

  return {
    category,
    categoryLabel: meta?.label ?? 'General Symptoms',
    emoji: meta?.emoji ?? '🩺',
    questions: getQuestionsForCategory(category),
    imageAnalysis,
  };
};

/** Build a base clinical analysis when there is no free-text to send to the LLM. */
const synthesizeBase = (category: string, imageAnalysis?: ImageAnalysis): EmergencyAnalysis => {
  const meta = CATEGORY_META[category];
  const type: EmergencyType = meta?.emergencyType ?? 'general';
  const protocol = getProtocol(type);
  const label = imageAnalysis?.categoryLabel ?? protocol.label;

  return {
    primaryEmergency: label,
    emergencyType: type,
    severity: 'moderate',
    riskLevel: 'moderate',
    riskScore: 30,
    confidence: imageAnalysis?.confidence ?? 55,
    possibleConditions:
      imageAnalysis && imageAnalysis.possibleConditions.length
        ? imageAnalysis.possibleConditions
        : protocol.conditions,
    actions: protocol.actions.map((action, i) => ({ priority: i + 1, action })),
    firstAid: toFirstAidSteps(protocol.firstAid),
    redFlags: protocol.redFlags,
    medicines: protocol.medicines,
    recommendedCare: recommendedCareForLevel('moderate'),
    hospitalRequired: false,
    ambulanceRequired: false,
    reasoning: 'Assessment based on the reported condition and your answers.',
    disclaimer: MEDICAL_DISCLAIMER,
    source: 'fallback',
  };
};

const summariseFindings = (f: ImageFindings): string => {
  const seen: string[] = [];
  if (f.redness) seen.push('redness');
  if (f.swelling) seen.push('swelling');
  if (f.blisters) seen.push('blisters');
  if (f.openWound) seen.push('an open wound');
  if (f.bleeding) seen.push('bleeding');
  if (f.infectionSigns) seen.push('possible infection signs');
  if (seen.length === 0) return '';
  return ` Visible findings: ${seen.join(', ')}.`;
};

export interface AssessmentResult {
  analysis: EmergencyAnalysis;
  imageAnalysis?: ImageAnalysis;
}

/**
 * Stage 2 — combine the image findings, symptom text, and follow-up answers
 * into a single risk-scored assessment. Severity is NEVER decided by the image
 * (or a symptom name) alone: the answer-driven risk score is the arbiter and we
 * never de-escalate below the AI's own reading.
 */
export const runAssessment = async (input: TriageInput): Promise<AssessmentResult> => {
  const text = (input.text ?? '').trim();
  const answers: FollowUpAnswer[] = input.answers ?? [];

  // Reuse a pre-computed image analysis if the caller passed one back; else analyse now.
  let imageAnalysis = (input as any).imageAnalysis as ImageAnalysis | undefined;
  if (!imageAnalysis && input.image) {
    imageAnalysis = await analyzeImage({
      image: input.image,
      imageCategory: input.imageCategory,
      text,
    });
  }

  const category = resolveCategory({
    category: input.category,
    imageCategory: input.imageCategory,
    imageAnalysis,
    text,
  });
  const meta = CATEGORY_META[category];

  // Base clinical reading: LLM/rule engine for text; synthesized for image-only.
  const base = text
    ? await analyzeEmergency({ text })
    : synthesizeBase(category, imageAnalysis);

  const criticalKeyword = hasCriticalKeyword(text);
  const risk = computeRiskScore({
    category,
    answers,
    imageFindings: imageAnalysis?.findings,
    baseSeverity: base.severity,
    criticalKeyword,
  });

  // Dynamic scoring is the arbiter. Once the user has answered follow-up
  // questions, only a CRITICAL base reading forces a floor (we never
  // de-escalate a life-threatening emergency). A cautious URGENT/MODERATE/MILD
  // base can be refined down by clearly benign answers, so LOW/MODERATE are
  // genuinely reachable and not everything reads as URGENT. Red-flag answers and
  // critical keywords have already pushed the risk score up in computeRiskScore.
  const answered = answers.length > 0;
  const baseIsDecisive = base.severity === 'critical';
  let severity =
    !answered || baseIsDecisive ? higherSeverity(base.severity, risk.severity) : risk.severity;
  let riskScore = risk.score;

  // Safety principle: an image (or a symptom name) is NEVER enough on its own to
  // declare an EMERGENCY. Without answered follow-up questions and without a hard
  // critical keyword, cap an image-led assessment at URGENT and ask for answers.
  const imageOnly = Boolean(imageAnalysis) && !answered && !criticalKeyword;
  let cappedNote = '';
  if (imageOnly && severity === 'critical') {
    severity = 'urgent';
    riskScore = Math.min(riskScore, 72);
    cappedNote =
      ' The image alone is not used to confirm an emergency — answer the follow-up questions for a complete assessment.';
  }

  const riskLevel = levelFromSeverity(severity);
  const recommendedCare = recommendedCareForLevel(riskLevel);

  // Conditions: prefer image-specific when image led the assessment.
  const possibleConditions =
    imageAnalysis && imageAnalysis.possibleConditions.length && !text
      ? imageAnalysis.possibleConditions
      : base.possibleConditions.length
        ? base.possibleConditions
        : imageAnalysis?.possibleConditions ?? [];

  // First aid: visible-condition specific when an image was analysed.
  const firstAid =
    imageAnalysis && imageAnalysis.category
      ? toFirstAidSteps(getImageFirstAid(imageAnalysis.category as ImageCategory))
      : base.firstAid;

  const redFlags = base.redFlags.length
    ? base.redFlags
    : ['Difficulty breathing', 'Rapidly spreading swelling or redness', 'Loss of consciousness'];

  const confidence = clamp(
    Math.round(
      imageAnalysis
        ? (base.confidence + imageAnalysis.confidence) / 2
        : base.confidence
    ),
    30,
    97
  );

  const reasoning =
    `${base.reasoning} Composite risk score ${riskScore}/100 (${riskLevel.toUpperCase()}) from your answers` +
    `${imageAnalysis ? ' and the uploaded image' : ''}.` +
    (imageAnalysis ? summariseFindings(imageAnalysis.findings) : '') +
    (risk.redFlagTriggered ? ' A red-flag answer escalated this to emergency.' : '') +
    cappedNote;

  const analysis: EmergencyAnalysis = {
    primaryEmergency: imageAnalysis && !text ? imageAnalysis.categoryLabel : base.primaryEmergency,
    emergencyType: meta?.emergencyType ?? base.emergencyType,
    severity,
    riskLevel,
    riskScore,
    confidence,
    possibleConditions,
    actions: base.actions.length
      ? base.actions
      : [{ priority: 1, action: recommendedCare }],
    firstAid,
    redFlags,
    medicines: base.medicines,
    recommendedCare,
    hospitalRequired: severity !== 'mild',
    ambulanceRequired: severity === 'critical',
    reasoning: reasoning.trim(),
    imageFindings: imageAnalysis?.findings,
    detectedCategory: meta?.label ?? base.primaryEmergency,
    riskContributions: risk.contributions,
    disclaimer: MEDICAL_DISCLAIMER,
    source: imageAnalysis?.source === 'gemini' || base.source === 'gemini' ? 'gemini' : 'fallback',
  };

  return { analysis, imageAnalysis };
};

export default { runAssessment, getFollowUpQuestions };
