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
import { useEffect, useState } from "react";
import { supabase } from "./services/supabaseClient";

function ProtectedRoute({ children, allowedRoles }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const getUser = async () => {
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!data?.user) {
          if (isMounted) {
            setUser(null);
            setRole(null);
            setLoading(false);
          }
          return;
        }
        if (isMounted) setUser(data.user);
        // Fetch role from profiles table using user ID for more reliable lookup
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        if (profileError) throw profileError;
        if (isMounted) setRole(profile?.role);
      } catch {
        if (isMounted) setError("Authentication error. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    getUser();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
