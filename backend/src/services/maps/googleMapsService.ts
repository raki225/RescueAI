import { config } from '../../config/env';
import { LocationDetails } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Server-side Google Maps Platform client.
 *
 * Thin, dependency-free REST wrappers around the Google Maps Web Service APIs
 * (Geocoding, Reverse Geocoding, Places Nearby Search, Places Autocomplete,
 * Directions and Distance Matrix). The API key lives ONLY on the server
 * (`GOOGLE_MAPS_API_KEY`) and is never sent to the browser.
 *
 * Every method is safe to call unconditionally: when no key is configured, or a
 * request fails/times out, it resolves to a neutral empty value so callers can
 * fall back to the built-in OpenStreetMap engine. The app never breaks.
 */

const BASE = 'https://maps.googleapis.com/maps/api';
const TIMEOUT_MS = 8000;

/** Whether the Google Maps Platform is configured for the backend. */
export const isGoogleMapsEnabled = (): boolean => config.googleMaps.enabled;

/** Timeout-guarded GET → parsed JSON, or null on any failure. */
const gmFetch = async (path: string, params: Record<string, string>): Promise<any | null> => {
  if (!config.googleMaps.enabled) return null;

  const query = new URLSearchParams({ ...params, key: config.googleMaps.apiKey });
  const url = `${BASE}${path}?${query.toString()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Google Maps HTTP ${res.status}`);
    const json: any = await res.json();
    const status = json.status as string | undefined;
    if (status && status !== 'OK' && status !== 'ZERO_RESULTS') {
      logger.warn(`Google Maps ${path} status=${status} ${json.error_message ?? ''}`.trim());
      return null;
    }
    return json;
  } catch (err) {
    logger.warn(`Google Maps ${path} failed: ${(err as Error).message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/* ── Geocoding helpers ────────────────────────────────────────────────────── */

const pickComponent = (components: any[], type: string): string => {
  const match = components?.find(
    (c) => Array.isArray(c.types) && c.types.includes(type)
  );
  return match?.long_name ?? '';
};

const mapGeocodeResult = (result: any): LocationDetails => {
  const comps: any[] = result.address_components ?? [];
  const loc = result.geometry?.location ?? {};
  const area =
    pickComponent(comps, 'sublocality_level_1') ||
    pickComponent(comps, 'sublocality') ||
    pickComponent(comps, 'neighborhood') ||
    pickComponent(comps, 'route') ||
    pickComponent(comps, 'locality');
  const city =
    pickComponent(comps, 'locality') ||
    pickComponent(comps, 'administrative_area_level_3') ||
    pickComponent(comps, 'administrative_area_level_2');
  const district = pickComponent(comps, 'administrative_area_level_2') || city;
  const state = pickComponent(comps, 'administrative_area_level_1');
  const pincode = pickComponent(comps, 'postal_code');
  const country = pickComponent(comps, 'country') || 'India';

  return {
    lat: Number(loc.lat),
    lng: Number(loc.lng),
    area: area || city || district || 'Selected location',
    city: city || district || area,
    district: district || city,
    state,
    pincode,
    country,
    formatted:
      result.formatted_address ||
      [area, city, district, state, pincode].filter(Boolean).join(', '),
  };
};

/** Reverse geocode coordinates → structured location, or null. */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<LocationDetails | null> => {
  const json = await gmFetch('/geocode/json', { latlng: `${lat},${lng}`, language: 'en' });
  const first = json?.results?.[0];
  return first ? mapGeocodeResult(first) : null;
};

/** Forward geocode free text → candidate locations (India-biased). */
export const geocode = async (query: string): Promise<LocationDetails[]> => {
  const json = await gmFetch('/geocode/json', {
    address: query,
    region: 'in',
    components: 'country:IN',
    language: 'en',
  });
  const results: any[] = json?.results ?? [];
  return results.slice(0, 6).map(mapGeocodeResult);
};

/* ── Places ───────────────────────────────────────────────────────────────── */

export interface GooglePlaceRaw {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating?: number;
  openNow?: boolean;
  types: string[];
}

/**
 * Places Nearby Search for a given type/keyword (default: hospitals). Returns a
 * lightweight normalized list; enrichment into the app's PlaceHospital shape is
 * handled by the hospital locator so classification stays in one place.
 */
export const nearbyPlaces = async (
  lat: number,
  lng: number,
  radiusKm: number,
  opts: { type?: string; keyword?: string } = {}
): Promise<GooglePlaceRaw[]> => {
  const params: Record<string, string> = {
    location: `${lat},${lng}`,
    radius: String(Math.round(Math.min(radiusKm, 50) * 1000)),
    type: opts.type ?? 'hospital',
  };
  if (opts.keyword) params.keyword = opts.keyword;

  const json = await gmFetch('/place/nearbysearch/json', params);
  const results: any[] = json?.results ?? [];
  return results
    .map((p): GooglePlaceRaw | null => {
      const gloc = p.geometry?.location;
      if (!gloc || typeof gloc.lat !== 'number' || typeof gloc.lng !== 'number') return null;
      return {
        id: `gmp-${p.place_id}`,
        name: p.name,
        lat: gloc.lat,
        lng: gloc.lng,
        address: p.vicinity ?? p.formatted_address ?? '',
        rating: typeof p.rating === 'number' ? p.rating : undefined,
        openNow: p.opening_hours?.open_now,
        types: Array.isArray(p.types) ? p.types : [],
      };
    })
    .filter((p): p is GooglePlaceRaw => p !== null);
};

export interface PlaceAutocompletePrediction {
  description: string;
  placeId: string;
}

/** Places Autocomplete predictions for a free-text input (India-biased). */
export const autocomplete = async (input: string): Promise<PlaceAutocompletePrediction[]> => {
  const json = await gmFetch('/place/autocomplete/json', {
    input,
    components: 'country:in',
    language: 'en',
  });
  const predictions: any[] = json?.predictions ?? [];
  return predictions.map((p) => ({ description: p.description, placeId: p.place_id }));
};

/* ── Routing ──────────────────────────────────────────────────────────────── */

export interface RouteLeg {
  distanceKm: number;
  durationMin: number;
  distanceText: string;
  durationText: string;
  polyline?: string;
}

/** Driving directions between two coordinates, or null. */
export const directions = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteLeg | null> => {
  const json = await gmFetch('/directions/json', {
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: 'driving',
  });
  const leg = json?.routes?.[0]?.legs?.[0];
  if (!leg) return null;
  return {
    distanceKm: Math.round(((leg.distance?.value ?? 0) / 1000) * 10) / 10,
    durationMin: Math.max(1, Math.round((leg.duration?.value ?? 0) / 60)),
    distanceText: leg.distance?.text ?? '',
    durationText: leg.duration?.text ?? '',
    polyline: json?.routes?.[0]?.overview_polyline?.points,
  };
};

export interface MatrixElement {
  distanceKm: number;
  durationMin: number;
}

/** Distance Matrix from one origin to many destinations (driving). */
export const distanceMatrix = async (
  origin: { lat: number; lng: number },
  destinations: { lat: number; lng: number }[]
): Promise<(MatrixElement | null)[]> => {
  if (destinations.length === 0) return [];
  const json = await gmFetch('/distancematrix/json', {
    origins: `${origin.lat},${origin.lng}`,
    destinations: destinations.map((d) => `${d.lat},${d.lng}`).join('|'),
    mode: 'driving',
  });
  const elements: any[] = json?.rows?.[0]?.elements ?? [];
  return destinations.map((_, i) => {
    const el = elements[i];
    if (!el || el.status !== 'OK') return null;
    return {
      distanceKm: Math.round(((el.distance?.value ?? 0) / 1000) * 10) / 10,
      durationMin: Math.max(1, Math.round((el.duration?.value ?? 0) / 60)),
    };
  });
};

export const googleMapsService = {
  isGoogleMapsEnabled,
  reverseGeocode,
  geocode,
  nearbyPlaces,
  autocomplete,
  directions,
  distanceMatrix,
};

export default googleMapsService;
