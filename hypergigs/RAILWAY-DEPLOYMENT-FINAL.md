# Railway Deployment - Final Checklist ✅

## Pre-Deployment Status

### ✅ Completed Items:
- [x] `.env` files in `.gitignore` (not tracked by git)
- [x] PostgreSQL configured in Prisma schema
- [x] Railway configuration files present (railway.json, nixpacks.toml)
- [x] Build scripts working correctly
- [x] CORS updated to support production URLs
- [x] Production build tested locally

### ⚠️ Required Before Deployment:

## 1. Railway Environment Variables

Go to **Railway Dashboard** → Your Project → **Backend Service** → **Variables**

Set these environment variables:

```bash
# Required - Set these NOW
NODE_ENV=production
DATABASE_URL=<automatically-set-by-railway-postgresql>
PORT=3001

# Generate these secrets (see command below)
JWT_SECRET=<generate-strong-random-secret>
JWT_REFRESH_SECRET=<generate-strong-random-secret>

# JWT Configuration
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS - Replace with your actual Railway frontend URL
CORS_ORIGIN=https://your-frontend-app.railway.app
FRONTEND_URL=https://your-frontend-app.railway.app

# Socket.io
SOCKET_PORT=3002
```

## 2. Generate Strong JWT Secrets

Run these commands locally to generate secure secrets:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET  
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste into Railway environment variables.

## 3. Frontend Deployment

### Backend is ready, but Frontend needs:

1. **Update Frontend Environment Variable in Railway:**
   - Go to Railway → Frontend Service → Variables
   - Set: `VITE_API_URL=https://your-backend-app.railway.app`

2. **Or use relative API calls** (if frontend and backend on same domain)

## 4. Deployment Steps

### Option A: Push to GitHub (Automatic)
```bash
# Review changes
git status

# Stage changes
git add packages/backend/src/app.ts

# Commit
git commit -m "fix: Update CORS to support production frontend URL with environment variables"

# Push (Railway will auto-deploy)
git push origin main
```

### Option B: Manual Deploy via Railway CLI
```bash
railway up
```

## 5. Post-Deployment Verification

After deployment, verify:

1. **Backend Health Check:**
   ```bash
   curl https://your-backend-app.railway.app/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Database Connection:**
   - Check Railway logs for "Database connected successfully"

3. **API Endpoints:**
   ```bash
   curl https://your-backend-app.railway.app/api
   ```

4. **Frontend Connection:**
   - Open frontend URL
   - Check browser console for CORS errors
   - Test registration/login

## 6. Troubleshooting

### If deployment fails:

1. **Check Railway Logs:**
   - Railway Dashboard → Service → Deployments → View Logs

2. **Common Issues:**
   - Missing environment variables → Check Variables tab
   - Database not connected → Verify DATABASE_URL is set
   - Build errors → Check package.json scripts
   - CORS errors → Verify CORS_ORIGIN matches frontend URL

### If CORS errors persist:

Add this to Railway backend environment variables:
```bash
CORS_ORIGIN=https://your-exact-frontend-url.railway.app
```

## 7. Environment Variables Summary

### Backend (Railway):
```
NODE_ENV=production
DATABASE_URL=<auto-set-by-railway>
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=<frontend-url>
FRONTEND_URL=<frontend-url>
PORT=3001
SOCKET_PORT=3002
```

### Frontend (Railway):
```
VITE_API_URL=<backend-url>
```

## 8. Final Pre-Push Checklist

- [ ] JWT secrets generated and set in Railway
- [ ] CORS_ORIGIN set to production frontend URL
- [ ] DATABASE_URL verified (Railway sets automatically)
- [ ] NODE_ENV=production set in Railway
- [ ] Build tested locally
- [ ] .env files NOT in git (verified ✅)
- [ ] Railway configuration files present (verified ✅)

## 9. Ready to Deploy! 🚀

Once all checklist items are complete:

```bash
git add .
git commit -m "feat: Production-ready deployment with PostgreSQL and CORS configuration"
git push origin main
```

Railway will automatically:
1. Detect the push
2. Build the application
3. Run database migrations
4. Deploy the new version
5. Start the server

Monitor the deployment in Railway Dashboard → Deployments

---

**Note:** Your local .env file will remain unchanged and won't be committed (it's in .gitignore).
