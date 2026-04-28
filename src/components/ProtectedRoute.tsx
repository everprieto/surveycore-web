import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredPermission, requiredRole }: ProtectedRouteProps) {
  const token = useAuthStore((s) => s.token);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasRole = useAuthStore((s) => s.hasRole);

  if (!token) return <Navigate to="/login" replace />;

  if (requiredPermission && !hasPermission(requiredPermission))
    return <Navigate to="/unauthorized" replace />;

  if (requiredRole && !hasRole(requiredRole))
    return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
