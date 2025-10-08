# Profile Enhancements - Quick Reference

## Task Order & Branches

### 🚀 Implementation Order

```
1. fix/skill-removal                    [2 hours]   ⚡ Quick Win
2. fix/hourly-rate-persistence          [2 hours]   ⚡ Quick Win  
3. feature/username-profile-urls        [4 hours]   🔧 Infrastructure
4. feature/portfolio-edit               [1 day]     📝 Core Feature
5. feature/portfolio-multiple-images    [1.5 days]  🖼️ Core Feature
6. feature/project-detail-page          [2 days]    📄 New Page
7. feature/project-view-modal           [1 day]     🎭 Modal View
8. feature/global-footer                [0.5 day]   🎨 UI Component
```

**Total Time: 8-10 days**

---

## Quick Start Commands

### 1. Skill Removal Fix
```bash
git checkout feature/redesign-profile-awwwards-style
git pull origin feature/redesign-profile-awwwards-style
git checkout -b fix/skill-removal

# Make changes to ProfilePage.tsx
# - Fix handleRemoveSkill event propagation
# - Verify backend removeSkill method

npm run build --workspace=packages/frontend
npm run build --workspace=packages/backend

# Test skill removal
git add .
git commit -m "fix: skill removal button click handler"
git push origin fix/skill-removal
```

### 2. Hourly Rate Fix
```bash
git checkout feature/redesign-profile-awwwards-style
git checkout -b fix/hourly-rate-persistence

# Changes needed:
# - Ensure hourlyRate in UpdateProfileRequest type
# - Fix number input handling in handleChange
# - Verify backend returns hourlyRate in response

npm run build --workspace=packages/frontend
npm run build --workspace=packages/backend

git add .
git commit -m "fix: hourly rate persistence and display"
git push origin fix/hourly-rate-persistence
```

### 3. Username URLs
```bash
git checkout feature/redesign-profile-awwwards-style
git checkout -b feature/username-profile-urls

# Changes:
# - Update routes to /profile/:username
# - Add getUserByUsername backend method
# - Update all profile links across app

npm run build --workspace=packages/frontend
npm run build --workspace=packages/backend

git add .
git commit -m "feat: use username in profile URLs for cleaner paths"
git push origin feature/username-profile-urls
```

### 4. Portfolio Edit
```bash
git checkout feature/redesign-profile-awwwards-style
git checkout -b feature/portfolio-edit

# Changes:
# - Add edit state and form
# - Add pencil icon on portfolio cards
# - Create updatePortfolioItem backend endpoint

npm run build --workspace=packages/frontend
npm run build --workspace=packages/backend

git add .
git commit -m "feat: add portfolio item edit functionality"
git push origin feature/portfolio-edit
```

### 5. Multiple Images
```bash
git checkout feature/redesign-profile-awwwards-style
git checkout -b feature/portfolio-multiple-images

# Database migration first:
cd packages/backend
npx prisma migrate dev --name portfolio_multiple_images

# Then frontend changes:
# - Multi-image upload UI (max 4)
# - 500KB size validation
# - Image carousel on cards

npm run build --workspace=packages/frontend
npm run build --workspace=packages/backend

git add .
git commit -m "feat: support multiple portfolio images (max 4, 500KB)"
git push origin feature/portfolio-multiple-images
```

### 6. Project Detail Page
```bash
git checkout feature/redesign-profile-awwwards-style
git checkout -b feature/project-detail-page

# Create new page:
# - packages/frontend/src/pages/ProjectDetailPage.tsx
# - Add route in App.tsx
# - Backend getPortfolioItem endpoint

npm run build --workspace=packages/frontend
npm run build --workspace=packages/backend

git add .
git commit -m "feat: add dedicated project detail page"
git push origin feature/project-detail-page
```

### 7. Project View Modal
```bash
git checkout feature/redesign-profile-awwwards-style
git checkout -b feature/project-view-modal

# Create modal component:
# - packages/frontend/src/components/ProjectViewModal.tsx
# - Conditional rendering (modal vs detail page)

npm run build --workspace=packages/frontend

git add .
git commit -m "feat: add project view modal for projects without external URL"
git push origin feature/project-view-modal
```

### 8. Global Footer
```bash
git checkout feature/redesign-profile-awwwards-style
git checkout -b feature/global-footer

# Create footer component:
# - packages/frontend/src/components/Footer.tsx
# - Add to App.tsx layout

npm run build --workspace=packages/frontend

git add .
git commit -m "feat: add global footer component to all pages"
git push origin feature/global-footer
```

---

## Merging Strategy

```bash
# After each task is completed and tested:

# 1. Create PR from feature branch to base
gh pr create --base feature/redesign-profile-awwwards-style \
  --head fix/skill-removal \
  --title "Fix: Skill removal functionality" \
  --body "Fixes skill removal button click handler"

# 2. Review and merge
gh pr merge --squash

# 3. Update base branch and continue
git checkout feature/redesign-profile-awwwards-style
git pull origin feature/redesign-profile-awwwards-style

# 4. Start next task from updated base
git checkout -b feature/portfolio-edit
```

---

## Testing Checklist Per Task

### Task 1.6.1 - Skill Removal
- [ ] Click X removes skill from UI
- [ ] Skill deleted from database
- [ ] Error handling works
- [ ] No console errors

### Task 1.6.2 - Hourly Rate
- [ ] Rate saves on profile update
- [ ] Rate displays on profile view
- [ ] Daily rate calculates (hourlyRate * 8)
- [ ] Empty/zero values handled

### Task 1.6.3 - Portfolio Edit
- [ ] Pencil icon visible on hover
- [ ] Edit form shows with current values
- [ ] Updates save correctly
- [ ] Cancel reverts changes

### Task 1.6.4 - Multiple Images
- [ ] Can upload up to 4 images
- [ ] Files over 500KB rejected
- [ ] Carousel navigation works
- [ ] Image indicators show position

### Task 1.6.5 - Project Detail Page
- [ ] Page loads with correct data
- [ ] Image gallery works
- [ ] Back button navigates correctly
- [ ] External link opens in new tab

### Task 1.6.6 - Project View Modal
- [ ] Modal opens for projects without URL
- [ ] Detail page opens for projects with URL
- [ ] ESC closes modal
- [ ] Click outside closes modal

### Task 1.6.7 - Username URLs
- [ ] /profile/:username works
- [ ] /profile shows own profile
- [ ] 404 for invalid usernames
- [ ] All links updated

### Task 1.6.8 - Global Footer
- [ ] Footer on all pages
- [ ] Links work correctly
- [ ] Responsive design
- [ ] Social links open in new tab

---

## File Reference

### Frontend Files to Modify
```
packages/frontend/src/
├── pages/
│   ├── ProfilePage.tsx              (Tasks 1-4, 6, 7)
│   └── ProjectDetailPage.tsx        (Task 5 - NEW)
├── components/
│   ├── ProjectViewModal.tsx         (Task 6 - NEW)
│   └── Footer.tsx                   (Task 8 - NEW)
├── types/
│   └── user.ts                      (Tasks 2, 4)
└── App.tsx                          (Tasks 5, 7, 8)
```

### Backend Files to Modify
```
packages/backend/src/
├── services/
│   └── user.service.ts              (Tasks 1, 2, 3, 4, 5)
├── controllers/
│   └── user.controller.ts           (Tasks 3, 4, 5)
├── routes/
│   └── user.routes.ts               (Tasks 3, 4, 5)
└── prisma/
    └── schema.prisma                (Task 4 - MIGRATION)
```

---

## Database Changes

### Task 1.6.4 - Portfolio Multiple Images

**Migration:**
```sql
-- Migration: portfolio_multiple_images
ALTER TABLE "PortfolioItem" 
  DROP COLUMN "mediaFile",
  ADD COLUMN "mediaFiles" TEXT[] DEFAULT ARRAY[]::TEXT[];
```

**Rollback Plan:**
```sql
ALTER TABLE "PortfolioItem" 
  DROP COLUMN "mediaFiles",
  ADD COLUMN "mediaFile" TEXT;
```

---

## Environment Variables

No new environment variables needed for these tasks.

---

## Dependencies

### New NPM Packages
None required - all features use existing dependencies.

---

## Performance Considerations

### Image Optimization
- Max 4 images per project
- 500KB limit per image
- Consider adding image compression in future
- Use lazy loading for image galleries

### Database Queries
- Index on username for fast lookups
- Eager loading for portfolio items
- Pagination for future scaling

---

## Security Checklist

- [ ] Image upload validates file types
- [ ] Image size limits enforced
- [ ] Ownership verified for edit/delete
- [ ] XSS protection for user inputs
- [ ] Username validation (no special chars)

---

## Documentation Links

- **Full Task Breakdown:** `PROFILE-ENHANCEMENTS.md`
- **Phase 1 Core Features:** `markdown-files/01-Phase-1-core-features.md`
- **AI Skills Feature:** `AI-SKILLS-FEATURE.md`

---

## Support & Issues

If you encounter issues:
1. Check the detailed task breakdown in `PROFILE-ENHANCEMENTS.md`
2. Review acceptance criteria for the specific task
3. Verify all dependencies are installed
4. Check backend logs for API errors
5. Review browser console for frontend errors

---

**Last Updated:** January 8, 2025  
**Status:** Ready to implement  
**Next Action:** Start with Task 1.6.1 (Skill Removal Fix)
