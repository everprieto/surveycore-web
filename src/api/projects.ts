import { apiClient } from './client';
import type { Project, ProjectCreate, ProjectPage, ProjectsParams } from '../types';

export const projectsApi = {
  getAll: async (params: ProjectsParams = {}): Promise<ProjectPage> => {
    const response = await apiClient.get<ProjectPage>('/projects/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  create: async (data: ProjectCreate): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects/', data);
    return response.data;
  },
};
