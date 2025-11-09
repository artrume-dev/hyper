import { prisma } from '../lib/prisma.js';

export interface SharedTeam {
  id: string;
  name: string;
  slug: string;
  type: string;
  projects: SharedProject[];
}

export interface SharedProject {
  id: string;
  title: string;
  description: string;
  teamId: string;
  teamName: string;
}

export class CollaborationService {
  /**
   * Find all teams that both users are members of
   */
  async getSharedTeams(userAId: string, userBId: string): Promise<SharedTeam[]> {
    // Get all teams where both users are members
    const userATeams = await prisma.teamMember.findMany({
      where: { userId: userAId },
      select: { teamId: true },
    });

    const userBTeams = await prisma.teamMember.findMany({
      where: { userId: userBId },
      select: { teamId: true },
    });

    // Find intersection
    const userATeamIds = new Set(userATeams.map(t => t.teamId));
    const sharedTeamIds = userBTeams
      .filter(t => userATeamIds.has(t.teamId))
      .map(t => t.teamId);

    if (sharedTeamIds.length === 0) {
      return [];
    }

    // Fetch full team details with projects
    const teams = await prisma.team.findMany({
      where: {
        id: { in: sharedTeamIds },
      },
      include: {
        projects: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return teams.map(team => ({
      id: team.id,
      name: team.name,
      slug: team.slug,
      type: team.type,
      projects: team.projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        teamId: team.id,
        teamName: team.name,
      })),
    }));
  }

  /**
   * Find all projects from shared teams
   */
  async getSharedProjects(userAId: string, userBId: string): Promise<SharedProject[]> {
    const sharedTeams = await this.getSharedTeams(userAId, userBId);

    const projects: SharedProject[] = [];
    for (const team of sharedTeams) {
      projects.push(...team.projects);
    }

    return projects;
  }

  /**
   * Check if two users have worked together (are on same team)
   */
  async haveWorkedTogether(userAId: string, userBId: string): Promise<boolean> {
    const sharedTeams = await this.getSharedTeams(userAId, userBId);
    return sharedTeams.length > 0;
  }

  /**
   * Get collaboration context between two users
   */
  async getCollaborationContext(userAId: string, userBId: string) {
    const sharedTeams = await this.getSharedTeams(userAId, userBId);
    const sharedProjects = await this.getSharedProjects(userAId, userBId);
    const haveWorkedTogether = sharedTeams.length > 0;

    return {
      haveWorkedTogether,
      sharedTeamsCount: sharedTeams.length,
      sharedProjectsCount: sharedProjects.length,
      sharedTeams,
      sharedProjects,
    };
  }
}

export const collaborationService = new CollaborationService();
