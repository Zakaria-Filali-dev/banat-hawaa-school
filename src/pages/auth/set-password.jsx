import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
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

  return (
    <div className="page-wrapper">
      <div className="container">
        <h2>Set Your Password</h2>
        <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "auto" }}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Setting..." : "Set Password"}
          </button>
        </form>
        {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
        {success && (
          <p style={{ color: "green", marginTop: "1rem" }}>
            Password set! Redirecting to login...
          </p>
        )}
      </div>
    </div>
  );
}
