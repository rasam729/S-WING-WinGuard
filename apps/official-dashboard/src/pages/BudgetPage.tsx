import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

interface BudgetAllocation {
  allocation_id: string;
  fiscal_year: string;
  source_type: string;
  source_name: string;
  sanction_number: string;
  sanction_date: string;
  amount: number;
  purpose: string;
}

interface BudgetCategory {
  category_id: string;
  category: string;
  allocated: number;
  spent: number;
  committed: number;
  available: number;
  percentage: number;
}

interface Expense {
  expense_id: string;
  category: string;
  estimated_cost: number;
  sanctioned_amount: number;
  actual_cost: number;
  variance: number;
  contractor_name: string;
  created_at: string;
}

export default function BudgetPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'allocations' | 'expenses' | 'transparency'>('overview');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('2025-26');

  useEffect(() => {
    fetchBudgetData();
  }, [selectedFiscalYear]);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch budget overview
      const overviewRes = await fetch(`http://localhost:3000/api/budget/overview?fiscal_year=${selectedFiscalYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const overviewData = await overviewRes.json();
      
      if (overviewData.success) {
        setAllocations(overviewData.data.allocations || []);
      }

      // Fetch categories
      const categoriesRes = await fetch('http://localhost:3000/api/budget/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const categoriesData = await categoriesRes.json();
      
      if (categoriesData.success) {
        setCategories(categoriesData.data || []);
      }

      // Fetch expenses
      const expensesRes = await fetch('http://localhost:3000/api/budget/expenses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const expensesData = await expensesRes.json();
      
      if (expensesData.success) {
        setExpenses(expensesData.data || []);
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 font-medium">Loading Budget Data...</p>
        </div>
      </div>
    );
  }

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalAvailable = categories.reduce((sum, cat) => sum + cat.available, 0);
  const utilizationRate = totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0;

  // Chart data
  const categoryBudgetData = {
    labels: categories.map(c => c.category),
    datasets: [{
      label: 'Allocated',
      data: categories.map(c => c.allocated),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
    }, {
      label: 'Spent',
      data: categories.map(c => c.spent),
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
    }, {
      label: 'Available',
      data: categories.map(c => c.available),
      backgroundColor: 'rgba(168, 85, 247, 0.8)',
    }]
  };

  const sourceDistributionData = {
    labels: [...new Set(allocations.map(a => a.source_type))],
    datasets: [{
      data: [...new Set(allocations.map(a => a.source_type))].map(type =>
        allocations.filter(a => a.source_type === type).reduce((sum, a) => sum + a.amount, 0)
      ),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(234, 179, 8, 0.8)',
      ],
    }]
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">💰 Budget Tracking</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2024-25">FY 2024-25</option>
                <option value="2025-26">FY 2025-26</option>
                <option value="2026-27">FY 2026-27</option>
              </select>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                ← Back
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['overview', 'allocations', 'expenses', 'transparency'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <p className="text-gray-400 text-sm font-medium">Total Allocated</p>
                <p className="text-3xl font-bold text-white mt-2">₹{(totalAllocated / 10000000).toFixed(2)}Cr</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <p className="text-gray-400 text-sm font-medium">Total Spent</p>
                <p className="text-3xl font-bold text-green-400 mt-2">₹{(totalSpent / 10000000).toFixed(2)}Cr</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <p className="text-gray-400 text-sm font-medium">Available</p>
                <p className="text-3xl font-bold text-purple-400 mt-2">₹{(totalAvailable / 10000000).toFixed(2)}Cr</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <p className="text-gray-400 text-sm font-medium">Utilization Rate</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">{utilizationRate}%</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Category-wise Budget</h3>
                <Bar data={categoryBudgetData} options={{ responsive: true }} />
              </div>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Source Distribution</h3>
                <Doughnut data={sourceDistributionData} options={{ responsive: true }} />
              </div>
            </div>

            {/* Category Details */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Budget Categories</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Category</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Allocated</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Spent</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Available</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.category_id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3 px-4 text-white">{cat.category}</td>
                        <td className="py-3 px-4 text-right text-white">₹{(cat.allocated / 100000).toFixed(2)}L</td>
                        <td className="py-3 px-4 text-right text-green-400">₹{(cat.spent / 100000).toFixed(2)}L</td>
                        <td className="py-3 px-4 text-right text-purple-400">₹{(cat.available / 100000).toFixed(2)}L</td>
                        <td className="py-3 px-4 text-right text-blue-400">
                          {cat.allocated > 0 ? ((cat.spent / cat.allocated) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'allocations' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Budget Allocations</h3>
            <div className="space-y-4">
              {allocations.map((allocation) => (
                <div key={allocation.allocation_id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{allocation.source_name}</h4>
                      <p className="text-sm text-gray-400">{allocation.source_type.replace('_', ' ').toUpperCase()}</p>
                    </div>
                    <span className="text-2xl font-bold text-green-400">₹{(allocation.amount / 10000000).toFixed(2)}Cr</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-400">Sanction No:</span>
                      <span className="text-white ml-2">{allocation.sanction_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white ml-2">{new Date(allocation.sanction_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 mt-2 text-sm">{allocation.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Recent Expenses</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Category</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Contractor</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Estimated</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Sanctioned</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Actual</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Variance</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.slice(0, 20).map((expense) => (
                    <tr key={expense.expense_id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-white">{expense.category}</td>
                      <td className="py-3 px-4 text-gray-300">{expense.contractor_name || 'N/A'}</td>
                      <td className="py-3 px-4 text-right text-gray-300">₹{(expense.estimated_cost / 100000).toFixed(2)}L</td>
                      <td className="py-3 px-4 text-right text-blue-400">₹{(expense.sanctioned_amount / 100000).toFixed(2)}L</td>
                      <td className="py-3 px-4 text-right text-green-400">
                        {expense.actual_cost ? `₹${(expense.actual_cost / 100000).toFixed(2)}L` : 'Pending'}
                      </td>
                      <td className={`py-3 px-4 text-right ${expense.variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {expense.variance ? `₹${(expense.variance / 100000).toFixed(2)}L` : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-300">{new Date(expense.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transparency' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">📊 Public Budget Transparency</h3>
              <p className="text-gray-300 mb-4">
                All budget allocations and expenses are publicly available for citizen review and accountability.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">Total Allocations</p>
                  <p className="text-2xl font-bold text-white mt-2">{allocations.length}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">Public Expenses</p>
                  <p className="text-2xl font-bold text-white mt-2">{expenses.length}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">Transparency Score</p>
                  <p className="text-2xl font-bold text-green-400 mt-2">98%</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Budget Sources</h3>
              <div className="space-y-3">
                {[...new Set(allocations.map(a => a.source_type))].map((sourceType) => {
                  const sourceAllocations = allocations.filter(a => a.source_type === sourceType);
                  const totalAmount = sourceAllocations.reduce((sum, a) => sum + a.amount, 0);
                  return (
                    <div key={sourceType} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">{sourceType.replace('_', ' ').toUpperCase()}</span>
                        <span className="text-green-400 font-bold">₹{(totalAmount / 10000000).toFixed(2)}Cr</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        {sourceAllocations.length} allocation(s)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
