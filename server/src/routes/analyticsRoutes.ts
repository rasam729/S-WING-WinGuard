/**
 * Analytics Routes
 * Provides data for charts and graphs
 */

import { Router, Request, Response } from 'express';
import pool from '../config/postgres';

const router = Router();

/**
 * GET /api/analytics/overview
 * Get overview statistics for dashboard
 */
router.get('/analytics/overview', async (req: Request, res: Response) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'Report Received' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN category = 'Pothole' THEN 1 END) as potholes,
        COUNT(CASE WHEN category = 'Streetlight' THEN 1 END) as streetlights,
        COUNT(CASE WHEN category = 'Crime' THEN 1 END) as crime_reports,
        AVG(severity) as avg_severity
      FROM reports
    `);
    
    const infrastructure = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'functional' THEN 1 END) as functional,
        COUNT(CASE WHEN status = 'broken' THEN 1 END) as broken
      FROM infrastructure
      GROUP BY type
    `);
    
    res.json({
      success: true,
      data: {
        reports: stats.rows[0],
        infrastructure: infrastructure.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/reports-by-category
 * Get report counts by category for pie chart
 */
router.get('/analytics/reports-by-category', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM reports
      GROUP BY category
      ORDER BY count DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching category data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category data',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/reports-timeline
 * Get reports over time for line chart
 */
router.get('/analytics/reports-timeline', async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN category = 'Pothole' THEN 1 END) as potholes,
        COUNT(CASE WHEN category = 'Streetlight' THEN 1 END) as streetlights,
        COUNT(CASE WHEN category = 'Crime' THEN 1 END) as crime
      FROM reports
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/status-distribution
 * Get report status distribution for bar chart
 */
router.get('/analytics/status-distribution', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM reports
      GROUP BY status
      ORDER BY count DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching status distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status distribution',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/safety-heatmap
 * Get safety scores for heatmap visualization
 */
router.get('/analytics/safety-heatmap', async (req: Request, res: Response) => {
  try {
    const { center_lat = 12.9716, center_lng = 77.5946, radius = 5000 } = req.query;
    
    // Generate grid points for heatmap
    const gridSize = 10; // 10x10 grid
    const points = [];
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = parseFloat(center_lat as string) + (i - gridSize/2) * 0.01;
        const lng = parseFloat(center_lng as string) + (j - gridSize/2) * 0.01;
        
        const scoreResult = await pool.query(
          'SELECT calculate_safety_score($1, $2, $3) as score',
          [lat, lng, 1000]
        );
        
        points.push({
          latitude: lat,
          longitude: lng,
          safety_score: parseFloat(scoreResult.rows[0].score),
          intensity: parseFloat(scoreResult.rows[0].score) / 100
        });
      }
    }
    
    res.json({
      success: true,
      data: points
    });
  } catch (error: any) {
    console.error('Error generating heatmap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate heatmap',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/department-performance
 * Get department-wise report resolution stats
 */
router.get('/analytics/department-performance', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.dept_name,
        COUNT(r.report_id) as total_reports,
        COUNT(CASE WHEN r.status = 'Resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN r.status = 'In Progress' THEN 1 END) as in_progress,
        ROUND(
          COUNT(CASE WHEN r.status = 'Resolved' THEN 1 END)::DECIMAL / 
          NULLIF(COUNT(r.report_id), 0) * 100, 
          2
        ) as resolution_rate
      FROM departments d
      LEFT JOIN reports r ON d.dept_id = r.dept_id
      GROUP BY d.dept_name
      ORDER BY resolution_rate DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching department performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department performance',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/budget-utilization
 * Get budget spending analytics
 */
router.get('/analytics/budget-utilization', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        SUM(amount_sanctioned) as total_sanctioned,
        SUM(amount_spent) as total_spent,
        COUNT(*) as total_reports,
        ROUND(
          SUM(amount_spent)::DECIMAL / NULLIF(SUM(amount_sanctioned), 0) * 100,
          2
        ) as utilization_rate
      FROM reports
      WHERE amount_sanctioned > 0
    `);
    
    const byCategory = await pool.query(`
      SELECT 
        category,
        SUM(amount_sanctioned) as sanctioned,
        SUM(amount_spent) as spent
      FROM reports
      WHERE amount_sanctioned > 0
      GROUP BY category
      ORDER BY sanctioned DESC
    `);
    
    res.json({
      success: true,
      data: {
        overall: result.rows[0],
        by_category: byCategory.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching budget utilization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budget utilization',
      message: error.message
    });
  }
});

export default router;
