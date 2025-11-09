import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Users } from 'lucide-react';
import { recommendationService } from '@/services/api/recommendation.service';
import { collaborationService } from '@/services/api/collaboration.service';
import { useAuthStore } from '@/stores/authStore';
import type { SharedProject } from '@/types/user';

interface EnhancedRecommendationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  defaultType?: 'REQUEST' | 'GIVEN';
  // Optional: if opened from portfolio
  portfolioId?: string;
  portfolioName?: string;
}

export default function EnhancedRecommendationDialog({
  isOpen,
  onClose,
  receiverId,
  receiverName,
  defaultType = 'REQUEST',
  portfolioId,
  portfolioName,
}: EnhancedRecommendationDialogProps) {
  const { user } = useAuthStore();
  const [type, setType] = useState<'REQUEST' | 'GIVEN'>(defaultType);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Collaboration context
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedContext, setSelectedContext] = useState<string>('');

  useEffect(() => {
    if (isOpen && !portfolioId) {
      // Fetch shared projects when dialog opens (only if not portfolio-based)
      fetchSharedProjects();
    }
  }, [isOpen, receiverId, portfolioId]);

  useEffect(() => {
    // Reset type when defaultType changes
    setType(defaultType);
  }, [defaultType]);

  const fetchSharedProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const projects = await collaborationService.getSharedProjects(receiverId);
      setSharedProjects(projects);

      // Auto-select first project if available
      if (projects.length > 0) {
        setSelectedContext(`project:${projects[0].id}`);
      }
    } catch (err) {
      console.error('Failed to fetch shared projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (!user) {
      setError('You must be logged in');
      return;
    }

    // Determine context
    let requestData: any = {
      message: message.trim(),
      receiverId,
      type,
    };

    if (portfolioId) {
      // Portfolio-based (legacy support)
      requestData.portfolioId = portfolioId;
    } else if (selectedContext) {
      // Parse selected context
      const [contextType, contextId] = selectedContext.split(':');
      if (contextType === 'project') {
        requestData.projectId = contextId;
      } else if (contextType === 'team') {
        requestData.teamId = contextId;
      }
    }
    // Note: No error if no context - general recommendations are now allowed!

    try {
      setIsSubmitting(true);
      setError(null);

      await recommendationService.createRecommendation(requestData);

      setSuccess(true);
      setMessage('');

      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSelectedContext('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send recommendation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMessage('');
      setError(null);
      setSuccess(false);
      setSelectedContext('');
      onClose();
    }
  };

  const getTitle = () => {
    if (portfolioId) {
      return type === 'REQUEST' ? 'Request Recommendation' : 'Give Recommendation';
    }
    return type === 'REQUEST' ? 'Request Recommendation' : 'Give Recommendation';
  };

  const getSuccessMessage = () => {
    if (type === 'REQUEST') {
      return 'Your recommendation request has been sent successfully.';
    }
    return 'Your recommendation has been given successfully.';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-[35%] top-[12%] -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{getTitle()}</h3>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {success ? (
                <div className="text-center py-8">
                  <div className="mb-4 text-green-600">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">
                    {type === 'REQUEST' ? 'Request Sent!' : 'Recommendation Given!'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {getSuccessMessage()}
                  </p>
                </div>
              ) : (
                <>
                  {/* Type Selector (only show if not portfolio-based) */}
                  {!portfolioId && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Type
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setType('REQUEST')}
                          className={`flex-1 px-4 py-3 rounded-lg border font-medium transition-colors ${
                            type === 'REQUEST'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white border-border hover:bg-gray-50'
                          }`}
                        >
                          Request
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('GIVEN')}
                          className={`flex-1 px-4 py-3 rounded-lg border font-medium transition-colors ${
                            type === 'GIVEN'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white border-border hover:bg-gray-50'
                          }`}
                        >
                          Give
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {type === 'REQUEST'
                          ? 'Request a recommendation from this person'
                          : 'Give a recommendation to this person'}
                      </p>
                    </div>
                  )}

                  {/* Context Selection */}
                  {portfolioId ? (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Project
                      </label>
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-border">
                        <p className="text-sm font-medium">{portfolioName}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Project/Context <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      {isLoadingProjects ? (
                        <div className="px-4 py-8 bg-gray-50 rounded-lg border border-border flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading projects...</span>
                        </div>
                      ) : sharedProjects.length > 0 ? (
                        <select
                          value={selectedContext}
                          onChange={(e) => setSelectedContext(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">None (General Recommendation)</option>
                          {sharedProjects.map((project) => (
                            <option key={project.id} value={`project:${project.id}`}>
                              {project.title} ({project.teamName})
                            </option>
                          ))}
                          <option value={`team:${sharedProjects[0]?.teamId}`}>
                            General Team Collaboration
                          </option>
                        </select>
                      ) : (
                        <div className="px-4 py-8 bg-gray-50 rounded-lg border border-border text-center">
                          <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            You haven't worked together on any projects yet.
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional: Select a specific project, or leave as "None" for a general recommendation
                      </p>
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {type === 'REQUEST' ? 'Your Request' : 'Your Recommendation'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        type === 'REQUEST'
                          ? `Please provide a brief recommendation for my work...`
                          : `${receiverName} was excellent to work with...`
                      }
                      rows={5}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      disabled={isSubmitting}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {type === 'REQUEST'
                        ? 'Explain what you\'d like them to highlight'
                        : 'Describe their contributions and strengths'}
                    </p>
                  </div>

                  {error && (
                    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 rounded-lg border border-border hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !message.trim()}
                      className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {type === 'REQUEST' ? 'Send Request' : 'Give Recommendation'}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
