# Database Architecture & Configuration

## Database Location

**IMPORTANT: Correct Database Path**

The application uses SQLite for local development. The database file location is:

```
packages/backend/prisma/prisma/dev.db
```

### Why the nested `prisma/prisma` path?

Due to a migration issue during database regeneration, the actual database file is located in a nested `prisma` folder. This happened when resolving SQLite/PostgreSQL provider mismatches.

### Configuration

**Environment Variable (.env):**
```
DATABASE_URL="file:./prisma/dev.db"
```

The relative path in `.env` resolves to `prisma/prisma/dev.db` from the backend directory when Prisma runs.

### Database Files

There are multiple database files in the project:

1. **`packages/backend/prisma/prisma/dev.db`** ✅ ACTIVE - This is the database the backend actually uses
2. **`packages/backend/prisma/dev.db`** ⚠️ OUTDATED - Not used by the backend
3. **`packages/backend/prisma/dev.db.backup-*`** 📦 BACKUPS - Backup files
4. **`packages/backend/prisma/dev.db.old`** 📦 OLD - Previous database version

## Important Notes

### When Making Database Changes

Always ensure you're modifying the correct database:

```bash
# Correct path for direct SQLite queries
cd packages/backend
sqlite3 prisma/prisma/dev.db "YOUR_QUERY_HERE"
```

### When Running Migrations

```bash
cd packages/backend
npx prisma migrate dev
# OR
npx prisma db push
```

Prisma will automatically use the correct database based on the `DATABASE_URL` in `.env`.

### When Seeding Data

```bash
cd packages/backend
npx prisma db seed
```

### Verifying Active Database

To check which database file is being used:

```bash
# Check modification time - the active DB will have recent timestamp
ls -lh packages/backend/prisma/prisma/dev.db

# Check the data
sqlite3 packages/backend/prisma/prisma/dev.db "SELECT COUNT(*) FROM User;"
```

## Database Schema

The schema is defined in:
```
packages/backend/prisma/schema.prisma
```

Key models:
- **User** - User accounts with profiles, including `jobTitle` field
- **Team** - Team/project groups
- **TeamMember** - Team membership
- **Invitation** - Team invitations
- **Portfolio** - User portfolio items
- **WorkExperience** - User work history
- **Skills** - Skills catalog
- **UserSkill** - User-skill relationships

## Job Title Feature

The `jobTitle` field is stored in the `User` table:

```sql
-- User table excerpt
jobTitle TEXT NULL
```

### Backend Service

Job title is included in all user profile queries:
- `getUserById()` - [user.service.ts:40](../packages/backend/src/services/user.service.ts#L40)
- `getUserByUsername()` - [user.service.ts:104](../packages/backend/src/services/user.service.ts#L104)
- `searchUsers()` - [user.service.ts:256](../packages/backend/src/services/user.service.ts#L256)

### Frontend Display

Job title appears in:
- **Profile Page** - Below username, above bio ([ProfilePage.tsx:643-647](../packages/frontend/src/pages/ProfilePage.tsx#L643-L647))
- **Freelancers Page** - In freelancer cards ([FreelancersPage.tsx:426-430](../packages/frontend/src/pages/FreelancersPage.tsx#L426-L430))

## Migration History

### Recent Changes

1. **2025-10-17**: Fixed SQLite/PostgreSQL provider mismatch
   - Removed old PostgreSQL migrations
   - Created new SQLite migration baseline
   - Migration lock file set to `provider = "sqlite"`

2. **2025-10-17**: Database location clarification
   - Identified nested `prisma/prisma/dev.db` as active database
   - Documented correct path for future reference

## Production (Railway)

In production on Railway, the application uses PostgreSQL:

```bash
# Railway automatically sets DATABASE_URL to PostgreSQL connection
# Example (Railway overrides this automatically):
DATABASE_URL="postgresql://postgres:password@host:port/railway"
```

The Prisma schema supports both SQLite (development) and PostgreSQL (production).

## Troubleshooting

### Issue: Changes not appearing in the application

**Problem**: You modified data in `prisma/dev.db` but changes don't appear.

**Solution**: Modify the correct database at `prisma/prisma/dev.db`:

```bash
cd packages/backend
sqlite3 prisma/prisma/dev.db "UPDATE User SET jobTitle = 'Your Title' WHERE username = 'youruser';"
```

### Issue: Prisma migration errors

**Problem**: Migration provider mismatch errors.

**Solution**:
1. Check `prisma/migrations/migration_lock.toml` has `provider = "sqlite"`
2. Run `npx prisma generate` to regenerate client
3. Run `npx prisma db push` to sync schema

### Issue: Multiple database files confusion

**Solution**:
- Always use `prisma/prisma/dev.db` for development
- Consider cleaning up old database files once confirmed they're not needed

## Future Improvements

- [ ] Consolidate database files to single `prisma/dev.db` location
- [ ] Add database seeding script with sample data including job titles
- [ ] Create automated backup script
- [ ] Add migration guide for switching between SQLite and PostgreSQL
