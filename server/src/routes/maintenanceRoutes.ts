/**
 * Maintenance Routes
 * API endpoints for maintenance schedules and repair history
 */

import { Router, Request, Response } from 'express';
import { pool } from '../config/postgres';

const router = Router();

// Get all maintenance schedules
router.get('/maintenance/schedules', async (req: Request, res: Response) => {
  try {
    const { asset_type, status, upcoming } = req.query;
    
    let query = 'SELECT * FROM maintenance_schedules WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;
    
    if (asset_type) {
      query += ` AND asset_type = $${paramCount}`;
      params.push(asset_type);
      paramCount++;
    }
    
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (upcoming === 'true') {
      query += ` AND next_maintenance <= CURRENT_DATE + INTERVAL '30 days'`;
    }
    
    query += ' ORDER BY next_maintenance ASC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching maintenance schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance schedules'
    });
  }
});

// Get upcoming maintenance (next 30 days)
router.get('/maintenance/upcoming', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM maintenance_schedules
      WHERE next_maintenance <= CURRENT_DATE + INTERVAL '30 days'
      AND status IN ('scheduled', 'in_progress')
      ORDER BY next_maintenance ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching upcoming maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming maintenance'
    });
  }
});

// Get overdue maintenance
router.get('/maintenance/overdue', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM maintenance_schedules
      WHERE next_maintenance < CURRENT_DATE
      AND status = 'scheduled'
      ORDER BY next_maintenance ASC
    `);
    
    // Update status to overdue
    await pool.query(`
      UPDATE maintenance_schedules
      SET status = 'overdue'
      WHERE next_maintenance < CURRENT_DATE
      AND status = 'scheduled'
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching overdue maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue maintenance'
    });
  }
});

// Create maintenance schedule
router.post('/maintenance/schedule', async (req: Request, res: Response) => {
  try {
    const {
      schedule_id,
      asset_type,
      asset_id,
      latitude,
      longitude,
      address,
      ward,
      frequency,
      last_maintenance,
      next_maintenance,
      type,
      activities,
      estimated_duration,
      estimated_cost,
      assigned_to,
      assigned_team
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO maintenance_schedules (
        schedule_id, asset_type, asset_id, latitude, longitude, address, ward,
        frequency, last_maintenance, next_maintenance, type, activities,
        estimated_duration, estimated_cost, assigned_to, assigned_team
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        schedule_id, asset_type, asset_id, latitude, longitude, address, ward,
        frequency, last_maintenance, next_maintenance, type, JSON.stringify(activities),
        estimated_duration, estimated_cost, assigned_to, JSON.stringify(assigned_team)
      ]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating maintenance schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create maintenance schedule'
    });
  }
});

// Mark maintenance as complete
router.put('/maintenance/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { next_maintenance_date } = req.body;
    
    const result = await pool.query(
      `UPDATE maintenance_schedules
       SET status = 'completed',
           last_maintenance = CURRENT_DATE,
           next_maintenance = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE schedule_id = $2
       RETURNING *`,
      [next_maintenance_date, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance schedule not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error completing maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete maintenance'
    });
  }
});

// Get repair history
router.get('/repairs/history', async (req: Request, res: Response) => {
  try {
    const { asset_id, contractor_id, status } = req.query;
    
    let query = 'SELECT * FROM repair_history WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;
    
    if (asset_id) {
      query += ` AND asset_id = $${paramCount}`;
      params.push(asset_id);
      paramCount++;
    }
    
    if (contractor_id) {
      query += ` AND contractor_id = $${paramCount}`;
      params.push(contractor_id);
      paramCount++;
    }
    
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ' ORDER BY reported_date DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching repair history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch repair history'
    });
  }
});

// Get repair history for specific asset
router.get('/repairs/:assetId', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM repair_history WHERE asset_id = $1 ORDER BY reported_date DESC',
      [assetId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching asset repair history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset repair history'
    });
  }
});

// Create repair record
router.post('/repairs', async (req: Request, res: Response) => {
  try {
    const {
      repair_id,
      issue_id,
      asset_id,
      reported_date,
      reported_by,
      issue_type,
      severity,
      description,
      repair_start_date,
      repair_end_date,
      duration,
      work_description,
      materials_used,
      labor_hours,
      equipment_used,
      contractor_id,
      contractor_name,
      supervisor_name,
      workers_count,
      estimated_cost,
      actual_cost,
      before_photos,
      during_photos,
      after_photos,
      warranty_period,
      warranty_expiry_date
    } = req.body;
    
    const variance = actual_cost ? actual_cost - estimated_cost : null;
    
    const result = await pool.query(
      `INSERT INTO repair_history (
        repair_id, issue_id, asset_id, reported_date, reported_by, issue_type,
        severity, description, repair_start_date, repair_end_date, duration,
        work_description, materials_used, labor_hours, equipment_used,
        contractor_id, contractor_name, supervisor_name, workers_count,
        estimated_cost, actual_cost, variance, before_photos, during_photos,
        after_photos, warranty_period, warranty_expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING *`,
      [
        repair_id, issue_id, asset_id, reported_date, reported_by, issue_type,
        severity, description, repair_start_date, repair_end_date, duration,
        work_description, JSON.stringify(materials_used), labor_hours,
        JSON.stringify(equipment_used), contractor_id, contractor_name,
        supervisor_name, workers_count, estimated_cost, actual_cost, variance,
        JSON.stringify(before_photos), JSON.stringify(during_photos),
        JSON.stringify(after_photos), warranty_period, warranty_expiry_date
      ]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating repair record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create repair record'
    });
  }
});

// Get active warranties
router.get('/warranties/active', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM repair_history
      WHERE status = 'under_warranty'
      AND warranty_expiry_date > CURRENT_DATE
      ORDER BY warranty_expiry_date ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching active warranties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active warranties'
    });
  }
});

// Get cost analysis
router.get('/maintenance/cost-analysis', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        asset_type,
        COUNT(*) as repair_count,
        SUM(estimated_cost) as total_estimated,
        SUM(actual_cost) as total_actual,
        AVG(actual_cost) as avg_cost,
        SUM(variance) as total_variance
      FROM repair_history
      WHERE actual_cost IS NOT NULL
      GROUP BY asset_type
      ORDER BY total_actual DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching cost analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cost analysis'
    });
  }
});

export default router;
