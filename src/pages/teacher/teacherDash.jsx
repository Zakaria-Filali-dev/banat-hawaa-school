import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MessageModal from "../../components/MessageModal";
import { supabase } from "../../services/supabaseClient";
import AssignmentCreator from "../../components/assignments/AssignmentCreator";
import SubmissionFilesViewer from "../../components/SubmissionFilesViewer";
import SuspensionNotificationModal from "../../components/SuspensionNotificationModal";
import "./teacherDash.css";

export default function Teachers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState("assignments");
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showAssignmentCreator, setShowAssignmentCreator] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showCancelSessionModal, setShowCancelSessionModal] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    subject_id: "",
    session_date: "",
    start_time: "",
    end_time: "",
    location: "",
    max_students: 10,
  });
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [personalInfo, setPersonalInfo] = useState({
    profile: null,
    subjects: [],
    totalAssignments: 0,
    totalSessions: 0,
    activeStudents: 0,
    joinDate: null,
  });
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [suspensionInfo, setSuspensionInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchTeacherSubjects = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("teacher_subjects")
        .select(
          `
          subject:subjects(
            id, 
            name
          )
        `
        )
        .eq("teacher_id", user.id);

      console.log("FetchTeacherSubjects data:", data);
      console.log("FetchTeacherSubjects error:", error);

      if (error) throw error;
      setTeacherSubjects(data?.map((ts) => ts.subject).filter(Boolean) || []);
    } catch (error) {
      console.error("Error fetching teacher subjects:", error);
    }
  }, [user?.id]);

  const fetchPersonalInfo = useCallback(async (userId) => {
    if (!userId) return;

    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Check if user is suspended
      if (profile?.status === "suspended") {
        setSuspensionInfo({
          category: "Account Suspended",
          details: "Your account has been suspended by an administrator.",
          date: new Date().toISOString(),
        });
        setShowSuspensionModal(true);
        return; // Don't proceed with other data fetching
      }

      // Fetch teacher subjects with student count
      const { data: teacherSubjectsData, error: subjectsError } = await supabase
        .from("teacher_subjects")
        .select(
          `
          subject:subjects(
            id, 
            name
          )
        `
        )
        .eq("teacher_id", userId);

      console.log("Teacher subjects data:", teacherSubjectsData);
      console.log("Teacher subjects error:", subjectsError);

      // Get subjects array from the data
      const subjects =
        teacherSubjectsData?.map((ts) => ts.subject).filter(Boolean) || [];
      console.log("Processed subjects:", subjects);

      // Count unique students across all subjects (separate query for better performance)
      let uniqueStudents = new Set();
      if (subjects.length > 0) {
        const subjectIds = subjects.map((s) => s.id);
        const { data: studentSubjectsData } = await supabase
          .from("student_subjects")
          .select("student_id")
          .in("subject_id", subjectIds);

        studentSubjectsData?.forEach((ss) => {
          uniqueStudents.add(ss.student_id);
        });
      }

      // Count total assignments created
      const { count: assignmentCount } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", userId);

      // Count total sessions conducted
      const { count: sessionCount } = await supabase
        .from("class_sessions")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", userId)
        .neq("is_cancelled", true);

      setPersonalInfo({
        profile,
        subjects: subjects,
        totalAssignments: assignmentCount || 0,
        totalSessions: sessionCount || 0,
        activeStudents: uniqueStudents.size,
        joinDate: profile?.created_at,
      });
    } catch (error) {
      console.error("Error fetching personal info:", error);
    }
  }, []);

  const fetchTeacherData = useCallback(
    async (userId) => {
      try {
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

        // Fetch class schedule (including past sessions for consistency)
        const { data: scheduleData } = await supabase
          .from("class_sessions")
          .select(
            `
          *,
          subjects(name),
          class_attendance(count),
          teacher:profiles!class_sessions_teacher_id_fkey(full_name, email)
        `
          )
          .eq("teacher_id", userId)
          .order("session_date", { ascending: false });

        // Fetch recent notifications (new submissions)
        const { data: notificationsData } = await supabase
          .from("notifications")
          .select("*")
          .eq("recipient_id", userId)
          .eq("type", "assignment")
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(10);

        // Fetch messages from admin
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

        // Fetch announcements (school-wide, teacher-specific, and subject-specific)
        const { data: announcementsData } = await supabase
          .from("announcements")
          .select(
            `
          *,
          author:profiles!announcements_author_id_fkey(full_name),
          subjects(name)
        `
          )
          .or(
            `target_audience.eq.all,target_audience.eq.teachers,author_id.eq.${userId}`
          )
          .eq("is_published", true)
          .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
          .order("created_at", { ascending: false });

        setAssignments(assignmentsData || []);
        setSubmissions(submissionsData || []);
        setSchedule(scheduleData || []);
        setNotifications(notificationsData || []);
        setMessages(messagesData || []);
        setAnnouncements(announcementsData || []);

        // Fetch teacher subjects for session creation
        await fetchTeacherSubjects();

        // Fetch personal info data
        await fetchPersonalInfo(userId);
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        setError("Failed to load dashboard data");
      }
    },
    [fetchTeacherSubjects, fetchPersonalInfo]
  );

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
  }, [navigate, fetchTeacherData]);

  // Handle URL tab parameter from notifications
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");

    if (tabParam) {
      // Valid teacher tabs
      const validTabs = [
        "assignments",
        "submissions",
        "schedule",
        "messages",
        "profile",
      ];

      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
        // Clear the URL parameter
        window.history.replaceState({}, "", "/teacher");
      }
    }
  }, [location.search]);

  // Real-time subscription for profile status changes
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel(`profile_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          // Show suspension modal if status changed to suspended
          if (
            payload.new?.status === "suspended" &&
            payload.old?.status !== "suspended"
          ) {
            setSuspensionInfo({
              category: "Account Suspended",
              details: "Your account has been suspended by an administrator.",
              date: new Date().toISOString(),
            });
            setShowSuspensionModal(true);
          } else if (
            payload.new?.status === "active" &&
            payload.old?.status === "suspended"
          ) {
            setShowSuspensionModal(false);
            setSuspensionInfo(null);
            setSuccessMessage("Your account has been reactivated.");
            setError(""); // Clear any suspension messages
            // Re-fetch data when unsuspended
            fetchPersonalInfo(user.id);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, fetchPersonalInfo]);

  const handleCreateSession = async () => {
    try {
      if (
        !newSession.title ||
        !newSession.subject_id ||
        !newSession.session_date ||
        !newSession.start_time ||
        !newSession.end_time
      ) {
        setError("Please fill in all required fields");
        setErrorDetails("");
        return;
      }

      // Validate subject_id is in teacherSubjects
      const validSubject = teacherSubjects.some(
        (subj) => subj.id === newSession.subject_id
      );
      if (!validSubject) {
        setError(
          "Invalid subject selected. Please choose one of your subjects."
        );
        setErrorDetails("");
        return;
      }

      const { error } = await supabase
        .from("class_sessions")
        .insert([
          {
            ...newSession,
            teacher_id: user.id,
            status: "pending_approval",
            approval_status: "pending",
          },
        ])
        .select();

      if (error) {
        setError("Failed to create session");
        setErrorDetails(error?.message || JSON.stringify(error));
        return;
      }

      setSuccessMessage(
        "Session created successfully! Waiting for admin approval."
      );
      setError("");
      setErrorDetails("");
      setShowSessionForm(false);

      // Smooth scroll back to schedule section after form closes
      setTimeout(() => {
        const scheduleElement = document.querySelector("#schedule-card-header");
        if (scheduleElement) {
          scheduleElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }, 100);

      setNewSession({
        title: "",
        description: "",
        subject_id: "",
        session_date: "",
        start_time: "",
        end_time: "",
        location: "",
        max_students: 10,
      });

      // Refresh schedule data
      await fetchTeacherData(user.id);
    } catch (error) {
      console.error("Error creating session:", error);
      setError("Failed to create session");
      setErrorDetails(error?.message || JSON.stringify(error));
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
        // Notification system removed. No notification insert needed for grading.
      }

      await fetchTeacherData(user.id);
      setSelectedSubmission(null);
    } catch (error) {
      setError("Failed to grade submission: " + error.message);
    }
  };

  // (Removed schedule creation handler for now to keep UI lean and lint-clean)

  const markAllMessagesAsRead = async () => {
    try {
      const unreadMessageIds = messages
        .filter((m) => !m.is_read)
        .map((m) => m.id);

      if (unreadMessageIds.length === 0) return;

      await supabase
        .from("admin_messages")
        .update({ is_read: true })
        .in("id", unreadMessageIds);

      // Update local state
      setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
    } catch (error) {
      console.error("Error marking all messages as read:", error);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this assignment? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Delete assignment attachments first
      await supabase
        .from("assignment_attachments")
        .delete()
        .eq("assignment_id", assignmentId);

      // Delete assignment submissions
      await supabase
        .from("assignment_submissions")
        .delete()
        .eq("assignment_id", assignmentId);

      // Delete the assignment itself
      await supabase.from("assignments").delete().eq("id", assignmentId);

      // Refresh the assignments list
      await fetchTeacherData(user.id);
    } catch (error) {
      console.error("Error deleting assignment:", error);
      setError("Failed to delete assignment: " + error.message);
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setShowAssignmentCreator(true);
  };

  const handleCancelSession = (session) => {
    setSessionToCancel(session);
    setShowCancelSessionModal(true);
    setCancelReason("");
  };

  const handleConfirmCancelSession = async () => {
    if (!sessionToCancel || !cancelReason.trim()) {
      setError("Please provide a reason for cancellation");
      return;
    }

    try {
      setError("");

      // Update session status to cancelled
      const { error: updateError } = await supabase
        .from("class_sessions")
        .update({
          is_cancelled: true,
          cancellation_reason: cancelReason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionToCancel.id);

      if (updateError) throw updateError;

      // Send message to admin about the cancellation
      const { data: adminProfiles, error: adminError } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (adminError) throw adminError;

      if (adminProfiles && adminProfiles.length > 0) {
        const messagePromises = adminProfiles.map((admin) =>
          supabase.from("admin_messages").insert({
            sender_id: user.id,
            recipient_id: admin.id,
            subject: "Session Cancellation Request",
            content: `Teacher has cancelled a class session.\n\nSession Details:\n- Title: ${
              sessionToCancel.title
            }\n- Subject: ${sessionToCancel.subjects?.name}\n- Date: ${new Date(
              sessionToCancel.session_date
            ).toLocaleDateString()}\n- Time: ${sessionToCancel.start_time} - ${
              sessionToCancel.end_time
            }\n\nReason for cancellation:\n${cancelReason.trim()}`,
            is_read: false,
          })
        );
        await Promise.all(messagePromises);
      }

      // Refresh the schedule data
      await fetchTeacherData(user.id);

      // Close modal and reset state
      setShowCancelSessionModal(false);
      setSessionToCancel(null);
      setCancelReason("");

      // Show success message
      setSuccessMessage(
        "Session cancelled successfully. Admin has been notified."
      );

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Error cancelling session:", error);
      setError("Failed to cancel session: " + error.message);
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

  // Error popup modal
  const handleCloseErrorModal = () => {
    setError("");
    setErrorDetails("");
  };

  // Show error modal if error exists
  if (error) {
    return (
      <MessageModal
        message={error + (errorDetails ? `\nDetails: ${errorDetails}` : "")}
        type="error"
        onClose={handleCloseErrorModal}
      />
    );
  }

  return (
    <div className="teacher-dashboard">
      <div className="teacher-container">
        {successMessage && (
          <div
            className="message message-success"
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              zIndex: 1001,
              maxWidth: "400px",
              animation: "slideInRight 0.3s ease-out",
            }}
          >
            {successMessage}
          </div>
        )}

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

        {showCancelSessionModal && (
          <div className="logout-modal-overlay">
            <div className="logout-modal-content">
              <h2>Cancel Session</h2>
              <p>Are you sure you want to cancel this session?</p>
              <div className="form-group">
                <label>Reason for cancellation:</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling this session..."
                  className="form-textarea"
                  rows="3"
                  required
                />
              </div>
              <div className="logout-modal-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowCancelSessionModal(false);
                    setSessionToCancel(null);
                    setCancelReason("");
                  }}
                >
                  Keep Session
                </button>
                <button
                  className="confirm-btn"
                  onClick={handleConfirmCancelSession}
                  disabled={!cancelReason.trim()}
                >
                  Cancel Session
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="teacher-header">
          <h1>👨‍🏫 Teacher Dashboard</h1>
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowLogoutModal(true)}
            >
              Logout
            </button>
          </div>
        </div>

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
            <h3>{notifications?.length || 0}</h3>
            <p>Notifications</p>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="notifications-section">
            <h3 style={{ color: "white", marginBottom: "1rem" }}>
              Recent Notifications
            </h3>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="notification-item card"
                style={{ marginBottom: "0.5rem" }}
              >
                <div className="card-header">
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

        <div className="dashboard-tabs">
          <button
            className={
              activeTab === "assignments"
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
            onClick={() => setActiveTab("assignments")}
            data-tab="assignments"
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
          <button
            className={
              activeTab === "messages" ? "btn btn-primary" : "btn btn-secondary"
            }
            onClick={() => setActiveTab("messages")}
            data-tab="messages"
          >
            <span className="tab-content-wrapper">
              📧 Messages ({messages.length})
              {messages.filter((m) => !m.is_read).length > 0 && (
                <span className="unread-badge">
                  {messages.filter((m) => !m.is_read).length}
                </span>
              )}
            </span>
          </button>
          <button
            className={
              activeTab === "profile" ? "btn btn-primary" : "btn btn-secondary"
            }
            onClick={() => setActiveTab("profile")}
            data-tab="profile"
          >
            👤 Personal Info
          </button>
          <button
            className={
              activeTab === "announcements"
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
            onClick={() => setActiveTab("announcements")}
            data-tab="announcements"
          >
            📢 Announcements ({announcements.length})
          </button>
        </div>

        {activeTab === "assignments" && (
          <div className="tab-content">
            {showAssignmentCreator ? (
              <AssignmentCreator
                editingAssignment={editingAssignment}
                onAssignmentCreated={() => {
                  setShowAssignmentCreator(false);
                  setEditingAssignment(null);
                  fetchTeacherData(user.id);
                }}
                onCancel={() => {
                  setShowAssignmentCreator(false);
                  setEditingAssignment(null);
                }}
              />
            ) : (
              <div>
                <div className="card-header">
                  <h3>My Assignments</h3>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingAssignment(null);
                      setShowAssignmentCreator(true);
                    }}
                  >
                    + Create Assignment
                  </button>
                </div>

                {assignments.length === 0 ? (
                  <div className="message message-info">
                    No assignments created yet. Create your first assignment!
                  </div>
                ) : (
                  <div className="assignments-grid">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="assignment-card card">
                        <div className="card-header">
                          <div>
                            <h3>{assignment.title}</h3>
                            <p style={{ color: "rgba(255,255,255,0.8)" }}>
                              Subject: {assignment.subjects?.name}
                            </p>
                            {assignment.description && (
                              <p style={{ color: "rgba(255,255,255,0.8)" }}>
                                {assignment.description}
                              </p>
                            )}
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

                        {/* Assignment Actions */}
                        <div className="assignment-actions">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEditAssignment(assignment)}
                            title="Edit Assignment"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              handleDeleteAssignment(assignment.id)
                            }
                            title="Delete Assignment"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
                <div className="card-header">
                  <h3>Student Submissions</h3>
                </div>
                {submissions.length === 0 ? (
                  <div className="message message-info">No submissions yet</div>
                ) : (
                  <div>
                    {submissions.map((submission) => (
                      <div key={submission.id} className="submission-card card">
                        <div className="card-header">
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
                              {submission.status === "graded"
                                ? "View"
                                : "Grade"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="tab-content">
            <div className="card-header" id="schedule-card-header">
              <h3>Class Schedule</h3>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowSessionForm(!showSessionForm);
                  if (!showSessionForm) {
                    // Smooth scroll to form when opening
                    setTimeout(() => {
                      const formElement =
                        document.getElementById("session-form");
                      if (formElement) {
                        formElement.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                          inline: "nearest",
                        });
                      }
                    }, 100);
                  }
                }}
              >
                {showSessionForm ? "✕ Cancel" : "+ Create Session"}
              </button>
            </div>

            {showSessionForm && (
              <div
                id="session-form"
                className="session-form-container"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "16px",
                  padding: "2rem",
                  margin: "1rem 0",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                  animation:
                    "slideInDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  scrollMarginTop: "20px",
                }}
              >
                <h3
                  style={{
                    color: "white",
                    marginBottom: "1.5rem",
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  📅 Create New Session
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateSession();
                  }}
                  style={{ scrollBehavior: "smooth" }}
                >
                  <div className="form-row">
                    <div className="form-group">
                      <label>Session Title *</label>
                      <input
                        type="text"
                        value={newSession.title}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            title: e.target.value,
                          })
                        }
                        placeholder="Enter session title"
                        required
                        style={{
                          transition: "all 0.3s ease",
                          transform: "scale(1)",
                        }}
                        onFocus={(e) =>
                          (e.target.style.transform = "scale(1.02)")
                        }
                        onBlur={(e) => (e.target.style.transform = "scale(1)")}
                      />
                    </div>

                    <div className="form-group">
                      <label>Subject *</label>
                      <select
                        value={newSession.subject_id}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            subject_id: e.target.value,
                          })
                        }
                        required
                        style={{
                          transition: "all 0.3s ease",
                          transform: "scale(1)",
                        }}
                        onFocus={(e) =>
                          (e.target.style.transform = "scale(1.02)")
                        }
                        onBlur={(e) => (e.target.style.transform = "scale(1)")}
                      >
                        <option value="">Select a subject</option>
                        {teacherSubjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date *</label>
                      <input
                        type="date"
                        value={newSession.session_date}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            session_date: e.target.value,
                          })
                        }
                        min={new Date().toISOString().split("T")[0]}
                        required
                        style={{
                          transition: "all 0.3s ease",
                          transform: "scale(1)",
                        }}
                        onFocus={(e) =>
                          (e.target.style.transform = "scale(1.02)")
                        }
                        onBlur={(e) => (e.target.style.transform = "scale(1)")}
                      />
                    </div>

                    <div className="form-group">
                      <label>Start Time *</label>
                      <input
                        type="time"
                        value={newSession.start_time}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            start_time: e.target.value,
                          })
                        }
                        required
                        style={{
                          transition: "all 0.3s ease",
                          transform: "scale(1)",
                        }}
                        onFocus={(e) =>
                          (e.target.style.transform = "scale(1.02)")
                        }
                        onBlur={(e) => (e.target.style.transform = "scale(1)")}
                      />
                    </div>

                    <div className="form-group">
                      <label>End Time *</label>
                      <input
                        type="time"
                        value={newSession.end_time}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            end_time: e.target.value,
                          })
                        }
                        required
                        style={{
                          transition: "all 0.3s ease",
                          transform: "scale(1)",
                        }}
                        onFocus={(e) =>
                          (e.target.style.transform = "scale(1.02)")
                        }
                        onBlur={(e) => (e.target.style.transform = "scale(1)")}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newSession.description}
                      onChange={(e) =>
                        setNewSession({
                          ...newSession,
                          description: e.target.value,
                        })
                      }
                      placeholder="Session description (optional)"
                      rows="3"
                      style={{
                        transition: "all 0.3s ease",
                        transform: "scale(1)",
                        resize: "vertical",
                      }}
                      onFocus={(e) =>
                        (e.target.style.transform = "scale(1.01)")
                      }
                      onBlur={(e) => (e.target.style.transform = "scale(1)")}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Location</label>
                      <input
                        type="text"
                        value={newSession.location}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            location: e.target.value,
                          })
                        }
                        placeholder="Session location (optional)"
                        style={{
                          transition: "all 0.3s ease",
                          transform: "scale(1)",
                        }}
                        onFocus={(e) =>
                          (e.target.style.transform = "scale(1.02)")
                        }
                        onBlur={(e) => (e.target.style.transform = "scale(1)")}
                      />
                    </div>

                    <div className="form-group">
                      <label>Max Students</label>
                      <input
                        type="number"
                        value={newSession.max_students}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            max_students: parseInt(e.target.value),
                          })
                        }
                        min="1"
                        max="50"
                        style={{
                          transition: "all 0.3s ease",
                          transform: "scale(1)",
                        }}
                        onFocus={(e) =>
                          (e.target.style.transform = "scale(1.02)")
                        }
                        onBlur={(e) => (e.target.style.transform = "scale(1)")}
                      />
                    </div>
                  </div>

                  <div
                    className="form-buttons"
                    style={{
                      display: "flex",
                      gap: "1rem",
                      justifyContent: "center",
                      marginTop: "2rem",
                    }}
                  >
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setShowSessionForm(false);
                        setNewSession({
                          title: "",
                          description: "",
                          subject_id: "",
                          session_date: "",
                          start_time: "",
                          end_time: "",
                          location: "",
                          max_students: 10,
                        });
                      }}
                      style={{
                        background:
                          "linear-gradient(135deg, #6c757d 0%, #5a6268 100%)",
                        border: "none",
                        color: "white",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition:
                          "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        transform: "scale(1)",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.transform = "scale(1.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.transform = "scale(1)")
                      }
                    >
                      ✕ Cancel
                    </button>
                    <button
                      type="submit"
                      className="confirm-btn"
                      disabled={
                        !newSession.title ||
                        !newSession.subject_id ||
                        !newSession.session_date ||
                        !newSession.start_time ||
                        !newSession.end_time
                      }
                      style={{
                        background:
                          !newSession.title ||
                          !newSession.subject_id ||
                          !newSession.session_date ||
                          !newSession.start_time ||
                          !newSession.end_time
                            ? "#6c757d"
                            : "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                        border: "none",
                        color: "white",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        fontWeight: "500",
                        cursor:
                          !newSession.title ||
                          !newSession.subject_id ||
                          !newSession.session_date ||
                          !newSession.start_time ||
                          !newSession.end_time
                            ? "not-allowed"
                            : "pointer",
                        transition:
                          "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        transform: "scale(1)",
                        opacity:
                          !newSession.title ||
                          !newSession.subject_id ||
                          !newSession.session_date ||
                          !newSession.start_time ||
                          !newSession.end_time
                            ? 0.6
                            : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!e.target.disabled)
                          e.target.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) =>
                        (e.target.style.transform = "scale(1)")
                      }
                    >
                      ✅ Create Session
                    </button>
                  </div>
                </form>
              </div>
            )}

            {schedule.length === 0 ? (
              <div className="message message-info">
                No upcoming classes scheduled
              </div>
            ) : (
              <div>
                {schedule.map((session) => (
                  <div key={session.id} className="schedule-card card">
                    <div className="session-content">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <h4 style={{ color: "white", margin: 0 }}>
                          {session.title}
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          {session.is_cancelled && (
                            <span
                              style={{
                                background:
                                  "linear-gradient(135deg, #e74c3c, #c0392b)",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "12px",
                                fontSize: "0.8rem",
                                fontWeight: "500",
                              }}
                            >
                              cancelled
                            </span>
                          )}
                          {!session.is_cancelled && session.approval_status && (
                            <span
                              style={{
                                background:
                                  session.approval_status === "approved"
                                    ? "linear-gradient(135deg, #27ae60, #229954)"
                                    : session.approval_status === "rejected"
                                    ? "linear-gradient(135deg, #e74c3c, #c0392b)"
                                    : "linear-gradient(135deg, #f39c12, #e67e22)",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "12px",
                                fontSize: "0.8rem",
                                fontWeight: "500",
                              }}
                            >
                              {session.approval_status
                                .replace("_", " ")
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.8)" }}>
                        Subject: {session.subjects?.name}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.8)" }}>
                        <strong>Date:</strong>{" "}
                        {new Date(session.session_date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.8)" }}>
                        <strong>Time:</strong> {session.start_time} -{" "}
                        {session.end_time}
                      </p>
                      {session.location && (
                        <p style={{ color: "rgba(255,255,255,0.8)" }}>
                          <strong>Location:</strong> {session.location}
                        </p>
                      )}
                      {session.description && (
                        <p style={{ color: "rgba(255,255,255,0.8)" }}>
                          <strong>Description:</strong> {session.description}
                        </p>
                      )}
                      {session.max_students && (
                        <p style={{ color: "rgba(255,255,255,0.8)" }}>
                          <strong>Max Students:</strong> {session.max_students}
                        </p>
                      )}
                      {session.is_cancelled && session.cancellation_reason && (
                        <div
                          style={{
                            background: "rgba(231, 76, 60, 0.1)",
                            border: "1px solid rgba(231, 76, 60, 0.3)",
                            borderRadius: "8px",
                            padding: "12px",
                            marginTop: "0.5rem",
                          }}
                        >
                          <p
                            style={{
                              color: "#e74c3c",
                              fontWeight: "bold",
                              margin: "0 0 4px 0",
                              fontSize: "0.9rem",
                            }}
                          >
                            Cancellation Reason:
                          </p>
                          <p
                            style={{
                              color: "#e74c3c",
                              margin: 0,
                              fontSize: "0.9rem",
                            }}
                          >
                            {session.cancellation_reason}
                          </p>
                          <p
                            style={{
                              color: "rgba(231, 76, 60, 0.8)",
                              margin: "8px 0 0 0",
                              fontSize: "0.8rem",
                            }}
                          >
                            Cancelled on:{" "}
                            {new Date(session.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {!session.is_cancelled && (
                      <div className="session-actions">
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancelSession(session)}
                          title="Cancel Session"
                        >
                          🚫 Cancel Session
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="tab-content">
            <div className="section-header">
              <div>
                <h2>Messages from Admin</h2>
                <p>View messages sent to you by the administration</p>
              </div>
              {messages.some((m) => !m.is_read) && (
                <button
                  className="btn btn-primary"
                  onClick={markAllMessagesAsRead}
                  title="Mark all messages as read"
                >
                  ✓ Mark All Read
                </button>
              )}
            </div>

            <div className="messages-list">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message-card card ${
                      !message.is_read ? "unread-message" : ""
                    }`}
                  >
                    <div className="message-header">
                      <div className="message-meta">
                        <h4 style={{ color: "white", margin: 0 }}>
                          {message.subject}
                        </h4>
                        <div
                          style={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: "0.9rem",
                            marginTop: "0.25rem",
                          }}
                        >
                          <span>From: {message.sender?.full_name}</span>
                          <span style={{ margin: "0 0.5rem" }}>•</span>
                          <span>
                            {new Date(message.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="message-actions">
                        <div
                          className={`read-status ${
                            message.is_read ? "read" : "unread"
                          }`}
                        >
                          {message.is_read ? "✅ Read" : "📬 New"}
                        </div>
                        {!message.is_read && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={async () => {
                              try {
                                await supabase
                                  .from("admin_messages")
                                  .update({ is_read: true })
                                  .eq("id", message.id);

                                // Update local state
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.id === message.id
                                      ? { ...m, is_read: true }
                                      : m
                                  )
                                );
                              } catch (error) {
                                console.error(
                                  "Error marking message as read:",
                                  error
                                );
                              }
                            }}
                            title="Mark as Read"
                          >
                            ✓ Mark Read
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="message-content">
                      <p
                        style={{
                          color: "rgba(255,255,255,0.9)",
                          lineHeight: "1.6",
                          margin: "1rem 0 0 0",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="message message-info">
                  <h3>📧 No Messages</h3>
                  <p>
                    You haven't received any messages from the administration
                    yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personal Info Tab */}
        {activeTab === "profile" && (
          <div className="tab-content">
            <div className="section-header">
              <div>
                <h2>👤 Personal Information</h2>
                <p>Your teaching profile and statistics</p>
              </div>
            </div>

            <div className="personal-info-grid">
              {/* Profile Card */}
              <div className="profile-card card">
                <div className="card-header">
                  <h3>📋 Profile Details</h3>
                </div>
                <div className="profile-content">
                  <div className="profile-item">
                    <span className="profile-label">👤 Full Name:</span>
                    <span className="profile-value">
                      {personalInfo.profile?.full_name || "Not provided"}
                    </span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">📧 Email:</span>
                    <span className="profile-value">
                      {personalInfo.profile?.email || user?.email}
                    </span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">👨‍🏫 Role:</span>
                    <span className="profile-value">Teacher</span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">📅 Join Date:</span>
                    <span className="profile-value">
                      {personalInfo.joinDate
                        ? new Date(personalInfo.joinDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Teaching Statistics */}
              <div className="stats-card card">
                <div className="card-header">
                  <h3>📊 Teaching Statistics</h3>
                </div>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-number">
                      {personalInfo.subjects.length}
                    </div>
                    <div className="stat-label">📚 Subjects Teaching</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">
                      {personalInfo.activeStudents}
                    </div>
                    <div className="stat-label">👥 Active Students</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">
                      {personalInfo.totalAssignments}
                    </div>
                    <div className="stat-label">📝 Assignments Created</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">
                      {personalInfo.totalSessions}
                    </div>
                    <div className="stat-label">🎓 Sessions Conducted</div>
                  </div>
                </div>
              </div>

              {/* Subjects Teaching */}
              <div className="subjects-card card">
                <div className="card-header">
                  <h3>📚 Subjects Teaching</h3>
                </div>
                <div className="subjects-list">
                  {personalInfo.subjects.length > 0 ? (
                    personalInfo.subjects.map((subject, index) => (
                      <div key={subject?.id || index} className="subject-item">
                        <div className="subject-icon">📖</div>
                        <div className="subject-details">
                          <h4>{subject?.name || "Unknown Subject"}</h4>
                          <p>Subject ID: {subject?.id}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="message message-info">
                      <p>🔍 No subjects assigned yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="activity-card card">
                <div className="card-header">
                  <h3>🚀 Recent Activity</h3>
                </div>
                <div className="activity-content">
                  <div className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-text">
                      <strong>Assignments:</strong> You have created{" "}
                      {personalInfo.totalAssignments} assignments
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">🎓</div>
                    <div className="activity-text">
                      <strong>Sessions:</strong> You have conducted{" "}
                      {personalInfo.totalSessions} successful sessions
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">👥</div>
                    <div className="activity-text">
                      <strong>Students:</strong> You are currently teaching{" "}
                      {personalInfo.activeStudents} active students
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === "announcements" && (
          <div className="tab-content">
            <div className="section-header">
              <div>
                <h2>Announcements</h2>
                <p>View school-wide and subject-specific announcements</p>
              </div>
            </div>

            <div className="announcements-list">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`announcement-card card ${
                      announcement.priority === "urgent"
                        ? "urgent-announcement"
                        : announcement.priority === "high"
                        ? "high-priority-announcement"
                        : ""
                    }`}
                  >
                    <div className="announcement-header">
                      <div className="announcement-meta">
                        <h4 style={{ color: "white", margin: 0 }}>
                          {announcement.title}
                        </h4>
                        <div
                          style={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: "0.9rem",
                            marginTop: "0.25rem",
                          }}
                        >
                          <span>By: {announcement.author?.full_name}</span>
                          {announcement.subjects?.name && (
                            <>
                              <span style={{ margin: "0 0.5rem" }}>•</span>
                              <span>Subject: {announcement.subjects.name}</span>
                            </>
                          )}
                          <span style={{ margin: "0 0.5rem" }}>•</span>
                          <span>
                            {new Date(
                              announcement.created_at
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="announcement-actions">
                        <div
                          className={`priority-badge priority-${announcement.priority}`}
                        >
                          {announcement.priority === "urgent" && "🚨 Urgent"}
                          {announcement.priority === "high" && "❗ High"}
                          {announcement.priority === "normal" && "📋 Normal"}
                          {announcement.priority === "low" && "📝 Low"}
                        </div>
                        <div
                          className={`audience-badge audience-${announcement.target_audience}`}
                        >
                          {announcement.target_audience === "all" && "🌍 All"}
                          {announcement.target_audience === "teachers" &&
                            "👨‍🏫 Teachers"}
                          {announcement.target_audience === "students" &&
                            "👨‍🎓 Students"}
                          {announcement.target_audience ===
                            "subject_students" && "📚 Subject"}
                        </div>
                      </div>
                    </div>

                    <div className="announcement-content">
                      <p
                        style={{
                          color: "rgba(255,255,255,0.9)",
                          lineHeight: "1.6",
                          margin: "1rem 0 0 0",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {announcement.content}
                      </p>
                      {announcement.expires_at && (
                        <div
                          style={{
                            color: "rgba(255, 193, 7, 0.8)",
                            fontSize: "0.9rem",
                            marginTop: "1rem",
                            fontStyle: "italic",
                          }}
                        >
                          Expires:{" "}
                          {new Date(announcement.expires_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="message message-info">
                  <h3>📢 No Announcements</h3>
                  <p>There are no announcements available at this time.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Suspension Modal */}
      <SuspensionNotificationModal
        isVisible={showSuspensionModal}
        suspensionInfo={suspensionInfo}
        onLogout={handleLogout}
      />
    </div>
  );
}

// Simple inline SubmissionGrader component
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
