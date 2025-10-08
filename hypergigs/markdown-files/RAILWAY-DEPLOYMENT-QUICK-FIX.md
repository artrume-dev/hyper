# 🚀 Railway Deployment - Quick Fix Guide

## ❌ Error You're Seeing

```
Error validating datasource `db`: the URL must start with the protocol `file:`.
```

## ✅ What Was Fixed

1. **Changed Prisma schema** from SQLite to PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"  // Changed from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **Created Railway configuration files**:
   - `packages/backend/railway.json`
   - `packages/backend/nixpacks.toml`

3. **Updated environment examples** to show PostgreSQL format

## 🔧 How to Deploy (Step-by-Step)

### Step 1: Add PostgreSQL Database in Railway

1. Go to your Railway project
2. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
3. Wait for it to provision (takes ~30 seconds)
4. Railway will automatically create a `DATABASE_URL` variable

### Step 2: Configure Backend Service

1. In Railway, select your backend service (or create new empty service)
2. Go to **Settings** → **Service Settings**
3. Set **Root Directory**: `packages/backend`
4. Leave Build Command and Start Command empty (they're in railway.json)

### Step 3: Add Environment Variables

In Railway service settings → **Variables**, add:

```env
NODE_ENV=production
JWT_SECRET=<run: openssl rand -base64 32>
JWT_REFRESH_SECRET=<run: openssl rand -base64 32>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:5173
```

**Important**: The `DATABASE_URL` should already be there from Step 1. If not, click "New Variable" → "Add Reference" → Select your PostgreSQL database.

### Step 4: Connect to GitHub

1. In Railway service settings → **Source**
2. Click **"Connect Repo"**
3. Select your repository: `artrume-dev/hyper`
4. Select branch: `main`
5. **Important**: Set **Root Directory** to `packages/backend`

### Step 5: Deploy

Railway will automatically:
1. Install dependencies
2. Generate Prisma client
3. Build TypeScript
4. Run database migrations
5. Start the server

**Watch the logs** to see progress.

### Step 6: Update CORS After Frontend Deploys

Once you deploy the frontend and get its URL:

1. Go to backend service → Variables
2. Update `CORS_ORIGIN` to: `https://your-frontend.railway.app`
3. Redeploy backend

## 🔍 What Railway Will Do

### Build Phase (automatic)
```bash
npm ci --omit=dev          # Install production dependencies
npx prisma generate        # Generate Prisma client for PostgreSQL
npm run build              # Compile TypeScript
```

### Deploy Phase (automatic)
```bash
npx prisma migrate deploy  # Run database migrations
node dist/server.js        # Start server
```

## 📊 Expected Build Output

You should see:
```
✓ Dependencies installed
✓ Prisma Client generated
✓ TypeScript compiled
✓ Migrations applied
✓ Server started on port $PORT
```

## ❗ Common Issues & Solutions

### Issue: "DATABASE_URL is not defined"

**Solution**: Make sure PostgreSQL database is added and linked:
1. Go to PostgreSQL service in Railway
2. Click on it
3. Go to "Variables" tab
4. You should see `DATABASE_URL`
5. In backend service, add a reference to this variable

### Issue: "Prisma Client generation failed"

**Solution**: Check that `railway.json` and `nixpacks.toml` are in `packages/backend/` directory.

### Issue: "Migration failed"

**Solution**: 
1. Check DATABASE_URL format is correct (should start with `postgresql://`)
2. Make sure PostgreSQL database is running
3. Check logs for specific error message

### Issue: "CORS errors after deployment"

**Solution**: Update backend's `CORS_ORIGIN` environment variable with your frontend's Railway URL.

## 🧪 Testing After Deployment

### 1. Check Health Endpoint
```bash
curl https://your-backend.railway.app/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### 2. Test Registration
```bash
curl -X POST https://your-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "username": "testuser",
    "role": "FREELANCER"
  }'
```

Expected: User object with token

### 3. Check Logs

In Railway dashboard:
- Go to your backend service
- Click "Deployments" tab
- Click on latest deployment
- View logs for any errors

## 📝 Local Development Still Works

**Important**: Your local development still uses SQLite!

The `.env` file has:
```env
DATABASE_URL="file:./prisma/dev.db"
```

This means:
- Local dev: SQLite (fast, file-based)
- Railway production: PostgreSQL (robust, cloud database)

Both use the same Prisma schema - Prisma handles the differences automatically.

## 🔄 Next Steps After Backend Deploys

1. Note your backend URL (e.g., `https://hypergigs-backend.railway.app`)
2. Deploy frontend with `VITE_API_URL` pointing to backend URL
3. Update backend's `CORS_ORIGIN` to frontend URL
4. Test registration, login, and all features

## 📚 Quick Reference

### Generate JWT Secrets
```bash
openssl rand -base64 32
```

### Check PostgreSQL Connection
In Railway PostgreSQL service → Connect → Copy connection string

### View Database
In Railway PostgreSQL service → Data tab (or use Prisma Studio locally with production URL)

## ✅ Checklist

- [ ] PostgreSQL database added in Railway
- [ ] Backend service created
- [ ] Root directory set to `packages/backend`
- [ ] Environment variables added (NODE_ENV, JWT secrets, CORS_ORIGIN)
- [ ] DATABASE_URL reference added (from PostgreSQL)
- [ ] GitHub repo connected
- [ ] Deployment succeeded
- [ ] Health endpoint works
- [ ] Logs show no errors
- [ ] Database migrations ran successfully

---

**You're ready to deploy!** Just follow the steps above and Railway will handle the rest. 🚀
