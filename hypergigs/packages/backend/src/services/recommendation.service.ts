import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { collaborationService } from './collaboration.service.js';

export interface CreateRecommendationData {
  message: string;
  senderId: string;
  receiverId: string;
  type?: 'REQUEST' | 'GIVEN';
  rating?: number;        // Optional - 1-5 star rating for portfolio recommendations
  portfolioId?: string;   // Optional - for portfolio-based
  projectId?: string;     // Optional - for team project-based
  teamId?: string;        // Optional - for team context
}

export class RecommendationService {
  /**
   * Create a new recommendation (request or given)
   */
  async createRecommendation(data: CreateRecommendationData) {
    const type = data.type || 'REQUEST';

    // Check if sender has already given a recommendation to this receiver (excluding likes)
    const existingRec = await prisma.recommendation.findFirst({
      where: {
        senderId: data.senderId,
        receiverId: data.receiverId,
        message: { not: 'Liked this work' }, // Allow multiple likes, but only one real recommendation
      },
    });

    if (existingRec) {
      throw new Error('You have already given a recommendation to this user');
    }

    // Validation based on context (ALL CONTEXTS ARE OPTIONAL)
    // General recommendations (no context) are now allowed

    if (data.portfolioId) {
      // Portfolio-based recommendation - allow ANY user to give ratings/comments
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: data.portfolioId },
      });

      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Verify portfolio belongs to receiver
      if (portfolio.userId !== data.receiverId) {
        throw new Error('Portfolio does not belong to the specified receiver');
      }

      // Validate rating if provided
      if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Portfolio recommendations are always GIVEN (no request flow)
      // and always ACCEPTED (no approval needed)
    }

    if (data.projectId) {
      // Project-based recommendation - verify project exists
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
        include: { team: { include: { members: true } } },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Verify both users are members of the project's team
      const memberIds = project.team.members.map(m => m.userId);
      if (!memberIds.includes(data.senderId) || !memberIds.includes(data.receiverId)) {
        throw new Error('Both users must be members of the project team');
      }

      data.teamId = project.teamId;
    }

    if (data.teamId && !data.projectId) {
      // Team-based (general collaboration) recommendation
      const haveWorkedTogether = await collaborationService.haveWorkedTogether(
        data.senderId,
        data.receiverId
      );

      if (!haveWorkedTogether) {
        throw new Error('Users have not worked together');
      }
    }

    // Note: If none of portfolioId, projectId, or teamId are provided,
    // this is a general recommendation with no specific context - this is now allowed!

    // Determine status and type based on context
    let status = type === 'GIVEN' ? 'ACCEPTED' : 'PENDING';
    let finalType = type;

    // Portfolio recommendations are always GIVEN and ACCEPTED
    if (data.portfolioId) {
      finalType = 'GIVEN';
      status = 'ACCEPTED';
    }

    // Create the recommendation
    const recommendation = await prisma.recommendation.create({
      data: {
        message: data.message,
        type: finalType,
        rating: data.rating || null,
        senderId: data.senderId,
        receiverId: data.receiverId,
        portfolioId: data.portfolioId || null,
        projectId: data.projectId || null,
        teamId: data.teamId || null,
        status,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            jobTitle: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        portfolio: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    logger.info(`Recommendation created: ${recommendation.id}`);
    return recommendation;
  }

  /**
   * Get all recommendations for a specific portfolio
   */
  async getPortfolioRecommendations(portfolioId: string) {
    const recommendations = await prisma.recommendation.findMany({
      where: {
        portfolioId,
        status: 'ACCEPTED', // Only show accepted recommendations
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            jobTitle: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return recommendations;
  }

  /**
   * Get all recommendations received by a user
   */
  async getUserRecommendations(userId: string) {
    const recommendations = await prisma.recommendation.findMany({
      where: {
        receiverId: userId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return recommendations;
  }

  /**
   * Update recommendation status (accept/reject)
   */
  async updateRecommendationStatus(recommendationId: string, userId: string, status: 'ACCEPTED' | 'REJECTED') {
    // Verify the recommendation exists and belongs to the user
    const existing = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!existing) {
      throw new Error('Recommendation not found');
    }

    if (existing.receiverId !== userId) {
      throw new Error('You can only update your own recommendations');
    }

    const recommendation = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: { status },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
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
        project: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    logger.info(`Recommendation status updated: ${recommendationId} -> ${status}`);
    return recommendation;
  }

  /**
   * Delete a recommendation
   */
  async deleteRecommendation(recommendationId: string, userId: string) {
    // Verify the recommendation exists
    const existing = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!existing) {
      throw new Error('Recommendation not found');
    }

    // Only sender or receiver can delete
    if (existing.senderId !== userId && existing.receiverId !== userId) {
      throw new Error('You can only delete your own recommendations');
    }

    await prisma.recommendation.delete({
      where: { id: recommendationId },
    });

    logger.info(`Recommendation deleted: ${recommendationId}`);
  }
}

export const recommendationService = new RecommendationService();
