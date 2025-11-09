import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  show?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export default function VerifiedBadge({ show = false, size = 'md', className }: VerifiedBadgeProps) {
  if (!show) return null;

  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-full', className)}>
      <Check className={cn('text-blue-600', sizeClasses[size])} />
      <span className="text-xs font-medium text-blue-700">
        Verified
      </span>
    </div>
  );
}
