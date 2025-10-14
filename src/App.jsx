import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Register from "./pages/register.jsx";
import Login from "./pages/login.jsx";
import Landing from "./pages/auth/Landing.jsx";
import Admins from "./pages/admin/admin.jsx";
import Students from "./pages/student/students.jsx";
import Teachers from "./pages/teacher/teacherDash.jsx";
import Confirm from "./pages/auth/Confirm.jsx";
import AuthCallback from "./pages/auth/AuthCallback.jsx";
import SetPassword from "./pages/auth/set-password.jsx";
import { useEffect, useState } from "react";
import { supabase, authUtils } from "./services/supabaseClient";
import GlobalNav from "./components/GlobalNav.jsx";

// App.jsx - Main application component with routing
// Auth Error Handler Component
function AuthErrorHandler({ error }) {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
      // Force redirect even if logout fails
      window.location.href = "/login";
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "3rem",
          boxShadow: "0 32px 64px rgba(0, 0, 0, 0.15)",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
        <h1
          style={{
            color: "#dc2626",
            fontSize: "1.5rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}
        >
          Account Access Error
        </h1>
        <p
          style={{
            color: "#374151",
            marginBottom: "2rem",
            lineHeight: "1.6",
            fontSize: "1.1rem",
          }}
        >
          Your account session has been invalidated. This may happen if your
          account was modified or removed by an administrator.
        </p>
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "2rem",
          }}
        >
          <p
            style={{
              color: "#dc2626",
              margin: "0",
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
          >
            {error}
          </p>
        </div>
        <div>
          <button
            onClick={handleLogout}
            style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              border: "none",
              padding: "1rem 2rem",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
            }}
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children, role, userRole }) {
  if (!userRole) {
    return <Navigate to="/login" />;
  }

  if (role && userRole !== role) {
    // Optional: show an 'unauthorized' page or redirect to a default page
    return <Navigate to="/" />;
  }

  return children;
}

const AppContent = () => {
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      setAuthError(null);
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw new Error(`Supabase session error: ${error.message}`);

        if (session?.user) {
          const role = await authUtils.getUserRole(session.user.id);
          setUserRole(role);
        } else {
          setUserRole(null);
        }
      } catch (err) {
        console.error("Authentication error:", err);
        setAuthError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  if (authError) {
    return <AuthErrorHandler error={authError} />;
  }

  const showNavBar =
    !["/", "/login", "/register", "/confirm-email", "/set-password"].includes(
      location.pathname
    ) && !location.pathname.startsWith("/auth/callback");

  return (
    <>
      {showNavBar && <GlobalNav />}
      <main style={{ paddingTop: showNavBar ? "60px" : "0" }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/confirm-email" element={<Confirm />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/set-password" element={<SetPassword />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin" userRole={userRole}>
                <Admins />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute role="student" userRole={userRole}>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <ProtectedRoute role="teacher" userRole={userRole}>
                <Teachers />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
