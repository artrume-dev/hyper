# Dashboard API - Quick Reference Guide

## Endpoints

### 1. User Dashboard
```
GET /api/dashboard/user
Authorization: Bearer <token>
```

**Returns:**
- User profile
- Statistics (followers, teams, invitations, portfolio, skills)
- Recent teams (last 5)
- Recent invitations (last 5)
- Recent messages (last 5)

---

### 2. Team Dashboard
```
GET /api/dashboard/team/:teamId
Authorization: Bearer <token>
```

**Returns:**
- Team details
- Statistics (members, invitations, projects)
- All team members with roles
- Recent invitations (last 10)
- All team projects
- User's role in team

---

## Quick Testing

### Using cURL

```bash
# 1. Login to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Save the token from response

# 2. Get User Dashboard
curl -X GET http://localhost:3001/api/dashboard/user \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Get Team Dashboard (replace TEAM_ID)
curl -X GET http://localhost:3001/api/dashboard/team/TEAM_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Response Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | Dashboard data retrieved |
| 400 | Bad Request | Missing team ID |
| 401 | Unauthorized | No token or invalid token |
| 403 | Forbidden | Not team member/owner |
| 404 | Not Found | User/team doesn't exist |
| 500 | Server Error | Database or unexpected error |

---

## User Dashboard Statistics

```json
{
  "followersCount": number,      // Users following you
  "followingCount": number,      // Users you follow
  "teamsCount": number,          // Teams owned + member of
  "pendingInvitationsCount": number,  // Pending invitations
  "portfolioCount": number,      // Portfolio items
  "skillsCount": number          // Your skills
}
```

---

## Team Dashboard Statistics

```json
{
  "membersCount": number,        // Team members
  "pendingInvitationsCount": number,  // Pending invitations
  "projectsCount": number,       // Team projects
  "createdAt": "ISO-8601 date"   // Team creation date
}
```

---

## Frontend Integration Example

```typescript
// services/api/dashboard.service.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const dashboardService = {
  getUserDashboard: async () => {
    const response = await axios.get(`${API_URL}/api/dashboard/user`);
    return response.data.data;
  },

  getTeamDashboard: async (teamId: string) => {
    const response = await axios.get(`${API_URL}/api/dashboard/team/${teamId}`);
    return response.data.data;
  },
};
```

---

## React Component Example

```typescript
import { useEffect, useState } from 'react';
import { dashboardService } from '@/services/api/dashboard.service';

export const DashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await dashboardService.getUserDashboard();
        setDashboard(data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {dashboard?.user.firstName}!</h1>

      <div className="stats">
        <div>Followers: {dashboard?.statistics.followersCount}</div>
        <div>Teams: {dashboard?.statistics.teamsCount}</div>
        <div>Portfolio: {dashboard?.statistics.portfolioCount}</div>
      </div>

      <div className="recent-teams">
        <h2>Recent Teams</h2>
        {dashboard?.recentTeams.map(team => (
          <div key={team.id}>{team.name}</div>
        ))}
      </div>
    </div>
  );
};
```

---

## Files Created

1. `/packages/backend/src/services/dashboard.service.ts` (368 lines)
2. `/packages/backend/src/controllers/dashboard.controller.ts` (122 lines)
3. `/packages/backend/src/routes/dashboard.routes.ts` (21 lines)
4. `/packages/backend/src/app.ts` (Updated - mounted dashboard routes)

---

## Next Steps

1. ✅ Implementation Complete
2. ⏳ Test endpoints with Postman/cURL
3. ⏳ Create frontend dashboard components
4. ⏳ Add dashboard to navigation
5. ⏳ Implement caching (optional)
6. ⏳ Deploy to production

---

**Created:** October 16, 2025
**Status:** Ready for Testing
