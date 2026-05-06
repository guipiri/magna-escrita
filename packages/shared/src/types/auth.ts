import type { UserRole } from './user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface GoogleAuthRequest {
  idToken?: string;
  code?: string;
}

export interface GoogleAuthRequest {
  idToken?: string;
  code?: string;
}
