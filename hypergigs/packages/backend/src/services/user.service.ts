import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  location?: string;
  available?: boolean;
  nextAvailability?: Date;
  avatar?: string;
  hourlyRate?: number;
}

export interface SearchUsersFilters {
  role?: string;
  location?: string;
  available?: boolean;
  limit?: number;
  offset?: number;
}

export class UserService {
  /**
   * Get user by ID (public profile view)
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        bio: true,
        location: true,
        avatar: true,
        available: true,
        nextAvailability: true,
        hourlyRate: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            ownedTeams: true,
            teamMembers: true,
            portfolios: true,
            workExperiences: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
        portfolios: {
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
        workExperiences: {
          orderBy: { startDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Get user by username (public profile view)
   */
  async getUserByUsername(username: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        bio: true,
        location: true,
        avatar: true,
        available: true,
        nextAvailability: true,
        hourlyRate: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            ownedTeams: true,
            teamMembers: true,
            portfolios: true,
            workExperiences: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
        portfolios: {
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
        workExperiences: {
          orderBy: { startDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileData) {
    // If username is being updated, check uniqueness
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new Error('Username already taken');
      }

      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(data.username)) {
        throw new Error('Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        bio: true,
        location: true,
        avatar: true,
        available: true,
        nextAvailability: true,
        hourlyRate: true,
        updatedAt: true,
      },
    });

    logger.info(`User profile updated: ${userId}`);
    return updatedUser;
  }

  /**
   * Upload/update user avatar
   */
  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        avatar: true,
      },
    });

    logger.info(`User avatar updated: ${userId}`);
    return user;
  }

  /**
   * Search users
   */
  async searchUsers(query: string, filters?: SearchUsersFilters) {
    // Note: SQLite doesn't support case-insensitive mode
    // In production (PostgreSQL), add mode: 'insensitive' for case-insensitive search
    const where: any = {
      OR: [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        { username: { contains: query } },
        { bio: { contains: query } },
      ],
    };

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.location) {
      where.location = { contains: filters.location };
    }

    if (filters?.available !== undefined) {
      where.available = filters.available;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        bio: true,
        location: true,
        avatar: true,
        available: true,
        _count: {
          select: {
            followers: true,
            teamMembers: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
          take: 5,
        },
      },
      take: filters?.limit || 20,
      skip: filters?.offset || 0,
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  /**
   * Add skill to user
   */
  async addSkill(userId: string, skillName: string) {
    // Find or create skill
    let skill = await prisma.skill.findUnique({
      where: { name: skillName.toLowerCase() },
    });

    if (!skill) {
      skill = await prisma.skill.create({
        data: { name: skillName.toLowerCase() },
      });
    }

    // Check if user already has this skill
    const existingUserSkill = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId: skill.id,
        },
      },
    });

    if (existingUserSkill) {
      throw new Error('Skill already added');
    }

    // Add skill to user
    const userSkill = await prisma.userSkill.create({
      data: {
        userId,
        skillId: skill.id,
      },
      include: {
        skill: true,
      },
    });

    logger.info(`Skill added to user ${userId}: ${skillName}`);
    return userSkill;
  }

  /**
   * Remove skill from user
   */
  async removeSkill(userId: string, userSkillId: string) {
    // Verify the skill belongs to the user before deleting
    const userSkill = await prisma.userSkill.findFirst({
      where: {
        id: userSkillId,
        userId: userId
      }
    });

    if (!userSkill) {
      throw new Error('Skill not found or unauthorized');
    }

    await prisma.userSkill.delete({
      where: { id: userSkillId }
    });

    logger.info(`Skill removed from user ${userId}: ${userSkillId}`);
    return { success: true };
  }

  /**
   * Add portfolio item
   */
  async addPortfolio(userId: string, data: {
    name: string;
    description?: string;
    companyName?: string;
    role?: string;
    workUrls?: string;
    mediaFile?: string;
  }) {
    const portfolio = await prisma.portfolio.create({
      data: {
        ...data,
        userId,
      },
    });

    logger.info(`Portfolio item added for user ${userId}`);
    return portfolio;
  }

  /**
   * Update portfolio item
   */
  async updatePortfolio(userId: string, portfolioId: string, data: {
    name?: string;
    description?: string;
    companyName?: string;
    role?: string;
    workUrls?: string;
    mediaFile?: string;
  }) {
    // Check if portfolio belongs to user
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId,
      },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found or unauthorized');
    }

    const updatedPortfolio = await prisma.portfolio.update({
      where: { id: portfolioId },
      data,
    });

    logger.info(`Portfolio item updated: ${portfolioId}`);
    return updatedPortfolio;
  }

  /**
   * Delete portfolio item
   */
  async deletePortfolio(userId: string, portfolioId: string) {
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId,
      },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found or unauthorized');
    }

    await prisma.portfolio.delete({
      where: { id: portfolioId },
    });

    logger.info(`Portfolio item deleted: ${portfolioId}`);
    return { success: true };
  }

  /**
   * Add work experience
   */
  async addWorkExperience(userId: string, data: {
    title: string;
    company: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    present?: boolean;
  }) {
    const experience = await prisma.workExperience.create({
      data: {
        ...data,
        userId,
        present: data.present || false,
      },
    });

    logger.info(`Work experience added for user ${userId}`);
    return experience;
  }

  /**
   * Update work experience
   */
  async updateWorkExperience(userId: string, experienceId: string, data: {
    title?: string;
    company?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    present?: boolean;
  }) {
    const experience = await prisma.workExperience.findFirst({
      where: {
        id: experienceId,
        userId,
      },
    });

    if (!experience) {
      throw new Error('Work experience not found or unauthorized');
    }

    const updatedExperience = await prisma.workExperience.update({
      where: { id: experienceId },
      data,
    });

    logger.info(`Work experience updated: ${experienceId}`);
    return updatedExperience;
  }

  /**
   * Delete work experience
   */
  async deleteWorkExperience(userId: string, experienceId: string) {
    const experience = await prisma.workExperience.findFirst({
      where: {
        id: experienceId,
        userId,
      },
    });

    if (!experience) {
      throw new Error('Work experience not found or unauthorized');
    }

    await prisma.workExperience.delete({
      where: { id: experienceId },
    });

    logger.info(`Work experience deleted: ${experienceId}`);
    return { success: true };
  }

  /**
   * Get user's portfolio
   */
  async getUserPortfolio(userId: string) {
    return await prisma.portfolio.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user's work experiences
   */
  async getUserWorkExperiences(userId: string) {
    return await prisma.workExperience.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }
}

export const userService = new UserService();
