import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

export type TeamType = 'PROJECT' | 'AGENCY' | 'STARTUP';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface CreateTeamData {
  name: string;
  description?: string;
  type: TeamType;
  city?: string;
  avatar?: string;
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
    // Create team and add owner as team member in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const team = await tx.team.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          type: data.type,
          city: data.city,
          avatar: data.avatar,
          ownerId,
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

    logger.info(`Team created: ${result.name} by user ${ownerId}`);
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

    const where: any = {};

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
      where: { userId },
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
      myRole: tm.role,
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
