import { Router } from 'express';
import {
  createJob,
  getTeamJobs,
  getTeamJobsCount,
  getSubTeamJobsCounts,
  getJob,
  updateJob,
  deleteJob,
  getActiveJobs,
} from '../controllers/job.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Public job endpoints
 */

/**
 * @route   GET /api/jobs
 * @desc    Get all active jobs (public job board)
 * @access  Public
 */
router.get('/', getActiveJobs);

/**
 * Team-specific job endpoints - MUST come before /:jobId to avoid route conflicts
 */

/**
 * @route   GET /api/jobs/teams/:teamId
 * @desc    Get all jobs for a team
 * @access  Public
 */
router.get('/teams/:teamId', getTeamJobs);

/**
 * @route   GET /api/jobs/teams/:teamId/count
 * @desc    Get active jobs count for a team
 * @access  Public
 */
router.get('/teams/:teamId/count', getTeamJobsCount);

/**
 * @route   GET /api/jobs/teams/:teamId/sub-teams/counts
 * @desc    Get active jobs count for each sub-team
 * @access  Public
 */
router.get('/teams/:teamId/sub-teams/counts', getSubTeamJobsCounts);

/**
 * @route   POST /api/jobs/teams/:teamId
 * @desc    Create a job posting
 * @access  Private (Team OWNER/ADMIN)
 */
router.post('/teams/:teamId', authenticate, createJob);

/**
 * @route   GET /api/jobs/:jobId
 * @desc    Get job posting by ID (must come after /teams/:teamId routes)
 * @access  Public
 */
router.get('/:jobId', getJob);

/**
 * Protected job endpoints (require authentication)
 */

/**
 * @route   PATCH /api/jobs/:jobId
 * @desc    Update job posting
 * @access  Private (Team OWNER/ADMIN)
 */
router.patch('/:jobId', authenticate, updateJob);

/**
 * @route   DELETE /api/jobs/:jobId
 * @desc    Delete job posting
 * @access  Private (Team OWNER/ADMIN)
 */
router.delete('/:jobId', authenticate, deleteJob);

export default router;
