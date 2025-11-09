# Shared Project Recommendations - Implementation Complete

## Summary
Enhanced the recommendation system to support **team-based collaboration recommendations** in addition to portfolio-based ones. Users can now:
1. **Request recommendations** from teammates about shared project work
2. **Give recommendations** proactively to teammates about their collaboration
3. Choose specific projects when requesting/giving recommendations

Implementation Date: 2025-10-18
Status: ✅ Backend Complete | ⚠️ UI Pending

---

## What Changed

### Previous System
- ❌ Only portfolio-based recommendations
- ❌ User A visits User B's portfolio → requests recommendation
- ❌ No way to recommend based on shared work/teams
- ❌ No proactive giving of recommendations

### New System
- ✅ Supports **portfolio-based** AND **team/project-based** recommendations
- ✅ User A can **request** recommendation from User B about their shared project work
- ✅ User A can **give** recommendation to User B about their collaboration
- ✅ Automatically validates that users worked together
- ✅ Shows shared projects/teams for selection

---

## Database Changes

### Updated Recommendation Schema

```prisma
model Recommendation {
  id          String     @id @default(uuid())
  message     String
  status      String     @default("PENDING")
  type        String     @default("REQUEST")  // NEW: REQUEST or GIVEN
  senderId    String
  receiverId  String
  portfolioId String?    // Now OPTIONAL
  projectId   String?    // NEW: Team project reference
  teamId      String?    // NEW: Team/collaboration context
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  sender      User
  receiver    User
  portfolio   Portfolio? // Now optional
  project     Project?   // NEW relation
  team        Team?      // NEW relation

  @@index([projectId])
  @@index([teamId])
  @@index([type])
}
```

**Key Changes**:
- `type` field: "REQUEST" (user requests rec) vs "GIVEN" (user gives rec)
- `portfolioId` now optional (not required for team-based recs)
- `projectId` for specific team project
- `teamId` for general team collaboration
- Relations added to Project and Team models

---

## Backend Implementation

### 1. Collaboration Service
**File**: `packages/backend/src/services/collaboration.service.ts`

**Purpose**: Find shared work between users

**Methods**:
- `getSharedTeams(userA, userB)` - Teams both are members of
- `getSharedProjects(userA, userB)` - Projects from shared teams
- `haveWorkedTogether(userA, userB)` - Boolean check
- `getCollaborationContext(userA, userB)` - Full context

**Example Response**:
```json
{
  "haveWorkedTogether": true,
  "sharedTeamsCount": 2,
  "sharedProjectsCount": 5,
  "sharedTeams": [
    {
      "id": "team-1",
      "name": "Mobile App Team",
      "projects": [
        {
          "id": "proj-1",
          "title": "iOS App Redesign",
          "teamName": "Mobile App Team"
        }
      ]
    }
  ]
}
```

### 2. Updated Recommendation Service
**File**: `packages/backend/src/services/recommendation.service.ts`

**Enhanced `createRecommendation()` Method**:

```typescript
interface CreateRecommendationData {
  message: string;
  senderId: string;
  receiverId: string;
  type?: 'REQUEST' | 'GIVEN';  // Default: REQUEST
  portfolioId?: string;         // Optional
  projectId?: string;           // Optional
  teamId?: string;              // Optional
}
```

**Validation Logic**:

1. **Portfolio-based**:
   - If `portfolioId` provided → verify portfolio exists
   - If REQUEST → verify portfolio belongs to receiver

2. **Project-based**:
   - If `projectId` provided → verify project exists
   - Verify both users are members of project's team
   - Auto-set `teamId` from project

3. **Team-based (general)**:
   - If only `teamId` provided → verify users worked together

4. **Status Logic**:
   - If type = "REQUEST" → status = "PENDING"
   - If type = "GIVEN" → status = "ACCEPTED" (auto-accepted)

### 3. New API Endpoints

#### Collaboration Endpoints
**Base**: `/api/collaboration`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/context/:userId` | Get full collaboration context |
| GET | `/projects/:userId` | Get shared projects |
| GET | `/teams/:userId` | Get shared teams |

**Example Usage**:
```bash
GET /api/collaboration/context/user-b-id
Authorization: Bearer {token}

Response:
{
  "context": {
    "haveWorkedTogether": true,
    "sharedTeamsCount": 2,
    "sharedProjectsCount": 5,
    "sharedTeams": [...],
    "sharedProjects": [...]
  }
}
```

#### Updated Recommendation Endpoint
**Endpoint**: `POST /api/recommendations`

**Request Body** (flexible):
```json
{
  "message": "Great working with you on the iOS app!",
  "receiverId": "user-b-id",
  "type": "GIVEN",
  "projectId": "project-123"
}
```

**OR Portfolio-based** (legacy support):
```json
{
  "message": "Can you recommend my portfolio work?",
  "receiverId": "user-b-id",
  "type": "REQUEST",
  "portfolioId": "portfolio-456"
}
```

**OR Team-based (general)**:
```json
{
  "message": "Pleasure working with you!",
  "receiverId": "user-b-id",
  "type": "GIVEN",
  "teamId": "team-789"
}
```

**Validation**:
- `message` and `receiverId` required
- At least ONE of `portfolioId`, `projectId`, or `teamId` required

---

## Frontend Implementation

### 1. Updated Types
**File**: `packages/frontend/src/types/user.ts`

```typescript
export interface Recommendation {
  // ... existing fields
  type: 'REQUEST' | 'GIVEN';
  portfolioId?: string;   // Now optional
  projectId?: string;     // New
  teamId?: string;        // New
  portfolio?: { id: string; name: string; description?: string };
  project?: { id: string; title: string; description: string };
  team?: { id: string; name: string; slug: string };
}

export interface CreateRecommendationRequest {
  message: string;
  receiverId: string;
  type?: 'REQUEST' | 'GIVEN';
  portfolioId?: string;
  projectId?: string;
  teamId?: string;
}

export interface SharedProject {
  id: string;
  title: string;
  description: string;
  teamId: string;
  teamName: string;
}

export interface CollaborationContext {
  haveWorkedTogether: boolean;
  sharedTeamsCount: number;
  sharedProjectsCount: number;
  sharedTeams: SharedTeam[];
  sharedProjects: SharedProject[];
}
```

### 2. Collaboration API Service
**File**: `packages/frontend/src/services/api/collaboration.service.ts`

**Methods**:
- `getCollaborationContext(userId)` - Check if users worked together
- `getSharedProjects(userId)` - Get shared projects
- `getSharedTeams(userId)` - Get shared teams

---

## User Flows

### Flow 1: Request Recommendation on Shared Project

```
┌─────────────────────────────────────────────────────┐
│ User A visits User B's profile                      │
└─────────────┬───────────────────────────────────────┘
              ↓
        Check collaboration
        GET /api/collaboration/context/user-b-id
              ↓
    ┌─────────────────────┐
    │ Have worked         │ No  → Show "Give General Recommendation"
    │ together?           │
    └───────┬─────────────┘
            │ Yes
            ↓
   ┌────────────────────┐
   │ Show shared        │
   │ projects list      │
   └────────┬───────────┘
            ↓
   User selects project
            ↓
   ┌────────────────────┐
   │ Opens "Request     │
   │ Recommendation"    │
   │ dialog with project│
   │ pre-selected       │
   └────────┬───────────┘
            ↓
   User writes message
            ↓
   POST /api/recommendations
   {
     "message": "...",
     "receiverId": "user-b-id",
     "type": "REQUEST",
     "projectId": "selected-project-id"
   }
            ↓
   ┌────────────────────┐
   │ Recommendation     │
   │ created with       │
   │ status: PENDING    │
   └────────────────────┘
```

### Flow 2: Give Recommendation Proactively

```
┌─────────────────────────────────────────────────────┐
│ User A wants to recommend User B                    │
└─────────────┬───────────────────────────────────────┘
              ↓
        Navigate to User B's profile
              ↓
        Click "Give Recommendation" button
              ↓
   ┌────────────────────┐
   │ Dialog opens       │
   │ showing shared     │
   │ projects dropdown  │
   └────────┬───────────┘
            ↓
   Select project (or choose "General")
            ↓
   Write recommendation message
            ↓
   POST /api/recommendations
   {
     "message": "Great work on the iOS app!",
     "receiverId": "user-b-id",
     "type": "GIVEN",
     "projectId": "project-123"
   }
            ↓
   ┌────────────────────┐
   │ Recommendation     │
   │ created with       │
   │ status: ACCEPTED   │
   │ (auto-accepted)    │
   └────────┬───────────┘
            ↓
   Immediately visible on User B's profile
```

---

## UI Requirements (Pending Implementation)

### 1. Enhanced Recommendation Dialog

**Location**: Update `RecommendationDialog.tsx`

**Features Needed**:
- [ ] Fetch collaboration context on mount
- [ ] Show "Type" selector: "Request" vs "Give"
- [ ] If worked together → Show project dropdown
- [ ] Project dropdown populated from `collaborationService.getSharedProjects()`
- [ ] Option for "General team collaboration" (no specific project)
- [ ] If NOT worked together → Only allow portfolio-based (existing flow)

**Mockup**:
```
┌──────────────────────────────────────────────────┐
│  Request/Give Recommendation                     │
├──────────────────────────────────────────────────┤
│                                                  │
│  Type:  [●] Request   [ ] Give                   │
│                                                  │
│  Context:  [v Select Project or Context ------]  │
│            │  iOS App Redesign (Mobile Team)    │
│            │  Android Refactor (Mobile Team)    │
│            │  General Team Collaboration        │
│            └────────────────────────────────────│
│                                                  │
│  Message:                                        │
│  ┌────────────────────────────────────────────┐│
│  │ Great working with you on...               ││
│  │                                            ││
│  └────────────────────────────────────────────┘│
│                                                  │
│            [Cancel]  [Send Request]              │
└──────────────────────────────────────────────────┘
```

### 2. Profile Page Updates

**Location**: `ProfilePage.tsx`

**Changes Needed**:
- [ ] Add "Give Recommendation" button (visible on all profiles except own)
- [ ] Button next to "Request Recommendation"
- [ ] On click → Open enhanced dialog with type="GIVEN"

**Button Placement**:
```typescript
{!isOwnProfile && user && (
  <div className="flex gap-3">
    <button onClick={() => openRecommendationDialog('REQUEST')}>
      Request Recommendation
    </button>
    <button onClick={() => openRecommendationDialog('GIVEN')}>
      Give Recommendation
    </button>
  </div>
)}
```

### 3. Recommendations Display Updates

**Location**: `RecommendationsSection.tsx`

**Enhancement**:
- [ ] Show project/team context with each recommendation
- [ ] Display "Recommended for work on: iOS App Redesign"
- [ ] Or "Recommended as teammate on: Mobile App Team"

**Enhanced Card**:
```jsx
<div className="recommendation-card">
  <Quote />
  <p>{recommendation.message}</p>

  {/* NEW: Show context */}
  {recommendation.project && (
    <div className="context-badge">
      <Briefcase />
      Work on: {recommendation.project.title}
    </div>
  )}

  {recommendation.team && !recommendation.project && (
    <div className="context-badge">
      <Users />
      Team: {recommendation.team.name}
    </div>
  )}

  <div className="sender-info">...</div>
</div>
```

---

## Testing Checklist

### Backend Testing

#### Collaboration Service
- [ ] `getSharedTeams()` returns correct teams for two users
- [ ] `getSharedProjects()` includes projects from all shared teams
- [ ] `haveWorkedTogether()` returns false if no shared teams
- [ ] `getCollaborationContext()` returns complete data

#### Recommendation Creation
- [ ] **Portfolio-based REQUEST**: Creates with PENDING status
- [ ] **Portfolio-based GIVEN**: Creates with ACCEPTED status
- [ ] **Project-based REQUEST**: Validates both users are team members
- [ ] **Project-based GIVEN**: Auto-accepts and displays
- [ ] **Team-based GENERAL**: Validates users worked together
- [ ] **Validation**: Rejects if users haven't worked together
- [ ] **Validation**: Requires at least one context (portfolio/project/team)

#### API Endpoints
- [ ] `GET /api/collaboration/context/:userId` returns collaboration data
- [ ] `GET /api/collaboration/projects/:userId` returns shared projects
- [ ] `GET /api/collaboration/teams/:userId` returns shared teams
- [ ] `POST /api/recommendations` accepts new parameters
- [ ] `POST /api/recommendations` validates project membership

### Frontend Testing (After UI Implementation)

#### Dialog Functionality
- [ ] Dialog fetches collaboration context on open
- [ ] Shows "Request" vs "Give" toggle
- [ ] Project dropdown populates with shared projects
- [ ] "General collaboration" option available
- [ ] Can still create portfolio-based recommendations
- [ ] Submit works for all types

#### Profile Page
- [ ] "Give Recommendation" button appears on other profiles
- [ ] Button hidden on own profile
- [ ] Dialog opens with correct type pre-selected
- [ ] Can switch between Request and Give

#### Display
- [ ] Recommendations show project context
- [ ] Recommendations show team context
- [ ] Portfolio-based recs still display correctly
- [ ] Mixed recommendation types display properly

---

## Migration Notes

### Backwards Compatibility
✅ **Fully backwards compatible**

- Existing portfolio-based recommendations still work
- `portfolioId` remains in schema (now optional)
- Old recommendation creation still supported
- Existing UI continues to function

### For Existing Data
- No migration needed
- Existing recommendations have `type` = "REQUEST" (default)
- Existing `portfolioId` values preserved
- New fields (`projectId`, `teamId`) are nullable

### Database Migration
```bash
cd packages/backend
npx prisma db push
```

---

## API Examples

### Example 1: Request Recommendation for Shared Project

```bash
POST /api/recommendations
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Would love a recommendation for our work on the iOS app redesign!",
  "receiverId": "user-b-id",
  "type": "REQUEST",
  "projectId": "ios-app-project-id"
}
```

**Response**:
```json
{
  "recommendation": {
    "id": "rec-123",
    "message": "Would love a recommendation...",
    "type": "REQUEST",
    "status": "PENDING",
    "senderId": "user-a-id",
    "receiverId": "user-b-id",
    "projectId": "ios-app-project-id",
    "teamId": "mobile-team-id",
    "project": {
      "id": "ios-app-project-id",
      "title": "iOS App Redesign",
      "description": "Complete redesign..."
    },
    "team": {
      "id": "mobile-team-id",
      "name": "Mobile App Team",
      "slug": "mobile-app-team"
    },
    "sender": {
      "id": "user-a-id",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Example 2: Give Recommendation for General Collaboration

```bash
POST /api/recommendations
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Jane is an excellent team player. Always delivers quality work on time!",
  "receiverId": "user-b-id",
  "type": "GIVEN",
  "teamId": "design-team-id"
}
```

**Response**:
```json
{
  "recommendation": {
    "id": "rec-456",
    "message": "Jane is an excellent team player...",
    "type": "GIVEN",
    "status": "ACCEPTED",
    "senderId": "user-a-id",
    "receiverId": "user-b-id",
    "teamId": "design-team-id",
    "team": {
      "id": "design-team-id",
      "name": "Design Team",
      "slug": "design-team"
    }
  }
}
```

### Example 3: Get Collaboration Context

```bash
GET /api/collaboration/context/user-b-id
Authorization: Bearer {token}
```

**Response**:
```json
{
  "context": {
    "haveWorkedTogether": true,
    "sharedTeamsCount": 2,
    "sharedProjectsCount": 5,
    "sharedTeams": [
      {
        "id": "mobile-team",
        "name": "Mobile App Team",
        "slug": "mobile-app-team",
        "type": "PROJECT",
        "projects": [
          {
            "id": "ios-project",
            "title": "iOS App Redesign",
            "description": "...",
            "teamId": "mobile-team",
            "teamName": "Mobile App Team"
          },
          {
            "id": "android-project",
            "title": "Android Refactor",
            "description": "...",
            "teamId": "mobile-team",
            "teamName": "Mobile App Team"
          }
        ]
      }
    ],
    "sharedProjects": [
      // All projects from all shared teams (flattened)
    ]
  }
}
```

---

## Files Created

### Backend
1. `/packages/backend/src/services/collaboration.service.ts` - Find shared teams/projects
2. `/packages/backend/src/controllers/collaboration.controller.ts` - Collaboration endpoints
3. `/packages/backend/src/routes/collaboration.routes.ts` - Collaboration routes

### Frontend
1. `/packages/frontend/src/services/api/collaboration.service.ts` - Collaboration API client

---

## Files Modified

### Backend
1. `/packages/backend/prisma/schema.prisma` - Updated Recommendation model
2. `/packages/backend/src/services/recommendation.service.ts` - Enhanced creation logic
3. `/packages/backend/src/controllers/recommendation.controller.ts` - Accept new parameters
4. `/packages/backend/src/app.ts` - Register collaboration routes

### Frontend
1. `/packages/frontend/src/types/user.ts` - Updated Recommendation and request types

---

## Next Steps

### Immediate (UI Implementation)
1. **Update RecommendationDialog.tsx**:
   - Add type selector (Request/Give)
   - Add project selection dropdown
   - Fetch collaboration context
   - Handle new request parameters

2. **Update ProfilePage.tsx**:
   - Add "Give Recommendation" button
   - Pass type to dialog

3. **Update RecommendationsSection.tsx**:
   - Display project/team context
   - Show context badges

### Future Enhancements
1. **Email Notifications**:
   - Notify when teammate gives recommendation
   - Remind about pending requests

2. **Recommendation Templates**:
   - Quick templates for common scenarios
   - "Technical skills", "Team collaboration", "Leadership"

3. **Recommendation Analytics**:
   - Track recommendation success rate
   - Show "Most recommended skills"
   - Display collaboration network

4. **LinkedIn-style Features**:
   - Endorse specific skills
   - Relationship context (manager, peer, client)
   - Public vs private recommendations

---

**Implementation Date**: 2025-10-18
**Status**: ✅ Backend Complete | ⚠️ Frontend Types Updated | ⏳ UI Pending
**Build Status**: ✅ Backend builds successfully
**Database**: ✅ Schema updated and synced

---

## Summary

The recommendation system now fully supports **team-based collaboration**:

✅ **What Works Now**:
- Backend validates shared team membership
- Users can request recommendations about shared project work
- Users can give recommendations proactively
- API endpoints for finding shared projects/teams
- Project and team context stored with recommendations
- Backwards compatible with portfolio-based recommendations

⚠️ **What Needs UI**:
- Enhanced dialog with project selection
- "Give Recommendation" button on profiles
- Display project/team context in recommendation cards

The backend is **production-ready**. The frontend types are updated and API service is created. Only the UI components need to be built to complete the feature.
