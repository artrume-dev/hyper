import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useState, useEffect } from 'react';
import { userService } from '@/services/api/user.service';
import type { UserProfile } from '@/types/user';
import { Link } from 'react-router-dom';

export default function FreelancersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [freelancers, setFreelancers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFreelancers();
  }, []);

  const loadFreelancers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Empty search to get all freelancers
      const result = await userService.searchUsers('', {
        role: 'FREELANCER',
        // Show all freelancers regardless of availability
      });
      setFreelancers(result.users);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load freelancers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      loadFreelancers();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await userService.searchUsers(searchQuery, {
        role: 'FREELANCER',
      });
      setFreelancers(result.users);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string | null) => {
    return `${firstName[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Find Top Talent
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Connect with verified freelancers and specialists from around the world.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by name, skill, or expertise..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                variant="outline" 
                className="md:w-auto"
                onClick={handleSearch}
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-lg">Loading freelancers...</div>
            </div>
          ) : freelancers.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No freelancers found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or check back later
              </p>
            </div>
          ) : (
            <>
              {/* Freelancers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {freelancers.map((freelancer, index) => (
                  <motion.div
                    key={freelancer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * Math.min(index, 5) }}
                  >
                    <Card className="h-full border-border/40 bg-card/50 backdrop-blur">
                      <CardHeader className="text-center pb-4">
                        {/* Avatar */}
                        <div className="mb-4 flex justify-center">
                          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-foreground text-xl font-bold border border-border">
                            {getInitials(freelancer.firstName, freelancer.lastName)}
                          </div>
                        </div>
                        
                        {/* Name & Username */}
                        <h3 className="text-xl font-bold">
                          {freelancer.firstName} {freelancer.lastName || ''}
                        </h3>
                        <p className="text-sm text-muted-foreground">@{freelancer.username}</p>
                        
                        {/* Availability Badge */}
                        {freelancer.available && (
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-foreground text-xs font-medium mt-2 border border-border">
                            <div className="w-2 h-2 rounded-full bg-foreground" />
                            Available
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Bio */}
                        {freelancer.bio && (
                          <p className="text-sm text-muted-foreground text-center line-clamp-2">
                            {freelancer.bio}
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
                        <Button className="flex-1">
                          Invite
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
