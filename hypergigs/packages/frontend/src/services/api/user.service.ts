import api from '@/lib/axios';
import type {
  UserProfile,
  UpdateProfileRequest,
  AddSkillRequest,
  UserSkill,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  PortfolioItem,
  CreateExperienceRequest,
  UpdateExperienceRequest,
  WorkExperience,
  SearchUsersFilters,
  PaginatedUsers,
} from '@/types/user';
import type { User } from '@/types/auth';

export const userService = {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await api.get<{ user: UserProfile }>(`/api/users/${userId}`);
    return response.data.user;
  },

  /**
   * Get user profile by username
   */
  async getUserProfileByUsername(username: string): Promise<UserProfile> {
    const response = await api.get<{ user: UserProfile }>(`/api/users/username/${username}`);
    return response.data.user;
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await api.put<{ user: User }>('/api/users/me', data);
    return response.data.user;
  },

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.patch<{ avatarUrl: string }>(
      '/api/users/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Search users
   */
  async searchUsers(query: string, filters?: SearchUsersFilters): Promise<PaginatedUsers> {
    const response = await api.get<PaginatedUsers>('/api/users/search', {
      params: { query, ...filters },
    });
    return response.data;
  },

  // Skills
  /**
   * Add skill
   */
  async addSkill(data: AddSkillRequest): Promise<UserSkill> {
    const response = await api.post<{ skill: UserSkill }>('/api/users/me/skills', data);
    return response.data.skill;
  },

  /**
   * Remove skill
   */
  async removeSkill(skillId: string): Promise<void> {
    await api.delete(`/api/users/me/skills/${skillId}`);
  },

  // Portfolio
  /**
   * Get user portfolio
   */
  async getPortfolio(userId: string): Promise<PortfolioItem[]> {
    const response = await api.get<{ portfolio: PortfolioItem[] }>(
      `/api/users/${userId}/portfolio`
    );
    return response.data.portfolio;
  },

  /**
   * Add portfolio item
   */
  async addPortfolioItem(data: CreatePortfolioRequest): Promise<PortfolioItem> {
    const response = await api.post<{ portfolio: PortfolioItem }>(
      '/api/users/me/portfolio',
      data
    );
    return response.data.portfolio;
  },

  /**
   * Update portfolio item
   */
  async updatePortfolioItem(
    portfolioId: string,
    data: UpdatePortfolioRequest
  ): Promise<PortfolioItem> {
    const response = await api.put<{ portfolio: PortfolioItem }>(
      `/api/users/me/portfolio/${portfolioId}`,
      data
    );
    return response.data.portfolio;
  },

  /**
   * Delete portfolio item
   */
  async deletePortfolioItem(portfolioId: string): Promise<void> {
    await api.delete(`/api/users/me/portfolio/${portfolioId}`);
  },

  // Work Experience
  /**
   * Get user work experience
   */
  async getExperience(userId: string): Promise<WorkExperience[]> {
    const response = await api.get<{ experiences: WorkExperience[] }>(
      `/api/users/${userId}/experience`
    );
    return response.data.experiences;
  },

  /**
   * Add work experience
   */
  async addExperience(data: CreateExperienceRequest): Promise<WorkExperience> {
    const response = await api.post<{ experience: WorkExperience }>(
      '/api/users/me/experience',
      data
    );
    return response.data.experience;
  },

  /**
   * Update work experience
   */
  async updateExperience(
    experienceId: string,
    data: UpdateExperienceRequest
  ): Promise<WorkExperience> {
    const response = await api.put<{ experience: WorkExperience }>(
      `/api/users/me/experience/${experienceId}`,
      data
    );
    return response.data.experience;
  },

  /**
   * Delete work experience
   */
  async deleteExperience(experienceId: string): Promise<void> {
    await api.delete(`/api/users/me/experience/${experienceId}`);
  },
};
