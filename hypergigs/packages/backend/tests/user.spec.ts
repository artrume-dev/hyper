import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe.sequential('User API', () => {
  const timestamp = Date.now();
  let authToken: string;
  let userId: string;
  let skillId: string;
  let portfolioId: string;
  let experienceId: string;

  const testUser = {
    email: `user-${timestamp}@example.com`,
    password: 'password123',
    name: 'John Doe',
    username: `john${timestamp}`,
    role: 'FREELANCER',
  };

  // Clean up before and after
  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: `user-${timestamp}` } },
          { username: { contains: `john${timestamp}` } },
        ],
      },
    });

    // Register and login to get auth token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: `user-${timestamp}` } },
          { username: { contains: `john${timestamp}` } },
        ],
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/users/:userId', () => {
    it('should get user profile by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(userId);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Full-stack developer with 5 years of experience',
        location: 'San Francisco, CA',
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.lastName).toBe(updateData.lastName);
      expect(response.body.user.bio).toBe(updateData.bio);
      expect(response.body.user.location).toBe(updateData.location);
    });

    it('should not update with invalid username', async () => {
      await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ username: 'ab' }) // Too short
        .expect(400);
    });

    it('should not update without authentication', async () => {
      await request(app)
        .put('/api/users/me')
        .send({ bio: 'test' })
        .expect(401);
    });
  });

  describe('PATCH /api/users/me/avatar', () => {
    it('should update user avatar', async () => {
      const response = await request(app)
        .patch('/api/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ avatarUrl: 'https://example.com/avatar.jpg' })
        .expect(200);

      expect(response.body.user.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should not update avatar without avatarUrl', async () => {
      await request(app)
        .patch('/api/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/users/me/skills', () => {
    it('should add skill to user', async () => {
      const response = await request(app)
        .post('/api/users/me/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ skillName: 'React' })
        .expect(201);

      expect(response.body.skill).toHaveProperty('id');
      expect(response.body.skill.skill.name).toBe('react');
      skillId = response.body.skill.skillId;
    });

    it('should not add duplicate skill', async () => {
      await request(app)
        .post('/api/users/me/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ skillName: 'React' })
        .expect(400);
    });

    it('should not add skill without skillName', async () => {
      await request(app)
        .post('/api/users/me/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('DELETE /api/users/me/skills/:skillId', () => {
    it('should remove skill from user', async () => {
      await request(app)
        .delete(`/api/users/me/skills/${skillId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('POST /api/users/me/portfolio', () => {
    it('should add portfolio item', async () => {
      const portfolioData = {
        name: 'E-commerce Platform',
        description: 'Built a scalable e-commerce platform',
        companyName: 'Tech Corp',
        role: 'Lead Developer',
      };

      const response = await request(app)
        .post('/api/users/me/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .send(portfolioData)
        .expect(201);

      expect(response.body.portfolio.name).toBe(portfolioData.name);
      portfolioId = response.body.portfolio.id;
    });

    it('should not add portfolio without name', async () => {
      await request(app)
        .post('/api/users/me/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Test' })
        .expect(400);
    });
  });

  describe('PUT /api/users/me/portfolio/:portfolioId', () => {
    it('should update portfolio item', async () => {
      const response = await request(app)
        .put(`/api/users/me/portfolio/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Updated description' })
        .expect(200);

      expect(response.body.portfolio.description).toBe('Updated description');
    });
  });

  describe('GET /api/users/:userId/portfolio', () => {
    it('should get user portfolio', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}/portfolio`)
        .expect(200);

      expect(response.body.portfolio).toBeInstanceOf(Array);
      expect(response.body.portfolio.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/users/me/experience', () => {
    it('should add work experience', async () => {
      const experienceData = {
        title: 'Senior Developer',
        company: 'Tech Corp',
        description: 'Led development team',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        present: false,
      };

      const response = await request(app)
        .post('/api/users/me/experience')
        .set('Authorization', `Bearer ${authToken}`)
        .send(experienceData)
        .expect(201);

      expect(response.body.experience.title).toBe(experienceData.title);
      experienceId = response.body.experience.id;
    });

    it('should not add experience without required fields', async () => {
      await request(app)
        .post('/api/users/me/experience')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Developer' })
        .expect(400);
    });
  });

  describe('PUT /api/users/me/experience/:experienceId', () => {
    it('should update work experience', async () => {
      const response = await request(app)
        .put(`/api/users/me/experience/${experienceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Updated role description' })
        .expect(200);

      expect(response.body.experience.description).toBe('Updated role description');
    });
  });

  describe('GET /api/users/:userId/experience', () => {
    it('should get user work experiences', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}/experience`)
        .expect(200);

      expect(response.body.experiences).toBeInstanceOf(Array);
      expect(response.body.experiences.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/search', () => {
    it('should search users', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'John' })
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body.users).toBeInstanceOf(Array);
    });

    it('should not search with short query', async () => {
      await request(app)
        .get('/api/users/search')
        .query({ q: 'a' })
        .expect(400);
    });

    it('should filter by role', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'John', role: 'FREELANCER' })
        .expect(200);

      expect(response.body.users).toBeInstanceOf(Array);
    });
  });

  describe('DELETE /api/users/me/experience/:experienceId', () => {
    it('should delete work experience', async () => {
      await request(app)
        .delete(`/api/users/me/experience/${experienceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('DELETE /api/users/me/portfolio/:portfolioId', () => {
    it('should delete portfolio item', async () => {
      await request(app)
        .delete(`/api/users/me/portfolio/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
