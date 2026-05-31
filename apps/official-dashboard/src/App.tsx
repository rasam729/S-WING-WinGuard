import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ViosaChatbot from './components/ViosaChatbot';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StatsPage from './pages/StatsPage';
import ReportsPage from './pages/ReportsPage';
import IssuesPage from './pages/IssuesPage';
import SimulationsPage from './pages/SimulationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BudgetPage from './pages/BudgetPage';
import ContractorsPage from './pages/ContractorsPage';
import MaintenancePage from './pages/MaintenancePage';
import EngineersPage from './pages/EngineersPage';
import RoadInfoPage from './pages/RoadInfoPage';
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
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/contractors" element={<ContractorsPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/engineers" element={<EngineersPage />} />
          <Route path="/road-info" element={<RoadInfoPage />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
      <ViosaChatbot />
    </Router>
  );
}

export default App;
