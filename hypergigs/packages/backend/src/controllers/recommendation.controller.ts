import { Request, Response } from 'express';
import { recommendationService } from '../services/recommendation.service.js';
import { logger } from '../utils/logger.js';

/**
 * Create a recommendation (request or given)
 */
export const createRecommendation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { message, receiverId, type, portfolioId, projectId, teamId } = req.body;

    if (!message || !receiverId) {
      res.status(400).json({ error: 'Message and receiverId are required' });
      return;
    }

    // Note: portfolioId, projectId, and teamId are all optional
    // General recommendations without context are now allowed

    const recommendation = await recommendationService.createRecommendation({
      message,
      type: type || 'REQUEST',
      senderId: req.userId,
      receiverId,
      portfolioId,
      projectId,
      teamId,
    });

    res.status(201).json({ recommendation });
  } catch (error) {
    logger.error('Create recommendation error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create recommendation' });
    }
  }
};

/**
 * Get recommendations for a portfolio
 */
export const getPortfolioRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { portfolioId } = req.params;

    const recommendations = await recommendationService.getPortfolioRecommendations(portfolioId);

    res.status(200).json({ recommendations });
  } catch (error) {
    logger.error('Get portfolio recommendations error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  }
};

/**
 * Get recommendations received by a user
 */
export const getUserRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const recommendations = await recommendationService.getUserRecommendations(userId);

    res.status(200).json({ recommendations });
  } catch (error) {
    logger.error('Get user recommendations error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  }
};

/**
 * Update recommendation status (accept/reject)
 */
export const updateRecommendationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || (status !== 'ACCEPTED' && status !== 'REJECTED')) {
      res.status(400).json({ error: 'Status must be ACCEPTED or REJECTED' });
      return;
    }

    const recommendation = await recommendationService.updateRecommendationStatus(id, req.userId, status);

    res.status(200).json({ recommendation });
  } catch (error) {
    logger.error('Update recommendation status error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update recommendation status' });
    }
  }
};

/**
 * Delete a recommendation request
 */
export const deleteRecommendation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    await recommendationService.deleteRecommendation(id, req.userId);

    res.status(200).json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    logger.error('Delete recommendation error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete recommendation' });
    }
  }
};
