import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { emailService } from './email.service.js';
import crypto from 'crypto';

export interface SendEmailInvitationData {
  teamId: string;
  email: string;
  role: string;
  message?: string;
  invitedBy: string;
}

export class EmailInvitationService {
  /**
   * Send email invitation to non-registered user
   */
  async sendEmailInvitation(data: SendEmailInvitationData) {
    const { teamId, email, role, message, invitedBy } = data;

    // Check if invitation already exists
    const existingInvitation = await prisma.emailInvitation.findUnique({
      where: {
        email_teamId: {
          email,
          teamId,
        },
      },
    });

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      throw new Error('An invitation to this email for this team already exists');
    }

    // Get team and inviter details
    const [team, inviter] = await Promise.all([
      prisma.team.findUnique({
        where: { id: teamId },
        select: {
          id: true,
          name: true,
          avatar: true,
          description: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: invitedBy },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      }),
    ]);

    if (!team) {
      throw new Error('Team not found');
    }

    if (!inviter) {
      throw new Error('Inviter not found');
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create email invitation
    const invitation = await prisma.emailInvitation.create({
      data: {
        email,
        teamId,
        role,
        message,
        invitedBy,
        token,
        expiresAt,
        status: 'PENDING',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        inviter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send email
    try {
      await emailService.sendTeamInvitation({
        to: email,
        teamName: team.name,
        inviterName: `${inviter.firstName} ${inviter.lastName}`,
        role,
        message,
        token,
        teamAvatar: team.avatar,
      });

      logger.info(
        `Email invitation sent to ${email} for team ${team.name} by ${inviter.firstName}`
      );
    } catch (error) {
      // If email fails, delete the invitation
      await prisma.emailInvitation.delete({
        where: { id: invitation.id },
      });
      throw error;
    }

    return invitation;
  }

  /**
   * Validate invitation token and get invitation details
   */
  async validateInvitationToken(token: string) {
    const invitation = await prisma.emailInvitation.findUnique({
      where: { token },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
            description: true,
            type: true,
          },
        },
        inviter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      // Update status to expired
      await prisma.emailInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new Error('This invitation has expired');
    }

    // Check if already accepted
    if (invitation.status === 'ACCEPTED') {
      throw new Error('This invitation has already been accepted');
    }

    // Check if cancelled
    if (invitation.status === 'CANCELLED') {
      throw new Error('This invitation has been cancelled');
    }

    return invitation;
  }

  /**
   * Accept invitation (called after user registers)
   */
  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.validateInvitationToken(token);

    // Check if user is already a member of the team
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: invitation.teamId,
        },
      },
    });

    if (existingMember) {
      throw new Error('You are already a member of this team');
    }

    // Add user to team
    await prisma.teamMember.create({
      data: {
        userId,
        teamId: invitation.teamId,
        role: invitation.role,
      },
    });

    // Update invitation status
    await prisma.emailInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    logger.info(
      `Email invitation accepted: user ${userId} joined team ${invitation.teamId}`
    );

    return {
      success: true,
      team: invitation.team,
    };
  }

  /**
   * Check if email already has pending invitation to team
   */
  async checkExistingInvitation(email: string, teamId: string) {
    const invitation = await prisma.emailInvitation.findUnique({
      where: {
        email_teamId: {
          email,
          teamId,
        },
      },
    });

    return invitation && invitation.status === 'PENDING';
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.emailInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Check if user is the inviter or team owner/admin
    const team = await prisma.team.findUnique({
      where: { id: invitation.teamId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const isInviter = invitation.invitedBy === userId;
    const isOwner = team.ownerId === userId;
    const isAdmin =
      team.members.length > 0 && team.members[0].role === 'ADMIN';

    if (!isInviter && !isOwner && !isAdmin) {
      throw new Error('You do not have permission to cancel this invitation');
    }

    // Update invitation status
    await prisma.emailInvitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' },
    });

    logger.info(
      `Email invitation cancelled: ${invitationId} by user ${userId}`
    );

    return { success: true };
  }

  /**
   * Clean up expired invitations (to be run as cron job)
   */
  async cleanupExpiredInvitations() {
    const now = new Date();

    const result = await prisma.emailInvitation.updateMany({
      where: {
        expiresAt: {
          lt: now,
        },
        status: 'PENDING',
      },
      data: {
        status: 'EXPIRED',
      },
    });

    logger.info(`Expired ${result.count} email invitations`);

    return result.count;
  }

  /**
   * Get all pending invitations for a team
   */
  async getTeamInvitations(teamId: string) {
    const invitations = await prisma.emailInvitation.findMany({
      where: {
        teamId,
        status: 'PENDING',
      },
      include: {
        inviter: {
          select: {
            id: true,
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

    return invitations;
  }
}

export const emailInvitationService = new EmailInvitationService();
