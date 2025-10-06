# 🚀 Quick E2E Testing Guide

## Setup Complete ✅
- Backend: http://localhost:3001 (running)
- Frontend: http://localhost:5173 (running)
- Browser: Opened to registration page

## 🔥 Recent Fixes Applied (Latest)
- ✅ **Freelancers Listing**: Now shows all registered FREELANCER users
- ✅ **Profile Save**: Automatically refreshes after save (no manual refresh needed)
- ✅ **Search API**: Empty search now works (browse all freelancers)
- 📝 Details in: `PROFILE-LISTING-FIX.md` and `TEST-NOW.md`

---

## 🎯 Quick Test Flow (15 minutes)

### Step 1: Create User 1 (2 min)
1. **Open:** http://localhost:5173/register
2. **Fill form:**
   - Full Name: `John Doe`
   - Username: `johndoe`
   - Email: `john@example.com`
   - Password: `password123`
   - Role: `FREELANCER`
3. **Click:** "Create account"
4. **Verify:** Redirected to `/dashboard`, shows "Welcome, John!"

---

### Step 2: Test Profile Edit (2 min)
1. **Click:** "My Profile" card
2. **Click:** "Edit Profile" button
3. **Update:**
   - Bio: `Experienced freelance developer`
   - Location: `San Francisco, CA`
   - Hourly Rate: `100`
   - Check: ✅ Available for work
4. **Click:** "Save Changes"
5. **Verify:** Profile updated, edit mode closed

---

### Step 3: Create Teams (3 min)
1. **Click:** "My Teams" from dashboard
2. **Click:** "Create Team"
3. **Team 1 - Project:**
   - Name: `Web Development Project`
   - Type: `PROJECT`
   - Description: `Building awesome websites`
   - Location: `San Francisco, CA`
4. **Click:** "Create Team"
5. **Verify:** Redirected to team, role badge shows "OWNER"

6. **Go back to My Teams** (`/teams/my`)
7. **Create Team 2 - Agency:**
   - Name: `Digital Solutions Agency`
   - Type: `AGENCY`
   - Description: `Full-service digital agency`

8. **Verify:** Both teams appear in "My Teams"

---

### Step 4: Create User 2 (2 min)
1. **Logout** (from dashboard)
2. **Navigate:** http://localhost:5173/register
3. **Create:**
   - Name: `Jane Smith`
   - Username: `janesmith`
   - Email: `jane@example.com`
   - Password: `password123`
   - Role: `AGENCY`
4. **Verify:** Logged in as Jane

---

### Step 5: Send Invitation (3 min)
1. **Stay as User 2 (Jane)** - note her user ID
2. **Logout and Login as User 1 (John)**
3. **Open browser DevTools** (F12)
4. **Go to Console tab**
5. **Copy and paste test helper:**
   ```javascript
   // Copy content from test-helpers.js file
   ```
6. **Get User 2's ID:**
   ```javascript
   await testHelpers.searchUser('janesmith')
   // Copy the user ID from results
   ```
7. **Get Team ID:**
   ```javascript
   await testHelpers.getMyTeams()
   // Copy the first team ID
   ```
8. **Send invitation:**
   ```javascript
   await testHelpers.sendInvitation(
     'USER_2_ID_HERE',
     'TEAM_ID_HERE',
     'MEMBER',
     'Join our web development project!'
   )
   ```
9. **Verify:** Response shows invitation created with status "PENDING"

---

### Step 6: Accept Invitation (2 min)
1. **Logout from User 1**
2. **Login as User 2** (jane@example.com)
3. **Navigate:** `/invitations`
4. **Verify:** 
   - "Received" tab shows (1)
   - Invitation card displays team name, sender, message
   - Status: PENDING
   - Buttons: Accept, Decline
5. **Click:** "Accept"
6. **Verify:**
   - Status changes to "ACCEPTED"
   - Buttons disappear
7. **Navigate:** `/teams/my`
8. **Verify:** 
   - Now shows 2 teams (1 owned, 1 as member)
   - Role badge shows "MEMBER" for joined team

---

### Step 7: View Sent Invitations (1 min)
1. **Logout and Login as User 1** (john@example.com)
2. **Navigate:** `/invitations`
3. **Click:** "Sent" tab
4. **Verify:**
   - Shows invitation to Jane
   - Status: ACCEPTED
   - No Cancel button (already accepted)

---

## ✅ Quick Verification Checklist

After completing the test flow above:

### Authentication ✅
- [x] Registration works
- [x] Login works
- [x] Logout works
- [ ] Protected routes redirect to login (needs testing)
- [ ] Token persists after refresh (needs testing)

### Profile ✅
- [x] View profile works
- [x] Edit profile works (basic fields)
- [x] Availability dropdown visible (FIXED: was white on white)
- [x] Changes save correctly
- [ ] Cancel edit works (discards changes)
- [ ] Skills management (Phase 2 - placeholder only)
- [ ] Portfolio management (Phase 2 - placeholder only)
- [ ] Experience management (Phase 2 - placeholder only)

### Teams ✅
- [ ] My Teams page loads
- [ ] Back to Dashboard button works (FIXED)
- [ ] Create team works - all 3 types (needs testing)
- [ ] Team cards display correctly (needs testing)
- [ ] Role badges show correctly (needs testing)

### Freelancers Listing ✅
- [x] Page loads with real users (FIXED: was showing mock data)
- [x] Search works
- [x] User cards show: bio, location, hourly rate, skills
- [x] "View Profile" link works
- [ ] "Invite" button (Phase 2 - no UI yet)

### Invitations ⚠️
- [x] Send invitation works (via API/console only - see test-helpers.js)
- [x] Received tab shows invitations
- [x] Accept invitation works
- [x] Sent tab shows sent invitations
- [x] Status tracking works
- [ ] Decline invitation (needs testing)
- [ ] Cancel invitation (needs testing)
- [ ] Send invitation UI form (Phase 2)

### Integration ⏳
- [ ] Multi-user workflow (partial - missing team detail page)
- [x] Team membership works
- [x] Roles assigned correctly
- [x] Navigation works (dashboard ↔ profile ↔ teams)
- [x] Data persists

---

## 🐛 Common Issues & Solutions

### Issue: "401 Unauthorized" errors
**Solution:** Token expired. Logout and login again.

### Issue: Users not showing on /freelancers page
**Solution:** 
1. Make sure users have role = "FREELANCER"
2. Edit their profiles (bio, location, hourly rate)
3. Set available = true
4. Logout and visit /freelancers page (or open incognito)

### Issue: Can't find user in search
**Solution:** Make sure you created the user with correct username

### Issue: My Teams page blank or not loading
**Solution:** 
1. Check browser console for errors
2. Make sure you're logged in
3. Try clicking "Back to Dashboard" then "My Teams" again
4. Create at least one team first

### Issue: Invitation not appearing
**Solution:** 
1. Check you're logged in as the recipient
2. Refresh the invitations page
3. Verify invitation was created (check console response)
4. Make sure invitation status is PENDING

### Issue: Availability dropdown shows white text
**Solution:** FIXED in latest version (commit 9b8ce6e)
- If still seeing issue, refresh page with Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)

---

## 🧪 Advanced Testing (Optional)

### Test Decline Invitation:
1. User 1 sends another invitation to User 2
2. User 2 clicks "Decline"
3. Status changes to "DECLINED"
4. User 2 NOT added to team

### Test Cancel Invitation:
1. User 1 sends invitation to User 2
2. Before User 2 accepts, User 1 goes to "Sent" tab
3. User 1 clicks "Cancel"
4. Status changes to "CANCELLED"
5. User 2 cannot accept anymore

### Test Multiple Teams:
1. Create 3+ teams
2. Send invitations from different teams
3. Accept some, decline others
4. Verify "My Teams" shows correct teams with correct roles

---

## 📊 Expected Test Results

### If All Tests Pass:
✅ **23/23 tests passing**
✅ All core features working
✅ Ready for Phase 2
✅ Production-ready foundation

### Recording Results:
Use the E2E-TEST-PLAN.md file to record detailed results.

---

## 🎉 Success Criteria

✅ Can register and login  
✅ Can edit profile  
✅ Can create teams  
✅ Can send invitations  
✅ Can accept invitations  
✅ Can view team memberships  
✅ Roles work correctly  
✅ Data persists  

**If all above are ✅, Phase 1 is COMPLETE!** 🚀

---

## 📝 Notes

- **FIXED Issues (commit 9b8ce6e)**:
  - ✅ Profile availability dropdown styling
  - ✅ Freelancers page shows real users (not mock data)
  - ✅ My Teams has back navigation
  
- **Known Limitations (Phase 2 features)**:
  - Skills/Portfolio/Experience are placeholders (API exists, UI pending)
  - Send invitation has no UI form (use test-helpers.js)
  - Team detail page not implemented
  
- **Testing Resources**:
  - Test helpers: `test-helpers.js` (copy to browser console)
  - Full test plan: `E2E-TEST-PLAN.md` (23 comprehensive tests)
  - Known issues: `KNOWN-ISSUES.md` (detailed status tracking)
  - Backend logs show all API requests at http://localhost:3001

**See KNOWN-ISSUES.md for complete status of all features.**

**Happy Testing! 🧪**
