/**
 * Migration script to convert old team types to new generic types
 * and set default values for new hierarchical fields
 *
 * Run this AFTER running prisma migrate dev
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping from old team types to new ones
const TEAM_TYPE_MAPPING: Record<string, string> = {
  'PROJECT': 'TEAM',
  'AGENCY': 'ORGANIZATION',
  'STARTUP': 'COMPANY',
};

async function migrateTeamTypes() {
  console.log('Starting team type migration...\n');

  try {
    // Get all teams
    const teams = await prisma.team.findMany();
    console.log(`Found ${teams.length} teams to migrate\n`);

    for (const team of teams) {
      const oldType = team.type;
      const newType = TEAM_TYPE_MAPPING[oldType] || oldType;

      if (oldType !== newType) {
        console.log(`Migrating team "${team.name}" (${team.id})`);
        console.log(`  Old type: ${oldType} → New type: ${newType}`);

        await prisma.team.update({
          where: { id: team.id },
          data: { type: newType },
        });

        console.log(`  ✓ Updated\n`);
      } else {
        console.log(`Team "${team.name}" already has valid type: ${newType}\n`);
      }
    }

    // Verify migration
    const updatedTeams = await prisma.team.findMany({
      select: { name: true, type: true, isMainTeam: true, parentTeamId: true },
    });

    console.log('\n=== Migration Summary ===');
    console.log(`Total teams: ${updatedTeams.length}`);
    console.log(`Main teams: ${updatedTeams.filter((t) => t.isMainTeam).length}`);
    console.log(`Sub-teams: ${updatedTeams.filter((t) => !t.isMainTeam).length}`);
    console.log('\nTeam types distribution:');

    const typeCount: Record<string, number> = {};
    updatedTeams.forEach((team) => {
      typeCount[team.type] = (typeCount[team.type] || 0) + 1;
    });

    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateTeamTypes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
