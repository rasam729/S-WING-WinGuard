/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_CODES } from '@shared/constants';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Global error handler
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Default error response
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const code = err.code || ERROR_CODES.INTERNAL_ERROR;

  // Generate request ID for tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Send error response
  res.status(statusCode).json({
    error: err.message || 'An unexpected error occurred',
    code: code,
    requestId: requestId,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * Create an application error
 */
export function createError(
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code: string = ERROR_CODES.INTERNAL_ERROR,
  details?: Record<string, any>
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}
