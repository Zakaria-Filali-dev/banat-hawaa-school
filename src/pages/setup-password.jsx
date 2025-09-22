import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function SetupPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract token_hash from URL
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token_hash");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    if (!password || !confirmPassword) {
      setError("Please enter and confirm your password.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }
    if (!token) {
      setError("Invalid or missing invitation token.");
      setLoading(false);
      return;
    }
    
    try {
      // Call backend API to verify token and set password
      const response = await fetch("/api/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.error || "Failed to set password.");
        setLoading(false);
        return;
      }
      
      setSuccess("Password set successfully! Redirecting to sign in page...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <h2>Set Up Your Password</h2>
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
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
          />
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Setting Password..." : "Set Password"}
          </button>
        </form>
        {error && <p style={{ color: "red", marginTop: "1rem", textAlign: "center" }}>{error}</p>}
        {success && <p style={{ color: "green", marginTop: "1rem", textAlign: "center" }}>{success}</p>}
      </div>
    </div>
  );
}
