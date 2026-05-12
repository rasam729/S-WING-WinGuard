/**
 * 404 Not Found Handler
 */

import { Request, Response } from 'express';
import { HTTP_STATUS, ERROR_CODES } from '@shared/constants';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: 'Resource not found',
    code: ERROR_CODES.NOT_FOUND,
    path: req.path,
    method: req.method
  });
}
