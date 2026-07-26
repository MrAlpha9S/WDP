import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import { SocketProvider } from "./providers/SocketProvider";
import { ServerUnreachableBanner } from "./components/ServerUnreachableBanner";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import GoogleRegisterPage from "./pages/GoogleRegisterPage";
import RefereeDashboardPage from "./pages/Referee/Index";
import RaceMonitorPage from "./pages/Referee/RaceMonitorIndex";
import AdminDashboardPage from "./pages/Admin/Index";
import DashboardPage from "./pages/horseOwner";
import OwnerRaceMonitorPage from "./pages/horseOwner/RaceMonitorIndex";

// Redirects the user to their role-specific dashboard after login.
function RoleRedirect() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();

  if (role === "admin")      return <Navigate to="/admin"    replace />;
  if (role === "referee")    return <Navigate to="/referee"  replace />;
  if (role === "horseowner") return <Navigate to="/owner"    replace />;

  // spectator or unknown — send to login for now
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
        <ServerUnreachableBanner />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/google-register" element={<GoogleRegisterPage />} />

          {/* Root — redirect to role-specific dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleRedirect />
              </ProtectedRoute>
            }
          />

          <Route
            path="/referee"
            element={
              <ProtectedRoute allowedRoles={["referee", "admin"]}>
                <RefereeDashboardPage />
              </ProtectedRoute>
            } />
          <Route
            path="/referee/race-monitor/:raceRoundId"
            element={
              <ProtectedRoute allowedRoles={["referee", "admin"]}>
                <RaceMonitorPage />
              </ProtectedRoute>
            } />
          <Route
            path="/referee/:tabs"
            element={
              <ProtectedRoute allowedRoles={["referee", "admin"]}>
                <RefereeDashboardPage />
              </ProtectedRoute>
            } />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />

          <Route
            path="/admin/:tabs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />

          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={["horseowner", "admin"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/race-monitor/:raceRoundId"
            element={
              <ProtectedRoute allowedRoles={["horseowner", "admin"]}>
                <OwnerRaceMonitorPage />
              </ProtectedRoute>
            }
          />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}