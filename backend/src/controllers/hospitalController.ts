import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { findNearbyHospitals } from '../services/maps/hospitalLocator';
import { getAllFirstAidGuides } from '../services/ai/firstAidDatabase';

/**
 * GET /api/v1/hospitals/nearby?lat=&lng=&limit=&emergencyOnly=&maxDistanceKm=
 * Returns nearest hospitals sorted by distance with ETA estimates.
 */
export const getNearbyHospitals = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, limit, radiusKm, ownership, service, emergencyOnly } =
    req.query as unknown as {
      lat: number;
      lng: number;
      limit?: number;
      radiusKm?: number;
      ownership?: 'all' | 'government' | 'private';
      service?: string;
      emergencyOnly?: boolean;
    };

  const hospitals = await findNearbyHospitals({
    lat,
    lng,
    limit,
    radiusKm,
    ownership,
    service,
    emergencyOnly,
  });

  res.json({ success: true, count: hospitals.length, data: hospitals });
});

/**
 * GET /api/v1/hospitals/first-aid
 * Returns the browsable first-aid reference guides.
 */
export const getFirstAidGuides = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: getAllFirstAidGuides() });
});

export default { getNearbyHospitals, getFirstAidGuides };
