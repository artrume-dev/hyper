import type { Team } from './team';

export interface Project {
  id: string;
  title: string;
  description: string;
  workLocation?: string;
  startDate?: string;
  duration?: number; // in days
  minCost?: number;
  maxCost?: number;
  currency?: string;
  teamId: string;
  team?: Team;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  workLocation?: string;
  startDate?: string;
  duration?: number;
  minCost?: number;
  maxCost?: number;
  currency?: string;
  teamId: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  workLocation?: string;
  startDate?: string;
  duration?: number;
  minCost?: number;
  maxCost?: number;
  currency?: string;
}

export interface SearchProjectsFilters {
  workLocation?: string;
  minBudget?: number;
  maxBudget?: number;
  startDateFrom?: string;
  startDateTo?: string;
  teamId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedProjects {
  projects: Project[];
  total: number;
  page: number;
  totalPages: number;
}
