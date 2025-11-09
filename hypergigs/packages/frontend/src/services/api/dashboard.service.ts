import api from '@/lib/axios';
import type {
  UserDashboardData,
  TeamDashboardData,
  UserDashboardResponse,
  TeamDashboardResponse,
} from '@/types/dashboard';

/**
 * Dashboard API Service
 * Handles all dashboard-related API calls
 */
export const dashboardService = {
  /**
   * Get authenticated user's dashboard data
   * Includes user profile, statistics, recent teams, invitations, and messages
   *
   * @returns Promise<UserDashboardData>
   * @throws Error if request fails
   */
  async getUserDashboard(): Promise<UserDashboardData> {
    const response = await api.get<UserDashboardResponse>('/api/dashboard/user');
    return response.data.data;
  },

  /**
   * Get team dashboard data by team ID
   * Requires user to be owner or member of the team
   *
   * @param teamId - The ID of the team
   * @returns Promise<TeamDashboardData>
   * @throws Error if request fails or user is not authorized
   */
  async getTeamDashboard(teamId: string): Promise<TeamDashboardData> {
    const response = await api.get<TeamDashboardResponse>(`/api/dashboard/team/${teamId}`);
    return response.data.data;
  },
};
