import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get URL parameters - check both search params and hash
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );

        // Try to get token from both places (Supabase can use either)
        const token = urlParams.get("token") || hashParams.get("token");
        const tokenHash =
          urlParams.get("token_hash") || hashParams.get("token_hash");
        const type = urlParams.get("type") || hashParams.get("type");
        const errorParam = urlParams.get("error") || hashParams.get("error");
        const errorDescription =
          urlParams.get("error_description") ||
          hashParams.get("error_description");

        // If there's an error in the URL, show it immediately
        if (errorParam) {
          setError(`Authentication failed: ${errorDescription || errorParam}`);
          setLoading(false);
          return;
        }

        // If this is not an invitation link, redirect to login
        if (type !== "invite") {
          navigate("/login");
          return;
        }

        // For invites, use token_hash (as per Supabase docs)
        const verificationToken = tokenHash || token;

        if (!verificationToken) {
          setError("Invalid invitation link: missing token");
          setLoading(false);
          return;
        }

        // Try different approaches for invite verification
        let verificationResult;

        try {
          // First try: Use token as token_hash (most common for invites)
          verificationResult = await supabase.auth.verifyOtp({
            token_hash: verificationToken,
            type: "invite",
          });
        } catch {
          // Second try: Use token directly
          try {
            verificationResult = await supabase.auth.verifyOtp({
              token: verificationToken,
              type: "invite",
            });
          } catch {
            // Third try: Check if session is already established
            verificationResult = await supabase.auth.getSession();
          }
        }

        const { data, error } = verificationResult;

        if (error) {
          setError(`Invitation verification failed: ${error.message}`);
          setLoading(false);
          return;
        }

        if (data?.user) {
          navigate("/auth/confirm");
          return;
        }

        // If we get here, something unexpected happened
        setError(
          "Unable to process invitation. Please request a new invitation."
        );
        setLoading(false);
      } catch (err) {
        console.error("Auth callback exception:", err);
        setError("An unexpected error occurred. Please try again.");
        setLoading(false);
      }
    };

    // Run immediately
    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <h2>🔐 Processing Your Invitation...</h2>
            <p>Please wait while we set up your account.</p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <h2>❌ Authentication Error</h2>
            <p style={{ color: "red", marginBottom: "2rem" }}>{error}</p>
            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
            >
              <button
                onClick={() => navigate("/login")}
                className="btn btn-primary"
              >
                Return to Login
              </button>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/login");
                }}
                className="btn"
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "1px solid #dc3545",
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
