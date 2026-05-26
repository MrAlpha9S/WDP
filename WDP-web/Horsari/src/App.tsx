import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import ProtectedRoute from "./ProtectedRoute";
import NavBar from "./components/NavBar";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import RaceMonitorPage from "./pages/Referee/RefereeLandingPage";
import ViolationManagementPage from "./pages/Referee/ManagementPage";
import InboxPage from "./pages/Referee/InboxPage";

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
            path="/referee/races"
            element={
              <ProtectedRoute>
                <NavBar />
                <RaceMonitorPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/referee/management"
            element={
              <ProtectedRoute>
                <NavBar />
                <ViolationManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/referee/inbox"
            element={
              <ProtectedRoute>
                <NavBar />
                <InboxPage />
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