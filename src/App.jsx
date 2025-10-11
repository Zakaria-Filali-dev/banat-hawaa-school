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
import { useEffect, useState } from "react";
import { supabase, authUtils } from "./services/supabaseClient";

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
              marginRight: "1rem",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 12px 24px rgba(102, 126, 234, 0.3)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            Return to Login
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "transparent",
              color: "#6b7280",
              border: "2px solid #e5e7eb",
              padding: "1rem 2rem",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = "#9ca3af";
              e.target.style.color = "#374151";
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.color = "#6b7280";
            }}
          >
            Retry
          </button>
        </div>
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "#f8fafc",
            borderRadius: "12px",
          }}
        >
          <p
            style={{
              color: "#6b7280",
              fontSize: "0.85rem",
              margin: "0",
              lineHeight: "1.5",
            }}
          >
            <strong>💡 What happened?</strong>
            <br />
            Your account may have been deleted or modified by an administrator
            while you were logged in. Please contact support if you believe this
            is an error.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileRetryCount, setProfileRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    let isMounted = true;

    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set up auth state listener for real-time session monitoring
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        // User was logged out (possibly by admin action)
        setUser(null);
        setRole(null);
        setError("Your session has ended. Please log in again.");
        return;
      }

      if (event === "SIGNED_IN" && session) {
        // User signed in, verify their profile still exists with timeout protection
        try {
          const { data: profile, error: profileError } =
            await authUtils.fetchProfileWithTimeout(session.user.id, 10000);

          if (profileError) {
            if (profileError.message === "Profile fetch timeout") {
              // Don't log out on timeout, just show offline message
              console.warn(
                "[AuthContext] Profile fetch timeout during auth state change"
              );
              return;
            }

            if (profileError.code === "PGRST116") {
              setError("Your account has been removed by an administrator.");
              await supabase.auth.signOut();
              return;
            }
          }

          if (profile?.role) {
            setUser(session.user);
            setRole(profile.role);
            setError(null);
            setProfileRetryCount(0);
          }
        } catch (err) {
          console.error("[AuthContext] Profile verification error:", err);
          // Don't set error state for timeouts during auth state changes
        }
      }
    });

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

        // Fetch role from profiles table with timeout protection and retry logic
        try {
          const { data: profile, error: profileError } =
            await authUtils.fetchProfileWithTimeout(data.user.id, 12000);

          if (profileError) {
            if (profileError.message === "Profile fetch timeout") {
              console.warn(
                "[AuthContext] Unexpected error during profile fetch: Error: Profile fetch timeout"
              );

              // Run diagnostics in development mode
              // Retry logic for timeouts (up to 2 times)
              if (profileRetryCount < 2 && isMounted) {
                setProfileRetryCount((prev) => prev + 1);
                console.log(
                  `🔄 [Auth] Retrying profile fetch (attempt ${
                    profileRetryCount + 1
                  }/2)`
                );
                // Retry after a short delay
                setTimeout(() => {
                  if (isMounted) {
                    getUser();
                    setLoading(false);
                  }
                }, 2000);
                return;
              }

              // After max retries, continue with cached user but show offline indicator
              if (isMounted) {
                setLoading(false);
                // Don't set error - let user continue with existing session
                return;
              }
            }

            // Check if profile doesn't exist (account deleted)
            if (
              profileError.code === "PGRST116" ||
              profileError.message?.includes("No rows found")
            ) {
              if (isMounted)
                setError("Your account has been removed by an administrator.");
            } else {
              throw profileError;
            }
            return;
          }

          if (!profile?.role) {
            if (isMounted) setError("Your account access has been revoked.");
            return;
          }

          if (isMounted) {
            setRole(profile.role);
            setProfileRetryCount(0);
          }
        } catch (profileErr) {
          console.error(
            "[AuthContext] Profile fetch error during getUser:",
            profileErr
          );

          // For profile fetch timeout, don't set error state if we have an existing user session
          if (profileErr.message === "Profile fetch timeout" && data?.user) {
            console.warn(
              "[AuthContext] Profile fetch timeout, maintaining existing session"
            );
            if (isMounted) setLoading(false);
            return;
          }

          // For other profile errors, handle normally
          if (isMounted)
            setError(
              "Profile verification failed. Please try logging in again."
            );
          return;
        }
      } catch (err) {
        if (isMounted) {
          // Provide specific error messages based on the error
          if (err.message?.includes("JWT") || err.message?.includes("token")) {
            setError("Your session has expired. Please log in again.");
          } else if (
            err.message?.includes("network") ||
            err.message?.includes("fetch")
          ) {
            setError(
              "Network connection error. Please check your connection and try again."
            );
          } else {
            setError("Authentication error. Please try again.");
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    getUser();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [profileRetryCount]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
        <div>Loading your account...</div>
        {!isOnline && (
          <div
            style={{
              marginTop: "1rem",
              padding: "10px 20px",
              background: "rgba(255, 165, 0, 0.2)",
              borderRadius: "8px",
              fontSize: "0.9rem",
            }}
          >
            🌐 You appear to be offline
          </div>
        )}
      </div>
    );
  }

  if (error) return <AuthErrorHandler error={error} />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  // Show offline indicator if user is authenticated but offline
  return (
    <div>
      {!isOnline && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            background: "rgba(255, 165, 0, 0.9)",
            color: "white",
            textAlign: "center",
            padding: "8px",
            fontSize: "14px",
            zIndex: 1000,
          }}
        >
          🌐 You're currently offline. Some features may not work properly.
        </div>
      )}
      <div style={{ paddingTop: !isOnline ? "40px" : "0" }}>{children}</div>
    </div>
  );
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
        <Route path="/" element={<Landing />} />
        {/* 404 fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
