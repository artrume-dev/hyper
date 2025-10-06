import { Router } from 'express';
import {
  getUserProfile,
  updateProfile,
  updateAvatar,
  searchUsers,
  addSkill,
  removeSkill,
  addPortfolio,
  updatePortfolio,
  deletePortfolio,
  addWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  getUserPortfolio,
  getUserWorkExperiences,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Public
 */
router.get('/search', searchUsers);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user profile by ID
 * @access  Public
 */
router.get('/:userId', getUserProfile);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', authenticate, updateProfile);

/**
 * @route   PATCH /api/users/me/avatar
 * @desc    Update user avatar
 * @access  Private
 */
router.patch('/me/avatar', authenticate, updateAvatar);

/**
 * @route   POST /api/users/me/skills
 * @desc    Add skill to user
 * @access  Private
 */
router.post('/me/skills', authenticate, addSkill);

/**
 * @route   DELETE /api/users/me/skills/:skillId
 * @desc    Remove skill from user
 * @access  Private
 */
router.delete('/me/skills/:skillId', authenticate, removeSkill);

/**
 * @route   POST /api/users/me/portfolio
 * @desc    Add portfolio item
 * @access  Private
 */
router.post('/me/portfolio', authenticate, addPortfolio);

/**
 * @route   PUT /api/users/me/portfolio/:portfolioId
 * @desc    Update portfolio item
 * @access  Private
 */
router.put('/me/portfolio/:portfolioId', authenticate, updatePortfolio);

/**
 * @route   DELETE /api/users/me/portfolio/:portfolioId
 * @desc    Delete portfolio item
 * @access  Private
 */
router.delete('/me/portfolio/:portfolioId', authenticate, deletePortfolio);

/**
 * @route   GET /api/users/:userId/portfolio
 * @desc    Get user portfolio
 * @access  Public
 */
router.get('/:userId/portfolio', getUserPortfolio);

/**
 * @route   POST /api/users/me/experience
 * @desc    Add work experience
 * @access  Private
 */
router.post('/me/experience', authenticate, addWorkExperience);

/**
 * @route   PUT /api/users/me/experience/:experienceId
 * @desc    Update work experience
 * @access  Private
 */
router.put('/me/experience/:experienceId', authenticate, updateWorkExperience);

/**
 * @route   DELETE /api/users/me/experience/:experienceId
 * @desc    Delete work experience
 * @access  Private
 */
router.delete('/me/experience/:experienceId', authenticate, deleteWorkExperience);

/**
 * @route   GET /api/users/:userId/experience
 * @desc    Get user work experiences
 * @access  Public
 */
router.get('/:userId/experience', getUserWorkExperiences);

export default router;
