import type { User } from './auth';

export interface Skill {
  id: string;
  name: string;
  level?: string;
  userId: string;
  createdAt: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  tags?: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  skills?: Skill[];
  portfolio?: PortfolioItem[];
  experience?: WorkExperience[];
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  hourlyRate?: number;
  available?: boolean;
}

export interface AddSkillRequest {
  name: string;
  level?: string;
}

export interface CreatePortfolioRequest {
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface UpdatePortfolioRequest {
  title?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface CreateExperienceRequest {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface UpdateExperienceRequest {
  title?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
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
