import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setErrorMsg("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      console.log("Login successful, user ID:", data.user.id);
      console.log("Waiting for profile lookup...");

      // Set a backup timeout to prevent infinite loading
      const backupTimeout = setTimeout(() => {
        console.log("Backup timeout reached - forcing page refresh");
        setErrorMsg("Login taking too long. Refreshing page...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 8000); // 8 second backup

      // Wait a moment for auth state to propagate, then check profile
      const profileTimeout = setTimeout(async () => {
        try {
          console.log("Starting profile lookup for user:", data.user.id);

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

          console.log("Profile lookup result:", { profile, profileError });

          if (profileError) {
            console.error("Profile lookup error:", profileError);
            setErrorMsg(`Profile lookup failed: ${profileError.message}`);
            setLoading(false);
            return;
          }

          if (!profile) {
            console.error("No profile found for user");
            setErrorMsg("User profile not found. Please contact support.");
            setLoading(false);
            return;
          }

          console.log("User role:", profile.role);
          console.log("Navigating to dashboard...");

          // Clear the backup timeout since we're succeeding
          clearTimeout(backupTimeout);

          // Redirect based on role
          switch (profile.role) {
            case "admin":
              console.log("Redirecting to admin dashboard");
              navigate("/admin", { replace: true });
              break;
            case "teacher":
              console.log("Redirecting to teacher dashboard");
              navigate("/teacher", { replace: true });
              break;
            case "student":
              console.log("Redirecting to student dashboard");
              navigate("/student", { replace: true });
              break;
            default:
              console.error("Invalid role:", profile.role);
              setErrorMsg(
                `Invalid user role: ${profile.role}. Please contact support.`
              );
              setLoading(false);
          }
        } catch (profileError) {
          console.error("Profile fetch error:", profileError);
          clearTimeout(backupTimeout);
          setErrorMsg(`Failed to get user profile: ${profileError.message}`);
          setLoading(false);
        }
      }, 2000); // Increased to 2 seconds for auth state to settle
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Unexpected error. Please try again.");
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
