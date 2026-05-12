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

export default router;
