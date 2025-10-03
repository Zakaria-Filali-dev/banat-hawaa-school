import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import "./set-password.css";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  });
  const navigate = useNavigate();

  // Password strength checker
  const checkPasswordStrength = (pass) => {
    const feedback = [];
    let score = 0;

    if (pass.length >= 8) {
      score += 1;
    } else {
      feedback.push("At least 8 characters");
    }

    if (/[A-Z]/.test(pass)) {
      score += 1;
    } else {
      feedback.push("At least one uppercase letter");
    }

    if (/[a-z]/.test(pass)) {
      score += 1;
    } else {
      feedback.push("At least one lowercase letter");
    }

    if (/[0-9]/.test(pass)) {
      score += 1;
    } else {
      feedback.push("At least one number");
    }

    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass)) {
      score += 1;
    } else {
      feedback.push("At least one special character");
    }

    return { score, feedback };
  };

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      const strength = checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [password]);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        navigate("/login");
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validation checks
    if (!password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (passwordStrength.score < 4) {
      setError("Password does not meet security requirements");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch {
      setError("Unexpected error. Please try again.");
    }
    setLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="set-password-wrapper">
        <div className="set-password-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Verifying your session...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStrengthColor = () => {
    if (passwordStrength.score <= 2) return "#ef4444";
    if (passwordStrength.score <= 3) return "#f59e0b";
    return "#10b981";
  };

  const getStrengthText = () => {
    if (passwordStrength.score <= 2) return "Weak";
    if (passwordStrength.score <= 3) return "Medium";
    return "Strong";
  };

  return (
    <div className="set-password-wrapper">
      <div className="set-password-container">
        <div className="set-password-header">
          <div className="logo-section">
            <div className="logo-icon">🔐</div>
            <h1>Secure Your Account</h1>
          </div>
          <p className="subtitle">
            Create a strong password to protect your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="set-password-form">
          <div className="form-section">
            <h3>Password Requirements</h3>
            <div className="requirements-list">
              <div
                className={`requirement ${password.length >= 8 ? "met" : ""}`}
              >
                <span className="check-icon">
                  {password.length >= 8 ? "✓" : "○"}
                </span>
                At least 8 characters
              </div>
              <div
                className={`requirement ${/[A-Z]/.test(password) ? "met" : ""}`}
              >
                <span className="check-icon">
                  {/[A-Z]/.test(password) ? "✓" : "○"}
                </span>
                One uppercase letter
              </div>
              <div
                className={`requirement ${/[a-z]/.test(password) ? "met" : ""}`}
              >
                <span className="check-icon">
                  {/[a-z]/.test(password) ? "✓" : "○"}
                </span>
                One lowercase letter
              </div>
              <div
                className={`requirement ${/[0-9]/.test(password) ? "met" : ""}`}
              >
                <span className="check-icon">
                  {/[0-9]/.test(password) ? "✓" : "○"}
                </span>
                One number
              </div>
              <div
                className={`requirement ${
                  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
                    ? "met"
                    : ""
                }`}
              >
                <span className="check-icon">
                  {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
                    ? "✓"
                    : "○"}
                </span>
                One special character
              </div>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">New Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={
                  password
                    ? passwordStrength.score >= 4
                      ? "valid"
                      : "invalid"
                    : ""
                }
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {password && (
              <div className="strength-meter">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: getStrengthColor(),
                    }}
                  ></div>
                </div>
                <span
                  className="strength-text"
                  style={{ color: getStrengthColor() }}
                >
                  {getStrengthText()}
                </span>
              </div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={
                  confirmPassword
                    ? password === confirmPassword
                      ? "valid"
                      : "invalid"
                    : ""
                }
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <div className="error-message">Passwords do not match</div>
            )}
          </div>

          <button
            type="submit"
            className={`submit-btn ${loading ? "loading" : ""}`}
            disabled={
              loading ||
              passwordStrength.score < 4 ||
              password !== confirmPassword
            }
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                Setting Password...
              </>
            ) : (
              "Set Password & Continue"
            )}
          </button>
        </form>

        {error && (
          <div className="message error-message-box">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="message success-message-box">
            <span className="success-icon">✅</span>
            Password set successfully! Redirecting to login...
          </div>
        )}

        <div className="security-tips">
          <h4>💡 Security Tips</h4>
          <ul>
            <li>Use a unique password you haven't used elsewhere</li>
            <li>Consider using a passphrase with multiple words</li>
            <li>Never share your password with anyone</li>
            <li>Use a password manager for better security</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
