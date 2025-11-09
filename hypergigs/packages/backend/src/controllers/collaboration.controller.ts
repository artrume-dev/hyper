import { Request, Response } from 'express';
import { collaborationService } from '../services/collaboration.service.js';
import { logger } from '../utils/logger.js';

/**
 * Get collaboration context between current user and another user
 */
export const getCollaborationContext = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { userId } = req.params;

    const context = await collaborationService.getCollaborationContext(req.userId, userId);

    res.status(200).json({ context });
  } catch (error) {
    logger.error('Get collaboration context error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get collaboration context' });
    }
  }
};

/**
 * Get shared projects between current user and another user
 */
export const getSharedProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { userId } = req.params;

    const projects = await collaborationService.getSharedProjects(req.userId, userId);

    res.status(200).json({ projects });
  } catch (error) {
    logger.error('Get shared projects error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get shared projects' });
    }
  }
};

/**
 * Get shared teams between current user and another user
 */
export const getSharedTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { userId } = req.params;

    const teams = await collaborationService.getSharedTeams(req.userId, userId);

    res.status(200).json({ teams });
  } catch (error) {
    logger.error('Get shared teams error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get shared teams' });
    }
  }
};
