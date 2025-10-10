import { useAuthStore } from '@/stores/authStore';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Users, 
  FolderKanban, 
  Briefcase,
  Mail,
  Bell,
  Settings,
  LogOut,
  FileText,
  MessageSquare,
  Calendar,
  TrendingUp,
  Award,
  HelpCircle
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useState } from 'react';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen] = useState(true); // setSidebarOpen removed as it's not used

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      section: 'Main',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', badge: null },
        { icon: User, label: 'My Profile', path: `/profile/${user?.username}`, badge: null },
        { icon: Users, label: 'My Team', path: '/teams/my', badge: null },
        { icon: FolderKanban, label: 'My Projects', path: '/projects/my', badge: null },
      ]
    },
    {
      section: 'Activity',
      items: [
        { icon: Mail, label: 'Invitations', path: '/invitations', badge: '3' },
        { icon: Bell, label: 'Notifications', path: '/notifications', badge: '5' },
        { icon: MessageSquare, label: 'Messages', path: '/messages', badge: '2' },
        { icon: Calendar, label: 'Calendar', path: '/calendar', badge: null },
      ]
    },
    {
      section: 'Resources',
      items: [
        { icon: Briefcase, label: 'Find Work', path: '/freelancers', badge: null },
        { icon: TrendingUp, label: 'Analytics', path: '/analytics', badge: null },
        { icon: FileText, label: 'Contracts', path: '/contracts', badge: null },
        { icon: Award, label: 'Achievements', path: '/achievements', badge: null },
      ]
    },
    {
      section: 'Settings',
      items: [
        { icon: Settings, label: 'Settings', path: '/settings', badge: null },
        { icon: HelpCircle, label: 'Help & Support', path: '/help', badge: null },
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}>
          <div className="p-4">
            {/* User Info */}
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex items-center gap-3">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.firstName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user?.username}</p>
                </div>
              </div>
            </div>

            {/* Menu Sections */}
            <nav className="space-y-6">
              {menuItems.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                    {section.section}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item, itemIdx) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      
                      return (
                        <li key={itemIdx}>
                          <Link
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                              active
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium flex-1">{item.label}</span>
                            {item.badge && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                active 
                                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="mt-6 pt-6 border-t border-border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your projects today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <FolderKanban className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-2xl font-bold">12</span>
                </div>
                <h3 className="font-medium mb-1">Active Projects</h3>
                <p className="text-sm text-muted-foreground">+2 this month</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-2xl font-bold">8</span>
                </div>
                <h3 className="font-medium mb-1">Team Members</h3>
                <p className="text-sm text-muted-foreground">Across 3 teams</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="font-medium mb-1">Pending Invites</h3>
                <p className="text-sm text-muted-foreground">Requires action</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-2xl font-bold">94%</span>
                </div>
                <h3 className="font-medium mb-1">Success Rate</h3>
                <p className="text-sm text-muted-foreground">+5% from last month</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">New project assigned</p>
                    <p className="text-sm text-muted-foreground">You've been added to "Website Redesign" project</p>
                    <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Team invitation accepted</p>
                    <p className="text-sm text-muted-foreground">Sarah Chen joined your "Design Team"</p>
                    <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">New message received</p>
                    <p className="text-sm text-muted-foreground">John Doe sent you a message about the project timeline</p>
                    <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
