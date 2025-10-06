import { Request, Response, NextFunction } from 'express';
import { ApiError, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof ApiError) {
    return sendError(res, err, err.statusCode);
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return sendError(res, new ApiError(400, 'Database error'), 400);
  }

  // Default error
  return sendError(res, err, 500);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, new ApiError(404, `Route ${req.path} not found`), 404);
};
