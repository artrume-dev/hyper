export type UserRole = 'FREELANCER' | 'AGENCY' | 'STARTUP';
export type Currency = 'USD' | 'GBP' | 'EUR';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  bio?: string;
  jobTitle?: string;
  location?: string;
  country?: string;
  avatar?: string;
  available: boolean;
  nextAvailability?: string;
  hourlyRate?: number;
  currency: Currency;
  hasVerifiedBadge?: boolean; // True if user has 1+ accepted recommendations
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
  country?: string;
  invitationToken?: string;
}

export interface OAuthRegisterRequest {
  provider: 'google' | 'linkedin';
  token: string;
  role: UserRole;
  country?: string;
}

export interface AuthError {
  message: string;
  errors?: Record<string, string[]>;
}
