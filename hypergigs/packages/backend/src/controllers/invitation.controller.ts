import { Request, Response } from 'express';
import { invitationService } from '../services/invitation.service.js';
import { logger } from '../utils/logger.js';

/**
 * Send invitation to user for team
 */
export const sendInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const senderId = req.userId!;
    const { receiverId, teamId, role, message } = req.body;

    // Validate required fields
    if (!receiverId || !teamId) {
      res.status(400).json({ error: 'Recipient ID and team ID are required' });
      return;
    }

    // Validate role if provided
    if (role && !['OWNER', 'ADMIN', 'MEMBER'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be OWNER, ADMIN, or MEMBER' });
      return;
    }

    const invitation = await invitationService.sendInvitation({
      senderId,
      receiverId,
      teamId,
      role,
      message,
    });

    res.status(201).json({ invitation });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Send invitation error:', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('permission') || errorMessage.includes('Only')) {
      res.status(403).json({ error: errorMessage });
    } else if (errorMessage.includes('already')) {
      res.status(409).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Failed to send invitation' });
    }
  }
};

/**
 * Get invitation by ID
 */
export const getInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { invitationId } = req.params;

    const invitation = await invitationService.getInvitationById(invitationId, userId);

    res.status(200).json({ invitation });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Get invitation error:', { error: errorMessage });
    
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('Unauthorized')) {
      res.status(403).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Failed to get invitation' });
    }
  }
};

/**
 * Accept invitation
 */
export const acceptInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { invitationId } = req.params;

    const result = await invitationService.acceptInvitation(invitationId, userId);

    res.status(200).json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Accept invitation error:', { error: errorMessage });
    
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('Only') || errorMessage.includes('cannot')) {
      res.status(403).json({ error: errorMessage });
    } else if (errorMessage.includes('already')) {
      res.status(409).json({ error: errorMessage });
    } else if (errorMessage.includes('expired')) {
      res.status(410).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Failed to accept invitation' });
    }
  }
};

/**
 * Decline invitation
 */
export const declineInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { invitationId } = req.params;

    const invitation = await invitationService.declineInvitation(invitationId, userId);

    res.status(200).json({ invitation });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Decline invitation error:', { error: errorMessage });
    
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('Only') || errorMessage.includes('cannot')) {
      res.status(403).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Failed to decline invitation' });
    }
  }
};

/**
 * Cancel invitation (sender only)
 */
export const cancelInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { invitationId } = req.params;

    const invitation = await invitationService.cancelInvitation(invitationId, userId);

    res.status(200).json({ invitation });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Cancel invitation error:', { error: errorMessage });
    
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('Only') || errorMessage.includes('cannot')) {
      res.status(403).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Failed to cancel invitation' });
    }
  }
};

/**
 * Get received invitations
 */
export const getReceivedInvitations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { status } = req.query;

    const invitations = await invitationService.getReceivedInvitations(
      userId,
      status as any
    );

    res.status(200).json({ invitations });
  } catch (error) {
    logger.error('Get received invitations error:', error);
    res.status(500).json({ error: 'Failed to get received invitations' });
  }
};

/**
 * Get sent invitations
 */
export const getSentInvitations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { status } = req.query;

    const invitations = await invitationService.getSentInvitations(
      userId,
      status as any
    );

    res.status(200).json({ invitations });
  } catch (error) {
    logger.error('Get sent invitations error:', error);
    res.status(500).json({ error: 'Failed to get sent invitations' });
  }
};

/**
 * Get team invitations (for team owners/admins)
 */
export const getTeamInvitations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { teamId } = req.params;
    const { status } = req.query;

    const invitations = await invitationService.getTeamInvitations(
      teamId,
      userId,
      status as any
    );

    res.status(200).json({ invitations });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Get team invitations error:', { error: errorMessage });
    
    if (errorMessage.includes('Only')) {
      res.status(403).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Failed to get team invitations' });
    }
  }
};
