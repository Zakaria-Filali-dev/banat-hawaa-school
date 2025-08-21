import React from "react";

const TeacherStats = ({
  assignments,
  submissions,
  schedule,
  notifications,
}) => {
  return (
    <div className="stats-grid" style={{ marginBottom: "2rem" }}>
      <div className="stat-card">
        <h3>Total Assignments</h3>
        <p className="stat-number">{assignments?.length || 0}</p>
      </div>
      <div className="stat-card">
        <h3>Pending Submissions</h3>
        <p className="stat-number">
          {submissions?.filter((s) => s.status === "submitted").length || 0}
        </p>
      </div>
      <div className="stat-card">
        <h3>Upcoming Classes</h3>
        <p className="stat-number">{schedule?.length || 0}</p>
      </div>
      <div className="stat-card">
        <h3>Notifications</h3>
        <p className="stat-number">{notifications?.length || 0}</p>
      </div>
    </div>
  );
};

export default TeacherStats;
