import { afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma.js';

// Disconnect Prisma after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
