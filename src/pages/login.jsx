import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authUtils } from "../services/supabaseClient";
import LoadingButton from "../components/LoadingButton";
import "./login.css";
import { FiMail, FiLock } from "react-icons/fi";

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

      const { data, error } = await authUtils.signInWithTimeout(
        email,
        password
      );

      if (error) {
        handleLoginError(error);
        return;
      }

      if (!data?.user) {
        throw new Error("Authentication failed. Please try again.");
      }

      setTimeoutPhase("fetching_profile");

      const { data: profile, error: profileError } =
        await authUtils.fetchProfileWithTimeout(data.user.id);

      if (profileError) {
        handleProfileError(profileError);
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
          navigate("/"); // Fallback to home
          break;
      }
    } catch (err) {
      setError({
        type: "generic_error",
        message: err.message || "An unexpected error occurred.",
        action: "retry",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginError = (error) => {
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
  };

  const handleProfileError = (profileError) => {
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
  };

  const handleRetry = () => {
    setRetryCount(retryCount + 1);
    handleLogin(new Event("submit"));
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">
          Sign in to continue your learning journey.
        </p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <FiMail className="input-icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
            />
          </div>

          {error && (
            <div className="error-container">
              <p>{error.message}</p>
            </div>
          )}

          <LoadingButton
            loading={loading}
            onClick={handleLogin}
            timeoutPhase={timeoutPhase}
            error={error}
            retryCount={retryCount}
            onRetry={handleRetry}
          >
            Login
          </LoadingButton>
        </form>

        <p className="register-link">
          Don't have an account?{" "}
          <Link to="/register" className="register-link">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
