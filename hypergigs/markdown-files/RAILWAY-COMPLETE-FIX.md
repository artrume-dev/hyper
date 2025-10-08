# 🚨 URGENT: Fix Railway Production CORS & Environment Variables

## Issues Found

### 1. CORS Error on Production
```
Access to XMLHttpRequest at 'https://hyper-backend-production.up.railway.app/api/auth/register' 
from origin 'https://hyper-production-a97e.up.railway.app' has been blocked by CORS policy
```

### 2. Environment Variables Not Set in Railway

## Complete Fix - Railway Environment Variables

### 🔧 Backend Service (hyper-backend-production)

Go to: **Railway Dashboard → Backend Service → Variables**

Set ALL these variables:

```bash
# Environment
NODE_ENV=production

# Server
PORT=3001

# Database (automatically set by Railway PostgreSQL - verify it exists)
DATABASE_URL=<should-be-automatically-set>

# JWT Secrets (CRITICAL - use these exact values)
JWT_SECRET=05a97976e5cce708e2de00a5ec6dd4ce95a5b7f604140d4b3c05f789398bbdb1d48e535610b2bbe9efc29b968e4d8e2a738ef7807037355be9230a5904192a15

JWT_REFRESH_SECRET=bc00e1a1c278e102204d98d4f645bf27de92889f07b6990a785376d717e69924d95852a3f819816fd601ea9100464533eb4403aef01f53409c600ac3e1af87f8

JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS - THIS FIXES THE CORS ERROR
CORS_ORIGIN=https://hyper-production-a97e.up.railway.app
FRONTEND_URL=https://hyper-production-a97e.up.railway.app

# Socket.io
SOCKET_PORT=3002
```

**CRITICAL:** The `CORS_ORIGIN` must exactly match your frontend URL!

### 🎨 Frontend Service (hyper-production)

Go to: **Railway Dashboard → Frontend Service → Variables**

Set this variable:

```bash
# API URL - THIS FIXES THE URL CONCATENATION ERROR
VITE_API_URL=https://hyper-backend-production.up.railway.app
```

**CRITICAL:** Must include `https://` and no trailing slash!

## Step-by-Step Instructions

### Step 1: Backend Variables

1. Go to **Railway Dashboard**
2. Click on **Backend Service** (hyper-backend-production or Hyper Backend)
3. Click **Variables** tab
4. Click **+ New Variable** for each one
5. Copy-paste the exact values above
6. Click **Deploy** or wait for auto-redeploy

### Step 2: Frontend Variables

1. Stay in **Railway Dashboard**
2. Click on **Frontend Service** (hyper-production or hyper)
3. Click **Variables** tab
4. Add:
   ```
   Variable: VITE_API_URL
   Value: https://hyper-backend-production.up.railway.app
   ```
5. Click **Deploy** or wait for auto-redeploy

### Step 3: Verify URLs Match

Make sure your URLs are exactly:
- Frontend: `https://hyper-production-a97e.up.railway.app`
- Backend: `https://hyper-backend-production.up.railway.app`

If they're different, update the variables accordingly!

### Step 4: Redeploy

After setting all variables:
1. Go to **Deployments** tab for each service
2. Click **Redeploy** or make a small code change to trigger deployment
3. Monitor the deployment logs

## Verification Checklist

After deployment, verify:

### ✅ Backend Health Check
```bash
curl https://hyper-backend-production.up.railway.app/health
```
Should return: `{"status":"ok","timestamp":"..."}`

### ✅ Backend API Info
```bash
curl https://hyper-backend-production.up.railway.app/api
```
Should return API info

### ✅ Frontend Loads
Open: `https://hyper-production-a97e.up.railway.app`
- Should load without errors
- Check browser console (F12)
- No CORS errors should appear

### ✅ Registration Works
1. Go to `/register` page
2. Fill in the form
3. Submit
4. Should successfully register (no CORS error)

## Common Issues & Solutions

### Issue 1: Still Getting CORS Error
**Solution:** 
- Double-check `CORS_ORIGIN` exactly matches frontend URL
- Verify backend redeployed after setting variables
- Check Railway logs for CORS warnings

### Issue 2: URL Still Concatenating
**Solution:**
- Verify `VITE_API_URL` includes `https://`
- Rebuild frontend after setting variable
- Clear browser cache

### Issue 3: Database Connection Error
**Solution:**
- Verify `DATABASE_URL` is set by Railway PostgreSQL plugin
- Check if PostgreSQL service is running
- Verify backend and PostgreSQL are linked

### Issue 4: JWT Errors
**Solution:**
- Verify JWT secrets are set exactly as provided
- They must be 128-character hex strings
- No extra spaces or quotes

## Quick Reference

### Your Production URLs:
```
Frontend: https://hyper-production-a97e.up.railway.app
Backend:  https://hyper-backend-production.up.railway.app
```

### Required Backend Variables:
```
NODE_ENV=production
CORS_ORIGIN=https://hyper-production-a97e.up.railway.app
FRONTEND_URL=https://hyper-production-a97e.up.railway.app
JWT_SECRET=<see above>
JWT_REFRESH_SECRET=<see above>
```

### Required Frontend Variables:
```
VITE_API_URL=https://hyper-backend-production.up.railway.app
```

## After Setting Variables

1. ✅ Backend will redeploy automatically
2. ✅ Frontend will redeploy automatically
3. ✅ CORS will be fixed
4. ✅ API calls will work correctly
5. ✅ Registration/Login will work

## Monitor Deployment

Watch the logs in Railway:
- Backend: **Deployments → Latest → View Logs**
- Look for: "Server running on..." and "Database connected successfully"

If you see any errors, check the logs and verify all environment variables are set correctly.

---

**⚠️ Important Notes:**
- Browser extension errors like "Could not establish connection" are harmless - ignore them
- Focus on the CORS and API URL issues
- All variables are case-sensitive
- URLs must not have trailing slashes
- After setting variables, deployments happen automatically
