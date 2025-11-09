import api from '@/lib/axios';
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  SearchProjectsFilters,
  PaginatedProjects,
} from '@/types/project';

export const projectService = {
  /**
   * Get all projects with optional filters
   */
  async getProjects(filters?: SearchProjectsFilters): Promise<PaginatedProjects> {
    const response = await api.get<PaginatedProjects>('/api/projects', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    const response = await api.get<{ project: Project }>(`/api/projects/${projectId}`);
    return response.data.project;
  },

  /**
   * Search projects by query
   */
  async searchProjects(query: string, filters?: SearchProjectsFilters): Promise<PaginatedProjects> {
    const response = await api.get<PaginatedProjects>('/api/projects/search', {
      params: { query, ...filters },
    });
    return response.data;
  },

  /**
   * Create new project (requires authentication)
   */
  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await api.post<{ project: Project }>('/api/projects', data);
    return response.data.project;
  },

  /**
   * Update project (requires authentication and ownership)
   */
  async updateProject(projectId: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await api.put<{ project: Project }>(
      `/api/projects/${projectId}`,
      data
    );
    return response.data.project;
  },

  /**
   * Delete project (requires authentication and ownership)
   */
  async deleteProject(projectId: string): Promise<void> {
    await api.delete(`/api/projects/${projectId}`);
  },

  /**
   * Get projects by team
   */
  async getProjectsByTeam(teamId: string): Promise<Project[]> {
    const response = await api.get<{ projects: Project[] }>(`/api/teams/${teamId}/projects`);
    return response.data.projects;
  },
};
