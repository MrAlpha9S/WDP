import { Navigate } from "react-router-dom";
import { useAuth } from "./providers/AuthProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Still reading localStorage — render nothing to avoid flash
  if (isLoading) return null;

  // Not authenticated → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user.role || !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}