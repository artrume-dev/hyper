# ProfilePage Testing Guide

## Test Environment
- ✅ Backend: Running on http://localhost:3001
- ✅ Frontend: Running on http://localhost:5173
- ✅ Branch: `feature/redesign-profile-awwwards-style`

## Testing Steps

### 1. Access the Profile Page
1. Open http://localhost:5173
2. If not logged in:
   - Click "Sign In" or navigate to /login
   - Login with existing credentials OR
   - Click "Get Started" to register a new freelancer account
3. After login, navigate to your profile:
   - From Dashboard, click your name/profile link
   - OR navigate to /profile directly

### 2. Test Profile Header & Navigation
- [ ] Navigation bar appears at top (fixed)
- [ ] Navigation has "Hypergigs" logo, links (Teams, Freelancers, Projects, About)
- [ ] Profile name displays in large 64px font
- [ ] Role and username show below name in small caps
- [ ] Location icon and text appear (if set)
- [ ] Hourly rate shows with $ icon (if set)
- [ ] Availability badge shows correct status (green/gray)
- [ ] Bio text displays in large, readable format (if set)
- [ ] Edit button appears (only on own profile)

### 3. Test Edit Profile
- [ ] Click "Edit Profile" button (edit icon)
- [ ] Edit form appears with current values
- [ ] Change first name, last name
- [ ] Update bio text
- [ ] Change location
- [ ] Update hourly rate
- [ ] Toggle availability status
- [ ] Click "Save Changes"
- [ ] Profile updates successfully
- [ ] Edit form closes
- [ ] Changes reflect immediately
- [ ] Click "Cancel" to dismiss without saving

### 4. Test Skills Section
**Add Skills:**
- [ ] "Skills" section header visible
- [ ] Plus (+) button appears (own profile only)
- [ ] Click + button
- [ ] Inline form appears
- [ ] Enter skill name (e.g., "JavaScript")
- [ ] Select level (Beginner/Intermediate/Advanced/Expert)
- [ ] Click "Add" button
- [ ] Skill appears as pill with name and level
- [ ] Click "Cancel" to close form

**Display & Remove Skills:**
- [ ] Skills display in flexible grid
- [ ] Each skill shows name and level
- [ ] Hover over skill pill shows delete button
- [ ] Click X button to remove skill
- [ ] Skill removed successfully
- [ ] Add multiple skills (5-10)
- [ ] Pills wrap properly

### 5. Test Portfolio Section
**Add Portfolio:**
- [ ] "Portfolio" section header visible
- [ ] Plus (+) button appears (own profile only)
- [ ] Click + button
- [ ] Inline form appears with fields:
  - Project title (required)
  - Description (optional)
  - Project URL (optional)
  - Image URL (optional)
- [ ] Fill in all fields
- [ ] Click "Add Project"
- [ ] Portfolio card appears in grid
- [ ] Click "Cancel" to close form

**Display & Interact:**
- [ ] Portfolio items show in 3-column grid (desktop)
- [ ] Each card shows:
  - Image (if URL provided) with 4:3 aspect ratio
  - Project title (large, bold)
  - Description (2 lines max, clipped)
  - "View Project" link with external icon
- [ ] Hover over card:
  - Image scales up (zoom effect)
  - Delete button appears (own profile)
  - Border changes to primary color
  - Shadow increases
- [ ] Click "View Project" opens URL in new tab
- [ ] Click X button to delete portfolio item
- [ ] Add 3-6 portfolio items to test grid

### 6. Test Work Experience Section
**Add Experience:**
- [ ] "Work Experience" section header visible
- [ ] Plus (+) button appears (own profile only)
- [ ] Click + button
- [ ] Inline form appears with fields:
  - Job title (required)
  - Company (required)
  - Location (optional)
  - Start date (date picker)
  - End date (date picker)
  - "I currently work here" checkbox
  - Description (optional)
- [ ] Fill in all fields
- [ ] Test "Current position" checkbox:
  - Check it: end date field disables
  - Uncheck it: end date field enables
- [ ] Click "Add Experience"
- [ ] Experience appears in timeline
- [ ] Click "Cancel" to close form

**Display & Timeline:**
- [ ] Experience shows as vertical timeline
- [ ] Each entry has:
  - Dot marker on left (primary color)
  - Vertical line connecting entries
  - Job title (large, bold)
  - Company name with briefcase icon
  - Date range with calendar icon
  - Location with map pin icon (if set)
  - Description text (if set)
- [ ] Most recent appears first (chronological)
- [ ] "Present" shows for current positions
- [ ] Hover shows delete button (own profile)
- [ ] Click X to delete experience
- [ ] Add 2-4 experiences to test timeline

### 7. Test Responsive Design
**Desktop (> 1024px):**
- [ ] Portfolio: 3 columns
- [ ] Skills: Multiple pills per row
- [ ] Proper spacing (8px grid)
- [ ] Navigation horizontal

**Tablet (768px - 1024px):**
- [ ] Portfolio: 2 columns
- [ ] Skills: Fewer pills per row
- [ ] Maintained spacing
- [ ] Navigation adjusts

**Mobile (< 768px):**
- [ ] Portfolio: 1 column (stacked)
- [ ] Skills: Wraps naturally
- [ ] Navigation mobile menu
- [ ] Touch-friendly buttons (44px min)

### 8. Test Visitor View (Not Own Profile)
1. Register/login as different user
2. Navigate to another user's profile (/profile/:userId)
- [ ] Navigation appears
- [ ] Profile displays all sections
- [ ] NO edit button on profile header
- [ ] NO plus (+) buttons on sections
- [ ] NO delete buttons on hover
- [ ] Portfolio links work
- [ ] Clean, read-only view

### 9. Test Error Handling
- [ ] Try adding skill with empty name → validation error
- [ ] Try adding portfolio with empty title → validation error
- [ ] Try adding experience with missing required fields → error
- [ ] Error messages display clearly
- [ ] Can dismiss errors and try again

### 10. Visual Design Verification
**8px Grid System:**
- [ ] All spacing uses multiples of 8px
- [ ] Consistent padding: 24px (cards), 32px (container)
- [ ] Gaps: 12px, 16px, 24px, 32px
- [ ] Section margins: 96px between sections

**Typography:**
- [ ] Hero name: 64px, bold, tight tracking
- [ ] Section headers: text-3xl, bold
- [ ] Body text: Readable sizes (text-sm, text-base, text-lg)
- [ ] Proper hierarchy

**Colors:**
- [ ] Neutral background (white/light gray)
- [ ] Clean white cards
- [ ] Subtle borders (border-border)
- [ ] Primary color for accents
- [ ] Muted text for secondary info

**Effects:**
- [ ] Smooth transitions on hover
- [ ] Rounded corners (8px, 16px)
- [ ] Subtle shadows on cards
- [ ] Enhanced shadows on hover
- [ ] Clean, minimal aesthetic

### 11. Performance Check
- [ ] Page loads quickly (< 2s)
- [ ] No console errors
- [ ] Smooth animations/transitions
- [ ] Images load progressively
- [ ] No layout shifts
- [ ] Forms respond immediately

### 12. Integration Check
- [ ] All API calls work:
  - Load profile data
  - Update profile
  - Add/remove skills
  - Add/delete portfolio
  - Add/delete experience
- [ ] Data persists after refresh
- [ ] Multiple users can have different profiles

## Known Issues to Watch For
- [ ] Check if Navigation z-index is correct (should be above all content)
- [ ] Verify date pickers work in all browsers
- [ ] Test image URLs - ensure broken images handled gracefully
- [ ] Check for any TypeScript errors in console
- [ ] Verify all icons render (Lucide React)

## Browser Testing
Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS)

## Success Criteria
✅ All sections functional (skills, portfolio, experience)
✅ Clean, professional design matches reference images
✅ Responsive on all screen sizes
✅ No errors in console
✅ Smooth user experience
✅ Data persists correctly
✅ Visitor vs owner views work correctly

## Next Steps After Testing
1. Document any bugs found
2. Fix critical issues
3. Take screenshots for documentation
4. Push feature branch to GitHub
5. Create pull request
6. Merge to main after approval

---

**Test Date**: October 8, 2025
**Branch**: feature/redesign-profile-awwwards-style
**Tester**: [Your Name]
**Status**: Ready for testing
