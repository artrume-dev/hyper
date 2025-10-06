import { Request, Response } from 'express';
import { teamService, CreateTeamData, UpdateTeamData, TeamSearchFilters, MemberRole } from '../services/team.service.js';
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
    if (!['PROJECT', 'AGENCY', 'STARTUP'].includes(type)) {
      res.status(400).json({ error: 'Invalid team type. Must be PROJECT, AGENCY, or STARTUP' });
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
    res.status(201).json(team);
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

    res.status(200).json(team);
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
    if (type && !['PROJECT', 'AGENCY', 'STARTUP'].includes(type)) {
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
    res.status(200).json(team);
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
    res.status(200).json(teams);
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
    res.status(200).json(members);
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
    res.status(200).json(member);
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
