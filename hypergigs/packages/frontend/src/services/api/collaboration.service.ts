import axios from 'axios';
import type {
  CollaborationContext,
  SharedProject,
  SharedTeam,
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

export const collaborationService = {
  /**
   * Get collaboration context with another user
   */
  getCollaborationContext: async (userId: string): Promise<CollaborationContext> => {
    const response = await api.get(`/collaboration/context/${userId}`);
    return response.data.context;
  },

  /**
   * Get shared projects with another user
   */
  getSharedProjects: async (userId: string): Promise<SharedProject[]> => {
    const response = await api.get(`/collaboration/projects/${userId}`);
    return response.data.projects;
  },

  /**
   * Get shared teams with another user
   */
  getSharedTeams: async (userId: string): Promise<SharedTeam[]> => {
    const response = await api.get(`/collaboration/teams/${userId}`);
    return response.data.teams;
  },
};
