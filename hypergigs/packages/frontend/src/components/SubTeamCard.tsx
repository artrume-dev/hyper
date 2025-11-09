import { Users, Briefcase, Code, Megaphone, Palette, UserCheck, DollarSign, Package, Settings, Calculator, Scale, Headphones, Folder } from 'lucide-react';
import type { Team, SubTeamCategory } from '@/types/team';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SubTeamCardProps {
  subTeam: Team;
  activeJobsCount?: number;
  onClick?: () => void;
}

// Icon mapping for sub-team categories
const CATEGORY_ICONS: Record<SubTeamCategory, any> = {
  ENGINEERING: Code,
  MARKETING: Megaphone,
  DESIGN: Palette,
  HR: UserCheck,
  SALES: DollarSign,
  PRODUCT: Package,
  OPERATIONS: Settings,
  FINANCE: Calculator,
  LEGAL: Scale,
  SUPPORT: Headphones,
  OTHER: Folder,
};

// Color mapping for sub-team categories
const CATEGORY_COLORS: Record<SubTeamCategory, string> = {
  ENGINEERING: 'bg-blue-100 text-blue-700 border-blue-200',
  MARKETING: 'bg-purple-100 text-purple-700 border-purple-200',
  DESIGN: 'bg-pink-100 text-pink-700 border-pink-200',
  HR: 'bg-green-100 text-green-700 border-green-200',
  SALES: 'bg-orange-100 text-orange-700 border-orange-200',
  PRODUCT: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  OPERATIONS: 'bg-gray-100 text-gray-700 border-gray-200',
  FINANCE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LEGAL: 'bg-red-100 text-red-700 border-red-200',
  SUPPORT: 'bg-teal-100 text-teal-700 border-teal-200',
  OTHER: 'bg-slate-100 text-slate-700 border-slate-200',
};

// Label mapping
const CATEGORY_LABELS: Record<SubTeamCategory, string> = {
  ENGINEERING: 'Engineering',
  MARKETING: 'Marketing',
  DESIGN: 'Design',
  HR: 'Human Resources',
  SALES: 'Sales',
  PRODUCT: 'Product',
  OPERATIONS: 'Operations',
  FINANCE: 'Finance',
  LEGAL: 'Legal',
  SUPPORT: 'Customer Support',
  OTHER: 'Other',
};

export default function SubTeamCard({
  subTeam,
  activeJobsCount,
  onClick,
}: SubTeamCardProps) {
  const category = subTeam.subTeamCategory || 'OTHER';
  const Icon = CATEGORY_ICONS[category];
  const colorClass = CATEGORY_COLORS[category];
  const memberCount = subTeam._count?.members || subTeam.memberCount || 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div onClick={handleClick}>
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-border/40 bg-card/50 backdrop-blur h-full">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Category Icon */}
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center border ${colorClass}`}
            >
              <Icon className="w-6 h-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Team Name */}
              <h3 className="font-semibold text-lg mb-1 truncate">
                {subTeam.name}
              </h3>

              {/* Category Badge */}
              {subTeam.subTeamCategory && (
                <Badge variant="outline" className="mb-3 text-xs">
                  {CATEGORY_LABELS[subTeam.subTeamCategory]}
                </Badge>
              )}

              {/* Description */}
              {subTeam.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {subTeam.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                </div>

                {activeJobsCount !== undefined && activeJobsCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span>{activeJobsCount} {activeJobsCount === 1 ? 'job' : 'jobs'}</span>
                  </div>
                )}
              </div>

              {/* Member Avatars (if available) */}
              {/* TODO: Add member avatars when team members are loaded */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
