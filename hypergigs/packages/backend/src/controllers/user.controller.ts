import { Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { logger } from '../utils/logger.js';

/**
 * Get user profile by ID
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await userService.getUserById(userId);

    res.status(200).json({ user });
  } catch (error) {
    logger.error('Get user profile error:', error);
    
    if (error instanceof Error) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  }
};

/**
 * Get user profile by username
 */
export const getUserProfileByUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    const user = await userService.getUserByUsername(username);

    res.status(200).json({ user });
  } catch (error) {
    logger.error('Get user profile by username error:', error);
    
    if (error instanceof Error) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  }
};

/**
 * Update current user profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { firstName, lastName, username, bio, location, available, nextAvailability, avatar, hourlyRate } = req.body;

    const user = await userService.updateProfile(req.userId, {
      firstName,
      lastName,
      username,
      bio,
      location,
      available,
      nextAvailability: nextAvailability ? new Date(nextAvailability) : undefined,
      avatar,
      hourlyRate,
    });

    res.status(200).json({ user });
  } catch (error) {
    logger.error('Update profile error:', error);
    
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
};

/**
 * Update user avatar
 */
export const updateAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      res.status(400).json({ error: 'Avatar URL is required' });
      return;
    }

    const user = await userService.updateAvatar(req.userId, avatarUrl);

    res.status(200).json({ user });
  } catch (error) {
    logger.error('Update avatar error:', error);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
};

/**
 * Search users
 */
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, role, location, available, limit, offset } = req.query;

    // Allow empty search if filters are provided
    const searchQuery = q && typeof q === 'string' ? q : '';
    
    if (searchQuery && searchQuery.length > 0 && searchQuery.length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' });
      return;
    }

    const users = await userService.searchUsers(searchQuery, {
      role: role as string,
      location: location as string,
      available: available === 'true' ? true : available === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.status(200).json({ users, count: users.length });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

/**
 * Add skill to user
 */
export const addSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { skillName } = req.body;

    if (!skillName) {
      res.status(400).json({ error: 'Skill name is required' });
      return;
    }

    const userSkill = await userService.addSkill(req.userId, skillName);

    res.status(201).json({ skill: userSkill });
  } catch (error) {
    logger.error('Add skill error:', error);
    
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to add skill' });
    }
  }
};

/**
 * Remove skill from user
 */
export const removeSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { userSkillId } = req.params;

    await userService.removeSkill(req.userId, userSkillId);

    res.status(200).json({ message: 'Skill removed successfully' });
  } catch (error) {
    logger.error('Remove skill error:', error);
    res.status(500).json({ error: 'Failed to remove skill' });
  }
};

/**
 * Add portfolio item
 */
export const addPortfolio = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { name, description, companyName, role, workUrls, mediaFile } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Portfolio name is required' });
      return;
    }

    const portfolio = await userService.addPortfolio(req.userId, {
      name,
      description,
      companyName,
      role,
      workUrls,
      mediaFile,
    });

    res.status(201).json({ portfolio });
  } catch (error) {
    logger.error('Add portfolio error:', error);
    res.status(500).json({ error: 'Failed to add portfolio item' });
  }
};

/**
 * Update portfolio item
 */
export const updatePortfolio = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { portfolioId } = req.params;
    const { name, description, companyName, role, workUrls, mediaFile } = req.body;

    const portfolio = await userService.updatePortfolio(req.userId, portfolioId, {
      name,
      description,
      companyName,
      role,
      workUrls,
      mediaFile,
    });

    res.status(200).json({ portfolio });
  } catch (error) {
    logger.error('Update portfolio error:', error);
    
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update portfolio item' });
    }
  }
};

/**
 * Delete portfolio item
 */
export const deletePortfolio = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { portfolioId } = req.params;

    await userService.deletePortfolio(req.userId, portfolioId);

    res.status(200).json({ message: 'Portfolio item deleted successfully' });
  } catch (error) {
    logger.error('Delete portfolio error:', error);
    
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete portfolio item' });
    }
  }
};

/**
 * Add work experience
 */
export const addWorkExperience = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { title, company, description, startDate, endDate, present } = req.body;

    if (!title || !company || !startDate) {
      res.status(400).json({ error: 'Title, company, and start date are required' });
      return;
    }

    const experience = await userService.addWorkExperience(req.userId, {
      title,
      company,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      present,
    });

    res.status(201).json({ experience });
  } catch (error) {
    logger.error('Add work experience error:', error);
    res.status(500).json({ error: 'Failed to add work experience' });
  }
};

/**
 * Update work experience
 */
export const updateWorkExperience = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { experienceId } = req.params;
    const { title, company, description, startDate, endDate, present } = req.body;

    const experience = await userService.updateWorkExperience(req.userId, experienceId, {
      title,
      company,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      present,
    });

    res.status(200).json({ experience });
  } catch (error) {
    logger.error('Update work experience error:', error);
    
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update work experience' });
    }
  }
};

/**
 * Delete work experience
 */
export const deleteWorkExperience = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { experienceId } = req.params;

    await userService.deleteWorkExperience(req.userId, experienceId);

    res.status(200).json({ message: 'Work experience deleted successfully' });
  } catch (error) {
    logger.error('Delete work experience error:', error);
    
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete work experience' });
    }
  }
};

/**
 * Get user portfolio
 */
export const getUserPortfolio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const portfolio = await userService.getUserPortfolio(userId);

    res.status(200).json({ portfolio });
  } catch (error) {
    logger.error('Get user portfolio error:', error);
    res.status(500).json({ error: 'Failed to get portfolio' });
  }
};

/**
 * Get user work experiences
 */
export const getUserWorkExperiences = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const experiences = await userService.getUserWorkExperiences(userId);

    res.status(200).json({ experiences });
  } catch (error) {
    logger.error('Get user work experiences error:', error);
    res.status(500).json({ error: 'Failed to get work experiences' });
  }
};
