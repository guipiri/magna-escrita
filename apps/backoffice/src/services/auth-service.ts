import { api } from './api';
import { AuthResponse, GoogleAuthRequest } from '@repo/shared';

export const signInWithGoogle = async (
  payload: GoogleAuthRequest,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    '/auth/backoffice/google',
    payload,
  );
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
