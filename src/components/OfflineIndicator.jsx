import React from "react";
import { useNetworkStatus, useOfflineQueue } from "../hooks/useOfflineHandling";
import "./OfflineIndicator.css";

/**
 * Offline Status Indicator Component
 * Shows connection status and offline queue information
 */
const OfflineIndicator = ({
  position = "bottom-right",
  showDetails = false,
  compact = false,
}) => {
  const { isOnline, wasOffline, timeSinceLastOnline } = useNetworkStatus();
  const { queueSize, isProcessing, processQueue } = useOfflineQueue();

  const formatTimeSince = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  if (isOnline && !wasOffline && queueSize === 0) {
    return null; // Don't show anything when online and no queue
  }

  if (compact) {
    return (
      <div
        className={`offline-indicator compact ${position} ${
          isOnline ? "online" : "offline"
        }`}
      >
        <div className="status-dot">
          {!isOnline && <span className="pulse"></span>}
        </div>
        {queueSize > 0 && <span className="queue-count">{queueSize}</span>}
      </div>
    );
  }

  return (
    <div
      className={`offline-indicator ${position} ${
        isOnline ? "online" : "offline"
      }`}
    >
      <div className="indicator-content">
        <div className="status-header">
          <div className="status-icon">{isOnline ? "🌐" : "📴"}</div>
          <div className="status-text">
            <strong>{isOnline ? "Online" : "Offline"}</strong>
            {!isOnline && (
              <div className="offline-duration">
                {formatTimeSince(timeSinceLastOnline)} ago
              </div>
            )}
          </div>
        </div>

        {!isOnline && (
          <div className="offline-message">
            <p>
              You're currently offline. Changes will be saved locally and synced
              when connection is restored.
            </p>
          </div>
        )}

        {wasOffline && isOnline && (
          <div className="reconnected-message">
            <p>✅ Connection restored! Syncing offline changes...</p>
          </div>
        )}

        {queueSize > 0 && (
          <div className="queue-info">
            <div className="queue-header">
              <span className="queue-icon">📤</span>
              <span className="queue-text">
                {queueSize} operation{queueSize > 1 ? "s" : ""} queued
              </span>
            </div>

            {isProcessing && (
              <div className="processing-status">
                <div className="processing-spinner"></div>
                <span>Processing...</span>
              </div>
            )}

            {isOnline && !isProcessing && (
              <button
                className="retry-btn"
                onClick={processQueue}
                title="Retry queued operations"
              >
                🔄 Retry Now
              </button>
            )}
          </div>
        )}

        {showDetails && (
          <div className="connection-details">
            <div className="detail-item">
              <span className="label">Status:</span>
              <span className={`value ${isOnline ? "online" : "offline"}`}>
                {isOnline ? "Connected" : "Disconnected"}
              </span>
            </div>
            {!isOnline && (
              <div className="detail-item">
                <span className="label">Offline for:</span>
                <span className="value">
                  {formatTimeSince(timeSinceLastOnline)}
                </span>
              </div>
            )}
            <div className="detail-item">
              <span className="label">Queued operations:</span>
              <span className="value">{queueSize}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Simple status badge component
 */
export const OfflineStatusBadge = () => {
  const { isOnline } = useNetworkStatus();
  const { queueSize } = useOfflineQueue();

  return (
    <div
      className={`status-badge ${isOnline ? "online" : "offline"}`}
      title={isOnline ? "Online" : "Offline"}
    >
      <div className="status-indicator">{isOnline ? "●" : "○"}</div>
      <span className="status-label">{isOnline ? "Online" : "Offline"}</span>
      {queueSize > 0 && <span className="queue-badge">{queueSize}</span>}
    </div>
  );
};

export default OfflineIndicator;
