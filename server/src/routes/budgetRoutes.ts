/**
 * Budget Routes
 * Handles budget tracking for Digital Twin simulation features
 */

import { Router, Request, Response } from 'express';
import pool from '../config/postgres';

const router = Router();

/**
 * GET /api/budgets
 * Fetch all budgets with spending information
 */
router.get('/budgets', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        b.budget_id,
        b.department_id,
        d.department_name,
        b.sanctioned_amount,
        b.spent_amount,
        (b.sanctioned_amount - b.spent_amount) as remaining_amount,
        ROUND((b.spent_amount::numeric / b.sanctioned_amount::numeric * 100), 2) as utilization_percentage,
        b.fiscal_year
      FROM budgets b
      JOIN departments d ON b.department_id = d.department_id
      ORDER BY b.fiscal_year DESC, d.department_name
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budgets',
      message: error.message
    });
  }
});

/**
 * GET /api/budgets/:id
 * Fetch a single budget by ID
 */
router.get('/budgets/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        b.budget_id,
        b.department_id,
        d.department_name,
        b.sanctioned_amount,
        b.spent_amount,
        (b.sanctioned_amount - b.spent_amount) as remaining_amount,
        b.fiscal_year,
        COUNT(r.report_id) as reports_count
      FROM budgets b
      JOIN departments d ON b.department_id = d.department_id
      LEFT JOIN reports r ON b.budget_id = r.budget_id
      WHERE b.budget_id = $1
      GROUP BY b.budget_id, d.department_name
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching budget:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budget',
      message: error.message
    });
  }
});

/**
 * POST /api/budgets/simulate
 * Simulate budget allocation for infrastructure improvements
 * Used by Official Dashboard simulation feature
 */
router.post('/budgets/simulate', async (req: Request, res: Response) => {
  try {
    const { department_id, amount, category } = req.body;
    
    if (!department_id || !amount || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: department_id, amount, category'
      });
    }
    
    // Get current budget
    const budgetQuery = `
      SELECT 
        budget_id,
        sanctioned_amount,
        spent_amount,
        (sanctioned_amount - spent_amount) as remaining_amount
      FROM budgets
      WHERE department_id = $1
      ORDER BY fiscal_year DESC
      LIMIT 1
    `;
    
    const budgetResult = await pool.query(budgetQuery, [department_id]);
    
    if (budgetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No budget found for this department'
      });
    }
    
    const budget = budgetResult.rows[0];
    
    // Check if sufficient funds available
    if (budget.remaining_amount < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient budget',
        available: budget.remaining_amount,
        requested: amount
      });
    }
    
    // Simulate impact on pending reports
    const impactQuery = `
      SELECT 
        COUNT(*) as affected_reports,
        AVG(ST_Distance(
          location::geography,
          (SELECT ST_Centroid(ST_Collect(location::geometry)) FROM reports WHERE department_id = $1)::geography
        )) as avg_distance
      FROM reports
      WHERE department_id = $1 
        AND status = 'Pending'
        AND category = $2
    `;
    
    const impactResult = await pool.query(impactQuery, [department_id, category]);
    
    res.json({
      success: true,
      simulation: {
        budget_id: budget.budget_id,
        current_spent: budget.spent_amount,
        simulated_spent: parseFloat(budget.spent_amount) + parseFloat(amount),
        remaining_after: budget.remaining_amount - amount,
        utilization_before: ((budget.spent_amount / budget.sanctioned_amount) * 100).toFixed(2),
        utilization_after: (((parseFloat(budget.spent_amount) + parseFloat(amount)) / budget.sanctioned_amount) * 100).toFixed(2),
        impact: impactResult.rows[0]
      }
    });
  } catch (error: any) {
    console.error('Error simulating budget:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate budget',
      message: error.message
    });
  }
});

/**
 * PATCH /api/budgets/:id/allocate
 * Allocate budget to a specific report
 */
router.patch('/budgets/:id/allocate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { report_id, amount } = req.body;
    
    if (!report_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: report_id, amount'
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update budget spent amount
      const budgetResult = await client.query(
        `UPDATE budgets 
         SET spent_amount = spent_amount + $1 
         WHERE budget_id = $2 
         RETURNING *`,
        [amount, id]
      );
      
      if (budgetResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Budget not found'
        });
      }
      
      // Link report to budget
      await client.query(
        'UPDATE reports SET budget_id = $1 WHERE report_id = $2',
        [id, report_id]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Budget allocated successfully',
        data: budgetResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error allocating budget:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to allocate budget',
      message: error.message
    });
  }
});

/**
 * GET /api/budget/issues
 * Get all issues with budget tracking information
 */
router.get('/budget/issues', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        r.report_id,
        r.category,
        r.severity,
        r.description,
        r.status,
        r.city,
        r.country,
        r.road_type,
        r.road_name,
        r.last_relaying_date,
        r.contractor_name,
        r.estimated_cost,
        r.amount_sanctioned,
        r.amount_spent,
        r.budget_variance,
        r.created_at,
        ST_X(r.location::geometry) as longitude,
        ST_Y(r.location::geometry) as latitude,
        ee.engineer_name,
        ee.contact_email as engineer_email,
        ee.contact_phone as engineer_phone
      FROM reports r
      LEFT JOIN executive_engineers ee ON r.assigned_engineer_id = ee.engineer_id
      ORDER BY r.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching budget issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budget issues',
      message: error.message
    });
  }
});

/**
 * PATCH /api/budget/issues/:id/sanction
 * Sanction budget for a specific issue
 */
router.patch('/budget/issues/:id/sanction', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount_sanctioned } = req.body;
    
    if (!amount_sanctioned) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: amount_sanctioned'
      });
    }
    
    const query = `
      UPDATE reports 
      SET amount_sanctioned = $1,
          status = CASE 
            WHEN status = 'Report Received' THEN 'In Progress'
            ELSE status
          END
      WHERE report_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [amount_sanctioned, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Budget sanctioned successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error sanctioning budget:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sanction budget',
      message: error.message
    });
  }
});

/**
 * PATCH /api/budget/issues/:id/spend
 * Record spending for a specific issue
 */
router.patch('/budget/issues/:id/spend', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount_spent } = req.body;
    
    if (!amount_spent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: amount_spent'
      });
    }
    
    const query = `
      UPDATE reports 
      SET amount_spent = $1,
          budget_variance = amount_sanctioned - $1,
          status = CASE 
            WHEN $1 >= amount_sanctioned THEN 'Resolved'
            ELSE status
          END
      WHERE report_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [amount_spent, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Spending recorded successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error recording spending:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record spending',
      message: error.message
    });
  }
});

/**
 * GET /api/budget/analytics
 * Get budget analytics for dashboard
 */
router.get('/budget/analytics', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_issues,
        SUM(estimated_cost) as total_estimated,
        SUM(amount_sanctioned) as total_sanctioned,
        SUM(amount_spent) as total_spent,
        SUM(budget_variance) as total_variance,
        AVG(CASE WHEN amount_sanctioned > 0 
          THEN (amount_spent / amount_sanctioned * 100) 
          ELSE 0 END) as avg_utilization,
        COUNT(CASE WHEN status = 'Report Received' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved_count,
        SUM(CASE WHEN status = 'Report Received' THEN estimated_cost ELSE 0 END) as pending_cost,
        SUM(CASE WHEN status = 'In Progress' THEN amount_sanctioned ELSE 0 END) as in_progress_cost,
        SUM(CASE WHEN status = 'Resolved' THEN amount_spent ELSE 0 END) as resolved_cost
      FROM reports
    `;
    
    const categoryQuery = `
      SELECT 
        category,
        COUNT(*) as count,
        SUM(estimated_cost) as estimated,
        SUM(amount_sanctioned) as sanctioned,
        SUM(amount_spent) as spent
      FROM reports
      GROUP BY category
      ORDER BY count DESC
    `;
    
    const countryQuery = `
      SELECT 
        country,
        COUNT(*) as count,
        SUM(amount_sanctioned) as sanctioned,
        SUM(amount_spent) as spent
      FROM reports
      WHERE country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const [overallResult, categoryResult, countryResult] = await Promise.all([
      pool.query(query),
      pool.query(categoryQuery),
      pool.query(countryQuery)
    ]);
    
    res.json({
      success: true,
      data: {
        overall: overallResult.rows[0],
        by_category: categoryResult.rows,
        by_country: countryResult.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching budget analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budget analytics',
      message: error.message
    });
  }
});

export default router;
