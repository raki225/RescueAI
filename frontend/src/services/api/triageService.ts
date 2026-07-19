import { apiClient } from './client';
import {
  FollowUpAnswer,
  GeoLocation,
  ImageAnalysis,
  ImageCategory,
  QuestionsResponse,
  TriageResult,
} from '../../types';

export interface QuestionsPayload {
  text?: string;
  image?: string;
  imageCategory?: ImageCategory;
}

export interface AnalyzePayload {
  text?: string;
  image?: string;
  imageCategory?: ImageCategory;
  category?: string;
  answers?: FollowUpAnswer[];
  imageAnalysis?: ImageAnalysis;
  location?: GeoLocation;
}

export const triageService = {
  /** Stage 1 — detect category + get adaptive follow-up questions (analyses image if present). */
  async getQuestions(payload: QuestionsPayload): Promise<QuestionsResponse> {
    const { data } = await apiClient.post('/triage/questions', payload);
    return data.data as QuestionsResponse;
  },

  /** Stage 2 — risk-scored assessment from symptoms + image findings + answers. */
  async analyze(payload: AnalyzePayload): Promise<TriageResult> {
    const { data } = await apiClient.post('/triage/analyze', payload);
    return data.data as TriageResult;
  },

  async getSession(sessionId: string) {
    const { data } = await apiClient.get(`/triage/${sessionId}`);
    return data.data;
  },
};

export default triageService;
