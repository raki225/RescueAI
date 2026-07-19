import crypto from 'crypto';
import { AVG_SPEED_KMH } from './constants';

/** Generate a short, URL-safe session identifier. */
export const generateSessionId = (): string => {
  return `rsa_${crypto.randomBytes(9).toString('hex')}`;
};

/**
 * Great-circle distance between two coordinates in kilometres (Haversine).
 */
export const haversineKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth radius (km)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Rough travel-time estimate in minutes for a given distance (km). */
export const estimateEtaMinutes = (distanceKm: number): number => {
  return Math.max(1, Math.round((distanceKm / AVG_SPEED_KMH) * 60));
};

/** Clamp a number to the inclusive [min, max] range. */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/** Strip a data-URL prefix, returning raw base64 payload (if any). */
export const stripDataUrl = (input?: string): string | undefined => {
  if (!input) return undefined;
  const match = input.match(/^data:(.+?);base64,(.*)$/);
  return match ? match[2] ?? input : input;
};

/** Extract the MIME type from a data URL, defaulting to image/jpeg. */
export const dataUrlMime = (input?: string): string => {
  if (!input) return 'image/jpeg';
  const match = input.match(/^data:(.+?);base64,/);
  return match ? match[1] ?? 'image/jpeg' : 'image/jpeg';
};
