import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authUtils } from "../services/supabaseClient";
import LoadingButton from "../components/LoadingButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [timeoutPhase, setTimeoutPhase] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeoutPhase(null);
    setError(null);

    try {
      setTimeoutPhase("authenticating");

      // Direct login without pre-connection check (optimized performance)
      const { data, error } = await authUtils.signInWithTimeout(
        email,
        password
      );

      if (error) {
        if (error.message === "Login timeout") {
          setTimeoutPhase("login_timeout");
          setError({
            type: "timeout",
            message:
              "Login is taking longer than expected. This might be due to network issues.",
            action: "retry",
          });
        } else {
          setTimeoutPhase("login_failed");
          setError({
            type: "auth_error",
            message:
              error.message || "Login failed. Please check your credentials.",
            action: "retry",
          });
        }
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setTimeoutPhase("login_failed");
        setError({
          type: "no_user",
          message: "Authentication failed. Please try again.",
          action: "retry",
        });
        setLoading(false);
        return;
      }

      setTimeoutPhase("fetching_profile");

      // Fetch user role for redirect with optimized timeout
      const { data: profile, error: profileError } =
        await authUtils.fetchProfileWithTimeout(data.user.id);

      if (profileError) {
        if (profileError.message === "Profile fetch timeout") {
          setTimeoutPhase("profile_timeout");
          setError({
            type: "profile_timeout",
            message:
              "Loading user information is taking too long. Please try again.",
            action: "retry",
          });
        } else {
          setTimeoutPhase("profile_failed");
          setError({
            type: "profile_error",
            message: "Failed to load user information. Please try again.",
            action: "retry",
          });
        }
        setLoading(false);
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
          setError({
            type: "invalid_role",
            message: "Account configuration issue. Please contact support.",
            action: "contact_support",
          });
          setLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setTimeoutPhase("unexpected_error");
      setError({
        type: "unexpected",
        message: "An unexpected error occurred. Please try again.",
        action: "retry",
      });
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
    setTimeoutPhase(null);
    handleLogin({ preventDefault: () => {} }); // Simulate form event
  };

  const handleRefresh = () => {
    window.location.reload();
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

        {/* Simplified loading indicator - errors handled below */}
        {loading && (
          <div
            style={{
              background: "rgba(0, 123, 255, 0.2)",
              color: "white",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "20px",
              textAlign: "center",
              fontSize: "14px",
              lineHeight: "1.4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <div className="loading-spinner"></div>
            {timeoutPhase === "authenticating" && "🔐 Signing you in..."}
            {timeoutPhase === "fetching_profile" &&
              "👤 Loading your profile..."}
            {!timeoutPhase && "Processing login..."}
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

        {/* Enhanced Error Display with Retry Options */}
        {error && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "rgba(239, 68, 68, 0.1)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px",
              color: "white",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
            >
              <div style={{ flexShrink: 0, marginTop: "2px" }}>
                <svg
                  style={{ width: "20px", height: "20px", fill: "#ef4444" }}
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "12px",
                  }}
                >
                  {error.message}
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {error.action === "retry" && (
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      <LoadingButton
                        onClick={handleRetry}
                        variant="secondary"
                        size="small"
                        style={{
                          background: "rgba(255, 255, 255, 0.15)",
                          color: "white",
                          border: "1px solid rgba(255, 255, 255, 0.3)",
                          borderRadius: "6px",
                          fontSize: "12px",
                          padding: "6px 12px",
                        }}
                      >
                        Try Again {retryCount > 0 && `(${retryCount})`}
                      </LoadingButton>
                      <LoadingButton
                        onClick={handleRefresh}
                        variant="secondary"
                        size="small"
                        style={{
                          background: "rgba(255, 255, 255, 0.1)",
                          color: "rgba(255, 255, 255, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "6px",
                          fontSize: "12px",
                          padding: "6px 12px",
                        }}
                      >
                        Refresh Page
                      </LoadingButton>
                    </div>
                  )}
                  {error.action === "contact_support" && (
                    <LoadingButton
                      onClick={handleRefresh}
                      variant="secondary"
                      size="small"
                      style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        color: "white",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: "6px",
                        fontSize: "12px",
                        padding: "6px 12px",
                      }}
                    >
                      Refresh & Contact Support
                    </LoadingButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
