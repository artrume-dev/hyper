# 🚨 URGENT: Fix Frontend Production API URL

## Problem Identified

The frontend on Railway is making requests to:
```
https://hyper-production-a97e.up.railway.app/hyper-backend-production.up.railway.app/api/...
```

This is wrong! It's concatenating URLs incorrectly.

## Root Cause

The `VITE_API_URL` environment variable in Railway Frontend is:
- ❌ Missing the `https://` protocol
- ❌ Or not set at all

## Solution

### Step 1: Go to Railway Dashboard

1. Navigate to: **Railway Dashboard**
2. Select your project: **Hyper**
3. Click on: **Frontend Service** (hyper or hyper-production)

### Step 2: Set Environment Variable

Go to **Variables** tab and add/update:

```bash
VITE_API_URL=https://hyper-backend-production.up.railway.app
```

**IMPORTANT:** 
- ✅ Must include `https://`
- ✅ No trailing slash
- ✅ Use your actual backend Railway URL

### Step 3: Find Your Backend URL

If you don't know your backend URL:

1. Go to **Backend Service** in Railway
2. Click on **Settings** → **Networking** → **Public Networking**
3. Copy the domain (e.g., `hyper-backend-production.up.railway.app`)
4. Add `https://` prefix

### Step 4: Redeploy Frontend

After setting the variable:
1. Go to **Deployments** tab
2. Click **Deploy** or trigger a new deployment
3. Or make a small change and push to trigger auto-deploy

### Step 5: Verify

After deployment, test:
```bash
# Open browser console on production frontend
console.log(import.meta.env.VITE_API_URL)
# Should show: https://hyper-backend-production.up.railway.app
```

## Alternative: Use Relative URLs (If Same Domain)

If your frontend and backend share the same domain via Railway proxy:

```bash
VITE_API_URL=/api
```

But this only works if Railway is configured to route `/api/*` to backend.

## Quick Test

After fixing, the API calls should go to:
```
✅ https://hyper-backend-production.up.railway.app/api/auth/register
❌ NOT: https://hyper-production-a97e.up.railway.app/hyper-backend-production.up.railway.app/...
```

## Environment Variables Summary

### Frontend (Railway):
```bash
VITE_API_URL=https://hyper-backend-production.up.railway.app
```

### Backend (Railway):
```bash
CORS_ORIGIN=https://hyper-production-a97e.up.railway.app
FRONTEND_URL=https://hyper-production-a97e.up.railway.app
```

Make sure these URLs match your actual Railway deployment URLs!
