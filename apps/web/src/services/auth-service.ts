import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

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
