import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Briefcase,
  DollarSign,
  Edit,
  Trash2,
  Building2,
  Star,
  Zap,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { JobPosting } from '@/types/job';
import { JOB_TYPE_LABELS } from '@/types/job';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface JobPostingCardProps {
  job: JobPosting;
  variant?: 'default' | 'featured' | 'sponsored';
  canManage?: boolean; // Whether user can edit/delete
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export default function JobPostingCard({
  job,
  variant = 'default',
  canManage = false,
  onEdit,
  onDelete,
  onView,
}: JobPostingCardProps) {

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

  const getTypeColor = () => {
    switch (job.type) {
      case 'FULL_TIME':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PART_TIME':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'CONTRACT':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'FREELANCE':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const salary = formatSalary();
  const timeAgo = formatDistanceToNow(new Date(job.createdAt), { addSuffix: true });

  return (
    <Card
      className={cn(
        'bg-white rounded-lg border-0 border-b border-slate-200 hover:bg-slate-100/40 hover:border-slate-300 hover:rounded-lg transition-all duration-200 shadow-none relative'
      )}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Featured/Sponsored Badge - Top Left Corner */}
          {variant === 'featured' && (
            <Badge className="absolute top-3 right-3 text-black border-0 bg-white shadow-none pointer-events-none">
              <Star className="w-3 h-3 mr-1 fill-white" />
              Featured
            </Badge>
          )}
          {variant === 'sponsored' && (
            <Badge className="absolute top-3 right-3 bg-blue-500 text-white border-blue-600 pointer-events-none">
              <Zap className="w-3 h-3 mr-1" />
              Sponsored
            </Badge>
          )}

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Sub-team/Category Badge */}
              {job.subTeam && job.team && (
                <Link
                  to={`/teams/${job.team.slug}/jobs?department=${job.subTeam.id}`}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="hover:underline">{job.subTeam.name}</span>
                </Link>
              )}

              {/* Job Title */}
              <h3
                className="font-medium text-lg mb-4 truncate cursor-pointer hover:text-primary transition-colors"
                onClick={onView}
              >
                {job.title}
              </h3>

            {/* Job Type Badge */}
              
              {/* <div className="flex flex-wrap items-center gap-2 mb-3"> */}

               <div className="flex flex-wrap items-center gap-x-6 gap-y-6 mb-4 text-sm text-muted-foreground">

                <Badge variant="outline" className={getTypeColor()}>
                  {JOB_TYPE_LABELS[job.type]}
                </Badge>


                {/* Job Details */}

                  {job.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                  )}

                  {salary && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      <span>{salary}</span>
                    </div>
                  )}
                </div>
         

              {/* Job Description - One line truncated */}
              {/* {job.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                  {job.description}
                </p>
              )} */}

            </div>

            {/* Actions */}
            {canManage && (
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="sr-only">Edit job</span>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sr-only">Delete job</span>
                  </Button>
                )}
              </div>
            )}
          </div>


          {/* Footer: Team Info with Creator Profile */}
          {(job.team || onView) && (
            <div className="pt-4 border-0 flex items-center justify-between bg-slate-100/50 rounded-lg p-4">
              {job.team ? (
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Team Avatar and Name */}
                  <div className="flex items-center gap-3">
                    {job.team.avatar ? (
                      <img
                        src={job.team.avatar}
                        alt={job.team.name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium">{job.team.name}</p>
                      {job.team.city && (
                        <p className="text-xs text-muted-foreground">{job.team.city}</p>
                      )}
                    </div>
                  </div>

                  {/* Creator Profile (if available) */}
                  {job.creator && (
                    <>
                      <span className="text-muted-foreground"> | </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Posted by:</span>
                        <Link
                          to={`/profile/${job.creator.username}`}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {job.creator.avatar ? (
                            <img
                              src={job.creator.avatar}
                              alt={`${job.creator.firstName} ${job.creator.lastName}`}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {job.creator.firstName?.[0]}
                              {job.creator.lastName?.[0]}
                            </div>
                          )}
                          <span className="text-sm text-muted-foreground hover:text-primary">
                            {job.creator.firstName} {job.creator.lastName}
                          </span>
                        </Link>
                      </div>
                    </>
                  )}

                  {/* Posted Date */}
                  <span className="text-muted-foreground"> | </span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{timeAgo}</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1"></div>
              )}

              {onView && (
                <Button variant="outline" size="sm" className="border-0" onClick={onView}>
                  View Details
                   <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
