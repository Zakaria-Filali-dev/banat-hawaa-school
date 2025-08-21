import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import NotificationCenter from "../../components/NotificationCenter";
import "./students.css";

export default function Students() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
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

      if (profileError || profile?.role !== "student") {
        navigate("/login");
        return;
      }

      setUser(userData.user);
      await fetchStudentData(userData.user.id);
    } catch (err) {
      setError("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async (userId) => {
    try {
      // Fetch assignments available to student
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(
          `
          *,
          subjects(name),
          teacher:profiles!assignments_teacher_id_fkey(full_name)
        `
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      // Fetch student submissions
      const { data: submissionsData } = await supabase
        .from("assignment_submissions")
        .select(
          `
          *,
          assignments(title, subjects(name))
        `
        )
        .eq("student_id", userId)
        .order("submitted_at", { ascending: false });

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from("announcements")
        .select("*")
        .in("audience", ["all", "students"])
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      // Fetch schedule
      const { data: scheduleData } = await supabase
        .from("class_sessions")
        .select(
          `
          *,
          subjects(name),
          teacher:profiles!class_sessions_teacher_id_fkey(full_name)
        `
        )
        .eq("approval_status", "approved")
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

      setAssignments(assignmentsData || []);
      setSubmissions(submissionsData || []);
      setAnnouncements(announcementsData || []);
      setSchedule(scheduleData || []);
      setMessages(messagesData || []);
    } catch (error) {
      console.error("Error fetching student data:", error);
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
    return <div className="loading">Loading student dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="student-container">
      {/* Header */}
      <div className="student-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h1>📚 Student Dashboard</h1>
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
            <p>Available Assignments</p>
          </div>
          <div className="stat-card">
            <h3>{submissions?.length || 0}</h3>
            <p>My Submissions</p>
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
              activeTab === "announcements"
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
            onClick={() => setActiveTab("announcements")}
          >
            📢 Announcements ({announcements?.length || 0})
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
              <p>Here's an overview of your academic activities.</p>

              <div style={{ marginTop: "2rem" }}>
                <h4>Recent Assignments</h4>
                <div className="activity-list">
                  {assignments?.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="activity-item">
                      <span>📝</span>
                      <div>
                        <strong>{assignment.title}</strong> -{" "}
                        {assignment.subjects?.name}
                        <br />
                        <small>Teacher: {assignment.teacher?.full_name}</small>
                        {assignment.due_date && (
                          <>
                            <br />
                            <small>
                              Due: {formatDate(assignment.due_date)}
                            </small>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {announcements?.length > 0 && (
                <div style={{ marginTop: "2rem" }}>
                  <h4>Latest Announcements</h4>
                  <div className="activity-list">
                    {announcements?.slice(0, 2).map((announcement) => (
                      <div key={announcement.id} className="activity-item">
                        <span>📢</span>
                        <div>
                          <strong>{announcement.title}</strong>
                          <br />
                          <small>{formatDate(announcement.created_at)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="assignments-section">
            <h3>Available Assignments</h3>

            <div className="assignments-grid">
              {assignments?.length === 0 ? (
                <div className="card">
                  <p>No assignments available at the moment.</p>
                </div>
              ) : (
                assignments?.map((assignment) => {
                  const submission = submissions?.find(
                    (s) => s.assignment_id === assignment.id
                  );
                  return (
                    <div key={assignment.id} className="card assignment-card">
                      <h4>{assignment.title}</h4>
                      <p>Subject: {assignment.subjects?.name}</p>
                      <p>Teacher: {assignment.teacher?.full_name}</p>
                      <p>{assignment.description}</p>
                      {assignment.due_date && (
                        <p>Due: {formatDate(assignment.due_date)}</p>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "1rem",
                        }}
                      >
                        {submission ? (
                          <span className={`status-${submission.status}`}>
                            {submission.status === "graded"
                              ? `Graded (${submission.score})`
                              : "Submitted"}
                          </span>
                        ) : (
                          <span className="status-pending">Not Submitted</span>
                        )}

                        <button className="btn btn-primary btn-sm">
                          {submission ? "View Submission" : "Submit Assignment"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "announcements" && (
          <div className="announcements-section">
            <h3>School Announcements</h3>

            <div className="announcements-list">
              {announcements?.length === 0 ? (
                <div className="card">
                  <p>No announcements at the moment.</p>
                </div>
              ) : (
                announcements?.map((announcement) => (
                  <div key={announcement.id} className="card announcement-card">
                    <div className="announcement-header">
                      <h4>{announcement.title}</h4>
                      <span
                        className={`priority-${
                          announcement.priority || "normal"
                        }`}
                      >
                        {announcement.priority === "high" && "🔴 High Priority"}
                        {announcement.priority === "medium" &&
                          "🟡 Medium Priority"}
                        {(!announcement.priority ||
                          announcement.priority === "normal") &&
                          "📢 Normal"}
                      </span>
                    </div>
                    <div className="announcement-content">
                      <p>{announcement.content}</p>
                    </div>
                    <div className="announcement-meta">
                      <small>{formatDate(announcement.created_at)}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="schedule-section">
            <h3>Class Schedule</h3>

            <div className="schedule-list">
              {schedule?.length === 0 ? (
                <div className="card">
                  <p>No upcoming classes scheduled.</p>
                </div>
              ) : (
                schedule?.map((session) => (
                  <div key={session.id} className="card schedule-card">
                    <h4>{session.title}</h4>
                    <p>Subject: {session.subjects?.name}</p>
                    <p>Teacher: {session.teacher?.full_name}</p>
                    <p>
                      {new Date(session.session_date).toLocaleDateString()} •{" "}
                      {session.start_time} - {session.end_time}
                    </p>
                    {session.location && <p>Location: {session.location}</p>}
                    {session.description && (
                      <div style={{ marginTop: "1rem" }}>
                        <p>{session.description}</p>
                      </div>
                    )}
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
