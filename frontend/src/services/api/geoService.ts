import { apiClient } from './client';
import { LocationDetails } from '../../types';

export interface AutocompletePrediction {
  description: string;
  placeId?: string;
}

export interface RouteEstimate {
  distanceKm: number;
  durationMin: number;
  distanceText: string;
  durationText: string;
  provider: 'google' | 'estimate';
}

export interface MatrixRow {
  distanceKm: number;
  durationMin: number;
  provider: 'google' | 'estimate';
}

export const geoService = {
  /** Coordinates → structured Indian location (area/city/district/state/PIN). */
  async reverse(lat: number, lng: number): Promise<LocationDetails> {
    const { data } = await apiClient.get('/geo/reverse', { params: { lat, lng } });
    return data.data as LocationDetails;
  },

  /** Geocode a PIN code, village, town, city, district, landmark or place name. */
  async search(q: string): Promise<LocationDetails[]> {
    const { data } = await apiClient.get('/geo/search', { params: { q } });
    return data.data as LocationDetails[];
  },

  /** Google Places Autocomplete predictions (empty when Maps is not configured). */
  async autocomplete(input: string): Promise<AutocompletePrediction[]> {
    const { data } = await apiClient.get('/geo/autocomplete', { params: { input } });
    return data.data as AutocompletePrediction[];
  },

  /** Directions between two points (Google when configured, else estimate). */
  async directions(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<RouteEstimate> {
    const { data } = await apiClient.get('/geo/directions', {
      params: {
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: destination.lat,
        destLng: destination.lng,
      },
    });
    return { ...(data.data as Omit<RouteEstimate, 'provider'>), provider: data.provider };
  },

  /** Distance/ETA from one origin to many destinations. */
  async distanceMatrix(
    origin: { lat: number; lng: number },
    destinations: { lat: number; lng: number }[]
  ): Promise<MatrixRow[]> {
    const dest = destinations.map((d) => `${d.lat},${d.lng}`).join(';');
    const { data } = await apiClient.get('/geo/distance-matrix', {
      params: { originLat: origin.lat, originLng: origin.lng, destinations: dest },
    });
    return data.data as MatrixRow[];
  },
};

export default geoService;
