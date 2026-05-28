/**
 * Engineer Routes
 * Handles executive engineer management and routing
 */

import { Router, Request, Response } from 'express';
import pool from '../config/postgres';

const router = Router();

/**
 * GET /api/engineers
 * Get all executive engineers
 */
router.get('/engineers', async (req: Request, res: Response) => {
  try {
    const { city, country } = req.query;
    
    let query = `
      SELECT 
        engineer_id,
        engineer_name,
        designation,
        department,
        contact_phone,
        contact_email,
        office_address,
        jurisdiction_wards,
        specialization,
        city,
        country,
        workload
      FROM executive_engineers
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (city) {
      params.push(city);
      query += ` AND city = $${params.length}`;
    }
    
    if (country) {
      params.push(country);
      query += ` AND country = $${params.length}`;
    }
    
    query += ' ORDER BY workload ASC, engineer_name';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching engineers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engineers',
      message: error.message
    });
  }
});

/**
 * GET /api/engineers/:id
 * Get a specific engineer by ID
 */
router.get('/engineers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        ee.*,
        COUNT(r.report_id) as assigned_issues,
        SUM(CASE WHEN r.status = 'Report Received' THEN 1 ELSE 0 END) as pending_issues,
        SUM(CASE WHEN r.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_issues,
        SUM(CASE WHEN r.status = 'Resolved' THEN 1 ELSE 0 END) as resolved_issues
      FROM executive_engineers ee
      LEFT JOIN reports r ON ee.engineer_id = r.assigned_engineer_id
      WHERE ee.engineer_id = $1
      GROUP BY ee.engineer_id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Engineer not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching engineer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engineer',
      message: error.message
    });
  }
});

/**
 * GET /api/engineers/:id/issues
 * Get all issues assigned to an engineer
 */
router.get('/engineers/:id/issues', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    
    let query = `
      SELECT 
        r.report_id,
        r.category,
        r.severity,
        r.description,
        r.status,
        r.road_type,
        r.road_name,
        r.ward_name,
        r.city,
        r.country,
        r.estimated_cost,
        r.amount_sanctioned,
        r.amount_spent,
        r.created_at,
        ST_X(r.location::geometry) as longitude,
        ST_Y(r.location::geometry) as latitude
      FROM reports r
      WHERE r.assigned_engineer_id = $1
    `;
    
    const params: any[] = [id];
    
    if (status) {
      params.push(status);
      query += ` AND r.status = $${params.length}`;
    }
    
    query += ' ORDER BY r.severity DESC, r.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching engineer issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engineer issues',
      message: error.message
    });
  }
});

/**
 * POST /api/engineers/auto-assign
 * Auto-assign an engineer to a report
 */
router.post('/engineers/auto-assign', async (req: Request, res: Response) => {
  try {
    const { report_id } = req.body;
    
    if (!report_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: report_id'
      });
    }
    
    // Get report details
    const reportResult = await pool.query(
      'SELECT ward_name, category, city FROM reports WHERE report_id = $1',
      [report_id]
    );
    
    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    const report = reportResult.rows[0];
    
    // Auto-assign engineer
    const engineerId = await pool.query(
      'SELECT auto_assign_engineer($1, $2, $3) as engineer_id',
      [report.ward_name, report.category, report.city]
    );
    
    if (!engineerId.rows[0].engineer_id) {
      return res.status(404).json({
        success: false,
        error: 'No suitable engineer found for this report'
      });
    }
    
    // Update report with assigned engineer
    const updateResult = await pool.query(
      `UPDATE reports 
       SET assigned_engineer_id = $1 
       WHERE report_id = $2 
       RETURNING *`,
      [engineerId.rows[0].engineer_id, report_id]
    );
    
    // Get engineer details
    const engineerResult = await pool.query(
      'SELECT * FROM executive_engineers WHERE engineer_id = $1',
      [engineerId.rows[0].engineer_id]
    );
    
    res.json({
      success: true,
      message: 'Engineer assigned successfully',
      data: {
        report: updateResult.rows[0],
        engineer: engineerResult.rows[0]
      }
    });
  } catch (error: any) {
    console.error('Error auto-assigning engineer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-assign engineer',
      message: error.message
    });
  }
});

/**
 * GET /api/engineers/contact/:report_id
 * Get engineer contact information for a specific report
 */
router.get('/engineers/contact/:report_id', async (req: Request, res: Response) => {
  try {
    const { report_id } = req.params;
    
    const query = `
      SELECT 
        ee.engineer_id,
        ee.engineer_name,
        ee.designation,
        ee.department,
        ee.contact_phone,
        ee.contact_email,
        ee.office_address,
        r.report_id,
        r.category,
        r.status
      FROM reports r
      LEFT JOIN executive_engineers ee ON r.assigned_engineer_id = ee.engineer_id
      WHERE r.report_id = $1
    `;
    
    const result = await pool.query(query, [report_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    if (!result.rows[0].engineer_id) {
      return res.status(404).json({
        success: false,
        error: 'No engineer assigned to this report yet',
        data: {
          report_id: result.rows[0].report_id,
          category: result.rows[0].category,
          status: result.rows[0].status
        }
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching engineer contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engineer contact',
      message: error.message
    });
  }
});

export default router;
