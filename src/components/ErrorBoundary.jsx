import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Generate unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
      timestamp: new Date().toISOString(),
    };
  }

  componentDidCatch(error, errorInfo) {
    // Enhanced error logging with context
    const errorReport = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      errorId: this.state.errorId,
      component: this.props.name || "Unknown Component",
    };

    // Log to console with structured data
    console.group(`🚨 Error Boundary: ${errorReport.component}`);
    console.error("Error:", error);
    console.error("Error Info:", errorInfo);
    console.error("Full Report:", errorReport);
    console.groupEnd();

    // In production, send to error monitoring service
    if (import.meta.env.PROD) {
      this.sendErrorReport(errorReport);
    }

    this.setState({ errorInfo });
  }

  sendErrorReport = async (errorReport) => {
    try {
      // Mock error reporting - replace with actual service (Sentry, LogRocket, etc.)
      console.log("Sending error report to monitoring service:", errorReport);

      // Example: await fetch('/api/error-report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });
    } catch (reportError) {
      console.error("Failed to send error report:", reportError);
    }
  };

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId, retryCount } = this.state;
      const isDevelopment = import.meta.env.DEV;

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: "16px",
            color: "#374151",
            textAlign: "center",
            border: "1px solid rgba(220, 38, 38, 0.2)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            maxWidth: "500px",
            margin: "2rem auto",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>

          <h3
            style={{
              marginBottom: "1rem",
              color: "#dc2626",
              fontSize: "1.5rem",
              fontWeight: "600",
            }}
          >
            {this.props.title || "Something went wrong"}
          </h3>

          <p
            style={{
              marginBottom: "1.5rem",
              color: "#6b7280",
              lineHeight: "1.6",
              fontSize: "1rem",
            }}
          >
            {this.props.message ||
              "We're sorry, but something unexpected happened. Our team has been notified."}
          </p>

          {isDevelopment && error && (
            <details
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1.5rem",
                width: "100%",
                textAlign: "left",
              }}
            >
              <summary
                style={{
                  color: "#dc2626",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginBottom: "0.5rem",
                }}
              >
                🔍 Development Error Details
              </summary>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#374151",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                <strong>Error:</strong> {error.message}
                <br />
                <strong>Component:</strong> {this.props.name || "Unknown"}
                <br />
                <strong>Error ID:</strong> {errorId}
                <br />
                {error.stack && (
                  <>
                    <strong>Stack:</strong>
                    <br />
                    {error.stack}
                  </>
                )}
              </div>
            </details>
          )}

          {!isDevelopment && errorId && (
            <div
              style={{
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "0.75rem",
                marginBottom: "1.5rem",
                fontSize: "0.85rem",
                color: "#6b7280",
              }}
            >
              <strong>Reference ID:</strong> {errorId}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              onClick={this.handleRetry}
              disabled={retryCount >= 3}
              style={{
                padding: "0.75rem 1.5rem",
                background:
                  retryCount >= 3
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #667eea, #764ba2)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: retryCount >= 3 ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "0.9rem",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                if (retryCount < 3) {
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow =
                    "0 8px 16px rgba(102, 126, 234, 0.3)";
                }
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              {retryCount >= 3
                ? "Max Retries Reached"
                : `Try Again ${retryCount > 0 ? `(${retryCount}/3)` : ""}`}
            </button>

            <button
              onClick={this.handleReload}
              style={{
                padding: "0.75rem 1.5rem",
                background: "transparent",
                color: "#6b7280",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.9rem",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = "#9ca3af";
                e.target.style.color = "#374151";
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.color = "#6b7280";
              }}
            >
              Reload Page
            </button>
          </div>

          {this.props.showSupport !== false && (
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1rem",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  margin: "0",
                  lineHeight: "1.4",
                }}
              >
                <strong>Need help?</strong> If this problem persists, please
                contact support with reference ID: <code>{errorId}</code>
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
