import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { dashboardService } from '@/services/api/dashboard.service';
import type { UserDashboardData } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Briefcase,
  Mail,
  FolderKanban,
  Award,
  ArrowRight,
  RefreshCw,
  User,
  Eye,
  Search,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  Clock,
  Send,
} from 'lucide-react';

export default function DashboardHome() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const dashData = await dashboardService.getUserDashboard();
      setDashboardData(dashData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadDashboard();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-muted rounded w-64 mb-2"></div>
        <div className="h-6 bg-muted rounded w-96 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-muted rounded-xl"></div>
          <div className="h-96 bg-muted rounded-xl"></div>
          <div className="h-96 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Failed to Load Dashboard</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadDashboard} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { user, statistics, recentTeams, recentInvitations, recentMessages } = dashboardData;

  // Animation variants for stagger effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <>
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary">
              <AvatarImage src={user.avatar} alt={user.firstName} />
              <AvatarFallback className="text-lg font-bold">
                {user.firstName[0]}
                {user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl font-bold">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your account today.
              </p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Statistics Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
      >
        {/* Followers */}
        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">{statistics.followersCount}</h3>
              <p className="text-sm text-muted-foreground">Followers</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Following */}
        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200 dark:border-green-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">{statistics.followingCount}</h3>
              <p className="text-sm text-muted-foreground">Following</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Teams */}
        <motion.div variants={itemVariants}>
          <Link to="/dashboard/teams">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200 dark:border-purple-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{statistics.teamsCount}</h3>
                <p className="text-sm text-muted-foreground">Teams</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Pending Invitations */}
        <motion.div variants={itemVariants}>
          <Link to="/dashboard/invitations">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-200 dark:border-orange-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">
                  {statistics.pendingInvitationsCount}
                </h3>
                <p className="text-sm text-muted-foreground">Invitations</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Portfolio Items */}
        <motion.div variants={itemVariants}>
          <Link to={`/profile/${user.username}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-pink-200 dark:border-pink-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                    <FolderKanban className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{statistics.portfolioCount}</h3>
                <p className="text-sm text-muted-foreground">Portfolio</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Skills */}
        <motion.div variants={itemVariants}>
          <Link to={`/profile/${user.username}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-indigo-200 dark:border-indigo-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{statistics.skillsCount}</h3>
                <p className="text-sm text-muted-foreground">Skills</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Pending Requests Sent */}
        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-amber-200 dark:border-amber-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                  <Send className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">{statistics.pendingRequestsSent}</h3>
              <p className="text-sm text-muted-foreground">Requests Sent</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Requests Received */}
        <motion.div variants={itemVariants}>
          <Link to="/dashboard/recommendations">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-cyan-200 dark:border-cyan-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{statistics.pendingRequestsReceived}</h3>
                <p className="text-sm text-muted-foreground">Requests Received</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Accepted Recommendations */}
        <motion.div variants={itemVariants}>
          <Link to={`/profile/${user.username}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-emerald-200 dark:border-emerald-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{statistics.acceptedRecommendations}</h3>
                <p className="text-sm text-muted-foreground">Recommendations</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Given Recommendations */}
        <motion.div variants={itemVariants}>
          <Link to="/dashboard/recommendations">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-teal-200 dark:border-teal-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{statistics.givenRecommendations}</h3>
                <p className="text-sm text-muted-foreground">Rec Given</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Teams */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Recent Teams
                </CardTitle>
                <Link to="/dashboard/teams">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Your most recent team memberships</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTeams.length > 0 ? (
                <div className="space-y-4">
                  {recentTeams.map((team) => (
                    <Link
                      key={team.id}
                      to={`/teams/${team.id}`}
                      className="block p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={team.avatar} alt={team.name} />
                          <AvatarFallback>{team.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{team.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {team.userRole}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {team._count.members} members
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    You're not part of any teams yet
                  </p>
                  <Button onClick={() => navigate('/teams')} size="sm" variant="outline">
                    Browse Teams
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Invitations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Recent Invitations
                </CardTitle>
                <Link to="/dashboard/invitations">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Latest team invitations</CardDescription>
            </CardHeader>
            <CardContent>
              {recentInvitations.length > 0 ? (
                <div className="space-y-4">
                  {recentInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={invitation.team?.imageUrl}
                            alt={invitation.team?.name}
                          />
                          <AvatarFallback>{invitation.team?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">
                            {invitation.team?.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            From {invitation.sender?.firstName} {invitation.sender?.lastName}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant={
                                invitation.status === 'PENDING'
                                  ? 'default'
                                  : invitation.status === 'ACCEPTED'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                              className="text-xs"
                            >
                              {invitation.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(invitation.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No recent invitations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Shortcuts to common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate(`/profile/${user.username}`)}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <User className="w-4 h-4" />
                Edit Profile
              </Button>
              <Button
                onClick={() => navigate(`/profile/${user.username}`)}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Eye className="w-4 h-4" />
                View My Profile
              </Button>
              <Button
                onClick={() => navigate('/freelancers')}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Search className="w-4 h-4" />
                Browse Freelancers
              </Button>
              <Button
                onClick={() => navigate('/teams')}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Browse Teams
              </Button>
              <Button
                onClick={() => navigate('/teams/create')}
                variant="default"
                className="w-full justify-start gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Create New Team
              </Button>
            </CardContent>
          </Card>

          {/* Recent Messages (if any) */}
          {recentMessages.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Recent Messages
                </CardTitle>
                <CardDescription>Latest messages from teams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentMessages.slice(0, 3).map((message) => (
                    <div
                      key={message.id}
                      className="p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.sender.avatar} alt={message.sender.firstName} />
                          <AvatarFallback className="text-xs">
                            {message.sender.firstName[0]}
                            {message.sender.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">
                            {message.sender.firstName} {message.sender.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {message.content}
                          </p>
                          {message.team && (
                            <p className="text-xs text-muted-foreground mt-1">
                              in {message.team.name}
                            </p>
                          )}
                        </div>
                        {!message.read && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </>
  );
}
