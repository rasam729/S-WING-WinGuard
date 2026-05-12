import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Ensure user is an official
  if (user?.role !== 'official') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
