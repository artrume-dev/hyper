import { Router } from 'express';
import {
  applyToJob,
  getJobApplications,
  getMyApplications,
  getApplication,
  updateApplicationStatus,
  withdrawApplication,
  checkIfApplied,
} from '../controllers/application.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * All application routes require authentication
 */

/**
 * @route   POST /api/jobs/:jobId/apply
 * @desc    Submit a job application
 * @access  Private
 */
router.post('/jobs/:jobId/apply', authenticate, applyToJob);

/**
 * @route   GET /api/jobs/:jobId/has-applied
 * @desc    Check if user has applied to a job
 * @access  Private
 */
router.get('/jobs/:jobId/has-applied', authenticate, checkIfApplied);

/**
 * @route   GET /api/jobs/:jobId/applications
 * @desc    Get all applications for a job (team admins only)
 * @access  Private (Team OWNER/ADMIN)
 */
router.get('/jobs/:jobId/applications', authenticate, getJobApplications);

/**
 * @route   GET /api/applications/my
 * @desc    Get user's applications
 * @access  Private
 */
router.get('/applications/my', authenticate, getMyApplications);

/**
 * @route   GET /api/applications/:applicationId
 * @desc    Get application by ID
 * @access  Private
 */
router.get('/applications/:applicationId', authenticate, getApplication);

/**
 * @route   PATCH /api/applications/:applicationId/status
 * @desc    Update application status (team admins only)
 * @access  Private (Team OWNER/ADMIN)
 */
router.patch('/applications/:applicationId/status', authenticate, updateApplicationStatus);

/**
 * @route   DELETE /api/applications/:applicationId
 * @desc    Withdraw application
 * @access  Private
 */
router.delete('/applications/:applicationId', authenticate, withdrawApplication);

export default router;
