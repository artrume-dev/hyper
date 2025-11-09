import { Router } from 'express';
import {
  createRecommendation,
  getPortfolioRecommendations,
  getUserRecommendations,
  updateRecommendationStatus,
  deleteRecommendation,
} from '../controllers/recommendation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Create a new recommendation (requires auth)
router.post('/', authenticate, createRecommendation);

// Get recommendations for a portfolio (public)
router.get('/portfolio/:portfolioId', getPortfolioRecommendations);

// Get all recommendations for a user (public)
router.get('/user/:userId', getUserRecommendations);

// Update recommendation status (requires auth)
router.patch('/:id/status', authenticate, updateRecommendationStatus);

// Delete a recommendation (requires auth)
router.delete('/:id', authenticate, deleteRecommendation);

export default router;
