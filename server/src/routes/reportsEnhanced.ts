/**
 * Enhanced Reports Routes
 * Includes filtering, road information, engineer routing, and global data
 */

import { Router, Request, Response } from 'express';
import pool from '../config/postgres';

const router = Router();

/**
 * GET /api/reports/enhanced
 * Get all reports with enhanced filtering and road information
 */
router.get('/enhanced', async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      category, 
      severity_min, 
      severity_max,
      city,
      country,
      road_type,
      limit = 100,
      offset = 0
    } = req.query;
    
    let query = `
      SELECT 
        r.report_id,
        r.category,
        r.severity,
        r.description,
        r.status,
        r.road_type,
        r.road_name,
        r.last_relaying_date,
        r.contractor_name,
        r.ward_name,
        r.city,
        r.country,
        r.estimated_cost,
        r.amount_sanctioned,
        r.amount_spent,
        r.budget_variance,
        r.created_at,
        ST_X(r.location::geometry) as longitude,
        ST_Y(r.location::geometry) as latitude,
        ee.engineer_name,
        ee.contact_email as engineer_email,
        ee.contact_phone as engineer_phone,
        ee.office_address as engineer_office
      FROM reports r
      LEFT JOIN executive_engineers ee ON r.assigned_engineer_id = ee.engineer_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    // Status filtering
    if (status) {
      params.push(status);
      query += ` AND r.status = $${paramCount++}`;
    }
    
    // Category filtering
    if (category) {
      params.push(category);
      query += ` AND r.category = $${paramCount++}`;
    }
    
    // Severity range filtering
    if (severity_min) {
      params.push(parseInt(severity_min as string));
      query += ` AND r.severity >= $${paramCount++}`;
    }
    
    if (severity_max) {
      params.push(parseInt(severity_max as string));
      query += ` AND r.severity <= $${paramCount++}`;
    }
    
    // City filtering
    if (city) {
      params.push(city);
      query += ` AND r.city = $${paramCount++}`;
    }
    
    // Country filtering
    if (country) {
      params.push(country);
      query += ` AND r.country = $${paramCount++}`;
    }
    
    // Road type filtering
    if (road_type) {
      params.push(road_type);
      query += ` AND r.road_type = $${paramCount++}`;
    }
    
    query += ` ORDER BY r.severity DESC, r.created_at DESC`;
    
    // Pagination
    params.push(parseInt(limit as string));
    query += ` LIMIT $${paramCount++}`;
    
    params.push(parseInt(offset as string));
    query += ` OFFSET $${paramCount++}`;
    
    const result = await pool.query(query, params);
    
    // Get total count with same filters
    let countQuery = 'SELECT COUNT(*) FROM reports r WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;
    
    if (status) {
      countParams.push(status);
      countQuery += ` AND r.status = $${countParamCount++}`;
    }
    if (category) {
      countParams.push(category);
      countQuery += ` AND r.category = $${countParamCount++}`;
    }
    if (severity_min) {
      countParams.push(parseInt(severity_min as string));
      countQuery += ` AND r.severity >= $${countParamCount++}`;
    }
    if (severity_max) {
      countParams.push(parseInt(severity_max as string));
      countQuery += ` AND r.severity <= $${countParamCount++}`;
    }
    if (city) {
      countParams.push(city);
      countQuery += ` AND r.city = $${countParamCount++}`;
    }
    if (country) {
      countParams.push(country);
      countQuery += ` AND r.country = $${countParamCount++}`;
    }
    if (road_type) {
      countParams.push(road_type);
      countQuery += ` AND r.road_type = $${countParamCount++}`;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      count: result.rows.length,
      total,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching enhanced reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      message: error.message
    });
  }
});

/**
 * GET /api/reports/dashboard
 * Get reports for dashboard map with all global data
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { bounds } = req.query;
    
    let query = `
      SELECT 
        r.report_id,
        r.category,
        r.severity,
        r.description,
        r.status,
        r.road_type,
        r.road_name,
        r.last_relaying_date,
        r.contractor_name,
        r.ward_name,
        r.city,
        r.country,
        r.estimated_cost,
        r.amount_sanctioned,
        r.amount_spent,
        r.created_at,
        ST_X(r.location::geometry) as longitude,
        ST_Y(r.location::geometry) as latitude,
        ee.engineer_name,
        ee.contact_email as engineer_email,
        ee.contact_phone as engineer_phone
      FROM reports r
      LEFT JOIN executive_engineers ee ON r.assigned_engineer_id = ee.engineer_id
    `;
    
    const params: any[] = [];
    
    // If bounds provided, filter by geographic bounds
    if (bounds) {
      const [minLng, minLat, maxLng, maxLat] = (bounds as string).split(',').map(parseFloat);
      query += ` WHERE ST_Intersects(
        r.location::geometry,
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      )`;
      params.push(minLng, minLat, maxLng, maxLat);
    }
    
    query += ` ORDER BY r.severity DESC, r.created_at DESC LIMIT 1000`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching dashboard reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard reports',
      message: error.message
    });
  }
});

/**
 * GET /api/reports/stats
 * Get report statistics by status, category, country
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        AVG(severity) as avg_severity,
        SUM(estimated_cost) as total_estimated_cost,
        SUM(amount_sanctioned) as total_sanctioned,
        SUM(amount_spent) as total_spent
      FROM reports
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const categoryQuery = `
      SELECT 
        category,
        COUNT(*) as count,
        AVG(severity) as avg_severity
      FROM reports
      GROUP BY category
      ORDER BY count DESC
    `;
    
    const countryQuery = `
      SELECT 
        country,
        COUNT(*) as count,
        AVG(severity) as avg_severity,
        SUM(amount_sanctioned) as total_sanctioned
      FROM reports
      WHERE country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
    `;
    
    const roadTypeQuery = `
      SELECT 
        road_type,
        COUNT(*) as count,
        AVG(severity) as avg_severity
      FROM reports
      WHERE road_type IS NOT NULL
      GROUP BY road_type
      ORDER BY count DESC
    `;
    
    const [statusResult, categoryResult, countryResult, roadTypeResult] = await Promise.all([
      pool.query(statusQuery),
      pool.query(categoryQuery),
      pool.query(countryQuery),
      pool.query(roadTypeQuery)
    ]);
    
    res.json({
      success: true,
      data: {
        by_status: statusResult.rows,
        by_category: categoryResult.rows,
        by_country: countryResult.rows,
        by_road_type: roadTypeResult.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report stats',
      message: error.message
    });
  }
});

/**
 * PATCH /api/reports/:id/update
 * Update report with road information and contractor
 */
router.patch('/:id/update', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      status,
      road_type,
      road_name,
      last_relaying_date,
      contractor_name,
      ward_name,
      city,
      country,
      estimated_cost
    } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;
    
    if (status) {
      params.push(status);
      updates.push(`status = $${paramCount++}`);
    }
    
    if (road_type) {
      params.push(road_type);
      updates.push(`road_type = $${paramCount++}`);
    }
    
    if (road_name) {
      params.push(road_name);
      updates.push(`road_name = $${paramCount++}`);
    }
    
    if (last_relaying_date) {
      params.push(last_relaying_date);
      updates.push(`last_relaying_date = $${paramCount++}`);
    }
    
    if (contractor_name) {
      params.push(contractor_name);
      updates.push(`contractor_name = $${paramCount++}`);
    }
    
    if (ward_name) {
      params.push(ward_name);
      updates.push(`ward_name = $${paramCount++}`);
    }
    
    if (city) {
      params.push(city);
      updates.push(`city = $${paramCount++}`);
    }
    
    if (country) {
      params.push(country);
      updates.push(`country = $${paramCount++}`);
    }
    
    if (estimated_cost) {
      params.push(estimated_cost);
      updates.push(`estimated_cost = $${paramCount++}`);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }
    
    params.push(id);
    const query = `
      UPDATE reports
      SET ${updates.join(', ')}
      WHERE report_id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
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

export default router;
