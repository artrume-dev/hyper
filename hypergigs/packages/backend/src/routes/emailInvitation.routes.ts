import { Router } from 'express';
import {
  sendEmailInvitation,
  validateInvitationToken,
  acceptInvitation,
  cancelInvitation,
  getTeamInvitations,
  checkExistingInvitation,
} from '../controllers/emailInvitation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/email-invitations/teams/:teamId
 * @desc    Send email invitation to non-registered user
 * @access  Private (team owner/admin only)
 */
router.post('/teams/:teamId', authenticate, sendEmailInvitation);

/**
 * @route   GET /api/email-invitations/validate/:token
 * @desc    Validate invitation token
 * @access  Public
 */
router.get('/validate/:token', validateInvitationToken);

/**
 * @route   POST /api/email-invitations/accept/:token
 * @desc    Accept invitation after registration
 * @access  Private (newly registered user)
 */
router.post('/accept/:token', authenticate, acceptInvitation);

/**
 * @route   DELETE /api/email-invitations/:invitationId
 * @desc    Cancel invitation
 * @access  Private (inviter, team owner, or admin)
 */
router.delete('/:invitationId', authenticate, cancelInvitation);

/**
 * @route   GET /api/email-invitations/teams/:teamId
 * @desc    Get all pending invitations for a team
 * @access  Private (team members)
 */
router.get('/teams/:teamId', authenticate, getTeamInvitations);

/**
 * @route   GET /api/email-invitations/teams/:teamId/check
 * @desc    Check if email has pending invitation
 * @access  Public
 */
router.get('/teams/:teamId/check', checkExistingInvitation);

export default router;
