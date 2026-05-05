import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
}

export const signInWithGoogle = async (
  idToken: string,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/google', { idToken });
  return response.data;
};

export const fetchMe = async (): Promise<AuthResponse> => {
  const response = await api.get<AuthResponse>('/auth/me');
  return response.data;
};

export const signOut = async (): Promise<{ ok: boolean }> => {
  const response = await api.post<{ ok: boolean }>('/auth/logout');
  return response.data;
};
