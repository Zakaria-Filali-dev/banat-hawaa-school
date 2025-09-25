import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import FileUpload from "../../components/FileUpload";
import FilePreview from "../../components/FilePreview";
import SuspensionNotificationModal from "../../components/SuspensionNotificationModal";
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
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    announcements: 0,
    assignments: 0,
  });
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGradeDetails, setShowGradeDetails] = useState(false);
  const [selectedGradedSubmission, setSelectedGradedSubmission] =
    useState(null);
  const [personalInfo, setPersonalInfo] = useState({
    profile: null,
    subjects: [],
    totalSubmissions: 0,
    totalAssignments: 0,
    averageGrade: null,
    joinDate: null,
  });
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [suspensionInfo, setSuspensionInfo] = useState(null);
  const [notifications, setNotifications] = useState([]); // For showing success/error messages
  const submissionFormRef = useRef(null);
  const navigate = useNavigate();

  // Message utility functions
  const showMessage = (text, type = "info", duration = 5000) => {
    const id = Date.now();
    const newMessage = { id, text, type, timestamp: Date.now() };
    setNotifications((prev) => [...prev, newMessage]);

    // Auto remove after duration
    setTimeout(() => {
      setNotifications((prev) => prev.filter((msg) => msg.id !== id));
    }, duration);

    // Smooth scroll to show message
    if (type === "error") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const showSuccess = (text) => {
    showMessage(text, "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const showError = (text) => {
    showMessage(text, "error");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const showWarning = (text) => {
    showMessage(text, "warning");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Render notifications in message container
  useEffect(() => {
    const container = document.getElementById("message-container");
    if (!container) return;

    container.innerHTML = "";

    notifications.forEach((notification) => {
      const messageDiv = document.createElement("div");
      messageDiv.className = `message ${notification.type}`;
      messageDiv.textContent = notification.text;
      messageDiv.style.animation = "messageSlideIn 0.3s ease-out forwards";
      container.appendChild(messageDiv);
    });
  }, [notifications]);

  useEffect(() => {
    (async () => {
      try {
        const { data: userData, error: userErr } =
          await supabase.auth.getUser();
        if (userErr || !userData?.user) {
          navigate("/login");
          return;
        }

        const { data: profile, error: pErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("email", userData.user.email)
          .single();

        if (pErr || profile?.role !== "student") {
          navigate("/login");
          return;
        }

        setUser(userData.user);
        await fetchStudentData(userData.user.id);
      } catch (e) {
        console.error("[Student] auth/profile error:", e);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markMessagesAsRead = useCallback(async () => {
    try {
      if (!user?.id) return;

      // Get unread messages
      const unreadMessages = messages.filter((m) => !m.is_read);

      if (unreadMessages.length === 0) return;

      // Mark all unread messages as read
      const { error } = await supabase
        .from("admin_messages")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error marking messages as read:", error);
        return;
      }

      // Update local state
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          !msg.is_read
            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
            : msg
        )
      );

      // Update unread count
      setUnreadCounts((prev) => ({
        ...prev,
        messages: 0,
      }));
    } catch (error) {
      console.error("Error in markMessagesAsRead:", error);
    }
  }, [user?.id, messages]);

  // Auto-mark messages as read when messages tab becomes active
  useEffect(() => {
    if (activeTab === "messages" && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [activeTab, messages.length, markMessagesAsRead]);

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
  }, [user?.id]);

  const fetchStudentData = async (userId) => {
    try {
      // CRITICAL FIX: First get student's enrolled subjects
      const { data: enrolledSubjects, error: enrollError } = await supabase
        .from("student_subjects")
        .select("subject_id")
        .eq("student_id", userId)
        .eq("status", "active");

      if (enrollError)
        console.error("[Student] enrollment error:", enrollError);

      const subjectIds = enrolledSubjects?.map((s) => s.subject_id) || [];
      console.log("[Student] enrolled subject IDs:", subjectIds);

      // If student has no enrolled subjects, show empty data
      if (subjectIds.length === 0) {
        console.log("[Student] No enrolled subjects, showing empty data");
        setAssignments([]);
        setSubmissions([]);
        setAnnouncements([]);
        setSchedule([]);
        return;
      }

      // FIXED: Only fetch assignments for student's enrolled subjects
      const { data: assignmentsData, error: aErr } = await supabase
        .from("assignments")
        .select(
          `
          *,
          subjects(name),
          teacher:profiles!assignments_teacher_id_fkey(full_name)
        `
        )
        .in("subject_id", subjectIds)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (aErr) console.error("[Student] assignments error:", aErr);

      const { data: submissionsData, error: sErr } = await supabase
        .from("assignment_submissions")
        .select(
          `
          *,
          assignments(title, max_score, subjects(name))
        `
        )
        .eq("student_id", userId)
        .order("submitted_at", { ascending: false });
      if (sErr) console.error("[Student] submissions error:", sErr);

      // FIXED: Filter announcements for student's subjects OR general announcements
      const { data: announcementsData, error: anErr } = await supabase
        .from("announcements")
        .select(
          `
          *,
          author:profiles!announcements_author_id_fkey(full_name),
          subjects(name)
        `
        )
        .or(
          `target_audience.eq.all,target_audience.eq.students,and(target_audience.eq.subject_students,subject_id.in.(${subjectIds.join(
            ","
          )}))`
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (anErr) console.error("[Student] announcements error:", anErr);

      const today = new Date().toISOString().split("T")[0];
      // FIXED: Only fetch class sessions for student's enrolled subjects
      const { data: scheduleData, error: cErr } = await supabase
        .from("class_sessions")
        .select(
          `
          *,
          subjects(name),
          teacher:profiles!class_sessions_teacher_id_fkey(full_name)
        `
        )
        .in("subject_id", subjectIds)
        .eq("approval_status", "approved")
        .gte("session_date", today)
        .order("session_date", { ascending: true });
      if (cErr) console.error("[Student] class_sessions error:", cErr);

      const { data: messagesData, error: mErr } = await supabase
        .from("admin_messages")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false });
      if (mErr) console.error("[Student] messages error:", mErr);

      console.debug("[Student] counts:", {
        assignments: assignmentsData?.length || 0,
        submissions: submissionsData?.length || 0,
        announcements: announcementsData?.length || 0,
        schedule: scheduleData?.length || 0,
        messages: messagesData?.length || 0,
      });

      setAssignments(assignmentsData || []);
      setSubmissions(submissionsData || []);
      setAnnouncements(announcementsData || []);
      setSchedule(scheduleData || []);
      setMessages(messagesData || []);

      // Calculate unread counts
      const unreadMessages =
        messagesData?.filter((m) => !m.is_read).length || 0;
      const newAssignments =
        assignmentsData?.filter((a) => {
          const hasSubmission = submissionsData?.some(
            (s) => s.assignment_id === a.id
          );
          return !hasSubmission;
        }).length || 0;

      // Count new graded submissions that haven't been viewed
      const newGradedSubmissions =
        submissionsData?.filter(
          (s) => s.score != null && s.graded_at != null && !s.grade_viewed_at
        ).length || 0;

      setUnreadCounts({
        messages: unreadMessages,
        announcements: 0, // Could implement read tracking for announcements
        assignments: newAssignments,
        gradedSubmissions: newGradedSubmissions,
      });

      // Fetch personal info
      await fetchPersonalInfo(userId);
    } catch (err) {
      console.error("[Student] data load error:", err);
    }
  };

  const fetchPersonalInfo = async (userId) => {
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

      // Fetch student subjects
      const { data: studentSubjectsData, error: subjectsError } = await supabase
        .from("student_subjects")
        .select(
          `
          subject:subjects(
            id, 
            name
          )
        `
        )
        .eq("student_id", userId);

      console.log("Student subjects data:", studentSubjectsData);
      console.log("Student subjects error:", subjectsError);

      // Get subjects array from the data
      const subjects =
        studentSubjectsData?.map((ss) => ss.subject).filter(Boolean) || [];
      console.log("Processed student subjects:", subjects);

      // Count total submissions
      const { count: submissionCount } = await supabase
        .from("assignment_submissions")
        .select("*", { count: "exact", head: true })
        .eq("student_id", userId);

      // Count total assignments available for student's enrolled subjects
      const subjectIds = subjects.map((s) => s.id);
      const { count: assignmentCount } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true })
        .in("subject_id", subjectIds)
        .eq("is_published", true);

      // Calculate average grade
      const { data: gradedSubmissions } = await supabase
        .from("assignment_submissions")
        .select("score")
        .eq("student_id", userId)
        .not("score", "is", null);

      let averageGrade = null;
      if (gradedSubmissions && gradedSubmissions.length > 0) {
        const totalGrade = gradedSubmissions.reduce(
          (sum, sub) => sum + (sub.score || 0),
          0
        );
        averageGrade =
          Math.round((totalGrade / gradedSubmissions.length) * 10) / 10;
      }

      setPersonalInfo({
        profile,
        subjects: subjects,
        totalSubmissions: submissionCount || 0,
        totalAssignments: assignmentCount || 0,
        averageGrade,
        joinDate: profile?.created_at,
      });
    } catch (error) {
      console.error("Error fetching personal info:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleStartSubmission = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionFiles([]);
    setSubmissionText("");
    setShowSubmissionForm(true);

    // Smooth scroll to submission form after a brief delay to ensure it's rendered
    setTimeout(() => {
      if (submissionFormRef.current) {
        submissionFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    }, 100);
  };

  const handleCancelSubmission = () => {
    setSelectedAssignment(null);
    setSubmissionFiles([]);
    setSubmissionText("");
    setShowSubmissionForm(false);
  };

  const handleFileRemove = (fileToRemove) => {
    setSubmissionFiles((prev) =>
      prev.filter((file) => file.name !== fileToRemove.name)
    );
  };

  const handleSubmitAssignment = async () => {
    if (
      !selectedAssignment ||
      (!submissionFiles.length && !submissionText.trim())
    ) {
      showWarning("Please provide either files or text for your submission.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create submission record
      const { data: submission, error: submitError } = await supabase
        .from("assignment_submissions")
        .insert({
          assignment_id: selectedAssignment.id,
          student_id: user.id,
          submission_text: submissionText.trim(),
          submitted_at: new Date().toISOString(),
          status: "submitted",
        })
        .select()
        .single();

      if (submitError) {
        console.error("Submission error:", submitError);
        showError("Failed to submit assignment. Please try again.");
        return;
      }

      // Upload files if any - files are already uploaded by FileUpload component
      if (submissionFiles.length > 0) {
        const submissionFileRecords = submissionFiles.map((file) => ({
          submission_id: submission.id,
          file_name: file.name,
          file_url: file.url,
          file_type: file.type,
          file_size: file.size,
          caption: null, // Optional caption field
        }));

        const { error: filesError } = await supabase
          .from("submission_files")
          .insert(submissionFileRecords);

        if (filesError) {
          console.error("File records error:", filesError);
          showError(
            "Files uploaded but failed to save file records. Please contact support."
          );
        }
      }

      // Refresh data
      await fetchStudentData(user.id);
      setShowSubmissionForm(false);
      showSuccess("Assignment submitted successfully!");
    } catch (err) {
      console.error("Submit assignment error:", err);
      showError("Failed to submit assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasSubmittedAssignment = (assignmentId) => {
    return submissions.some((s) => s.assignment_id === assignmentId);
  };

  const handleViewGradeDetails = async (assignment) => {
    const submission = submissions.find(
      (s) => s.assignment_id === assignment.id
    );
    if (submission && (submission.score || submission.feedback)) {
      setSelectedGradedSubmission({ ...submission, assignment });
      setShowGradeDetails(true);

      // Mark grade as viewed if it hasn't been viewed yet
      if (submission.score != null && !submission.grade_viewed_at) {
        try {
          const { error } = await supabase
            .from("assignment_submissions")
            .update({ grade_viewed_at: new Date().toISOString() })
            .eq("id", submission.id);

          if (!error) {
            // Update local state to reflect the change
            setSubmissions((prev) =>
              prev.map((s) =>
                s.id === submission.id
                  ? { ...s, grade_viewed_at: new Date().toISOString() }
                  : s
              )
            );

            // Update unread counts
            setUnreadCounts((prev) => ({
              ...prev,
              gradedSubmissions: Math.max(0, prev.gradedSubmissions - 1),
            }));
          }
        } catch (error) {
          console.error("Error marking grade as viewed:", error);
        }
      }

      // Smooth scroll to top of page to show modal
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return String(dateString);
    return d.toLocaleString();
  };

  if (loading)
    return <div className="loading">Loading student dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="student-container">
      {/* Message Container */}
      <div className="message-container">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`message-${notification.type}`}
            onClick={() =>
              setNotifications((prev) =>
                prev.filter((msg) => msg.id !== notification.id)
              )
            }
          >
            <p>{notification.text}</p>
          </div>
        ))}
      </div>

      {showGradeDetails && selectedGradedSubmission && (
        <div className="grade-details-overlay">
          <div className="grade-details-modal">
            <div className="modal-header">
              <h2>📝 Grade Details</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowGradeDetails(false);
                  setSelectedGradedSubmission(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="assignment-info">
                <h3>{selectedGradedSubmission.assignment?.title}</h3>
                <p className="submission-date">
                  Submitted: {formatDate(selectedGradedSubmission.submitted_at)}
                </p>
                {selectedGradedSubmission.graded_at && (
                  <p className="graded-date">
                    Graded: {formatDate(selectedGradedSubmission.graded_at)}
                  </p>
                )}
              </div>

              {selectedGradedSubmission.score != null && (
                <div className="grade-section">
                  <h4>🎯 Your Score</h4>
                  <div className="grade-display">
                    <div className="grade-score">
                      <span className="score-number">
                        {selectedGradedSubmission.score}
                      </span>
                      {selectedGradedSubmission.assignments?.points && (
                        <span className="score-total">
                          / {selectedGradedSubmission.assignments.points}
                        </span>
                      )}
                    </div>
                    {selectedGradedSubmission.assignments?.points && (
                      <div className="grade-percentage">
                        {Math.round(
                          (selectedGradedSubmission.score /
                            selectedGradedSubmission.assignments.points) *
                            100
                        )}
                        %
                      </div>
                    )}
                    <div className="grade-status">
                      {(() => {
                        if (!selectedGradedSubmission.assignments?.points)
                          return "Graded";
                        const percentage =
                          (selectedGradedSubmission.score /
                            selectedGradedSubmission.assignments.points) *
                          100;
                        if (percentage >= 90) return "🌟 Excellent!";
                        if (percentage >= 80) return "🎉 Great job!";
                        if (percentage >= 70) return "👍 Good work!";
                        if (percentage >= 60) return "📚 Keep studying!";
                        return "💪 Room for improvement";
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {selectedGradedSubmission.feedback && (
                <div className="feedback-section">
                  <h4>💬 Teacher Feedback</h4>
                  <div className="feedback-content">
                    {selectedGradedSubmission.feedback}
                  </div>
                </div>
              )}

              {selectedGradedSubmission.graded_solution_urls &&
                selectedGradedSubmission.graded_solution_urls.length > 0 && (
                  <div className="graded-solution-section">
                    <h4>📄 Graded Solution Files</h4>
                    <div className="solution-files">
                      {selectedGradedSubmission.graded_solution_urls.map(
                        (url, index) => (
                          <div key={index} className="solution-file">
                            <FilePreview url={url} />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              <div className="original-submission-section">
                <h4>📤 Your Original Submission</h4>
                {selectedGradedSubmission.submission_text && (
                  <div className="submission-text">
                    <h5>Text Response:</h5>
                    <p>{selectedGradedSubmission.submission_text}</p>
                  </div>
                )}
                {selectedGradedSubmission.file_urls &&
                  selectedGradedSubmission.file_urls.length > 0 && (
                    <div className="submitted-files">
                      <h5>Submitted Files:</h5>
                      {selectedGradedSubmission.file_urls.map((url, index) => (
                        <div key={index} className="submitted-file">
                          <FilePreview url={url} />
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="student-header">
        <h1>📚 dashboard</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

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

      <div className="dashboard-tabs">
        <button
          className={activeTab === "dashboard" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={activeTab === "assignments" ? "tab-btn active" : "tab-btn"}
          onClick={() => {
            setActiveTab("assignments");
            // Mark assignments as viewed to clear new assignment notifications
            setUnreadCounts((prev) => ({ ...prev, assignments: 0 }));
          }}
        >
          📝 Assignments ({assignments?.length || 0})
          {unreadCounts.assignments > 0 && (
            <span className="notification-badge">
              {unreadCounts.assignments}
            </span>
          )}
          {unreadCounts.gradedSubmissions > 0 && (
            <span className="notification-badge graded-badge">
              {unreadCounts.gradedSubmissions}
            </span>
          )}
        </button>
        <button
          className={
            activeTab === "announcements" ? "tab-btn active" : "tab-btn"
          }
          onClick={() => setActiveTab("announcements")}
        >
          📢 Announcements ({announcements?.length || 0})
        </button>
        <button
          className={activeTab === "schedule" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("schedule")}
        >
          📅 Schedule ({schedule?.length || 0})
        </button>
        <button
          className={activeTab === "messages" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("messages")}
        >
          📧 Messages
          {unreadCounts.messages > 0 && (
            <span className="notification-badge">{unreadCounts.messages}</span>
          )}
          <span className="total-count">({messages?.length || 0})</span>
        </button>
        <button
          className={activeTab === "profile" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("profile")}
        >
          👤 Personal Info
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "dashboard" && (
          <div className="card">
            <h3>Welcome Back!</h3>
            <p>Here's an overview of your academic activities.</p>
            <div style={{ marginTop: "1rem" }}>
              <h4>Recent Assignments</h4>
              <div className="activity-list">
                {assignments?.slice(0, 3).map((a) => (
                  <div key={a.id} className="activity-item">
                    <span>📝</span>
                    <div>
                      <strong>{a.title}</strong>
                      {a.due_date && (
                        <div>
                          <small>Due: {formatDate(a.due_date)}</small>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {assignments?.length === 0 && (
                  <div className="muted">No assignments available.</div>
                )}
              </div>
            </div>

            {announcements?.length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <h4>Latest Announcements</h4>
                <div className="activity-list">
                  {announcements.slice(0, 2).map((an) => (
                    <div key={an.id} className="activity-item">
                      <span>📢</span>
                      <div>
                        <strong>{an.title}</strong>
                        <div>
                          <small>{formatDate(an.created_at)}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="assignments-section">
            {assignments?.length === 0 && (
              <div className="card">
                <p>No assignments posted yet.</p>
              </div>
            )}
            {assignments?.map((assignment) => {
              const hasSubmitted = hasSubmittedAssignment(assignment.id);
              return (
                <div key={assignment.id} className="assignment-card">
                  <div className="card-header">
                    <h4 className="card-title">{assignment.title}</h4>
                    <div className="assignment-badges">
                      {assignment.due_date && (
                        <span className="badge due-date">
                          Due: {formatDate(assignment.due_date)}
                        </span>
                      )}
                      {hasSubmitted ? (
                        <span className="badge ok">Submitted</span>
                      ) : (
                        <span className="badge warn">Not Submitted</span>
                      )}
                    </div>
                  </div>

                  <div className="card-content">
                    {assignment.description && (
                      <p className="assignment-description">
                        {assignment.description}
                      </p>
                    )}

                    {assignment.attachment_urls &&
                      assignment.attachment_urls.length > 0 && (
                        <div className="assignment-attachments">
                          <h5>📎 Assignment Files:</h5>
                          <div className="attachment-list">
                            {assignment.attachment_urls.map((url, index) => (
                              <div key={index} className="attachment-item">
                                <FilePreview url={url} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="card-footer">
                    <div className="assignment-meta">
                      <small>
                        Created: {formatDate(assignment.created_at)}
                      </small>
                      {assignment.max_score && (
                        <small>Points: {assignment.max_score}</small>
                      )}
                    </div>

                    {!hasSubmitted && (
                      <button
                        className="btn btn-primary submit-btn"
                        onClick={() => handleStartSubmission(assignment)}
                      >
                        📤 Submit Assignment
                      </button>
                    )}

                    {hasSubmitted && (
                      <div className="submission-status">
                        <span className="submitted-text">✅ Submitted</span>
                        {(() => {
                          const submission = submissions.find(
                            (s) => s.assignment_id === assignment.id
                          );
                          const isNewGrade =
                            submission?.score != null &&
                            submission?.graded_at != null &&
                            !submission?.grade_viewed_at;
                          return (
                            <>
                              {submission?.score && (
                                <span className="grade">
                                  Grade: {submission.score}
                                  {submission.assignments?.points && (
                                    <span className="max-points">
                                      /{submission.assignments.points}
                                    </span>
                                  )}
                                  {isNewGrade && (
                                    <span className="new-grade-indicator">
                                      NEW!
                                    </span>
                                  )}
                                </span>
                              )}
                              {(submission?.score || submission?.feedback) && (
                                <button
                                  className={`btn btn-secondary btn-sm ${
                                    isNewGrade ? "new-grade-btn" : ""
                                  }`}
                                  onClick={() =>
                                    handleViewGradeDetails(assignment)
                                  }
                                  style={{ marginLeft: "0.5rem" }}
                                >
                                  📝 View Grade Details
                                  {isNewGrade && (
                                    <span className="btn-badge">!</span>
                                  )}
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "announcements" && (
          <div className="list">
            {announcements?.length === 0 && (
              <div className="card">
                <p>No announcements yet.</p>
              </div>
            )}
            {announcements?.map((an) => (
              <div key={an.id} className="card">
                <div className="card-header">
                  <h4 className="card-title">{an.title}</h4>
                  {an.priority && (
                    <span className="badge {an.priority}">{an.priority}</span>
                  )}
                </div>
                {an.content && <div className="card-content">{an.content}</div>}
                <div className="card-footer">
                  <small>{formatDate(an.created_at)}</small>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="list">
            {schedule?.length === 0 && (
              <div className="card">
                <p>No upcoming classes.</p>
              </div>
            )}
            {schedule?.map((s) => (
              <div key={s.id} className="card">
                <div className="card-header">
                  <h4 className="card-title">{s.title || "Class Session"}</h4>
                  <span className="badge ok">Approved</span>
                </div>
                <div className="card-content">
                  {s.session_date && (
                    <div>Date: {formatDate(s.session_date)}</div>
                  )}
                  {s.start_time && s.end_time && (
                    <div>
                      Time: {formatDate(s.start_time)} -{" "}
                      {formatDate(s.end_time)}
                    </div>
                  )}
                  {s.description && (
                    <div style={{ marginTop: 8 }}>{s.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "messages" && (
          <div className="list">
            {messages?.length === 0 && (
              <div className="card">
                <p>No messages to display.</p>
              </div>
            )}
            {messages?.map((m) => (
              <div key={m.id} className="card">
                <div className="card-header">
                  <h4 className="card-title">{m.subject || "Message"}</h4>
                  <span className={m.is_read ? "badge" : "badge warn"}>
                    {m.is_read ? "Read" : "Unread"}
                  </span>
                </div>
                {m.content && <div className="card-content">{m.content}</div>}
                <div className="card-footer">
                  <small>{formatDate(m.created_at)}</small>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="personal-info-section">
            <div className="personal-info-grid">
              {/* Student Profile Card */}
              <div className="profile-card card">
                <div className="card-header">
                  <h3>👤 Student Profile</h3>
                </div>
                <div className="card-content profile-content">
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
                    <span className="profile-label">🎓 Role:</span>
                    <span className="profile-value">Student</span>
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

              {/* Academic Statistics */}
              <div className="stats-card card">
                <div className="card-header">
                  <h3>📊 Academic Statistics</h3>
                </div>
                <div className="card-content stats-grid">
                  <div className="stat-item">
                    <div className="stat-number">
                      {personalInfo.subjects.length}
                    </div>
                    <div className="stat-label">📚 Enrolled Subjects</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">
                      {personalInfo.totalSubmissions}
                    </div>
                    <div className="stat-label">📝 Assignments Submitted</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">
                      {personalInfo.totalAssignments}
                    </div>
                    <div className="stat-label">📋 Total Assignments</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">
                      {personalInfo.averageGrade !== null
                        ? `${personalInfo.averageGrade}%`
                        : "N/A"}
                    </div>
                    <div className="stat-label">⭐ Average Grade</div>
                  </div>
                </div>
              </div>

              {/* Enrolled Subjects */}
              <div className="subjects-card card">
                <div className="card-header">
                  <h3>📚 Enrolled Subjects</h3>
                </div>
                <div className="card-content subjects-list">
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
                    <div className="message">
                      <p>🔍 No subjects enrolled yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Academic Progress */}
              <div className="progress-card card">
                <div className="card-header">
                  <h3>📈 Academic Progress</h3>
                </div>
                <div className="card-content progress-content">
                  <div className="progress-item">
                    <div className="progress-icon">📝</div>
                    <div className="progress-text">
                      <strong>Submission Rate:</strong>{" "}
                      {personalInfo.totalAssignments > 0
                        ? `${Math.round(
                            (personalInfo.totalSubmissions /
                              personalInfo.totalAssignments) *
                              100
                          )}%`
                        : "0%"}{" "}
                      ({personalInfo.totalSubmissions}/
                      {personalInfo.totalAssignments})
                    </div>
                  </div>
                  <div className="progress-item">
                    <div className="progress-icon">⭐</div>
                    <div className="progress-text">
                      <strong>Grade Performance:</strong>{" "}
                      {personalInfo.averageGrade !== null
                        ? `${personalInfo.averageGrade}% average`
                        : "No grades yet"}
                    </div>
                  </div>
                  <div className="progress-item">
                    <div className="progress-icon">🎯</div>
                    <div className="progress-text">
                      <strong>Active Enrollment:</strong>{" "}
                      {personalInfo.subjects.length} subject
                      {personalInfo.subjects.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Submission Form */}
      {showSubmissionForm && selectedAssignment && (
        <div className="assignment-submission-form" ref={submissionFormRef}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                Submit Assignment: {selectedAssignment.title}
              </h3>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitAssignment();
              }}
            >
              <div className="assignment-details">
                <h4>Assignment Details</h4>
                <p>
                  <strong>Subject:</strong> {selectedAssignment.subjects?.name}
                </p>
                <p>
                  <strong>Description:</strong> {selectedAssignment.description}
                </p>
                {selectedAssignment.due_date && (
                  <p>
                    <strong>Due Date:</strong>{" "}
                    {new Date(selectedAssignment.due_date).toLocaleDateString()}
                  </p>
                )}
                {selectedAssignment.instructions && (
                  <div>
                    <strong>Instructions:</strong>
                    <p
                      style={{
                        marginTop: "0.5rem",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      {selectedAssignment.instructions}
                    </p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label
                  htmlFor="submission-text"
                  style={{
                    color: "white",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Submission Text (Optional):
                </label>
                <textarea
                  id="submission-text"
                  className="form-input"
                  placeholder="Enter your submission text here..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  rows={6}
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
                  Attach Files (Optional):
                </label>
                <FileUpload
                  onFileUpload={setSubmissionFiles}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  maxFiles={5}
                  maxSize={10 * 1024 * 1024} // 10MB
                  bucket="submissions"
                  folder={`student-${user?.id}`}
                  label="Upload Submission Files"
                />
                {submissionFiles.length > 0 && (
                  <div className="selected-files">
                    <h5>Selected Files:</h5>
                    {submissionFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <div className="file-info">
                          <span>{file.name}</span>
                          <span className="file-size">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          className="file-remove-btn"
                          onClick={() => handleFileRemove(file)}
                          title="Remove file"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="action-buttons">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    isSubmitting ||
                    (!submissionFiles.length && !submissionText.trim())
                  }
                >
                  {isSubmitting ? "Submitting..." : "Submit Assignment"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelSubmission}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspension Modal */}
      <SuspensionNotificationModal
        isVisible={showSuspensionModal}
        suspensionInfo={suspensionInfo}
        onLogout={handleLogout}
      />

      {/* Message Container */}
      <div id="message-container" className="message-container"></div>
    </div>
  );
}
