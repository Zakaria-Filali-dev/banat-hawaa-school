import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import GmailSMTPTest from "../../components/GmailSMTPTest";
import LoadingButton from "../../components/LoadingButton";

const EmailConfiguration = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/login");
          return;
        }

        // Check if user is admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "admin") {
          navigate("/login");
          return;
        }
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const goBack = () => {
    navigate("/admin");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      {/* Header with Back Button */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto 20px auto",
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <LoadingButton
          onClick={goBack}
          variant="secondary"
          size="small"
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          ← Back to Admin
        </LoadingButton>
        <h2
          style={{
            color: "white",
            margin: 0,
            fontSize: "20px",
            fontWeight: "normal",
          }}
        >
          Email Configuration Test
        </h2>
      </div>

      {/* Gmail SMTP Test Component */}
      <GmailSMTPTest />

      {/* Configuration Guide */}
      <div
        style={{
          maxWidth: "600px",
          margin: "30px auto 0 auto",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          padding: "30px",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: "white",
        }}
      >
        <h3 style={{ margin: "0 0 20px 0" }}>📋 Configuration Steps</h3>

        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#ffd700" }}>
            1. Supabase Dashboard Configuration
          </h4>
          <p
            style={{ margin: "0 0 10px 0", fontSize: "14px", lineHeight: 1.5 }}
          >
            Go to your Supabase project → Authentication → Settings → SMTP
            Settings
          </p>
          <div
            style={{
              background: "rgba(0, 0, 0, 0.2)",
              padding: "15px",
              borderRadius: "6px",
              fontSize: "13px",
              fontFamily: "monospace",
            }}
          >
            <div>Host: smtp.gmail.com</div>
            <div>Port: 465</div>
            <div>Username: zakifilali42@gmail.com</div>
            <div>Password: [Gmail App Password]</div>
            <div>From: zakifilali42@gmail.com</div>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#ffd700" }}>
            2. Gmail App Password
          </h4>
          <p style={{ margin: "0", fontSize: "14px", lineHeight: 1.5 }}>
            Make sure you're using a 16-character Gmail App Password, not your
            regular Gmail password. This requires 2-Factor Authentication to be
            enabled on your Gmail account.
          </p>
        </div>

        <div
          style={{
            padding: "15px",
            background: "rgba(34, 197, 94, 0.2)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        >
          <strong>✅ Benefits of Gmail SMTP:</strong>
          <ul
            style={{
              margin: "10px 0 0 0",
              paddingLeft: "20px",
              lineHeight: 1.6,
            }}
          >
            <li>No mobile browser redirect issues</li>
            <li>Better email deliverability</li>
            <li>Consistent mobile rendering</li>
            <li>Reliable Gmail infrastructure</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmailConfiguration;
