/**
 * Prompt templates for the Gemini triage model.
 * The model is instructed to return strict JSON so we can parse it deterministically.
 */

export const TRIAGE_SYSTEM_INSTRUCTION =
  'You are an emergency medical triage AI assisting a layperson during a possible medical ' +
  'emergency. You NEVER diagnose definitively — always use probabilistic language ("possible", ' +
  '"may indicate"). You prioritise safety: when uncertain, escalate. You never recommend ' +
  'prescription medications or procedures requiring medical training. Output must be valid JSON only.';

export const buildTriagePrompt = (text: string, hasImage: boolean): string => `
ANALYZE THIS EMERGENCY.

Text description from the caller: """${text || '(no text provided)'}"""
Image provided: ${hasImage ? 'yes — analyse the attached image as part of the assessment' : 'no'}

INSTRUCTIONS:
1. Identify the primary emergency type. Choose exactly one of:
   cardiac, respiratory, neurological, trauma, bleeding, burn, poisoning, allergic, heat, diabetic, abdominal, dermatological, general.
2. Assess severity on this scale:
   - critical: immediately life-threatening, needs emergency services NOW
   - urgent: serious, needs medical attention within 1 hour
   - moderate: needs medical attention within 24 hours
   - mild: can be managed at home with monitoring
3. Assign an integer confidence score 0-100 for your severity assessment.
4. List 3-5 possible conditions with probabilities (0-1) that sum to roughly 1.
5. Provide 4-6 immediate actions ordered by priority (priority 1 = do first).
6. Provide 4-6 first-aid steps that are SAFE for an untrained bystander.
7. List red flags that mean "call emergency services immediately".
8. Decide hospitalRequired and ambulanceRequired (booleans).
9. Give a short "reasoning" string explaining the assessment.

Respond with ONLY this JSON shape (no markdown, no commentary):
{
  "primaryEmergency": "string (human-readable label)",
  "emergencyType": "one of the allowed types",
  "severity": "critical|urgent|moderate|mild",
  "confidence": number,
  "possibleConditions": [{ "condition": "string", "probability": number }],
  "actions": [{ "priority": number, "action": "string" }],
  "firstAid": [{ "step": number, "instruction": "string" }],
  "redFlags": ["string"],
  "hospitalRequired": boolean,
  "ambulanceRequired": boolean,
  "reasoning": "string"
}
`;

/* ────────────────────────────────────────────────────────────────────────
 *  Medical image analysis
 * ──────────────────────────────────────────────────────────────────────── */

export const IMAGE_SYSTEM_INSTRUCTION =
  'You are a medical image triage assistant helping a layperson during a possible medical ' +
  'concern. You describe ONLY what is visible in the image. You NEVER give a definitive ' +
  'diagnosis from an image alone — the image is one input among symptoms, history and answers. ' +
  'Always use probabilistic language. First judge whether the photo is usable (clear, well-lit, ' +
  'subject visible, in focus). Output must be valid JSON only.';

const IMAGE_CATEGORIES = [
  'skin_rash', 'skin_allergy', 'burn', 'cut', 'bruise', 'swelling', 'insect_bite', 'animal_bite',
  'eye_redness', 'lip_swelling', 'hand_infection', 'foot_infection', 'nail_infection',
  'mouth_ulcer', 'wound', 'bleeding', 'skin_infection', 'chickenpox_rash', 'fungal_infection',
  'cellulitis', 'acne', 'boil', 'blister', 'other',
].join(', ');

export const buildImagePrompt = (text: string, hint?: string): string => `
Analyse this medical image of a visible body condition.

Caller's note: """${text || '(none)'}"""
${hint ? `The user suggested this may be: ${hint}` : ''}

STEP 1 — QUALITY CHECK. Decide if the image is usable:
- Is it clear and in focus (not blurry)?
- Is it well lit (not too dark / not overexposed)?
- Is the affected body part clearly visible and filling enough of the frame?
If it is NOT usable, set quality.acceptable=false and list issues (e.g. "blurry", "too_dark", "too_bright", "no_subject").

STEP 2 — CATEGORY. Choose the single best matching category from:
${IMAGE_CATEGORIES}

STEP 3 — VISIBLE FINDINGS ONLY. Report what you can actually see:
redness, swelling, skin colour, blisters, open wound, bleeding, rash distribution, size, shape,
burn severity (none/first-degree/second-degree/third-degree/unclear), and signs of possible infection.

STEP 4 — POSSIBLE conditions (2-4) with probabilities (0-1). Never state certainty.

Respond with ONLY this JSON (no markdown):
{
  "category": "one of the allowed category keys",
  "quality": { "acceptable": boolean, "issues": ["string"], "message": "short guidance if not acceptable" },
  "findings": {
    "redness": boolean, "swelling": boolean, "skinColor": "string", "blisters": boolean,
    "openWound": boolean, "bleeding": boolean, "rashDistribution": "string", "size": "string",
    "shape": "string", "burnSeverity": "string", "infectionSigns": boolean, "notes": ["string"]
  },
  "possibleConditions": [{ "condition": "string", "probability": number }],
  "confidence": number (integer 0-100 for how confident you are in the category)
}
`;
