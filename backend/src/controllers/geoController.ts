import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { reverseGeocode, forwardGeocode } from '../services/maps/geocodeService';
import {
  autocomplete as googleAutocomplete,
  directions as googleDirections,
  distanceMatrix as googleDistanceMatrix,
  isGoogleMapsEnabled,
} from '../services/maps/googleMapsService';
import { haversineKm, estimateEtaMinutes } from '../utils/helpers';

/**
 * GET /api/v1/geo/reverse?lat=&lng=
 * Turns coordinates into a structured Indian location (area/city/district/state/PIN).
 */
export const reverse = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng } = req.query as unknown as { lat: number; lng: number };
  const details = await reverseGeocode(Number(lat), Number(lng));
  res.json({ success: true, data: details });
});

/**
 * GET /api/v1/geo/search?q=
 * Geocodes a PIN code, village, town, city, district, landmark, or place name.
 */
export const search = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query as unknown as { q: string };
  const results = await forwardGeocode(String(q));
  res.json({ success: true, count: results.length, data: results });
});

/**
 * GET /api/v1/geo/autocomplete?input=
 * Google Places Autocomplete predictions (empty list when Maps is not configured).
 */
export const autocomplete = asyncHandler(async (req: Request, res: Response) => {
  const { input } = req.query as unknown as { input: string };
  const predictions = isGoogleMapsEnabled() ? await googleAutocomplete(String(input)) : [];
  res.json({
    success: true,
    enabled: isGoogleMapsEnabled(),
    count: predictions.length,
    data: predictions,
  });
});

/**
 * GET /api/v1/geo/directions?originLat=&originLng=&destLat=&destLng=
 * Google Directions when configured, else a great-circle estimate — never fails.
 */
export const directions = asyncHandler(async (req: Request, res: Response) => {
  const { originLat, originLng, destLat, destLng } = req.query as unknown as {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
  };
  const origin = { lat: Number(originLat), lng: Number(originLng) };
  const dest = { lat: Number(destLat), lng: Number(destLng) };

  if (isGoogleMapsEnabled()) {
    const route = await googleDirections(origin, dest);
    if (route) {
      res.json({ success: true, provider: 'google', data: route });
      return;
    }
  }

  // Graceful straight-line fallback.
  const distanceKm = Math.round(haversineKm(origin.lat, origin.lng, dest.lat, dest.lng) * 10) / 10;
  const durationMin = estimateEtaMinutes(distanceKm);
  res.json({
    success: true,
    provider: 'estimate',
    data: {
      distanceKm,
      durationMin,
      distanceText: `~${distanceKm} km`,
      durationText: `~${durationMin} min`,
    },
  });
});

/**
 * GET /api/v1/geo/distance-matrix?originLat=&originLng=&destinations=lat,lng;lat,lng
 * Google Distance Matrix when configured, else per-destination estimates.
 */
export const distanceMatrix = asyncHandler(async (req: Request, res: Response) => {
  const { originLat, originLng, destinations } = req.query as unknown as {
    originLat: number;
    originLng: number;
    destinations: string;
  };
  const origin = { lat: Number(originLat), lng: Number(originLng) };
  const dests = String(destinations)
    .split(';')
    .map((pair) => pair.split(',').map(Number))
    .filter((c) => c.length === 2 && c.every((n) => Number.isFinite(n)))
    .map((c) => ({ lat: c[0] as number, lng: c[1] as number }));

  const estimate = (d: { lat: number; lng: number }) => {
    const distanceKm = Math.round(haversineKm(origin.lat, origin.lng, d.lat, d.lng) * 10) / 10;
    return { distanceKm, durationMin: estimateEtaMinutes(distanceKm), provider: 'estimate' as const };
  };

  let data: { distanceKm: number; durationMin: number; provider: 'google' | 'estimate' }[];
  if (isGoogleMapsEnabled()) {
    const rows = await googleDistanceMatrix(origin, dests);
    data = dests.map((d, i) => {
      const row = rows[i];
      return row ? { ...row, provider: 'google' as const } : estimate(d);
    });
  } else {
    data = dests.map(estimate);
  }

  res.json({ success: true, count: data.length, data });
});

export default { reverse, search, autocomplete, directions, distanceMatrix };
