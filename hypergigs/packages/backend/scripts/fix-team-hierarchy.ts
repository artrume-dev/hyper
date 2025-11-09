import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTeamHierarchy() {
  console.log('🔍 Checking team hierarchy...\n');

  // Get all teams
  const allTeams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      parentTeamId: true,
      isMainTeam: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`📊 Total teams in database: ${allTeams.length}\n`);

  // Check for inconsistencies
  const issues: any[] = [];

  for (const team of allTeams) {
    const hasParent = !!team.parentTeamId;
    const markedAsMain = team.isMainTeam;

    // Issue 1: Has parent but marked as main team
    if (hasParent && markedAsMain) {
      issues.push({
        type: 'SUB_TEAM_MARKED_AS_MAIN',
        team,
        fix: 'Set isMainTeam to false',
      });
    }

    // Issue 2: No parent but not marked as main team
    if (!hasParent && !markedAsMain) {
      issues.push({
        type: 'MAIN_TEAM_NOT_MARKED',
        team,
        fix: 'Set isMainTeam to true',
      });
    }
  }

  // Report findings
  if (issues.length === 0) {
    console.log('✅ No issues found! All teams have correct hierarchy flags.\n');
  } else {
    console.log(`⚠️  Found ${issues.length} issue(s):\n`);

    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.type}`);
      console.log(`   Team: ${issue.team.name} (${issue.team.slug})`);
      console.log(`   Parent ID: ${issue.team.parentTeamId || 'None'}`);
      console.log(`   Currently isMainTeam: ${issue.team.isMainTeam}`);
      console.log(`   Fix: ${issue.fix}\n`);
    });

    // Fix the issues
    console.log('🔧 Fixing issues...\n');

    for (const issue of issues) {
      const shouldBeMainTeam = !issue.team.parentTeamId;

      await prisma.team.update({
        where: { id: issue.team.id },
        data: { isMainTeam: shouldBeMainTeam },
      });

      console.log(`✅ Fixed: ${issue.team.name} - set isMainTeam to ${shouldBeMainTeam}`);
    }

    console.log(`\n✨ Fixed ${issues.length} team(s)!\n`);
  }

  // Show final statistics
  const mainTeams = await prisma.team.count({
    where: { isMainTeam: true },
  });

  const subTeams = await prisma.team.count({
    where: { isMainTeam: false },
  });

  console.log('📈 Final Statistics:');
  console.log(`   Main Teams: ${mainTeams}`);
  console.log(`   Sub-Teams: ${subTeams}`);
  console.log(`   Total: ${mainTeams + subTeams}\n`);

  // Show main teams with their sub-teams
  console.log('🏢 Team Hierarchy:');
  const mainTeamsWithSubs = await prisma.team.findMany({
    where: { isMainTeam: true },
    include: {
      subTeams: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  mainTeamsWithSubs.forEach((team) => {
    console.log(`\n📁 ${team.name} (${team.slug})`);
    if (team.subTeams.length > 0) {
      team.subTeams.forEach((subTeam) => {
        console.log(`   └─ ${subTeam.name} (${subTeam.slug})`);
      });
    } else {
      console.log(`   └─ No sub-teams`);
    }
  });

  console.log('\n✅ Done!');
}

fixTeamHierarchy()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
