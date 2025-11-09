import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';

export interface CreateApplicationData {
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
}

export interface UpdateApplicationData {
  status?: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
}

export class ApplicationService {
  /**
   * Submit a job application
   */
  async createApplication(jobId: string, userId: string, data: CreateApplicationData) {
    // Check if job exists and is active
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!job) {
      throw new Error('Job posting not found');
    }

    if (job.status !== 'ACTIVE') {
      throw new Error('This job posting is not accepting applications');
    }

    // Prevent job creator from applying to their own job
    if (job.createdBy === userId) {
      throw new Error('You cannot apply to your own job posting');
    }

    // Check if user has already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });

    if (existingApplication) {
      throw new Error('You have already applied to this job');
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        userId,
        coverLetter: data.coverLetter,
        resumeUrl: data.resumeUrl,
        portfolioUrl: data.portfolioUrl,
        status: 'PENDING',
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            bio: true,
            jobTitle: true,
          },
        },
      },
    });

    logger.info(`Application created: User ${userId} applied to job ${job.title} (${jobId})`);
    return application;
  }

  /**
   * Get application by ID
   */
  async getApplicationById(applicationId: string) {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
                avatar: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            bio: true,
            jobTitle: true,
            location: true,
          },
        },
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    return application;
  }

  /**
   * Get all applications for a job (for team admins)
   */
  async getJobApplications(jobId: string, userId: string, status?: ApplicationStatus) {
    // Check if user can manage this job (must be team owner or admin)
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        team: true,
      },
    });

    if (!job) {
      throw new Error('Job posting not found');
    }

    // Check if user is team owner or admin
    const member = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: job.teamId,
        },
      },
    });

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new Error('Only team owners and admins can view applications');
    }

    // Get applications
    const where: any = { jobId };
    if (status) {
      where.status = status;
    }

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            bio: true,
            jobTitle: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return applications;
  }

  /**
   * Get user's applications
   */
  async getUserApplications(userId: string, status?: ApplicationStatus) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        job: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
                avatar: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return applications;
  }

  /**
   * Update application status (for team admins)
   */
  async updateApplicationStatus(
    applicationId: string,
    userId: string,
    status: ApplicationStatus
  ) {
    // Get application with job and team info
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if user can manage this job
    const member = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: application.job.teamId,
        },
      },
    });

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new Error('Only team owners and admins can update application status');
    }

    // Update application
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    logger.info(
      `Application ${applicationId} status updated to ${status} by user ${userId}`
    );
    return updatedApplication;
  }

  /**
   * Withdraw application (for applicants)
   */
  async withdrawApplication(applicationId: string, userId: string) {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.userId !== userId) {
      throw new Error('You can only withdraw your own applications');
    }

    if (application.status === 'ACCEPTED') {
      throw new Error('Cannot withdraw an accepted application');
    }

    await prisma.jobApplication.delete({
      where: { id: applicationId },
    });

    logger.info(`Application ${applicationId} withdrawn by user ${userId}`);
    return { message: 'Application withdrawn successfully' };
  }

  /**
   * Check if user has applied to a job
   */
  async hasUserApplied(jobId: string, userId: string): Promise<boolean> {
    const application = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });

    return !!application;
  }

  /**
   * Get application count for a job
   */
  async getJobApplicationCount(jobId: string): Promise<number> {
    return prisma.jobApplication.count({
      where: { jobId },
    });
  }
}

export const applicationService = new ApplicationService();
