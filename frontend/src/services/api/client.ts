import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export interface ApiErrorShape {
  message: string;
  details?: string[];
}

/** Normalise any Axios/network error into a friendly, displayable message. */
export const toApiError = (err: unknown): ApiErrorShape => {
  const axiosErr = err as AxiosError<{ error?: ApiErrorShape }>;
  if (axiosErr.response?.data?.error) {
    return axiosErr.response.data.error;
  }
  if (axiosErr.code === 'ECONNABORTED') {
    return { message: 'The request timed out. Please try again.' };
  }
  if (axiosErr.message === 'Network Error') {
    return {
      message:
        'Cannot reach the RescueAI server. Make sure the backend is running on port 4000.',
    };
  }
  return { message: (err as Error)?.message || 'Something went wrong. Please try again.' };
};

export default apiClient;
