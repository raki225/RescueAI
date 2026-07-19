import { apiClient } from './client';
import { FirstAidGuide, Hospital } from '../../types';

export interface NearbyParams {
  lat: number;
  lng: number;
  limit?: number;
  radiusKm?: number;
  ownership?: 'all' | 'government' | 'private';
  service?: string;
  emergencyOnly?: boolean;
}

export const hospitalService = {
  async findNearby(params: NearbyParams): Promise<Hospital[]> {
    const { data } = await apiClient.get('/hospitals/nearby', { params });
    return data.data as Hospital[];
  },

  async getFirstAidGuides(): Promise<FirstAidGuide[]> {
    const { data } = await apiClient.get('/hospitals/first-aid');
    return data.data as FirstAidGuide[];
  },
};

export default hospitalService;
