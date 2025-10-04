import React from "react";
import "./LoadingIndicator.css";

/**
 * Professional loading indicator component with multiple variants
 */
const LoadingIndicator = ({
  size = "medium",
  variant = "spinner",
  message = "Loading...",
  fullScreen = false,
  overlay = false,
}) => {
  const sizeClasses = {
    small: "loading-small",
    medium: "loading-medium",
    large: "loading-large",
  };

  const renderSpinner = () => (
    <div className={`loading-spinner ${sizeClasses[size]}`}>
      <div className="spinner-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );

  const renderDots = () => (
    <div className={`loading-dots ${sizeClasses[size]}`}>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`loading-pulse ${sizeClasses[size]}`}>
      <div className="pulse-circle"></div>
    </div>
  );

  const renderSkeleton = () => (
    <div className={`loading-skeleton ${sizeClasses[size]}`}>
      <div className="skeleton-line skeleton-title"></div>
      <div className="skeleton-line skeleton-text"></div>
      <div className="skeleton-line skeleton-text short"></div>
    </div>
  );

  const renderIndicator = () => {
    switch (variant) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      case "skeleton":
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div
      className={`loading-container ${fullScreen ? "loading-fullscreen" : ""} ${
        overlay ? "loading-overlay" : ""
      }`}
    >
      {renderIndicator()}
      {message && variant !== "skeleton" && (
        <div className="loading-message">{message}</div>
      )}
    </div>
  );

  return content;
};

export default LoadingIndicator;
