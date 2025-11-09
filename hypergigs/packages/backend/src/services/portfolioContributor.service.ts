import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

export interface AddContributorData {
  portfolioId: string;
  userId: string;
  addedBy: string;
  role?: string;
}

export interface ContributorSuggestion {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  avatar: string | null;
  jobTitle: string | null;
  sharedTeams: Array<{ id: string; name: string }>;
}

export class PortfolioContributorService {
  /**
   * Suggest contributors based on shared teams
   */
  async suggestContributors(portfolioId: string, ownerId: string): Promise<ContributorSuggestion[]> {
    // Get the portfolio to verify ownership
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    if (portfolio.userId !== ownerId) {
      throw new Error('You can only suggest contributors for your own portfolios');
    }

    // Get all teams the owner is a member of
    const ownerTeams = await prisma.teamMember.findMany({
      where: { userId: ownerId },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: { not: ownerId }, // Exclude the owner
              },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    avatar: true,
                    jobTitle: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get existing contributors (to exclude them from suggestions)
    const existingContributors = await prisma.portfolioContributor.findMany({
      where: { portfolioId },
      select: { userId: true },
    });

    const existingContributorIds = new Set(existingContributors.map(c => c.userId));

    // Build map of unique users and their shared teams
    const userTeamsMap = new Map<string, ContributorSuggestion>();

    ownerTeams.forEach(({ team }) => {
      team.members.forEach(({ user }) => {
        // Skip if already a contributor
        if (existingContributorIds.has(user.id)) {
          return;
        }

        if (!userTeamsMap.has(user.id)) {
          userTeamsMap.set(user.id, {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            avatar: user.avatar,
            jobTitle: user.jobTitle,
            sharedTeams: [],
          });
        }

        const suggestion = userTeamsMap.get(user.id)!;
        suggestion.sharedTeams.push({
          id: team.id,
          name: team.name,
        });
      });
    });

    // Convert map to array and sort by number of shared teams (descending)
    const suggestions = Array.from(userTeamsMap.values()).sort(
      (a, b) => b.sharedTeams.length - a.sharedTeams.length
    );

    return suggestions;
  }

  /**
   * Add a contributor to a portfolio
   */
  async addContributor(data: AddContributorData) {
    // Verify portfolio exists and user has permission
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: data.portfolioId },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    if (portfolio.userId !== data.addedBy) {
      throw new Error('You can only add contributors to your own portfolios');
    }

    // Verify the user being added exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if already a contributor
    const existing = await prisma.portfolioContributor.findUnique({
      where: {
        portfolioId_userId: {
          portfolioId: data.portfolioId,
          userId: data.userId,
        },
      },
    });

    if (existing) {
      throw new Error('User is already a contributor or has a pending invitation');
    }

    // Create contributor invitation
    const contributor = await prisma.portfolioContributor.create({
      data: {
        portfolioId: data.portfolioId,
        userId: data.userId,
        addedBy: data.addedBy,
        role: data.role || null,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            jobTitle: true,
          },
        },
        portfolio: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        addedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    logger.info(`Contributor invitation created: ${contributor.id}`);
    return contributor;
  }

  /**
   * Update contributor status (accept/reject)
   */
  async updateContributorStatus(
    contributorId: string,
    userId: string,
    status: 'ACCEPTED' | 'REJECTED'
  ) {
    // Verify the contributor invitation exists
    const existing = await prisma.portfolioContributor.findUnique({
      where: { id: contributorId },
      include: {
        portfolio: true,
      },
    });

    if (!existing) {
      throw new Error('Contributor invitation not found');
    }

    // Only the contributor themselves or the portfolio owner can update status
    if (existing.userId !== userId && existing.portfolio.userId !== userId) {
      throw new Error('You can only accept/reject your own invitations or manage your portfolio contributors');
    }

    // Update the status
    const contributor = await prisma.portfolioContributor.update({
      where: { id: contributorId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            jobTitle: true,
          },
        },
        portfolio: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    logger.info(`Contributor status updated: ${contributorId} -> ${status}`);
    return contributor;
  }

  /**
   * Get all contributors for a portfolio (only accepted ones for public view)
   */
  async getPortfolioContributors(portfolioId: string, includeAll = false) {
    const where: any = { portfolioId };

    // By default, only show accepted contributors
    if (!includeAll) {
      where.status = 'ACCEPTED';
    }

    const contributors = await prisma.portfolioContributor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            jobTitle: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return contributors;
  }

  /**
   * Get pending contributor invitations for a user
   */
  async getUserContributorInvitations(userId: string) {
    const invitations = await prisma.portfolioContributor.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
            description: true,
            companyName: true,
            mediaFiles: true,
          },
        },
        addedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations;
  }

  /**
   * Remove a contributor
   */
  async removeContributor(contributorId: string, userId: string) {
    // Verify the contributor exists
    const existing = await prisma.portfolioContributor.findUnique({
      where: { id: contributorId },
      include: {
        portfolio: true,
      },
    });

    if (!existing) {
      throw new Error('Contributor not found');
    }

    // Only the portfolio owner or the contributor themselves can remove
    if (existing.portfolio.userId !== userId && existing.userId !== userId) {
      throw new Error('You can only remove contributors from your own portfolios or remove yourself');
    }

    await prisma.portfolioContributor.delete({
      where: { id: contributorId },
    });

    logger.info(`Contributor removed: ${contributorId}`);
  }
}

export const portfolioContributorService = new PortfolioContributorService();
