import { GeoLocation, LocationDetails } from '../../types';
import { geoService } from '../api/geoService';
import { loadGoogleMaps, GoogleMaps } from './googleMaps';

/**
 * Location service: browser geolocation, forward geocoding and reverse
 * geocoding. When a Google Maps key is configured the Google Geocoder is used;
 * otherwise every call transparently falls back to the backend
 * (OpenStreetMap / Nominatim) endpoints. Public results are always the app's
 * `LocationDetails` shape, regardless of the underlying provider.
 */

/* ── Browser geolocation ──────────────────────────────────────────────────── */

/**
 * Resolve the device's current position. There is intentionally NO hardcoded
 * fallback location — the promise rejects when GPS is unavailable so the UI can
 * offer manual PIN / area / city search instead of assuming a city.
 */
export const getCurrentPosition = (): Promise<GeoLocation> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyMeters: Math.round(pos.coords.accuracy),
        }),
      (err) => reject(new Error(err.message || 'Could not get your location.')),
      // maximumAge:0 forces a fresh fix so a stale, coarse (IP/Wi-Fi) position
      // from another tab/app is never reused; give GPS a little longer to lock.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });

/* ── Google → LocationDetails mapping ─────────────────────────────────────── */

const componentValue = (
  components: any[],
  type: string,
  short = false
): string => {
  const match = components?.find((c) => Array.isArray(c.types) && c.types.includes(type));
  if (!match) return '';
  return short ? match.short_name ?? match.long_name ?? '' : match.long_name ?? match.short_name ?? '';
};

/**
 * Map a Google Geocoder result OR Places `getDetails` result (both share
 * `address_components` + `geometry.location` + `formatted_address`) into the
 * app's `LocationDetails` shape.
 */
export const googlePlaceToLocation = (result: any): LocationDetails => {
  const comps: any[] = result.address_components ?? [];
  const loc = result.geometry?.location;
  const lat = typeof loc?.lat === 'function' ? loc.lat() : Number(loc?.lat);
  const lng = typeof loc?.lng === 'function' ? loc.lng() : Number(loc?.lng);

  const area =
    componentValue(comps, 'sublocality_level_1') ||
    componentValue(comps, 'sublocality') ||
    componentValue(comps, 'neighborhood') ||
    componentValue(comps, 'route') ||
    componentValue(comps, 'locality');
  const city =
    componentValue(comps, 'locality') ||
    componentValue(comps, 'administrative_area_level_3') ||
    componentValue(comps, 'administrative_area_level_2');
  const district = componentValue(comps, 'administrative_area_level_2') || city;
  const state = componentValue(comps, 'administrative_area_level_1');
  const pincode = componentValue(comps, 'postal_code');
  const country = componentValue(comps, 'country') || 'India';

  return {
    lat,
    lng,
    area: area || city || district || 'Selected location',
    city: city || district || area,
    district: district || city,
    state,
    pincode,
    country,
    formatted: result.formatted_address || [area, city, district, state, pincode].filter(Boolean).join(', '),
  };
};

const runGeocoder = (maps: GoogleMaps, request: Record<string, unknown>): Promise<any[]> =>
  new Promise((resolve) => {
    try {
      const geocoder = new maps.Geocoder();
      geocoder.geocode(request, (results: any[] | null, status: string) => {
        resolve(status === 'OK' && Array.isArray(results) ? results : []);
      });
    } catch {
      resolve([]);
    }
  });

/* ── Public API (Google when available, backend otherwise) ────────────────── */

/**
 * Convert coordinates → structured Indian location (area/city/district/PIN).
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<LocationDetails> => {
  const maps = await loadGoogleMaps().catch(() => null);
  if (maps) {
    const results = await runGeocoder(maps, { location: { lat, lng } });
    if (results.length > 0) return googlePlaceToLocation(results[0]);
  }
  // Fallback: backend Nominatim reverse geocoder.
  return geoService.reverse(lat, lng);
};

/**
 * Forward-geocode free text (PIN code, village, town, city, district, landmark
 * or place name) into one or more candidate locations.
 */
export const geocodeSearch = async (query: string): Promise<LocationDetails[]> => {
  const q = query.trim();
  if (q.length < 2) return [];

  const maps = await loadGoogleMaps().catch(() => null);
  if (maps) {
    const results = await runGeocoder(maps, {
      address: q,
      region: 'IN',
      componentRestrictions: { country: 'IN' },
    });
    if (results.length > 0) return results.slice(0, 6).map(googlePlaceToLocation);
  }
  // Fallback: backend Nominatim search.
  return geoService.search(q);
};

export const locationService = {
  getCurrentPosition,
  reverseGeocode,
  geocodeSearch,
};

export default locationService;
