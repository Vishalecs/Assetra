export type RoleName = 'SUPER_ADMIN' | 'IT_ADMIN' | 'EMPLOYEE';

export interface AuthUser {
  userId: string;
  employeeId: string;
  role: RoleName;
  permissions: string[];
  name?: string;
  firstLoginRequired?: boolean;
}

export interface AppRequest {
  user?: AuthUser;
}
