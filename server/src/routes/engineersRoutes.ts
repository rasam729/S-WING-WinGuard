/**
 * Engineers Routes
 * API endpoints for executive engineers and complaint routing
 */

import { Router, Request, Response } from 'express';
import { pool } from '../config/postgres';

const router = Router();

// Get all engineers
router.get('/engineers', async (req: Request, res: Response) => {
  try {
    const { availability, jurisdiction_type } = req.query;
    
    let query = 'SELECT * FROM executive_engineers WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;
    
    if (availability) {
      query += ` AND availability = $${paramCount}`;
      params.push(availability);
      paramCount++;
    }
    
    if (jurisdiction_type) {
      query += ` AND jurisdiction_type = $${paramCount}`;
      params.push(jurisdiction_type);
      paramCount++;
    }
    
    query += ' ORDER BY rating DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching engineers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engineers'
    });
  }
});

// Get engineer details
router.get('/engineers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const engineer = await pool.query(
      'SELECT * FROM executive_engineers WHERE engineer_id = $1',
      [id]
    );
    
    if (engineer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Engineer not found'
      });
    }
    
    // Get assignments
    const assignments = await pool.query(
      'SELECT * FROM issue_assignments WHERE engineer_id = $1 ORDER BY assigned_at DESC',
      [id]
    );
    
    res.json({
      success: true,
      data: {
        ...engineer.rows[0],
        assignments: assignments.rows
      }
    });
  } catch (error) {
    console.error('Error fetching engineer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engineer'
    });
  }
});

// Get engineer workload
router.get('/engineers/:id/workload', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const engineer = await pool.query(
      'SELECT * FROM executive_engineers WHERE engineer_id = $1',
      [id]
    );
    
    if (engineer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Engineer not found'
      });
    }
    
    const assignments = await pool.query(
      `SELECT * FROM issue_assignments 
       WHERE engineer_id = $1 
       AND status IN ('assigned', 'accepted', 'in_progress')`,
      [id]
    );
    
    const completed = await pool.query(
      `SELECT COUNT(*) as count FROM issue_assignments 
       WHERE engineer_id = $1 AND status = 'completed'`,
      [id]
    );
    
    res.json({
      success: true,
      data: {
        engineer: engineer.rows[0],
        current_load: assignments.rows.length,
        max_concurrent_issues: engineer.rows[0].max_concurrent_issues,
        utilization_percentage: (assignments.rows.length / engineer.rows[0].max_concurrent_issues * 100).toFixed(2),
        completed_count: completed.rows[0].count,
        active_assignments: assignments.rows
      }
    });
  } catch (error) {
    console.error('Error fetching engineer workload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engineer workload'
    });
  }
});

// Auto-assign issue to engineer
router.post('/routing/auto-assign', async (req: Request, res: Response) => {
  try {
    const { issue_id, category, severity, ward, road_type } = req.body;
    
    // Find matching routing rule
    const rules = await pool.query(
      `SELECT * FROM routing_rules 
       WHERE active = true
       AND (category IS NULL OR category = $1)
       AND (severity_min IS NULL OR $2 >= severity_min)
       AND (severity_max IS NULL OR $2 <= severity_max)
       AND (ward IS NULL OR ward = $3)
       AND (road_type IS NULL OR road_type = $4)
       ORDER BY priority ASC
       LIMIT 1`,
      [category, severity, ward, road_type]
    );
    
    if (rules.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No matching routing rule found'
      });
    }
    
    const rule = rules.rows[0];
    const engineer_id = rule.assign_to;
    
    // Check engineer availability and workload
    const engineer = await pool.query(
      'SELECT * FROM executive_engineers WHERE engineer_id = $1',
      [engineer_id]
    );
    
    if (engineer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assigned engineer not found'
      });
    }
    
    if (engineer.rows[0].current_load >= engineer.rows[0].max_concurrent_issues) {
      return res.status(400).json({
        success: false,
        message: 'Engineer at maximum capacity'
      });
    }
    
    // Create assignment
    const assignment_id = `ASN${Date.now()}`;
    const assignment = await pool.query(
      `INSERT INTO issue_assignments (
        assignment_id, issue_id, engineer_id, assigned_by, status
      ) VALUES ($1, $2, $3, $4, 'assigned')
      RETURNING *`,
      [assignment_id, issue_id, engineer_id, 1] // assigned_by = 1 (system)
    );
    
    // Update engineer current load
    await pool.query(
      'UPDATE executive_engineers SET current_load = current_load + 1 WHERE engineer_id = $1',
      [engineer_id]
    );
    
    res.status(201).json({
      success: true,
      data: {
        assignment: assignment.rows[0],
        engineer: engineer.rows[0],
        rule: rule
      }
    });
  } catch (error) {
    console.error('Error auto-assigning issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-assign issue'
    });
  }
});

// Manual assign issue to engineer
router.post('/routing/manual-assign', async (req: Request, res: Response) => {
  try {
    const { issue_id, engineer_id, assigned_by, notes } = req.body;
    
    // Check engineer availability
    const engineer = await pool.query(
      'SELECT * FROM executive_engineers WHERE engineer_id = $1',
      [engineer_id]
    );
    
    if (engineer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Engineer not found'
      });
    }
    
    if (engineer.rows[0].current_load >= engineer.rows[0].max_concurrent_issues) {
      return res.status(400).json({
        success: false,
        message: 'Engineer at maximum capacity'
      });
    }
    
    // Create assignment
    const assignment_id = `ASN${Date.now()}`;
    const assignment = await pool.query(
      `INSERT INTO issue_assignments (
        assignment_id, issue_id, engineer_id, assigned_by, notes, status
      ) VALUES ($1, $2, $3, $4, $5, 'assigned')
      RETURNING *`,
      [assignment_id, issue_id, engineer_id, assigned_by, notes]
    );
    
    // Update engineer current load
    await pool.query(
      'UPDATE executive_engineers SET current_load = current_load + 1 WHERE engineer_id = $1',
      [engineer_id]
    );
    
    res.status(201).json({
      success: true,
      data: assignment.rows[0]
    });
  } catch (error) {
    console.error('Error manually assigning issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to manually assign issue'
    });
  }
});

// Escalate issue
router.post('/routing/escalate', async (req: Request, res: Response) => {
  try {
    const { assignment_id, escalation_reason } = req.body;
    
    const result = await pool.query(
      `UPDATE issue_assignments
       SET status = 'escalated',
           escalated_at = CURRENT_TIMESTAMP,
           escalation_reason = $1
       WHERE assignment_id = $2
       RETURNING *`,
      [escalation_reason, assignment_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error escalating issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to escalate issue'
    });
  }
});

// Reassign issue
router.post('/routing/reassign', async (req: Request, res: Response) => {
  try {
    const { assignment_id, new_engineer_id, reason } = req.body;
    
    // Get current assignment
    const current = await pool.query(
      'SELECT * FROM issue_assignments WHERE assignment_id = $1',
      [assignment_id]
    );
    
    if (current.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    const old_engineer_id = current.rows[0].engineer_id;
    
    // Update assignment
    await pool.query(
      `UPDATE issue_assignments
       SET engineer_id = $1, notes = $2
       WHERE assignment_id = $3`,
      [new_engineer_id, reason, assignment_id]
    );
    
    // Update engineer loads
    await pool.query(
      'UPDATE executive_engineers SET current_load = current_load - 1 WHERE engineer_id = $1',
      [old_engineer_id]
    );
    
    await pool.query(
      'UPDATE executive_engineers SET current_load = current_load + 1 WHERE engineer_id = $1',
      [new_engineer_id]
    );
    
    res.json({
      success: true,
      message: 'Issue reassigned successfully'
    });
  } catch (error) {
    console.error('Error reassigning issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reassign issue'
    });
  }
});

// Get routing rules
router.get('/routing/rules', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM routing_rules ORDER BY priority ASC'
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching routing rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routing rules'
    });
  }
});

// Create routing rule
router.post('/routing/rules', async (req: Request, res: Response) => {
  try {
    const {
      rule_id,
      priority,
      category,
      severity_min,
      severity_max,
      ward,
      road_type,
      assign_to,
      escalate_after
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO routing_rules (
        rule_id, priority, category, severity_min, severity_max,
        ward, road_type, assign_to, escalate_after
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [rule_id, priority, category, severity_min, severity_max, ward, road_type, assign_to, escalate_after]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating routing rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create routing rule'
    });
  }
});

// Get SLA monitoring data
router.get('/routing/sla-monitoring', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        ia.assignment_id,
        ia.issue_id,
        ia.engineer_id,
        ee.name as engineer_name,
        ia.assigned_at,
        ia.status,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ia.assigned_at))/3600 as hours_elapsed,
        rr.escalate_after
      FROM issue_assignments ia
      JOIN executive_engineers ee ON ia.engineer_id = ee.engineer_id
      LEFT JOIN routing_rules rr ON rr.assign_to = ee.engineer_id
      WHERE ia.status IN ('assigned', 'accepted', 'in_progress')
      ORDER BY ia.assigned_at ASC
    `);
    
    const overdue = result.rows.filter(r => 
      r.escalate_after && r.hours_elapsed > r.escalate_after
    );
    
    res.json({
      success: true,
      data: {
        all_assignments: result.rows,
        overdue_count: overdue.length,
        overdue_assignments: overdue
      }
    });
  } catch (error) {
    console.error('Error fetching SLA monitoring data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SLA monitoring data'
    });
  }
});

export default router;
