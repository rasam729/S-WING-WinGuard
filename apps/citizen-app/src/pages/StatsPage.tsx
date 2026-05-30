import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface UserStats {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  criticalReports: number;
  upvotesReceived: number;
  impactScore: number;
  routesSaved: number;
  safetyContribution: number;
}

interface RecentActivityItem {
  id: number;
  action: string;
  description: string;
  date: string;
  status: string;
}

interface MonthlyData {
  month: string;
  count: number;
}

interface CategoryData {
  category: string;
  count: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function lastSixMonthLabels(): string[] {
  const now = new Date();
  const labels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(MONTH_LABELS[d.getMonth()]);
  }
  return labels;
}

// ── Mock fallback data ────────────────────────────────────────────────────────

const MOCK_MONTHLY: MonthlyData[] = [
  { month: 'Jan', count: 3 },
  { month: 'Feb', count: 7 },
  { month: 'Mar', count: 5 },
  { month: 'Apr', count: 12 },
  { month: 'May', count: 9 },
  { month: 'Jun', count: 15 },
];

const MOCK_CATEGORIES: CategoryData[] = [
  { category: 'Pothole', count: 42 },
  { category: 'Streetlight', count: 28 },
  { category: 'Drainage', count: 19 },
  { category: 'Road Crack', count: 33 },
  { category: 'Police Booth', count: 14 },
];

// ── Chart colour tokens ───────────────────────────────────────────────────────

const DOUGHNUT_COLORS = [
  'rgba(20, 184, 166, 0.85)',   // teal-500
  'rgba(34, 211, 238, 0.85)',   // cyan-400
  'rgba(99, 102, 241, 0.85)',   // indigo-500
  'rgba(248, 113, 113, 0.85)',  // red-400
  'rgba(251, 191, 36, 0.85)',   // amber-400
];

const DOUGHNUT_BORDERS = [
  'rgba(20, 184, 166, 1)',
  'rgba(34, 211, 238, 1)',
  'rgba(99, 102, 241, 1)',
  'rgba(248, 113, 113, 1)',
  'rgba(251, 191, 36, 1)',
];

// ── Common chart option helpers ───────────────────────────────────────────────

const darkGridOpts = {
  color: 'rgba(255,255,255,0.07)',
  lineWidth: 1,
};

const darkTickOpts = {
  color: 'rgba(209,213,219,0.85)',   // gray-300
  font: { size: 11 },
};

const darkLegendOpts = {
  labels: {
    color: 'rgba(209,213,219,0.9)',
    font: { size: 12 },
    padding: 16,
    usePointStyle: true,
    pointStyleWidth: 10,
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [stats, setStats] = useState<UserStats>({
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    criticalReports: 0,
    upvotesReceived: 0,
    impactScore: 0,
    routesSaved: 0,
    safetyContribution: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Chart-specific state
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>(MOCK_MONTHLY);
  const [categoryData, setCategoryData] = useState<CategoryData[]>(MOCK_CATEGORIES);

  // Gradient ref for the Line chart
  const lineCanvasRef = useRef<ChartJS<'line'> | null>(null);

  useEffect(() => {
    fetchUserStats();
  }, []);

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchUserStats = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('http://localhost:3000/api/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const reports: any[] = data.data.reports;

        const totalReports = reports.length;
        const resolvedReports = reports.filter((r) => r.status === 'Resolved').length;
        const pendingReports = reports.filter((r) => r.status === 'Report Received').length;
        const criticalReports = reports.filter((r) => r.critical_score >= 8).length;
        const impactScore = Math.min(100, totalReports * 10 + resolvedReports * 5);
        const safetyContribution =
          totalReports > 0
            ? Math.min(100, (resolvedReports / totalReports) * 100 + totalReports * 5)
            : 0;

        setStats({
          totalReports,
          resolvedReports,
          pendingReports,
          criticalReports,
          upvotesReceived: 0,
          impactScore,
          routesSaved: 0,
          safetyContribution: Math.round(safetyContribution),
        });

        // ── Monthly trend (last 6 months) ─────────────────────────────────
        const monthLabels = lastSixMonthLabels();
        const now = new Date();
        const monthly: MonthlyData[] = monthLabels.map((label, idx) => {
          const targetMonth = (now.getMonth() - (5 - idx) + 12) % 12;
          const count = reports.filter((r) => {
            const d = new Date(r.created_at);
            return d.getMonth() === targetMonth;
          }).length;
          return { month: label, count };
        });
        setMonthlyData(monthly);

        // ── Category breakdown ─────────────────────────────────────────────
        const catMap: Record<string, number> = {};
        reports.forEach((r) => {
          const cat = r.category || 'Other';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });
        const cats: CategoryData[] = Object.entries(catMap).map(([category, count]) => ({
          category,
          count,
        }));
        if (cats.length > 0) setCategoryData(cats);

        // ── Recent activity ────────────────────────────────────────────────
        const activities: RecentActivityItem[] = reports.slice(0, 4).map((report) => ({
          id: report.report_id,
          action: 'Report Submitted',
          description: `${report.category} – ${report.description.substring(0, 50)}${
            report.description.length > 50 ? '…' : ''
          }`,
          date: getTimeAgo(new Date(report.created_at)),
          status: report.status === 'Resolved' ? 'resolved' : 'pending',
        }));
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback mock data already set as initial state
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────────

  const resolvedPercentage =
    stats.totalReports > 0
      ? Math.round((stats.resolvedReports / stats.totalReports) * 100)
      : 0;

  const inProgressReports = Math.max(
    0,
    stats.totalReports - stats.resolvedReports - stats.pendingReports - stats.criticalReports
  );

  // ── Chart data objects ──────────────────────────────────────────────────────

  const lineChartData = {
    labels: monthlyData.map((d) => d.month),
    datasets: [
      {
        label: 'Reports Submitted',
        data: monthlyData.map((d) => d.count),
        fill: true,
        tension: 0.45,
        borderColor: 'rgba(20, 184, 166, 1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(34, 211, 238, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(20,184,166,0.15)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(20, 184, 166, 0.45)');
          gradient.addColorStop(0.6, 'rgba(34, 211, 238, 0.12)');
          gradient.addColorStop(1, 'rgba(20, 184, 166, 0.02)');
          return gradient;
        },
      },
    ],
  };

  const lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: darkLegendOpts,
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.92)',
        titleColor: '#94e8d8',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(20,184,166,0.4)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: darkGridOpts,
        ticks: darkTickOpts,
        border: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        grid: darkGridOpts,
        ticks: { ...darkTickOpts, stepSize: 1 },
        border: { color: 'rgba(255,255,255,0.1)' },
        beginAtZero: true,
      },
    },
    animation: { duration: 900, easing: 'easeInOutQuart' },
  };

  const doughnutData = {
    labels: categoryData.map((d) => d.category),
    datasets: [
      {
        data: categoryData.map((d) => d.count),
        backgroundColor: DOUGHNUT_COLORS.slice(0, categoryData.length),
        borderColor: DOUGHNUT_BORDERS.slice(0, categoryData.length),
        borderWidth: 2,
        hoverOffset: 12,
      },
    ],
  };

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'right' as const,
        ...darkLegendOpts,
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.92)',
        titleColor: '#94e8d8',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(20,184,166,0.4)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    animation: { animateRotate: true, duration: 900 },
  };

  const barChartData = {
    labels: ['Resolved', 'In Progress', 'Pending', 'Critical'],
    datasets: [
      {
        label: 'Reports',
        data: [
          stats.resolvedReports,
          inProgressReports,
          stats.pendingReports,
          stats.criticalReports,
        ],
        backgroundColor: [
          'rgba(20, 184, 166, 0.75)',
          'rgba(34, 211, 238, 0.75)',
          'rgba(251, 191, 36, 0.75)',
          'rgba(248, 113, 113, 0.75)',
        ],
        borderColor: [
          'rgba(20, 184, 166, 1)',
          'rgba(34, 211, 238, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(248, 113, 113, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.92)',
        titleColor: '#94e8d8',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(20,184,166,0.4)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: darkTickOpts,
        border: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        grid: darkGridOpts,
        ticks: { ...darkTickOpts, stepSize: 1 },
        border: { color: 'rgba(255,255,255,0.1)' },
        beginAtZero: true,
      },
    },
    animation: { duration: 900, easing: 'easeInOutQuart' },
  };

  const radarChartData = {
    labels: ['Reports', 'Speed', 'Accuracy', 'Community', 'Impact', 'Resolved'],
    datasets: [
      {
        label: 'Your Contribution',
        data: [
          Math.min(100, stats.totalReports * 8),
          72,
          Math.min(100, stats.safetyContribution),
          65,
          Math.min(100, stats.impactScore),
          resolvedPercentage,
        ],
        backgroundColor: 'rgba(20, 184, 166, 0.2)',
        borderColor: 'rgba(20, 184, 166, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(34, 211, 238, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const radarChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: darkLegendOpts,
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.92)',
        titleColor: '#94e8d8',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(20,184,166,0.4)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        backgroundColor: 'rgba(20, 184, 166, 0.04)',
        grid: { color: 'rgba(255,255,255,0.1)' },
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: {
          color: 'rgba(209,213,219,0.9)',
          font: { size: 12, weight: '600' as const },
        },
        ticks: {
          color: 'rgba(209,213,219,0.5)',
          font: { size: 9 },
          backdropColor: 'transparent',
          stepSize: 25,
        },
      },
    },
    animation: { duration: 900 },
  };

  // ── Glass card class helper ────────────────────────────────────────────────

  const glassCard = 'bg-white/5 backdrop-blur-sm border border-teal-800/40 rounded-2xl';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-teal-950 to-gray-900 pb-24">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-teal-800/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/map')}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-gray-300">arrow_back</span>
              </button>
              <div>
                <h1 className="text-3xl font-black font-display">
                  <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    Your Stats
                  </span>
                </h1>
                <p className="text-sm text-gray-400 font-medium">Track your safety contributions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-full shadow-lg">
              <span className="material-symbols-outlined text-lg">emoji_events</span>
              <span className="font-bold">Level {Math.floor(stats.impactScore / 20)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400 font-semibold">Loading your stats…</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Global Stats Summary Row ─────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: 'public', label: 'Global Issues', value: '150+', color: 'from-teal-500 to-cyan-500' },
                { icon: 'flag', label: 'Countries', value: '12+', color: 'from-indigo-500 to-purple-500' },
                { icon: 'engineering', label: 'Engineers', value: '10+', color: 'from-orange-500 to-amber-500' },
              ].map((item) => (
                <div key={item.label} className={`${glassCard} p-4 flex flex-col items-center text-center gap-2`}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {item.icon}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-white">{item.value}</p>
                  <p className="text-xs text-gray-400 font-semibold">{item.label}</p>
                </div>
              ))}
            </div>

            {/* ── Impact Score Hero Card ───────────────────────────────── */}
            <div className="bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-700 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-cyan-100 font-semibold mb-2 font-display">Your Impact Score</p>
                    <h2 className="text-7xl font-black font-display">{stats.impactScore}</h2>
                  </div>
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      shield
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Reports', value: stats.totalReports },
                    { label: 'Resolved', value: stats.resolvedReports },
                    { label: 'Upvotes', value: stats.upvotesReceived },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                      <p className="text-cyan-100 text-sm font-semibold mb-1">{item.label}</p>
                      <p className="text-3xl font-black">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── KPI Grid ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                {
                  icon: 'pending',
                  gradient: 'from-orange-500 to-amber-600',
                  value: stats.pendingReports,
                  label: 'Pending Reports',
                  sub: 'Awaiting review',
                },
                {
                  icon: 'error',
                  gradient: 'from-red-500 to-rose-600',
                  value: stats.criticalReports,
                  label: 'Critical Reports',
                  sub: 'High priority',
                },
                {
                  icon: 'route',
                  gradient: 'from-cyan-500 to-teal-600',
                  value: stats.routesSaved,
                  label: 'Routes Saved',
                  sub: 'Safe paths',
                },
                {
                  icon: 'verified',
                  gradient: 'from-green-500 to-emerald-600',
                  value: `${stats.safetyContribution}%`,
                  label: 'Safety Score',
                  sub: 'Community impact',
                },
              ].map((card) => (
                <div key={card.label} className={`${glassCard} p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {card.icon}
                      </span>
                    </div>
                    <span className="text-3xl font-black text-white">{card.value}</span>
                  </div>
                  <p className="text-gray-200 font-bold text-sm">{card.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Charts Row 1: Line + Doughnut ────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              {/* Monthly Reports Trend – Line */}
              <div className={`${glassCard} p-6`}>
                <div className="flex items-center gap-2 mb-5">
                  <span className="material-symbols-outlined text-teal-400">trending_up</span>
                  <h3 className="text-lg font-bold text-white">Monthly Reports Trend</h3>
                </div>
                <div style={{ height: 220 }}>
                  <Line
                    data={lineChartData}
                    options={lineChartOptions}
                    ref={lineCanvasRef as any}
                  />
                </div>
              </div>

              {/* Issue Category Breakdown – Doughnut */}
              <div className={`${glassCard} p-6`}>
                <div className="flex items-center gap-2 mb-5">
                  <span className="material-symbols-outlined text-cyan-400">donut_large</span>
                  <h3 className="text-lg font-bold text-white">Issue Category Breakdown</h3>
                </div>
                <div style={{ height: 220 }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              </div>
            </div>

            {/* ── Charts Row 2: Bar + Radar ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

              {/* Report Status Distribution – Bar */}
              <div className={`${glassCard} p-6`}>
                <div className="flex items-center gap-2 mb-5">
                  <span className="material-symbols-outlined text-amber-400">bar_chart</span>
                  <h3 className="text-lg font-bold text-white">Report Status Distribution</h3>
                </div>
                <div style={{ height: 220 }}>
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </div>

              {/* Safety Contribution Radar */}
              <div className={`${glassCard} p-6`}>
                <div className="flex items-center gap-2 mb-5">
                  <span className="material-symbols-outlined text-indigo-400">radar</span>
                  <h3 className="text-lg font-bold text-white">Safety Contribution Radar</h3>
                </div>
                <div style={{ height: 220 }}>
                  <Radar data={radarChartData} options={radarChartOptions} />
                </div>
              </div>
            </div>

            {/* ── Resolution Progress Bar ──────────────────────────────── */}
            <div className={`${glassCard} p-6 mb-8`}>
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-teal-400">analytics</span>
                <h3 className="text-lg font-bold text-white">Report Resolution Progress</h3>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-300">
                    Resolved: {stats.resolvedReports}/{stats.totalReports}
                  </span>
                  <span className="text-sm font-bold text-teal-400">{resolvedPercentage}%</span>
                </div>
                <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-700"
                    style={{ width: `${resolvedPercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { value: stats.resolvedReports, label: 'Resolved', color: 'text-teal-400', bg: 'bg-teal-500/10 border border-teal-700/40' },
                  { value: stats.pendingReports, label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/10 border border-amber-700/40' },
                  { value: stats.criticalReports, label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10 border border-red-700/40' },
                ].map((item) => (
                  <div key={item.label} className={`text-center p-4 ${item.bg} rounded-xl`}>
                    <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-gray-400 font-bold mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Recent Activity ──────────────────────────────────────── */}
            <div className={`${glassCard} p-6`}>
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-orange-400">history</span>
                <h3 className="text-lg font-bold text-white">Recent Activity</h3>
              </div>

              {recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-gray-500 text-4xl">history</span>
                  </div>
                  <p className="text-gray-400 font-semibold mb-2">No activity yet</p>
                  <p className="text-sm text-gray-500">Your recent reports will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-teal-800/30 hover:border-teal-600/50 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          activity.status === 'resolved'
                            ? 'bg-teal-500/20'
                            : activity.status === 'pending'
                            ? 'bg-amber-500/20'
                            : activity.status === 'saved'
                            ? 'bg-cyan-500/20'
                            : 'bg-purple-500/20'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined ${
                            activity.status === 'resolved'
                              ? 'text-teal-400'
                              : activity.status === 'pending'
                              ? 'text-amber-400'
                              : activity.status === 'saved'
                              ? 'text-cyan-400'
                              : 'text-purple-400'
                          }`}
                        >
                          {activity.status === 'resolved'
                            ? 'check_circle'
                            : activity.status === 'pending'
                            ? 'pending'
                            : activity.status === 'saved'
                            ? 'bookmark'
                            : 'thumb_up'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white">{activity.action}</p>
                        <p className="text-sm text-gray-400">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── Bottom Navigation ─────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl shadow-2xl rounded-t-3xl border-t border-teal-800/40 z-50">
        <div className="flex justify-around items-center px-6 py-4">
          <button
            onClick={() => navigate('/map')}
            className="flex flex-col items-center text-gray-500 px-5 py-2 hover:bg-white/10 rounded-2xl transition-all"
          >
            <span className="material-symbols-outlined">map</span>
            <span className="text-xs font-bold mt-1">Map</span>
          </button>
          <button
            onClick={() => navigate('/alerts')}
            className="flex flex-col items-center text-gray-500 px-5 py-2 hover:bg-white/10 rounded-2xl transition-all"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="text-xs font-bold mt-1">Alerts</span>
          </button>
          <button
            onClick={() => navigate('/stats')}
            className="flex flex-col items-center bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl px-5 py-2 shadow-lg"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              analytics
            </span>
            <span className="text-xs font-bold mt-1">Stats</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center text-gray-500 px-5 py-2 hover:bg-white/10 rounded-2xl transition-all"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-xs font-bold mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default StatsPage;
