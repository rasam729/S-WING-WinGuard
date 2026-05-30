import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useIssuesStore } from '../store/issuesStore';
import { CURRENCIES, convertCurrency, formatCurrency } from '../data/globalData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ── Types ────────────────────────────────────────────────────────────────────

interface IssueExpense {
  id: string;
  issueType: string;
  location: string;
  severity: number;
  status: 'pending_sanction' | 'sanctioned' | 'in_progress' | 'completed';
  aiCostEstimate: number;
  sanctionedAmount: number;
  actualSpent: number;
  feasibilityScore: number;   // 0-100
  roiMultiplier: number;      // e.g. 2.4x
  crimeReductionPct: number;
  profitLoss: number;
  createdAt: string;
}

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

// ── Helpers ──────────────────────────────────────────────────────────────────


const getMonthLabels = (n: number) => {
  const labels: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
  }
  return labels;
};

const genData = (base: number, n: number, trend = 0) =>
  Array.from({ length: n }, (_, i) => {
    const noise = (Math.random() - 0.5) * base * 0.25;
    return Math.max(0, Math.round(base + noise + trend * i));
  });

// Static AI-derived issue expenses linked to map issues
const ISSUE_EXPENSES: IssueExpense[] = [
  {
    id: 'ie-001', issueType: 'Pothole Repair', location: 'Koramangala 5th Block',
    severity: 9, status: 'completed',
    aiCostEstimate: 48000, sanctionedAmount: 52000, actualSpent: 46500,
    feasibilityScore: 92, roiMultiplier: 3.1, crimeReductionPct: 0,
    profitLoss: 5500, createdAt: '2025-12-10'
  },
  {
    id: 'ie-002', issueType: 'Streetlight Installation', location: 'Whitefield Main Road',
    severity: 7, status: 'in_progress',
    aiCostEstimate: 85000, sanctionedAmount: 90000, actualSpent: 61000,
    feasibilityScore: 88, roiMultiplier: 3.8, crimeReductionPct: 15,
    profitLoss: 29000, createdAt: '2026-01-15'
  },
  {
    id: 'ie-003', issueType: 'Police Booth Setup', location: 'Indiranagar 100ft Road',
    severity: 8, status: 'sanctioned',
    aiCostEstimate: 320000, sanctionedAmount: 350000, actualSpent: 0,
    feasibilityScore: 85, roiMultiplier: 4.2, crimeReductionPct: 25,
    profitLoss: 30000, createdAt: '2026-02-01'
  },
  {
    id: 'ie-004', issueType: 'Road Crack Sealing', location: 'Jayanagar 4th Block',
    severity: 6, status: 'completed',
    aiCostEstimate: 28000, sanctionedAmount: 32000, actualSpent: 27800,
    feasibilityScore: 78, roiMultiplier: 2.2, crimeReductionPct: 0,
    profitLoss: 4200, createdAt: '2025-11-20'
  },
  {
    id: 'ie-005', issueType: 'Drainage Repair', location: 'HSR Layout Sector 4',
    severity: 7, status: 'in_progress',
    aiCostEstimate: 145000, sanctionedAmount: 155000, actualSpent: 92000,
    feasibilityScore: 74, roiMultiplier: 2.8, crimeReductionPct: 0,
    profitLoss: 10000, createdAt: '2026-01-28'
  },
  {
    id: 'ie-006', issueType: 'Streetlight Repair', location: 'Bannerghatta Road',
    severity: 6, status: 'completed',
    aiCostEstimate: 22000, sanctionedAmount: 25000, actualSpent: 21500,
    feasibilityScore: 90, roiMultiplier: 2.9, crimeReductionPct: 12,
    profitLoss: 3500, createdAt: '2025-12-28'
  },
  {
    id: 'ie-007', issueType: 'Pothole Repair', location: 'BTM Layout 2nd Stage',
    severity: 8, status: 'pending_sanction',
    aiCostEstimate: 62000, sanctionedAmount: 0, actualSpent: 0,
    feasibilityScore: 95, roiMultiplier: 3.4, crimeReductionPct: 0,
    profitLoss: 0, createdAt: '2026-03-05'
  },
  {
    id: 'ie-008', issueType: 'Police Booth Repair', location: 'Marathahalli Bridge',
    severity: 5, status: 'sanctioned',
    aiCostEstimate: 48000, sanctionedAmount: 50000, actualSpent: 0,
    feasibilityScore: 70, roiMultiplier: 2.1, crimeReductionPct: 10,
    profitLoss: 2000, createdAt: '2026-02-18'
  }
];

// ── Chart Defaults ────────────────────────────────────────────────────────────

const darkChart = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { labels: { color: '#d1d5db', font: { size: 11 } } },
    tooltip: {
      backgroundColor: 'rgba(17,24,39,0.97)',
      titleColor: '#f9fafb',
      bodyColor: '#d1d5db',
      borderColor: '#374151',
      borderWidth: 1
    }
  },
  scales: {
    x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(55,65,81,0.4)' } },
    y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(55,65,81,0.4)' } }
  }
};

const noScaleDark = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { labels: { color: '#d1d5db', font: { size: 11 } } },
    tooltip: {
      backgroundColor: 'rgba(17,24,39,0.97)',
      titleColor: '#f9fafb',
      bodyColor: '#d1d5db'
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  useIssuesStore(); // keep store connected for future real-time sync

  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'feasibility' | 'allocations' | 'transparency'>('overview');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('2025-26');
  const [statusFilter, setStatusFilter] = useState<'all' | IssueExpense['status']>('all');
  const [selectedIssue, setSelectedIssue] = useState<IssueExpense | null>(null);
  const [months] = useState(12);
  const [displayCurrency, setDisplayCurrency] = useState('INR');

  // Currency helpers — base is INR
  const cvtCur = (amt: number, from: string = 'INR') => convertCurrency(amt, from, displayCurrency);
  const fmtCur = (amt: number, from: string = 'INR') => formatCurrency(cvtCur(amt, from), displayCurrency);
  const fmtUnit = (v: number, unit: 'L' | 'Cr' = 'L') => {
    const converted = cvtCur(v);
    const cur = CURRENCIES.find(c => c.code === displayCurrency);
    const sym = cur ? cur.symbol : '';
    if (displayCurrency === 'INR') {
      return unit === 'Cr' ? `${sym}${(converted / 10000000).toFixed(2)} Cr` : `${sym}${(converted / 100000).toFixed(2)} L`;
    }
    // For non-INR show human-friendly abbreviated numbers
    if (Math.abs(converted) >= 1000000) return `${sym}${(converted / 1000000).toFixed(2)}M`;
    if (Math.abs(converted) >= 1000) return `${sym}${(converted / 1000).toFixed(1)}k`;
    return `${sym}${Math.round(converted).toLocaleString()}`;
  };
  void CURRENCIES.find(c => c.code === displayCurrency)?.symbol; // curSym reserved

  useEffect(() => { fetchBudgetData(); }, [selectedFiscalYear]);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [ovRes, catRes] = await Promise.allSettled([
        fetch(`/api/budget/overview?fiscal_year=${selectedFiscalYear}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/budget/categories', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (ovRes.status === 'fulfilled') {
        const d = await ovRes.value.json();
        if (d.success) setAllocations(d.data?.allocations || []);
      }
      if (catRes.status === 'fulfilled') {
        const d = await catRes.value.json();
        if (d.success) setCategories(d.data || []);
      }
    } catch (e) {
      console.error('Budget fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  // ── Derived numbers ──────────────────────────────────────────────────────

  const allIssueExpenses = ISSUE_EXPENSES;
  const filteredExpenses = statusFilter === 'all'
    ? allIssueExpenses
    : allIssueExpenses.filter(e => e.status === statusFilter);

  const totalAICost  = allIssueExpenses.reduce((s, e) => s + e.aiCostEstimate, 0);
  const totalSanc    = allIssueExpenses.reduce((s, e) => s + e.sanctionedAmount, 0);
  const totalSpentE  = allIssueExpenses.reduce((s, e) => s + e.actualSpent, 0);
  const totalPL      = allIssueExpenses.reduce((s, e) => s + e.profitLoss, 0);
  const avgFeasibility = (allIssueExpenses.reduce((s, e) => s + e.feasibilityScore, 0) / allIssueExpenses.length).toFixed(0);

  const catAllocated = categories.reduce((s, c) => s + c.allocated, 0) || 4200000;
  const catSpent     = categories.reduce((s, c) => s + c.spent, 0)     || 3150000;
  const utilRate     = catAllocated > 0 ? ((catSpent / catAllocated) * 100).toFixed(1) : '75.0';
  const totalBudgetDisplay = fmtCur(catAllocated); void totalBudgetDisplay;

  const monthLabels = getMonthLabels(months);

  // ── Chart datasets ───────────────────────────────────────────────────────

  // 1. Monthly expenditure trend
  const expenditureTrend = {
    labels: monthLabels,
    datasets: [
      {
        label: `AI Cost Estimate (${displayCurrency})`,
        data: genData(68, months, 1.2),
        fill: true,
        backgroundColor: 'rgba(245,158,11,0.12)',
        borderColor: '#f59e0b',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        borderDash: [5, 3]
      },
      {
        label: `Sanctioned (${displayCurrency})`,
        data: genData(75, months, 1.0),
        fill: true,
        backgroundColor: 'rgba(59,130,246,0.12)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3
      },
      {
        label: `Actual Spent (${displayCurrency})`,
        data: genData(58, months, 1.5),
        fill: true,
        backgroundColor: 'rgba(34,197,94,0.12)',
        borderColor: '#22c55e',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3
      }
    ]
  };

  // 2. Category allocation bar
  const catLabels   = categories.length > 0 ? categories.map(c => c.category) : ['Road Repair', 'Lighting', 'Safety Infra', 'Technology', 'Maintenance'];
  const catAllocArr = categories.length > 0 ? categories.map(c => +(cvtCur(c.allocated) / 100000).toFixed(1)) : [150, 80, 120, 45, 70];
  const catSpentArr = categories.length > 0 ? categories.map(c => +(cvtCur(c.spent) / 100000).toFixed(1))     : [120, 62, 95, 38, 55];
  const catAvailArr = categories.length > 0 ? categories.map(c => +(cvtCur(c.available) / 100000).toFixed(1)) : [30, 18, 25, 7, 15];

  const categoryBar = {
    labels: catLabels,
    datasets: [
      { label: `Allocated (${displayCurrency})`, data: catAllocArr, backgroundColor: 'rgba(59,130,246,0.8)', borderRadius: 6, borderWidth: 0 },
      { label: `Spent (${displayCurrency})`,     data: catSpentArr, backgroundColor: 'rgba(34,197,94,0.8)',  borderRadius: 6, borderWidth: 0 },
      { label: `Available (${displayCurrency})`, data: catAvailArr, backgroundColor: 'rgba(168,85,247,0.8)', borderRadius: 6, borderWidth: 0 }
    ]
  };

  // 3. Source distribution doughnut
  const srcTypes = [...new Set(allocations.map(a => a.source_type))];
  const sourceData = {
    labels: srcTypes.length > 0 ? srcTypes : ['Central Grant', 'State Fund', 'Municipal Budget', 'PPP'],
    datasets: [{
      data: srcTypes.length > 0
        ? srcTypes.map(t => allocations.filter(a => a.source_type === t).reduce((s, a) => s + a.amount, 0) / 100000)
        : [250, 180, 120, 80],
      backgroundColor: ['rgba(59,130,246,0.85)', 'rgba(34,197,94,0.85)', 'rgba(245,158,11,0.85)', 'rgba(168,85,247,0.85)'],
      borderColor: ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7'],
      borderWidth: 2
    }]
  };

  // 4. Feasibility distribution pie
  const feasPie = {
    labels: ['High Feasibility (≥80)', 'Medium (60-79)', 'Low (<60)'],
    datasets: [{
      data: [
        allIssueExpenses.filter(e => e.feasibilityScore >= 80).length,
        allIssueExpenses.filter(e => e.feasibilityScore >= 60 && e.feasibilityScore < 80).length,
        allIssueExpenses.filter(e => e.feasibilityScore < 60).length
      ],
      backgroundColor: ['rgba(34,197,94,0.85)', 'rgba(245,158,11,0.85)', 'rgba(239,68,68,0.85)'],
      borderColor: ['#22c55e', '#f59e0b', '#ef4444'],
      borderWidth: 2
    }]
  };

  // 5. P&L bar per project
  const plBar = {
    labels: allIssueExpenses.map(e => e.issueType.split(' ').slice(0, 2).join(' ')),
    datasets: [
      {
        label: `AI Cost Est. (${displayCurrency})`,
        data: allIssueExpenses.map(e => cvtCur(e.aiCostEstimate)),
        backgroundColor: 'rgba(245,158,11,0.8)',
        borderRadius: 6
      },
      {
        label: `Sanctioned (${displayCurrency})`,
        data: allIssueExpenses.map(e => cvtCur(e.sanctionedAmount)),
        backgroundColor: 'rgba(59,130,246,0.8)',
        borderRadius: 6
      },
      {
        label: `Actual Spent (${displayCurrency})`,
        data: allIssueExpenses.map(e => cvtCur(e.actualSpent)),
        backgroundColor: 'rgba(34,197,94,0.8)',
        borderRadius: 6
      }
    ]
  };

  // 6. ROI bar
  const roiBar = {
    labels: allIssueExpenses.map(e => e.issueType.split(' ').slice(0, 2).join(' ')),
    datasets: [{
      label: 'ROI Multiplier',
      data: allIssueExpenses.map(e => e.roiMultiplier),
      backgroundColor: allIssueExpenses.map(e =>
        e.roiMultiplier >= 3 ? 'rgba(34,197,94,0.85)' :
        e.roiMultiplier >= 2 ? 'rgba(59,130,246,0.85)' :
        'rgba(245,158,11,0.85)'
      ),
      borderRadius: 8,
      borderWidth: 0
    }]
  };

  // ── Status badge ─────────────────────────────────────────────────────────

  const statusBadge = (s: IssueExpense['status']) => {
    const map = {
      pending_sanction: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
      sanctioned:       'bg-blue-900/40   text-blue-400   border-blue-700',
      in_progress:      'bg-orange-900/40 text-orange-400 border-orange-700',
      completed:        'bg-green-900/40  text-green-400  border-green-700'
    };
    const label = { pending_sanction: 'Pending Sanction', sanctioned: 'Sanctioned', in_progress: 'In Progress', completed: 'Completed' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${map[s]}`}>{label[s]}</span>;
  };

  const feasColor = (f: number) =>
    f >= 80 ? 'text-green-400' : f >= 60 ? 'text-yellow-400' : 'text-red-400';

  const tabs = [
    { id: 'overview',      label: '📊 Overview' },
    { id: 'issues',        label: '🔗 Issues & Budget' },
    { id: 'feasibility',   label: '🤖 AI Feasibility' },
    { id: 'allocations',   label: '📋 Allocations' },
    { id: 'transparency',  label: '🔍 Transparency' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 font-medium">Loading Budget Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Header ── */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                💰 Budget & Finance Tracker
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <select value={selectedFiscalYear} onChange={e => setSelectedFiscalYear(e.target.value)}
                className="px-3 py-1.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 text-sm focus:outline-none">
                <option value="2024-25">FY 2024-25</option>
                <option value="2025-26">FY 2025-26</option>
                <option value="2026-27">FY 2026-27</option>
              </select>
              {/* Currency switcher */}
              <select value={displayCurrency} onChange={e => setDisplayCurrency(e.target.value)}
                className="px-3 py-1.5 bg-gray-800 text-gray-200 rounded-lg border border-teal-700 text-sm focus:outline-none" title="Display currency">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <button onClick={handleLogout} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">Logout</button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === t.id ? 'bg-teal-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── KPI Cards (always visible) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            { label: 'Total AI Estimate', value: fmtUnit(totalAICost), icon: '🤖', color: 'from-yellow-600 to-yellow-700' },
            { label: 'Total Sanctioned',  value: fmtUnit(totalSanc),   icon: '✅', color: 'from-blue-600  to-blue-700'  },
            { label: 'Total Spent',       value: fmtUnit(totalSpentE), icon: '💸', color: 'from-green-600 to-green-700' },
            { label: 'Surplus / Savings', value: fmtUnit(totalPL),     icon: '📈', color: 'from-teal-600  to-teal-700'  },
            { label: 'Avg Feasibility',   value: `${avgFeasibility}%`, icon: '🎯', color: 'from-purple-600 to-purple-700' },
            { label: 'Budget Utilization',value: `${utilRate}%`,   icon: '📊', color: 'from-rose-600  to-rose-700'  }
          ].map((card, i) => (
            <div key={i} className={`bg-gradient-to-br ${card.color} rounded-xl p-4 shadow-lg`}>
              <div className="text-2xl mb-1">{card.icon}</div>
              <p className="text-white/75 text-xs font-semibold uppercase tracking-wider">{card.label}</p>
              <p className="text-xl font-bold text-white mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TAB: OVERVIEW
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Monthly Expenditure Trend */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-1">📈 Monthly Expenditure Trend</h3>
                <p className="text-xs text-gray-500 mb-4">AI estimate vs sanctioned vs actual — last {months} months</p>
                <Line data={expenditureTrend} options={darkChart as any} />
              </div>

              {/* Category Budget Bar */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-1">🗂️ Category-wise Budget</h3>
                <p className="text-xs text-gray-500 mb-4">Allocated vs spent vs available ({displayCurrency})</p>
                <Bar data={categoryBar} options={darkChart as any} />
              </div>

              {/* Source Distribution Doughnut */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-1">🏛️ Budget Source Distribution</h3>
                <p className="text-xs text-gray-500 mb-4">Where the money comes from</p>
                <div className="flex justify-center h-64">
                  <Doughnut data={sourceData} options={noScaleDark as any} />
                </div>
              </div>

              {/* Feasibility Pie */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-1">🤖 AI Feasibility Distribution</h3>
                <p className="text-xs text-gray-500 mb-4">Issues classified by AI feasibility score</p>
                <div className="flex justify-center h-64">
                  <Pie data={feasPie} options={noScaleDark as any} />
                </div>
              </div>
            </div>

            {/* Category summary table */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">📋 Budget Category Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      {['Category', 'Allocated', 'Spent', 'Available', 'Utilization %', 'Status'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-gray-400 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(categories.length > 0 ? categories : [
                      { category_id: '1', category: 'Road Repair',    allocated: 15000000, spent: 12000000, committed: 1000000, available: 3000000, percentage: 80 },
                      { category_id: '2', category: 'Street Lighting', allocated: 8000000,  spent: 6200000,  committed: 500000,  available: 1800000, percentage: 77 },
                      { category_id: '3', category: 'Safety Infra',   allocated: 12000000, spent: 9500000,  committed: 800000,  available: 2500000, percentage: 79 },
                      { category_id: '4', category: 'Technology',     allocated: 4500000,  spent: 3800000,  committed: 200000,  available: 700000,  percentage: 84 },
                      { category_id: '5', category: 'Maintenance',    allocated: 7000000,  spent: 5500000,  committed: 600000,  available: 1500000, percentage: 79 }
                    ] as BudgetCategory[]).map(cat => {
                      const pct = cat.allocated > 0 ? (cat.spent / cat.allocated * 100) : 0;
                      return (
                        <tr key={cat.category_id} className="border-b border-gray-800 hover:bg-gray-800/40 transition">
                          <td className="py-3 px-3 text-white font-medium">{cat.category}</td>
                          <td className="py-3 px-3 text-blue-400">{fmtCur(cat.allocated)}</td>
                          <td className="py-3 px-3 text-green-400">{fmtCur(cat.spent)}</td>
                          <td className="py-3 px-3 text-purple-400">{fmtCur(cat.available)}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-700 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-gray-300 text-xs">{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${pct > 90 ? 'text-red-400 border-red-700 bg-red-900/30' : pct > 70 ? 'text-yellow-400 border-yellow-700 bg-yellow-900/30' : 'text-green-400 border-green-700 bg-green-900/30'}`}>
                              {pct > 90 ? 'Over Budget Risk' : pct > 70 ? 'On Track' : 'Under-utilized'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: ISSUES & BUDGET (linked)
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'issues' && (
          <div className="space-y-6">
            {/* AI info banner */}
            <div className="bg-gradient-to-r from-blue-900/40 to-teal-900/40 border border-blue-700/40 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <h4 className="text-white font-bold mb-1">AI-Powered Cost Detection</h4>
                  <p className="text-gray-300 text-sm">
                    Every issue from the dashboard map is analyzed by our AI cost model. It considers location, road type,
                    severity, bulk discount factors, and historical cost data to predict the optimal budget allocation.
                    Sanctioned amounts are compared against AI estimates to track efficiency.
                  </p>
                </div>
              </div>
            </div>

            {/* P&L charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-1">💹 Cost vs Sanctioned vs Spent</h3>
                <p className="text-xs text-gray-500 mb-4">Per issue — AI estimate vs actual</p>
                <Bar data={plBar} options={darkChart as any} />
              </div>
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-1">🏆 ROI Multiplier by Issue Type</h3>
                <p className="text-xs text-gray-500 mb-4">Social + economic value vs cost</p>
                <Bar data={roiBar} options={darkChart as any} />
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-gray-400 text-sm font-semibold">Filter by Status:</span>
              {(['all', 'pending_sanction', 'sanctioned', 'in_progress', 'completed'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    statusFilter === s
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
              <span className="ml-auto text-gray-400 text-sm">{filteredExpenses.length} issues</span>
            </div>

            {/* Issues-Budget table */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/60">
                    <tr>
                      {['Issue Type', 'Location', 'Sev.', 'Status', 'AI Cost Est.', 'Sanctioned', 'Spent', 'Savings', 'Feasibility', 'ROI', 'Crime ↓', 'Actions'].map(h => (
                        <th key={h} className="text-left py-3 px-3 text-gray-400 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map(exp => {
                      const savings = exp.sanctionedAmount > 0 ? exp.sanctionedAmount - exp.actualSpent : exp.aiCostEstimate - exp.actualSpent;
                      return (
                        <tr key={exp.id} className="border-b border-gray-800 hover:bg-gray-800/40 transition cursor-pointer" onClick={() => setSelectedIssue(exp)}>
                          <td className="py-3 px-3 text-white font-medium whitespace-nowrap">{exp.issueType}</td>
                          <td className="py-3 px-3 text-gray-400 text-xs whitespace-nowrap">{exp.location}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${exp.severity >= 8 ? 'bg-red-900/40 text-red-400' : exp.severity >= 6 ? 'bg-orange-900/40 text-orange-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                              {exp.severity}/10
                            </span>
                          </td>
                          <td className="py-3 px-3">{statusBadge(exp.status)}</td>
                          <td className="py-3 px-3 text-yellow-400 font-semibold whitespace-nowrap">{fmtCur(exp.aiCostEstimate)}</td>
                          <td className="py-3 px-3 text-blue-400 whitespace-nowrap">{exp.sanctionedAmount > 0 ? fmtCur(exp.sanctionedAmount) : '—'}</td>
                          <td className="py-3 px-3 text-green-400 whitespace-nowrap">{exp.actualSpent > 0 ? fmtCur(exp.actualSpent) : '—'}</td>
                          <td className={`py-3 px-3 font-semibold whitespace-nowrap ${savings > 0 ? 'text-green-400' : savings < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                            {exp.actualSpent > 0 ? (savings > 0 ? `+${fmtCur(savings)}` : fmtCur(savings)) : '—'}
                          </td>
                          <td className={`py-3 px-3 font-bold ${feasColor(exp.feasibilityScore)}`}>{exp.feasibilityScore}%</td>
                          <td className="py-3 px-3 text-teal-400 font-bold whitespace-nowrap">{exp.roiMultiplier}x</td>
                          <td className="py-3 px-3 text-purple-400 whitespace-nowrap">{exp.crimeReductionPct > 0 ? `-${exp.crimeReductionPct}%` : '—'}</td>
                          <td className="py-3 px-3">
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedIssue(exp); }}
                              className="px-2 py-1 bg-teal-700 text-white rounded text-xs font-bold hover:bg-teal-600 transition"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected issue detail panel */}
            {selectedIssue && (
              <div className="bg-gray-900 rounded-2xl border border-teal-700/50 p-6 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-white">📋 Issue Budget Detail: {selectedIssue.issueType}</h3>
                  <button onClick={() => setSelectedIssue(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'AI Cost Estimate',     value: fmtCur(selectedIssue.aiCostEstimate),  color: 'text-yellow-400' },
                    { label: 'Sanctioned Amount',    value: selectedIssue.sanctionedAmount > 0 ? fmtCur(selectedIssue.sanctionedAmount) : 'Not yet', color: 'text-blue-400' },
                    { label: 'Actual Spent',         value: selectedIssue.actualSpent > 0 ? fmtCur(selectedIssue.actualSpent) : 'Pending', color: 'text-green-400' },
                    { label: 'Savings vs Estimate',  value: selectedIssue.actualSpent > 0 ? fmtCur(selectedIssue.aiCostEstimate - selectedIssue.actualSpent) : '—', color: 'text-teal-400' },
                    { label: 'Feasibility Score',    value: `${selectedIssue.feasibilityScore}/100`,              color: feasColor(selectedIssue.feasibilityScore) },
                    { label: 'ROI Multiplier',       value: `${selectedIssue.roiMultiplier}x`,                    color: 'text-teal-400' },
                    { label: 'Crime Reduction',      value: selectedIssue.crimeReductionPct > 0 ? `-${selectedIssue.crimeReductionPct}%` : 'N/A', color: 'text-purple-400' },
                    { label: 'Severity',             value: `${selectedIssue.severity}/10`,                       color: selectedIssue.severity >= 8 ? 'text-red-400' : 'text-orange-400' }
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-800/60 rounded-xl p-4">
                      <p className="text-gray-400 text-xs font-semibold mb-1">{item.label}</p>
                      <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => navigate('/simulations')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                  >
                    🗺️ Simulate on Map
                  </button>
                  <button
                    onClick={() => navigate('/analytics')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition"
                  >
                    📊 View Analytics
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: AI FEASIBILITY & P&L
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'feasibility' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-700/40 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-4xl">🤖</span>
                <div>
                  <h4 className="text-white font-bold text-lg mb-2">AI-Powered Feasibility Engine</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Our ML model analyzes each infrastructure project across <strong className="text-white">14 cost factors</strong>:
                    location multiplier, road type, bulk discount, nearby density, season, material prices,
                    labor costs, and more. It predicts <strong className="text-white">ROI</strong>,
                    <strong className="text-white"> crime reduction</strong>, and
                    <strong className="text-white"> profit/loss</strong> before sanction approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4">🎯 Feasibility Score Distribution</h3>
                <div className="flex justify-center h-64">
                  <Pie data={feasPie} options={noScaleDark as any} />
                </div>
              </div>

              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4">💹 Profit / Loss per Project</h3>
                <Bar data={{
                  labels: allIssueExpenses.map(e => e.issueType.split(' ').slice(0, 2).join(' ')),
                  datasets: [{
                    label: `Net Savings (${displayCurrency})`,
                    data: allIssueExpenses.map(e => cvtCur(e.actualSpent > 0 ? e.sanctionedAmount - e.actualSpent : e.aiCostEstimate * 0.05)),
                    backgroundColor: allIssueExpenses.map(e => {
                      const val = e.actualSpent > 0 ? e.sanctionedAmount - e.actualSpent : e.aiCostEstimate * 0.05;
                      return val >= 0 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)';
                    }),
                    borderRadius: 8
                  }]
                }} options={darkChart as any} />
              </div>

              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4">🏆 ROI vs Cost</h3>
                <Bar data={roiBar} options={darkChart as any} />
              </div>

              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4">🔒 Crime Reduction Forecast</h3>
                <Bar data={{
                  labels: allIssueExpenses.filter(e => e.crimeReductionPct > 0).map(e => e.issueType.split(' ').slice(0, 2).join(' ')),
                  datasets: [{
                    label: 'Crime Reduction %',
                    data: allIssueExpenses.filter(e => e.crimeReductionPct > 0).map(e => e.crimeReductionPct),
                    backgroundColor: 'rgba(168,85,247,0.8)',
                    borderRadius: 8
                  }]
                }} options={darkChart as any} />
              </div>
            </div>

            {/* Feasibility Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {allIssueExpenses.map(exp => (
                <div
                  key={exp.id}
                  className={`bg-gray-900 rounded-xl p-4 border-2 cursor-pointer transition-all hover:shadow-lg ${
                    exp.feasibilityScore >= 80
                      ? 'border-green-700/60 hover:border-green-600'
                      : exp.feasibilityScore >= 60
                      ? 'border-yellow-700/60 hover:border-yellow-600'
                      : 'border-red-700/60 hover:border-red-600'
                  }`}
                  onClick={() => { setSelectedIssue(exp); setActiveTab('issues'); }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-white font-bold text-sm leading-tight">{exp.issueType}</p>
                    <span className={`text-2xl font-bold ${feasColor(exp.feasibilityScore)}`}>{exp.feasibilityScore}</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">{exp.location}</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">AI Estimate</span>
                      <span className="text-yellow-400 font-semibold">{fmtCur(exp.aiCostEstimate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ROI</span>
                      <span className="text-teal-400 font-bold">{exp.roiMultiplier}x</span>
                    </div>
                    {exp.crimeReductionPct > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Crime ↓</span>
                        <span className="text-purple-400 font-semibold">-{exp.crimeReductionPct}%</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 bg-gray-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${exp.feasibilityScore >= 80 ? 'bg-green-500' : exp.feasibilityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${exp.feasibilityScore}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    {statusBadge(exp.status)}
                    <span className={`text-xs font-bold ${exp.feasibilityScore >= 80 ? 'text-green-400' : exp.feasibilityScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {exp.feasibilityScore >= 80 ? '✅ Approved' : exp.feasibilityScore >= 60 ? '⚠️ Review' : '❌ Risky'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: ALLOCATIONS
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'allocations' && (
          <div className="space-y-4">
            {(allocations.length > 0 ? allocations : [
              { allocation_id: '1', fiscal_year: '2025-26', source_type: 'central_grant', source_name: 'NHAI Road Safety Fund', sanction_number: 'NHAI/2025/2341', sanction_date: '2025-04-01', amount: 25000000, purpose: 'Road repair and pothole fixing across Bengaluru' },
              { allocation_id: '2', fiscal_year: '2025-26', source_type: 'state_fund',    source_name: 'Karnataka PWD Grant',    sanction_number: 'KA/PWD/2025/881', sanction_date: '2025-05-15', amount: 18000000, purpose: 'Street lighting and safety infrastructure' },
              { allocation_id: '3', fiscal_year: '2025-26', source_type: 'municipal',     source_name: 'BBMP Road Budget',        sanction_number: 'BBMP/2025/3301', sanction_date: '2025-06-01', amount: 12000000, purpose: 'Maintenance and emergency repairs' },
              { allocation_id: '4', fiscal_year: '2025-26', source_type: 'ppp',           source_name: 'Private Partnership Fund', sanction_number: 'PPP/2025/112',  sanction_date: '2025-07-20', amount: 8000000,  purpose: 'Smart city technology deployment' }
            ] as BudgetAllocation[]).map(a => (
              <div key={a.allocation_id} className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-teal-700/50 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white">{a.source_name}</h4>
                    <p className="text-sm text-gray-400 mt-0.5">{a.source_type.replace('_', ' ').toUpperCase()} · {a.fiscal_year}</p>
                  </div>
                          <span className="text-2xl font-bold text-green-400">{fmtUnit(a.amount, 'Cr')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div><span className="text-gray-500">Sanction No:</span> <span className="text-gray-200 ml-1 font-mono">{a.sanction_number}</span></div>
                  <div><span className="text-gray-500">Date:</span> <span className="text-gray-200 ml-1">{new Date(a.sanction_date).toLocaleDateString()}</span></div>
                </div>
                <p className="text-gray-400 text-sm">{a.purpose}</p>
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: TRANSPARENCY
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'transparency' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Allocations', value: (allocations.length || 4).toString(),  icon: '📋', color: 'text-blue-400' },
                { label: 'Issues Tracked',    value: allIssueExpenses.length.toString(),     icon: '🔗', color: 'text-teal-400' },
                { label: 'Transparency Score', value: '98%',                                 icon: '🏆', color: 'text-green-400' }
              ].map((s, i) => (
                <div key={i} className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
                  <div className="text-4xl mb-2">{s.icon}</div>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-gray-400 text-sm mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-2">📢 Public Budget Transparency</h3>
              <p className="text-gray-400 text-sm mb-6">
                All budget allocations and expenditures are publicly accessible for citizen accountability.
                AI cost estimates are compared against actual spending to ensure fiscal responsibility.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-3">Budget Sources</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Central Grant (NHAI)', amount: 25000000, pct: 39 },
                      { name: 'State Fund (PWD)',      amount: 18000000, pct: 28 },
                      { name: 'Municipal (BBMP)',      amount: 12000000, pct: 19 },
                      { name: 'PPP',                   amount: 8000000,  pct: 14 }
                    ].map(s => (
                      <div key={s.name} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <span className="text-white text-sm font-medium">{s.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-gray-700 rounded-full h-1.5">
                            <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${s.pct}%` }} />
                          </div>
                          <span className="text-green-400 font-bold text-sm">{fmtUnit(s.amount, 'Cr')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-3">Spending Audit Trail</h4>
                  <div className="space-y-3">
                    {allIssueExpenses.filter(e => e.actualSpent > 0).map(e => (
                      <div key={e.id} className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-white text-sm font-medium">{e.issueType}</span>
                          <span className="text-green-400 text-sm font-bold">{fmtCur(e.actualSpent)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{e.location}</span>
                          <span className={e.sanctionedAmount - e.actualSpent >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {e.sanctionedAmount - e.actualSpent >= 0
                              ? `Saved ${fmtCur(e.sanctionedAmount - e.actualSpent)}`
                              : `Over by ${fmtCur(e.actualSpent - e.sanctionedAmount)}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
