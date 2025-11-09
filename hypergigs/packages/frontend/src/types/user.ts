import type { User, Currency } from './auth';

export interface Skill {
  id: string;
  name: string;
  category?: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  skill: Skill;
}

export interface PortfolioContributor {
  id: string;
  portfolioId: string;
  userId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  addedBy: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    avatar: string | null;
    jobTitle: string | null;
  };
  portfolio?: {
    id: string;
    name: string;
    description?: string;
    companyName?: string;
    mediaFiles?: string;
  };
  addedByUser?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    avatar?: string | null;
  };
}

export interface ContributorSuggestion {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  avatar: string | null;
  jobTitle: string | null;
  sharedTeams: Array<{ id: string; name: string }>;
}

export interface PortfolioItem {
  id: string;
  name: string;
  description?: string;
  companyName?: string;
  role?: string;
  workUrls?: string;
  mediaFiles?: string[]; // Array of image URLs
  createdWith?: string[]; // Array of tools/methods used
  userId: string;
  createdAt: string;
  updatedAt: string;
  recommendations?: Recommendation[];
  contributors?: PortfolioContributor[];
  likeCount?: number; // Total likes (simple "Liked this work" recommendations)
  hasVerifiedReference?: boolean; // True if has accepted REQUEST type recommendation
  userHasLiked?: boolean; // True if current user has liked this portfolio
}

export interface Recommendation {
  id: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  type: 'REQUEST' | 'GIVEN';
  rating?: number; // 1-5 star rating for portfolio recommendations
  senderId: string;
  receiverId: string;
  portfolioId?: string;
  projectId?: string;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  receiver?: User;
  portfolio?: { id: string; name: string; description?: string };
  project?: { id: string; title: string; description: string };
  team?: { id: string; name: string; slug: string };
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  description?: string;
  startDate: string;
  endDate?: string;
  present: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  skills?: UserSkill[];
  portfolios?: PortfolioItem[];
  workExperiences?: WorkExperience[];
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  jobTitle?: string;
  location?: string;
  country?: string;
  hourlyRate?: number;
  currency?: Currency;
  available?: boolean;
  nextAvailability?: string;
  avatar?: string;
}

export interface AddSkillRequest {
  skillName: string;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
  companyName?: string;
  role?: string;
  workUrls?: string;
  mediaFiles?: string[]; // Array of base64 or URLs
  createdWith?: string[]; // Array of tools/methods used
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
  companyName?: string;
  role?: string;
  workUrls?: string;
  mediaFiles?: string[]; // Array of base64 or URLs
  createdWith?: string[]; // Array of tools/methods used
}

export interface CreateExperienceRequest {
  title: string;
  company: string;
  description?: string;
  startDate: string;
  endDate?: string;
  present: boolean;
}

export interface UpdateExperienceRequest {
  title?: string;
  company?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  present?: boolean;
}

export interface SearchUsersFilters {
  role?: string;
  location?: string;
  available?: boolean;
  minRate?: number;
  maxRate?: number;
  skills?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateRecommendationRequest {
  message: string;
  receiverId: string;
  type?: 'REQUEST' | 'GIVEN';
  rating?: number; // 1-5 star rating for portfolio recommendations
  portfolioId?: string;
  projectId?: string;
  teamId?: string;
}

export interface UpdateRecommendationRequest {
  status: 'ACCEPTED' | 'REJECTED';
}

export interface SharedProject {
  id: string;
  title: string;
  description: string;
  teamId: string;
  teamName: string;
}

export interface SharedTeam {
  id: string;
  name: string;
  slug: string;
  type: string;
  projects: SharedProject[];
}

export interface CollaborationContext {
  haveWorkedTogether: boolean;
  sharedTeamsCount: number;
  sharedProjectsCount: number;
  sharedTeams: SharedTeam[];
  sharedProjects: SharedProject[];
}
