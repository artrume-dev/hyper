import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Search, ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Navigation from '@/components/Navigation';
import JobPostingCard from '@/components/JobPostingCard';
import JobPostingDialog from '@/components/JobPostingDialog';
import { CitySearchInput } from '@/components/ui/city-search-input';
import { jobService } from '@/services/api/job.service';
import { teamService } from '@/services/api/team.service';
import { useAuthStore } from '@/stores/authStore';
import type { JobPosting, JobType } from '@/types/job';
import type { Team } from '@/types/team';
import { JOB_TYPE_LABELS } from '@/types/job';

interface TeamWithMembers extends Team {
  members?: Array<{
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
  }>;
}

export default function TeamJobsPage() {
  const { teamSlug } = useParams<{ teamSlug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuthStore();

  const [team, setTeam] = useState<TeamWithMembers | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [jobType, setJobType] = useState<JobType | 'ALL'>(
    (searchParams.get('type') as JobType) || 'ALL'
  );
  const [selectedDepartment, setSelectedDepartment] = useState(
    searchParams.get('department') || 'ALL'
  );
  const [departments, setDepartments] = useState<Team[]>([]);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | undefined>(undefined);

  // Load team and its sub-teams
  useEffect(() => {
    if (teamSlug) {
      loadTeamData();
    }
  }, [teamSlug]);

  const loadTeamData = async () => {
    if (!teamSlug) return;

    try {
      const teamData = await teamService.getTeam(teamSlug);
      setTeam(teamData);

      // Load sub-teams for department filtering
      if (teamData.id) {
        try {
          const subTeams = await teamService.getSubTeams(teamData.id);
          setDepartments(subTeams || []);
        } catch (error) {
          console.error('Failed to load sub-teams:', error);
          setDepartments([]);
        }
      }
    } catch (error) {
      console.error('Failed to load team:', error);
      navigate('/teams');
    }
  };

  useEffect(() => {
    if (team?.id) {
      fetchJobs();
    }
  }, [team?.id, searchTerm, location, jobType, selectedDepartment, page]);

  const fetchJobs = async () => {
    if (!team?.id) return;

    setLoading(true);
    try {
      const filters: any = {
        page,
        limit: 20,
      };

      if (searchTerm) filters.search = searchTerm;
      if (location) filters.location = location;
      if (jobType && jobType !== 'ALL') filters.type = jobType;
      if (selectedDepartment && selectedDepartment !== 'ALL') {
        filters.subTeamId = selectedDepartment;
      }

      // Get jobs for this specific team
      const data = await jobService.getActiveJobs({
        ...filters,
        teamId: team.id, // Filter by team
      });

      setJobs(data.jobs);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);

      // Update URL
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (location) params.set('location', location);
      if (jobType && jobType !== 'ALL') params.set('type', jobType);
      if (selectedDepartment && selectedDepartment !== 'ALL') params.set('department', selectedDepartment);
      if (page > 1) params.set('page', page.toString());
      setSearchParams(params);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setJobType('ALL');
    setSelectedDepartment('ALL');
    setPage(1);
  };

  const hasFilters = searchTerm || location || (jobType && jobType !== 'ALL') || (selectedDepartment && selectedDepartment !== 'ALL');

  // Check if user can manage jobs
  const isOwner = team?.ownerId === currentUser?.id;
  const isAdmin = team?.members?.find(
    (member) => member.userId === currentUser?.id
  )?.role === 'ADMIN';
  const canManageJobs = team?.isMainTeam && (isOwner || isAdmin);

  const handleEditJob = (job: JobPosting) => {
    setSelectedJob(job);
    setShowJobDialog(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;

    try {
      await jobService.deleteJob(jobId);
      fetchJobs(); // Reload jobs
    } catch (err: any) {
      console.error('Failed to delete job:', err);
      alert('Failed to delete job. Please try again.');
    }
  };

  const handleJobDialogClose = () => {
    setShowJobDialog(false);
    setSelectedJob(undefined);
  };

  if (loading && !team) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 pb-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 pb-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h3 className="text-lg font-medium mb-4">Team not found</h3>
            <Button onClick={() => navigate('/teams')}>Back to Teams</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(`/teams/${teamSlug}`)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Team
            </Button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              {team.avatar ? (
                <img
                  src={team.avatar}
                  alt={team.name}
                  className="w-16 h-16 rounded-lg object-cover border border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border border-border">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold mb-1">{team.name} - Jobs</h1>
                <p className="text-muted-foreground">
                  {total} {total === 1 ? 'job opening' : 'job openings'}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-4">
            {/* Department & Type Filters - Top Row */}
            {departments.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Department Filter */}
                <div className="flex-1">
                  <Select
                    value={selectedDepartment}
                    onValueChange={(value) => {
                      setSelectedDepartment(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full h-12 text-base">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Job Type Filter */}
                <div className="flex-1">
                  <Select
                    value={jobType}
                    onValueChange={(value) => {
                      setJobType(value as JobType | 'ALL');
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full h-12 text-base">
                      <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Job Types</SelectItem>
                      {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-md border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex-1">
                <CitySearchInput
                  value={location}
                  onChange={(value) => setLocation(value)}
                  placeholder="Location"
                  className="h-12"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </form>

            {/* Clear Filters */}
            {hasFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" onClick={clearFilters} size="sm">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>

          {/* Job Listings */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg">Loading jobs...</div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? 'Try adjusting your filters to see more results.'
                  : `${team.name} doesn't have any active job openings at the moment.`}
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobPostingCard
                    key={job.id}
                    job={job}
                    canManage={canManageJobs}
                    onEdit={() => handleEditJob(job)}
                    onDelete={() => handleDeleteJob(job.id)}
                    onView={() => navigate(`/jobs/${job.id}`)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= page - 2 && p <= page + 2)
                      )
                      .map((p, i, arr) => (
                        <>
                          {i > 0 && arr[i - 1] !== p - 1 && (
                            <span key={`ellipsis-${p}`} className="px-2">
                              ...
                            </span>
                          )}
                          <Button
                            key={p}
                            variant={page === p ? 'default' : 'outline'}
                            onClick={() => setPage(p)}
                            size="sm"
                          >
                            {p}
                          </Button>
                        </>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Job Posting Dialog */}
      {team && (
        <JobPostingDialog
          open={showJobDialog}
          onOpenChange={handleJobDialogClose}
          teamId={team.id}
          teamName={team.name}
          job={selectedJob}
          onSuccess={() => {
            fetchJobs(); // Reload jobs after edit
          }}
        />
      )}
    </div>
  );
}
