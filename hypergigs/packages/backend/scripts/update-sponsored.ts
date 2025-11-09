import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateJobs() {
  // Get all jobs
  const jobs = await prisma.jobPosting.findMany({
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${jobs.length} jobs`);

  // Update some jobs to be sponsored (every 3rd job that is not featured)
  let updated = 0;
  for (let i = 0; i < jobs.length; i++) {
    if (i % 3 === 1 && !jobs[i].isFeatured) {
      await prisma.jobPosting.update({
        where: { id: jobs[i].id },
        data: { isSponsored: true }
      });
      console.log(`Updated "${jobs[i].title}" to sponsored`);
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} jobs to sponsored`);

  // Show summary
  const featured = await prisma.jobPosting.count({ where: { isFeatured: true } });
  const sponsored = await prisma.jobPosting.count({ where: { isSponsored: true } });
  const regular = await prisma.jobPosting.count({
    where: {
      AND: [
        { isFeatured: false },
        { isSponsored: false }
      ]
    }
  });

  console.log(`\nSummary:`);
  console.log(`  Featured: ${featured}`);
  console.log(`  Sponsored: ${sponsored}`);
  console.log(`  Regular: ${regular}`);
  console.log(`  Total: ${jobs.length}`);

  await prisma.$disconnect();
}

updateJobs().catch((e) => {
  console.error(e);
  process.exit(1);
});
