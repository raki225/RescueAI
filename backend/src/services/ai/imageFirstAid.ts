import { ImageCategory } from '../../types';

/**
 * First-aid guidance tailored to a visible image condition. These are safe,
 * layperson-appropriate steps — no medications or procedures needing training.
 */
export const IMAGE_FIRST_AID: Partial<Record<ImageCategory, string[]>> = {
  burn: [
    'Cool the burn under cool (not ice-cold) running water for 20 minutes.',
    'Do NOT apply ice, toothpaste, butter, or oils.',
    'Remove tight items (rings, watches) near the burn before it swells.',
    'Cover loosely with a clean, non-fluffy cloth or cling film.',
    'Do not burst any blisters. Seek hospital care for large, deep, facial, or hand burns.',
  ],
  cut: [
    'Apply firm, direct pressure with a clean cloth to stop the bleeding.',
    'Once bleeding slows, rinse the wound gently with clean water.',
    'Cover with a sterile dressing or clean bandage.',
    'Keep the area raised if possible and watch for signs of infection.',
    'Get medical care for deep, gaping, or heavily bleeding wounds, or if a tetanus shot may be needed.',
  ],
  wound: [
    'Apply direct pressure with a clean cloth to control bleeding.',
    'Do not remove any deeply embedded object — pad around it instead.',
    'Cover with a clean, sterile dressing.',
    'Keep the person still and reassured; watch for shock (pale, cold, faint).',
  ],
  bleeding: [
    'Press firmly on the wound with a clean cloth and keep pressing.',
    'Raise the injured part above heart level if you can.',
    'If blood soaks through, add another cloth on top — do not remove the first.',
    'Call 108/112 if bleeding is heavy, spurting, or will not stop.',
  ],
  skin_rash: [
    'Avoid scratching to prevent infection.',
    'Wash the area gently with mild soap and cool water.',
    'Apply a cool compress to soothe itching.',
    'Monitor for fever or rapid spreading and seek care if either appears.',
  ],
  skin_allergy: [
    'Stop contact with the likely trigger (soap, cosmetic, food, plant).',
    'Rinse the area with cool water.',
    'Avoid scratching; a cool compress can ease itching.',
    'If breathing difficulty or facial/lip swelling appears, call 108/112 immediately.',
  ],
  insect_bite: [
    'Wash the area with soap and water.',
    'Apply a cold pack to reduce swelling and pain.',
    'Do not scratch. Keep the limb still and slightly raised.',
    'Watch closely for spreading swelling, breathing trouble, or dizziness.',
  ],
  animal_bite: [
    'Wash the wound thoroughly with soap and running water for 15 minutes.',
    'Apply gentle pressure with a clean cloth to control bleeding.',
    'Cover with a clean dressing.',
    'Seek medical care urgently — rabies and tetanus prevention may be needed.',
  ],
  swelling: [
    'Rest and raise the swollen area above heart level.',
    'Apply a cold pack wrapped in cloth for 15–20 minutes.',
    'Avoid heat, massage, or tight wrapping.',
    'Seek care if the swelling is rapid, painful, or affects the face/throat.',
  ],
  lip_swelling: [
    'Stop any suspected trigger (new food or medicine).',
    'Apply a cold compress to the lips.',
    'Watch breathing very closely.',
    'If the tongue/throat swells or breathing becomes difficult, call 108/112 now.',
  ],
  eye_redness: [
    'Do not rub the eye.',
    'Rinse gently with clean water if an irritant is suspected.',
    'Avoid contact lenses until reviewed.',
    'Seek care for pain, vision changes, or discharge.',
  ],
  cellulitis: [
    'Rest and raise the affected limb.',
    'Do not squeeze or puncture the area.',
    'Mark the edge of the redness with a pen to track spreading.',
    'Seek medical care promptly — spreading redness/fever needs antibiotics.',
  ],
  boil: [
    'Apply a warm compress several times a day.',
    'Do NOT squeeze or pop the boil.',
    'Keep the area clean and covered.',
    'See a doctor if it is large, very painful, on the face, or you develop fever.',
  ],
  blister: [
    'Leave the blister intact — do not pop it.',
    'Cover with a soft, sterile dressing.',
    'Avoid pressure or rubbing on the area.',
    'Seek care if it looks infected (increasing redness, pus, warmth).',
  ],
  fungal_infection: [
    'Keep the area clean and thoroughly dry.',
    'Wear loose, breathable clothing and change socks/underwear daily.',
    'Avoid sharing towels or footwear.',
    'See a pharmacist or doctor if it spreads or does not improve.',
  ],
  nail_infection: [
    'Soak in warm water a few times a day.',
    'Keep the nail clean and dry.',
    'Do not cut into or dig around the nail.',
    'See a doctor if there is spreading redness, pus, or throbbing pain.',
  ],
  mouth_ulcer: [
    'Rinse with warm salt water.',
    'Avoid spicy, acidic, or very hot foods.',
    'Keep hydrated.',
    'See a doctor if an ulcer lasts more than 2 weeks or is very painful.',
  ],
  chickenpox_rash: [
    'Avoid scratching; keep nails short.',
    'Use cool baths and calamine to ease itching.',
    'Stay away from pregnant women, newborns, and anyone with low immunity.',
    'Seek care for high fever, breathing trouble, or infected-looking spots.',
  ],
};

export const GENERIC_IMAGE_FIRST_AID: string[] = [
  'Keep the area clean and dry.',
  'Avoid scratching, squeezing, or applying unproven home remedies.',
  'Take a clear photo to track any changes over time.',
  'Seek medical care if it worsens, spreads, or you develop a fever.',
];

export const getImageFirstAid = (category: ImageCategory): string[] =>
  IMAGE_FIRST_AID[category] ?? GENERIC_IMAGE_FIRST_AID;

export default getImageFirstAid;
