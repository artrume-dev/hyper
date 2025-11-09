import { MapPin, Calendar, DollarSign, Clock, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Project } from '@/types/project';

interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(project);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const budgetRange =
    project.minCost && project.maxCost
      ? `${formatCurrency(project.minCost, project.currency)} - ${formatCurrency(
          project.maxCost,
          project.currency
        )}`
      : project.minCost
      ? `From ${formatCurrency(project.minCost, project.currency)}`
      : project.maxCost
      ? `Up to ${formatCurrency(project.maxCost, project.currency)}`
      : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${project.title}`}
      className="group bg-white rounded-2xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      {/* Card Header */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {project.title}
        </h3>

        {/* Team Info */}
        {project.team && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{project.team.name}</span>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {project.description}
        </p>

        {/* Project Meta Info */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          {/* Budget */}
          {budgetRange && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="font-medium text-green-700">{budgetRange}</span>
            </div>
          )}

          {/* Location */}
          {project.workLocation && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{project.workLocation}</span>
            </div>
          )}

          {/* Start Date */}
          {project.startDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>Starts {formatDate(project.startDate)}</span>
            </div>
          )}

          {/* Duration */}
          {project.duration && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>
                {project.duration} {project.duration === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Posted {formatDate(project.createdAt)}</span>
          <span className="text-primary font-medium group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </motion.article>
  );
}
