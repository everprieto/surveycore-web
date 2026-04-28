import { apiClient } from './client';
import type { SurveyResults, ControlTowerPage, ControlTowerParams } from '../types';

export const resultsApi = {
  getSurveyResults: async (surveyId: number): Promise<SurveyResults> => {
    const response = await apiClient.get<SurveyResults>(`/results/survey/${surveyId}`);
    return response.data;
  },

  getControlTower: async (params: ControlTowerParams = {}): Promise<ControlTowerPage> => {
    const response = await apiClient.get<ControlTowerPage>('/results/control-tower', { params });
    return response.data;
  },
};
