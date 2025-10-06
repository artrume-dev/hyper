import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

describe.sequential('Auth API', () => {
  // Use a unique but short identifier for each test run
  const uniqueId = Math.random().toString(36).substring(2, 7); // 5 chars
  const testUser = {
    email: `auth${uniqueId}@test.com`,
    password: 'password123',
    name: 'Test User',
    username: `auth${uniqueId}`, // Will be ~9 chars, within 3-20 limit
    role: 'FREELANCER' as const,
  };

  let authToken: string;
  let userId: string;

  // Clean up test data before and after tests
  beforeAll(async () => {
    // Delete all test users from previous runs
    await prisma.user.deleteMany({
      where: { 
        OR: [
          { email: { contains: '@test.com' } },
          { username: { startsWith: 'auth' } },
        ]
      },
    });
    
    // Wait a bit to ensure DB is clean
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // Clean up this test run's data
    await prisma.user.deleteMany({
      where: { 
        OR: [
          { email: testUser.email },
          { username: testUser.username },
          { email: { contains: '@test.com' } },
          { username: { startsWith: 'auth' } },
        ]
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.user).not.toHaveProperty('password');

      authToken = response.body.token;
      userId = response.body.user.id;
    });

    it('should not register user with existing email', async () => {
      // Try to register with same email but different username
      const duplicateUser = {
        ...testUser,
        username: `diff${uniqueId}`, // Different but still within 3-20 chars
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    it('should not register user without email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: undefined })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not register user with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ 
          ...testUser, 
          email: 'invalid-email', 
          username: `new${uniqueId}1` // Short unique username
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid email');
    });

    it('should not register user with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ 
          ...testUser, 
          email: `new${uniqueId}@test.com`, 
          username: `new${uniqueId}2`, // Short unique username
          password: '123' 
        })
        .expect(400);

      expect(response.body.error).toContain('Password must be at least 6 characters');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should not login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not get user without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should not get user with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });
});
