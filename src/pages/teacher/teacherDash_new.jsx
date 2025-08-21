import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import AssignmentCreator from "../../components/assignments/AssignmentCreator";
import FilePreview from "../../components/FilePreview";
import SubmissionFilesViewer from "../../components/SubmissionFilesViewer";
import "./teacherDash.css";

export default function Teachers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState("assignments");
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showAssignmentCreator, setShowAssignmentCreator] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showScheduleCreator, setShowScheduleCreator] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    subject_id: "",
    session_date: "",
    start_time: "",
    end_time: "",
    location: "",
    session_type: "regular",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData?.user) {
          navigate("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("email", userData.user.email)
          .single();

        if (profileError || profile?.role !== "teacher") {
          navigate("/login");
          return;
        }

        setUser(userData.user);
        await fetchTeacherData(userData.user.id);
      } catch {
        setError("Unexpected error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchTeacherData = async (userId) => {
    try {
      // Fetch teacher's subjects
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .eq("teacher_id", userId);

      // Fetch assignments created by this teacher
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(
          `
          *,
          subjects(name),
          assignment_attachments(*),
          assignment_submissions(count)
        `
        )
        .eq("teacher_id", userId)
        .order("created_at", { ascending: false });

      // Fetch submissions for teacher's assignments
      const { data: submissionsData } = await supabase
        .from("assignment_submissions")
        .select(
          `
          *,
          assignments(title, subjects(name)),
          student:profiles!assignment_submissions_student_id_fkey(full_name, email),
          submission_files(*)
        `
        )
        .in("assignment_id", assignmentsData?.map((a) => a.id) || [])
        .order("submitted_at", { ascending: false });

      // Fetch class schedule
      const { data: scheduleData } = await supabase
        .from("class_sessions")
        .select(
          `
          *,
          subjects(name),
          class_attendance(count)
        `
        )
        .eq("teacher_id", userId)
        .gte("session_date", new Date().toISOString().split("T")[0])
        .order("session_date", { ascending: true });

      // Fetch recent notifications (new submissions)
      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .eq("type", "assignment")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(10);

      setSubjects(subjectsData || []);
      setAssignments(assignmentsData || []);
      setSubmissions(submissionsData || []);
      setSchedule(scheduleData || []);
      setNotifications(notificationsData || []);
    } catch (error) {
      console.error("Error fetching teacher data:", error);
      setError("Failed to load dashboard data");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleGradeSubmission = async (submissionId, score, feedback) => {
    try {
      const { error } = await supabase
        .from("assignment_submissions")
        .update({
          score: parseInt(score),
          feedback: feedback,
          graded_by: user.id,
          graded_at: new Date().toISOString(),
          status: "graded",
        })
        .eq("id", submissionId);

      if (error) throw error;

      // Create notification for student
      const submission = submissions.find((s) => s.id === submissionId);
      if (submission) {
        await supabase.from("notifications").insert({
          recipient_id: submission.student_id,
          title: "Assignment Graded",
          message: `Your assignment "${submission.assignments.title}" has been graded. Score: ${score}`,
          type: "grade",
          related_id: submissionId,
        });
      }

      await fetchTeacherData(user.id);
      setSelectedSubmission(null);
    } catch (error) {
      setError("Failed to grade submission: " + error.message);
    }
  };

  const handleCreateSession = async () => {
    try {
      const sessionData = {
        ...newSession,
        teacher_id: user.id,
        start_time: newSession.start_time + ":00",
        end_time: newSession.end_time + ":00",
      };

      const { error } = await supabase
        .from("class_sessions")
        .insert(sessionData);

      if (error) throw error;

      setShowScheduleCreator(false);
      setNewSession({
        title: "",
        description: "",
        subject_id: "",
        session_date: "",
        start_time: "",
        end_time: "",
        location: "",
        session_type: "regular",
      });

      await fetchTeacherData(user.id);
    } catch (error) {
      setError("Failed to create class session: " + error.message);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  if (loading)
    return <div className="loading">Loading teacher dashboard...</div>;
  if (error) return <div className="message message-error">{error}</div>;

  return (
    <div className="page-wrapper">
      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal-content">
            <h2>Confirm Logout</h2>
            <p>Are you sure you want to logout?</p>
            <div className="logout-modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="header">
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1>Teacher Dashboard</h1>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {notifications.length > 0 && (
                <div className="notification-badge">
                  🔔 {notifications.length} new
                </div>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setShowLogoutModal(true)}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Quick Stats */}
        <div className="stats-grid" style={{ marginBottom: "2rem" }}>
          <div className="stat-card">
            <h3>{assignments.length}</h3>
            <p>Assignments Created</p>
          </div>
          <div className="stat-card">
            <h3>
              {submissions.filter((s) => s.status === "submitted").length}
            </h3>
            <p>Pending Reviews</p>
          </div>
          <div className="stat-card">
            <h3>{subjects.length}</h3>
            <p>Subjects Teaching</p>
          </div>
          <div className="stat-card">
            <h3>{schedule.length}</h3>
            <p>Upcoming Classes</p>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div
            className="notifications-section"
            style={{ marginBottom: "2rem" }}
          >
            <h3 style={{ color: "white", marginBottom: "1rem" }}>
              Recent Notifications
            </h3>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="notification-item card"
                style={{ marginBottom: "0.5rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong style={{ color: "white" }}>
                      {notification.title}
                    </strong>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        margin: "0.25rem 0",
                      }}
                    >
                      {notification.message}
                    </p>
                    <small style={{ color: "rgba(255,255,255,0.6)" }}>
                      {formatDate(notification.created_at)}
                    </small>
                  </div>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    Mark Read
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="dashboard-tabs" style={{ marginBottom: "2rem" }}>
          <button
            className={
              activeTab === "assignments"
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
            onClick={() => setActiveTab("assignments")}
            data-tab="assignments"
            style={{ marginRight: "1rem" }}
          >
            📝 Assignments
          </button>
          <button
            className={
              activeTab === "submissions"
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
            onClick={() => setActiveTab("submissions")}
            data-tab="submissions"
            style={{ marginRight: "1rem" }}
          >
            📋 Submissions (
            {submissions.filter((s) => s.status === "submitted").length})
          </button>
          <button
            className={
              activeTab === "schedule" ? "btn btn-primary" : "btn btn-secondary"
            }
            onClick={() => setActiveTab("schedule")}
            data-tab="schedule"
          >
            📅 Schedule
          </button>
        </div>

        {/* Assignments Tab */}
        {activeTab === "assignments" && (
          <div className="tab-content">
            {showAssignmentCreator ? (
              <AssignmentCreator
                onAssignmentCreated={() => {
                  setShowAssignmentCreator(false);
                  fetchTeacherData(user.id);
                }}
                onCancel={() => setShowAssignmentCreator(false)}
              />
            ) : (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                  }}
                >
                  <h3 style={{ color: "white" }}>My Assignments</h3>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAssignmentCreator(true)}
                  >
                    + Create Assignment
                  </button>
                </div>

                {assignments.length === 0 ? (
                  <div className="message message-info">
                    No assignments created yet. Create your first assignment!
                  </div>
                ) : (
                  assignments.map((assignment) => (
                    <div key={assignment.id} className="assignment-card card">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <h3 style={{ color: "white" }}>{assignment.title}</h3>
                          <p style={{ color: "rgba(255,255,255,0.8)" }}>
                            Subject: {assignment.subjects?.name}
                          </p>
                          <p style={{ color: "rgba(255,255,255,0.8)" }}>
                            {assignment.description}
                          </p>
                          {assignment.due_date && (
                            <p style={{ color: "rgba(255,255,255,0.8)" }}>
                              Due: {formatDate(assignment.due_date)}
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            className={
                              assignment.is_published
                                ? "status-published"
                                : "status-draft"
                            }
                          >
                            {assignment.is_published ? "Published" : "Draft"}
                          </span>
                          <p
                            style={{
                              color: "rgba(255,255,255,0.7)",
                              margin: "0.5rem 0",
                            }}
                          >
                            {assignment.assignment_attachments?.length || 0}{" "}
                            files
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === "submissions" && (
          <div className="tab-content">
            {selectedSubmission ? (
              <SubmissionGrader
                submission={selectedSubmission}
                onGrade={handleGradeSubmission}
                onCancel={() => setSelectedSubmission(null)}
              />
            ) : (
              <div>
                <h3 style={{ color: "white", marginBottom: "2rem" }}>
                  Student Submissions
                </h3>
                {submissions.length === 0 ? (
                  <div className="message message-info">No submissions yet</div>
                ) : (
                  submissions.map((submission) => (
                    <div key={submission.id} className="submission-card card">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <h4 style={{ color: "white" }}>
                            {submission.assignments?.title}
                          </h4>
                          <p style={{ color: "rgba(255,255,255,0.8)" }}>
                            Student: {submission.student?.full_name}
                          </p>
                          <p style={{ color: "rgba(255,255,255,0.8)" }}>
                            Subject: {submission.assignments?.subjects?.name}
                          </p>
                          <p style={{ color: "rgba(255,255,255,0.8)" }}>
                            Submitted: {formatDate(submission.submitted_at)}
                          </p>
                          {submission.submission_files?.length > 0 && (
                            <p style={{ color: "rgba(255,255,255,0.7)" }}>
                              📎 {submission.submission_files.length} file(s)
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span className={`status-${submission.status}`}>
                            {submission.status === "graded"
                              ? `Graded (${submission.score})`
                              : "Pending Review"}
                          </span>
                          <br />
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setSelectedSubmission(submission)}
                            style={{ marginTop: "0.5rem" }}
                          >
                            {submission.status === "graded" ? "View" : "Grade"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <div className="tab-content">
            {showScheduleCreator ? (
              <div className="card">
                <div className="card-header">
                  <h3>Create Class Session</h3>
                </div>
                <div className="form-group">
                  <label
                    style={{
                      color: "white",
                      marginBottom: "8px",
                      display: "block",
                    }}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    value={newSession.title}
                    onChange={(e) =>
                      setNewSession((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="form-input"
                    placeholder="Class title"
                  />
                </div>
                <div className="form-group">
                  <label
                    style={{
                      color: "white",
                      marginBottom: "8px",
                      display: "block",
                    }}
                  >
                    Subject
                  </label>
                  <select
                    value={newSession.subject_id}
                    onChange={(e) =>
                      setNewSession((prev) => ({
                        ...prev,
                        subject_id: e.target.value,
                      }))
                    }
                    className="form-input"
                  >
                    <option value="">Select subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div className="form-group">
                    <label
                      style={{
                        color: "white",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Date
                    </label>
                    <input
                      type="date"
                      value={newSession.session_date}
                      onChange={(e) =>
                        setNewSession((prev) => ({
                          ...prev,
                          session_date: e.target.value,
                        }))
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        color: "white",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newSession.start_time}
                      onChange={(e) =>
                        setNewSession((prev) => ({
                          ...prev,
                          start_time: e.target.value,
                        }))
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        color: "white",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newSession.end_time}
                      onChange={(e) =>
                        setNewSession((prev) => ({
                          ...prev,
                          end_time: e.target.value,
                        }))
                      }
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label
                    style={{
                      color: "white",
                      marginBottom: "8px",
                      display: "block",
                    }}
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    value={newSession.location}
                    onChange={(e) =>
                      setNewSession((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="form-input"
                    placeholder="Room/Location"
                  />
                </div>
                <div className="action-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateSession}
                  >
                    Create Session
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowScheduleCreator(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                  }}
                >
                  <h3 style={{ color: "white" }}>Class Schedule</h3>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowScheduleCreator(true)}
                  >
                    + Create Session
                  </button>
                </div>

                {schedule.length === 0 ? (
                  <div className="message message-info">
                    No upcoming classes scheduled
                  </div>
                ) : (
                  schedule.map((session) => (
                    <div key={session.id} className="schedule-card card">
                      <h4 style={{ color: "white" }}>{session.title}</h4>
                      <p style={{ color: "rgba(255,255,255,0.8)" }}>
                        Subject: {session.subjects?.name}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.8)" }}>
                        {new Date(session.session_date).toLocaleDateString()} •{" "}
                        {session.start_time} - {session.end_time}
                      </p>
                      {session.location && (
                        <p style={{ color: "rgba(255,255,255,0.8)" }}>
                          Location: {session.location}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Submission Grader Component
const SubmissionGrader = ({ submission, onGrade, onCancel }) => {
  const [score, setScore] = useState(submission.score || "");
  const [feedback, setFeedback] = useState(submission.feedback || "");

  return (
    <div className="card">
      <div className="card-header">
        <h3>Grade Submission</h3>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          ← Back
        </button>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h4 style={{ color: "white" }}>{submission.assignments?.title}</h4>
        <p style={{ color: "rgba(255,255,255,0.8)" }}>
          Student: {submission.student?.full_name}
        </p>
        <p style={{ color: "rgba(255,255,255,0.8)" }}>
          Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
        </p>
      </div>

      {submission.submission_text && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ color: "white" }}>Written Response</h4>
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              padding: "1rem",
              borderRadius: "8px",
              color: "rgba(255,255,255,0.9)",
              whiteSpace: "pre-wrap",
            }}
          >
            {submission.submission_text}
          </div>
        </div>
      )}

      {submission.submission_files?.length > 0 && (
        <SubmissionFilesViewer
          files={submission.submission_files}
          title="Submitted Files"
        />
      )}

      <div className="grading-form">
        <div className="form-group">
          <label
            style={{ color: "white", marginBottom: "8px", display: "block" }}
          >
            Score (out of {submission.assignments?.max_score || 100})
          </label>
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="form-input"
            min="0"
            max={submission.assignments?.max_score || 100}
          />
        </div>
        <div className="form-group">
          <label
            style={{ color: "white", marginBottom: "8px", display: "block" }}
          >
            Feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="form-input"
            rows="4"
            placeholder="Provide feedback to the student..."
          />
        </div>
        <div className="action-buttons">
          <button
            className="btn btn-primary"
            onClick={() => onGrade(submission.id, score, feedback)}
            disabled={!score || !feedback}
          >
            Submit Grade
          </button>
        </div>
      </div>
    </div>
  );
};
