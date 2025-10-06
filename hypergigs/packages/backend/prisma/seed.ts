import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create some sample skills
  const skills = await Promise.all([
    prisma.skill.create({ data: { name: 'JavaScript', category: 'Programming' } }),
    prisma.skill.create({ data: { name: 'TypeScript', category: 'Programming' } }),
    prisma.skill.create({ data: { name: 'React', category: 'Frontend' } }),
    prisma.skill.create({ data: { name: 'Node.js', category: 'Backend' } }),
    prisma.skill.create({ data: { name: 'UI/UX Design', category: 'Design' } }),
    prisma.skill.create({ data: { name: 'Figma', category: 'Design' } }),
  ]);

  console.log(`Created ${skills.length} skills`);

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      username: 'johndoe',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'FREELANCER',
      bio: 'Full-stack developer with 5 years of experience',
      location: 'San Francisco, CA',
      available: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      username: 'janesmith',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'AGENCY',
      bio: 'Design agency specializing in web and mobile',
      location: 'New York, NY',
      available: true,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'mike@example.com',
      username: 'miketech',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'STARTUP',
      bio: 'Building the next big thing in tech',
      location: 'Austin, TX',
      available: false,
    },
  });

  console.log('Created 3 users');

  // Add skills to users
  await prisma.userSkill.createMany({
    data: [
      { userId: user1.id, skillId: skills[0].id },
      { userId: user1.id, skillId: skills[1].id },
      { userId: user1.id, skillId: skills[2].id },
      { userId: user2.id, skillId: skills[4].id },
      { userId: user2.id, skillId: skills[5].id },
    ],
  });

  console.log('Added skills to users');

  // Create a team
  const team = await prisma.team.create({
    data: {
      name: 'Tech Innovators',
      slug: 'tech-innovators',
      description: 'Building amazing products together',
      type: 'PROJECT',
      ownerId: user1.id,
      city: 'San Francisco',
    },
  });

  console.log('Created 1 team');

  // Add team member
  await prisma.teamMember.create({
    data: {
      userId: user1.id,
      teamId: team.id,
      role: 'OWNER',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
