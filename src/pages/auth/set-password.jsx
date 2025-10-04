import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Password strength calculation
  const calculatePasswordStrength = (pwd) => {
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      numbers: /\d/.test(pwd),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };

    score = Object.values(checks).filter(Boolean).length;

    return {
      score,
      checks,
      strength:
        score <= 1
          ? "Very Weak"
          : score <= 2
          ? "Weak"
          : score <= 3
          ? "Fair"
          : score <= 4
          ? "Good"
          : "Excellent",
      color:
        score <= 1
          ? "#ff4757"
          : score <= 2
          ? "#ff7675"
          : score <= 3
          ? "#fdcb6e"
          : score <= 4
          ? "#00b894"
          : "#00cec9",
    };
  };

  const passwordStrength = calculatePasswordStrength(password);
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

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

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (passwordStrength.score < 3) {
      setError("Please choose a stronger password (at least Fair strength)");
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
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "40px",
            textAlign: "center",
            color: "white",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(255,255,255,0.3)",
              borderTop: "4px solid white",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          ></div>
          <h2>Verifying Session...</h2>
        </div>
      </div>
    );
  }

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
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .password-input-wrapper {
            position: relative;
            margin-bottom: 15px;
          }
          .password-input {
            width: 100%;
            padding: 15px 50px 15px 15px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 16px;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }
          .password-input:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.8);
            background: rgba(255, 255, 255, 0.2);
          }
          .password-input::placeholder {
            color: rgba(255, 255, 255, 0.7);
          }
          .toggle-password {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            font-size: 18px;
            transition: color 0.3s ease;
          }
          .toggle-password:hover {
            color: white;
          }
          .strength-meter {
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            overflow: hidden;
            margin: 10px 0;
          }
          .strength-fill {
            height: 100%;
            border-radius: 3px;
            transition: all 0.3s ease;
          }
          .requirements-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin: 15px 0;
          }
          .requirement {
            display: flex;
            align-items: center;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.8);
          }
          .requirement-icon {
            margin-right: 6px;
            font-weight: bold;
          }
          .submit-button {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 12px;
            background: linear-gradient(45deg, #00b894, #00cec9);
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 20px;
          }
          .submit-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 206, 201, 0.3);
          }
          .submit-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          .error-message {
            background: rgba(255, 71, 87, 0.2);
            border: 1px solid rgba(255, 71, 87, 0.5);
            color: #ff4757;
            padding: 12px;
            border-radius: 8px;
            margin-top: 15px;
            text-align: center;
            font-size: 14px;
          }
          .success-message {
            background: rgba(0, 184, 148, 0.2);
            border: 1px solid rgba(0, 184, 148, 0.5);
            color: #00b894;
            padding: 12px;
            border-radius: 8px;
            margin-top: 15px;
            text-align: center;
            font-size: 14px;
          }
        `}
      </style>

      <div
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "40px",
          width: "100%",
          maxWidth: "450px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1
            style={{ color: "white", fontSize: "28px", marginBottom: "10px" }}
          >
            Set Your Password
          </h1>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "16px",
              margin: 0,
            }}
          >
            Create a secure password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Password Input */}
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="password-input"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          {/* Password Strength Meter */}
          {password && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "5px",
                }}
              >
                <span
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "14px",
                  }}
                >
                  Password Strength:
                </span>
                <span
                  style={{
                    color: passwordStrength.color,
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  {passwordStrength.strength}
                </span>
              </div>
              <div className="strength-meter">
                <div
                  className="strength-fill"
                  style={{
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    background: passwordStrength.color,
                  }}
                />
              </div>

              {/* Requirements Grid */}
              <div className="requirements-grid">
                <div className="requirement">
                  <span
                    className="requirement-icon"
                    style={{
                      color: passwordStrength.checks.length
                        ? "#00b894"
                        : "#ff7675",
                    }}
                  >
                    {passwordStrength.checks.length ? "✓" : "✗"}
                  </span>
                  8+ characters
                </div>
                <div className="requirement">
                  <span
                    className="requirement-icon"
                    style={{
                      color: passwordStrength.checks.uppercase
                        ? "#00b894"
                        : "#ff7675",
                    }}
                  >
                    {passwordStrength.checks.uppercase ? "✓" : "✗"}
                  </span>
                  Uppercase letter
                </div>
                <div className="requirement">
                  <span
                    className="requirement-icon"
                    style={{
                      color: passwordStrength.checks.lowercase
                        ? "#00b894"
                        : "#ff7675",
                    }}
                  >
                    {passwordStrength.checks.lowercase ? "✓" : "✗"}
                  </span>
                  Lowercase letter
                </div>
                <div className="requirement">
                  <span
                    className="requirement-icon"
                    style={{
                      color: passwordStrength.checks.numbers
                        ? "#00b894"
                        : "#ff7675",
                    }}
                  >
                    {passwordStrength.checks.numbers ? "✓" : "✗"}
                  </span>
                  Number
                </div>
                <div className="requirement" style={{ gridColumn: "span 2" }}>
                  <span
                    className="requirement-icon"
                    style={{
                      color: passwordStrength.checks.symbols
                        ? "#00b894"
                        : "#ff7675",
                    }}
                  >
                    {passwordStrength.checks.symbols ? "✓" : "✗"}
                  </span>
                  Special character (!@#$%^&*)
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password Input */}
          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="password-input"
              style={{
                borderColor:
                  confirmPassword && !passwordsMatch
                    ? "rgba(255, 71, 87, 0.5)"
                    : "rgba(255, 255, 255, 0.3)",
              }}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          {/* Password Match Indicator */}
          {confirmPassword && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "15px",
                fontSize: "14px",
              }}
            >
              <span
                style={{
                  color: passwordsMatch ? "#00b894" : "#ff7675",
                  marginRight: "6px",
                  fontWeight: "bold",
                }}
              >
                {passwordsMatch ? "✓" : "✗"}
              </span>
              <span style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={
              loading ||
              !password ||
              !confirmPassword ||
              !passwordsMatch ||
              passwordStrength.score < 3
            }
          >
            {loading ? "Setting Password..." : "Set Password"}
          </button>
        </form>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Success Message */}
        {success && (
          <div className="success-message">
            Password set successfully! Redirecting to login...
          </div>
        )}
      </div>
    </div>
  );
}
