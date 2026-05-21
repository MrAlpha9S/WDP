import { Navigate } from "react-router-dom";
import { useAuth } from "./providers/AuthProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Still reading localStorage — render nothing to avoid flash
  if (isLoading) return null;

  // Not authenticated → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}