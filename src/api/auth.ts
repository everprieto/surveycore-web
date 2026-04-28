import { apiClient } from './client';
import type { LoginCredentials, RegisterData, AuthToken, User } from '../types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthToken> => {
    const response = await apiClient.post<AuthToken>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  microsoftLogin: async (idToken: string): Promise<AuthToken> => {
    const response = await apiClient.post<AuthToken>('/auth/microsoft', { id_token: idToken });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
