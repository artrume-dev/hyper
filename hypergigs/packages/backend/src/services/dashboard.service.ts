import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Dashboard Service
 * Provides aggregated data for user and team dashboards
 */
export class DashboardService {
  /**
   * Get user dashboard data
   * Includes statistics, recent teams, invitations, and messages
   */
  async getUserDashboard(userId: string) {
    // Fetch user with related data in parallel for better performance
    const [user, statistics, recentTeams, recentInvitations, recentMessages, recommendationStats] = await Promise.all([
      // Get basic user info
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          bio: true,
          location: true,
          available: true,
          hourlyRate: true,
        },
      }),

      // Get user statistics using _count
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          _count: {
            select: {
              followers: true,
              following: true,
              ownedTeams: true,
              teamMembers: true,
              portfolios: true,
              skills: true,
              receivedInvitations: {
                where: { status: 'PENDING' },
              },
            },
          },
        },
      }),

      // Get recent teams (owned + member of)
      Promise.all([
        // Owned teams
        prisma.team.findMany({
          where: { ownerId: userId },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            avatar: true,
            type: true,
            createdAt: true,
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
        // Teams where user is a member
        prisma.teamMember.findMany({
          where: { userId },
          select: {
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                avatar: true,
                type: true,
                createdAt: true,
                _count: {
                  select: {
                    members: true,
                    projects: true,
                  },
                },
              },
            },
            role: true,
            joinedAt: true,
          },
          orderBy: { joinedAt: 'desc' },
          take: 3,
        }),
      ]).then(([ownedTeams, memberTeams]) => {
        // Combine and sort teams by most recent
        const allTeams = [
          ...ownedTeams.map(team => ({ ...team, userRole: 'OWNER' })),
          ...memberTeams.map(m => ({ ...m.team, userRole: m.role })),
        ];

        // Remove duplicates by team ID (in case user is owner and member)
        const uniqueTeams = allTeams.reduce((acc, team) => {
          if (!acc.find(t => t.id === team.id)) {
            acc.push(team);
          }
          return acc;
        }, [] as any[]);

        // Sort by createdAt/joinedAt and take top 5
        return uniqueTeams
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
      }),

      // Get recent invitations (last 5 received)
      prisma.invitation.findMany({
        where: { receiverId: userId },
        select: {
          id: true,
          status: true,
          role: true,
          message: true,
          expiresAt: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              avatar: true,
              type: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Get recent messages (last 5 received)
      prisma.message.findMany({
        where: { receiverId: userId },
        select: {
          id: true,
          content: true,
          read: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
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
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Get recommendation statistics
      Promise.all([
        // Pending recommendation requests sent by user
        prisma.recommendation.count({
          where: {
            senderId: userId,
            type: 'REQUEST',
            status: 'PENDING',
          },
        }),
        // Pending recommendation requests received by user
        prisma.recommendation.count({
          where: {
            receiverId: userId,
            type: 'REQUEST',
            status: 'PENDING',
          },
        }),
        // Accepted recommendations received (total)
        prisma.recommendation.count({
          where: {
            receiverId: userId,
            status: 'ACCEPTED',
          },
        }),
        // Given recommendations sent by user
        prisma.recommendation.count({
          where: {
            senderId: userId,
            type: 'GIVEN',
          },
        }),
      ]).then(([pendingSent, pendingReceived, acceptedReceived, givenSent]) => ({
        pendingRequestsSent: pendingSent,
        pendingRequestsReceived: pendingReceived,
        acceptedRecommendations: acceptedReceived,
        givenRecommendations: givenSent,
      })),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate total teams count (owned + member of)
    const teamsCount = (statistics?._count.ownedTeams || 0) + (statistics?._count.teamMembers || 0);

    // Format statistics
    const userStatistics = {
      followersCount: statistics?._count.followers || 0,
      followingCount: statistics?._count.following || 0,
      teamsCount,
      pendingInvitationsCount: statistics?._count.receivedInvitations || 0,
      portfolioCount: statistics?._count.portfolios || 0,
      skillsCount: statistics?._count.skills || 0,
      // Recommendation statistics
      pendingRequestsSent: recommendationStats.pendingRequestsSent,
      pendingRequestsReceived: recommendationStats.pendingRequestsReceived,
      acceptedRecommendations: recommendationStats.acceptedRecommendations,
      givenRecommendations: recommendationStats.givenRecommendations,
    };

    logger.info(`User dashboard data fetched for user: ${userId}`);

    return {
      user,
      statistics: userStatistics,
      recentTeams,
      recentInvitations,
      recentMessages,
    };
  }

  /**
   * Get team dashboard data
   * Includes team statistics, members, invitations, and projects
   */
  async getTeamDashboard(teamId: string, userId: string) {
    // First check if user is owner or member of the team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        avatar: true,
        type: true,
        city: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Check if user is owner
    const isOwner = team.ownerId === userId;

    // Check if user is a member
    const isMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    // User must be owner or member to access team dashboard
    if (!isOwner && !isMember) {
      throw new Error('Unauthorized to access this team dashboard');
    }

    // Fetch team statistics and related data in parallel
    const [statistics, members, recentInvitations, projects] = await Promise.all([
      // Get team statistics
      prisma.team.findUnique({
        where: { id: teamId },
        select: {
          _count: {
            select: {
              members: true,
              invitations: {
                where: { status: 'PENDING' },
              },
              projects: true,
            },
          },
        },
      }),

      // Get team members with user details
      prisma.teamMember.findMany({
        where: { teamId },
        select: {
          id: true,
          role: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
              avatar: true,
              role: true,
              location: true,
              available: true,
              hourlyRate: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      }),

      // Get recent invitations (last 10)
      prisma.invitation.findMany({
        where: { teamId },
        select: {
          id: true,
          status: true,
          role: true,
          message: true,
          expiresAt: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Get team projects
      prisma.project.findMany({
        where: { teamId },
        select: {
          id: true,
          title: true,
          description: true,
          workLocation: true,
          startDate: true,
          duration: true,
          minCost: true,
          maxCost: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Format team statistics
    const teamStatistics = {
      membersCount: statistics?._count.members || 0,
      pendingInvitationsCount: statistics?._count.invitations || 0,
      projectsCount: statistics?._count.projects || 0,
      createdAt: team.createdAt,
    };

    logger.info(`Team dashboard data fetched for team: ${teamId}, user: ${userId}`);

    return {
      team,
      statistics: teamStatistics,
      members,
      recentInvitations,
      projects,
      userRole: isOwner ? 'OWNER' : isMember?.role || 'MEMBER',
    };
  }
}

export const dashboardService = new DashboardService();
