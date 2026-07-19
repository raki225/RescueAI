import { Router } from 'express';
import triageRoutes from './v1/triageRoutes';
import hospitalRoutes from './v1/hospitalRoutes';
import reportRoutes from './v1/reportRoutes';
import geoRoutes from './v1/geoRoutes';

const router = Router();

router.use('/triage', triageRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/reports', reportRoutes);
router.use('/geo', geoRoutes);

router.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'RescueAI API v1',
    endpoints: [
      'POST /api/v1/triage/questions',
      'POST /api/v1/triage/analyze',
      'GET  /api/v1/triage/:sessionId',
      'GET  /api/v1/hospitals/nearby?lat=&lng=&radiusKm=&ownership=&service=',
      'GET  /api/v1/hospitals/first-aid',
      'GET  /api/v1/geo/reverse?lat=&lng=',
      'GET  /api/v1/geo/search?q=',
      'GET  /api/v1/geo/autocomplete?input=',
      'GET  /api/v1/geo/directions?originLat=&originLng=&destLat=&destLng=',
      'GET  /api/v1/geo/distance-matrix?originLat=&originLng=&destinations=lat,lng;lat,lng',
      'POST /api/v1/reports',
      'GET  /api/v1/reports/:reportId',
    ],
  });
});

export default router;
