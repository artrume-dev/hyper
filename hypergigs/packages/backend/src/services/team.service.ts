import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger';
import {
  extractTeamKeywords,
  calculateMatchScore,
  generateMatchReason,
} from '../utils/keywordExtractor.js';

export type TeamType = 'COMPANY' | 'ORGANIZATION' | 'TEAM' | 'DEPARTMENT';
export type SubTeamCategory =
  | 'ENGINEERING'
  | 'MARKETING'
  | 'DESIGN'
  | 'HR'
  | 'SALES'
  | 'PRODUCT'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'LEGAL'
  | 'SUPPORT'
  | 'OTHER';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface CreateTeamData {
  name: string;
  description?: string;
  type: TeamType;
  subTeamCategory?: SubTeamCategory; // Only for sub-teams
  city?: string;
  avatar?: string;
  parentTeamId?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  type?: TeamType;
  city?: string;
  avatar?: string;
}

export interface TeamSearchFilters {
  type?: TeamType;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class TeamService {
  /**
   * Create a new team
   */
  async createTeam(ownerId: string, data: CreateTeamData) {
    // Generate slug from name
    const slug = this.generateSlug(data.name);

    // Check if slug already exists
    const existingTeam = await prisma.team.findUnique({
      where: { slug },
    });

    if (existingTeam) {
      // Add random suffix to make it unique
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
      return this.createTeamWithSlug(ownerId, data, uniqueSlug);
    }

    return this.createTeamWithSlug(ownerId, data, slug);
  }

  /**
   * Create team with specific slug
   */
  private async createTeamWithSlug(ownerId: string, data: CreateTeamData, slug: string) {
    // If this is a sub-team, verify parent exists and user is admin
    if (data.parentTeamId) {
      const parentTeam = await prisma.team.findUnique({
        where: { id: data.parentTeamId },
        include: {
          members: {
            where: {
              userId: ownerId,
              role: { in: ['OWNER', 'ADMIN'] },
            },
          },
        },
      });

      if (!parentTeam) {
        throw new Error('Parent team not found');
      }

      if (parentTeam.members.length === 0) {
        throw new Error('Only admins can create sub-teams');
      }

      if (!parentTeam.isMainTeam) {
        throw new Error('Sub-teams can only be created under main teams');
      }
    }

    // Create team and add owner as team member in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const team = await tx.team.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          type: data.type,
          subTeamCategory: data.subTeamCategory, // Department category for sub-teams
          city: data.city,
          avatar: data.avatar,
          ownerId,
          parentTeamId: data.parentTeamId,
          isMainTeam: !data.parentTeamId, // If has parent, it's a sub-team
        },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      // Add owner as a team member with OWNER role
      await tx.teamMember.create({
        data: {
          userId: ownerId,
          teamId: team.id,
          role: 'OWNER',
        },
      });

      return team;
    });

    const teamType = data.parentTeamId ? 'Sub-team' : 'Main team';
    logger.info(`${teamType} created: ${result.name} by user ${ownerId}`);
    return result;
  }

  /**
   * Get team by ID with members
   */
  async getTeamById(teamId: string, includeMembers = true) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
        members: includeMembers
          ? {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    role: true,
                    bio: true,
                    location: true,
                  },
                },
              },
            }
          : false,
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    return team;
  }

  /**
   * Get team by slug
   */
  async getTeamBySlug(slug: string) {
    const team = await prisma.team.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                bio: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    return team;
  }

  /**
   * Update team (owner only)
   */
  async updateTeam(teamId: string, userId: string, data: UpdateTeamData) {
    // Check if user is the owner
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.ownerId !== userId) {
      throw new Error('Only team owner can update team details');
    }

    // If name is being updated, generate new slug
    let slug = team.slug;
    if (data.name && data.name !== team.name) {
      slug = this.generateSlug(data.name);
      
      // Check if new slug exists
      const existingSlug = await prisma.team.findUnique({
        where: { slug },
      });

      if (existingSlug && existingSlug.id !== teamId) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...data,
        slug,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    logger.info(`Team updated: ${updatedTeam.name}`);
    return updatedTeam;
  }

  /**
   * Delete team (owner only)
   */
  async deleteTeam(teamId: string, userId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.ownerId !== userId) {
      throw new Error('Only team owner can delete the team');
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    logger.info(`Team deleted: ${team.name} by user ${userId}`);
    return { message: 'Team deleted successfully' };
  }

  /**
   * Search/list teams with filters
   */
  async searchTeams(filters: TeamSearchFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      // Only show main teams (not sub-teams)
      isMainTeam: true,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.city) {
      // Note: SQLite doesn't support mode: 'insensitive'
      // Production (PostgreSQL) should add mode: 'insensitive' for case-insensitive search
      where.city = { contains: filters.city };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              members: true,
              projects: true,
              jobPostings: {
                where: {
                  status: 'ACTIVE',
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.team.count({ where }),
    ]);

    return {
      teams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user's teams
   */
  async getUserTeams(userId: string) {
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        userId,
        team: {
          // Only show main teams (not sub-teams)
          isMainTeam: true,
        },
      },
      include: {
        team: {
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return teamMembers.map((tm: any) => ({
      ...tm.team,
      role: tm.role,  // Frontend expects 'role' not 'myRole'
      joinedAt: tm.joinedAt,
    }));
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string) {
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
            role: true,
            location: true,
            available: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, then MEMBER
        { joinedAt: 'asc' },
      ],
    });

    return members;
  }

  /**
   * Add team member (owner or admin only)
   */
  async addTeamMember(
    teamId: string,
    userId: string,
    newMemberId: string,
    role: MemberRole = 'MEMBER'
  ) {
    // Check if requester has permission
    const requesterMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!requesterMember || !['OWNER', 'ADMIN'].includes(requesterMember.role)) {
      throw new Error('Only team owners and admins can add members');
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: newMemberId,
          teamId,
        },
      },
    });

    if (existingMember) {
      throw new Error('User is already a team member');
    }

    // Only OWNER can add ADMIN or OWNER roles
    if (role !== 'MEMBER' && requesterMember.role !== 'OWNER') {
      throw new Error('Only team owner can assign admin or owner roles');
    }

    const member = await prisma.teamMember.create({
      data: {
        userId: newMemberId,
        teamId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
          },
        },
      },
    });

    logger.info(`User ${newMemberId} added to team ${teamId} as ${role}`);
    return member;
  }

  /**
   * Remove team member (owner or admin only)
   */
  async removeTeamMember(teamId: string, userId: string, memberIdToRemove: string) {
    // Can't remove yourself if you're the owner
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.ownerId === memberIdToRemove) {
      throw new Error('Cannot remove team owner. Transfer ownership or delete team instead');
    }

    // Check if requester has permission
    const requesterMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!requesterMember || !['OWNER', 'ADMIN'].includes(requesterMember.role)) {
      throw new Error('Only team owners and admins can remove members');
    }

    // Check member to remove
    const memberToRemove = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: memberIdToRemove,
          teamId,
        },
      },
    });

    if (!memberToRemove) {
      throw new Error('Member not found in team');
    }

    // Admins can't remove other admins or owner
    if (requesterMember.role === 'ADMIN' && memberToRemove.role !== 'MEMBER') {
      throw new Error('Admins can only remove regular members');
    }

    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId: memberIdToRemove,
          teamId,
        },
      },
    });

    logger.info(`User ${memberIdToRemove} removed from team ${teamId}`);
    return { message: 'Member removed successfully' };
  }

  /**
   * Update member role (owner only)
   */
  async updateMemberRole(
    teamId: string,
    userId: string,
    memberIdToUpdate: string,
    newRole: MemberRole
  ) {
    // Check if requester is owner
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.ownerId !== userId) {
      throw new Error('Only team owner can update member roles');
    }

    // Can't change owner's role
    if (team.ownerId === memberIdToUpdate) {
      throw new Error('Cannot change owner role. Transfer ownership instead');
    }

    const updatedMember = await prisma.teamMember.update({
      where: {
        userId_teamId: {
          userId: memberIdToUpdate,
          teamId,
        },
      },
      data: {
        role: newRole,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    logger.info(`Member ${memberIdToUpdate} role updated to ${newRole} in team ${teamId}`);
    return updatedMember;
  }

  /**
   * Leave team (can't leave if you're the owner)
   */
  async leaveTeam(teamId: string, userId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.ownerId === userId) {
      throw new Error('Team owner cannot leave. Transfer ownership or delete team instead');
    }

    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    logger.info(`User ${userId} left team ${teamId}`);
    return { message: 'Successfully left team' };
  }

  /**
   * Check if user is team member
   */
  async isTeamMember(teamId: string, userId: string): Promise<boolean> {
    const member = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    return !!member;
  }

  /**
   * Get user's role in team
   */
  async getUserRoleInTeam(teamId: string, userId: string): Promise<MemberRole | null> {
    const member = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    return member ? (member.role as MemberRole) : null;
  }

  /**
   * Get sub-teams of a team
   */
  async getSubTeams(parentTeamId: string) {
    const subTeams = await prisma.team.findMany({
      where: {
        parentTeamId,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subTeams;
  }

  /**
   * Get suggested members for a team based on intelligent keyword matching
   */
  async getSuggestedMembers(teamId: string, userId: string, limit = 10) {
    // Verify user is a team member
    const isMember = await this.isTeamMember(teamId, userId);
    if (!isMember) {
      throw new Error('Only team members can view member suggestions');
    }

    // Get team details
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Extract keywords from team information
    const teamKeywords = extractTeamKeywords({
      name: team.name,
      description: team.description || undefined,
      type: team.type,
      subTeamCategory: team.subTeamCategory || undefined,
    });

    logger.info(
      `Team "${team.name}" - Type: ${team.type}, SubCategory: ${team.subTeamCategory || 'none'}`
    );
    logger.info(`Extracted keywords: [${teamKeywords.join(', ')}]`);

    // Get all users who are not already team members
    const existingMemberIds = team.members.map((m) => m.userId);

    // Query users with their skills and work experiences for accurate matching
    const users = await prisma.user.findMany({
      where: {
        id: { notIn: existingMemberIds },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        jobTitle: true,
        location: true,
        country: true,
        available: true,
        skills: {
          include: {
            skill: {
              select: {
                name: true,
              },
            },
          },
        },
        workExperiences: {
          select: {
            title: true,
            description: true,
          },
        },
      },
      take: 100, // Get more users for better matching
    });

    // Calculate match scores for each user
    const teamLocation = {
      city: team.city || undefined,
    };

    const scoredUsers = users
      .map((user) => {
        // Convert nullable fields to undefined for the matching functions
        const userForMatching = {
          bio: user.bio || undefined,
          jobTitle: user.jobTitle || undefined,
          location: user.location || undefined,
          country: user.country || undefined,
          skills: user.skills,
          workExperiences: user.workExperiences.map(exp => ({
            role: exp.title, // Map 'title' to 'role' for the matching function
            description: exp.description || undefined,
          })),
        };

        const score = calculateMatchScore(teamKeywords, userForMatching, teamLocation);
        const matchReason = generateMatchReason(teamKeywords, userForMatching);

        return {
          user: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            bio: user.bio,
            jobTitle: user.jobTitle,
            location: user.location,
            available: user.available,
          },
          score,
          matchReason,
        };
      })
      .filter((item) => item.score >= 10) // Only show users with meaningful matches (min 10 points)
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, limit); // Limit results

    // Log detailed matching results
    scoredUsers.forEach(item => {
      logger.info(
        `  → ${item.user.username} (${item.user.jobTitle || 'no title'}) - Score: ${item.score} - Reason: ${item.matchReason}`
      );
    });

    logger.info(
      `Found ${scoredUsers.length} suggested members for team ${team.name} (${teamId}) with keyword matching`
    );

    return scoredUsers;
  }

  /**
   * Generate URL-friendly slug from team name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

export const teamService = new TeamService();
