/**
 * Budget Service
 * Calculates costs for infrastructure installations and issue fixes
 */

// Cost constants (in INR - Indian Rupees)
export const INFRASTRUCTURE_COSTS = {
  streetlight: {
    installation: 25000,  // ₹25,000 per streetlight
    maintenance: 2000,    // ₹2,000 per maintenance
    electricity: 500      // ₹500 per month
  },
  police_booth: {
    installation: 150000, // ₹1,50,000 per booth
    maintenance: 5000,    // ₹5,000 per maintenance
    staffing: 30000       // ₹30,000 per month (staff salary)
  },
  cctv: {
    installation: 15000,  // ₹15,000 per camera
    maintenance: 1000,    // ₹1,000 per maintenance
    monitoring: 3000      // ₹3,000 per month
  }
};

export const ISSUE_FIX_COSTS = {
  pothole: {
    small: 5000,          // ₹5,000 for small pothole
    medium: 15000,        // ₹15,000 for medium pothole
    large: 35000          // ₹35,000 for large pothole
  },
  streetlight: {
    bulb_replacement: 500,     // ₹500 for bulb
    wiring_repair: 3000,       // ₹3,000 for wiring
    pole_replacement: 20000    // ₹20,000 for pole
  },
  drainage: {
    cleaning: 8000,       // ₹8,000 for cleaning
    repair: 25000,        // ₹25,000 for repair
    replacement: 100000   // ₹1,00,000 for replacement
  }
};

interface BudgetEstimate {
  itemType: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  monthlyRecurring?: number;
  yearlyRecurring?: number;
  breakdown: {
    installation?: number;
    maintenance?: number;
    recurring?: number;
  };
}

interface BudgetSummary {
  items: BudgetEstimate[];
  totalOneTimeCost: number;
  totalMonthlyRecurring: number;
  totalYearlyRecurring: number;
  totalFirstYearCost: number;
  currency: string;
  generatedAt: string;
}

/**
 * Calculate cost for infrastructure installation
 */
export function calculateInfrastructureCost(
  type: 'streetlight' | 'police_booth' | 'cctv',
  quantity: number,
  includeRecurring: boolean = true
): BudgetEstimate {
  const costs = INFRASTRUCTURE_COSTS[type];
  const unitCost = costs.installation;
  const totalCost = unitCost * quantity;

  let monthlyRecurring = 0;
  let yearlyRecurring = 0;

  if (includeRecurring) {
    if (type === 'streetlight') {
      monthlyRecurring = (costs as typeof INFRASTRUCTURE_COSTS.streetlight).electricity * quantity;
    } else if (type === 'police_booth') {
      monthlyRecurring = (costs as typeof INFRASTRUCTURE_COSTS.police_booth).staffing * quantity;
    } else if (type === 'cctv') {
      monthlyRecurring = (costs as typeof INFRASTRUCTURE_COSTS.cctv).monitoring * quantity;
    }
    yearlyRecurring = monthlyRecurring * 12;
  }

  return {
    itemType: 'infrastructure',
    itemName: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    quantity,
    unitCost,
    totalCost,
    monthlyRecurring,
    yearlyRecurring,
    breakdown: {
      installation: totalCost,
      maintenance: costs.maintenance * quantity,
      recurring: monthlyRecurring
    }
  };
}

/**
 * Calculate cost for fixing issues
 */
export function calculateIssueFixCost(
  issueType: string,
  severity: 'small' | 'medium' | 'large' | 'bulb_replacement' | 'wiring_repair' | 'pole_replacement' | 'cleaning' | 'repair' | 'replacement',
  quantity: number = 1
): BudgetEstimate {
  let unitCost = 0;
  let itemName = '';

  // Determine cost based on issue type and severity
  if (issueType === 'pothole') {
    unitCost = ISSUE_FIX_COSTS.pothole[severity as 'small' | 'medium' | 'large'] || ISSUE_FIX_COSTS.pothole.medium;
    itemName = `Pothole Fix (${severity})`;
  } else if (issueType === 'streetlight' || issueType === 'broken_light') {
    unitCost = ISSUE_FIX_COSTS.streetlight[severity as 'bulb_replacement' | 'wiring_repair' | 'pole_replacement'] || ISSUE_FIX_COSTS.streetlight.bulb_replacement;
    itemName = `Streetlight Repair (${severity.replace('_', ' ')})`;
  } else if (issueType === 'drainage') {
    unitCost = ISSUE_FIX_COSTS.drainage[severity as 'cleaning' | 'repair' | 'replacement'] || ISSUE_FIX_COSTS.drainage.cleaning;
    itemName = `Drainage ${severity}`;
  } else {
    // Default cost for unknown issues
    unitCost = 10000;
    itemName = `${issueType} Fix`;
  }

  const totalCost = unitCost * quantity;

  return {
    itemType: 'issue_fix',
    itemName,
    quantity,
    unitCost,
    totalCost,
    breakdown: {
      installation: totalCost
    }
  };
}

/**
 * Calculate total budget for multiple items
 */
export function calculateTotalBudget(items: BudgetEstimate[]): BudgetSummary {
  const totalOneTimeCost = items.reduce((sum, item) => sum + item.totalCost, 0);
  const totalMonthlyRecurring = items.reduce((sum, item) => sum + (item.monthlyRecurring || 0), 0);
  const totalYearlyRecurring = items.reduce((sum, item) => sum + (item.yearlyRecurring || 0), 0);
  const totalFirstYearCost = totalOneTimeCost + totalYearlyRecurring;

  return {
    items,
    totalOneTimeCost,
    totalMonthlyRecurring,
    totalYearlyRecurring,
    totalFirstYearCost,
    currency: 'INR',
    generatedAt: new Date().toISOString()
  };
}

/**
 * Format currency in Indian Rupees
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Calculate budget for safety score simulation
 */
export function calculateSimulationBudget(changes: {
  addStreetlights?: number;
  addPoliceBooths?: number;
  addCCTV?: number;
  fixIssues?: number;
}): BudgetSummary {
  const items: BudgetEstimate[] = [];

  if (changes.addStreetlights && changes.addStreetlights > 0) {
    items.push(calculateInfrastructureCost('streetlight', changes.addStreetlights));
  }

  if (changes.addPoliceBooths && changes.addPoliceBooths > 0) {
    items.push(calculateInfrastructureCost('police_booth', changes.addPoliceBooths));
  }

  if (changes.addCCTV && changes.addCCTV > 0) {
    items.push(calculateInfrastructureCost('cctv', changes.addCCTV));
  }

  if (changes.fixIssues && changes.fixIssues > 0) {
    // Assume medium severity for general fixes
    items.push(calculateIssueFixCost('pothole', 'medium', changes.fixIssues));
  }

  return calculateTotalBudget(items);
}

/**
 * Get budget recommendations based on available budget
 */
export function getBudgetRecommendations(
  availableBudget: number,
  priorityArea: 'safety' | 'infrastructure' | 'maintenance'
): string[] {
  const recommendations: string[] = [];

  if (priorityArea === 'safety') {
    if (availableBudget >= 150000) {
      recommendations.push('Install 1 police booth for immediate safety improvement');
    }
    if (availableBudget >= 75000) {
      recommendations.push('Install 3 streetlights in high-crime areas');
    }
    if (availableBudget >= 45000) {
      recommendations.push('Install 3 CCTV cameras at key locations');
    }
  } else if (priorityArea === 'infrastructure') {
    const streetlightCount = Math.floor(availableBudget / 25000);
    if (streetlightCount > 0) {
      recommendations.push(`Install ${streetlightCount} streetlights to improve visibility`);
    }
  } else if (priorityArea === 'maintenance') {
    const potholeCount = Math.floor(availableBudget / 15000);
    if (potholeCount > 0) {
      recommendations.push(`Fix ${potholeCount} medium-sized potholes`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Budget insufficient for major improvements. Consider smaller maintenance tasks.');
  }

  return recommendations;
}

export default {
  calculateInfrastructureCost,
  calculateIssueFixCost,
  calculateTotalBudget,
  calculateSimulationBudget,
  formatINR,
  getBudgetRecommendations,
  INFRASTRUCTURE_COSTS,
  ISSUE_FIX_COSTS
};
