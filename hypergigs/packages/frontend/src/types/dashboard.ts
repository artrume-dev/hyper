import type { TeamRole } from './team';
import type { Invitation } from './invitation';

/**
 * Message type for recent messages in dashboard
 */
export interface DashboardMessage {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
  team?: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * User dashboard statistics
 */
export interface UserDashboardStatistics {
  followersCount: number;
  followingCount: number;
  teamsCount: number;
  pendingInvitationsCount: number;
  portfolioCount: number;
  skillsCount: number;
  // Recommendation statistics
  pendingRequestsSent: number;
  pendingRequestsReceived: number;
  acceptedRecommendations: number;
  givenRecommendations: number;
}

/**
 * Recent team item with user role
 */
export interface DashboardTeam {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  type: string;
  createdAt: string;
  userRole: string;
  _count: {
    members: number;
    projects: number;
  };
}

/**
 * User dashboard response from API
 */
export interface UserDashboardData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatar?: string;
    role: string;
    bio?: string;
    location?: string;
    available: boolean;
    hourlyRate?: number;
  };
  statistics: UserDashboardStatistics;
  recentTeams: DashboardTeam[];
  recentInvitations: Invitation[];
  recentMessages: DashboardMessage[];
}

/**
 * Team dashboard statistics
 */
export interface TeamDashboardStatistics {
  membersCount: number;
  pendingInvitationsCount: number;
  projectsCount: number;
  createdAt: string;
}

/**
 * Project type for team dashboard
 */
export interface DashboardProject {
  id: string;
  title: string;
  description?: string;
  workLocation?: string;
  startDate?: string;
  duration?: string;
  minCost?: number;
  maxCost?: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Team member with user details
 */
export interface DashboardTeamMember {
  id: string;
  role: TeamRole;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatar?: string;
    role: string;
    location?: string;
    available: boolean;
    hourlyRate?: number;
  };
}

/**
 * Team dashboard response from API
 */
export interface TeamDashboardData {
  team: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    avatar?: string;
    type: string;
    city?: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
  };
  statistics: TeamDashboardStatistics;
  members: DashboardTeamMember[];
  recentInvitations: Invitation[];
  projects: DashboardProject[];
  userRole: string;
}

/**
 * API Response wrapper for user dashboard
 */
export interface UserDashboardResponse {
  success: true;
  data: UserDashboardData;
}

/**
 * API Response wrapper for team dashboard
 */
export interface TeamDashboardResponse {
  success: true;
  data: TeamDashboardData;
}
