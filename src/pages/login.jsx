import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authUtils } from "../services/supabaseClient";
import LoadingButton from "../components/LoadingButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [timeoutPhase, setTimeoutPhase] = useState(null);
  const navigate = useNavigate();

  // Check connection status on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const isOnline = await authUtils.checkConnection();
      setConnectionStatus(isOnline ? "online" : "offline");
    };
    checkConnection();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeoutPhase(null);

    try {
      // Check connection before attempting login
      const isConnected = await authUtils.checkConnection();
      if (!isConnected) {
        setConnectionStatus("offline");
        setTimeoutPhase("connection_failed");

        // Auto-refresh after showing offline message
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        return;
      }

      setConnectionStatus("online");
      setTimeoutPhase("authenticating");

      // Use enhanced login with timeout
      const { data, error } = await authUtils.signInWithTimeout(
        email,
        password
      );

      if (error) {
        if (error.message === "Login timeout") {
          setTimeoutPhase("login_timeout");

          // Auto-refresh after 2 seconds
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          return;
        }

        // For other errors, also refresh instead of showing red text
        setTimeoutPhase("login_failed");
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        return;
      }

      if (!data?.user) {
        setTimeoutPhase("login_failed");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }

      setTimeoutPhase("fetching_profile");

      // Fetch user role for redirect with timeout protection
      const { data: profile, error: profileError } =
        await authUtils.fetchProfileWithTimeout(data.user.id);

      if (profileError) {
        if (profileError.message === "Profile fetch timeout") {
          setTimeoutPhase("profile_timeout");
        } else {
          setTimeoutPhase("profile_failed");
        }

        // Auto-refresh after showing error
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }

      // Successful login - redirect based on role
      switch (profile.role) {
        case "admin":
          navigate("/admin");
          break;
        case "teacher":
          navigate("/teacher");
          break;
        case "student":
          navigate("/student");
          break;
        default:
          setTimeoutPhase("invalid_role");
          setTimeout(() => {
            window.location.reload();
          }, 3000);
      }
    } catch (error) {
      console.error("Login error:", error);
      setTimeoutPhase("unexpected_error");

      // Auto-refresh even on unexpected errors
      setTimeout(() => {
        window.location.reload();
      }, 2000);
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

        {/* Enhanced status display instead of error messages */}
        {(connectionStatus === "offline" || timeoutPhase) && (
          <div
            style={{
              background:
                connectionStatus === "offline"
                  ? "rgba(255, 165, 0, 0.2)"
                  : timeoutPhase?.includes("timeout") ||
                    timeoutPhase?.includes("failed")
                  ? "rgba(255, 0, 0, 0.2)"
                  : "rgba(0, 123, 255, 0.2)",
              color: "white",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "20px",
              textAlign: "center",
              fontSize: "14px",
              lineHeight: "1.4",
            }}
          >
            {connectionStatus === "offline" &&
              "⚠️ Connection issues detected. Refreshing page..."}
            {timeoutPhase === "authenticating" && "🔐 Signing you in..."}
            {timeoutPhase === "fetching_profile" &&
              "👤 Loading your profile..."}
            {timeoutPhase === "login_timeout" &&
              "⏰ Login took too long. Refreshing to try again..."}
            {timeoutPhase === "profile_timeout" &&
              "⏰ Profile loading timeout. Refreshing page..."}
            {timeoutPhase === "connection_failed" &&
              "🌐 Network connection lost. Refreshing page..."}
            {(timeoutPhase === "login_failed" ||
              timeoutPhase === "profile_failed") &&
              "❌ Login failed. Refreshing to try again..."}
            {timeoutPhase === "invalid_role" &&
              "⚠️ Account configuration issue. Please contact support. Refreshing..."}
            {timeoutPhase === "unexpected_error" &&
              "🔧 Technical issue occurred. Refreshing page..."}
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

          <LoadingButton
            type="submit"
            loading={loading}
            loadingText="Logging in..."
            variant="primary"
            size="large"
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.9)",
              color: "#333",
              fontSize: "16px",
              borderRadius: "10px",
            }}
          >
            Login
          </LoadingButton>
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
