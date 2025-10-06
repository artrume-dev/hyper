import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      await loadUser();
      setChecking(false);
    };
    checkAuth();
  }, [loadUser]);

  if (checking || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
