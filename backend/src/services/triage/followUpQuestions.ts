import { EmergencyType, FollowUpQuestion } from '../../types';

/**
 * Adaptive follow-up questions.
 *
 * Every category (a symptom bucket or a visible image condition) has a tailored
 * set of questions. Each answer option carries `points` that feed the risk
 * scoring engine, and `redFlag` markers that force an EMERGENCY classification.
 * The AI never grades severity from a name alone — it always asks these
 * questions first and grades the *answers*.
 */

export interface CategoryMeta {
  key: string;
  label: string;
  emoji: string;
  emergencyType: EmergencyType;
  /** Baseline points contributed just by the category itself. */
  basePoints: number;
  /** Whether this category originates from an uploaded image. */
  image?: boolean;
}

/* ── Small builders to keep the bank readable ─────────────────────────────── */

const yesNo = (
  id: string,
  question: string,
  yesPoints: number,
  opts: { redFlag?: boolean; emoji?: string; help?: string } = {}
): FollowUpQuestion => ({
  id,
  question,
  kind: 'boolean',
  emoji: opts.emoji,
  helpText: opts.help,
  options: [
    { value: 'yes', label: 'Yes', points: yesPoints, redFlag: opts.redFlag },
    { value: 'no', label: 'No', points: 0 },
  ],
});

const painScale: FollowUpQuestion = {
  id: 'pain_score',
  question: 'How severe is the pain right now? (0 = none, 10 = worst imaginable)',
  kind: 'scale',
  min: 0,
  max: 10,
  emoji: '🤕',
  scalePoints: [
    { upTo: 0, points: 0 },
    { upTo: 3, points: 5 },
    { upTo: 6, points: 15 },
    { upTo: 10, points: 30 },
  ],
};

const durationQ: FollowUpQuestion = {
  id: 'duration',
  question: 'How long has this been going on?',
  kind: 'single',
  emoji: '⏱️',
  options: [
    { value: 'lt1h', label: 'Less than 1 hour', points: 10 },
    { value: '1_6h', label: '1–6 hours', points: 6 },
    { value: '6_24h', label: '6–24 hours', points: 4 },
    { value: '1_3d', label: '1–3 days', points: 2 },
    { value: 'gt3d', label: 'More than 3 days', points: 2 },
  ],
};

/* ── Category metadata ────────────────────────────────────────────────────── */

export const CATEGORY_META: Record<string, CategoryMeta> = {
  chest_pain: { key: 'chest_pain', label: 'Chest Pain', emoji: '🫀', emergencyType: 'cardiac', basePoints: 30 },
  breathing: { key: 'breathing', label: 'Breathing Problem', emoji: '🫁', emergencyType: 'respiratory', basePoints: 25 },
  headache: { key: 'headache', label: 'Headache', emoji: '🧠', emergencyType: 'neurological', basePoints: 8 },
  stomach_pain: { key: 'stomach_pain', label: 'Stomach Pain', emoji: '🩹', emergencyType: 'abdominal', basePoints: 8 },
  fever: { key: 'fever', label: 'Fever', emoji: '🌡️', emergencyType: 'general', basePoints: 6 },
  fall: { key: 'fall', label: 'Fall / Injury', emoji: '🦴', emergencyType: 'trauma', basePoints: 10 },
  bleeding: { key: 'bleeding', label: 'Bleeding', emoji: '🩸', emergencyType: 'bleeding', basePoints: 20 },
  allergic: { key: 'allergic', label: 'Allergic Reaction', emoji: '🐝', emergencyType: 'allergic', basePoints: 15 },
  general: { key: 'general', label: 'General Symptoms', emoji: '🩺', emergencyType: 'general', basePoints: 4 },

  // Image-driven categories
  skin_rash: { key: 'skin_rash', label: 'Skin Rash', emoji: '🌡️', emergencyType: 'dermatological', basePoints: 6, image: true },
  skin_allergy: { key: 'skin_allergy', label: 'Skin Allergy', emoji: '🌼', emergencyType: 'allergic', basePoints: 10, image: true },
  burn: { key: 'burn', label: 'Burn', emoji: '🔥', emergencyType: 'burn', basePoints: 15, image: true },
  cut: { key: 'cut', label: 'Cut / Laceration', emoji: '🔪', emergencyType: 'bleeding', basePoints: 12, image: true },
  bruise: { key: 'bruise', label: 'Bruise', emoji: '🟣', emergencyType: 'trauma', basePoints: 4, image: true },
  swelling: { key: 'swelling', label: 'Swelling', emoji: '🎈', emergencyType: 'general', basePoints: 8, image: true },
  insect_bite: { key: 'insect_bite', label: 'Insect Bite', emoji: '🦟', emergencyType: 'allergic', basePoints: 8, image: true },
  animal_bite: { key: 'animal_bite', label: 'Animal Bite', emoji: '🐕', emergencyType: 'bleeding', basePoints: 18, image: true },
  eye_redness: { key: 'eye_redness', label: 'Eye Redness', emoji: '👁️', emergencyType: 'general', basePoints: 6, image: true },
  lip_swelling: { key: 'lip_swelling', label: 'Lip Swelling', emoji: '👄', emergencyType: 'allergic', basePoints: 20, image: true },
  hand_infection: { key: 'hand_infection', label: 'Hand Infection', emoji: '✋', emergencyType: 'dermatological', basePoints: 12, image: true },
  foot_infection: { key: 'foot_infection', label: 'Foot Infection', emoji: '🦶', emergencyType: 'dermatological', basePoints: 12, image: true },
  nail_infection: { key: 'nail_infection', label: 'Nail Infection', emoji: '💅', emergencyType: 'dermatological', basePoints: 6, image: true },
  mouth_ulcer: { key: 'mouth_ulcer', label: 'Mouth Ulcer', emoji: '👅', emergencyType: 'general', basePoints: 4, image: true },
  wound: { key: 'wound', label: 'Visible Wound', emoji: '🩹', emergencyType: 'bleeding', basePoints: 15, image: true },
  skin_infection: { key: 'skin_infection', label: 'Skin Infection', emoji: '🦠', emergencyType: 'dermatological', basePoints: 12, image: true },
  chickenpox_rash: { key: 'chickenpox_rash', label: 'Chickenpox-like Rash', emoji: '🔴', emergencyType: 'dermatological', basePoints: 8, image: true },
  fungal_infection: { key: 'fungal_infection', label: 'Fungal Infection', emoji: '🍄', emergencyType: 'dermatological', basePoints: 4, image: true },
  cellulitis: { key: 'cellulitis', label: 'Cellulitis (visible)', emoji: '🔴', emergencyType: 'dermatological', basePoints: 22, image: true },
  acne: { key: 'acne', label: 'Acne', emoji: '🧴', emergencyType: 'dermatological', basePoints: 2, image: true },
  boil: { key: 'boil', label: 'Boil', emoji: '🔴', emergencyType: 'dermatological', basePoints: 8, image: true },
  blister: { key: 'blister', label: 'Blister', emoji: '💧', emergencyType: 'dermatological', basePoints: 6, image: true },
  other: { key: 'other', label: 'Visible Condition', emoji: '🔍', emergencyType: 'dermatological', basePoints: 6, image: true },
};

/* ── Shared question groups ───────────────────────────────────────────────── */

const feverQ = yesNo('fever', 'Do you have a fever?', 12, { emoji: '🌡️' });
const spreadQ: FollowUpQuestion = {
  id: 'spread',
  question: 'Is it spreading?',
  kind: 'single',
  emoji: '↔️',
  options: [
    { value: 'no', label: 'No, staying the same', points: 0 },
    { value: 'slow', label: 'Spreading slowly', points: 12 },
    { value: 'fast', label: 'Spreading rapidly', points: 30, redFlag: false },
  ],
};
const anaphylaxisQ = yesNo('breathing_difficulty', 'Any difficulty breathing or throat tightness?', 60, {
  redFlag: true,
  emoji: '😮‍💨',
});
const facialSwellQ = yesNo('facial_swelling', 'Any swelling of the face, lips, or tongue?', 30, { emoji: '😷' });
const pusQ = yesNo('pus', 'Is there pus, discharge, or a bad smell?', 15, { emoji: '🟡' });

/* ── The bank ─────────────────────────────────────────────────────────────── */

export const QUESTION_BANK: Record<string, FollowUpQuestion[]> = {
  chest_pain: [
    painScale,
    yesNo('pressure', 'Does it feel like pressure, squeezing, or heaviness?', 25, { emoji: '🤚' }),
    yesNo('radiating', 'Does the pain spread to your arm, jaw, neck, or back?', 30, { emoji: '💥' }),
    yesNo('sweating', 'Are you sweating, cold, or clammy?', 20, { emoji: '💦' }),
    yesNo('breathlessness', 'Are you short of breath?', 30, { emoji: '😮‍💨' }),
    yesNo('heart_history', 'Any history of heart disease, diabetes, or high blood pressure?', 20, { emoji: '📋' }),
    durationQ,
  ],
  breathing: [
    {
      id: 'speaking',
      question: 'Can you speak in full sentences?',
      kind: 'single',
      emoji: '🗣️',
      options: [
        { value: 'full', label: 'Yes, normally', points: 0 },
        { value: 'short', label: 'Only short phrases', points: 25 },
        { value: 'words', label: 'Only single words / cannot speak', points: 50, redFlag: true },
      ],
    },
    yesNo('blue_lips', 'Are the lips, face, or fingertips turning blue/grey?', 60, { redFlag: true, emoji: '🫐' }),
    yesNo('asthma', 'Any history of asthma or COPD?', 15, { emoji: '📋' }),
    yesNo('chest_pain', 'Any chest pain along with the breathing difficulty?', 30, { emoji: '🫀' }),
    yesNo('sudden', 'Did it start suddenly?', 15, { emoji: '⚡' }),
  ],
  headache: [
    painScale,
    {
      id: 'onset',
      question: 'How did the headache start?',
      kind: 'single',
      emoji: '⚡',
      options: [
        { value: 'gradual', label: 'Gradually', points: 0 },
        { value: 'sudden', label: 'Suddenly, within seconds/minutes', points: 25 },
      ],
    },
    yesNo('worst_ever', 'Is this the worst headache of your life?', 40, { redFlag: true, emoji: '🚨' }),
    yesNo('vomiting', 'Any vomiting?', 15, { emoji: '🤮' }),
    yesNo('weakness', 'Any weakness or numbness on one side of the body?', 35, { emoji: '💪' }),
    yesNo('vision_changes', 'Any vision changes or double vision?', 25, { emoji: '👁️' }),
    yesNo('speech_problems', 'Any slurred speech or trouble speaking?', 40, { redFlag: true, emoji: '🗣️' }),
    yesNo('seizure', 'Any seizure or loss of consciousness?', 60, { redFlag: true, emoji: '⚡' }),
    yesNo('neck_stiffness', 'Any neck stiffness or fever?', 30, { emoji: '🧣' }),
    yesNo('head_injury', 'Any recent head injury?', 25, { emoji: '🤕' }),
    yesNo('stroke_history', 'Any history of stroke or blood clots?', 15, { emoji: '📋' }),
  ],
  stomach_pain: [
    painScale,
    {
      id: 'location',
      question: 'Where is the pain?',
      kind: 'single',
      emoji: '📍',
      options: [
        { value: 'upper', label: 'Upper abdomen', points: 8 },
        { value: 'lower_right', label: 'Lower right side', points: 20 },
        { value: 'lower', label: 'Lower abdomen', points: 8 },
        { value: 'general', label: 'All over', points: 10 },
      ],
    },
    durationQ,
    yesNo('vomiting', 'Any vomiting?', 15, { emoji: '🤮' }),
    yesNo('blood_in_stool', 'Any blood in your stool or vomit?', 40, { emoji: '🩸' }),
    yesNo('pregnancy', 'Is there any chance of pregnancy?', 15, { emoji: '🤰' }),
    feverQ,
    {
      id: 'eating',
      question: 'Are you able to eat and drink?',
      kind: 'single',
      emoji: '🍽️',
      options: [
        { value: 'yes', label: 'Yes, normally', points: 0 },
        { value: 'some', label: 'Only a little', points: 8 },
        { value: 'no', label: 'No, cannot keep anything down', points: 20 },
      ],
    },
  ],
  fever: [
    {
      id: 'temperature',
      question: 'What is the temperature? (°C)',
      kind: 'number',
      min: 35,
      max: 43,
      emoji: '🌡️',
      helpText: 'Leave blank if you have not measured it.',
      scalePoints: [
        { upTo: 38, points: 4 },
        { upTo: 39, points: 12 },
        { upTo: 40, points: 22 },
        { upTo: 43, points: 40, redFlag: true },
      ],
    },
    {
      id: 'days',
      question: 'How many days have you had the fever?',
      kind: 'number',
      min: 0,
      max: 60,
      emoji: '📅',
      scalePoints: [
        { upTo: 2, points: 2 },
        { upTo: 5, points: 8 },
        { upTo: 60, points: 15 },
      ],
    },
    yesNo('breathing_difficulty', 'Any difficulty breathing?', 40, { redFlag: true, emoji: '😮‍💨' }),
    yesNo('confusion', 'Any confusion, drowsiness, or trouble waking?', 35, { emoji: '😵' }),
    yesNo('rash', 'Any rash appearing with the fever?', 20, { emoji: '🔴' }),
    yesNo('stiff_neck', 'Any stiff neck or sensitivity to light?', 30, { emoji: '🧣' }),
  ],
  fall: [
    yesNo('can_walk', 'Are you unable to stand or walk?', 20, { emoji: '🚶' }),
    yesNo('head_injury', 'Did you hit your head?', 30, { emoji: '🤕' }),
    {
      id: 'bleeding',
      question: 'Is there any bleeding?',
      kind: 'single',
      emoji: '🩸',
      options: [
        { value: 'none', label: 'No bleeding', points: 0 },
        { value: 'minor', label: 'Minor bleeding', points: 10 },
        { value: 'severe', label: 'Heavy / uncontrolled bleeding', points: 45, redFlag: true },
      ],
    },
    yesNo('unconscious', 'Was there any loss of consciousness?', 60, { redFlag: true, emoji: '😵' }),
    yesNo('deformity', 'Any obvious deformity or bone sticking out?', 40, { emoji: '🦴' }),
    painScale,
  ],
  bleeding: [
    {
      id: 'bleeding_severity',
      question: 'How heavy is the bleeding?',
      kind: 'single',
      emoji: '🩸',
      options: [
        { value: 'minor', label: 'Minor / oozing', points: 8 },
        { value: 'steady', label: 'Steady flow', points: 25 },
        { value: 'spurting', label: 'Spurting / soaking through cloth', points: 55, redFlag: true },
      ],
    },
    yesNo('controlled', 'Does it stop when you press on it?', 0, { emoji: '🤚' }),
    yesNo('dizzy', 'Feeling dizzy, faint, or very pale?', 30, { emoji: '😵' }),
    painScale,
  ],
  allergic: [
    anaphylaxisQ,
    facialSwellQ,
    yesNo('hives', 'Any widespread hives or itching?', 15, { emoji: '🔴' }),
    yesNo('dizzy', 'Feeling dizzy or faint?', 25, { emoji: '😵' }),
    yesNo('known_allergy', 'Known severe allergy (food, sting, medicine)?', 12, { emoji: '📋' }),
  ],
  general: [
    painScale,
    durationQ,
    feverQ,
    yesNo('worsening', 'Are the symptoms getting worse?', 15, { emoji: '📈' }),
    yesNo('breathing_difficulty', 'Any difficulty breathing?', 40, { redFlag: true, emoji: '😮‍💨' }),
    yesNo('chronic', 'Any ongoing conditions (diabetes, heart, kidney, pregnancy)?', 10, { emoji: '📋' }),
  ],

  /* ── Image categories ──────────────────────────────────────────────────── */
  skin_rash: [
    durationQ,
    yesNo('itch', 'Does it itch?', 4, { emoji: '🖐️' }),
    yesNo('hurt', 'Is it painful?', 8, { emoji: '🤕' }),
    feverQ,
    spreadQ,
    yesNo('recent_medication', 'Did you start any new medicine recently?', 12, { emoji: '💊' }),
    yesNo('recent_insect_bite', 'Any recent insect bite?', 6, { emoji: '🦟' }),
    yesNo('recent_travel', 'Any recent travel?', 4, { emoji: '✈️' }),
    anaphylaxisQ,
    facialSwellQ,
  ],
  skin_allergy: [
    durationQ,
    yesNo('itch', 'Is it itchy?', 6, { emoji: '🖐️' }),
    spreadQ,
    yesNo('new_exposure', 'New food, soap, cosmetic, or medicine recently?', 12, { emoji: '🧴' }),
    anaphylaxisQ,
    facialSwellQ,
  ],
  burn: [
    {
      id: 'cause',
      question: 'How did the burn happen?',
      kind: 'single',
      emoji: '🔥',
      options: [
        { value: 'hot_water', label: 'Hot water / steam', points: 12 },
        { value: 'fire', label: 'Fire / flame', points: 20 },
        { value: 'chemical', label: 'Chemical', points: 30 },
        { value: 'electricity', label: 'Electricity', points: 45, redFlag: true },
        { value: 'sun', label: 'Sun', points: 4 },
        { value: 'other', label: 'Other', points: 10 },
      ],
    },
    painScale,
    yesNo('blisters', 'Are there blisters?', 15, { emoji: '💧' }),
    {
      id: 'size',
      question: 'How large is the burn?',
      kind: 'single',
      emoji: '📏',
      options: [
        { value: 'coin', label: 'Smaller than a coin', points: 4 },
        { value: 'palm', label: 'About a palm size', points: 15 },
        { value: 'large', label: 'Larger than a palm', points: 35 },
      ],
    },
    {
      id: 'location',
      question: 'Where is the burn?',
      kind: 'single',
      emoji: '📍',
      options: [
        { value: 'limb', label: 'Arm / leg / body', points: 4 },
        { value: 'face', label: 'Face / eyes / airway', points: 30 },
        { value: 'hands', label: 'Hands / feet / joints', points: 20 },
        { value: 'genitals', label: 'Genitals', points: 30 },
      ],
    },
    yesNo('breathing_difficulty', 'Any breathing difficulty or burns from smoke/fire indoors?', 55, {
      redFlag: true,
      emoji: '😮‍💨',
    }),
  ],
  cut: [
    {
      id: 'depth',
      question: 'How deep is the cut?',
      kind: 'single',
      emoji: '📏',
      options: [
        { value: 'surface', label: 'Shallow / surface scratch', points: 4 },
        { value: 'moderate', label: 'Moderate — through the skin', points: 15 },
        { value: 'deep', label: 'Deep — fat/muscle visible', points: 35 },
      ],
    },
    {
      id: 'bleeding',
      question: 'How is it bleeding?',
      kind: 'single',
      emoji: '🩸',
      options: [
        { value: 'stopped', label: 'Stopped / oozing', points: 4 },
        { value: 'steady', label: 'Steady flow', points: 20 },
        { value: 'spurting', label: 'Spurting / won\u2019t stop', points: 50, redFlag: true },
      ],
    },
    yesNo('animal_bite', 'Was it caused by an animal or human bite?', 20, { emoji: '🐕' }),
    yesNo('rusty_object', 'Was it caused by a rusty or dirty object?', 15, { emoji: '🔩' }),
    yesNo('tetanus', 'Is your tetanus shot up to date?', 0, { emoji: '💉', help: 'Answer "No" if unsure — you may need a booster.' }),
    yesNo('numbness', 'Any numbness or inability to move the part?', 20, { emoji: '✋' }),
  ],
  animal_bite: [
    {
      id: 'animal',
      question: 'What animal caused the bite?',
      kind: 'single',
      emoji: '🐾',
      options: [
        { value: 'dog', label: 'Dog', points: 20 },
        { value: 'cat', label: 'Cat', points: 15 },
        { value: 'monkey', label: 'Monkey', points: 25 },
        { value: 'snake', label: 'Snake', points: 60, redFlag: true },
        { value: 'other', label: 'Other', points: 15 },
      ],
    },
    yesNo('broke_skin', 'Did it break the skin / draw blood?', 20, { emoji: '🩸' }),
    yesNo('bleeding_heavy', 'Is it bleeding heavily?', 40, { emoji: '🩸' }),
    yesNo('vaccinated_animal', 'Was the animal known and vaccinated?', 0, { emoji: '💉' }),
    yesNo('tetanus', 'Is your tetanus shot up to date?', 0, { emoji: '💉' }),
    painScale,
  ],

  cellulitis: [
    durationQ,
    yesNo('spreading_redness', 'Is the redness spreading or getting warmer?', 25, { emoji: '🔥' }),
    feverQ,
    yesNo('red_streaks', 'Any red streaks spreading from the area?', 35, { emoji: '➰' }),
    yesNo('diabetes', 'Do you have diabetes or a weak immune system?', 15, { emoji: '📋' }),
    painScale,
  ],
};

/** Generic set used for image categories without a bespoke bank. */
const GENERIC_IMAGE_QUESTIONS: FollowUpQuestion[] = [
  durationQ,
  painScale,
  spreadQ,
  feverQ,
  pusQ,
  yesNo('worsening', 'Is it getting worse?', 15, { emoji: '📈' }),
  anaphylaxisQ,
];

/** Return the tailored question list for a category (falls back sensibly). */
export const getQuestionsForCategory = (category: string): FollowUpQuestion[] => {
  if (QUESTION_BANK[category]) return QUESTION_BANK[category] as FollowUpQuestion[];
  const meta = CATEGORY_META[category];
  if (meta?.image) return GENERIC_IMAGE_QUESTIONS;
  return QUESTION_BANK.general as FollowUpQuestion[];
};

/* ── Category detection from free text ────────────────────────────────────── */

const DETECTION: { category: string; terms: string[]; weight?: number }[] = [
  { category: 'chest_pain', terms: ['chest pain', 'chest tightness', 'chest pressure', 'heart attack', 'pain in left arm', 'palpitation'], weight: 3 },
  { category: 'breathing', terms: ['difficulty breathing', 'shortness of breath', 'trouble breathing', 'wheezing', 'cannot breathe', "can't breathe", 'breathless', 'asthma'], weight: 3 },
  { category: 'headache', terms: ['headache', 'migraine', 'head pain', 'worst headache'], weight: 2 },
  { category: 'stomach_pain', terms: ['stomach pain', 'abdominal pain', 'belly pain', 'stomach ache', 'tummy', 'abdomen'], weight: 2 },
  { category: 'fever', terms: ['fever', 'high temperature', 'chills', 'shivering'], weight: 2 },
  { category: 'fall', terms: ['fall', 'fell', 'slipped', 'fracture', 'broken bone', 'injury', 'accident'], weight: 2 },
  { category: 'bleeding', terms: ['bleeding', 'blood loss', 'hemorrhage', 'cut', 'wound'], weight: 2 },
  { category: 'allergic', terms: ['allergy', 'allergic', 'hives', 'swelling of face', 'anaphylaxis', 'rash and swelling'], weight: 2 },
  { category: 'burn', terms: ['burn', 'burnt', 'scald', 'scalded'], weight: 3 },
];

/**
 * Detect the best-matching triage category from a free-text description.
 * Returns 'general' when nothing specific matches.
 */
export const detectCategory = (text: string): string => {
  const lower = ` ${(text || '').toLowerCase()} `;
  let best = 'general';
  let bestScore = 0;
  for (const rule of DETECTION) {
    let score = 0;
    for (const term of rule.terms) {
      if (lower.includes(term)) score += rule.weight ?? 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = rule.category;
    }
  }
  return best;
};

export default { QUESTION_BANK, CATEGORY_META, getQuestionsForCategory, detectCategory };
