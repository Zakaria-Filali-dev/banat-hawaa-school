import { useState } from "react";
import LoadingButton from "../components/LoadingButton";

const GmailSMTPTest = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testGmailSMTP = async () => {
    if (!email) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/test-gmail-smtp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: "Gmail SMTP Test - Banat Hawaa School",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Gmail SMTP Test ✅</h1>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                  Hello! This is a test email sent via Gmail SMTP configuration.
                </p>
                
                <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
                  If you received this email, Gmail SMTP is working correctly for mobile email delivery! 🎉
                </p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Test Details:</h3>
                  <ul style="color: #666; line-height: 1.6;">
                    <li>Sent at: ${new Date().toLocaleString()}</li>
                    <li>SMTP Provider: Gmail (smtp.gmail.com)</li>
                    <li>Mobile Compatible: Yes ✅</li>
                    <li>No Redirects: Confirmed ✅</li>
                  </ul>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
                © 2025 Banat Hawaa School - Gmail SMTP Test
              </div>
            </div>
          `,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          messageId: data.messageId,
          message: data.message,
        });
      } else {
        setError(data.error || "Failed to send test email");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "30px",
          borderRadius: "10px",
          textAlign: "center",
          marginBottom: "30px",
          color: "white",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "28px" }}>
          Gmail SMTP Configuration Test 📧
        </h1>
        <p style={{ margin: "10px 0 0 0", opacity: 0.9 }}>
          Test mobile-friendly email delivery
        </p>
      </div>

      <div
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          padding: "30px",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "white",
              fontWeight: "bold",
            }}
          >
            Test Email Address:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to test Gmail SMTP"
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "8px",
              border: "none",
              background: "rgba(255, 255, 255, 0.2)",
              color: "white",
              fontSize: "16px",
              outline: "none",
            }}
          />
        </div>

        <LoadingButton
          onClick={testGmailSMTP}
          variant="primary"
          size="large"
          isLoading={loading}
          loadingText="Sending test email..."
          disabled={!email}
          style={{
            width: "100%",
            background: "rgba(255, 255, 255, 0.9)",
            color: "#333",
            fontWeight: "bold",
          }}
        >
          Send Gmail SMTP Test Email 🚀
        </LoadingButton>

        {/* Success Result */}
        {result && (
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              background: "rgba(34, 197, 94, 0.2)",
              border: "border: 1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "8px",
              color: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "20px", marginRight: "10px" }}>✅</span>
              <strong>Gmail SMTP Test Successful!</strong>
            </div>
            <p style={{ margin: "10px 0", opacity: 0.9 }}>{result.message}</p>
            {result.messageId && (
              <p style={{ margin: "5px 0", fontSize: "14px", opacity: 0.8 }}>
                Message ID: {result.messageId}
              </p>
            )}
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0" }}>What this means:</h4>
              <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.6 }}>
                <li>Gmail SMTP is configured correctly</li>
                <li>Mobile email delivery should work without redirects</li>
                <li>
                  Invitation emails will use Gmail's reliable infrastructure
                </li>
                <li>Better deliverability and mobile compatibility achieved</li>
              </ul>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              color: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "20px", marginRight: "10px" }}>❌</span>
              <strong>Gmail SMTP Test Failed</strong>
            </div>
            <p style={{ margin: "10px 0", opacity: 0.9 }}>{error}</p>
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0" }}>Troubleshooting Steps:</h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "20px",
                  lineHeight: 1.6,
                  fontSize: "14px",
                }}
              >
                <li>Check Gmail App Password in environment variables</li>
                <li>Verify 2-Factor Authentication is enabled on Gmail</li>
                <li>Ensure SMTP settings match Gmail requirements</li>
                <li>Check Supabase SMTP configuration in dashboard</li>
              </ul>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.8)",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "white" }}>
            Current Configuration:
          </h4>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.6 }}>
            <li>
              <strong>SMTP Host:</strong> smtp.gmail.com
            </li>
            <li>
              <strong>SMTP Port:</strong> 465 (SSL)
            </li>
            <li>
              <strong>From Email:</strong> zakifilali42@gmail.com
            </li>
            <li>
              <strong>Mobile Compatible:</strong> Yes ✅
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GmailSMTPTest;
