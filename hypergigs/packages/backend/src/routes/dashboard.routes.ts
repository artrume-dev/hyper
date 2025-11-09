import { Router } from 'express';
import { getUserDashboard, getTeamDashboard } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/dashboard/user
 * @desc    Get authenticated user's dashboard data
 * @access  Private
 */
router.get('/user', authenticate, getUserDashboard);

/**
 * @route   GET /api/dashboard/team/:teamId
 * @desc    Get team dashboard data (requires team membership)
 * @access  Private
 */
router.get('/team/:teamId', authenticate, getTeamDashboard);

export default router;
