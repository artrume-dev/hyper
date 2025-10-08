# 🚂 Railway Deployment Guide

## ✅ Build Status

**Backend**: ✅ TypeScript compilation successful  
**Frontend**: ✅ Vite build successful  
**Ready for deployment**: YES

## 📦 What Was Fixed

1. **TypeScript Build Errors**:
   - Fixed unused parameter warnings (`_req`, `_res`, `_next`)
   - Removed unused `config` import
   - Fixed JWT sign type error
   - Removed test config from production build

2. **Build Output**:
   - Backend: `packages/backend/dist/` (compiled TypeScript)
   - Frontend: `packages/frontend/dist/` (optimized bundle)

## 🚀 Railway Deployment Steps

### ⚠️ Important: Database Provider Change

The Prisma schema has been updated to use **PostgreSQL** for production (Railway) instead of SQLite. This is necessary because Railway doesn't support SQLite.

**What this means:**
- Local development: Still uses SQLite (`file:./prisma/dev.db`)
- Production (Railway): Uses PostgreSQL (Railway provides this)

### Step-by-Step Deployment

#### 1. Add PostgreSQL Database First

**Before deploying the backend**, create the PostgreSQL database:
- In Railway project, click "New" → "Database" → "Add PostgreSQL"
- Railway will automatically create a `DATABASE_URL` environment variable
- **Important**: Note this URL, you'll need it for migrations

#### 2. Backend Service Setup

**Create New Service in Railway**:
- Click "New" → "Empty Service"
- Connect to GitHub repository
- Configure:
  - **Root Directory**: `packages/backend`
  - **Build Command**: (leave empty, using railway.json)
  - **Start Command**: (leave empty, using railway.json)

**Environment Variables** (Add these in Railway dashboard):
```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<generate-with-command-below>
JWT_REFRESH_SECRET=<generate-with-command-below>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:5173
```

**Generate JWT Secrets**:
```bash
# Run these locally to generate secure secrets
openssl rand -base64 32
openssl rand -base64 32
```

**Railway Configuration Files** (already created):
- `packages/backend/railway.json` - Railway build/deploy config
- `packages/backend/nixpacks.toml` - Nixpacks build configuration

#### 3. Frontend Service

**Create Another Service**:
- Click "New" → "Deploy from GitHub repo" (same repo)
- Configure:
  - **Root Directory**: `hypergigs/packages/frontend`
  - **Build Command**: `npm install && npm run build`
  - **Start Command**: Leave empty (static site)
  - **Watch Paths**: `hypergigs/packages/frontend/**`

**Environment Variables**:
```env
VITE_API_URL=https://your-backend.railway.app
```

**Settings**:
- Go to Settings → Networking
- Generate Domain
- Copy the domain and update backend's `CORS_ORIGIN`

### Option 2: Deploy Separately

#### Backend Only

1. **railway.json** (create in `packages/backend/`):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build && npx prisma generate"
  },
  "deploy": {
    "startCommand": "npm run db:migrate:deploy && node dist/server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **nixpacks.toml** (create in `packages/backend/`):
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build", "npx prisma generate"]

[start]
cmd = "npm run db:migrate:deploy && node dist/server.js"
```

#### Frontend (Using Vercel/Netlify is easier)

**For Vercel**:
```json
{
  "buildCommand": "cd packages/frontend && npm install && npm run build",
  "outputDirectory": "packages/frontend/dist",
  "devCommand": "cd packages/frontend && npm run dev",
  "installCommand": "npm install"
}
```

## 🔧 Production Configuration

### Backend `.env` (Railway)
```env
NODE_ENV=production
PORT=${{PORT}}
DATABASE_URL=${{DATABASE_URL}}
JWT_SECRET=${{JWT_SECRET}}
JWT_REFRESH_SECRET=${{JWT_REFRESH_SECRET}}
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=${{CORS_ORIGIN}}
```

### Database Setup

Railway automatically provides PostgreSQL. To migrate:

```bash
# Railway will run this automatically with the start command
npx prisma migrate deploy
```

### CORS Configuration

Update `packages/backend/src/app.ts` for production:
```typescript
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

## 📋 Deployment Checklist

### Pre-Deployment

- [x] Build succeeds locally (`npm run build`)
- [x] All TypeScript errors resolved
- [x] Environment variables documented
- [ ] Update CORS origins for production
- [ ] Generate secure JWT secrets
- [ ] Test with production build locally

### Railway Setup

- [ ] Create Railway account
- [ ] Connect GitHub repository
- [ ] Create PostgreSQL database
- [ ] Set environment variables
- [ ] Deploy backend service
- [ ] Run database migrations
- [ ] Deploy frontend service
- [ ] Update CORS with frontend URL
- [ ] Test API endpoints
- [ ] Test frontend application

### Post-Deployment

- [ ] Verify backend health endpoint
- [ ] Test user registration
- [ ] Test user login
- [ ] Test all API endpoints
- [ ] Check database connections
- [ ] Monitor logs for errors
- [ ] Set up monitoring/alerts

## 🔍 Testing Production Build Locally

### Backend
```bash
cd packages/backend

# Build
npm run build

# Set up production env
cp .env.example .env.production
# Edit .env.production with production values

# Run migrations
npm run db:migrate:deploy

# Start production server
NODE_ENV=production node dist/server.js
```

### Frontend
```bash
cd packages/frontend

# Build
npm run build

# Preview production build
npx vite preview --port 5173
```

## 🌐 URLs After Deployment

**Backend API**: `https://your-backend.railway.app`  
**Frontend**: `https://your-frontend.railway.app`

**Health Check**: `https://your-backend.railway.app/health`  
**API Docs**: `https://your-backend.railway.app/api`

## 🐛 Troubleshooting

### Build Fails on Railway

**Problem**: Build command fails  
**Solution**: Check Railway logs, ensure all dependencies in package.json

### Database Connection Fails

**Problem**: Can't connect to PostgreSQL  
**Solution**: Ensure `DATABASE_URL` is set by Railway PostgreSQL addon

### CORS Errors

**Problem**: Frontend can't reach backend  
**Solution**: Update `CORS_ORIGIN` in backend env vars with frontend URL

### Migrations Fail

**Problem**: Prisma migrations don't run  
**Solution**: Use `npx prisma migrate deploy` in start command

## 📊 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Set to 'production' |
| `PORT` | No | 3001 | Server port (Railway auto-assigns) |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | Secret for JWT signing |
| `JWT_REFRESH_SECRET` | Yes | - | Secret for refresh tokens |
| `JWT_EXPIRES_IN` | No | 7d | Token expiration |
| `CORS_ORIGIN` | Yes | - | Allowed origins (comma-separated) |

## 🔒 Security Notes

1. **Never** commit `.env` files
2. Generate strong random secrets (use `openssl rand -base64 32`)
3. Use HTTPS only in production
4. Enable Railway's security features
5. Set up proper CORS origins
6. Use environment-specific configs

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app/)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/deployment)
- [Node.js Deployment Checklist](https://github.com/i0natan/nodebestpractices)

---

**Ready to deploy!** 🚀

Run `npm run build` to verify, then push to GitHub and deploy on Railway.
