/**
 * Budget Calculator Component
 * Shows cost estimates for infrastructure and fixes
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface BudgetEstimate {
  itemName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  monthlyRecurring?: number;
  yearlyRecurring?: number;
}

interface BudgetCalculatorProps {
  changes: {
    addStreetlights: number;
    addPoliceBooths: number;
    fixIssues: number;
  };
  onBudgetCalculated?: (budget: any) => void;
}

const API_BASE_URL = 'http://localhost:3000/api';

const BudgetCalculator: React.FC<BudgetCalculatorProps> = ({ changes, onBudgetCalculated }) => {
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateBudget();
  }, [changes]);

  const calculateBudget = async () => {
    // Only calculate if there are changes
    if (changes.addStreetlights === 0 && changes.addPoliceBooths === 0 && changes.fixIssues === 0) {
      setBudget(null);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/budget/calculate-simulation`, changes);
      setBudget(response.data.data);
      if (onBudgetCalculated) {
        onBudgetCalculated(response.data.data);
      }
    } catch (error) {
      console.error('Error calculating budget:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!budget || (changes.addStreetlights === 0 && changes.addPoliceBooths === 0 && changes.fixIssues === 0)) {
    return null;
  }

  return (
    <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">💰 Budget Estimate</h3>
          <p className="text-sm text-gray-600">Cost breakdown for proposed changes</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Calculating costs...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Items Breakdown */}
          <div className="bg-white rounded-xl p-4 space-y-3">
            {budget.items.map((item: BudgetEstimate, index: number) => (
              <div key={index} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.itemName}</p>
                  <p className="text-xs text-gray-600">
                    {item.quantity} × {budget.formatted ? budget.formatted.totalCost : `₹${item.unitCost.toLocaleString('en-IN')}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ₹{item.totalCost.toLocaleString('en-IN')}
                  </p>
                  {item.monthlyRecurring && item.monthlyRecurring > 0 && (
                    <p className="text-xs text-orange-600">
                      +₹{item.monthlyRecurring.toLocaleString('en-IN')}/month
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total Costs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">One-Time Cost</p>
              <p className="text-2xl font-bold text-gray-900">
                {budget.formatted?.totalOneTimeCost || `₹${budget.totalOneTimeCost.toLocaleString('en-IN')}`}
              </p>
            </div>

            {budget.totalMonthlyRecurring > 0 && (
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Monthly Recurring</p>
                <p className="text-2xl font-bold text-orange-600">
                  {budget.formatted?.totalMonthlyRecurring || `₹${budget.totalMonthlyRecurring.toLocaleString('en-IN')}`}
                </p>
              </div>
            )}
          </div>

          {/* First Year Total */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total First Year Cost</p>
                <p className="text-3xl font-bold mt-1">
                  {budget.formatted?.totalFirstYearCost || `₹${budget.totalFirstYearCost.toLocaleString('en-IN')}`}
                </p>
              </div>
              <svg className="w-12 h-12 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
              </svg>
            </div>
          </div>

          {/* Cost Breakdown Info */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">Cost Information</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Streetlight: ₹25,000 installation + ₹500/month electricity</li>
                  <li>• Police Booth: ₹1,50,000 installation + ₹30,000/month staffing</li>
                  <li>• Issue Fix: ₹5,000 - ₹35,000 depending on severity</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetCalculator;
