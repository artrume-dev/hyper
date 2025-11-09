import { Router } from 'express';
import {
  suggestContributors,
  addContributor,
  updateContributorStatus,
  getPortfolioContributors,
  getUserInvitations,
  removeContributor,
} from '../controllers/portfolioContributor.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/portfolio-contributors/invitations
 * @desc    Get pending contributor invitations for current user
 * @access  Private
 */
router.get('/invitations', authenticate, getUserInvitations);

/**
 * @route   GET /api/portfolios/:portfolioId/suggest-contributors
 * @desc    Suggest contributors based on shared teams
 * @access  Private
 */
router.get('/:portfolioId/suggest-contributors', authenticate, suggestContributors);

/**
 * @route   POST /api/portfolios/:portfolioId/contributors
 * @desc    Add a contributor to a portfolio
 * @access  Private
 */
router.post('/:portfolioId/contributors', authenticate, addContributor);

/**
 * @route   GET /api/portfolios/:portfolioId/contributors
 * @desc    Get all contributors for a portfolio
 * @access  Public
 */
router.get('/:portfolioId/contributors', getPortfolioContributors);

/**
 * @route   PATCH /api/portfolios/:portfolioId/contributors/:contributorId
 * @desc    Accept or reject contributor invitation
 * @access  Private
 */
router.patch('/:portfolioId/contributors/:contributorId', authenticate, updateContributorStatus);

/**
 * @route   DELETE /api/portfolios/:portfolioId/contributors/:contributorId
 * @desc    Remove a contributor
 * @access  Private
 */
router.delete('/:portfolioId/contributors/:contributorId', authenticate, removeContributor);

export default router;
