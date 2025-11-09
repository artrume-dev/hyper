import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE';
export type JobStatus = 'ACTIVE' | 'CLOSED' | 'DRAFT';

export interface CreateJobData {
  title: string;
  description: string;
  location?: string;
  type: JobType;
  status?: JobStatus;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  subTeamId?: string;
}

export interface UpdateJobData {
  title?: string;
  description?: string;
  location?: string;
  type?: JobType;
  status?: JobStatus;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  subTeamId?: string;
}

export class JobService {
  /**
   * Check if user can manage jobs for a team (must be OWNER or ADMIN)
   */
  private async canManageJobs(userId: string, teamId: string): Promise<boolean> {
    const member = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    return member !== null && ['OWNER', 'ADMIN'].includes(member.role);
  }

  /**
   * Create a job posting
   */
  async createJobPosting(teamId: string, createdBy: string, data: CreateJobData) {
    // Verify user can manage jobs for this team
    const canManage = await this.canManageJobs(createdBy, teamId);
    if (!canManage) {
      throw new Error('Only team owners and admins can create job postings');
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const job = await prisma.jobPosting.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        type: data.type,
        status: data.status || 'ACTIVE',
        minSalary: data.minSalary,
        maxSalary: data.maxSalary,
        currency: data.currency || 'USD',
        teamId,
        subTeamId: data.subTeamId,
        createdBy,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            subTeamCategory: true,
          },
        },
        subTeam: {
          select: {
            id: true,
            name: true,
            subTeamCategory: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    logger.info(`Job posting created: "${job.title}" for team ${team.name} by user ${createdBy}`);
    return job;
  }

  /**
   * Get job posting by ID
   */
  async getJobById(jobId: string) {
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            subTeamCategory: true,
            avatar: true,
          },
        },
        subTeam: {
          select: {
            id: true,
            name: true,
            subTeamCategory: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    if (!job) {
      throw new Error('Job posting not found');
    }

    return job;
  }

  /**
   * Get all job postings for a team
   */
  async getTeamJobs(teamId: string, status?: JobStatus) {
    // First, check if this is a main team or sub-team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        isMainTeam: true,
        parentTeamId: true,
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const where: any = {};

    // If it's a sub-team, find jobs where subTeamId matches
    if (!team.isMainTeam && team.parentTeamId) {
      where.subTeamId = teamId;
    } else {
      // If it's a main team, find jobs where teamId matches (regardless of subTeamId)
      where.teamId = teamId;
    }

    if (status) {
      where.status = status;
    }

    const jobs = await prisma.jobPosting.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
          },
        },
        subTeam: {
          select: {
            id: true,
            name: true,
            subTeamCategory: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return jobs;
  }

  /**
   * Get active jobs count for a team
   * @param teamId - Team ID
   * @param includeSubTeams - If true, includes jobs from all sub-teams
   */
  async getActiveJobsCount(teamId: string, includeSubTeams = false): Promise<number> {
    if (!includeSubTeams) {
      // Just count jobs for this team
      return prisma.jobPosting.count({
        where: {
          teamId,
          status: 'ACTIVE',
        },
      });
    }

    // Get team and all its sub-teams
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        subTeams: {
          select: { id: true },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Include main team + all sub-teams
    const teamIds = [teamId, ...team.subTeams.map((st) => st.id)];

    return prisma.jobPosting.count({
      where: {
        teamId: { in: teamIds },
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Get active jobs count per sub-team
   * Returns a map of subTeamId -> active job count
   */
  async getSubTeamJobCounts(parentTeamId: string): Promise<Record<string, number>> {
    const team = await prisma.team.findUnique({
      where: { id: parentTeamId },
      include: {
        subTeams: {
          select: { id: true },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (!team.isMainTeam) {
      throw new Error('Can only get sub-team job counts for main teams');
    }

    // Get job counts for each sub-team
    const subTeamIds = team.subTeams.map((st) => st.id);

    if (subTeamIds.length === 0) {
      return {};
    }

    const jobCounts = await prisma.jobPosting.groupBy({
      by: ['teamId'],
      where: {
        teamId: { in: subTeamIds },
        status: 'ACTIVE',
      },
      _count: {
        id: true,
      },
    });

    // Convert to map
    const countsMap: Record<string, number> = {};
    jobCounts.forEach((item) => {
      countsMap[item.teamId] = item._count.id;
    });

    // Ensure all sub-teams are in the map (even if 0 jobs)
    subTeamIds.forEach((id) => {
      if (!(id in countsMap)) {
        countsMap[id] = 0;
      }
    });

    return countsMap;
  }

  /**
   * Update job posting
   */
  async updateJobPosting(jobId: string, userId: string, data: UpdateJobData) {
    // Get the job to check team
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      throw new Error('Job posting not found');
    }

    // Verify user can manage jobs for this team
    const canManage = await this.canManageJobs(userId, existingJob.teamId);
    if (!canManage) {
      throw new Error('Only team owners and admins can update job postings');
    }

    const job = await prisma.jobPosting.update({
      where: { id: jobId },
      data,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    logger.info(`Job posting updated: "${job.title}" (${jobId}) by user ${userId}`);
    return job;
  }

  /**
   * Delete job posting
   */
  async deleteJobPosting(jobId: string, userId: string) {
    // Get the job to check team
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      throw new Error('Job posting not found');
    }

    // Verify user can manage jobs for this team
    const canManage = await this.canManageJobs(userId, existingJob.teamId);
    if (!canManage) {
      throw new Error('Only team owners and admins can delete job postings');
    }

    await prisma.jobPosting.delete({
      where: { id: jobId },
    });

    logger.info(`Job posting deleted: ${jobId} by user ${userId}`);
    return { message: 'Job posting deleted successfully' };
  }

  /**
   * Get all active jobs (public, for job board)
   */
  async getActiveJobs(filters: {
    type?: JobType;
    location?: string;
    search?: string;
    subTeamId?: string;
    teamId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { status: 'ACTIVE' };

    // If teamId is provided, filter by it
    // This ensures team-specific job pages only show that team's jobs
    if (filters.teamId) {
      where.teamId = filters.teamId;

      // If subTeamId is also provided, filter by both
      // This allows filtering within a team's jobs to a specific sub-team
      if (filters.subTeamId) {
        where.subTeamId = filters.subTeamId;
      }
    } else if (filters.subTeamId) {
      // If only subTeamId is provided (no teamId), filter by subTeamId only
      where.subTeamId = filters.subTeamId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        include: {
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              subTeamCategory: true,
              avatar: true,
              city: true,
            },
          },
          subTeam: {
            select: {
              id: true,
              name: true,
              subTeamCategory: true,
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const jobService = new JobService();
