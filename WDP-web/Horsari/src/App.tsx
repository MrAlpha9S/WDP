import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import ProtectedRoute from "./ProtectedRoute";
import NavBar from "./components/NavBar";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import RefereeDashboardPage from "./pages/Referee/Index";
import RaceMonitorPage from "./pages/Referee/RaceMonitorIndex";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

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



          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}