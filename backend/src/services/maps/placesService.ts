import { HospitalCategory, PlaceHospital } from '../../types';
import { estimateEtaMinutes, haversineKm } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import { NOMINATIM_BASE, nominatimJson } from './geocodeService';

/**
 * Live, India-wide hospital data from OpenStreetMap via the Overpass API.
 * Key-less and works for any coordinate — villages, towns, districts, metros.
 * Bed / ICU / ambulance counts (which OSM does not carry) are synthesised
 * deterministically so a facility always shows the same demo figures.
 */

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const TIMEOUT_MS = 20000;

/* ── Deterministic pseudo-data (stable per facility) ──────────────────────── */

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

/* ── Classification ───────────────────────────────────────────────────────── */

const GOV_HINTS = [
  'government',
  'govt',
  'district hospital',
  'district headquarter',
  'headquarter hospital',
  'general hospital',
  'civil hospital',
  'referral hospital',
  'primary health',
  'community health',
  'phc',
  'chc',
  'esi',
  'esic',
  'municipal',
  'aiims',
  'medical college',
  'sarkari',
  'area hospital',
  'taluk',
  'zilla',
  'rural hospital',
  'gandhi hospital',
  'osmania',
  'niloufer',
  'nims',
  'nizam',
  'government general',
  'institute of medical sciences',
];

export const classifyHospital = (
  name: string,
  tags: Record<string, string> = {}
): { category: HospitalCategory; ownership: 'government' | 'private' | 'unknown' } => {
  const n = name.toLowerCase();
  const operator = (tags.operator ?? '').toLowerCase();
  const opType = (tags['operator:type'] ?? '').toLowerCase();
  const blob = `${n} ${operator}`;

  let ownership: 'government' | 'private' | 'unknown' = 'unknown';
  if (['government', 'public', 'national', 'state', 'municipal'].some((t) => opType.includes(t)))
    ownership = 'government';
  else if (opType.includes('private') || opType.includes('ngo')) ownership = 'private';
  else if (GOV_HINTS.some((h) => blob.includes(h))) ownership = 'government';
  else ownership = 'private';

  let category: HospitalCategory = ownership === 'government' ? 'government' : 'private';
  if (n.includes('medical college') || n.includes('aiims') || n.includes('institute of medical'))
    category = 'medical_college';
  else if (n.includes('super') && n.includes('special')) category = 'super_speciality';
  else if (n.includes('multi') && n.includes('special')) category = 'multi_speciality';
  else if (n.includes('district hospital')) category = 'district';
  else if (n.includes('primary health') || /\bphc\b/.test(n)) category = 'phc';
  else if (n.includes('community health') || /\bchc\b/.test(n)) category = 'chc';
  else if ((tags.amenity ?? tags.healthcare) === 'clinic') category = 'clinic';

  return { category, ownership };
};

const SERVICE_KEYWORDS: { key: string; label: string; terms: string[] }[] = [
  { key: 'cardiology', label: 'Cardiology', terms: ['cardio', 'heart'] },
  { key: 'neurology', label: 'Neurology', terms: ['neuro', 'brain'] },
  { key: 'orthopedic', label: 'Orthopedic', terms: ['ortho', 'bone'] },
  { key: 'pulmonology', label: 'Pulmonology', terms: ['pulmo', 'chest', 'lung'] },
  { key: 'pediatrics', label: 'Pediatrics', terms: ['pediatr', 'paediatr', 'child', 'shishu'] },
  { key: 'maternity', label: "Women's Hospital", terms: ['women', 'maternity', 'matru', 'gyn', 'obstetr'] },
  { key: 'trauma', label: 'Trauma Center', terms: ['trauma', 'accident'] },
  { key: 'burn', label: 'Burn Unit', terms: ['burn'] },
  { key: 'dialysis', label: 'Dialysis', terms: ['dialysis', 'nephro', 'kidney'] },
  { key: 'cancer', label: 'Oncology', terms: ['cancer', 'onco'] },
  { key: 'eye', label: 'Eye Care', terms: ['eye', 'ophthal', 'netra'] },
];

const deriveServices = (name: string, tags: Record<string, string>, seed: number): string[] => {
  const set = new Set<string>();
  const speciality = (tags['healthcare:speciality'] ?? tags.speciality ?? '').toLowerCase();
  const blob = `${name.toLowerCase()} ${speciality}`;

  set.add('General Medicine');
  for (const s of SERVICE_KEYWORDS) {
    if (s.terms.some((t) => blob.includes(t))) set.add(s.label);
  }
  if (speciality) {
    speciality
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => set.add(s.charAt(0).toUpperCase() + s.slice(1)));
  }
  // Deterministically flesh out capabilities for larger facilities.
  const emergency = tags.emergency === 'yes' || seed % 3 !== 0;
  if (emergency) {
    set.add('Emergency');
    set.add('ICU');
    if (seed % 2 === 0) set.add('Ventilator');
    if (seed % 4 !== 0) set.add('Ambulance');
    if (seed % 3 === 0) set.add('Blood Bank');
  }
  return Array.from(set);
};

const buildAddress = (tags: Record<string, string>): string => {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'] ?? tags['addr:neighbourhood'],
    tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:village'],
    tags['addr:district'],
    tags['addr:state'],
    tags['addr:postcode'],
  ].filter(Boolean);
  return parts.join(', ');
};

const CATEGORY_BEDS: Record<HospitalCategory, [number, number]> = {
  medical_college: [600, 60],
  super_speciality: [400, 45],
  multi_speciality: [300, 35],
  district: [350, 40],
  government: [200, 25],
  chc: [50, 8],
  phc: [20, 4],
  private: [120, 18],
  clinic: [10, 2],
  unknown: [80, 10],
};

/* ── Query + mapping ──────────────────────────────────────────────────────── */

const buildQuery = (lat: number, lng: number, radiusM: number): string => `
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${radiusM},${lat},${lng});
  way["amenity"="hospital"](around:${radiusM},${lat},${lng});
  node["healthcare"="hospital"](around:${radiusM},${lat},${lng});
  way["healthcare"="hospital"](around:${radiusM},${lat},${lng});
  node["amenity"="clinic"](around:${radiusM},${lat},${lng});
  way["amenity"="clinic"](around:${radiusM},${lat},${lng});
  node["healthcare"="clinic"](around:${radiusM},${lat},${lng});
);
out center tags;`;

const mapElement = (el: any, userLat: number, userLng: number): PlaceHospital | null => {
  const tags: Record<string, string> = el.tags ?? {};
  const name = tags['name:en'] || tags.name;
  if (!name) return null;

  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const seed = hash(`${el.type}/${el.id}/${name}`);
  const { category, ownership } = classifyHospital(name, tags);
  const services = deriveServices(name, tags, seed);
  const emergencyServices = services.includes('Emergency');
  const is24x7 =
    (tags.opening_hours ?? '').includes('24/7') || category !== 'clinic' ? true : seed % 2 === 0;

  const [maxBeds, maxEmerg] = CATEGORY_BEDS[category];
  const beds = 20 + (seed % Math.max(1, maxBeds - 20));
  const emergencyBeds = emergencyServices ? 1 + (seed % Math.max(1, maxEmerg)) : 0;
  const icuBeds = services.includes('ICU') ? 1 + (seed % 15) : 0;
  const ventilators = services.includes('Ventilator') ? 1 + (seed % 8) : 0;
  const ambulances = services.includes('Ambulance') ? 1 + (seed % 5) : 0;

  const distanceKm = haversineKm(userLat, userLng, lat, lng);

  return {
    id: `osm-${el.type}-${el.id}`,
    name,
    address: buildAddress(tags) || tags['addr:full'] || 'Address not listed — tap Directions',
    phone: tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '108',
    rating: Number((3.6 + (seed % 13) / 10).toFixed(1)),
    category,
    ownership,
    emergencyServices,
    is24x7,
    services,
    specialties: services.filter((s) => s !== 'Emergency' && s !== 'ICU' && s !== 'Ventilator' && s !== 'Ambulance' && s !== 'Blood Bank'),
    lat,
    lng,
    distanceKm: Math.round(distanceKm * 10) / 10,
    etaMinutes: estimateEtaMinutes(distanceKm),
    availability: { beds, emergencyBeds, icuBeds, ventilators, ambulances },
    source: 'live',
  };
};

/**
 * Fetch live hospitals near a coordinate. Tries Overpass mirrors first, then
 * falls back to a bounded Nominatim amenity search so results are available for
 * remote towns and villages too. Returns [] only if every source fails.
 */
export const findLivePlaces = async (
  lat: number,
  lng: number,
  radiusKm: number
): Promise<PlaceHospital[]> => {
  const overpass = await fetchOverpass(lat, lng, radiusKm);
  if (overpass.length > 0) return overpass;

  logger.warn('Overpass returned no data — falling back to Nominatim amenity search');
  return fetchNominatimHospitals(lat, lng, radiusKm);
};

const fetchOverpass = async (
  lat: number,
  lng: number,
  radiusKm: number
): Promise<PlaceHospital[]> => {
  const query = buildQuery(lat, lng, Math.round(radiusKm * 1000));

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('json')) throw new Error('Overpass returned non-JSON (overloaded)');
      const json: any = await res.json();
      const elements: any[] = Array.isArray(json.elements) ? json.elements : [];
      const mapped = elements
        .map((el) => mapElement(el, lat, lng))
        .filter((h): h is PlaceHospital => h !== null)
        .sort((a, b) => a.distanceKm - b.distanceKm);
      if (mapped.length > 0) {
        logger.info(`Overpass returned ${mapped.length} live facilities from ${endpoint}`);
        return mapped;
      }
    } catch (err) {
      logger.warn(`Overpass endpoint ${endpoint} failed: ${(err as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }
  return [];
};

/** Map a raw Nominatim amenity result into a PlaceHospital. */
const mapNominatim = (item: any, userLat: number, userLng: number): PlaceHospital | null => {
  const type = String(item.type ?? '');
  const category = String(item.category ?? item.class ?? '');
  const ok =
    ['hospital', 'clinic', 'doctors', 'healthcare'].includes(type) ||
    ['amenity', 'healthcare', 'building'].includes(category);
  if (!ok) return null;

  const name =
    item.namedetails?.['name:en'] ||
    item.namedetails?.name ||
    (item.display_name ? String(item.display_name).split(',')[0] : '');
  if (!name) return null;

  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const tags: Record<string, string> = item.extratags ?? {};
  const seed = hash(`nom-${item.place_id ?? name}`);
  const { category: cat, ownership } = classifyHospital(name, tags);
  const services = deriveServices(name, tags, seed);
  const emergencyServices = services.includes('Emergency');
  const bedsRange = CATEGORY_BEDS[cat];
  const maxBeds = bedsRange ? bedsRange[0] : 80;
  const maxEmerg = bedsRange ? bedsRange[1] : 10;
  const distanceKm = haversineKm(userLat, userLng, lat, lng);

  return {
    id: `nom-${item.place_id ?? seed}`,
    name,
    address: item.display_name ? String(item.display_name).split(',').slice(1, 5).join(',').trim() : '',
    phone: tags.phone || tags['contact:phone'] || '108',
    rating: Number((3.6 + (seed % 13) / 10).toFixed(1)),
    category: cat,
    ownership,
    emergencyServices,
    is24x7: cat !== 'clinic',
    services,
    specialties: services.filter(
      (s) => !['Emergency', 'ICU', 'Ventilator', 'Ambulance', 'Blood Bank'].includes(s)
    ),
    lat,
    lng,
    distanceKm: Math.round(distanceKm * 10) / 10,
    etaMinutes: estimateEtaMinutes(distanceKm),
    availability: {
      beds: 20 + (seed % Math.max(1, maxBeds - 20)),
      emergencyBeds: emergencyServices ? 1 + (seed % Math.max(1, maxEmerg)) : 0,
      icuBeds: services.includes('ICU') ? 1 + (seed % 15) : 0,
      ventilators: services.includes('Ventilator') ? 1 + (seed % 8) : 0,
      ambulances: services.includes('Ambulance') ? 1 + (seed % 5) : 0,
    },
    source: 'live',
  };
};

const fetchNominatimHospitals = async (
  lat: number,
  lng: number,
  radiusKm: number
): Promise<PlaceHospital[]> => {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  // viewbox = left(minLng), top(maxLat), right(maxLng), bottom(minLat)
  const viewbox = `${lng - dLng},${lat + dLat},${lng + dLng},${lat - dLat}`;
  const url =
    `${NOMINATIM_BASE}/search?format=jsonv2&q=hospital&limit=50&bounded=1` +
    `&viewbox=${viewbox}&addressdetails=1&extratags=1&namedetails=1&countrycodes=in`;

  try {
    const json = await nominatimJson(url);
    const items: any[] = Array.isArray(json) ? json : [];
    const mapped = items
      .map((it) => mapNominatim(it, lat, lng))
      .filter((h): h is PlaceHospital => h !== null)
      .filter((h) => h.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    logger.info(`Nominatim fallback returned ${mapped.length} facilities`);
    return mapped;
  } catch (err) {
    logger.warn(`Nominatim hospital fallback failed: ${(err as Error).message}`);
    return [];
  }
};

export default { findLivePlaces };
