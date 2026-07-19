import { config } from '../../config/env';
import { logger } from '../../utils/logger';
import { clamp, stripDataUrl, dataUrlMime } from '../../utils/helpers';
import { ImageAnalysis, ImageCategory, ImageFindings, PossibleCondition } from '../../types';
import { CATEGORY_META } from '../triage/followUpQuestions';
import { IMAGE_SYSTEM_INSTRUCTION, buildImagePrompt } from './promptTemplates';

const GEMINI_TIMEOUT_MS = 20000;

const VALID_CATEGORIES: ImageCategory[] = [
  'skin_rash', 'skin_allergy', 'burn', 'cut', 'bruise', 'swelling', 'insect_bite', 'animal_bite',
  'eye_redness', 'lip_swelling', 'hand_infection', 'foot_infection', 'nail_infection',
  'mouth_ulcer', 'wound', 'bleeding', 'skin_infection', 'chickenpox_rash', 'fungal_infection',
  'cellulitis', 'acne', 'boil', 'blister', 'other',
];

const extractJson = (raw: string): any => {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object in image response');
  return JSON.parse(text.slice(start, end + 1));
};

const labelFor = (category: ImageCategory): string =>
  CATEGORY_META[category]?.label ?? 'Visible Condition';

const defaultFindings = (): ImageFindings => ({
  redness: false,
  swelling: false,
  skinColor: 'not assessed',
  blisters: false,
  openWound: false,
  bleeding: false,
  rashDistribution: 'not assessed',
  size: 'not assessed',
  shape: 'not assessed',
  burnSeverity: 'none',
  infectionSigns: false,
  notes: [],
});

const normalizeFindings = (data: any): ImageFindings => {
  const f = data ?? {};
  return {
    redness: Boolean(f.redness),
    swelling: Boolean(f.swelling),
    skinColor: String(f.skinColor ?? 'not assessed'),
    blisters: Boolean(f.blisters),
    openWound: Boolean(f.openWound),
    bleeding: Boolean(f.bleeding),
    rashDistribution: String(f.rashDistribution ?? 'not assessed'),
    size: String(f.size ?? 'not assessed'),
    shape: String(f.shape ?? 'not assessed'),
    burnSeverity: String(f.burnSeverity ?? 'none'),
    infectionSigns: Boolean(f.infectionSigns),
    notes: Array.isArray(f.notes) ? f.notes.map(String).filter(Boolean).slice(0, 6) : [],
  };
};

const normalizeConfidence = (raw: any): number => {
  let c = Number(raw) || 0;
  if (c > 0 && c <= 1) c *= 100; // Gemini sometimes returns a 0–1 fraction.
  return clamp(Math.round(c), 0, 95);
};

const normalizeConditions = (data: any): PossibleCondition[] =>
  Array.isArray(data)
    ? data
        .filter((c: any) => c && c.condition)
        .map((c: any) => ({
          condition: String(c.condition),
          probability: clamp(Number(c.probability) || 0, 0, 1),
        }))
        .slice(0, 5)
    : [];

const callGeminiVision = async (image: string, prompt: string): Promise<string> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;
  const body = {
    system_instruction: { parts: [{ text: IMAGE_SYSTEM_INSTRUCTION }] },
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inline_data: { mime_type: dataUrlMime(image), data: stripDataUrl(image) } },
        ],
      },
    ],
    generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
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
    if (!res.ok) throw new Error(`Gemini vision HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
    const json: any = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n');
    if (!text) throw new Error('Empty Gemini vision response');
    return text;
  } finally {
    clearTimeout(timer);
  }
};

export interface AnalyzeImageInput {
  image: string;
  imageCategory?: ImageCategory;
  text?: string;
}

/** Offline fallback — the client already vetted quality; we can't see pixels here. */
const fallbackAnalysis = (input: AnalyzeImageInput): ImageAnalysis => {
  const category = (input.imageCategory && VALID_CATEGORIES.includes(input.imageCategory)
    ? input.imageCategory
    : 'other') as ImageCategory;
  const findings = defaultFindings();
  findings.notes.push('Automated visual analysis needs the AI service; assessment relies on your answers.');
  return {
    category,
    categoryLabel: labelFor(category),
    findings,
    possibleConditions: [],
    confidence: 40,
    quality: { acceptable: true, issues: [], message: '' },
    source: 'fallback',
  };
};

/**
 * Analyse an uploaded medical image: quality check + visible findings +
 * category + possible conditions. Uses Gemini vision when available, otherwise
 * a safe offline fallback so the flow never breaks.
 */
export const analyzeImage = async (input: AnalyzeImageInput): Promise<ImageAnalysis> => {
  if (!config.gemini.enabled) return fallbackAnalysis(input);

  try {
    const hint = input.imageCategory ? labelFor(input.imageCategory) : undefined;
    const raw = await callGeminiVision(input.image, buildImagePrompt(input.text ?? '', hint));
    const data = extractJson(raw);

    const category = (VALID_CATEGORIES.includes(data.category)
      ? data.category
      : input.imageCategory && VALID_CATEGORIES.includes(input.imageCategory)
        ? input.imageCategory
        : 'other') as ImageCategory;

    const q = data.quality ?? {};
    const acceptable = q.acceptable !== false;
    const issues = Array.isArray(q.issues) ? q.issues.map(String).filter(Boolean) : [];

    const analysis: ImageAnalysis = {
      category,
      categoryLabel: labelFor(category),
      findings: normalizeFindings(data.findings),
      possibleConditions: normalizeConditions(data.possibleConditions),
      confidence: normalizeConfidence(data.confidence),
      quality: {
        acceptable,
        issues,
        message: String(q.message ?? (acceptable ? '' : 'Please retake the photo — make it clear, well-lit and close.')),
      },
      source: 'gemini',
    };
    logger.info(`Image analysis: ${analysis.categoryLabel} (quality ${acceptable ? 'ok' : 'poor'})`);
    return analysis;
  } catch (err) {
    logger.warn(`Image analysis failed, using fallback: ${(err as Error).message}`);
    return fallbackAnalysis(input);
  }
};

export default { analyzeImage };
