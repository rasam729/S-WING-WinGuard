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

/**
 * POST /api/simulations/:id/calculate-budget
 * Calculate AI-adjusted budget for simulation
 */
router.post('/simulations/:id/calculate-budget', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { issue_type, base_cost, latitude, longitude, road_type } = req.body;
    
    if (!issue_type || !base_cost || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: issue_type, base_cost, latitude, longitude'
      });
    }
    
    // Call AI budget calculation function
    const query = `
      SELECT * FROM calculate_ai_budget($1, $2, $3, $4, $5)
    `;
    
    const result = await pool.query(query, [
      issue_type,
      base_cost,
      latitude,
      longitude,
      road_type || 'MDR'
    ]);
    
    const budgetData = result.rows[0];
    
    // Store budget simulation
    await pool.query(`
      INSERT INTO budget_simulations (
        simulation_id, issue_type, estimated_cost, 
        ai_predicted_cost, confidence_score, cost_factors
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      id,
      issue_type,
      budgetData.estimated_cost,
      budgetData.ai_predicted_cost,
      budgetData.confidence_score,
      budgetData.cost_factors
    ]);
    
    res.json({
      success: true,
      data: {
        issue_type,
        estimated_cost: parseFloat(budgetData.estimated_cost),
        ai_predicted_cost: parseFloat(budgetData.ai_predicted_cost),
        confidence_score: parseFloat(budgetData.confidence_score),
        cost_factors: budgetData.cost_factors,
        savings: parseFloat(budgetData.estimated_cost) - parseFloat(budgetData.ai_predicted_cost),
        recommendation: budgetData.cost_factors.nearby_issues > 2 
          ? 'Consider bulk work for cost savings'
          : 'Individual repair recommended'
      }
    });
  } catch (error: any) {
    console.error('Error calculating budget:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate budget',
      message: error.message
    });
  }
});

/**
 * POST /api/simulations/:id/calculate-crime-impact
 * Calculate crime rate impact of infrastructure changes
 */
router.post('/simulations/:id/calculate-crime-impact', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, radius_meters, new_streetlights, new_police_booths } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: latitude, longitude'
      });
    }
    
    // Call crime impact calculation function
    const query = `
      SELECT * FROM calculate_crime_impact($1, $2, $3, $4, $5)
    `;
    
    const result = await pool.query(query, [
      latitude,
      longitude,
      radius_meters || 1000,
      new_streetlights || 0,
      new_police_booths || 0
    ]);
    
    const crimeData = result.rows[0];
    
    // Update simulation with crime data
    await pool.query(`
      UPDATE simulations
      SET crime_incidents_before = $1,
          crime_incidents_after = $2,
          predicted_crime_reduction = $3
      WHERE simulation_id = $4
    `, [
      crimeData.crime_incidents_before,
      crimeData.crime_incidents_after,
      crimeData.predicted_reduction,
      id
    ]);
    
    res.json({
      success: true,
      data: {
        crime_incidents_before: crimeData.crime_incidents_before,
        crime_incidents_after: crimeData.crime_incidents_after,
        predicted_reduction_percentage: parseFloat(crimeData.predicted_reduction),
        incidents_prevented: crimeData.crime_incidents_before - crimeData.crime_incidents_after,
        new_streetlights: new_streetlights || 0,
        new_police_booths: new_police_booths || 0,
        recommendation: crimeData.predicted_reduction > 30 
          ? 'High impact: Strongly recommended for crime reduction'
          : crimeData.predicted_reduction > 15
          ? 'Moderate impact: Recommended for safety improvement'
          : 'Low impact: Consider additional measures'
      }
    });
  } catch (error: any) {
    console.error('Error calculating crime impact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate crime impact',
      message: error.message
    });
  }
});

/**
 * GET /api/simulations/:id/issues
 * Get all issues in simulation area for mapping
 */
router.get('/simulations/:id/issues', async (req: Request, res: Response) => {
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
    
    // Get all issues within radius
    const query = `
      SELECT 
        report_id,
        category,
        severity,
        description,
        status,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        road_type,
        road_name,
        estimated_cost,
        amount_sanctioned,
        amount_spent,
        created_at
      FROM reports
      WHERE ST_DWithin(
        location,
        ST_GeogFromText('POINT(' || $2 || ' ' || $1 || ')'),
        $3
      )
      ORDER BY severity DESC, created_at DESC
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
    console.error('Error fetching simulation issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch simulation issues',
      message: error.message
    });
  }
});

export default router;
