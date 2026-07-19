import { Router } from 'express';
import {
  reverse,
  search,
  autocomplete,
  directions,
  distanceMatrix,
} from '../../controllers/geoController';
import { validate } from '../../middleware/validate';
import {
  reverseGeoSchema,
  geoSearchSchema,
  autocompleteSchema,
  directionsSchema,
  distanceMatrixSchema,
} from '../../utils/validators';

const router = Router();

router.get('/reverse', validate(reverseGeoSchema, 'query'), reverse);
router.get('/search', validate(geoSearchSchema, 'query'), search);
router.get('/autocomplete', validate(autocompleteSchema, 'query'), autocomplete);
router.get('/directions', validate(directionsSchema, 'query'), directions);
router.get('/distance-matrix', validate(distanceMatrixSchema, 'query'), distanceMatrix);

export default router;
