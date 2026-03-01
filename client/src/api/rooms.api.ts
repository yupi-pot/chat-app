import api from './axios';
import type { Room, RoomDetails, MessagesPage } from '../types/chat.types';

export const roomsApi = {
  getAll: () =>
    api.get<{ rooms: Room[] }>('/api/rooms'),

  getById: (id: string) =>
    api.get<{ room: RoomDetails }>(`/api/rooms/${id}`),

  create: (name: string, description?: string) =>
    api.post<{ room: Room }>('/api/rooms', { name, description }),

  join: (id: string) =>
    api.post(`/api/rooms/${id}/join`),

  leave: (id: string) =>
    api.delete(`/api/rooms/${id}/leave`),

  getMessages: (id: string, cursor?: string) =>
    api.get<MessagesPage>(`/api/rooms/${id}/messages`, {
      params: cursor ? { cursor } : {},
    }),

  updateAvatar: (id: string, avatarUrl: string) =>
    api.patch<{ room: Room }>(`/api/rooms/${id}/avatar`, { avatarUrl }),
};
