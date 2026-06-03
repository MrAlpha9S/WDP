import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import ProtectedRoute from "./ProtectedRoute";
import NavBar from "./components/NavBar";
import LoginPage from "./pages/LoginPage";
import GoogleRegisterPage from "./pages/GoogleRegisterPage";
import HomePage from "./pages/HomePage";
import RefereeDashboardPage from "./pages/Referee/Index";
import RaceMonitorPage from "./pages/Referee/RaceMonitorIndex";
import AdminDashboardPage from "./pages/Admin/Index";
import DashboardPage from "./pages/horseOwner";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/google-register" element={<GoogleRegisterPage />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <NavBar />
                <HomePage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/referee"
            element={
              <ProtectedRoute>
                <RefereeDashboardPage />
              </ProtectedRoute>
            } />
          <Route
            path="/referee/race-monitor" //add id later
            element={
              <ProtectedRoute>
                <RaceMonitorPage />
              </ProtectedRoute>
            } />
          <Route
            path="/referee/:tabs"
            element={
              <ProtectedRoute>
                <RefereeDashboardPage />
              </ProtectedRoute>
            } />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />

          <Route
            path="/admin/:tabs"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />


          <Route
            path="/owner"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />


          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}