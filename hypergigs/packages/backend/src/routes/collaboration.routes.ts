import { Router } from 'express';
import {
  getCollaborationContext,
  getSharedProjects,
  getSharedTeams,
} from '../controllers/collaboration.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All collaboration endpoints require authentication

// Get collaboration context with another user
router.get('/context/:userId', authenticate, getCollaborationContext);

// Get shared projects with another user
router.get('/projects/:userId', authenticate, getSharedProjects);

// Get shared teams with another user
router.get('/teams/:userId', authenticate, getSharedTeams);

export default router;
