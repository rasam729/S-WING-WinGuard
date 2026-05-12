/**
 * Simulation Routes - Digital Twin for City Officials
 * Allows simulation of infrastructure changes and safety impact
 */

import { Router, Request, Response } from 'express';
import pool from '../config/postgres';

const router = Router();

/**
 * POST /api/simulations
 * Create a new simulation
 */
router.post('/simulations', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      center_lat = 12.9716, // Bengaluru default
      center_lng = 77.5946,
      radius_meters = 5000
    } = req.body;
    
    // Calculate safety score before simulation
    const beforeScore = await pool.query(
      'SELECT calculate_safety_score($1, $2, $3) as score',
      [center_lat, center_lng, radius_meters]
    );
    
    const query = `
      INSERT INTO simulations (
        name, description, center_lat, center_lng, radius_meters,
        safety_score_before, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      name,
      description,
      center_lat,
      center_lng,
      radius_meters,
      beforeScore.rows[0].score
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Simulation created successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create simulation',
      message: error.message
    });
  }
});

/**
 * GET /api/simulations
 * Get all simulations
 */
router.get('/simulations', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM simulations
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching simulations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch simulations',
      message: error.message
    });
  }
});

/**
 * POST /api/simulations/:id/add-infrastructure
 * Add simulated infrastructure (streetlight, police booth, etc.)
 */
router.post('/simulations/:id/add-infrastructure', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, latitude, longitude, status = 'functional' } = req.body;
    
    if (!type || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, latitude, longitude'
      });
    }
    
    const query = `
      INSERT INTO infrastructure (type, location, status, is_simulated, simulation_id)
      VALUES ($1, ST_GeogFromText('POINT(' || $3 || ' ' || $2 || ')'), $4, true, $5)
      RETURNING 
        infrastructure_id, type,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        status, is_simulated
    `;
    
    const result = await pool.query(query, [type, latitude, longitude, status, id]);
    
    res.status(201).json({
      success: true,
      message: 'Infrastructure added to simulation',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error adding infrastructure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add infrastructure',
      message: error.message
    });
  }
});

/**
 * PATCH /api/simulations/:id/fix-issue
 * Mark an issue as fixed in simulation
 */
router.patch('/simulations/:id/fix-issue', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { report_id, estimated_days } = req.body;
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + (estimated_days || 7));
    
    const query = `
      UPDATE reports
      SET 
        status = 'In Progress',
        estimated_fix_date = $1,
        simulation_id = $2
      WHERE report_id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [estimatedDate, id, report_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Issue marked for fixing',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fixing issue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix issue',
      message: error.message
    });
  }
});

/**
 * POST /api/simulations/:id/calculate-impact
 * Calculate safety impact of simulation changes
 */
router.post('/simulations/:id/calculate-impact', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get simulation details
    const simResult = await pool.query(
      'SELECT * FROM simulations WHERE simulation_id = $1',
      [id]
    );
    
    if (simResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }
    
    const simulation = simResult.rows[0];
    
    // Calculate new safety score with simulated changes
    const afterScore = await pool.query(
      'SELECT calculate_safety_score($1, $2, $3) as score',
      [simulation.center_lat, simulation.center_lng, simulation.radius_meters]
    );
    
    // Update simulation with new score
    await pool.query(
      'UPDATE simulations SET safety_score_after = $1 WHERE simulation_id = $2',
      [afterScore.rows[0].score, id]
    );
    
    // Calculate crime rate change (simplified)
    const crimeChange = (afterScore.rows[0].score - simulation.safety_score_before) * 0.5;
    
    res.json({
      success: true,
      data: {
        simulation_id: id,
        safety_score_before: parseFloat(simulation.safety_score_before),
        safety_score_after: parseFloat(afterScore.rows[0].score),
        improvement: parseFloat(afterScore.rows[0].score) - parseFloat(simulation.safety_score_before),
        crime_rate_change: crimeChange,
        recommendation: afterScore.rows[0].score > simulation.safety_score_before 
          ? 'Recommended: This simulation shows positive safety improvements'
          : 'Not Recommended: This simulation shows negative safety impact'
      }
    });
  } catch (error: any) {
    console.error('Error calculating impact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate impact',
      message: error.message
    });
  }
});

/**
 * POST /api/simulations/:id/apply
 * Apply simulation changes to real data
 */
router.post('/simulations/:id/apply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Convert simulated infrastructure to real
      await client.query(`
        UPDATE infrastructure
        SET is_simulated = false, simulation_id = NULL
        WHERE simulation_id = $1
      `, [id]);
      
      // Mark simulation as applied
      await client.query(`
        UPDATE simulations
        SET status = 'applied'
        WHERE simulation_id = $1
      `, [id]);
      
      // Create notifications for affected citizens
      await client.query(`
        INSERT INTO notifications (report_id, message, type)
        SELECT 
          report_id,
          'Good news! The ' || category || ' issue you reported has been scheduled for fixing. Estimated completion: ' || estimated_fix_date,
          'success'
        FROM reports
        WHERE simulation_id = $1 AND estimated_fix_date IS NOT NULL
      `, [id]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Simulation applied successfully. Citizens have been notified.'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error applying simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply simulation',
      message: error.message
    });
  }
});

/**
 * GET /api/simulations/:id/infrastructure
 * Get all infrastructure in simulation area
 */
router.get('/simulations/:id/infrastructure', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get simulation details
    const simResult = await pool.query(
      'SELECT * FROM simulations WHERE simulation_id = $1',
      [id]
    );
    
    if (simResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }
    
    const simulation = simResult.rows[0];
    
    // Get all infrastructure within radius
    const query = `
      SELECT 
        infrastructure_id,
        type,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        status,
        is_simulated,
        simulation_id
      FROM infrastructure
      WHERE ST_DWithin(
        location,
        ST_GeogFromText('POINT(' || $2 || ' ' || $1 || ')'),
        $3
      )
      ORDER BY type, status
    `;
    
    const result = await pool.query(query, [
      simulation.center_lat,
      simulation.center_lng,
      simulation.radius_meters
    ]);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching infrastructure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch infrastructure',
      message: error.message
    });
  }
});

export default router;
