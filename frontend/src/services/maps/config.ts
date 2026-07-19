/**
 * Frontend Google Maps configuration.
 *
 * The key is read once from the Vite environment (`VITE_GOOGLE_MAPS_API_KEY`)
 * and is NEVER hardcoded. When it is absent, `enabled` is false and every maps
 * service transparently falls back to the built-in OpenStreetMap engine, so the
 * application keeps working without any key.
 */

const rawKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim();

export const googleMapsConfig = {
  /** Referrer-restricted browser key for the Maps JavaScript API (may be ''). */
  apiKey: rawKey,
  /** True only when a non-empty key has been provided. */
  enabled: rawKey.length > 0,
  /** JS SDK libraries we rely on (Places = Autocomplete + Nearby Search). */
  libraries: ['places'] as const,
  /** Bias results to India / English, matching the rest of the app. */
  language: 'en',
  region: 'IN',
} as const;

/** Whether client-side Google Maps features can be used. */
export const isGoogleMapsConfigured = (): boolean => googleMapsConfig.enabled;

export default googleMapsConfig;
