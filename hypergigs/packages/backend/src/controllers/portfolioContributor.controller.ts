import { Request, Response } from 'express';
import { portfolioContributorService } from '../services/portfolioContributor.service.js';
import { logger } from '../utils/logger.js';

/**
 * Suggest contributors for a portfolio based on shared teams
 */
export const suggestContributors = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { portfolioId } = req.params;

    const suggestions = await portfolioContributorService.suggestContributors(
      portfolioId,
      req.userId
    );

    res.status(200).json({ suggestions });
  } catch (error) {
    logger.error('Suggest contributors error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to suggest contributors' });
    }
  }
};

/**
 * Add a contributor to a portfolio
 */
export const addContributor = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { portfolioId } = req.params;
    const { userId, role } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const contributor = await portfolioContributorService.addContributor({
      portfolioId,
      userId,
      addedBy: req.userId,
      role,
    });

    res.status(201).json({ contributor });
  } catch (error) {
    logger.error('Add contributor error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to add contributor' });
    }
  }
};

/**
 * Update contributor status (accept/reject)
 */
export const updateContributorStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { contributorId } = req.params;
    const { status } = req.body;

    if (!status || (status !== 'ACCEPTED' && status !== 'REJECTED')) {
      res.status(400).json({ error: 'Status must be ACCEPTED or REJECTED' });
      return;
    }

    const contributor = await portfolioContributorService.updateContributorStatus(
      contributorId,
      req.userId,
      status
    );

    res.status(200).json({ contributor });
  } catch (error) {
    logger.error('Update contributor status error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update contributor status' });
    }
  }
};

/**
 * Get all contributors for a portfolio
 */
export const getPortfolioContributors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { portfolioId } = req.params;
    const { includeAll } = req.query;

    const contributors = await portfolioContributorService.getPortfolioContributors(
      portfolioId,
      includeAll === 'true'
    );

    res.status(200).json({ contributors });
  } catch (error) {
    logger.error('Get portfolio contributors error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get contributors' });
    }
  }
};

/**
 * Get pending contributor invitations for current user
 */
export const getUserInvitations = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const invitations = await portfolioContributorService.getUserContributorInvitations(req.userId);

    res.status(200).json({ invitations });
  } catch (error) {
    logger.error('Get user invitations error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get invitations' });
    }
  }
};

/**
 * Remove a contributor
 */
export const removeContributor = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { contributorId } = req.params;

    await portfolioContributorService.removeContributor(contributorId, req.userId);

    res.status(200).json({ message: 'Contributor removed successfully' });
  } catch (error) {
    logger.error('Remove contributor error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to remove contributor' });
    }
  }
};
