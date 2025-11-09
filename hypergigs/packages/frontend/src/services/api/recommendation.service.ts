import axios from 'axios';
import type {
  Recommendation,
  CreateRecommendationRequest,
  UpdateRecommendationRequest
} from '@/types/user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const recommendationService = {
  /**
   * Create a new recommendation request
   */
  createRecommendation: async (data: CreateRecommendationRequest): Promise<Recommendation> => {
    const response = await api.post('/recommendations', data);
    return response.data.recommendation;
  },

  /**
   * Get recommendations for a specific portfolio
   */
  getPortfolioRecommendations: async (portfolioId: string): Promise<Recommendation[]> => {
    const response = await api.get(`/recommendations/portfolio/${portfolioId}`);
    return response.data.recommendations;
  },

  /**
   * Get all recommendations for a user
   */
  getUserRecommendations: async (userId: string): Promise<Recommendation[]> => {
    const response = await api.get(`/recommendations/user/${userId}`);
    return response.data.recommendations;
  },

  /**
   * Update recommendation status (accept/reject)
   */
  updateRecommendationStatus: async (
    id: string,
    data: UpdateRecommendationRequest
  ): Promise<Recommendation> => {
    const response = await api.patch(`/recommendations/${id}/status`, data);
    return response.data.recommendation;
  },

  /**
   * Delete a recommendation
   */
  deleteRecommendation: async (id: string): Promise<void> => {
    await api.delete(`/recommendations/${id}`);
  },
};
