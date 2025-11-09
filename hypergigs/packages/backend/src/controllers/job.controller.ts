import { Request, Response } from 'express';
import { jobService } from '../services/job.service.js';
import { logger } from '../utils/logger.js';

/**
 * @route   POST /api/teams/:teamId/jobs
 * @desc    Create a job posting
 * @access  Private (Team OWNER/ADMIN)
 */
export const createJob = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = req.userId!;
    const jobData = req.body;

    const job = await jobService.createJobPosting(teamId, userId, jobData);

    res.status(201).json({
      job,
      message: 'Job posting created successfully',
    });
  } catch (error: any) {
    logger.error('Create job error:', error);
    res.status(error.message.includes('not found') ? 404 : 403).json({
      error: error.message || 'Failed to create job posting',
    });
  }
};

/**
 * @route   GET /api/teams/:teamId/jobs
 * @desc    Get all jobs for a team
 * @access  Public
 */
export const getTeamJobs = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { status } = req.query;

    const jobs = await jobService.getTeamJobs(
      teamId,
      status as 'ACTIVE' | 'CLOSED' | 'DRAFT' | undefined
    );

    res.json({ jobs });
  } catch (error: any) {
    logger.error('Get team jobs error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch jobs',
    });
  }
};

/**
 * @route   GET /api/teams/:teamId/jobs/count
 * @desc    Get active jobs count for a team
 * @access  Public
 */
export const getTeamJobsCount = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { includeSubTeams } = req.query;

    const count = await jobService.getActiveJobsCount(
      teamId,
      includeSubTeams === 'true'
    );

    res.json({ count });
  } catch (error: any) {
    logger.error('Get team jobs count error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message || 'Failed to get jobs count',
    });
  }
};

/**
 * @route   GET /api/teams/:teamId/sub-teams/jobs/counts
 * @desc    Get active jobs count for each sub-team
 * @access  Public
 */
export const getSubTeamJobsCounts = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    const counts = await jobService.getSubTeamJobCounts(teamId);

    res.json({ counts });
  } catch (error: any) {
    logger.error('Get sub-team jobs counts error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message || 'Failed to get sub-team jobs counts',
    });
  }
};

/**
 * @route   GET /api/jobs/:jobId
 * @desc    Get job posting by ID
 * @access  Public
 */
export const getJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await jobService.getJobById(jobId);

    res.json({ job });
  } catch (error: any) {
    logger.error('Get job error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message || 'Failed to fetch job',
    });
  }
};

/**
 * @route   PATCH /api/jobs/:jobId
 * @desc    Update job posting
 * @access  Private (Team OWNER/ADMIN)
 */
export const updateJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId!;
    const updateData = req.body;

    const job = await jobService.updateJobPosting(jobId, userId, updateData);

    res.json({
      job,
      message: 'Job posting updated successfully',
    });
  } catch (error: any) {
    logger.error('Update job error:', error);
    res.status(error.message.includes('not found') ? 404 : 403).json({
      error: error.message || 'Failed to update job posting',
    });
  }
};

/**
 * @route   DELETE /api/jobs/:jobId
 * @desc    Delete job posting
 * @access  Private (Team OWNER/ADMIN)
 */
export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId!;

    const result = await jobService.deleteJobPosting(jobId, userId);

    res.json(result);
  } catch (error: any) {
    logger.error('Delete job error:', error);
    res.status(error.message.includes('not found') ? 404 : 403).json({
      error: error.message || 'Failed to delete job posting',
    });
  }
};

/**
 * @route   GET /api/jobs
 * @desc    Get all active jobs (public job board)
 * @access  Public
 */
export const getActiveJobs = async (req: Request, res: Response) => {
  try {
    const { type, location, search, teamId, subTeamId, page, limit } = req.query;

    const result = await jobService.getActiveJobs({
      type: type as any,
      location: location as string,
      search: search as string,
      teamId: teamId as string,
      subTeamId: subTeamId as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Get active jobs error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch jobs',
    });
  }
};
