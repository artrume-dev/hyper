import { Request, Response } from 'express';
import { authService, RegisterData, LoginData, OAuthRegisterData } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';
import { OAuth2Client } from 'google-auth-library';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, username, role, invitationToken } = req.body;

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
      invitationToken, // Pass invitation token if provided
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

/**
 * OAuth LinkedIn login/register
 */
export const oauthLinkedIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    // role and country will be used when implementation is complete

    if (!code) {
      res.status(400).json({ error: 'LinkedIn authorization code is required' });
      return;
    }

    // TODO: Implement LinkedIn OAuth verification
    // This requires:
    // 1. Exchange code for access token
    // 2. Fetch user profile from LinkedIn API
    // 3. Create/update user in database
    // For now, returning not implemented error
    res.status(501).json({ error: 'LinkedIn OAuth not yet implemented. Coming soon!' });
  } catch (error) {
    logger.error('LinkedIn OAuth error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'OAuth authentication failed' });
    }
  }
};

/**
 * OAuth Google login/register
 */
export const oauthGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential, role, country } = req.body;

    if (!credential) {
      res.status(400).json({ error: 'Google credential is required' });
      return;
    }

    // Verify Google token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: 'Invalid Google token' });
      return;
    }

    const oauthData: OAuthRegisterData = {
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      role: role || 'FREELANCER',
      provider: 'google',
      providerId: payload.sub,
      avatar: payload.picture,
      country,
    };

    const result = await authService.registerOrLoginWithOAuth(oauthData);

    res.status(200).json(result);
  } catch (error) {
    logger.error('Google OAuth error:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'OAuth authentication failed' });
    }
  }
};
