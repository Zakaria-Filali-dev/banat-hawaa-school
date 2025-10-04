import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../services/authService";

export default function Login() {
  console.log("🎯 LOGIN COMPONENT LOADED");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  // Enterprise-grade redirect handling
  useEffect(() => {
    console.log("🔍 Auth state check:", {
      user: !!user,
      profile: !!profile,
      authLoading,
    });

    // Only redirect if auth is fully loaded and user is authenticated
    if (!authLoading && user && profile) {
      console.log(
        "✅ User authenticated, redirecting based on role:",
        profile.role
      );
      setLoading(false); // Clear login loading state

      const redirectPath = {
        admin: "/admin",
        teacher: "/teacher",
        student: "/student",
      }[profile.role];

      if (redirectPath) {
        console.log(`🚀 Redirecting to ${redirectPath}`);
        navigate(redirectPath, { replace: true });
      } else {
        console.error("❌ Invalid role:", profile.role);
        setErrorMsg(`Invalid user role: ${profile.role}`);
        setLoading(false);
      }
    }
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (e) => {
    console.log("🚀 ENTERPRISE LOGIN - Starting authentication");
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      console.log("� Calling Supabase authentication...");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      console.log("📡 Auth response:", {
        success: !error,
        hasUser: !!data?.user,
      });

      if (error) {
        console.log("❌ Authentication failed:", error.message);
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        console.log("❌ No user data returned");
        setErrorMsg("Authentication failed. Please try again.");
        setLoading(false);
        return;
      }

      console.log(
        "✅ Authentication successful - waiting for auth service to process..."
      );
      // Don't set loading to false here - let useEffect handle redirect
      // The AuthService will update state and trigger the useEffect redirect
    } catch (error) {
      console.error("💥 Unexpected login error:", error);
      setErrorMsg("Unexpected error occurred. Please try again.");
      setLoading(false);
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
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "40px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "white",
            marginBottom: "30px",
            fontSize: "2rem",
          }}
        >
          Tutoring School Portal
        </h1>

        {errorMsg && (
          <div
            style={{
              background: "rgba(255, 0, 0, 0.2)",
              color: "white",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "10px",
                border: "none",
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                fontSize: "16px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "10px",
                border: "none",
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                fontSize: "16px",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "10px",
              border: "none",
              background: loading
                ? "rgba(255, 255, 255, 0.3)"
                : "rgba(255, 255, 255, 0.8)",
              color: "#333",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <a
            href="/register"
            style={{
              color: "white",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            Register New Student
          </a>
        </div>
      </div>
    </div>
  );
}
