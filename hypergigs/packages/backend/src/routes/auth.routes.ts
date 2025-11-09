import { Router } from 'express';
import { register, login, getCurrentUser, logout, oauthGoogle, oauthLinkedIn } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/oauth/google
 * @desc    Google OAuth login/register
 * @access  Public
 */
router.post('/oauth/google', oauthGoogle);

/**
 * @route   POST /api/auth/oauth/linkedin
 * @desc    LinkedIn OAuth login/register
 * @access  Public
 */
router.post('/oauth/linkedin', oauthLinkedIn);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

export default router;
