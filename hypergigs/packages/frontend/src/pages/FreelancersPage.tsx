import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, MapPin, DollarSign, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import InvitationDialog from '@/components/InvitationDialog';
import { userService } from '@/services/api/user.service';
import type { UserProfile } from '@/types/user';
import { Link } from 'react-router-dom';
import { stripHtmlTags } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface SearchFilters {
  location?: string;
  minRate?: number;
  maxRate?: number;
  available?: boolean;
  skills?: string;
}

export default function FreelancersPage() {
  const { user: currentUser } = useAuthStore();

  // State
  const [freelancers, setFreelancers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState<SearchFilters>({
    location: undefined,
    minRate: undefined,
    maxRate: undefined,
    available: undefined,
    skills: undefined,
  });

  // Invitation dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Load freelancers
  const loadFreelancers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await userService.searchUsers(searchQuery, {
        role: 'FREELANCER',
        location: filters.location,
        minRate: filters.minRate,
        maxRate: filters.maxRate,
        available: filters.available,
        skills: filters.skills,
      });

      setFreelancers(result.users);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load freelancers');
      setFreelancers([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters]);

  useEffect(() => {
    loadFreelancers();
  }, [loadFreelancers]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFreelancers();
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      location: undefined,
      minRate: undefined,
      maxRate: undefined,
      available: undefined,
      skills: undefined,
    });
    setSearchQuery('');
  };

  const handleInviteClick = (freelancer: UserProfile) => {
    setSelectedFreelancer({
      id: freelancer.id,
      name: `${freelancer.firstName} ${freelancer.lastName || ''}`.trim(),
    });
    setInviteDialogOpen(true);
  };

  const getInitials = (firstName: string, lastName: string | null) => {
    return `${firstName[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.location ||
    filters.minRate ||
    filters.maxRate ||
    filters.available !== undefined ||
    filters.skills ||
    searchQuery.trim();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Find Top Talent
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Connect with verified freelancers and specialists from around the world.
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
                  placeholder="Search by name, skill, or expertise..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                  aria-label="Search freelancers"
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
                      <h3 className="text-lg font-semibold">Filter Freelancers</h3>
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
                          value={filters.location || ''}
                          onChange={(e) => handleFilterChange('location', e.target.value)}
                          placeholder="City, Country, Remote..."
                          className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Min Hourly Rate */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Min Hourly Rate
                        </label>
                        <input
                          type="number"
                          value={filters.minRate || ''}
                          onChange={(e) => handleFilterChange('minRate', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Min rate"
                          min="0"
                          className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Max Hourly Rate */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Max Hourly Rate
                        </label>
                        <input
                          type="number"
                          value={filters.maxRate || ''}
                          onChange={(e) => handleFilterChange('maxRate', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Max rate"
                          min="0"
                          className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Skills Filter */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Skills
                        </label>
                        <input
                          type="text"
                          value={filters.skills || ''}
                          onChange={(e) => handleFilterChange('skills', e.target.value)}
                          placeholder="e.g., React, Node.js"
                          className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Availability Filter */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Availability
                        </label>
                        <select
                          value={filters.available === undefined ? '' : filters.available ? 'true' : 'false'}
                          onChange={(e) => handleFilterChange('available', e.target.value === '' ? undefined : e.target.value === 'true')}
                          className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">All</option>
                          <option value="true">Available Now</option>
                          <option value="false">Not Available</option>
                        </select>
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
                {freelancers.length === 0
                  ? 'No freelancers found'
                  : `Showing ${freelancers.length} freelancer${freelancers.length !== 1 ? 's' : ''}`}
              </p>
              <button
                onClick={loadFreelancers}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Refresh freelancers"
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
                    Error Loading Freelancers
                  </h3>
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={loadFreelancers}
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
                    <div className="flex justify-center">
                      <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
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
          {!isLoading && !error && freelancers.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No freelancers found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? "We couldn't find any freelancers matching your criteria. Try adjusting your filters."
                  : 'No freelancers available at the moment. Check back soon!'}
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

          {/* Freelancers Grid */}
          {!isLoading && !error && freelancers.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {freelancers.map((freelancer, index) => (
                <motion.div
                  key={freelancer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * Math.min(index, 10) }}
                >
                  <Card className="h-full border-border/40 bg-card/50 backdrop-blur">
                    <CardHeader className="text-center pb-4">
                      {/* Avatar */}
                      <div className="mb-4 flex justify-center">
                        {freelancer.avatar ? (
                          <img
                            src={freelancer.avatar}
                            alt={`${freelancer.firstName} ${freelancer.lastName || ''}`}
                            className="w-20 h-20 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-foreground text-xl font-bold border border-border">
                            {getInitials(freelancer.firstName, freelancer.lastName)}
                          </div>
                        )}
                      </div>

                      {/* Name & Username */}
                      <div className="flex items-center justify-center gap-2">
                        <h3 className="text-xl font-bold">
                          {freelancer.firstName} {freelancer.lastName || ''}
                        </h3>
                        {freelancer.hasVerifiedBadge && (
                          <div className="relative group">
                            <div className="flex items-center justify-center w-5 h-5 bg-blue-600 rounded-full">
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              Verified
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{freelancer.username}</p>
                      
                      {/* Job Title */}
                      {freelancer.jobTitle && (
                        <p className="text-sm text-foreground font-medium mt-1">
                          {freelancer.jobTitle}
                        </p>
                      )}

                      {/* Availability Badge */}
                      {freelancer.available ? (
                        <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Available</span>
                        </div>
                      ) : freelancer.nextAvailability ? (
                        <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-2">
                          <span>
                            Available {new Date(freelancer.nextAvailability).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      ) : null}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Bio */}
                      {freelancer.bio && (
                        <p className="text-sm text-muted-foreground text-center line-clamp-2">
                          {stripHtmlTags(freelancer.bio)}
                        </p>
                      )}

                      {/* Location */}
                      {freelancer.location && (
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{freelancer.location}</span>
                        </div>
                      )}

                      {/* Hourly Rate */}
                      {freelancer.hourlyRate && freelancer.hourlyRate > 0 && (
                        <div className="text-center">
                          <span className="text-lg font-bold text-foreground">
                            ${freelancer.hourlyRate}/hr
                          </span>
                        </div>
                      )}

                      {/* Skills */}
                      {freelancer.skills && freelancer.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {freelancer.skills.slice(0, 3).map((userSkill) => (
                            <span
                              key={userSkill.id}
                              className="px-3 py-1 rounded-full bg-muted text-foreground text-xs font-medium border border-border"
                            >
                              {userSkill.skill?.name || 'Skill'}
                            </span>
                          ))}
                          {freelancer.skills.length > 3 && (
                            <span className="px-3 py-1 rounded-full bg-muted text-foreground text-xs font-medium border border-border">
                              +{freelancer.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="flex gap-2">
                      <Link
                        to={`/profile/${freelancer.username}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                      >
                        View Profile
                      </Link>
                      {currentUser?.id !== freelancer.id && (
                        <Button
                          className="flex-1"
                          onClick={() => handleInviteClick(freelancer)}
                        >
                          Collaborate
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Invitation Dialog */}
      {selectedFreelancer && (
        <InvitationDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          recipientId={selectedFreelancer.id}
          recipientName={selectedFreelancer.name}
        />
      )}
    </div>
  );
}
