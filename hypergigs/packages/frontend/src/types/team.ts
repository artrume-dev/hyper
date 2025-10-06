export type TeamType = 'PROJECT' | 'AGENCY' | 'STARTUP';
export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: TeamType;
  imageUrl?: string;
  website?: string;
  city?: string;
  memberCount: number;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  joinedAt: string;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface TeamWithRole extends Team {
  role: TeamRole;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  type: TeamType;
  imageUrl?: string;
  website?: string;
  city?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  type?: TeamType;
  imageUrl?: string;
  website?: string;
  city?: string;
}

export interface SearchTeamsFilters {
  type?: TeamType;
  city?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTeams {
  teams: Team[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AddMemberRequest {
  userId: string;
  role: TeamRole;
}

export interface UpdateMemberRoleRequest {
  role: TeamRole;
}
