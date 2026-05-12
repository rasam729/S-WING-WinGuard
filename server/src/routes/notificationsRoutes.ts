/**
 * Notifications Routes
 * Handles citizen notifications about report status
 */

import { Router, Request, Response } from 'express';
import pool from '../config/postgres';

const router = Router();

/**
 * GET /api/notifications
 * Get all notifications for a user (by report IDs or all)
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const { report_id, unread_only } = req.query;
    
    let query = `
      SELECT 
        n.notification_id,
        n.report_id,
        n.message,
        n.type,
        n.sent_at,
        n.read_at,
        r.category,
        r.status as report_status
      FROM notifications n
      LEFT JOIN reports r ON n.report_id = r.report_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    if (report_id) {
      query += ` AND n.report_id = $${paramCount}`;
      params.push(report_id);
      paramCount++;
    }
    
    if (unread_only === 'true') {
      query += ` AND n.read_at IS NULL`;
    }
    
    query += ` ORDER BY n.sent_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE notifications SET read_at = NOW() WHERE notification_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/report/:reportId
 * Get notifications for a specific report
 */
router.get('/notifications/report/:reportId', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        n.*,
        r.category,
        r.status as report_status,
        r.estimated_fix_date,
        r.actual_fix_date
      FROM notifications n
      JOIN reports r ON n.report_id = r.report_id
      WHERE n.report_id = $1
      ORDER BY n.sent_at DESC
    `, [reportId]);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching report notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report notifications',
      message: error.message
    });
  }
});

export default router;
