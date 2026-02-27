import { create } from 'zustand';
import type { AuthState, User } from '../types/auth.types';
import { authApi } from '../api/auth.api';
import { usersApi } from '../api/users.api';
import { setTokenAccessors } from '../api/axios';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  updateProfile: (data: { username?: string; avatar?: string }) => Promise<void>;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => {
  // Wire up axios interceptors to read/write token from this store
  setTokenAccessors(
    () => get().accessToken,
    (token) => set({ accessToken: token })
  );

  return {
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,

    setUser: (user) => set({ user }),
    setAccessToken: (token) => set({ accessToken: token }),

    login: async (email, password) => {
      set({ isLoading: true });
      try {
        const { data } = await authApi.login(email, password);
        set({ user: data.user, accessToken: data.accessToken });
      } finally {
        set({ isLoading: false });
      }
    },

    register: async (email, username, password) => {
      set({ isLoading: true });
      try {
        const { data } = await authApi.register(email, username, password);
        set({ user: data.user, accessToken: data.accessToken });
      } finally {
        set({ isLoading: false });
      }
    },

    logout: async () => {
      set({ isLoading: true });
      try {
        await authApi.logout();
      } finally {
        set({ user: null, accessToken: null, isLoading: false });
      }
    },

    updateProfile: async (data) => {
      const { data: res } = await usersApi.updateProfile(data);
      set((s) => ({ user: s.user ? { ...s.user, ...res.user } : s.user }));
    },

    initialize: async () => {
      try {
        const { data: refreshData } = await authApi.refresh();
        const { data: meData } = await authApi.me();
        set({ user: meData.user, accessToken: refreshData.accessToken });
      } catch {
        // Нет валидного refresh token — пользователь не авторизован
        set({ user: null, accessToken: null });
      } finally {
        set({ isInitialized: true });
      }
    },
  };
});
