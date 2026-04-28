import { apiClient } from './client';
import type { Question, QuestionDetail, QuestionCreate } from '../types';

export const questionsApi = {
  getAll: async (): Promise<Question[]> => {
    const response = await apiClient.get<Question[]>('/questions/');
    return response.data;
  },

  getById: async (id: number): Promise<QuestionDetail> => {
    const response = await apiClient.get<QuestionDetail>(`/questions/${id}`);
    return response.data;
  },

  create: async (data: QuestionCreate): Promise<QuestionDetail> => {
    const response = await apiClient.post<QuestionDetail>('/questions/', data);
    return response.data;
  },

  publish: async (id: number): Promise<QuestionDetail> => {
    const response = await apiClient.post<QuestionDetail>(`/questions/${id}/publish`);
    return response.data;
  },

  update: async (id: number, data: Partial<QuestionCreate>): Promise<QuestionDetail> => {
    const response = await apiClient.put<QuestionDetail>(`/questions/${id}`, data);
    return response.data;
  },

  addTranslation: async (id: number, data: { language_code: string; question_text: string; is_default_language?: boolean }): Promise<void> => {
    await apiClient.post(`/questions/${id}/translations`, data);
  },

  deleteTranslation: async (questionId: number, translationId: number): Promise<void> => {
    await apiClient.delete(`/questions/${questionId}/translations/${translationId}`);
  },
};
