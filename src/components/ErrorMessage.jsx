import React from "react";

const ErrorMessage = ({ message, onRetry = null }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        padding: "20px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
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
          maxWidth: "400px",
          width: "100%",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* Error Icon */}
        <div
          style={{
            fontSize: "48px",
            marginBottom: "20px",
            opacity: "0.9",
          }}
        >
          ⚠️
        </div>

        <h3
          style={{
            margin: "0 0 15px 0",
            fontSize: "1.4rem",
            fontWeight: "600",
          }}
        >
          Something went wrong
        </h3>

        <p
          style={{
            margin: "0 0 25px 0",
            fontSize: "1rem",
            opacity: "0.9",
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "10px",
              padding: "12px 24px",
              color: "white",
              fontSize: "1rem",
              cursor: "pointer",
              fontFamily: "Arial, sans-serif",
              transition: "all 0.2s ease",
              marginBottom: "15px",
            }}
            onMouseOver={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.2)";
            }}
          >
            Try Again
          </button>
        )}

        <p
          style={{
            margin: "0",
            fontSize: "0.85rem",
            opacity: "0.7",
          }}
        >
          Banat Hawaa School
        </p>
      </div>
    </div>
  );
};

export default ErrorMessage;
