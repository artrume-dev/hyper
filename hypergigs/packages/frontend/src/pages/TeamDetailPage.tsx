import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  MapPin,
  Briefcase,
  Calendar,
  ArrowLeft,
  Mail,
  Settings,
  UserPlus,
  Building2,
  Folder,
  Plus,
  Edit
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import AddMemberDialog from '@/components/AddMemberDialog';
import SubTeamCard from '@/components/SubTeamCard';
import SubTeamDialog from '@/components/SubTeamDialog';
import JobPostingCard from '@/components/JobPostingCard';
import JobPostingDialog from '@/components/JobPostingDialog';
import EditTeamAvatarDialog from '@/components/EditTeamAvatarDialog';
import { useState, useEffect } from 'react';
import { teamService } from '@/services/api/team.service';
import { jobService } from '@/services/api/job.service';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { stripHtmlTags } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import type { TeamType, TeamRole, Team } from '@/types/team';
import type { JobPosting } from '@/types/job';

interface TeamMemberData {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role?: string;
    bio?: string;
    location?: string;
  };
}

interface TeamDetailData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: TeamType;
  city?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  parentTeamId?: string;
  isMainTeam: boolean;
  owner: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role?: string;
  };
  members: TeamMemberData[];
  _count: {
    members: number;
    projects: number;
  };
}

export default function TeamDetailPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [team, setTeam] = useState<TeamDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  // Sub-teams state
  const [subTeams, setSubTeams] = useState<Team[]>([]);
  const [subTeamJobCounts, setSubTeamJobCounts] = useState<Record<string, number>>({});
  const [showSubTeamDialog, setShowSubTeamDialog] = useState(false);

  // Parent team state (for sub-teams)
  const [parentTeam, setParentTeam] = useState<Team | null>(null);

  // Jobs state
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | undefined>(undefined);

  // Edit avatar dialog state
  const [showEditAvatarDialog, setShowEditAvatarDialog] = useState(false);

  useEffect(() => {
    if (identifier) {
      loadTeam();
    }
  }, [identifier]);

  const loadTeam = async () => {
    if (!identifier) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await teamService.getTeam(identifier);
      setTeam(result as unknown as TeamDetailData);

      // Load parent team if this is a sub-team
      if (result.parentTeamId) {
        try {
          const parent = await teamService.getTeam(result.parentTeamId);
          setParentTeam(parent);
        } catch (err) {
          console.error('Failed to load parent team:', err);
        }
      }

      // Load sub-teams and jobs if user is a member
      if (result.id) {
        loadSubTeams(result.id);
        loadJobs(result.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load team');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubTeams = async (teamId: string) => {
    try {
      const [subTeamsData, jobCounts] = await Promise.all([
        teamService.getSubTeams(teamId),
        teamService.getSubTeamJobCounts(teamId),
      ]);
      setSubTeams(subTeamsData);
      setSubTeamJobCounts(jobCounts);
    } catch (err: any) {
      console.error('Failed to load sub-teams:', err);
    }
  };

  const loadJobs = async (teamId: string) => {
    try {
      const jobsData = await jobService.getTeamJobs(teamId);
      setJobs(jobsData);
    } catch (err: any) {
      console.error('Failed to load jobs:', err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;

    try {
      await jobService.deleteJob(jobId);
      if (team) {
        loadJobs(team.id);
      }
    } catch (err: any) {
      console.error('Failed to delete job:', err);
    }
  };

  const handleEditJob = (job: JobPosting) => {
    setSelectedJob(job);
    setShowJobDialog(true);
  };

  const handleJobDialogClose = () => {
    setShowJobDialog(false);
    setSelectedJob(undefined);
  };

  const getTeamTypeIcon = (type: TeamType) => {
    switch (type) {
      case 'TEAM':
        return <Users className="w-5 h-5" />;
      case 'COMPANY':
        return <Building2 className="w-5 h-5" />;
      case 'ORGANIZATION':
        return <Folder className="w-5 h-5" />;
      case 'DEPARTMENT':
        return <Briefcase className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: TeamRole) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'MEMBER':
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const isTeamMember = team?.members.some(
    (member) => member.userId === currentUser?.id
  );

  const isOwner = team?.ownerId === currentUser?.id;
  const isAdmin = team?.members.find(
    (member) => member.userId === currentUser?.id
  )?.role === 'ADMIN';

  const canManageTeam = isOwner || isAdmin;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-7xl mx-auto text-center py-12">
            <div className="text-lg">Loading team...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-7xl mx-auto text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error || 'Team not found'}
            </h3>
            <Button onClick={() => navigate('/teams')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Teams
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => {
                if (team.parentTeamId && parentTeam) {
                  navigate(`/teams/${parentTeam.slug}`);
                } else {
                  navigate('/teams');
                }
              }}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {team.parentTeamId && parentTeam
                ? `Back to ${parentTeam.name}`
                : 'Back to Teams'}
            </Button>
          </motion.div>

          {/* Team Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/40 bg-card/50 backdrop-blur mb-8">
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Team Avatar */}
                  <div className="relative">
                    {team.avatar ? (
                      <img
                        src={team.avatar}
                        alt={team.name}
                        className="w-24 h-24 rounded-lg object-cover border border-border"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center text-foreground text-2xl font-bold border border-border">
                        {team.isMainTeam ? (
                          getInitials(team.name.split(' ')[0], team.name.split(' ')[1] || '')
                        ) : (
                          <Folder className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    {/* Edit button - always visible for team owners/admins */}
                    {canManageTeam && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full shadow-md"
                        onClick={() => setShowEditAvatarDialog(true)}
                      >
                        <Edit className="w-4 h-4" />
                        <span className="sr-only">Edit team avatar</span>
                      </Button>
                    )}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {getTeamTypeIcon(team.type)}
                          <span className="font-medium">{team.type}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {team.isMainTeam && jobs.length > 0 && (
                          <Link to={`/teams/${team.slug}/jobs`}>
                            <Button variant="outline" size="sm">
                              <Briefcase className="w-4 h-4 mr-2" />
                              View Jobs ({jobs.length})
                            </Button>
                          </Link>
                        )}
                        {canManageTeam && (
                          <Link to={`/teams/${team.slug}/settings`}>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4 mr-2" />
                              Settings
                            </Button>
                          </Link>
                        )}
                        {!isTeamMember && currentUser && (
                          <Button size="sm">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Request to Join
                          </Button>
                        )}
                        {isTeamMember && !isOwner && (
                          <Button variant="outline" size="sm">
                            <Mail className="w-4 h-4 mr-2" />
                            Message Team
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Team Stats */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {team.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{team.city}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{team._count.members} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{team._count.projects} projects</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Created {new Date(team.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Description */}
                {team.description && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-muted-foreground">
                      {stripHtmlTags(team.description)}
                    </p>
                  </div>
                )}
              </CardHeader>
            </Card>
          </motion.div>

          {/* Team Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Tabs defaultValue="members" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="sub-teams">
                    Sub-teams {subTeams.length > 0 && `(${subTeams.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="jobs">
                    Jobs {jobs.length > 0 && `(${jobs.length})`}
                  </TabsTrigger>
                </TabsList>

                {/* Members Tab */}
                <TabsContent value="members">
                  <Card className="border-border/40 bg-card/50 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Team Members ({team.members.length})</span>
                        {canManageTeam && (
                          <Button size="sm" onClick={() => setShowAddMemberDialog(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Member
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {team.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background/50"
                          >
                            {/* Member Avatar */}
                            <Link to={`/profile/${member.user.username}`}>
                              {member.user.avatar ? (
                                <img
                                  src={member.user.avatar}
                                  alt={`${member.user.firstName} ${member.user.lastName}`}
                                  className="w-12 h-12 rounded-full object-cover border border-border"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground text-sm font-bold border border-border">
                                  {getInitials(member.user.firstName, member.user.lastName)}
                                </div>
                              )}
                            </Link>

                            {/* Member Info */}
                            <div className="flex-1">
                              <Link
                                to={`/profile/${member.user.username}`}
                                className="font-medium hover:underline"
                              >
                                {member.user.firstName} {member.user.lastName}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                @{member.user.username}
                              </p>
                              {member.user.location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{member.user.location}</span>
                                </div>
                              )}
                            </div>

                            {/* Member Role Badge */}
                            <div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                                  member.role
                                )}`}
                              >
                                {member.role}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Sub-teams Tab */}
                <TabsContent value="sub-teams">
                  <Card className="border-border/40 bg-card/50 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Sub-teams ({subTeams.length})</span>
                        {canManageTeam && (
                          <Button size="sm" onClick={() => setShowSubTeamDialog(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Sub-team
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {subTeams.length === 0 ? (
                        <div className="text-center py-12">
                          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">No sub-teams yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Create departments like Engineering, Marketing, Design, etc.
                          </p>
                          {canManageTeam && (
                            <Button onClick={() => setShowSubTeamDialog(true)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Create Sub-team
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {subTeams.map((subTeam) => (
                            <SubTeamCard
                              key={subTeam.id}
                              subTeam={subTeam}
                              activeJobsCount={subTeamJobCounts[subTeam.id]}
                              onClick={() => navigate(`/teams/${subTeam.slug}`)}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Jobs Tab */}
                <TabsContent value="jobs">
                  <Card className="border-border/40 bg-card/50 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Job Postings ({jobs.length})</span>
                        {canManageTeam && (
                          <Button size="sm" onClick={() => setShowJobDialog(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            {team.isMainTeam
                              ? 'Post a Job'
                              : `Post Job in ${team.name}`}
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {jobs.length === 0 ? (
                        <div className="text-center py-12">
                          <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">No job postings yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {team.isMainTeam
                              ? 'Post jobs to attract talented candidates to your team.'
                              : 'Jobs for this department will appear here when posted.'}
                          </p>
                          {canManageTeam && (
                            <Button onClick={() => setShowJobDialog(true)}>
                              <Plus className="w-4 h-4 mr-2" />
                              {team.isMainTeam ? 'Post a Job' : `Post Job in ${team.name}`}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {jobs.map((job) => (
                            <JobPostingCard
                              key={job.id}
                              job={job}
                              canManage={canManageTeam && team.isMainTeam}
                              onEdit={() => handleEditJob(job)}
                              onDelete={() => handleDeleteJob(job.id)}
                              onView={() => navigate(`/jobs/${job.id}`)}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Owner Card */}
              <Card className="border-border/40 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">Team Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    to={`/profile/${team.owner.username}`}
                    className="flex items-center gap-3"
                  >
                    {team.owner.avatar ? (
                      <img
                        src={team.owner.avatar}
                        alt={`${team.owner.firstName} ${team.owner.lastName}`}
                        className="w-12 h-12 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground text-sm font-bold border border-border">
                        {getInitials(team.owner.firstName, team.owner.lastName)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium hover:underline">
                        {team.owner.firstName} {team.owner.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{team.owner.username}
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              {/* Projects Card (Placeholder) */}
              <Card className="border-border/40 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Projects ({team._count.projects})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {team._count.projects === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No projects yet
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Projects coming soon...
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Add Member Dialog */}
      {team && (
        <>
          <AddMemberDialog
            open={showAddMemberDialog}
            onOpenChange={setShowAddMemberDialog}
            teamId={team.id}
            teamName={team.name}
            onSuccess={() => loadTeam()}
          />

          {/* Sub-Team Dialog */}
          <SubTeamDialog
            open={showSubTeamDialog}
            onOpenChange={setShowSubTeamDialog}
            parentTeamId={team.id}
            parentTeamName={team.name}
            onSuccess={() => {
              if (team.id) {
                loadSubTeams(team.id);
              }
            }}
          />

          {/* Job Posting Dialog */}
          <JobPostingDialog
            open={showJobDialog}
            onOpenChange={handleJobDialogClose}
            teamId={team.parentTeamId || team.id}
            teamName={parentTeam?.name || team.name}
            preSelectedSubTeamId={team.parentTeamId ? team.id : undefined}
            job={selectedJob}
            onSuccess={() => {
              if (team.id) {
                loadJobs(team.id);
              }
            }}
          />

          {/* Edit Team Avatar Dialog */}
          <EditTeamAvatarDialog
            open={showEditAvatarDialog}
            onOpenChange={setShowEditAvatarDialog}
            teamId={team.id}
            teamName={team.name}
            currentAvatar={team.avatar}
            onSuccess={() => loadTeam()}
          />
        </>
      )}
    </div>
  );
}
