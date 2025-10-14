import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import teamRoutes from './routes/team.routes.js';
import invitationRoutes from './routes/invitation.routes.js';
import aiRoutes from './routes/ai.routes.js';

// Create Express app
export const app = express();

// CORS configuration - allow Vite dev and preview ports + production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:4173',
  'http://localhost:4174',
  process.env.CORS_ORIGIN, // Railway production frontend
  process.env.FRONTEND_URL, // Alternative env var
].filter(Boolean); // Remove undefined values

// Log allowed origins for debugging
logger.info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      logger.info(`CORS: Allowing origin: ${origin}`);
      callback(null, true);
    } else {
      logger.warn(`CORS: Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false, // Don't pass preflight to next handler
  optionsSuccessStatus: 204 // Some legacy browsers choke on 204
};

// Apply CORS before any other middleware to handle preflight requests immediately
app.use(cors(corsOptions));

// Handle preflight requests explicitly for all routes
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (_req, res) => {
  res.json({
    message: 'Hypergigs API',
    version: '1.0.0',
    status: 'running',
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Team routes
app.use('/api/teams', teamRoutes);

// Invitation routes
app.use('/api/invitations', invitationRoutes);

// AI routes
app.use('/api/ai', aiRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

logger.info('Express app configured');
