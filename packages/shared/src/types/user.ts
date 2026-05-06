export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  role: UserRole;
}

enum UserRole {
  ADMIN = 'ADMIN',
  SCHOOL = 'SCHOOL',
  CUSTOMER = 'CUSTOMER',
}

export { UserRole };
