import type { User } from './auth';

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

export interface PortfolioItem {
  id: string;
  name: string;
  description?: string;
  companyName?: string;
  role?: string;
  workUrls?: string;
  mediaFiles?: string[]; // Array of image URLs
  userId: string;
  createdAt: string;
  updatedAt: string;
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
  bio?: string;
  location?: string;
  hourlyRate?: number;
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
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
  companyName?: string;
  role?: string;
  workUrls?: string;
  mediaFiles?: string[]; // Array of base64 or URLs
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
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}
