import { LocationDetails } from '../../types';
import { logger } from '../../utils/logger';
import { isGoogleMapsEnabled, reverseGeocode as googleReverse, geocode as googleGeocode } from './googleMapsService';

/**
 * Free, key-less geocoding via OpenStreetMap Nominatim.
 * Works for every PIN code, village, town, district and city in India — no
 * hardcoded locations. Results are cached in-memory to respect usage limits.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'RescueAI-Emergency-Triage/1.0 (+https://github.com/rescueai)';
const TIMEOUT_MS = 8000;

const cache = new Map<string, { value: unknown; expires: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

const getCached = <T>(key: string): T | undefined => {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  cache.delete(key);
  return undefined;
};

const setCached = (key: string, value: unknown): void => {
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await politeFetch(url);
  return res.json();
};

/** Shared, rate-limit-friendly Nominatim GET (used by places fallback too). */
export const nominatimJson = (url: string): Promise<any> => fetchJson(url);

export const NOMINATIM_BASE = NOMINATIM;

/**
 * Nominatim allows ~1 request/second. We serialise calls through a queue with
 * a minimum spacing and retry once on a rate-limit (403/429) response so bursts
 * (e.g. reverse + search) never fail.
 */
const MIN_SPACING_MS = 1200;
let chain: Promise<unknown> = Promise.resolve();
let lastCall = 0;

const politeFetch = (url: string): Promise<Response> => {
  const run = async (): Promise<Response> => {
    const wait = Math.max(0, MIN_SPACING_MS - (Date.now() - lastCall));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));

    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
          signal: controller.signal,
        });
        lastCall = Date.now();
        if ((res.status === 429 || res.status === 403) && attempt === 0) {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
        return res;
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error('Nominatim rate limited');
  };

  const next = chain.then(run, run);
  chain = next.catch(() => undefined);
  return next;
};

/** Pick the most specific available field from a Nominatim address block. */
const pick = (addr: any, keys: string[]): string => {
  for (const k of keys) {
    if (addr?.[k]) return String(addr[k]);
  }
  return '';
};

const toDetails = (item: any): LocationDetails => {
  const addr = item.address ?? {};
  const area = pick(addr, [
    'suburb',
    'neighbourhood',
    'village',
    'hamlet',
    'town',
    'city_district',
    'locality',
    'quarter',
    'residential',
    'road',
  ]);
  const city = pick(addr, ['city', 'town', 'village', 'municipality', 'county']);
  const district = pick(addr, ['state_district', 'district', 'county']);
  const state = pick(addr, ['state', 'region']);
  const pincode = pick(addr, ['postcode']);
  const country = pick(addr, ['country']) || 'India';

  const formattedParts = [area, city, district, state, pincode].filter(
    (v, i, arr) => v && arr.indexOf(v) === i
  );

  return {
    lat: Number(item.lat),
    lng: Number(item.lon),
    area: area || city || district || 'Unknown area',
    city: city || district || area,
    district: district || city,
    state,
    pincode,
    country,
    formatted: item.display_name || formattedParts.join(', '),
  };
};

/** Convert coordinates → structured Indian location (area/city/district/state/PIN). */
export const reverseGeocode = async (lat: number, lng: number): Promise<LocationDetails> => {
  const key = `rev:${lat.toFixed(4)}:${lng.toFixed(4)}`;
  const cached = getCached<LocationDetails>(key);
  if (cached) return cached;

  // Prefer Google Maps when a key is configured; fall back to Nominatim.
  if (isGoogleMapsEnabled()) {
    const google = await googleReverse(lat, lng).catch(() => null);
    if (google) {
      setCached(key, google);
      return google;
    }
  }

  try {
    const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=16`;
    const json = await fetchJson(url);
    const details = toDetails(json);
    setCached(key, details);
    return details;
  } catch (err) {
    logger.warn(`Reverse geocode failed: ${(err as Error).message}`);
    // Never fail hard — return coordinates so the app keeps working.
    return {
      lat,
      lng,
      area: 'Your location',
      city: '',
      district: '',
      state: '',
      pincode: '',
      country: 'India',
      formatted: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
  }
};

/**
 * Forward geocode a free-text query (PIN code, village, town, city, district,
 * landmark, or hospital name). Biased to India but not restricted to any city.
 */
export const forwardGeocode = async (query: string): Promise<LocationDetails[]> => {
  const q = query.trim();
  if (!q) return [];
  const key = `fwd:${q.toLowerCase()}`;
  const cached = getCached<LocationDetails[]>(key);
  if (cached) return cached;

  // Prefer Google Maps when a key is configured; fall back to Nominatim.
  if (isGoogleMapsEnabled()) {
    const google = await googleGeocode(q).catch(() => [] as LocationDetails[]);
    if (google.length > 0) {
      setCached(key, google);
      return google;
    }
  }

  const isPin = /^\d{6}$/.test(q);
  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'in',
    limit: '6',
  });
  if (isPin) params.set('postalcode', q);
  else params.set('q', q);

  try {
    const json = await fetchJson(`${NOMINATIM}/search?${params.toString()}`);
    const results = Array.isArray(json) ? json.map(toDetails) : [];
    setCached(key, results);
    return results;
  } catch (err) {
    logger.warn(`Forward geocode failed: ${(err as Error).message}`);
    return [];
  }
};

export default { reverseGeocode, forwardGeocode };
