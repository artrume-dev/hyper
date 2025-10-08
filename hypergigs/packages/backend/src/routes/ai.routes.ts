import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { generateSkills } from '../controllers/ai.controller.js';

const router = Router();

// Generate skills from bio
router.post('/generate-skills', authenticate, generateSkills);

export default router;
