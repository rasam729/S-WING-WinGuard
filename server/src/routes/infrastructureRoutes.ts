/**
 * Infrastructure Routes
 * Endpoints for infrastructure data and statistics
 */

import { Router, Response, NextFunction, Request } from 'express';
import { authenticate } from '../middleware/auth';
import Infrastructure from '../models/Infrastructure';
import SafetyIssue from '../models/SafetyIssue';
import { HTTP_STATUS } from '@shared/constants';
import pool from '../config/database';
import { Server as SocketIOServer } from 'socket.io';

const router = Router();

// Socket.IO instance (will be set by server.ts)
let io: SocketIOServer | null = null;

export function setInfrastructureSocketIO(ioInstance: SocketIOServer) {
  io = ioInstance;
}

/**
 * GET /api/infrastructure
 * Get all infrastructure
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.query;

      let query = 'SELECT infra_id, type, status, ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude, installed_date, last_maintenance, notes, created_at FROM infrastructure WHERE 1=1';
      const params: any[] = [];
      
      if (type) {
        params.push(type);
        query += ` AND type = $${params.length}`;
      }
      
      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching infrastructure:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch infrastructure'
      });
    }
  }
);

/**
 * POST /api/infrastructure
 * Add new infrastructure (police booth, streetlight, hospital, etc.)
 */
router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, latitude, longitude, status = 'functional', notes } = req.body;

      if (!type || !latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: 'Type, latitude, and longitude are required'
        });
      }

      const query = `
        INSERT INTO infrastructure (type, status, location, notes, installed_date)
        VALUES ($1, $2, ST_GeogFromText($3), $4, CURRENT_TIMESTAMP)
        RETURNING infra_id, type, status, ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude, installed_date, notes
      `;

      const locationWKT = `POINT(${longitude} ${latitude})`;
      const result = await pool.query(query, [type, status, locationWKT, notes || null]);

      const newInfrastructure = result.rows[0];

      // Emit Socket.IO event for real-time updates
      if (io) {
        io.emit('infrastructure-added', newInfrastructure);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: newInfrastructure,
        message: `${type} added successfully`
      });
    } catch (error) {
      console.error('Error adding infrastructure:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add infrastructure'
      });
    }
  }
);

/**
 * DELETE /api/infrastructure/:id
 * Remove infrastructure
 */
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM infrastructure WHERE infra_id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Infrastructure not found'
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Infrastructure removed successfully'
      });
    } catch (error) {
      console.error('Error removing infrastructure:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove infrastructure'
      });
    }
  }
);

/**
 * GET /api/infrastructure/stats
 * Get infrastructure statistics
 */
router.get(
  '/stats',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statsQuery = `
        SELECT 
          type,
          status,
          COUNT(*) as count
        FROM infrastructure
        GROUP BY type, status
        ORDER BY type, status
      `;

      const result = await pool.query(statsQuery);

      // Aggregate by type
      const stats: any = {
        police_booth: 0,
        streetlight: 0,
        hospital: 0,
        cctv: 0,
        total: 0
      };

      result.rows.forEach((row: any) => {
        if (stats.hasOwnProperty(row.type)) {
          stats[row.type] += parseInt(row.count);
        }
        stats.total += parseInt(row.count);
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: stats,
        details: result.rows
      });
    } catch (error) {
      console.error('Error fetching infrastructure stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch infrastructure stats'
      });
    }
  }
);

export default router;
