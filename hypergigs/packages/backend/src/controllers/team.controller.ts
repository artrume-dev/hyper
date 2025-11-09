import { Request, Response } from 'express';
import { teamService, CreateTeamData, UpdateTeamData, TeamSearchFilters, MemberRole } from '../services/team.service.js';
import { emailInvitationService } from '../services/emailInvitation.service.js';
import { invitationService } from '../services/invitation.service.js';
import { validateCompanyEmail, isValidEmailFormat } from '../utils/emailValidator.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new team
 */
export const createTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { name, description, type, city, avatar } = req.body;

    if (!name || !type) {
      res.status(400).json({ error: 'Team name and type are required' });
      return;
    }

    // Validate type
    if (!['TEAM', 'COMPANY', 'ORGANIZATION', 'DEPARTMENT'].includes(type)) {
      res.status(400).json({ error: 'Invalid team type. Must be TEAM, COMPANY, ORGANIZATION, or DEPARTMENT' });
      return;
    }

    const teamData: CreateTeamData = {
      name,
      description,
      type,
      city,
      avatar,
    };

    const team = await teamService.createTeam(req.userId, teamData);
    res.status(201).json({ team });
  } catch (error) {
    logger.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
};

/**
 * Get team by ID or slug
 */
export const getTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.params;

    // Try to get by ID first, then by slug
    let team;
    if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      team = await teamService.getTeamById(identifier);
    } else {
      team = await teamService.getTeamBySlug(identifier);
    }

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    res.status(200).json({ team });
  } catch (error) {
    logger.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to get team' });
  }
};

/**
 * Update team
 */
export const updateTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { teamId } = req.params;
    const { name, description, type, city, avatar } = req.body;

    // Validate type if provided
    if (type && !['TEAM', 'COMPANY', 'ORGANIZATION', 'DEPARTMENT'].includes(type)) {
      res.status(400).json({ error: 'Invalid team type' });
      return;
    }

    const updateData: UpdateTeamData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (city !== undefined) updateData.city = city;
    if (avatar !== undefined) updateData.avatar = avatar;

    const team = await teamService.updateTeam(teamId, req.userId, updateData);
    res.status(200).json({ team });
  } catch (error) {
    logger.error('Update team error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('Only team owner')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Failed to update team' });
    }
  }
};

/**
 * Delete team
 */
export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { teamId } = req.params;
    const result = await teamService.deleteTeam(teamId, req.userId);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Delete team error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('Only team owner')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Failed to delete team' });
    }
  }
};

/**
 * Search/list teams
 */
export const searchTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, city, search, page, limit } = req.query;

    const filters: TeamSearchFilters = {
      type: type as any,
      city: city as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    };

    const result = await teamService.searchTeams(filters);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Search teams error:', error);
    res.status(500).json({ error: 'Failed to search teams' });
  }
};

/**
 * Get user's teams
 */
export const getMyTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const teams = await teamService.getUserTeams(req.userId);
    res.status(200).json({ teams });
  } catch (error) {
    logger.error('Get my teams error:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
};

/**
 * Get team members
 */
export const getTeamMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const members = await teamService.getTeamMembers(teamId);
    res.status(200).json({ members });
  } catch (error) {
    logger.error('Get team members error:', error);
    res.status(500).json({ error: 'Failed to get team members' });
  }
};

/**
 * Add team member
 */
export const addTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { teamId } = req.params;
    const { userId, role } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Validate role if provided
    if (role && !['OWNER', 'ADMIN', 'MEMBER'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be OWNER, ADMIN, or MEMBER' });
      return;
    }

    const member = await teamService.addTeamMember(
      teamId,
      req.userId,
      userId,
      role as MemberRole || 'MEMBER'
    );

    res.status(201).json(member);
  } catch (error) {
    logger.error('Add team member error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already a team member')) {
        res.status(409).json({ error: error.message });
      } else if (error.message.includes('Only team')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Failed to add team member' });
    }
  }
};

/**
 * Remove team member
 */
export const removeTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { teamId, userId } = req.params;
    const result = await teamService.removeTeamMember(teamId, req.userId, userId);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Remove team member error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('Only team') || error.message.includes('Cannot remove')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Failed to remove team member' });
    }
  }
};

/**
 * Update member role
 */
export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { teamId, userId } = req.params;
    const { role } = req.body;

    if (!role || !['OWNER', 'ADMIN', 'MEMBER'].includes(role)) {
      res.status(400).json({ error: 'Valid role is required (OWNER, ADMIN, or MEMBER)' });
      return;
    }

    const member = await teamService.updateMemberRole(teamId, req.userId, userId, role as MemberRole);
    res.status(200).json({ member });
  } catch (error) {
    logger.error('Update member role error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('Only team owner') || error.message.includes('Cannot change')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Failed to update member role' });
    }
  }
};

/**
 * Leave team
 */
export const leaveTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { teamId } = req.params;
    const result = await teamService.leaveTeam(teamId, req.userId);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Leave team error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('owner cannot leave')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Failed to leave team' });
    }
  }
};

/**
 * Create sub-team
 */
export const createSubTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { teamId } = req.params;
    const { name, description, subTeamCategory, avatar } = req.body;

    if (!name || !subTeamCategory) {
      res.status(400).json({ error: 'Team name and category are required' });
      return;
    }

    const teamData: CreateTeamData = {
      name,
      description,
      type: 'DEPARTMENT',
      subTeamCategory,
      avatar,
      parentTeamId: teamId,
    };

    const team = await teamService.createTeam(req.userId, teamData);
    res.status(201).json({ team });
  } catch (error) {
    logger.error('Create sub-team error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create sub-team' });
    }
  }
};

/**
 * Get sub-teams
 */
export const getSubTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;

    const subTeams = await teamService.getSubTeams(teamId);
    res.status(200).json({ subTeams });
  } catch (error) {
    logger.error('Get sub-teams error:', error);
    res.status(500).json({ error: 'Failed to get sub-teams' });
  }
};

/**
 * Get suggested members for a team
 */
export const getSuggestedMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { teamId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const suggestions = await teamService.getSuggestedMembers(teamId, req.userId, limit);
    res.status(200).json({ suggestions });
  } catch (error) {
    logger.error('Get suggested members error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('Only team members')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Failed to get suggested members' });
    }
  }
};

/**
 * Invite member with auto-detection (email or username)
 * If email is provided and user doesn't exist, sends email invitation
 * If username is provided, adds user directly to team
 */
export const inviteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { teamId } = req.params;
    const { identifier, role, message } = req.body;

    if (!identifier) {
      res.status(400).json({ error: 'Email or username is required' });
      return;
    }

    // Validate role if provided
    if (role && !['ADMIN', 'MEMBER'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be ADMIN or MEMBER' });
      return;
    }

    const memberRole: MemberRole = role || 'MEMBER';

    // Auto-detect: Check if identifier is an email
    const isEmail = isValidEmailFormat(identifier);

    if (isEmail) {
      // Try to find user by email
      const user = await prisma.user.findUnique({
        where: { email: identifier },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (user) {
        // User exists with this email
        // Check if it's same company domain (add directly) or different (send invitation)
        const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: { 
            ownerId: true,
            members: {
              where: { role: { in: ['OWNER', 'ADMIN'] } },
              select: { user: { select: { email: true } } }
            }
          },
        });

        if (!team) {
          res.status(404).json({ error: 'Team not found' });
          return;
        }

        // Get team owner/admin emails to check domain
        const teamEmails = team.members.map(m => m.user.email);
        const teamDomains = teamEmails.map(email => email.split('@')[1]);
        const userDomain = user.email.split('@')[1];
        
        // If same company domain, add directly
        if (teamDomains.includes(userDomain)) {
          try {
            const member = await teamService.addTeamMember(
              teamId,
              req.userId,
              user.id,
              memberRole
            );

            res.status(201).json({
              type: 'direct',
              message: `${user.firstName} ${user.lastName} added to team (same company)`,
              member,
            });
            return;
          } catch (error) {
            if (error instanceof Error && error.message.includes('already a team member')) {
              res.status(409).json({ error: error.message });
              return;
            }
            throw error;
          }
        } else {
          // Different domain - send internal invitation
          const invitation = await invitationService.sendInvitation({
            senderId: req.userId,
            receiverId: user.id,
            teamId,
            role: memberRole,
            message,
          });

          res.status(201).json({
            type: 'internal_invitation',
            message: `Invitation sent to ${user.firstName} ${user.lastName}`,
            invitation: {
              id: invitation.id,
              status: invitation.status,
              expiresAt: invitation.expiresAt,
            },
          });
          return;
        }
      } else {
        // User doesn't exist - send email invitation
        // Validate company email
        const validation = await validateCompanyEmail(identifier, teamId);
        if (!validation.valid) {
          res.status(400).json({ error: validation.error });
          return;
        }

        const invitation = await emailInvitationService.sendEmailInvitation({
          teamId,
          email: identifier,
          role: memberRole,
          message,
          invitedBy: req.userId,
        });

        res.status(201).json({
          type: 'email_invitation',
          message: `Invitation sent to ${identifier}`,
          invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
          },
        });
        return;
      }
    } else {
      // It's a username - send internal invitation (not direct add)
      const user = await prisma.user.findUnique({
        where: { username: identifier },
        select: { id: true, firstName: true, lastName: true, username: true, email: true },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Send internal invitation
      const invitation = await invitationService.sendInvitation({
        senderId: req.userId,
        receiverId: user.id,
        teamId,
        role: memberRole,
        message,
      });

      res.status(201).json({
        type: 'internal_invitation',
        message: `Invitation sent to ${user.firstName} ${user.lastName}`,
        invitation: {
          id: invitation.id,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
        },
      });
    }
  } catch (error) {
    logger.error('Invite member error:', error);

    if (error instanceof Error) {
      if (error.message.includes('already a team member') || error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('Only team') || error.message.includes('permission')) {
        res.status(403).json({ error: error.message });
      } else if (error.message.includes('Failed to send')) {
        res.status(500).json({ error: 'Failed to send invitation email' });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Failed to invite member' });
    }
  }
};
