import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import type { PortfolioContributor } from '@/types/user';

interface ContributorBadgeProps {
  contributors: PortfolioContributor[];
  maxVisible?: number;
}

export default function ContributorBadge({ contributors, maxVisible = 3 }: ContributorBadgeProps) {
  if (!contributors || contributors.length === 0) {
    return null;
  }

  const visibleContributors = contributors.slice(0, maxVisible);
  const remainingCount = Math.max(0, contributors.length - maxVisible);

  return (
    <div className="flex items-center gap-3">
      <div className="relative cursor-help">
        <Users className="w-4 h-4 text-muted-foreground peer" />
        {/* Tooltip - only shows on icon hover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 peer-hover:opacity-100 transition-opacity pointer-events-none z-10">
          Contributors
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Contributor Avatars */}
        <div className="flex -space-x-2">
          {visibleContributors.map((contributor) => (
            <Link
              key={contributor.id}
              to={`/profile/${contributor.user.username}`}
              className="relative group"
            >
              <div className="relative w-8 h-8 rounded-full border-2 border-background hover:border-primary transition-colors overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                {contributor.user.avatar ? (
                  <img
                    src={contributor.user.avatar}
                    alt={`${contributor.user.firstName} ${contributor.user.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
                    {contributor.user.firstName?.[0] || contributor.user.username[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Tooltip */}
              {/* <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {contributor.user.firstName} {contributor.user.lastName}
                {contributor.role && (
                  <span className="block text-gray-300">{contributor.role}</span>
                )}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div> */}
            </Link>
          ))}

          {remainingCount > 0 && (
            <div className="w-8 h-8 rounded-full border-2 border-background bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>

        {/* Contributor Names */}
        {/* <div className="text-sm">
          <span className="text-foreground">
            {visibleContributors.map((c, index) => (
              <span key={c.id}>
                <Link
                  to={`/profile/${c.user.username}`}
                  className="hover:underline font-medium"
                >
                  {c.user.firstName} {c.user.lastName}
                </Link>
                {index < visibleContributors.length - 1 && ', '}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-muted-foreground">
                {' '}and {remainingCount} more
              </span>
            )}
          </span>
        </div> */}
      </div>
    </div>
  );
}
