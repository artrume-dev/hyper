import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateTeams() {
  console.log('🔍 Finding duplicate teams...\n');

  // Get all teams grouped by slug
  const teams = await prisma.team.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: {
        select: {
          members: true,
          projects: true,
          invitations: true,
        },
      },
    },
  });

  // Group by name AND ownerId to find duplicates (same user creating same team)
  const teamsByNameOwner = new Map<string, typeof teams>();
  teams.forEach((team) => {
    const key = `${team.name.toLowerCase()}-${team.ownerId}`;
    const existing = teamsByNameOwner.get(key) || [];
    teamsByNameOwner.set(key, [...existing, team]);
  });

  // Find and delete duplicates (keep the first one created)
  let deletedCount = 0;
  
  for (const [key, duplicates] of teamsByNameOwner.entries()) {
    if (duplicates.length > 1) {
      console.log(`\n📋 Found ${duplicates.length} teams with name "${duplicates[0].name}":`);
      
      // Keep the first (oldest) team
      const [keepTeam, ...deleteTeams] = duplicates;
      
      console.log(`  ✅ Keeping: ${keepTeam.name} (ID: ${keepTeam.id}, Slug: ${keepTeam.slug}, Created: ${keepTeam.createdAt})`);
      
      // Delete the duplicates
      for (const team of deleteTeams) {
        console.log(`  ❌ Deleting: ${team.name} (ID: ${team.id}, Slug: ${team.slug}, Created: ${team.createdAt})`);
        console.log(`     - Members: ${team._count.members}, Projects: ${team._count.projects}, Invitations: ${team._count.invitations}`);
        
        try {
          await prisma.team.delete({
            where: { id: team.id },
          });
          deletedCount++;
          console.log(`     ✓ Deleted successfully`);
        } catch (error: any) {
          console.log(`     ✗ Error: ${error.message}`);
        }
      }
    }
  }

  console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} duplicate team(s).\n`);
}

cleanupDuplicateTeams()
  .catch((error) => {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
