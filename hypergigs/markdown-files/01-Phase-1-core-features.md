# System Design Document (SDD) - Phase 1
## Core Features Implementation

**Phase:** 1 - Core Features  
**Duration:** 3 weeks  
**Priority:** P0 (Critical)  
**Status:** Planning

---

## Phase 1 Overview

### Goals
- Implement user profile management
- Build team creation and management features
- Develop basic invitation system
- Create user and team dashboards
- Implement search and discovery

### Dependencies
- Phase 0 completed (authentication, database, UI components)

### Success Criteria
- [ ] Users can create and edit profiles
- [ ] Users can create and manage teams
- [ ] Basic invitation flow functional
- [ ] Dashboards display relevant data
- [ ] Search functionality working

---

## Architecture Updates

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Pages                          │
│  Profile | Dashboard | Teams | Invitations | Search         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   State Management                          │
│      Zustand Stores (User, Team, Invitation)                │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    React Query                              │
│     Caching + Data Fetching + Mutations                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    API Endpoints                            │
│  /users | /teams | /invitations | /search                   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                Service Layer (Business Logic)               │
│  UserService | TeamService | InvitationService              │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Tasks

### Task 1.1: User Profile Management
**Branch:** `feature/1.1-user-profiles`  
**Estimated Time:** 5 days  
**Assignee:** TBD

#### Subtasks
- [ ] Create profile view page
- [ ] Create profile edit page
- [ ] Implement profile picture upload
- [ ] Build skills management
- [ ] Add profile validation
- [ ] Create profile API endpoints
- [ ] Write tests

#### Technical Specifications

**User Service (backend/src/services/user.service.ts):**
```typescript
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export class UserService {
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        avatar: true,
        bio: true,
        skills: true,
        location: true,
        website: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            teamMemberships: true
          }
        }
      }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
  
  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    username?: string;
    bio?: string;
    skills?: string[];
    location?: string;
    website?: string;
  }) {
    // Validate username uniqueness if provided
    if (data.username) {
      const existing = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: userId }
        }
      });
      
      if (existing) {
        throw new Error('Username already taken');
      }
    }
    
    return await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        bio: true,
        skills: true,
        location: true,
        website: true,
        updatedAt: true
      }
    });
  }
  
  async uploadAvatar(userId: string, avatarUrl: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { id: true, avatar: true }
    });
  }
  
  async searchUsers(query: string, filters?: {
    role?: UserRole;
    skills?: string[];
    limit?: number;
  }) {
    const where: any = {
      isActive: true,
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } }
      ]
    };
    
    if (filters?.role) {
      where.role = filters.role;
    }
    
    if (filters?.skills && filters.skills.length > 0) {
      where.skills = { hasSome: filters.skills };
    }
    
    return await prisma.user.findMany({
      where,
      take: filters?.limit || 20,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatar: true,
        bio: true,
        skills: true,
        role: true,
        location: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
```

**Profile API Routes (backend/src/routes/user.routes.ts):**
```typescript
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

router.get('/me', authenticate, userController.getCurrentUser);
router.get('/:userId', userController.getUserProfile);
router.put('/me', authenticate, userController.updateProfile);
router.post('/me/avatar', authenticate, userController.uploadAvatar);
router.get('/search', userController.searchUsers);

export default router;
```

**Profile Page (frontend/src/pages/Profile/ProfilePage.tsx):**
```typescript
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Card,
  CardContent,
  Avatar,
  Typography,
  Chip,
  Box,
  Button,
  Grid
} from '@mui/material';
import { userApi } from '../../services/api/user.api';

export const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getUserById(userId!)
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;
  
  return (
    <Container maxWidth="lg">
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <Avatar
              src={user.avatar}
              sx={{ width: 120, height: 120, mr: 3 }}
            >
              {user.firstName[0]}{user.lastName[0]}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h4">
                {user.firstName} {user.lastName}
              </Typography>
              {user.username && (
                <Typography variant="body2" color="text.secondary">
                  @{user.username}
                </Typography>
              )}
              <Box mt={1}>
                <Chip label={user.role} size="small" />
              </Box>
            </Box>
            <Button variant="contained">Follow</Button>
          </Box>
          
          {user.bio && (
            <Typography variant="body1" paragraph>
              {user.bio}
            </Typography>
          )}
          
          {user.skills && user.skills.length > 0 && (
            <Box mt={2}>
              <Typography variant="h6" gutterBottom>
                Skills
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {user.skills.map(skill => (
                  <Chip key={skill} label={skill} />
                ))}
              </Box>
            </Box>
          )}
          
          <Grid container spacing={2} mt={2}>
            <Grid item xs={4}>
              <Typography variant="h6">{user._count.followers}</Typography>
              <Typography variant="body2" color="text.secondary">
                Followers
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h6">{user._count.following}</Typography>
              <Typography variant="body2" color="text.secondary">
                Following
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h6">{user._count.teamMemberships}</Typography>
              <Typography variant="body2" color="text.secondary">
                Teams
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};
```

#### API Endpoints
- `GET /api/users/:userId` - Get user profile
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile
- `POST /api/users/me/avatar` - Upload avatar
- `GET /api/users/search?q=query` - Search users

#### Acceptance Criteria
- Users can view their profile
- Users can edit profile information
- Avatar upload works
- Skills can be added/removed
- Profile validation works
- All endpoints return correct data

---

### Task 1.2: Team Management
**Branch:** `feature/1.2-team-management`  
**Estimated Time:** 6 days  
**Assignee:** TBD

#### Subtasks
- [ ] Create team creation flow
- [ ] Build team detail page
- [ ] Implement team edit functionality
- [ ] Add team member management
- [ ] Create team roles system
- [ ] Build team API endpoints
- [ ] Write tests

#### Technical Specifications

**Team Service (backend/src/services/team.service.ts):**
```typescript
import { PrismaClient, TeamType, TeamRole } from '@prisma/client';
import { generateSlug } from '../utils/slug';

const prisma = new PrismaClient();

export class TeamService {
  async createTeam(userId: string, data: {
    name: string;
    description?: string;
    type: TeamType;
  }) {
    const slug = await generateSlug(data.name);
    
    // Create team and add creator as owner
    const team = await prisma.team.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        type: data.type,
        members: {
          create: {
            userId,
            role: TeamRole.OWNER
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      }
    });
    
    return team;
  }
  
  async getTeamById(teamId: string, userId?: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                avatar: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            sentInvitations: true,
            receivedInvitations: true
          }
        }
      }
    });
    
    if (!team) {
      throw new Error('Team not found');
    }
    
    // Check if user is member
    if (userId) {
      const isMember = team.members.some(m => m.userId === userId);
      return { ...team, isMember };
    }
    
    return team;
  }
  
  async updateTeam(teamId: string, userId: string, data: {
    name?: string;
    description?: string;
    avatar?: string;
  }) {
    // Check if user is owner or admin
    const member = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        role: { in: [TeamRole.OWNER, TeamRole.ADMIN] }
      }
    });
    
    if (!member) {
      throw new Error('Unauthorized');
    }
    
    const updateData: any = { ...data };
    
    // Generate new slug if name changed
    if (data.name) {
      updateData.slug = await generateSlug(data.name);
    }
    
    return await prisma.team.update({
      where: { id: teamId },
      data: updateData
    });
  }
  
  async addTeamMember(teamId: string, userId: string, newMemberId: string, role: TeamRole = TeamRole.MEMBER) {
    // Check if requester is owner or admin
    const requester = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        role: { in: [TeamRole.OWNER, TeamRole.ADMIN] }
      }
    });
    
    if (!requester) {
      throw new Error('Unauthorized');
    }
    
    // Check if user is already a member
    const existing = await prisma.teamMember.findFirst({
      where: { teamId, userId: newMemberId }
    });
    
    if (existing) {
      throw new Error('User is already a member');
    }
    
    return await prisma.teamMember.create({
      data: {
        teamId,
        userId: newMemberId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });
  }
  
  async removeTeamMember(teamId: string, userId: string, memberIdToRemove: string) {
    // Check if requester is owner or admin
    const requester = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        role: { in: [TeamRole.OWNER, TeamRole.ADMIN] }
      }
    });
    
    if (!requester) {
      throw new Error('Unauthorized');
    }
    
    // Cannot remove owner
    const memberToRemove = await prisma.teamMember.findFirst({
      where: { teamId, userId: memberIdToRemove }
    });
    
    if (memberToRemove?.role === TeamRole.OWNER) {
      throw new Error('Cannot remove team owner');
    }
    
    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId: memberIdToRemove,
          teamId
        }
      }
    });
    
    return { success: true };
  }
  
  async getUserTeams(userId: string) {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });
    
    return memberships.map(m => ({
      ...m.team,
      userRole: m.role,
      joinedAt: m.joinedAt
    }));
  }
}
```

**Team Create Page (frontend/src/pages/Teams/CreateTeamPage.tsx):**
```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box
} from '@mui/material';
import { teamApi } from '../../services/api/team.api';

interface TeamFormData {
  name: string;
  description: string;
  type: 'PROJECT' | 'AGENCY' | 'STARTUP';
}

export const CreateTeamPage: React.FC = () => {
  const navigate = useNavigate();
  const { control, handleSubmit, formState: { errors } } = useForm<TeamFormData>();
  
  const createTeamMutation = useMutation({
    mutationFn: teamApi.createTeam,
    onSuccess: (data) => {
      navigate(`/teams/${data.id}`);
    }
  });
  
  const onSubmit = (data: TeamFormData) => {
    createTeamMutation.mutate(data);
  };
  
  return (
    <Container maxWidth="md">
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Create New Team
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Team name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Team Name"
                  fullWidth
                  margin="normal"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  multiline
                  rows={4}
                  margin="normal"
                />
              )}
            />
            
            <Controller
              name="type"
              control={control}
              rules={{ required: 'Team type is required' }}
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Team Type</InputLabel>
                  <Select {...field} label="Team Type">
                    <MenuItem value="PROJECT">Project</MenuItem>
                    <MenuItem value="AGENCY">Agency</MenuItem>
                    <MenuItem value="STARTUP">Startup</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={createTeamMutation.isPending}
              >
                Create Team
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};
```

#### API Endpoints
- `POST /api/teams` - Create team
- `GET /api/teams/:teamId` - Get team details
- `PUT /api/teams/:teamId` - Update team
- `DELETE /api/teams/:teamId` - Delete team
- `GET /api/teams/my-teams` - Get user's teams
- `POST /api/teams/:teamId/members` - Add team member
- `DELETE /api/teams/:teamId/members/:userId` - Remove member
- `PUT /api/teams/:teamId/members/:userId/role` - Update member role

#### Acceptance Criteria
- Users can create teams
- Team owners can edit team details
- Team admins can manage members
- Member roles enforced correctly
- Teams display member lists
- All CRUD operations work

---

### Task 1.3: Basic Invitation System
**Branch:** `feature/1.3-invitation-system`  
**Estimated Time:** 5 days  
**Assignee:** TBD

#### Subtasks
- [ ] Create invitation service
- [ ] Build send invitation API
- [ ] Build accept/decline invitation API
- [ ] Create invitation UI components
- [ ] Add invitation notifications
- [ ] Implement invitation expiry
- [ ] Write tests

#### Technical Specifications

**Invitation Service (backend/src/services/invitation.service.ts):**
```typescript
import { PrismaClient, InvitationStatus } from '@prisma/client';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

export class InvitationService {
  async sendInvitation(senderId: string, data: {
    receiverId?: string;
    teamId?: string;
    targetTeamId?: string;
    message?: string;
  }) {
    // Validate invitation type
    if (!data.receiverId && !data.targetTeamId) {
      throw new Error('Must specify either receiverId or targetTeamId');
    }
    
    // Check if invitation already exists
    const existing = await prisma.invitation.findFirst({
      where: {
        senderId,
        receiverId: data.receiverId,
        teamId: data.teamId,
        targetTeamId: data.targetTeamId,
        status: InvitationStatus.PENDING
      }
    });
    
    if (existing) {
      throw new Error('Invitation already sent');
    }
    
    // Create invitation with 7 day expiry
    const invitation = await prisma.invitation.create({
      data: {
        senderId,
        receiverId: data.receiverId,
        teamId: data.teamId,
        targetTeamId: data.targetTeamId,
        message: data.message,
        expiresAt: addDays(new Date(), 7),
        status: InvitationStatus.PENDING
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });
    
    // TODO: Send notification
    
    return invitation;
  }
  
  async getInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        team: true,
        targetTeam: true
      }
    });
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    // Check if user is authorized to view
    const isAuthorized = 
      invitation.senderId === userId ||
      invitation.receiverId === userId;
    
    if (!isAuthorized) {
      throw new Error('Unauthorized');
    }
    
    return invitation;
  }
  
  async acceptInvitation(invitationId: string, userId: string) {
    const invitation = await this.getInvitation(invitationId, userId);
    
    // Check if user is receiver
    if (invitation.receiverId !== userId) {
      throw new Error('Only receiver can accept invitation');
    }
    
    // Check if already responded
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error('Invitation already responded to');
    }
    
    // Check if expired
    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.EXPIRED }
      });
      throw new Error('Invitation has expired');
    }
    
    // Update invitation status
    const updated = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.ACCEPTED,
        respondedAt: new Date()
      }
    });
    
    // Add user to team if team invitation
    if (invitation.teamId && invitation.receiverId) {
      await prisma.teamMember.create({
        data: {
          userId: invitation.receiverId,
          teamId: invitation.teamId,
          role: 'MEMBER'
        }
      });
    }
    
    return updated;
  }
  
  async declineInvitation(invitationId: string, userId: string) {
    const invitation = await this.getInvitation(invitationId, userId);
    
    // Check if user is receiver
    if (invitation.receiverId !== userId) {
      throw new Error('Only receiver can decline invitation');
    }
    
    // Check if already responded
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error('Invitation already responded to');
    }
    
    return await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.DECLINED,
        respondedAt: new Date()
      }
    });
  }
  
  async getSentInvitations(userId: string) {
    return await prisma.invitation.findMany({
      where: { senderId: userId },
      include: {
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async getReceivedInvitations(userId: string) {
    return await prisma.invitation.findMany({
      where: {
        receiverId: userId,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() }
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
```

**Invitation Card Component (frontend/src/components/Invitation/InvitationCard.tsx):**
```typescript
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Box,
  Chip
} from '@mui/material';
import { invitationApi } from '../../services/api/invitation.api';

interface InvitationCardProps {
  invitation: {
    id: string;
    sender: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    team?: {
      name: string;
      avatar?: string;
    };
    message?: string;
    createdAt: string;
    status: string;
  };
  type: 'sent' | 'received';
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  type
}) => {
  const queryClient = useQueryClient();
  
  const acceptMutation = useMutation({
    mutationFn: () => invitationApi.acceptInvitation(invitation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'received'] });
      queryClient.invalidateQueries({ queryKey: ['teams', 'my-teams'] });
    }
  });
  
  const declineMutation = useMutation({
    mutationFn: () => invitationApi.declineInvitation(invitation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'received'] });
    }
  });
  
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            src={invitation.sender.avatar}
            sx={{ mr: 2 }}
          >
            {invitation.sender.firstName[0]}
          </Avatar>
          <Box flex={1}>
            <Typography variant="subtitle1">
              {invitation.sender.firstName} {invitation.sender.lastName}
            </Typography>
            {invitation.team && (
              <Typography variant="body2" color="text.secondary">
                invited you to join {invitation.team.name}
              </Typography>
            )}
          </Box>
          <Chip
            label={invitation.status}
            size="small"
            color={invitation.status === 'PENDING' ? 'warning' : 'default'}
          />
        </Box>
        
        {invitation.message && (
          <Typography variant="body2" paragraph>
            {invitation.message}
          </Typography>
        )}
        
        {type === 'received' && invitation.status === 'PENDING' && (
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              size="small"
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
            >
              Accept
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => declineMutation.mutate()}
              disabled={declineMutation.isPending}
            >
              Decline
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
```

#### API Endpoints
- `POST /api/invitations` - Send invitation
- `GET /api/invitations/:id` - Get invitation details
- `POST /api/invitations/:id/accept` - Accept invitation
- `POST /api/invitations/:id/decline` - Decline invitation
- `GET /api/invitations/sent` - Get sent invitations
- `GET /api/invitations/received` - Get received invitations

#### Acceptance Criteria
- Users can send invitations
- Users can accept/decline invitations
- Accepting invitation adds to team
- Invitations expire after 7 days
- Invitation status tracked correctly
- Notifications sent on invitation

---

### Task 1.4: Dashboard Implementation
**Branch:** `feature/1.4-dashboards`  
**Estimated Time:** 4 days  
**Assignee:** TBD

#### Subtasks
- [ ] Create user dashboard layout
- [ ] Build team dashboard layout
- [ ] Add statistics widgets
- [ ] Create recent activity feed
- [ ] Add quick actions
- [ ] Implement data aggregation
- [ ] Write tests

#### Technical Specifications

**Dashboard Service (backend/src/services/dashboard.service.ts):**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardService {
  async getUserDashboard(userId: string) {
    const [
      user,
      teams,
      sentInvitations,
      receivedInvitations,
      recentMessages
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          _count: {
            select: {
              followers: true,
              following: true,
              teamMemberships: true
            }
          }
        }
      }),
      prisma.teamMember.findMany({
        where: { userId },
        take: 5,
        include: {
          team: {
            select: {
              id: true,
              name: true,
              avatar: true,
              _count: {
                select: { members: true }
              }
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      }),
      prisma.invitation.count({
        where: {
          senderId: userId,
          status: 'PENDING'
        }
      }),
      prisma.invitation.count({
        where: {
          receiverId: userId,
          status: 'PENDING'
        }
      }),
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      })
    ]);
    
    return {
      stats: {
        followers: user?._count.followers || 0,
        following: user?._count.following || 0,
        teams: user?._count.teamMemberships || 0,
        pendingSentInvitations: sentInvitations,
        pendingReceivedInvitations: receivedInvitations
      },
      recentTeams: teams.map(t => t.team),
      recentMessages
    };
  }
  
  async getTeamDashboard(teamId: string, userId: string) {
    // Check if user is member
    const member = await prisma.teamMember.findFirst({
      where: { teamId, userId }
    });
    
    if (!member) {
      throw new Error('Not a team member');
    }
    
    const [
      team,
      sentInvitations,
      receivedInvitations
    ] = await Promise.all([
      prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  role: true
                }
              }
            }
          }
        }
      }),
      prisma.invitation.findMany({
        where: {
          teamId,
          status: 'PENDING'
        },
        include: {
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invitation.findMany({
        where: {
          targetTeamId: teamId,
          status: 'PENDING'
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    
    return {
      team,
      stats: {
        members: team?.members.length || 0,
        pendingSentInvitations: sentInvitations.length,
        pendingReceivedInvitations: receivedInvitations.length
      },
      sentInvitations,
      receivedInvitations
    };
  }
}
```

**User Dashboard Page (frontend/src/pages/Dashboard/UserDashboard.tsx):**
```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button
} from '@mui/material';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../services/api/dashboard.api';

export const UserDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'user'],
    queryFn: dashboardApi.getUserDashboard
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Followers
              </Typography>
              <Typography variant="h4">
                {data?.stats.followers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Following
              </Typography>
              <Typography variant="h4">
                {data?.stats.following}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Teams
              </Typography>
              <Typography variant="h4">
                {data?.stats.teams}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending Invitations
              </Typography>
              <Typography variant="h4">
                {data?.stats.pendingReceivedInvitations}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Recent Teams</Typography>
                <Button component={Link} to="/teams">
                  View All
                </Button>
              </Box>
              {data?.recentTeams.map(team => (
                <Box key={team.id} mb={1}>
                  <Typography variant="subtitle1">{team.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {team._count.members} members
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Recent Messages</Typography>
                <Button component={Link} to="/messages">
                  View All
                </Button>
              </Box>
              {data?.recentMessages.slice(0, 5).map(msg => (
                <Box key={msg.id} mb={1}>
                  <Typography variant="body2">
                    {msg.sender.firstName}: {msg.content.substring(0, 50)}...
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
```

#### API Endpoints
- `GET /api/dashboard/user` - Get user dashboard data
- `GET /api/dashboard/team/:teamId` - Get team dashboard data

#### Acceptance Criteria
- Dashboard displays key statistics
- Recent activity shows correctly
- Quick actions functional
- Data loads efficiently
- Dashboard responsive

---

### Task 1.5: Search and Discovery
**Branch:** `feature/1.5-search-discovery`  
**Estimated Time:** 3 days  
**Assignee:** TBD

#### Subtasks
- [ ] Implement user search
- [ ] Implement team search
- [ ] Add filters (role, skills, location)
- [ ] Create search results page
- [ ] Add search suggestions
- [ ] Optimize search queries
- [ ] Write tests

#### Technical Specifications

**Search Service (backend/src/services/search.service.ts):**
```typescript
import { PrismaClient, UserRole, TeamType } from '@prisma/client';

const prisma = new PrismaClient();

export class SearchService {
  async searchAll(query: string, filters?: {
    type?: 'users' | 'teams';
    limit?: number;
  }) {
    const limit = filters?.limit || 20;
    
    if (filters?.type === 'users' || !filters?.type) {
      const users = await this.searchUsers(query, { limit });
      if (filters?.type === 'users') return { users };
    }
    
    if (filters?.type === 'teams' || !filters?.type) {
      const teams = await this.searchTeams(query, { limit });
      if (filters?.type === 'teams') return { teams };
    }
    
    const [users, teams] = await Promise.all([
      this.searchUsers(query, { limit: limit / 2 }),
      this.searchTeams(query, { limit: limit / 2 })
    ]);
    
    return { users, teams };
  }
  
  async searchUsers(query: string, filters?: {
    role?: UserRole;
    skills?: string[];
    location?: string;
    limit?: number;
  }) {
    const where: any = {
      isActive: true,
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } }
      ]
    };
    
    if (filters?.role) {
      where.role = filters.role;
    }
    
    if (filters?.skills && filters.skills.length > 0) {
      where.skills = { hasSome: filters.skills };
    }
    
    if (filters?.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }
    
    return await prisma.user.findMany({
      where,
      take: filters?.limit || 20,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatar: true,
        bio: true,
        skills: true,
        role: true,
        location: true,
        _count: {
          select: {
            followers: true,
            teamMemberships: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async searchTeams(query: string, filters?: {
    type?: TeamType;
    limit?: number;
  }) {
    const where: any = {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    };
    
    if (filters?.type) {
      where.type = filters.type;
    }
    
    return await prisma.team.findMany({
      where,
      take: filters?.limit || 20,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        avatar: true,
        type: true,
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
```

**Search Page (frontend/src/pages/Search/SearchPage.tsx):**
```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  TextField,
  Tabs,
  Tab,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Typography,
  Button
} from '@mui/material';
import { searchApi } from '../../services/api/search.api';
import { useDebounce } from '../../hooks/useDebounce';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState(0);
  const debouncedQuery = useDebounce(query, 300);
  
  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, tab],
    queryFn: () => searchApi.search(debouncedQuery, {
      type: tab === 0 ? undefined : tab === 1 ? 'users' : 'teams'
    }),
    enabled: debouncedQuery.length > 2
  });
  
  return (
    <Container maxWidth="lg">
      <TextField
        fullWidth
        placeholder="Search users, teams..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 3 }}
      />
      
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="All" />
        <Tab label="Users" />
        <Tab label="Teams" />
      </Tabs>
      
      {isLoading && <div>Searching...</div>}
      
      {data && (
        <Grid container spacing={2}>
          {(tab === 0 || tab === 1) && data.users?.map(user => (
            <Grid item xs={12} md={6} key={user.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Avatar src={user.avatar} sx={{ mr: 2 }}>
                      {user.firstName[0]}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle1">
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.role}
                      </Typography>
                    </Box>
                    <Button variant="outlined" size="small">
                      View Profile
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {(tab === 0 || tab === 2) && data.teams?.map(team => (
            <Grid item xs={12} md={6} key={team.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Avatar src={team.avatar} sx={{ mr: 2 }}>
                      {team.name[0]}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle1">
                        {team.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {team._count.members} members
                      </Typography>
                    </Box>
                    <Button variant="outlined" size="small">
                      View Team
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};
```

#### API Endpoints
- `GET /api/search?q=query&type=users|teams` - Search all
- `GET /api/search/users?q=query&role=&skills=` - Search users
- `GET /api/search/teams?q=query&type=` - Search teams

#### Acceptance Criteria
- Search returns relevant results
- Filters work correctly
- Results paginated
- Search debounced for performance
- Empty states handled

---

## Phase 1 Completion Checklist

### Technical Deliverables
- [ ] User profile CRUD complete
- [ ] Team CRUD complete
- [ ] Invitation system functional
- [ ] Dashboards displaying data
- [ ] Search working with filters

### API Endpoints
- [ ] All user endpoints tested
- [ ] All team endpoints tested
- [ ] All invitation endpoints tested
- [ ] All dashboard endpoints tested
- [ ] All search endpoints tested

### Testing
- [ ] Unit tests for all services
- [ ] Integration tests for APIs
- [ ] Component tests for UI
- [ ] E2E tests for critical flows
- [ ] Test coverage >85%

### Documentation
- [ ] API documentation updated
- [ ] Component documentation updated
- [ ] User guides created
- [ ] Developer guides updated

---

## Performance Targets

- API response time: <300ms (p95)
- Page load time: <2s
- Search results: <500ms
- Database queries optimized with indexes

---

## Security Considerations

- Authorization checks on all mutations
- Input validation using Zod
- SQL injection prevention via Prisma
- XSS protection
- Rate limiting on search endpoints

---

**Phase Owner:** Technical Lead  
**Last Updated:** October 2025  
**Next Phase:** Phase 2 - Social & Communication