export type TeamType = 'COMPANY' | 'ORGANIZATION' | 'TEAM' | 'DEPARTMENT';
export type SubTeamCategory =
  | 'ENGINEERING'
  | 'MARKETING'
  | 'DESIGN'
  | 'HR'
  | 'SALES'
  | 'PRODUCT'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'LEGAL'
  | 'SUPPORT'
  | 'OTHER';
export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: TeamType;
  subTeamCategory?: SubTeamCategory;
  imageUrl?: string;
  avatar?: string;
  website?: string;
  city?: string;
  ownerId?: string;
  parentTeamId?: string;
  isMainTeam: boolean;
  memberCount: number;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    projects: number;
    subTeams?: number;
    jobPostings?: number;
  };
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
  subTeamCategory?: SubTeamCategory;
  imageUrl?: string;
  avatar?: string;
  website?: string;
  city?: string;
  parentTeamId?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  type?: TeamType;
  imageUrl?: string;
  avatar?: string;
  website?: string;
  city?: string;
}

export interface SearchTeamsFilters {
  type?: TeamType;
  city?: string;
  search?: string;
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
