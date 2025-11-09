# Invitation API Response Format Fix

## Problem
The InvitationsPage appeared blank even though the component implementation looked correct. The issue was an API response format mismatch between the backend and frontend.

## Root Cause
The backend invitation controller was returning unwrapped responses while the frontend expected wrapped responses with consistent property names.

**Backend returned:**
```typescript
res.status(200).json(invitations)  // unwrapped array
res.status(201).json(invitation)   // unwrapped object
```

**Frontend expected:**
```typescript
response.data.invitations  // wrapped in 'invitations' property
response.data.invitation   // wrapped in 'invitation' property
```

## Solution
Updated all invitation controller endpoints to return consistent wrapped response format:

### Backend Changes (`packages/backend/src/controllers/invitation.controller.ts`)

1. **Line 33**: Send invitation
   - Before: `res.status(201).json(invitation)`
   - After: `res.status(201).json({ invitation })`

2. **Line 60**: Get invitation by ID
   - Before: `res.status(200).json(invitation)`
   - After: `res.status(200).json({ invitation })`

3. **Line 114**: Decline invitation
   - Before: `res.status(200).json(invitation)`
   - After: `res.status(200).json({ invitation })`

4. **Line 139**: Cancel invitation
   - Before: `res.status(200).json(invitation)`
   - After: `res.status(200).json({ invitation })`

5. **Line 167**: Get received invitations
   - Before: `res.status(200).json(invitations)`
   - After: `res.status(200).json({ invitations })`

6. **Line 187**: Get sent invitations
   - Before: `res.status(200).json(invitations)`
   - After: `res.status(200).json({ invitations })`

7. **Line 209**: Get team invitations
   - Before: `res.status(200).json(invitations)`
   - After: `res.status(200).json({ invitations })`

### Frontend Changes (`packages/frontend/src/services/api/invitation.service.ts`)

1. **Line 13-14**: Send invitation
   - Before: `const response = await api.post<Invitation>('/api/invitations', data); return response.data;`
   - After: `const response = await api.post<{ invitation: Invitation }>('/api/invitations', data); return response.data.invitation;`

## Impact
This fix ensures that:
- InvitationsPage displays received and sent invitations correctly
- Accept/Decline/Cancel invitation actions work properly
- Team invitation management works as expected
- Consistent API response format across all invitation endpoints

## Testing
After restart, verify:
1. Navigate to /invitations page - should show received and sent invitations
2. Accept/decline received invitations - should update status
3. Cancel sent invitations - should remove them
4. Send new invitations - should appear in sent tab

## Related Issues
- This follows the same pattern as the team API response format fix
- Part of completing the team invitation user journey
