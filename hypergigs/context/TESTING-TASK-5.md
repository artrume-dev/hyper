# Testing Task 5: Multiple Portfolio Images

## Server Status ✅
- **Frontend:** http://localhost:5173 ✅ Running
- **Backend:** http://localhost:3001 ✅ Running

## Fixed Issues
✅ Removed extra closing brace causing "return outside of function" error
✅ All TypeScript compilation errors resolved
✅ Both servers running successfully

## Test Scenarios

### 1. Add Portfolio with Multiple Images
- [ ] Navigate to your profile page (john@example.com / password123)
- [ ] Click "+ Add Portfolio" button
- [ ] Fill in portfolio details (name, description, company, role, URL)
- [ ] Click the upload area or drag images
- [ ] **Test:** Upload 1 image - should show preview with delete button
- [ ] **Test:** Upload 2 more images - should show all 3 in grid
- [ ] **Test:** Upload 1 more - should show 4 images total
- [ ] **Test:** Try uploading 5th image - should show "Maximum 4 images allowed" alert
- [ ] **Test:** Click delete button on one image - should remove it
- [ ] Click "Add Portfolio" to save
- [ ] Verify portfolio appears with first image as thumbnail
- [ ] Verify "3 photos" badge appears if multiple images

### 2. Edit Portfolio Images
- [ ] Click edit button on existing portfolio
- [ ] Should see existing images in grid
- [ ] **Test:** Add more images (up to max 4 total)
- [ ] **Test:** Delete an existing image
- [ ] **Test:** Try exceeding 4 image limit
- [ ] Click "Save" to update
- [ ] Verify changes persisted

### 3. Image Size Validation
- [ ] Try uploading image > 500KB
- [ ] Should see "Image too large. Max size is 500KB" alert
- [ ] Image should not be added to preview

### 4. Multiple File Selection
- [ ] Click upload area
- [ ] Select multiple files at once (Cmd+Click or Shift+Click)
- [ ] All selected images should upload (up to remaining slots)

### 5. Drag and Drop
- [ ] Drag multiple image files onto upload area
- [ ] All dropped images should upload (up to remaining slots)

### 6. Portfolio Display
- [ ] View profile page with portfolios
- [ ] Each portfolio should show:
  - First image as main thumbnail
  - "X photos" badge if multiple images
  - Hover effect on thumbnail
- [ ] Click "View Project" link - should open in new tab

### 7. Data Persistence
- [ ] Add portfolio with 3 images
- [ ] Refresh page
- [ ] Navigate back to profile
- [ ] All 3 images should still be there
- [ ] Edit and save - changes should persist

### 8. Edge Cases
- [ ] Add portfolio with 0 images (should work)
- [ ] Add portfolio with 1 image (should work, no badge)
- [ ] Add portfolio with exactly 4 images
- [ ] Delete all images from existing portfolio
- [ ] Upload same image multiple times (should allow)

## Expected UI Behavior

### Add Form
```
Project Images (2/4)
┌─────────┬─────────┐
│ [img] X │ [img] X │  ← Grid of uploaded images
├─────────┴─────────┤
│   📷 Click to     │  ← Upload area (only if < 4)
│   upload          │
│   (max 4)         │
└───────────────────┘
```

### Portfolio Card
```
┌─────────────────┐
│                 │
│   [thumbnail]   │  ← First image
│     "3 photos"  │  ← Badge overlay
│                 │
├─────────────────┤
│ Project Name    │
│ Company • Role  │
└─────────────────┘
```

## Backend API Check

### Test Portfolio Creation
```bash
curl -X POST http://localhost:3001/api/users/portfolio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Project",
    "description": "Test description",
    "mediaFiles": ["data:image/png;base64,...", "data:image/png;base64,..."]
  }'
```

### Expected Response
```json
{
  "portfolio": {
    "id": "...",
    "name": "Test Project",
    "mediaFiles": ["...", "..."],  // Array of base64 strings
    ...
  }
}
```

### Database Check
```bash
cd packages/backend
npx prisma studio
```
- Open Portfolio table
- Check `mediaFiles` column - should contain JSON array string like: `["data:image/...","data:image/..."]`

## Common Issues & Solutions

### Issue: Images not showing after save
**Solution:** Check browser console for errors. Verify mediaFiles is an array in response.

### Issue: "Maximum 4 images" alert not working
**Solution:** Check MAX_PORTFOLIO_IMAGES constant is set to 4

### Issue: Images too large
**Solution:** Use images < 500KB or implement client-side compression

### Issue: Drag & drop not working
**Solution:** Verify `onDragOver` has `e.preventDefault()`

### Issue: Delete button not visible
**Solution:** Hover over image - button should appear (opacity transition)

## Browser Console Checks

Open DevTools (F12) and check:
1. No console errors
2. Network tab shows successful POST/PUT requests
3. Response contains `mediaFiles` as array
4. No CORS errors

## Next Steps After Testing

If all tests pass:
- [ ] Commit changes to git
- [ ] Update TASK-PROGRESS-SUMMARY.md
- [ ] Move to Task 6: Project Detail Page
- [ ] Create image carousel component for gallery view

## Quick Commands

**View Logs:**
```bash
# Frontend (should show Vite server running)
# Backend task output shows API requests

# Check database
cd packages/backend
npx prisma studio
```

**Restart Servers:**
```bash
# Kill all
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Start backend
npm run dev:backend

# Start frontend  
cd packages/frontend && npm run dev
```

---

## 🚀 Ready to Test!

Navigate to: **http://localhost:5173**

Login with:
- Email: `john@example.com`
- Password: `password123`

Then navigate to your profile and start testing the multi-image upload! 📸
