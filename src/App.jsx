import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/register.jsx";
import Login from "./pages/login.jsx";
import Landing from "./pages/auth/Landing.jsx";
import Admins from "./pages/admin/admin.jsx";
import Students from "./pages/student/students.jsx";
import Teachers from "./pages/teacher/teacherDash.jsx";
import Confirm from "./pages/auth/Confirm.jsx";
import AuthCallback from "./pages/auth/AuthCallback.jsx";
import SetPassword from "./pages/auth/set-password.jsx";
import SetupPassword from "./pages/setup-password.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import ErrorMessage from "./components/ErrorMessage.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { useAuth } from "./hooks/useAuth.js";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading, error } = useAuth();

  if (loading) return <LoadingSpinner message="Verifying access..." />;
  if (error)
    return (
      <ErrorMessage message={error} onRetry={() => window.location.reload()} />
    );
  if (!user || !profile) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Admins />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Students />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <Teachers />
          </ProtectedRoute>
        }
      />
      <Route path="/auth/confirm" element={<Confirm />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/set-password" element={<SetPassword />} />
      <Route path="/setup-password" element={<SetupPassword />} />
      <Route path="/" element={<Landing />} />
      {/* 404 fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
