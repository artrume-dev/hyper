import { Request, Response } from 'express';
import { emailInvitationService, SendEmailInvitationData } from '../services/emailInvitation.service.js';
import { validateCompanyEmail } from '../utils/emailValidator.js';
import { logger } from '../utils/logger.js';

/**
 * Send email invitation to non-registered user
 */
export const sendEmailInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { teamId } = req.params;
    const { email, role, message } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Validate role if provided
    if (role && !['ADMIN', 'MEMBER'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be ADMIN or MEMBER' });
      return;
    }

    // Validate company email
    const validation = await validateCompanyEmail(email, teamId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const invitationData: SendEmailInvitationData = {
      teamId,
      email,
      role: role || 'MEMBER',
      message,
      invitedBy: req.userId,
    };

    const invitation = await emailInvitationService.sendEmailInvitation(invitationData);

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        team: invitation.team,
        inviter: invitation.inviter,
      },
    });
  } catch (error) {
    logger.error('Send email invitation error:', error);

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('Only team')) {
        res.status(403).json({ error: error.message });
      } else if (error.message.includes('Failed to send')) {
        res.status(500).json({ error: 'Failed to send invitation email' });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Failed to send invitation' });
    }
  }
};

/**
 * Validate invitation token (public endpoint for registration page)
 */
export const validateInvitationToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const invitation = await emailInvitationService.validateInvitationToken(token);

    res.status(200).json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        message: invitation.message,
        team: invitation.team,
        inviter: invitation.inviter,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    logger.error('Validate invitation token error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('accepted') || error.message.includes('cancelled')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Failed to validate invitation' });
    }
  }
};

/**
 * Accept invitation (called after user registers)
 */
export const acceptInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { token } = req.params;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const result = await emailInvitationService.acceptInvitation(token, req.userId);

    res.status(200).json({
      message: 'Invitation accepted successfully',
      team: result.team,
    });
  } catch (error) {
    logger.error('Accept invitation error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('accepted') || error.message.includes('cancelled')) {
        res.status(400).json({ error: error.message });
      } else if (error.message.includes('already a member')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Failed to accept invitation' });
    }
  }
};

/**
 * Cancel invitation
 */
export const cancelInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { invitationId } = req.params;

    if (!invitationId) {
      res.status(400).json({ error: 'Invitation ID is required' });
      return;
    }

    await emailInvitationService.cancelInvitation(invitationId, req.userId);

    res.status(200).json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    logger.error('Cancel invitation error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('permission')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Failed to cancel invitation' });
    }
  }
};

/**
 * Get all pending invitations for a team
 */
export const getTeamInvitations = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { teamId } = req.params;

    const invitations = await emailInvitationService.getTeamInvitations(teamId);

    res.status(200).json({ invitations });
  } catch (error) {
    logger.error('Get team invitations error:', error);
    res.status(500).json({ error: 'Failed to get invitations' });
  }
};

/**
 * Check if email has pending invitation
 */
export const checkExistingInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const exists = await emailInvitationService.checkExistingInvitation(email, teamId);

    res.status(200).json({ exists });
  } catch (error) {
    logger.error('Check existing invitation error:', error);
    res.status(500).json({ error: 'Failed to check invitation' });
  }
};
