/**
 * Authentication Middleware
 * JWT token validation and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HTTP_STATUS, ERROR_CODES } from '@shared/constants';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'citizen' | 'official';
  };
}

/**
 * Verify JWT token and attach user to request
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Authentication required',
        code: ERROR_CODES.AUTH_REQUIRED
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        username: string;
        role: 'citizen' | 'official';
      };

      req.user = decoded;
      next();
    } catch (jwtError) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Invalid or expired token',
        code: ERROR_CODES.AUTH_REQUIRED
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Require specific role(s)
 */
export function requireRole(...roles: Array<'citizen' | 'official'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Authentication required',
        code: ERROR_CODES.AUTH_REQUIRED
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        error: 'Insufficient permissions',
        code: ERROR_CODES.FORBIDDEN,
        requiredRole: roles.join(' or ')
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication - attach user if token present, but don't require it
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      role: 'citizen' | 'official';
    };

    req.user = decoded;
  } catch (error) {
    // Invalid token, but that's okay for optional auth
  }

  next();
}
