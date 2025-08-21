import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import NotificationCenter from "../../components/NotificationCenter";
import "./teacherDash.css";

export default function Teachers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
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
    } catch (err) {
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherData = async (userId) => {
    try {
      // Fetch subjects taught by teacher
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .eq("teacher_id", userId);

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(
          `
          *,
          subjects(name)
        `
        )
        .eq("teacher_id", userId)
        .order("created_at", { ascending: false });

      // Fetch submissions
      const { data: submissionsData } = await supabase
        .from("assignment_submissions")
        .select(
          `
          *,
          assignments(title, subjects(name)),
          student:profiles!assignment_submissions_student_id_fkey(full_name)
        `
        )
        .in("assignment_id", assignmentsData?.map((a) => a.id) || [])
        .order("submitted_at", { ascending: false });

      // Fetch schedule
      const { data: scheduleData } = await supabase
        .from("class_sessions")
        .select(
          `
          *,
          subjects(name)
        `
        )
        .eq("teacher_id", userId)
        .gte("session_date", new Date().toISOString().split("T")[0])
        .order("session_date", { ascending: true });

      // Fetch messages
      const { data: messagesData } = await supabase
        .from("admin_messages")
        .select(
          `
          *,
          sender:profiles!admin_messages_sender_id_fkey(full_name)
        `
        )
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false });

      setSubjects(subjectsData || []);
      setAssignments(assignmentsData || []);
      setSubmissions(submissionsData || []);
      setSchedule(scheduleData || []);
      setMessages(messagesData || []);
    } catch (error) {
      console.error("Error fetching teacher data:", error);
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

  if (loading)
    return <div className="loading">Loading teacher dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="teacher-container">
      {/* Header */}
      <div className="teacher-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h1>👨‍🏫 Teacher Dashboard</h1>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <NotificationCenter user={user} />
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{assignments?.length || 0}</h3>
            <p>Total Assignments</p>
          </div>
          <div className="stat-card">
            <h3>
              {submissions?.filter((s) => s.status === "submitted").length || 0}
            </h3>
            <p>Pending Submissions</p>
          </div>
          <div className="stat-card">
            <h3>{schedule?.length || 0}</h3>
            <p>Upcoming Classes</p>
          </div>
          <div className="stat-card">
            <h3>{messages?.filter((m) => !m.is_read).length || 0}</h3>
            <p>Unread Messages</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={
              activeTab === "dashboard"
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={
              activeTab === "assignments"
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
            onClick={() => setActiveTab("assignments")}
          >
            📝 Assignments ({assignments?.length || 0})
          </button>
          <button
            className={
              activeTab === "submissions"
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
            onClick={() => setActiveTab("submissions")}
          >
            📋 Submissions (
            {submissions?.filter((s) => s.status === "submitted").length || 0})
          </button>
          <button
            className={
              activeTab === "schedule" ? "btn btn-primary" : "btn btn-secondary"
            }
            onClick={() => setActiveTab("schedule")}
          >
            📅 Schedule ({schedule?.length || 0})
          </button>
          <button
            className={
              activeTab === "messages" ? "btn btn-primary" : "btn btn-secondary"
            }
            onClick={() => setActiveTab("messages")}
          >
            📧 Messages ({messages?.filter((m) => !m.is_read).length || 0})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "dashboard" && (
          <div className="dashboard-overview">
            <div className="card">
              <h3>Welcome Back!</h3>
              <p>Here's an overview of your teaching activities.</p>

              <div style={{ marginTop: "2rem" }}>
                <h4>Recent Activity</h4>
                <div className="activity-list">
                  {submissions?.slice(0, 3).map((submission) => (
                    <div key={submission.id} className="activity-item">
                      <span>📝</span>
                      <div>
                        <strong>{submission.student?.full_name}</strong>{" "}
                        submitted
                        <em> {submission.assignments?.title}</em>
                        <br />
                        <small>{formatDate(submission.submitted_at)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="assignments-section">
            <div className="section-header">
              <h3>My Assignments</h3>
              <button className="btn btn-primary">+ Create Assignment</button>
            </div>

            <div className="assignments-grid">
              {assignments?.length === 0 ? (
                <div className="card">
                  <p>
                    No assignments created yet. Create your first assignment!
                  </p>
                </div>
              ) : (
                assignments?.map((assignment) => (
                  <div key={assignment.id} className="card assignment-card">
                    <h4>{assignment.title}</h4>
                    <p>Subject: {assignment.subjects?.name}</p>
                    <p>{assignment.description}</p>
                    {assignment.due_date && (
                      <p>Due: {formatDate(assignment.due_date)}</p>
                    )}
                    <span
                      className={
                        assignment.is_published
                          ? "status-published"
                          : "status-draft"
                      }
                    >
                      {assignment.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "submissions" && (
          <div className="submissions-section">
            <h3>Student Submissions</h3>

            <div className="submissions-list">
              {submissions?.length === 0 ? (
                <div className="card">
                  <p>No submissions yet.</p>
                </div>
              ) : (
                submissions?.map((submission) => (
                  <div key={submission.id} className="card submission-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <h4>{submission.assignments?.title}</h4>
                        <p>Student: {submission.student?.full_name}</p>
                        <p>Subject: {submission.assignments?.subjects?.name}</p>
                        <p>Submitted: {formatDate(submission.submitted_at)}</p>
                      </div>
                      <div>
                        <span className={`status-${submission.status}`}>
                          {submission.status === "graded"
                            ? `Graded (${submission.score})`
                            : "Pending"}
                        </span>
                        <br />
                        <button
                          className="btn btn-primary btn-sm"
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
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="schedule-section">
            <div className="section-header">
              <h3>Class Schedule</h3>
              <button className="btn btn-primary">+ Create Session</button>
            </div>

            <div className="schedule-list">
              {schedule?.length === 0 ? (
                <div className="card">
                  <p>No upcoming classes scheduled.</p>
                </div>
              ) : (
                schedule?.map((session) => (
                  <div key={session.id} className="card schedule-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <h4>{session.title}</h4>
                        <p>Subject: {session.subjects?.name}</p>
                        <p>
                          {new Date(session.session_date).toLocaleDateString()}{" "}
                          • {session.start_time} - {session.end_time}
                        </p>
                        {session.location && (
                          <p>Location: {session.location}</p>
                        )}
                        {session.description && <p>{session.description}</p>}
                      </div>
                      <span
                        className={`status-${
                          session.approval_status || "pending"
                        }`}
                      >
                        {session.approval_status === "approved" &&
                          "✅ Approved"}
                        {session.approval_status === "rejected" &&
                          "❌ Rejected"}
                        {(!session.approval_status ||
                          session.approval_status === "pending") &&
                          "⏳ Pending"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="messages-section">
            <h3>Messages from Administration</h3>

            <div className="messages-list">
              {messages?.length === 0 ? (
                <div className="card">
                  <p>No messages from administrators yet.</p>
                </div>
              ) : (
                messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`card message-card ${
                      !message.is_read ? "unread" : ""
                    }`}
                  >
                    <div className="message-header">
                      <h4>{message.subject}</h4>
                      <div className="message-meta">
                        <span>From: {message.sender?.full_name}</span>
                        <span>{formatDate(message.created_at)}</span>
                      </div>
                    </div>
                    <div className="message-content">
                      <p>{message.content}</p>
                    </div>
                    {!message.is_read && (
                      <div className="unread-indicator">📬 New</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
