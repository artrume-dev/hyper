import { useState, useEffect } from 'react';
import { recommendationService } from '@/services/api/recommendation.service';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioRatingBoxProps {
  portfolioId: string;
  portfolioOwnerId: string;
  existingLikes?: number;
  userHasLiked?: boolean;
  onSuccess?: () => void;
  className?: string;
}

export default function PortfolioRatingBox({
  portfolioId,
  portfolioOwnerId,
  existingLikes = 0,
  userHasLiked = false,
  onSuccess,
  className,
}: PortfolioRatingBoxProps) {
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(userHasLiked);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likeCount, setLikeCount] = useState(existingLikes);

  useEffect(() => {
    setIsLiked(userHasLiked);
    setLikeCount(existingLikes);
  }, [userHasLiked, existingLikes]);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to like',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (isLiked) {
        // Unlike - remove the recommendation
        // Note: We'd need a delete endpoint, for now just toggle UI
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));

        toast({
          title: 'Removed',
          description: 'Like removed',
        });
      } else {
        // Like - create a simple recommendation with just "liked"
        await recommendationService.createRecommendation({
          message: 'Liked this work',
          receiverId: portfolioOwnerId,
          portfolioId,
          type: 'GIVEN',
        });

        setIsLiked(true);
        setLikeCount(prev => prev + 1);

        toast({
          title: 'Success',
          description: 'Portfolio liked',
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update like',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show if viewing own portfolio
  if (user?.id === portfolioOwnerId) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant={isLiked ? 'default' : 'outline'}
        size="sm"
        onClick={handleLike}
        disabled={isSubmitting}
        className="gap-2"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
        )}
        {isLiked ? 'Liked' : 'Like'}
      </Button>
      {likeCount > 0 && (
        <span className="text-sm text-muted-foreground">
          {likeCount} {likeCount === 1 ? 'like' : 'likes'}
        </span>
      )}
    </div>
  );
}
