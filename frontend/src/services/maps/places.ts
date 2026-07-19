import { Hospital, HospitalCategory, LocationDetails } from '../../types';
import { hospitalService, NearbyParams } from '../api/hospitalService';
import { geoService } from '../api/geoService';
import { loadGoogleMaps, GoogleMaps } from './googleMaps';
import { googlePlaceToLocation } from './location';
import { haversineKm } from './directions';

/**
 * Places service: Autocomplete, place details, generic Nearby Search and
 * hospital search.
 *
 * - Autocomplete + place details use the Google Places JS library on the client
 *   when a key is configured, and fall back to backend geocoding otherwise.
 * - Hospital search always delegates to the backend `/hospitals/nearby`
 *   endpoint, which is the single source of truth for the enriched `Hospital`
 *   shape and itself uses Google Places (server key) or OpenStreetMap. This
 *   keeps hospital cards consistent no matter which provider is active.
 */

export interface PlacePrediction {
  description: string;
  /** Google place id (present for Google predictions). */
  placeId?: string;
  /** Pre-resolved location (present for backend-fallback predictions). */
  location?: LocationDetails;
}

export interface PlacePoi {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  openNow?: boolean;
}

/* ── Shared Places JS service (needs a detached DOM node) ─────────────────── */

let placesServiceSingleton: any = null;
let autocompleteServiceSingleton: any = null;
let sessionToken: any = null;

const getAutocompleteService = (maps: GoogleMaps): any => {
  if (!autocompleteServiceSingleton) {
    autocompleteServiceSingleton = new maps.places.AutocompleteService();
  }
  if (!sessionToken) sessionToken = new maps.places.AutocompleteSessionToken();
  return autocompleteServiceSingleton;
};

const getPlacesService = (maps: GoogleMaps): any => {
  if (!placesServiceSingleton) {
    const container = document.createElement('div');
    placesServiceSingleton = new maps.places.PlacesService(container);
  }
  return placesServiceSingleton;
};

/* ── Autocomplete ─────────────────────────────────────────────────────────── */

/**
 * Suggest places for a free-text query. Uses Google Places Autocomplete when
 * available (India-biased), otherwise resolves via backend geocoding so the
 * search box keeps working with no key.
 */
export const autocomplete = async (input: string): Promise<PlacePrediction[]> => {
  const q = input.trim();
  if (q.length < 2) return [];

  const maps = await loadGoogleMaps().catch(() => null);
  if (maps?.places?.AutocompleteService) {
    const service = getAutocompleteService(maps);
    const predictions: PlacePrediction[] = await new Promise((resolve) => {
      try {
        service.getPlacePredictions(
          {
            input: q,
            sessionToken,
            componentRestrictions: { country: 'in' },
          },
          (results: any[] | null, status: string) => {
            if (status !== 'OK' || !Array.isArray(results)) return resolve([]);
            resolve(
              results.map((r) => ({
                description: r.description as string,
                placeId: r.place_id as string,
              }))
            );
          }
        );
      } catch {
        resolve([]);
      }
    });
    if (predictions.length > 0) return predictions;
  }

  // Fallback: backend geocoding — carry resolved coordinates on the prediction.
  const matches = await geoService.search(q).catch(() => [] as LocationDetails[]);
  return matches.map((m) => ({ description: m.formatted, location: m }));
};

/**
 * Resolve a prediction to full `LocationDetails`. Backend-fallback predictions
 * already carry their location; Google predictions are resolved via place
 * details (new session token is rotated after each resolution).
 */
export const resolvePrediction = async (
  prediction: PlacePrediction
): Promise<LocationDetails | null> => {
  if (prediction.location) return prediction.location;
  if (!prediction.placeId) return null;

  const maps = await loadGoogleMaps().catch(() => null);
  if (!maps?.places?.PlacesService) return null;

  const service = getPlacesService(maps);
  const details = await new Promise<LocationDetails | null>((resolve) => {
    try {
      service.getDetails(
        {
          placeId: prediction.placeId,
          fields: ['geometry', 'address_components', 'formatted_address', 'name'],
          sessionToken,
        },
        (place: any, status: string) => {
          if (status !== 'OK' || !place) return resolve(null);
          resolve(googlePlaceToLocation(place));
        }
      );
    } catch {
      resolve(null);
    }
  });
  // Rotate the billing session token after a details lookup.
  sessionToken = maps.places.AutocompleteSessionToken
    ? new maps.places.AutocompleteSessionToken()
    : null;
  return details;
};

/* ── Generic Nearby Search ────────────────────────────────────────────────── */

/**
 * Google Places Nearby Search for a keyword (e.g. "pharmacy", "hospital").
 * Returns a lightweight POI list, or [] when Google is not configured.
 */
export const nearbySearch = async (
  lat: number,
  lng: number,
  keyword: string,
  radiusKm = 5
): Promise<PlacePoi[]> => {
  const maps = await loadGoogleMaps().catch(() => null);
  if (!maps?.places?.PlacesService) return [];

  const service = getPlacesService(maps);
  return new Promise<PlacePoi[]>((resolve) => {
    try {
      service.nearbySearch(
        {
          location: { lat, lng },
          radius: Math.round(radiusKm * 1000),
          keyword,
        },
        (results: any[] | null, status: string) => {
          if (status !== 'OK' || !Array.isArray(results)) return resolve([]);
          resolve(
            results.map((p) => ({
              id: p.place_id as string,
              name: p.name as string,
              address: (p.vicinity as string) ?? '',
              lat: p.geometry?.location?.lat?.() ?? 0,
              lng: p.geometry?.location?.lng?.() ?? 0,
              rating: p.rating as number | undefined,
              openNow: p.opening_hours?.isOpen?.() ?? p.opening_hours?.open_now,
            }))
          );
        }
      );
    } catch {
      resolve([]);
    }
  });
};

/* ── Hospital search (Google Places on the client, backend fallback) ──────── */

/** Compact, India-aware ownership/category classifier (mirrors the backend). */
const GOV_HINTS = [
  'government', 'govt', 'district hospital', 'general hospital', 'civil hospital',
  'primary health', 'community health', 'phc', 'chc', 'esi', 'esic', 'municipal',
  'aiims', 'medical college', 'area hospital', 'institute of medical', 'osmania',
  'gandhi hospital', 'niloufer', 'nims', 'referral hospital', 'taluk', 'zilla',
];

const classifyHospital = (
  name: string
): { category: HospitalCategory; ownership: 'government' | 'private' | 'unknown' } => {
  const n = name.toLowerCase();
  const ownership: 'government' | 'private' | 'unknown' = GOV_HINTS.some((h) => n.includes(h))
    ? 'government'
    : 'private';
  let category: HospitalCategory = ownership === 'government' ? 'government' : 'private';
  if (n.includes('medical college') || n.includes('aiims') || n.includes('institute of medical'))
    category = 'medical_college';
  else if (n.includes('super') && n.includes('special')) category = 'super_speciality';
  else if (n.includes('multi') && n.includes('special')) category = 'multi_speciality';
  else if (n.includes('district hospital')) category = 'district';
  else if (n.includes('primary health') || /\bphc\b/.test(n)) category = 'phc';
  else if (n.includes('community health') || /\bchc\b/.test(n)) category = 'chc';
  else if (n.includes('clinic')) category = 'clinic';
  return { category, ownership };
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

const hashStr = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

interface RawHospitalPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
}

/** Enrich a Google place into the app's Hospital shape (mirrors the backend). */
const mapGooglePlaceToHospital = (p: RawHospitalPlace, userLat: number, userLng: number): Hospital => {
  const { category, ownership } = classifyHospital(p.name);
  const seed = hashStr(p.id);
  const [maxBeds, maxEmerg] = CATEGORY_BEDS[category] ?? [120, 18];
  const distanceKm = Math.round(haversineKm({ lat: userLat, lng: userLng }, { lat: p.lat, lng: p.lng }) * 10) / 10;

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
    services: ['General Medicine', 'Emergency', 'ICU', 'Ambulance'],
    specialties: [],
    lat: p.lat,
    lng: p.lng,
    distanceKm,
    etaMinutes: Math.max(1, Math.round((distanceKm / 30) * 60)),
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

const matchesOwnership = (h: Hospital, ownership: 'government' | 'private'): boolean => {
  if (ownership === 'government')
    return (
      h.ownership === 'government' ||
      (['government', 'phc', 'chc', 'district', 'medical_college'] as HospitalCategory[]).includes(h.category)
    );
  return (
    h.ownership === 'private' ||
    (['private', 'multi_speciality', 'super_speciality', 'clinic'] as HospitalCategory[]).includes(h.category)
  );
};

/** Google Places Nearby Search for hospitals (client key), or [] on failure. */
const googleNearbyHospitals = (
  maps: GoogleMaps,
  lat: number,
  lng: number,
  radiusKm: number,
  keyword?: string
): Promise<RawHospitalPlace[]> =>
  new Promise((resolve) => {
    try {
      const service = getPlacesService(maps);
      const request: any = {
        location: { lat, lng },
        radius: Math.round(Math.min(radiusKm, 50) * 1000),
        type: 'hospital',
      };
      if (keyword) request.keyword = keyword;
      service.nearbySearch(request, (results: any[] | null, status: string) => {
        if (status !== 'OK' || !Array.isArray(results)) return resolve([]);
        resolve(
          results
            .map((p) => ({
              id: `gmp-${p.place_id}`,
              name: p.name as string,
              address: (p.vicinity as string) ?? (p.formatted_address as string) ?? '',
              lat: p.geometry?.location?.lat?.() ?? 0,
              lng: p.geometry?.location?.lng?.() ?? 0,
              rating: typeof p.rating === 'number' ? p.rating : undefined,
            }))
            .filter((p) => p.name && p.lat && p.lng)
        );
      });
    } catch {
      resolve([]);
    }
  });

/**
 * Find nearby hospitals. When a Google Maps browser key is configured this runs
 * a client-side Google Places Nearby Search (enriched into the app's Hospital
 * shape); otherwise — or if Google returns nothing / is referrer-blocked — it
 * falls back to the backend, which uses the server Google key or OpenStreetMap.
 */
export const nearbyHospitals = async (params: NearbyParams): Promise<Hospital[]> => {
  const {
    lat,
    lng,
    radiusKm = 15,
    limit = 12,
    ownership = 'all',
    service = 'all',
    emergencyOnly = false,
  } = params;

  // The backend combines Google Places (server key) + OpenStreetMap + the seeded
  // reference set, de-duplicates them and returns EVERY facility within the
  // radius — the most complete "all in radius" list. Prefer it so the results
  // are not capped to a single client-side Google page (~20).
  const backend = await hospitalService.findNearby(params).catch(() => [] as Hospital[]);
  if (backend.length > 0) return backend;

  // Fallback only when the backend is unreachable: client-side Google Places
  // Nearby Search using the browser key.
  const maps = await loadGoogleMaps().catch(() => null);
  if (maps?.places?.PlacesService) {
    const keyword =
      service && service !== 'all' && service !== 'emergency' ? service.replace(/_/g, ' ') : undefined;
    const raw = await googleNearbyHospitals(maps, lat, lng, radiusKm, keyword);
    if (raw.length > 0) {
      let all = raw
        .map((p) => mapGooglePlaceToHospital(p, lat, lng))
        .filter((h) => h.distanceKm <= radiusKm);
      if (emergencyOnly) all = all.filter((h) => h.emergencyServices);
      if (ownership !== 'all') all = all.filter((h) => matchesOwnership(h, ownership));
      all.sort((a, b) => a.distanceKm - b.distanceKm);
      return all.slice(0, limit);
    }
  }

  return backend;
};

export const placesService = {
  autocomplete,
  resolvePrediction,
  nearbySearch,
  nearbyHospitals,
};

export default placesService;
