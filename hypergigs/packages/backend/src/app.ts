import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import teamRoutes from './routes/team.routes.js';
import invitationRoutes from './routes/invitation.routes.js';

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

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

logger.info('Express app configured');
