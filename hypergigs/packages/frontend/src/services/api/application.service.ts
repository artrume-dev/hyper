import api from '@/lib/axios';
import type {
  JobApplication,
  CreateApplicationRequest,
  UpdateApplicationStatusRequest,
  ApplicationStatus,
} from '@/types/job';

export const applicationService = {
  /**
   * Submit a job application
   */
  async applyToJob(jobId: string, data: CreateApplicationRequest) {
    const response = await api.post(`/api/jobs/${jobId}/apply`, data);
    return response.data;
  },

  /**
   * Check if user has applied to a job
   */
  async checkIfApplied(jobId: string): Promise<{ hasApplied: boolean }> {
    const response = await api.get(`/api/jobs/${jobId}/has-applied`);
    return response.data;
  },

  /**
   * Get all applications for a job (team admins only)
   */
  async getJobApplications(
    jobId: string,
    status?: ApplicationStatus
  ): Promise<{ applications: JobApplication[] }> {
    const params = status ? { status } : {};
    const response = await api.get(`/api/jobs/${jobId}/applications`, { params });
    return response.data;
  },

  /**
   * Get user's applications
   */
  async getMyApplications(
    status?: ApplicationStatus
  ): Promise<{ applications: JobApplication[] }> {
    const params = status ? { status } : {};
    const response = await api.get('/api/applications/my', { params });
    return response.data;
  },

  /**
   * Get application by ID
   */
  async getApplication(applicationId: string): Promise<{ application: JobApplication }> {
    const response = await api.get(`/api/applications/${applicationId}`);
    return response.data;
  },

  /**
   * Update application status (team admins only)
   */
  async updateApplicationStatus(
    applicationId: string,
    data: UpdateApplicationStatusRequest
  ) {
    const response = await api.patch(`/api/applications/${applicationId}/status`, data);
    return response.data;
  },

  /**
   * Withdraw application
   */
  async withdrawApplication(applicationId: string) {
    const response = await api.delete(`/api/applications/${applicationId}`);
    return response.data;
  },
};
