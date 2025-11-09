# 🧪 End-to-End Testing Guide

## Prerequisites
- ✅ Backend running on http://localhost:3001
- ✅ Frontend running on http://localhost:5173

---

## Test Plan Overview

### Phase 1: Authentication Flow
- [ ] 1.1 User Registration
- [ ] 1.2 User Login
- [ ] 1.3 Protected Route Access
- [ ] 1.4 Token Persistence
- [ ] 1.5 Logout

### Phase 2: User Profile
- [ ] 2.1 View Profile
- [ ] 2.2 Edit Profile
- [ ] 2.3 Update Availability
- [ ] 2.4 Update Hourly Rate

### Phase 3: Team Management
- [ ] 3.1 Create Team
- [ ] 3.2 View My Teams
- [ ] 3.3 Team Types (PROJECT, AGENCY, STARTUP)
- [ ] 3.4 Team Slug Generation

### Phase 4: Invitation System
- [ ] 4.1 View Invitations Page
- [ ] 4.2 Received Invitations Tab
- [ ] 4.3 Sent Invitations Tab
- [ ] 4.4 Send Invitation (via API)
- [ ] 4.5 Accept Invitation
- [ ] 4.6 Decline Invitation
- [ ] 4.7 Cancel Invitation

### Phase 5: Integration Tests
- [ ] 5.1 Multi-user Workflow
- [ ] 5.2 Error Handling
- [ ] 5.3 Navigation Flow
- [ ] 5.4 Data Persistence

---

## Detailed Test Steps

## 🔐 PHASE 1: Authentication Flow

### Test 1.1: User Registration ✅

**Steps:**
1. Open browser to http://localhost:5173/register
2. Fill in the form:
   - Full Name: `Test User`
   - Username: `testuser1`
   - Email: `test1@example.com`
   - Password: `password123`
   - Role: Select `FREELANCER`
3. Click "Create account"

**Expected Results:**
- ✅ Form submits successfully
- ✅ No validation errors
- ✅ Auto-redirected to `/dashboard`
- ✅ Token stored in localStorage
- ✅ User displayed in dashboard: "Welcome, Test!"

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 1.2: User Login ✅

**Steps:**
1. Click "Logout" from dashboard
2. Navigate to http://localhost:5173/login
3. Enter credentials:
   - Email: `test1@example.com`
   - Password: `password123`
4. Click "Sign in"

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to `/dashboard`
- ✅ User info displayed correctly
- ✅ Token stored in localStorage

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 1.3: Protected Route Access ✅

**Steps:**
1. While logged in, navigate to `/profile`
2. Log out
3. Try to access `/dashboard` directly
4. Try to access `/profile` directly

**Expected Results:**
- ✅ While logged in: Can access protected routes
- ✅ While logged out: Redirected to `/login`
- ✅ Login page shows "from" location in URL

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 1.4: Token Persistence ✅

**Steps:**
1. Log in successfully
2. Refresh the page (F5)
3. Check dashboard still shows user info
4. Navigate to different pages

**Expected Results:**
- ✅ User remains logged in after refresh
- ✅ No need to login again
- ✅ All protected routes accessible

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 1.5: Logout ✅

**Steps:**
1. From dashboard, click "Logout"
2. Check localStorage
3. Try to access `/dashboard`

**Expected Results:**
- ✅ Redirected to `/login`
- ✅ Token removed from localStorage
- ✅ Cannot access protected routes
- ✅ No user info shown

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

## 👤 PHASE 2: User Profile

### Test 2.1: View Profile ✅

**Steps:**
1. Login as `test1@example.com`
2. From dashboard, click "My Profile" quick action
3. Observe profile page

**Expected Results:**
- ✅ Profile displays:
  - Full name: "Test User"
  - Username: "@testuser1"
  - Role badge: "FREELANCER"
  - Availability status
  - "Edit Profile" button visible

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 2.2: Edit Profile ✅

**Steps:**
1. On profile page, click "Edit Profile"
2. Update fields:
   - First Name: `TestEdited`
   - Last Name: `UserUpdated`
   - Bio: `I am a freelance developer`
   - Location: `San Francisco, CA`
   - Hourly Rate: `75`
3. Check "Available for work"
4. Click "Save Changes"

**Expected Results:**
- ✅ Form switches to edit mode
- ✅ All fields editable
- ✅ Save successful
- ✅ Profile updates displayed
- ✅ Edit mode closed
- ✅ Dashboard shows updated name

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 2.3: Cancel Edit ✅

**Steps:**
1. Click "Edit Profile"
2. Change some fields
3. Click "Cancel"

**Expected Results:**
- ✅ Changes discarded
- ✅ Original values shown
- ✅ Edit mode closed

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

## 👥 PHASE 3: Team Management

### Test 3.1: Create Team (PROJECT) ✅

**Steps:**
1. From dashboard, click "My Teams"
2. Click "Create Team"
3. Fill form:
   - Team Name: `Awesome Project Team`
   - Type: `PROJECT`
   - Description: `A great project team for collaboration`
   - Location: `New York, NY`
   - Website: `https://example.com`
4. Click "Create Team"

**Expected Results:**
- ✅ Team created successfully
- ✅ Redirected to team detail (slug: `awesome-project-team`)
- ✅ User is OWNER
- ✅ Member count: 1

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 3.2: Create Team (AGENCY) ✅

**Steps:**
1. Navigate to `/teams/create`
2. Create team:
   - Name: `Digital Agency Pro`
   - Type: `AGENCY`
   - Description: `Full-service digital agency`
   - City: `Los Angeles, CA`
3. Submit

**Expected Results:**
- ✅ Team created
- ✅ Slug: `digital-agency-pro`
- ✅ Type badge shows "AGENCY"

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 3.3: Create Team (STARTUP) ✅

**Steps:**
1. Create third team:
   - Name: `Tech Startup Inc`
   - Type: `STARTUP`
   - Description: `Innovative tech startup`

**Expected Results:**
- ✅ Team created
- ✅ Slug: `tech-startup-inc`
- ✅ Type badge shows "STARTUP"

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 3.4: View My Teams ✅

**Steps:**
1. Navigate to `/teams/my`
2. Observe teams list

**Expected Results:**
- ✅ Shows 3 teams
- ✅ Each team card shows:
  - Team name
  - Description
  - Role badge (OWNER)
  - Member count
  - Type badge
  - Location
- ✅ Clicking card navigates to team detail

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

## ✉️ PHASE 4: Invitation System

### Test 4.1: View Invitations Page ✅

**Steps:**
1. From dashboard, click "Invitations"
2. Observe page structure

**Expected Results:**
- ✅ Two tabs: "Received" and "Sent"
- ✅ Received tab shows count: (0)
- ✅ Sent tab shows count: (0)
- ✅ Empty state message shown

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 4.2: Create Second User ✅

**Steps:**
1. Logout from first user
2. Register new user:
   - Name: `Second User`
   - Username: `testuser2`
   - Email: `test2@example.com`
   - Password: `password123`
   - Role: `FREELANCER`

**Expected Results:**
- ✅ User created
- ✅ Auto-logged in
- ✅ Dashboard shows new user

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 4.3: Send Invitation (API Test) ✅

**Note:** Since we don't have a UI for sending invitations yet, we'll use the API directly.

**Steps:**
1. Get User 2's ID from dashboard (check browser console or network tab)
2. Get Team ID from User 1's team
3. Use the backend API to send invitation

**API Request:**
```bash
# Login as User 1
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","password":"password123"}'

# Copy the token from response

# Get User 2's ID
curl http://localhost:3001/api/users/search?query=testuser2 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send invitation
curl -X POST http://localhost:3001/api/invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "receiverId": "USER_2_ID",
    "teamId": "TEAM_ID",
    "role": "MEMBER",
    "message": "Join our awesome team!"
  }'
```

**Alternative: Use Browser Console:**
```javascript
// While logged in as User 1
const response = await fetch('http://localhost:3001/api/invitations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  },
  body: JSON.stringify({
    receiverId: 'USER_2_ID', // Get from user search
    teamId: 'TEAM_ID',        // Get from my teams
    role: 'MEMBER',
    message: 'Join our awesome team!'
  })
});
const data = await response.json();
console.log(data);
```

**Expected Results:**
- ✅ Invitation created
- ✅ Status: PENDING
- ✅ Expires in 7 days

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 4.4: View Received Invitation ✅

**Steps:**
1. Logout from User 1
2. Login as User 2 (`test2@example.com`)
3. Navigate to `/invitations`
4. Check "Received" tab

**Expected Results:**
- ✅ Received tab shows count: (1)
- ✅ Invitation card displays:
  - Team name
  - Sender info (Test User)
  - Role badge (MEMBER)
  - Status badge (PENDING)
  - Message
  - Created date
  - Expires date
  - "Accept" button
  - "Decline" button

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 4.5: Accept Invitation ✅

**Steps:**
1. From User 2's received invitations
2. Click "Accept" button
3. Refresh page

**Expected Results:**
- ✅ Invitation status changes to ACCEPTED
- ✅ Accept/Decline buttons disappear
- ✅ User 2 added to team
- ✅ Navigate to "My Teams" shows the team
- ✅ Role badge shows "MEMBER"

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 4.6: Decline Invitation ✅

**Steps:**
1. Login as User 1
2. Send another invitation to User 2 (different team)
3. Login as User 2
4. Click "Decline" on new invitation

**Expected Results:**
- ✅ Status changes to DECLINED
- ✅ Buttons disappear
- ✅ User NOT added to team

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 4.7: Cancel Invitation (Sent) ✅

**Steps:**
1. Login as User 1
2. Create third user OR send invitation to User 2 (another team)
3. Go to Invitations → "Sent" tab
4. Click "Cancel" on pending invitation

**Expected Results:**
- ✅ Sent tab shows invitations
- ✅ "Cancel" button visible for PENDING invitations
- ✅ Status changes to CANCELLED
- ✅ Recipient can't accept anymore

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

## 🔄 PHASE 5: Integration Tests

### Test 5.1: Multi-User Workflow ✅

**Scenario:** Complete team collaboration workflow

**Steps:**
1. User 1 creates team
2. User 1 invites User 2
3. User 2 accepts invitation
4. Both users see team in "My Teams"
5. User 2 has MEMBER role
6. User 1 has OWNER role

**Expected Results:**
- ✅ Complete workflow works end-to-end
- ✅ Roles correctly assigned
- ✅ Both users can view team

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 5.2: Error Handling ✅

**Test Cases:**

**5.2.1 - Invalid Login:**
1. Try login with wrong password

**Expected:**
- ✅ Error message displayed
- ✅ No redirect
- ✅ Form remains on page

**5.2.2 - Duplicate Username:**
1. Try registering with existing username

**Expected:**
- ✅ Error message shown
- ✅ Registration fails

**5.2.3 - Expired Invitation:**
(Manual test by modifying DB expiration date)

**Expected:**
- ✅ Warning shown
- ✅ Accept/Decline buttons disabled

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 5.3: Navigation Flow ✅

**Steps:**
1. From Dashboard → Profile → Back to Dashboard
2. From Dashboard → My Teams → Create Team → Back to My Teams
3. From Dashboard → Invitations → Back to Dashboard
4. Use browser back button

**Expected Results:**
- ✅ All navigation works smoothly
- ✅ No broken links
- ✅ Back button works correctly
- ✅ State persists across navigation

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

### Test 5.4: Data Persistence ✅

**Steps:**
1. Create team
2. Edit profile
3. Accept invitation
4. Refresh page multiple times
5. Close browser and reopen

**Expected Results:**
- ✅ All data persists
- ✅ Token remains valid
- ✅ User stays logged in
- ✅ Teams visible
- ✅ Profile changes saved

**Actual Results:**
- [ ] Pass
- [ ] Fail (Note issues):

---

## 📊 Test Summary

### Results Overview

**Phase 1: Authentication** (5 tests)
- Passed: ___/5
- Failed: ___/5

**Phase 2: User Profile** (3 tests)
- Passed: ___/3
- Failed: ___/3

**Phase 3: Team Management** (4 tests)
- Passed: ___/4
- Failed: ___/4

**Phase 4: Invitations** (7 tests)
- Passed: ___/7
- Failed: ___/7

**Phase 5: Integration** (4 tests)
- Passed: ___/4
- Failed: ___/4

**TOTAL TESTS:** ___/23 ✅

---

## 🐛 Issues Found

### Critical Issues:
1. 

### Minor Issues:
1. 

### Enhancement Suggestions:
1. 

---

## ✅ Sign-Off

- [ ] All critical features working
- [ ] No blocking bugs
- [ ] Ready for Phase 2
- [ ] Ready for production (with enhancements)

**Tested By:** _______________
**Date:** October 6, 2025
**Status:** PASS / FAIL / PARTIAL

---

## 📝 Notes

Additional observations or comments:


