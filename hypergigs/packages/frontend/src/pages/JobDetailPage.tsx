import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ApplicationDialog from '@/components/ApplicationDialog';
import { jobService } from '@/services/api/job.service';
import { applicationService } from '@/services/api/application.service';
import { useAuthStore } from '@/stores/authStore';
import type { JobPosting } from '@/types/job';
import { JOB_TYPE_LABELS, JOB_STATUS_LABELS } from '@/types/job';
import { formatDistanceToNow } from 'date-fns';

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthStore();

  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJob();
      if (isAuthenticated) {
        checkApplicationStatus();
      }
    }
  }, [jobId, isAuthenticated]);

  const fetchJob = async () => {
    if (!jobId) return;

    setLoading(true);
    try {
      const data = await jobService.getJob(jobId);
      setJob(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load job details',
        variant: 'destructive',
      });
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!jobId) return;

    setCheckingApplication(true);
    try {
      const { hasApplied: applied } = await applicationService.checkIfApplied(jobId);
      setHasApplied(applied);
    } catch (error) {
      // Silently fail - user might not be authenticated
      console.error('Failed to check application status:', error);
    } finally {
      setCheckingApplication(false);
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to apply for this job',
      });
      navigate('/login', { state: { from: `/jobs/${jobId}` } });
      return;
    }

    setShowApplicationDialog(true);
  };

  const handleApplicationSuccess = () => {
    setHasApplied(true);
    toast({
      title: 'Application submitted!',
      description: 'Your application has been sent to the team',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const formatSalary = () => {
    if (!job.minSalary && !job.maxSalary) return null;

    const currency = job.currency || 'USD';
    const formatNumber = (num: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);

    if (job.minSalary && job.maxSalary) {
      return `${formatNumber(job.minSalary)} - ${formatNumber(job.maxSalary)}`;
    } else if (job.minSalary) {
      return `From ${formatNumber(job.minSalary)}`;
    } else if (job.maxSalary) {
      return `Up to ${formatNumber(job.maxSalary)}`;
    }
  };

  const salary = formatSalary();
  const timeAgo = formatDistanceToNow(new Date(job.createdAt), { addSuffix: true });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Main Job Card */}
          <Card className="mb-6">
            <CardContent className="p-8">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-3">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                      {JOB_STATUS_LABELS[job.status]}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                      {JOB_TYPE_LABELS[job.type]}
                    </Badge>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="flex flex-col items-end gap-2">
                  {job.createdBy === user?.id ? (
                    <Button disabled className="min-w-[150px]">
                      Your Job Posting
                    </Button>
                  ) : hasApplied ? (
                    <Button disabled className="min-w-[150px]">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Applied
                    </Button>
                  ) : job.status === 'ACTIVE' ? (
                    <Button
                      onClick={handleApplyClick}
                      disabled={checkingApplication}
                      className="min-w-[150px]"
                    >
                      Apply Now
                    </Button>
                  ) : (
                    <Button disabled className="min-w-[150px]">
                      Not Accepting Applications
                    </Button>
                  )}
                </div>
              </div>

              {/* Team Info */}
              {job.team && (
                <div className="space-y-4 mb-6">
                  <Link
                    to={`/teams/${job.team.slug}`}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {job.team.avatar ? (
                      <img
                        src={job.team.avatar}
                        alt={job.team.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{job.team.name}</h3>
                      {job.team.city && (
                        <p className="text-sm text-muted-foreground">{job.team.city}</p>
                      )}
                      {job.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{job.location}</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Message Job Poster */}
                  {job.creator && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Message job poster:</span>
                      <Link
                        to={`/profile/${job.creator.username}`}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        {job.creator.avatar ? (
                          <img
                            src={job.creator.avatar}
                            alt={`${job.creator.firstName} ${job.creator.lastName}`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {job.creator.firstName?.[0]}
                            {job.creator.lastName?.[0]}
                          </div>
                        )}
                        <span className="text-sm font-medium hover:text-primary">
                          {job.creator.firstName} {job.creator.lastName}
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {job.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span>{job.location}</span>
                  </div>
                )}
                {salary && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <span>{salary}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>Posted {timeAgo}</span>
                </div>
              </div>

              {/* Job Description */}
              <div className="prose max-w-none">
                <h2 className="text-xl font-semibold mb-3">About the Role</h2>
                <div
                  className="text-sm text-muted-foreground prose prose-sm"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Actions */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => navigate('/jobs')}>
              Browse More Jobs
            </Button>
            {!hasApplied && job.status === 'ACTIVE' && job.createdBy !== user?.id && (
              <Button onClick={handleApplyClick} size="lg">
                Apply for this Position
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Application Dialog */}
      {job && (
        <ApplicationDialog
          open={showApplicationDialog}
          onOpenChange={setShowApplicationDialog}
          job={job}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
}
