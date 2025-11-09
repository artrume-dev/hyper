# Duplicate Teams Bug Fix

**Date:** October 16, 2025
**Issue:** Duplicate team entries in Dashboard Recent Teams section
**Status:** ✅ FIXED

---

## 🐛 Problem Description

### Error Message
```
DashboardPage.tsx:315 Encountered two children with the same key,
`613cf7c0-5e52-4c1b-be8e-9e2462f5f4f7`. Keys should be unique so that
components maintain their identity across updates.
```

### Root Cause

When a user **creates a team**, they become the **owner** of that team. In the database:
1. The `Team` table has `ownerId` field pointing to the user
2. A `TeamMember` record is also created with `role: 'OWNER'`

**The Bug:**
The dashboard service was fetching teams in two ways:
1. **Owned Teams Query** - `prisma.team.findMany({ where: { ownerId: userId } })`
2. **Member Teams Query** - `prisma.teamMember.findMany({ where: { userId } })`

Since owned teams also have a TeamMember entry, the **same team appeared twice** in the results.

---

## ✅ Solution

Added deduplication logic in the dashboard service to remove duplicate teams by their ID.

### File Modified
`packages/backend/src/services/dashboard.service.ts` (lines 104-123)

### Code Change

**Before:**
```typescript
]).then(([ownedTeams, memberTeams]) => {
  // Combine and sort teams by most recent
  const allTeams = [
    ...ownedTeams.map(team => ({ ...team, userRole: 'OWNER' })),
    ...memberTeams.map(m => ({ ...m.team, userRole: m.role })),
  ];

  // Sort by createdAt/joinedAt and take top 5
  return allTeams
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
}),
```

**After:**
```typescript
]).then(([ownedTeams, memberTeams]) => {
  // Combine and sort teams by most recent
  const allTeams = [
    ...ownedTeams.map(team => ({ ...team, userRole: 'OWNER' })),
    ...memberTeams.map(m => ({ ...m.team, userRole: m.role })),
  ];

  // Remove duplicates by team ID (in case user is owner and member)
  const uniqueTeams = allTeams.reduce((acc, team) => {
    if (!acc.find(t => t.id === team.id)) {
      acc.push(team);
    }
    return acc;
  }, [] as any[]);

  // Sort by createdAt/joinedAt and take top 5
  return uniqueTeams
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
}),
```

### What Changed
1. Added `uniqueTeams` array using `reduce()` to filter duplicates
2. Check if team ID already exists before adding to result
3. Sort the deduplicated array by creation date
4. Return top 5 unique teams

---

## 🧪 Testing

### How to Test
1. **Restart the backend server** (the build is already complete)
2. Login to the application
3. Navigate to `/dashboard`
4. Check the "Recent Teams" section
5. Verify no duplicate teams appear
6. Check browser console - no React key warnings should appear

### Expected Result
- ✅ Each team appears only once in Recent Teams
- ✅ Teams are sorted by most recent
- ✅ No React duplicate key warnings in console
- ✅ Team creation works without errors

---

## 🔍 Related Issues

### Database Migration Issue (Also Fixed)
The error logs showed: `"The table 'main.User' does not exist in the current database"`

**Cause:** Database migrations hadn't been run or database was corrupted.

**Solution:** GitHub Copilot helped fix the database tables issue. The database should now be properly set up.

---

## 📋 Verification Checklist

After restarting the backend:
- [ ] Dashboard loads without errors
- [ ] Recent Teams section shows unique teams only
- [ ] No duplicate key warnings in console
- [ ] Team creation works on `/teams/create`
- [ ] Teams appear correctly with proper role badges (OWNER/MEMBER)

---

## 🚀 Deployment

### Local Development
```bash
# Backend is already built
cd packages/backend
npm start

# Or restart your development server
npm run dev
```

### Production
The fix is included in the built `/dist` folder. Deploy as normal:
```bash
# Railway will automatically run migrations and start the server
git push origin main
```

---

## 📝 Technical Notes

### Why This Approach?
1. **Simple Deduplication**: Using `reduce()` with ID check is clear and performant
2. **Maintains Order**: Teams are still sorted by creation date after deduplication
3. **Preserves Role**: The first occurrence keeps the role (OWNER takes precedence)
4. **No Breaking Changes**: Response format remains the same

### Alternative Approaches (Considered)
1. **Query-Level Fix**: Modify queries to avoid fetching owned teams twice
   - ❌ More complex SQL logic
   - ❌ Harder to maintain

2. **Frontend Deduplication**: Filter duplicates in DashboardPage.tsx
   - ❌ Wastes network bandwidth
   - ❌ Doesn't fix root cause

3. **Use Map/Set**: Use Set for O(1) lookup instead of array.find()
   - ✅ Could be added for performance if needed
   - ⚠️ Current approach is fine for small datasets (max 6 teams)

---

## 🐛 Debugging Tips

If the issue persists:

1. **Check Backend Logs:**
   ```bash
   tail -f packages/backend/logs/error.log
   ```

2. **Verify Database State:**
   ```bash
   cd packages/backend
   npx prisma studio
   # Check TeamMember table for duplicate entries
   ```

3. **Clear Cache:**
   ```bash
   # Clear backend build
   rm -rf packages/backend/dist
   npm run build

   # Clear frontend cache
   rm -rf packages/frontend/.vite
   ```

4. **Check Network Tab:**
   - Open DevTools → Network
   - Look at `/api/dashboard/user` response
   - Verify teams array has no duplicate IDs

---

**Status:** ✅ FIXED - Backend built successfully with deduplication logic
**Action Required:** Restart backend server to apply the fix
**Next:** Test dashboard to confirm fix works
