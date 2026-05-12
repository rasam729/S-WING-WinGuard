/**
 * Report Routes
 * Endpoints for safety issue reporting and management
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { validateBoundary, validateReportRequest, validatePagination } from '../middleware/validation';
import { upload, handleUploadError } from '../middleware/upload';
import SafetyIssue from '../models/SafetyIssue';
import { calculateSeverityScore } from '@shared/safetyLogic';
import { HTTP_STATUS } from '@shared/constants';

const router = Router();

/**
 * POST /api/reports
 * Create a new safety issue report
 */
router.post(
  '/',
  authenticate,
  requireRole('citizen'),
  upload.single('photo'),
  handleUploadError,
  validateReportRequest,
  validateBoundary,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { issueType, description, userSeverity, latitude, longitude, timestamp } = req.body;
      const file = req.file;

      if (!file) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Photo is required' });
        return;
      }

      // Calculate severity score
      const calculatedSeverity = calculateSeverityScore(
        parseInt(userSeverity),
        issueType,
        timestamp ? new Date(timestamp) : new Date(),
        { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        [] // TODO: Load crime zones from database
      );

      // Create safety issue
      const issue = await SafetyIssue.create({
        issueType,
        description,
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        photoUrl: `/uploads/${file.filename}`,
        photoMetadata: {
          capturedAt: timestamp ? new Date(timestamp) : new Date(),
          exifLocation: null // TODO: Extract EXIF data
        },
        severity: {
          userInput: parseInt(userSeverity),
          calculated: calculatedSeverity,
          factors: {
            issueTypeWeight: 0.3,
            timeOfDayWeight: 0.2,
            proximityToCrimeWeight: 0.1
          }
        },
        status: 'reported',
        reportedBy: req.user!.id,
        reportedAt: new Date()
      });

      // TODO: Broadcast to WebSocket clients

      res.status(HTTP_STATUS.CREATED).json({
        issueId: issue._id.toString(),
        calculatedSeverity,
        photoUrl: issue.photoUrl
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/reports
 * Get all safety issues with optional filters
 */
router.get(
  '/',
  authenticate,
  validatePagination,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string);
      const offset = parseInt(req.query.offset as string);
      const resolved = req.query.resolved === 'true';
      const minSeverity = req.query.minSeverity ? parseInt(req.query.minSeverity as string) : undefined;

      const query: any = {};
      if (req.query.resolved !== undefined) {
        query.status = resolved ? 'resolved' : 'reported';
      }
      if (minSeverity !== undefined) {
        query['severity.calculated'] = { $gte: minSeverity };
      }

      const total = await SafetyIssue.countDocuments(query);
      const issues = await SafetyIssue.find(query)
        .sort({ 'severity.calculated': -1, reportedAt: -1 })
        .limit(limit)
        .skip(offset)
        .populate('reportedBy', 'username')
        .populate('resolvedBy', 'username');

      res.status(HTTP_STATUS.OK).json({
        issues,
        total,
        hasMore: offset + limit < total
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/reports/:id/resolve
 * Mark an issue as resolved
 */
router.patch(
  '/:id/resolve',
  authenticate,
  requireRole('official'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const issue = await SafetyIssue.findByIdAndUpdate(
        req.params.id,
        {
          status: 'resolved',
          resolvedBy: req.user!.id,
          resolvedAt: new Date()
        },
        { new: true }
      );

      if (!issue) {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Issue not found' });
        return;
      }

      // TODO: Broadcast to WebSocket clients

      res.status(HTTP_STATUS.OK).json({
        issueId: issue._id.toString(),
        status: 'resolved',
        resolvedAt: issue.resolvedAt,
        resolvedBy: req.user!.id
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
