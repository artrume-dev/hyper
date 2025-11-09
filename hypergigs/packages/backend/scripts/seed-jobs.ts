import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all teams
  const teams = await prisma.team.findMany({
    where: { isMainTeam: true },
    include: {
      owner: true,
      subTeams: true,
    },
  });

  if (teams.length === 0) {
    console.log('No teams found. Please create teams first.');
    return;
  }

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 5);
  const older = new Date(now);
  older.setDate(older.getDate() - 10);

  console.log(`Found ${teams.length} teams. Creating job postings...`);

  let jobCount = 0;

  for (const team of teams) {
    const teamType = team.type || 'COMPANY';

    // Create 1 featured job (today)
    await prisma.jobPosting.create({
      data: {
        title: `Senior ${teamType === 'COMPANY' ? 'Full Stack Developer' : 'Marketing Manager'}`,
        description: `We are looking for an experienced professional to join our ${team.name} team. This is a featured position with excellent growth opportunities.`,
        location: team.city || 'Remote',
        type: 'FULL_TIME',
        status: 'ACTIVE',
        isFeatured: true,
        isSponsored: false,
        minSalary: 80000,
        maxSalary: 120000,
        currency: 'USD',
        teamId: team.id,
        createdBy: team.ownerId,
        createdAt: now,
      },
    });
    jobCount++;

    // Create 1 sponsored job (yesterday)
    await prisma.jobPosting.create({
      data: {
        title: `${teamType === 'AGENCY' ? 'Creative Designer' : 'Product Manager'}`,
        description: `Join ${team.name} as we expand our team. This sponsored position offers competitive benefits and flexible work arrangements.`,
        location: 'New York, NY',
        type: 'FULL_TIME',
        status: 'ACTIVE',
        isFeatured: false,
        isSponsored: true,
        minSalary: 70000,
        maxSalary: 100000,
        currency: 'USD',
        teamId: team.id,
        createdBy: team.ownerId,
        createdAt: yesterday,
      },
    });
    jobCount++;

    // Create 2 regular jobs (last week and older)
    await prisma.jobPosting.create({
      data: {
        title: 'Frontend Developer',
        description: `${team.name} is seeking a talented Frontend Developer proficient in React and TypeScript.`,
        location: 'San Francisco, CA',
        type: 'CONTRACT',
        status: 'ACTIVE',
        isFeatured: false,
        isSponsored: false,
        minSalary: 60000,
        maxSalary: 90000,
        currency: 'USD',
        teamId: team.id,
        createdBy: team.ownerId,
        createdAt: lastWeek,
      },
    });
    jobCount++;

    await prisma.jobPosting.create({
      data: {
        title: 'DevOps Engineer',
        description: `Looking for a DevOps Engineer to help streamline our deployment processes at ${team.name}.`,
        location: 'Remote',
        type: 'FREELANCE',
        status: 'ACTIVE',
        isFeatured: false,
        isSponsored: false,
        minSalary: 50000,
        maxSalary: 80000,
        currency: 'USD',
        teamId: team.id,
        createdBy: team.ownerId,
        createdAt: older,
      },
    });
    jobCount++;

    // If team has subteams, create one job for a subteam
    if (team.subTeams.length > 0) {
      const subTeam = team.subTeams[0];
      await prisma.jobPosting.create({
        data: {
          title: `${subTeam.name} - Software Engineer`,
          description: `Join the ${subTeam.name} department at ${team.name}. We're building innovative solutions.`,
          location: 'Austin, TX',
          type: 'FULL_TIME',
          status: 'ACTIVE',
          isFeatured: false,
          isSponsored: false,
          minSalary: 75000,
          maxSalary: 110000,
          currency: 'USD',
          teamId: team.id,
          subTeamId: subTeam.id,
          createdBy: team.ownerId,
          createdAt: yesterday,
        },
      });
      jobCount++;
    }
  }

  console.log(`✅ Created ${jobCount} job postings successfully!`);
}

main()
  .catch((e) => {
    console.error('Error seeding jobs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
