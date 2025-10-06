# ✅ RAILWAY DEPLOYMENT - DO THIS NOW

## What Was the Problem?

Railway saw this error because Prisma schema was set to SQLite (`file:` protocol), but Railway needs PostgreSQL.

## ✅ Fixed Now!

The code is updated and pushed to GitHub. Railway will now work correctly.

## 🚀 Follow These Steps in Railway

### STEP 1: Add PostgreSQL Database (DO THIS FIRST!)

```
Railway Dashboard
└── Your Project
    └── Click "New"
        └── "Database"
            └── "Add PostgreSQL"
                └── Wait 30 seconds for it to provision
```

**Why first?** The backend needs `DATABASE_URL` to build successfully.

### STEP 2: Create/Configure Backend Service

```
Railway Dashboard
└── Your Project
    └── Click "New"
        └── "Empty Service" (or use existing if you already created one)
            └── Settings tab
                └── Root Directory: packages/backend
                └── Leave Build Command empty
                └── Leave Start Command empty
```

### STEP 3: Connect to GitHub

```
Backend Service
└── Settings
    └── Source
        └── "Connect Repo"
            └── Select: artrume-dev/hyper
            └── Branch: main
            └── Root Directory: packages/backend
```

### STEP 4: Add Environment Variables

```
Backend Service
└── Variables tab
    └── Click "New Variable"
```

Add these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `JWT_SECRET` | Generate with command below | Required |
| `JWT_REFRESH_SECRET` | Generate with command below | Required |
| `JWT_EXPIRES_IN` | `7d` | Optional |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Optional |
| `CORS_ORIGIN` | `http://localhost:5173` | Update after frontend deploys |

**Generate JWT secrets** - Run these in your terminal:
```bash
openssl rand -base64 32  # Copy output for JWT_SECRET
openssl rand -base64 32  # Copy output for JWT_REFRESH_SECRET
```

### STEP 5: Link PostgreSQL Database

```
Backend Service
└── Variables tab
    └── Click "New Variable"
        └── "Add Reference"
            └── Select your PostgreSQL database
            └── Select "DATABASE_URL"
```

This creates a `DATABASE_URL` variable that points to your PostgreSQL database.

### STEP 6: Deploy!

Railway will automatically deploy when you save the GitHub connection.

**Watch the build logs** - You should see:
```
✓ Installing dependencies
✓ Generating Prisma Client
✓ Building TypeScript
✓ Running migrations
✓ Starting server
```

### STEP 7: Test Your Backend

Once deployed, Railway gives you a URL like: `https://hypergigs-backend.up.railway.app`

**Test it:**
```bash
# Replace with your actual Railway URL
curl https://YOUR-BACKEND-URL.railway.app/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-10-06T..."}
```

## 🎯 What Changed in the Code?

### File: `packages/backend/prisma/schema.prisma`
```diff
datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
}
```

### New File: `packages/backend/railway.json`
Tells Railway how to build and deploy.

### New File: `packages/backend/nixpacks.toml`
Tells Railway which packages to install.

## 🔧 Troubleshooting

### If build still fails with DATABASE_URL error:

1. Make sure PostgreSQL is added BEFORE backend service
2. Make sure DATABASE_URL reference is added in backend variables
3. Check that Root Directory is set to `packages/backend`
4. Trigger redeploy: Settings → click "Deploy" button

### If migrations fail:

Check logs for specific error. Most common:
- DATABASE_URL not set → Add PostgreSQL reference
- Connection timeout → PostgreSQL might be starting, wait and redeploy

### If server won't start:

Check environment variables are all set, especially:
- NODE_ENV=production
- JWT_SECRET (set to a real value)
- JWT_REFRESH_SECRET (set to a real value)
- DATABASE_URL (should be auto-set from PostgreSQL)

## 📝 After Backend Works

1. **Get your backend URL** from Railway (e.g., `https://xxx.railway.app`)
2. **Deploy frontend** with environment variable:
   ```env
   VITE_API_URL=https://your-backend-url.railway.app
   ```
3. **Update backend CORS**:
   - Go to backend Variables
   - Change `CORS_ORIGIN` from `http://localhost:5173` to `https://your-frontend-url.railway.app`
   - Railway will auto-redeploy

## ✅ Quick Checklist

- [ ] PostgreSQL database added in Railway
- [ ] Backend service created
- [ ] GitHub repo connected (artrume-dev/hyper, main branch)
- [ ] Root directory set to `packages/backend`
- [ ] Environment variables added (NODE_ENV, JWT_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN)
- [ ] DATABASE_URL reference added (points to PostgreSQL)
- [ ] Deployment succeeded (check logs)
- [ ] Health endpoint returns 200 OK
- [ ] No errors in deployment logs

## 🎉 Success Looks Like

**Deployment tab:**
```
✓ Build completed
✓ Deployment live
```

**Logs tab:**
```
[info]: Express app configured
[info]: Database connected successfully
[info]: Server running on http://0.0.0.0:3001
```

**Health check:**
```bash
curl https://your-backend.railway.app/health
# Returns: {"status":"ok","timestamp":"..."}
```

---

**Everything is ready!** Just follow steps 1-7 above in Railway dashboard. 🚀
