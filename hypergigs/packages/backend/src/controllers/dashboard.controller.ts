import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { logger } from '../utils/logger.js';

/**
 * Get authenticated user's dashboard data
 *
 * @route   GET /api/dashboard/user
 * @access  Private
 */
export const getUserDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check authentication
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    // Get user dashboard data
    const dashboardData = await dashboardService.getUserDashboard(req.userId);

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error('Get user dashboard error:', error);

    if (error instanceof Error) {
      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user dashboard',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get user dashboard',
      });
    }
  }
};

/**
 * Get team dashboard data
 * Verifies user is owner or member of the team
 *
 * @route   GET /api/dashboard/team/:teamId
 * @access  Private
 */
export const getTeamDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check authentication
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const { teamId } = req.params;

    // Validate teamId parameter
    if (!teamId) {
      res.status(400).json({
        success: false,
        message: 'Team ID is required',
      });
      return;
    }

    // Get team dashboard data (includes authorization check)
    const dashboardData = await dashboardService.getTeamDashboard(teamId, req.userId);

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error('Get team dashboard error:', error);

    if (error instanceof Error) {
      // Handle specific errors
      if (error.message === 'Team not found') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message === 'Unauthorized to access this team dashboard') {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get team dashboard',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get team dashboard',
      });
    }
  }
};
