# Hierarchical Teams & Job Postings - Feature Documentation

## Overview
This document describes the hierarchical team structure implementation that allows team admins to create and manage sub-teams under main teams, along with a basic job posting feature for tracking active opportunities.

---

## 1. Core Concepts

### Main Teams
- **Definition**: Top-level teams that can contain sub-teams
- **Identification**: `isMainTeam = true`, `parentTeamId = null`
- **Types**: COMPANY, ORGANIZATION, TEAM, DEPARTMENT
- **Purpose**: Organizational structure representing the primary entity

### Sub-Teams
- **Definition**: Teams created under a main team (e.g., Marketing, Engineering, HR under AnthropicX)
- **Identification**: `isMainTeam = false`, `parentTeamId = <main-team-id>`
- **Constraints**: Can only be created under main teams (no nested sub-teams)
- **Inheritance**: Members of main team can see sub-teams; sub-team members don't automatically join main team

### Team Types (Updated)
**Old Types** (Deprecated):
- PROJECT → Now: TEAM
- AGENCY → Now: ORGANIZATION
- STARTUP → Now: COMPANY

**New Types**:
- `COMPANY` - For businesses and startups
- `ORGANIZATION` - For agencies and non-profits
- `TEAM` - For project teams and working groups
- `DEPARTMENT` - For organizational departments

---

## 2. Database Schema

### Team Model Changes
```prisma
model Team {
  id              String           @id @default(uuid())
  name            String
  slug            String           @unique
  description     String?
  avatar          String?
  type            String           @default("TEAM")  // Changed from "PROJECT"
  city            String?
  ownerId         String
  parentTeamId    String?          // NEW: Links to parent team
  isMainTeam      Boolean          @default(true)    // NEW: Main vs sub-team flag
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  // Relations
  invitations     Invitation[]
  messages        Message[]
  projects        Project[]
  jobPostings     JobPosting[]     // NEW
  owner           User             @relation("TeamOwner", fields: [ownerId], references: [id])
  members         TeamMember[]
  recommendations Recommendation[]
  parentTeam      Team?            @relation("TeamHierarchy", fields: [parentTeamId], references: [id], onDelete: Cascade)
  subTeams        Team[]           @relation("TeamHierarchy")

  @@index([parentTeamId])          // NEW
}
```

### JobPosting Model (NEW)
```prisma
model JobPosting {
  id          String   @id @default(uuid())
  title       String
  description String
  location    String?
  type        String   @default("FULL_TIME") // FULL_TIME, PART_TIME, CONTRACT, FREELANCE
  status      String   @default("ACTIVE")    // ACTIVE, CLOSED, DRAFT
  minSalary   Int?
  maxSalary   Int?
  currency    String?  @default("USD")
  teamId      String
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  creator     User     @relation(fields: [createdBy], references: [id])

  @@index([teamId])
  @@index([createdBy])
  @@index([status])
  @@index([teamId, status])
}
```

---

## 3. Permissions & Access Control

### Who Can Create Sub-Teams?
- **Main Team Owners**: Yes
- **Main Team Admins**: Yes
- **Main Team Members**: No
- **Non-members**: No

### Who Can Add Members to Sub-Teams?
- **Sub-team Owners**: Yes
- **Sub-team Admins**: Yes
- **Main Team Admins**: Yes (can add from main team members)

### Who Can Post Jobs?
- **Team Owners**: Yes
- **Team Admins**: Yes
- **Team Members**: No

### Visibility Rules
- **Main Team Members**: Can see all sub-teams and their details
- **Sub-Team Members**: Can see their sub-team and parent team (if member of parent)
- **Public Users**: Can see total sub-teams count, total members count, active jobs count (numbers only, not details)

---

## 4. User Flows

### Creating a Sub-Team

**Prerequisites**:
- User must be OWNER or ADMIN of a main team
- Parent team must have `isMainTeam = true`

**Steps**:
1. Navigate to Main Team detail page
2. Click "Create Sub-Team" button (visible only to admins/owners)
3. Fill out form:
   - Name (required)
   - Description (optional)
   - Type: DEPARTMENT (or TEAM, ORGANIZATION)
   - Avatar (optional)
4. Submit → Sub-team is created with:
   - `parentTeamId` = main team ID
   - `isMainTeam` = false
   - Creator becomes OWNER of sub-team
   - Creator automatically added as sub-team member

**Backend Validation**:
```typescript
// Check parent team exists
// Check user is admin of parent
// Check parent is main team (not sub-team)
// Create sub-team with parentTeamId
```

### Adding Members to Sub-Teams

**Two Methods**:

#### Method 1: From Main Team Members
1. Open sub-team detail page
2. Click "Add Member"
3. Select "From Main Team" tab
4. View list of main team members
5. Select member(s) to add
6. Choose role (MEMBER or ADMIN)
7. Submit → Members instantly added (no invitation needed)

#### Method 2: Invite by Email/Username
1. Open sub-team detail page
2. Click "Add Member"
3. Select "Invite New" tab
4. Search by username or enter email
5. Select user from search results
6. Choose role (MEMBER or ADMIN)
7. Add optional message
8. Send Invitation → User receives invite notification

**Note**: Email invitations create pending invitations that users must accept. Users invited by email who aren't registered must sign up first.

### Posting a Job

**Prerequisites**:
- User must be OWNER or ADMIN of the team
- Works for both main teams and sub-teams

**Steps**:
1. Navigate to Team detail page
2. Go to "Jobs" tab
3. Click "Post Job"
4. Fill out form:
   - Title (required)
   - Description (required)
   - Location (optional)
   - Job Type: FULL_TIME, PART_TIME, CONTRACT, or FREELANCE
   - Salary Range (optional)
   - Currency (default: USD)
   - Status: ACTIVE or DRAFT
5. Submit → Job is created and appears in team's job list

**Job Management**:
- Edit: Update any field
- Close: Change status to CLOSED
- Delete: Remove permanently
- View: See full details + applicants (future)

### Viewing Team Hierarchy

**For Main Team Members**:
- Main team page shows "Sub-Teams" section
- Grid of sub-team cards with:
  - Sub-team name and avatar
  - Member count
  - Member avatars (first 3)
  - Admin badges
- Click card → Navigate to sub-team detail
- Breadcrumb: AnthropicX > Marketing

**For Public Users**:
- Team stats section shows:
  - Total sub-teams: 4
  - Total team size: 23 (includes all sub-team members)
  - Active jobs: 7 (across all sub-teams)
- Cannot see sub-team names or details

---

## 5. API Endpoints

### Sub-Team Endpoints

#### Create Sub-Team
```
POST /api/teams/:parentTeamId/sub-teams
Authorization: Bearer <token>
Body: {
  "name": "Marketing Team",
  "description": "Handles all marketing activities",
  "type": "DEPARTMENT",
  "avatar": "https://...",
  "city": "San Francisco"
}
Response: { team: {...} }
```

#### Get Sub-Teams
```
GET /api/teams/:teamId/sub-teams
Authorization: Bearer <token>
Response: { subTeams: [...] }
```

#### Get Team Hierarchy
```
GET /api/teams/:teamId/hierarchy
Response: {
  team: {...},
  subTeams: [
    { id, name, memberCount, ... },
    ...
  ],
  totalMembers: 23,
  activeJobs: 7
}
```

#### Get Team Stats
```
GET /api/teams/:teamId/stats
Response: {
  subTeamsCount: 4,
  totalMembers: 23,
  activeJobsCount: 7,
  mainTeamMembers: 8,
  subTeamMembers: 15
}
```

### Job Posting Endpoints

#### Create Job
```
POST /api/teams/:teamId/jobs
Authorization: Bearer <token>
Body: {
  "title": "Senior Frontend Developer",
  "description": "We're looking for...",
  "location": "Remote",
  "type": "FULL_TIME",
  "minSalary": 120000,
  "maxSalary": 180000,
  "currency": "USD",
  "status": "ACTIVE"
}
Response: { job: {...} }
```

#### Get Team Jobs
```
GET /api/teams/:teamId/jobs?status=ACTIVE
Response: { jobs: [...] }
```

#### Get Job Details
```
GET /api/jobs/:jobId
Response: { job: {...}, team: {...} }
```

#### Update Job
```
PATCH /api/jobs/:jobId
Authorization: Bearer <token>
Body: { "status": "CLOSED" }
Response: { job: {...} }
```

#### Delete Job
```
DELETE /api/jobs/:jobId
Authorization: Bearer <token>
Response: { message: "Job deleted" }
```

---

## 6. Frontend Components

### New Components

#### SubTeamCard
**Location**: `components/SubTeamCard.tsx`
**Purpose**: Display sub-team in grid layout
**Props**:
- `subTeam`: SubTeam object
- `onClick`: Navigate to sub-team

**Features**:
- Shows avatar, name, member count
- Displays first 3 member avatars
- Admin/Owner badges
- Hover effects

#### SubTeamDialog
**Location**: `components/SubTeamDialog.tsx`
**Purpose**: Create new sub-team
**Props**:
- `open`: boolean
- `onOpenChange`: (open: boolean) => void
- `parentTeamId`: string
- `onSuccess`: () => void

**Fields**:
- Name (text input)
- Description (textarea)
- Type (select: DEPARTMENT, TEAM, etc.)
- Avatar URL (text input)

#### JobPostingDialog
**Location**: `components/JobPostingDialog.tsx`
**Purpose**: Create/edit job posting
**Props**:
- `open`: boolean
- `onOpenChange`: (open: boolean) => void
- `teamId`: string
- `job`: JobPosting | null (for editing)
- `onSuccess`: () => void

**Fields**:
- Title, Description
- Location, Type
- Salary range (min/max)
- Currency, Status

#### JobPostingCard
**Location**: `components/JobPostingCard.tsx`
**Purpose**: Display job in list
**Props**:
- `job`: JobPosting
- `canEdit`: boolean
- `onEdit`: () => void
- `onDelete`: () => void

**Features**:
- Shows title, type, location
- Salary range badge
- Status indicator
- Edit/Delete buttons (if canEdit)

### Updated Components

#### TeamDetailPage
**New Sections**:
1. **Sub-Teams Tab** (for main teams):
   - Grid of SubTeamCard components
   - "Create Sub-Team" button (admins only)
   - Shows sub-team stats

2. **Jobs Tab**:
   - List of JobPostingCard components
   - "Post Job" button (admins only)
   - Filter by status (Active/Closed)

3. **Breadcrumb** (for sub-teams):
   - Shows: Main Team > Sub-Team
   - Clickable navigation

4. **Stats Section**:
   - Public view: Show totals only
   - Member view: Show detailed breakdowns

#### CreateTeamPage
**New Features**:
- Updated team type dropdown (COMPANY, ORGANIZATION, TEAM, DEPARTMENT)
- Optional "Parent Team" selection:
  - Only shown if user is admin of any team
  - Dropdown lists teams where user is OWNER/ADMIN
  - If selected, creates sub-team

#### AddMemberDialog (Enhanced)
**New Tab**: "From Main Team"
- Lists all main team members
- Similar to contributor selection flow
- Instant add (no invitation)
- Only available when adding to sub-teams

---

## 7. Frontend Services

### Team Service Updates
**File**: `services/api/team.service.ts`

```typescript
// New methods
async createSubTeam(parentTeamId: string, data: CreateTeamRequest) {
  return api.post(`/api/teams/${parentTeamId}/sub-teams`, data);
}

async getSubTeams(teamId: string) {
  return api.get(`/api/teams/${teamId}/sub-teams`);
}

async getTeamHierarchy(teamId: string) {
  return api.get(`/api/teams/${teamId}/hierarchy`);
}

async getTeamStats(teamId: string) {
  return api.get(`/api/teams/${teamId}/stats`);
}
```

### Job Service (NEW)
**File**: `services/api/job.service.ts`

```typescript
export const jobService = {
  async createJob(teamId: string, data: CreateJobRequest) {
    return api.post(`/api/teams/${teamId}/jobs`, data);
  },

  async getTeamJobs(teamId: string, status?: JobStatus) {
    const params = status ? { status } : {};
    return api.get(`/api/teams/${teamId}/jobs`, { params });
  },

  async getJob(jobId: string) {
    return api.get(`/api/jobs/${jobId}`);
  },

  async updateJob(jobId: string, data: UpdateJobRequest) {
    return api.patch(`/api/jobs/${jobId}`, data);
  },

  async deleteJob(jobId: string) {
    return api.delete(`/api/jobs/${jobId}`);
  },
};
```

---

## 8. Backend Services

### Team Service Methods (NEW/UPDATED)

```typescript
// In team.service.ts

// Updated to support parentTeamId
async createTeam(ownerId: string, data: CreateTeamData) {
  // Validates parent team if parentTeamId provided
  // Ensures user is admin of parent
  // Sets isMainTeam based on parentTeamId
}

// New method
async getSubTeams(teamId: string) {
  return prisma.team.findMany({
    where: { parentTeamId: teamId },
    include: {
      members: true,
      _count: { select: { members: true, jobPostings: true } }
    }
  });
}

// New method
async getTeamHierarchy(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      subTeams: {
        include: {
          _count: { select: { members: true } }
        }
      },
      _count: { select: { members: true, jobPostings: true } }
    }
  });

  // Calculate total members across sub-teams
  const totalMembers = team._count.members +
    team.subTeams.reduce((sum, sub) => sum + sub._count.members, 0);

  return { team, totalMembers };
}

// New method
async canManageSubTeams(userId: string, teamId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } }
  });
  return member && ['OWNER', 'ADMIN'].includes(member.role);
}
```

### Job Service (NEW)
**File**: `services/job.service.ts`

```typescript
export class JobService {
  async createJobPosting(teamId: string, createdBy: string, data: CreateJobData) {
    // Verify user is admin of team
    const canManage = await this.canManageJobs(createdBy, teamId);
    if (!canManage) throw new Error('Only admins can create jobs');

    return prisma.jobPosting.create({
      data: {
        ...data,
        teamId,
        createdBy,
      },
      include: { team: true, creator: { select: { id: true, username: true } } }
    });
  }

  async getTeamJobs(teamId: string, status?: string) {
    return prisma.jobPosting.findMany({
      where: {
        teamId,
        ...(status && { status })
      },
      include: { creator: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getActiveJobsCount(teamId: string, includeSubTeams = false) {
    if (!includeSubTeams) {
      return prisma.jobPosting.count({
        where: { teamId, status: 'ACTIVE' }
      });
    }

    // Get main team + all sub-teams
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { subTeams: { select: { id: true } } }
    });

    const teamIds = [teamId, ...team.subTeams.map(st => st.id)];

    return prisma.jobPosting.count({
      where: { teamId: { in: teamIds }, status: 'ACTIVE' }
    });
  }

  private async canManageJobs(userId: string, teamId: string) {
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } }
    });
    return member && ['OWNER', 'ADMIN'].includes(member.role);
  }
}
```

---

## 9. Frontend Types

### Team Types Update
**File**: `types/team.ts`

```typescript
export type TeamType = 'COMPANY' | 'ORGANIZATION' | 'TEAM' | 'DEPARTMENT';

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: TeamType;
  avatar?: string;
  city?: string;
  ownerId: string;
  parentTeamId?: string;     // NEW
  isMainTeam: boolean;       // NEW
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    projects: number;
    subTeams?: number;       // NEW
    jobPostings?: number;    // NEW
  };
}

export interface SubTeam extends Team {
  parentTeamId: string;
  isMainTeam: false;
}
```

### Job Types (NEW)
**File**: `types/job.ts`

```typescript
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE';
export type JobStatus = 'ACTIVE' | 'CLOSED' | 'DRAFT';

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  location?: string;
  type: JobType;
  status: JobStatus;
  minSalary?: number;
  maxSalary?: number;
  currency: string;
  teamId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  team?: Team;
  creator?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface CreateJobRequest {
  title: string;
  description: string;
  location?: string;
  type: JobType;
  status?: JobStatus;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
}
```

---

## 10. Migration Guide

### Database Migration
1. **Run Prisma migration**:
   ```bash
   cd packages/backend
   npx prisma db push
   ```

2. **Run type conversion script**:
   ```bash
   npx tsx scripts/migrate-team-types.ts
   ```

   This will convert:
   - PROJECT → TEAM
   - AGENCY → ORGANIZATION
   - STARTUP → COMPANY

3. **Verify migration**:
   - All existing teams will have `isMainTeam = true`
   - All existing teams will have `parentTeamId = null`
   - Team types will be updated

### Code Migration
- **Team types**: Update any hardcoded team type references
- **Forms**: Update team type dropdowns in CreateTeamPage
- **Filters**: Update team search filters to use new types

---

## 11. Testing Checklist

### Sub-Team Creation
- [ ] Admin can create sub-team under main team
- [ ] Member cannot create sub-team
- [ ] Cannot create sub-team under another sub-team
- [ ] Sub-team creator becomes OWNER
- [ ] Sub-team has `isMainTeam = false`

### Member Management
- [ ] Can add main team member to sub-team
- [ ] Can invite new user to sub-team
- [ ] Main team admin can manage sub-team members
- [ ] Sub-team member doesn't auto-join main team

### Job Postings
- [ ] Admin can create job
- [ ] Member cannot create job
- [ ] Can edit own team's jobs
- [ ] Can filter jobs by status
- [ ] Active jobs count is correct

### Visibility
- [ ] Main team members see all sub-teams
- [ ] Public users see only counts
- [ ] Sub-team members see their team + parent (if member)

### Hierarchy Display
- [ ] Sub-team shows breadcrumb
- [ ] Main team shows sub-teams grid
- [ ] Stats calculate correctly

---

## 12. Future Enhancements

### Phase 2 Features
- Job application tracking
- Email notifications for job postings
- Sub-team activity feed
- Team analytics dashboard
- Advanced permission granularity

### Possible Extensions
- Multi-level hierarchy (sub-sub-teams)
- Cross-team collaboration tools
- Team templates
- Bulk member operations
- Team migration/merging

---

## 13. Database Entity Relationships

```
User
  └─ owns → Team (as ownerId)
  └─ member of → TeamMember
  └─ creates → JobPosting (as createdBy)

Team (Main)
  └─ has → Team[] (as subTeams via parentTeamId)
  └─ has → TeamMember[]
  └─ has → JobPosting[]
  └─ belongs to → Team (as parentTeam via parentTeamId) [for sub-teams]

TeamMember
  └─ belongs to → User
  └─ belongs to → Team

JobPosting
  └─ belongs to → Team
  └─ created by → User
```

---

## 14. Key Constraints

1. **Sub-team depth**: Only one level (main → sub, no sub → sub-sub)
2. **Admin requirement**: Must be admin to create sub-teams
3. **Main team flag**: Sub-teams cannot become main teams
4. **Cascade deletion**: Deleting main team deletes all sub-teams
5. **Job permissions**: Only admins can manage jobs

---

## 15. Implementation Status

### ✅ Completed
- Database schema updates
- Prisma migration
- Type conversion script
- Team service sub-team support (createTeam updated)
- Documentation

### 🚧 In Progress
- Team service complete methods (getSubTeams, getHierarchy, etc.)
- Job service implementation
- API routes and controllers
- Frontend type updates

### ⏳ Pending
- Frontend services
- UI components
- Team detail page updates
- Create team page updates
- E2E testing

---

## Support & Questions

For implementation questions or issues:
1. Check this documentation first
2. Review API endpoint examples
3. Test with included migration scripts
4. Verify permissions match requirements

---

**Last Updated**: October 19, 2025
**Version**: 1.0
**Status**: Schema Complete, Implementation In Progress
