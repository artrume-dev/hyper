import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

describe.sequential('Invitation API', () => {
  const uniqueId = Math.random().toString(36).substring(2, 7);
  
  // Test users
  const owner = {
    email: `owner${uniqueId}@test.com`,
    username: `own${uniqueId}`,
    password: 'password123',
    name: 'Team Owner',
    role: 'FREELANCER',
  };

  const member = {
    email: `mem${uniqueId}@test.com`,
    username: `mem${uniqueId}`,
    password: 'password123',
    name: 'Team Member',
    role: 'FREELANCER',
  };

  const invitee = {
    email: `inv${uniqueId}@test.com`,
    username: `inv${uniqueId}`,
    password: 'password123',
    name: 'Invitee User',
    role: 'FREELANCER',
  };

  let ownerToken: string;
  let ownerUserId: string;
  let memberToken: string;
  let memberUserId: string;
  let inviteeToken: string;
  let inviteeUserId: string;
  let teamId: string;
  let invitationId: string;

  beforeAll(async () => {
    // Register users
    const ownerRes = await request(app).post('/api/auth/register').send(owner);
    ownerToken = ownerRes.body.token;
    ownerUserId = ownerRes.body.user.id;

    const memberRes = await request(app).post('/api/auth/register').send(member);
    memberToken = memberRes.body.token;
    memberUserId = memberRes.body.user.id;

    const inviteeRes = await request(app).post('/api/auth/register').send(invitee);
    inviteeToken = inviteeRes.body.token;
    inviteeUserId = inviteeRes.body.user.id;

    // Create team as owner
    const teamRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: `Test Team ${uniqueId}`,
        description: 'Test team for invitations',
        type: 'PROJECT',
      });
    teamId = teamRes.body.id;

    // Add member to team
    await request(app)
      .post(`/api/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        userId: memberUserId,
        role: 'MEMBER',
      });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.invitation.deleteMany({
      where: {
        OR: [
          { senderId: ownerUserId },
          { receiverId: inviteeUserId },
        ],
      },
    });
    await prisma.teamMember.deleteMany({
      where: { teamId },
    });
    await prisma.team.deleteMany({
      where: { id: teamId },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: ownerUserId },
          { id: memberUserId },
          { id: inviteeUserId },
        ],
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/invitations', () => {
    it('should send invitation to user', async () => {
      const response = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          receiverId: inviteeUserId,
          teamId,
          role: 'MEMBER',
          message: 'Join our team!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');
      expect(response.body.receiverId).toBe(inviteeUserId);
      expect(response.body.teamId).toBe(teamId);
      expect(response.body.role).toBe('MEMBER');
      expect(response.body.message).toBe('Join our team!');

      invitationId = response.body.id;
    });

    it('should not allow non-owner/admin to send invitation', async () => {
      const response = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${inviteeToken}`)
        .send({
          receiverId: memberUserId,
          teamId,
          role: 'MEMBER',
        })
        .expect(403);

      expect(response.body.error).toContain('Only team owners and admins');
    });

    it('should not send duplicate invitation', async () => {
      const response = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          receiverId: inviteeUserId,
          teamId,
          role: 'MEMBER',
        })
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });

    it('should not invite existing team member', async () => {
      const response = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          receiverId: memberUserId,
          teamId,
          role: 'MEMBER',
        })
        .expect(409);

      expect(response.body.error).toContain('already a team member');
    });
  });

  describe('GET /api/invitations/received', () => {
    it('should get received invitations', async () => {
      const response = await request(app)
        .get('/api/invitations/received')
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].receiverId).toBe(inviteeUserId);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/invitations/received?status=PENDING')
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((inv: any) => {
        expect(inv.status).toBe('PENDING');
      });
    });
  });

  describe('GET /api/invitations/sent', () => {
    it('should get sent invitations', async () => {
      const response = await request(app)
        .get('/api/invitations/sent')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].senderId).toBe(ownerUserId);
    });
  });

  describe('GET /api/invitations/:invitationId', () => {
    it('should get invitation by ID', async () => {
      const response = await request(app)
        .get(`/api/invitations/${invitationId}`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(200);

      expect(response.body.id).toBe(invitationId);
      expect(response.body).toHaveProperty('sender');
      expect(response.body).toHaveProperty('team');
    });

    it('should not allow unauthorized user to view invitation', async () => {
      const response = await request(app)
        .get(`/api/invitations/${invitationId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.error).toContain('Unauthorized');
    });
  });

  describe('PUT /api/invitations/:invitationId/accept', () => {
    it('should accept invitation', async () => {
      const response = await request(app)
        .put(`/api/invitations/${invitationId}/accept`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(200);

      expect(response.body.invitation.status).toBe('ACCEPTED');
      expect(response.body).toHaveProperty('teamMember');
      expect(response.body.teamMember.userId).toBe(inviteeUserId);
      expect(response.body.teamMember.teamId).toBe(teamId);
    });

    it('should not accept already accepted invitation', async () => {
      const response = await request(app)
        .put(`/api/invitations/${invitationId}/accept`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(403);

      expect(response.body.error).toContain('cannot accept');
    });

    it('should not allow non-recipient to accept', async () => {
      // Note: invitee is already a team member from previous test
      // So we need to test with owner and member instead
      
      // Remove invitee from team first so we can send another invitation
      await prisma.teamMember.deleteMany({
        where: {
          teamId,
          userId: inviteeUserId,
        },
      });

      // Create new invitation for invitee
      const newInvRes = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          receiverId: inviteeUserId,
          teamId,
          role: 'ADMIN',
        });

      const newInvId = newInvRes.body.id;

      // Try to accept with member token (not the recipient)
      const response = await request(app)
        .put(`/api/invitations/${newInvId}/accept`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.error).toContain('Only the recipient');

      // Cleanup
      await prisma.invitation.delete({ where: { id: newInvId } });
    });
  });

  describe('PUT /api/invitations/:invitationId/decline', () => {
    let declineInvId: string;

    beforeAll(async () => {
      // Create invitation for decline test
      // First remove invitee from team
      await prisma.teamMember.deleteMany({
        where: { userId: inviteeUserId, teamId },
      });

      const res = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          receiverId: inviteeUserId,
          teamId,
          role: 'MEMBER',
        });

      declineInvId = res.body.id;
    });

    it('should decline invitation', async () => {
      const response = await request(app)
        .put(`/api/invitations/${declineInvId}/decline`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(200);

      expect(response.body.status).toBe('DECLINED');
    });

    it('should not allow non-recipient to decline', async () => {
      // Create new invitation
      await prisma.teamMember.deleteMany({
        where: { userId: inviteeUserId, teamId },
      });

      const newInvRes = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          receiverId: inviteeUserId,
          teamId,
          role: 'MEMBER',
        });

      const newInvId = newInvRes.body.id;

      const response = await request(app)
        .put(`/api/invitations/${newInvId}/decline`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(403);

      expect(response.body.error).toContain('Only the recipient');

      // Cleanup
      await prisma.invitation.delete({ where: { id: newInvId } });
    });
  });

  describe('DELETE /api/invitations/:invitationId', () => {
    let cancelInvId: string;

    beforeAll(async () => {
      // Create invitation for cancel test
      await prisma.teamMember.deleteMany({
        where: { userId: inviteeUserId, teamId },
      });

      const res = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          receiverId: inviteeUserId,
          teamId,
          role: 'MEMBER',
        });

      cancelInvId = res.body.id;
    });

    it('should cancel invitation', async () => {
      const response = await request(app)
        .delete(`/api/invitations/${cancelInvId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.status).toBe('CANCELLED');
    });

    it('should not allow non-sender to cancel', async () => {
      await prisma.teamMember.deleteMany({
        where: { userId: inviteeUserId, teamId },
      });

      const newInvRes = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          receiverId: inviteeUserId,
          teamId,
          role: 'MEMBER',
        });

      const newInvId = newInvRes.body.id;

      const response = await request(app)
        .delete(`/api/invitations/${newInvId}`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(403);

      expect(response.body.error).toContain('Only the sender');

      // Cleanup
      await prisma.invitation.delete({ where: { id: newInvId } });
    });
  });

  describe('GET /api/invitations/teams/:teamId', () => {
    it('should get team invitations for owner', async () => {
      const response = await request(app)
        .get(`/api/invitations/teams/${teamId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should not allow non-owner/admin to view team invitations', async () => {
      const response = await request(app)
        .get(`/api/invitations/teams/${teamId}`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(403);

      expect(response.body.error).toContain('Only team owners and admins');
    });
  });
});
