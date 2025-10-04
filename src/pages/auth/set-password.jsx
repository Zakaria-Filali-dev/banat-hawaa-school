import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import "./set-password.css";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [capsLockOn, setCapsLockOn] = useState(false);
  const navigate = useNavigate();

  // Enhanced password strength calculation
  const calculatePasswordStrength = (pwd) => {
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      lengthGood: pwd.length >= 12,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      numbers: /\d/.test(pwd),
      symbols: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd),
      noCommon: !/(password|123456|qwerty|admin|login|user)/i.test(pwd),
      noRepeats: !/(.)\1{2,}/.test(pwd),
    };

    // Scoring system
    if (checks.length) score += 1;
    if (checks.lengthGood) score += 1;
    if (checks.uppercase) score += 1;
    if (checks.lowercase) score += 1;
    if (checks.numbers) score += 1;
    if (checks.symbols) score += 1;
    if (checks.noCommon) score += 1;
    if (checks.noRepeats) score += 1;

    const getStrengthInfo = (score) => {
      if (score <= 2)
        return { level: "Very Weak", color: "#e74c3c", percentage: 20 };
      if (score <= 3)
        return { level: "Weak", color: "#f39c12", percentage: 40 };
      if (score <= 4)
        return { level: "Fair", color: "#f1c40f", percentage: 60 };
      if (score <= 6)
        return { level: "Good", color: "#2ecc71", percentage: 80 };
      return { level: "Excellent", color: "#27ae60", percentage: 100 };
    };

    const strengthInfo = getStrengthInfo(score);

    return {
      score,
      checks,
      ...strengthInfo,
    };
  };

  const passwordStrength = calculatePasswordStrength(password);

  // Caps Lock detection function
  const handleKeyPress = (e) => {
    const capsLock = e.getModifierState && e.getModifierState("CapsLock");
    setCapsLockOn(capsLock);
  };

  // Check session on mount - allow some time for AuthCallback to establish session
  useEffect(() => {
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        // Check if we came from an invitation flow (allow AuthCallback to process)
        const urlParams = new URLSearchParams(window.location.search);
        const hasInviteParams =
          urlParams.get("token") ||
          urlParams.get("token_hash") ||
          window.location.hash.includes("token");

        if (!hasInviteParams) {
          // Only redirect to login if this isn't an invitation flow
          navigate("/login");
        }
      }
      setCheckingSession(false);
    };

    // Add small delay to allow AuthCallback to process if redirected from there
    const timer = setTimeout(checkSession, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validation
    if (passwordStrength.score < 4) {
      setError("Please choose a stronger password (at least Good strength)");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch {
      setError("Unexpected error. Please try again.");
    }
    setLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="set-password-wrapper">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2 className="loading-text">Verifying Session...</h2>
          <p className="loading-subtitle">
            Please wait while we authenticate your session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="set-password-wrapper">
      <div className="set-password-container">
        <div className="set-password-header">
          <div className="logo-section">
            <div className="logo-icon">🔒</div>
            <h1 className="main-title">Set Your Password</h1>
            <p className="main-subtitle">
              Create a secure password to protect your account
            </p>
          </div>

          <div className="security-badges">
            <div className="security-badge">
              <span className="badge-icon">🛡️</span>
              <span className="badge-text">256-bit Encryption</span>
            </div>
            <div className="security-badge">
              <span className="badge-icon">🔐</span>
              <span className="badge-text">Enterprise Security</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          {/* Password Input */}
          <div className="input-group">
            <label className="input-label">New Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField("")}
                onKeyPress={handleKeyPress}
                required
                className={`password-input ${
                  focusedField === "password" ? "focused" : ""
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="visibility-toggle"
                onClick={() => {
                  console.log("Toggle clicked, current state:", showPassword);
                  setShowPassword(!showPassword);
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {showPassword ? (
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* Caps Lock Warning */}
            {capsLockOn && focusedField === "password" && (
              <div className="caps-lock-warning">
                <span className="warning-icon">⚠️</span>
                <span className="warning-text">Caps Lock is ON</span>
              </div>
            )}
          </div>

          {/* Password Strength Analysis */}
          {password && (
            <div className="password-strength-section">
              <div className="strength-header">
                <span className="strength-label">Password Strength:</span>
                <span
                  className="strength-level"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.level}
                </span>
              </div>

              <div className="strength-meter">
                <div
                  className="strength-fill"
                  style={{
                    width: `${passwordStrength.percentage}%`,
                    backgroundColor: passwordStrength.color,
                  }}
                />
              </div>

              <div className="requirements-container">
                <div className="requirements-title">Security Requirements:</div>
                <div className="requirements-grid">
                  <div
                    className={`requirement ${
                      passwordStrength.checks.length ? "met" : "unmet"
                    }`}
                  >
                    <span className="req-icon">
                      {passwordStrength.checks.length ? "✅" : "⭕"}
                    </span>
                    <span className="req-text">At least 8 characters</span>
                  </div>

                  <div
                    className={`requirement ${
                      passwordStrength.checks.lengthGood ? "met" : "unmet"
                    }`}
                  >
                    <span className="req-icon">
                      {passwordStrength.checks.lengthGood ? "✅" : "⭕"}
                    </span>
                    <span className="req-text">
                      12+ characters (recommended)
                    </span>
                  </div>

                  <div
                    className={`requirement ${
                      passwordStrength.checks.uppercase ? "met" : "unmet"
                    }`}
                  >
                    <span className="req-icon">
                      {passwordStrength.checks.uppercase ? "✅" : "⭕"}
                    </span>
                    <span className="req-text">Uppercase letter (A-Z)</span>
                  </div>

                  <div
                    className={`requirement ${
                      passwordStrength.checks.lowercase ? "met" : "unmet"
                    }`}
                  >
                    <span className="req-icon">
                      {passwordStrength.checks.lowercase ? "✅" : "⭕"}
                    </span>
                    <span className="req-text">Lowercase letter (a-z)</span>
                  </div>

                  <div
                    className={`requirement ${
                      passwordStrength.checks.numbers ? "met" : "unmet"
                    }`}
                  >
                    <span className="req-icon">
                      {passwordStrength.checks.numbers ? "✅" : "⭕"}
                    </span>
                    <span className="req-text">Number (0-9)</span>
                  </div>

                  <div
                    className={`requirement ${
                      passwordStrength.checks.symbols ? "met" : "unmet"
                    }`}
                  >
                    <span className="req-icon">
                      {passwordStrength.checks.symbols ? "✅" : "⭕"}
                    </span>
                    <span className="req-text">Special character</span>
                  </div>

                  <div
                    className={`requirement ${
                      passwordStrength.checks.noCommon ? "met" : "unmet"
                    }`}
                  >
                    <span className="req-icon">
                      {passwordStrength.checks.noCommon ? "✅" : "⭕"}
                    </span>
                    <span className="req-text">Not a common password</span>
                  </div>

                  <div
                    className={`requirement ${
                      passwordStrength.checks.noRepeats ? "met" : "unmet"
                    }`}
                  >
                    <span className="req-icon">
                      {passwordStrength.checks.noRepeats ? "✅" : "⭕"}
                    </span>
                    <span className="req-text">No repeated characters</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tips */}
          <div className="security-tips">
            <div className="tips-header">
              <span className="tips-icon">💡</span>
              <span className="tips-title">Security Tips</span>
            </div>
            <ul className="tips-list">
              <li>Use a unique password you haven't used elsewhere</li>
              <li>Consider using a passphrase with multiple words</li>
              <li>Avoid using personal information like names or dates</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`submit-button ${
              loading || !password || passwordStrength.score < 4
                ? "disabled"
                : "enabled"
            }`}
            disabled={loading || !password || passwordStrength.score < 4}
          >
            <span className="button-content">
              {loading ? (
                <>
                  <div className="button-spinner"></div>
                  <span>Setting Password...</span>
                </>
              ) : (
                <>
                  <span className="button-icon">🔐</span>
                  <span>Set Secure Password</span>
                </>
              )}
            </span>
          </button>

          {/* Security Footer */}
          <div className="security-footer">
            <div className="footer-item">
              <span className="footer-icon">🔒</span>
              <span className="footer-text">SSL Encrypted</span>
            </div>
            <div className="footer-item">
              <span className="footer-icon">🛡️</span>
              <span className="footer-text">GDPR Compliant</span>
            </div>
            <div className="footer-item">
              <span className="footer-icon">⚡</span>
              <span className="footer-text">Instant Setup</span>
            </div>
          </div>
        </form>

        {/* Messages */}
        {error && (
          <div className="message-container error">
            <div className="message-icon">❌</div>
            <div className="message-content">
              <div className="message-title">Error</div>
              <div className="message-text">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="message-container success">
            <div className="message-icon">✅</div>
            <div className="message-content">
              <div className="message-title">Success!</div>
              <div className="message-text">
                Password set successfully! Redirecting to login...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
