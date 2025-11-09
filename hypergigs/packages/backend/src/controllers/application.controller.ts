import { Request, Response } from 'express';
import { applicationService } from '../services/application.service.js';
import { logger } from '../utils/logger.js';

/**
 * @route   POST /api/jobs/:jobId/apply
 * @desc    Submit a job application
 * @access  Private
 */
export const applyToJob = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { jobId } = req.params;
    const applicationData = req.body;

    const application = await applicationService.createApplication(
      jobId,
      req.userId,
      applicationData
    );

    res.status(201).json({
      application,
      message: 'Application submitted successfully',
    });
  } catch (error: any) {
    logger.error('Apply to job error:', error);
    res.status(error.message.includes('not found') ? 404 : 400).json({
      error: error.message || 'Failed to submit application',
    });
  }
};

/**
 * @route   GET /api/jobs/:jobId/applications
 * @desc    Get all applications for a job (team admins only)
 * @access  Private (Team OWNER/ADMIN)
 */
export const getJobApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { jobId } = req.params;
    const { status } = req.query;

    const applications = await applicationService.getJobApplications(
      jobId,
      req.userId,
      status as any
    );

    res.json({ applications });
  } catch (error: any) {
    logger.error('Get job applications error:', error);
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('Only team')
      ? 403
      : 500;
    res.status(statusCode).json({
      error: error.message || 'Failed to fetch applications',
    });
  }
};

/**
 * @route   GET /api/applications/my
 * @desc    Get user's applications
 * @access  Private
 */
export const getMyApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { status } = req.query;

    const applications = await applicationService.getUserApplications(
      req.userId,
      status as any
    );

    res.json({ applications });
  } catch (error: any) {
    logger.error('Get my applications error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch applications',
    });
  }
};

/**
 * @route   GET /api/applications/:applicationId
 * @desc    Get application by ID
 * @access  Private
 */
export const getApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { applicationId } = req.params;

    const application = await applicationService.getApplicationById(applicationId);

    // Check if user is the applicant or team admin
    if (
      application.userId !== req.userId &&
      application.job.createdBy !== req.userId
    ) {
      // Check if user is team admin
      const member = await applicationService['canManageJob']?.(
        req.userId,
        application.job.teamId
      );
      if (!member) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }

    res.json({ application });
  } catch (error: any) {
    logger.error('Get application error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message || 'Failed to fetch application',
    });
  }
};

/**
 * @route   PATCH /api/applications/:applicationId/status
 * @desc    Update application status (team admins only)
 * @access  Private (Team OWNER/ADMIN)
 */
export const updateApplicationStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { applicationId } = req.params;
    const { status } = req.body;

    if (!status || !['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED'].includes(status)) {
      res.status(400).json({
        error: 'Invalid status. Must be PENDING, REVIEWING, ACCEPTED, or REJECTED',
      });
      return;
    }

    const application = await applicationService.updateApplicationStatus(
      applicationId,
      req.userId,
      status
    );

    res.json({
      application,
      message: 'Application status updated successfully',
    });
  } catch (error: any) {
    logger.error('Update application status error:', error);
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('Only team')
      ? 403
      : 500;
    res.status(statusCode).json({
      error: error.message || 'Failed to update application status',
    });
  }
};

/**
 * @route   DELETE /api/applications/:applicationId
 * @desc    Withdraw application
 * @access  Private
 */
export const withdrawApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { applicationId } = req.params;

    const result = await applicationService.withdrawApplication(applicationId, req.userId);

    res.json(result);
  } catch (error: any) {
    logger.error('Withdraw application error:', error);
    res.status(error.message.includes('not found') ? 404 : 403).json({
      error: error.message || 'Failed to withdraw application',
    });
  }
};

/**
 * @route   GET /api/jobs/:jobId/has-applied
 * @desc    Check if user has applied to a job
 * @access  Private
 */
export const checkIfApplied = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { jobId } = req.params;

    const hasApplied = await applicationService.hasUserApplied(jobId, req.userId);

    res.json({ hasApplied });
  } catch (error: any) {
    logger.error('Check if applied error:', error);
    res.status(500).json({
      error: error.message || 'Failed to check application status',
    });
  }
};
