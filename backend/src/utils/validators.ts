import Joi from 'joi';

const answerSchema = Joi.object({
  id: Joi.string().max(60).required(),
  value: Joi.alternatives(
    Joi.string().allow('').max(200),
    Joi.number(),
    Joi.boolean(),
    Joi.array().items(Joi.string().max(200)).max(20)
  ).required(),
});

/** POST /triage/analyze */
export const triageSchema = Joi.object({
  text: Joi.string().allow('').max(5000).default(''),
  // Accept a base64 data URL or raw base64 image payload.
  image: Joi.string().allow('').max(15_000_000).optional(),
  imageCategory: Joi.string().max(40).optional(),
  category: Joi.string().max(40).optional(),
  answers: Joi.array().items(answerSchema).max(50).optional(),
  imageAnalysis: Joi.object().unknown(true).optional(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    address: Joi.string().allow('').optional(),
  }).optional(),
});

/** POST /triage/questions */
export const questionsSchema = Joi.object({
  text: Joi.string().allow('').max(5000).default(''),
  image: Joi.string().allow('').max(15_000_000).optional(),
  imageCategory: Joi.string().max(40).optional(),
});

/** GET /hospitals/nearby */
export const nearbySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  limit: Joi.number().integer().min(1).max(100).default(12),
  radiusKm: Joi.number().min(1).max(200).default(15),
  ownership: Joi.string().valid('all', 'government', 'private').default('all'),
  service: Joi.string().max(40).default('all'),
  emergencyOnly: Joi.boolean().default(false),
});

/** GET /geo/reverse */
export const reverseGeoSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
});

/** GET /geo/search */
export const geoSearchSchema = Joi.object({
  q: Joi.string().min(2).max(200).required(),
});

/** GET /geo/autocomplete */
export const autocompleteSchema = Joi.object({
  input: Joi.string().min(2).max(200).required(),
});

/** GET /geo/directions */
export const directionsSchema = Joi.object({
  originLat: Joi.number().min(-90).max(90).required(),
  originLng: Joi.number().min(-180).max(180).required(),
  destLat: Joi.number().min(-90).max(90).required(),
  destLng: Joi.number().min(-180).max(180).required(),
});

/** GET /geo/distance-matrix — destinations as "lat,lng;lat,lng;…" */
export const distanceMatrixSchema = Joi.object({
  originLat: Joi.number().min(-90).max(90).required(),
  originLng: Joi.number().min(-180).max(180).required(),
  destinations: Joi.string().max(1000).required(),
});

/** POST /reports */
export const reportSchema = Joi.object({
  sessionId: Joi.string().required(),
  patientInfo: Joi.object({
    name: Joi.string().allow('').max(120).optional(),
    age: Joi.number().integer().min(0).max(130).optional(),
    gender: Joi.string().valid('male', 'female', 'other', 'unspecified').optional(),
    preexistingConditions: Joi.array().items(Joi.string().max(120)).optional(),
  }).optional(),
  location: Joi.string().allow('').max(300).optional(),
  hospital: Joi.object({
    name: Joi.string().allow('').max(200).optional(),
    address: Joi.string().allow('').max(300).optional(),
    phone: Joi.string().allow('').max(40).optional(),
    distanceKm: Joi.number().min(0).optional(),
  }).optional(),
});
