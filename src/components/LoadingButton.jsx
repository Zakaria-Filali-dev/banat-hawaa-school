import React from "react";
import "./LoadingButton.css";

const LoadingButton = ({
  loading = false,
  disabled = false,
  children,
  loadingText = "Loading...",
  className = "",
  type = "button",
  onClick,
  style = {},
  variant = "primary", // primary, secondary, danger, success
  size = "medium", // small, medium, large
  ...props
}) => {
  const isDisabled = loading || disabled;

  const handleClick = (e) => {
    if (!isDisabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={`loading-btn loading-btn-${variant} loading-btn-${size} ${className} ${
        loading ? "loading-btn-loading" : ""
      }`}
      disabled={isDisabled}
      onClick={handleClick}
      style={style}
      {...props}
    >
      <span className="loading-btn-content">
        {loading && (
          <span className="loading-btn-spinner">
            <svg viewBox="0 0 24 24" className="spinner-icon">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="31.416"
                strokeDashoffset="31.416"
              >
                <animate
                  attributeName="stroke-dasharray"
                  dur="2s"
                  values="0 31.416;15.708 15.708;0 31.416"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="stroke-dashoffset"
                  dur="2s"
                  values="0;-15.708;-31.416"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </span>
        )}
        <span
          className={`loading-btn-text ${
            loading ? "loading-btn-text-loading" : ""
          }`}
        >
          {loading ? loadingText : children}
        </span>
      </span>
    </button>
  );
};

export default LoadingButton;
