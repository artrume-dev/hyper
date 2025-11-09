import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import JobPostingCard from '@/components/JobPostingCard';
import JobDetailOverlay from '@/components/JobDetailOverlay';
import { CitySearchInput } from '@/components/ui/city-search-input';
import { jobService } from '@/services/api/job.service';
import type { JobPosting, JobType } from '@/types/job';
import { JOB_TYPE_LABELS } from '@/types/job';
import { isToday, isYesterday, isWithinInterval, subDays } from 'date-fns';

export default function JobBoardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [jobType, setJobType] = useState<JobType | 'ALL'>(
    (searchParams.get('type') as JobType) || 'ALL'
  );
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    searchParams.get('jobId') || null
  );

  useEffect(() => {
    fetchJobs();
  }, [searchTerm, location, jobType, page]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page,
        limit: 20,
      };

      if (searchTerm) filters.search = searchTerm;
      if (location) filters.location = location;
      if (jobType && jobType !== 'ALL') filters.type = jobType;

      const data = await jobService.getActiveJobs(filters);
      setJobs(data.jobs);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);

      // Update URL
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (location) params.set('location', location);
      if (jobType && jobType !== 'ALL') params.set('type', jobType);
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
    fetchJobs();
  };

  const handleViewJob = (jobId: string) => {
    setSelectedJobId(jobId);
    const params = new URLSearchParams(searchParams);
    params.set('jobId', jobId);
    setSearchParams(params);
  };

  const handleCloseOverlay = () => {
    setSelectedJobId(null);
    const params = new URLSearchParams(searchParams);
    params.delete('jobId');
    setSearchParams(params);
  };

  const hasActiveFilters = searchTerm || location || jobType !== 'ALL';

  // Categorize jobs by date
  const categorizeJobsByDate = (jobs: JobPosting[]) => {
    const now = new Date();
    const yesterday = subDays(now, 1);
    const lastWeekStart = subDays(now, 7);

    return {
      today: jobs.filter((job) => isToday(new Date(job.createdAt))),
      yesterday: jobs.filter((job) => isYesterday(new Date(job.createdAt))),
      lastWeek: jobs.filter((job) => {
        const date = new Date(job.createdAt);
        return (
          !isToday(date) &&
          !isYesterday(date) &&
          isWithinInterval(date, { start: lastWeekStart, end: yesterday })
        );
      }),
      older: jobs.filter((job) => {
        const date = new Date(job.createdAt);
        return date < lastWeekStart;
      }),
    };
  };

  // Sort and separate jobs: Featured first, then by date
  const { sortedJobs, sponsored } = useMemo(() => {
    const sponsoredJobs = jobs.filter((job) => job.isSponsored);
    const regularJobs = jobs.filter((job) => !job.isSponsored);

    // Sort regular jobs: featured first, then newest
    const sorted = [...regularJobs].sort((a, b) => {
      // Featured jobs first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      // Then by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { sortedJobs: sorted, sponsored: sponsoredJobs };
  }, [jobs]);

  // Insert sponsored jobs every 5 positions
  const insertSponsoredJobs = (regularJobs: JobPosting[], sponsoredJobs: JobPosting[]) => {
    const result: JobPosting[] = [];
    let sponsoredIndex = 0;

    regularJobs.forEach((job, index) => {
      result.push(job);
      // Insert sponsored job after every 5 regular jobs
      if ((index + 1) % 5 === 0 && sponsoredIndex < sponsoredJobs.length) {
        result.push(sponsoredJobs[sponsoredIndex]);
        sponsoredIndex++;
      }
    });

    // Add any remaining sponsored jobs at the end
    while (sponsoredIndex < sponsoredJobs.length) {
      result.push(sponsoredJobs[sponsoredIndex]);
      sponsoredIndex++;
    }

    return result;
  };

  const displayJobs = useMemo(
    () => insertSponsoredJobs(sortedJobs, sponsored),
    [sortedJobs, sponsored]
  );

  const categorized = useMemo(() => categorizeJobsByDate(displayJobs), [displayJobs]);

  // Render job group by date category
  const renderJobGroup = (title: string, jobs: JobPosting[]) => {
    if (jobs.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-foreground/80 border-b pb-2">
          {title}
        </h2>
        <div className="space-y-3">
          {jobs.map((job) => {
            const variant = job.isFeatured ? 'featured' : job.isSponsored ? 'sponsored' : 'default';
            return <JobPostingCard key={job.id} job={job} variant={variant} onView={() => handleViewJob(job.id)} />;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navigation />

      <div className="mt-8 ">
        {/* Header */}
        <div className="max-w-[80%] mx-auto py-8 px-8 space-y-4 mb-8 bg-white rounded-lg">
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight mb-4">
            Find Your Next Opportunity
          </h1>
          <p className="text-md text-muted-foreground max-w-2xl">
            Browse <span className="font-semibold text-black">{total}</span> active job postings from top teams and companies worldwide.
          </p>


            {/* Search Bar */}
            <div className="space-y-4 mt-6 max-w-[100%] mx-auto bg-white rounded-lg border border-border p-4 shadow-sm">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search roles..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                    aria-label="Search jobs"
                  />
                </div>
                <div className="w-64">
                  <CitySearchInput
                    value={location}
                    onChange={(value) => setLocation(value)}
                    placeholder="Location..."
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium whitespace-nowrap"
                  aria-label="Search"
                >
                  Search
                </button>
              </form>
            </div>

        </div>

        {/* Two-Column Layout or Split View */}
        <div className={`max-w-[80%] mx-auto ${selectedJobId ? 'flex gap-0' : 'flex flex-col lg:flex-row gap-8'} bg-white p-6 rounded-lg`}>
          {/* Main Column - Jobs */}
          <div className={`${selectedJobId ? 'w-[30%] border-r border-slate-200 pr-4 overflow-y-auto h-[calc(100vh-200px)]' : 'flex-1 lg:max-w-4xl w-full'}`}>
            {/* Job Type Filter */}
            <div className="mb-6">
              <div className="max-w-xs">
                <Select
                  value={jobType}
                  onValueChange={(value) => {
                    setJobType(value as JobType | 'ALL');
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full h-12 text-base bg-white">
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



            {/* Results Summary */}
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {loading ? 'Loading...' : `${total} job${total !== 1 ? 's' : ''} found`}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setLocation('');
                    setJobType('ALL');
                    setPage(1);
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-40 bg-muted/50 animate-pulse rounded-lg" />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && jobs.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {hasActiveFilters
                    ? "We couldn't find any jobs matching your criteria. Try adjusting your filters."
                    : 'No job postings available at the moment. Check back soon!'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setLocation('');
                      setJobType('ALL');
                      setPage(1);
                    }}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* Job Listings Grouped by Date */}
            {!loading && jobs.length > 0 && (
              <>
                {renderJobGroup('Today', categorized.today)}
                {renderJobGroup('Yesterday', categorized.yesterday)}
                {renderJobGroup('Last Week', categorized.lastWeek)}
                {renderJobGroup('Older', categorized.older)}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        // Show first, last, current, and neighbors
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          Math.abs(pageNum - page) <= 1
                        ) {
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === page ? 'default' : 'outline'}
                              onClick={() => setPage(pageNum)}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        } else if (pageNum === page - 2 || pageNum === page + 2) {
                          return (
                            <span key={pageNum} className="px-2">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
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

          {/* Job Detail Overlay - 70% width */}
          {selectedJobId && (
            <div className="w-[70%] sticky top-20 h-[calc(100vh-100px)] overflow-hidden">
              <JobDetailOverlay jobId={selectedJobId} onClose={handleCloseOverlay} />
            </div>
          )}

          {/* Sidebar Column - Hide when overlay is open */}
          {!selectedJobId && (
            <aside className="w-full lg:max-w-md mx-auto space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Featured Companies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Featured companies will appear here soon. Stay tuned for exciting opportunities from top employers!
                </p>
              </CardContent>
            </Card>

            {/* Additional sidebar content */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Post a Job</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Looking to hire? Post your job listing and find the perfect candidate.
                </p>
                <Button className="w-full" onClick={() => navigate('/dashboard')}>
                  Post a Job
                </Button>
              </CardContent>
            </Card>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
