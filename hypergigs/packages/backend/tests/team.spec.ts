import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

describe.sequential('Team API', () => {
  let authToken1: string;
  let authToken2: string;
  let user1Id: string;
  let user2Id: string;
  let teamId: string;
  let teamSlug: string;

  const timestamp = Date.now();
  const shortId = timestamp.toString().slice(-6); // Last 6 digits only
  const user1 = {
    email: `teamtest1-${timestamp}@example.com`,
    password: 'password123',
    name: 'Team User One',
    username: `team1-${shortId}`, // Shorter username
    role: 'FREELANCER',
  };

  const user2 = {
    email: `teamtest2-${timestamp}@example.com`,
    password: 'password123',
    name: 'Team User Two',
    username: `team2-${shortId}`, // Shorter username
    role: 'FREELANCER',
  };

  // Clean up before tests
  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: 'teamtest' } },
          { username: { contains: 'teamuser' } },
        ],
      },
    });

    await prisma.team.deleteMany({
      where: {
        name: { contains: 'Test Team' },
      },
    });

    // Register two users
    const res1 = await request(app).post('/api/auth/register').send(user1);
    authToken1 = res1.body.token;
    user1Id = res1.body.user.id;

    const res2 = await request(app).post('/api/auth/register').send(user2);
    authToken2 = res2.body.token;
    user2Id = res2.body.user.id;
  });

  // Clean up after tests
  afterAll(async () => {
    await prisma.team.deleteMany({
      where: {
        name: { contains: 'Test Team' },
      },
    });

    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: 'teamtest' } },
          { username: { contains: 'teamuser' } },
        ],
      },
    });

    await prisma.$disconnect();
  });

  describe('POST /api/teams', () => {
    it('should create a new team', async () => {
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          name: 'Test Team Alpha',
          description: 'A test team for development',
          type: 'PROJECT',
          city: 'San Francisco',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Team Alpha');
      expect(response.body.slug).toBe('test-team-alpha');
      expect(response.body.type).toBe('PROJECT');
      expect(response.body.ownerId).toBe(user1Id);
      expect(response.body.owner.id).toBe(user1Id);

      teamId = response.body.id;
      teamSlug = response.body.slug;
    });

    it('should not create team without authentication', async () => {
      await request(app)
        .post('/api/teams')
        .send({
          name: 'Unauthenticated Team',
          type: 'PROJECT',
        })
        .expect(401);
    });

    it('should not create team without name', async () => {
      await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          type: 'PROJECT',
        })
        .expect(400);
    });

    it('should not create team with invalid type', async () => {
      await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          name: 'Invalid Type Team',
          type: 'INVALID',
        })
        .expect(400);
    });
  });

  describe('GET /api/teams', () => {
    it('should list teams', async () => {
      const response = await request(app)
        .get('/api/teams')
        .expect(200);

      expect(response.body).toHaveProperty('teams');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.teams)).toBe(true);
      expect(response.body.teams.length).toBeGreaterThan(0);
    });

    it('should filter teams by type', async () => {
      const response = await request(app)
        .get('/api/teams?type=PROJECT')
        .expect(200);

      expect(response.body.teams.every((t: any) => t.type === 'PROJECT')).toBe(true);
    });

    it('should search teams by name', async () => {
      const response = await request(app)
        .get('/api/teams?search=Test Team Alpha')
        .expect(200);

      expect(response.body.teams.some((t: any) => t.name.includes('Test Team Alpha'))).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/teams?page=1&limit=5')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.teams.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/teams/:identifier', () => {
    it('should get team by ID', async () => {
      const response = await request(app)
        .get(`/api/teams/${teamId}`)
        .expect(200);

      expect(response.body.id).toBe(teamId);
      expect(response.body.name).toBe('Test Team Alpha');
    });

    it('should get team by slug', async () => {
      const response = await request(app)
        .get(`/api/teams/${teamSlug}`)
        .expect(200);

      expect(response.body.slug).toBe(teamSlug);
      expect(response.body.name).toBe('Test Team Alpha');
    });

    it('should return 404 for non-existent team', async () => {
      await request(app)
        .get('/api/teams/non-existent-slug')
        .expect(404);
    });
  });

  describe('GET /api/teams/my-teams', () => {
    it('should get user teams', async () => {
      const response = await request(app)
        .get('/api/teams/my-teams')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('myRole');
      expect(response.body[0].myRole).toBe('OWNER');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/teams/my-teams')
        .expect(401);
    });
  });

  describe('PUT /api/teams/:teamId', () => {
    it('should update team', async () => {
      const response = await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          name: 'Updated Test Team',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Test Team');
      expect(response.body.description).toBe('Updated description');
    });

    it('should not allow non-owner to update team', async () => {
      await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          name: 'Hacked Team Name',
        })
        .expect(403);
    });

    it('should not update with invalid type', async () => {
      await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          type: 'INVALID_TYPE',
        })
        .expect(400);
    });
  });

  describe('Team Members', () => {
    describe('POST /api/teams/:teamId/members', () => {
      it('should add team member', async () => {
        const response = await request(app)
          .post(`/api/teams/${teamId}/members`)
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            userId: user2Id,
            role: 'MEMBER',
          })
          .expect(201);

        expect(response.body.userId).toBe(user2Id);
        expect(response.body.teamId).toBe(teamId);
        expect(response.body.role).toBe('MEMBER');
      });

      it('should not add duplicate member', async () => {
        await request(app)
          .post(`/api/teams/${teamId}/members`)
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            userId: user2Id,
          })
          .expect(409);
      });

      it('should not allow non-owner/admin to add members', async () => {
        // Create another user
        const user3 = {
          email: `teamtest3-${timestamp}@example.com`,
          password: 'password123',
          name: 'Team User Three',
          username: `team3-${shortId}`,
          role: 'FREELANCER',
        };

        const res = await request(app).post('/api/auth/register').send(user3);
        const authToken3 = res.body.token;
        const user3Id = res.body.user.id;

        await request(app)
          .post(`/api/teams/${teamId}/members`)
          .set('Authorization', `Bearer ${authToken2}`)
          .send({
            userId: user3Id,
          })
          .expect(403);
      });
    });

    describe('GET /api/teams/:teamId/members', () => {
      it('should get team members', async () => {
        const response = await request(app)
          .get(`/api/teams/${teamId}/members`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2); // Owner + added member
      });
    });

    describe('PUT /api/teams/:teamId/members/:userId/role', () => {
      it('should update member role', async () => {
        const response = await request(app)
          .put(`/api/teams/${teamId}/members/${user2Id}/role`)
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            role: 'ADMIN',
          })
          .expect(200);

        expect(response.body.role).toBe('ADMIN');
      });

      it('should not allow non-owner to update roles', async () => {
        await request(app)
          .put(`/api/teams/${teamId}/members/${user1Id}/role`)
          .set('Authorization', `Bearer ${authToken2}`)
          .send({
            role: 'MEMBER',
          })
          .expect(403);
      });
    });

    describe('POST /api/teams/:teamId/leave', () => {
      it('should allow member to leave team', async () => {
        const response = await request(app)
          .post(`/api/teams/${teamId}/leave`)
          .set('Authorization', `Bearer ${authToken2}`)
          .expect(200);

        expect(response.body.message).toContain('left team');
      });

      it('should not allow owner to leave team', async () => {
        await request(app)
          .post(`/api/teams/${teamId}/leave`)
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(403);
      });
    });

    describe('DELETE /api/teams/:teamId/members/:userId', () => {
      it('should remove team member', async () => {
        // Re-add user2
        await request(app)
          .post(`/api/teams/${teamId}/members`)
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            userId: user2Id,
          });

        const response = await request(app)
          .delete(`/api/teams/${teamId}/members/${user2Id}`)
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(200);

        expect(response.body.message).toContain('removed');
      });

      it('should not remove team owner', async () => {
        await request(app)
          .delete(`/api/teams/${teamId}/members/${user1Id}`)
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(403);
      });
    });
  });

  describe('DELETE /api/teams/:teamId', () => {
    it('should not allow non-owner to delete team', async () => {
      await request(app)
        .delete(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);
    });

    it('should delete team', async () => {
      const response = await request(app)
        .delete(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');

      // Verify team is deleted
      await request(app)
        .get(`/api/teams/${teamId}`)
        .expect(404);
    });
  });
});
