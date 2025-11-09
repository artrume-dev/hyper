import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X, MapPin, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/Navigation';
import ProjectCard from '@/components/ProjectCard';
import { projectService } from '@/services/api/project.service';
import type { Project, SearchProjectsFilters } from '@/types/project';

export default function ProjectsPage() {
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState<SearchProjectsFilters>({
    workLocation: undefined,
    minBudget: undefined,
    maxBudget: undefined,
    startDateFrom: undefined,
    startDateTo: undefined,
    page: 1,
    limit: 12,
  });

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filterParams = {
        ...filters,
        page: currentPage,
      };

      let response;
      if (searchQuery.trim()) {
        response = await projectService.searchProjects(searchQuery, filterParams);
      } else {
        response = await projectService.getProjects(filterParams);
      }

      setProjects(response.projects);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters, currentPage]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadProjects();
  };

  const handleFilterChange = (key: keyof SearchProjectsFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      workLocation: undefined,
      minBudget: undefined,
      maxBudget: undefined,
      startDateFrom: undefined,
      startDateTo: undefined,
      page: 1,
      limit: 12,
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleProjectClick = (project: Project) => {
    // Navigate to project detail page (to be created)
    navigate(`/projects/${project.id}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.workLocation ||
    filters.minBudget ||
    filters.maxBudget ||
    filters.startDateFrom ||
    filters.startDateTo ||
    searchQuery.trim();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Browse Projects
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover exciting projects looking for talented professionals like you.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects by title, description..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                  aria-label="Search projects"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium whitespace-nowrap"
                aria-label="Search"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-4 rounded-xl border transition-all font-medium flex items-center gap-2 whitespace-nowrap ${
                  showFilters || hasActiveFilters
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white border-border hover:border-primary'
                }`}
                aria-label="Toggle filters"
                aria-expanded={showFilters}
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="bg-white text-primary rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                    !
                  </span>
                )}
              </button>
            </form>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white rounded-xl border border-border p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Filter Projects</h3>
                      {hasActiveFilters && (
                        <button
                          onClick={handleClearFilters}
                          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Location Filter */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location
                        </label>
                        <input
                          type="text"
                          value={filters.workLocation || ''}
                          onChange={(e) => handleFilterChange('workLocation', e.target.value)}
                          placeholder="City, Country, Remote..."
                          className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Min Budget */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Min Budget
                        </label>
                        <input
                          type="number"
                          value={filters.minBudget || ''}
                          onChange={(e) => handleFilterChange('minBudget', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Min amount"
                          min="0"
                          className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Max Budget */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Max Budget
                        </label>
                        <input
                          type="number"
                          value={filters.maxBudget || ''}
                          onChange={(e) => handleFilterChange('maxBudget', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Max amount"
                          min="0"
                          className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Start Date From */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Start Date From
                        </label>
                        <input
                          type="date"
                          value={filters.startDateFrom || ''}
                          onChange={(e) => handleFilterChange('startDateFrom', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Start Date To */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Start Date To
                        </label>
                        <input
                          type="date"
                          value={filters.startDateTo || ''}
                          onChange={(e) => handleFilterChange('startDateTo', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results Summary */}
          {!isLoading && (
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {total === 0 ? (
                  'No projects found'
                ) : (
                  <>
                    Showing {((currentPage - 1) * (filters.limit || 12)) + 1}-
                    {Math.min(currentPage * (filters.limit || 12), total)} of {total} projects
                  </>
                )}
              </p>
              <button
                onClick={loadProjects}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Refresh projects"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  !
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 mb-1">
                    Error Loading Projects
                  </h3>
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={loadProjects}
                    className="mt-3 text-sm text-red-700 hover:text-red-800 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-border overflow-hidden animate-pulse"
                >
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 border-t border-border">
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && projects.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? "We couldn't find any projects matching your criteria. Try adjusting your filters."
                  : 'No projects available at the moment. Check back soon!'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              )}
            </motion.div>
          )}

          {/* Projects Grid */}
          {!isLoading && !error && projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={handleProjectClick}
                />
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {!isLoading && !error && totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                Previous
              </button>

              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-lg border transition-colors ${
                          currentPage === page
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border bg-white hover:bg-gray-50'
                        }`}
                        aria-label={`Page ${page}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="w-10 h-10 flex items-center justify-center">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
