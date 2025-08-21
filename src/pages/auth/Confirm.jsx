import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

export default function Confirm() {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        console.log("🔍 DEBUG Confirm - Starting auth check");
        // First check if user is already authenticated (from AuthCallback redirect)
        const { data: sessionData } = await supabase.auth.getSession();
        console.log(
          "🔍 DEBUG Confirm - Session data:",
          sessionData?.session?.user ? "User present" : "No user"
        );

        if (sessionData?.session?.user) {
          // Get user profile for welcome message
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("email", sessionData.session.user.email)
            .single();

          setUserProfile(profile);
          setVerified(true);
          setLoading(false);
          return;
        }

        // Fallback: Check for OTP verification (old flow)
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const type = params.get("type");

        if (!token || !type) {
          setError(
            "Missing authentication. Please use the link from your invitation email."
          );
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.verifyOtp({ token, type });
        if (error) {
          setError(error.message);
        } else {
          setVerified(true);
        }
        setLoading(false);
      } catch {
        setError("Authentication failed. Please try again.");
        setLoading(false);
      }
    };

    checkAuthState();
  }, []);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPwError("");

    // Validate passwords
    if (!password || password.length < 6) {
      setPwError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setPwError("Passwords do not match");
      return;
    }

    setPwLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPwError(error.message);
        setPwLoading(false);
        return;
      }

      // Success! Redirect based on role
      setPwLoading(false);

      if (userProfile?.role === "student") {
        alert(
          `Welcome ${userProfile.full_name}! Your account is ready. Redirecting to student dashboard...`
        );
        navigate("/student");
      } else if (userProfile?.role === "teacher") {
        alert(
          `Welcome ${userProfile.full_name}! Your account is ready. Redirecting to teacher dashboard...`
        );
        navigate("/teacher");
      } else if (userProfile?.role === "admin") {
        alert(
          `Welcome ${userProfile.full_name}! Your account is ready. Redirecting to admin dashboard...`
        );
        navigate("/admin");
      } else if (userProfile?.role === "parent") {
        alert(`Welcome ${userProfile.full_name}! Your account is ready.`);
        navigate("/login");
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.error("Password update error:", err);
      setPwError("Failed to set password. Please try again.");
      setPwLoading(false);
    }
  };

  if (loading) return <div className="loading">Verifying...</div>;
  if (error) return <div className="message message-error">{error}</div>;
  if (!verified) return null;

  return (
    <div className="page-wrapper">
      <div className="header">
        <div className="container">
          <h1>🎓 Welcome to Our Tutoring School</h1>
        </div>
      </div>
      <div className="container">
        <div className="form-container">
          <h2>Set Up Your Password</h2>
          {userProfile && (
            <p
              style={{
                color: "#666",
                marginBottom: "2rem",
                textAlign: "center",
              }}
            >
              Welcome <strong>{userProfile.full_name}</strong>! Please create a
              secure password to complete your {userProfile.role} account setup.
            </p>
          )}

          <form onSubmit={handleSetPassword}>
            <div className="form-group">
              <input
                type="password"
                placeholder="Enter your new password (minimum 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={pwLoading}
                className="form-input"
                style={{ marginBottom: "1rem" }}
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={pwLoading}
                className="form-input"
                style={{ marginBottom: "1rem" }}
              />
              <small style={{ color: "#888", fontSize: "0.9rem" }}>
                Password must be at least 6 characters long
              </small>
            </div>

            <button
              type="submit"
              disabled={
                pwLoading ||
                !password ||
                password.length < 6 ||
                password !== confirmPassword
              }
              className="btn btn-primary btn-full"
            >
              {pwLoading ? "Setting..." : "Set Password & Continue"}
            </button>

            {pwError && (
              <div className="message message-error mt-2">{pwError}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
