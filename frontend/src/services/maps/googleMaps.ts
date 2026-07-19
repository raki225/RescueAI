import { googleMapsConfig, isGoogleMapsConfigured } from './config';

/**
 * Lazy, dependency-free loader for the Google Maps JavaScript SDK.
 *
 * `loadGoogleMaps()` injects the script only once (and only when a key is
 * configured), resolving with the global `google.maps` namespace. If no key is
 * present, or the script fails to load, it resolves with `null` so callers can
 * gracefully fall back to the OpenStreetMap-based services — the app never
 * breaks because of a missing or invalid key.
 *
 * The SDK is typed loosely (`GoogleMaps = any`) on purpose: it keeps the public
 * service API fully typed without pulling in the heavy `@types/google.maps`
 * dependency, and the higher-level services (`location`, `places`,
 * `directions`) expose strongly-typed results.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GoogleMaps = any;

declare global {
  interface Window {
    google?: { maps?: GoogleMaps };
    /** JSONP-style callback used by the Maps loader. */
    __rescueaiGmapsReady?: () => void;
  }
}

const CALLBACK_NAME = '__rescueaiGmapsReady';
let loaderPromise: Promise<GoogleMaps | null> | null = null;

const scriptUrl = (): string => {
  const params = new URLSearchParams({
    key: googleMapsConfig.apiKey,
    libraries: googleMapsConfig.libraries.join(','),
    language: googleMapsConfig.language,
    region: googleMapsConfig.region,
    loading: 'async',
    callback: CALLBACK_NAME,
  });
  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
};

/**
 * Load (or reuse) the Google Maps JS SDK. Resolves with the `google.maps`
 * namespace, or `null` when Maps is not configured / cannot be loaded.
 */
export const loadGoogleMaps = (): Promise<GoogleMaps | null> => {
  if (!isGoogleMapsConfigured()) return Promise.resolve(null);
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null);
  }
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<GoogleMaps | null>((resolve) => {
    let settled = false;
    const finish = (value: GoogleMaps | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    // Safety timeout — never hang the UI waiting on the SDK.
    const timeout = window.setTimeout(() => finish(null), 12000);

    window[CALLBACK_NAME] = () => {
      window.clearTimeout(timeout);
      finish(window.google?.maps ?? null);
    };

    const script = document.createElement('script');
    script.src = scriptUrl();
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      window.clearTimeout(timeout);
      // Allow a future retry (e.g. after connectivity returns).
      loaderPromise = null;
      finish(null);
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
};

/** True once the SDK is present in the page (after a successful load). */
export const isGoogleMapsLoaded = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.google?.maps);

export { isGoogleMapsConfigured, googleMapsConfig };
export default loadGoogleMaps;
