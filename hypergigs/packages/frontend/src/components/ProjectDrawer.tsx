import { useEffect, useState } from 'react';
import { X, ExternalLink, Calendar, Building, User, MessageSquare, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PortfolioItem } from '@/types/user';
import { useAuthStore } from '@/stores/authStore';
import EnhancedRecommendationDialog from './EnhancedRecommendationDialog';
import ContributorBadge from './ContributorBadge';
import ContributorManager from './ContributorManager';
import { Button } from './ui/button';

interface ProjectDrawerProps {
  project: PortfolioItem | null;
  isOpen: boolean;
  onClose: () => void;
  isOwnProfile?: boolean;
}

export default function ProjectDrawer({ project, isOpen, onClose, isOwnProfile = false }: ProjectDrawerProps) {
  const { user } = useAuthStore();
  const [showRecommendationDialog, setShowRecommendationDialog] = useState(false);
  const [showContributorManager, setShowContributorManager] = useState(false);
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!project) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-7xl bg-background border-l border-border shadow-2xl z-50 overflow-hidden"
          >
            {/* Header with Close Button */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold truncate pr-4">{project.name}</h2>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="h-[calc(100vh-73px)] overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Image Gallery - Stacked */}
                {project.mediaFiles && project.mediaFiles.length > 0 && (
                  <div className="space-y-4">
                    {project.mediaFiles.map((image, index) => (
                      <div key={index} className="aspect-video w-full bg-muted overflow-hidden">
                        <img
                          src={image}
                          alt={`${project.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Project Meta Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {project.companyName && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="w-4 h-4" />
                      <span>{project.companyName}</span>
                    </div>
                  )}
                  {project.role && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{project.role}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(project.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}</span>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">About This Project</h3>
                    <div
                      className="text-muted-foreground leading-relaxed prose"
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                  </div>
                )}

                {/* Created With - Tools/Methods */}
                {project.createdWith && project.createdWith.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Created With</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.createdWith.map((tool, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contributors Section */}
                {project.contributors && project.contributors.length > 0 && (
                  <div className="space-y-2">
                    <ContributorBadge contributors={project.contributors} />
                  </div>
                )}

                {/* Manage Contributors Button (owner only) */}
                {isOwnProfile && user && user.id === project.userId && (
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => setShowContributorManager(true)}
                      className="gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Manage Contributors
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 flex flex-wrap gap-3">
                  {/* External Link Button */}
                  {project.workUrls && (
                    <a
                      href={project.workUrls.startsWith('http') ? project.workUrls : `https://${project.workUrls}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Live Project
                    </a>
                  )}

                  {/* Request Recommendation Button - Only show if not own profile and user is logged in */}
                  {!isOwnProfile && user && user.id !== project.userId && (
                    <button
                      onClick={() => setShowRecommendationDialog(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-medium"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Request Recommendation
                    </button>
                  )}
                </div>

                {/* Additional Project Details Section */}
                <div className="pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                  <dl className="space-y-3">
                    {project.companyName && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Client</dt>
                        <dd className="mt-1 text-sm">{project.companyName}</dd>
                      </div>
                    )}
                    {project.role && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Role</dt>
                        <dd className="mt-1 text-sm">{project.role}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recommendation Dialog */}
          {project && (
            <EnhancedRecommendationDialog
              isOpen={showRecommendationDialog}
              onClose={() => setShowRecommendationDialog(false)}
              receiverId={project.userId}
              receiverName={project.name}
              defaultType="REQUEST"
              portfolioId={project.id}
              portfolioName={project.name}
            />
          )}

          {/* Contributor Manager Dialog */}
          {project && (
            <ContributorManager
              isOpen={showContributorManager}
              onClose={() => setShowContributorManager(false)}
              portfolioId={project.id}
              portfolioName={project.name}
              onContributorAdded={() => {
                // Could refresh project data here if needed
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
