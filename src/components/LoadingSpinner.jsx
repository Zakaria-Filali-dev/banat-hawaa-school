import React from "react";

const LoadingSpinner = ({ message = "Loading..." }) => {
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
          width: "60px",
          height: "60px",
          border: "4px solid rgba(255, 255, 255, 0.3)",
          borderTop: "4px solid white",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "20px",
        }}
      ></div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <h3
        style={{
          margin: "0",
          fontSize: "1.2rem",
          fontWeight: "300",
          textAlign: "center",
        }}
      >
        {message}
      </h3>

      <p
        style={{
          margin: "10px 0 0 0",
          fontSize: "0.9rem",
          opacity: "0.8",
          textAlign: "center",
        }}
      >
        Banat Hawaa School
      </p>
    </div>
  );
};

export default LoadingSpinner;
