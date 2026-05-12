/**
 * Infrastructure Routes
 * Endpoints for infrastructure data and statistics
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import Infrastructure from '../models/Infrastructure';
import SafetyIssue from '../models/SafetyIssue';
import { HTTP_STATUS } from '@shared/constants';

const router = Router();

/**
 * GET /api/infrastructure
 * Get all infrastructure
 */
router.get(
  '/',
  authenticate,
  async (req, res: Response, next: NextFunction) => {
    try {
      const { type } = req.query;
      // const { bounds } = req.query; // TODO: Add bounds filtering

      const query: any = {};
      if (type) {
        query.type = type;
      }

      // TODO: Add bounds filtering

      const infrastructure = await Infrastructure.find(query);

      res.status(HTTP_STATUS.OK).json({
        infrastructure
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/infrastructure/stats
 * Get infrastructure statistics
 */
router.get(
  '/stats',
  authenticate,
  async (_req, res: Response, next: NextFunction) => {
    try {
      const totalIssues = await SafetyIssue.countDocuments();
      const resolvedIssues = await SafetyIssue.countDocuments({ status: 'resolved' });
      const policeBooths = await Infrastructure.countDocuments({ type: 'police_booth' });
      const streetlights = await Infrastructure.countDocuments({ type: 'streetlight' });

      // Calculate average severity
      const severityAgg = await SafetyIssue.aggregate([
        { $match: { status: 'reported' } },
        { $group: { _id: null, avgSeverity: { $avg: '$severity.calculated' } } }
      ]);
      const averageSeverity = severityAgg.length > 0 ? Math.round(severityAgg[0].avgSeverity) : 0;

      // Get issues by day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const issuesByDay = await SafetyIssue.aggregate([
        { $match: { reportedAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$reportedAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } }
      ]);

      res.status(HTTP_STATUS.OK).json({
        totalIssues,
        resolvedIssues,
        policeBooths,
        streetlights,
        averageSeverity,
        issuesByDay
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
