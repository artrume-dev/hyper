import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  sendInvitation,
  getInvitation,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  getReceivedInvitations,
  getSentInvitations,
  getTeamInvitations,
} from '../controllers/invitation.controller.js';

const router = Router();

// All invitation routes require authentication
router.use(authenticate);

// Send invitation to user for team
router.post('/', sendInvitation);

// Get received invitations
router.get('/received', getReceivedInvitations);

// Get sent invitations
router.get('/sent', getSentInvitations);

// Get invitation by ID
router.get('/:invitationId', getInvitation);

// Accept invitation
router.put('/:invitationId/accept', acceptInvitation);

// Decline invitation
router.put('/:invitationId/decline', declineInvitation);

// Cancel invitation (sender only)
router.delete('/:invitationId', cancelInvitation);

// Get team invitations (for team owners/admins)
router.get('/teams/:teamId', getTeamInvitations);

export default router;
