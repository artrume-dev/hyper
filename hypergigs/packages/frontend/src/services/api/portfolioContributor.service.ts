import api from '@/lib/axios';
import type { PortfolioContributor, ContributorSuggestion } from '@/types/user';

export interface AddContributorRequest {
  userId: string;
  role?: string;
}

export interface UpdateContributorStatusRequest {
  status: 'ACCEPTED' | 'REJECTED';
}

export const portfolioContributorService = {
  /**
   * Get contributor suggestions for a portfolio
   */
  async suggestContributors(portfolioId: string): Promise<ContributorSuggestion[]> {
    const response = await api.get<{ suggestions: ContributorSuggestion[] }>(
      `/api/portfolios/${portfolioId}/suggest-contributors`
    );
    return response.data.suggestions;
  },

  /**
   * Add a contributor to a portfolio
   */
  async addContributor(
    portfolioId: string,
    data: AddContributorRequest
  ): Promise<PortfolioContributor> {
    const response = await api.post<{ contributor: PortfolioContributor }>(
      `/api/portfolios/${portfolioId}/contributors`,
      data
    );
    return response.data.contributor;
  },

  /**
   * Update contributor status (accept/reject)
   */
  async updateContributorStatus(
    portfolioId: string,
    contributorId: string,
    data: UpdateContributorStatusRequest
  ): Promise<PortfolioContributor> {
    const response = await api.patch<{ contributor: PortfolioContributor }>(
      `/api/portfolios/${portfolioId}/contributors/${contributorId}`,
      data
    );
    return response.data.contributor;
  },

  /**
   * Get all contributors for a portfolio
   */
  async getPortfolioContributors(
    portfolioId: string,
    includeAll = false
  ): Promise<PortfolioContributor[]> {
    const response = await api.get<{ contributors: PortfolioContributor[] }>(
      `/api/portfolios/${portfolioId}/contributors`,
      { params: { includeAll } }
    );
    return response.data.contributors;
  },

  /**
   * Get pending contributor invitations for current user
   */
  async getUserInvitations(): Promise<PortfolioContributor[]> {
    const response = await api.get<{ invitations: PortfolioContributor[] }>(
      '/api/portfolios/invitations'
    );
    return response.data.invitations;
  },

  /**
   * Remove a contributor
   */
  async removeContributor(portfolioId: string, contributorId: string): Promise<void> {
    await api.delete(`/api/portfolios/${portfolioId}/contributors/${contributorId}`);
  },
};
