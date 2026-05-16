/**
 * Reports Routes (Fixed for actual schema)
 * Handles CRUD operations for safety reports with PostGIS spatial data
 */

import { Router, Request, Response } from 'express';
import pool from '../config/postgres';

const router = Router();

// Socket.io instance will be set by server
let io: any = null;

export function setSocketIO(socketIO: any) {
  io = socketIO;
}

/**
 * POST /api/reports
 * Create a new safety report from Citizen App
 */
router.post('/reports', async (req: Request, res: Response) => {
  try {
    const { category, description, latitude, longitude, severity } = req.body;
    
    if (!category || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: category, latitude, longitude'
      });
    }
    
    const query = `
      INSERT INTO reports (category, severity, description, location, status, created_at)
      VALUES ($1, $2, $3, ST_GeogFromText('POINT(' || $5 || ' ' || $4 || ')'), 'Report Received', NOW())
      RETURNING 
        report_id, category, severity, description,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        status, created_at, dept_id
    `;
    
    const result = await pool.query(query, [category, severity || 5, description || '', latitude, longitude]);
    const newReport = result.rows[0];
    
    if (io) {
      io.emit('new-report', { ...newReport, message: 'New safety report submitted' });
      console.log('📡 Broadcasted new report:', newReport.report_id);
    }
    
    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: newReport
    });
  } catch (error: any) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report',
      message: error.message
    });
  }
});

/**
 * GET /api/reports
 * Fetch all reports with optional filtering
 */
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const { status, category, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        r.report_id, r.category, r.severity, r.description,
        ST_X(r.location::geometry) as longitude,
        ST_Y(r.location::geometry) as latitude,
        r.status, r.report_status, r.created_at,
        r.amount_sanctioned, r.amount_spent,
        d.dept_name as department_name
      FROM reports r
      LEFT JOIN departments d ON r.dept_id = d.dept_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (category) {
      query += ` AND r.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    query += ` ORDER BY r.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      message: error.message
    });
  }
});

/**
 * GET /api/reports/:id
 * Fetch a single report by ID
 */
router.get('/reports/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        r.report_id, r.category, r.severity, r.description,
        ST_X(r.location::geometry) as longitude,
        ST_Y(r.location::geometry) as latitude,
        r.status, r.report_status, r.created_at,
        r.amount_sanctioned, r.amount_spent,
        d.dept_name as department_name,
        d.executive_engineer, d.contact_email
      FROM reports r
      LEFT JOIN departments d ON r.dept_id = d.dept_id
      WHERE r.report_id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report',
      message: error.message
    });
  }
});

/**
 * PUT /api/reports/:id/status
 * Update report status (simplified endpoint for dashboard)
 */
router.put('/reports/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const query = `
      UPDATE reports 
      SET status = $1, updated_at = NOW()
      WHERE report_id = $2
      RETURNING 
        report_id, category, severity, description,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        status, created_at, updated_at
    `;
    
    const result = await pool.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    // Emit socket event for real-time update
    if (io) {
      io.emit('report-updated', {
        report_id: id,
        status,
        message: `Report status updated to ${status}`
      });
    }
    
    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report status',
      message: error.message
    });
  }
});

/**
 * PATCH /api/reports/:id
 * Update report status (Official Dashboard)
 */
router.patch('/reports/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, amount_sanctioned, amount_spent } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;
    
    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    
    if (amount_sanctioned !== undefined) {
      updates.push(`amount_sanctioned = $${paramCount}`);
      params.push(amount_sanctioned);
      paramCount++;
    }
    
    if (amount_spent !== undefined) {
      updates.push(`amount_spent = $${paramCount}`);
      params.push(amount_spent);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }
    
    const query = `
      UPDATE reports 
      SET ${updates.join(', ')}
      WHERE report_id = $${paramCount}
      RETURNING *
    `;
    params.push(id);
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    if (io) {
      io.emit('report-updated', {
        report_id: id,
        status,
        message: 'Report status updated'
      });
    }
    
    res.json({
      success: true,
      message: 'Report updated successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report',
      message: error.message
    });
  }
});

/**
 * DELETE /api/reports/:id
 * Delete a report
 */
router.delete('/reports/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM reports WHERE report_id = $1 RETURNING report_id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report',
      message: error.message
    });
  }
});

export default router;
