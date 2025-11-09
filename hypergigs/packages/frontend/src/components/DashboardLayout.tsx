import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import {
  LayoutDashboard,
  Users,
  Mail,
  UsersRound,
  User,
  Briefcase,
  MessageSquare,
  Award,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    to: '/dashboard/teams',
    icon: Users,
    label: 'Teams',
  },
  {
    to: '/dashboard/invitations',
    icon: Mail,
    label: 'Invitations',
  },
  {
    to: '/dashboard/recommendations',
    icon: Award,
    label: 'Recommendations',
  },
  {
    to: '/dashboard/community',
    icon: UsersRound,
    label: 'Community',
  },
  {
    to: '/dashboard/profile',
    icon: User,
    label: 'Profile',
  },
  {
    to: '/dashboard/projects',
    icon: Briefcase,
    label: 'Projects',
  },
  {
    to: '/dashboard/messages',
    icon: MessageSquare,
    label: 'Messages',
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="flex pt-16">
        {/* Left Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] bg-card border-r border-border fixed left-0 top-16">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64">
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
