# System Design Document (SDD) - Phase 3
## Polish, Data Migration & Deployment

**Phase:** 3 - Polish & Migration  
**Duration:** 2 weeks  
**Priority:** P0 (Critical)  
**Status:** Planning

---

## Phase 3 Overview

### Goals
- Migrate data from legacy system
- Polish UI/UX based on feedback
- Implement production deployment
- Set up monitoring and logging
- Create admin tools
- Finalize documentation

### Dependencies
- Phase 0, 1, and 2 completed
- Access to legacy database
- Production infrastructure ready

### Success Criteria
- [ ] All legacy data migrated successfully
- [ ] Zero critical bugs in production
- [ ] Performance benchmarks met
- [ ] Monitoring dashboards operational
- [ ] Documentation complete

---

## Feature Tasks

### Task 3.1: Data Migration
**Branch:** `feature/3.1-data-migration`  
**Estimated Time:** 5 days  
**Assignee:** TBD

#### Subtasks
- [ ] Analyze legacy database schema
- [ ] Create migration scripts
- [ ] Build data transformation logic
- [ ] Implement validation checks
- [ ] Test migration on staging
- [ ] Create rollback procedures
- [ ] Document migration process

#### Technical Specifications

**Migration Script (scripts/migrate-data.ts):**
```typescript
import { PrismaClient as LegacyPrisma } from './legacy-prisma';
import { PrismaClient as NewPrisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const legacyDb = new LegacyPrisma();
const newDb = new NewPrisma();

interface MigrationStats {
  users: { total: number; migrated: number; failed: number };
  teams: { total: number; migrated: number; failed: number };
  invitations: { total: number; migrated: number; failed: number };
  messages: { total: number; migrated: number; failed: number };
}

class DataMigration {
  private stats: MigrationStats = {
    users: { total: 0, migrated: 0, failed: 0 },
    teams: { total: 0, migrated: 0, failed: 0 },
    invitations: { total: 0, migrated: 0, failed: 0 },
    messages: { total: 0, migrated: 0, failed: 0 }
  };
  
  async migrate() {
    console.log('Starting data migration...');
    
    try {
      await this.migrateUsers();
      await this.migrateTeams();
      await this.migrateTeamMembers();
      await this.migrateFollows();
      await this.migrateInvitations();
      await this.migrateMessages();
      
      this.printStats();
      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
  
  private async migrateUsers() {
    console.log('Migrating users...');
    
    const legacyUsers = await legacyDb.user.findMany();
    this.stats.users.total = legacyUsers.length;
    
    for (const legacyUser of legacyUsers) {
      try {
        // Map legacy fields to new schema
        await newDb.user.create({
          data: {
            id: legacyUser.id,
            email: legacyUser.email,
            password: legacyUser.password, // Already hashed
            firstName: legacyUser.first_name,
            lastName: legacyUser.last_name,
            username: legacyUser.username,
            role: this.mapUserRole(legacyUser.role),
            avatar: legacyUser.avatar_url,
            bio: legacyUser.bio,
            skills: legacyUser.skills ? legacyUser.skills.split(',') : [],
            location: legacyUser.location,
            website: legacyUser.website,
            isVerified: legacyUser.is_verified,
            isActive: legacyUser.is_active,
            createdAt: legacyUser.created_at,
            updatedAt: legacyUser.updated_at
          }
        });
        
        this.stats.users.migrated++;
      } catch (error) {
        console.error(`Failed to migrate user ${legacyUser.id}:`, error);
        this.stats.users.failed++;
      }
    }
    
    console.log(`Migrated ${this.stats.users.migrated}/${this.stats.users.total} users`);
  }
  
  private async migrateTeams() {
    console.log('Migrating teams...');
    
    const legacyTeams = await legacyDb.team.findMany();
    this.stats.teams.total = legacyTeams.length;
    
    for (const legacyTeam of legacyTeams) {
      try {
        await newDb.team.create({
          data: {
            id: legacyTeam.id,
            name: legacyTeam.name,
            slug: legacyTeam.slug || this.generateSlug(legacyTeam.name),
            description: legacyTeam.description,
            avatar: legacyTeam.avatar_url,
            type: this.mapTeamType(legacyTeam.type),
            isActive: legacyTeam.is_active !== false,
            createdAt: legacyTeam.created_at,
            updatedAt: legacyTeam.updated_at
          }
        });
        
        this.stats.teams.migrated++;
      } catch (error) {
        console.error(`Failed to migrate team ${legacyTeam.id}:`, error);
        this.stats.teams.failed++;
      }
    }
    
    console.log(`Migrated ${this.stats.teams.migrated}/${this.stats.teams.total} teams`);
  }
  
  private async migrateTeamMembers() {
    console.log('Migrating team members...');
    
    const legacyMembers = await legacyDb.teamMember.findMany();
    
    for (const member of legacyMembers) {
      try {
        await newDb.teamMember.create({
          data: {
            userId: member.user_id,
            teamId: member.team_id,
            role: this.mapTeamRole(member.role),
            joinedAt: member.joined_at || member.created_at
          }
        });
      } catch (error) {
        console.error(`Failed to migrate team member:`, error);
      }
    }
  }
  
  private async migrateFollows() {
    console.log('Migrating follows...');
    
    const legacyFollows = await legacyDb.follow.findMany();
    
    for (const follow of legacyFollows) {
      try {
        await newDb.follow.create({
          data: {
            followerId: follow.follower_id,
            followingId: follow.following_id,
            createdAt: follow.created_at
          }
        });
      } catch (error) {
        console.error(`Failed to migrate follow:`, error);
      }
    }
  }
  
  private async migrateInvitations() {
    console.log('Migrating invitations...');
    
    const legacyInvitations = await legacyDb.invitation.findMany();
    this.stats.invitations.total = legacyInvitations.length;
    
    for (const invitation of legacyInvitations) {
      try {
        await newDb.invitation.create({
          data: {
            id: invitation.id,
            senderId: invitation.sender_id,
            receiverId: invitation.receiver_id,
            teamId: invitation.team_id,
            status: this.mapInvitationStatus(invitation.status),
            message: invitation.message,
            expiresAt: invitation.expires_at,
            respondedAt: invitation.responded_at,
            createdAt: invitation.created_at,
            updatedAt: invitation.updated_at
          }
        });
        
        this.stats.invitations.migrated++;
      } catch (error) {
        console.error(`Failed to migrate invitation ${invitation.id}:`, error);
        this.stats.invitations.failed++;
      }
    }
  }
  
  private async migrateMessages() {
    console.log('Migrating messages...');
    
    const legacyMessages = await legacyDb.message.findMany();
    this.stats.messages.total = legacyMessages.length;
    
    for (const message of legacyMessages) {
      try {
        await newDb.message.create({
          data: {
            id: message.id,
            senderId: message.sender_id,
            receiverId: message.receiver_id,
            content: message.content,
            isRead: message.is_read,
            readAt: message.read_at,
            createdAt: message.created_at
          }
        });
        
        this.stats.messages.migrated++;
      } catch (error) {
        console.error(`Failed to migrate message ${message.id}:`, error);
        this.stats.messages.failed++;
      }
    }
  }
  
  private mapUserRole(legacyRole: string): string {
    const roleMap: Record<string, string> = {
      'freelancer': 'FREELANCER',
      'agency': 'AGENCY',
      'startup': 'STARTUP'
    };
    return roleMap[legacyRole?.toLowerCase()] || 'FREELANCER';
  }
  
  private mapTeamType(legacyType: string): string {
    const typeMap: Record<string, string> = {
      'project': 'PROJECT',
      'agency': 'AGENCY',
      'startup': 'STARTUP'
    };
    return typeMap[legacyType?.toLowerCase()] || 'PROJECT';
  }
  
  private mapTeamRole(legacyRole: string): string {
    const roleMap: Record<string, string> = {
      'owner': 'OWNER',
      'admin': 'ADMIN',
      'member': 'MEMBER'
    };
    return roleMap[legacyRole?.toLowerCase()] || 'MEMBER';
  }
  
  private mapInvitationStatus(legacyStatus: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'PENDING',
      'accepted': 'ACCEPTED',
      'declined': 'DECLINED',
      'expired': 'EXPIRED'
    };
    return statusMap[legacyStatus?.toLowerCase()] || 'PENDING';
  }
  
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  private printStats() {
    console.log('\n=== Migration Statistics ===');
    console.log(`Users: ${this.stats.users.migrated}/${this.stats.users.total} (${this.stats.users.failed} failed)`);
    console.log(`Teams: ${this.stats.teams.migrated}/${this.stats.teams.total} (${this.stats.teams.failed} failed)`);
    console.log(`Invitations: ${this.stats.invitations.migrated}/${this.stats.invitations.total} (${this.stats.invitations.failed} failed)`);
    console.log(`Messages: ${this.stats.messages.migrated}/${this.stats.messages.total} (${this.stats.messages.failed} failed)`);
  }
}

// Run migration
const migration = new DataMigration();
migration.migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
```

**Validation Script (scripts/validate-migration.ts):**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateMigration() {
  console.log('Validating migration...\n');
  
  const checks = {
    users: await validateUsers(),
    teams: await validateTeams(),
    relationships: await validateRelationships(),
    dataIntegrity: await validateDataIntegrity()
  };
  
  const allPassed = Object.values(checks).every(check => check);
  
  if (allPassed) {
    console.log('\n✅ All validation checks passed!');
  } else {
    console.log('\n❌ Some validation checks failed!');
    process.exit(1);
  }
}

async function validateUsers(): Promise<boolean> {
  const userCount = await prisma.user.count();
  const usersWithoutEmail = await prisma.user.count({
    where: { email: null }
  });
  
  console.log(`Users: ${userCount} total`);
  
  if (usersWithoutEmail > 0) {
    console.log(`❌ Found ${usersWithoutEmail} users without email`);
    return false;
  }
  
  console.log('✅ All users have required fields');
  return true;
}

async function validateTeams(): Promise<boolean> {
  const teamCount = await prisma.team.count();
  const teamsWithoutOwner = await prisma.team.findMany({
    where: {
      members: {
        none: { role: 'OWNER' }
      }
    }
  });