export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
}
