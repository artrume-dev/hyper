# Testing Production Build Locally

This guide explains how to test your production build locally before deploying to Railway.

## Quick Start

```bash
# 1. Build the application
npm run build

# 2. Start production backend
npm run start:backend

# 3. In another terminal, serve production frontend
npm run preview:frontend
```

## Detailed Steps

### Step 1: Build for Production

```bash
cd /Users/samarmustafa/Documents/Samar/50-apps-to-launch/teamstack/hypergigs
npm run build
```

This compiles:
- Backend: TypeScript → JavaScript in `packages/backend/dist/`
- Frontend: React/Vite → Optimized bundle in `packages/frontend/dist/`

### Step 2: Start Production Backend

```bash
npm run start:backend
```

This runs the **compiled JavaScript** (not TypeScript) from `packages/backend/dist/server.js`.

**Backend will be available at:** http://localhost:3001

### Step 3: Serve Production Frontend

```bash
npm run preview:frontend
```

This serves the **production build** using Vite's preview server (simulates production).

**Frontend will be available at:** http://localhost:4173 (note: different port than dev)

### Step 4: Test the Application

Open http://localhost:4173 in your browser and test:

- ✅ Registration flow
- ✅ Login flow
- ✅ Profile creation
- ✅ Freelancer listing
- ✅ Network tab (check API calls work)
- ✅ Console (check for errors)

## Differences from Development Build

| Aspect | Development | Production |
|--------|-------------|------------|
| Backend | TypeScript with tsx | Compiled JavaScript |
| Frontend Port | 5173 | 4173 |
| Frontend Assets | Hot reload | Optimized/minified |
| Source Maps | Full | Minimal |
| Performance | Slower | Faster |
| Bundle Size | Larger | Optimized |

## Using Production Environment Variables

To fully simulate production, you can set environment variables:

```bash
# Backend with production-like config
NODE_ENV=production npm run start:backend
```

**Note:** Don't worry about CORS - the backend already allows both dev (5173) and preview (4173) ports.

## Serving Frontend with a Static Server

Alternatively, you can use any static file server:

```bash
# Using npx serve
npx serve -s packages/frontend/dist -p 4173

# Using Python
cd packages/frontend/dist
python3 -m http.server 4173

# Using Node's http-server
npx http-server packages/frontend/dist -p 4173
```

## Clean Build Test

To ensure a truly fresh production build:

```bash
# 1. Clean everything
rm -rf packages/backend/dist packages/frontend/dist
rm -rf node_modules
rm -rf packages/*/node_modules

# 2. Fresh install
npm install

# 3. Generate Prisma client
cd packages/backend
npx prisma generate
cd ../..

# 4. Build
npm run build

# 5. Test
npm run start:backend    # Terminal 1
npm run preview:frontend # Terminal 2
```

## Troubleshooting

### Backend won't start
```bash
# Check if port is in use
lsof -ti:3001

# Kill process if needed
lsof -ti:3001 | xargs kill -9

# Ensure Prisma client is generated
cd packages/backend && npx prisma generate
```

### Frontend shows blank page
1. Check browser console for errors
2. Verify `dist/index.html` exists
3. Check Network tab for failed asset loads
4. Ensure backend is running (frontend needs API)

### CORS errors
The backend CORS is configured for:
- http://localhost:5173 (dev)
- http://localhost:5174 (dev alternate)
- http://localhost:4173 (preview)

If using a different port, update `packages/backend/src/app.ts`:
```typescript
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

### Database issues
```bash
# Check if dev.db exists
ls -la packages/backend/prisma/dev.db

# Run migrations if needed
cd packages/backend
npx prisma migrate dev

# Check database contents
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM User;"
```

## What to Look For

### Performance
- Pages should load faster than dev mode
- Network tab: assets should be minified
- Bundle sizes should match build output (~471 kB for main JS)

### Functionality
- All features working exactly like dev mode
- API calls successful
- Authentication persists across refreshes
- No console errors

### Production Readiness Checklist
- [ ] Build completes without errors
- [ ] Backend starts successfully
- [ ] Frontend serves correctly
- [ ] Registration works
- [ ] Login works
- [ ] Profile page loads
- [ ] Freelancer listing displays
- [ ] No console errors
- [ ] No network errors
- [ ] Performance is good

## Next Steps

Once local production testing is successful:

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Deploy to Railway:**
   Follow `RAILWAY-DEPLOYMENT.md`

3. **Test on Railway:**
   Same tests but on production URL

## Quick Commands Reference

```bash
# Build
npm run build

# Start production backend
npm run start:backend

# Preview production frontend
npm run preview:frontend

# Stop all servers
pkill -f "node.*dist/server.js"  # Backend
# Ctrl+C in frontend terminal
```
