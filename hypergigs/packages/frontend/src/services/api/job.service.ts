import api from '@/lib/axios';
import type {
  JobPosting,
  CreateJobRequest,
  UpdateJobRequest,
  JobStatus,
  JobSearchFilters,
  PaginatedJobs,
} from '@/types/job';

export const jobService = {
  /**
   * Create a job posting for a team
   */
  async createJob(teamId: string, data: CreateJobRequest): Promise<JobPosting> {
    const response = await api.post<{ job: JobPosting }>(
      `/api/jobs/teams/${teamId}`,
      data
    );
    return response.data.job;
  },

  /**
   * Get a single job posting by ID
   */
  async getJob(jobId: string): Promise<JobPosting> {
    const response = await api.get<{ job: JobPosting }>(`/api/jobs/${jobId}`);
    return response.data.job;
  },

  /**
   * Get all jobs for a team
   */
  async getTeamJobs(teamId: string, status?: JobStatus): Promise<JobPosting[]> {
    const params = status ? { status } : {};
    const response = await api.get<{ jobs: JobPosting[] }>(
      `/api/jobs/teams/${teamId}`,
      { params }
    );
    return response.data.jobs;
  },

  /**
   * Get active jobs count for a team
   */
  async getTeamJobsCount(
    teamId: string,
    includeSubTeams = false
  ): Promise<number> {
    const params = includeSubTeams ? { includeSubTeams: 'true' } : {};
    const response = await api.get<{ count: number }>(
      `/api/jobs/teams/${teamId}/count`,
      { params }
    );
    return response.data.count;
  },

  /**
   * Get active jobs count for each sub-team
   */
  async getSubTeamJobsCounts(
    parentTeamId: string
  ): Promise<Record<string, number>> {
    const response = await api.get<{ counts: Record<string, number> }>(
      `/api/jobs/teams/${parentTeamId}/sub-teams/counts`
    );
    return response.data.counts;
  },

  /**
   * Update a job posting
   */
  async updateJob(
    jobId: string,
    data: UpdateJobRequest
  ): Promise<JobPosting> {
    const response = await api.patch<{ job: JobPosting }>(
      `/api/jobs/${jobId}`,
      data
    );
    return response.data.job;
  },

  /**
   * Delete a job posting
   */
  async deleteJob(jobId: string): Promise<void> {
    await api.delete(`/api/jobs/${jobId}`);
  },

  /**
   * Get all active jobs (public job board)
   */
  async getActiveJobs(filters?: JobSearchFilters): Promise<PaginatedJobs> {
    const response = await api.get<PaginatedJobs>('/api/jobs', {
      params: filters,
    });
    return response.data;
  },
};
