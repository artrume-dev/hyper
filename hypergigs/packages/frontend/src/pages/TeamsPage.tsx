import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, MapPin, RefreshCw, Building2, Folder, Users, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import { teamService } from '@/services/api/team.service';
import { Link } from 'react-router-dom';
import { stripHtmlTags } from '@/lib/utils';
import type { TeamType } from '@/types/team';

interface TeamData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: TeamType;
  city?: string;
  avatar?: string;
  owner: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  _count: {
    members: number;
    projects: number;
    jobPostings?: number;
  };
}

interface SearchFilters {
  type?: TeamType;
  city?: string;
}

export default function TeamsPage() {
  // State
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState<SearchFilters>({
    type: undefined,
    city: undefined,
  });

  // Load teams
  const loadTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await teamService.getTeams({
        search: searchQuery || undefined,
        type: filters.type,
        city: filters.city,
        limit: 50,
      });

      setTeams(result.teams as unknown as TeamData[]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load teams');
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTeams();
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      type: undefined,
      city: undefined,
    });
    setSearchQuery('');
  };

  const getTeamTypeIcon = (type: TeamType) => {
    switch (type) {
      case 'TEAM':
        return <Users className="w-4 h-4" />;
      case 'COMPANY':
        return <Building2 className="w-4 h-4" />;
      case 'ORGANIZATION':
        return <Folder className="w-4 h-4" />;
      case 'DEPARTMENT':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.type ||
    filters.city ||
    searchQuery.trim();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Discover Top Teams
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Browse through curated agencies and project teams ready to bring your ideas to life.
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
                  placeholder="Search teams by name or description..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                  aria-label="Search teams"
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
                      <h3 className="text-lg font-semibold">Filter Teams</h3>
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
                      {/* Team Type Filter */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Team Type
                        </label>
                        <select
                          value={filters.type || ''}
                          onChange={(e) => handleFilterChange('type', e.target.value as TeamType || undefined)}
                          className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">All Types</option>
                          <option value="TEAM">Teams</option>
                          <option value="COMPANY">Companies</option>
                          <option value="ORGANIZATION">Organizations</option>
                        </select>
                      </div>

                      {/* Location Filter */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location
                        </label>
                        <input
                          type="text"
                          value={filters.city || ''}
                          onChange={(e) => handleFilterChange('city', e.target.value)}
                          placeholder="City, Country..."
                          className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Quick Type Buttons */}
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm font-medium mb-3">Quick Filters:</p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleFilterChange('type', undefined)}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            !filters.type
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-white border-border hover:border-primary'
                          }`}
                        >
                          All Teams
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFilterChange('type', 'TEAM')}
                          className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                            filters.type === 'TEAM'
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-white border-border hover:border-primary'
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          Teams
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFilterChange('type', 'COMPANY')}
                          className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                            filters.type === 'COMPANY'
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-white border-border hover:border-primary'
                          }`}
                        >
                          <Building2 className="w-4 h-4" />
                          Companies
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFilterChange('type', 'ORGANIZATION')}
                          className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                            filters.type === 'ORGANIZATION'
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-white border-border hover:border-primary'
                          }`}
                        >
                          <Folder className="w-4 h-4" />
                          Organizations
                        </button>
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
                {teams.length === 0
                  ? 'No teams found'
                  : `Showing ${teams.length} team${teams.length !== 1 ? 's' : ''}`}
              </p>
              <button
                onClick={loadTeams}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Refresh teams"
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
                    Error Loading Teams
                  </h3>
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={loadTeams}
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
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && teams.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No teams found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? "We couldn't find any teams matching your criteria. Try adjusting your filters."
                  : 'No teams available at the moment. Check back soon!'}
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

          {/* Teams Grid */}
          {!isLoading && !error && teams.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {teams.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * Math.min(index, 10) }}
                >
                  <Card className="h-full border-border/40 bg-card/50 backdrop-blur">
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-4">
                        {team.avatar ? (
                          <img
                            src={team.avatar}
                            alt={team.name}
                            className="w-12 h-12 rounded-lg object-cover border border-border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-foreground text-lg font-bold border border-border">
                            {getInitials(team.name)}
                          </div>
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {team.name}
                          </CardTitle>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {getTeamTypeIcon(team.type)}
                            <span>{team.type}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {team.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {stripHtmlTags(team.description)}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {team.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{team.city}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{team._count.members}</span>
                          <span>members</span>
                        </div>
                        {team._count.projects > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{team._count.projects}</span>
                            <span>projects</span>
                          </div>
                        )}
                        {team._count.jobPostings !== undefined && team._count.jobPostings > 0 && (
                          <Link
                            to={`/teams/${team.slug}/jobs`}
                            className="flex items-center gap-1 text-primary hover:underline font-medium"
                          >
                            <Briefcase className="w-4 h-4" />
                            <span>{team._count.jobPostings} {team._count.jobPostings === 1 ? 'job' : 'jobs'}</span>
                          </Link>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="flex gap-2">
                      <Link
                        to={`/teams/${team.slug}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                      >
                        View Team
                      </Link>
                      {team._count.jobPostings !== undefined && team._count.jobPostings > 0 && (
                        <Link
                          to={`/teams/${team.slug}/jobs`}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                        >
                          <Briefcase className="w-4 h-4" />
                          Jobs
                        </Link>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
