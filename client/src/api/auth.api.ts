import api from './axios';
import type { User } from '../types/auth.types';

interface AuthResponse {
  user: User;
  accessToken: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { email, password }),

  register: (email: string, username: string, password: string) =>
    api.post<AuthResponse>('/api/auth/register', { email, username, password }),

  logout: () =>
    api.post('/api/auth/logout'),

  refresh: () =>
    api.post<AuthResponse>('/api/auth/refresh'),

  me: () =>
    api.get<{ user: User }>('/api/auth/me'),
};
