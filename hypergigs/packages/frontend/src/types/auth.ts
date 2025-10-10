export type UserRole = 'FREELANCER' | 'AGENCY' | 'STARTUP';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  bio?: string;
  location?: string;
  avatar?: string;
  available: boolean;
  nextAvailability?: string;
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  username: string;
  role: UserRole;
}

export interface AuthError {
  message: string;
  errors?: Record<string, string[]>;
}
