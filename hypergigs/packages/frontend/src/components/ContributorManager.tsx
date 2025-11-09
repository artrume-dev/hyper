import { useState, useEffect } from 'react';
import { X, UserPlus, Users as UsersIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { toast } from '@/hooks/use-toast';
import { portfolioContributorService } from '@/services/api/portfolioContributor.service';
import type { ContributorSuggestion, PortfolioContributor } from '@/types/user';

interface ContributorManagerProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  portfolioName: string;
  onContributorAdded?: () => void;
}

export default function ContributorManager({
  isOpen,
  onClose,
  portfolioId,
  portfolioName,
  onContributorAdded,
}: ContributorManagerProps) {
  const [suggestions, setSuggestions] = useState<ContributorSuggestion[]>([]);
  const [currentContributors, setCurrentContributors] = useState<PortfolioContributor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, portfolioId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [suggestionsData, contributorsData] = await Promise.all([
        portfolioContributorService.suggestContributors(portfolioId),
        portfolioContributorService.getPortfolioContributors(portfolioId, true),
      ]);
      setSuggestions(suggestionsData);
      setCurrentContributors(contributorsData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load contributors',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContributor = async (userId: string, role?: string) => {
    try {
      setAddingUserId(userId);
      await portfolioContributorService.addContributor(portfolioId, { userId, role });

      toast({
        title: 'Success',
        description: 'Contributor invitation sent',
      });

      await loadData();
      if (onContributorAdded) {
        onContributorAdded();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add contributor',
        variant: 'destructive',
      });
    } finally {
      setAddingUserId(null);
    }
  };

  const handleRemoveContributor = async (contributorId: string) => {
    try {
      await portfolioContributorService.removeContributor(portfolioId, contributorId);

      toast({
        title: 'Success',
        description: 'Contributor removed',
      });

      await loadData();
      if (onContributorAdded) {
        onContributorAdded();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to remove contributor',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Manage Contributors</h2>
              <p className="text-sm text-muted-foreground mt-1">{portfolioName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Current Contributors */}
                {currentContributors.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <UsersIcon className="w-5 h-5" />
                      Current Contributors
                    </h3>
                    <div className="space-y-3">
                      {currentContributors.map((contributor) => (
                        <div
                          key={contributor.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                              {contributor.user.avatar ? (
                                <img
                                  src={contributor.user.avatar}
                                  alt={contributor.user.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-semibold">
                                  {contributor.user.firstName?.[0] ||
                                    contributor.user.username[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {contributor.user.firstName} {contributor.user.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{contributor.user.username}
                                {contributor.role && ` • ${contributor.role}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Status: {contributor.status}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveContributor(contributor.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Add Contributors from Your Teams
                  </h3>

                  {suggestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No teammate suggestions available</p>
                      <p className="text-sm">Teammates from your shared teams will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                              {suggestion.avatar ? (
                                <img
                                  src={suggestion.avatar}
                                  alt={suggestion.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-semibold">
                                  {suggestion.firstName?.[0] || suggestion.username[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {suggestion.firstName} {suggestion.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{suggestion.username}
                                {suggestion.jobTitle && ` • ${suggestion.jobTitle}`}
                              </p>
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {suggestion.sharedTeams.map((team) => (
                                  <span
                                    key={team.id}
                                    className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                                  >
                                    {team.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddContributor(suggestion.id, suggestion.jobTitle || undefined)}
                            disabled={addingUserId === suggestion.id}
                            className="gap-2"
                          >
                            {addingUserId === suggestion.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
