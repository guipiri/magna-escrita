export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  role: UserRole;
}

export interface UserListResponse {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: UserRole;
  createdAt: string;
  units: Array<{
    id: string;
    name: string | null;
    schoolName: string;
  }>;
}

export interface CreateUserRequest {
  email: string;
  role: UserRole;
  unitIds?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  role?: UserRole;
  unitIds?: string[];
}

enum UserRole {
  ADMIN = 'ADMIN',
  SCHOOL = 'SCHOOL',
  CUSTOMER = 'CUSTOMER',
}

export { UserRole };

