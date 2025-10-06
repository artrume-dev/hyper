import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  cors: {
    // Allow multiple origins in development (Vite may use 5173 or 5174)
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:5173', 'http://localhost:5174'],
  },
  socket: {
    port: parseInt(process.env.SOCKET_PORT || '3002', 10),
  },
};
