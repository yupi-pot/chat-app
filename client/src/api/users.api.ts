import api from './axios';
import type { UserSummary, DMPage, UnreadCount } from '../types/chat.types';

export const usersApi = {
  getAll: () =>
    api.get<{ users: UserSummary[] }>('/api/users'),

  getById: (id: string) =>
    api.get<{ user: UserSummary }>(`/api/users/${id}`),

  updateProfile: (data: { username?: string; avatar?: string }) =>
    api.patch('/api/users/me', data),

  getDMHistory: (partnerId: string, cursor?: string) =>
    api.get<DMPage>(`/api/users/${partnerId}/dm`, {
      params: cursor ? { cursor } : {},
    }),

  getUnreadCounts: () =>
    api.get<{ counts: UnreadCount[] }>('/api/users/unread'),
};
