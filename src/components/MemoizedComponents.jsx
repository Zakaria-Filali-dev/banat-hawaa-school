import React, { memo } from "react";

// Memoized tab navigation to prevent unnecessary re-renders
export const TabNavigation = memo(({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "applications", label: "Applications", icon: "📝" },
    { id: "students", label: "Students", icon: "👥" },
    { id: "teachers", label: "Teachers", icon: "👨‍🏫" },
    { id: "subjects", label: "Subjects", icon: "📚" },
    { id: "announcements", label: "Announcements", icon: "📢" },
  ];

  return (
    <div className="admin-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => setActiveTab(tab.id)}
          style={{ transform: "translateZ(0)" }} // Hardware acceleration
        >
          <span className="tab-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
});

TabNavigation.displayName = "TabNavigation";

// Memoized stats card to prevent re-renders
export const StatsCard = memo(({ title, value, icon, color }) => (
  <div
    className={`stats-card ${color}`}
    style={{
      transform: "translateZ(0)",
      willChange: "transform",
      backfaceVisibility: "hidden",
    }}
  >
    <div className="stats-icon">{icon}</div>
    <div className="stats-content">
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  </div>
));

StatsCard.displayName = "StatsCard";

// Memoized data table rows to prevent unnecessary re-renders
export const DataTableRow = memo(({ children, className = "", ...props }) => (
  <tr
    className={className}
    style={{
      transform: "translateZ(0)",
      willChange: "transform",
    }}
    {...props}
  >
    {children}
  </tr>
));

DataTableRow.displayName = "DataTableRow";

// Memoized button component with performance optimizations
export const PerformantButton = memo(
  ({ children, onClick, className = "", disabled = false, ...props }) => (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      style={{
        transform: "translateZ(0)",
        willChange: "transform",
        transition: "all 0.15s ease-out",
        backfaceVisibility: "hidden",
      }}
      {...props}
    >
      {children}
    </button>
  )
);

PerformantButton.displayName = "PerformantButton";

// Memoized form input to prevent re-renders
export const PerformantInput = memo(
  ({ value, onChange, className = "", ...props }) => (
    <input
      value={value}
      onChange={onChange}
      className={className}
      style={{
        transform: "translateZ(0)",
        willChange: "transform",
      }}
      {...props}
    />
  )
);

PerformantInput.displayName = "PerformantInput";

// Memoized select component
export const PerformantSelect = memo(
  ({ value, onChange, children, className = "", ...props }) => (
    <select
      value={value}
      onChange={onChange}
      className={className}
      style={{
        transform: "translateZ(0)",
        willChange: "transform",
      }}
      {...props}
    >
      {children}
    </select>
  )
);

PerformantSelect.displayName = "PerformantSelect";
