import React, { useState } from "react";
import { useDataCache } from "../contexts/DataCacheContext";
import "./CacheStatus.css";

/**
 * Cache Status Component - Shows cache statistics and management controls
 */
const CacheStatus = ({ compact = false }) => {
  const { getCacheStats, clearCache, invalidateCache, CACHE_KEYS } =
    useDataCache();
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState(null);

  const refreshStats = () => {
    setStats(getCacheStats());
  };

  const handleClearCache = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all cached data? This will force fresh data loads."
      )
    ) {
      clearCache();
      setStats(getCacheStats());
    }
  };

  const handleInvalidateEntry = (key) => {
    if (window.confirm(`Clear cache for ${key}?`)) {
      invalidateCache(key);
      setStats(getCacheStats());
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatAge = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  if (compact) {
    return (
      <div className="cache-status-compact">
        <button
          className="cache-toggle-btn"
          onClick={() => {
            refreshStats();
            setIsExpanded(!isExpanded);
          }}
          title="Cache Status"
        >
          📦 Cache ({stats?.totalEntries || 0})
        </button>

        {isExpanded && stats && (
          <div className="cache-dropdown">
            <div className="cache-summary">
              <div>Entries: {stats.totalEntries}</div>
              <div>Size: {formatSize(stats.totalSize)}</div>
            </div>

            <div className="cache-entries">
              {stats.entries.map((entry) => (
                <div
                  key={entry.key}
                  className={`cache-entry ${!entry.valid ? "expired" : ""}`}
                >
                  <span className="cache-key">
                    {entry.key.replace("admin_", "")}
                  </span>
                  <span className="cache-age">{formatAge(entry.age)}</span>
                  <button
                    className="cache-clear-btn"
                    onClick={() => handleInvalidateEntry(entry.key)}
                    title="Clear this cache entry"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="cache-actions">
              <button
                className="cache-action-btn refresh"
                onClick={refreshStats}
              >
                🔄 Refresh
              </button>
              <button
                className="cache-action-btn clear"
                onClick={handleClearCache}
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="cache-status-full">
      <h3>Cache Management</h3>

      <div className="cache-controls">
        <button onClick={refreshStats} className="btn btn-secondary">
          Refresh Stats
        </button>
        <button onClick={handleClearCache} className="btn btn-warning">
          Clear All Cache
        </button>
      </div>

      {stats && (
        <div className="cache-details">
          <div className="cache-overview">
            <div className="stat-card">
              <div className="stat-value">{stats.totalEntries}</div>
              <div className="stat-label">Cache Entries</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatSize(stats.totalSize)}</div>
              <div className="stat-label">Total Size</div>
            </div>
          </div>

          <div className="cache-entries-table">
            <div className="table-header">
              <div>Key</div>
              <div>Age</div>
              <div>Size</div>
              <div>Status</div>
              <div>Action</div>
            </div>

            {stats.entries.map((entry) => (
              <div key={entry.key} className="table-row">
                <div className="entry-key">{entry.key}</div>
                <div className="entry-age">{formatAge(entry.age)}</div>
                <div className="entry-size">{formatSize(entry.size)}</div>
                <div
                  className={`entry-status ${
                    entry.valid ? "valid" : "expired"
                  }`}
                >
                  {entry.valid ? "Valid" : "Expired"}
                </div>
                <div className="entry-actions">
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleInvalidateEntry(entry.key)}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheStatus;
