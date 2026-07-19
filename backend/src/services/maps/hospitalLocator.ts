import { HospitalModel } from '../../models/Hospital';
import { HospitalCategory, PlaceHospital } from '../../types';
import { estimateEtaMinutes, haversineKm } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import { classifyHospital, findLivePlaces } from './placesService';
import { isGoogleMapsEnabled, nearbyPlaces, GooglePlaceRaw } from './googleMapsService';

export type OwnershipFilter = 'all' | 'government' | 'private';

export interface FindHospitalOptions {
  lat: number;
  lng: number;
  limit?: number;
  radiusKm?: number;
  ownership?: OwnershipFilter;
  service?: string;
  emergencyOnly?: boolean;
}

/** Map a filter key (e.g. "cardiology") to the labels stored on a hospital. */
const SERVICE_MATCHERS: Record<string, string[]> = {
  emergency: ['emergency'],
  cardiology: ['cardio'],
  neurology: ['neuro'],
  orthopedic: ['ortho'],
  pulmonology: ['pulmo', 'lung'],
  pediatrics: ['pediatr', 'paediatr', 'child'],
  general: ['general'],
  icu: ['icu'],
  ventilator: ['ventilator'],
  blood_bank: ['blood'],
  ambulance: ['ambulance'],
  women: ['women', 'maternity'],
  children: ['child', 'pediatr'],
  trauma: ['trauma'],
  burn: ['burn'],
  dialysis: ['dialysis'],
};

const matchesService = (h: PlaceHospital, service: string): boolean => {
  if (!service || service === 'all') return true;
  if (service === 'emergency') return h.emergencyServices;
  if (service === 'ambulance')
    return h.availability.ambulances > 0 || h.services.some((s) => /ambulance/i.test(s));
  if (service === 'icu') return h.availability.icuBeds > 0 || h.services.some((s) => /icu/i.test(s));
  if (service === 'ventilator')
    return h.availability.ventilators > 0 || h.services.some((s) => /ventilator/i.test(s));
  const terms = SERVICE_MATCHERS[service] ?? [service];
  const blob = h.services.join(' ').toLowerCase() + ' ' + h.specialties.join(' ').toLowerCase();
  return terms.some((t) => blob.includes(t));
};

const matchesOwnership = (h: PlaceHospital, ownership: OwnershipFilter): boolean => {
  if (ownership === 'all') return true;
  if (ownership === 'government')
    return (
      h.ownership === 'government' ||
      (['government', 'phc', 'chc', 'district', 'medical_college'] as HospitalCategory[]).includes(
        h.category
      )
    );
  return (
    h.ownership === 'private' ||
    (['private', 'multi_speciality', 'super_speciality', 'clinic'] as HospitalCategory[]).includes(
      h.category
    )
  );
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

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

/** Map a seeded Mongo hospital document into the enriched PlaceHospital shape. */
const mapSeedDoc = (doc: any, distanceKm: number): PlaceHospital => {
  const [lng, lat] = doc.location.coordinates;
  const { category, ownership } = classifyHospital(doc.name);
  const seed = hash(String(doc._id ?? doc.name));
  const specialties: string[] = doc.specialties ?? [];
  const services = Array.from(
    new Set(['General Medicine', ...specialties, 'Emergency', 'ICU', 'Ambulance'])
  );
  const beds = CATEGORY_BEDS[category];
  const maxEmerg = beds ? beds[1] : 20;

  return {
    id: String(doc._id ?? `seed-${seed}`),
    name: doc.name,
    address: doc.address ?? '',
    phone: doc.phone || '108',
    rating: doc.rating ?? Number((3.8 + (seed % 10) / 10).toFixed(1)),
    category,
    ownership,
    emergencyServices: doc.emergencyServices ?? true,
    is24x7: doc.operatingHours?.is24x7 ?? true,
    services,
    specialties,
    lat,
    lng,
    distanceKm: Math.round(distanceKm * 10) / 10,
    etaMinutes: estimateEtaMinutes(distanceKm),
    availability: {
      beds: doc.availability?.beds ?? 200,
      emergencyBeds: doc.availability?.emergencyBeds ?? 1 + (seed % Math.max(1, maxEmerg)),
      icuBeds: 5 + (seed % 15),
      ventilators: 1 + (seed % 8),
      ambulances: doc.availability?.ambulances ?? 1 + (seed % 5),
    },
    source: 'seed',
  };
};

/** Enrich a Google Places result into the app's PlaceHospital shape. */
const mapGooglePlace = (
  p: GooglePlaceRaw,
  userLat: number,
  userLng: number
): PlaceHospital => {
  const { category, ownership } = classifyHospital(p.name);
  const seed = hash(p.id);
  const services = Array.from(new Set(['General Medicine', 'Emergency', 'ICU', 'Ambulance']));
  const beds = CATEGORY_BEDS[category];
  const maxBeds = beds ? beds[0] : 120;
  const maxEmerg = beds ? beds[1] : 18;
  const distanceKm = haversineKm(userLat, userLng, p.lat, p.lng);

  return {
    id: p.id,
    name: p.name,
    address: p.address || 'Address not listed — tap Directions',
    phone: '108',
    rating: p.rating ?? Number((3.8 + (seed % 10) / 10).toFixed(1)),
    category,
    ownership,
    emergencyServices: true,
    is24x7: category !== 'clinic',
    services,
    specialties: [],
    lat: p.lat,
    lng: p.lng,
    distanceKm: Math.round(distanceKm * 10) / 10,
    etaMinutes: estimateEtaMinutes(distanceKm),
    availability: {
      beds: 20 + (seed % Math.max(1, maxBeds - 20)),
      emergencyBeds: 1 + (seed % Math.max(1, maxEmerg)),
      icuBeds: 5 + (seed % 15),
      ventilators: 1 + (seed % 8),
      ambulances: 1 + (seed % 5),
    },
    source: 'live',
  };
};

/** Live hospitals from Google Places Nearby Search (empty when not configured). */
const getGooglePlaces = async (
  lat: number,
  lng: number,
  radiusKm: number
): Promise<PlaceHospital[]> => {
  if (!isGoogleMapsEnabled()) return [];
  try {
    const raw = await nearbyPlaces(lat, lng, radiusKm, { type: 'hospital' });
    return raw
      .map((p) => mapGooglePlace(p, lat, lng))
      .filter((h) => h.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  } catch (err) {
    logger.warn(`Google Places nearby failed: ${(err as Error).message}`);
    return [];
  }
};

const getSeedHospitals = async (
  lat: number,
  lng: number,
  radiusKm: number
): Promise<PlaceHospital[]> => {
  try {
    const docs: any[] = await HospitalModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          spherical: true,
          maxDistance: radiusKm * 1000,
        },
      },
      { $limit: 100 },
    ]);
    return docs.map((doc) => mapSeedDoc(doc, doc.distanceMeters / 1000));
  } catch (err) {
    logger.warn(`Seed hospital query failed: ${(err as Error).message}`);
    try {
      const all = await HospitalModel.find({}).lean();
      return all
        .map((doc: any) => {
          const [hLng, hLat] = doc.location.coordinates;
          return mapSeedDoc(doc, haversineKm(lat, lng, hLat, hLng));
        })
        .filter((h) => h.distanceKm <= radiusKm);
    } catch {
      return [];
    }
  }
};

const normalizeName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Merge live + seed, dropping seed entries that duplicate a live facility. */
const mergeDedupe = (live: PlaceHospital[], seed: PlaceHospital[]): PlaceHospital[] => {
  const out = [...live];
  for (const s of seed) {
    const sNorm = normalizeName(s.name);
    const sFirst = sNorm.split(' ')[0] ?? '';
    const dup = live.some((l) => {
      const near = haversineKm(l.lat, l.lng, s.lat, s.lng) < 0.35;
      const lNorm = normalizeName(l.name);
      const lFirst = lNorm.split(' ')[0] ?? '';
      const nameOverlap = lNorm.includes(sNorm) || sNorm.includes(lNorm) || sFirst === lFirst;
      return near && nameOverlap;
    });
    if (!dup) out.push(s);
  }
  return out;
};

/**
 * Find nearby hospitals anywhere in India by combining live OpenStreetMap data
 * with the seeded reference set, then applying type/service filters.
 */
export const findNearbyHospitals = async (opts: FindHospitalOptions): Promise<PlaceHospital[]> => {
  const {
    lat,
    lng,
    limit = 12,
    radiusKm = 15,
    ownership = 'all',
    service = 'all',
    emergencyOnly = false,
  } = opts;

  const [google, live, seed] = await Promise.all([
    getGooglePlaces(lat, lng, radiusKm),
    findLivePlaces(lat, lng, radiusKm).catch(() => [] as PlaceHospital[]),
    getSeedHospitals(lat, lng, radiusKm),
  ]);

  // Google (when configured) is the most authoritative live source. Merge it
  // first, then fold in OSM-live and the seeded reference set, de-duplicating.
  const liveCombined = mergeDedupe(google, live);
  let all = mergeDedupe(liveCombined, seed).filter((h) => h.distanceKm <= radiusKm);

  if (emergencyOnly) all = all.filter((h) => h.emergencyServices);
  if (ownership !== 'all') all = all.filter((h) => matchesOwnership(h, ownership));
  if (service && service !== 'all') all = all.filter((h) => matchesService(h, service));

  all.sort((a, b) => a.distanceKm - b.distanceKm);

  logger.info(
    `Hospitals near ${lat.toFixed(3)},${lng.toFixed(3)} r=${radiusKm}km → ${all.length} (google=${google.length}, live=${live.length}, seed=${seed.length})`
  );

  return all.slice(0, limit);
};

export default findNearbyHospitals;
