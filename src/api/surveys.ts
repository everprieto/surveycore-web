import { apiClient } from './client';
import type { Survey, SurveyCreate, SurveyConfig, RecipientCreate, SurveyTakeData } from '../types';

export const surveysApi = {
  create: async (data: SurveyCreate): Promise<Survey> => {
    const response = await apiClient.post<Survey>('/surveys/', data);
    return response.data;
  },

  getConfig: async (id: number): Promise<SurveyConfig> => {
    const response = await apiClient.get<SurveyConfig>(`/surveys/${id}`);
    return response.data;
  },

  addQuestion: async (surveyId: number, masterQuestionId: number): Promise<void> => {
    await apiClient.post(`/surveys/${surveyId}/questions`, { master_question_id: masterQuestionId });
  },

  removeQuestion: async (surveyId: number, sqId: number): Promise<void> => {
    await apiClient.delete(`/surveys/${surveyId}/questions/${sqId}`);
  },

  addRecipient: async (surveyId: number, data: RecipientCreate): Promise<void> => {
    await apiClient.post(`/surveys/${surveyId}/recipients`, data);
  },

  removeRecipient: async (surveyId: number, recipientId: number): Promise<void> => {
    await apiClient.delete(`/surveys/${surveyId}/recipients/${recipientId}`);
  },

  generateLinks: async (surveyId: number): Promise<void> => {
    await apiClient.post(`/surveys/${surveyId}/generate-links`);
  },

  getPreview: async (surveyId: number): Promise<SurveyTakeData> => {
    const response = await apiClient.get<SurveyTakeData>(`/surveys/${surveyId}/preview`);
    return response.data;
  },

  getProjectSurveys: async (projectId: number): Promise<ProjectSurveyRow[]> => {
    const response = await apiClient.get<ProjectSurveyRow[]>(`/results/project/${projectId}/surveys`);
    return response.data;
  },
};

// Matches backend CompletionStats schema
export interface ProjectSurveyRow {
  survey_id: number;
  survey_type: string;
  language_code: string;
  survey_status: string;
  planned_send_date: string;
  total_sent: number;
  total_completed: number;
  last_response_at?: string;
}
