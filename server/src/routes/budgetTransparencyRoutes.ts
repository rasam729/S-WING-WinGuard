/**
 * Budget Transparency Routes
 * API endpoints for budget tracking and transparency
 */

import { Router, Request, Response } from 'express';
import { pool } from '../config/postgres';

const router = Router();

// Get budget overview
router.get('/budget/overview', async (req: Request, res: Response) => {
  try {
    const { fiscal_year } = req.query;
    
    let query = 'SELECT * FROM budget_allocations';
    const params: any[] = [];
    
    if (fiscal_year) {
      query += ' WHERE fiscal_year = $1';
      params.push(fiscal_year);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const allocations = await pool.query(query, params);
    
    // Get total allocated, spent, and available
    const totals = await pool.query(`
      SELECT 
        SUM(allocated) as total_allocated,
        SUM(spent) as total_spent,
        SUM(committed) as total_committed,
        SUM(available) as total_available
      FROM budget_categories
      WHERE allocation_id IN (SELECT allocation_id FROM budget_allocations ${fiscal_year ? 'WHERE fiscal_year = $1' : ''})
    `, fiscal_year ? [fiscal_year] : []);
    
    res.json({
      success: true,
      data: {
        allocations: allocations.rows,
        totals: totals.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching budget overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget overview'
    });
  }
});

// Get all budget allocations
router.get('/budget/allocations', async (req: Request, res: Response) => {
  try {
    const { source_type, fiscal_year } = req.query;
    
    let query = 'SELECT * FROM budget_allocations WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;
    
    if (source_type) {
      query += ` AND source_type = $${paramCount}`;
      params.push(source_type);
      paramCount++;
    }
    
    if (fiscal_year) {
      query += ` AND fiscal_year = $${paramCount}`;
      params.push(fiscal_year);
      paramCount++;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching budget allocations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget allocations'
    });
  }
});

// Get budget sources
router.get('/budget/sources', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        source_type,
        source_name,
        SUM(amount) as total_amount,
        COUNT(*) as allocation_count
      FROM budget_allocations
      GROUP BY source_type, source_name
      ORDER BY total_amount DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching budget sources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget sources'
    });
  }
});

// Get budget categories
router.get('/budget/categories', async (req: Request, res: Response) => {
  try {
    const { allocation_id } = req.query;
    
    let query = 'SELECT * FROM budget_categories';
    const params: any[] = [];
    
    if (allocation_id) {
      query += ' WHERE allocation_id = $1';
      params.push(allocation_id);
    }
    
    query += ' ORDER BY allocated DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching budget categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget categories'
    });
  }
});

// Get category breakdown
router.get('/budget/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM budget_categories WHERE category = $1',
      [category]
    );
    
    // Get expenses for this category
    const expenses = await pool.query(
      'SELECT * FROM expenses WHERE category = $1 ORDER BY created_at DESC',
      [category]
    );
    
    res.json({
      success: true,
      data: {
        category: result.rows,
        expenses: expenses.rows
      }
    });
  } catch (error) {
    console.error('Error fetching category breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category breakdown'
    });
  }
});

// Get expenses
router.get('/budget/expenses', async (req: Request, res: Response) => {
  try {
    const { category, contractor_id, publicly_visible } = req.query;
    
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;
    
    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    if (contractor_id) {
      query += ` AND contractor_id = $${paramCount}`;
      params.push(contractor_id);
      paramCount++;
    }
    
    if (publicly_visible !== undefined) {
      query += ` AND publicly_visible = $${paramCount}`;
      params.push(publicly_visible === 'true');
      paramCount++;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses'
    });
  }
});

// Create expense record
router.post('/budget/expense', async (req: Request, res: Response) => {
  try {
    const {
      expense_id,
      issue_id,
      category,
      estimated_cost,
      sanctioned_amount,
      actual_cost,
      breakdown,
      contractor_id,
      contractor_name,
      payments,
      approvals,
      publicly_visible
    } = req.body;
    
    const variance = actual_cost ? actual_cost - sanctioned_amount : null;
    const variance_percentage = actual_cost && sanctioned_amount ? 
      ((actual_cost - sanctioned_amount) / sanctioned_amount * 100) : null;
    
    const result = await pool.query(
      `INSERT INTO expenses (
        expense_id, issue_id, category, estimated_cost, sanctioned_amount,
        actual_cost, variance, variance_percentage, breakdown, contractor_id,
        contractor_name, payments, approvals, publicly_visible
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        expense_id, issue_id, category, estimated_cost, sanctioned_amount,
        actual_cost, variance, variance_percentage, JSON.stringify(breakdown),
        contractor_id, contractor_name, JSON.stringify(payments),
        JSON.stringify(approvals), publicly_visible
      ]
    );
    
    // Update budget category spent amount
    if (actual_cost) {
      await pool.query(
        `UPDATE budget_categories 
         SET spent = spent + $1, available = available - $1
         WHERE category = $2`,
        [actual_cost, category]
      );
    }
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense'
    });
  }
});

// Get ward-wise allocation
router.get('/budget/ward/:ward', async (req: Request, res: Response) => {
  try {
    const { ward } = req.params;
    
    // Get all expenses for issues in this ward
    const expenses = await pool.query(`
      SELECT e.*, r.ward, r.category as issue_category
      FROM expenses e
      JOIN reports r ON e.issue_id = r.report_id
      WHERE r.ward = $1
      ORDER BY e.created_at DESC
    `, [ward]);
    
    const total = expenses.rows.reduce((sum, exp) => sum + (exp.actual_cost || exp.sanctioned_amount || 0), 0);
    
    res.json({
      success: true,
      data: {
        ward,
        total_spent: total,
        expenses: expenses.rows
      }
    });
  } catch (error) {
    console.error('Error fetching ward allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ward allocation'
    });
  }
});

// Get public transparency documents
router.get('/budget/transparency', async (req: Request, res: Response) => {
  try {
    const allocations = await pool.query(`
      SELECT 
        allocation_id,
        fiscal_year,
        source_type,
        source_name,
        sanction_number,
        sanction_date,
        amount,
        purpose
      FROM budget_allocations
      ORDER BY created_at DESC
    `);
    
    const expenses = await pool.query(`
      SELECT 
        expense_id,
        category,
        sanctioned_amount,
        actual_cost,
        contractor_name,
        created_at
      FROM expenses
      WHERE publicly_visible = true
      ORDER BY created_at DESC
      LIMIT 100
    `);
    
    res.json({
      success: true,
      data: {
        allocations: allocations.rows,
        expenses: expenses.rows
      }
    });
  } catch (error) {
    console.error('Error fetching transparency data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transparency data'
    });
  }
});

// Get variance analysis
router.get('/budget/variance', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        category,
        COUNT(*) as project_count,
        SUM(sanctioned_amount) as total_sanctioned,
        SUM(actual_cost) as total_actual,
        SUM(variance) as total_variance,
        AVG(variance_percentage) as avg_variance_percentage
      FROM expenses
      WHERE actual_cost IS NOT NULL
      GROUP BY category
      ORDER BY total_variance DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching variance analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch variance analysis'
    });
  }
});

export default router;
