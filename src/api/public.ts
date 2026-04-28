import axios from 'axios';
import type { SurveyTakeData, SurveySubmitData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Separate client without auth token interceptor for public survey routes
const publicClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const publicApi = {
  getTakeSurvey: async (token: string): Promise<SurveyTakeData> => {
    const response = await publicClient.get<SurveyTakeData>(`/public/survey/${token}`);
    return response.data;
  },

  submitSurvey: async (token: string, data: SurveySubmitData): Promise<void> => {
    await publicClient.post(`/public/survey/${token}/submit`, data);
  },
};
