import api from '@/lib/axios';
import type {
  Team,
  TeamWithRole,
  TeamMember,
  CreateTeamRequest,
  UpdateTeamRequest,
  SearchTeamsFilters,
  PaginatedTeams,
  AddMemberRequest,
  UpdateMemberRoleRequest,
} from '@/types/team';

export const teamService = {
  /**
   * Create a new team
   */
  async createTeam(data: CreateTeamRequest): Promise<Team> {
    const response = await api.post<{ team: Team }>('/api/teams', data);
    return response.data.team;
  },

  /**
   * Get all teams with filters
   */
  async getTeams(filters?: SearchTeamsFilters): Promise<PaginatedTeams> {
    const response = await api.get<PaginatedTeams>('/api/teams', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get user's teams
   */
  async getMyTeams(): Promise<TeamWithRole[]> {
    const response = await api.get<{ teams: TeamWithRole[] }>('/api/teams/my-teams');
    return response.data.teams;
  },

  /**
   * Get team by ID or slug
   */
  async getTeam(identifier: string): Promise<Team> {
    const response = await api.get<{ team: Team }>(`/api/teams/${identifier}`);
    return response.data.team;
  },

  /**
   * Update team (owner only)
   */
  async updateTeam(teamId: string, data: UpdateTeamRequest): Promise<Team> {
    const response = await api.put<{ team: Team }>(`/api/teams/${teamId}`, data);
    return response.data.team;
  },

  /**
   * Delete team (owner only)
   */
  async deleteTeam(teamId: string): Promise<void> {
    await api.delete(`/api/teams/${teamId}`);
  },

  /**
   * Get team members
   */
  async getMembers(teamId: string): Promise<TeamMember[]> {
    const response = await api.get<{ members: TeamMember[] }>(
      `/api/teams/${teamId}/members`
    );
    return response.data.members;
  },

  /**
   * Add member to team (owner/admin only)
   */
  async addMember(teamId: string, data: AddMemberRequest): Promise<TeamMember> {
    const response = await api.post<{ member: TeamMember }>(
      `/api/teams/${teamId}/members`,
      data
    );
    return response.data.member;
  },

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, userId: string): Promise<void> {
    await api.delete(`/api/teams/${teamId}/members/${userId}`);
  },

  /**
   * Update member role (owner only)
   */
  async updateMemberRole(
    teamId: string,
    userId: string,
    data: UpdateMemberRoleRequest
  ): Promise<TeamMember> {
    const response = await api.put<{ member: TeamMember }>(
      `/api/teams/${teamId}/members/${userId}/role`,
      data
    );
    return response.data.member;
  },

  /**
   * Leave team
   */
  async leaveTeam(teamId: string): Promise<void> {
    await api.post(`/api/teams/${teamId}/leave`);
  },

  /**
   * Create a sub-team under a parent team
   */
  async createSubTeam(
    parentTeamId: string,
    data: CreateTeamRequest
  ): Promise<Team> {
    const response = await api.post<{ team: Team }>(
      `/api/teams/${parentTeamId}/sub-teams`,
      data
    );
    return response.data.team;
  },

  /**
   * Get all sub-teams of a main team
   */
  async getSubTeams(teamId: string): Promise<Team[]> {
    const response = await api.get<{ subTeams: Team[] }>(
      `/api/teams/${teamId}/sub-teams`
    );
    return response.data.subTeams;
  },

  /**
   * Get team hierarchy (team + sub-teams with stats)
   */
  async getTeamHierarchy(teamId: string): Promise<{
    team: Team;
    subTeams: Team[];
    totalMembers: number;
    activeJobsCount: number;
  }> {
    const response = await api.get(`/api/teams/${teamId}/hierarchy`);
    return response.data;
  },

  /**
   * Get team statistics
   */
  async getTeamStats(teamId: string): Promise<{
    subTeamsCount: number;
    totalMembers: number;
    activeJobsCount: number;
    mainTeamMembers: number;
    subTeamMembers: number;
  }> {
    const response = await api.get(`/api/teams/${teamId}/stats`);
    return response.data;
  },

  /**
   * Get active jobs count per sub-team
   */
  async getSubTeamJobCounts(parentTeamId: string): Promise<Record<string, number>> {
    const response = await api.get<{ counts: Record<string, number> }>(
      `/api/jobs/teams/${parentTeamId}/sub-teams/counts`
    );
    return response.data.counts;
  },
};
