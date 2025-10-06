import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
export type InvitationRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface SendInvitationData {
  senderId: string;
  receiverId: string;
  teamId: string;
  role?: InvitationRole;
  message?: string;
}

export class InvitationService {
  /**
   * Send invitation to a user to join a team
   */
  async sendInvitation(data: SendInvitationData) {
    const { senderId, receiverId, teamId, role = 'MEMBER', message } = data;

    // Verify sender is a team member with permission
    const senderMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: senderId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!senderMembership) {
      throw new Error('Only team owners and admins can send invitations');
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!recipient) {
      throw new Error('Recipient user not found');
    }

    // Check if recipient is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: { teamId, userId: receiverId },
    });

    if (existingMember) {
      throw new Error('User is already a team member');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        teamId,
        receiverId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      throw new Error('Pending invitation already exists for this user');
    }

    // Create invitation with 7-day expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        senderId,
        receiverId,
        teamId,
        role,
        message,
        status: 'PENDING',
        expiresAt,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
            type: true,
          },
        },
      },
    });

    logger.info(`Invitation sent from ${senderId} to ${receiverId} for team ${teamId}`);

    return invitation;
  }

  /**
   * Get invitation by ID
   */
  async getInvitationById(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
            type: true,
            description: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Only sender or recipient can view the invitation
    if (invitation.senderId !== userId && invitation.receiverId !== userId) {
      throw new Error('Unauthorized to view this invitation');
    }

    return invitation;
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { team: true },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Only recipient can accept
    if (invitation.receiverId !== userId) {
      throw new Error('Only the recipient can accept this invitation');
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      throw new Error(`Invitation is ${invitation.status.toLowerCase()}, cannot accept`);
    }

    // Check if expired
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: 'EXPIRED' },
      });
      throw new Error('Invitation has expired');
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: invitation.teamId,
        userId,
      },
    });

    if (existingMember) {
      throw new Error('You are already a member of this team');
    }

    // Use transaction to add member and update invitation
    const result = await prisma.$transaction(async (tx: any) => {
      // Add user to team with the invited role
      const teamMember = await tx.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId,
          role: invitation.role,
        },
      });

      // Update invitation status
      const updatedInvitation = await tx.invitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              avatar: true,
              type: true,
            },
          },
        },
      });

      return { invitation: updatedInvitation, teamMember };
    });

    logger.info(`Invitation ${invitationId} accepted by user ${userId}`);

    return result;
  }

  /**
   * Decline invitation
   */
  async declineInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Only recipient can decline
    if (invitation.receiverId !== userId) {
      throw new Error('Only the recipient can decline this invitation');
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      throw new Error(`Invitation is ${invitation.status.toLowerCase()}, cannot decline`);
    }

    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'DECLINED' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
            type: true,
          },
        },
      },
    });

    logger.info(`Invitation ${invitationId} declined by user ${userId}`);

    return updatedInvitation;
  }

  /**
   * Cancel invitation (by sender only)
   */
  async cancelInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Only sender can cancel
    if (invitation.senderId !== userId) {
      throw new Error('Only the sender can cancel this invitation');
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      throw new Error(`Invitation is ${invitation.status.toLowerCase()}, cannot cancel`);
    }

    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
            type: true,
          },
        },
      },
    });

    logger.info(`Invitation ${invitationId} cancelled by sender ${userId}`);

    return updatedInvitation;
  }

  /**
   * Get received invitations (for current user)
   */
  async getReceivedInvitations(userId: string, status?: InvitationStatus) {
    const where: any = { receiverId: userId };

    if (status) {
      where.status = status;
    }

    const invitations = await prisma.invitation.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
            type: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations;
  }

  /**
   * Get sent invitations (by current user)
   */
  async getSentInvitations(userId: string, status?: InvitationStatus) {
    const where: any = { senderId: userId };

    if (status) {
      where.status = status;
    }

    const invitations = await prisma.invitation.findMany({
      where,
      include: {
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations;
  }

  /**
   * Get team invitations (for team owners/admins)
   */
  async getTeamInvitations(teamId: string, userId: string, status?: InvitationStatus) {
    // Verify user is team owner or admin
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!membership) {
      throw new Error('Only team owners and admins can view team invitations');
    }

    const where: any = { teamId };

    if (status) {
      where.status = status;
    }

    const invitations = await prisma.invitation.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations;
  }

  /**
   * Mark expired invitations (should be run periodically)
   */
  async markExpiredInvitations() {
    const result = await prisma.invitation.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    logger.info(`Marked ${result.count} invitations as expired`);

    return result;
  }
}

export const invitationService = new InvitationService();
