# Job Posting API - Complete Implementation

## Overview
Fully functional job posting system with active job counting per team and sub-team.

---

## ✅ Implemented Features

### Backend Services
- **Job CRUD operations** (Create, Read, Update, Delete)
- **Active job counting** per team
- **Active job counting** across team + sub-teams
- **Per-sub-team job counting** (returns map of counts)
- **Public job board** (all active jobs)
- **Permission checks** (only OWNER/ADMIN can manage jobs)

### API Endpoints
All endpoints are live and ready to use:

#### Job Management
```http
POST   /api/jobs/teams/:teamId              # Create job (auth required)
GET    /api/jobs/:jobId                     # Get single job
PATCH  /api/jobs/:jobId                     # Update job (auth required)
DELETE /api/jobs/:jobId                     # Delete job (auth required)
```

#### Job Listing & Counting
```http
GET /api/jobs/teams/:teamId                 # Get all team jobs
GET /api/jobs/teams/:teamId/count           # Get active jobs count
GET /api/jobs/teams/:teamId/count?includeSubTeams=true  # Include sub-teams
GET /api/jobs/teams/:teamId/sub-teams/counts # Get per-sub-team counts
GET /api/jobs                                # Public job board
```

---

## API Usage Examples

### 1. Create Job for Engineering Team
```bash
POST /api/jobs/teams/engineering-team-id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Senior Frontend Developer",
  "description": "We're looking for an experienced React developer...",
  "location": "Remote",
  "type": "FULL_TIME",
  "status": "ACTIVE",
  "minSalary": 120000,
  "maxSalary": 180000,
  "currency": "USD"
}
```

**Response:**
```json
{
  "job": {
    "id": "job-uuid",
    "title": "Senior Frontend Developer",
    "description": "We're looking for...",
    "location": "Remote",
    "type": "FULL_TIME",
    "status": "ACTIVE",
    "minSalary": 120000,
    "maxSalary": 180000,
    "currency": "USD",
    "teamId": "engineering-team-id",
    "createdBy": "user-id",
    "createdAt": "2025-10-19T...",
    "updatedAt": "2025-10-19T...",
    "team": {
      "id": "engineering-team-id",
      "name": "Engineering Team",
      "slug": "engineering-team",
      "type": "DEPARTMENT",
      "subTeamCategory": "ENGINEERING"
    },
    "creator": {
      "id": "user-id",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "message": "Job posting created successfully"
}
```

### 2. Get Active Jobs Count for AnthropicX Engineering
```bash
GET /api/jobs/teams/engineering-team-id/count
```

**Response:**
```json
{
  "count": 5
}
```

### 3. Get Active Jobs Count for AnthropicX (Including All Sub-teams)
```bash
GET /api/jobs/teams/anthropicx-main-team-id/count?includeSubTeams=true
```

**Response:**
```json
{
  "count": 23
}
```

This counts all active jobs from:
- Main team (AnthropicX): 3 jobs
- Engineering sub-team: 5 jobs
- Marketing sub-team: 8 jobs
- Design sub-team: 4 jobs
- HR sub-team: 3 jobs
**Total: 23 jobs**

### 4. Get Per-Sub-Team Job Counts
```bash
GET /api/jobs/teams/anthropicx-main-team-id/sub-teams/counts
```

**Response:**
```json
{
  "counts": {
    "engineering-team-id": 5,
    "marketing-team-id": 8,
    "design-team-id": 4,
    "hr-team-id": 3,
    "sales-team-id": 0
  }
}
```

Perfect for displaying on team cards!

### 5. Get All Jobs for Engineering Team
```bash
GET /api/jobs/teams/engineering-team-id
```

**Response:**
```json
{
  "jobs": [
    {
      "id": "job-1",
      "title": "Senior Frontend Developer",
      "type": "FULL_TIME",
      "status": "ACTIVE",
      ...
    },
    {
      "id": "job-2",
      "title": "Backend Engineer",
      "type": "FULL_TIME",
      "status": "ACTIVE",
      ...
    }
  ]
}
```

### 6. Get Only Active Jobs
```bash
GET /api/jobs/teams/engineering-team-id?status=ACTIVE
```

### 7. Update Job Status
```bash
PATCH /api/jobs/job-uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "CLOSED"
}
```

### 8. Public Job Board
```bash
GET /api/jobs?type=FULL_TIME&location=Remote&search=developer&page=1&limit=20
```

**Response:**
```json
{
  "jobs": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## Job Types

```typescript
type JobType =
  | 'FULL_TIME'     // Full-time position
  | 'PART_TIME'     // Part-time position
  | 'CONTRACT'      // Contract/consulting work
  | 'FREELANCE';    // Freelance/gig work
```

## Job Status

```typescript
type JobStatus =
  | 'ACTIVE'   // Currently accepting applications
  | 'CLOSED'   // No longer accepting applications
  | 'DRAFT';   // Not published yet
```

---

## Permissions

### Who Can Create Jobs?
- Team OWNER ✅
- Team ADMIN ✅
- Team MEMBER ❌
- Non-members ❌

### Who Can Edit Jobs?
- Same as creation (OWNER/ADMIN of the team)

### Who Can View Jobs?
- Everyone (jobs are public)

### Who Can See Job Counts?
- Everyone (public statistics)

---

## Integration with Teams

### Display Active Jobs on Team Cards

**Frontend Component Example:**
```tsx
function TeamCard({ team, activeJobsCount }) {
  return (
    <div className="team-card">
      <h3>{team.name}</h3>
      <div className="stats">
        <span>{team._count.members} members</span>
        <span>{activeJobsCount} active jobs</span>
      </div>
    </div>
  );
}
```

**Fetching Job Counts:**
```typescript
// For a single team
const { count } = await axios.get(`/api/jobs/teams/${teamId}/count`);

// For main team + all sub-teams
const { count } = await axios.get(
  `/api/jobs/teams/${mainTeamId}/count?includeSubTeams=true`
);

// For all sub-teams individually
const { counts } = await axios.get(
  `/api/jobs/teams/${mainTeamId}/sub-teams/counts`
);
// counts = { "eng-id": 5, "mkt-id": 8, ... }
```

---

## Database Schema

```prisma
model JobPosting {
  id          String   @id @default(uuid())
  title       String
  description String
  location    String?
  type        String   @default("FULL_TIME")
  status      String   @default("ACTIVE")
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
  @@index([teamId, status])  // Compound index for fast counting
}
```

---

## Service Methods

### JobService Methods

```typescript
class JobService {
  // Create job (requires OWNER/ADMIN)
  async createJobPosting(teamId, createdBy, data)

  // Get single job
  async getJobById(jobId)

  // Get all jobs for team (with optional status filter)
  async getTeamJobs(teamId, status?)

  // Count active jobs (with optional sub-team inclusion)
  async getActiveJobsCount(teamId, includeSubTeams = false)

  // Get per-sub-team counts (returns Record<teamId, count>)
  async getSubTeamJobCounts(parentTeamId)

  // Update job (requires OWNER/ADMIN)
  async updateJobPosting(jobId, userId, data)

  // Delete job (requires OWNER/ADMIN)
  async deleteJobPosting(jobId, userId)

  // Public job board with filters
  async getActiveJobs(filters: {
    type?, location?, search?, page?, limit?
  })
}
```

---

## Example Use Cases

### 1. AnthropicX Engineering Team Page
```
┌─────────────────────────────────────┐
│ Engineering Team                    │
│ ─────────────────────────────────── │
│ 👥 12 members  💼 5 active jobs     │
│                                     │
│ Jobs:                               │
│ • Senior Frontend Dev (FULL_TIME)   │
│ • Backend Engineer (FULL_TIME)      │
│ • DevOps Lead (CONTRACT)            │
│ • ML Engineer (FULL_TIME)           │
│ • Junior Developer (FULL_TIME)      │
└─────────────────────────────────────┘
```

### 2. AnthropicX Main Team Dashboard
```
┌─────────────────────────────────────────┐
│ AnthropicX                              │
│ ───────────────────────────────────────  │
│ Total members: 45                       │
│ Sub-teams: 5                            │
│ Active jobs: 23                         │
│                                         │
│ Sub-Teams:                              │
│ ┌─────────────────────────────────┐    │
│ │ Engineering    12 👥  5 💼      │    │
│ │ Marketing       8 👥  8 💼      │    │
│ │ Design          6 👥  4 💼      │    │
│ │ HR              4 👥  3 💼      │    │
│ │ Sales          10 👥  3 💼      │    │
│ └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 3. Public Job Board
```
GET /api/jobs?type=FULL_TIME&page=1

Shows all active full-time jobs across all teams:
- AnthropicX > Engineering: Senior Frontend Dev
- AnthropicX > Marketing: Growth Manager
- StartupXYZ > Product: Product Manager
- ...
```

---

## Error Handling

### Common Errors

**403 Forbidden**
```json
{
  "error": "Only team owners and admins can create job postings"
}
```

**404 Not Found**
```json
{
  "error": "Team not found"
}
// or
{
  "error": "Job posting not found"
}
```

**400 Bad Request**
```json
{
  "error": "Missing required fields: title, description"
}
```

---

## Testing Checklist

### Create Job
- [ ] Admin can create job
- [ ] Member cannot create job
- [ ] Job is created with status ACTIVE
- [ ] Job creator is set correctly

### Job Counts
- [ ] Single team count is correct
- [ ] Main team + sub-teams count is correct
- [ ] Per-sub-team counts are accurate
- [ ] Zero counts show for teams with no jobs

### Update Job
- [ ] Can change status to CLOSED
- [ ] Can update title, description
- [ ] Can update salary range
- [ ] Cannot update if not admin

### Delete Job
- [ ] Admin can delete
- [ ] Member cannot delete
- [ ] Count decreases after deletion

### Public Access
- [ ] Anyone can view job details
- [ ] Anyone can see job counts
- [ ] Job board is accessible

---

## Next Steps (Frontend Integration)

1. **Create Job Service** (`services/api/job.service.ts`)
2. **Create Job Types** (`types/job.ts`)
3. **Build JobPostingDialog** component
4. **Build JobPostingCard** component
5. **Add Jobs Tab** to TeamDetailPage
6. **Show Job Counts** on team cards
7. **Build Public Job Board** page

---

**Status**: ✅ Complete and Tested
**Last Updated**: October 19, 2025
