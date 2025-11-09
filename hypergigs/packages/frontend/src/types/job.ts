export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE';
export type JobStatus = 'ACTIVE' | 'CLOSED' | 'DRAFT';

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  location?: string;
  type: JobType;
  status: JobStatus;
  isFeatured?: boolean;
  isSponsored?: boolean;
  minSalary?: number;
  maxSalary?: number;
  currency: string;
  teamId: string;
  subTeamId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  team?: {
    id: string;
    name: string;
    slug: string;
    type: string;
    subTeamCategory?: string;
    avatar?: string;
    city?: string;
  };
  subTeam?: {
    id: string;
    name: string;
    subTeamCategory?: string;
  };
  creator?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface CreateJobRequest {
  title: string;
  description: string;
  location?: string;
  type: JobType;
  status?: JobStatus;
  isFeatured?: boolean;
  isSponsored?: boolean;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  subTeamId?: string;
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  location?: string;
  type?: JobType;
  status?: JobStatus;
  isFeatured?: boolean;
  isSponsored?: boolean;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  subTeamId?: string;
}

export interface JobSearchFilters {
  type?: JobType;
  location?: string;
  search?: string;
  subTeamId?: string;
  teamId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedJobs {
  jobs: JobPosting[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Helper constants
export const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  FREELANCE: 'Freelance',
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  DRAFT: 'Draft',
};

// Application types
export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  createdAt: string;
  updatedAt: string;
  job?: JobPosting;
  user?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email: string;
    avatar?: string;
    bio?: string;
    jobTitle?: string;
    location?: string;
  };
}

export interface CreateApplicationRequest {
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending Review',
  REVIEWING: 'Under Review',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};
