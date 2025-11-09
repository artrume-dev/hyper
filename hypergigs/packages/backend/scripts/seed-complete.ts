import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create users
  console.log('Creating users...');
  const password = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      username: 'johndoe',
      password,
      firstName: 'John',
      lastName: 'Doe',
      role: 'FREELANCER',
      bio: 'Full-stack developer with 5+ years of experience',
      jobTitle: 'Senior Full Stack Developer',
      location: 'San Francisco, CA',
      country: 'United States',
      available: true,
      hourlyRate: 85,
      currency: 'USD',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      username: 'sarahsmith',
      password,
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'AGENCY',
      bio: 'Creative agency founder specializing in digital marketing',
      jobTitle: 'Agency Owner',
      location: 'New York, NY',
      country: 'United States',
      available: true,
      hourlyRate: 120,
      currency: 'USD',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'mike@example.com',
      username: 'mikechen',
      password,
      firstName: 'Mike',
      lastName: 'Chen',
      role: 'STARTUP',
      bio: 'Tech entrepreneur building the next big thing',
      jobTitle: 'Startup Founder',
      location: 'Austin, TX',
      country: 'United States',
      available: true,
      hourlyRate: 100,
      currency: 'USD',
    },
  });

  console.log(`✅ Created ${3} users\n`);

  // Create teams
  console.log('Creating teams...');

  const team1 = await prisma.team.create({
    data: {
      name: 'TechCorp Solutions',
      slug: 'techcorp-solutions',
      description: 'Leading enterprise software development company',
      type: 'COMPANY',
      city: 'San Francisco, CA',
      ownerId: user1.id,
      isMainTeam: true,
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'Creative Digital Agency',
      slug: 'creative-digital-agency',
      description: 'Award-winning digital marketing and design agency',
      type: 'AGENCY',
      city: 'New York, NY',
      ownerId: user2.id,
      isMainTeam: true,
    },
  });

  const team3 = await prisma.team.create({
    data: {
      name: 'InnovateLab',
      slug: 'innovatelab',
      description: 'AI-powered SaaS startup revolutionizing productivity',
      type: 'STARTUP',
      city: 'Austin, TX',
      ownerId: user3.id,
      isMainTeam: true,
    },
  });

  // Create sub-teams
  const subTeam1 = await prisma.team.create({
    data: {
      name: 'Engineering',
      slug: 'techcorp-engineering',
      description: 'Software engineering department',
      type: 'TEAM',
      subTeamCategory: 'ENGINEERING',
      parentTeamId: team1.id,
      ownerId: user1.id,
      isMainTeam: false,
    },
  });

  const subTeam2 = await prisma.team.create({
    data: {
      name: 'Design',
      slug: 'creative-design',
      description: 'Creative design department',
      type: 'TEAM',
      subTeamCategory: 'DESIGN',
      parentTeamId: team2.id,
      ownerId: user2.id,
      isMainTeam: false,
    },
  });

  console.log(`✅ Created ${5} teams (3 main teams + 2 sub-teams)\n`);

  // Create job postings with varied dates
  console.log('Creating job postings...\n');

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const tenDaysAgo = new Date(now);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  // Featured jobs (posted today)
  await prisma.jobPosting.create({
    data: {
      title: 'Senior Full Stack Engineer - FEATURED',
      description: 'We are seeking an exceptional Senior Full Stack Engineer to join our growing team. You will work on cutting-edge technologies including React, Node.js, and AWS. This is a fantastic opportunity to make a significant impact on our product roadmap.',
      location: 'San Francisco, CA (Hybrid)',
      type: 'FULL_TIME',
      status: 'ACTIVE',
      isFeatured: true,
      isSponsored: false,
      minSalary: 140000,
      maxSalary: 180000,
      currency: 'USD',
      teamId: team1.id,
      subTeamId: subTeam1.id,
      createdBy: user1.id,
      createdAt: now,
    },
  });

  await prisma.jobPosting.create({
    data: {
      title: 'Lead Product Designer - FEATURED',
      description: 'Join our award-winning design team as a Lead Product Designer. You will drive the design vision for our flagship products, mentor junior designers, and collaborate closely with product and engineering teams.',
      location: 'New York, NY (Remote)',
      type: 'FULL_TIME',
      status: 'ACTIVE',
      isFeatured: true,
      isSponsored: false,
      minSalary: 130000,
      maxSalary: 170000,
      currency: 'USD',
      teamId: team2.id,
      subTeamId: subTeam2.id,
      createdBy: user2.id,
      createdAt: now,
    },
  });

  await prisma.jobPosting.create({
    data: {
      title: 'AI/ML Engineer - FEATURED',
      description: 'Revolutionary AI startup seeking talented ML engineers to build next-generation AI products. Work with state-of-the-art models and help shape the future of AI.',
      location: 'Austin, TX (Remote)',
      type: 'FULL_TIME',
      status: 'ACTIVE',
      isFeatured: true,
      isSponsored: false,
      minSalary: 150000,
      maxSalary: 200000,
      currency: 'USD',
      teamId: team3.id,
      createdBy: user3.id,
      createdAt: now,
    },
  });

  // Sponsored jobs (interspersed)
  await prisma.jobPosting.create({
    data: {
      title: 'DevOps Engineer - SPONSORED',
      description: 'Looking for a skilled DevOps Engineer to help scale our infrastructure. Experience with Kubernetes, Docker, and CI/CD pipelines required.',
      location: 'Remote (US)',
      type: 'FULL_TIME',
      status: 'ACTIVE',
      isFeatured: false,
      isSponsored: true,
      minSalary: 120000,
      maxSalary: 160000,
      currency: 'USD',
      teamId: team1.id,
      createdBy: user1.id,
      createdAt: yesterday,
    },
  });

  await prisma.jobPosting.create({
    data: {
      title: 'Marketing Manager - SPONSORED',
      description: 'Drive our marketing strategy and lead a team of talented marketers. Experience with digital marketing, SEO, and content strategy required.',
      location: 'New York, NY',
      type: 'FULL_TIME',
      status: 'ACTIVE',
      isFeatured: false,
      isSponsored: true,
      minSalary: 100000,
      maxSalary: 140000,
      currency: 'USD',
      teamId: team2.id,
      createdBy: user2.id,
      createdAt: yesterday,
    },
  });

  // Regular jobs - Today
  await prisma.jobPosting.create({
    data: {
      title: 'Frontend Developer (React)',
      description: 'Join our frontend team to build beautiful, responsive user interfaces using React, TypeScript, and Tailwind CSS.',
      location: 'San Francisco, CA',
      type: 'CONTRACT',
      status: 'ACTIVE',
      isFeatured: false,
      isSponsored: false,
      minSalary: 90000,
      maxSalary: 130000,
      currency: 'USD',
      teamId: team1.id,
      createdBy: user1.id,
      createdAt: now,
    },
  });

  await prisma.jobPosting.create({
    data: {
      title: 'Backend Developer (Node.js)',
      description: 'We need a backend developer experienced in Node.js, Express, and PostgreSQL to help build scalable APIs.',
      location: 'Remote',
      type: 'FULL_TIME',
      status: 'ACTIVE',
      isFeatured: false,
      isSponsored: false,
      minSalary: 100000,
      maxSalary: 140000,
      currency: 'USD',
      teamId: team1.id,
      createdBy: user1.id,
      createdAt: now,
    },
  });

  // Regular jobs - Yesterday
  await prisma.jobPosting.create({
    data: {
      title: 'UX/UI Designer',
      description: 'Create intuitive and engaging user experiences for our web and mobile applications.',
      location: 'New York, NY',
      type: 'PART_TIME',
      status: 'ACTIVE',
      isFeatured: false,
      isSponsored: false,
      minSalary: 60000,
      maxSalary: 90000,
      currency: 'USD',
      teamId: team2.id,
      createdBy: user2.id,
      createdAt: yesterday,
    },
  });

  await prisma.jobPosting.create({
    data: {
      title: 'Content Writer',
      description: 'Craft compelling content for our blog, social media, and marketing campaigns.',
      location: 'Remote',
      type: 'FREELANCE',
      status: 'ACTIVE',
      isFeatured: false,
      isSponsored: false,
      minSalary: 40000,
      maxSalary: 70000,
      currency: 'USD',
      teamId: team2.id,
      createdBy: user2.id,
      createdAt: yesterday,
    },
  });

  // Regular jobs - Last week
  await prisma.jobPosting.create({
    data: {
      title: 'Mobile Developer (React Native)',
      description: 'Build cross-platform mobile applications using React Native for iOS and Android.',
      location: 'Austin, TX',
      type: 'FULL_TIME',
      status: 'ACTIVE',
      isFeatured: false,
      isSponsored: false,
      minSalary: 110000,
      maxSalary: 150000,
      currency: 'USD',
      teamId: team3.id,
      createdBy: user3.id,
      createdAt: fiveDaysAgo,
    },
  });

  await prisma.jobPosting.create({
    data: {
      title: 'QA Engineer',
      description: 'Ensure product quality through comprehensive testing strategies and automation.',
      location: 'Remote',
      type: 'CONTRACT',
      status: 'ACTIVE',
      isFeatured: false,
      isSponsored: false,
      minSalary: 70000,
      maxSalary: 100000,
      currency: 'USD',
      teamId: team1.id,
      createdBy: user1.id,
      createdAt: fiveDaysAgo,
    },
  });

  await prisma.jobPosting.create({
    data: {
      title: 'Data Analyst',
      description: 'Analyze user data to drive product decisions and business strategy.',
      location: 'San Francisco, CA',
      type: 'FULL_TIME',
      status: 'ACTIVE',
      isFeatured: false,
      isSponsored: false,
      minSalary: 85000,
      maxSalary: 120000,
      currency: 'USD',
      teamId: team1.id,
      createdBy: user1.id,
      createdAt: fiveDaysAgo,
    },
  });

  // Regular jobs - Older
  await prisma.jobPosting.create({
    data: {
      title: 'Product Manager',
      description: 'Lead product strategy and work cross-functionally to deliver exceptional products.',
      location: 'New York, NY',
      type: 'FULL_TIME',
      status: 'ACTIVE',
      isFeatured: false,
      isSponsored: false,
      minSalary: 130000,
      maxSalary: 170000,
      currency: 'USD',
      teamId: team2.id,
      createdBy: user2.id,
      createdAt: tenDaysAgo,
    },
  });

  await prisma.jobPosting.create({
    data: {
      title: 'Customer Success Manager',
      description: 'Build strong relationships with our clients and ensure they achieve their goals.',
      location: 'Remote',
      type: 'FULL_TIME',
      status: 'ACTIVE',
      isFeatured: false,
      isSponsored: false,
      minSalary: 70000,
      maxSalary: 100000,
      currency: 'USD',
      teamId: team3.id,
      createdBy: user3.id,
      createdAt: tenDaysAgo,
    },
  });

  const jobCount = await prisma.jobPosting.count();
  console.log(`✅ Created ${jobCount} job postings:`);
  console.log(`   - 3 Featured jobs (today)`);
  console.log(`   - 2 Sponsored jobs (yesterday)`);
  console.log(`   - 9 Regular jobs (various dates)\n`);

  console.log('📊 Database Summary:');
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Teams: ${await prisma.team.count()}`);
  console.log(`   - Job Postings: ${jobCount}`);
  console.log('\n✅ Database seed completed successfully!');
  console.log('\n📝 Test Login Credentials:');
  console.log('   Email: john@example.com');
  console.log('   Password: password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
