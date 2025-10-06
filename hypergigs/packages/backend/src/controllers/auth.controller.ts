import { Request, Response } from 'express';
import { authService, RegisterData, LoginData } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, username, role } = req.body;

    // Validate required fields
    if (!email || !password || !name || !username) {
      res.status(400).json({ error: 'Email, password, name, and username are required' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      res.status(400).json({ 
        error: 'Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens' 
      });
      return;
    }

    const registerData: RegisterData = {
      email: email.toLowerCase(),
      password,
      name,
      username: username.toLowerCase(),
      role: role || 'FREELANCER',
    };

    const result = await authService.register(registerData);

    res.status(201).json(result);
  } catch (error) {
    logger.error('Registration error:', error);
    
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const loginData: LoginData = {
      email: email.toLowerCase(),
      password,
    };

    const result = await authService.login(loginData);

    res.status(200).json(result);
  } catch (error) {
    logger.error('Login error:', error);
    
    if (error instanceof Error) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Login failed' });
    }
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await authService.getUserById(req.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

/**
 * Logout user (client-side handles token removal)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a JWT implementation, logout is primarily client-side
    // But we can log the event for security purposes
    if (req.userId) {
      logger.info(`User logged out: ${req.userId}`);
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};
