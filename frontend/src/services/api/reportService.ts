import { apiClient } from './client';
import { EmergencyReport } from '../../types';

export interface ReportPayload {
  sessionId: string;
  patientInfo?: {
    name?: string;
    age?: number;
    gender?: string;
    preexistingConditions?: string[];
  };
  location?: string;
  hospital?: {
    name?: string;
    address?: string;
    phone?: string;
    distanceKm?: number;
  };
}

export const reportService = {
  async generate(payload: ReportPayload): Promise<EmergencyReport> {
    const { data } = await apiClient.post('/reports', payload);
    return data.data as EmergencyReport;
  },

  async get(reportId: string): Promise<EmergencyReport> {
    const { data } = await apiClient.get(`/reports/${reportId}`);
    return data.data as EmergencyReport;
  },
};

export default reportService;
