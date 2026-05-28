import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StatsPage from './pages/StatsPage';
import ReportsPage from './pages/ReportsPage';
import IssuesPage from './pages/IssuesPage';
import SimulationsPage from './pages/SimulationsPage';
import SafetyScoreDashboardEnhanced from './components/SafetyScoreDashboardEnhanced';
import AnalyticsPage from './pages/AnalyticsPage';
import BudgetPage from './pages/BudgetPage';
import ContractorsPage from './pages/ContractorsPage';
import MaintenancePage from './pages/MaintenancePage';
import EngineersPage from './pages/EngineersPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
        />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/simulations" element={<SimulationsPage />} />
          <Route path="/safety-scores" element={<SafetyScoreDashboardEnhanced />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/contractors" element={<ContractorsPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/engineers" element={<EngineersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
