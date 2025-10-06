import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Start server
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info(
        `Server running on http://${config.server.host}:${config.server.port}`
      );
      logger.info(`Environment: ${config.server.nodeEnv}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        await prisma.$disconnect();
        logger.info('Database disconnected');
        
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
