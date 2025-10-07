# Backend Database Setup

## Important: PostgreSQL for Both Dev & Production

This project now uses **PostgreSQL for both development and production** to ensure consistency and avoid migration issues.

### Why PostgreSQL Everywhere?

✅ **Consistency**: Same database in dev and production  
✅ **No Migration Issues**: Avoid SQLite ↔ PostgreSQL conversion problems  
✅ **Production Features**: Test production database features locally  
✅ **Easier Deployment**: One set of migrations works everywhere  

## Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
cd packages/backend
./setup-postgres.sh
```

This script will:
1. Check if PostgreSQL is installed
2. Start PostgreSQL if needed
3. Create `hypergigs_dev` database
4. Update `.env` with PostgreSQL URL
5. Run migrations

### Option 2: Manual Setup

#### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

#### 2. Create Database

```bash
createdb hypergigs_dev
```

#### 3. Update .env

```env
DATABASE_URL="postgresql://localhost:5432/hypergigs_dev"
```

#### 4. Run Migrations

```bash
npx prisma migrate deploy
```

### Option 3: Docker PostgreSQL (Alternative)

If you don't want to install PostgreSQL locally:

**1. Create docker-compose.yml:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: hypergigs_dev
      POSTGRES_USER: hypergigs
      POSTGRES_PASSWORD: hypergigs
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**2. Start Docker:**
```bash
docker-compose up -d
```

**3. Update .env:**
```env
DATABASE_URL="postgresql://hypergigs:hypergigs@localhost:5432/hypergigs_dev"
```

**4. Run Migrations:**
```bash
npx prisma migrate deploy
```

## Development Workflow

### Start Development Server

```bash
npm run dev
```

### View/Edit Database

```bash
npx prisma studio
```

Opens a web UI at http://localhost:5555 to view and edit data.

### Create New Migration

```bash
# After changing schema.prisma
npx prisma migrate dev --name description_of_change
```

### Reset Database (Delete All Data)

```bash
npx prisma migrate reset
```

⚠️ **Warning**: This deletes ALL data!

## Production (Railway)

Railway automatically:
1. Provisions PostgreSQL database
2. Sets `DATABASE_URL` environment variable
3. Runs `npx prisma migrate deploy` on deployment
4. Connects to PostgreSQL

No additional setup needed!

## Troubleshooting

### "Connection refused" Error

**Problem**: PostgreSQL not running

**Solution**:
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Docker
docker-compose up -d
```

### "Database does not exist" Error

**Problem**: Database not created

**Solution**:
```bash
createdb hypergigs_dev
```

### "Cannot connect to postgresql://localhost:5432"

**Problem**: Wrong DATABASE_URL in .env

**Solution**: Check `.env` file:
```env
DATABASE_URL="postgresql://localhost:5432/hypergigs_dev"
```

### Migrations Out of Sync

**Problem**: Migration errors after pulling latest code

**Solution**:
```bash
# Option 1: Apply new migrations
npx prisma migrate deploy

# Option 2: Reset and start fresh (⚠️ deletes data)
npx prisma migrate reset
```

## Environment Variables

### Development (.env)

```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://localhost:5432/hypergigs_dev"
JWT_SECRET=your-dev-secret
JWT_REFRESH_SECRET=your-dev-refresh-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:5173
```

### Production (Railway)

Railway automatically sets:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Assigned by Railway

You need to set:
- `NODE_ENV=production`
- `JWT_SECRET` (generate with `openssl rand -base64 32`)
- `JWT_REFRESH_SECRET` (generate with `openssl rand -base64 32`)
- `CORS_ORIGIN` (your frontend URL)

## Database Schema

Current schema is in `prisma/schema.prisma`.

Key models:
- **User**: User accounts (freelancers, agencies, startups)
- **Team**: Teams and projects
- **TeamMember**: User membership in teams
- **Invitation**: Team invitations
- **Message**: Direct and team messages
- **Notification**: User notifications
- **Skill**: Skills and expertise
- **Portfolio**: User portfolio items
- **WorkExperience**: User work history
- **Project**: Team projects

## Common Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# View database in web UI
npx prisma studio

# Create migration
npx prisma migrate dev --name my_migration

# Apply migrations (production)
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Check database connection
npx prisma db push --accept-data-loss
```

## Migration History

Current migrations:
- `20251007000000_init` - Initial PostgreSQL schema with all tables

Previous SQLite migrations were removed on Oct 7, 2025 when migrating to PostgreSQL.

---

For deployment guide, see: `../../RAILWAY-DEPLOYMENT.md`
