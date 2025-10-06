import api from '@/lib/axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/types/auth';

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  /**
   * Get current authenticated user
   */
  async me(): Promise<User> {
    const response = await api.get<{ user: User }>('/api/auth/me');
    return response.data.user;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },
};
