import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { emailInvitationService } from './emailInvitation.service.js';

// Use Prisma generated type
type User = Awaited<ReturnType<typeof prisma.user.findUnique>>;

export type UserRole = 'FREELANCER' | 'AGENCY' | 'STARTUP';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  username: string;
  role: UserRole;
  country?: string;
  invitationToken?: string; // Optional invitation token
}

export interface OAuthRegisterData {
  email: string;
  name: string;
  role: UserRole;
  provider: 'google' | 'linkedin';
  providerId: string;
  avatar?: string;
  country?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // If invitation token is provided, validate it
    let invitation = null;
    if (data.invitationToken) {
      try {
        invitation = await emailInvitationService.validateInvitationToken(
          data.invitationToken
        );

        // Ensure the email matches the invitation
        if (invitation.email.toLowerCase() !== data.email.toLowerCase()) {
          throw new Error('Email does not match the invitation');
        }
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'Invalid invitation token'
        );
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new Error('User already exists with this email');
      }
      throw new Error('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Split name into firstName and lastName
    const nameParts = data.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        firstName,
        lastName,
        role: data.role,
        country: data.country,
      },
    });

    logger.info(`User registered: ${user.email}`);

    // If user registered with invitation token, accept the invitation
    if (invitation && data.invitationToken) {
      try {
        await emailInvitationService.acceptInvitation(data.invitationToken, user.id);
        logger.info(`User ${user.email} accepted invitation and joined team ${invitation.teamId}`);
      } catch (error) {
        logger.error('Failed to accept invitation after registration:', error);
        // Don't fail registration if invitation acceptance fails
      }
    }

    // Generate token
    const token = this.generateToken(user.id);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Register or login user via OAuth
   */
  async registerOrLoginWithOAuth(data: OAuthRegisterData): Promise<AuthResponse> {
    const providerIdField = data.provider === 'google' ? 'googleId' : 'linkedinId';

    // Check if user already exists with this OAuth provider
    let user = await prisma.user.findFirst({
      where: {
        [providerIdField]: data.providerId,
      },
    });

    // If user exists with email, link OAuth account
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (user) {
        // Update existing user with OAuth info
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            [providerIdField]: data.providerId,
            oauthProvider: data.provider,
            avatar: data.avatar || user.avatar,
          },
        });
      }
    }

    // If user doesn't exist, create new user
    if (!user) {
      const nameParts = data.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

      // Generate username from email
      const baseUsername = data.email.split('@')[0].toLowerCase();
      let username = baseUsername;
      let counter = 1;

      // Ensure username is unique
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          email: data.email,
          username,
          firstName,
          lastName,
          role: data.role,
          country: data.country,
          avatar: data.avatar,
          [providerIdField]: data.providerId,
          oauthProvider: data.provider,
          password: null, // OAuth users don't need password
        },
      });

      logger.info(`User registered via ${data.provider}: ${user.email}`);
    }

    // Generate token
    const token = this.generateToken(user.id);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user has a password (OAuth users might not have one)
    if (!user.password) {
      throw new Error('Please use OAuth to login with this account');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    logger.info(`User logged in: ${user.email}`);

    // Generate token
    const token = this.generateToken(user.id);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as any
    );
  }
}

export const authService = new AuthService();
