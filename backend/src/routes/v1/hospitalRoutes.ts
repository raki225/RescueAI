import { Router } from 'express';
import {
  getNearbyHospitals,
  getFirstAidGuides,
} from '../../controllers/hospitalController';
import { validate } from '../../middleware/validate';
import { nearbySchema } from '../../utils/validators';

const router = Router();

router.get('/first-aid', getFirstAidGuides);
router.get('/nearby', validate(nearbySchema, 'query'), getNearbyHospitals);

export default router;
