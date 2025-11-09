import { Router } from 'express';
import {
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  searchTeams,
  getMyTeams,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateMemberRole,
  leaveTeam,
  createSubTeam,
  getSubTeams,
  getSuggestedMembers,
  inviteMember,
} from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/teams
 * @desc    Create a new team
 * @access  Private
 */
router.post('/', authenticate, createTeam);

/**
 * @route   GET /api/teams
 * @desc    Search/list teams
 * @access  Public
 */
router.get('/', searchTeams);

/**
 * @route   GET /api/teams/my-teams
 * @desc    Get user's teams
 * @access  Private
 */
router.get('/my-teams', authenticate, getMyTeams);

/**
 * @route   GET /api/teams/:identifier
 * @desc    Get team by ID or slug
 * @access  Public
 */
router.get('/:identifier', getTeam);

/**
 * @route   PUT /api/teams/:teamId
 * @desc    Update team
 * @access  Private (owner only)
 */
router.put('/:teamId', authenticate, updateTeam);

/**
 * @route   DELETE /api/teams/:teamId
 * @desc    Delete team
 * @access  Private (owner only)
 */
router.delete('/:teamId', authenticate, deleteTeam);

/**
 * @route   GET /api/teams/:teamId/members
 * @desc    Get team members
 * @access  Public
 */
router.get('/:teamId/members', getTeamMembers);

/**
 * @route   POST /api/teams/:teamId/members
 * @desc    Add team member
 * @access  Private (owner/admin only)
 */
router.post('/:teamId/members', authenticate, addTeamMember);

/**
 * @route   DELETE /api/teams/:teamId/members/:userId
 * @desc    Remove team member
 * @access  Private (owner/admin only)
 */
router.delete('/:teamId/members/:userId', authenticate, removeTeamMember);

/**
 * @route   PUT /api/teams/:teamId/members/:userId/role
 * @desc    Update member role
 * @access  Private (owner only)
 */
router.put('/:teamId/members/:userId/role', authenticate, updateMemberRole);

/**
 * @route   POST /api/teams/:teamId/leave
 * @desc    Leave team
 * @access  Private
 */
router.post('/:teamId/leave', authenticate, leaveTeam);

/**
 * @route   GET /api/teams/:teamId/sub-teams
 * @desc    Get sub-teams of a team
 * @access  Public
 */
router.get('/:teamId/sub-teams', getSubTeams);

/**
 * @route   POST /api/teams/:teamId/sub-teams
 * @desc    Create a sub-team
 * @access  Private (admin only)
 */
router.post('/:teamId/sub-teams', authenticate, createSubTeam);

/**
 * @route   GET /api/teams/:teamId/suggested-members
 * @desc    Get suggested members for a team based on AI matching
 * @access  Private (team members only)
 */
router.get('/:teamId/suggested-members', authenticate, getSuggestedMembers);

/**
 * @route   POST /api/teams/:teamId/invite
 * @desc    Invite member with auto-detection (email or username)
 * @access  Private (owner/admin only)
 */
router.post('/:teamId/invite', authenticate, inviteMember);

export default router;
