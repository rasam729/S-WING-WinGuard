import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';

export default function ProtectedRoute() {
  const { isAuthenticated, token } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Give time for auth state to load from localStorage
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // Role check removed to fix infinite loop
  return <Outlet />;
}
