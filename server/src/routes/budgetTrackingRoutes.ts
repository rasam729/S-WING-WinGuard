/**
 * Budget Tracking Routes
 * API endpoints for cost calculations and budget management
 */

import { Router, Request, Response } from 'express';
import {
  calculateInfrastructureCost,
  calculateIssueFixCost,
  calculateSimulationBudget,
  formatINR,
  getBudgetRecommendations,
  INFRASTRUCTURE_COSTS,
  ISSUE_FIX_COSTS
} from '../services/budgetService';

const router = Router();

/**
 * GET /api/budget/infrastructure-costs
 * Get cost estimates for infrastructure installation
 */
router.get('/budget/infrastructure-costs', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        costs: INFRASTRUCTURE_COSTS,
        currency: 'INR',
        note: 'All costs are in Indian Rupees (₹)'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch infrastructure costs',
      message: error.message
    });
  }
});

/**
 * GET /api/budget/issue-fix-costs
 * Get cost estimates for fixing issues
 */
router.get('/budget/issue-fix-costs', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        costs: ISSUE_FIX_COSTS,
        currency: 'INR',
        note: 'All costs are in Indian Rupees (₹)'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch issue fix costs',
      message: error.message
    });
  }
});

/**
 * POST /api/budget/calculate-infrastructure
 * Calculate cost for infrastructure installation
 * Body: { type: 'streetlight' | 'police_booth' | 'cctv', quantity: number }
 */
router.post('/budget/calculate-infrastructure', (req: Request, res: Response) => {
  try {
    const { type, quantity } = req.body;

    if (!type || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: type and quantity'
      });
    }

    if (!['streetlight', 'police_booth', 'cctv'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be: streetlight, police_booth, or cctv'
      });
    }

    const estimate = calculateInfrastructureCost(type, quantity);

    res.json({
      success: true,
      data: {
        ...estimate,
        formatted: {
          totalCost: formatINR(estimate.totalCost),
          unitCost: formatINR(estimate.unitCost),
          monthlyRecurring: estimate.monthlyRecurring ? formatINR(estimate.monthlyRecurring) : null,
          yearlyRecurring: estimate.yearlyRecurring ? formatINR(estimate.yearlyRecurring) : null
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate infrastructure cost',
      message: error.message
    });
  }
});

/**
 * POST /api/budget/calculate-fix
 * Calculate cost for fixing issues
 * Body: { issueType: string, severity: string, quantity: number }
 */
router.post('/budget/calculate-fix', (req: Request, res: Response) => {
  try {
    const { issueType, severity, quantity = 1 } = req.body;

    if (!issueType || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: issueType and severity'
      });
    }

    const estimate = calculateIssueFixCost(issueType, severity, quantity);

    res.json({
      success: true,
      data: {
        ...estimate,
        formatted: {
          totalCost: formatINR(estimate.totalCost),
          unitCost: formatINR(estimate.unitCost)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate fix cost',
      message: error.message
    });
  }
});

/**
 * POST /api/budget/calculate-simulation
 * Calculate total budget for simulation changes
 * Body: { addStreetlights, addPoliceBooths, addCCTV, fixIssues }
 */
router.post('/budget/calculate-simulation', (req: Request, res: Response) => {
  try {
    const changes = req.body;

    const budget = calculateSimulationBudget(changes);

    res.json({
      success: true,
      data: {
        ...budget,
        formatted: {
          totalOneTimeCost: formatINR(budget.totalOneTimeCost),
          totalMonthlyRecurring: formatINR(budget.totalMonthlyRecurring),
          totalYearlyRecurring: formatINR(budget.totalYearlyRecurring),
          totalFirstYearCost: formatINR(budget.totalFirstYearCost)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate simulation budget',
      message: error.message
    });
  }
});

/**
 * POST /api/budget/recommendations
 * Get budget recommendations based on available budget
 * Body: { availableBudget: number, priorityArea: 'safety' | 'infrastructure' | 'maintenance' }
 */
router.post('/budget/recommendations', (req: Request, res: Response) => {
  try {
    const { availableBudget, priorityArea = 'safety' } = req.body;

    if (!availableBudget) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: availableBudget'
      });
    }

    const recommendations = getBudgetRecommendations(availableBudget, priorityArea);

    res.json({
      success: true,
      data: {
        availableBudget,
        formatted: formatINR(availableBudget),
        priorityArea,
        recommendations,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
});

/**
 * POST /api/budget/compare-options
 * Compare multiple budget options
 * Body: { options: Array<{ name: string, changes: {...} }> }
 */
router.post('/budget/compare-options', (req: Request, res: Response) => {
  try {
    const { options } = req.body;

    if (!options || !Array.isArray(options)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid options array'
      });
    }

    const comparisons = options.map((option: any) => {
      const budget = calculateSimulationBudget(option.changes);
      return {
        name: option.name,
        changes: option.changes,
        budget: {
          ...budget,
          formatted: {
            totalOneTimeCost: formatINR(budget.totalOneTimeCost),
            totalFirstYearCost: formatINR(budget.totalFirstYearCost)
          }
        }
      };
    });

    // Sort by total first year cost
    comparisons.sort((a, b) => a.budget.totalFirstYearCost - b.budget.totalFirstYearCost);

    res.json({
      success: true,
      data: {
        comparisons,
        cheapest: comparisons[0],
        mostExpensive: comparisons[comparisons.length - 1],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to compare options',
      message: error.message
    });
  }
});

export default router;
