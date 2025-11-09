import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Loader2, FolderKanban } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { portfolioContributorService } from '@/services/api/portfolioContributor.service';
import { toast } from '@/hooks/use-toast';
import type { PortfolioContributor } from '@/types/user';

interface ContributorInvitationCardProps {
  invitation: PortfolioContributor;
  onStatusUpdate?: () => void;
}

export default function ContributorInvitationCard({
  invitation,
  onStatusUpdate,
}: ContributorInvitationCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResponse = async (status: 'ACCEPTED' | 'REJECTED') => {
    try {
      setIsProcessing(true);
      await portfolioContributorService.updateContributorStatus(
        invitation.portfolioId,
        invitation.id,
        { status }
      );

      toast({
        title: 'Success',
        description: status === 'ACCEPTED'
          ? 'You are now a contributor to this portfolio'
          : 'Contributor invitation declined',
      });

      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update invitation',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const portfolioImages = invitation.portfolio?.mediaFiles
    ? JSON.parse(invitation.portfolio.mediaFiles)
    : [];
  const firstImage = portfolioImages[0];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex">
          {/* Portfolio Image */}
          <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600">
            {firstImage ? (
              <img
                src={firstImage}
                alt={invitation.portfolio?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FolderKanban className="w-12 h-12 text-white opacity-50" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {invitation.portfolio?.name || 'Portfolio'}
                </h3>
                {invitation.portfolio?.companyName && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {invitation.portfolio.companyName}
                  </p>
                )}
                {invitation.portfolio?.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {invitation.portfolio.description}
                  </p>
                )}
              </div>
            </div>

            {/* Invitation Info */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                {invitation.addedByUser?.avatar ? (
                  <img
                    src={invitation.addedByUser.avatar}
                    alt={invitation.addedByUser.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xs font-semibold">
                    {invitation.addedByUser?.firstName?.[0] ||
                      invitation.addedByUser?.username[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-sm">
                <Link
                  to={`/profile/${invitation.addedByUser?.username}`}
                  className="font-medium hover:underline"
                >
                  {invitation.addedByUser?.firstName} {invitation.addedByUser?.lastName}
                </Link>
                <span className="text-muted-foreground"> invited you as a contributor</span>
                {invitation.role && (
                  <span className="block text-xs text-muted-foreground">Role: {invitation.role}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            {invitation.status === 'PENDING' && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleResponse('ACCEPTED')}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResponse('REJECTED')}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Decline
                </Button>
              </div>
            )}

            {invitation.status === 'ACCEPTED' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                <Check className="w-4 h-4" />
                Accepted
              </div>
            )}

            {invitation.status === 'REJECTED' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">
                <X className="w-4 h-4" />
                Declined
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
