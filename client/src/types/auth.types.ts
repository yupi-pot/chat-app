export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
}
