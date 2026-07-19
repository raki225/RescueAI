import { loadGoogleMaps, GoogleMaps } from './googleMaps';
import { geoService } from '../api/geoService';

/**
 * Directions & Distance Matrix service. Uses the Google Directions and Distance
 * Matrix services when a key is configured, and falls back to a great-circle
 * (haversine) estimate otherwise. `getDirectionsUrl` always works — it builds a
 * standard Google Maps deep link that needs no API key.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export type TravelMode = 'driving' | 'walking' | 'bicycling' | 'transit';

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  distanceText: string;
  durationText: string;
  provider: 'google' | 'estimate';
  /** Decoded route path (Google only) for drawing on a map. */
  path?: LatLng[];
}

export interface MatrixResult {
  distanceKm: number;
  durationMin: number;
  provider: 'google' | 'estimate';
}

const AVG_SPEED_KMH = 30;

const toRad = (d: number): number => (d * Math.PI) / 180;

/** Great-circle distance between two coordinates in kilometres. */
export const haversineKm = (a: LatLng, b: LatLng): number => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const estimateEtaMin = (km: number): number => Math.max(1, Math.round((km / AVG_SPEED_KMH) * 60));

const estimateRoute = (origin: LatLng, destination: LatLng): RouteResult => {
  const distanceKm = Math.round(haversineKm(origin, destination) * 10) / 10;
  const durationMin = estimateEtaMin(distanceKm);
  return {
    distanceKm,
    durationMin,
    distanceText: `~${distanceKm} km`,
    durationText: `~${durationMin} min`,
    provider: 'estimate',
  };
};

const travelModeEnum = (maps: GoogleMaps, mode: TravelMode): any =>
  maps.TravelMode?.[mode.toUpperCase()] ?? maps.TravelMode?.DRIVING;

/**
 * Turn-by-turn route between two points. Returns a Google route when available,
 * otherwise a straight-line estimate — never throws.
 */
export const getDirections = async (
  origin: LatLng,
  destination: LatLng,
  mode: TravelMode = 'driving'
): Promise<RouteResult> => {
  const maps = await loadGoogleMaps().catch(() => null);
  if (maps?.DirectionsService) {
    const route = await new Promise<RouteResult | null>((resolve) => {
      try {
        const service = new maps.DirectionsService();
        service.route(
          { origin, destination, travelMode: travelModeEnum(maps, mode) },
          (result: any, status: string) => {
            if (status !== 'OK' || !result?.routes?.length) return resolve(null);
            const leg = result.routes[0].legs?.[0];
            if (!leg) return resolve(null);
            const distanceKm = Math.round(((leg.distance?.value ?? 0) / 1000) * 10) / 10;
            const durationMin = Math.max(1, Math.round((leg.duration?.value ?? 0) / 60));
            const path: LatLng[] = (result.routes[0].overview_path ?? []).map((p: any) => ({
              lat: typeof p.lat === 'function' ? p.lat() : p.lat,
              lng: typeof p.lng === 'function' ? p.lng() : p.lng,
            }));
            resolve({
              distanceKm,
              durationMin,
              distanceText: leg.distance?.text ?? `${distanceKm} km`,
              durationText: leg.duration?.text ?? `${durationMin} min`,
              provider: 'google',
              path,
            });
          }
        );
      } catch {
        resolve(null);
      }
    });
    if (route) return route;
  }

  // Secondary fallback: backend (uses the server key when a browser key is not
  // set), which itself returns a Google route or a server-side estimate.
  const backend = await geoService.directions(origin, destination).catch(() => null);
  if (backend) {
    return {
      distanceKm: backend.distanceKm,
      durationMin: backend.durationMin,
      distanceText: backend.distanceText || `${backend.distanceKm} km`,
      durationText: backend.durationText || `${backend.durationMin} min`,
      provider: backend.provider === 'google' ? 'google' : 'estimate',
    };
  }

  return estimateRoute(origin, destination);
};

/**
 * Distance/ETA from one origin to many destinations. Uses the Google Distance
 * Matrix when available, otherwise per-destination haversine estimates.
 */
export const getDistanceMatrix = async (
  origin: LatLng,
  destinations: LatLng[],
  mode: TravelMode = 'driving'
): Promise<MatrixResult[]> => {
  if (destinations.length === 0) return [];

  const maps = await loadGoogleMaps().catch(() => null);
  if (maps?.DistanceMatrixService) {
    const rows = await new Promise<MatrixResult[] | null>((resolve) => {
      try {
        const service = new maps.DistanceMatrixService();
        service.getDistanceMatrix(
          { origins: [origin], destinations, travelMode: travelModeEnum(maps, mode) },
          (result: any, status: string) => {
            const elements = result?.rows?.[0]?.elements;
            if (status !== 'OK' || !Array.isArray(elements)) return resolve(null);
            resolve(
              elements.map((el: any, i: number) => {
                if (el?.status !== 'OK') {
                  return { ...estimateOne(origin, destinations[i]), provider: 'estimate' as const };
                }
                return {
                  distanceKm: Math.round(((el.distance?.value ?? 0) / 1000) * 10) / 10,
                  durationMin: Math.max(1, Math.round((el.duration?.value ?? 0) / 60)),
                  provider: 'google' as const,
                };
              })
            );
          }
        );
      } catch {
        resolve(null);
      }
    });
    if (rows) return rows;
  }

  // Secondary fallback: backend distance matrix (server key or estimate).
  const backend = await geoService.distanceMatrix(origin, destinations).catch(() => null);
  if (backend && backend.length === destinations.length) {
    return backend.map((r) => ({
      distanceKm: r.distanceKm,
      durationMin: r.durationMin,
      provider: r.provider === 'google' ? ('google' as const) : ('estimate' as const),
    }));
  }

  return destinations.map((d) => ({ ...estimateOne(origin, d), provider: 'estimate' as const }));
};

const estimateOne = (origin: LatLng, dest: LatLng): { distanceKm: number; durationMin: number } => {
  const distanceKm = Math.round(haversineKm(origin, dest) * 10) / 10;
  return { distanceKm, durationMin: estimateEtaMin(distanceKm) };
};

/**
 * Build a Google Maps directions deep link. Works with no API key — ideal for
 * an "Open in Google Maps" button.
 */
export const getDirectionsUrl = (destination: LatLng, origin?: LatLng): string => {
  const base = 'https://www.google.com/maps/dir/?api=1';
  const dest = `&destination=${destination.lat},${destination.lng}`;
  const from = origin ? `&origin=${origin.lat},${origin.lng}` : '';
  return `${base}${from}${dest}`;
};

export const directionsService = {
  getDirections,
  getDistanceMatrix,
  getDirectionsUrl,
  haversineKm,
};

export default directionsService;
