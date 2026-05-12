/**
 * File Upload Middleware
 * Multer configuration for photo uploads
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { HTTP_STATUS, ERROR_CODES } from '@shared/constants';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `photo-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG images are allowed.'));
  }
};

// Create multer instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: fileFilter
});

// Error handler for multer errors
export function handleUploadError(err: any, _req: Request, res: any, next: any): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        code: ERROR_CODES.FILE_TOO_LARGE
      });
      return;
    }
    
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: err.message,
      code: ERROR_CODES.VALIDATION_ERROR
    });
    return;
  }
  
  if (err) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: err.message,
      code: ERROR_CODES.INVALID_FILE_TYPE
    });
    return;
  }
  
  next();
}
