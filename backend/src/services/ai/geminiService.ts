import { config } from '../../config/env';
import { logger } from '../../utils/logger';
import { MEDICAL_DISCLAIMER } from '../../utils/constants';
import { clamp, stripDataUrl, dataUrlMime } from '../../utils/helpers';
import {
  EmergencyAnalysis,
  EmergencyType,
  Severity,
  TriageInput,
} from '../../types';
import { runTriageEngine } from '../triage/triageEngine';
import { getProtocol } from '../triage/emergencyProtocols';
import { classifySeverity } from '../triage/severityClassifier';
import { levelFromSeverity, recommendedCareForLevel } from '../triage/riskScoring';
import { TRIAGE_SYSTEM_INSTRUCTION, buildTriagePrompt } from './promptTemplates';

const VALID_TYPES: EmergencyType[] = [
  'cardiac',
  'respiratory',
  'neurological',
  'trauma',
  'bleeding',
  'burn',
  'poisoning',
  'allergic',
  'heat',
  'diabetic',
  'general',
];
const VALID_SEVERITIES: Severity[] = ['critical', 'urgent', 'moderate', 'mild'];

const GEMINI_TIMEOUT_MS = 15000;

/**
 * Structured-output schema. Supplying this with responseMimeType=application/json
 * makes Gemini return guaranteed-valid JSON in this exact shape, eliminating the
 * occasional parse failures (unescaped quotes/newlines) that forced a fallback.
 */
const TRIAGE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    primaryEmergency: { type: 'STRING' },
    emergencyType: { type: 'STRING', enum: VALID_TYPES },
    severity: { type: 'STRING', enum: VALID_SEVERITIES },
    confidence: { type: 'INTEGER' },
    possibleConditions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { condition: { type: 'STRING' }, probability: { type: 'NUMBER' } },
        required: ['condition', 'probability'],
      },
    },
    actions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { priority: { type: 'INTEGER' }, action: { type: 'STRING' } },
        required: ['priority', 'action'],
      },
    },
    firstAid: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { step: { type: 'INTEGER' }, instruction: { type: 'STRING' } },
        required: ['step', 'instruction'],
      },
    },
    redFlags: { type: 'ARRAY', items: { type: 'STRING' } },
    hospitalRequired: { type: 'BOOLEAN' },
    ambulanceRequired: { type: 'BOOLEAN' },
    reasoning: { type: 'STRING' },
  },
  required: [
    'primaryEmergency',
    'emergencyType',
    'severity',
    'confidence',
    'possibleConditions',
    'actions',
    'firstAid',
    'redFlags',
    'hospitalRequired',
    'ambulanceRequired',
    'reasoning',
  ],
};

/**
 * Extract a JSON object from a model text response that may be wrapped in
 * markdown code fences or surrounded by prose.
 */
const extractJson = (raw: string): unknown => {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model response');
  }
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    // Gemini occasionally emits trailing commas or stray control characters that
    // break strict JSON.parse. Repair the common cases before giving up so we
    // stay on the higher-quality AI path instead of the offline fallback.
    const repaired = slice
      .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ''); // strip control chars
    return JSON.parse(repaired);
  }
};

/** Normalise and validate raw model output into a safe EmergencyAnalysis. */
const normalizeAnalysis = (data: any, input: TriageInput): EmergencyAnalysis => {
  const emergencyType: EmergencyType = VALID_TYPES.includes(data.emergencyType)
    ? data.emergencyType
    : 'general';
  const rawSeverity: Severity = VALID_SEVERITIES.includes(data.severity)
    ? data.severity
    : 'moderate';
  const rawConfidence = clamp(Number(data.confidence) || 0, 0, 100);

  // Safety cross-check: never trust the model to de-escalate a red-flag case.
  const checked = classifySeverity({
    severity: rawSeverity,
    confidence: rawConfidence,
    text: input.text ?? '',
  });

  const conditions = Array.isArray(data.possibleConditions)
    ? data.possibleConditions
        .filter((c: any) => c && c.condition)
        .map((c: any) => ({
          condition: String(c.condition),
          probability: clamp(Number(c.probability) || 0, 0, 1),
        }))
    : [];

  const actions = Array.isArray(data.actions)
    ? data.actions
        .filter((a: any) => a && a.action)
        .map((a: any, i: number) => ({
          priority: Number(a.priority) || i + 1,
          action: String(a.action),
        }))
    : [];

  const firstAid = Array.isArray(data.firstAid)
    ? data.firstAid
        .filter((s: any) => s && s.instruction)
        .map((s: any, i: number) => ({
          step: Number(s.step) || i + 1,
          instruction: String(s.instruction),
        }))
    : [];

  const redFlags = Array.isArray(data.redFlags)
    ? data.redFlags.map((r: any) => String(r)).filter(Boolean)
    : [];

  const isSevere = checked.severity === 'critical' || checked.severity === 'urgent';
  const riskLevel = levelFromSeverity(checked.severity);
  const defaultScore: Record<string, number> = { critical: 85, urgent: 62, moderate: 38, mild: 15 };

  return {
    primaryEmergency: String(data.primaryEmergency || 'Medical Concern'),
    emergencyType,
    severity: checked.severity,
    riskLevel,
    riskScore: defaultScore[checked.severity] ?? 40,
    confidence: checked.confidence,
    possibleConditions: conditions,
    actions,
    firstAid,
    redFlags,
    // Medicine/tablet suggestions are always served from our vetted protocol data
    // (never invented by the model) for the detected emergency type.
    medicines: getProtocol(emergencyType).medicines,
    recommendedCare: recommendedCareForLevel(riskLevel),
    hospitalRequired: Boolean(data.hospitalRequired) || isSevere,
    ambulanceRequired: Boolean(data.ambulanceRequired) || checked.severity === 'critical',
    reasoning: `${String(data.reasoning || 'AI assessment complete.')} ${
      checked.escalated ? `Safety layer: ${checked.reason}` : ''
    }`.trim(),
    disclaimer: MEDICAL_DISCLAIMER,
    source: 'gemini',
  };
};

/** Call the Gemini generateContent REST endpoint. */
const callGemini = async (input: TriageInput): Promise<string> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;

  const parts: any[] = [{ text: buildTriagePrompt(input.text ?? '', Boolean(input.image)) }];
  if (input.image) {
    parts.push({
      inline_data: {
        mime_type: dataUrlMime(input.image),
        data: stripDataUrl(input.image),
      },
    });
  }

  const body = {
    system_instruction: { parts: [{ text: TRIAGE_SYSTEM_INSTRUCTION }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: TRIAGE_RESPONSE_SCHEMA,
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }
    const json: any = await res.json();
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      .filter(Boolean)
      .join('\n');
    if (!text) throw new Error('Empty Gemini response');
    return text;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Primary entry point. Uses Gemini when configured; otherwise (or on any error)
 * transparently falls back to the deterministic rule-based engine so the app
 * never fails to produce a safe assessment.
 */
export const analyzeEmergency = async (input: TriageInput): Promise<EmergencyAnalysis> => {
  if (!config.gemini.enabled) {
    logger.info('Gemini disabled — using rule-based triage engine');
    return runTriageEngine(input);
  }

  try {
    const raw = await callGemini(input);
    const parsed = extractJson(raw);
    const analysis = normalizeAnalysis(parsed, input);
    logger.info(`Gemini triage complete: ${analysis.severity} (${analysis.confidence}%)`);
    return analysis;
  } catch (err) {
    logger.warn(
      `Gemini analysis failed, falling back to rule-based engine: ${(err as Error).message}`
    );
    const fallback = runTriageEngine(input);
    fallback.reasoning += ' (AI service unavailable — used offline safety engine.)';
    return fallback;
  }
};

export const isGeminiEnabled = (): boolean => config.gemini.enabled;

export default { analyzeEmergency, isGeminiEnabled };
