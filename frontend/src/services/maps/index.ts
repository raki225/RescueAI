/**
 * Reusable Google Maps service layer for RescueAI.
 *
 * Every service works with OR without a `VITE_GOOGLE_MAPS_API_KEY`:
 * when the key is present the Google Maps Platform is used; when it is absent
 * the app transparently falls back to the built-in OpenStreetMap engine.
 *
 * Usage:
 *   import { locationService, placesService, directionsService } from '@/services/maps';
 */

export { googleMapsConfig, isGoogleMapsConfigured } from './config';
export { loadGoogleMaps, isGoogleMapsLoaded } from './googleMaps';
export type { GoogleMaps } from './googleMaps';

export {
  locationService,
  getCurrentPosition,
  reverseGeocode,
  geocodeSearch,
  googlePlaceToLocation,
} from './location';

export {
  placesService,
  autocomplete,
  resolvePrediction,
  nearbySearch,
  nearbyHospitals,
} from './places';
export type { PlacePrediction, PlacePoi } from './places';

export {
  directionsService,
  getDirections,
  getDistanceMatrix,
  getDirectionsUrl,
  haversineKm,
} from './directions';
export type { LatLng, TravelMode, RouteResult, MatrixResult } from './directions';
